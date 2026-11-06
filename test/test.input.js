const assert  = require('assert');
const input  = require('../lib/input');

describe('input', function () {

  describe('parseExtension', function () {
    it('should accept the input formats Carbone supports', function () {
      const _extensions = ['md', 'xml', 'odt', 'ods', 'odp', 'odg', 'csv', 'txt', 'svg', 'rtf', 'doc', 'xls', 'ppt', 'docx', 'xlsx', 'pptx', 'fodt', 'html', 'epub', 'xhtml'];
      for (let i = 0; i < _extensions.length; i++) {
        assert.strictEqual(input.parseExtension(_extensions[i]), _extensions[i]);
      }
    });

    it('should lowercase and trim the extension', function () {
      assert.strictEqual(input.parseExtension('DOCX'), 'docx');
      assert.strictEqual(input.parseExtension(' odt '), 'odt');
    });

    it('should return an empty string when the user gives no extension', function () {
      assert.strictEqual(input.parseExtension(undefined), '');
      assert.strictEqual(input.parseExtension(null), '');
      assert.strictEqual(input.parseExtension(''), '');
    });

    it('should reject anything which cannot be a file format', function () {
      const _invalid = [
        'zzq/../../template/1-abc', // relocates the rendered file into the template store
        '../../etc',
        'docx/x',
        'docx\\x',
        'doc.x',
        'doc x',
        'docx7',   // digits are only used by convertTo format names, never by an input format
        'docbook',
        'a'.repeat(200),
        42,
        {},
        ['docx']
      ];
      for (let i = 0; i < _invalid.length; i++) {
        assert.strictEqual(input.parseExtension(_invalid[i]), null, 'accepted: ' + JSON.stringify(_invalid[i]));
      }
    });
  });

});
