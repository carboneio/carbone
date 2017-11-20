var dynpics = {
	getTemplate : function (mainTemplate, name) {
		for (var i = 0; i < mainTemplate.files.length; i++) {
			if (mainTemplate.files[i].name === name) {
				return mainTemplate.files[i];
			} else if (i === mainTemplate.files.length - 1) {
				return null;
			}
		}
	},
	isMarker : function (string) {
		return string.match(/{.*?}/) !== null;
	},
	getDocxPictures : function (xml, callback) {
		var picturesRegex = /<w:drawing>[\s\S]*?<wp:docPr.*?descr="(.*?)".*?>[\s\S]*?<pic:pic.*?>[\s\S]*?<\/w:drawing>/ig;
		var picture = picturesRegex.exec(xml);
		var pictures = [];

		while (picture) {
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
	createDocxRels : function (mainTemplate, pictures, callback) {
		var contentFile = this.getTemplate(mainTemplate, 'word/document.xml');
		var relsFile = this.getTemplate(mainTemplate, 'word/_rels/document.xml.rels');
		var relTemplate = '<Relationship Id="{REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{REL_TARGET}" TargetMode="External"/>';

		for (var i = 0; i < pictures.length; i++) {
			var relId = pictures[i].carboneValue.replace('}', ':md5:prepend(id)}');
			var relTarget = pictures[i].carboneValue;
			var rel;
			var newPicXml;

			rel = relTemplate.replace('{REL_ID}', relId);
			rel = rel.replace('{REL_TARGET}', relTarget);
			newPicXml = pictures[i].xml.replace(/<a:blip r:embed=".*?">/g, '<a:blip r:link="' + relId + '">');
			contentFile.data = contentFile.data.replace(pictures[i].xml, newPicXml);
			pictures[i].xml = newPicXml;
			relsFile.data = relsFile.data.replace('</Relationships>', rel + '</Relationships>');
			if (i === pictures.length - 1) {
				return callback();
			}
		}
	},
	manageDocx : function (mainTemplate) {
		var contentFile = this.getTemplate(mainTemplate, 'word/document.xml');
		var relsFile = this.getTemplate(mainTemplate, 'word/_rels/document.xml.rels');
		var that = this;

		this.getDocxPictures(contentFile.data, function (pictures) {
			that.createDocxRels(mainTemplate, pictures, function () {
				
			});
		});
	}
}

module.exports = dynpics;