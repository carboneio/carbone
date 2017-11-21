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
     * Get all dynamic picture in document xml (DOCX ONLY)
     * @param  {String}		xml
     * @param  {Function}	callback With found pictures in parameter
     */
	getDocxPictures : function (xml, callback) {
		var picturesRegex = /<w:drawing>[\s\S]*?<wp:docPr.*?descr="(.*?)".*?>[\s\S]*?<pic:pic.*?>[\s\S]*?<\/w:drawing>/ig;
		var picture = picturesRegex.exec(xml);
		var pictures = [];

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
				return callback(pictures);
			}
		}
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
		var picturesRegex = /(?:<text:p.*?>[\S\s]*?)?<draw:frame.*?>[\S\s]*?<draw:image.*?>[\S\s]*?<svg:title>(.*?)<\/svg:title>[\S\s]*?<\/draw:frame>(?:[\S\s]*?<\/text:p>)?/ig;
		var markersRegex = /{.*?}/g;
		var picture = picturesRegex.exec(xml);
		var pictures = [];
		var markers;

		while (picture) {
			// If the matched picture is dynamic (has Carbone marker)
			if (this.isMarker(picture[1])) {
				markers = this.matchesToArray(markersRegex, picture[1]);
				pictures.push({
					xml          : picture[0],
					carboneValue : this.getLoopValue(markers),
					loopBefore   : this.getLoopBefore(markers),
					loopAfter    : this.getLoopAfter(markers)
				});
			}
			picture = picturesRegex.exec(xml);
			if (!picture) {
				return callback(pictures);
			}
		}
	},
	/**
     * Create rels in rels file and replace a:blip value to link to created rel
     * @param {Object}		mainTemplate
     * @param {Array}		pictures 		Found pictures
     * @param {Function}	callback
     */
	createDocxRels : function (mainTemplate, pictures, callback) {
		var contentFile = this.getTemplate(mainTemplate, 'word/document.xml');
		var relsFile = this.getTemplate(mainTemplate, 'word/_rels/document.xml.rels');
		var relTemplate = '<Relationship Id="{REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{REL_TARGET}" TargetMode="External"/>';

		for (var i = 0; i < pictures.length; i++) {
			var relId = pictures[i].carboneValue.replace('}', ':md5:prepend(id)}');
			var relTarget = pictures[i].carboneValue;
			var rel;
			var newPicXml;

			// Replace values in relTemplate
			rel = relTemplate.replace('{REL_ID}', relId);
			rel = rel.replace('{REL_TARGET}', relTarget);
			// Create new xml picture
			newPicXml = pictures[i].xml.replace(/<a:blip r:embed=".*?">/g, '<a:blip r:link="' + relId + '">');
			// Replace xml picture
			contentFile.data = contentFile.data.replace(pictures[i].xml, newPicXml);
			pictures[i].xml = newPicXml;
			// Add new rel
			relsFile.data = relsFile.data.replace('</Relationships>', rel + '</Relationships>');
			if (i === pictures.length - 1) {
				return callback();
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
     * @param {Object}		mainTemplate 	Template given vy Carbone
     * @param {Array}  		pictures 		Array of dynamic pictures
     * @param {Function}	callback 		Nothing returned
     */
	replaceOdtPicture : function (mainTemplate, pictures, callback) {
		var contentFile = this.getTemplate(mainTemplate, 'content.xml');

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
     * Manage DOCX dynamic pictures
     * @param  {Object} mainTemplate
     */
	manageDocx : function (mainTemplate) {
		var contentFile = this.getTemplate(mainTemplate, 'word/document.xml');
		var relsFile = this.getTemplate(mainTemplate, 'word/_rels/document.xml.rels');
		var that = this;

		// Get all dynamic pictures in document
		this.getDocxPictures(contentFile.data, function (pictures) {
			// Create rels and link to rels
			that.createDocxRels(mainTemplate, pictures, function () {
				
			});
		});
	},
	/**
     * Manage ODT dynamic pictures
     * @param  {Object} mainTemplate
     */
	manageOdt : function (mainTemplate) {
		var contentFile = this.getTemplate(mainTemplate, 'content.xml');
		var that = this;

		if (!contentFile) {
			return;
		}
		this.getOdtPictures(contentFile.data, function (pictures) {
			that.replaceOdtPicture(mainTemplate, pictures, function () {
			});
		});
	}
}

module.exports = dynpics;