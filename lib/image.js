const parser  = require('./parser');
const file    = require('./file');
const path    = require('path');
const request = require('request');
const fs      = require('fs');
var debug = require('debug')('carbone:image');

// var _regex = new RegExp('<wp:extent cx="([0-9]*?)" cy="([0-9]*?)" ?\\/>[\\s\\S]*?<a:blip r:embed="' + embedId + '"/?>');
// newPicXml = pictures[i].xml.replace(/<a:blip r:embed=".*?">/g, '<a:blip r:embed="' + relId + '">');

const image = {

  preProcessDocx : function (template) {
    var _imageMarker = null;
    const _regexDocxImage = /<w:drawing>(.*?)<\/w:drawing>/g;
    const _file = template.files.find(file => file.name.includes('document.xml'));
    if (_file) {
      // Find the images tags
      _file.data = _file.data.replace(_regexDocxImage, function (xmlImage) {
        _imageMarker = null;
        // Find the images properties, the marker can be on the attribute "descr", "title" or "name"
        xmlImage = xmlImage.replace(/<wp:docPr.*?id=".*?".*?><\/wp:docPr>/g, function (xmlImageProperties) {
          // Check if the image contains a Carbone Marker.
          xmlImageProperties = xmlImageProperties.replace(/\{([^{]+?)\}/g, function (m, marker) {
            if (parser.isCarboneMarker(marker) === true) {
              _imageMarker = marker;
              // Remove marker from descr, title and name attributes
              return '';
            }
            return m;
          });
          if (_imageMarker) {
            // SI c'est un marker on remplace l'ID par le markeur + un formatteur post processing
            // The id is an integer and specifies a unique identifier.
            xmlImageProperties = xmlImageProperties.replace(/id=".*?"/g, `id="{${_imageMarker}:generateImageDocxId()}"`);
          }
          return xmlImageProperties;
        });
        if (_imageMarker) {
          xmlImage = xmlImage.replace(/<pic:cNvPr.*?id=".*?".*?><\/pic:cNvPr>/g, function (xmlImageNonVisualProperties) {
            // Remove marker from descr, title and name attributes
            xmlImageNonVisualProperties = xmlImageNonVisualProperties.replace(/\{([^{]+?)\}/g, '');
            // Si c'est un marker on remplace l'ID par le markeur + un formatteur post processing
            xmlImageNonVisualProperties = xmlImageNonVisualProperties.replace(/id=".*?"/g, `id="{${_imageMarker}:generateImageDocxId()}"`);
            // console.log(xmlImageNonVisualProperties);
            return xmlImageNonVisualProperties;
          });
          xmlImage = xmlImage.replace(/<a:blip.*?r:embed=".*?">.*?<\/a:blip>/g, function (xmlImageReference) {
            return xmlImageReference.replace(/r:embed=".*?"/g, `r:embed="{${_imageMarker}:generateImageDocxReference()}"`);
          });
        }
        // Si c'est un marker il faut metter un marker au niveau de l'ID avec un formatteur
        return xmlImage;
      });
    }
  },
  /**
   * Pre-processing: Insert Image formatters on Libre Office Documents (ODT + ODS) before carbone processing
   *
   * @param  {Object} template
   */
  preProcessLo : function (template) {
    const _parsedFiles = ['content.xml', 'styles.xml'];

    // parse all files and find shared strings first
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      if (_parsedFiles.indexOf(_file.name) === -1) {
        continue;
      }
      if (typeof (_file.data) !== 'string') {
        continue;
      }
      let _picturesRegex = /<draw:image.*?>[\S\s]*?<svg:title>(.*?)<\/svg:title>/g;
      _file.data = _file.data.replace(_picturesRegex, function (xml, alternativeText) {
        let _newImageMarker = '';
        let _newImageMimeTypeMarker = '';
        // find first carbone marker occurence in alternative text field of an image. Other occurences are ignored
        let _newAlternativeText = alternativeText.replace(/(\{[^{]+?\})/, function (m, marker) {
          if (parser.isCarboneMarker(marker) === true) {
            _newImageMarker = marker.replace('}', ':generateOpenDocumentImageHref()}');
            _newImageMimeTypeMarker = marker.replace('}', ':generateOpenDocumentImageMimeType()}');
            return '';
          }
          return m;
        });
        if (_newImageMarker !== '') {
          return xml
            .replace(alternativeText, _newAlternativeText)
            .replace(/xlink:href=".*?"/, 'xlink:href="' + _newImageMarker + '"')
            .replace(/loext:mime-type=".*?"/, 'loext:mime-type="' + _newImageMimeTypeMarker + '"');
        }
        return xml;
      });
    }
    return template;
  },

  /**
   * Post-processing : update image links using options.imageDatabase on Libre Office templates (ODT + ODS)
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with imageDatabase
   * @return {Object}          template
   */
  postProcessLo : function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (options.imageDatabase === undefined || options.imageDatabase.size === 0) {
      return template;
    }
    image.updateLoImageLinks(template, options.imageDatabase);
    return template;
  },

  /**
   * Generate image link in ODT document
   *
   * @param  {Integer} id        unique id of the image
   * @param  {String} extension  file extension
   * @return {String}            link inserted in ODT document
   */
  buildLoImageLink : function (id, extension) {
    return 'Pictures/CarboneImage' + id + '.' + extension;
  },

  /**
   * Called during carbone builder process (for each XML file) to download image which are used in templates
   *
   * It download images and updates options.imageDatabase
   *
   * @param  {Mixed}    data
   * @param  {Object}   options
   * @param  {Function} callback callback(err);
   * @return {[type]}            [description]
   */
  fetchImageDatabase : function (data, options, callback) {
    // leave immediately if nothing has change
    if (options.imageDatabase === undefined || options.imageDatabase.previousSize === options.imageDatabase.size || options.imageDatabase.size === 0) {
      return callback(null);
    }
    options.imageDatabase.previousSize = options.imageDatabase.size;
    let _imageDatabaseIt = options.imageDatabase.entries();

    // download and get image info
    function walkImage () {
      let _imageItem = _imageDatabaseIt.next();
      // end processing image
      if (_imageItem.done === true) {
        return callback(null);
      }
      let _imageURLBase64  = _imageItem.value[0];
      let _imageInfo       = _imageItem.value[1];

      // Image already downloaded
      if (_imageInfo.data !== undefined) {
        return walkImage();
      }
      image.downloadImage (_imageURLBase64, data, (err, imageInfo) => {
        if (err) {
          debug(err);
          imageInfo = {
            data      : new Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQoJBwwKCQoNDAwOER0TERAQESMZGxUdKiUsKyklKCguNEI4LjE/MigoOk46P0RHSktKLTdRV1FIVkJJSkf/2wBDAQwNDREPESITEyJHMCgwR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wgARCABkAGQDAREAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAIDAQQH/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAA+qAAAAAAAAAAAAAAAAAAAAHAdAJAKAAMzEHTM1Mzp6wACCCiSDQg6bgAAwOFggsosAAHlOHSSCzc1AAAABibAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//EACoQAAICAgEDAwIHAQAAAAAAAAECAxEAEiEEEzEgIlEUUDAzNEFhcZFy/9oACAEBAAE/APtLMqqWY0BikMoZTYPIPoDqWKhhY8jEdZFtGDDN1DhLGxFgeqckQOR5AwyyVCqFQXHPHGB5qmTYF0qjWJM0jxBDQK7NjTurCpVcbUVC8f7kX66X/kYs7r0pYBdi+o4oYocdagdwx0PIFeqRO5GyXVirzscxHb8sYkesrvd71xkUCx70b2P+D4wdIQoXusQptRnZI6gyB6B8jPph2TGXPnYH4OJAwlEjyFyBXrRwskxLO2vJB8D+s+rSx7Xo+DWJOrqxCsCnlSOcSdWcIUZSRY2FXjdWgulYhTRIHGPOqUArMzCwAOayKQSLa/NEH16PfU8H3D2/zxnbfXpvabQ84VkDzsikMa1ORI5njZlcAAgljfOOHi6aSNkb52/bHjbuI+rMCgB1NEZ06hYzSMlm6Y2fw26aNmLNsbN0WNfev//EABQRAQAAAAAAAAAAAAAAAAAAAHD/2gAIAQIBAT8AKf/EABQRAQAAAAAAAAAAAAAAAAAAAHD/2gAIAQMBAT8AKf/Z', 'base64'),
            extension : 'jpg',
            mimetype  : 'image/jpeg'
          };
        }
        imageInfo.id = _imageInfo.id; // keep id
        options.imageDatabase.set(_imageURLBase64, imageInfo);
        return walkImage();
      });
    }
    walkImage();
  },

  /**
   * Get pictures data
   *
   * @param  {String}   image HTTP link or base64
   * @param  {Mixed}    report data (Used only for the old DEPRECATED method to use base64 image)
   * @param  {Function} callback(err, {
   *                      data      : Buffer(),
   *                      mimetype  : 'image/jpeg',
   *                      extension : 'jpeg'
   *                    })
   */
  downloadImage : function (imageLinkOrBase64, data, callback) {
    if (!imageLinkOrBase64) {
      // is either null, undefined, 0, NaN, false, or an empty string
      return callback('Carbone error: the image URL or Base64 is undefined.');
    }
    if (imageLinkOrBase64.startsWith('http') === false) {
      // DEPRECATED image method
      if (data[imageLinkOrBase64] !== undefined) {
        let _mt = image.getMimeTypeFromExtensionImage(data[imageLinkOrBase64].extension);
        if (typeof _mt === 'undefined') {
          return callback('Carbone error: the base64 provided is not an image.');
        }
        if (typeof data[imageLinkOrBase64].data !== 'string' || data[imageLinkOrBase64].data.length === 0) {
          return callback('Carbone error: the base64 provided is empty.');
        }
        return callback(null, {
          data      : new Buffer.from(data[imageLinkOrBase64].data, 'base64'),
          extension : data[imageLinkOrBase64].extension,
          mimetype  : _mt
        });
      }
      return image.parseBase64Picture(imageLinkOrBase64, callback);
    }
    // Just call request with encoding set to null to get a Buffer
    request({ method : 'GET', uri : imageLinkOrBase64, encoding : null, timeout : 6000 }, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      if (res.statusCode !== 200) {
        return callback(`Error Carbone: can not download the image from the url ${imageLinkOrBase64}`);
      }
      // Get the extension from the file name by default and remove extra parameters
      // It's not recommanded to use Content-Disposition
      let _extension = path.extname(imageLinkOrBase64).slice(1).split(/#|\?|&/)[0];
      // If the mime type image retreived from the Content-Type is not valid, the file extension is used to get the correct mime type
      let _mimeType = res.headers['content-type'];
      if (typeof _mimeType !== 'string' || image.isMimeTypeImage(_mimeType) === false) {
        _mimeType = image.getMimeTypeFromExtensionImage(_extension);
      }
      // if the file extension doesn't match the mime type, the file extension is retreived from the mimetype
      if (image.isExtensionCorrespondingToMimeTypeImage(_extension, _mimeType) === false) {
        _extension = image.getExtensionFromMimeTypeImage(_mimeType);
      }
      if (_extension === undefined || _mimeType === undefined) {
        return callback(`Error Carbone: the file is not an image: ${imageLinkOrBase64}`);
      }
      return callback(null, {
        data      : body,
        mimetype  : _mimeType,
        extension : _extension
      });
    });
  },

  /**
   * Post-processing: Update image links in the template for Libre Office documents (ODT/ODS)
   *
   * @param  {Object} template
   * @param  {Map}    imageDatabase
   * @return {Object} template
   */
  updateLoImageLinks : function (template, imageDatabase) {
    if (imageDatabase.size === 0) {
      return template;
    }
    // find and update global manifest file with image links
    let _manifestFile = file.getTemplateFile(template, 'META-INF/manifest.xml');
    // console.log('Manifest:', _manifestFile);
    if (_manifestFile === null || typeof(_manifestFile.data) !== 'string' ) {
      debug('the `manifest.xml` file does not exist');
      return template;
    }
    let _imageLinks = [];
    let _imageDatabaseIt = imageDatabase.values();
    let _imageItem = _imageDatabaseIt.next();
    while (_imageItem.done === false) {
      let _image = _imageItem.value;
      let _imageLink = image.buildLoImageLink(_image.id, _image.extension);
      template.files.push({
        name   : _imageLink,
        parent : '',
        data   : _image.data
      });
      _imageLinks.push(`<manifest:file-entry manifest:full-path="${_imageLink}" manifest:media-type="${_image.mimetype}"/>`);
      _imageItem = _imageDatabaseIt.next();
    }
    _manifestFile.data = _manifestFile.data.replace('</manifest:manifest>', _imageLinks.join('') + '</manifest:manifest>');
    return template;
  },

  /**
   * Parse a data-uri scheme (base64 image)
   *
   * @description data-uri example: data:[<media type>][;charset=<character set>][;base64],<data>
   * @description Mime types list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
   *
   * @param {String} base64 base64 HTML format as a string
   * @returns {Object} The base64 parsed into an object
   * @param  {Function} callback(err, {
   *                      data      : Buffer(),
   *                      mimetype  : 'image/jpeg',
   *                      extension : 'jpeg'
   *                    })
   */
  parseBase64Picture : function (base64, callback) {
    let _picBase64data = '';
    let _picMimeType = '';
    let _picExtension = '';
    const _regexResults = /(data:)([\w-+/]+);(charset=[\w-]+|base64).*,(.*)/g.exec(base64);

    if (_regexResults === null) {
      callback('Error base64 picture: the  picture regex has failled. The data-uri is not valid.');
    }
    else if (_regexResults < 5) {
      callback('Error base64 picture: the structure is invalid.');
    }
    else if (typeof _regexResults[3] === 'undefined' || _regexResults[3] !== 'base64') {
      callback('Error base64 picture: it is not a base64 picture.');
    }
    else if (image.isMimeTypeImage(_regexResults[2]) === false) {
      callback('Error base64 picture: The mime type has not been recognized.');
    }
    else if (typeof _regexResults[4] === 'undefined' || _regexResults[4].length === 0) {
      callback('Error base64 picture: the picture is empty.');
    }
    else {
      _picMimeType = _regexResults[2];
      _picExtension = image.getExtensionFromMimeTypeImage(_regexResults[2]);
      _picBase64data = _regexResults[4];
    }
    return callback(null, {
      data      : new Buffer.from(_picBase64data, 'base64'),
      mimetype  : _picMimeType,
      extension : _picExtension
    });
  },
  /**
   * List of existing image mime type with their corresponding extension
   */
  mimetypeList : {
    'image/bmp'               : 'bmp',
    'image/x-windows-bmp'     : 'bmp',
    'image/x-ms-bmp'          : 'bmp',
    'image/x-xbitmap'         : 'xbm',
    'image/x-xbm'             : 'xbm',
    'image/xbm'               : 'xbm',
    'image/x-portable-bitmap' : 'pbm',
    'image/gif'               : 'gif',
    'image/jpeg'              : 'jpeg',
    'image/pjpeg'             : 'jpeg',
    'image/png'               : 'png',
    'image/x-png'             : 'png',
    'image/svg+xml'           : 'svg',
    'image/webp'              : 'webp' // webp is not supported on Libre Office
  },
  /**
   * List of image extension with their corresponding mime type
   */
  extensionList : {
    bmp  : 'image/bmp',
    xmb  : 'image/xbm',
    pbm  : 'image/x-portable-bitmap',
    gif  : 'image/gif',
    jpg  : 'image/jpeg',
    jpeg : 'image/jpeg',
    png  : 'image/png',
    webp : 'image/webp'
  },
  /**
   * Check if the mime type is an image
   *
   * @return {Boolean}
   */
  isMimeTypeImage : function (mimeTypeToCheck) {
    if (image.mimetypeList[mimeTypeToCheck] === undefined) {
      return false;
    }
    return true;
  },
  /**
   * Check if the image extension is corresponding to the correct image mime type
   *
   * @return {Boolean}
   */
  isExtensionCorrespondingToMimeTypeImage : function (extension, mimetype) {
    if (image.extensionList[extension] === mimetype) {
      return true;
    }
    return false;
  },
  /**
   * Get the extension from the mime type
   *
   * @return {String} Return the extension corresponding to the mimetype. If no mime type match, undefined is returned.
   */
  getExtensionFromMimeTypeImage : function (mimeType) {
    return image.mimetypeList[mimeType];
  },
  /**
   * Get MIME type from extension
   *
   * @return {String} Return the image mime type corresponding to the extension. If no extension match, undefined is returned.
   */
  getMimeTypeFromExtensionImage : function (extension) {
    return image.extensionList[extension];
  },
};

module.exports = image;
