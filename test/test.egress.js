const helper  = require('../lib/helper');
const egress  = require('../lib/egress');

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

});

