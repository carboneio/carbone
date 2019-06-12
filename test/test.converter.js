var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var converter = require('../lib/converter');
var exec = require('child_process').exec;
var tempPath = path.join(__dirname, 'temp');

var defaultOptions = {
  pipeNamePrefix : '_carbone',
  factories      : 1,
  startFactory   : false,
  attempts       : 2,
  tempPath       : tempPath
};

describe('Converter', function () {
  before(function () {
    helper.rmDirRecursive(tempPath);
    fs.mkdirSync(tempPath, '0755');
  });
  after(function () {
    helper.rmDirRecursive(tempPath);
    carbone.reset();
  });

  describe('init', function () {
    afterEach(function (done) {
      converter.exit(function () {
        converter.init(defaultOptions, done);
      });
    });
    /* it.skip('should be able to convert in docx, doc... ');
    it.skip('should accept temp directory with whitespaces');*/
    it('should start one conversion factory and return a object which describes the factories (pid, ...)', function (done) {
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function (factories) {
        var _nbFactories = 0;
        var _cachePathRegex = new RegExp(tempPath);
        _nbFactories = Object.keys(factories).length;
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
             the factories should have different pids, and different cache path', function (done) {
      var _customOptions = {
        pipeNamePrefix : '_carboneTest',
        factories      : 3,
        startFactory   : true
      };
      converter.init(_customOptions, function (factories) {
        var _nbFactories = 0;
        var _cachePathRegex = new RegExp(tempPath);
        _nbFactories = Object.keys(factories).length;
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

        helper.assert((factories[2].pid           !== factories[0].pid), true);
        helper.assert((factories[2].userCachePath !== factories[0].userCachePath), true);

        done(); 
      });
    });
  });

  describe('convertFile', function () {
    afterEach(function (done) {
      converter.exit(function () {
        converter.init(defaultOptions, done);
      });
    });
    it('should render a pdf and start an conversion factory automatically if no factories exist', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_odt_render_static.pdf');
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        var _buf = new Buffer(result);
        assert.equal(_buf.slice(0, 4).toString(), '%PDF');
        var bufPDF = new Buffer(_buf.length);
        fs.open(_pdfResultPath, 'r', function (status, fd) {
          fs.read(fd, bufPDF, 0, _buf.length, 0, function (err, bytesRead, buffer) {
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            assert.equal(_buf.slice(8, 70).toString(), buffer.slice(8, 70).toString());
            done();
          });
        });
      });
    });
    it('should restart automatically the conversion factory if it crashes', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function (factories) {
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
          helper.assert(err+'', 'null');
          var _buf = new Buffer(result);
          assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          // kill LibreOffice thread
          process.kill(factories['0'].pid);
          // try another conversion
          // with Node v4, process.kill seems to be very slow. So I add a "setTimeout" but I'm not very happy with it
          setTimeout(function () {
            converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
              helper.assert(err+'', 'null');
              var _buf = new Buffer(result);
              assert.equal(_buf.slice(0, 4).toString(), '%PDF');
              done(); 
            });
          }, 200);
        });
      });
    });
    it('should be fast to render a pdf with four Factories', function (done) {
      converter.init({factories : 4, startFactory : true, tempPath : tempPath}, function () {
        var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _nbExecuted = 200;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            _waitedResponse--;
            if (!err) {
              _results.push(result);
            }
            if (_waitedResponse === 0) {
              theEnd();
            }
          });
        }
        function theEnd () {
          var _end = new Date();
          var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
          console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions (usally around 65ms) \n\n\n');
          for (var i = 0; i < _results.length; i++) {
            var _buf = new Buffer(_results[i]);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          }
          assert.equal((_elapsed < 350), true);
          done(); 
        }
      });
    });
    it('should be extremely robust. It should not loose any jobs even if the office or python thread crash randomly', function (done) {
      converter.init({factories : 4, startFactory : true, tempPath : tempPath, attempts : 10}, function (factories) {
        var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _nbExecuted = 200;
        var _crashModulo = 28;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            if (_waitedResponse % _crashModulo === 0) {
              var _factoryId = Math.floor((Math.random()*4)); // (0 -> 3)
              var _threadChoice = Math.random(); // (0.0 -> 1.0)
              var _factory = factories[_factoryId];
              if (_factory) {
                if (_threadChoice > 0.5 && _factory.officeThread) {
                  _factory.officeThread.kill(); 
                }
                else if (_factory.pythonThread) {
                  _factory.pythonThread.kill(); 
                }
              }
            }
            _waitedResponse--;
            if (!err) {
              _results.push(result);
            }
            if (_waitedResponse === 0) {
              theEnd();
            }
          });
        }
        function theEnd () {
          var _end = new Date();
          var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
          console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions with '+(_nbExecuted/_crashModulo).toFixed(0)+' crashes\n\n\n');
          for (var i = 0; i < _results.length; i++) {
            var _buf = new Buffer(_results[i]);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          }
          assert.equal((_elapsed < 400), true);
          done(); 
        }
      });
    });
    it('should not restart the conversion factory if the document is corrupted. It should return an error message', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_corrupted.odt');
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function (factories) {
        var _officePID = factories['0'].pid;
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err) {
          assert.equal(err, 'Could not open document');
          assert.equal(factories['0'].pid, _officePID);
          done(); 
        });
      });
    });
    it('should not restart the conversion factory if the document can be opened, but cannot be converted', function (done) {
      var _filePath = path.resolve('./test/datasets/test_spreadsheet.ods');
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function (factories) {
        var _officePID = factories['0'].pid;
        converter.convertFile(_filePath, 'MS Word 97', '', function (err) {
          assert.equal(err, 'Could not convert document');
          assert.equal(factories['0'].pid, _officePID);
          done(); 
        });
      });
    });
    it('should still restart the conversion factory if the document could not be opened more than 10 times', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_corrupted.odt');
      var _nbAttemptMax = 10;
      var _nbAttempt = _nbAttemptMax;
      converter.init({factories : 1, startFactory : true, tempPath : tempPath, attempts : 1}, function (factories) {
        var _officePID = factories['0'].pid;
        for (var i = 0; i < _nbAttemptMax; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err) {
            _nbAttempt--;
            assert.equal(/Could/.test(err), true);
            assert.equal(factories['0'].pid, _officePID);
            // the 10th conversion will restart LibreOffice
            if (_nbAttempt === 0) {
              converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err) {
                assert.equal(/Could/.test(err), true);
                assert.notEqual(factories['0'].pid, _officePID);
                var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
                converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
                  assert.equal(err, null);
                  var _buf = new Buffer(result);
                  assert.equal(_buf.slice(0, 4).toString(), '%PDF');
                  done(); 
                });
              });
            }
          });
        }
      });
    });
    it('should not restart the conversion factory if there is at least one success between 10 fails\
      it should not crash if formatOption is undefined', function (done) {
      var _filePath = '';
      var _filePathKO = path.resolve('./test/datasets/test_odt_render_corrupted.odt');
      var _filePathOK = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _nbAttemptMax = 15;
      var _nbAttempt = _nbAttemptMax;
      converter.init({factories : 1, startFactory : true, tempPath : tempPath, attempts : 1}, function (factories) {
        var _officePID = factories['0'].pid;
        for (var i = 0; i < _nbAttemptMax; i++) {
          if (i===7) {
            _filePath = _filePathOK;
          }
          else {
            _filePath = _filePathKO;
          }
          converter.convertFile(_filePath, 'writer_pdf_Export', undefined, function () {
            _nbAttempt--;
            assert.equal(factories['0'].pid, _officePID);
            if (_nbAttempt === 0) {
              done(); 
            }
          });
        }
      });
    });
  });

  describe('exit', function () {
    afterEach(function (done) {
      converter.exit(function () {
        converter.init(defaultOptions, done);
      });
    });
    it('should start one conversion factory and clean the temp directory', function (done) {
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function () {
        converter.exit(function () {
          setTimeout(function () {
            var _tempContent = helper.walkDirSync(tempPath);
            assert.equal(_tempContent.length, 0);
            done(); 
          }, 1500);
        });
      });
    });
    it('should not delete files which come from another carbone instance or another program', function (done) {
      var _otherFile = path.join(tempPath, 'ovni.sql');
      fs.writeFileSync(_otherFile, 'test');
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function () {
        converter.exit(function () {
          setTimeout(function () {
            var _tempContent = helper.walkDirSync(tempPath);
            assert.equal(_tempContent.length, 1);
            assert.equal(_tempContent[0], _otherFile);
            exec('rm -rf '+_otherFile, done);
          }, 1500);
        });
      });
    });
  });

});
