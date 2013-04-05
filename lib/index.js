var fs = require('fs');
var path = require('path');
var util = require('util');
var spawn = require('child_process').spawn;
var helper = require('./helper');
var parser = require('./parser');
var analyzer = require('./analyzer');
var rootPath = path.join(__dirname, '../');

var unzipIterator = 0;

/**
 * Carbone framework
 */
var carbone = {

  formatters : {},

  buildXML : function(xml, data){
    var that = this;
    var _separateTagsAndXML = parser.getSubsitition(xml);
    var _dynamicDescriptor = analyzer.decomposeTags(_separateTagsAndXML.tags);
    var _descriptor = parser.extractXmlParts(_separateTagsAndXML.xml, _dynamicDescriptor);
    _descriptor = analyzer.reOrderHierarchy(_descriptor);
    var _builder = analyzer.getXMLBuilderFunction(_descriptor);
    var _xmlParts = _builder(data, that.formatters);
    /*console.log('\n\n\n');
    console.log(_xmlParts);
    console.log('\n\n\n');*/
    var _xmlResult = parser.concatString(_xmlParts, 5); //TODO -> adapt the depth of the sort according to the maximum depth in _xmlParts
    return _xmlResult;
  },

  cacheFormatters : cacheFormatters,

  generate : function(data, templatePath){
    var that = this;
    var _filesToParse = [];

    unzip(templatePath, function(destDir){
      _filesToParse = helper.walkDirSync(destDir, 'xml');

      for (var i = 0; i < _filesToParse.length; i++) {
        var _file = _filesToParse[i];
        //console.log(_file);
        var _content = fs.readFileSync(_file, 'utf8');
        var _newContent = that.buildXML(_content, data);
        fs.writeFileSync(_file, _newContent, 'utf8');
      }
      var _result = path.join(rootPath, '_wordResult.docx');
      zip(destDir, _result, function(){
        /*fs.writeFileSync(_result, doc);*/
        /*fs.rmdirSync(destDir);*/
        /*console.log('end');*/
      });
    });
  },

  /**
   * Renders a template with given datas and giving result to the callback function
   * @param {string} templatePath : Absolute path of the template
   * @param {object} data : Datas to be inserted in the template
   * @param {function} callback : Function called after generation with the result
   * @return {void}
   */
  render : function(templatePath, data, callback){
    var that = this;
    var _filesToParse = [];

    templatePath = path.resolve(templatePath);

    prepareCarbone(templatePath, function(isZipped){
      if(isZipped){
        unzip(templatePath, function(destDir){
          _filesToParse = helper.walkDirSync(destDir, 'xml');

          for (var i = 0; i < _filesToParse.length; i++) {
            var _file = _filesToParse[i];
            var _content = fs.readFileSync(_file, 'utf8');
            var _newContent = that.buildXML(_content, data);
            fs.writeFileSync(_file, _newContent, 'utf8');
          }
          zip(destDir, function(result){
            helper.rmDirRecursive(destDir);
            callback(result);
          });
        });
      }
      else{
        var _content = fs.readFileSync(templatePath, 'utf8');
        var _newContent = that.buildXML(_content, data);
        callback(_newContent);
      }
    });
  },

  renderPDF : function(templatePath, data, callback){
    carbone.render(templatePath, data, function(content){
      var _tempFileName = path.join(rootPath, 'temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)));
      fs.writeFileSync(_tempFileName, content);
      var _fileContent = '';
      var unoconv = spawn('unoconv', [ '-f', 'pdf', '--stdout', _tempFileName ]);
      unoconv.stdout.on('data', function(data){
        _fileContent += data;
      });
      unoconv.on('exit', function(){
        callback(_fileContent);
      });
    });
  },

  unzip : unzip,
  zip : zip

};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/


  function unzip(sourceFile, callback){
    var _uid = (new Date()).valueOf().toString() + (++unzipIterator);
    var _destDir = path.join(rootPath,'temp', _uid);
    //-o overwrite without prompting
    var unzip = spawn('unzip', ['-o', sourceFile, '-d', _destDir]);

    unzip.stderr.on('data', function (data) {
      throw Error(data);
    });

    unzip.on('exit', function (code) {
      callback(_destDir);
    });
  }

  function zip(sourceDir, destFile, callback){
    var _toStdout = false;
    var _zipPath = destFile;
    if(typeof destFile === 'function'){
      callback = destFile;
      _toStdout = true;
      _zipPath = path.resolve(rootPath, 'temp', (new Date()).valueOf() + '.docx');
    }

    /* Following line does not work yet with NodeJS but is the real command to get content of the zipped file in STDOUT */
    /* var zip = spawn('zip', ['zip', '-r' ,'-m', '-x', '*.DS_Store', '-', '.', '|', 'dd'], {'cwd': sourceDir}); */

    //if DS_Store is present, the file is corrupted for Word
    var zip = spawn('zip', ['-q', '-m', '-r', _zipPath, '.', '-x', '*.DS_Store'], {'cwd': sourceDir});

    zip.stderr.on('data', function (data) {
      throw Error(data);
    });

    zip.on('exit', function (code) {
      if(_toStdout){
        var _zipContent = fs.readFileSync(_zipPath);
        fs.unlinkSync(_zipPath);
        return callback(_zipContent);
      }
      else{
        return callback();
      }
    });
  }

  function cacheFormatters(callback){
    if(Object.keys(carbone.formatters).length > 0){
      return callback();
    }
    var _formattersPath = path.join(rootPath, 'formatters');
    fs.readdir(_formattersPath, function(err, files){
      for (var i = files.length - 1; i >= 0; i--) {
        var _formatterNamespace = files[i].replace(/\.[^\.]+/g, '');
        var _filePath = path.join(_formattersPath, files[i]);
        var _formatters = require(_filePath);
        for(var f in _formatters){
          carbone.formatters[f] = _formatters[f];
        }
      }
      return callback();
    });
  }

  function isTemplateZipped(templatePath, callback){
    var buf = new Buffer(10, 'hex');
    fs.open(templatePath, 'r', function(status, fd){
      fs.read(fd, buf, 0, 10, 0, function(err, bytesRead, buffer){
        callback(buffer.slice(0, 2).toString() === 'PK');
      });
    });
  }

  function createTempFolderIfNotExists(callback){
    var _tempFolderPath = path.join(rootPath, 'temp');
    fs.exists(_tempFolderPath, function(exists){
      if(!exists){
        fs.mkdir(_tempFolderPath, callback);
      }
      else{
        callback();
      }
    });
  }

  function prepareCarbone(templatePath, callback){
    createTempFolderIfNotExists(function(){
      cacheFormatters(function(){
        isTemplateZipped(templatePath, function(isZipped){
          callback(isZipped);
        });
      });
    });
  }

module.exports = carbone;
