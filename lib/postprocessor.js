var path  = require('path');
var helper = require('./helper');
var dynpics = require('./dynpics');
var request = require('request');
var stream = require('stream');

var postprocessor = {

  /**
   * Execute postprocessor on main, and embedded document
   * @param  {Object}   template
   * @param  {Function} callback
   */
  execute : function (template, data, options, callback) {
    if (template === null || template.files === undefined) {
      return callback(null, template);
    }
    for (var i = -1; i < template.embeddings.length; i++) {
      var _mainOrEmbeddedTemplate = template.filename;
      var _parentFilter = '';
      if (i > -1) {
        _mainOrEmbeddedTemplate = _parentFilter = template.embeddings[i];
      }
      var _fileType = path.extname(_mainOrEmbeddedTemplate);
      switch (_fileType) {
        case '.docx':
          this.embedDocxPictures(template, data, options, callback);
          break;
        case '.odt':
          this.embedOdtPictures(template, data, options, callback);
          break;
        default:
        callback(null, template);
          break;
      }
    }
  },
  /**
   * Docx pictures embedding main function (entry point)
   * @param  {Object}   template
   * @param  {Function} callback
   */
  embedDocxPictures : function (template, data, options, callback) {
    const _self = this;

    // We have to process document by document
    // so we have to retrieve them first
    dynpics.getDocxDocuments(template, function (err, documents) {
      if (err) {
        return callback(err);
      }

      // Now we want to embed the dynamic pictures of the document
      _self.embedDocxDocumentsPictures(template, documents, data, options, function (err, template) {
        if (err) {
          return callback(err);
        }
        // We're done
        callback(null, template);
      });
    });
  },
  /**
   * Embed dynamic pictures for a given docx documents list.
   * @param {Object} template Carbone template
   * @param {Array} documents Template documents
   * @param {Object} data Carbone data
   * @param {Object} options Carbone options
   * @param {Function} callback error, template
   */
  embedDocxDocumentsPictures : function (template, documents, data, options, callback) {
    let _count = documents.length;

    // Looping on documents
    for (let i = 0; i < _count; i++) {
      const _document = documents[i];

      // Embed the dynamic pictures of the document
      this.embedDocxDocumentPictures(template, _document, data, options, err => {
        if (--_count === 0) {
          // We're done
          return callback(null, template);
        }
      });
    }
  },
  /**
   * Embed dynamic pictures for a given docx document.
   * @param {Object} template Carbone template
   * @param {Object} document Docx document
   * @param {Object} data Carbone data
   * @param {Object} options Carbone options
   * @param {Function} callback error, template
   */
  embedDocxDocumentPictures : function (template, document, data, options, callback) {
    // Retrieve the document relation file
    const _relsFile = dynpics.getTemplate(template, document.relsPath);

    if (!_relsFile) {
      return callback(new Error('No relations file'));
    }
    // Then replace the original relations by new ones in order to insert the dynamic pictures
    this.replaceDocxRels(template, _relsFile, data, options, document, function (err, template) {
      return callback(null, template);
    });
  },
  /**
   * Replace the dynamic pictures original relations by relations with dynamic pictures as target.
   * @param {Object} template Carbone template
   * @param {Object} relsFile Relations file (in `template.files`)
   * @param {Object} data Carbone data
   * @param {Object} options Carbone options
   * @param {Function} callback error, template
   */
  replaceDocxRels : function (template, relsFile, data, options, document, callback) {
    // Regex to get the relations we want (images)
    var _relsPicRegex = /<Relationship [^><]*?Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument[^><]*?image"[^><]*?Target="([^\/].*?)".*?>/ig;
    var _relIdRegex = /Id="(.*?)"/i;
    var _relsFileContent = relsFile.data.toString();
    var _regexMatch = _relsPicRegex.exec(_relsFileContent);
    var _picturesMatches = [];
    var _count = 0;

    // Store every match (dynpic relation) in an array
    while (_regexMatch) {
      _picturesMatches.push(_regexMatch);
      _regexMatch = _relsPicRegex.exec(_relsFileContent);
    }

    _count = _picturesMatches.length;

    // Loop on the dynpics relations
    for (var i = 0; i < _picturesMatches.length; i++) {
      var _relation = {
        uri     : _picturesMatches[i][1],
        fileXml : _picturesMatches[i].input,
        id      : _relIdRegex.exec(_picturesMatches[i][0])[1]
      };

      // Embed a picture thanks to the found relation
      this.embedDocxPictureRel(template, data, options, _relation, i, function (err, newRelations, picture) {
        // If the picture has been embedded
        if (err === null) {
          // Replace the old relation file by the updated one
          relsFile.data = newRelations;
          var _xml = dynpics.getTemplate(template, document.contentPath);

          _xml.data = dynpics._updateDocxPictureDimensionsInXml(_xml.data, _relation, picture);
        }
        if (--_count === 0) {
          // We're done
          return callback(null, template);
        }
      });
    }
    return;
  },
  /**
   * Embed a dynamic picture thanks to the given relation.
   * The relation gives us the source of the dynamic picture,
   * it can be a public URL or a reference to a base64 image.
   * The found picture will be pushed in the template,
   * and the new relation file will be returned.
   * The relation file is not modified in this function.
   * @param {Object} template Carbone template
   * @param {Object} data Carbone data
   * @param {Object} options Carbone options
   * @param {Object} relation Found relation (regex match result)
   * @param {Number} pictureIndex Picture index to build the picture filename
   * @param {Function} callback error, newRelations
   */
  embedDocxPictureRel : function (template, data, options, relation, pictureIndex, callback) {
    var _that = this;

    // Get the picture of the relation in order to embed it
    this.retrieveDocxPictureByRelation(data, relation, pictureIndex, function (err, picture, newRelations) {
      if (err) {
        return callback(err);
      }
      // Get the new content types with the picture extension
      _that.addDocxContentType(template, picture.extension, function (newContentType) {
        // Replace the old content types file
        dynpics.getTemplate(template, '[Content_Types].xml').data = newContentType;
        // Push the picture
        template.files.push(picture);
        // We're done
        callback(null, newRelations, picture);
      });
    });
  },
  /**
   * Retrieve a picture thanks to a relation and return the picture with the new relation file.
   * @param {Object} data Carbone data
   * @param {Object} relation Found relation (regex match result)
   * @param {Number} pictureIndex Picture index
   * @param {Function} callback error, picture, newRelation
   */
  retrieveDocxPictureByRelation : function (data, relation, pictureIndex, callback) {
    var _uri = relation.uri;

    // Retrieve the corresponding picture (the source can be public url or plain base64)
    this.getPictureFile(_uri, null, data, {}, function (err, picture) {
      if (err) {
        return callback(err);
      }
      // Build the picture filename
      var _newPicName = 'media/CarbonePicture' + pictureIndex + '.' + picture.extension;

      picture.name = _newPicName;
      // Replace the original picture target by the created one
      var _newRel = relation.fileXml.replace(_uri + '" TargetMode="External"', '/' + _newPicName + '"');
      callback(null, picture, _newRel);
    });
  },
  /**
   * Add used content types in [Content_Types].xml
   * @param  {Object}   template
   * @param  {String}    extension
   * @param  {Function} callback
   */
  addDocxContentType : function (template, extension, callback) {
    var _contentTypeFile = dynpics.getTemplate(template, '[Content_Types].xml').data;
    var _lineTemplate = '<Default Extension="{EXTENSION}" ContentType="{MIMETYPE}"/>';
    var _newLine = _lineTemplate.replace('{EXTENSION}', extension).replace('{MIMETYPE}', this.getMimeType(extension));

    // If the content type does not already exist
    if (!_contentTypeFile.match(_newLine)) {
      // Add it
      _contentTypeFile = _contentTypeFile.replace('</Types>', _newLine + '</Types>');
    }
    callback(_contentTypeFile);
  },
  /**
   * Odt pictures embedding main function
   * @param  {Object}   template
   * @param  {Function} callback
   */
  embedOdtPictures : function (template, data, options, callback) {
    var _that = this;
    var _contentFile = dynpics.getTemplate(template, 'content.xml');
    var _manifest = dynpics.getTemplate(template, 'META-INF/manifest.xml');

    this.getOdtPictures(_contentFile.data, function (pictures) {
      if (Object.keys(pictures).length === 0) {
        return callback(null, template);
      }
      // Get all link to replace and their new value
      _that.generateOdtEmbeds(pictures, function (rels) {
        // Replace them
        _that.replaceOdtEmbeds(template, _contentFile.data, rels, data, options, function (newContent, template) {
          _contentFile.data = newContent;
          // Update manifest (new pictures has to be defined in it)
          _that.updateOdtManifest(template, _manifest.data, function (template, newManifest) {
            // Save and return
            _manifest.data = newManifest;
            return callback(null, template);
          });
        });
      });
    });
  },
  /**
   * Update Odt manifest file with new embedded pictures
   * @param  {Object}   template
   * @param  {String}    manifest
   * @param  {Function} callback
   */
  updateOdtManifest : function (template, manifest, callback) {
    var _isPicture = /Pictures\/.*?\.(.*)/;
    var _manifestTemplate = '<manifest:file-entry manifest:full-path="{FILENAME}" manifest:media-type="{MIMETYPE}"/>';
    var _manifestCloseTag = '</manifest:manifest>';
    var _match;
    var _that = this;

    // Manifest can be a Buffer, we want it to be a String
    manifest = manifest.toString();

    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];

      // If a file is a picture
      if (_match = _file.name.match(_isPicture)) {
        var _manifestNewLine = _manifestTemplate.replace('{FILENAME}', _file.name).replace('{MIMETYPE}', _that.getMimeType(_match[1]));

        // And does not already exist
        if (!manifest.match(_manifestNewLine)) {
          // We add a new entry in the manifest
          manifest = manifest.replace(_manifestCloseTag, _manifestNewLine + _manifestCloseTag);
        }
      }
    }
    // Maybe wait the end of the loop ?
    // For now it is not usefull because of the simplicity of the actions (basic text manipulation is fast enough)
    return callback(template, manifest);
  },
  /**
   * Get all Odt pictures
   * @param  {String}   xml
   * @param  {Function} callback
   */
  getOdtPictures : function (xml, callback) {
    var _picturesRegex = /<draw:image.*?xlink:href="((http(?:s)?.*?)|(\$.*?))".*?>/ig;
    var _match = _picturesRegex.exec(xml);
    var _result = [];

    if (!_match) {
      return callback(_result);
    }
    // Parse all Odt pictures
    while (_match) {
      _result.push({
        xml  : _match[0],
        href : _match[1]
      });
      _match = _picturesRegex.exec(xml);
      if (!_match) {
        return callback(_result);
      }
    }
  },
  /**
   * Generate relations between old Odt links and new ones
   * These relations are created for intern use only, they are NOT Docx relations
   * @param  {Array}     pictures
   * @param  {Function} callback
   */
  generateOdtEmbeds : function (pictures, callback) {
    var _rels = [];

    for (var i = 0; i < pictures.length; i++) {
      // We gave a new name for each picture
      _rels.push({
        original : pictures[i].href,
        new      : 'CarbonePicture' + i + '.' + (pictures[i].extension || 'jpg')
      });
      if (i === pictures.length - 1) {
        return callback(_rels);
      }
    }
  },
  /**
   * Replace links with previously created relations
   * And push new pictures in template
   * @param  {Object}   template
   * @param  {String}   xml
   * @param  {Array}     rels
   * @param  {Function} callback
   */
  replaceOdtEmbeds : function (template, xml, rels, data, options, callback) {
    var _answers = 0;

    for (var i = 0; i < rels.length; i++) {
      // Replace pictures links by its new name
      xml = xml.replace(rels[i].original, 'Pictures/' + rels[i].new);
      // Get picture data
      this.getPictureFile(rels[i].original, 'Pictures/' + rels[i].new, data, options, function (err, file) {
        if (err) {
          return callback(err);
        }
        // And push it in template files
        template.files.push(file);
        if (++_answers === rels.length) {
          return callback(xml, template);
        }
      });
    }
  },
  /**
   * Get picture data as buffer
   * @param  {String}   href
   * @param  {String}   name
   * @param  {Function} callback
   */
  getPictureFile : function (href, name, data, options, callback) {
    if (href.startsWith('http') === false) {
      var _givenPicture = data[href];

      if (!_givenPicture) {
        return callback(new Error('Base64 dynamic picture `' + href + '` referenced in template but not given in data'))
      }

      var _givenData = new Buffer(data[href].data, 'base64');

      return callback(null, {
        name      : name,
        data      : _givenData,
        extension : data[href].extension,
        isMarked  : false,
        parent    : ''
      });
    }
    // Just call request with encoding set to null to get a Buffer
    request({
      uri      : href,
      encoding : null
    }, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        name     : name,
        data     : body,
        isMarked : false,
        extension: path.extname(href).slice(1),
        parent   : ''
      });
    });
  },
  /**
   * Get MIME type from extension
   * @return  {String}
   */
  getMimeType : function (extension) {
    if (extension === 'jpg') {
      return 'image/jpeg';
    } else {
      return 'image/' + extension;
    }
  }
}

module.exports = postprocessor;