var fs = require('fs');
var path = require('path');
var helper = require('./helper');
var net = require('net');
var params = require('./params');
var Socket = require('./socket');
var converter = require('./converter');
var serverSocket = null;

var usage = [
  '\n***********************************************************************',
  ' Server usage:',

  '\n # carbone server --port 4000 --bind 127.0.0.1 ',
  '\t Start a carbone server by default on port '+params.port,
  '\t --port [-p] port number ('+params.port+') ',
  '\t --bind [-b] listen only address  ('+params.host+')',
  '\t --factories [-f] number of factories (LibreOffice thread + Python thread) to start ('+params.nbFactories+')',
  '\t --attempts [-a] if LibreOffice fails to convert one document, how many times we re-try to convert this file? ('+params.maxAttemptConvert+')',

  '\n # carbone server --help',
  '\t Get this help.',
  '\t You could use "-h" instead of "--help".',
].join('\n');


/**
 * Handle parameters of the command easylink server
 * @param {array} args : args passed by easylink (process.argv.slice(3))
 */
function handleParams(args) {
  while(args.length > 0){
    var _argument = args.shift();
    switch(_argument){
      case "--port":
      case "-p":
        params.port = args.shift();
        break;
      case "--bind":
      case "-b":
        params.bind = args.shift();
        break;
      case "--factories":
      case "-f":
        params.factories = args.shift();
        break;
      case "--attempts":
      case "-a":
        params.attempts = args.shift();
        break;
      case "--help":
      case "-h":
        exit(usage);
        break;
      default:
        exit(usage);
        break;
    }
  }
  //handle exit signals
  ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"].forEach(function(signal){
    process.on(signal, function(){
      exit('\nCarbone: Exit with signal '+signal);
    });
  });
  params.startFactory = true;
  console.log('Carbone: Starting server...');
  converter.init(function(){
    startServer();
    console.log('Carbone: server is started on port '+params.port + ' and listen '+params.bind);
    console.log('         with '+params.factories+' factorie(s) and '+params.attempts+' attempt(s) of conversion.');
  });

}


module.exports = handleParams;

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/

/**
 * Start a server
 *
 * @param {integer} port : server port
 */
function startServer(){
  serverSocket = new Socket(params.port, params.bind);
  serverSocket.startServer();
  serverSocket.on('message', function(req){
    var _message = req.data;
    if(_message === 'shutdown'){
      return exit();
    }
    converter.convertFile(_message.inputFile, _message.format, _message.formatOptions, function(){
      req.send({
        'success' : true,
      });
    }, true, _message.outputFile);
  });
  serverSocket.on('error', function(err){
    throw Error(err);
  });
}


function stopServer(callback){
  if(serverSocket){
    serverSocket.stop(callback);
  }
  else{
    callback();
  }
}

/**
 * Gracefully exits 
 *
 * @param {string} msg : final message
 */
function exit(msg) {
  if(msg){
    console.log(msg);
    console.log('Carbone: Shutdown in progress...');
  }
  stopServer(function(){
    converter.exit(function(){
      process.exit();
    });
  });
}

