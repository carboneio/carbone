var postprocessor = require('../lib/postprocessor');
var helper = require('../lib/helper');
var dynpics = require('../lib/dynpics');

describe.only('postprocessor', function () {

	describe('Dynpics ODT with public links (can takes time to request pictures)', function () {

		var xmlContent = '<xml><draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
							'<draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
							'<draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
		var expectedXmlContent = '<xml><draw:image xlink:href="Pictures/CarbonePicture0.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
						'<draw:image xlink:href="Pictures/CarbonePicture1.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
						'<draw:image xlink:href="Pictures/CarbonePicture2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
		var contentTypeXml = '<Types></Types>';
		var expectedContentTypeXml = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';
		var manifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"></manifest:manifest>';
		var expectedManifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>';
		var report = {
			files : [
				{
					name : '[Content_Types].xml',
					data : contentTypeXml
				},
				{
					name : 'content.xml',
					data : xmlContent
				},
				{
					name : 'META-INF/manifest.xml',
					data : manifest
				}
			]
		}
		var expectedReport = {
			files : [
				{
					name : '[Content_Types].xml',
					data : expectedContentTypeXml
				},
				{
					name : 'content.xml',
					data : expectedXmlContent
				},
				{
					name : 'META-INF/manifest.xml',
					data : expectedManifest
				}
			]
		}

		it('should replace dynpics links by embedded pictures', function (done) {
			postprocessor.embedOdtPictures(report, {}, {}, function (err, result) {
				helper.assert(dynpics.getTemplate(result, 'content.xml'), dynpics.getTemplate(expectedReport, 'content.xml'));
				done();
			});
		});

		it('should add dynpics in manifest', function (done) {
			postprocessor.embedOdtPictures(report, {}, {}, function (err, result) {
				var resultManifest = dynpics.getTemplate(expectedReport, 'META-INF/manifest.xml').data;
				var pic0Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/>');
				var pic1Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/>');
				var pic2Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/>');

				helper.assert(pic0Match.length, 1);
				helper.assert(pic1Match.length, 1);
				helper.assert(pic2Match.length, 1);
				done();
			});
		});

	});

	describe('Dynpics ODT with base64 pictures', function () {

		var xmlContent = '<xml><draw:image xlink:href="$picture0" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
							'<draw:image xlink:href="$picture1" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
							'<draw:image xlink:href="$picture2" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
		var expectedXmlContent = '<xml><draw:image xlink:href="Pictures/CarbonePicture0.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
						'<draw:image xlink:href="Pictures/CarbonePicture1.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
						'<draw:image xlink:href="Pictures/CarbonePicture2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
		var contentTypeXml = '<Types></Types>';
		var expectedContentTypeXml = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';
		var manifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"></manifest:manifest>';
		var expectedManifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>';
		var report = {
			files : [
				{
					name : '[Content_Types].xml',
					data : contentTypeXml
				},
				{
					name : 'content.xml',
					data : xmlContent
				},
				{
					name : 'META-INF/manifest.xml',
					data : manifest
				}
			]
		}
		var expectedReport = {
			files : [
				{
					name : '[Content_Types].xml',
					data : expectedContentTypeXml
				},
				{
					name : 'content.xml',
					data : expectedXmlContent
				},
				{
					name : 'META-INF/manifest.xml',
					data : expectedManifest
				}
			]
		}

		it('should replace dynpics links by embedded pictures', function (done) {
			postprocessor.embedOdtPictures(report, {
				$picture0: {
					data: new Buffer('cat').toString('base64'),
					extension: 'jpeg'
				},
				$picture1: {
					data: new Buffer('dog').toString('base64'),
					extension: 'jpeg'
				},
				$picture2: {
					data: new Buffer('doggo').toString('base64'),
					extension: 'jpeg'
				}
			}, {}, function (err, result) {
				helper.assert(dynpics.getTemplate(result, 'content.xml'), dynpics.getTemplate(expectedReport, 'content.xml'));
				done();
			});
		});

		it('should add dynpics in manifest and push files', function (done) {
			postprocessor.embedOdtPictures(report, {
				$picture0: {
					data: new Buffer('cat').toString('base64'),
					extension: 'jpeg'
				},
				$picture1: {
					data: new Buffer('dog').toString('base64'),
					extension: 'jpeg'
				},
				$picture2: {
					data: new Buffer('doggo').toString('base64'),
					extension: 'jpeg'
				}
			}, {}, function (err, result) {
				var resultManifest = dynpics.getTemplate(expectedReport, 'META-INF/manifest.xml').data;
				var pic0Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/>');
				var pic1Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/>');
				var pic2Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/>');
				var pic0File = result.files.find(function (file) {
					return file.name === 'Pictures/CarbonePicture0.jpg'
				});
				var pic1File = result.files.find(function (file) {
					return file.name === 'Pictures/CarbonePicture1.jpg'
				});
				var pic2File = result.files.find(function (file) {
					return file.name === 'Pictures/CarbonePicture2.jpg'
				});

				helper.assert(pic0Match.length, 1);
				helper.assert(pic1Match.length, 1);
				helper.assert(pic2Match.length, 1);
				helper.assert(pic0File.data.toString(), 'cat');
				helper.assert(pic1File.data.toString(), 'dog');
				helper.assert(pic2File.data.toString(), 'doggo');
				done();
			});
		});

	});

	describe('Dynpics DOCX (can takes time to request pictures)', function () {

		var rels = '<Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" TargetMode="External"/></Relationships>';
		var expectedRels = '<Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture0.jpg"/></Relationships>';
		var _rels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="rId1" /></Relationships>';
		var report = {
			files : [
				{
					name: '_rels/.rels',
					data: _rels
				},
				{
					name: 'word/document.xml',
					data : ''
				},
				{
					name : '[Content_Types].xml',
					data : '<Types></Types>'
				},
				{
					name : 'word/_rels/document.xml.rels',
					data : rels
				}
			]
		}

		it('should edit rels', function (done) {
			postprocessor.embedDocxPictures(report, {}, {}, function (err, result) {
				var gotRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels').data;
				helper.assert(gotRels, expectedRels);
				done();
			});
		});

		it('should do nothing (pictures does not exist)', function (done) {
			report.files[3].data = '<Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://thissitedoesnot.exist" TargetMode="External"/></Relationships>';

			postprocessor.embedDocxPictures(report, {}, {}, function (err, result) {
				var gotRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels').data;
				helper.assert(gotRels, report.files[3].data);
				done();
			});
		});

	});

});