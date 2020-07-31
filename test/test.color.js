const color = require('../lib/color');
const helper = require('../lib/helper');

describe('Dynamic colors', function () {

  describe('ODT Files', function () {
    describe('pre processor methods', function () {
      describe.only('getBindColorMarkers', function () {
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
            // console.log(bindColorArray);
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
    });
  });
});
