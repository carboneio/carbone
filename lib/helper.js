/* eslint-disable no-useless-escape */
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var params = require('./params');
var exec = require('child_process').exec;

var sameUIDCounter = 0;
var prevTimestamp = 0;

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
   * Beautiful assert between two objects
   * Be careful, it will inspect with a depth of 100
   *
   * @param {object} result : result
   * @param {object} expected : expected
   * @return {type} throw an error if the two objects are different
   */
  assert : function (result, expected, message) {
    try {
      assert.equal(JSON.stringify(result, null, 2), JSON.stringify(expected, null, 2), message);
    }
    catch (e) {
      e.showDiff = true;
      throw e;
    }
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
    var _regExp = /^[^\.]/;

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


  /**
   * Quick left zero-padding of a string.
   *
   * @param {integer} n : The integer number to pad.
   * @param {integer} len: The length of padded string.
   * @return {string} The left zero-padded number as a string.
   */
  padlz : function (n, len) {
    for (n+=''; n.length < len; n = '0' + n); // eslint-disable-line
    return n;
  },

  replaceAll : function (str, find, replace) {
    return str.replace(new RegExp(find.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'g'), replace);
  },

  /**
   * Escape Regular expression characters
   * @param  {String} str regular expression written as usual
   * @return {String}     escape version
   */
  regexEscape : function (str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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