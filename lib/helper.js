var fs = require('fs');
var path = require('path');
var assert = require('assert');
var crypto = require('crypto');
var params = require('./params');
var exec = require('child_process').exec;
var debug = require('debug')('carbone:helper');
const package = require('../package.json');
const kittenJwt = require('kitten-jwt');

var sameUIDCounter = 0;
var prevTimestamp = 0;

// Random values to pre-allocate
const randomPool      = Buffer.alloc(256);
var randomPoolPointer = randomPool.length;

var helper = {

  /**
   * This factor is used to modify asserts in performance unit tests.
   * If those tests are executed on slow machines, this factor is higher
   * to reduce required level of performance in the test.
   */
  CPU_PERFORMANCE_FACTOR : 1.0,

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
    return _randomStr.slice(0, -2).replace(/\//g,'_').replace(/\+/g,'-');
  },


  /**
   * Encode any string to a base64 string, safe for generating POSIX compatible filenames
   * https://fr.wikipedia.org/wiki/Base64
   *
   * @param  {String}  str The string
   * @return {String}      A safe filename
   */
  encodeSafeFilename : function (str) {
    return Buffer.from(str||'').toString('base64').replace(/=/g,'').replace(/\//g,'_').replace(/\+/g,'-');
  },

  /**
   * Decode a base64 safe filename to the original string
   *
   * @param  {String}  filename  The filename
   * @return {String}            Return original string
   */
  decodeSafeFilename : function (filename) {
    return Buffer.from((filename||'').replace(/_/g,'/').replace(/-/g,'+'), 'base64').toString('utf8');
  },

  /**
   * Read env variable and update params accordingly
   *
   * @param {Object}  env     Environment variables
   * @param {Object}  params  Parameters to update
   */
  readEnvironmentVariable : function (env, params) {
    let _valueToUpdate = {};
    for (let _key in params) {
      let _defaultValue = params[_key];
      let _envValue = env['CARBONE_EE_' + _key.toUpperCase()];
      if (_envValue !== undefined) {
        if (typeof _defaultValue === 'boolean' && typeof _envValue !== 'boolean') {
          _envValue = (_envValue === 'true') ? true : false;
        }
        else if (typeof _defaultValue === 'number' && typeof _envValue !== 'number') {
          _envValue = parseInt(_envValue, 10);
        }
        _valueToUpdate[_key] = _envValue;
      }
    }
    return _valueToUpdate;
  },

  /**
   * Assign value of target, coming from source, only if the attribnute exists in target
   *
   * Faster than Object.assign
   * Throw  an error
   *
   * @param {Object}  target  The target
   * @param {Object}  source  The source
   */
  assignObjectIfAttributesExist : function (target, source) {
    let _unknownParams = [];
    if (!target) {
      return '';
    }
    for (var _key in source) {
      if (target[_key] === undefined) {
        _unknownParams.push(_key);
      }
      else {
        target[_key] = source[_key];
      }
    }
    if (_unknownParams.length === 0) {
      return '';
    }
    return 'Unknown parameter(s): ' + _unknownParams.join(', ');
  },

  /**
   * Test if a filename coming from client side is safe
   *
   * Inspired by https://github.com/parshap/node-sanitize-filename/blob/master/index.js
   * We do something a lot simpler because we know the name with generate
   *
   * @param  {String}  insecureFilename  The insecure filename
   * @return {Boolean} true if it is a safe filename
   */
  isSafeFilename : function (insecureFilename) {
    return typeof(insecureFilename) === 'string'
      && insecureFilename.length < 256
      && insecureFilename.length > 5 // to avoid Windows reserved words COM2, LPT4
      && /^\.+/.test(insecureFilename) === false
      && /^[a-z0-9-_]+$/i.test(insecureFilename.replace('.', '')) === true;
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
   * Get the JS code to access variable of a sub-object safely, and fastly
   *
   * @param  {Function}  getSafeValue  function which protects againts code injection attacks
   * @param  {string}    rootObj       The root object
   * @param  {string}    path          The path
   * @return {string}    The safe path code.
   */
  getSafePathCode : function (getSafeValue, rootObj, path) {
    if (typeof(path) !== 'string' || typeof(path) !== 'string') {
      return undefined;
    }
    const _arrayIndexError = 'Forbidden array access in "'+path+'". Only positive integers are allowed in []';
    const _attributeError = 'Forbidden array access in "'+path+'". Only non-empty attributes are allowed';
    var _newSafeAccessChain = rootObj;
    var _attributes = path.replace(/\s/g,'').split('.');
    for (var i = 0; i < _attributes.length; i++) {
      var _attr = _attributes[i];
      var _arrayAccess = Array.from(_attr.matchAll(/\[([^\]]+)\]/g));
      if (_arrayAccess.length > 0) {
        _attr = _attr.slice(0, _arrayAccess[0].index);
      }
      if (_attr.indexOf('[') !== -1 || _attr.indexOf(']') !== -1) {
        throw Error(_arrayIndexError);
      }
      if (_attr === '') {
        throw Error(_attributeError);
      }
      _newSafeAccessChain += '?.[' + getSafeValue(_attr) + ']';
      for (var j = 0; j < _arrayAccess.length; j++) {
        var _arrayIndex = parseInt(_arrayAccess[j][1], 10);
        if (isNaN(_arrayIndex) === true || _arrayIndex < 0) {
          throw Error(_arrayIndexError);
        }
        _newSafeAccessChain += '?.['+_arrayIndex+']';
      }
    }
    return _newSafeAccessChain;
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
  findClosest : function (str='', choices) {
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
  },

  /**
   * Create a queue.
   *
   * start() must be called to start the queue.
   * It can be called multiple times without breaking the queue.
   * If the queue is already running, it does not start again
   *
   * @param {Array} items to process
   * @param {Function} handlerItem handler(item, callback) function to process the async
   * @param {Function} handlerError handler(err) function to process errors
   * @param {Function} callback  function to call when queue is finished
   * @param {Object} [options] optionnal options object
   */
  genericQueue : function (items = [], handlerItem, handlerError, callback, options = {}) {

    return {
      items       : items,
      currentItem : null,
      isRunning   : false,

      /**
       * Process next item in the queue
       * internal function
       * @param {*} err
       */
      processNextItem : function (err) {
        if (handlerError && err) {
          handlerError(err);

          if (options.stopOnError === true) {
            return;
          }
        }

        if (this.items.length === 0) {
          this.isRunning = false;
          if (callback) {
            return callback();
          }
          return;
        }

        this.currentItem = this.items.shift();
        handlerItem.call(this, this.currentItem, this.processNextItem.bind(this));
      },

      /**
       * Start queue process
       */
      start : function () {
        if (this.isRunning === false) {
          this.isRunning = true;
          this.processNextItem();
        }
      }
    };
  },

  /**
   * It removes the last element from a path
   *
   * @param {String} path
   * @returns {String}
   */
  removeLastPathElement : function (path) {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) {
      return path;
    }
    if (lastSlash === 0) {
      return '/';
    }
    return path.substring(0, lastSlash + 1);
  },

  /**
  * Merge properties of two objects: source into target.
  * Properties in the target object are overwritten by properties in the sources if they have the same key.
  * It is only merging the root level. It is not recursive.
  *
  * @param {Object} target Target object
  * @param {Object} source Source object
  * @returns {Object} The target object
  */
  mergeObjects : function (target, source) {
    const keysSource  = Object.keys(source);

    for (var i = 0, l = keysSource.length; i < l; i++) {
      target[keysSource[i]] = source[keysSource[i]];
    }
    return target;
  },

  /**
   * @private
   * @description Get file extension from an URL. It removes the query parameters and everything after `#`, `?` or `&`.
   *
   * @example 'https://carbone.io/image.gif' => 'gif'
   * @example 'https://carbone.io/image-flag-fr.txt?name=john&age=2#lala' =>  'txt'
   *
   * @param {String} url
   * @returns {String} the file extension
   */
  getFileExtensionFromUrl : function (url) {
    return path.extname(url).slice(1).split(/#|\?|&/)[0];
  },

  /**
   * @description Returns the relative path from the marker `from` to the marker `to`.
   * @description If the type of `from` or `to` are not a string, an empty string is returned.
   *
   * @example from: d.list[i].color                      | to: d.color2                 = ..color2
   * @example from: d.list[i].color                      | to: d.list[i].color2         = .color2
   * @example from: d.list[i].list[i].color              | to: d.list[i].color2         = ..color2
   * @example from: d.list[i].color                      | to: d.list[i].list[i].color2 = .list[i].color2
   * @example from: d.element.color2.object.apple.yellow | d.element.list[i].color      = ....list[i].color
   *
   * @private
   * @param {String} from origin marker
   * @param {Srting} to destination marker used to find the relative path on the data object.
   * @return {String}
   */
  getMarkerRelativePath : function (from, to) {
    let _finalMaker = '';
    let _isDiff  = false;
    if (!from || !to ||  typeof from !== 'string' || typeof to !== 'string') {
      return _finalMaker;
    }
    // Identify the differences between data markers and start to create the new marker
    for (let i = 0, j = from.length; i <= j; i++) {
      if (from[i] !== to[i]) {
        _isDiff = true;
      }
      if (from[i] === '.' && _isDiff === true) {
        _finalMaker += '.';
      }
    }
    // get the end of the marker
    let _actualWord = '';
    _isDiff = false;
    for (let i = 0, j = to.length; i <= j; i++) {
      let _c = to[i];
      if (_c !== from[i]) {
        _isDiff = true;
      }
      if (_c === '.' || i === to.length) {
        if (_isDiff === true) {
          _finalMaker += '.' + _actualWord;
        }
        _actualWord = '';
      }
      else {
        _actualWord += _c;
      }
    }
    return _finalMaker;
  },
  /**
   * @description Inject a string inside a content at a specific position
   * @param {String} text content where the string is injected
   * @param {Integer} index position in the content to inject the string
   * @param {String} string text injected inside the content at the index position
   * @returns {String} the content with the text injected at the index position
   */
  insertAt : function (text, index, string) {
    if (typeof text !== 'string' || typeof index !== 'number' || typeof string !== 'string') {
      throw new Error('The arguments are invalid (null or undefined).');
    }
    if (index < 0 || index > text.length) {
      throw new Error('The index is outside of the text length range.');
    }
    return text.substr(0, index) + string + text.substr(index);
  },
  /**
   * @description Check if a text exist on the content at a specific position.
   * @param {String} toSearch string to search inside the 'text' beginning at the position 'index'.
   * @param {String} text content used to compare with the string 'toSearch' at the position 'index'.
   * @param {String} index position to compare the text.
   * @returns {Boolean} returns true if the text exist, otherwise false
   */
  compareStringFromPosition : function (toSearch, text, index) {
    if (typeof text !== 'string' || typeof index !== 'number' || typeof toSearch !== 'string') {
      throw new Error('The arguments are invalid (null or undefined).');
    }
    if (index < 0 || index > text.length) {
      throw new Error('The index is outside of the text length range.');
    }
    for (let i = 0, j = toSearch.length; i < j; i++) {
      if (index + i < text.length && toSearch[i] !== text[index + i]) {
        return false;
      }
    }
    return true;
  },

  /**
   * Print info about software
   *
   * @param  {Object}    parsed license object
   * @return {String}
   */
  printVersion : function (license) {
    let _text = [];
    _text.push('Carbone Render On-Premise Enterprise Edition : v' + package.version);
    _text.push('- Publication date (UTC): ' + package.carbonePublicationDate);
    _text.push('- Proprietary software made by CarboneIO SAS - France - 899 106 785 00012');
    if (process.platform === 'win32') {
      _text.push('- BETA support for Windows. Some features are not available. This list may not be exhaustive:');
      _text.push('  - automatic cleaning of "render" and "template" directory');
      _text.push('  - JWT authentication');
    }
    _text.push('- Process ID: ' + process.pid);
    if (license && license.data) {
      _text.push('- Licensee: ');
      _text.push('  - name       : ' + license.data.name);
      _text.push('  - expired at : ' + new Date(license.exp * 1000).toISOString());
      _text.push('  - address    : ' + license.data.address);
      _text.push('  - email      : ' + license.data.email);
      _text.push('  - plan       : ' + license.data.plan);
    }
    return _text.join('\n');
  },

  /**
   * Finds the license and check validity
   *
   * @param      {String}    licenseDir                                        The license directory
   * @param      {String}    publicKey                                         The public key
   * @param      {Function}  callback(isValid, message, plan)                  callback function
   *                                                                           - isValid : if true, the software can start, otherwise it stops
   *                                                                           - message : message
   *                                                                           - plan    : plan of the license
   * @param      {String}    [publicationDate=package.carbonePublicationDate]  The publication date of Carbone
   */
  findCheckLicense : function (params, publicKey, callback, publicationDate = package.carbonePublicationDate) {
    const _license = params.license || '';
    if (_license) {
      return helper.verifyLicense(_license, '', publicKey, callback, publicationDate);
    }
    const _licenseDir = params.licenseDir || '';
    fs.readdir(_licenseDir, { withFileTypes : true }, (err, files) => {
      if (err) {
        return callback(false, 'Cannot find *.carbone-license files in '+_licenseDir);
      }
      let _mostRecentBirthtime = -1;
      let _mostRecentLicenseFile = '';
      // select the most recent license file
      for (var i = 0; i < files.length; i++) {
        let _file = files[i];
        if (_file.isFile() === true && /\.carbone-license$/.test(_file.name) === true) {
          let _filename = path.join(_licenseDir, _file.name);
          let _stat = fs.statSync(_filename);
          if (_stat.birthtimeMs > _mostRecentBirthtime ) {
            _mostRecentBirthtime = _stat.birthtimeMs;
            _mostRecentLicenseFile = _filename;
          }
        }
      }
      if (_mostRecentLicenseFile === '') {
        return callback(false, 'No *.carbone-license files found in '+_licenseDir);
      }
      const _licenseFile = path.basename(_mostRecentLicenseFile);
      fs.readFile(_mostRecentLicenseFile, 'utf8', (err, license) => {
        if (err) {
          return callback(false, 'Cannot read file '+ _licenseFile + '\n');
        }
        return helper.verifyLicense(license, _licenseFile, publicKey, callback, publicationDate);
      });
    });
  },
  verifyLicense: function (license, licenseFile, publicKey, callback, publicationDate) {
     // convert publication package into UNIX timestamp
     const _publicationTimestamp = (new Date(publicationDate)).getTime();
     kittenJwt.verify(license, publicKey, (err, payload) => {
       if (payload && payload.aud !== 'carbone-ee-on-premise') {
         return callback(false, 'Invalid license (not for carbone-ee-on-premise) ' + licenseFile);
       }
       if (err) {
         // If the license has expired, accept if the license expiration is higher than Carbone publication date
         // and if the plan is "eternity"
         if (payload && payload.data && payload.data.plan === 'eternity') {
           // check again with _publicationTimestamp instead of current timestamp
           return kittenJwt.verify(license, publicKey, (err, payload) => {
             if (err) {
               return callback(false, 'Invalid license ' + licenseFile, payload);
             }
             return callback(true, 'WARNING: Your license ' + licenseFile + ' has expired. Carbone-ee sill works but without support & updates', payload);
           }, _publicationTimestamp);
         }
         return callback(false, 'Invalid license '+ licenseFile);
       }
       if ((_publicationTimestamp / 1000) > payload.exp) {
         return callback(false, 'Invalid license. Check system clock. ' + licenseFile, payload);
       }
       if (payload.data.plan === 'trial') {
         return callback(true, 'Trial license '+ licenseFile, payload);
       }
       return callback(true, 'Valid license '+ licenseFile, payload);
     });
  },
  /**
   * Measure CPU performance on this machine and update helper.CPU_PERFORMANCE_FACTOR
   *
   * This function is called in tests.
   */
  updatePerformanceFactor : function () {
    const _referenceTime = 20; // time
    const _nbRows = 1000000;
    let _data = [];
    // do 4 loops, and divide the time by 4 to get a rougly constant mean
    const _start = process.hrtime();
    for (let i = 0; i < _nbRows; i++) { _data.push( Math.floor(Math.random() * 1000)); } // eslint-disable-line
    for (let i = 0; i < _nbRows; i++) { _data[i] += Math.floor(Math.random() * 1000);  } // eslint-disable-line
    for (let i = 0; i < _nbRows; i++) { _data[i] += Math.floor(Math.random() * 1000);  } // eslint-disable-line
    for (let i = 0; i < _nbRows; i++) { _data[i] += Math.floor(Math.random() * 1000);  } // eslint-disable-line
    const _diff = process.hrtime(_start);
    const _elapsed = parseInt(((_diff[0] * 1e9 + _diff[1]) / 1e6) / 4, 10);
    helper.CPU_PERFORMANCE_FACTOR = _elapsed / _referenceTime;

    // print _data to make sure V8 does not remove useless code
    console.log('\nRaw CPU perf test : ' + _elapsed + ' ms ('+ _data[_nbRows/2] + ')');
    console.log('CPU_PERFORMANCE_FACTOR = '+ helper.CPU_PERFORMANCE_FACTOR);
  },

  /**
   * Prints a marker for debug
   *
   * @param   {Array}   markers  The markers
   * @param   {Number}  id       The index in markers array
   * @return  {String}           String of the marker for error output
   */
  printMarker : function (markers = [], id) {
    let _internalName = markers?.[id]?.name ?? '';
    return `{${_internalName.replace('_root.', '')}}`;
  },

  /**
   * Prints a missing marker
   *
   * @param   {String}  markerStr  The currently visited marker string
   * @return  {String}             The missing marker for end user
   */
  printMissingMarker : function (markerStr) {
    const _lastArray = markerStr.lastIndexOf('[');
    const _lastArrayStr = markerStr.slice(_lastArray);
    const _lastArrayIth = _lastArrayStr.replace(/\+1/g, '');
    const _markerWithoutIth1 = markerStr.slice(0, _lastArray) + _lastArrayIth;
    return `{${_markerWithoutIth1.replace('_root.', '')}...}`;
  }
};

// Update Performance factor for unit tests
if (typeof global.it === 'function' && typeof global.describe === 'function') {
  helper.updatePerformanceFactor();
}

module.exports = helper;