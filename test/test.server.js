var rootPath = process.cwd(); //where "make test" is called 
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;
var http = require("http");
var Socket = require('../lib/socket');  
var url = require('url');
var helper  = require('../lib/helper');
var format  = require('../lib/format');
var path = require('path');
var carbone = require('../lib/index');
var server;
var tempPath = path.join(__dirname,'tempfile');
var os = require('os');


describe('Server', function(){
  describe('carbone server', function(){
    beforeEach(function(){
      helper.rmDirRecursive(tempPath);
    });
    after(function(){
      helper.rmDirRecursive(tempPath);
    });
    it('should start the server on port 4000 and accept to receive conversion jobs via the socket', function(done){
      fs.mkdirSync(tempPath, 0755);
      executeServer(['server', '--port', 4000], function(){
        var _inputFile = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _outputFile = path.join(tempPath, 'my_converted_file.pdf');
        var _client = new Socket(4000, '127.0.0.1', 6000);
        _client.on('error', function(err){});
        _client.startClient();
        var _job = {
          'inputFile'  : _inputFile,
          'outputFile' : _outputFile,
          'format' : format.document.pdf.format
        };
        _client.send(_job, function(err, res){
          assert.equal(err, null);
          assert.equal(res.data.success, true);
          fs.readFile(_outputFile, function(err, content){
            var _buf = new Buffer(content);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            _client.send('shutdown', function(){
              _client.stop(function(){
                done();
              });
            });
          });
        });
      });
    });
    it('should convert the document using the server on port 4001', function(done){
      fs.mkdirSync(tempPath, 0755);
      carbone.set({
        'tempPath' : tempPath,
        'port' : 4001,
        'delegateToServer' : true,
        'templatePath' : path.resolve('./test/datasets')
      });
      executeServer(['server', '--port', 4001], function(){
        var _client = new Socket(4001, '127.0.0.1', 6000);
        _client.startClient();
        _client.on('error', function(err){});
        var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
        var data = {
          field1 : 'field_1',
          field2 : 'field_2'
        };
        carbone.render('test_word_render_A.docx', data, {'convertTo':'pdf'}, function(err, result){
          var buf = new Buffer(result);
          assert.equal(buf.slice(0, 4).toString(), '%PDF');
          var bufPDF = new Buffer(buf.length);
          fs.open(_pdfResultPath, 'r', function(status, fd){
            fs.read(fd, bufPDF, 0, buf.length, 0, function(err, bytesRead, buffer){
              assert.equal(buf.slice(0, 100).toString(), buffer.slice(0, 100).toString());
              //reset carbone
              carbone.reset();
              _client.send('shutdown', function(){
                done();
              });
            });
          });
        });
      });
    });
  });
});


function executeServer(params, callback){
  var _commandToTest = rootPath+'/bin/carbone'; 
  server = spawn(_commandToTest, params, {cwd: rootPath});
  //server.stdout.on('data', function (data) {
  //  console.log('\n\nstdout: ' + data+'\n\n');
  //});
  //server.stderr.on('data', function (data) {
  //  console.log('\n\nstderr: ' + data+'\n\n');
  //});
  setTimeout(function(){
    callback();
  }, 200);
}

//Unable to use a kill signal, I don't know why?
function stopServer(callback){
  if(server){
    server.kill()
  }
  setTimeout(function(){
    callback();
  }, 200);
}
