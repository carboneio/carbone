const color = require('../lib/color');
const helper = require('../lib/helper');

describe('Dynamic colors', function () {

  describe('ODT Files', function () {
    describe('pre processor methods', function () {
      describe('preProcessODT', function () {

        beforeEach( function () {
          this.sinon.stub(console, 'error');
        });

        it('should do nothing if the file content.xml does not exist', function () {
          const _template = {
            files : [{
              name : 'random.xml',
              data : '<xml></xml>'
            }]
          };
          color.preProcessODT(_template, {});
          helper.assert(_template, {
            files : [{
              name : 'random.xml',
              data : '<xml></xml>'
            }]
          });
        });
        it('should insert a color marker and formatter from a single bindColor marker', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="{d.color1:updateColorAndGetReference(#ff0000, null, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList : { P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor' }] } } };
          color.preProcessODT(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        // should insert color markers and formatters from multiple bindColor marker
        it('should insert a color marker and formatter from a single bindColor marker', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReference(#ff0000, .color2, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="{d.color1:updateColorAndGetReference(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.list[i].element:updateColorAndGetReference(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"><text:p text:style-name="P6"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList :
            {
              P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : '#hexa' }] },
              P4 : { styleFamily : 'paragraph', colors : [{ color : '#0000ff', element : 'textColor', marker : 'd.list[i].element', colorType : '#hexa' }, { color : 'transparent', element : 'textBackgroundColor' } ] }
            }
          };
          color.preProcessODT(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });
        //

        it('should console an error because it changes the text color and background color from 2 different lists', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.list[i].color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.list2[i].color2}</text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.list2[i].color2:updateColorAndGetReference(#ffff00, null, #ff0000, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList : { P3 : { styleFamily : 'paragraph', colors : [{color : '#ffff00', element : 'textBackgroundColor',  marker : 'd.list2[i].color2', colorType : '#hexa' }, {color : '#ff0000', element : 'textColor',  marker : 'd.list[i].color1', colorType : '#hexa' }] } } };
          color.preProcessODT(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
          helper.assert(console.error.calledOnce, true);
          helper.assert(console.error.calledWith("Carbone bindColor error: it is not possible to get the color binded to the following marker: 'd.list[i].color1'"), true);
        });

      });
      describe('getBindColorMarkers', function () {
        beforeEach( function () {
          this.sinon.stub(console, 'warn');
        });

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
          const _expectedBindColorList = [{ referenceColor : '#0000ff', colorType : 'hsl', marker : 'd.color6' }];
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
            { referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' },
            { referenceColor : '#ffff00', colorType : 'color', marker : 'd.color2' },
            { referenceColor : '#0000ff', colorType : 'hsl', marker : 'd.color6' }
          ];
          color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
            helper.assert(err+'', 'null');
            helper.assert(newXmlContent, _xmlExpectedContent);
            helper.assert(bindColorArray, _expectedBindColorList);
            done();
          });
        });

        it('should return an error if bindColor is invalid', function (done) {
          const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff<text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
          color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
            helper.assert(err, '{bindColor(0000ffhsl)=d.color6} ');
            helper.assert(newXmlContent, undefined);
            helper.assert(bindColorArray, undefined);
            done();
          });
        });

        it('should return a console warning if the bindColor marker is invalid, should clean the XML and should return an empty bindColorArray', function (done) {
          const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
          color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
            helper.assert(err+'', 'null');
            helper.assert(newXmlContent, '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6"></text:p></office:text>');
            helper.assert(bindColorArray.length, 0);
            helper.assert(console.warn.calledOnce, true);
            helper.assert(console.warn.calledWith("Carbone bindColor warning: the marker is not valid 'color6'."), true);
            done();
          });
        });

        it('should return a console warning if the bindColor color type does not exist, should clean the XML and should return an empty bindColorArray', function (done) {
          const _xmlInitialContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">doesnotExist</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
          color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
            helper.assert(err+'', 'null');
            helper.assert(newXmlContent, '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6"></text:p></office:text>');
            helper.assert(bindColorArray.length, 0);
            helper.assert(console.warn.calledOnce, true);
            helper.assert(console.warn.calledWith('Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".'), true);
            done();
          });
        });

        it('should return a console warning if the color has already been defined to be replace in a previous bindColor statement, should clean the XML and should return a single element on bindColorArray', function (done) {
          const _xmlInitialContent = '<office:text><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(ffff00, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>';
          const _expectedBindColorList = [{ referenceColor : '#ffff00', colorType : '#hexa', marker : 'd.color2' }];
          color.getBindColorMarkers(_xmlInitialContent, (err, newXmlContent, bindColorArray) => {
            helper.assert(err+'', 'null');
            helper.assert(newXmlContent, '<office:text><text:p text:style-name="P5"></text:p><text:p text:style-name="P6"></text:p></office:text>');
            helper.assert(bindColorArray.length, 1);
            helper.assert(bindColorArray, _expectedBindColorList);
            helper.assert(console.warn.calledOnce, true);
            helper.assert(console.warn.calledWith("Carbone bindColor warning: 2 bindColor markers try to edit the same color 'ffff00'."), true);
            done();
          });
        });
      });
      describe('getColorStyleListODT', function () {
        it('should not find any style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<xml><office:body></office:body></xml>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any color or background color attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1" style:family="text"><style:text-properties officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any familly attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any name attribute on the style and return an empty colorStyleList', function (done) {
          const _xmlContent = '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only]', function (done) {
          const _xmlContent = '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [background text color only]', function (done) {
          const _xmlContent = '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:background-color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background color]', function (done) {
          const _xmlContent = ' <style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>';
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#ffff00', colorType : 'color', marker : 'd.color2' }];
          const _expectedColorListElement = { P3 : { styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : 'color' } ] } };

          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
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
          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the style contains a static text color)', function (done) {
          const _xmlContent = '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>';
          const _bindColorList = [{ referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = {
            P4 : { styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor'}]}
          };
          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the second color changed is a color from a list, but it needs to be the first color on the list)', function (done) {
          const _xmlContent = '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>';
          const _bindColorList = [{ referenceColor : '#0000ff', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.list[i].element' }];
          const _expectedColorListElement = {
            P4 : { styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.list[i].element', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor', marker : 'd.color1', colorType : '#hexa'}]}
          };
          const _colorStyleList = color.getColorStyleListODT(_xmlContent, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
      });
    });
  });
});
