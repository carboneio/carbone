var events = require('events');
var util = require('util');
var net = require('net');


var Socket = function(port, host){
  var _port = port;
  var _host = host;
  var _client = null;
  var _server = null;
  var _isConnectionOpen = false;
  var _that = this;
  var _buffer = '';
  var _contentLength= null;
  var _queue = [];

  function startClient(){
    _client = net.connect(_port, _host);
    _client.on('error', function(hasError){
      console.log('client error');
    });
    _client.on('close', function(){
      console.log('client disconnected');
      _isConnectionOpen = false;
      setTimeout(function(){
        console.log('try reconnect')
        startClient();
      }, 500);
    });
    _client.on('data', onData);
    _client.on('connect', function() {
      _isConnectionOpen = true;
      //empty queue
      while(_queue.length>0){
        var _job = _queue.shift();
        _client.write(_job.data, 'utf-8', _job.callback);
      }
      _that.emit('connect');
    });
  }

  function startServer(){
    _server = net.createServer();
    _server.listen(_port, _host, function() {
      _isConnectionOpen = true;
      console.log('server bound');
    });

    _server.on('connection', function(socket) {
      console.log('new client');
      socket.send = function(message, callback){
        socket.write(formatMessage(message), 'utf-8', callback);
      };
      socket.on('end', function() {
        console.log('client disconnected');
      });
      socket.on('data', function(rawData){
        onData(rawData, socket);
      });
    });
  }

  function onData(rawData, socket) {
    var data = rawData.toString();
    _buffer += data;
    if (_contentLength == null) {
      var i = _buffer.indexOf('#');
      //Check if the buffer has a #, if not, the end of the buffer string might be in the middle of a content length string
      if (i !== -1) {
        var _rawContentLength = _buffer.substring(0, i);
        _contentLength = parseInt(_rawContentLength);
        _buffer = _buffer.substring(i + 1);
      }
    }
    if (_contentLength !== null) {
      if (_buffer.length == _contentLength) {
        handleMessage(_buffer, socket);
      } 
      else if (_buffer.length > _contentLength) {
        var message = _buffer.substring(0, _contentLength);
        var rest = _buffer.substring(_contentLength);
        handleMessage(message, socket);
        onData(rest, socket);
      }
    }
  }

  function handleMessage(data, socket) {
    _contentLength = null;
    _buffer = '';
    var message;
    //TODO try  catch
    message = JSON.parse(data);
    message = message || {};
    _that.emit('message', message, socket);
  }

  function formatMessage(message) {
    var _dataStr = JSON.stringify(message);
    var _data = _dataStr.length + '#' + _dataStr;
    return _data;
  }

  function send(message, callback){
    //TODO test queue FULL
    if(_isConnectionOpen===true){
      _client.write(formatMessage(message), 'utf-8', callback);
    }
    else{
      _queue.push({
        'data' : formatMessage(message),
        'callback': callback
      });
    }
  }

  //expose
  this.startClient = startClient;
  this.startServer = startServer;
  this.send = send;
};

util.inherits(Socket, events.EventEmitter);

module.exports = Socket;

