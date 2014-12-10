var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var converter = require('../lib/converter');
var dateFormatter = require('../formatters/date');
var testPath = path.join(__dirname,'test_file');
var params = require('../lib/params');
var spawn = require('child_process').spawn;


describe.only('Carbone', function(){


  describe('set', function(){
    var _templatePath = path.join(__dirname,'template1');
    var _tempPath = path.join(__dirname,'temp1');
    after(function(done){
      helper.rmDirRecursive(_tempPath);
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
      done();
    });
    it('should create automatically the template directory if it does not exists', function(done){
      helper.rmDirRecursive(_templatePath);
      carbone.set({'templatePath':_templatePath});
      helper.assert(fs.existsSync(_templatePath), true);
      done();
    });
    it('should create automatically the temp directory if it does not exists', function(done){
      helper.rmDirRecursive(_tempPath);
      carbone.set({'tempPath':_tempPath});
      helper.assert(fs.existsSync(_tempPath), true);
      done();
    });
    it('should change the lang of of date formatter', function(done){
      carbone.set({'lang':'fr'});
      helper.assert(dateFormatter.convert('20140131','YYYYMMDD','dddd'), 'vendredi');
      carbone.set({'lang':'en'});
      helper.assert(dateFormatter.convert('20140131','YYYYMMDD','dddd'), 'Friday');
      carbone.set({'lang':'fr'});
      helper.assert(dateFormatter.convert('20140131','YYYYMMDD','dddd'), 'vendredi');
      done();
    });
  });


  describe('addTemplate', function(){
    var _templatePath = path.join(__dirname,'template');
    before(function(){
      helper.rmDirRecursive(_templatePath);
      fs.mkdirSync(_templatePath, '0755');
      carbone.set({'templatePath':_templatePath});
    });
    after(function(){
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
    });
    it('should save the template in the folder "templatePath"', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _fileContent = fs.readFileSync(_filePath, 'utf8');
      var _fileId = '1.xml';
      carbone.addTemplate(_fileId, _fileContent, function(err){
        helper.assert(err, null);
        var _result = fs.readFileSync(path.join(_templatePath,_fileId), 'utf8');
        helper.assert(_result, _fileContent);
        done();
      });
    });
    it('should overwrite existing template and should work if data is a buffer', function(done){
      var _fileId = '2.txt';
      fs.writeFileSync(path.join(_templatePath, _fileId), 'bla');
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _fileContent = fs.readFileSync(_filePath);
      carbone.addTemplate(_fileId, _fileContent, function(err){
        helper.assert(err, null);
        var _result = fs.readFileSync(path.join(_templatePath,_fileId));
        helper.assert(_result, _fileContent);
        done();
      });
    });
  });

  
  describe('addFormatters', function(){
    it('should add a formatter to the list of custom formatters', function(){
      carbone.addFormatters({
        'yesOrNo' : function(d){
          return d === true ? 'yes' : 'no';
        }
      });
      assert.notEqual(typeof carbone.formatters['yesOrNo'], 'undefined');
      assert.equal(carbone.formatters['yesOrNo'](true), 'yes');
    });
  });



  describe('removeTemplate', function(){
    var _templatePath = path.join(__dirname,'template');
    before(function(){
      helper.rmDirRecursive(_templatePath)
      fs.mkdirSync(_templatePath, '0755');
      carbone.set({'templatePath':_templatePath});
    });
    after(function(){
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
    });
    it('should remove the template from the Carbone datastore (templatePath)', function(done){
      var _fileId = '2.txt';
      var _filePath = path.join(_templatePath, _fileId);
      fs.writeFileSync(_filePath, 'bla');
      carbone.removeTemplate(_fileId, function(err){
        helper.assert(err, null);
        helper.assert(fs.existsSync(_filePath), false);
        done();
      });
    });
    it('should not crash if the template does not exist', function(done){
      var _fileId = '5.txt';
      carbone.removeTemplate(_fileId, function(err){
        helper.assert(/unlink/.test(err+''), true);
        done();
      });
    });
  });


  describe('listConversionFormats', function(){
    it('should return the list of format for conversion', function(done){
      var _list = carbone.listConversionFormats('document');
      helper.assert(_list[0].id, 'bib');
      done();
    });
  });


  describe('render', function(){
    before(function(){
      var _templatePath = path.resolve('./test/datasets');
      carbone.set({'templatePath':_templatePath});
      helper.rmDirRecursive(testPath);
    });
    afterEach(function(){
      helper.rmDirRecursive(testPath);
    });
    after(function(){
      carbone.reset();
    });
    it('should render a template (docx) and give result with replacements', function(done){
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _resultFilePath = path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.docx');
      carbone.render('test_word_render_A.docx', data, function(err, result){
        assert.equal(err, null);
        fs.mkdirSync(testPath, 0755);
        var _document = path.join(testPath, 'file.docx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function(err, files){
          var _xmlExpectedContent = files['word/document.xml'];
          assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
          done();
        });
      });
    });
    it.skip('should be FAST', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _nbExecuted = 20;
      var _results = [];
      var _waitedResponse = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        carbone.render(_filePath, data, function(err, result){
          _waitedResponse--;
          _results.push(result);
          if(_waitedResponse === 0){
            theEnd();
          }
        });
      };
      function theEnd(){
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions\n\n\n');
        for (var i = 0; i < _results.length; i++) {
          var _buf = new Buffer(_results[i]);
          assert.equal((_buf.slice(0, 2).toString() === 'PK'), true);
        };
        assert.equal((_elapsed < 200), true);
        done(); 
      }
    });
    it('should render a template (doc XML 2003) and give result with replacements', function(done){
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.render('test_word_render_2003_XML.xml', data, function(err, result){
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        done();
      });
    });
    it('should accept a second data object with the marker {c.}', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _complement = {
        author1 : 'author_1',
        author2 : 'author_2'
      };
      var _resultFilePath = path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.xml');
      carbone.render('test_word_render_2003_XML.xml', _data, {'complement':_complement}, function(err, result){
        assert.equal(err, null);
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        assert.equal(result.indexOf('author1'), -1);
        assert.equal(result.indexOf('author2'), -1);
        assert.notEqual(result.indexOf('author_1'), -1);
        assert.notEqual(result.indexOf('author_2'), -1);
        done();
      });
    });
    it('(zipped file) should accept a second data object with the marker {c.}', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _complement = {
        author1 : 'author_1',
        author2 : 'author_2'
      };
      carbone.render('test_word_render_A.docx', _data, {'complement':_complement}, function(err, result){
        assert.equal(err, null);
        fs.mkdirSync(testPath, 0755);
        var _document = path.join(testPath, 'file.docx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function(err, files){
          var _xmlExpectedContent = files['word/document.xml'];
          assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
          assert.equal(_xmlExpectedContent.indexOf('author1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('author2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('author_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('author_2'), -1);
          done();
        });
      });
    });
    it('should translate the file and insert three product rows', function(done){
      var _filePath = path.resolve('./test/datasets/test_odt_render_translate.odt');
      //var _fileLangPath = path.resolve('./test/datasets/lang/fr.json');
      var _data = [{
        name : 'Bouteille de sirop d’érable 25cl',
        qty : '4',
        price : '8',
        total : '32',
      },{
        name : 'Bouteille de cidre de glace 1L',
        qty : '2',
        price : '17.5',
        total : '35',
      },{
        name : 'Sachet de Cranberry 200g',
        qty : '3',
        price : '2',
        total : '6',
      }];
      var _objLang = {
          'Canada Products' :   'Produits du Canada',
          'productName' :       'Nom du produit',
          'qty' :               'Quantité',
          'unitPrice' :         'Prix unitaire',
          'I\'ve an Idea : Revenues >= Sales' : 'J\'ai une idée : Chiffre d\'Affaire >= Ventes'
      };
      //I commented these lines because it does not test the lang file... objLang is overwritted by the next line of code 
      //  TODO: The solution would be to 
      //    - not overwrite objLang
      //    - reload the lang file (fileReadSync) if the method carbone.set is called for modifying the parameter 'lang'. 
      //fs.writeFile(_fileLangPath, JSON.stringify(_objLang, null, 2), function(err){ 
        carbone.set({'lang':'fr'});
        carbone.set({'objLang': _objLang});
        //helper.assert(err, null);
        carbone.render('test_odt_render_translate.odt', _data, function(err, result){
          assert.equal(err, null);
          fs.mkdirSync(testPath, 0755);
          var _document = path.join(testPath, 'file.odt');
          var _unzipPath = path.join(testPath, 'unzip');
          fs.writeFileSync(_document, result);
          unzipSystem(_document, _unzipPath, function(err, files){
            var _xmlExpectedContent = files['content.xml'];
            //Have words been translated ?
            assert.equal(_xmlExpectedContent.indexOf('Canada Products'), -1);
            assert.equal(_xmlExpectedContent.indexOf('productName'), -1);
            assert.equal(_xmlExpectedContent.indexOf('qty'), -1);
            assert.equal(_xmlExpectedContent.indexOf('Unit price'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Produits du Canada'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Nom du produit'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Quantité'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Prix unitaire'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('total'), -1); //total is not defined in this ObjLang. So it should be write with this word 'total'
            //We have inserted three product rows 
            assert.notEqual(_xmlExpectedContent.indexOf('Bouteille de sirop d’érable 25cl'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Bouteille de cidre de glace 1L'), -1);
            assert.notEqual(_xmlExpectedContent.indexOf('Sachet de Cranberry 200g'), -1);
            //var _dirLangPath = path.join("./test/datasets/lang",'lang');
            //helper.rmDirRecursive(_fileLangPath);
            done();
          });
        });
      //});
    });
    it('should accept pre-declared variables and variables declared directly in the document.\
      it should remove declared variables from the template', function(done){
      var data = {
        field1 : 'field_1',
        field2 : 'field_2',
        field3 : 'field_3'
      };
      var options = {
        'variableStr':'{#preVar1= d.field1 } {#preVar2= d.field2 }'
      };
      carbone.render('test_variables.xml', data, options, function(err, result){
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.equal(result.indexOf('field3'), -1);
        assert.equal(result.indexOf('myVar3'), -1); //should remove declared variables from the template
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        assert.notEqual(result.indexOf('field_3'), -1);
        done();
      });
    });
    it('should parse and return the report filename', function(done){
      var data = {
        field1 : 'field_1',
        field2 : '2013',
        field3 : 'field_3'
      };
      var options = {
        'reportName':'report_{d.field2}'
      };
      carbone.render('test_variables.xml', data, options, function(err, result, reportName){
        assert.equal(reportName, 'report_2013');
        done();
      });
    });
  });


  describe('render and convert document', function(){
    var defaultOptions = {
      'pipeNamePrefix' : '_carbone',
      'factories' : 1,
      'startFactory' : false,
      'attempts' : 2
    };
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
        carbone.reset();
      });
    });
    it('should render a template (docx), generate to PDF and give output', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.render(_filePath, data, {'convertTo':'pdf'}, function(err, result){
        assert.equal(err, null);
        var buf = new Buffer(result);
        assert.equal(buf.slice(0, 4).toString(), '%PDF');
        var bufPDF = new Buffer(buf.length);
        fs.open(_pdfResultPath, 'r', function(status, fd){
          fs.read(fd, bufPDF, 0, buf.length, 0, function(err, bytesRead, buffer){
            assert.equal(buf.slice(0, 100).toString(), buffer.slice(0, 100).toString());
            done();
          });
        });
      });
    });
    it('should render spreadsheet and convert it to a pdf', function(done){
      var _filePath = path.resolve('./test/datasets/test_spreadsheet.ods');
      var data = [{
        id : 1,
        name : 'field_1'
      },{
        id : 2,
        name : 'field_2'
      }];
      carbone.render(_filePath, data, {'convertTo':'xls'}, function(err, result){
        helper.assert(err, null);
        //fs.writeFileSync('test.xls', result);
        //TODO TODO TODO TODO TODO TODO TODO TODO : test the content of the xls
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
      var _content = fs.readFileSync(_file, 'utf8');
      _unzippedFiles[path.relative(destPath, _file)] = _content;
    }
    callback(null, _unzippedFiles);
  });
}

