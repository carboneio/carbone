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
var tempPath = path.join(__dirname, '../', 'temp');

var defaultOptions = {
  'mode' : 'pipe', 
  'pipeNamePrefix' : '_carbone',
  'nbListeners' : 1,
  'startDelay' : 4000,
  'startOnInit' : false,
  'nbAttemptMax' : 2
};

describe('Converter', function(){

  describe('init', function(){
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
      });
    });
    it('should start one office listener and return a object which describes the listener (pid, ...)', function(done){
      converter.init({'nbListeners':1, 'startOnInit':true}, function(listeners){
        var _nbListeners = 0;
        var _cachePathRegex = new RegExp(tempPath);
        for(var i in listeners){
          _nbListeners++;
        }
        helper.assert(_nbListeners, 1);
        helper.assert(listeners[0].mode, 'pipe');
        helper.assert(/_carbone/g.test(listeners[0].pipeName), true);
        helper.assert(_cachePathRegex.test(listeners[0].userCachePath), true);
        helper.assert(/[0-9]+/g.test(listeners[0].pid), true);
        helper.assert(listeners[0].isReady, true);
        helper.assert(listeners[0].isConverting, false);
        done(); 
      });
    });
    it('should start 3 office listener and take into account the options object.\
             the listeners should have different pids, and different cache path', function(done){
      var _customOptions = {
        'pipeNamePrefix': '_carboneTest',
        'nbListeners': 3,
        'startOnInit': true
      };
      converter.init(_customOptions, function(listeners){
        var _nbListeners = 0;
        var _cachePathRegex = new RegExp(tempPath);
        for(var i in listeners){
          _nbListeners++;
        }
        helper.assert(_nbListeners, 3);

        helper.assert(listeners[0].mode, 'pipe');
        helper.assert(/_carboneTest/g.test(listeners[0].pipeName), true);
        helper.assert(_cachePathRegex.test(listeners[0].userCachePath), true);
        helper.assert(/[0-9]+/g.test(listeners[0].pid), true);
        helper.assert(listeners[0].isReady, true);

        helper.assert(listeners[2].mode, 'pipe');
        helper.assert(/_carboneTest/g.test(listeners[0].pipeName), true);
        helper.assert(_cachePathRegex.test(listeners[2].userCachePath), true);
        helper.assert(/[0-9]+/g.test(listeners[2].pid), true);
        helper.assert(listeners[2].isReady, true);

        helper.assert((listeners[2].pid           != listeners[0].pid), true);
        helper.assert((listeners[2].userCachePath != listeners[0].userCachePath), true);

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
    it('should render a pdf and start an office listener automatically if no listeners exist', function(done){
      var _pdfResultPath = path.resolve('./test/datasets/test_odt_render_static.pdf');
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'pdf', function(result){
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
    it('should restart automatically the office listener if it crashes', function(done){
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _results = [];
      converter.init({'nbListeners':1, 'startOnInit':true}, function(listeners){
        converter.convertFile(_filePath, 'pdf', function(result){
          var _buf = new Buffer(result);
          assert.equal(_buf.slice(0, 4).toString(), '%PDF');

          //kill LibreOffice listener
          process.kill(listeners['0'].pid);

          //try another conversion
          converter.convertFile(_filePath, 'pdf', function(result){
            var _buf = new Buffer(result);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            done(); 
          });
        });
      });
    });
    it('should be fast to render a pdf with four LibreOffice listener', function(done){
      converter.init({'nbListeners':4, 'startOnInit':true}, function(){
        var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _nbExecuted = 200;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          converter.convertFile(_filePath, 'pdf', function(result){
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
          assert.equal((_elapsed < 300), true);
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
    it('should start one office listener and clean the temp directory', function(done){
      converter.init({'nbListeners':1, 'startOnInit':true}, function(){
        converter.exit(function(){
          var _tempContent = helper.walkDirSync(tempPath);
          assert.equal(_tempContent.length, 0);
          done(); 
        });
      });
    });
    it('should not delete files which come from another carbone instance or another program', function(done){
      var _otherFile = path.join(tempPath, 'ovni.sql');
      fs.writeFileSync(_otherFile, 'test');
      converter.init({'nbListeners':1, 'startOnInit':true}, function(){
        converter.exit(function(){
          var _tempContent = helper.walkDirSync(tempPath);
          assert.equal(_tempContent.length, 1);
          assert.equal(_tempContent[0], _otherFile);
          exec('rm -rf '+_otherFile, done);
        });
      });
    });
  });

});
