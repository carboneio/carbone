var rootPath = process.cwd(); //where "make test" is called 
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;
var http = require("http");
var Socket = require('../lib/socket');  
var url = require('url');
var helper  = require('../lib/helper');
var path = require('path');
var server;
var tempPath = path.join(__dirname, '../', 'temp');

var commandToTest = rootPath+'/bin/carbone'; 

describe.skip('Carbone server commands', function(){

  describe('sdsd', function(){
    it('should start the server on port 4000 by default', function(done){
      var _executionPath = rootPath+'/test';
      executeServer(_executionPath, ['server'], function(){
        var _pdfResultPath = path.resolve('./test/datasets/test_odt_render_static.pdf');
        var _inputFile = path.resolve('./test/datasets/test_odt_render_static.odt');
        var _outputFile = path.join(tempPath, 'my_converted_file.pdf');
        var _client = new Socket(4000, '127.0.0.1');
        _client.startClient();
        var _job = {
          'inputFile'  : _inputFile,
          'outputFile' : _outputFile,
          'format' : 'writer_pdf_Export'
        };
        _client.send(_job);
        _client.on('message', function(message){
          fs.readFile(_outputFile, function(err, content){
            var _buf = new Buffer(content);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
            stopServer(done);
          });
        });
      });
    });
  });
});



function executeServer(executionPath, params, callback){
  server = spawn(commandToTest, params, {cwd: executionPath});
  setTimeout(function(){
    callback();
  }, 200);
}

function stopServer(callback){
  if(server){
    process.kill(server.pid);
    server = null;
  }
  setTimeout(function(){
    callback();
  }, 200);
}
