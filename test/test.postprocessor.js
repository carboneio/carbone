var postprocessor = require('../lib/postprocessor');
var helper = require('../lib/helper');

describe('postprocessor', function () {
  describe.skip('File type checking', function () {
    const template = {
      filename   : '',
      embeddings : [],
      files      :
       [ { name     : 'META-INF/manifest.xml',
         data     : '<?xml version="1.0" encoding="UTF-8"?>',
         isMarked : true,
         parent   : '' } ],
      extension : ''
    };
    const options = {
      extension : '',
    };
    it('Throw an error when the file type is not defined on the filename extension and the options object.', function (done) {
      template.filename = './template';
      options.extension = '',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(/Error: The file type is not defined on the filename extension or on the option object.*/.test(err), true);
        helper.assert(undefined, response);
        done();
      });
    });

    it('Return a valid template if the file type is defined on the file name extension', function (done) {
      template.filename = './template.ods';
      options.extension = '',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(err, null);
        helper.assert(JSON.stringify(template), JSON.stringify(response));
        done();
      });
    });

    it('Return a valid template if the file type is defined on the options object.', function (done) {
      template.filename = './template';
      options.extension = 'ods',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(err, null);
        helper.assert(JSON.stringify(template), JSON.stringify(response));
        done();
      });
    });
  });

  describe('patchEmptyTableCells', function() {
    it('should insert a paragraph in empty table cells', function (done) {
      const content = (expected) => {
        expected = expected ?? false;
        return '' +
        '<w:body>' +
          '<w:tbl>' +
            '<w:tblPr>' +
              '<w:tblStyle w:val="TableGrid"/>' +
              '<w:tblW w:w="0" w:type="auto"/>' +
              '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>' +
            '</w:tblPr>' +
            '<w:tblGrid>' +
              '<w:gridCol w:w="9350"/>' +
            '</w:tblGrid>' +
            '<w:tr w:rsidR="00C72CA7" w14:paraId="21E481FC" w14:textId="77777777" w:rsidTr="00C72CA7">' +
              /** NOT EMPTY CELL */
              '<w:tc>' +
                '<w:tcPr>' +
                  '<w:tcW w:w="9350" w:type="dxa"/>' +
                '</w:tcPr>' +
                '<w:p w14:paraId="39EBB0A5" w14:textId="172A7826" w:rsidR="00C72CA7" w:rsidRPr="00C72CA7" w:rsidRDefault="00C72CA7">' +
                  '<w:pPr>' +
                    '<w:rPr>' +
                      '<w:lang w:val="en-US"/>' +
                    '</w:rPr>' +
                  '</w:pPr>' +
                  '<w:r>' +
                    '<w:rPr>' +
                      '<w:lang w:val="en-US"/>' +
                    '</w:rPr>' +
                    '<w:t>Cell Value</w:t>' +
                  '</w:r>' +
                '</w:p>' +
              '</w:tc>' +
              /** EMPTY CELL WITHOUT STYLE */
              '<w:tc>' +
                (expected ? '<w:p></w:p>' : '') +
              '</w:tc>' +
              /** EMPTY CELL WITH CUSTOM PROPERTIES */
              '<w:tc>' +
                '<w:tcPr>' +
                  '<w:tcW w:w="9350" w:type="dxa"/>' +
                '</w:tcPr>' +
                (expected ? '<w:p></w:p>' : '') +
              '</w:tc>' +
            '</w:tr>' +
          '</w:tbl>' +
        '</w:body>';
      };
      var _report = {
        isZipped   : true,
        filename   : 'template.docx',
        extension  : 'docx',
        embeddings : [],
        files      : [
          { name : 'document.xml', parent : '', data : content()},
          { name : 'footer1.xml', parent : '', data : content()},
          { name : 'header2.xml', parent : '', data : content()}
        ]
      };
      postprocessor.patchEmptyTableCells(_report);
      helper.assert(_report?.files[0]?.data, content(true));
      helper.assert(_report?.files[1]?.data, content(true));
      helper.assert(_report?.files[2]?.data, content(true));
      done();
    });
  });
});
