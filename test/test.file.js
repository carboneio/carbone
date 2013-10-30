var assert = require('assert');
var file = require('../lib/file');
var helper = require('../lib/helper');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var testPath = path.join(__dirname,'test_file');
var spawn = require('child_process').spawn;

describe('file', function(){
  
  describe('isZipped', function(){
    it('should return true if the file is zipped', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      file.isZipped(_filePath, function(err, isZipped){
        helper.assert(isZipped, true);
        done();
      });
    });
    it('should return false if the file is not zipped', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      file.isZipped(_filePath, function(err, isZipped){
        helper.assert(isZipped, false);
        done();
      });
    });
  });

  describe('unzip', function(){
    it('should unzip a file and return a array which contain its content', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _expectedFiles = {
        '[Content_Types].xml':1,
        '_rels/.rels':1,
        'word/_rels/document.xml.rels':1,
        'word/document.xml':1,
        'word/theme/theme1.xml':1,
        'docProps/thumbnail.jpeg':1,
        'word/settings.xml':1,
        'word/webSettings.xml':1,
        'word/stylesWithEffects.xml':1,
        'docProps/core.xml':1,
        'word/styles.xml':1,
        'word/fontTable.xml':1,
        'docProps/app.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>2</TotalTime><Pages>1</Pages><Words>4</Words><Characters>42</Characters><Application>Microsoft Macintosh Word</Application><DocSecurity>0</DocSecurity><Lines>4</Lines><Paragraphs>4</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>42</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>14.0000</AppVersion></Properties>'
      };

      file.unzip(_filePath, function(err, files){
        assert.equal(files.length, 13);
        for (var i = 0; i < files.length; i++) {
          var _file = files[i];
          assert.equal((_expectedFiles[_file.name]!==undefined), true);
          if(_file.name==='docProps/app.xml'){
            assert.equal(_expectedFiles[_file.name], _file.data.toString());
          }
        };
        done();
      });
    });
    it('should be fast to unzip', function(done){
      var _filePath1 = path.resolve('./test/datasets/test_word_render_A.docx');
      var _filePath2 = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _nbExecuted = 100;
      var _results = [];
      var _waitedResponse = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        var _filePath = (i % 3 === 0 ) ? _filePath1 : _filePath2;
        file.unzip(_filePath, function(err, files){
          _waitedResponse--;
          _results.push(files);
          if(_waitedResponse === 0){
            theEnd();
          }
        });
      };
      function theEnd(){
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Unzip - Time Elapsed : '+_elapsed + ' ms per file for '+_nbExecuted+' unzip tasks\n\n\n');
        assert.equal((_elapsed < 6), true);
        done(); 
      }
    });
  });

  describe('zip', function(){
    beforeEach(function(){
      helper.rmDirRecursive(testPath);
    });
    after(function(){
      helper.rmDirRecursive(testPath);
    });
    it('should zip an array of files into one buffer', function(done){
      var _files = [
        {'name': 'my_file.xml'            , 'data': new Buffer( 'some text','utf8')},
        {'name': 'subdir/my_file.xml'     , 'data': new Buffer( 'content of the file in the sub dir','utf8')},
        {'name': 'subdir/dir/my_file2.txt', 'data': new Buffer( 'content of the another file','utf8')}
      ];
      fs.mkdirSync(testPath, 0755);
      file.zip(_files, function(err, zipBuffer){
        assert.equal(err, null);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipSystem(_zipFilePath, _unzipFilePath, function(err, result){
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(result[file.name], file.data);
          };
          done();
        });
      });
    });
    it('should be fast to zip', function(done){
      var _files = [
        {'name': 'my_file.xml'            , 'data': new Buffer(generateRandomText(9000),'utf8')},
        {'name': 'subdir/my_file.xml'     , 'data': new Buffer(generateRandomText(8500),'utf8')},
        {'name': 'subdir/dir/my_file2.txt', 'data': new Buffer(generateRandomText(6250),'utf8')}
      ];
      var _nbExecuted = 200;
      var _results = [];
      var _nbLeft = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        file.zip(_files, function(err, zipBuffer){
          _nbLeft--;
          _results.push(zipBuffer);
          if(_nbLeft === 0){
            theEnd();
          }
        });
      };
      function theEnd(){
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Zip - Time Elapsed : '+_elapsed + ' ms per file for '+_nbExecuted+' zip tasks\n\n\n');
        assert.equal((_elapsed < 5), true);
        //****** check the first one and the 90th 
        fs.mkdirSync(testPath, 0755);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip0');
        fs.writeFileSync(_zipFilePath, _results[0]);
        unzipSystem(_zipFilePath, _unzipFilePath, function(err, result){
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(result[file.name], file.data);
          };
          _unzipFilePath = path.join(testPath, 'unzip90');
          fs.writeFileSync(_zipFilePath, _results[90]);
          unzipSystem(_zipFilePath, _unzipFilePath, function(err, result){
            for (var i = 0; i < _files.length; i++) {
              var _file = _files[i];
              assert.equal(result[file.name], file.data);
            };
            done();
          });
        });
      }
    });
  });

  describe('openTemplate', function(){
    before(function(){
      var _templatePath = path.resolve('./test/datasets');
      carbone.set({'templatePath': _templatePath});
    });
    it('should open the template, convert xml files into String, ...', function(done){
      file.openTemplate('test_word_render_A.docx', function(err, template){
        helper.assert(err, null);
        helper.assert(template.isZipped, true);
        helper.assert(template.files.length, 13);
        for (var i = 0; i < template.files.length; i++) {
          var _file = template.files[i];
          if(_file.name === 'word/document.xml'){
            helper.assert(_file.isMarked, true);
            assert.equal(/author/.test(_file.data), true);
          }
          if(_file.name === 'docProps/thumbnail.jpeg'){
            helper.assert(_file.isMarked, false);
            assert.equal(Buffer.isBuffer(_file.data), true);
          }
        };
        done();
      });
    });
    it('should open not zipped templates', function(done){
      file.openTemplate('test_word_render_2003_XML.xml', function(err, template){
        helper.assert(err, null);
        helper.assert(template.isZipped, false);
        helper.assert(template.files.length, 1);
        var _file = template.files[0];
        helper.assert(_file.isMarked, true);
        helper.assert(_file.name, 'test_word_render_2003_XML.xml');
        assert.equal(/field1/.test(_file.data), true);
        done();
      });
    });
    it('should detect files which contains markers (not all xml)');
  });


  describe('buildFile', function(){
    beforeEach(function(){
      helper.rmDirRecursive(testPath);
    });
    after(function(){
      helper.rmDirRecursive(testPath);
    });
    it('should zip and return a buffer if the report is a docx. It should convert string to buffer', function(done){
      var _report = {
        'isZipped' : true,
        'files' : [
          {'name': 'my_file.xml'            , 'data': 'some text'},
          {'name': 'subdir/my_file.xml'     , 'data': 'content of the file in the sub dir'},
          {'name': 'subdir/dir/my_file2.txt', 'data': new Buffer( 'content of the another file','utf8')}
        ]
      };
      fs.mkdirSync(testPath, 0755);
      file.buildFile(_report, function(err, zipBuffer){
        helper.assert(err, null);
        assert.equal(Buffer.isBuffer(zipBuffer), true);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipSystem(_zipFilePath, _unzipFilePath, function(err, result){
          for (var i = 0; i < _report.files.length; i++) {
            var _file = _report.files[i];
            if(Buffer.isBuffer(_file.data)===false){
              _file.data = new Buffer(_file.data, 'utf8');
            }
            assert.equal(result[file.name], file.data);
          };
          done();
        });
      });
    });
    it('should open works woth xml files', function(done){
      var _report = {
        'isZipped' : false,
        'files' : [
          {'name': 'test_word_render_2003_XML.xml', 'data': 'some text'}
        ]
      };
      file.buildFile(_report, function(err, template){
        helper.assert(err, null);
        helper.assert(template, _report.files[0].data);
        done();
      });
    });
  });
});


function unzipSystem(filePath, destPath, callback){
  var _unzippedFiles = {};
  var _unzip = spawn('unzip', ['-o', filePath, '-d', destPath]);
  _unzip.stderr.on('data', function (data) {
    throw Error(data);
  });
  _unzip.on('exit', function (code) {
    var _filesToParse = helper.walkDirSync(destPath);
    for (var i = 0; i < _filesToParse.length; i++) {
      var _file = _filesToParse[i];
      var _content = fs.readFileSync(_file);
      _unzippedFiles[_file] = _content;
    }
    callback(null, _unzippedFiles);
  });
}

function generateRandomText(length)
{
  var _text = "";
  var _possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz0123456789";
  for(var i=0; i < length; i++){
    _text += _possible.charAt(Math.floor(Math.random() * (_possible.length-1)));
  }
  return _text;
}

