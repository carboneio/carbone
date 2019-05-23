var postprocessor = require('../lib/postprocessor');
var helper = require('../lib/helper');
var dynpics = require('../lib/dynpics');

describe('postprocessor', function () {
  describe('Dynamic pictures', function () {
    describe('ODT', function () {
      describe('Public links (can takes time to request pictures)', function () {
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
          files: [
            {
              name: '[Content_Types].xml',
              data: contentTypeXml
            },
            {
              name: 'content.xml',
              data: xmlContent
            },
            {
              name: 'META-INF/manifest.xml',
              data: manifest
            }
          ]
        }
        var expectedReport = {
          files: [
            {
              name: '[Content_Types].xml',
              data: expectedContentTypeXml
            },
            {
              name: 'content.xml',
              data: expectedXmlContent
            },
            {
              name: 'META-INF/manifest.xml',
              data: expectedManifest
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
      describe('Base64 pictures in data', function () {
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
          files: [
            {
              name: '[Content_Types].xml',
              data: contentTypeXml
            },
            {
              name: 'content.xml',
              data: xmlContent
            },
            {
              name: 'META-INF/manifest.xml',
              data: manifest
            }
          ]
        }
        var expectedReport = {
          files: [
            {
              name: '[Content_Types].xml',
              data: expectedContentTypeXml
            },
            {
              name: 'content.xml',
              data: expectedXmlContent
            },
            {
              name: 'META-INF/manifest.xml',
              data: expectedManifest
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
    });

    describe('DOCX', function () {
      describe('Common logic', function () {

        it('should retrieve document', function (done) {
          var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="rId1" /></Relationships>';
          var _template = {
            files: [
              {
                name: '_rels/.rels',
                data: _rootRels
              }
            ]
          };
          var _expectedDocuments = [
            {
              contentPath : 'word/document.xml',
              name        : 'document.xml',
              relsPath    : 'word/_rels/document.xml.rels'
            }
          ];

          dynpics.getDocxDocuments(_template, function (err, documents) {
            helper.assert(err, null);
            helper.assert(documents, _expectedDocuments);
            done();
          });
        });

        it('should add a content type', function (done) {
          var _template = {
            files : [
              {
                name : '[Content_Types].xml',
                data : '<Types></Types>'
              }
            ]
          };
          var _expectedContentFile = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';

          postprocessor.addDocxContentType(_template, 'jpg', function (newContent) {
            helper.assert(newContent, _expectedContentFile);
            done();
          });
        });

      });

      describe('Public links (can takes time to request pictures)', function () {
        var _documentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" TargetMode="External"/></Relationships>';
        var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="rId1" /></Relationships>';
        var report = {
          files: [
            {
              name: '_rels/.rels',
              data: _rootRels
            },
            {
              name: 'word/document.xml',
              data: ''
            },
            {
              name: '[Content_Types].xml',
              data: '<Types></Types>'
            },
            {
              name: 'word/_rels/document.xml.rels',
              data: _documentRels
            }
          ]
        };

        it('should embed dynamic picture', function (done) {
          var _expectedRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture0.jpg"/></Relationships>';

          postprocessor.embedDocxPictures(report, {}, {}, function (err, result) {
            var gotRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels').data;
            var _picture = result.files.find(function (element) {
              return element.name === 'media/CarbonePicture0.jpg'
            });

            helper.assert(gotRels, _expectedRels);
            helper.assert(_picture.data.constructor === Buffer, true);
            done();
          });
        });

        it('should do nothing (picture url points to nothing)', function (done) {
          var _report = JSON.parse(JSON.stringify(report));

          _report.files[3].data = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://thissitedoesnot.exist" TargetMode="External"/></Relationships>';
          postprocessor.embedDocxPictures(_report, {}, {}, function (err, result) {
            helper.assert(err, null);
            helper.assert(result, _report);
            done();
          });
        });

        it('should retrieve the picture thanks to the found relation', function (done) {
          var _relation = {
            uri     : 'https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg',
            fileXml : '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" TargetMode="External"/></Relationships>'
          };
          var _expectedDocumentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture1337.jpg"/></Relationships>';

          postprocessor.retrieveDocxPictureByRelation({}, _relation, 1337, function (err, picture, newRelations) {
            helper.assert(err, null);
            helper.assert(picture.name, 'media/CarbonePicture1337.jpg');
            helper.assert(picture.extension, 'jpg');
            helper.assert(picture.data.constructor, Buffer);
            helper.assert(newRelations, _expectedDocumentRels);
            done();
          });
        });

        it('should throw error (dead link)', function (done) {
          var _relation = {
            uri     : 'http://nothing.nowhere',
            fileXml : '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://nothing.nowhere" TargetMode="External"/></Relationships>'
          };

          postprocessor.retrieveDocxPictureByRelation({}, _relation, 1337, function (err, picture, newRelations) {
            helper.assert(err !== null, true);
            helper.assert(picture, undefined);
            helper.assert(newRelations, undefined);
            done();
          });
        });
      });

      describe('Base64 pictures in data', function () {
        it('should edit rels and push pictures', function (done) {
          var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="rId1" /></Relationships>';
          var _documentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>';
          var _documentContent = '';
          var _contentTypesContent = '<Types></Types>';

          var _expectedDocumentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture0.jpg"/></Relationships>';

          var _report = {
            files: [
              {
                name: '_rels/.rels',
                data: _rootRels
              },
              {
                name: 'word/document.xml',
                data: _documentContent
              },
              {
                name: '[Content_Types].xml',
                data: _contentTypesContent
              },
              {
                name: 'word/_rels/document.xml.rels',
                data: _documentRels
              }
            ]
          }
          var _pictureContent = 'myPictureContent'
          var _pictureData = new Buffer(_pictureContent).toString('base64');

          postprocessor.embedDocxPictures(_report, {
            $picture: {
              data: _pictureData,
              extension: 'jpg'
            }
          }, {}, function (err, result) {
            var _picture = dynpics.getTemplate(result, 'media/CarbonePicture0.jpg');
            var _resultDocumentRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels');

            helper.assert(err, null);
            helper.assert(_resultDocumentRels.data, _expectedDocumentRels);
            helper.assert(_picture.data.toString('base64'), _pictureData);
            done();
          });
        });

        it('should do nothing (no picture given but referenced in the template)', function (done) {
          var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="rId1" /></Relationships>';
          var _documentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>';
          var _documentContent = '';
          var _contentTypesContent = '<?xml version="1.0" encoding="utf-8"?><Types></Types>';

          var _report = {
            files: [
              {
                name: '_rels/.rels',
                data: _rootRels
              },
              {
                name: 'word/document.xml',
                data: _documentContent
              },
              {
                name: '[Content_Types].xml',
                data: _contentTypesContent
              },
              {
                name: 'word/_rels/document.xml.rels',
                data: _documentRels
              }
            ]
          }

          postprocessor.embedDocxPictures(JSON.parse(JSON.stringify(_report)), {}, {}, function (err, result) {
            helper.assert(err, null);
            helper.assert(result, _report);
            done();
          });
        });
      });
    });
  });

});