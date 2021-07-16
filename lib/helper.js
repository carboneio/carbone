var fs = require('fs');
var path = require('path');
var assert = require('assert');
var crypto = require('crypto');
var params = require('./params');
var exec = require('child_process').exec;
var debug = require('debug')('carbone:helper');

var sameUIDCounter = 0;
var prevTimestamp = 0;

// Random values to pre-allocate
const randomPool      = Buffer.alloc(256);
var randomPoolPointer = randomPool.length;

var helper = {

  /**
   * Generate a unique id
   * @return {String} unique id
   */
  getUID : function () {
    var _timestamp = Date.now();
    var _uid = params.uidPrefix + '_' +_timestamp + '_' + process.pid + '_';
    if (_timestamp === prevTimestamp) {
      _uid += ++sameUIDCounter;
    }
    else {
      _uid += '0';
      sameUIDCounter = 0;
    }
    prevTimestamp = _timestamp;
    return _uid;
  },

  /**
   * Generate a constant-length base64 random string without forbidden characters for filesystem
   *
   * [/+] are replaced by [-_]
   *
   * Length : 22 characters
   * It is 5 times slower than getUID above but a lot more secure to generate public filename
   *
   * It uses Cryptographically Secure Pseudo-Random Number Generator, with unbiased (ie secure) tranformation
   * Same collision probability as standard 128 bits uuid-v4
   * Doc: https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba
   *
   * @return {String}   The random string
   */
  RANDOM_STRING_LENGTH : 22,
  getRandomString      : function () {
    if (randomPoolPointer > randomPool.length - 16) {
      // It is alot simpler to use sync version
      // Otherwose, we must maintain a table of callback
      // This sync function is called 1/16 times
      crypto.randomFillSync(randomPool);
      randomPoolPointer = 0;
    }
    let _randomStr = randomPool.toString('base64', randomPoolPointer, (randomPoolPointer += 16));
    return _randomStr.slice(0, -2).replace(/\//g,'-').replace(/\+/g,'_');
  },


  /**
   * Encode any string to a base64 string, safe for generating POSIX compatible filenames
   *
   * @param  {String}  str The string
   * @return {String}      A safe filename
   */
  encodeSafeFilename : function (str) {
    return Buffer.from(str||'').toString('base64').replace(/=/g,'').replace(/\//g,'-').replace(/\+/g,'_');
  },

  /**
   * Decode a base64 safe filename to the original string
   *
   * @param  {String}  filename  The filename
   * @return {String}            Return original string
   */
  decodeSafeFilename : function (filename) {
    return Buffer.from((filename||'').replace(/-/g,'/').replace(/_/g,'+'), 'base64').toString('utf8');
  },

  /**
   * Beautiful assert between two objects
   * Be careful, it will inspect with a depth of 100
   *
   * @param {object} result : result
   * @param {object} expected : expected
   * @return {type} throw an error if the two objects are different
   */
  assert : function (result, expected) {
    assert.strictEqual(JSON.stringify(result, null, 2), JSON.stringify(expected , null, 2));
  },
  /**
   * Read all files of a directory
   *
   * @param {string} dir : path to the directory we want to scan
   * @param {string} extension (optional) : filter on file extension. Example: 'sql' (without the point). Can be a regex
   * @return {object} : {'file/path/name.js':'content of the file', ...}
   */
  readFileDirSync : function (dir, extension) {
    var _that = this;
    var _res = {};
    var _files = _that.walkDirSync(dir,extension);
    for (var i = 0; i < _files.length; i++) {
      var _filePath = _files[i];
      var _code = fs.readFileSync(_filePath, 'utf8');
      _res[_filePath] = _code;
    }
    return _res;
  },

  cleanJavascriptVariable : function (attributeName) {
    return  attributeName.replace(/[^a-zA-Z0-9$_]/g, '_');
  },

  /**
   * Remove quotes from string
   *
   * @param  {Strring} str  string with or without quotes
   * @return {String}       string without surrounding quotes
   */
  removeQuote : function (str) {
    if (typeof(str) === 'string') {
      return str.replace(/^ *['"]?/, '').replace(/['"]? *$/, '');
    }
    return str;
  },

  /**
   * Remove a directory and all its content
   * Be careful, this method is synchrone
   *
   * @param {type} dir : directory path
   */
  rmDirRecursive : function (dir) {

    if (!fs.existsSync(dir)) {
      return;
    }
    var _list = fs.readdirSync(dir);

    for (var i = 0; i < _list.length; i++) {
      var _filename = path.join(dir, _list[i]);
      var _stat = fs.statSync(_filename);

      if (_stat.isFile()) {
        // if this is a file, remove it
        fs.unlinkSync(_filename);
      }
      else if (_stat.isDirectory()) {
        // if the is a dircetory, call the function recursively
        this.rmDirRecursive(_filename);
      }
    }
    fs.rmdirSync(dir);
  },

  /**
   * Remove a directory and all its content using the system command.
   * It should be faster accrording to some person but I have not verified.
   * At least, it is asynchrone.
   *
   * @param {type} dir : directory path
   * @param {function} callback : (error, stdout, stderr)
   */
  rmDirRecursiveAsync : function (dir, callback) {
    exec('rm -rf '+dir, callback);
  },

  /**
   * Get value of an object securely
   *
   * @param  {Object} rootObj object to read
   * @param  {String} path    path rootObj.a.b.c
   * @return {Mixed}          value
   */
  getValueOfPath : function (rootObj, path) {
    if (typeof(rootObj) !== 'object' || typeof(path) !== 'string') {
      return undefined;
    }
    var _currentObj = rootObj;
    var _attrs = path.split('.');
    for (var i = 0; i < _attrs.length; i++) {
      var _attr = _attrs[i];
      if (_currentObj[_attr] === undefined) {
        debug('[[C_ERROR]] '+_attr+' not defined');
        return '';
      }
      _currentObj = _currentObj[_attr];
    }
    return _currentObj;
  },

  /**
   * Scan a directory and all sub-directory
   * It does not return files and directories which start by a point. Example: .trash, .cache, .svn, ...
   * This function is synchrone
   *
   * @param {string} dir : path to the directory we want to scan
   * @param {string} extension (optional) : filter on file extension. Example: 'js' (without the point)
   * @return {array} Array of files name with their path : ['/path/to/file1.js', '/path/to/file2.js']
   */
  walkDirSync : function (dir, extension) {
    var _files = [];

    // if the path does not exist, return an empty table
    if (!fs.existsSync(dir)) {
      return _files;
    }

    // eliminate all files which start by a point.
    var _regExp = /^[^.]/;

    if (extension instanceof RegExp) {
      _regExp = extension;
    }
    else if (extension) {
      // we must use new RegExp because extension is variable
      _regExp = new RegExp('^[^\\.].+\\.'+extension+'$');
    }

    walkDirRecursive(dir);
    // recursively called by himself until all sub-directories
    function walkDirRecursive (dir) {
      // read the directory
      var _list = fs.readdirSync(dir);

      for (var i = 0; i < _list.length; i++) {
        var _filename = path.join(dir, _list[i]);
        var _stat = fs.statSync(_filename);
        var _baseName = path.basename(_filename); // get the base name in order to eliminate folder which starts by a point.

        if (_stat.isFile() && _regExp.test(_baseName)) {
          // if this is a file, push it in the table
          _files.push(_filename);
        }
        else if (_stat.isDirectory()) {
          // if this is a directory, call the function recursively
          walkDirRecursive(_filename);
        }
      }
    }
    return _files;
  },


  /**
   * Copy an entire directory with all its content somewhere else
   *
   * @param {string} dirSource : directory source. Example /usr/lib/node
   * @param {string} dirDest : directory destination. Example /usr
   * In this example, it will copy the "node" directory or file in /usr/node
   */
  copyDirSync : function (dirSource, dirDest) {

    var _sourceList = this.walkDirSync(dirSource);
    var _parentSourceDir = path.dirname(dirSource);

    // replace the name of the files which contains {{=data.tableName}}
    for (var i = 0; i < _sourceList.length; i++) {
      // get the relative path
      var _relativePath = path.relative(_parentSourceDir, _sourceList[i]);
      // re-positionned the sub directories to the destination directory
      var _destPath = path.join(dirDest, _relativePath);
      // Get file info
      var _stat = fs.statSync(_sourceList[i]);

      if (_stat.isFile()) {
        // if this is a file, copy its content
        var _fileContent = fs.readFileSync(_sourceList[i], 'utf8');
        this.writeFileDirSync(dirDest, _destPath, _fileContent);
      }
      else if (_stat.isDirectory()) {
        this.writeFileDirSync(dirDest, _destPath);
      }
    }
  },


  /**
   * Write a file and create directory if they does not exist (NOT TESTED DIRECTLY)
   *
   * @param {string} root : Root where to stop searching for directory creation
   * @param {string} fileOrDirPath : file or directory to write with an absolute path
   * @param {string} content : content of the file
   */
  writeFileDirSync : function (root, fileOrDirPath, content) {
    var _lastDirname = fileOrDirPath;
    var _dirToCreate = [];

    while (_lastDirname!=='/' && _lastDirname!==root) {
      _lastDirname = path.dirname(_lastDirname);
      if (!fs.existsSync(_lastDirname)) {
        _dirToCreate.push(_lastDirname);
      }
    }
    // create directories
    for (var i = _dirToCreate.length-1; i >= 0; i--) {
      fs.mkdirSync(_dirToCreate[i], '0755');
    }
    // If the is a file, create it
    if (typeof (content) !== 'undefined') {
      fs.writeFileSync(fileOrDirPath, content);
    }
  },

  replaceAll : function (str, find, replace) {
    return str.replace(new RegExp(find.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'), 'g'), replace);
  },

  /**
   * Escape Regular expression characters
   * @param  {String} str regular expression written as usual
   * @return {String}     escape version
   */
  regexEscape : function (str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  /**
   * Remove duplicated item of an already sorted array
   * @param  {Array} sortedArrayToClean  array already SORTED
   * @return {Array}                     new array without duplicated elements
   */
  removeDuplicatedRows : function (sortedArrayToClean) {
    if (sortedArrayToClean.length === 0) {
      return sortedArrayToClean;
    }
    var _previousItem = sortedArrayToClean[0];
    var _arrayCleaned = [_previousItem];
    for (var i = 1; i < sortedArrayToClean.length; i++) {
      var _item = sortedArrayToClean[i];
      if (_item !== _previousItem) {
        _arrayCleaned.push(_item);
        _previousItem = _item;
      }
    }
    return _arrayCleaned;
  },

  /**
   * find closest string
   * @param  {String} str     string to search
   * @param  {Array|Object}   choices array of string to search
   * @return {String}         closest string from choices
   */
  findClosest : function (str, choices) {
    var _choices = choices;
    if ( !(choices instanceof Array) ) {
      _choices = Object.keys(choices);
    }
    if (_choices.length === 0 || str === '') {
      return '';
    }
    var _minDistance = str.length;
    var _closest = 0;
    for (var i = 0; i < _choices.length; i++) {
      var _choice = _choices[i];
      var _distance = helper.distance(str, _choice);
      if (_distance < _minDistance) {
        _minDistance = _distance;
        _closest = i;
      }
    }
    return _choices[_closest];
  },

  /**
   * Compute distance between two string
   * //https://github.com/awnist/distance
   *
   * @param  {String} s1 string to compare
   * @param  {String} s2 string
   * @return {Integer}   distance
   */
  distance : function (s1, s2) {
    var c = 0;
    var lcs = 0;
    var offset1 = 0;
    var offset2 = 0;
    var i = 0;
    var maxOffset = 5;
    if (!(s1 !== null) || s1.length === 0) {
      if (!(s2 !== null) || s2.length === 0) {
        return 0;
      }
      else {
        return s2.length;
      }
    }
    if (!(s2 !== null) || s2.length === 0) {
      return s1.length;
    }
    while ((c + offset1 < s1.length) && (c + offset2 < s2.length)) {
      if (s1[c + offset1] === s2[c + offset2]) {
        lcs++;
      }
      else {
        offset1 = offset2 = i = 0;
        while (i < maxOffset) {
          if ((c + i < s1.length) && (s1[c + i] === s2[c])) {
            offset1 = i;
            break;
          }
          if ((c + i < s2.length) && (s1[c] === s2[c + i])) {
            offset2 = i;
            break;
          }
          i++;
        }
      }
      c++;
    }
    return (s1.length + s2.length) / 2 - lcs;
  }

};

module.exports = helper;