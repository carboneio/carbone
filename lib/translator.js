const fs = require('fs');
const path = require('path');
const helper = require('./helper');
const params = require('./params');
const file = require('./file');
const parser = require('./parser');

const UNUSED_MARKER = '_@@@_UNUSED';
const CARBONE_HEADER = [
  '\n/******************************************************************************\\',
  '                                   CARBONE                                    ',
  ' ------------------------------------------------------------------------------\n'
].join('\n');

const CARBONE_FOOTER = [
  '\n\\******************************************************************************/ '
];
const USAGE = CARBONE_HEADER + [
  'Usage:',
  '   find all {t()} markers in all templates of the specified directory',
  '   and update json lang files.',
  '',
  'Mandatory options:',
  '   -l, --lang [lang]      lang file to udpate or create (fr, en, de, es, ...)',
  '   -p, --path [path]      template\'s path to parse',
  '',
  'Examples:',
  '   carbone translate -l fr -p path/to/docs/directory',
].join('\n') + CARBONE_FOOTER;

var translator = {

  /**
   * Handle parameters
   * @param {array} args
   */
  handleCLI : function (args) {
    var _lang = null;
    var _dirpath = null;

    while (args.length > 0) {
      var _argument = args.shift();
      switch (_argument) {
        case '--lang':
        case '-l':
          _lang = args.shift();
          break;
        case '--path':
        case '-p':
          _dirpath = args.shift();
          break;
        case '--help':
        case '-h':
          console.log(USAGE);
          process.exit();
          break;
        default:
          console.error('Error: unknown argument "'+_argument+'"');
          process.exit();
          break;
      }
    }

    if (_lang === null) {
      console.error('Error: No lang. Use -l');
      process.exit();
    }
    if (_dirpath === null) {
      console.error('Error: No path. Use -p');
      process.exit();
    }
    translator.generateLang(path.resolve(_dirpath), _lang, function (err, newObjLang, meta) {
      if (err) {
        console.log(err);
      }
      console.log([
        '\nThe carbone lang file "'+ _lang +'.json" was successfully updated. Number of keys...',
        ' - added        : '+ meta.addedKeys,
        ' - deleted      : '+ meta.deletedKeys,
        ' - unaltered    : '+ meta.unalteredKeys,
        ' - unused       : '+ meta.unusedKeys,
        ' - untranslated : '+ meta.untranslatedKeys
      ].join('\n') + '\n');
    });
  },

  /**
   * Load all lang in memory. Set the global variable params.translations
   * @param  {String} templatePath template path
   */
  loadTranslations : function (templatePath) {
    params.translations = {};
    var _langPath = path.join(templatePath, 'lang');
    if (fs.existsSync(_langPath) === true) {
      var _langFiles = fs.readdirSync(_langPath);
      for (var i = 0; i < _langFiles.length; i++) {
        var _filename = _langFiles[i];
        if (_filename.endsWith('.json') === true) {
          var _lang = path.basename(_filename, '.json');
          params.translations[_lang] = JSON.parse(fs.readFileSync(path.join(_langPath, _filename)));
        }
      }
    }
  },

  /**
   * Read all files of a directory, find all translate markers, update lang file
   *
   * @param  {String} dir   path to the directory we want to scan
   * @param  {String} lang  lang file name
   * @param  {Function}     callback(err, newObjLang, meta)
   */
  generateLang : function (dir, lang, callback) {
    var _langDir  = path.join(dir, 'lang');
    var _langFile = path.join(_langDir, lang + '.json');

    if (fs.existsSync(dir) === false) {
      return callback('Error: Invalid path. "'+ dir +'" does not exist');
    }

    if (fs.existsSync(_langDir) === false) {
      fs.mkdirSync(_langDir, parseInt('0766', 8));
    }

    if (typeof(lang) === 'string' && fs.existsSync(_langFile) === false) {
      fs.writeFileSync(_langFile, '{}');
    }

    var _currentLangObj = JSON.parse(fs.readFileSync(_langFile));
    var _files = helper.walkDirSync(dir, params.extensionParsed);

    translator.parseFiles(_files, [], function (err, foundKeys) {
      if (err) {
        return callback(err);
      }
      translator.createLangObj(_currentLangObj, foundKeys, function (err, newLangObj, meta) {
        if (err) {
          return callback(err);
        }
        fs.writeFileSync(_langFile, JSON.stringify(newLangObj, null, 2) + '\n');
        return callback(null, newLangObj, meta);
      });
    });
  },

  /**
   * Parse all files and return an array with all lang keys
   * @param  {Array}   files     list of template path
   * @param  {Array}   langKeys  array to fill
   * @param  {Function} callback (err, keys) keys contains all unique key found, sorted by alphabetical order
   */
  parseFiles : function (files, langKeys, callback) {
    if (files.length === 0) {
      langKeys.sort(alphabeticalSort);
      langKeys = helper.removeDuplicatedRows(langKeys);
      return callback(null, langKeys);
    }
    var _file = files.pop();
    translator.findTranslationMarkers(_file, langKeys, function (err) {
      if (err) {
        return callback(err, langKeys);
      }
      return translator.parseFiles(files, langKeys, callback);
    });
  },

  /**
   * find translation markers in a template file
   * @param  {String}   filePath template to parse
   * @param  {Array}    langKeys this array is updated with new keys
   * @param  {Function} callback (err, arraytOfString)
   */
  findTranslationMarkers : function (filePath, langKeys, callback) {
    file.openTemplate(filePath, function (err, template) {
      if (err) {
        return callback(err, []);
      }
      for (var k = 0; k < template.files.length; k++) {
        var _file = template.files[k];
        var _xml = _file.data;
        if (_file.isMarked === false || typeof(_xml) !== 'string' ) {
          continue;
        }
        // capture {t  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
        _xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*t[\s\S]+?)\}/g, function (m, text) {
          // capture words inside () in order to translate them with the correct lang.json.
          var _pattern = /\((.*)\)/.exec(text);
          // If there is an expression inside ()
          // _pattern contains [_cleanMarkerStr without 't', words inside (), index, _cleanMarkerStr]
          if (_pattern instanceof Array && _pattern.length > 1) {
            var _strToTranslate = parser.extractMarker(_pattern[1]);
            _strToTranslate = parser.replaceEncodedOperatorCharactersByNoEncodedCharacters(_strToTranslate);
            langKeys.push(_strToTranslate);
          }
        });
      }
      return callback(null, langKeys);
    });
  },

  /**
   * Create lang object
   * @param  {Object}   currentLangObj existing lang object
   * @param  {Array}    sortedNewKeys  array of unique lang key, sorted by alphabetical order
   * @param  {Function} callback       (err, newLangObj, meta)
   *                                   newLangObj : new Lang object
   *                                   meta       : {Object} containts debug counters
   */
  createLangObj : function (currentLangObj, sortedNewKeys, callback) {
    var _addedOrDeletedKeys = {};
    var _unalteredKeys = {};
    var _newLangObj = {};
    var _meta = {
      addedKeys        : 0,
      deletedKeys      : 0,
      unalteredKeys    : 0,
      untranslatedKeys : 0,
      unusedKeys       : 0
    };

    // seperate added and existing keys
    for (var i = 0; i < sortedNewKeys.length; i++) {
      var _newKey = sortedNewKeys[i];
      if (typeof(currentLangObj[_newKey]) === 'undefined') {
        _meta.addedKeys++;
        _addedOrDeletedKeys[_newKey] = '';
      }
      else if (currentLangObj[_newKey] === '') {
        _meta.untranslatedKeys++;
        _meta.unalteredKeys++;
        _addedOrDeletedKeys[_newKey] = '';
      }
      else {
        _meta.unalteredKeys++;
        _unalteredKeys[_newKey] = currentLangObj[_newKey];
      }
    }

    // detect deleted keys, and keep old deleted keys
    for (var _currentKey in currentLangObj) {
      if (typeof(_unalteredKeys[_currentKey]) === 'undefined' && typeof(_addedOrDeletedKeys[_currentKey]) === 'undefined') {
        if (_currentKey.endsWith(UNUSED_MARKER) === true) {
          _meta.unusedKeys++;
          _addedOrDeletedKeys[_currentKey] = currentLangObj[_currentKey];
        }
        else {
          _meta.deletedKeys++;
          if (currentLangObj[_currentKey] !== '') {
            // keep unused marker only if there was a translation
            _addedOrDeletedKeys[_currentKey + UNUSED_MARKER] = currentLangObj[_currentKey];
          }
        }
      }
    }

    // sort added or deleted key separately
    var _addedOrDeletedKeysSorted = Object.keys(_addedOrDeletedKeys);
    _addedOrDeletedKeysSorted.sort(alphabeticalSort);

    // firstly, add new and deleted keys
    for (var j = 0; j < _addedOrDeletedKeysSorted.length; j++) {
      var _key = _addedOrDeletedKeysSorted[j];
      _newLangObj[_key] = _addedOrDeletedKeys[_key];
    }
    // then, add unalteredKeys (already sorted)
    for (var _unalteredkey in _unalteredKeys) {
      _newLangObj[_unalteredkey] = _unalteredKeys[_unalteredkey];
    }

    _meta.unusedKeys += _meta.deletedKeys;
    _meta.untranslatedKeys += _meta.addedKeys;

    return callback(null, _newLangObj, _meta);
  }

};

function alphabeticalSort (a, b) {
  var _a = String(a).toLowerCase();
  var _b = String(b).toLowerCase();
  // if the string are the same whatever the case is, order them constantly (upper case first)
  if (_a === _b) {
    _a = String(a);
    _b = String(b);
  }
  if (_a < _b) {
    return -1;
  }
  if (_a > _b) {
    return  1;
  }
  return 0;
}

module.exports = translator;
