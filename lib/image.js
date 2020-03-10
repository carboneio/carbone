const parser  = require('./parser');
const file    = require('./file');
const path    = require('path');
const request = require('request');

const image = {

  /**
   * Pre-processing: Insert Image formatters in Open Document ODT before carbone processing
   *
   * @param  {Object} template
   */
  preProcessOdt : function (template) {
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
   * Post-processing : update ODT template image links using options.imageDatabase
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with imageDatabase
   * @return {Object}          template
   */
  postProcessOdt : function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (options.imageDatabase === undefined || options.imageDatabase.size === 0) {
      return template;
    }
    image.updateOdtImageLinks(template, options.imageDatabase);
    return template;
  },

  /**
   * Generate image link in ODT document
   *
   * @param  {Integer} id        unique id of the image
   * @param  {String} extension  file extension
   * @return {String}            link inserted in ODT document
   */
  buildOdtImageLink : function (id, extension) {
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
  updateImageDatabase : function (data, options, callback) {
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
          console.log(err); // TODOs
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
    if (imageLinkOrBase64.startsWith('http') === false) {
      // DEPRECATED image method
      if (data[imageLinkOrBase64] !== undefined) {
        return callback(null, {
          data      : new Buffer(data[imageLinkOrBase64].data, 'base64'),
          extension : data[imageLinkOrBase64].extension,
          mimetype  : image.getMimeType(data[imageLinkOrBase64].extension)
        });
      }
      // TODO manage error
      return callback(null, image.parseBase64Picture(imageLinkOrBase64));
      // TODO do new method
    }
    // Just call request with encoding set to null to get a Buffer
    // TODO timeout
    request.get({ uri : imageLinkOrBase64, encoding : null }, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      // let _mimeType = res.headers['content-type']; // TODO improve
      let _extension = path.extname(imageLinkOrBase64).slice(1); // TODO improve
      return callback(null, {
        data      : body,
        mimetype  : image.getMimeType(_extension), // TODO improve, use _mimetypeList of parseBase64Picture
        extension : _extension
      });
    });
  },

  /**
   * Post-processing: Update image links in the template
   *
   * @param  {Object} template
   * @param  {Map}    imageDatabase
   * @return {Object} template
   */
  updateOdtImageLinks : function (template, imageDatabase) {
    if (imageDatabase.size === 0) {
      return template;
    }
    // find and update global manifest file with image links
    let _manifestFile = file.getTemplateFile(template, 'META-INF/manifest.xml');
    if (_manifestFile === null || typeof(_manifestFile.data) !== 'string' ) {
      console.warn('no manifest file');
      return template;
    }
    let _imageLinks = [];
    let _imageDatabaseIt = imageDatabase.values();
    let _imageItem = _imageDatabaseIt.next();
    while (_imageItem.done === false) {
      let _image = _imageItem.value;
      let _imageLink = image.buildOdtImageLink(_image.id, _image.extension);
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
   * Get MIME type from extension
   * TODO: improve => manage all format of parseBase64Picture
   *
   * @return  {String}
   */
  getMimeType : function (extension) {
    if (extension === 'jpg') {
      return 'image/jpeg';
    }
    else {
      return 'image/' + extension;
    }
  },

  /**
   * Parse a data-uri scheme (base64 image)
   *
   * @description data-uri example: data:[<media type>][;charset=<character set>][;base64],<data>
   * @description Mime types list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
   *
   * @param {String} base64 base64 HTML format as a string
   * @returns {Object} The base64 parsed into an object
   */
  parseBase64Picture (base64) {
    let _picBase64data = '';
    let _picMimeType = '';
    let _picExtension = '';
    const _mimetypeList = {
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
      'image/webp'              : 'webp'
    };
    const _regexResults = /(data:)([\w-+/]+);(charset=[\w-]+|base64).*,(.*)/g.exec(base64);

    if (_regexResults === null) {
      console.error('Error: the base64 picture regex has failled. The data-uri is not valid.');
    }
    else if (_regexResults < 5) {
      console.error('Error for a base64 picture.');
    }
    else if (typeof _regexResults[3] === 'undefined' || _regexResults[3] !== 'base64') {
      console.error('Error: it is not a base64 picture.');
    }
    else if (typeof _mimetypeList[_regexResults[2]] === 'undefined') {
      console.error('Error base64 picture: The mime type has not been recognized.');
    }
    else if (typeof _regexResults[4] === 'undefined' || _regexResults[4].length === 0) {
      console.error('Error base64 picture: the picture is empty.');
    }
    else {
      _picMimeType = _regexResults[2];
      _picExtension = _mimetypeList[_regexResults[2]];
      _picBase64data = _regexResults[4];
    }
    return {
      data      : new Buffer.from(_picBase64data, 'base64'),
      mimetype  : _picMimeType,
      extension : _picExtension
    };
  }
};

module.exports = image;
