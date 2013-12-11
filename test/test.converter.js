var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var assert = require('assert');
var converter = require('../lib/converter');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var exec = require('child_process').exec;
var tempPath = path.join(__dirname, 'temp');

var defaultOptions = {
  'pipeNamePrefix' : '_carbone',
  'factories' : 1,
  'startFactory' : false,
  'attempts' : 2,
  'tempPath': tempPath
};

describe('Converter', function(){
  before(function(){
    helper.rmDirRecursive(tempPath);
    fs.mkdirSync(tempPath, '0755');
  });
  after(function(){
    helper.rmDirRecursive(tempPath);
    carbone.reset();
  });

  describe('init', function(){
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
      });
    });
    /*it.skip('should be able to convert in docx, doc... ');
    it.skip('should accept temp directory with whitespaces');*/
    it('should start one conversion factory and return a object which describes the factories (pid, ...)', function(done){
      converter.init({'factories':1, 'startFactory':true, 'tempPath':tempPath}, function(factories){
        var _nbFactories = 0;
        var _cachePathRegex = new RegExp(tempPath);
        for(var i in factories){
          _nbFactories++;
        }
        helper.assert(_nbFactories, 1);
        helper.assert(factories[0].mode, 'pipe');
        helper.assert(/_carbone/g.test(factories[0].pipeName), true);
        helper.assert(_cachePathRegex.test(factories[0].userCachePath), true);
        helper.assert(/[0-9]+/g.test(factories[0].pid), true);
        helper.assert(factories[0].isReady, true);
        helper.assert(factories[0].isConverting, false);
        done(); 
      });
    });
    it('should start 3 conversion factory and take into account the options object.\
             the factories should have different pids, and different cache path', function(done){
      var _customOptions = {
        'pipeNamePrefix': '_carboneTest',
        'factories': 3,
        'startFactory': true
      };
      converter.init(_customOptions, function(factories){
        var _nbFactories = 0;
        var _cachePathRegex = new RegExp(tempPath);
        for(var i in factories){
          _nbFactories++;
        }
        helper.assert(_nbFactories, 3);

        helper.assert(factories[0].mode, 'pipe');
        helper.assert(/_carboneTest/g.test(factories[0].pipeName), true);
        helper.assert(_cachePathRegex.test(factories[0].userCachePath), true);
        helper.assert(/[0-9]+/g.test(factories[0].pid), true);
        helper.assert(factories[0].isReady, true);

        helper.assert(factories[2].mode, 'pipe');
        helper.assert(/_carboneTest/g.test(factories[0].pipeName), true);
        helper.assert(_cachePathRegex.test(factories[2].userCachePath), true);
        helper.assert(/[0-9]+/g.test(factories[2].pid), true);
        helper.assert(factories[2].isReady, true);

        helper.assert((factories[2].pid           != factories[0].pid), true);
        helper.assert((factories[2].userCachePath != factories[0].userCachePath), true);

        done(); 
      });
    });
  });

  describe('convertFile', function(){
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
      });
    });
    it('should render a pdf and start an conversion factory automatically if no factories exist', function(done){
      var _pdfResultPath = path.resolve('./test/datasets/test_odt_render_static.pdf');
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_pdf_Export', function(result){
        var _buf = new Buffer(result);
        assert.equal(_buf.slice(0, 4).toString(), '%PDF');
        var bufPDF = new Buffer(_buf.length);
        fs.open(_pdfResultPath, 'r', function(status, fd){
          fs.read(fd, bufPDF, 0, _buf.length, 0, function(err, bytesRead, buffer){
            assert.equal(_buf.slice(0, 70).toString(), buffer.slice(0, 70).toString());
            done();
          });
        });
      });
    });
    it('should restart automatically the conversion factory if it crashes', function(done){
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _results = [];
      converter.init({'factories':1, 'startFactory':true, 'tempPath':tempPath}, function(factories){
        converter.convertFile(_filePath, 'writer_pdf_Export', function(result){
          var _buf = new Buffer(result);
          assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          //kill LibreOffice thread
          process.kill(factories['0'].pid);
          //try another conversion
          converter.convertFile(_filePath, 'writer_pdf_Export', function(result){
            var _buf = new Buffer(result);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            done(); 
          });
        });
      });
    });
    it('should be fast to render a pdf with four Factories', function(done){
      converter.init({'factories':4, 'startFactory':true, 'tempPath':tempPath}, function(){
        var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _nbExecuted = 200;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', function(result){
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
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          };
          assert.equal((_elapsed < 200), true);
          done(); 
        }
      });
    });
    it('should be extremely robust. It should not loose any jobs even if the office or python thread crash randomly', function(done){
      converter.init({'factories':4, 'startFactory':true, 'tempPath':tempPath, 'attempts':10}, function(factories){
        var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _nbExecuted = 200;
        var _crashModulo = 24;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', function(result){
            if(_waitedResponse % _crashModulo === 0){
              var _factoryId = Math.floor((Math.random()*4)); //(0 -> 3)
              var _threadChoice = Math.random(); //(0.0 -> 1.0)
              var _factory = factories[_factoryId];
              if(_factory){
                if(_threadChoice > 0.5 && _factory.officeThread){
                  _factory.officeThread.kill(); 
                }
                else if (_factory.pythonThread){
                  _factory.pythonThread.kill(); 
                }
              }
            }
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
          console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions with '+(_nbExecuted/_crashModulo).toFixed(0)+' crashes\n\n\n');
          for (var i = 0; i < _results.length; i++) {
            var _buf = new Buffer(_results[i]);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          };
          assert.equal((_elapsed < 200), true);
          done(); 
        }
      });
    });
  });

  describe('exit', function(){
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
      });
    });
    it('should start one conversion factory and clean the temp directory', function(done){
      converter.init({'factories':1, 'startFactory':true, 'tempPath':tempPath}, function(){
        converter.exit(function(){
          setTimeout(function(){
            var _tempContent = helper.walkDirSync(tempPath);
            assert.equal(_tempContent.length, 0);
            done(); 
          },200);
        });
      });
    });
    it('should not delete files which come from another carbone instance or another program', function(done){
      var _otherFile = path.join(tempPath, 'ovni.sql');
      fs.writeFileSync(_otherFile, 'test');
      converter.init({'factories':1, 'startFactory':true, 'tempPath':tempPath}, function(){
        converter.exit(function(){
          setTimeout(function(){
            var _tempContent = helper.walkDirSync(tempPath);
            assert.equal(_tempContent.length, 1);
            assert.equal(_tempContent[0], _otherFile);
            exec('rm -rf '+_otherFile, done);
          },200);
        });
      });
    });
  });

});
