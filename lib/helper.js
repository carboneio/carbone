var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');

var helper = {

  /**
   * Tests if a variable contains a numeric value (float or integer)
   * @param {raw type} n : parameter to test
   * @return {boolean} TRUE if the parameter is a number, else FALSE
   */
  isNumber : function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

  /**
   * Beautiful assert between two objects
   * Be careful, it will inspect with a depth of 100
   *
   * @param {object} result : result
   * @param {object} expected : expected
   * @return {type} throw an error if the two objects are different
   */
  assert : function(result, expected, message){
    assert.equal( util.inspect(result, false, 100, true), util.inspect(expected, false, 100, true), message);
  },

  /**
   * Tests if an object/array/string is empty
   * @param {object} o : object/array/string to test
   * @return {boolean} TRUE if the object/array/string is empty (not null, neigher undefined), else FALSE
   */
  isEmpty : function(o) {
    if(o===null){//null is an object
      return false;
    }
    else if(typeof(o)==='object'){//an object and an array is an object
      for(var i in o) 
          if(o.hasOwnProperty(i))
              return false;
      return true;
    }
    else if(o===''){
      return true;
    }

    return false;
  },
  
  /**
   * Tests if an string is undefined, null or empty
   * @param {string} s : string to test
   * @return {boolean} TRUE if the string is undefined, null or empty, else FALSE
   */
  isNullOrEmptyString : function(s){
    return typeof(s)==='undefined'||s===null||s==='';
  },

  /**
   * Test if a string has a valid JSON syntax.
   * REF: http://www.json.org/
   *
   * @param {string} str : the JSON as a string
   * @return {boolean}  TRUE if the string matches the JSON syntax, else FALSE
   */
  isJSON : function(str) {
    try {
      JSON.parse(str);
    }
    catch (e) {
      return false;
    }
    return true;
  },

  /**
   * Returns a string with the first letter in lower case
   *
   * @param {String} str : String to lcfirst
   * @return {String}
   */
  lcFirst : function(str){
    var _f = str.charAt(0).toLowerCase();
    return _f + str.substr(1);
  },

  /**
   * Returns a string with the first letter in upper case
   *
   * @param {String} str : String to ucfirst
   * @return {String}
   */
  ucFirst : function(str){
    var _f = str.charAt(0).toUpperCase();
    return _f + str.substr(1);
  },

  /**
   * Create a directory from process.cwd() path (by default)
   *
   * @param {string} directoryName : directory name to create
   * @param {string} rootPath : optional root path where to create the directory
   */
/*  createDirectory : function(directoryName, rootPath) {
      var _root = process.cwd();
      if(rootPath){
        _root = rootPath;
      }
      if (!fs.existsSync(_root + '/' + dir)) {
        fs.mkdirSync(_root + '/' + dir, 0755);
      }
  },
*/

  /**
   * Remove a directory and all its content
   * Be careful, this method is synchrone
   *
   * @param {type} dir : directory path
   */
  rmDirRecursive: function(dir) {

    if(!fs.existsSync(dir)){
      return;
    }
    var _list = fs.readdirSync(dir);

    for(var i = 0; i < _list.length; i++){
      var _filename = path.join(dir, _list[i]);
      var _stat = fs.statSync(_filename);

      if(_stat.isFile()){
        //if this is a file, remove it
        fs.unlinkSync(_filename);
      }
      else if(_stat.isDirectory()) {
        //if the is a dircetory, call the function recursively
        this.rmDirRecursive(_filename);
      }
    }
    fs.rmdirSync(dir);
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
  walkDirSync: function(dir, extension) {
    var _files = [];

    //if the path does not exist, return an empty table 
    if(!fs.existsSync(dir)){
      return _files;
    }

    //eliminate all files which start by a point.
    var _regExp = /^[^\.]/;
    
    if(extension instanceof RegExp){
      _regExp = extension;
    }
    else if(extension){
      //we must use new RegExp because extension is variable
      _regExp = new RegExp('^[^\.].+\.'+extension+'$'); 
    }

    walkDirRecursive(dir);
    //recursively called by himself until all sub-directories
    function walkDirRecursive(dir){
      //read the directory
      var _list = fs.readdirSync(dir);

      for(var i = 0; i < _list.length; i++){
        var _filename = path.join(dir, _list[i]);
        var _stat = fs.statSync(_filename);
        var _baseName = path.basename(_filename); //get the base name in order to eliminate folder which starts by a point.
        
        if(_stat.isFile() && _regExp.test(_baseName)){
          //if this is a file, push it in the table
          _files.push(_filename);
        }
        else if(_stat.isDirectory()){
          //if this is a directory, call the function recursively
          walkDirRecursive(_filename);
        }
      }
    }
    return _files;
  },


  /**
   * Scan a directory and all sub-directory
   * This function is asynchrone
   *
   * @param {string} dir : path to the directory we want to scan
   * @param {string} extension : filter on file extension. Example: '.js'
   * @param {function} callback(err, files) files is an array of files name with their path : ['/path/to/file1.js', '/path/to/file2.js']
   */
  walkDir: function(dir, extension, callback) {
  },

  /**
   * Copy an entire directory with all its content somewhere else
   *
   * @param {string} dirSource : directory source. Example /usr/lib/node
   * @param {string} dirDest : directory destination. Example /usr
   * In this example, it will copy the "node" directory or file in /usr/node
   */
  copyDirSync :function(dirSource, dirDest){

    var _sourceList = this.walkDirSync(dirSource);
    var _parentSourceDir = path.dirname(dirSource);

    //replace the name of the files which contains {{=data.tableName}} 
    for (var i = 0; i < _sourceList.length; i++) {
      //get the relative path
      var _relativePath = path.relative(_parentSourceDir, _sourceList[i]);
        //re-positionned the sub directories to the destination directory
      var _destPath = path.join(dirDest, _relativePath);
      //Get file info
      var _stat = fs.statSync(_sourceList[i]);

      if(_stat.isFile()){
        //if this is a file, copy its content
        var _fileContent = fs.readFileSync(_sourceList[i], 'utf8');
        this.writeFileDirSync(dirDest, _destPath, _fileContent);
      }
      else if(_stat.isDirectory()){
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
  writeFileDirSync: function(root, fileOrDirPath, content){
    var _lastDirname = fileOrDirPath;
    var _dirToCreate = [];

    while(_lastDirname!=='/' && _lastDirname!==root){
      _lastDirname = path.dirname(_lastDirname);
      if (!fs.existsSync(_lastDirname)) {
        _dirToCreate.push(_lastDirname);
      }
    }
    //create directories
    for (var i = _dirToCreate.length-1; i >= 0; i--) {
      fs.mkdirSync(_dirToCreate[i], '0755');
    }
    //If the is a file, create it
    if(typeof (content) !== 'undefined'){
      fs.writeFileSync(fileOrDirPath, content);  
    }
  },


  /**
   * Building of a tree from a flat tree structure (an array).
   *
   * @param   {array}   flatTree : A tree as an array
   * @param   {object}  parentObj : description
   * @return  {object}  A hierarchy of objects
   */
  treeBuilder : function(flatTree, parentObj) {
    var tree = {};

    var size = flatTree.length;
    for (var i = 0; i < size; i++) {
      var _item = flatTree[i];

      if(!tree[_item.idParent]){
        tree[_item.idParent] = [];
      }

      tree[_item.idParent].push(_item);
    }

    function buildTree(parent){
      var _obj = {
        id : parent.id,
        children : []
      };

      var _children = tree[parent.id];

      if (typeof _children !== 'undefined') {
        for (var i = 0; i < _children.length; i++) {
          _obj.children.push(buildTree(_children[i]));
        }
      }

      return _obj;
    }

    return buildTree(parentObj);
  },

  /**
   * Used to split an object by its key/value pairs.
   *
   * @param {object} obj : an object (not an array)
   * @return {array}  an object with keys as an array and values as an array
   */
  splitByKeyValue : function(obj) {
    var keys = [];
    var values = [];

    for (var prop in obj) {
      var val = obj[prop];

      /* functions are ignored */
      if ('function' === typeof val) continue;

      keys.push(prop);
      values.push(val);
    }

    var output = {'keys': keys, 'values': values};
    return output;
  },

  /**
   * Used to interpolate variables in a string.
   *
   * INTERPOLATING THE VARIABLE REQUIRES IT TO BE ENCLOSED WITHIN WHITESPACE INSIDE THE STRING
   * Call: inject( "Everybody says :h :w !", {h:'hello', w:'world'} )
   * Result: "Everybody says hello world !"
   *
   * @param {string}: Raw input with placeholders for variable interpolation
   * @param {object}: Args as key/value pairs embedded in an object
   * @param {boolean}: TRUE / FALSE, to protect or not by quoting args
   * @return {string} The resulting string
   */
  inject : function (str, args, protect) {
    if (!str) return '';
    if (!args || JSON.stringify(args) === '{}') return str;

    return str.replace(/:([^:\s+]*)/g, function (a, b) {
        var r = args[b];
        var res = ((typeof r === undefined) ? a : r) + '';
        if (true === protect) { res = "'"+ res +"'"; }

        return res;
    });
  },

  /**
   * Quick left zero-padding of a string.
   *
   * @param {integer} n : The integer number to pad.
   * @param {integer} len: The length of padded string.
   * @return {string} The left zero-padded number as a string.
   */
  padlz : function(n, len) {
    for (n+=""; n.length < len; n = "0" + n); 
    return n;
  },

  padr : function(n, len) {
    for (n+=""; n.length < len; n = n + ' '); 
    return n;
  }
};

module.exports = helper;