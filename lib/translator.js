var fs = require('fs');
var path = require('path');
var helper = require('./helper');
var params = require('./params');
var converter = require('./converter');
var file = require('./file');
var parser = require('./parser');

var carbone_header = [
  '\n/******************************************************************************\\',
  '                                   CARBONE                                    ',
  ' ------------------------------------------------------------------------------\n'
].join('\n');

var carbone_footer = [
  '\n\\******************************************************************************/ '
];
var usage = carbone_header + [
  '                                Translator usage:',
  'Description :',
  '   -------------',
  '   generateLang find all t() markers in the specified directory ',
  '   and insert them in a new json file',
  '   This file will be created if it not exist. If the file exist, delete unused ',
  '   translator keys and keep existant translator markers and add the new ones.',
  '   mandatory options :',
  'Mandatory options :',
  '   -------------------',
  '   -l [lang] or --lang [lang] : the lang extension (fr,en,de,etc)',
  '   -p [path] or --path [path] : The path of the docs directory which must be parse',
  'Example :',
  '   -------------------',
  '   node carbone generateLang -l fr -p path/to/docs/directory',
].join('\n') + carbone_footer;

var _newKeys = '{}';

var translator = {

  /**
   * Handle parameters of the command easylink server
   * @param {array} args : args passed by easylink (process.argv.slice(3))
   */
  handleParams: function(args) {
    var _translator_command_error = false;
    var _lang = null;
    var _dirpath = null;
    var _error_message = 'Error : Invalid argument : write generateLang --help or -h for assistance ';

    while (args.length > 0) {
      var _argument = args.shift();
      switch (_argument) {
        case "--lang":
        case "-l":
        case "--translate":
        case "-t":
          _lang = args.shift();
          break;
        case "--path":
        case "-p":
          _dirpath = args.shift()
          if (!fs.existsSync(_dirpath)) {
            _translator_command_error = true;
            _error_message = "Error : Invalid  directory path argument : This directory path does not exist";
          }
          break;
        case "--help":
        case "-h":
          console.log(usage);
          process.exit();
          break;
        default:
          _translator_command_error = true
          break;
      }
    }
    if (_translator_command_error === true) {
      console.log(carbone_header + _error_message + carbone_footer);
      process.exit();
    }
    if (_lang !== null && _dirpath !== null) {
      translator.generateLang(_dirpath, _lang, function(err, newObjLang, bodyMsg, keyTypeCountObject) {
        if (!err) {
          console.log(carbone_header + bodyMsg + '\nThe lang file ' + _lang + '.json was successfully updated' + carbone_footer);
        } else {
          console.log(carbone_header + err + carbone_footer);
        }
      });
    }

  },
  /**
   * Read all files of a directory ,select all translate marker, write the file
   * and display a pending msg
   *
   * @param {string} dir : path to the directory we want to scan
   * @return {object} : {'file/path/name.js':'content of the file', ...}
   */
  generateLang: function(dir, lang, callback) {
    var _res = {};
    var _dirLangPath = dir + '/lang';
    var _templatePath = path.resolve(_dirLangPath + '/', lang + '.json');
    var _error_message = "";


    if (!fs.existsSync(dir)) {
      _error_message = "docs folder does not exist";
      return callback(_error_message, null, null);
    }

    if (!fs.existsSync(_dirLangPath)) {
      fs.mkdirSync(_dirLangPath, 0766, function(err) {
        if (err) {
          _error_message = "error! Can't create the lang directory!";
          console.log(_error_message + carbone_footer);
          callback(_error_message, null, null);
        }
      });
    }

    var _files = helper.walkDirSync(path.resolve(dir), "(doc|ods|odt|docx|xls?)");

    var _oldKeys = {};
    var _newKeys = {};
    var _bodyMsg = "";

    var _langFileData = null;
    var _oldObjLang = null;
    var _oldObjLangKeyNotFound = null;

    if (!fs.existsSync(_templatePath)) {
      fs.writeFileSync(_templatePath, null);
      _bodyMsg = 'The lang file : ' + lang + '.json has been created';

      translator.reportsOldAndNewKeys(_files, _oldObjLang, _oldKeys, _newKeys, _oldObjLangKeyNotFound, 0, function(err, newObjLang, keyTypeCountObject) {
        //create and fill the file
        fs.writeFileSync(_templatePath, JSON.stringify(newObjLang, null, 2));
          _bodyMsg += '\nNew translate keys found : ' + keyTypeCountObject['newKeys'];
          params.objLang = JSON.stringify(newObjLang, null, 2);
          callback(err, newObjLang, _bodyMsg, keyTypeCountObject);
      });
    } else {
      _bodyMsg = 'The lang file : ' + lang + '.json has been found';
      _langFileData = fs.readFileSync(_templatePath);
      params.objLang = JSON.parse(_langFileData);
      _oldObjLangKeyNotFound = JSON.parse(_langFileData);

      translator.reportsOldAndNewKeys(_files, params.objLang, _oldKeys, _newKeys, _oldObjLangKeyNotFound, 0, function(err, newObjLang, keyTypeCountObject) {
        //create and fill the file
        fs.writeFileSync(_templatePath, JSON.stringify(newObjLang, null, 2));
        _bodyMsg += '\nNew translated keys : ' + keyTypeCountObject['newKeys'];
        _bodyMsg += '\nEmpty existing keys : ' + keyTypeCountObject['emptyExistingKeys'];
        _bodyMsg += '\nTranslated keys unchanged or updated : ' + keyTypeCountObject['updatedKeys'];
        _bodyMsg += '\nTranslated keys not found : ' + keyTypeCountObject['deletedKeys'];
        _bodyMsg += '\nOld translated keys not found : ' + keyTypeCountObject['oldDeletedKeys'];
        params.objLang = JSON.stringify(newObjLang, null, 2);
        callback(err, newObjLang, _bodyMsg, keyTypeCountObject);
      });
    }
  },

  /**
   * A files array is passed. While all file have not been parsed, call reportTranslatorMarker function in order to
   * build oldKeys,newKeys and oldObjLangKeyNotFound.
   * When all files have been parsed, call updateALangFile with final oldKeys,newKeys and oldObjLangKeyNotFound
   * @param  {[type]}   files                 [description]
   * @param  {[type]}   oldObjLang            [description]
   * @param  {[type]}   oldKeys               [description]
   * @param  {[type]}   newKeys               [description]
   * @param  {[type]}   oldObjLangKeyNotFound [description]
   * @param  {[type]}   index                 [description]
   * @param  {Function} callback              [description]
   * @return {[type]}                         [description]
   */
  reportsOldAndNewKeys: function(files, oldObjLang, oldKeys, newKeys, oldObjLangKeyNotFound, index, callback) {
    if (index < files.length) {
      var _filePath = files[index];
      translator.reportTranslatorMarker(_filePath, oldObjLang, oldKeys, newKeys, oldObjLangKeyNotFound,
        function(err, oldObjLangKeys, newObjLangKeys, oldObjLangKeyNotFound) {
          _oldObjLangKeyNotFound = oldObjLangKeyNotFound;
          _oldKeys = oldObjLangKeys;
          _newKeys = newObjLangKeys;
          translator.reportsOldAndNewKeys(files, oldObjLang, _oldKeys, _newKeys, _oldObjLangKeyNotFound, index + 1, callback)
        });
    } else {
      translator.updateALangFile(oldKeys, newKeys, oldObjLangKeyNotFound, function(err, newObjLang, keyTypeCountObject) {
        callback(err, newObjLang, keyTypeCountObject);
      });
    }
  },


  /**
   * This fucntion find all translator markers in the file.
   * translator markers found in file are compare with oldObjLang, 
   *   if it exists in oldObjLang, the will be insert in oldKeys
   *   if it doesn't exist in oldObjLang, the will be insert in newKeys
   * @param  {[type]}   filePath              [description]
   * @param  {[type]}   oldObjLang            [description]
   * @param  {[type]}   oldKeys               [description]
   * @param  {[type]}   newKeys               [description]
   * @param  {[type]}   oldObjLangKeyNotFound [description]
   * @param  {Function} callback              [description]
   * @return {[type]}                         [description]
   */
  reportTranslatorMarker: function(filePath, oldObjLang, oldKeys, newKeys, oldObjLangKeyNotFound, callback) {
    file.openTemplate(filePath, function(err, template) {
      for (var k = 0; k < template.files.length; k++) {
        if (err) {
          return callback(err, null, null, null);
        }
        var _file = template.files[k];
        if (_file.isMarked === true) {
          var xml = _file.data;
          if (typeof(xml) !== 'string') {
            return callback(xml, null, null, null);
          }
          //capture {t  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
          var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*t[\s\S]+?)\}/g, function(m, text, offset) {
            var _xmlOnly = parser.cleanXml(text);
            //capture words inside () in order to translate them with the correct lang.json.
            var _pattern = /\((.*)\)/.exec(text);
            // If there is an expression inside () _pattern contains [_cleanMarkerStr without 't', words inside (), index, _cleanMarkerStr] 
            if (_pattern instanceof Array && _pattern.length > 1) {
              // If _pattern[1] exist, we translate the expression. Else we write _pattern[1]
              var _strToTranslate = parser.extractMarker(_pattern[1]);
              //decode encoded characters
              _strToTranslate = parser.replaceEncodedOperatorCharactersByNoEncodedCharacters(_strToTranslate);
              //insert key marker in oldKeys and newKeys
              if (oldObjLang && oldObjLang[_strToTranslate] !== undefined && oldObjLang[_strToTranslate] !== "") {
                oldKeys[_strToTranslate] = oldObjLang[_strToTranslate];
              } else {
                newKeys[_strToTranslate] = "";
              }
              if (oldObjLangKeyNotFound) {
                delete oldObjLangKeyNotFound[_strToTranslate];
              }
            }
          });
        }
      };
      return callback(null, oldKeys, newKeys, oldObjLangKeyNotFound);
    });
  },

  /**
   * Sorted and write each objectKey of oldObjLangKeyNotFound, newKeys and oldKeys
   * Each key type (new,old,old and removed,removed and fin again) is count and the
   * result will be send with the callback
   * @param  {[type]}   oldKeys               [description]
   * @param  {[type]}   newKeys               [description]
   * @param  {[type]}   oldObjLangKeyNotFound [description]
   * @param  {Function} callback              [description]
   * @return {[type]}                         [description]
   */
  updateALangFile: function(oldKeys, newKeys, oldObjLangKeyNotFound, callback) {
    var _newObjLang = {};
    var _keyTypeCountArray = new Array();
    var _countNewOldObjectLangKeyNotFound = 0;
    var _countOldObjectLangKeyNotFound = 0;

    if (oldObjLangKeyNotFound) {
      var _oldKeysRemovedToSorted = {};

      //Firstly, stock the old not found removed keys
      for(var _keyNotFound in oldObjLangKeyNotFound){
        if (_keyNotFound.substring(0, 3) !== '<!>') {
          _oldKeysRemovedToSorted['<!>' + _keyNotFound] = oldObjLangKeyNotFound[_keyNotFound]
          _countNewOldObjectLangKeyNotFound++;
        } else {
          _oldKeysRemovedToSorted[_keyNotFound] = oldObjLangKeyNotFound[_keyNotFound]
          _countOldObjectLangKeyNotFound++;
        }
      }

      // sort oldKeysRemovedToSorted object
      var _oldKeysRemoved = Object.keys(_oldKeysRemovedToSorted);
      _oldKeysRemoved.sort(function(a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      //write news oldKeysRemoved
      _oldKeysRemoved.forEach(function(oldKeyRemoved) {
        _newObjLang[oldKeyRemoved] = _oldKeysRemovedToSorted[oldKeyRemoved];
      });
    }


    // sort newKeyInObjLang object
    var _newKeys = Object.keys(newKeys);
    _newKeys.sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    var _countNewKeys = 0
    var _countEmptyOldKeys = 0;
    var _actualObjLang = params.objLang;
    //write news keys
    
    for(var _newKey in _newKeys){
      var _newKeyValue = _newKeys[_newKey];
      _newObjLang[_newKeyValue] = '';
      if(_actualObjLang[_newKeyValue] === '')
      {
        _countEmptyOldKeys++;
      }else{
        _countNewKeys++;
      }
    }


    //sort oldKeyInObjLang object
    var _oldKeys = Object.keys(oldKeys);
    _oldKeys.sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    var _countUpdatedKeys = 0
    //write the old keys
    for(var _oldKey in _oldKeys){
      var _oldKeyValue = _oldKeys[_oldKey];
      _newObjLang[_oldKeyValue] = oldKeys[_oldKeyValue];
      _countUpdatedKeys++;
    }

    var _keyTypeCountObject = {
      'newKeys'           : _countNewKeys,
      'emptyExistingKeys' : _countEmptyOldKeys,
      'updatedKeys'       : _countUpdatedKeys,
      'deletedKeys'       : _countNewOldObjectLangKeyNotFound,
      'oldDeletedKeys'    : _countOldObjectLangKeyNotFound
    }

    callback(null, _newObjLang, _keyTypeCountObject);
  }
}



module.exports = translator;