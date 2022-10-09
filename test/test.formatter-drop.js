var preprocessor = require('../lib/preprocessor');
var helper = require('../lib/helper');

describe('drop formatter', function () {

  describe(':drop(p)', function () {

    describe('DOCX', function () {

      it('should return an error if the argument of drop is unknown', function (done) {
        const content = () => {
          return '' +
            '<w:body>' +
              '<w:p w14:paraId="5C4E8B45" w14:textId="08330C66" w:rsidR="005A25A6" w:rsidRDefault="00C301BD">'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  '<w:t>{d.name}{d.name:ifEM:drop}{c.name:ifEM:drop(shap)} </w:t>'+
                '</w:r>'+
              '</w:p>'+
            '</w:body>';
        };

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
          helper.assert(err + '', 'Error: Unknown parameter in formatter drop() of "{c.name:ifEM:drop(shap)}". Do you mean ":drop(shape)"?');
          helper.assert(res?.files[0]?.data, content(false));
          done();
        });
      });

      it('should replace the drop(p) by hideBegin/hideEnd - basic paragraph', function (done) {
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
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:drop(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>';
        };

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
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the drop(p) by hideBegin/hideEnd - long paragraph and similar <w:p tags', function (done) {
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
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:drop(p)}'}</w:t>`+
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
            '</w:body>';
        };

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
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the drop(p) by hideBegin/hideEnd - two drop on the same paragraph, and another drop on the next paragraph', function (done) {
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
                  `<w:t>{d.name}${expected ? '' : '{d.name:ifEM:drop(p)}'}</w:t>`+
                '</w:r>'+
                '<w:r>'+
                  '<w:rPr>'+
                    '<w:lang w:val="en-US"/>'+
                  '</w:rPr>'+
                  `<w:t>{d.desc}${expected ? '' : '{d.desc:ifEM:drop(p)}'}</w:t>`+
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
                  `<w:t>{d.label}${expected ? '' : '{d.label:ifEM:drop(p)}'}</w:t>`+
                '</w:r>'+
              '</w:p>'+
              (expected ? '<carbone>{d.label:ifEM:hideEnd}</carbone>' : '') +
            '</w:body>';
        };

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
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

    });

    describe('ODT / ODP', function () {

      it('should replace the drop(p) by hideBegin/hideEnd - basic paragraph', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +

            '<office:body>'+
              '<office:text>'+
                '<text:p text:style-name="P1">This is a first paragraph</text:p>'+
                (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone>' : '') +
                '<text:p text:style-name="P1">'+
                  '{d.name}' +
                  (expected ? '' : '{d.name:ifEM:drop(p)}') +
                '</text:p>'+
                (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '')+
                '<text:p text:style-name="P1">This is a third paragraph</text:p>'+
              '</office:text>'+
            '</office:body>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odt');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });

      it('should replace the drop(p) by hideBegin/hideEnd - basic paragraph, argument with single/double quotes, and extra space', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +

            '<office:body>'+
              '<office:text>'+
                '<text:p text:style-name="P1">This is a first paragraph</text:p>'+
                (expected ? '<carbone>{d.name:ifEM:hideBegin}</carbone>' : '') +
                (expected ? '<carbone>{d.desc:ifEM:hideBegin}</carbone>' : '') +
                (expected ? '<carbone>{d.details:ifEM:hideBegin}</carbone>' : '') +
                '<text:p text:style-name="P1">'+
                  '{d.name}' +
                  (expected ? '' : '{d.name:ifEM:drop("p")}{d.desc:ifEM:drop(\'p\')}{d.details:ifEM:drop(    p   )}') +
                '</text:p>'+
                (expected ? '<carbone>{d.details:ifEM:hideEnd}</carbone>' : '')+
                (expected ? '<carbone>{d.desc:ifEM:hideEnd}</carbone>' : '')+
                (expected ? '<carbone>{d.name:ifEM:hideEnd}</carbone>' : '')+
                '<text:p text:style-name="P1">This is a third paragraph</text:p>'+
              '</office:text>'+
            '</office:body>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odt');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });

    });

    describe(':drop(p, nbrToHide)- row option to hide a number of elements', function () {

      describe('DOCX', function () {
        it('should delete 2 paragraphs', function (done) {
          const content = (expected) => {
            expected = expected ?? false;
            return '' +
              '<w:body>' +
                `${ expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : ''}` +
                '<w:p>'+
                  '<w:pPr>'+
                    '<w:pStyle w:val="Standard"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="26"/></w:numPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/>'+
                    '</w:rPr>'+
                    `<w:t>Paragraph 1${ expected ? '' : '{d.value:ifEM:drop(p, 2)}'}</w:t>`+
                  '</w:r>'+
                '</w:p>'+
                '<w:p>'+
                  '<w:pPr>'+
                    '<w:pStyle w:val="Standard"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="26"/></w:numPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/>'+
                    '</w:rPr>'+
                    '<w:t>Paragraph 2</w:t>'+
                  '</w:r>'+
                '</w:p>'+
                `${ expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : ''}` +
                '<w:p>'+
                  '<w:pPr>'+
                    '<w:pStyle w:val="Standard"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="26"/></w:numPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/>'+
                    '</w:rPr>'+
                    '<w:t>Paragraph 3</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:body>';
          };

          var _template = {
            files : [
              { name : 'document.xml', parent : '', data : content()}
            ]
          };
          preprocessor.handleDropFormatter(_template, 'docx');
          helper.assert(_template.files[0]?.data, content(true));
          done();
        });

        it('should delete 1 paragraphs even if the argument is 3', function (done) {
          const content = (expected) => {
            expected = expected ?? false;
            return '' +
              '<w:body>' +
                `${ expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : ''}` +
                '<w:p>'+
                  '<w:pPr>'+
                    '<w:pStyle w:val="Standard"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="26"/></w:numPr>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/>'+
                    '</w:rPr>'+
                    `<w:t>Paragraph 1${ expected ? '' : '{d.value:ifEM:drop(p, 3)}'}</w:t>`+
                  '</w:r>'+
                '</w:p>'+
                `${ expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : ''}` +
              '</w:body>';
          };

          var _template = {
            files : [
              { name : 'document.xml', parent : '', data : content()}
            ]
          };
          preprocessor.handleDropFormatter(_template, 'docx');
          helper.assert(_template.files[0]?.data, content(true));
          done();
        });
      });

      describe('ODT', function () {
        it('should delete 2 paragraphs', function (done) {
          const content = (expected) => {
            expected = expected ?? false;
            return '' +

              '<office:body>'+
                '<office:text>'+
                  '<text:p text:style-name="P1">This is a first paragraph</text:p>'+
                  (expected ? '<carbone>{d.details:ifEM:hideBegin}</carbone>' : '') +
                  '<text:p text:style-name="P1">'+
                    '{d.name}' +
                    (expected ? '' : '{d.details:ifEM:drop(    p   , 2)}') +
                  '</text:p>'+
                  '<text:p text:style-name="P1">Paragraph 2</text:p>'+
                  (expected ? '<carbone>{d.details:ifEM:hideEnd}</carbone>' : '')+
                  '<text:p text:style-name="P1">Paragraph 3</text:p>'+
                '</office:text>'+
              '</office:body>';
          };

          var _template = {
            files : [
              { name : 'content.xml', parent : '', data : content()}
            ]
          };
          preprocessor.handleDropFormatter(_template, 'odt');
          helper.assert(_template.files[0]?.data, content(true));
          done();
        });

        it('should delete 1 paragraphs even if the number to delete is 3', function (done) {
          const content = (expected) => {
            expected = expected ?? false;
            return '' +

              '<office:body>'+
                '<office:text>'+
                  '<text:p text:style-name="P1">This is a first paragraph</text:p>'+
                  (expected ? '<carbone>{d.details:ifEM:hideBegin}</carbone>' : '') +
                  '<text:p text:style-name="P1">'+
                    '{d.name}' +
                    (expected ? '' : '{d.details:ifEM:drop(    p   , 3)}') +
                  '</text:p>'+
                  (expected ? '<carbone>{d.details:ifEM:hideEnd}</carbone>' : '')+
                '</office:text>'+
              '</office:body>';
          };

          var _template = {
            files : [
              { name : 'content.xml', parent : '', data : content()}
            ]
          };
          preprocessor.handleDropFormatter(_template, 'odt');
          helper.assert(_template.files[0]?.data, content(true));
          done();
        });
      });

    });

  });

  describe(':drop(img)', function () {

    describe('DOCX', function () {

      it('should replace the drop(img) by hideBegin/hideEnd - basic image', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:p w14:paraId="2B951670" w14:textId="0E5FAB2B" w:rsidR="00944B35" w:rsidRDefault="00944B35" w:rsidP="00CF4F0C">' +
              '<w:pPr>' +
                '<w:tabs>' +
                  '<w:tab w:val="left" w:pos="455"/>' +
                '</w:tabs>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:noProof/>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                (expected ? '<carbone>{d.image:ifEM:hideBegin}</carbone>' : '') +
                '<w:drawing>' +
                  '<wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="07363890" wp14:editId="6DB89906">' +
                    '<wp:extent cx="2070946" cy="2162628"/>' +
                    '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                    `<wp:docPr id="1" name="Picture 1" descr="{d.image}&#xA;${expected ? '' : '{d.image:ifEM:drop(img)}'}"/>` +
                    '<wp:cNvGraphicFramePr>' +
                      '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                    '</wp:cNvGraphicFramePr>' +
                    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                      '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                          '<pic:nvPicPr>' +
                            `<pic:cNvPr id="1" name="Picture 1" descr="{d.image}&#xA;${expected ? '' : '{d.image:ifEM:drop(img)}'}"/>` +
                            '<pic:cNvPicPr/>' +
                          '</pic:nvPicPr>' +
                          '<pic:blipFill>' +
                            '<a:blip r:embed="rId4" cstate="print">' +
                              '<a:extLst>' +
                                '<a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">' +
                                  '<a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>' +
                                '</a:ext>' +
                              '</a:extLst>' +
                            '</a:blip>' +
                            '<a:stretch>' +
                              '<a:fillRect/>' +
                            '</a:stretch>' +
                          '</pic:blipFill>' +
                          '<pic:spPr>' +
                            '<a:xfrm>' +
                              '<a:off x="0" y="0"/>' +
                              '<a:ext cx="2082898" cy="2175109"/>' +
                            '</a:xfrm>' +
                            '<a:prstGeom prst="rect">' +
                              '<a:avLst/>' +
                            '</a:prstGeom>' +
                          '</pic:spPr>' +
                        '</pic:pic>' +
                      '</a:graphicData>' +
                    '</a:graphic>' +
                  '</wp:inline>' +
                '</w:drawing>' +
                (expected ? '<carbone>{d.image:ifEM:hideEnd}</carbone>' : '') +
              '</w:r>' +
            '</w:p>';
        };

        var _template = {
          extension : 'docx',
          files     : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'docx');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

    describe('ODT / ODP', function () {
      it('should replace the drop(img) by hideBegin/hideEnd - basic image', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<text:p text:style-name="P4">'+
              '<text:span text:style-name="T3">'+
                '<text:s/>'+
              '</text:span>'+
              (expected ? '<carbone>{d.image:ifEM:hideBegin}</carbone>' : '') +
              '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="4.78cm" svg:height="4.992cm" draw:z-index="0">'+
                '<draw:image xlink:href="Pictures/10000001000003000000032247707408E6138C7C.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" draw:mime-type="image/png"/>'+
                `<svg:title>{d.image}${ expected ? '' : '{d.image:ifEM:drop(img)}' }</svg:title>`+
              '</draw:frame>'+
              (expected ? '<carbone>{d.image:ifEM:hideEnd}</carbone>' : '')+
            '</text:p>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odt');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

  });

  describe(':drop(shape)', function () {

    describe('DOCX', function () {
      it('should replace the drop by hideBegin/hideEnd - basic shape', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:p w14:paraId="70AD7C98" w14:textId="316E2D46" w:rsidR="00197A10" w:rsidRDefault="00E071DB">'+
              '<w:r>'+
                (expected ? '<carbone>{d.test:ifEM:hideBegin}</carbone>' : '') +
                '<mc:AlternateContent>'+
                  '<mc:Choice Requires="wps">'+
                    '<w:drawing>'+
                      '<wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1" wp14:anchorId="6ACBA7B9" wp14:editId="399B63E8">'+
                        '<wp:simplePos x="0" y="0"/>'+
                        '<wp:positionH relativeFrom="column">'+
                          '<wp:posOffset>+187569</wp:posOffset>'+
                        '</wp:positionH>'+
                        '<wp:positionV relativeFrom="paragraph">'+
                          '<wp:posOffset>60130</wp:posOffset>'+
                        '</wp:positionV>'+
                        '<wp:extent cx="3587262" cy="1887415"/>'+
                        '<wp:effectExtent l="0" t="0" r="6985" b="17780"/>'+
                        '<wp:wrapNone/>'+
                        `<wp:docPr id="1" name="Rectangle 1" descr="${expected ? '' : '{d.test:ifEM:drop(shape)}'}"/>`+
                        '<wp:cNvGraphicFramePr/>'+
                        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'+
                          '<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+
                            '<wps:wsp>'+
                              '<wps:cNvSpPr/>'+
                              '<wps:spPr>'+
                                '<a:xfrm>'+
                                  '<a:off x="0" y="0"/>'+
                                  '<a:ext cx="3587262" cy="1887415"/>'+
                                '</a:xfrm>'+
                                '<a:prstGeom prst="rect">'+
                                  '<a:avLst/>'+
                                '</a:prstGeom>'+
                              '</wps:spPr>'+
                              '<wps:style>'+
                                '<a:lnRef idx="2">'+
                                  '<a:schemeClr val="accent1">'+
                                    '<a:shade val="50000"/>'+
                                  '</a:schemeClr>'+
                                '</a:lnRef>'+
                                '<a:fillRef idx="1">'+
                                  '<a:schemeClr val="accent1"/>'+
                                '</a:fillRef>'+
                                '<a:effectRef idx="0">'+
                                  '<a:schemeClr val="accent1"/>'+
                                '</a:effectRef>'+
                                '<a:fontRef idx="minor">'+
                                  '<a:schemeClr val="lt1"/>'+
                                '</a:fontRef>'+
                              '</wps:style>'+
                              '<wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" vert="horz" wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" numCol="1" spcCol="0" rtlCol="0" fromWordArt="0" anchor="ctr" anchorCtr="0" forceAA="0" compatLnSpc="1">'+
                                '<a:prstTxWarp prst="textNoShape">'+
                                  '<a:avLst/>'+
                                '</a:prstTxWarp>'+
                                '<a:noAutofit/>'+
                              '</wps:bodyPr>'+
                            '</wps:wsp>'+
                          '</a:graphicData>'+
                        '</a:graphic>'+
                      '</wp:anchor>'+
                    '</w:drawing>'+
                  '</mc:Choice>'+
                  '<mc:Fallback>'+
                    '<w:pict>'+
                      `<v:rect alt="${expected ? '' : '{d.test:ifEM:drop(shape)}'}"/>` +
                    '</w:pict>'+
                  '</mc:Fallback>'+
                '</mc:AlternateContent>'+
                (expected ? '<carbone>{d.test:ifEM:hideEnd}</carbone>' : '') +
              '</w:r>'+
            '</w:p>';
        };

        var _template = {
          extension : 'docx',
          files     : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'docx');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

    describe('ODT / ODP', function () {
      it('should replace the drop(shape) by hideBegin/hideEnd - basic shape', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<text:p text:style-name="P1">'+
              (expected ? '<carbone>{d.text:ifEM:hideBegin}</carbone>' : '') +
              '<draw:custom-shape text:anchor-type="paragraph" draw:z-index="0" draw:name="Shape 1" draw:style-name="gr1" svg:width="10.268cm" svg:height="2.689cm" svg:x="4.789cm" svg:y="0.302cm">'+
                '<text:p text:style-name="P2">Text box content:</text:p>'+
                '<text:p text:style-name="P2">{d.text}</text:p>'+
                `<text:p text:style-name="P2">${ expected ? '' : '{d.text:ifEM:drop(shape)}' }</text:p>`+
                '<draw:enhanced-geometry svg:viewBox="0 0 21600 21600" draw:type="rectangle" draw:enhanced-path="M 0 0 L 21600 0 21600 21600 0 21600 0 0 Z N"/>'+
              '</draw:custom-shape>'+
              (expected ? '<carbone>{d.text:ifEM:hideEnd}</carbone>' : '')+
              '<text:span text:style-name="T1">'+
                '<text:s/>'+
              '</text:span>'+
            '</text:p>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odt');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

  });

  describe(':drop(chart)', function () {

    describe('DOCX', function () {
      it('should replace the drop(chart) by hideBegin/hideEnd - basic chart', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:p w14:paraId="01E183C6" w14:textId="5AECA843" w:rsidR="001C5093" w:rsidRPr="00944B35" w:rsidRDefault="001C5093" w:rsidP="00CF4F0C">' +
              '<w:pPr>' +
                '<w:tabs>' +
                  '<w:tab w:val="left" w:pos="455"/>' +
                '</w:tabs>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:noProof/>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                (expected ? '<carbone>{d.shape:ifEM:hideBegin}</carbone>' : '') +
                '<w:drawing>' +
                  '<wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="440009B3" wp14:editId="634DC711">' +
                    '<wp:extent cx="5486400" cy="3200400"/>' +
                    '<wp:effectExtent l="0" t="0" r="12700" b="12700"/>' +
                    `<wp:docPr id="3" name="Chart 3" descr="${expected ? '' : '{d.shape:ifEM:drop(chart)}'}"/>` +
                    '<wp:cNvGraphicFramePr/>' +
                    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                      '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
                        '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId4"/>' +
                      '</a:graphicData>' +
                    '</a:graphic>' +
                  '</wp:inline>' +
                '</w:drawing>' +
                (expected ? '<carbone>{d.shape:ifEM:hideEnd}</carbone>' : '') +
              '</w:r>' +
            '</w:p>';
        };

        var _template = {
          extension : 'docx',
          files     : [
            { name : 'document.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'docx');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

    describe('ODT / ODP', function () {
      it('should replace the drop(chart) by hideBegin/hideEnd - basic chart', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<text:p text:style-name="P3">'+
              (expected ? '<carbone>{d.chart:ifEM:hideBegin}</carbone>' : '') +
              (expected ? '<carbone>{d.text:ifEM:hideBegin}</carbone>' : '') +
              `<draw:frame draw:style-name="fr1" draw:name="${ expected ? '' : '{d.chart:ifEM:drop(chart)}' }" text:anchor-type="char" svg:width="15.998cm" svg:height="8.999cm" draw:z-index="2">`+
                '<draw:object xlink:href="./Object 1" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>'+
                '<draw:image xlink:href="./ObjectReplacements/Object 1" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>'+
                `<svg:title>${ expected ? '' : '{d.text:ifEM:drop(chart)}' }</svg:title>`+
                `<svg:desc>${ expected ? '' : '{d.chart:ifEM:drop(chart)}' }</svg:desc>`+
              '</draw:frame>'+
              (expected ? '<carbone>{d.text:ifEM:hideEnd}</carbone>' : '')+
              (expected ? '<carbone>{d.chart:ifEM:hideEnd}</carbone>' : '') +
            '</text:p>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odt');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });

  });

  describe(':drop(row)', function () {
    describe('DOCX', function () {
      it('should do nothing if the XML if not valid', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<w:tbl>'+
              '<w:tr>'+
                '<w:tc>'+
                  '<w:p>'+
                    '<w:r>'+
                      `<w:t>{d.desc} ${ expected === true ? '' : '{d.desc:ifEM:drop(row)}' }</w:t>`+
                    '</w:r>'+
                  '</w:p>'+
                '</w:tc>'+
          // '</w:tr>'+ Missing end row tag
            '</w:tbl>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters - basic', function (done) {
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
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>';

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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatter even if the rows has `trP`  ', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:trPr>' + // SPECIAL TAG FOR ROW PROPERTIES
                '<w:cantSplit/>' +
                '<w:tblHeader/>' +
              '</w:trPr>' +
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
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:tc>'+
            '</w:tr>'+
          '</w:tbl>';

        const _expectedResult = '' +
          '<w:tbl>'+
            '<carbone>{d.desc:ifEM:hideBegin}</carbone>' +
            '<w:tr w:rsidR="00CF4F0C" w14:paraId="7814680B" w14:textId="77777777" w:rsidTr="00CF4F0C">'+
              '<w:trPr>' +
                '<w:cantSplit/>' +
                '<w:tblHeader/>' +
              '</w:trPr>' +
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters into 2 different rows', function (done) {
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
                    '<w:t>{d.name}{d.name:ifEM:drop(row)}</w:t>'+
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
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>'+
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace multiple drop(row) by hideBegin/hideEnd formatters before and after the same row', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.name}{d.name:ifEM:drop(row)}</w:t>'+
                  '</w:r>'+
                  '<w:r>'+
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>'+
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters even if the row includes a table BEFORE the drop(row)', function (done) {
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
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>' +
                  '</w:r>' +
                '</w:p>' +
              '</w:tc>' +
            '</w:tr>' +
          '</w:tbl>';

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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters even if the row includes a table AFTER the drop(row)', function (done) {
        const _templateContent = '' +
          '<w:tbl>'+
            '<w:tr>'+
              '<w:tc>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.desc}{d.desc:ifEM:drop(row)}</w:t>'+
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
          '</w:tbl>';


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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace a drop(row) at the root table, and a second embed into a child table', function (done) {
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
                        '<w:t>{d.desc:ifEM:drop(row)}</w:t>'+ // HIDE ROW EMBED INTO A CHILD TABLE
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
                  '<w:t>{d.show:ifEQ(false):drop(row)}</w:t>'+ // SECOND drop(row) AT THE ROOT OF THE TABLE
                '</w:r>'+
              '</w:p>'+
            '</w:tc>'+
          '</w:tr>'+
        '</w:tbl>';


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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });
    });

    describe('ODT / ODP', function () {
      it('should do nothing if the XML if not valid', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<table:table table:name="Table1" table:style-name="Table1">' +
              '<table:table-row>' +
                '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                  `<text:p text:style-name="P1">{d.list[i].desc}${ expected ? '' : '{d.list[i].desc:ifEM:drop(row)}' }</text:p>` +
                '</table:table-cell>' +
          // '</table:table-row>' + // MISSING A TABLE ROW
            '</table:table>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatter within the table XML', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:drop(row)}</text:p>' +
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters into 2 different rows', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}{d.list[i].name:ifEM:drop(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:drop(row)}</text:p>' +
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace multiple drop(row) by hideBegin/hideEnd formatters before and after the same row', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].name}{d.list[i].name:ifEM:drop(row)}</text:p>' +
              '</table:table-cell>' +
              '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:drop(row)}</text:p>' +
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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters even if the row includes a table BEFORE the drop(row)', function (done) {
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
                  '<text:span text:style-name="T1">{d.list[i].desc:ifEM:drop(row)}</text:span>' +
                '</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';

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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should replace the drop(row) by hideBegin/hideEnd formatters even if the row includes a table AFTER the drop(row)', function (done) {
        const _templateContent = '' +
          '<table:table table:name="Table1" table:style-name="Table1">'+
            '<table:table-column table:style-name="Table1.A"/>'+
            '<table:table-row>'+
              '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'+
                '<text:p text:style-name="P2">{d.list[i].desc} </text:p>'+
                '<text:p text:style-name="P2">'+
                  '<text:span text:style-name="T1">{d.list[i].desc:ifEM:drop(row)}</text:span>'+
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
          '</table:table>';

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
          helper.assert(res?.files[0]?.data, _expectedResult);
          done();
        });
      });

      it('should detect the drop(row) and replace it by hideBegin/hideEnd formatter within the table XML (whole table)', function (done) {
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
                '<text:p text:style-name="P1">{d.list[i].desc}{d.list[i].desc:ifEM:drop(row)}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row table:style-name="Table1.3">' +
              '<table:table-cell table:style-name="Table1.A2" office:value-type="string">' +
                '<text:p text:style-name="P1">{d.list[i+1]}</text:p>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';

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

    describe(':drop(row, nbrToHide)- row option to hide a number of elements - ODS format', () => {
      it('should drop 2 table rows with "drop(row, 2)"', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<table:table table:name="Table1" table:style-name="Table1">' +
              `${ expected ? '<carbone>{d.list[i].desc:ifEM:hideBegin}</carbone>' : '' }` +
              '<table:table-row>' +
                '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                  `<text:p text:style-name="P1">{d.list[i].desc}${expected ? '' : '{d.list[i].desc:ifEM:drop(row, 2)}' }</text:p>` +
                '</table:table-cell>' +
              '</table:table-row>' +
              '<table:table-row>' +
                '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                  '<text:p text:style-name="P1">{d.list[i].name}</text:p>' +
                '</table:table-cell>' +
              '</table:table-row>' +
              `${ expected ? '<carbone>{d.list[i].desc:ifEM:hideEnd}</carbone>' : '' }` +
            '</table:table>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should drop 1 table row with "drop(row, 2)" because the table has 1 row, even if the option to drop 2 rows is provided', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<table:table table:name="Table1" table:style-name="Table1">' +
              `${ expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : '' }` +
              '<table:table-row>' +
                '<table:table-cell table:style-name="Table1.C2" office:value-type="string">' +
                  `<text:p text:style-name="P1">{d.list[i].desc}${expected ? '' : '{d.value:ifEM:drop(row, 2)}' }</text:p>` +
                '</table:table-cell>' +
              '</table:table-row>' +
              `${ expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : '' }` +
            '</table:table>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };

        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should drop 1 table row with "drop(row, 2)" because the table has 1 row, even if the option to drop 2 rows is provided AND the table is chained with another table', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<table:table table:name="Table1" table:style-name="Table1">'+
              `${ expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : '' }` +
              '<table:table-row>'+
                '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'+
                  `<text:p text:style-name="P1">{d.value}${expected ? '' : '{d.value:ifEM:drop(row, 2)}' }</text:p>`+
                '</table:table-cell>'+
              '</table:table-row>'+
              `${ expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : '' }` +
            '</table:table>'+
            '<table:table table:name="Table2" table:style-name="Table2">'+
              '<table:table-row>'+
                '<table:table-cell table:style-name="Table2.A1" office:value-type="string">'+
                  '<text:p text:style-name="Table_20_Contents"/>'+
                '</table:table-cell>'+
              '</table:table-row>'+
            '</table:table>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });

      it('should drop 3 table row of 4 with "drop(row, 2)" even if the first row contains a child table', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
          '<table:table table:name="Table2" table:style-name="Table2">' +
            '<table:table-column table:style-name="Table2.A"/>' +
            `${ expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : '' }` +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table2.A1" office:value-type="string">' +
                `<text:p text:style-name="P5">${expected ? '' : '{d.value:ifEM:drop(row, 3)}' }</text:p>` +
                '<table:table table:name="Table4" table:style-name="Table4">' +
                  '<table:table-column table:style-name="Table4.A"/>' +
                  '<table:table-row>' +
                    '<table:table-cell table:style-name="Table4.A1" office:value-type="string">' +
                      '<text:p text:style-name="P7">Inner Table</text:p>' +
                    '</table:table-cell>' +
                  '</table:table-row>' +
                '</table:table>' +
                '<text:p text:style-name="P5"/>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table2.A2" office:value-type="string">' +
                '<text:p text:style-name="Table_20_Contents"/>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table2.A2" office:value-type="string">' +
                '<text:p text:style-name="Table_20_Contents"/>' +
              '</table:table-cell>' +
            '</table:table-row>' +
            `${ expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : '' }` +
            '<table:table-row>' +
              '<table:table-cell table:style-name="Table2.A2" office:value-type="string">' +
                '<text:p text:style-name="Table_20_Contents"/>' +
              '</table:table-cell>' +
            '</table:table-row>' +
          '</table:table>';
        };

        var _report = {
          isZipped   : true,
          filename   : 'template.odt',
          extension  : 'odt',
          embeddings : [],
          files      : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.execute(_report, function (err, res) {
          helper.assert(err + '', 'null');
          helper.assert(res?.files[0]?.data, content(true));
          done();
        });
      });
    });
  });

  describe(':drop(slide)', function () {
    describe('ODP', function () {
      it('should replace the drop(slide) by hideBegin/hideEnd', function (done) {
        const content = (expected) => {
          expected = expected ?? false;
          return '' +
            '<draw:page draw:name="page1" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">' +
              '<draw:frame presentation:style-name="pr1" draw:text-style-name="P2" draw:layer="layout" svg:width="25.199cm" svg:height="6.331cm" svg:x="1.471cm" svg:y="5.348cm" presentation:class="subtitle" presentation:user-transformed="true">' +
                '<draw:text-box>' +
                  '<text:p text:style-name="P1">Slide 1</text:p>' +
                '</draw:text-box>' +
              '</draw:frame>' +
            '</draw:page>' +
            `${expected ? '<carbone>{d.value:ifEM:hideBegin}</carbone>' : ''}` +
            '<draw:page draw:name="page3" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL2T1">'+
              '<draw:frame draw:style-name="gr2" draw:text-style-name="P5" draw:layer="layout" svg:width="27.999cm" svg:height="13.036cm" svg:x="0.035cm" svg:y="1.344cm">'+
                '<draw:image xlink:href="Pictures/10000001000007800000037EB5139C7A2273D934.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" draw:mime-type="image/png">'+
                  '<text:p/>'+
                '</draw:image>'+
                `<svg:desc>${expected ? '' : '{d.value:ifEM:drop(slide)}'}</svg:desc>`+
              '</draw:frame>'+
              '<presentation:notes draw:style-name="dp2">'+
                '<draw:page-thumbnail draw:style-name="gr1" draw:layer="layout" svg:width="19.798cm" svg:height="11.136cm" svg:x="0.6cm" svg:y="2.257cm" draw:page-number="3" presentation:class="page"/>'+
                '<draw:frame presentation:style-name="pr2" draw:text-style-name="P3" draw:layer="layout" svg:width="16.799cm" svg:height="13.364cm" svg:x="2.1cm" svg:y="14.107cm" presentation:class="notes" presentation:placeholder="true">'+
                  '<draw:text-box/>'+
                '</draw:frame>'+
              '</presentation:notes>'+
            '</draw:page>' +
            `${expected ? '<carbone>{d.value:ifEM:hideEnd}</carbone>' : ''}` +
            '<draw:page draw:name="page1" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">' +
              '<draw:frame presentation:style-name="pr1" draw:text-style-name="P2" draw:layer="layout" svg:width="25.199cm" svg:height="6.331cm" svg:x="1.471cm" svg:y="5.348cm" presentation:class="subtitle" presentation:user-transformed="true">' +
                '<draw:text-box>' +
                  '<text:p text:style-name="P1">Slide 2</text:p>' +
                '</draw:text-box>' +
              '</draw:frame>' +
            '</draw:page>';
        };

        var _template = {
          files : [
            { name : 'content.xml', parent : '', data : content()}
          ]
        };
        preprocessor.handleDropFormatter(_template, 'odp');
        helper.assert(_template.files[0]?.data, content(true));
        done();
      });
    });
  });
});