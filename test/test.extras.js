var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var yazl = require('yazl');
var yauzl = require('yauzl');
var carbone = require('../lib/index');

var PNG_A = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
var PNG_B = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
var DATA_URI_A = 'data:image/png;base64,' + PNG_A;
var DATA_URI_B = 'data:image/png;base64,' + PNG_B;

var W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  + 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
  + 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  + 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

// Word writes attributes on almost every paragraph, run, row and cell; the tests use the same shape
function para (text) {
  return '<w:p w14:paraId="1A2B3C4D" w:rsidR="00AB12CD"><w:r w:rsidRPr="00AB12CD"><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + text + '</w:t></w:r></w:p>';
}

function cell (text) {
  return '<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>' + para(text) + '</w:tc>';
}

function placeholderDrawing (marker) {
  return '<w:p w:rsidR="00AB12CD"><w:r w:rsidRPr="00AB12CD"><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
    + '<wp:extent cx="952500" cy="952500"/><wp:docPr id="1" name="Picture 1" descr="' + marker + '"/>'
    + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
    + '<pic:nvPicPr><pic:cNvPr id="1" name="placeholder.png"/><pic:cNvPicPr/></pic:nvPicPr>'
    + '<pic:blipFill><a:blip r:embed="rId9"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="952500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
    + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}

function buildDocx (bodyXml, callback) {
  var _zip = new yazl.ZipFile();
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Default Extension="png" ContentType="image/png"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>'), '[Content_Types].xml');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>'), '_rels/.rels');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document ' + W_NS + ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"><w:body>'
    + bodyXml + '</w:body></w:document>'), 'word/document.xml');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/placeholder.png"/>'
    + '</Relationships>'), 'word/_rels/document.xml.rels');
  _zip.addBuffer(Buffer.from(PNG_A, 'base64'), 'word/media/placeholder.png');
  _zip.end();
  var _chunks = [];
  _zip.outputStream.on('data', function (chunk) {
    _chunks.push(chunk);
  });
  _zip.outputStream.on('end', function () {
    callback(Buffer.concat(_chunks));
  });
}

function buildXlsx (rowsXml, callback) {
  var _zip = new yazl.ZipFile();
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    + '</Types>'), '[Content_Types].xml');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>'), '_rels/.rels');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'), 'xl/workbook.xml');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    + '</Relationships>'), 'xl/_rels/workbook.xml.rels');
  _zip.addBuffer(Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
    + rowsXml + '</sheetData></worksheet>'), 'xl/worksheets/sheet1.xml');
  _zip.end();
  var _chunks = [];
  _zip.outputStream.on('data', function (chunk) {
    _chunks.push(chunk);
  });
  _zip.outputStream.on('end', function () {
    callback(Buffer.concat(_chunks));
  });
}

function sheetRow (index, text) {
  return '<row r="' + index + '"><c r="A' + index + '" t="inlineStr"><is><t>' + text + '</t></is></c></row>';
}

function unzip (buffer, callback) {
  yauzl.fromBuffer(buffer, { lazyEntries : true }, function (err, zipfile) {
    if (err) {
      return callback(err);
    }
    var _files = {};
    zipfile.readEntry();
    zipfile.on('entry', function (entry) {
      zipfile.openReadStream(entry, function (err, stream) {
        var _chunks = [];
        stream.on('data', function (chunk) {
          _chunks.push(chunk);
        });
        stream.on('end', function () {
          _files[entry.fileName] = Buffer.concat(_chunks);
          zipfile.readEntry();
        });
      });
    });
    zipfile.on('end', function () {
      callback(null, _files);
    });
  });
}

var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carbone-extras-'));
var templateCount = 0;

function renderDocx (bodyXml, data, options, callback) {
  buildDocx(bodyXml, function (docx) {
    var _templatePath = path.join(tempDir, 'template' + (templateCount++) + '.docx');
    fs.writeFileSync(_templatePath, docx);
    carbone.render(_templatePath, data, options, function (err, result) {
      if (err) {
        return callback(err);
      }
      unzip(result, function (err, files) {
        if (err) {
          return callback(err);
        }
        callback(null, files, files['word/document.xml'].toString());
      });
    });
  });
}

function count (text, search) {
  return text.split(search).length - 1;
}

describe('extras', function () {

  after(function () {
    fs.rmSync(tempDir, { recursive : true, force : true });
  });

  describe('documents without extra formatters', function () {
    it('should not change leading spaces or arrays of plain values', function (done) {
      var _data = { name : ' Ada', list : [1, 2] };
      renderDocx(para('{d.name}|{d.list[0]}|{d.list[1]}'), _data, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('> Ada||<'), xml);
        done();
      });
    });

    it('should not modify the data passed to render', function (done) {
      var _data = { name : ' Ada', list : [1, 2], photo : DATA_URI_A, rows : [{ img : DATA_URI_B }] };
      var _copy = JSON.parse(JSON.stringify(_data));
      renderDocx(para('{d.name} {d.list[0]}'), _data, {}, function (err) {
        assert.equal(err, null);
        assert.deepStrictEqual(_data, _copy);
        done();
      });
    });

    it('should ignore extra formatter markers that come from the data', function (done) {
      var _data = { a : 'keep me :drop(p)', b : ':imageSize(http://127.0.0.1:9/x.png,10)', c : 'x:fontColor(FF0000)' };
      renderDocx(para('{d.a}') + para('{d.b}') + para('{d.c}'), _data, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('keep me :drop(p)'), xml);
        assert.ok(xml.includes(':imageSize(http://127.0.0.1:9/x.png,10)'), xml);
        assert.ok(!xml.includes('<w:drawing>'), xml);
        assert.ok(!xml.includes('<w:color'), xml);
        done();
      });
    });
  });

  describe('drop', function () {
    it('should remove only the paragraph that holds the marker', function (done) {
      var _body = para('first') + para('{d.empty:ifEM():drop(p)}second') + para('third');
      renderDocx(_body, { empty : '' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('first'), xml);
        assert.ok(!xml.includes('second'), xml);
        assert.ok(xml.includes('third'), xml);
        assert.ok(!xml.includes('drop'), xml);
        done();
      });
    });

    it('should keep the paragraph when the condition is false', function (done) {
      var _body = para('first') + para('{d.full:ifEM():drop(p)}second');
      renderDocx(_body, { full : 'x' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('second'), xml);
        assert.ok(!xml.includes('drop'), xml);
        done();
      });
    });

    it('should remove more than one hundred paragraphs', function (done) {
      var _body = '';
      for (var i = 0; i < 150; i++) {
        _body += para('{d.empty:ifEM():drop(p)}gone' + i);
      }
      _body += para('stay');
      renderDocx(_body, { empty : '' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.equal(count(xml, 'gone'), 0);
        assert.ok(xml.includes('stay'), xml);
        done();
      });
    });

    it('should remove a table row', function (done) {
      var _row = function (text) {
        return '<w:tr w:rsidR="00AB12CD">' + cell(text) + cell('x') + '</w:tr>';
      };
      var _body = '<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/></w:tblGrid>'
        + _row('row1') + _row('{d.empty:ifEM():drop(tr)}row2') + _row('row3') + '</w:tbl>' + para('after');
      renderDocx(_body, { empty : '' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('row1'), xml);
        assert.ok(!xml.includes('row2'), xml);
        assert.ok(xml.includes('row3'), xml);
        assert.ok(xml.includes('after'), xml);
        assert.equal(count(xml, '<w:tr '), 2);
        done();
      });
    });

    it('should remove a table column and keep the order of runs in other cells', function (done) {
      var _mixed = '<w:tc><w:tcPr/><w:p><w:r><w:t>A</w:t></w:r><w:hyperlink r:id="rId5"><w:r><w:t>B</w:t></w:r></w:hyperlink><w:r><w:t>C</w:t></w:r></w:p></w:tc>';
      var _body = '<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="2000"/><w:gridCol w:w="2000"/></w:tblGrid>'
        + '<w:tr w:rsidR="00AB12CD">' + _mixed + cell('{d.empty:ifEM():drop(tc)}head2') + cell('head3') + '</w:tr>'
        + '<w:tr w:rsidR="00AB12CD">' + cell('r1') + cell('r2') + cell('r3') + '</w:tr>'
        + '</w:tbl>';
      renderDocx(_body, { empty : '' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(!xml.includes('head2'), xml);
        assert.ok(!xml.includes('>r2<'), xml);
        assert.ok(xml.includes('head3'), xml);
        assert.ok(/A<\/w:t><\/w:r><w:hyperlink[^>]*><w:r><w:t>B<\/w:t><\/w:r><\/w:hyperlink><w:r><w:t>C/.test(xml), xml);
        assert.equal(count(xml, '<w:gridCol '), 2);
        assert.equal(count(xml, 'w:w="3000"/></w:tblGrid>'), 1, xml);
        done();
      });
    });
  });

  describe('pictures from the alternative text', function () {
    it('should give each repetition of a picture its own image', function (done) {
      var _body = placeholderDrawing('{d.rows[i].img}') + placeholderDrawing('{d.rows[i+1].img}');
      var _data = { rows : [{ img : DATA_URI_A }, { img : DATA_URI_B }, { img : DATA_URI_A }] };
      renderDocx(_body, _data, {}, function (err, files, xml) {
        assert.equal(err, null);
        var _rels = files['word/_rels/document.xml.rels'].toString();
        var _embeds = xml.match(/r:embed="[^"]+"/g);
        assert.equal(_embeds.length, 3);
        assert.notEqual(_embeds[0], _embeds[1]);
        assert.equal(_embeds[0], _embeds[2]);
        _embeds.forEach(function (embed) {
          var _id = embed.slice(9, -1);
          var _target = new RegExp('Id="' + _id + '"[^>]*Target="([^"]+)"').exec(_rels)[1];
          assert.ok(files['word/' + _target], 'missing ' + _target);
        });
        assert.ok(_rels.includes('Target="media/placeholder.png"'), _rels);
        assert.ok(!xml.includes('data:image'), 'data URI left in the document');
        done();
      });
    });

    it('should give each repetition of a picture its own drawing id', function (done) {
      var _body = placeholderDrawing('{d.rows[i].img}') + placeholderDrawing('{d.rows[i+1].img}');
      var _data = { rows : [{ img : DATA_URI_A }, { img : DATA_URI_B }, { img : DATA_URI_A }] };
      renderDocx(_body, _data, {}, function (err, files, xml) {
        assert.equal(err, null);
        var _ids = xml.match(/<wp:docPr id="\d+"/g);
        assert.equal(_ids.length, 3);
        assert.equal(new Set(_ids).size, 3, 'duplicate docPr ids ' + _ids);
        assert.equal(_ids[0], '<wp:docPr id="1"');
        done();
      });
    });
  });

  describe('imageSize', function () {
    it('should insert a picture from a data URI', function (done) {
      renderDocx(para('{d.photo:imageSize(50)}') + para('{d.photo:imageSize(20,10)}'), { photo : DATA_URI_A }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.equal(count(xml, '<w:drawing>'), 2, xml);
        assert.ok(!xml.includes('imageSize'), xml);
        var _ids = xml.match(/<wp:docPr id="(\d+)"/g);
        assert.equal(new Set(_ids).size, _ids.length, 'duplicate docPr ids ' + _ids);
        var _types = files['[Content_Types].xml'].toString();
        assert.equal(count(_types, 'Extension="png"'), 1, _types);
        assert.ok(xml.includes('cx="635000" cy="635000"'), xml);
        assert.ok(xml.includes('cx="254000" cy="127000"'), xml);
        done();
      });
    });

    it('should not download pictures from a URL unless imageUrls is enabled', function (done) {
      renderDocx(para('{d.photo:imageSize(50)}after'), { photo : 'http://127.0.0.1:9/photo.png' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(!xml.includes('<w:drawing>'), xml);
        assert.ok(!xml.includes('imageSize'), xml);
        assert.ok(xml.includes('after'), xml);
        done();
      });
    });

    it('should return an error when a picture cannot be downloaded', function (done) {
      renderDocx(para('{d.photo:imageSize(50)}'), { photo : 'http://127.0.0.1:9/photo.png' }, { imageUrls : true }, function (err) {
        assert.ok(err, 'expected an error');
        done();
      });
    });
  });

  describe('font formatters', function () {
    it('should style the run that holds the value', function (done) {
      renderDocx(para('{d.title:fontColor(#FF0000):fontBold()}') + para('plain'), { title : 'Hello' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(/<w:rPr><w:b\/><w:bCs\/><w:color w:val="FF0000"\/><w:sz w:val="20"\/><\/w:rPr><w:t xml:space="preserve">Hello<\/w:t>/.test(xml), xml);
        assert.ok(!xml.includes('fontColor'), xml);
        assert.equal(count(xml, '<w:color'), 1, xml);
        done();
      });
    });

    it('should reject a color that is not hexadecimal', function (done) {
      renderDocx(para('{d.title:fontColor(.color)}'), { title : 'Hello', color : '"/><w:b/><w:x a="' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(!xml.includes('<w:color'), xml);
        assert.ok(!xml.includes('<w:x'), xml);
        assert.ok(xml.includes('Hello'), xml);
        done();
      });
    });
  });

  describe('options', function () {
    it('should replace a leading space when keepLeadingSpace is set', function (done) {
      renderDocx(para('{d.name}'), { name : ' Ada' }, { keepLeadingSpace : true }, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('  Ada'), xml);
        done();
      });
    });

    it('should loop over arrays of plain values when wrapPrimitiveArrays is set', function (done) {
      renderDocx(para('{d.list[i].value}') + para('{d.list[i+1].value}'), { list : ['a', 'b'] }, { wrapPrimitiveArrays : true }, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('>a<') && xml.includes('>b<'), xml);
        done();
      });
    });
  });

  describe('trimTrailingParagraphs', function () {
    var EMPTY_ENDING = para('   ') + '<w:p/>' + '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + '<w:p><w:r><w:t>{d.note}</w:t></w:r></w:p>';

    it('should remove the empty paragraphs at the end of the document, also the ones left empty by markers', function (done) {
      renderDocx(para('Ada') + EMPTY_ENDING, { note : '' }, { trimTrailingParagraphs : true }, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('>Ada<'), xml);
        assert.equal(count(xml, '<w:p'), 1, xml);
        assert.equal(count(xml, 'w:type="page"'), 0, xml);
        done();
      });
    });

    it('should not change the document without the option', function (done) {
      renderDocx(para('Ada') + EMPTY_ENDING, { note : '' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.equal(count(xml, 'w:type="page"'), 1, xml);
        done();
      });
    });

    it('should keep a 1 point paragraph after a table that ends the document', function (done) {
      var _table = '<w:tbl><w:tr>' + cell('A') + '</w:tr></w:tbl>';
      renderDocx(para('Ada') + _table + para(' ') + '<w:p/>', {}, { trimTrailingParagraphs : true }, function (err, files, xml) {
        assert.equal(err, null);
        var _afterTable = xml.slice(xml.lastIndexOf('</w:tbl>'));
        assert.equal(count(_afterTable, '<w:p>'), 1, xml);
        assert.ok(_afterTable.includes('w:line="20" w:lineRule="exact"'), xml);
        done();
      });
    });

    it('should stop at a paragraph which prints something or carries a field, a bookmark or a section break', function (done) {
      var _field = '<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>';
      var _bookmark = '<w:p><w:bookmarkStart w:id="0" w:name="end"/><w:bookmarkEnd w:id="0"/></w:p>';
      var _section = '<w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:pPr></w:p>';
      renderDocx(para('Ada') + _field + _bookmark + _section + '<w:p/>', {}, { trimTrailingParagraphs : true }, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('PAGE') && xml.includes('w:name="end"') && xml.includes('<w:pPr><w:sectPr>'), xml);
        assert.equal(count(xml, '<w:p/>'), 0, xml);
        done();
      });
    });

    it('should keep the first paragraph of a document that has only empty paragraphs', function (done) {
      renderDocx(para(' ') + '<w:p/>', {}, { trimTrailingParagraphs : true }, function (err, files, xml) {
        assert.equal(err, null);
        assert.equal(count(xml, '<w:p'), 1, xml);
        done();
      });
    });
  });

  describe('more', function () {
    it('should remove a row of a sheet', function (done) {
      buildXlsx(sheetRow(1, 'first') + sheetRow(2, '{d.empty:ifEM():drop(row)}gone') + sheetRow(3, 'third'), function (xlsx) {
        var _templatePath = path.join(tempDir, 'template' + (templateCount++) + '.xlsx');
        fs.writeFileSync(_templatePath, xlsx);
        carbone.render(_templatePath, { empty : '' }, function (err, result) {
          assert.equal(err, null);
          unzip(result, function (err, files) {
            var _sheet = files['xl/worksheets/sheet1.xml'].toString();
            assert.ok(_sheet.includes('first'), _sheet);
            assert.ok(!_sheet.includes('gone'), _sheet);
            assert.ok(_sheet.includes('third'), _sheet);
            assert.ok(!_sheet.includes('drop'), _sheet);
            done();
          });
        });
      });
    });

    it('should keep the size of the picture with imageSize()', function (done) {
      renderDocx(para('{d.photo:imageSize()}'), { photo : DATA_URI_A }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('<wp:extent cx="9525" cy="9525"/>'), xml);
        done();
      });
    });

    it('should accept a formatter that returns a promise', function (done) {
      carbone.addFormatters({
        laterExclamation : function (d) {
          return new Promise(function (resolve) {
            setTimeout(resolve, 5, d + '!');
          });
        }
      });
      renderDocx(para('{d.name:laterExclamation()}'), { name : 'Ada' }, {}, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('>Ada!<'), xml);
        done();
      });
    });

    it('should change only the font size with fontOptions.fontSize', function (done) {
      var _body = '<w:p><w:r><w:rPr><w:b w:val="1"/><w:sz w:val="20"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p>';
      renderDocx(_body, { name : 'Ada' }, { fontOptions : { fontSize : 14 } }, function (err, files, xml) {
        assert.equal(err, null);
        assert.ok(xml.includes('<w:b w:val="1"/><w:sz w:val="28"/>'), xml);
        done();
      });
    });
  });

  describe('other template types', function () {
    it('should render an xml template', function (done) {
      var _templatePath = path.join(tempDir, 'template.xml');
      fs.writeFileSync(_templatePath, '<root>{d.name}</root>');
      carbone.render(_templatePath, { name : 'Ada' }, function (err, result) {
        assert.equal(err, null);
        assert.equal(result.toString(), '<root>Ada</root>');
        done();
      });
    });
  });
});
