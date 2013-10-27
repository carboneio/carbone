var fs = require('fs');
var path = require('path');
var helper = require('./helper');
var net = require('net');
var Socket = require('./socket');
var converter = require('./converter');

/**
 * Default parameter
 */
var params = {
  'port' : 4000, 
  'bind' : '127.0.0.1'
};

var usage = [
  '\n***********************************************************************',
  ' Server usage:',

  '\n # carbone server --port 4000 --bind 127.0.0.1 ',
  '\t Start a carbone server by default on port '+params.port,
  '\t --port: port number ',
  '\t --bind: listen address ',

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
        params.port = _argument;
        break;
      case "--bind":
      case "--b":
        params.bind = _argument;
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
  startServer();
  console.log('-- Carbone server started on port '+params.port + ' and listen '+params.bind);

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
  var _server = new Socket(params.port, params.bind);
  _server.startServer();
  _server.on('message', function(message, client){
    converter.convertFile(message.inputFile, 'pdf', function(){
      client.send({
        'success' : true
      });
    }, true, message.outputFile);
  });
}

["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"].forEach(function(signal){
  process.on(signal, function(){
    converter.exit();
    process.exit();
  });
});

/**
 * Gracefully exits the script and closes any open DB connections
 *
 * @param {string} msg : final message
 */
function exit(msg) {
  if(msg){
    console.log(msg);
    console.log('\n===================================================================');
  }
  process.exit();
}
