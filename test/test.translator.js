var translator = require('../lib/translator');
var helper = require('../lib/helper');
var path = require('path');
var fs = require('fs');
var params = require('../lib/params');

describe('translator', function () {

  describe('findTranslationMarkers' ,function () {
    it('should return an error when the file does not exist', function (done) {
      var _templatePath = path.join(__dirname, '../test_docs_incorrect');
      translator.findTranslationMarkers(_templatePath, [], function (err, keys) {
        helper.assert(/no such file or directory/.test(err.message), true);
        helper.assert(keys, []);
        done();
      });
    });

    it('should return the list of text keys to translate', function (done) {
      var _templatePath = path.join(__dirname, 'datasets', 'test_odt_to_translate.odt');
      translator.findTranslationMarkers(_templatePath, [], function (err, keys) {
        helper.assert(err+'', 'null');
        helper.assert(keys, [
          'I need to be translate',
          'another translation is required'
        ]);
        done();
      });
    });
  });

  describe('parseFiles' ,function () {
    it('should do nothing if files is empty', function (done) {
      translator.parseFiles([], [], function (err, keys) {
        helper.assert(err+'', 'null');
        helper.assert(keys, []);
        done();
      });
    });
    it('should travel all file', function (done) {
      var _files = [
        path.join(__dirname, 'datasets', 'test_odt_render_translate.odt'),
        path.join(__dirname, 'datasets', 'test_odt_to_translate.odt')
      ];
      translator.parseFiles(_files, [], function (err, keys) {
        helper.assert(err+'', 'null');
        helper.assert(keys, [
          'another translation is required',
          'Canada Products',
          'I need to be translate',
          "I've an Idea : Revenues >= Sales",
          'productName',
          'qty',
          'total',
          'unitPrice'
        ]);
        done();
      });
    });
  });

  describe('createLangObj' ,function () {
    it('should do nothing if files is empty', function (done) {
      translator.createLangObj({}, [], function (err, newLangObj, meta) {
        helper.assert(err+'', 'null');
        helper.assert(newLangObj, {});
        helper.assert(meta.addedKeys, 0);
        helper.assert(meta.deletedKeys, 0);
        helper.assert(meta.unalteredKeys, 0);
        helper.assert(meta.untranslatedKeys, 0); // = new added keys   + old untranslated keys
        helper.assert(meta.unusedKeys, 0);       // = new deleted keys + old deleted keys
        done();
      });
    });
    it('should keep deleted keys and add _@@@_UNUSED if new key array is empty', function (done) {
      var _currentLang = {
        'an apple'     : 'une pomme',
        'my car'       : 'ma voiture',
        'these tables' : 'ces tableaux'
      };
      translator.createLangObj(_currentLang, [], function (err, newLangObj, meta) {
        helper.assert(err+'', 'null');
        helper.assert(newLangObj, {
          'an apple_@@@_UNUSED'     : 'une pomme',
          'my car_@@@_UNUSED'       : 'ma voiture',
          'these tables_@@@_UNUSED' : 'ces tableaux'
        });
        helper.assert(meta.addedKeys, 0);
        helper.assert(meta.deletedKeys, 3);
        helper.assert(meta.unalteredKeys, 0);
        helper.assert(meta.untranslatedKeys, 0);
        helper.assert(meta.unusedKeys, 3);
        done();
      });
    });
    it('should detect already translated keys, should accept duplicated in keys\
        should put deleted keys at the top, should sort all keys, should keep old keys which were translated\
        should detect new keys', function (done) {
      var _currentLang = {
        'ab keys_@@@_UNUSED' : 'ab clés',
        'these tables'       : '',
        'my car'             : 'ma voiture',
        'an apple'           : 'une pomme',
        'a tower'            : ''
      };
      translator.createLangObj(_currentLang, ['ac be happy', 'my car', 'these tables'], function (err, newLangObj, meta) {
        helper.assert(err+'', 'null');
        helper.assert(newLangObj, {
          // 'a tower_@@@_UNUSED' : '', not kept because there was no translation
          'ab keys_@@@_UNUSED'  : 'ab clés',
          'ac be happy'         : '',
          'an apple_@@@_UNUSED' : 'une pomme',
          'these tables'        : '',
          'my car'              : 'ma voiture'
        });
        helper.assert(meta.addedKeys, 1);
        helper.assert(meta.deletedKeys, 2);
        helper.assert(meta.unalteredKeys, 2);
        helper.assert(meta.untranslatedKeys, 2); // = new added keys + old untranslated keys
        helper.assert(meta.unusedKeys, 3); // = new deleted keys + old deleted keys
        done();
      });
    });
  });

  describe('loadTranslations' ,function () {
    var _templatePath = path.join(__dirname, 'datasets');
    var _dirLangPath  = path.join(_templatePath, 'lang');
    var _langPathFr = path.join(_dirLangPath, 'fr.json');
    var _LangPathEs = path.join(_dirLangPath, 'es.json');

    afterEach(function (done) {
      helper.rmDirRecursive(_dirLangPath);
      done();
    });

    it('should load all lang in memory', function (done) {
      var _fr = {
        'a table' : 'un tableaux',
        'a car'   : 'une voiture'
      };
      var _es = {
        'a table' : 'uno mesa',
        'a car'   : 'una coche'
      };
      if (fs.existsSync(_dirLangPath)===false) {
        fs.mkdirSync(_dirLangPath);
      }
      fs.writeFileSync(_langPathFr, JSON.stringify(_fr, null, 2));
      fs.writeFileSync(_LangPathEs, JSON.stringify(_es, null, 2));
      translator.loadTranslations(_templatePath);
      helper.assert(params.translations, {
        es : {
          'a table' : 'uno mesa',
          'a car'   : 'una coche'
        },
        fr : {
          'a table' : 'un tableaux',
          'a car'   : 'une voiture'
        }
      });
      done();
    });
  });


  describe('generateLang' ,function () {
    var _lang = 'test';
    var _templatePath = path.join(__dirname, 'datasets');
    var _dirLangPath  = path.join(_templatePath, 'lang');
    var _fileLangPath = path.join(_dirLangPath, _lang + '.json');

    afterEach(function (done) {
      helper.rmDirRecursive(_dirLangPath);
      done();
    });

    it('should return a message when the folder where are docs does not exist', function (done) {
      var _testedPathFalse = path.join(__dirname, '../test_docs_incorrect');
      translator.generateLang(_testedPathFalse, _lang, function (err) {
        helper.assert(/Invalid path/.test(err), true);
        done();
      });
    });

    it('should create the lang directory and the lang file when it does not exist', function (done) {
      helper.assert(fs.existsSync(_dirLangPath), false);
      // should create the lang directory and the test.json file
      translator.generateLang(_templatePath, _lang, function () {
        helper.assert(fs.existsSync(_dirLangPath), true);
        helper.assert(fs.existsSync(_fileLangPath), true);
        done();
      });
    });

    it('should add 26 tranlates keys in the test lang file', function (done) {
      var _expectedObjLang = {
        'another translation is required'   : '',
        'Canada Products'                   : '',
        currency                            : '',
        'Delivery Date'                     : '',
        'excl tax'                          : '',
        From                                : '',
        FromDate                            : '',
        'I need to be translate'            : '',
        "I've an Idea : Revenues >= Sales"  : '',
        'Internal Code'                     : '',
        'Order Date'                        : '',
        'Order number'                      : '',
        productName                         : '',
        qty                                 : '',
        'Send Mode'                         : '',
        'Shipping Cost'                     : '',
        Site                                : '',
        Source                              : '',
        Status                              : '',
        Supplier                            : '',
        'Supplier orders multi-site report' : '',
        toDate                              : '',
        Total                               : '',
        total                               : '',
        'Total Amount'                      : '',
        unitPrice                           : ''
      };
      translator.generateLang(_templatePath, _lang, function (err, result, meta) {
        fs.readFile(_fileLangPath, 'utf8', function (err, langData) {
          helper.assert(err, null);
          var _objLang = JSON.parse(langData);
          helper.assert(_objLang, _expectedObjLang);
          helper.assert(result, _objLang);
          helper.assert(meta.addedKeys, 26);
          helper.assert(meta.deletedKeys, 0);
          helper.assert(meta.unalteredKeys, 0);
          helper.assert(meta.untranslatedKeys, 26);
          helper.assert(meta.unusedKeys, 0);
          done();
        });
      });
    });

    it('4 lang keys are defined, 1 is present but without value. These lang keys must be at the bottom of the lang file and their values should not be updated', function (done) {
      var _expectedObjLang = {
        'Canada Products'                   : '',
        'Delivery Date'                     : '',
        'excl tax'                          : '',
        From                                : '',
        FromDate                            : '',
        'I need to be translate'            : '',
        "I've an Idea : Revenues >= Sales"  : '',
        'Internal Code'                     : '',
        'Order Date'                        : '',
        'Order number'                      : '',
        productName                         : '',
        qty                                 : '',
        'Send Mode'                         : '',
        'Shipping Cost'                     : '',
        Site                                : '',
        Source                              : '',
        Status                              : '',
        Supplier                            : '',
        'Supplier orders multi-site report' : '',
        toDate                              : '',
        total                               : '',
        unitPrice                           : '',
        'another translation is required'   : 'une autre traduction est requise',
        currency                            : 'monnaie',
        Total                               : 'Total',
        'Total Amount'                      : 'Montant Total'
      };
      var _existingObjLang = {
        'excl tax'                        : '',
        'another translation is required' : 'une autre traduction est requise',
        currency                          : 'monnaie',
        Total                             : 'Total',
        'Total Amount'                    : 'Montant Total'
      };
      fs.mkdirSync(_dirLangPath, parseInt('0766', 8));
      fs.writeFileSync(_fileLangPath, JSON.stringify(_existingObjLang, null, 2));
      translator.generateLang(_templatePath, _lang, function (err, result, meta) {
        helper.assert(_expectedObjLang, result);
        helper.assert(meta.addedKeys, 21);
        helper.assert(meta.deletedKeys, 0);
        helper.assert(meta.unalteredKeys, 5);
        helper.assert(meta.untranslatedKeys, 22);
        helper.assert(meta.unusedKeys, 0);
        done();
      });
    });

    it('6 lang keys are defined. 2 of them should be not found. The latter must be sorted and be at the top of the lang file with _@@@_UNUSED marker', function (done) {
      var _expectedObjLang = {
        'Canada Products'                   : '',
        'Delivery Date'                     : '',
        'excl tax'                          : '',
        From                                : '',
        FromDate                            : '',
        'I need to be translate'            : '',
        "I've an Idea : Revenues >= Sales"  : '',
        'Internal Code'                     : '',
        'not found_@@@_UNUSED'              : 'non trouve',
        'Order Date'                        : '',
        'Order number'                      : '',
        productName                         : '',
        qty                                 : '',
        'Send Mode'                         : '',
        'Shipping Cost'                     : '',
        Site                                : '',
        Source                              : '',
        Status                              : '',
        Supplier                            : '',
        'Supplier orders multi-site report' : '',
        toDate                              : '',
        total                               : '',
        unitPrice                           : '',
        'another translation is required'   : 'une autre traduction est requise',
        currency                            : 'monnaie',
        Total                               : 'Total',
        'Total Amount'                      : 'Montant Total'
      };

      var _existingObjLang = {
        'excl tax'                        : '',
        'another translation is required' : 'une autre traduction est requise',
        currency                          : 'monnaie',
        'not found'                       : 'non trouve',
        'Error 404'                       : '',  // will be removed because there is no translation
        Total                             : 'Total',
        'Total Amount'                    : 'Montant Total'
      };
      fs.mkdirSync(_dirLangPath, parseInt('0766', 8));
      fs.writeFileSync(_fileLangPath, JSON.stringify(_existingObjLang, null, 2));
      translator.generateLang(_templatePath, _lang, function (err, result, meta) {
        helper.assert(_expectedObjLang, result);
        helper.assert(meta.addedKeys, 21);
        helper.assert(meta.deletedKeys, 2);
        helper.assert(meta.unalteredKeys, 5);
        helper.assert(meta.untranslatedKeys, 22);
        helper.assert(meta.unusedKeys, 2);
        done();
      });
    });

    it('8 lang keys are defined. 2 of them should be not found and 2 others are old removed keys (with @@@_UNUSED \
      These new and old keys must be sorted and find at the top of the lang file with @@@_UNUSED marker', function (done) {
      var _expectedObjLang = {
        'Canada Products'                   : '',
        'Delivery Date'                     : '',
        'excl tax'                          : '',
        'False key_@@@_UNUSED'              : 'fausse clé',
        From                                : '',
        FromDate                            : '',
        'I need to be translate'            : '',
        "I've an Idea : Revenues >= Sales"  : '',
        'Internal Code'                     : '',
        'not found_@@@_UNUSED'              : 'non trouve',
        'Old translate_@@@_UNUSED'          : 'vielle traduction',
        'Order Date'                        : '',
        'Order number'                      : '',
        productName                         : '',
        qty                                 : '',
        'Send Mode'                         : '',
        'Shipping Cost'                     : '',
        Site                                : '',
        Source                              : '',
        Status                              : '',
        Supplier                            : '',
        'Supplier orders multi-site report' : '',
        toDate                              : '',
        total                               : '',
        unitPrice                           : '',
        'another translation is required'   : 'une autre traduction est requise',
        currency                            : 'monnaie',
        Total                               : 'Total',
        'Total Amount'                      : 'Montant Total'
      };

      var _existingObjLang = {
        'False key_@@@_UNUSED'            : 'fausse clé',
        'Old translate_@@@_UNUSED'        : 'vielle traduction',
        'excl tax'                        : '',
        'another translation is required' : 'une autre traduction est requise',
        currency                          : 'monnaie',
        'not found'                       : 'non trouve',
        'Error 404'                       : '', // will be removed because there is no translation
        Total                             : 'Total',
        'Total Amount'                    : 'Montant Total'
      };
      fs.mkdirSync(_dirLangPath, parseInt('0766', 8));
      fs.writeFileSync(_fileLangPath, JSON.stringify(_existingObjLang, null, 2));
      translator.generateLang(_templatePath, _lang, function (err, result, meta) {
        helper.assert(_expectedObjLang, result);
        helper.assert(meta.addedKeys, 21);
        helper.assert(meta.deletedKeys, 2);
        helper.assert(meta.unalteredKeys, 5);
        helper.assert(meta.untranslatedKeys, 22);
        helper.assert(meta.unusedKeys, 4);
        done();
      });
    });
  });
});
