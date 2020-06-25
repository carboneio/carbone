var postprocessor = require('../lib/postprocessor');
var helper = require('../lib/helper');

describe.skip('postprocessor', function () {
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
});
