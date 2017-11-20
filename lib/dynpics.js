var dynpics = {
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
     * Create rels in rels file and replace a:blip value to link to created rel (DOCX ONLY)
     * @param  {Object}		mainTemplate
     * @param  {Array}		pictures 		Found pictures
     * @param  {Function}	callback
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
	}
}

module.exports = dynpics;