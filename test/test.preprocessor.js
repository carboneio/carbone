var preprocessor = require('../lib/preprocessor');
var helper = require('../lib/helper');
const should = require('should');

describe('preprocessor', function () {
  describe('execute', function () {
    it('should do nothing if the file is an empty object', function (done) {
      preprocessor.execute({}, function (err, tmpl) {
        helper.assert(err+'', 'null');
        helper.assert(tmpl, {});
        done();
      });
    });
    it('should do nothing if the file is null', function (done) {
      preprocessor.execute(null, function (err, tmpl) {
        helper.assert(err + '', 'null');
        helper.assert(tmpl, null);
        done();
      });
    });
    describe('XSLX preprocessing', function () {
      var _sharedStringBefore = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si>'
                              + '<t>{d.name}</t></si><si><t>{d.id}</t></si></sst>';
      // var _sharedStringAfter  = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si>'
      //                        + '<t></t></si><si><t></t></si></sst>';
      var _sheetBefore  = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:C3"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><selection activeCell="C3" sqref="C3"/></sheetView></sheetViews><sheetFormatPr baseColWidth="10" defaultRowHeight="15" x14ac:dyDescent="0"/><sheetData>\n'
                        + '<row r="1" spans="1:3"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>\n'
                        + '<row r="2" spans="1:3"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>100</v></c><c r="C2"><f>B2*100</f><v>10000</v></c></row>\n'
                        + '<row r="3" spans="1:3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c><c r="C3" t="e"><f>B3*100</f><v>#VALUE!</v></c></row>\n'
                        + '</sheetData><pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/><extLst><ext uri="{64002731-A6B0-56B0-2670-7721B7C09600}" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main"><mx:PLV Mode="0" OnePage="0" WScale="0"/></ext></extLst></worksheet>';
      var _sheetAfter   = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:C3"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><selection activeCell="C3" sqref="C3"/></sheetView></sheetViews><sheetFormatPr baseColWidth="10" defaultRowHeight="15" x14ac:dyDescent="0"/><sheetData>\n'
                        + '<row  ><c  t="inlineStr"><is><t>Nom</t></is></c><c  t="inlineStr"><is><t xml:space="preserve">Id </t></is></c><c  t="inlineStr"><is><t>TOTAL</t></is></c></row>\n'
                        + '<row  ><c  t="inlineStr"><is><t>tata</t></is></c><c ><v>100</v></c><c ><f>B2*100</f><v>10000</v></c></row>\n'
                        + '<row  ><c  t="inlineStr"><is><t>{d.name}</t></is></c><c  t="inlineStr"><is><t>{d.id}</t></is></c><c  t="e"><f>B3*100</f><v>#VALUE!</v></c></row>\n'
                        + '</sheetData><pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/><extLst><ext uri="{64002731-A6B0-56B0-2670-7721B7C09600}" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main"><mx:PLV Mode="0" OnePage="0" WScale="0"/></ext></extLst></worksheet>';
      var _sharedStringBefore2 = _sharedStringBefore.replace('{d.id}', '{d.type}');
      //  var _sharedStringAfter2 = _sharedStringAfter.replace('{d.id}', '{d.type}');
      var _sheetBefore2 = _sheetBefore.replace('{d.id}', '{d.type}');
      var _sheetAfter2 = _sheetAfter.replace('{d.id}', '{d.type}');
      helper.assert(_sheetAfter2 !== _sheetAfter, true);
      describe('execute', function () {
        it('should replace shared string by inline strings in a real xlsx file. The shared string should be removed', function (done) {
          var _report = {
            isZipped   : true,
            filename   : 'template.xlsx',
            embeddings : [],
            extension  : 'xlsx',
            files      : [
              {name : 'xl/sharedStrings.xml'    , parent : '', data : _sharedStringBefore},
              {name : 'xl/worksheets/sheet1.xml', parent : '', data : _sheetBefore}
            ]
          };
          preprocessor.execute(_report, function (err, tmpl) {
            helper.assert(err + '', 'null');
            // tmpl.files[0].name.should.be.eql('xl/sharedStrings.xml');
            // tmpl.files[0].data.should.be.eql(_sharedStringAfter);
            should(tmpl.files[0].name).be.eql('xl/worksheets/sheet1.xml');
            should(tmpl.files[0].data).be.eql(_sheetAfter);
            done();
          });
        });
        it('should replace shared string by inline strings in embedded xlsx file', function (done) {
          var _report = {
            isZipped   : true,
            filename   : 'template.docx',
            embeddings : ['embedded/spreadsheet.xlsx'],
            extension  : 'docx',
            files      : [
              {name : 'my_file.xml'             , parent : ''                         , data : 'some text'},
              {name : 'xl/sharedStrings.xml'    , parent : 'embedded/spreadsheet.xlsx', data : _sharedStringBefore},
              {name : 'xl/worksheets/sheet1.xml', parent : 'embedded/spreadsheet.xlsx', data : _sheetBefore}
            ]
          };
          preprocessor.execute(_report, function (err, tmpl) {
            helper.assert(err + '', 'null');
            should(tmpl.files[0].name).be.eql('my_file.xml');
            should(tmpl.files[0].data).be.eql('some text');
            should(tmpl.files[0].parent).be.eql('');
            // tmpl.files[1].name.should.be.eql('xl/sharedStrings.xml');
            // tmpl.files[1].data.should.be.eql(_sharedStringAfter);
            // tmpl.files[1].parent.should.be.eql('embedded/spreadsheet.xlsx');
            should(tmpl.files[1].name).be.eql('xl/worksheets/sheet1.xml');
            should(tmpl.files[1].data).be.eql(_sheetAfter);
            should(tmpl.files[1].parent).be.eql('embedded/spreadsheet.xlsx');
            done();
          });
        });
        it('should consider each embedded document separately', function (done) {
          var _report = {
            isZipped   : true,
            filename   : 'template.docx',
            embeddings : ['embedded/spreadsheet.xlsx', 'embedded/spreadsheet2.xlsx'],
            extension  : 'docx',
            files      : [
              {name : 'my_file.xml'             , parent : ''                          , data : 'some text'},
              {name : 'xl/sharedStrings.xml'    , parent : 'embedded/spreadsheet.xlsx' , data : _sharedStringBefore},
              {name : 'xl/worksheets/sheet1.xml', parent : 'embedded/spreadsheet.xlsx' , data : _sheetBefore},
              {name : 'xl/sharedStrings.xml'    , parent : 'embedded/spreadsheet2.xlsx', data : _sharedStringBefore2},
              {name : 'xl/worksheets/sheet1.xml', parent : 'embedded/spreadsheet2.xlsx', data : _sheetBefore2}
            ]
          };
          preprocessor.execute(_report, function (err, tmpl) {
            helper.assert(err + '', 'null');
            should(tmpl.files[0].name).be.eql('my_file.xml');
            should(tmpl.files[0].data).be.eql('some text');
            should(tmpl.files[0].parent).be.eql('');
            // tmpl.files[1].name.should.be.eql('xl/sharedStrings.xml');
            // tmpl.files[1].data.should.be.eql(_sharedStringAfter);
            // tmpl.files[1].parent.should.be.eql('embedded/spreadsheet.xlsx');
            should(tmpl.files[1].name).be.eql('xl/worksheets/sheet1.xml');
            should(tmpl.files[1].data).be.eql(_sheetAfter);
            should(tmpl.files[1].parent).be.eql('embedded/spreadsheet.xlsx');
            // tmpl.files[2].name.should.be.eql('xl/sharedStrings.xml');
            // tmpl.files[2].data.should.be.eql(_sharedStringAfter2);
            // tmpl.files[2].parent.should.be.eql('embedded/spreadsheet2.xlsx');
            should(tmpl.files[2].name).be.eql('xl/worksheets/sheet1.xml');
            should(tmpl.files[2].data).be.eql(_sheetAfter2);
            should(tmpl.files[2].parent).be.eql('embedded/spreadsheet2.xlsx');
            done();
          });
        });
      });
      describe('removeOneFile', function () {
        var _relationFileBefore = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          +'  <Relationship Id="rId8" Target="worksheets/sheet8.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>'
          +'  <Relationship Id="rId11" Target="sharedStrings.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings"/>'
          +'  <Relationship Id="rId10" Target="styles.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"/>'
          +'</Relationships>';
        var _relationFileAfter = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          +'  <Relationship Id="rId8" Target="worksheets/sheet8.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>'
          +'  '
          +'  <Relationship Id="rId10" Target="styles.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"/>'
          +'</Relationships>';
        it('should do nothing if template is empty', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : []
          };
          preprocessor.removeOneFile(_report, 1);
          helper.assert(_report, {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : []
          });
        });
        it('should do nothing if index is negative', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : [{name : 'my_file.xml' , data : 'some text', parent : ''}]
          };
          preprocessor.removeOneFile(_report, -1);
          helper.assert(_report.files.length, 1);
        });
        it('should remove this 2nd file', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : [
              {name : 'my_file.xml' , data : 'some text', parent : ''},
              {name : 'my_file1.xml', data : 'some text', parent : ''},
              {name : 'my_file2.xml', data : 'some text', parent : ''}
            ]
          };
          preprocessor.removeOneFile(_report, 1, '');
          helper.assert(_report.files.length, 2);
          helper.assert(_report.files[0].name, 'my_file.xml');
          helper.assert(_report.files[1].name, 'my_file2.xml');
        });
        it('should remove this 2nd file and the relation in workbook', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : [
              {name : 'xl/my_file.xml'            , data : 'some text'        , parent : ''},
              {name : 'xl/my_file2.xml'           , data : 'some text'        , parent : ''},
              {name : 'xl/sharedStrings.xml'      , data : 'some text'        , parent : ''},
              {name : 'xl/_rels/workbook.xml.rels', data : _relationFileBefore, parent : ''}
            ]
          };
          preprocessor.removeOneFile(_report, 2, '');
          helper.assert(_report.files.length, 3);
          helper.assert(_report.files[0].name, 'xl/my_file.xml');
          helper.assert(_report.files[1].name, 'xl/my_file2.xml');
          helper.assert(_report.files[2].name, 'xl/_rels/workbook.xml.rels');
          helper.assert(_report.files[2].data, _relationFileAfter);
        });
        it('should change the workbook of the embedded document only', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : [
              {name : 'xl/my_file.xml'            , data : 'some text'        , parent : ''},
              {name : 'xl/my_file2.xml'           , data : 'some text'        , parent : ''},
              {name : 'xl/sharedStrings.xml'      , data : 'some text'        , parent : ''},
              {name : 'xl/_rels/workbook.xml.rels', data : _relationFileBefore, parent : ''},
              {name : 'xl/_rels/workbook.xml.rels', data : _relationFileBefore, parent : 'subdoc.xlsx'}
            ]
          };
          preprocessor.removeOneFile(_report, 2, 'subdoc.xlsx');
          helper.assert(_report.files.length, 4);
          helper.assert(_report.files[0].name, 'xl/my_file.xml');
          helper.assert(_report.files[1].name, 'xl/my_file2.xml');
          helper.assert(_report.files[2].name, 'xl/_rels/workbook.xml.rels');
          helper.assert(_report.files[2].data, _relationFileBefore);
          helper.assert(_report.files[3].name, 'xl/_rels/workbook.xml.rels');
          helper.assert(_report.files[3].data, _relationFileAfter);
        });
      });
      describe('convertSharedStringToInlineString', function () {
        it('should do not crash if the file is not an xlsx file (should not happen because execute filter)', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.docx',
            extension : 'docx',
            files     : [
              {name : 'my_file.xml', data : 'some text'}
            ]
          };
          var _fileConverted = preprocessor.convertSharedStringToInlineString(_report);
          helper.assert(_fileConverted, _report);
        });
        it('should replace shared string by inline strings in a real xlsx file', function () {
          var _report = {
            isZipped  : true,
            filename  : 'template.xlsx',
            extension : 'xlsx',
            files     : [
              {name : 'xl/sharedStrings.xml'    , data : _sharedStringBefore},
              {name : 'xl/worksheets/sheet1.xml', data : _sheetBefore}
            ]
          };
          var _fileConverted = preprocessor.convertSharedStringToInlineString(_report);
          helper.assert(_fileConverted, {
            isZipped  : true,
            filename  : 'template.xlsx',
            extension : 'xlsx',
            files     : [
              // {'name': 'xl/sharedStrings.xml'    , 'data': _sharedStringAfter},
              {name : 'xl/worksheets/sheet1.xml', data : _sheetAfter}
            ]
          });
        });
        it('should works with sheet2.xml');
      });
      describe('readSharedString', function () {
        it('should do nothing if the string is empty or null', function () {
          helper.assert(preprocessor.readSharedString(null), []);
          helper.assert(preprocessor.readSharedString(''), []);
          helper.assert(preprocessor.readSharedString(undefined), []);
        });
        it('should parse xml and return an array of shared strings', function () {
          helper.assert(preprocessor.readSharedString('<si><t>Name</t></si>'), ['<t>Name</t>']);
          helper.assert(preprocessor.readSharedString('<xml><si><t>Name</t></si></xml>'), ['<t>Name</t>']);
          helper.assert(preprocessor.readSharedString('<xml> <si> <t> Name </t> </si>  </xml>'), [' <t> Name </t> ']);
        });
        it('should be able to parse a real xlsx shared string file', function () {
          helper.assert(preprocessor.readSharedString('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si><t>{d.name}</t></si><si><t>{d.id}</t></si></sst>'),
            [ '<t>Nom</t>',
              '<t xml:space="preserve">Id </t>',
              '<t>TOTAL</t>',
              '<t>tata</t>',
              '<t>{d.name}</t>',
              '<t>{d.id}</t>' ]
          );
        });
      });
      describe('convertToInlineString', function () {
        it('should do nothing if the string is empty or null', function () {
          helper.assert(preprocessor.convertToInlineString(null), null);
          helper.assert(preprocessor.convertToInlineString(''), '');
          helper.assert(preprocessor.convertToInlineString(), undefined);
        });
        it('should replace shared string index by inline string', function () {
          helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117" t="s"><v>0</v></c>', ['<t>{d.name}</t>']), '<c r="A34" s="117" t="inlineStr"><is><t>{d.name}</t></is></c>');
        });
        it('should not do bullshit if a text contain t="s"', function () {
          helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117"><t>t="s"</t></c>', []), '<c r="A34" s="117"><t>t="s"</t></c>');
        });
        it('should replace shared string even if there are multiple shared string in different order\
            it should work if the type (t="s") of the tag is not always at the same position\
            it should work if index position is greater than 9 ', function () {
          var _sharedStrings = [
            'matrix',
            '{d.id}',
            '{d.name}',
            '{d.isActive}}',
            'a','b','c','d','e','f','g','h',
          ];
          helper.assert(preprocessor.convertToInlineString('<row r="34" spans="1:4"><c r="A34"  t="s"  s="117" ><v>3</v></c><c r="C34" s="118" t="s" ><v>11</v></c><c   t="s"   r="D34" s="33" ><v>2</v></c></row>',
            _sharedStrings
          ),
          '<row r="34" spans="1:4"><c r="A34"  t="inlineStr"  s="117" ><is>{d.isActive}}</is></c><c r="C34" s="118" t="inlineStr" ><is>h</is></c><c   t="inlineStr"   r="D34" s="33" ><is>{d.name}</is></c></row>'
          );
        });
        it('should do nothing if the tag does not contain nested <v> </v> even if the type is t="s"', function () {
          helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117" t="s"><t>0</t></c>', ['<t>{d.name}</t>']), '<c r="A34" s="117" t="s"><t>0</t></c>');
        });
        it('should makes a number marker (:formatN applied) recognised as number type by changing the type t="s" to t="n", removing xml markups and formatter ":formatN() [One marker test]" ', function () {
          const _xml = '<c r="A2" s="0" t="s"><v>0</v></c>';
          const _sharedString = ['<t xml:space="preserve">{d.nbr2:formatN()}</t>'];
          const _expectedResult = '<c r="A2" s="0" t="n"><v>{d.nbr2}</v></c>';
          const _result = preprocessor.convertToInlineString(_xml, _sharedString);
          helper.assert(_result, _expectedResult);
          helper.assert(!!/t="s"/.exec(_result), false);
          helper.assert(!!/t="n"/.exec(_result), true);
        });

        it('should makes a number marker (:formatN applied) recognised as number type by changing the type t="n", removing xml markups and formatter ":formatN()" [Multiple markers test]', function () {
          const _xml = '<c r="A1" s="1" t="s"><v>0</v></c><c r="A2" s="0" t="s"><v>1</v></c><c r="A3" s="0" t="s"><v>2</v></c>';
          const _sharedString = ['<t xml:space="preserve">1</t>', '<t xml:space="preserve">{d.nbr2:formatN()}</t>', '<t xml:space="preserve">{d.nbr3:formatN()}</t>'];
          const _expectedResult = '<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">1</t></is></c><c r="A2" s="0" t="n"><v>{d.nbr2}</v></c><c r="A3" s="0" t="n"><v>{d.nbr3}</v></c>';
          const _result = preprocessor.convertToInlineString(_xml, _sharedString);
          helper.assert(_result, _expectedResult);
          helper.assert(!!/t="s"/.exec(_result), false);
          helper.assert(!!/t="n"/.exec(_result), true);
        });

        it('should not makes a number marker recognised as number type because of wrong formatN typing [testing regex]', function () {
          const _xml = '<c r="A1" s="1" t="s"><v>0</v></c><c r="A2" s="0" t="s"><v>1</v></c><c r="A3" s="0" t="s"><v>2</v></c>';
          const _sharedString = ['<t xml:space="preserve">{d.nbr1:formatN(}</t>', '<t xml:space="preserve">{d.nbr2formatN()}</t>', '<t xml:space="preserve">{d.nbr3:formatN)}</t>'];
          const _expectedResult = '<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">{d.nbr1:formatN(}</t></is></c><c r="A2" s="0" t="inlineStr"><is><t xml:space="preserve">{d.nbr2formatN()}</t></is></c><c r="A3" s="0" t="inlineStr"><is><t xml:space="preserve">{d.nbr3:formatN)}</t></is></c>';
          const _result = preprocessor.convertToInlineString(_xml, _sharedString);
          helper.assert(_result, _expectedResult);
          helper.assert(!!/t="inlineStr"/.exec(_result), true);
        });
      });
      describe('convertNumberMarkersIntoNumericFormat', function () {
        it('should makes a number marker (:formatN) recognised as number cell for ODS files [1 marker]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{d.nbr:formatN()}</text:p></table:table-cell>'
            }]
          };
          const _expectedResult = '<table:table-cell office:value-type="float" office:value="{d.nbr}" calcext:value-type="float"><text:p>{d.nbr}</text:p></table:table-cell>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });

        it('should makes a number marker (:formatN) recognised as number cell for ODS files [2 markers]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{d.nbr:formatN()}</text:p></table:table-cell><table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{d.nbr6:formatN()}</text:p></table:table-cell>'
            }]
          };
          const _expectedResult = '<table:table-cell office:value-type="float" office:value="{d.nbr}" calcext:value-type="float"><text:p>{d.nbr}</text:p></table:table-cell><table:table-cell office:value-type="float" office:value="{d.nbr6}" calcext:value-type="float"><text:p>{d.nbr6}</text:p></table:table-cell>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });

        it('should makes a number marker (:formatN) recognised as number cell for ODS files [1 markers + style attributes]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<table:table-cell table:style-name="ce7" office:value-type="string" calcext:value-type="string"><text:p>{d.nbr7:formatN()}</text:p></table:table-cell>'
            }]
          };
          const _expectedResult = '<table:table-cell table:style-name="ce7" office:value-type="float" office:value="{d.nbr7}" calcext:value-type="float"><text:p>{d.nbr7}</text:p></table:table-cell>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });

        it('should makes a number marker (:formatN) recognised as number cell for ODS files [1 markers + 2 style attributes and spaces]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<table:table-cell table:style-name="ce7" office:value-type="string" table:style-name="ce7" calcext:value-type="string">  <text:p>   {d.nbr7:formatN()}  </text:p>   </table:table-cell>'
            }]
          };
          const _expectedResult = '<table:table-cell table:style-name="ce7" office:value-type="float" office:value="{d.nbr7}" table:style-name="ce7" calcext:value-type="float">  <text:p>   {d.nbr7}  </text:p>   </table:table-cell>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });
        it('should not convert to number if the cell contains multiple markers', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<table:table-cell table:style-name="ce7" office:value-type="string" table:style-name="ce7" calcext:value-type="string">  <text:p>   {d.nbr7:formatN()} {d.nbr6:formatN()}  </text:p>   </table:table-cell>'
            }]
          };
          const _expectedResult = '<table:table-cell table:style-name="ce7" office:value-type="string" table:style-name="ce7" calcext:value-type="string">  <text:p>   {d.nbr7:formatN()} {d.nbr6:formatN()}  </text:p>   </table:table-cell>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });
        it('should accept unknown attributes in XML and other order of calcext:value-type and office:value-type', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : ''
                + '<table:table-row table:style-name="ro5">'
                + '  <table:table-cell calcext:value-type="string" office:value-type="string">'
                + '    <text:p>{d.analyticalGroup[id=8].label:ifEmpty(\'-\')}</text:p>'
                + '  </table:table-cell>'
                + '  <table:table-cell calcext:value-type="string" office:value-type="string">'
                + '    <text:p>{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\'):formatN()}</text:p>'
                + '  </table:table-cell>'
                + '  <table:table-cell office:value-type="string" other:unknown="bla" calcext:value-type="string">'
                + '    <text:p>{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\'):formatN()}</text:p>'
                + '  </table:table-cell>'
                + '  <table:table-cell table:number-columns-repeated="59"/>'
                + '</table:table-row>'
            }]
          };
          const _expectedResult = ''
            + '<table:table-row table:style-name="ro5">'
            + '  <table:table-cell calcext:value-type="string" office:value-type="string">'
            + '    <text:p>{d.analyticalGroup[id=8].label:ifEmpty(\'-\')}</text:p>'
            + '  </table:table-cell>'
            + '  <table:table-cell calcext:value-type="float" office:value-type="float" office:value="{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\')}">'
            + '    <text:p>{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\')}</text:p>'
            + '  </table:table-cell>'
            + '  <table:table-cell office:value-type="float" office:value="{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\')}" other:unknown="bla" calcext:value-type="float">'
            + '    <text:p>{d.analyticalGroup[id=8].consumption:ifEmpty(\'-\')}</text:p>'
            + '  </table:table-cell>'
            + '  <table:table-cell table:number-columns-repeated="59"/>'
            + '</table:table-row>';
          preprocessor.convertNumberMarkersIntoNumericFormat(_template);
          helper.assert(_template.files[0].data, _expectedResult);
        });

      });
      describe('removeRowCounterInWorksheet', function () {
        it('should do nothing if the string is empty or null', function () {
          helper.assert(preprocessor.removeRowCounterInWorksheet(null), null);
          helper.assert(preprocessor.removeRowCounterInWorksheet(''), '');
          helper.assert(preprocessor.removeRowCounterInWorksheet(), undefined);
        });
        it('should remove absolute position "r=" and spans in "row" tag', function () {
          // spans are optional (XLSX optimization)
          var _xml      = '<row r="1" spans="1:2" x14ac:dyDescent="0.2">';
          var _expected = '<row   x14ac:dyDescent="0.2">';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
        });
        it('should remove absolute position "r=" and spans in "c" tag', function () {
          var _xml      = '<c r="B1" spans="1:2" x14ac:dyDescent="0.2">';
          var _expected = '<c   x14ac:dyDescent="0.2">';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
        });
        it('should remove absolute position "r=" in "c" tag even if the attribute is not the first one', function () {
          var _xml      = '<c spans="1:2" r="A1" x14ac:dyDescent="0.2">';
          var _expected = '<c   x14ac:dyDescent="0.2">';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
          _xml      = '<row spans="1:2" r="1" x14ac:dyDescent="0.2">';
          _expected = '<row   x14ac:dyDescent="0.2">';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
        });
        it('should not remove absolute position "r=" in other tags than "c" or "row"', function () {
          var _xml      = '<titi r="1" spans="1:2" x14ac:dyDescent="0.2">';
          var _expected = '<titi r="1" spans="1:2" x14ac:dyDescent="0.2">';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
        });
        it('should remove absolute row position in XML', function () {
          var _xml =''
            +'<sheetData>'
            +'  <row r="1" spans="1:2" x14ac:dyDescent="0.2">'
            +'    <c r="A1" t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i].name}</t>'
            +'      </is>'
            +'    </c>'
            +'    <c r="B1" t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i].qty}</t>'
            +'      </is>'
            +'    </c>'
            +'  </row>'
            +'  <row r="2" spans="1:2" x14ac:dyDescent="0.2">'
            +'    <c r="A2" t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i+1].name}</t>'
            +'      </is>'
            +'    </c>'
            +'  </row>'
            +'</sheetData>';
          var _expected = ''
            +'<sheetData>'
            +'  <row   x14ac:dyDescent="0.2">'
            +'    <c  t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i].name}</t>'
            +'      </is>'
            +'    </c>'
            +'    <c  t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i].qty}</t>'
            +'      </is>'
            +'    </c>'
            +'  </row>'
            +'  <row   x14ac:dyDescent="0.2">'
            +'    <c  t="inlineStr">'
            +'      <is>'
            +'        <t>{d[i+1].name}</t>'
            +'      </is>'
            +'    </c>'
            +'  </row>'
            +'</sheetData>';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _expected);
        });
        it('should not cut, alter or remove the attributes "operator=", it is used for XLSX chart rendering', function () {
          var _xml = '<conditionalFormatting sqref="A7">'
            + '<cfRule type="cellIs" priority="2" operator="greaterThan" aboveAverage="0" equalAverage="0" bottom="0" percent="0" rank="0" text="" dxfId="0">'
            + '<formula>500</formula>'
            + '</cfRule>'
            + '<cfRule type="cellIs" priority="3" operator="equal" aboveAverage="0" equalAverage="0" bottom="0" percent="0" rank="0" text="" dxfId="1">'
            +'<formula>500</formula>'
            + '</cfRule>'
            + '<cfRule type="cellIs" priority="4" operator="lessThan" aboveAverage="0" equalAverage="0" bottom="0" percent="0" rank="0" text="" dxfId="2">'
            + '<formula>500</formula>'
            + '</cfRule>'
            + '</conditionalFormatting>';
          helper.assert(preprocessor.removeRowCounterInWorksheet(_xml), _xml);
        });
      });
    });
  });
});

