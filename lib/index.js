var fs = require('fs');
var path = require('path');
var util = require('util');
var spawn = require('child_process').spawn;
var helper = require('./helper');
var parser = require('./parser');
var analyzer = require('./analyzer');
var rootPath = process.cwd();


/**
 * Carbone framework
 */
var carbone = {

  generate : function(data, template, destination){
    var that = this;
    var _filesToParse = [];

    unzip('./word.docx', function(destDir){
      _filesToParse = helper.walkDirSync(destDir, 'xml');

      for (var i = 0; i < _filesToParse.length; i++) {
        var _file = _filesToParse[i];
        console.log(_file);
        var _content = fs.readFileSync(_file, 'utf8');

        var _newContent = that.extractTags(_content, dataSource);

        fs.writeFileSync(_file, _newContent, 'utf8');
      };
      var _result = path.join(rootPath, 'wordResult.docx');
      zip(destDir, _result, function(){
        console.log('end');
      });
    });
  },

  buildXML : function(xml, data){
    var _separateTagsAndXML = parser.getSubsitition(xml);
    var _dynamicDescriptor = analyzer.decomposeTags(_separateTagsAndXML.tags);
    var _descriptor = parser.extractXmlParts(_separateTagsAndXML.xml, _dynamicDescriptor);
    _descriptor = analyzer.reOrderHierarchy(_descriptor);
    var _builder = analyzer.getXMLBuilderFunction(_descriptor);
    var _xmlParts = _builder(data);
    /*console.log('\n\n\n');
    console.log(_xmlParts);
    console.log('\n\n\n');*/
    var _xmlResult = parser.concatString(_xmlParts, 5); //TODO -> adapt the depth of the sort according to the maximum depth in _xmlParts
    return _xmlResult;
  }

};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/


  function unzip(sourceFile, callback){
    var _destDir = path.join(rootPath,'temp'); 
    //-o overwrite without prompting
    var unzip = spawn('unzip', ['-o', sourceFile, '-d', _destDir]);

    unzip.stdout.on('data', function (data) {
      //console.log('stdout: ' + data);
    });

    unzip.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    unzip.on('exit', function (code) {
      callback(_destDir);
    });
  }

  function zip(sourceDir, destFile, callback){
    //if DS_Store is present, the file is corrupted for Word
    var zip = spawn('zip', ['-m', '-r', destFile, '.', '-x', '*.DS_Store'], {'cwd': sourceDir});

    zip.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    zip.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    zip.on('exit', function (code) {
      callback();
    });
  }

module.exports = carbone;
