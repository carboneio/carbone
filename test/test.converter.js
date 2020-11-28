var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var os = require('os');
var helper = require('../lib/helper');
var converter = require('../lib/converter');
var params = require('../lib/params');
var exec = require('child_process').exec;
var tempPath = path.join(__dirname, 'temp');
var pdfjsLib = require('pdfjs-dist/build/pdf.js');

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

  describe('shouldTheFactoryBeRestarted', function () {
    it('should return not restart LO if factoryMemoryFileSize = 0 or factoryMemoryThreshold = 0', function () {
      var _params = {
        factoryMemoryFileSize  : 0,
        factoryMemoryThreshold : 0
      };
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1000, 100), false);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1   , 1000000), false);
      _params.factoryMemoryFileSize = 10000;
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1   , 100000000), false);
      _params.factoryMemoryFileSize = 10000;
      _params.factoryMemoryThreshold = 0;
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1   , 100000000), false);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 100000000, 100000000), false);
    });
    it('should restart LO if the threshold is reached', function () {
      var _params = {
        factoryMemoryFileSize  : 2,
        factoryMemoryThreshold : 20
      };
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1000, 99), false);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1000, 100), true);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 1000, 101), true);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 10  , 101), true);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 10  , 1  ), true);
      helper.assert(converter.shouldTheFactoryBeRestarted(_params, 10  , 0  ), false);
    });
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
        setTimeout(function () {
          converter.init(defaultOptions, done);
        }, 1000);
      });
    });
    it('should render a pdf and start an conversion factory automatically if no factories exist', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_odt_render_static.pdf');
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        helper.assert(Buffer.isBuffer(result), true);
        assert.equal(result.slice(0, 4).toString(), '%PDF');
        fs.readFile(_pdfResultPath, function (err, content) {
          helper.assert(err+'', 'null');
          assert.equal(result.slice(8, 70).toString(), content.slice(8, 70).toString());
          done();
        });
      });
    });
    it('should return a link to the output document', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _outputPath = path.join(tempPath, 'output.toto');
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(typeof(result) === 'string', true);
        helper.assert(_outputPath, result);
        fs.readFile(_outputPath, function (err, content) {
          helper.assert(err+'', 'null');
          assert.equal(content.slice(0, 4).toString(), '%PDF');
          fs.unlink(_outputPath, function (err) {
            helper.assert(err+'', 'null');
            done();
          });
        });
      }, true, _outputPath);
    });
    it('should render and not open a pdf with a bad password  (it takes 5000ms on average to finish)', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        if (err) {
          assert.equal(err, null);
        }
        var _buf = new Buffer.from(result);
        assert.equal(_buf.slice(0, 4).toString(), '%PDF');
        const loadingTask = pdfjsLib.getDocument({data : result, password : 'ThisIsABadPassWord' });
        loadingTask.promise.then(() => {
          done(new Error('The password is wrong and it is not possible to open the report'));
        }, () => {
          done();
        });
      }, null, null, {
        EncryptFile          : true,
        DocumentOpenPassword : 'Password1234'
      });
    });
    it('should render and open a pdf with a password  (it takes 5000ms on average to finish)', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      const _password = 'P4ssW0rd';
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        if (err) {
          assert.equal(err, null);
        }
        var _buf = new Buffer.from(result);
        assert.equal(_buf.slice(0, 4).toString(), '%PDF');
        const loadingTask = pdfjsLib.getDocument({data : result, password : _password });
        loadingTask.promise.then((doc) => {
          assert.equal(doc.numPages, 1);
          done();
        }, () => {
          done(new Error('Bad Password'));
        });
      }, null, null, {
        EncryptFile          : true,
        DocumentOpenPassword : _password
      });
    });
    it('should render JPG images at different pixel size', function (done) {
      const _magicNumberJPG = 'ffd8ff';
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_jpg_Export', '', function (err, bufferSmallImage) {
        if (err) {
          assert.strictEqual(err, null);
        }
        helper.assert(bufferSmallImage.slice(0, 3).toString('hex'), _magicNumberJPG);
        converter.convertFile(_filePath, 'writer_jpg_Export', '', function (err, bufferBigImage) {
          if (err) {
            assert.strictEqual(err, null);
          }
          helper.assert(bufferBigImage.slice(0, 3).toString('hex'), _magicNumberJPG);
          helper.assert(bufferSmallImage.length < bufferBigImage.length, true);
          done();
        }, null, null, {
          PixelWidth  : 500,
          PixelHeight : 500
        });
      }, null, null, {
        PixelWidth  : 100,
        PixelHeight : 100
      });
    });

    it('should render JPG images with 2 different quality', function (done) {
      const _magicNumberJPG = 'ffd8ff';
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_jpg_Export', '', function (err, bufferLowQuality) {
        if (err) {
          assert.strictEqual(err, null);
        }
        helper.assert(bufferLowQuality.slice(0, 3).toString('hex'), _magicNumberJPG);
        converter.convertFile(_filePath, 'writer_jpg_Export', '', function (err, bufferMaxQuality) {
          if (err) {
            assert.strictEqual(err, null);
          }
          helper.assert(bufferMaxQuality.slice(0, 3).toString('hex'), _magicNumberJPG);
          helper.assert(bufferLowQuality.length < bufferMaxQuality.length, true);
          done();
        }, null, null, {
          Quality : 100
        });
      }, null, null, {
        Quality : 25
      });
    });

    it('should render a PNG image at different compression', function (done) {
      var _magicNumberPNG = '89504e470d0a1a0a';
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.convertFile(_filePath, 'writer_png_Export', '', function (err, bufferNotCompressed) {
        if (err) {
          assert.strictEqual(err, null);
        }
        helper.assert(bufferNotCompressed.slice(0, 8).toString('hex'), _magicNumberPNG);
        converter.convertFile(_filePath, 'writer_png_Export', '', function (err, bufferCompressed) {
          if (err) {
            assert.strictEqual(err, null);
          }
          helper.assert(bufferCompressed.slice(0, 8).toString('hex'), _magicNumberPNG);
          helper.assert(bufferCompressed.length < bufferNotCompressed.length, true);
          done();
        }, null, null, {
          Compression : 9,
        });
      }, null, null, {
        Compression : 0,
      });
    });

    it('should render and open a pdf with a number as password  (it takes 5000ms on average to finish)', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      const _password = '1234533';
      converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
        if (err) {
          assert.equal(err, null);
        }
        var _buf = new Buffer.from(result);
        assert.equal(_buf.slice(0, 4).toString(), '%PDF');
        const loadingTask = pdfjsLib.getDocument({data : result, password : _password });
        loadingTask.promise.then((doc) => {
          assert.equal(doc.numPages, 1);
          done();
        }, () => {
          done(new Error('Bad Password'));
        });
      }, null, null, {
        EncryptFile          : true,
        DocumentOpenPassword : _password
      });
    });
    it('should restart automatically the conversion factory if it crashes', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.init({factories : 1, startFactory : true, tempPath : tempPath}, function (factories) {
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(Buffer.isBuffer(result), true);
          assert.equal(result.slice(0, 4).toString(), '%PDF');
          // kill LibreOffice thread
          process.kill(factories['0'].pid);
          // try another conversion
          // with Node v4, process.kill seems to be very slow. So I add a "setTimeout" but I'm not very happy with it
          setTimeout(function () {
            converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(Buffer.isBuffer(result), true);
              assert.equal(result.slice(0, 4).toString(), '%PDF');
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
            helper.assert(Buffer.isBuffer(_results[i]), true);
            assert.equal(_results[i].slice(0, 4).toString(), '%PDF');
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
            helper.assert(Buffer.isBuffer(_results[i]), true);
            assert.equal(_results[i].slice(0, 4).toString(), '%PDF');
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
          assert.equal(err+'', 'Error: Could not open document');
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
          assert.equal(err+'', 'Error: Could not convert document');
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
                  helper.assert(Buffer.isBuffer(result), true);
                  assert.equal(result.slice(0, 4).toString(), '%PDF');
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

  describe('LO Memory monitoring and report timeout', function () {
    const totatMemoryAvailableMB     = os.totalmem() / 1024 / 1024;
    const factoryMemoryThreshold     = 8; // 8 %
    const nbConversionBoundary       = 5; // below it os ok, above it restarts LO
    const nbConversionForRestart     = nbConversionBoundary + 1;
    const nbConversionWithoutRestart = nbConversionBoundary - 1;
    // adapt factoryMemoryFileSize according to the system memory to make the test machine-independant
    const factoryMemoryFileSize      = totatMemoryAvailableMB * factoryMemoryThreshold / (nbConversionBoundary * 100);
    const memoryOptions = {
      factories              : 1,
      startFactory           : true,
      tempPath               : tempPath,
      factoryMemoryFileSize  : factoryMemoryFileSize,
      factoryMemoryThreshold : factoryMemoryThreshold
    };

    afterEach(function (done) {
      converter.exit(done);
      carbone.reset();
    });

    it('should not reach the memory threshold and the factory process shouldn\'t be killed', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.init(memoryOptions, function (factories) {
        const _officePID = factories['0'].pid;
        for (let i = 0; i <= nbConversionWithoutRestart; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(Buffer.isBuffer(result), true);
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            assert.equal(factories['0'].pid, _officePID);
            if (i === nbConversionWithoutRestart) {
              done();
            }
          });
        }
      });
    });

    it('should reach the memory threshold  and the factory process should be killed', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      converter.init(memoryOptions, function (factories) {
        const _officePID = factories['0'].pid;
        for (let i = 0; i <= nbConversionForRestart; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(Buffer.isBuffer(result), true);
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            if (i === nbConversionForRestart) {
              assert.notEqual(factories['0'].pid, _officePID);
              done();
            }
          });
        }
      });
    });

    it('should reach the memory threshold and 4 factories should be killed', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      memoryOptions.factories = 4;
      converter.init(memoryOptions, function (factories) {
        const _officePIDs = [factories['0'].pid, factories['1'].pid, factories['2'].pid, factories['3'].pid];
        const _maxLoops = nbConversionForRestart * memoryOptions.factories;
        for (let i = 0; i <= _maxLoops; i++) {
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(Buffer.isBuffer(result), true);
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            if (i === _maxLoops) {
              for (let i = 0; i < _officePIDs.length; i++) {
                assert.notEqual(factories[i+''].pid, _officePIDs[i]);
              }
              done();
            }
          });
        }
      });
    });

    it('should not timeout and should not kill the factory process. (timeout disabled)', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      memoryOptions.converterFactoryTimeout = 0;
      converter.init(memoryOptions, function (factories) {
        const _officePID = factories['0'].pid;
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(Buffer.isBuffer(result), true);
          assert.equal(result.slice(0, 4).toString(), '%PDF');
          assert.equal(factories['0'].pid, _officePID);
          done();
        });
      });
    });

    it('should timeout if the report is too long to convert, return an error and should be able to convert again after', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      memoryOptions.converterFactoryTimeout = 5;
      converter.init(memoryOptions, function (factories) {
        const _officePID = factories['0'].pid;
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
          helper.assert(err instanceof Error, true);
          helper.assert(err+'', 'Error: Document conversion timeout reached ('+params.converterFactoryTimeout+' ms)');
          helper.assert(result+'', 'undefined');
          params.converterFactoryTimeout = 10000;
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            const _newOfficePIDAfter = factories['0'].pid;
            helper.assert(_officePID !== _newOfficePIDAfter, true);
            helper.assert(err+'', 'null');
            helper.assert(Buffer.isBuffer(result), true);
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            done();
          });
        });
      });
    });

    it('should convert one file, another with timeout, and another without timeout', function (done) {
      var _filePath = path.resolve('./test/datasets/test_odt_render_static.odt');
      memoryOptions.converterFactoryTimeout = 5;
      converter.init(memoryOptions, function (factories) {
        const _officePID = factories['0'].pid;
        params.converterFactoryTimeout = 10000;
        converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
          const _newOfficePID = factories['0'].pid;
          helper.assert(_officePID, _newOfficePID);
          helper.assert(err+'', 'null');
          helper.assert(Buffer.isBuffer(result), true);
          assert.equal(result.slice(0, 4).toString(), '%PDF');
          params.converterFactoryTimeout = 2;
          converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
            helper.assert(err instanceof Error, true);
            helper.assert(err+'', 'Error: Document conversion timeout reached ('+params.converterFactoryTimeout+' ms)');
            helper.assert(result+'', 'undefined');
            params.converterFactoryTimeout = 10000;
            converter.convertFile(_filePath, 'writer_pdf_Export', '', function (err, result) {
              const _newOfficePIDAfter = factories['0'].pid;
              helper.assert(_officePID !== _newOfficePIDAfter, true);
              helper.assert(err+'', 'null');
              helper.assert(Buffer.isBuffer(result), true);
              assert.equal(result.slice(0, 4).toString(), '%PDF');
              done();
            });
          });
        });
      });
    });
  });

  describe('exit', function () {
    before(function () {
      var _tempContent = helper.walkDirSync(tempPath);
      if (_tempContent.length > 0) {
        console.error(`Warning - ${_tempContent.length} files hasn't been deleted at the end of the previous tests.`);
        helper.rmDirRecursive(tempPath);
      }
    });

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
          }, 4000);
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
          }, 4000);
        });
      });
    });
  });

});
