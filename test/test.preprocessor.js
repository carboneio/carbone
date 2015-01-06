var assert = require('assert');
var preprocessor = require('../lib/preprocessor');
var helper = require('../lib/helper');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var testPath = path.join(__dirname,'test_file');
var spawn = require('child_process').spawn;

describe.only('preprocessor', function(){
  describe('convertSharedStringToInlineString', function(){
    it('should do nothing if the file is an empty object', function(){
      var _fileConverted = preprocessor.convertSharedStringToInlineString({});
      helper.assert(_fileConverted, {});
    });
    it('should do nothing if the file is null', function(){
      var _fileConverted = preprocessor.convertSharedStringToInlineString(null);
      helper.assert(_fileConverted, null);
    });
    it('should do nothing if the file is not an xlsx file', function(){
      var _report = {
        'isZipped' : true,
        'name' : 'template.docx',
        'files' : [
          {'name': 'my_file.xml', 'data': 'some text'}
        ]
      };
      var _fileConverted = preprocessor.convertSharedStringToInlineString(_report);
      helper.assert(_fileConverted, _report);
    });
    it('should replace shared string by inline strings in a real xlsx file', function(){
      var _report = {
        'isZipped' : true,
        'name' : 'template.xlsx',
        'files' : [
          {'name': 'xl/sharedStrings.xml'    , 'data': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si><t>((=d.name}}</t></si><si><t>{{=d.id}}</t></si></sst>'},
          {'name': 'xl/worksheets/sheet1.xml', 'data': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:C3"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><selection activeCell="C3" sqref="C3"/></sheetView></sheetViews><sheetFormatPr baseColWidth="10" defaultRowHeight="15" x14ac:dyDescent="0"/><sheetData><row r="1" spans="1:3"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row><row r="2" spans="1:3"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>100</v></c><c r="C2"><f>B2*100</f><v>10000</v></c></row><row r="3" spans="1:3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c><c r="C3" t="e"><f>B3*100</f><v>#VALUE!</v></c></row></sheetData><pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/><extLst><ext uri="{64002731-A6B0-56B0-2670-7721B7C09600}" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main"><mx:PLV Mode="0" OnePage="0" WScale="0"/></ext></extLst></worksheet>'}
        ]
      };
      var _fileConverted = preprocessor.convertSharedStringToInlineString(_report);
      helper.assert(_fileConverted, {
        'isZipped' : true,
        'name' : 'template.xlsx',
        'files' : [
          {'name': 'xl/sharedStrings.xml'    , 'data': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si><t>((=d.name}}</t></si><si><t>{{=d.id}}</t></si></sst>'},
          {'name': 'xl/worksheets/sheet1.xml', 'data': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:C3"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><selection activeCell="C3" sqref="C3"/></sheetView></sheetViews><sheetFormatPr baseColWidth="10" defaultRowHeight="15" x14ac:dyDescent="0"/><sheetData><row r="1" spans="1:3"><c r="A1" t="inlineStr"><is><t>Nom</t></is></c><c r="B1" t="inlineStr"><is><t xml:space="preserve">Id </t></is></c><c r="C1" t="inlineStr"><is><t>TOTAL</t></is></c></row><row r="2" spans="1:3"><c r="A2" t="inlineStr"><is><t>tata</t></is></c><c r="B2"><v>100</v></c><c r="C2"><f>B2*100</f><v>10000</v></c></row><row r="3" spans="1:3"><c r="A3" t="inlineStr"><is><t>((=d.name}}</t></is></c><c r="B3" t="inlineStr"><is><t>{{=d.id}}</t></is></c><c r="C3" t="e"><f>B3*100</f><v>#VALUE!</v></c></row></sheetData><pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/><extLst><ext uri="{64002731-A6B0-56B0-2670-7721B7C09600}" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main"><mx:PLV Mode="0" OnePage="0" WScale="0"/></ext></extLst></worksheet>'}
        ]
      });
    });
  });
  describe('readSharedString', function(){
    it('should do nothing if the string is empty or null', function(){
      helper.assert(preprocessor.readSharedString(null), []);
      helper.assert(preprocessor.readSharedString(''), []);
      helper.assert(preprocessor.readSharedString(undefined), []);
    });
    it('should parse xml and return an array of shared strings', function(){
      helper.assert(preprocessor.readSharedString('<si><t>Name</t></si>'), ['<t>Name</t>']);
      helper.assert(preprocessor.readSharedString('<xml><si><t>Name</t></si></xml>'), ['<t>Name</t>']);
      helper.assert(preprocessor.readSharedString('<xml> <si> <t> Name </t> </si>  </xml>'), [' <t> Name </t> ']);
    });
    it('should be able to parse a real xlsx shared string file', function(){
      helper.assert(preprocessor.readSharedString('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Nom</t></si><si><t xml:space="preserve">Id </t></si><si><t>TOTAL</t></si><si><t>tata</t></si><si><t>((=d.name}}</t></si><si><t>{{=d.id}}</t></si></sst>'),
        [ '<t>Nom</t>',
          '<t xml:space="preserve">Id </t>',
          '<t>TOTAL</t>',
          '<t>tata</t>',
          '<t>((=d.name}}</t>',
          '<t>{{=d.id}}</t>' ]
      );
    });
  });
  describe('convertToInlineString', function(){
    it('should do nothing if the string is empty or null', function(){
      helper.assert(preprocessor.convertToInlineString(null), null);
      helper.assert(preprocessor.convertToInlineString(''), '');
      helper.assert(preprocessor.convertToInlineString(), undefined);
    });
    it('should replace shared string index by inline string', function(){
      helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117" t="s"><v>0</v></c>', ['<t>{{=d.name}}</t>']), '<c r="A34" s="117" t="inlineStr"><is><t>{{=d.name}}</t></is></c>');
    });
    it('should not do bullshit if a text contain t="s"', function(){
      helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117"><t>t="s"</t></c>', []), '<c r="A34" s="117"><t>t="s"</t></c>');
    });
    it('should replace shared string even if there are multiple shared string in different order\
        it should work if the type (t="s") of the tag is not always at the same position\
        it should work if index position is greater than 9 ', function(){
      var _sharedStrings = [
        'matrix',
        '{{=d.id}}',
        '{{=d.name}}',
        '{{=d.isActive}}',
        'a','b','c','d','e','f','g','h',
      ];
      helper.assert(preprocessor.convertToInlineString('<row r="34" spans="1:4"><c r="A34"  t="s"  s="117" ><v>3</v></c><c r="C34" s="118" t="s" ><v>11</v></c><c   t="s"   r="D34" s="33" ><v>2</v></c></row>', 
          _sharedStrings
        ),
        '<row r="34" spans="1:4"><c r="A34"  t="inlineStr"  s="117" ><is>{{=d.isActive}}</is></c><c r="C34" s="118" t="inlineStr" ><is>h</is></c><c   t="inlineStr"   r="D34" s="33" ><is>{{=d.name}}</is></c></row>'
      );
    });
    it('should do nothing if the tag does not contain nested <v> </v> even if the type is t="s"', function(){
      helper.assert(preprocessor.convertToInlineString('<c r="A34" s="117" t="s"><t>0</t></c>', ['<t>{{=d.name}}</t>']), '<c r="A34" s="117" t="s"><t>0</t></c>');
    });
  });
});

