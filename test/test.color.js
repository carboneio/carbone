const color = require('../lib/color');
const helper = require('../lib/helper');
const assert = require('assert');
const colorFormatters = require('../formatters/color');

describe('Dynamic colors', function () {
  describe('ODT Files', function () {
    describe('ODT/ODS pre processor methods', function () {
      describe('preProcessLo', function () {
        it('should insert a color marker and formatter from a single bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, null, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = { colorStyleList : { P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor' }] } } };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert a color marker and formatter from a single bindColor marker [ODS]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="ce1" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{bindColor(FF0000, #hexa) = d.color2}</text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="{d.color2:updateColorAndGetReferenceLo(#ff0000, ce1)}" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p></text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = {
            colorStyleList : {
              ce1 : {
                styleFamily : 'table-cell',
                colors      : [{ color : '#ff0000', element : 'textColor', marker : 'd.color2', colorType : '#hexa' }]
              }
            }};
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        // should insert color markers and formatters from multiple bindColor marker
        it('should insert 2 color markers and formatters from a 2 bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.list[i].element:updateColorAndGetReferenceLo(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"><text:p text:style-name="P6"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList :
            {
              P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : '#hexa' }] },
              P4 : { styleFamily : 'paragraph', colors : [{ color : '#0000ff', element : 'textColor', marker : 'd.list[i].element', colorType : '#hexa' }, { color : 'transparent', element : 'textBackgroundColor' } ] }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });
        //

        it('should throw an error because it changes the text color and background color from 2 different lists [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.list[i].color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.list2[i].color2}</text:p></office:text></office:body></office:document-content>'
            }]
          };
          assert.throws(() => color.preProcessLo(_template, {  }), {
            message : "Carbone bindColor error: it is not possible to get the color binded to the following marker: 'd.list[i].color1'"
          });
        });
      });

      describe('getColorStyleListLo', function () {
        it('should not find any style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<xml><office:body></office:body></xml>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any color or background color attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1" style:family="text"><style:text-properties officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any FAMILLY attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any NAME attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal lowercase]', function (done) {
          const _xmlContent = '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal uppercase]', function (done) {
          const _xmlContent = '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : 'FF0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [background text color only]', function (done) {
          const _xmlContent = '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:background-color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background color]', function (done) {
          const _xmlContent = ' <style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#ffff00', colorType : 'color', marker : 'd.color2' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : 'color' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background + static color]', function (done) {
          const _xmlContent = ' <style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [
            { referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' },
            { referenceColor : '#000000', colorType : 'color', marker : 'd.color2' },
            { referenceColor : 'transparent', colorType : 'hsl', marker : 'd.list[i].color'}
          ];
          const _expectedColorListElement = {
            P2 : { styleFamily : 'paragraph', colors : [{ color : '#000000', element : 'textColor', marker : 'd.color2', colorType : 'color' }]},
            P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor' } ] },
            P4 : { styleFamily : 'paragraph', colors : [{ color : 'transparent', element : 'textBackgroundColor', marker : 'd.list[i].color', colorType : 'hsl' }, {color : '#0000ff', element : 'textColor' }]},
          };
          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the style contains a static text color)', function (done) {
          const _xmlContent = '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>';
          const _bindColorList = [{ referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = {
            P4 : { styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor'}]}
          };
          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the second color changed is a color from a list, but it needs to be the first color on the list)', function (done) {
          const _xmlContent = '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>';
          const _bindColorList = [{ referenceColor : '#0000ff', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.list[i].element' }];
          const _expectedColorListElement = {
            P4 : { styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.list[i].element', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor', marker : 'd.color1', colorType : '#hexa'}]}
          };
          const _colorStyleList = color.getColorStyleListLo(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
      });
    });

    describe('ODT/ODS post processor methods', function () {
      describe('postProcessLo', function () {
        it('should do nothing if template.xml does not exist', function (done) {
          const _template = {
            files : [{
              name : 'random.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/><text:p text:style-name="CC1">TMTC</text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _options = {
            colorDatabase  : new Map(),
            colorStyleList : [
              {
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
          assert.throws(()=> {
            color.postProcessLo(_template, null, _options);
          }, {
            message : 'the "content.xml" file does not exist.'
          });
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
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce4" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#069a2e"/><style:text-properties fo:color="#ff0000"/></style:style><style:style style:name="ce2" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#ffff00"/></style:style><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style><style:style style:name="CC0" style:family="table-cell"><style:text-properties fo:color="#00ffff"/><style:table-cell-properties fo:background-color="#069a2e"/></style:style><style:style style:name="CC1" style:family="table-cell"><style:table-cell-properties fo:background-color="#537326"/></style:style><style:style style:name="CC2" style:family="table-cell"><style:text-properties fo:color="#ff00ff"/><style:table-cell-properties fo:background-color="#898900"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false" table:use-regular-expressions="false" table:use-wildcards="true"><table:iteration table:maximum-difference="0.0001"/></table:calculation-settings><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell><table:table-cell table:style-name="CC1" office:value-type="string" calcext:value-type="string"><text:p>Onduleur TMTC</text:p></table:table-cell><table:table-cell/><table:table-cell table:style-name="CC2" office:value-type="string" calcext:value-type="string"><text:p>Test</text:p></table:table-cell></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {
            extension      : 'ods',
            colorDatabase  : new Map(),
            colorStyleList : {
              Ce4 : {
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
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#ffff00',
                    element   : 'textBackgroundColor',
                    marker    : 'd.color6',
                    colorType : 'hsl' }
                ]
              },
              Ce3 : {
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
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff00ff" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ]
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
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff0000" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ]
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
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:background-color="#537326" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P1 : {
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textBackgroundColor',
                    colorType : 'hsl'
                  }
                ]
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
        it('replace 1 text + background color + static color [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#654321" fo:background-color="#00ffff" /></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#537326" fo:background-color="transparent" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P6 : {
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
    describe('preprocess docx', function () {
      it ("should do nothing if the xml doesn't contain bindColor markers", function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : _expectedXML
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should throw an error if the color format is not defined to "color" for the background color', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, hsl) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
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

      it ('should replace 2 text colors and a background color with a marker + formatter', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(ff0000, #hexa) = d.color1}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

    });

    describe('DOCX formatter methods', function () {
      describe('getAndConvertColorDocx', function () {
        // convert the color as RGB
        it('should convert the RGB color to an hexadecimal color', function() {
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
        color.getBindColorMarkers(_xmlContent, (err, newXmlContent, bindColorArray) => {
          helper.assert(err+'', 'null');
          helper.assert(newXmlContent, _xmlContent);
          helper.assert(bindColorArray.length, 0);
          done();
        });
      });

      it('should return a single bindColor element and should clean the xml [single]', function (done) {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        const _xmlExpectedContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6"></text:p></office:text>';
        const _expectedBindColorList = [{ referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }];
        color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
          helper.assert(err+'', 'null');
          helper.assert(newXmlContent, _xmlExpectedContent);
          helper.assert(bindColorArray, _expectedBindColorList);
          done();
        });
      });

      it('should return a bindColor elements and should clean the xml [list]', function (done) {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, color) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        const _xmlExpectedContent = '<office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"></text:p><text:p text:style-name="P6"></text:p></office:text>';
        const _expectedBindColorList = [
          { referenceColor : 'ff0000', colorType : '#hexa', marker : 'd.color1' },
          { referenceColor : 'ffff00', colorType : 'color', marker : 'd.color2' },
          { referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }
        ];
        color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
          helper.assert(err+'', 'null');
          helper.assert(newXmlContent, _xmlExpectedContent);
          helper.assert(bindColorArray, _expectedBindColorList);
          done();
        });
      });

      it('should return an error if bindColor is invalid', function () {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff<text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        assert.throws(() => {
          color.getBindColorMarkers(_xmlInitialContent, () => {});
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "{bindColor(0000ffhsl)=d.color6}".',
        });
      });

      it('should throw an error if the bindColor marker is invalid, should clean the XML and should return an empty bindColorArray', function () {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        assert.throws(() => {
          color.getBindColorMarkers(_xmlInitialContent, () => {});
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "color6".',
        });

      });

      it('should throw an error if the bindColor color type does not exist, should clean the XML and should return an empty bindColorArray', function () {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">doesnotExist</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        assert.throws(() => {
          color.getBindColorMarkers(_xmlInitialContent, () => {});
        }, {
          message : 'Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".',
        });
      });

      it('should throw an error if the color has already been defined to be replace in a previous bindColor statement, should clean the XML and should return a single element on bindColorArray', function () {
        const _xmlInitialContent = '<office:text><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(ffff00, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
        assert.throws(() => {
          color.getBindColorMarkers(_xmlInitialContent, () => {});
        }, {
          message : 'Carbone bindColor warning: 2 bindColor markers try to edit the same color "ffff00".',
        });
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
        helper.assert(color.colorFormatConverter.color('blue', 'odt'), '#0000ff');
        helper.assert(color.colorFormatConverter.color('magenta', 'odt'), '#ff00ff');
        helper.assert(color.colorFormatConverter.color('yellow', 'odt'), '#ffff00');
        // DOCX
        helper.assert(color.colorFormatConverter.color('blue', 'docx'), '0000ff');
        helper.assert(color.colorFormatConverter.color('magenta', 'docx'), 'ff00ff');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx'), 'ffff00');
        // DOCX
        helper.assert(color.colorFormatConverter.color('blue', 'docx', color.elementTypes.TEXT_COLOR), '0000ff');
        helper.assert(color.colorFormatConverter.color('green', 'docx', color.elementTypes.TEXT_COLOR), '00ff00');
        helper.assert(color.colorFormatConverter.color('blue', 'docx', color.elementTypes.TEXT_BG_COLOR), 'blue');
        helper.assert(color.colorFormatConverter.color('magenta', 'docx', color.elementTypes.TEXT_BG_COLOR), 'magenta');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx', color.elementTypes.TEXT_BG_COLOR), 'yellow');
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [1].', function () {
        assert.throws(() => color.colorFormatConverter.color('greem', 'docx'), {
          message : 'Carbone bindColor warning: the color "greem" does not exist. Do you mean "green"?'
        });
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [2].', function () {
        assert.throws(() => color.colorFormatConverter.color('darkGrey', 'docx'), {
          message : 'Carbone bindColor warning: the color "darkGrey" does not exist. Do you mean "darkGray"?'
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
