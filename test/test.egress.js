const helper  = require('../lib/helper');
const egress  = require('../lib/egress');
const nock    = require('nock');

describe('egress', function () {
  describe('downloadExternalFile', function () {
    // tested in many other files images / appendFile
  });
  describe('Get file extension from URL', function () {
    it('should return a png/jpeg/gif/txt extension', function () {
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr.png'), 'png');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image.gif'), 'gif');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image.with.lot.of.points.jpeg'), 'jpeg');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr.txt'), 'txt');
    });
    it('should lower case extension to normalize', function () {
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr.JPG'), 'jpg');
    });
    it('should return a png/jpeg/gif/txt extension with query parameters', function () {
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr.png?fewfw=223&lala=few'), 'png');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image.gif#fewfw=223?lala=few'), 'gif');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image.with.lot.of.points.jpeg&name=John'), 'jpeg');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr.txt?name=john&age=2#lala'), 'txt');
    });
    it('should find the extension in content-disposition if not available in URL', function () {
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few'), '');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few', null), '');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few', 'filename='), '');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few', 'filename=""'), '');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few', 'attachment;'), '');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image-flag-fr?fewfw=223&lala=few', 'attachment; filename="file extension.pdf"'), 'pdf');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image#fewfw=223?lala=few', 'inline; filename="file extension.jpg"'), 'jpg');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image#fewfw=223?lala=few', 'inline; filename="file extension.JPG"'), 'jpg');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/image#fewfw=223?lala=few', 'inline; filename=file.pdf; name="field2";'), 'pdf');
      helper.assert(egress.getFileExtensionFromUrl('https://google.com/imagelotofpoints&name=John', 'attachment; filename="image.with.lot.of.points.jpeg"'), 'jpeg');
    });
  });

  describe('cleanContentType', function () {
    it('should clean content type', function () {
      helper.assert(egress.cleanContentType(undefined), '');
      helper.assert(egress.cleanContentType(null), '');
      helper.assert(egress.cleanContentType(0), '');
      helper.assert(egress.cleanContentType(1), '');
      helper.assert(egress.cleanContentType('image/png; charset=UTF-8'), 'image/png');
      helper.assert(egress.cleanContentType('image/png ; charset=UTF-8'), 'image/png');
      helper.assert(egress.cleanContentType('  image/png '), 'image/png');
      helper.assert(egress.cleanContentType('  image/png  ; charset=UTF-8 ; s '), 'image/png');
    });
  });

  describe('downloadExternalFile', function () {
    afterEach(function () {
      if (!nock.isDone()) {
        this.test.error(new Error('Not all nock interceptors were used!'));
        nock.cleanAll();
      }
    });
    // Tested indirectly by test.image.js
    const ACCEPTED_MIMETYPE_EXTERNAL_FILES = {
      'application/pdf' : 'pdf'
    };
    const ACCEPTED_EXTENSION_FILES = {
      pdf : 'application/pdf'
    };
    it('should download a PDF from an url even if the header.content-type is incorrect, and the URL does not contain the extension', function (done) {
      // Google Drive example
      nock('https://google.com')
        .get('/pdf-doc-flag-fr')
        .replyWithFile(200, __dirname + '/datasets/test_word_render_A.pdf', {
          'Content-Type'        : 'application/octet-stream',
          'Content-Disposition' : 'attachment; filename="beautiful document.pdf"',
        });
      egress.downloadExternalFile('https://google.com/pdf-doc-flag-fr', ACCEPTED_MIMETYPE_EXTERNAL_FILES, ACCEPTED_EXTENSION_FILES, {}, function (err, fileInfo) {
        helper.assert(err+'', 'null');
        helper.assert(fileInfo.data.length, 8986);
        helper.assert(fileInfo.mimetype, 'application/pdf');
        helper.assert(fileInfo.extension, 'pdf');
        done();
      });
    });
  });

});

