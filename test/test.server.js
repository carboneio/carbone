var rootPath = process.cwd(); // where "make test" is called 
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;
var Socket = require('../lib/socket');  
var helper  = require('../lib/helper');
var format  = require('../lib/format');
var path = require('path');
var carbone = require('../lib/index');
var tempPath = path.join(__dirname,'tempfile');


describe.skip('Server', function () {
  describe('carbone server', function () {
    beforeEach(function () {
      helper.rmDirRecursive(tempPath);
    });
    after(function () {
      helper.rmDirRecursive(tempPath);
    });
    it('should start the server on port 4000 and accept to receive conversion jobs via the socket (with binary data)', function (done) {
      fs.mkdirSync(tempPath, parseInt('0755', 8));
      executeServer(['server', '--port', 4000], function () {
        var _inputFile = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _outputFile = path.join(tempPath, 'my_converted_file.pdf');
        var _client = new Socket(4000, '127.0.0.1', 10000);
        _client.on('error', function () {});
        _client.startClient();
        var _file = fs.readFileSync(_inputFile);
        var _job = {
          inputFile  : _inputFile,
          input      : _file.toString('base64'),
          outputFile : _outputFile,
          format     : format.document.pdf.format
        };
        _client.send(_job, function (err, res) {
          assert.equal(err, null);
          assert.equal(res.data.error, null);
          var _buf = new Buffer(res.data.output, 'base64');
          assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          _client.send('shutdown');
          _client.stop(function () {
            setTimeout(done, 1000); // let the time to shutdown the server
          });
        });
      });
    });
    it('accept to receive conversion with a link to a local file instead of a buffer (for backward compatibility with v0.10)', function (done) {
      fs.mkdirSync(tempPath, parseInt('0755', 8));
      executeServer(['server', '--port', 4000], function () {
        var _inputFile = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _outputFile = path.join(tempPath, 'my_converted_file.pdf');
        var _client = new Socket(4000, '127.0.0.1', 10000);
        _client.on('error', function () {});
        _client.startClient();
        var _job = {
          inputFile  : _inputFile,
          outputFile : _outputFile,
          format     : format.document.pdf.format
        };
        _client.send(_job, function (err, res) {
          assert.equal(err, null);
          assert.equal(res.data.error, null);
          fs.readFile(_outputFile, function (err, content) {
            var _buf = new Buffer(content);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            _client.send('shutdown');
            _client.stop(function () {
              setTimeout(done, 1000); // let the time to shutdown the server
            });
          });
        });
      });
    });
    it('should convert the document using the server on port 4001', function (done) {
      fs.mkdirSync(tempPath, parseInt('0755', 8));
      carbone.set({
        tempPath         : tempPath,
        port             : 4001,
        delegateToServer : false, // must be set to false otherwise it creates two client connection, one created by this test and another for carbone
        templatePath     : path.resolve('./test/datasets')
      });
      executeServer(['server', '--port', 4001], function () {
        var _client = new Socket(4001, '127.0.0.1', 10000);
        _client.startClient();
        _client.on('error', function () {});
        var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
        var data = {
          field1 : 'field_1',
          field2 : 'field_2'
        };
        carbone.render('test_word_render_A.docx', data, {convertTo : 'pdf'}, function (err, result) {
          var buf = new Buffer(result);
          assert.equal(buf.slice(0, 4).toString(), '%PDF');
          var bufPDF = new Buffer(buf.length);
          fs.open(_pdfResultPath, 'r', function (status, fd) {
            fs.read(fd, bufPDF, 0, buf.length, 0, function (err, bytesRead, buffer) {
              assert.equal(buf.slice(0, 90).toString(), buffer.slice(0, 90).toString());
              // reset carbone
              _client.send('shutdown');
              _client.stop(function () {
                carbone.reset();
                setTimeout(done, 1000); // let the time to shutdown the server
              });
            });
          });
        });
      });
    });
  });
});


function executeServer (params, callback) {
  var _commandToTest = rootPath+'/bin/carbone'; 
  spawn(_commandToTest, params, {cwd : rootPath}); // stop by the client
  // server.stdout.on('data', function (data) {
  //  console.log('\n\nstdout: ' + data+'\n\n');
  // });
  // server.stderr.on('data', function (data) {
  //  console.log('\n\nstderr: ' + data+'\n\n');
  // });
  setTimeout(function () {
    callback();
  }, 200);
}
