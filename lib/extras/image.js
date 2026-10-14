var crypto = require('crypto');
var sizeOf = require('image-size').imageSize;
var xml = require('./xml');

var DATA_URI = /^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;
var MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
var DOWNLOAD_TIMEOUT_MS = 10000;
var EMU_PER_POINT = 12700;
var EMU_PER_PIXEL = 9525;

var EXTENSION_BY_CONTENT_TYPE = {
  'image/png'     : 'png',
  'image/gif'     : 'gif',
  'image/bmp'     : 'bmp',
  'image/webp'    : 'webp',
  'image/svg+xml' : 'svg',
  'image/tiff'    : 'tiff'
};

var CONTENT_TYPE_BY_DETECTED_TYPE = {
  png  : 'image/png',
  jpg  : 'image/jpeg',
  gif  : 'image/gif',
  bmp  : 'image/bmp',
  webp : 'image/webp',
  svg  : 'image/svg+xml',
  tiff : 'image/tiff'
};

function extensionOf (contentType) {
  return EXTENSION_BY_CONTENT_TYPE[contentType.toLowerCase()] || 'jpg';
}

function hash (text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Add a picture to word/media once per content and return its relationship id.
 * `pictures` remembers the pictures already added during this render.
 */
function addPicture (report, pictures, key, data, contentType) {
  if (pictures[key] !== undefined) {
    return pictures[key];
  }
  var _extension = extensionOf(contentType);
  var _target = 'media/carbone-' + key.slice(0, 32) + '.' + _extension;
  report.files.push({ name : 'word/' + _target, isMarked : false, data : data, parent : '' });
  xml.ensureContentType(report, _extension, contentType);
  pictures[key] = xml.addImageRelationship(report, _target);
  return pictures[key];
}

/**
 * Called by the `imageSize` formatter: remember the picture and return its key, or null when the
 * value is not a picture. URLs are accepted only with the render option `imageUrls`.
 */
function register (context, value) {
  var _state = context !== undefined && context !== null ? context.extras : undefined;
  if (_state === undefined || value === null || value === undefined) {
    return null;
  }
  var _text = String(value).trim();
  var _dataUri = DATA_URI.exec(_text);
  var _key;
  if (_dataUri !== null) {
    _key = hash(_dataUri[2]);
    if (_state.images[_key] === undefined) {
      _state.images[_key] = { data : Buffer.from(_dataUri[2], 'base64') };
    }
    return _key;
  }
  if (context.imageUrls === true && /^https?:\/\/\S+$/i.test(_text) === true) {
    _key = hash(_text);
    if (_state.images[_key] === undefined) {
      _state.images[_key] = { url : _text };
    }
    return _key;
  }
  return null;
}

function download (image) {
  if (typeof fetch !== 'function') {
    return Promise.reject(new Error('imageUrls needs a Node.js version with fetch (18 or newer)'));
  }
  return fetch(image.url, { signal : AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) }).then(function (response) {
    if (response.ok === false) {
      throw new Error('Cannot download picture ' + image.url + ': HTTP ' + response.status);
    }
    var _length = parseInt(response.headers.get('content-length'), 10);
    if (_length > MAX_DOWNLOAD_BYTES) {
      throw new Error('Picture ' + image.url + ' is larger than ' + MAX_DOWNLOAD_BYTES + ' bytes');
    }
    return response.arrayBuffer();
  }).then(function (arrayBuffer) {
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      throw new Error('Picture ' + image.url + ' is larger than ' + MAX_DOWNLOAD_BYTES + ' bytes');
    }
    image.data = Buffer.from(arrayBuffer);
  }, function (err) {
    if (err instanceof Error && err.message.startsWith('Cannot download') === false && err.message.startsWith('Picture ') === false) {
      throw new Error('Cannot download picture ' + image.url + ': ' + err.message);
    }
    throw err;
  });
}

/**
 * Size of the picture in EMU. `size` comes from the formatter: '' keeps the size of the picture,
 * 'width' keeps its proportions, 'width*height' sets both. Width and height are in points.
 */
function extent (dimensions, size) {
  var _parts = size.split('*');
  var _width = parseFloat(_parts[0]);
  var _height = parseFloat(_parts[1]);
  if (Number.isFinite(_width) === true && _width > 0) {
    if (Number.isFinite(_height) === false || _height <= 0) {
      _height = _width * dimensions.height / dimensions.width;
    }
    return { cx : Math.round(_width * EMU_PER_POINT), cy : Math.round(_height * EMU_PER_POINT) };
  }
  return { cx : dimensions.width * EMU_PER_PIXEL, cy : dimensions.height * EMU_PER_PIXEL };
}

function drawingXml (relationshipId, size, id) {
  return '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
    + '<wp:extent cx="' + size.cx + '" cy="' + size.cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
    + '<wp:docPr id="' + id + '" name="Picture ' + id + '"/>'
    + '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
    + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:nvPicPr><pic:cNvPr id="' + id + '" name="Picture ' + id + '"/><pic:cNvPicPr/></pic:nvPicPr>'
    + '<pic:blipFill><a:blip r:embed="' + relationshipId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + size.cx + '" cy="' + size.cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
    + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
}

/**
 * Replace the markers of the `imageSize` formatter with pictures. The marker is inside a <w:t>,
 * so the picture is placed between two texts of the same run.
 */
function insertInDocx (report, state, callback) {
  var _document = xml.findFile(report, 'word/document.xml');
  if (_document === null) {
    return callback(null);
  }
  var _downloads = Object.keys(state.images).filter(function (key) {
    return state.images[key].url !== undefined;
  }).map(function (key) {
    return download(state.images[key]);
  });
  Promise.all(_downloads).then(function () {
    var _documentXml = _document.data.toString();
    var _ids = (_documentXml.match(/<wp:docPr id="\d+"/g) || []).map(function (docPr) {
      return parseInt(docPr.slice(14), 10);
    });
    var _nextId = Math.max.apply(null, [0].concat(_ids)) + 1;
    var _pictures = {};
    var _markerRegExp = new RegExp(':imageSize' + state.marker + '\\(([0-9a-f]+),([^)]*)\\)', 'g');
    _document.data = _documentXml.replace(_markerRegExp, function (whole, key, size) {
      var _image = state.images[key];
      if (_image === undefined || _image.data === undefined) {
        return '';
      }
      var _dimensions;
      try {
        _dimensions = sizeOf(_image.data);
      }
      catch (e) {
        return '';
      }
      var _contentType = CONTENT_TYPE_BY_DETECTED_TYPE[_dimensions.type];
      if (_contentType === undefined || !_dimensions.width || !_dimensions.height) {
        return '';
      }
      var _relationshipId = addPicture(report, _pictures, key, _image.data, _contentType);
      if (_relationshipId === null) {
        return '';
      }
      return '</w:t>' + drawingXml(_relationshipId, extent(_dimensions, size), _nextId++) + '<w:t xml:space="preserve">';
    });
  }).then(function () {
    callback(null);
  }, function (err) {
    callback(err);
  });
}

/**
 * Pictures given as a data URI in the alternative text (title or description) of a picture of the
 * template: `descr="{d.photo}"`. Each different picture gets its own relationship, so a picture
 * repeated in a loop shows the picture of each row.
 */
function replaceAltTextPicturesInDocx (report) {
  var _document = xml.findFile(report, 'word/document.xml');
  if (_document === null) {
    return;
  }
  var _documentXml = _document.data.toString();
  if (_documentXml.indexOf('data:image/') === -1) {
    return;
  }
  var _pictures = {};
  // A loop copies the template's picture with its docPr id, and Word rejects a document whose
  // drawings share an id, so every repetition after the first gets an id no drawing uses yet.
  var _usedIds = {};
  var _nextId = Math.max.apply(null, [0].concat((_documentXml.match(/<wp:docPr id="\d+"/g) || []).map(function (docPr) {
    return parseInt(docPr.slice(14), 10);
  }))) + 1;
  _document.data = _documentXml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, function (drawing) {
    var _dataUri = /\s(?:descr|title)="data:(image\/[\w.+-]+);base64,([^"]+)"/.exec(drawing);
    if (_dataUri === null || /r:embed="[^"]*"/.test(drawing) === false) {
      return drawing;
    }
    var _relationshipId = addPicture(report, _pictures, hash(_dataUri[2]), Buffer.from(_dataUri[2], 'base64'), _dataUri[1]);
    if (_relationshipId === null) {
      return drawing;
    }
    return drawing
      .replace(/<wp:docPr id="(\d+)"/, function (whole, id) {
        if (_usedIds[id] === undefined) {
          _usedIds[id] = true;
          return whole;
        }
        return '<wp:docPr id="' + (_nextId++) + '"';
      })
      .replace(/r:embed="[^"]*"/, 'r:embed="' + _relationshipId + '"')
      .replace(/\s(descr|title)="data:image\/[^"]*"/g, ' $1=""');
  });
}

/**
 * Same as replaceAltTextPicturesInDocx for an OpenDocument text: the data URI is in <svg:title>.
 */
function replaceAltTextPicturesInOdt (report) {
  var _content = xml.findFile(report, 'content.xml');
  if (_content === null) {
    return;
  }
  var _contentXml = _content.data.toString();
  if (_contentXml.indexOf('data:image/') === -1) {
    return;
  }
  var _manifest = xml.findFile(report, 'META-INF/manifest.xml');
  var _added = {};
  _content.data = _contentXml.replace(/<draw:frame [\s\S]*?<\/draw:frame>/g, function (frame) {
    var _dataUri = /<svg:title>data:(image\/[\w.+-]+);base64,([^<]+)<\/svg:title>/.exec(frame);
    if (_dataUri === null) {
      return frame;
    }
    var _path = 'Pictures/carbone-' + hash(_dataUri[2]).slice(0, 32) + '.' + extensionOf(_dataUri[1]);
    if (_added[_path] === undefined) {
      _added[_path] = true;
      report.files.push({ name : _path, isMarked : false, data : Buffer.from(_dataUri[2], 'base64'), parent : '' });
      if (_manifest !== null) {
        _manifest.data = _manifest.data.toString().replace('</manifest:manifest>',
          '<manifest:file-entry manifest:full-path="' + _path + '" manifest:media-type="' + _dataUri[1] + '"/></manifest:manifest>');
      }
    }
    return frame
      .replace(/<svg:title>[\s\S]*?<\/svg:title>/, '<svg:title></svg:title>')
      .replace(/draw:mime-type="[^"]+"/, 'draw:mime-type="' + _dataUri[1] + '"')
      .replace(/xlink:href="[^"]+"/, 'xlink:href="' + _path + '"');
  });
}

module.exports = {
  register,
  insertInDocx,
  replaceAltTextPicturesInDocx,
  replaceAltTextPicturesInOdt
};
