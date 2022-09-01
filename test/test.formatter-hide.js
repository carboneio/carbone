var preprocessor = require('../lib/preprocessor');
var helper = require('../lib/helper');

describe.only('hide formatter', function () {

  describe('hide(p)', function() {

    describe('DOCX', function () {

      it('should replace the hide(p) by hideBegin/hideEnd - basic paragraph', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:body>' +
              (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone>' : '') +
              '<w:p w14:paraId="5C4E8B45" w14:textId="08330C66" w:rsidR="005A25A6" w:rsidRDefault="00C301BD">'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>'
        }

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          console.log(res.files);
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the hide(p) by hideBegin/hideEnd - long paragraph and similar <w:p tags', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:body>' +
              (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone>' : '') +
              '<w:p w14:paraId="5C4E8B45" w14:textId="08330C66" w:rsidR="005A25A6" w:rsidRDefault="00C301BD">'+
                '<w:pPr>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                '</w:pPr>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
                '<w:pPr>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                '</w:pPr>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  '<w:br/>'+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>'
        }

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          console.log(res.files);
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the hide(p) by hideBegin/hideEnd - two hide on the same paragraph, and another hide on the next paragraph', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:body>' +
              (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone><carbone>{d.desc:ifEM:hideBegin}</carbone>' : '') +
              '<w:p w14:paraId="5C4E8B45" w14:textId="08330C66" w:rsidR="005A25A6" w:rsidRDefault="00C301BD">'+
                '<w:pPr>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                '</w:pPr>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.desc}${expected ? '' : '{d.desc:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.desc:ifEM:hideEnd}</carbone><carbone>{d.name:ifEM:hideEnd}</carbone>' : '') +
              (expected ? '<carbone>{d.label:ifEM:hideBegin}</carbone>' : '') +
              '<w:p>'+
                '<w:pPr>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                '</w:pPr>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.label}${expected ? '' : '{d.label:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.label:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>'
        }

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          console.log(res.files);
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

    })

    describe('ODT', function () {

    })

  });

  describe('hide(img)', function() {

    describe('DOCX', function () {
      it.skip('should replace the hide(img) by hideBegin/hideEnd - basic image', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:body>' +
              (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone>' : '') +
              '<w:p w14:paraId="5C4E8B45" w14:textId="08330C66" w:rsidR="005A25A6" w:rsidRDefault="00C301BD">'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:hide(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>'
        }

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          console.log(res.files);
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });
    })

    describe('ODT', function () {

    })

  });

  describe('hide(shape)', function() {

    describe('DOCX', function () {

    })

    describe('ODT', function () {

    })

  });

  describe('hide(chart)', function() {

    describe('DOCX', function () {

    })

    describe('ODT', function () {

    })

  });

  describe('hide(row)', function() {
    describe('DOCX', function () {
      it('should do nothing if the XML if not valid', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.desc} {d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            // '</w:tr>'+ Missing end row tag
          '</w:tbl>';

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _templateContent);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters - basic', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00CF4F0C" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>'

        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>' +
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00CF4F0C" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t>{d.desc}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>' +
          '</w:tbl>'

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatter even if the rows has `trP`  ', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              `<w:trPr>` + // SPECIAL TAG FOR ROW PROPERTIES
                `<w:cantSplit/>` +
                `<w:tblHeader/>` +
              `</w:trPr>` +
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00CF4F0C" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>'

        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>' +
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              `<w:trPr>` +
                `<w:cantSplit/>` +
                `<w:tblHeader/>` +
              `</w:trPr>` +
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00CF4F0C" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t>{d.desc}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>' +
          '</w:tbl>'

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters into 2 different rows', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tblPr>'+
              '<w:tblStyle w:val="TableGrid"/>'+
              '<w:tblW w:w="0" w:type="auto"/>'+
              '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'+
            '</w:tblPr>'+
            '<w:tblGrid>'+
              '<w:gridCol w:w="9350"/>'+
            '</w:tblGrid>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="6187F68B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="6C1AF723" w14:textId="7E52B32C" w:rsidR="00CF4F0C" w:rsidRPr="00324098" w:rsidRDefault="00324098" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                  '</w:pPr>'+
                  '<w:r w:rsidRPr="00324098">'+
                    '<w:t>{d.name}{d.name:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00324098" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                  '</w:pPr>'+
                  '<w:r w:rsidRPr="00324098">'+
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>';

        const _expectedResult = '' +
          '<w:tbl>'+
            '<w:tblPr>'+
              '<w:tblStyle w:val="TableGrid"/>'+
              '<w:tblW w:w="0" w:type="auto"/>'+
              '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'+
            '</w:tblPr>'+
            '<w:tblGrid>'+
              '<w:gridCol w:w="9350"/>'+
            '</w:tblGrid>'+
            '<carbone>{d.name:ifEM:hideBegin}</carbone>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="6187F68B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="6C1AF723" w14:textId="7E52B32C" w:rsidR="00CF4F0C" w:rsidRPr="00324098" w:rsidRDefault="00324098" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                  '</w:pPr>'+
                  '<w:r w:rsidRPr="00324098">'+
                    '<w:t>{d.name}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.name:ifEM:hideEnd}</carbone>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:tc>'+
                '<w:tcPr>'+
                  '<w:tcW w:w="9350" w:type="dxa"/>'+
                '</w:tcPr>'+
                '<w:p w14:paraId="380A2403" w14:textId="4D89F94B" w:rsidR="00CF4F0C" w:rsidRPr="00324098" w:rsidRDefault="00CF4F0C" w:rsidP="00CF4F0C">'+
                  '<w:pPr>'+
                    '<w:tabs>'+
                      '<w:tab w:val="left" w:pos="455"/>'+
                    '</w:tabs>'+
                  '</w:pPr>'+
                  '<w:r w:rsidRPr="00324098">'+
                    '<w:t>{d.desc}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>'+
          '</w:tbl>';

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace multiple hide(row) by hideBegin/hideEnd formatters before and after the same row', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.name}{d.name:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                  '<w:r>'+
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>';

        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.name:ifEM:hideBegin}</carbone>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.name}</w:t>'+
                  '</w:r>'+
                  '<w:r>'+
                    '<w:t>{d.desc}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>'+
            '<carbone>{d.name:ifEM:hideEnd}</carbone>'+
          '</w:tbl>';


        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters even if the row includes a table BEFORE the hide(row)', function (done) {
        const _templateContent = '' +
          '<w:tbl>' +
            '<w:tr>' +
              '<w:tc>' +
                '<w:tbl>' +
                  '<w:tr>' +
                    '<w:tc>' +
                      '<w:tcPr>' +
                        '<w:tcW/>' +
                      '</w:tcPr>' +
                      '<w:p>' +
                        '<w:pPr>' +
                          '<w:tabs>' +
                            '<w:tab w:val="left" w:pos="455"/>' +
                          '</w:tabs>' +
                          '<w:rPr>' +
                            '<w:lang w:val="en-US"/>' +
                          '</w:rPr>' +
                        '</w:pPr>' +
                      '</w:p>' +
                    '</w:tc>' +
                  '</w:tr>' +
                '</w:tbl>' +
              '</w:tc>' +
              '<w:tc>' +
                '<w:p>' +
                  '<w:r>' +
                    '<w:rPr>' +
                      '<w:lang w:val="en-US"/>' +
                    '</w:rPr>' +
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>' +
                  '</w:r>' +
                '</w:p>' +
              '</w:tc>' +
            '</w:tr>' +
          '</w:tbl>'

        const _expectedResult = '' +
          '<w:tbl>' +
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>' +
            '<w:tr>' +
              '<w:tc>' +
                '<w:tbl>' +
                  '<w:tr>' +
                    '<w:tc>' +
                      '<w:tcPr>' +
                        '<w:tcW/>' +
                      '</w:tcPr>' +
                      '<w:p>' +
                        '<w:pPr>' +
                          '<w:tabs>' +
                            '<w:tab w:val="left" w:pos="455"/>' +
                          '</w:tabs>' +
                          '<w:rPr>' +
                            '<w:lang w:val="en-US"/>' +
                          '</w:rPr>' +
                        '</w:pPr>' +
                      '</w:p>' +
                    '</w:tc>' +
                  '</w:tr>' +
                '</w:tbl>' +
              '</w:tc>' +
              '<w:tc>' +
                '<w:p>' +
                  '<w:r>' +
                    '<w:rPr>' +
                      '<w:lang w:val="en-US"/>' +
                    '</w:rPr>' +
                    '<w:t>{d.desc}</w:t>' +
                  '</w:r>' +
                '</w:p>' +
              '</w:tc>' +
            '</w:tr>' +
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>' +
          '</w:tbl>'

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters even if the row includes a table AFTER the hide(row)', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.desc}{d.desc:ifEM:hide(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
              '<w:tc>'+
                '<w:tbl>'+
                  '<w:tr>'+
                    '<w:tc>'+
                      '<w:tcPr>'+
                        '<w:tcW w:w="2749" w:type="dxa"/>'+
                      '</w:tcPr>'+
                      '<w:p>'+
                        '<w:pPr>'+
                          '<w:tabs>'+
                            '<w:tab w:val="left" w:pos="455"/>'+
                          '</w:tabs>'+
                          '<w:rPr>'+
                            '<w:lang w:val="en-US"/>'+
                          '</w:rPr>'+
                        '</w:pPr>'+
                      '</w:p>'+
                    '</w:tc>'+
                  '</w:tr>'+
                '</w:tbl>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>'


        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>' +
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.desc}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
              '<w:tc>'+
                '<w:tbl>'+
                  '<w:tr>'+
                    '<w:tc>'+
                      '<w:tcPr>'+
                        '<w:tcW w:w="2749" w:type="dxa"/>'+
                      '</w:tcPr>'+
                      '<w:p>'+
                        '<w:pPr>'+
                          '<w:tabs>'+
                            '<w:tab w:val="left" w:pos="455"/>'+
                          '</w:tabs>'+
                          '<w:rPr>'+
                            '<w:lang w:val="en-US"/>'+
                          '</w:rPr>'+
                        '</w:pPr>'+
                      '</w:p>'+
                    '</w:tc>'+
                  '</w:tr>'+
                '</w:tbl>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.desc:ifEM:hideEnd}</carbone>' +
          '</w:tbl>'

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace a hide(row) at the root table, and a second embed into a child table', function (done) {
        const _templateContent = '' +
        '<w:tbl>'+
          '<w:tr w:rsidR="009F5344" w14:paraId="2ED0E191" w14:textId="77777777" w:rsidTr="009F5344">'+
            '<w:tc>'+
              '<w:p w14:paraId="1FD37E5C" w14:textId="0FA34AEB" w:rsidR="00D31EF7" w:rsidRDefault="00D31EF7">'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  '<w:t>{d.title}</w:t>'+
                '</w:r>'+
              '</w:p>'+
              '<w:tbl>'+
                '<w:tr w:rsidR="009F5344" w14:paraId="42E6BCD0" w14:textId="77777777" w:rsidTr="009F5344">'+
                  '<w:tc>'+
                    '<w:p w14:paraId="18D51DD9" w14:textId="479843EF" w:rsidR="009F5344" w:rsidRPr="00D31EF7" w:rsidRDefault="004D1A97">'+
                      '<w:r w:rsidRPr="00D31EF7">'+
                        '<w:t>{d.desc}</w:t>'+
                      '</w:r>'+
                      '<w:r w:rsidR="009F5344" w:rsidRPr="00D31EF7">'+
                        '<w:t>{d.desc:ifEM:hide(row)}</w:t>'+ // HIDE ROW EMBED INTO A CHILD TABLE
                      '</w:r>'+
                    '</w:p>'+
                  '</w:tc>'+
                '</w:tr>'+
              '</w:tbl>'+
              '<w:p w14:paraId="015ED9A9" w14:textId="63AF0518" w:rsidR="009F5344" w:rsidRPr="009F5344" w:rsidRDefault="009F5344">'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  '<w:t>{d.show:ifEQ(false):hide(row)}</w:t>'+ // SECOND hide(row) AT THE ROOT OF THE TABLE
                '</w:r>'+
              '</w:p>'+
            '</w:tc>'+
          '</w:tr>'+
        '</w:tbl>'


        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.show:ifEQ(false):hideBegin}</carbone>'+
            '<w:tr w:rsidR="009F5344" w14:paraId="2ED0E191" w14:textId="77777777" w:rsidTr="009F5344">'+
              '<w:tc>'+
                '<w:p w14:paraId="1FD37E5C" w14:textId="0FA34AEB" w:rsidR="00D31EF7" w:rsidRDefault="00D31EF7">'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t>{d.title}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
                '<w:tbl>'+
                  '<carbone>{d.desc:ifEM:hideBegin}</carbone>'+
                  '<w:tr w:rsidR="009F5344" w14:paraId="42E6BCD0" w14:textId="77777777" w:rsidTr="009F5344">'+
                    '<w:tc>'+
                      '<w:p w14:paraId="18D51DD9" w14:textId="479843EF" w:rsidR="009F5344" w:rsidRPr="00D31EF7" w:rsidRDefault="004D1A97">'+
                        '<w:r w:rsidRPr="00D31EF7">'+
                          '<w:t>{d.desc}</w:t>'+
                        '</w:r>'+
                        '<w:r w:rsidR="009F5344" w:rsidRPr="00D31EF7">'+
                          '<w:t></w:t>'+
                        '</w:r>'+
                      '</w:p>'+
                    '</w:tc>'+
                  '</w:tr>'+
                  '<carbone>{d.desc:ifEM:hideEnd}</carbone>'+
                '</w:tbl>'+
                '<w:p w14:paraId="015ED9A9" w14:textId="63AF0518" w:rsidR="009F5344" w:rsidRPr="009F5344" w:rsidRDefault="009F5344">'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:lang w:val="en-US"/>'+
                    '</w:rPr>'+
                    '<w:t></w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
            '<carbone>{d.show:ifEQ(false):hideEnd}</carbone>'+
          '</w:tbl>'

        var _report = {
          isZipped   : true,
          filename   : 'template.docx',
          extension  : 'docx',
          embeddings : [],
          files      : [
            { name : 'document.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });
    });

    describe('ODT', function () {
      it('should do nothing if the XML if not valid', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            // '</table:table-row>' + // MISSING A TABLE ROW
          '</table:table>';

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _templateContent);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatter within the table XML', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>'+
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>'+
          '</table:table>';

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters into 2 different rows', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}{d.list[i].name:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
          '<carbone>{d.list[i].name:ifEM:hideBegin}</carbone>'+
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].name:ifEM:hideEnd}</carbone>'+
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>'+
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>'+
          '</table:table>';

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace multiple hide(row) by hideBegin/hideEnd formatters before and after the same row', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}{d.list[i].name:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<carbone>{d.list[i].name:ifEM:hideBegin}</carbone>'+
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>'+
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>'+
            '<carbone>{d.list[i].name:ifEM:hideEnd}</carbone>'+
          '</table:table>';

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters even if the row includes a table BEFORE the hide(row)', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-column table:style-name="Table1.A"/>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P2">{d.list[i].desc} </text:p>' +
                '<table:table table:name="Table2" table:style-name="Table2">' +
                  '<table:table-column table:style-name="Table2.A"/>' +
                  '<table:table-row>' +
                    '<table:table-cell table:style-name="Table2.A1" office:value-type="string">' +
                      '<text:p text:style-name="P3">Test <text:span text:style-name="T3">row in the middle</text:span>' +
                      '</text:p>' +
                    '</table:table-cell>' +
                  '</table:table-row>' +
                '</table:table>' +
                '<text:p text:style-name="P2">' +
                  '<text:span text:style-name="T1">{d.list[i].desc:ifEM:hide(row)}</text:span>' +
                '</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>'

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-column table:style-name="Table1.A"/>' +
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P2">{d.list[i].desc} </text:p>' +
                '<table:table table:name="Table2" table:style-name="Table2">' +
                  '<table:table-column table:style-name="Table2.A"/>' +
                  '<table:table-row>' +
                    '<table:table-cell table:style-name="Table2.A1" office:value-type="string">' +
                      '<text:p text:style-name="P3">Test <text:span text:style-name="T3">row in the middle</text:span>' +
                      '</text:p>' +
                    '</table:table-cell>' +
                  '</table:table-row>' +
                '</table:table>' +
                '<text:p text:style-name="P2">' +
                  '<text:span text:style-name="T1"></text:span>' +
                '</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>' +
          '</table:table>'

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the hide(row) by hideBegin/hideEnd formatters even if the row includes a table AFTER the hide(row)', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">'+
            '<table:table-column table:style-name="Table1.A"/>'+
            '<table:table-row>'+
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'+
                '<text:p text:style-name="P2">{d.list[i].desc} </text:p>'+
                '<text:p text:style-name="P2">'+
                  '<text:span text:style-name="T1">{d.list[i].desc:ifEM:hide(row)}</text:span>'+
                '</text:p>'+
                '<table:table table:name="Table2" table:style-name="Table2">'+
                  '<table:table-column table:style-name="Table2.A"/>'+
                  '<table:table-row>'+
                    '<table:table-cell table:style-name="Table2.A1" office:value-type="string">'+
                      '<text:p text:style-name="P4">Row after</text:p>'+
                    '</table:table-cell>'+
                  '</table:table-row>'+
                '</table:table>'+
                '<text:p text:style-name="P2"/>'+
              '</table:table-cell>'+
            '</table:table-row>'+
          '</table:table>'

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">'+
            '<table:table-column table:style-name="Table1.A"/>'+
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>' +
            '<table:table-row>'+
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'+
                '<text:p text:style-name="P2">{d.list[i].desc} </text:p>'+
                '<text:p text:style-name="P2">'+
                  '<text:span text:style-name="T1"></text:span>'+
                '</text:p>'+
                '<table:table table:name="Table2" table:style-name="Table2">'+
                  '<table:table-column table:style-name="Table2.A"/>'+
                  '<table:table-row>'+
                    '<table:table-cell table:style-name="Table2.A1" office:value-type="string">'+
                      '<text:p text:style-name="P4">Row after</text:p>'+
                    '</table:table-cell>'+
                  '</table:table-row>'+
                '</table:table>'+
                '<text:p text:style-name="P2"/>'+
              '</table:table-cell>'+
            '</table:table-row>'+
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>' +
          '</table:table>'


        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          // console.log(res);
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should detect the hide(row) and replace it by hideBegin/hideEnd formatter within the table XML (whole table)', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-column table:style-name="Table1.A" table:number-columns-repeated="2"/>' +
            '<table:table-column table:style-name="Table1.C"/>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P1">Name</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P1">price</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C1" office:value-type="string">' +
                '<text:p text:style-name="P1">Description</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].price}</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:hide(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row table:style-name="Table1.3">' +
              '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i+1]}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>'

        const _expectedResult = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-column table:style-name="Table1.A" table:number-columns-repeated="2"/>' +
            '<table:table-column table:style-name="Table1.C"/>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P1">Name</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">' +
                '<text:p text:style-name="P1">price</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C1" office:value-type="string">' +
                '<text:p text:style-name="P1">Description</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>' +
              '<table:table-row>' +
                '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                  '<text:p text:style-name="P1">{d.list[i].name}</text:p>' +
                '</table:table-cell>' +
                '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                  '<text:p text:style-name="P1">{d.list[i].price}</text:p>' +
                '</table:table-cell>' +
                '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                  '<text:p text:style-name="P1">{d.list[i].desc}</text:p>' +
                '</table:table-cell>' +
              '</table:table-row>' +
            '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>' +
            '<table:table-row table:style-name="Table1.3">' +
              '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i+1]}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';
        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : _templateContent}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res.files[0].data, _expectedResult);
          done();
        });
      });
    });
  });
});