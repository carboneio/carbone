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
					this.embedDocxPictures(template, callback);
					break;
				case '.odt':
					this.embedOdtPictures(template, callback);
					break;
				default:
					break;
			}
		}
	},
	/**
   * Docx pictures embedding main function
   * @param  {Object}   template
   * @param  {Function} callback
   */
	embedDocxPictures : function (template, callback) {
		// This file contains relations
		var relsFile = dynpics.getTemplate(template, 'word/_rels/document.xml.rels');

		// And we want to replace the link of external picture relations by embedded links
		this.replaceDocxRels(template, relsFile.data,  function (newTemplate, newRels) {
			// We save the returned values and return the new template
			template = newTemplate;
			relsFile.data = newRels;
			return callback(null, template);
		});
	},
	/**
   * Replace docx rels url with embedded links
   * @param  {Object}   template
   * @param  {String}		xml
   * @param  {Function} callback
   */
	replaceDocxRels : function (template, xml, callback) {
		// Regex to get the relations we want (images)
		var relsPicRegex = /<Relationship\s*?Id="\S*?"\s*?Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument[^><]*?image".*?Target="(http.*?\.([a-z]*?))".*?>/ig;
		var regexMatch = relsPicRegex.exec(xml);
		var picId = 0;

		if (!regexMatch) {
			return callback(template, xml);
		}
		while (regexMatch) {
			// Name which will be the one in relations file (target)
			var newPicName = 'media/CarbonePicture' + picId++ + '.' + regexMatch[2];
			// Href of the picture
			var href = regexMatch[1];

			// Get picture ready to push in template files
			this.getPictureFile(href, 'word/' + newPicName, function (picture) {
				// Replace relation target
				xml = xml.replace(href + '" TargetMode="External"', newPicName + '"');
				// Push in template files
				template.files.push(picture);
				if (!regexMatch) {
					return callback(template, xml);
				}
			});
			regexMatch = relsPicRegex.exec(xml);
		}
	},
	/**
   * Odt pictures embedding main function
   * @param  {Object}   template
   * @param  {Function} callback
   */
	embedOdtPictures : function (template, callback) {
		var that = this;
		var contentFile = dynpics.getTemplate(template, 'content.xml');
		var manifest = dynpics.getTemplate(template, 'META-INF/manifest.xml');

		this.getOdtPictures(contentFile.data, function (pictures) {
			if (Object.keys(pictures).length === 0) {
				return callback(null, template);
			}
			// Get all link to replace and their new value
			that.generateOdtEmbeds(pictures, function (rels) {
				// Replace them
				that.replaceOdtEmbeds(template, contentFile.data, rels, function (newContent, newTemplate) {
					contentFile.data = newContent;
					// Update manifest (new pictures has to be defined in it)
					that.updateOdtManifest(template, manifest.data, function (template, newManifest) {
						// Save and return
						manifest.data = newManifest;
						return callback(null, template);
					});
				});
			});
		});
	},
	/**
   * Update Odt manifest file with new embedded pictures
   * @param  {Object}   template
   * @param  {String}		manifest
   * @param  {Function} callback
   */
	updateOdtManifest : function (template, manifest, callback) {
		var isPicture = /Pictures\/.*?\.(.*)/;
		var manifestTemplate = '<manifest:file-entry manifest:full-path="{FILENAME}" manifest:media-type="{MIMETYPE}"/>';
		var manifestCloseTag = '</manifest:manifest>';
		var match;
		var that = this;
		
		for (var i = 0; i < template.files.length; i++) {
			var file = template.files[i];

			// If a file is a picture
			if (match = file.name.match(isPicture)) {
				var manifestNewLine = manifestTemplate.replace('{FILENAME}', file.name).replace('{MIMETYPE}', that.getMimeType(match[1]));

				// And does not already exist
				if (!manifest.match(manifestNewLine)) {
					// We add a new entry in the manifest
					manifest = manifest.replace(manifestCloseTag, ' ' + manifestNewLine + '\n' + manifestCloseTag);
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
		var picturesRegex = /<draw:image.*?xlink:href="(http(?:s)?.*?)".*?>/ig;
		var match = picturesRegex.exec(xml);
		var result = [];

		if (!match) {
			return callback(result);
		}
		// Parse all Odt pictures
		while (match) {
			result.push({
				xml  : match[0],
				href : match[1]
			});
			match = picturesRegex.exec(xml);
			if (!match) {
				return callback(result);
			}
		}
	},
	/**
   * Generate relations between old Odt links and new ones
   * These relations are created for intern use only, they are NOT Docx relations
   * @param  {Array}   	pictures
   * @param  {Function} callback
   */
	generateOdtEmbeds : function (pictures, callback) {
		var rels = [];

		for (var i = 0; i < pictures.length; i++) {
			// We gave a new name for each picture
			rels.push({
				original : pictures[i].href,
				new      : 'CarbonePicture' + i + '.jpg'
			});
			if (i === pictures.length - 1) {
				return callback(rels);
			}
		}
	},
	/**
   * Replace links with previously created relations
   * And push new pictures in template
   * @param  {Object}   template
   * @param  {String}   xml
   * @param  {Array}   	rels
   * @param  {Function} callback
   */
	replaceOdtEmbeds : function (template, xml, rels, callback) {
		var urlOpts;
		var answers = 0;

		for (var i = 0; i < rels.length; i++) {
			// Replace pictures links by its new name
			xml = xml.replace(rels[i].original, 'Pictures/' + rels[i].new);
			// Get picture data
			this.getPictureFile(rels[i].original, 'Pictures/' + rels[i].new, function (file) {
				// And push it in template files
				template.files.push(file);
				if (++answers === rels.length) {
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
	getPictureFile : function (href, name, callback) {
		// Just call request with encoding set to null to get a Buffer
		request({
			uri 	   : href,
			encoding : null
		}, function (err, res, body) {
			callback({
				name     : name,
				data     : body,
				isMarked : false,
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