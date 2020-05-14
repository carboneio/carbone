#!/usr/bin/env node

var Socket = require('../../lib/socket');  

var _server = new Socket(4000, '127.0.0.1');
_server.startServer();
_server.on('message', function (messageFromClient) {
  messageFromClient.send(messageFromClient.data);
});
