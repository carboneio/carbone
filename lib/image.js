const parser  = require('./parser');
const file    = require('./file');
const simpleGet = require('simple-get');
const imageSize = require('image-size');
const helper = require('./helper');
const debug = require('debug')('carbone:image');

const image = {

  preProcessXLSX : function (template) {
    const _regexXlsxImage = /<xdr:pic>.*?\{(.+?)\}[^]*?<\/xdr:pic>/g;
    for (let i = 0, n = template.files.length; i < n; i++) {
      const file = template.files[i];
      // Check if an image contains a Carbone Marker and get the sheet Id
      const _regexResult = /xl\/drawings\/drawing(\d+)\.xml/g.exec(file.name);
      if (_regexResult && _regexResult[0] && _regexResult[1] && isNaN(_regexResult[1]) === false) {
        const _sheetId = _regexResult[1];
        file.data = file.data.replace(_regexXlsxImage, function (xml, imageMarker) {
          if (imageMarker && parser.isCarboneMarker(imageMarker) === true) {
            const _imageMarker = imageMarker;
            if (_imageMarker.indexOf('[') !== -1 && _imageMarker.indexOf(']') !== -1) {
              console.warn('Warning: carbone does not support a list of images on XLSX template.');
            }
            // Remove Marker from title or description
            xml = xml.replace(/\{([^{]+?)\}/g, '');
            // (REQUIRED) A formatter is added to the marker to generate an image reference
            xml = xml.replace(/<a:blip.*?r:embed=".*?">.*?<\/a:blip>/g, function (xmlImageReference) {
              if (!xmlImageReference) {
                debug('xlsx preprocess image: the image ID does not exist');
                return xmlImageReference;
              }
              return xmlImageReference.replace(/r:embed=".*?"/g, `r:embed="{${_imageMarker}:generateImageXlsxReference(${_sheetId})}"`);
            });
          }
          return xml;
        });
      }
    }
    return template;
  },
  /**
   * Post-processing : update image id references using options.imageDatabase on the files "xl/drawings/_rels/drawingX.xml.rels" X is the sheet number
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with imageDatabase
   * @return {Object}          template
   */
  postProcessXlsx : function (template, data, options) {
    let _mediaPath = null;
    // leave immediately if no post-processing is necessary
    if (options.imageDatabase === undefined || options.imageDatabase.size === 0) {
      return template;
    }
    for (let i = 0, n = template.files.length; i < n; i++) {
      const file = template.files[i];
      const _resultRegex = /xl\/drawings\/_rels\/drawing(\d+)\.xml\.rels/g.exec(file.name);
      if (_resultRegex && _resultRegex[0] && _resultRegex[1] && isNaN(_resultRegex[1]) === false) {
        const sheetId = parseInt(_resultRegex[1]);
        _mediaPath = null;
        // find the media folder to upload the pictures
        file.data = file.data.replace(/<Relationship[^<>]*?Target="([^<>]*?)\.(jpg|png|jpeg|gif|bmp|xmb|svg|webp|pbm){1}"[^<>]*?\/>/g, function (xml, p1) {
          if (p1) {
            _mediaPath = helper.removeLastPathElement(p1);
          }
          return xml;
        });
        if (!_mediaPath) {
          debug('the media folder for the images has not been found');
          continue;
        }
        let _imageLinks = [];
        let _imageDatabaseIt = options.imageDatabase.values();
        let _imageItem = _imageDatabaseIt.next();
        while (_imageItem.done === false) {
          let _image = _imageItem.value;
          // Check if the image should be included into the actual sheet iteration
          if (_image.sheetIds.includes(sheetId)) {
            let _imagePath = image.getDocxImagePath(_image.id, _image.extension, _mediaPath);
            const imageAlreadyExist = template.files.findIndex(file => file.name === 'xl' + _imagePath.substr(2));
            // if -1 the file doesn't exist on the template.file array
            if (imageAlreadyExist === -1) {
              template.files.push({
              // manage if the file is from Word Online, the path can be just "media" or "word/media"
                name   : 'xl' + _imagePath.substr(2), // substr to remove the slash character from "/media"
                parent : '',
                data   : _image.data
              });
            }
            _imageLinks.push(`<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${_imagePath}" Id="${image.getImageReference(_image.id)}"/>`);
          }
          _imageItem = _imageDatabaseIt.next();
        }
        file.data = file.data.replace('</Relationships>', _imageLinks.join('') + '</Relationships>');
      }
    }
    return template;
  },
  /**
   * If the xml document contains images a post process is needed: special markers are created with post build formatters
   *
   * @param {*} template
   */
  preProcessDocx : function (template) {
    var _imageFit = 'contains';
    var _imageMarker = null;
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        const _fileName = _file.name.split('/').pop();
        // Find the images tags
        _file.data = _file.data.replace(/<w:drawing>([^]*?)<\/w:drawing>/g, function (xmlImage) {
          _imageMarker = null;
          // default value
          _imageFit = 'contain';

          // Find the images properties, the marker can be on the attribute "descr", "title" or "name"
          xmlImage = xmlImage.replace(/<wp:docPr.*?id=".*?".*?[/]?>/g, function (xmlImageProperties) {

            // Get and remove the imageFit formatter in all the cases
            xmlImageProperties = xmlImageProperties.replace(/:imageFit\(['"]?(.*?)['"]?\)/g, function (m, fit) {
              if (['contain', 'fill'].includes(fit)) {
                _imageFit = fit;
              }
              return '';
            });
            // Check if the image contains a Carbone Marker.
            xmlImageProperties = xmlImageProperties.replace(/\{([^{]+?)\}/g, function (xml, marker) {
              if (parser.isCarboneMarker(marker) === true) {
                _imageMarker = marker;
                // Remove marker from descr, title and name attributes
                return '';
              }
              return xml;
            });
            if (_imageMarker) {
              // If it is a marker, the initial ID is replaced by a marker and a post processing formatter
              // The id is an integer and specifies a unique identifier.
              xmlImageProperties = xmlImageProperties.replace(/id=".*?"/g, `id="{${_imageMarker}:generateImageDocxId()}"`);
            }
            return xmlImageProperties;
          });
          if (_imageMarker) {
            // (OPTIONAL) the tag `NvPr` Non Visual Property is used only by LO
            xmlImage = xmlImage.replace(/<pic:cNvPr.*?id=".*?".*?><\/pic:cNvPr>/g, function (xmlImageNonVisualProperties) {
              // Remove marker from descr, title and name attributes
              xmlImageNonVisualProperties = xmlImageNonVisualProperties.replace(/\{([^{]+?)\}/g, '');
              // If it is a marker, the initial ID is replaced by a marker and a post processing formatter
              xmlImageNonVisualProperties = xmlImageNonVisualProperties.replace(/id=".*?"/g, `id="{${_imageMarker}:generateImageDocxId()}"`);
              return xmlImageNonVisualProperties;
            });
            // (REQUIRED) A formatter is added to the marker to generate an image reference
            xmlImage = xmlImage.replace(/<a:blip.*?r:embed=".*?">.*?<\/a:blip>/g, function (xmlImageReference) {
              if (!xmlImageReference) {
                debug('docx preprocess image: the image ID does not exist');
                return xmlImageReference;
              }
              return xmlImageReference.replace(/r:embed=".*?"/g, `r:embed="{${_imageMarker}:generateImageDocxReference(${_fileName})}"`);
            });
            if (_imageFit === 'contain') {
              // Markers contain: to scale the replaced content to maintain its aspect ratio while fitting within the element's content box
              xmlImage = xmlImage.replace(/<(wp:extent|a:ext) cx="([0-9]*?)" cy="([0-9]*?)" ?\/>/g, function (xml, xmltag, cx, cy) {
                xml = xml.replace(/cx="([0-9]*?)"/g, `cx="{${_imageMarker}:scaleImage(width, ${cx}, emu)}"`);
                xml = xml.replace(/cy="([0-9]*?)"/g, `cy="{${_imageMarker}:scaleImage(height, ${cy}, emu)}"`);
                return xml;
              });
            }
          }
          return xmlImage;
        });
      }

    }
    return;
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
      let _picturesRegex = /<draw:frame[^<>]*?>[^]*?<\/draw:frame>/g;
      _file.data = _file.data.replace(_picturesRegex, function (xml) {
        let _imageFit = 'contain';
        let _marker = '';
        // find first carbone marker occurence in alternative text, title or description field of an image.
        xml = xml.replace(/\{([^{]+?)\}/, function (xmlMarker, marker) {
          if (parser.isCarboneMarker(marker) === true) {
            image._isImageListAnchorTypeBlockLO(xml, marker);
            // Get and remove the imageFit formatter in all the cases
            _marker = marker.replace(/:imageFit\(['"]?(.*?)['"]?\)/g, function (xmlImageFit, fit) {
              if (['contain', 'fill'].includes(fit)) {
                _imageFit = fit;
              }
              return '';
            });
            return '';
          }
          return xmlMarker;
        });
        if (_marker && _marker !== '') {
          xml = xml
            .replace(/xlink:href=".*?"/, `xlink:href="{${_marker}:generateOpenDocumentImageHref()}"`)
            .replace(/loext:mime-type=".*?"/, `loext:mime-type="{${_marker}:generateOpenDocumentImageMimeType()}"`);
          if (_imageFit === 'contain') {
            // Markers contain: to scale the replaced content to maintain its aspect ratio while fitting within the element's content box
            xml = xml
              .replace(/svg:width="([^"]*?)(cm|in)"/g, (xmlWidth, widthCm, unit) => xmlWidth.replace(xmlWidth, `svg:width="{${_marker}:scaleImage(width, ${widthCm}, ${unit})}${unit}"`))
              .replace(/svg:height="([^"]*?)(cm|in)"/g, (xmlHeight, heightCm, unit) => xmlHeight.replace(xmlHeight, `svg:height="{${_marker}:scaleImage(height, ${heightCm}, ${unit})}${unit}"`));
          }
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
   * Generate the image link for DOCX documents
   *
   * @param {Integer} id unique id of an image from the imageDatabase map
   * @param {String} extension image file extension
   * @param {String} pathMedia path to the file
   */
  getDocxImagePath : function (id, extension, pathMedia) {
    return `${pathMedia}CarboneImage${id}.${extension}`;
  },


  /**
   * Return a unique image code reference for DOCX documents. This method is used during post processing and post build formatters.
   * This reference is included into 2 files:
   * - `word/_rels/document.xml.rels` to define the image, the path and the id (reference)
   * - `word/document.xml` to display the image inside the main document
   *
   * @param {Integer} id unique id of an image from the imagedatabse map
   */
  getImageReference : function (id) {
    return `rIdCarbone${id}`;
  },

  /**
   * Post-processing : update image id references using options.imageDatabase on the file "/word/_rels/document.xml.rels"
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with imageDatabase
   * @return {Object}          template
   */
  postProcessDocx : function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (options.imageDatabase === undefined || options.imageDatabase.size === 0) {
      return template;
    }
    // find and update global manifest file with image links ""
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      if (_file.name.indexOf('.rels') === -1 || typeof _file.data !== 'string') {
        continue;
      }
      let _mediaPath = null;
      // find the media folder to upload the pictures
      _file.data = _file.data.replace(/<Relationship[^<>]*?Target="([^<>]*?)\.(jpg|png|jpeg|gif|bmp|xmb|svg|webp|pbm){1}"[^<>]*?\/>/g, function (xml, p1) {
        if (p1) {
          _mediaPath = helper.removeLastPathElement(p1);
        }
        return xml;
      });
      if (!_mediaPath) {
        debug('the media folder for the images has not been found for the file: ' + _file.name);
        continue;
      }
      let _imageLinks = [];
      let _imageDatabaseIt = options.imageDatabase.values();
      let _imageItem = _imageDatabaseIt.next();
      while (_imageItem.done === false) {
        let _image = _imageItem.value;
        // check if the image have to be included in the actual relation file.
        if (image.checkIfImageIncludedDocx(_file.name, _image.sheetIds)) {
          let _imagePath = image.getDocxImagePath(_image.id, _image.extension, _mediaPath);
          template.files.push({
            // manage if the file is from Word Online, the path can be just "media" or "word/media"
            name   : _imagePath[0] !== '/' ? 'word/' + _imagePath : _imagePath.substr(1), // substr to remove the slash character from "/media"
            parent : '',
            data   : _image.data
          });
          _imageLinks.push(`<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${_imagePath}" Id="${image.getImageReference(_image.id)}"/>`);
        }
        _imageItem = _imageDatabaseIt.next();
      }
      _file.data = _file.data.replace('</Relationships>', _imageLinks.join('') + '</Relationships>');
    }
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
      const invalidImageBuffer = new Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQoJBwwKCQoNDAwOER0TERAQESMZGxUdKiUsKyklKCguNEI4LjE/MigoOk46P0RHSktKLTdRV1FIVkJJSkf/2wBDAQwNDREPESITEyJHMCgwR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wgARCABkAGQDAREAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAIDAQQH/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAA+qAAAAAAAAAAAAAAAAAAAAHAdAJAKAAMzEHTM1Mzp6wACCCiSDQg6bgAAwOFggsosAAHlOHSSCzc1AAAABibAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//EACoQAAICAgEDAwIHAQAAAAAAAAECAxEAEiEEEzEgIlEUUDAzNEFhcZFy/9oACAEBAAE/APtLMqqWY0BikMoZTYPIPoDqWKhhY8jEdZFtGDDN1DhLGxFgeqckQOR5AwyyVCqFQXHPHGB5qmTYF0qjWJM0jxBDQK7NjTurCpVcbUVC8f7kX66X/kYs7r0pYBdi+o4oYocdagdwx0PIFeqRO5GyXVirzscxHb8sYkesrvd71xkUCx70b2P+D4wdIQoXusQptRnZI6gyB6B8jPph2TGXPnYH4OJAwlEjyFyBXrRwskxLO2vJB8D+s+rSx7Xo+DWJOrqxCsCnlSOcSdWcIUZSRY2FXjdWgulYhTRIHGPOqUArMzCwAOayKQSLa/NEH16PfU8H3D2/zxnbfXpvabQ84VkDzsikMa1ORI5njZlcAAgljfOOHi6aSNkb52/bHjbuI+rMCgB1NEZ06hYzSMlm6Y2fw26aNmLNsbN0WNfev//EABQRAQAAAAAAAAAAAAAAAAAAAHD/2gAIAQIBAT8AKf/EABQRAQAAAAAAAAAAAAAAAAAAAHD/2gAIAQMBAT8AKf/Z', 'base64');
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
        if (!!err === true) {
          debug(err);
          // If any error occurs during download, the image is replaced by the invalid image.
          imageInfo = {
            data      : invalidImageBuffer,
            extension : 'jpg',
            mimetype  : 'image/jpeg'
          };
        }
        // Copy the properties: it keeps the id, imageSourceWidth, imageSourceHeight and sheetIds
        imageInfo = helper.mergeObjects(imageInfo, _imageInfo);
        // Compute the new image scale only for docx files
        if ((options.extension === 'docx' || options.extension === 'odt') && imageInfo.imageUnit) {
          image._getImageSize(imageInfo, imageInfo.imageUnit);
          image._computeImageSize(imageInfo);
        }
        options.imageDatabase.set(_imageURLBase64, imageInfo);
        return walkImage();
      });
    }
    walkImage();
  },
  /**
	 * Get the image size
   *
	 * @param {Object} imageInfo
   *
   * @private
	 */
  _getImageSize (imageInfo, unit = 'px') {
    var _dimensionsPx = null;
    try {
      _dimensionsPx = imageSize(imageInfo.data);
    }
    catch (e) {
      debug('Can not get the image pixel sizes.');
      return null;
    }
    if (unit === 'emu') { // convert pixel to EMU
      imageInfo.newImageWidth = Math.floor(_dimensionsPx.width * 914400 / 96);
      imageInfo.newImageHeight = Math.floor(_dimensionsPx.height * 914400 / 96);
    }
    else if (unit === 'cm') { // convert pixel to CM
      imageInfo.newImageWidth = _dimensionsPx.width * 0.0265;
      imageInfo.newImageHeight = _dimensionsPx.height * 0.0265;
    }
    else if (unit === 'in') { // convert pixel to inch
      imageInfo.newImageWidth = _dimensionsPx.width * 1/96;
      imageInfo.newImageHeight = _dimensionsPx.height * 1/96;
    }
    else { // default pixel
      imageInfo.newImageWidth = _dimensionsPx.width;
      imageInfo.newImageHeight = _dimensionsPx.height;
    }
  },
  /**
	 * Compute the new image dimensions into an area
   *
	 * @param {Object} imageInfo
   *
   * @private
	 */
  _computeImageSize (imageInfo) {
    const _newSize = image._fitDimensions({
      x : imageInfo.newImageWidth,
      y : imageInfo.newImageHeight
    }, {
      x : imageInfo.imageWidth,
      y : imageInfo.imageHeight
    });
    imageInfo.imageWidth = _newSize.x;
    imageInfo.imageHeight = _newSize.y;
  },
  /**
	 * Fit `source` dimensions into `target` with the same ratio.
	 * @param {Object} source Source dimension (dynamic picture)
	 * @param {Object} target Target dimension (original picture)
   *
   * @private
	 */
  _fitDimensions : function (source, target) {
    // Ratio to keep
    var _sourceRatio = source.x / source.y;
    // Offet between the two dimensions
    var _offset = {
      x : source.x - target.x,
      y : source.y - target.y
    };
    var _maxOffset = Math.max(_offset.x, _offset.y);
    var _maxOffsetAxis = _offset.x === _maxOffset ? 'x' : 'y';
    var _minOffsetAxis = _maxOffsetAxis === 'x' ? 'y' : 'x';
    // Compute the value to remove for the smaller axis,
    // this is the tricky part
    var _offsetToApply = _maxOffsetAxis === 'y' ? Math.floor(_maxOffset * _sourceRatio) : Math.floor(_maxOffset / _sourceRatio);
    // Apply the value
    source[_minOffsetAxis] -= _offsetToApply;
    // Reduce the bigger source axis to the bigger target axis
    source[_maxOffsetAxis] -= _maxOffset;
    return source;
  },
  /**
   * Function used to check if images list has the property "anchor type" to "as character".
   * If an image anchor type is different to "as character" and the marker is a list, it shows a warning and return false.
   *
   * @private
   * @param {String} xmlImage xml of a Libre Office image, it begins with "<draw:frame>" and ends with "</draw:frame>"
   * @param {String} marker Carbone marker bound to the image.
   */
  _isImageListAnchorTypeBlockLO : function (xmlImage, marker) {
    // There's no marker bound to the image or no XML provided
    // the marker is not a list
    if (!xmlImage || !marker || (marker.indexOf('[') === -1 && marker.indexOf(']') === -1)) {
      return true;
    }
    const _anchorType = /text:anchor-type="([^"]*?)"/.exec(xmlImage);
    if (_anchorType === null) {
      console.warn('Carbone warning: the template contains a list of images, it is not supported and may break the report.');
      return false;
    }
    else if (_anchorType[1] !== 'as-char') {
      console.warn(`Carbone warning: the template contains a list of floating images, you must change the images anchor-type to "as character" where the marker "${marker}" is bound.`);
      return false;
    }
    return true;
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
    // HTTP Request
    simpleGet.concat({method : 'GET', url : imageLinkOrBase64, timeout : 5000}, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      if (res.statusCode !== 200) {
        return callback(`Error Carbone: can not download the image from the url ${imageLinkOrBase64}`);
      }
      // Get the extension from the file name by default and remove extra parameters
      // It's not recommanded to use Content-Disposition
      let _extension = helper.getFileExtensionFromUrl(imageLinkOrBase64);
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
      return callback('Error base64 picture: the picture regex has failled. The data-uri is not valid.');
    }
    else if (_regexResults < 5) {
      return callback('Error base64 picture: the structure is invalid.');
    }
    else if (typeof _regexResults[3] === 'undefined' || _regexResults[3] !== 'base64') {
      return callback('Error base64 picture: it is not a base64 picture.');
    }
    else if (typeof _regexResults[2] === 'undefined' || image.isMimeTypeImage(_regexResults[2]) === false) {
      return callback('Error base64 picture: The mime type has not been recognized.');
    }
    else if (typeof _regexResults[4] === 'undefined' || _regexResults[4].length === 0) {
      return callback('Error base64 picture: the picture is empty.');
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
    webp : 'image/webp',
    svg  : 'image/svg+xml'
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
  /**
   * @description Take a relation file name and compare with an array of file name.
   * @description If the relation file name contains one of the element, it returns true, otherwise false.
   * @description It is used for including pictures inside footers, headers, or content.
   * @private
   * @param {String} fileNameRels Example: "word/_rels/document.xml.rels"
   * @param {Array<String>} fileNameList Example: ["document.xml", "footer1.xml", "header3.xml"]
   */
  checkIfImageIncludedDocx : function (fileNameRels, fileNameList) {
    for (let i = 0, j = fileNameList.length; i < j; i++) {
      const _fileNameContent = fileNameList[i];
      if (fileNameRels && fileNameRels.indexOf(_fileNameContent) !== -1) {
        return true;
      }
    }
    return false;
  }
};

module.exports = image;
