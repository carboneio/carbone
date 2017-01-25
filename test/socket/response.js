#!/usr/bin/env node

var Socket = require('../../lib/socket');  

var _server = new Socket(4000, '127.0.0.1');
_server.startServer();
_server.on('message', function (res) {
  // add some lantency for client 1 (the client 1 will receive his response after client2 and client3)
  if (res.data === 'client1') {
    setTimeout(function () {
      res.send(res.data+'server');    
    }, 100);
  }
  else {
    res.send(res.data+'server');
  }
});
