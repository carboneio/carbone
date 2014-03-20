var events = require('events');
var util = require('util');
var net = require('net');
var helper = require('./helper');

var Socket = function(port, host, timeout, reconnectInterval){
  //common variables
  var _that = this;
  var _port = port;
  var _host = host;
  var _buffer = '';
  var _contentLength= null;
  //server variables
  var _server = null;
  //client variable
  var _client = null;
  var _isConnectionOpen = false;
  var _autoReconnect = true;
  var _closeCallback = null;
  var _openCallback = null;
  var _queue = [];
  var _timeout = timeout || 30000;
  var _reconnectInterval = reconnectInterval || 500;
  var _timer = null;

  /**
   * start a client socket
   * @param  {Function} callback function called when the client is connected for the first time. 
   *                             If the client is disconnected/re-connected, this callback is not fired (use the event 'connect' for that)
   */
  function startClient(callback){
    _openCallback = callback;
    _client = net.connect(_port, _host);
    _client.on('connect', function() {
      _isConnectionOpen = true;
      //empty queue
      for (var i = 0; i < _queue.length; i++) {
        var _packetInfo = _queue[i];
        if(_packetInfo.isSent === false){
          _client.write(_packetInfo.packet, 'utf-8');
          _packetInfo.isSent = true;
        }
      };
      if(_openCallback){
        _openCallback();
        _openCallback = null;
      }
      _that.emit('connect');
    });
    _client.on('data', onData);
    _client.on('error', function(err){
      _that.emit('error', err);
    });
    _client.on('close', function(err){
      autoConnect(err, _openCallback);
      _that.emit('close');
    });
  }

  /**
   * Used by startClient only. This function is called to reconnect the client
   * @param  {Mixed}   err       error object
   * @param  {Function} callback 
   */
  function autoConnect(err, callback){
    _isConnectionOpen = false;
    if(_autoReconnect === true){
      console.log('Carbone: Unable to reach the Carbone server... Try again');
      setTimeout(function(){
        startClient(callback);
      }, _reconnectInterval);
    }
    else{
      if(_closeCallback){
        _closeCallback(err);
        _closeCallback = null;
      }
    }
  }

  /**
   * Stop the connection
   * @param  {Function} callback function called when the connection is closed
   */
  function stop(callback){
    if(_client!==null){
      //NodeJS does not provide a callback for the client.end(), so we do it ourself
      _closeCallback = callback;
      _autoReconnect = false;
      _client.end();
    }
    else if(_server!==null){
      _server.close();
      callback();
    }
  }

  /**
   * Start a server
   * @param  {Function} callback function called when the server is started
   */
  function startServer(callback){
    _server = net.createServer();
    //_server.unref(); //close connections when program exit. do not work on node 0.8
    _server.listen(_port, _host, function() {
      _isConnectionOpen = true;
      if(callback){
        callback();
      }
    });
    _server.on('error', function(err){
      _that.emit('error', err);
    });
    _server.on('close', function(){
      _that.emit('close');
    });
    _server.on('connection', function(socket) {
      socket.send = function(message, uid){
        var _packet = {
          'uid' : uid,
          'data' : message
        };
        socket.write(formatMessage(_packet), 'utf-8');
      };
      socket.on('data', function(rawData){
        onData(rawData, socket);
      });
      _that.emit('connection', socket);
    });
  }

  /**
   * This function is called each time data is received. It buffers the data in _buffer and emit the 'message' event when is the message is complete  
   * @param  {Buffer} rawData raw data received
   * @param  {Object} socket  
   */
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

  /**
   * When the message is decoded and complete, this function is called
   * @param  {String} data   
   * @param  {Object} socket 
   */
  function handleMessage(data, socket) {
    _contentLength = null;
    _buffer = '';
    var _packet = JSON.parse(data);

    //if the socket is a client
    if(_client !== null){
      var _stackSize = _queue.length;
      //It is a lot faster to travel an array like this instead of using an object with uid as properties (at least 40 000 req/sec)
      for (var i = 0; i < _stackSize; i++) {
        var _packetInfo = _queue[i];
        if(_packetInfo.uid === _packet.uid){
          _queue.splice(i, 1);
          if(_stackSize===1 && _timer !== null){
            clearTimeout(_timer);
            _timer = null;
          }
          if(_packetInfo.callback !== undefined){
            _packetInfo.callback(null, _packet);
          }
          break;
        }
      };
    }
    //if the socket is a server
    else if(_server !== null){
      _packet.send = function(message){
        socket.send(message, _packet.uid);
      }
    }
    _that.emit('message', _packet);
  }

  /**
   * Used by send. It transforms the message, add some information for transmission
   * @param  {String} message the message to transform
   * @return {String}         the message ready to be transmitted
   */
  function formatMessage(message) {
    var _dataStr = JSON.stringify(message);
    var _data = _dataStr.length + '#' + _dataStr;
    return _data;
  }


  /**
   * Send a message (only for client). Fill queue if the client connection is closed
   * @param  {String|Object|Array}  message  [description]
   * @param  {Function}             callback called when the message is transmitted
   */
  function send(message, callback){
    var _packet = {
      'uid' : helper.getUID(),
      'data' : message
    };
    var _packetInfo = {
      'uid' : _packet.uid,
      'callback' : callback,
      'sentDate' : Date.now(),
      'isSent' : true
    };
    _queue.push(_packetInfo);
    if(_timer == null){
      _timer = setTimeout(timeoutReached, _timeout);
    }
    if(_isConnectionOpen===true){
      _client.write(formatMessage(_packet), 'utf-8');
    }
    else{
      _packetInfo.packet = formatMessage(_packet);
      _packetInfo.isSent = false;
    }
  }

  /**
   * Function called when the timeout is reached. Used only by the client.send function
   */
  function timeoutReached(){
    _timer = null;
    if(_queue.length > 0){
      var _oldPacket = _queue[0];
      var _timeElapsed = Date.now() - _oldPacket.sentDate;
      if(_timeElapsed >= _timeout){
        _queue.shift();
        if(_oldPacket.callback !== undefined){
          _oldPacket.callback('Timeout reached', null);
        }
        timeoutReached();
      }
      else{
        _timer = setTimeout(timeoutReached, _timeout -  _timeElapsed);
      }
    }
  }

  //expose
  this.startClient = startClient;
  this.startServer = startServer;
  this.stop = stop;
  this.send = send;
  this._queue = _queue;
};

util.inherits(Socket, events.EventEmitter);

module.exports = Socket;

