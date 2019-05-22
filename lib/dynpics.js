const path = require('path');

var dynpics = {
	/**
     * Put all regex results in array
     * @param  {Regex}	regex
     * @param  {String}	subject
     * @return {Array}
     */
	matchesToArray : function (regex, subject) {
		var result = regex.exec(subject);
		var array = [];

		while (result) {
			array.push(result[0]);
			result = regex.exec(subject);
			if (!result) {
				return array;
			}
		}
	},
	/**
     * Get specific template in template list
     * @param  {Object}		mainTemplate	Template list
     * @param  {String}		name			Template name to get
     * @return {Object|null} 				Found template, or null
     */
	getTemplate : function (mainTemplate, name) {
		for (var i = 0; i < mainTemplate.files.length; i++) {
			if (mainTemplate.files[i].name === name) {
				return mainTemplate.files[i];
			} else if (i === mainTemplate.files.length - 1) {
				return null;
			}
		}
	},
	/**
     * Test if a string is a marker (string with braces)
     * @param  {String}	name String to test
     * @return {Boolean}
     */
	isMarker : function (string) {
		return string.match(/{.*?}/) !== null;
	},
	/**
	 * Get all dynamic picture in document xml (DOCX ONLY).
	 * @param  {String}		xml document xml
	 * @param  {Function}	callback pictures
	 */
	getDocxPictures : function (xml, callback) {
		// This regex retrieves every picture
		var picturesRegex = /<w:drawing>[\s\S]*?<wp:docPr.*?descr="(.*?)".*?>[\s\S]*?<pic:pic.*?>[\s\S]*?<\/w:drawing>/ig;
		var picture = picturesRegex.exec(xml);
		var pictures = [];

		if (!picture) {
			return callback(pictures);
		} else {
			while (picture) {
				// If the matched picture is dynamic (has Carbone marker)
				if (this.isMarker(picture[1])) {
					pictures.push({
						xml          : picture[0],
						carboneValue : picture[1]
					});
				}
				picture = picturesRegex.exec(xml);
				if (!picture) {
					// If we have no more match,
					// we're done
					return callback(pictures);
				}
			}
		}
	},
	/**
	 * Get every documents in the template with this format:
	 ```
   {
     // Document name
     name        : 'content.xml',
     // Path to the document xml
     contentPath : 'path/to/content.xml',
     // Path to the relations file
     relsPath    : 'path/to/content.xml.rels'
   }
	 ```
	 * @param {Object} template Carbone template
	 * @param {Function} callback documents
	 */
	getDocxDocuments : function (template, callback) {
		// This is the root relations file with the documents path inside
		const _rootRelsFilename = '_rels/.rels';
		const _rootRels = this.getTemplate(template, _rootRelsFilename);
		if (!_rootRels) {
			return callback(null, []);
		}
		const _relsXml = _rootRels.data.toString();
		const _documentRegex = /<Relationship.*?officeDocument.*Target="(.*?)".*>/g;
		const _documents = [];

		// Match every document reference in the relations file
		for (let _match = _documentRegex.exec(_relsXml); _match; _match = _documentRegex.exec(_relsXml)) {
			const _docPath = _match[1].slice(1);
			const _docName = path.basename(_docPath);

			// Push the found document in the array
			_documents.push({
				contentPath: _docPath,
				name: _docName,
				relsPath: path.join('word', '_rels', _docName + '.rels')
			});
		}

		callback(null, _documents);
	},
	/**
     * Get center element of an array
     * @param  {Array}	markers
     * @return {*}
     */
	getLoopValue : function (markers) {
		return markers[Math.floor(markers.length / 2)];
	},
	/**
     * Get half of an array
     * @param  {Array}	markers
     * @return {*}
     */
	getLoopBefore : function (markers) {
		var result = [];

		for (var i = 0; i <= markers.length / 2 - 1; i++) {
			result.push(markers[i]);
		}
		return result;
	},
	/**
     * Get other half of an array
     * @param  {Array}	markers
     * @return {*}
     */
	getLoopAfter : function (markers) {
		var result = [];

		for (var i = Math.ceil(markers.length / 2); i < markers.length; i++) {
			result.push(markers[i]);
		}
		return result;
	},
	/**
     * Get Odt dynamic pictures in given xml
     * @param  {String}		xml
     * @param  {Function}	callback 	With found pictures
     */
	getOdtPictures : function (xml, callback) {
		var picturesRegex = /<draw:image.*?>[\S\s]*?<svg:title>(.*?)<\/svg:title>/i;
		var markersRegex = /{.*?}/g;
		var picture;
		var pictures = [];
		var markers;
		var that = this;

		this.getRootTag('text:p', xml, function (drawFrames) {
			for (var i = 0; i < drawFrames.length; i++) {
				picture = picturesRegex.exec(drawFrames[i]);

				// If the element is not recognized as a picture
				if (!picture) {
					// And it's the end of the elements array
					if (i === drawFrames.length - 1) {
						return callback(pictures);
					}
					continue;
				} else {
					// If the matched picture is dynamic (has Carbone marker)
					if (that.isMarker(picture[1])) {
						markers = that.matchesToArray(markersRegex, picture[1]);
						pictures.push({
							xml          : drawFrames[i],
							carboneValue : that.getLoopValue(markers),
							loopBefore   : that.getLoopBefore(markers),
							loopAfter    : that.getLoopAfter(markers)
						});
					}
					if (i === drawFrames.length - 1) {
						return callback(pictures);
					}
				}
			}
		});
	},
	/**
     * Get given tag content. Tag is at root of xml
     * @param  {String}		tag
     * @param  {String}		xml
     * @param  {Function}	callback
     */
	getRootTag : function (tag, xml, callback) {
		var regex = /<(\/)?(.*?)(\/)?>/ig;
		var match = regex.exec(xml);
		var result = [];
		var tagName;
		var closingType;
		var count = 0;
		var pos = null;

		if (!match) {
			return callback(null);
		} else {
			// Each tag
			while (match) {
				tagName = match[2].split(' ')[0];
				// Set closing type (close / self closing / open)
				if (match[1]) {
					closingType = '>';
				} else if (match[3]) {
					closingType = 'x';
				} else {
					closingType = '<';
				}
				// If the current tag is the one we want
				if (tagName === tag) {
					if (closingType === '<') {
						count++;
					} else if (closingType === '>') {
						count--;
					}
				}
				// Start of content we want
				if (count === 1 && !pos) {
					pos = {};
					pos.start = match.index;
				} else if (count === 0 && pos) {
					// End of content we want
					pos.end = match.index + match[0].length;
					var xmlContent = xml.slice(pos.start, pos.end);
					result.push(xmlContent)
					pos = null;
				}
				match = regex.exec(xml);
				if (!match) {
					return callback(result);
				}
			}
		}
	},
	/**
     * Create rels in rels file and replace a:blip value to link to created rel
     * @param {Object}		mainTemplate
     * @param {Array}		pictures 		Found pictures
     * @param {Function}	callback
     */
	createDocxRels : function (mainTemplate, contentFile, relsFile, pictures, callback) {
		var relTemplate = '<Relationship Id="{REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{REL_TARGET}" TargetMode="External"/>';

		if (pictures.length === 0) {
			return callback();
		} else {
			for (var i = 0; i < pictures.length; i++) {
				var relId = pictures[i].carboneValue.replace('}', ':md5:prepend(rId)}');
				var relTarget = pictures[i].carboneValue;
				var rel;
				var newPicXml;

				// Replace values in relTemplate
				rel = relTemplate.replace('{REL_ID}', relId);
				rel = rel.replace('{REL_TARGET}', relTarget);
				// Create new xml picture
				newPicXml = pictures[i].xml.replace(/<a:blip r:embed=".*?">/g, '<a:blip r:embed="' + relId + '">');
				// Replace xml picture
				contentFile.data = contentFile.data.replace(pictures[i].xml, newPicXml);
				pictures[i].xml = newPicXml;
				// Add new rel
				relsFile.data = relsFile.data.replace('</Relationships>', rel + '</Relationships>');
				if (i === pictures.length - 1) {
					return callback();
				}
			}
		}
	},
	/**
     * Wrap array elements in Odt tag paragraph
     * @param  {Array}	array
     * @return {Array}  result	Array with wrapped elements
     */
	wrapInParagraph : function (array) {
		var template = '<text:p text:style-name="P1">{CONTENT}</text:p>';
		var result = [];

		for (var i = 0; i < array.length; i++) {
			result.push(template.replace('{CONTENT}', array[i]));
		}
		return result;
	},
	/**
     * Get before and after blocks for given picture
     * @param  {Object}	picture
     * @return {Object} result
     */
	getBeforeAfter : function (picture) {
		var result = {
			before : '',
			after : ''
		}
		result.before = this.wrapInParagraph(picture.loopBefore).join('');
		result.after = this.wrapInParagraph(picture.loopAfter).join('');
		return result;
	},
	/**
     * Replace Odt dynamic pictures by correct Carbone tags
     * @param {Object}		mainTemplate 	Template given by Carbone
     * @param {Array}  		pictures 		Array of dynamic pictures
     * @param {Function}	callback 		Nothing returned
     */
	replaceOdtPicture : function (mainTemplate, pictures, callback) {
		var contentFile = this.getTemplate(mainTemplate, 'content.xml');

		if (pictures.length === 0) {
			return callback();
		}
		for (var i = 0; i < pictures.length; i++) {
			var newPicXml;
			var beforeAfter = this.getBeforeAfter(pictures[i]);
			var before = beforeAfter.before;
			var after = beforeAfter.after;

			// Create new xml picture
			newPicXml = pictures[i].xml.replace(/xlink:href=".*?"/g, 'xlink:href="' + pictures[i].carboneValue + '"');
			newPicXml = before + newPicXml + after;
			newPicXml = newPicXml.replace(/<svg:title>.*?<\/svg:title>/g, '<svg:title></svg:title>');
			// Replace xml picture
			contentFile.data = contentFile.data.replace(pictures[i].xml, newPicXml);
			pictures[i].xml = newPicXml;
			if (i === pictures.length - 1) {
				return callback();
			}
		}
	},
	/**
	 * Preprocess DOCX document for dynamic pictures.
	 * @param  {Object} template
	 * @param  {Function} callback error, template
	 */
	manageDocx : function (template, callback) {
		var _that = this;

		// Retrieve docx documents to preprocess them on by one
		this.getDocxDocuments(template, function (err, documents) {
			if (err) {
				return callback(err);
			}

			// Preprocess documents
			_that.preprocessDocxDocuments(template, documents, function (err, template) {
				// We're done
				callback(err, template);
			});
		});
	},
	/**
	 * Preprocess documents list.
	 * @param {Object} template Carbone template
	 * @param {Array} documents Documents list
	 * @param {Function} callback error, template
	 */
	preprocessDocxDocuments : function (template, documents, callback) {
		let _count = documents.length;

		// Loop on documents
		for (let i = 0; i < _count; i++) {
			const _document = documents[i];

			// Preprocess the document
			this.preprocessDocxDocument(template, _document, err => {
				if (--_count === 0) {
					// If it was the last one,
					// we're done
					return callback(null, template);
				}
			});
		}
	},
	/**
	 * Preprocess a single docx document.
	 * @param {Object} template Carbone template
	 * @param {Object} document Document to preprocess
	 * @param {Function} callback error, template
	 */
	preprocessDocxDocument : function (template, document, callback) {
		// We have to retrieve the corresponding document xml and
		// the relations file
		var _contentFile = this.getTemplate(template, document.contentPath);
		var _relsFile = this.getTemplate(template, document.relsPath);
		var _that = this;

		if (!_contentFile) {
			return callback(null, template);
		}
		// Get all dynamic pictures in the document
		this.getDocxPictures(_contentFile.data, function (pictures) {
			// Create the new relations
			_that.createDocxRels(template, _contentFile, _relsFile, pictures, function () {
				return callback(null, template);
			});
		});
	},
	/**
     * Manage ODT dynamic pictures
     * @param  {Object} mainTemplate
     */
	manageOdt : function (mainTemplate, callback) {
		var contentFile = this.getTemplate(mainTemplate, 'content.xml');
		var that = this;

		if (callback === undefined) {
			callback = function () {
			}
		}
		if (!contentFile) {
			return callback();
		}
		this.getOdtPictures(contentFile.data, function (pictures) {
			that.replaceOdtPicture(mainTemplate, pictures, function () {
				return callback(null, mainTemplate);
			});
		});
	}
}

module.exports = dynpics;