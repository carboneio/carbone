var path  = require('path');
var helper = require('./helper');
var dynpics = require('./dynpics');
var request = require('request');
var stream = require('stream');

var postprocessor = {
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
					break;
				case '.odt':
					this.embedOdtPictures(template, callback);
					break;
				default:
					break;
			}
		}
	},
	embedOdtPictures : function (template, callback) {
		var that = this;
		var contentFile = dynpics.getTemplate(template, 'content.xml');
		var manifest = dynpics.getTemplate(template, 'META-INF/manifest.xml');

		this.getOdtPictures(contentFile.data, function (pictures) {
			if (Object.keys(pictures).length === 0) {
				return callback(null, template);
			}
			that.generateOdtEmbeds(pictures, function (rels) {
				that.replaceOdtEmbeds(template, contentFile.data, rels, function (newContent, newTemplate) {
					contentFile.data = newContent;
					that.updateOdtManifest(template, manifest.data, function (template, newManifest) {
						manifest.data = newManifest;
						return callback(null, template);
					});
				});
			});
		});
	},
	updateOdtManifest : function (template, manifest, callback) {
		var isPicture = /Pictures\/.*?\.(.*)/;
		var manifestTemplate = '<manifest:file-entry manifest:full-path="{FILENAME}" manifest:media-type="{MIMETYPE}"/>';
		var manifestCloseTag = '</manifest:manifest>';
		var match;
		var that = this;
		
		for (var i = 0; i < template.files.length; i++) {
			var file = template.files[i];

			if (match = file.name.match(isPicture)) {
				var manifestNewLine = manifestTemplate.replace('{FILENAME}', file.name).replace('{MIMETYPE}', that.getMimeType(match[1]));

				if (!manifest.match(manifestNewLine)) {
					manifest = manifest.replace(manifestCloseTag, ' ' + manifestNewLine + '\n' + manifestCloseTag);
				}
			}
		}
		return callback(template, manifest);
	},
	getOdtPictures : function (xml, callback) {
		var picturesRegex = /<draw:image.*?xlink:href="(http(?:s)?.*?)".*?>/ig;
		var match = picturesRegex.exec(xml);
		var result = [];

		if (!match) {
			return callback(result);
		}
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
	generateOdtEmbeds : function (pictures, callback) {
		var rels = [];

		for (var i = 0; i < pictures.length; i++) {
			rels.push({
				original : pictures[i].href,
				new      : 'CarbonePicture' + i + '.jpg'
			});
			if (i === pictures.length - 1) {
				return callback(rels);
			}
		}
	},
	replaceOdtEmbeds : function (template, xml, rels, callback) {
		var urlOpts;
		var answers = 0;

		for (var i = 0; i < rels.length; i++) {
			xml = xml.replace(rels[i].original, 'Pictures/' + rels[i].new);
			this.getPictureFile(rels[i].original, 'Pictures/' + rels[i].new, function (file) {
				template.files.push(file);
				if (++answers === rels.length) {
					return callback(xml, template);
				}
			});
		}
	},
	getPictureFile : function (href, name, callback) {
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
	getMimeType : function (extension) {
		if (extension === 'jpg') {
			return 'image/jpeg';
		} else {
			return 'image/' + extension;
		}
	}
}

module.exports = postprocessor;