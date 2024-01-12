const color = require('../lib/color');
const helper = require('../lib/helper');
const parser = require('../lib/parser');
const carbone = require('../lib/index');
const assert = require('assert');
const helperTest = require('./helper');
const colorFormatters = require('../formatters/color');

describe('Dynamic colors', function () {
  describe('DOCX new :color (MASTER test)', function () {
    const xmlColor = (expected) => {
      return ''
       + '\n<w:tbl>'
       + '\n  <w:tblPr>'
       + '\n  </w:tblPr>'
       + '\n  <w:tr>'
       + '\n    <w:tc>'
       + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
       + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p>'
       + '\n    </w:tc>'
       + '\n    <w:tc>'
       + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
       + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p>'
       + '\n    </w:tc>'
       + '\n  </w:tr>'
       + '\n  <w:tr>'
       + '\n    <w:tc>'
       + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
       + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr></w:pPr>'
       + '\n        <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr>'
       + '\n          <w:t>'
       + '\n            ' + ((expected) ? '' : '{d.test:color(row)}')
       + '\n          </w:t>'
       + '\n        </w:r>'
       + '\n      </w:p>'
       + '\n    </w:tc>'
       + '\n    <w:tc>'
       + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
       + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr></w:pPr>'
       + '\n        <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr>'
       + '\n          <w:t>'
       + '\n            hello'
       + '\n          </w:t>'
       + '\n        </w:r>'
       + '\n      </w:p>'
       + '\n    </w:tc>'
       + '\n  </w:tr>'
       + '\n</w:tbl>';
    };
    it('should replace color of row', function () {
      const _template = (expected) => {
        return {
          files : [{
            name : 'word/document.xml',
            data : xmlColor(expected)
          }]
        };
      };
      assert.strictEqual(color.preProcessDocxColor(_template()).files[0].data, _template(true).files[0].data);
    });
    it('should replace color in headers and footers', function () {
      const _template = (expected) => {
        return {
          files : [{
            name : 'word/document.xml',
            data : xmlColor(expected)
          },{
            name : 'word/header1.xml',
            data : ' ' + xmlColor(expected) // add some whitespace to create different XML
          },{
            name : 'word/footer1.xml',
            data : '  <w:p> hello </w:p>  '
          },{
            name : 'word/footer2.xml',
            data : '    ' + xmlColor(expected)
          }]
        };
      };
      helper.assert(color.preProcessDocxColor(_template()), _template(true));
    });
    it('should returns error if the scope cannot be found', function () {
      const _template = {
        files : [{
          name : 'word/document.xml',
          data : '\n<w:p>{d.test:color(row)}</w:p>'
        }]
      };
      assert.throws(() => color.preProcessDocxColor(_template), {
        message : 'The Carbone tag "{d.test:color(row)}" is outside of its defined scope "(row)"'
      });
    });
    it('should returns error if the color scope is unknown', function () {
      const _template = {
        files : [{
          name : 'word/document.xml',
          data : '\n<w:p>{d.test:color(eeee)}</w:p>'
        }]
      };
      assert.throws(() => color.preProcessDocxColor(_template), {
        message : 'The color scope "eeee" is unknown in "{d.test:color(eeee)}". The formatter accepts only row, cell, p for the first argument.'
      });
    });
    it('should returns error if the color type is unknown', function () {
      const _template = {
        files : [{
          name : 'word/document.xml',
          data : '\n<w:p>{d.test:color(p, bidule)}</w:p>'
        }]
      };
      assert.throws(() => color.preProcessDocxColor(_template), {
        message : 'The color type "bidule" is unknown in "{d.test:color(p, bidule)}". The formatter accepts only text, background for the second argument.'
      });
    });
    it('should returns error if the color type/scope combination is not valid', function () {
      const _template = {
        files : [{
          name : 'word/document.xml',
          data : '\n<w:p>{d.test:color(p, background)}</w:p>'
        }]
      };
      assert.throws(() => color.preProcessDocxColor(_template), {
        message : 'The color type "background" is invalid for the scope "p" in "{d.test:color(p, background)}".'
      });
    });
    it('should replace undefined, null or not valid colors by white', function (done) {
      const _template = (expected) => {
        return  ''
             + '<body>'
             + '<w:color w:val="'+((expected) ? 'ffffff' : '{d.undef:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? 'ffffff' : '{d.nulli:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? 'A1A2A3' : '{d.okU:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? 'a1f2e3' : '{d.okL:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? '01f9c3' : '{d.okH:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? 'ffffff' : '{d.nOk1:color(row):colorToDocx}')+'"/>'
             + '<w:color w:val="'+((expected) ? 'ffffff' : '{d.nOk2:color(row):colorToDocx}')+'"/>'
             + '</body>';
      };
      const _data = {
        nulli : null,
        okU   : 'A1A2A3',
        okL   : 'a1f2e3',
        okH   : '#01f9c3',
        nOk1  : 'gggggg',
        nOk2  : 'aaa',
      };
      carbone.renderXML(_template(), _data, (err, res) => {
        assert.strictEqual(err+'', 'null');
        assert.strictEqual(res, _template(true));
        done();
      });
    });
    it('should inject color in a whole document, merge with existing XML style, manage priority between row/cell/p scope, accept hashtag or not', function (done) {
      const _testedReport = 'color/docx-multiple-color';
      const _data = {
        cell : '#1bcdef',
        row  : '2bcdef',
        para : '#3bcdef'
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it.skip('should replace color of row without modifying the nested table', function () {
      // TODO : dès la détection des tag color, ne pas modifier l'XML, juste générer des patch
      // parser tous l'XML avec le state machine afin de construire un tableau qui indique où nous somme dans le word (inside row de 12, à 234)
      // utiliser ce tableau pour détecter les scope
      const _template = (expected) => {
        return {
          files : [{
            name : 'word/document.xml',
            data : '\n'
                 + '\n<w:tbl>'
                 + '\n  <w:tblPr>'
                 + '\n  </w:tblPr>'
                 + '\n  <w:tr>'
                 + '\n    <w:tc>'
                 + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p>'
                 + '\n    </w:tc>'
                 + '\n    <w:tc>'
                 + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p>'
                 + '\n    </w:tc>'
                 + '\n  </w:tr>'
                 + '\n  <w:tr>'
                 + '\n    <w:tc>'
                 + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr></w:pPr>'
                 + '\n        <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr>'
                 + '\n          <w:t>'
                 + '\n            hello'
                 + '\n          </w:t>'
                 + '\n        </w:r>'
                 + '\n      </w:p>'
                 + '\n    </w:tc>'
                 + '\n    <w:tc>'
                 + '\n      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n      <w:tbl>'
                 + '\n        <w:tr>'
                 + '\n          <w:tc>'
                 + '\n            <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n            <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="1bcdef"/></w:rPr></w:pPr>'
                 + '\n              <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="1bcdef"/></w:rPr>'
                 + '\n                <w:t>'
                 + '\n                  hello'
                 + '\n                </w:t>'
                 + '\n              </w:r>'
                 + '\n            </w:p>'
                 + '\n          </w:tc>'
                 + '\n          <w:tc>'
                 + '\n            <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>'
                 + '\n            <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="1bcdef"/></w:rPr></w:pPr>'
                 + '\n              <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="1bcdef"/></w:rPr>'
                 + '\n                <w:t>'
                 + '\n                  hello'
                 + '\n                </w:t>'
                 + '\n              </w:r>'
                 + '\n            </w:p>'
                 + '\n          </w:tc>'
                 + '\n        </w:tr>'
                 + '\n      </w:tbl>'
                 + '\n      <w:p><w:pPr><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr></w:pPr>'
                 + '\n        <w:r><w:rPr><w:lang w:val="en-US"/><w:color w:val="'+((expected) ? '{d.test:color(row):colorToDocx}' : '1bcdef')+'"/></w:rPr>'
                 + '\n          <w:t>'
                 + '\n            ' + ((expected) ? '' : '{d.test:color(row)}')
                 + '\n          </w:t>'
                 + '\n        </w:r>'
                 + '\n      </w:p>'
                 + '\n    </w:tc>'
                 + '\n  </w:tr>'
                 + '\n</w:tbl>'
          }]
        };
      };
      assert.strictEqual(color.preProcessDocxColor(_template()).files[0].data, _template(true).files[0].data);
    });
  });
  describe('HTML new :color', function () {
    it('should replace color of row', function () {
      const _xmlColor = (expected) => {
        return ''
         + '\n<table>'
         + '\n  <tbody>'
         + '\n    <tr style="margin:auto; color:'+((expected) ? '{d.test:color(row):colorToHtml}' : '1bcdef')+'; background-color:#FFF;">'
         + '\n      <td>'
         + '\n        <p></p>'
         + '\n        <p>'
         + '\n          <span>'
         + '\n            ' + ((expected) ? '' : '{d.test:color(row)}')
         + '\n          </span>'
         + '\n        </p>'
         + '\n      </td>'
         + '\n      <td>'
         + '\n        <p>text</p>'
         + '\n      </td>'
         + '\n    </tr>'
         + '\n  </tbody>'
         + '\n</table>';
      };
      const _template = (expected) => {
        return {
          files : [{
            name : 'template.html',
            data : _xmlColor(expected)
          }]
        };
      };
      assert.strictEqual(color.preProcessHtmlColor(_template()).files[0].data, _template(true).files[0].data);
    });
    it('should add the style attribute if it does not exist', function () {
      const _htmlColor = (expected) => {
        return ''
         + '\n<table>'
         + '\n  <tbody>'
         + '\n    <tr>'
         + '\n    </tr>'
         + '\n    <tr '+((expected) ? 'style="color:{d.test:color(row):colorToHtml};"' : '')+'>'
         + '\n      <td>'
         + '\n        <p></p>'
         + '\n        <p>'
         + '\n          <span>'
         + '\n            ' + ((expected) ? '' : '{d.test:color(row)}')
         + '\n          </span>'
         + '\n        </p>'
         + '\n      </td>'
         + '\n    </tr>'
         + '\n  </tbody>'
         + '\n</table>';
      };
      const _template = (expected) => {
        return {
          files : [{
            name : 'template.html',
            data : _htmlColor(expected)
          }]
        };
      };
      assert.strictEqual(color.preProcessHtmlColor(_template()).files[0].data, _template(true).files[0].data);
    });
    it('should add the style attribute on paragraph if it does not exist', function () {
      const _htmlColor = (expected) => {
        return ''
         + '\n<table>'
         + '\n  <tbody>'
         + '\n    <tr>'
         + '\n    </tr>'
         + '\n    <tr>'
         + '\n      <td>'
         + '\n        <p></p>'
         + '\n        <p '+((expected) ? 'style="color:{d.test:color(p):colorToHtml};"' : '')+'>'
         + '\n          <span>'
         + '\n            ' + ((expected) ? '' : '{d.test:color(p)}')
         + '\n          </span>'
         + '\n        </p>'
         + '\n      </td>'
         + '\n    </tr>'
         + '\n  </tbody>'
         + '\n</table>';
      };
      const _template = (expected) => {
        return {
          files : [{
            name : 'template.html',
            data : _htmlColor(expected)
          }]
        };
      };
      assert.strictEqual(color.preProcessHtmlColor(_template()).files[0].data, _template(true).files[0].data);
    });
    it('should add the style attribute on cell', function () {
      const _htmlColor = (expected) => {
        return ''
         + '\n<table>'
         + '\n  <tbody>'
         + '\n    <tr>'
         + '\n    </tr>'
         + '\n    <tr>'
         + '\n      <td>'
         + '\n      </td>'
         + '\n      <td '+((expected) ? 'style="color:{d.test:color(cell):colorToHtml};"' : '')+'>'
         + '\n        <p></p>'
         + '\n        <p>'
         + '\n          <span>'
         + '\n            ' + ((expected) ? '' : '{d.test:color(cell)}')
         + '\n          </span>'
         + '\n        </p>'
         + '\n      </td>'
         + '\n    </tr>'
         + '\n  </tbody>'
         + '\n</table>';
      };
      const _template = (expected) => {
        return {
          files : [{
            name : 'template.html',
            data : _htmlColor(expected)
          }]
        };
      };
      assert.strictEqual(color.preProcessHtmlColor(_template()).files[0].data, _template(true).files[0].data);
    });
    it('should replace undefined, null or not valid colors by white', function (done) {
      const _template = (expected) => {
        return  ''
             + '<html>'
             + '<p style="color:'+((expected) ? '#ffffff;"> ' : 'red;"> {d.undef:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#ffffff;"> ' : 'red;"> {d.nulli:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#A1A2A3;"> ' : 'red;"> {d.okU:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#a1f2e3;"> ' : 'red;"> {d.okL:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#01f9c3;"> ' : 'red;"> {d.okH:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#ffffff;"> ' : 'red;"> {d.nOk1:color(p)}')+'</p>'
             + '<p style="color:'+((expected) ? '#ffffff;"> ' : 'red;"> {d.nOk2:color(p)}')+'</p>'
             + '</html>';
      };
      const _data = {
        nulli : null,
        okU   : 'A1A2A3',
        okL   : 'a1f2e3',
        okH   : '#01f9c3',
        nOk1  : 'gggggg',
        nOk2  : 'aaa',
      };
      carbone.renderXML(_template(), _data, {extension : 'html'}, (err, res) => {
        assert.strictEqual(err+'', 'null');
        assert.strictEqual(res, _template(true));
        done();
      });
    });
    it('should inject color in a whole document, merge multiple css properties in a new style attribute, merge multiple css properties in an existing style attribute', function (done) {
      const _template = (expected) => {
        return ''
         + '<table>'
         + '  <tbody>'
         + '    <tr style="'+((expected) ? 'background-color:#4bcdef; color:#5bcdef; ' : '')+'margin:auto;">'
         + '      <td>'
         + '      ' + ((expected) ? '' : '{d.backRow:color(row, background)}')
         + '      ' + ((expected) ? '' : '{d.textRow:color(row)}')
         + '      </td>'
         + '    </tr>'
         + '    <tr '+((expected) ? 'style="background-color:#4bcdef; color:#5bcdef;"' : 'style="color:red;"')+'>'
         + '      <td>'
         + '      </td>'
         + '      <td '+((expected) ? 'style="color:#1bcdef;"' : '')+'>'
         + '        <p></p>'
         + '        <p '+((expected) ? 'style="background-color:#2bcdef;color:#3bcdef;"' : '')+'>'
         + '          <span>'
         + '            ' + ((expected) ? '' : '{d.textCell:color(cell, text)}')
         + '            ' + ((expected) ? '' : '{d.backP:color(p, background)}')
         + '            ' + ((expected) ? '' : '{d.textP:color(p)}')
         + '            ' + ((expected) ? '' : '{d.backRow:color(row, background)}')
         + '            ' + ((expected) ? '' : '{d.textRow:color(row)}')
         + '          </span>'
         + '        </p>'
         + '      </td>'
         + '    </tr>'
         + '  </tbody>'
         + '</table>';
      };
      const _data = {
        textCell : '#1bcdef',
        backP    : '2bcdef',
        textP    : '#3bcdef',
        backRow  : '#4bcdef',
        textRow  : '#5bcdef'
      };
      carbone.renderXML(_template(), _data, {extension : 'html'}, (err, res) => {
        helper.assert(err+'', 'null');
        helper.assert(res, _template(true));
        done();
      });
    });
  });
  describe('ODT Files', function () {
    describe('ODT/ODS pre processor methods', function () {
      describe('preProcessLo', function () {
        it('should insert a color marker and formatter from a single bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p></text:p></office:text></office:body></office:document-content>')
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, null, #ffff00, P3)}">{d.name}<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="P2"><text:span text:style-name="T2"></text:span></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = {
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [{ id : 0, color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { id : -1,  color : '#ffff00', element : 'textBackgroundColor' }],
                attributes  : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"'
              }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert a color marker and formatter from a single bindColor marker [ODS]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="ce1" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{bindColor(FF0000, #hexa) = d.color2}</text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>')
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="{d.color2:updateColorAndGetReferenceLo(#ff0000, ce1)}" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p></text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = {
            colorStyleList : {
              ce1 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [{ id : 0, color : '#ff0000', element : 'textColor', marker : 'd.color2', colorType : '#hexa' }],
                attributes  : ''
              }
            }};
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert two color marker and formatter from a two bindColor marker [ODP]', function () {

          const getContent = (expected) => '' +
            '<?xml version="1.0" encoding="UTF-8"?>'+
              '<office:document-content>'+
                  '<office:automatic-styles>'+
                      '<style:style style:name="P1" style:family="paragraph">'+
                          '<loext:graphic-properties draw:fill-color="#ffffff"/>'+
                          '<style:text-properties fo:color="#008d2c" loext:opacity="100%" loext:color-lum-mod="100%" loext:color-lum-off="0%"/>'+
                      '</style:style>'+
                      '<style:style style:name="P2" style:family="paragraph">'+
                          '<loext:graphic-properties draw:fill-color="#ffffff"/>'+
                      '</style:style>'+
                      '<style:style style:name="T1" style:family="text">'+
                          '<style:text-properties fo:color="#008d2c" loext:opacity="100%" fo:background-color="#a5faff"/>'+
                      '</style:style>'+
                      '<style:style style:name="T2" style:family="text">'+
                          '<style:text-properties fo:color="#000000" loext:opacity="100%"/>'+
                      '</style:style>'+
                  '<office:body>'+
                      '<office:presentation>'+
                          '<draw:page draw:name="page1" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">'+
                              '<draw:frame presentation:style-name="pr1" draw:text-style-name="P1" draw:layer="layout" svg:width="25.199cm" svg:height="9.134cm" svg:x="1.4cm" svg:y="1.026cm" presentation:class="subtitle" presentation:user-transformed="true">'+
                                  '<draw:text-box>'+
                                      '<text:p>'+
                                          `<text:span text:style-name="${expected === true ? '{d.color2:updateColorAndGetReferenceLo(#008d2c, .color1, #a5faff, T1)}' : 'T1'}">Text 1</text:span>`+
                                      '</text:p>'+
                                      '<text:p>'+
                                          `<text:span text:style-name="T2">${expected === true ? '' : '{bindColor(#008d2c, #hexa)=d.color2}'}</text:span>`+
                                      '</text:p>'+
                                      '<text:p>'+
                                          `<text:span text:style-name="T2">${expected === true ? '' : '{bindColor(#a5faff, #hexa)=d.color1}'}</text:span>`+
                                      '</text:p>'+
                                  '</draw:text-box>'+
                              '</draw:frame>'+
                          '</draw:page>'+
                      '</office:presentation>'+
                  '</office:body>'+
              '</office:document-content>';

          const _template = {
            files : [{
              name : 'content.xml',
              data : getContent()
            }]
          };
          const _options = {

          };
          const _expectedOptions = {
            colorStyleList : {
              P1: {
                file: 'content.xml',
                styleFamily: 'paragraph',
                colors: [ {
                  id: 0,
                  color: '#008d2c',
                  element: 'textColor',
                  marker: 'd.color2',
                  colorType: '#hexa'
                } ],
                attributes: ' loext:opacity="100%" loext:color-lum-mod="100%" loext:color-lum-off="0%"'
              },
              T1: {
                file: 'content.xml',
                styleFamily: 'text',
                colors: [ {
                  id: 0,
                  color: '#008d2c',
                  element: 'textColor',
                  marker: 'd.color2',
                  colorType: '#hexa'
                },
                {
                  id: 0,
                  color: '#a5faff',
                  element: 'textBackgroundColor',
                  marker: 'd.color1',
                  colorType: '#hexa'
                } ],
                attributes: ' loext:opacity="100%"'
              }
            }};
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, getContent(true));
          helper.assert(_options, _expectedOptions);
        });

        it('should insert 2 color markers and formatters from a 2 bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>')
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}">{d.name}<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.list[i].element:updateColorAndGetReferenceLo(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"><text:span text:style-name="T2"></text:span></text:p><text:p text:style-name="P5"><text:span text:style-name="T3"></text:span><text:span text:style-name="T3"></text:span><text:p text:style-name="P6"><text:span text:style-name="T2"></text:span></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList :
            {
              P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 0,  color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { id : 0, color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : '#hexa' }], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' },
              P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 1, color : '#0000ff', element : 'textColor', marker : 'd.list[i].element', colorType : '#hexa' }, { id : -1, color : 'transparent', element : 'textBackgroundColor' } ], attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"' }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert 3 color inside the footer, header and content from a 3 bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>')
            },
            {
              name : 'style.xml',
              data : parser.removeXMLInsideMarkers('<office:document-styles><office:styles><style:default-style style:family="graphic"><style:graphic-properties svg:stroke-color="#3465a4" draw:fill-color="#729fcf" fo:wrap-option="no-wrap" draw:shadow-offset-x="0.3cm" draw:shadow-offset-y="0.3cm" draw:start-line-spacing-horizontal="0.283cm" draw:start-line-spacing-vertical="0.283cm" draw:end-line-spacing-horizontal="0.283cm" draw:end-line-spacing-vertical="0.283cm" style:flow-with-text="false"/><style:paragraph-properties style:text-autospace="ideograph-alpha" style:line-break="strict" style:font-independent-line-spacing="false"><style:tab-stops/></style:paragraph-properties><style:text-properties style:use-window-font-color="true" style:font-name="Liberation Serif" fo:font-size="12pt" fo:language="en" fo:country="GB" style:letter-kerning="true" style:font-name-asian="Songti SC" style:font-size-asian="10.5pt" style:language-asian="zh" style:country-asian="CN" style:font-name-complex="Arial Unicode MS" style:font-size-complex="12pt" style:language-complex="hi" style:country-complex="IN"/></style:default-style></office:styles><office:automatic-styles><style:style style:name="MP1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP2" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties style:line-height-at-least="0.492cm"/><style:text-properties fo:color="#000000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="transparent"/></style:style><style:style style:name="MP4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent"/></style:style><style:style style:name="MT1" style:family="text"><style:text-properties fo:color="#000000"/></style:style><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021"/></style:style><style:page-layout style:name="Mpm1"><style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" style:num-format="1" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm" style:writing-mode="lr-tb" style:layout-grid-color="#c0c0c0" style:layout-grid-lines="20" style:layout-grid-base-height="0.706cm" style:layout-grid-ruby-height="0.353cm" style:layout-grid-mode="none" style:layout-grid-ruby-below="false" style:layout-grid-print="false" style:layout-grid-display="false" style:footnote-max-height="0cm"><style:footnote-sep style:width="0.018cm" style:distance-before-sep="0.101cm" style:distance-after-sep="0.101cm" style:line-style="solid" style:adjustment="left" style:rel-width="25%" style:color="#000000"/></style:page-layout-properties><style:header-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-bottom="0.499cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-top="0.499cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="MP1">{d.name}</text:p><text:p text:style-name="MP2">{bindColor(ff0000, #hexa) = d.color1}</text:p></style:header><style:footer><text:p text:style-name="MP3">{d.lastname}</text:p><text:p text:style-name="MP3"/><text:p text:style-name="MP4"><text:span text:style-name="MT1">{bindColor(0000ff, </text:span><text:span text:style-name="MT2">h</text:span><text:span text:style-name="MT3">sl</text:span><text:span text:style-name="MT1">) = d.colo</text:span><text:span text:style-name="MT4">r</text:span><text:span text:style-name="MT3">6</text:span><text:span text:style-name="MT1">}</text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>')
            }]
          };
          const _expectedTemplate = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}">{d.name}<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"><text:span text:style-name="T2"></text:span></text:p><text:p text:style-name="P5"><text:span text:style-name="T3"></text:span><text:span text:style-name="T3"></text:span><text:p text:style-name="P6"><text:span text:style-name="T2"></text:span></text:p></text:p></office:text></office:body></office:document-content>'
            },
            {
              name : 'style.xml',
              data : '<office:document-styles><office:styles><style:default-style style:family="graphic"><style:graphic-properties svg:stroke-color="#3465a4" draw:fill-color="#729fcf" fo:wrap-option="no-wrap" draw:shadow-offset-x="0.3cm" draw:shadow-offset-y="0.3cm" draw:start-line-spacing-horizontal="0.283cm" draw:start-line-spacing-vertical="0.283cm" draw:end-line-spacing-horizontal="0.283cm" draw:end-line-spacing-vertical="0.283cm" style:flow-with-text="false"/><style:paragraph-properties style:text-autospace="ideograph-alpha" style:line-break="strict" style:font-independent-line-spacing="false"><style:tab-stops/></style:paragraph-properties><style:text-properties style:use-window-font-color="true" style:font-name="Liberation Serif" fo:font-size="12pt" fo:language="en" fo:country="GB" style:letter-kerning="true" style:font-name-asian="Songti SC" style:font-size-asian="10.5pt" style:language-asian="zh" style:country-asian="CN" style:font-name-complex="Arial Unicode MS" style:font-size-complex="12pt" style:language-complex="hi" style:country-complex="IN"/></style:default-style></office:styles><office:automatic-styles><style:style style:name="MP1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP2" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties style:line-height-at-least="0.492cm"/><style:text-properties fo:color="#000000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="transparent"/></style:style><style:style style:name="MP4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent"/></style:style><style:style style:name="MT1" style:family="text"><style:text-properties fo:color="#000000"/></style:style><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021"/></style:style><style:page-layout style:name="Mpm1"><style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" style:num-format="1" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm" style:writing-mode="lr-tb" style:layout-grid-color="#c0c0c0" style:layout-grid-lines="20" style:layout-grid-base-height="0.706cm" style:layout-grid-ruby-height="0.353cm" style:layout-grid-mode="none" style:layout-grid-ruby-below="false" style:layout-grid-print="false" style:layout-grid-display="false" style:footnote-max-height="0cm"><style:footnote-sep style:width="0.018cm" style:distance-before-sep="0.101cm" style:distance-after-sep="0.101cm" style:line-style="solid" style:adjustment="left" style:rel-width="25%" style:color="#000000"/></style:page-layout-properties><style:header-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-bottom="0.499cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-top="0.499cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, MP1)}">{d.name}</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP3)}">{d.lastname}</text:p><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP3)}"/><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP4)}"><text:span text:style-name="MT1"></text:span><text:span text:style-name="MT2"></text:span><text:span text:style-name="MT3"></text:span><text:span text:style-name="MT1"></text:span><text:span text:style-name="MT4"></text:span><text:span text:style-name="MT3"></text:span><text:span text:style-name="MT1"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>'
            }]
          };
          const _options = {};
          const _expectedOptions = {
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  id        : 0,
                  color     : '#ff0000',
                  element   : 'textColor',
                  marker    : 'd.color1',
                  colorType : '#hexa'
                }, {
                  id        : 0,
                  color     : '#ffff00',
                  element   : 'textBackgroundColor',
                  marker    : 'd.color2',
                  colorType : '#hexa'
                }],
                attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"'
              },
              P4 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  id        : 0,
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  id      : -1,
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }],
                attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"'
              },
              MP1 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  id        : 0,
                  color     : '#ff0000',
                  element   : 'textColor',
                  marker    : 'd.color1',
                  colorType : '#hexa'
                }, {
                  id        : 0,
                  color     : '#ffff00',
                  element   : 'textBackgroundColor',
                  marker    : 'd.color2',
                  colorType : '#hexa'
                }],
                attributes : ' style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" style:font-size-asian="12pt" style:font-size-complex="12pt"'
              },
              MP3 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  id        : 0,
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  id      : -1,
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }],
                attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d"'
              },
              MP4 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  id        : 0,
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  id      : -1,
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }],
                attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac"'
              }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedTemplate.files[0].data);
          helper.assert(_template.files[1].data, _expectedTemplate.files[1].data);
          helper.assert(_options, _expectedOptions);
        });

        it('should throw an error because it changes the text color and background color from 2 different lists [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.list[i].color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.list2[i].color2}</text:p></office:text></office:body></office:document-content>')
            }]
          };
          assert.throws(() => color.preProcessLo(_template, {  }), {
            message : "Carbone bindColor error: it is not possible to get the color binded to the following marker: 'd.list2[i].color2'"
          });
        });
      });

      describe('getColorStyleListLo', function () {
        it('should not find any style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<xml><office:body></office:body></xml>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any color or background color attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1" style:family="text"><style:text-properties officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any FAMILLY attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any NAME attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal lowercase]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { id : 0, color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal uppercase]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : 'FF0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { id : 0, color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [background text color only]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:background-color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { id : 0, color : '#ff0000',element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa' } ], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background color]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#ffff00', colorType : 'color', marker : 'd.color2' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 0, color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { id : 0,  color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : 'color' } ], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background + static color]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [
            { referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' },
            { referenceColor : '#000000', colorType : 'color', marker : 'd.color2' },
            { referenceColor : 'transparent', colorType : 'hsl', marker : 'd.list[i].color'}
          ];
          const _expectedColorListElement = {
            P2 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 0, color : '#000000', element : 'textColor', marker : 'd.color2', colorType : 'color' }], attributes : ' officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"'},
            P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 0, color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { id : -1, color : '#ffff00', element : 'textBackgroundColor' } ], attributes : ' officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"' },
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ id : 1, color : 'transparent', element : 'textBackgroundColor', marker : 'd.list[i].color', colorType : 'hsl' }, {id : -1, color : '#0000ff', element : 'textColor' }], attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"'},
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the style contains a static text color)', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = {
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{id : 0, color : '#92AF11', element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa'}, {id : -1, color : '#0000ff', element : 'textColor'}], attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"'}
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the style contains a static text color) 2', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11" fo:color="#0000ff"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = {
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{id : 0, color : '#92AF11', element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa'}, {id : -1, color : '#0000ff', element : 'textColor'}], attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"'}
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the second color changed is a color from a list, but it needs to be the first color on the list)', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#0000ff', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.list[i].element' }];
          const _expectedColorListElement = {
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{id : 1, color : '#92AF11', element : 'textBackgroundColor', marker : 'd.list[i].element', colorType : '#hexa'}, {id : 0, color : '#0000ff', element : 'textColor', marker : 'd.color1', colorType : '#hexa'}], attributes : ' officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382"'}
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
      });
    });

    describe('ODT/ODS post processor methods', function () {
      describe('postProcessLo', function () {
        it('should do nothing if template.xml does not exist', function (done) {
          const _fileContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/><text:p text:style-name="CC1">TMTC</text:p></office:text></office:body></office:document-content>';
          const _template = {
            files : [{
              name : 'random.xml',
              data : _fileContent
            }]
          };
          const _options = {
            colorDatabase  : new Map(),
            colorStyleList : [
              {
                file        : 'template.xml',
                styleName   : 'P3',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : '#hexa'
                  }
                ]
              }
            ]
          };
          _options.colorDatabase.set('#654321#ff0000#00ffff#ffff00P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : '#654321',
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _fileContent);
          done();
        });
        it('should do nothing if options.colorDatabase is empty', function (done) {
          const _data = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/><text:p text:style-name="CC1">TMTC</text:p></office:text></office:body></office:document-content>';
          const _template = {
            files : [{
              name : 'content.xml',
              data : _data
            }]
          };
          const _options = {
            colorDatabase : new Map()
          };
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _data);
          done();
        });
        it('should do nothing if option.colorStyleList is empty', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            colorDatabase  : new Map(),
            colorStyleList : {}
          };
          _options.colorDatabase.set('{r:255,g:0,b:255}#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : { r : 255, g : 0, b : 255 },
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace the text and background color with a colortype hexa [ODP file]', function (done) {

          const getContent = (expected) => '' +
            '<?xml version="1.0" encoding="UTF-8"?>'+
            '<office:document-content>'+
                '<office:automatic-styles>'+
                    (expected === true ? '<style:style style:name="CC0" style:family="text">'+
                        '<style:text-properties fo:color="#00ffff" fo:background-color="#654321" loext:opacity="100%"/>'+
                    '</style:style>' : '') +
                '</office:automatic-styles>'+
                '<office:body>'+
                    '<office:presentation>'+
                        '<draw:page>'+
                            '<draw:frame>'+
                                '<draw:text-box>'+
                                    '<text:p>'+
                                        '<text:span text:style-name="CC0">Text 1</text:span>'+
                                    '</text:p>'+
                                '</draw:text-box>'+
                            '</draw:frame>'+
                        '</draw:page>'+
                    '</office:presentation>'+
                '</office:body>'+
            '</office:document-content>'

          const _template = {
            files : [{
              name : 'content.xml',
              data : getContent()
            }]
          };
          const _options = {
            extension      : 'odp',
            colorDatabase  : new Map(),
            colorStyleList : {
              T1: {
                file: 'content.xml',
                styleFamily: 'text',
                colors: [ {
                  id: 0,
                  color: '#008d2c',
                  element: 'textColor',
                  marker: 'd.color2',
                  colorType: '#hexa'
                },
                {
                  id: 0,
                  color: '#a5faff',
                  element: 'textBackgroundColor',
                  marker: 'd.color1',
                  colorType: '#hexa'
                } ],
                attributes: ' loext:opacity="100%"'
              }
            }
          };
          _options.colorDatabase.set('#00ffff#008d2c#654321#a5faffT1', {
            id        : 0,
            styleName : 'T1',
            colors    : [
              { newColor: '#00ffff', oldColor: '#008d2c' },
              { newColor: '#654321', oldColor: '#a5faff' }
            ]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, getContent(true));
          done();
        });

        it('should replace 1 text with a colortype hexa [ODS file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#fb02a2"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>';
          const _options = {
            extension      : 'ods',
            colorDatabase  : new Map(),
            colorStyleList : {
              Ce1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : '#hexa'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('#fb02a2#ff0000Ce1', {
            id        : 0,
            styleName : 'Ce1',
            colors    : [{
              newColor : '#fb02a2',
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace 1 text + static background + dynamic background with a multiple colortypes [ODS file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce4" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#069a2e"/><style:text-properties fo:color="#ff0000"/></style:style><style:style style:name="ce2" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#ffff00"/></style:style><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false" table:use-regular-expressions="false" table:use-wildcards="true"><table:iteration table:maximum-difference="0.0001"/></table:calculation-settings><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell><table:table-cell table:style-name="CC1" office:value-type="string" calcext:value-type="string"><text:p>Onduleur TMTC</text:p></table:table-cell><table:table-cell/><table:table-cell table:style-name="CC2" office:value-type="string" calcext:value-type="string"><text:p>Test</text:p></table:table-cell></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce4" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#069a2e"/><style:text-properties fo:color="#ff0000"/></style:style><style:style style:name="ce2" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#ffff00"/></style:style><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style><style:style style:name="CC0" style:family="table-cell"><style:text-properties fo:color="#00ffff"/><style:table-cell-properties fo:background-color="#069a2e"/></style:style><style:style style:name="CC1" style:family="table-cell"><style:table-cell-properties fo:background-color="#537326"/></style:style><style:style style:name="CC2" style:family="table-cell"><style:text-properties fo:color="#ff00ff"/><style:table-cell-properties fo:background-color="#808000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false" table:use-regular-expressions="false" table:use-wildcards="true"><table:iteration table:maximum-difference="0.0001"/></table:calculation-settings><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell><table:table-cell table:style-name="CC1" office:value-type="string" calcext:value-type="string"><text:p>Onduleur TMTC</text:p></table:table-cell><table:table-cell/><table:table-cell table:style-name="CC2" office:value-type="string" calcext:value-type="string"><text:p>Test</text:p></table:table-cell></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {
            extension      : 'ods',
            colorDatabase  : new Map(),
            colorStyleList : {
              Ce4 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#ff0000',
                    element   : 'textColor',
                    marker    : 'd.color2',
                    colorType : '#hexa' },
                  { color : '#069a2e', element : 'textBackgroundColor' }
                ]
              },
              Ce2 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#ffff00',
                    element   : 'textBackgroundColor',
                    marker    : 'd.color6',
                    colorType : 'hsl' }
                ]
              },
              Ce3 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#cccccc',
                    element   : 'textColor',
                    marker    : 'd.color5',
                    colorType : 'rgb' },
                  { color     : '#729fcf',
                    element   : 'textBackgroundColor',
                    marker    : 'd.color3',
                    colorType : 'color' }
                ]
              }
            }
          };
          _options.colorDatabase.set('#00ffff#ff0000null#069a2ece4', {
            id        : 0,
            styleName : 'Ce4',
            colors    : [
              { newColor : '#00ffff', oldColor : '#ff0000' },
              { newColor : 'null', oldColor : '#069a2e' }
            ]
          });
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#ffff00ce2', {
            id        : 1,
            styleName : 'Ce2',
            colors    : [
              { newColor : { h : 85, s : 50, l : 30 }, oldColor : '#ffff00' }
            ]
          });
          _options.colorDatabase.set('{"r":255,"g":0,"b":255}#ccccccdarkYellow#729fcfce3', {
            id        : 2,
            styleName : 'Ce3',
            colors    : [
              { newColor : { r : 255, g : 0, b : 255 }, oldColor : '#cccccc' },
              { newColor : 'darkYellow', oldColor : '#729fcf' }
            ]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace 1 text with a colortype RGB [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff00ff"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ],
                attributes : ''
              }
            }
          };
          _options.colorDatabase.set('{r:255,g:0,b:255}#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : { r : 255, g : 0, b : 255 },
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should use the old Color because the new color is undefined (returned by the builder) [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ],
                attributes : ''
              }
            }
          };
          _options.colorDatabase.set('undefined#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : undefined,
              oldColor : '#ff0000'
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should replace 1 background color with a colortype HSL [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:background-color="#537326"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textBackgroundColor',
                    colorType : 'hsl'
                  }
                ],
                attributes : ''
              }
            }
          };
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#0000ffP1', {
            id        : 0,
            styleName : 'P1',
            colors    : [{
              newColor : { h : 85, s : 50, l : 30 },
              oldColor : '#ff0000' }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should replace 1 cell color with a colortype #hexa [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="Table1" style:family="table"><style:table-properties style:width="17.59cm" table:align="margins"/></style:style><style:style style:name="Table1.A" style:family="table-column"><style:table-column-properties style:column-width="17.59cm" style:rel-column-width="65535*"/></style:style><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ffff00" fo:padding="0.097cm" fo:border="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"/><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><table:table table:name="Table1" table:style-name="Table1"><table:table-column table:style-name="Table1.A"/><table:table-row><table:table-cell table:style-name="CC0" office:value-type="string"><text:p text:style-name="Table_20_Contents"/></table:table-cell></table:table-row></table:table></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="Table1" style:family="table"><style:table-properties style:width="17.59cm" table:align="margins"/></style:style><style:style style:name="Table1.A" style:family="table-column"><style:table-column-properties style:column-width="17.59cm" style:rel-column-width="65535*"/></style:style><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ffff00" fo:padding="0.097cm" fo:border="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="CC0" style:family="table-cell"><style:table-cell-properties fo:background-color="#ff00ff" fo:padding="0.097cm" fo:border="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"/><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><table:table table:name="Table1" table:style-name="Table1"><table:table-column table:style-name="Table1.A"/><table:table-row><table:table-cell table:style-name="CC0" office:value-type="string"><text:p text:style-name="Table_20_Contents"/></table:table-cell></table:table-row></table:table></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              'Table1.A1' : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  {
                    color     : '#ffff00',
                    element   : 'textBackgroundColor',
                    colorType : '#hexa'
                  }
                ],
                attributes : ' fo:padding="0.097cm" fo:border="0.05pt solid #000000"'
              }
            }
          };
          _options.colorDatabase.set('#ff00ff#ffff00Table1.A', {
            id        : 0,
            styleName : 'Table1.A1',
            colors    : [{
              newColor : '#ff00ff',
              oldColor : '#ffff00' }],
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should replace 2 cell color and texts colors [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="Table1" style:family="table"><style:table-properties style:width="17.59cm" table:align="margins"/></style:style><style:style style:name="Table1.A" style:family="table-column"><style:table-column-properties style:column-width="8.795cm" style:rel-column-width="32767*"/></style:style><style:style style:name="Table1.B" style:family="table-column"><style:table-column-properties style:column-width="8.795cm" style:rel-column-width="32768*"/></style:style><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ffff00" fo:padding="0.097cm" fo:border-left="0.05pt solid #000000" fo:border-right="none" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="Table1.B1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ff0000" fo:padding="0.097cm" fo:border-left="none" fo:border-right="0.05pt solid #000000" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="0018fda1" officeooo:paragraph-rsid="0018fda1"/></style:style><style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="0019e3ac" officeooo:paragraph-rsid="0019e3ac"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Table_20_Contents"><style:text-properties officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"/></style:style><style:style style:name="P5" style:family="paragraph" style:parent-style-name="Table_20_Contents"><style:text-properties fo:color="#0000ff" officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8" fo:background-color="#00ff00"/></style:style></office:automatic-styles><office:body><office:text><table:table table:name="Table1" table:style-name="Table1"><table:table-column table:style-name="Table1.A"/><table:table-column table:style-name="Table1.B"/><table:table-row><table:table-cell table:style-name="CC0" office:value-type="string"><text:p text:style-name="CC1">text1</text:p></table:table-cell><table:table-cell table:style-name="CC2" office:value-type="string"><text:p text:style-name="P4">text2</text:p></table:table-cell></table:table-row></table:table></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="Table1" style:family="table"><style:table-properties style:width="17.59cm" table:align="margins"/></style:style><style:style style:name="Table1.A" style:family="table-column"><style:table-column-properties style:column-width="8.795cm" style:rel-column-width="32767*"/></style:style><style:style style:name="Table1.B" style:family="table-column"><style:table-column-properties style:column-width="8.795cm" style:rel-column-width="32768*"/></style:style><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ffff00" fo:padding="0.097cm" fo:border-left="0.05pt solid #000000" fo:border-right="none" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="Table1.B1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ff0000" fo:padding="0.097cm" fo:border-left="none" fo:border-right="0.05pt solid #000000" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="0018fda1" officeooo:paragraph-rsid="0018fda1"/></style:style><style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties officeooo:rsid="0019e3ac" officeooo:paragraph-rsid="0019e3ac"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Table_20_Contents"><style:text-properties officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"/></style:style><style:style style:name="P5" style:family="paragraph" style:parent-style-name="Table_20_Contents"><style:text-properties fo:color="#0000ff" officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8" fo:background-color="#00ff00"/></style:style><style:style style:name="CC0" style:family="table-cell"><style:table-cell-properties fo:background-color="#ff00ff" fo:padding="0.097cm" fo:border-left="0.05pt solid #000000" fo:border-right="none" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#ff00ff" fo:background-color="#f0f0f0" officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"/></style:style><style:style style:name="CC2" style:family="table-cell"><style:table-cell-properties fo:background-color="#00ffff" fo:padding="0.097cm" fo:border-left="none" fo:border-right="0.05pt solid #000000" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"><style:background-image/></style:table-cell-properties></style:style></office:automatic-styles><office:body><office:text><table:table table:name="Table1" table:style-name="Table1"><table:table-column table:style-name="Table1.A"/><table:table-column table:style-name="Table1.B"/><table:table-row><table:table-cell table:style-name="CC0" office:value-type="string"><text:p text:style-name="CC1">text1</text:p></table:table-cell><table:table-cell table:style-name="CC2" office:value-type="string"><text:p text:style-name="P4">text2</text:p></table:table-cell></table:table-row></table:table></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              'Table1.A1' : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  {
                    color     : '#ffff00',
                    element   : 'textBackgroundColor',
                    colorType : '#hexa'
                  }
                ],
                attributes : ' fo:padding="0.097cm" fo:border-left="0.05pt solid #000000" fo:border-right="none" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"'
              },
              'Table1.B1' : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textBackgroundColor',
                    colorType : '#hexa'
                  }
                ],
                attributes : ' fo:padding="0.097cm" fo:border-left="none" fo:border-right="0.05pt solid #000000" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"'
              },
              P5 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#0000ff',
                    element   : 'textColor',
                    colorType : '#hexa'
                  },
                  {
                    color     : '#00ff00',
                    element   : 'textBackgroundColor',
                    colorType : '#hexa'
                  }
                ],
                attributes : ' officeooo:rsid="001987e8" officeooo:paragraph-rsid="001987e8"'
              }
            }
          };
          _options.colorDatabase.set('#ff00ff#ffff00Table1.A1', {
            id        : 0,
            styleName : 'Table1.A1',
            colors    : [{
              newColor : '#ff00ff',
              oldColor : '#ffff00' }]
          });
          _options.colorDatabase.set('#ff00ff#ffff00P5', {
            id        : 1,
            styleName : 'P5',
            colors    : [{
              newColor : '#ff00ff',
              oldColor : '#0000ff'
            },
            {
              newColor : '#f0f0f0',
              oldColor : '#00ff00'
            }]
          });
          _options.colorDatabase.set('#00ffff#ff0000Table1.B1', {
            id        : 2,
            styleName : 'Table1.B1',
            colors    : [{
              newColor : '#00ffff',
              oldColor : '#ff0000' }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('replace 1 text + background color + static color [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#654321" fo:background-color="#00ffff"/></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#537326" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P6 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color : '#ff0000', element : 'textColor', colorType : '#hexa'
                  },
                  {
                    color : '#ffff00', element : 'textBackgroundColor', colorType : '#hexa'
                  }
                ]
              },
              P1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color : '#0000ff', element : 'textColor', colorType : 'hsl'
                  },
                  {
                    color : 'transparent', element : 'textBackgroundColor'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('#654321#ff0000#00ffff#ffff00P6', {
            id        : 0,
            styleName : 'P6',
            colors    : [
              { newColor : '#654321', oldColor : '#ff0000' },
              { newColor : '#00ffff', oldColor : '#ffff00'}
            ]
          });
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#0000ffnulltransparentP1', {
            id        : 1,
            styleName : 'P1',
            colors    : [
              { newColor : { h : 85, s : 50, l : 30 }, oldColor : '#0000ff'},
              { newColor : 'null', oldColor : 'transparent' }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should insert styles in different files: style.xml (Header + Footer) and content.xml', function () {
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              MP1 : {
                file        : 'styles.xml',
                styleFamily : 'paragraph',
                colors      : [
                  { color : '#ff0000', element : 'textColor', marker : 'd.color2', colorType : '#hexa' },
                  { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color4', colorType : 'color' }
                ],
                attributes : ''
              },
              MP3 : {
                file        : 'styles.xml',
                styleFamily : 'paragraph',
                colors      : [
                  { color : '#0000ff', element : 'textColor', marker : 'd.color5', colorType : 'rgb' },
                  { color : 'transparent', element : 'textBackgroundColor' }
                ],
                attributes : ''
              }
            }
          };
          _options.colorDatabase.set('#00ffff#ff0000red#ffff00MP1', {
            id        : 0,
            styleName : 'MP1',
            colors    : [ { newColor : '#00ffff', oldColor : '#ff0000' }, { newColor : 'red', oldColor : '#ffff00' } ]
          });
          _options.colorDatabase.set('{"r":255,"g":0,"b":255}#0000ffnulltransparentMP3', {
            id        : 1,
            styleName : 'MP3',
            colors    : [ { newColor : {r : 255, g : 0, b : 255}, oldColor : '#0000ff' }, { newColor : 'null', oldColor : 'transparent' } ]
          });
          const _expectedTemplateXml = '<office:document-content><office:automatic-styles><style:style style:name="T2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382"/></style:style><style:style style:name="T3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="T4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style></office:automatic-styles><office:body><office:text></office:text></office:body></office:document-content>';
          const _expectedStyleXml = '<office:document-styles><office:automatic-styles><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="00497cc0" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT5" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#00ffff" fo:background-color="#ff0000"/></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#ff00ff" fo:background-color="transparent"/></style:style></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="CC1">Onduleur TMTC</text:p><text:p text:style-name="CC1"/><text:p text:style-name="MP4"><text:span text:style-name="MT2"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>';
          const _template = {
            files : [{
              name : 'content.xml',
              data : _expectedTemplateXml
            },
            {
              name : 'styles.xml',
              data : '<office:document-styles><office:automatic-styles><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="00497cc0" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT5" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021" fo:background-color="transparent" loext:char-shading-value="0"/></style:style></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="CC1">Onduleur TMTC</text:p><text:p text:style-name="CC1"/><text:p text:style-name="MP4"><text:span text:style-name="MT2"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>'
            }]
          };
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedTemplateXml);
          helper.assert(_template.files[1].data, _expectedStyleXml);
        });
      });

      describe('getColorTagPropertiesLo', function () {
        it('should return the color properties from a colorStyleList', function () {
          const _colorTag =  {
            P6 : {
              styleFamily : 'paragraph',
              colors      : [
                {
                  color : '#ff0000', element : 'textColor', colorType : '#hexa'
                },
                {
                  color : '#ffff00', element : 'textBackgroundColor', colorType : 'hsl'
                }
              ]
            },
          };
          helper.assert(color.getColorTagPropertiesLo('#ff0000', _colorTag.P6.colors), {
            element   : 'textColor',
            colorType : '#hexa'
          });
          helper.assert(color.getColorTagPropertiesLo('#ffff00', _colorTag.P6.colors), {
            element   : 'textBackgroundColor',
            colorType : 'hsl'
          });
        });

        it('should return an empty color property object if the colors array is empty', function () {
          helper.assert(color.getColorTagPropertiesLo('#ff0000', []), {});
        });
      });
    });

    describe('ODS/ODT post process formatters', function () {
      describe('updateColorAndGetReferenceLo + addColorDatabase + getNewColorReferencePostProcessingLo', function () {
        it('should save in the colorDatabase Map the color Pair, generate a unique ID and return a new color reference', function () {
          const _options = {
            colorDatabase : new Map()
          };
          const _postProcess = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['#ff0000', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('#ff000038A291P1'), true);
          helper.assert(_options.colorDatabase.get('#ff000038A291P1'),
            {
              id     : 0,
              colors : [
                {
                  newColor : '#ff0000',
                  oldColor : '38A291'
                }
              ],
              styleName : 'P1'
            });
          const _colorReference = _postProcess.fn.apply(_options, _postProcess.args);
          helper.assert(_colorReference, 'CC0');
        });
        it('should save in the colorDatabase Map multiple color pair (rgb + hsl + static color), generate a unique IDs and return color references', function () {
          const _options = {
            colorDatabase : new Map()
          };
          // First Color
          const _postProcess1 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['ff0000', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('ff000038A291P1'), true);
          helper.assert(_postProcess1.fn.apply(_options, _postProcess1.args), 'CC0');
          // Second Color
          const _postProcess2 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [{r : 0, g : 255, b : 0 }, '0000ff', 'P2']);
          helper.assert(_options.colorDatabase.has('{"r":0,"g":255,"b":0}0000ffP2'), true);
          helper.assert(_options.colorDatabase.get('{"r":0,"g":255,"b":0}0000ffP2'),
            {
              id     : 1,
              colors : [
                {
                  newColor : {
                    r : 0,
                    g : 255,
                    b : 0
                  },
                  oldColor : '0000ff'
                }
              ],
              styleName : 'P2'
            });
          helper.assert(_postProcess2.fn.apply(_options, _postProcess2.args), 'CC1');
          // Third Color
          const _postProcess3 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [{h : 300, s : 100, l : 20 }, '12e2ff', 'P3']);
          helper.assert(_options.colorDatabase.has('{"h":300,"s":100,"l":20}12e2ffP3'), true);
          helper.assert(_options.colorDatabase.get('{"h":300,"s":100,"l":20}12e2ffP3'),
            {
              id     : 2,
              colors : [
                {
                  newColor : {
                    h : 300,
                    s : 100,
                    l : 20
                  },
                  oldColor : '12e2ff'
                }
              ],
              styleName : 'P3'
            });
          helper.assert(_postProcess3.fn.apply(_options, _postProcess3.args), 'CC2');
          // Fourth Color
          const _postProcess4 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [null, 'ff00ff', 'Ce2']);
          helper.assert(_options.colorDatabase.has('nullff00ffCe2'), true);
          helper.assert(_options.colorDatabase.get('nullff00ffCe2'),
            {
              id     : 3,
              colors : [
                {
                  newColor : null,
                  oldColor : 'ff00ff'
                }
              ],
              styleName : 'Ce2'
            });
          helper.assert(_postProcess4.fn.apply(_options, _postProcess4.args), 'CC3');
        });
        it('should save in the colorDatabase Map the color Pair even if the builder return the error "[[C_ERROR]]"', function () {
          const _options = {
            colorDatabase : new Map()
          };
          const _postProcess = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['[[C_ERROR]]', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('38A291P1'), true);
          helper.assert(_options.colorDatabase.get('38A291P1'),
            {
              id     : 0,
              colors : [
                {
                  newColor : '',
                  oldColor : '38A291'
                }
              ],
              styleName : 'P1'
            });
          const _colorReference = _postProcess.fn.apply(_options, _postProcess.args);
          helper.assert(_colorReference, 'CC0');
        });
      });
    });
  });

  describe('DOCX', function () {
    describe('preprocess docx for shape', function () {
      it('should replace color in graphics, background and lines of shapes ', function () {
        // const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _xml = ''
          + '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> '
          + '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14"> '
          + '  <w:body> {bindColor(FF0000, hexa) = d.color6} {bindColor(2F528F, hexa) = d.color2}'
          + '    <w:p w14:paraId="02EB8E4E" w14:textId="6205B6F0" w:rsidR="005D578A" w:rsidRDefault="005D578A"> '
          + '      <w:r> '
          + '        <mc:AlternateContent> '
          + '          <mc:Choice Requires="wps"> '
          + '            <w:drawing> '
          + '              <wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1" wp14:anchorId="10480C67" wp14:editId="6383CAFF"> '
          + '                <wp:docPr id="1" name="Oval 1" descr=""/> '
          + '                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"> '
          + '                  <a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"> '
          + '                    <wps:wsp> '
          + '                      <wps:spPr> '
          + '                        <a:solidFill> '
          + '                          <a:srgbClr val="FF0000"/> '
          + '                        </a:solidFill> '
          + '                        <a:ln> '
          + '                          <a:solidFill> '
          + '                            <a:srgbClr val="2F528F"/> '
          + '                          </a:solidFill> '
          + '                        </a:ln> '
          + '                      </wps:spPr> '
          + '                    </wps:wsp> '
          + '                  </a:graphicData> '
          + '                </a:graphic> '
          + '              </wp:anchor> '
          + '            </w:drawing> '
          + '          </mc:Choice> '
          + '        </mc:AlternateContent> '
          + '      </w:r> '
          + '    </w:p> '
          + '  </w:body> '
          + '</w:document>' ;
        const _expectedXML = ''
          + '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> '
          + '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14"> '
          + '  <w:body>  '
          + '    <w:p w14:paraId="02EB8E4E" w14:textId="6205B6F0" w:rsidR="005D578A" w:rsidRDefault="005D578A"> '
          + '      <w:r> '
          + '        <mc:AlternateContent> '
          + '          <mc:Choice Requires="wps"> '
          + '            <w:drawing> '
          + '              <wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1" wp14:anchorId="10480C67" wp14:editId="6383CAFF"> '
          + '                <wp:docPr id="1" name="Oval 1" descr=""/> '
          + '                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"> '
          + '                  <a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"> '
          + '                    <wps:wsp> '
          + '                      <wps:spPr> '
          + '                        <a:solidFill> '
          + '                          <a:srgbClr val="{d.color6:getAndConvertColorDocx(hexa, textColor)}"/> '
          + '                        </a:solidFill> '
          + '                        <a:ln> '
          + '                          <a:solidFill> '
          + '                            <a:srgbClr val="{d.color2:getAndConvertColorDocx(hexa, textColor)}"/> '
          + '                          </a:solidFill> '
          + '                        </a:ln> '
          + '                      </wps:spPr> '
          + '                    </wps:wsp> '
          + '                  </a:graphicData> '
          + '                </a:graphic> '
          + '              </wp:anchor> '
          + '            </w:drawing> '
          + '          </mc:Choice> '
          + '        </mc:AlternateContent> '
          + '      </w:r> '
          + '    </w:p> '
          + '  </w:body> '
          + '</w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers(_xml)
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data.split('> '), _expectedXML.split('> '));
      });
    });
    describe('preprocess docx', function () {
      it("should do nothing if the xml doesn't contain bindColor markers", function () {
        const _expectedXML = parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p></w:body></w:document>');
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : _expectedXML
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a text color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a cell color with a color marker + formatter', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="FF0000" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa)=d.color}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        const _expectedXML = '<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="{d.color:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a cell color with a color marker + formatter AND should remove the "themeFill" tag', function () {
        // themeFill located in the middle of the tag
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="FF0000" w:themeFill="accent6" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa)=d.color}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        // themeFill located in the end of the tag
        const _template2 = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="FF0000" w:val="clear" w:themeFill="accent6"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa)=d.color}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        // should not remove themeFill if there is no binding
        const _template3 = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="000000" w:val="clear" w:themeFill="accent6"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa)=d.color}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        const _expectedXML = '<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="{d.color:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
        color.preProcessDocx(_template2);
        helper.assert(_template2.files[0].data, _expectedXML);
        color.preProcessDocx(_template3);
        helper.assert(_template3.files[0].data, '<w:document><w:body><w:tbl><w:tr><w:trPr></w:trPr><w:tc><w:tcPr><w:tcW w:w="9972" w:type="dxa"/><w:shd w:fill="000000" w:val="clear" w:themeFill="accent6"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t></w:t></w:r></w:p></w:body></w:document>');
      });

      it('should replace mutliple cells color with color markers + formatters', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="FFFF00" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="FF0000" w:val="clear"/></w:tcPr></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="FF00FF" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="00FF00" w:val="clear"/></w:tcPr></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="00FFFF" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="0000FF" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa)=d.color}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#00ff00, #hexa)=d.color2}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#0000ff, #hexa)=d.color3}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#ffff00, #hexa)=d.color4}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#ff00ff, #hexa)=d.color5}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#00ffff, #hexa)=d.color6}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        const _expectedXML = '<w:document><w:body><w:tbl><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color4:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color5:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color2:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color6:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc><w:tc><w:tcPr><w:tcW w:w="4986" w:type="dxa"/><w:shd w:fill="{d.color3:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr></w:tc></w:tr></w:tbl><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a cell color, text color and text background color with color markers + formatters', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<w:document><w:body><w:tbl><w:tr><w:tc><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="2" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="2" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="2" w:space="0" w:color="000000"/></w:tcBorders><w:shd w:fill="FF0000" w:val="clear"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="TableContents"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:color w:val="00FF00"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="00FF00"/><w:highlight w:val="yellow"/></w:rPr><w:t>This is a text</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{bindColor(#ff0000, #hexa) = d.color}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(yellow, color) = d.color2}</w:t></w:r></w:p><w:p><w:r><w:t>{bindColor(#00ff00, hsl) = d.color3}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        const _expectedXML = '<w:document><w:body><w:tbl><w:tr><w:tc><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="2" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="2" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="2" w:space="0" w:color="000000"/></w:tcBorders><w:shd w:fill="{d.color:getAndConvertColorDocx(#hexa, textColor)}" w:val="clear"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="TableContents"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color3:getAndConvertColorDocx(hsl, textColor)}"/><w:highlight w:val="{d.color2:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="{d.color3:getAndConvertColorDocx(hsl, textColor)}"/><w:highlight w:val="{d.color2:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>This is a text</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p><w:p><w:r><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should throw an error if the color format is not defined to "color" for the background color', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, hsl) = d.color3}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };

        assert.throws(
          () => {
            color.preProcessDocx(_template);
          },
          {
            message : 'Carbone bindColor warning: the background color on DOCX documents can only be changed with the color name format, use the color format "color" instead of "hsl".',
          }
        );

      });

      it('should replace 2 text colors and a background color with a marker + formatter', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(ff0000, #hexa) = d.color1}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>')
          }]
        };
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace colors in the header and footer', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p w14:paraId="7E72D57D" w14:textId="77777777" w:rsidR="00D57CD1" w:rsidRDefault="00B14014"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>(</w:t></w:r><w:proofErr w:type="gramEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">, </w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>color</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>) = d.color3}</w:t></w:r></w:p></w:body></w:document>')
          },
          {
            name : 'word/header2.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr><w:p w14:paraId="769384A4" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr></w:pPr></w:p><w:p w14:paraId="095A1BDF" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr></w:pPr></w:p><w:p w14:paraId="5483BD9B" w14:textId="50FC70D8" w:rsidR="00870089" w:rsidRPr="00B3635C" w:rsidRDefault="00870089" w:rsidP="00B3635C"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>(</w:t></w:r><w:proofErr w:type="gramEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>ff0000, #hexa) = d.color</w:t></w:r><w:r w:rsidR="00583D40"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>2</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>}</w:t></w:r></w:p><w:p w14:paraId="7FEDA80B" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Header"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:hdr>')
          },
          {
            name : 'word/footer2.xml',
            data : parser.removeXMLInsideMarkers('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr><w:p w14:paraId="228A1212" w14:textId="3F11F73D" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>d.lastname</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>}</w:t></w:r><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:t xml:space="preserve">(0000ff, </w:t></w:r><w:r w:rsidR="00656DC2"><w:t>color</w:t></w:r><w:r><w:t>) = d.</w:t></w:r><w:r w:rsidR="00A150F9"><w:t>color</w:t></w:r><w:r w:rsidR="00656DC2"><w:t>4</w:t></w:r><w:r w:rsidR="00A150F9"><w:t xml:space="preserve"></w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w14:paraId="04E41FC2" w14:textId="77777777" w:rsidR="00870089" w:rsidRPr="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr></w:p><w:p w14:paraId="0E3F20E9" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Footer"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:ftr>')
          }]
        };

        const _expectedTemplate = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p w14:paraId="7E72D57D" w14:textId="77777777" w:rsidR="00D57CD1" w:rsidRDefault="00B14014"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="gramEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>'
          },
          {
            name : 'word/header2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr><w:p w14:paraId="769384A4" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr></w:p><w:p w14:paraId="095A1BDF" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr></w:p><w:p w14:paraId="5483BD9B" w14:textId="50FC70D8" w:rsidR="00870089" w:rsidRPr="00B3635C" w:rsidRDefault="00870089" w:rsidP="00B3635C"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="gramEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:r w:rsidR="00583D40"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r></w:p><w:p w14:paraId="7FEDA80B" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Header"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:hdr>'
          },
          {
            name : 'word/footer2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr><w:p w14:paraId="228A1212" w14:textId="3F11F73D" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t>{d.lastname}</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t></w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:t></w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:t></w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:t xml:space="preserve"></w:t></w:r><w:r w:rsidR="00656DC2"><w:t></w:t></w:r><w:r><w:t></w:t></w:r><w:r w:rsidR="00A150F9"><w:t></w:t></w:r><w:r w:rsidR="00656DC2"><w:t></w:t></w:r><w:r w:rsidR="00A150F9"><w:t xml:space="preserve"></w:t></w:r><w:r><w:t></w:t></w:r></w:p><w:p w14:paraId="04E41FC2" w14:textId="77777777" w:rsidR="00870089" w:rsidRPr="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr></w:p><w:p w14:paraId="0E3F20E9" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Footer"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:ftr>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedTemplate.files[0].data);
        helper.assert(_template.files[1].data, _expectedTemplate.files[1].data);
        helper.assert(_template.files[2].data, _expectedTemplate.files[2].data);
      });

    });

    describe('DOCX formatter methods', function () {
      describe('getAndConvertColorDocx', function () {
        // convert the color as RGB
        it('should convert the RGB color to an hexadecimal color', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, [{ r : 255, g : 255, b : 0}, 'rgb', 'textColor']), 'ffff00');
        });
        it('should convert the color name to an hexadecimal color', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, ['red', 'color', 'textColor']), 'ff0000');
        });
        it('should return an empty string if the new color is undefined', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, [undefined, 'color', 'textColor']), '');
        });
      });
    });
  });

  describe('utils', function () {
    describe('getBindColorMarkers', function () {

      it('should do nothing without bindColor marker', function (done) {
        const _xmlContent = '<style:style style:name="T11" style:family="text"><style:text-properties officeooo:rsid="00373c34"/></style:style>';
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers(_xmlContent)
        };
        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlContent);
        helper.assert(_bindColorArray.length, 0);
        done();
      });

      it('should do nothing without if the file is undefined or the file data is undefined', function (done) {
        let _bindColorArray = color.getBindColorMarkers(undefined);
        helper.assert(_bindColorArray.length, 0);
        _bindColorArray = color.getBindColorMarkers({
          name : 'content.xml',
          data : null
        });
        helper.assert(_bindColorArray.length, 0);
        done();
      });

      it('should return a single bindColor element and should clean the xml [single]', function (done) {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        const _xmlExpected = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6"><text:span text:style-name="T11"></text:span><text:span text:style-name="T11"></text:span></text:p></office:text>';
        const _expectedBindColorList = [{ referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }];

        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlExpected);
        helper.assert(_bindColorArray, _expectedBindColorList);
        done();
      });

      it('should return a bindColor elements and should clean the xml [list]', function (done) {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, color) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        const _xmlExpected = '<office:text><text:p text:style-name="P3">{d.name}<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2"><text:span text:style-name="T2"></text:span></text:p><text:p text:style-name="P5"><text:span text:style-name="T3"></text:span><text:span text:style-name="T3"></text:span></text:p><text:p text:style-name="P6"><text:span text:style-name="T11"></text:span><text:span text:style-name="T11"></text:span></text:p></office:text>';
        const _expectedBindColorList = [
          { referenceColor : 'ff0000', colorType : '#hexa', marker : 'd.color1' },
          { referenceColor : 'ffff00', colorType : 'color', marker : 'd.color2' },
          { referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }
        ];
        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlExpected);
        helper.assert(_bindColorArray, _expectedBindColorList);
        done();
      });

      it('should return an error if bindColor is invalid', function () {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff<text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file);
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "{bindColor(0000ffhsl) = d.color6}".',
        });
      });

      it('should throw an error if the bindColor marker is invalid, should clean the XML and should return an empty bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "color6".',
        });
      });

      it('should throw an error if the bindColor color type does not exist, should clean the XML and should return an empty bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">doesnotExist</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".',
        });
      });

      it('should throw an error if the color has already been defined to be replace in a previous bindColor statement, should clean the XML and should return a single element on bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : parser.removeXMLInsideMarkers('<office:text><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(ffff00, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>')
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: 2 bindColor markers try to edit the same color "ffff00".',
        });
      });

      it('should be fast to retrieve bindColor markers', function () {
        const _getContent = (h1, h2, h3) => `<office:text><text:p text:style-name="P5">{bindColor(${h1}<text:span text:style-name="T3">${h2}</text:span>${h3},#hexa)=d.color<text:span text:style-name="T3">2</text:span>}</text:p></office:text>`;
        const _getHexa = (index) => ('0' + parseInt(index).toString(16)).slice(-2);
        const _file = {
          name : 'content.xml',
          data : ''
        };
        for (let i = 0; i <= 150; i++) {
          for (let j = 0; j <= 100; j++) {
            _file.data += _getContent('00', _getHexa(j), _getHexa(i));
          }
        }
        _file.data = parser.removeXMLInsideMarkers(_file.data);
        var _start = process.hrtime();
        let res = color.getBindColorMarkers(_file);
        var _diff = process.hrtime(_start);
        var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
        console.log('\n\n bindColor parsing : '+_elapsed + ' ms (usally around 900ms) \n\n\n');
        helper.assert(_elapsed < (2000 * helper.CPU_PERFORMANCE_FACTOR), true);
        helper.assert(res.length, 15251);
      });
    });

    describe('Color format converters', function () {
      // color converters - #hexa
      it('["#hexa": #HEXA => #HEXA] should return an #hexa color from the color format "#hexa" and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter['#hexa']('#FF21A3', 'odt'), '#FF21A3');
        helper.assert(color.colorFormatConverter['#hexa']('#FF0000', 'odt'), '#FF0000');
        // DOCX
        helper.assert(color.colorFormatConverter['#hexa']('#FF21A3', 'docx'), 'FF21A3');
        helper.assert(color.colorFormatConverter['#hexa']('#FF0000', 'docx'), 'FF0000');
      });
      it('["hexa": HEXA => #HEXA] should return an #hexa color from the color format "hexa"  and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.hexa('FF21A3', 'odt'), '#FF21A3');
        helper.assert(color.colorFormatConverter.hexa('FF0000', 'odt'), '#FF0000');
        helper.assert(color.colorFormatConverter.hexa('A0B8F1', 'odt'), '#A0B8F1');
        // DOCX
        helper.assert(color.colorFormatConverter.hexa('FF21A3', 'docx'), 'FF21A3');
        helper.assert(color.colorFormatConverter.hexa('FF0000', 'docx'), 'FF0000');
        helper.assert(color.colorFormatConverter.hexa('A0B8F1', 'docx'), 'A0B8F1');
      });
      it('["rgb": RGB => #HEXA] should return an #hexa color from a RGB object format  and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.rgb({r : 19, g : 200, b : 149}, 'odt'), '#13c895');
        helper.assert(color.colorFormatConverter.rgb({r : 200, g : 140, b : 250}, 'odt'), '#c88cfa');
        helper.assert(color.colorFormatConverter.rgb({r : 0, g : 0, b : 255}, 'odt'), '#0000ff');
        // DOCX
        helper.assert(color.colorFormatConverter.rgb({r : 19, g : 200, b : 149}, 'docx'), '13c895');
        helper.assert(color.colorFormatConverter.rgb({r : 200, g : 140, b : 250}, 'docx'), 'c88cfa');
        helper.assert(color.colorFormatConverter.rgb({r : 0, g : 0, b : 255}, 'docx'), '0000ff');
      });
      it('["hsl": HSL => #HEXA] should return an #hexa color from a HSL object format  and the report type', function () {
        // ==== ODT
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 100, l : 50}, 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 142, s : 80, l : 20}, 'odt'), '#0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 300, s : 15, l : 80}, 'odt'), '#d4c4d4');
        // Ratio [0-1/0-1/0-1]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 1, l : 0.5}, 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 0.39444, s : 0.8, l : 0.2}, 'odt'), '#0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 0.8333, s : 0.15, l : 0.80}, 'odt'), '#d4c4d4');

        // ==== DOCX
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 100, l : 50}, 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 142, s : 80, l : 20}, 'docx'), '0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 300, s : 15, l : 80}, 'docx'), 'd4c4d4');
        // Ratio [0-1/0-1/0-1]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 1, l : 0.5}, 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 0.39444, s : 0.8, l : 0.2}, 'docx'), '0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 0.8333, s : 0.15, l : 0.80}, 'docx'), 'd4c4d4');
      });
      // color converters - colors
      it('["color" method: COLOR => #HEXA OR COLOR] should return an #hexa color or a color name from a color name and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.color('red', 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.color('green', 'odt'), '#00ff00');
        helper.assert(color.colorFormatConverter.color('blue', 'odt'), '#0000ff');
        // DOCX
        helper.assert(color.colorFormatConverter.color('cyan', 'docx'), '00ffff');
        helper.assert(color.colorFormatConverter.color('magenta', 'docx'), 'ff00ff');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx'), 'ffff00');
        // DOCX text color
        helper.assert(color.colorFormatConverter.color('darkCyan', 'docx', color.elementTypes.TEXT_COLOR), '008080');
        helper.assert(color.colorFormatConverter.color('darkBlue', 'docx', color.elementTypes.TEXT_COLOR), '000080');
        helper.assert(color.colorFormatConverter.color('darkGreen', 'docx', color.elementTypes.TEXT_COLOR), '008000');
        helper.assert(color.colorFormatConverter.color('darkMagenta', 'docx', color.elementTypes.TEXT_COLOR), '800080');
        helper.assert(color.colorFormatConverter.color('darkRed', 'docx', color.elementTypes.TEXT_COLOR), '800000');
        helper.assert(color.colorFormatConverter.color('darkYellow', 'docx', color.elementTypes.TEXT_COLOR), '808000');
        helper.assert(color.colorFormatConverter.color('darkGray', 'docx', color.elementTypes.TEXT_COLOR), '808080');
        helper.assert(color.colorFormatConverter.color('lightGray', 'docx', color.elementTypes.TEXT_COLOR), 'c0c0c0');
        // DOCX background color
        helper.assert(color.colorFormatConverter.color('magenta', 'docx', color.elementTypes.TEXT_BG_COLOR), 'magenta');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx', color.elementTypes.TEXT_BG_COLOR), 'yellow');
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [1] [DOCX].', function () {
        assert.throws(() => color.colorFormatConverter.color('greem', 'docx'), {
          message : 'Carbone bindColor warning: the color "greem" does not exist. Do you mean "green"?'
        });
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [2] [DOCX].', function () {
        assert.throws(() => color.colorFormatConverter.color('darkGrey', 'docx'), {
          message : 'Carbone bindColor warning: the color "darkGrey" does not exist. Do you mean "darkGray"?'
        });
      });

      it('["color" method for DOCX] should throw an error if the color background name used is "transparent".', function () {
        assert.throws(() => color.colorFormatConverter.color('transparent', 'docx', 'textBackgroundColor'), {
          message : 'Carbone bindColor warning: DOCX document does not support "transparent" as a background color.'
        });
      });

      // color converters - hslToRGB
      it('["hslToRgb": HSL => RGB] should return a RGB color from a HSL object format', function () {
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hslToRgb({h : 0, s : 100, l : 0}), {r : 0, g : 0, b : 0});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 0, s : 100, l : 50}), {r : 255, g : 0, b : 0});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 142, s : 80, l : 20}), {r : 10, g : 92, b : 40});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 300, s : 15, l : 80}), {r : 212, g : 196, b : 212});
      });

      it('[manageHexadecimalHashtag] should return the hexadecimal with OR without hashtag based on the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000', 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b', 'odt'), '#ff238b');
        // DOCX
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000', 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b', 'docx'), 'ff238b');
        // Without report type
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000'), 'ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b'), 'ff238b');
        // Random
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(undefined, 'odt'), undefined);
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(null), null);
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(undefined), undefined);
      });
    });
  });
});
