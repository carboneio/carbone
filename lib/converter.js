var path  = require('path');
var fs = require('fs');
var helper = require('./helper');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;


var tempPath = path.join(__dirname, '../', 'temp');
var pythonFile = path.join(__dirname, 'converter.py');
var officeListeners = {};
var nbActiveListeners = -1;
var jobQueue = [];
var queueInProgress = false;
//When the program exits, it will wait until temps directory is cleaned
var EXIT_TIMEOUT = 500;
var doNotRestart = false;

var converterOptions = {
  /* can be 'pipe' or 'socket' */
  'mode' : 'pipe', 
  /* used only "pipe" mode. If multiple listeners are used, the pipe name is generated automatically to avoid conflicts */
  'pipeNamePrefix' : '_carbone',
  /* used only in socket mode */
  /*'host' : '127.0.0.1',*/
  /* used only in socket mode. If multiple listeners are used, the port number is incremented to avoid conflicts */
  /*'portStart' : 2000,*/
  /* umber of listeners to start by default */
  'nbListeners' : 1,
  /* delay in milliseconds before considering LibreOffice is ready to convert some document*/
  'startDelay' : 4000,
  /* If true, it will start LibreOffice listeners when Init method is called (for development environment). 
     If false, it will start LibreOffice listeners only when at least one document conversion is needed (for production environment).*/
  'startOnInit' : false,
  /* If LibreOffice fails to convert one document, how many times we re-try to convert this file? */
  'nbAttemptMax' : 2,
  /* Python path */
  'pythonExecPath' : 'python',
  /* Libre Office executable path */
  'sofficeExecPath' : 'soffice'
};


/**
 * Compatible format with LibreOffice per document type
 *
 */
var _formats = {
  'document': {
    'bib'      : {'extension': 'bib' , 'format': 'BibTeX_Writer'                         }, /* BibTeX*/
    'doc'      : {'extension': 'doc' , 'format': 'MS Word 97'                            }, /* Microsoft Word 97/2000/XP*/
    'doc6'     : {'extension': 'doc' , 'format': 'MS WinWord 6.0'                        }, /* Microsoft Word 6.0*/
    'doc95'    : {'extension': 'doc' , 'format': 'MS Word 95'                            }, /* Microsoft Word 95*/
    'docbook'  : {'extension': 'xml' , 'format': 'DocBook File'                          }, /* DocBook*/
    'docx'     : {'extension': 'docx', 'format': 'Office Open XML Text'                  }, /* Microsoft Office Open XML*/
    'docx7'    : {'extension': 'docx', 'format': 'MS Word 2007 XML'                      }, /* Microsoft Office Open XML*/
    'fodt'     : {'extension': 'fodt', 'format': 'OpenDocument Text Flat XML'            }, /* OpenDocument Text (Flat XML*/
    'html'     : {'extension': 'html', 'format': 'HTML (StarWriter)'                     }, /* HTML Document (OpenOffice.org Writer*/
    'latex'    : {'extension': 'ltx' , 'format': 'LaTeX_Writer'                          }, /* LaTeX 2e*/
    'mediawiki': {'extension': 'txt' , 'format': 'MediaWiki'                             }, /* MediaWiki*/
    'odt'      : {'extension': 'odt' , 'format': 'writer8'                               }, /* ODF Text Document*/
    'ooxml'    : {'extension': 'xml' , 'format': 'MS Word 2003 XML'                      }, /* Microsoft Office Open XML*/
    'ott'      : {'extension': 'ott' , 'format': 'writer8_template'                      }, /* Open Document Text*/
    'pdb'      : {'extension': 'pdb' , 'format': 'AportisDoc Palm DB'                    }, /* AportisDoc (Palm*/
    'pdf'      : {'extension': 'pdf' , 'format': 'writer_pdf_Export'                     }, /* Portable Document Format*/
    'psw'      : {'extension': 'psw' , 'format': 'PocketWord File'                       }, /* Pocket Word*/
    'rtf'      : {'extension': 'rtf' , 'format': 'Rich Text Format'                      }, /* Rich Text Format*/
    'sdw'      : {'extension': 'sdw' , 'format': 'StarWriter 5.0'                        }, /* StarWriter 5.0*/
    'sdw4'     : {'extension': 'sdw' , 'format': 'StarWriter 4.0'                        }, /* StarWriter 4.0*/
    'sdw3'     : {'extension': 'sdw' , 'format': 'StarWriter 3.0'                        }, /* StarWriter 3.0*/
    'stw'      : {'extension': 'stw' , 'format': 'writer_StarOffice_XML_Writer_Template' }, /* Open Office.org 1.0 Text Document Template*/
    'sxw'      : {'extension': 'sxw' , 'format': 'StarOffice XML (Writer)'               }, /* Open Office.org 1.0 Text Document*/
    'text'     : {'extension': 'txt' , 'format': 'Text (encoded)'                        }, /* Text Encoded*/
    'txt'      : {'extension': 'txt' , 'format': 'Text'                                  }, /* Text*/
    'uot'      : {'extension': 'uot' , 'format': 'UOF text'                              }, /* Unified Office Format text*/
    'vor'      : {'extension': 'vor' , 'format': 'StarWriter 5.0 Vorlage/Template'       }, /* StarWriter 5.0 Template*/
    'vor4'     : {'extension': 'vor' , 'format': 'StarWriter 4.0 Vorlage/Template'       }, /* StarWriter 4.0 Template*/
    'vor3'     : {'extension': 'vor' , 'format': 'StarWriter 3.0 Vorlage/Template'       }, /* StarWriter 3.0 Template*/
    'xhtml'    : {'extension': 'html', 'format': 'XHTML Writer File'                     }, /* XHTML Document*/
  },
  'spreadsheet': {},
  'web': {},
  'presentation': {}
};

var pythonErrors = {
  '1'  : 'Global error',
  '100': 'Existing listener not found. Unable start listener by parameters. Aborting.',
  '101': 'Unable to connect or start own listener. Aborting.',
  '102': 'The document could not be opened.'
};

var converter = {

  /**
   * Initialize the converter.
   *
   * @param {object} options : {
   *   nbListeners    : number of LibreOffice instance which are started. Default : 1
   *   pipeNamePrefix : prefix name of the pipe which is used between CarboneJS and LibreOffice. Default : _carbone
   *   startOnInit    : if true it will start LibreOffice listeners immediately, if false it will start LibreOffice listener when needed (first conversion). Default: false
   *   nbAttemptMax   : number of attempts when a conversion fails. Default: 2
   *   startDelay     : delay in milliseconds before considering LibreOffice is ready to convert some document. Default : 4000 milliseconds
   * }
   * @param {function} callback(listeners): if startOnInit is true, the first parameter will contain the object descriptor of all listeners
   */
  init : function(options, callback){
    if (typeof options === 'function'){
      callback = options;
    }
    else{
      converterOptions.nbListeners    = (options.nbListeners    !== undefined) ? options.nbListeners    : converterOptions.nbListeners;
      converterOptions.pipeNamePrefix = (options.pipeNamePrefix !== undefined) ? options.pipeNamePrefix : converterOptions.pipeNamePrefix;
      converterOptions.startOnInit    = (options.startOnInit    !== undefined) ? options.startOnInit    : converterOptions.startOnInit;
      converterOptions.nbAttemptMax   = (options.nbAttemptMax   !== undefined) ? options.nbAttemptMax   : converterOptions.nbAttemptMax;
      converterOptions.startDelay     = (options.startDelay     !== undefined) ? options.startDelay     : converterOptions.startDelay;
    }
    //restart LibeOffice instance automatically if it crashes. 
    doNotRestart = false;

    //if we must start all listeners now
    if(converterOptions.startOnInit === true){
      //and if there is no active listeners 
      if(nbActiveListeners <= 0){
        //Setting nbActiveListeners to 0 means "we are starting LibreOffice"
        nbActiveListeners = 0;
        for (var i = 0; i < converterOptions.nbListeners; i++) {
          startListener(i, function(){
            nbActiveListeners++;
            if(nbActiveListeners === converterOptions.nbListeners && callback){
              callback(officeListeners);
            }
          });
        }
      }
    }
    else{
      //else, start LibreOffice when needed 
      nbActiveListeners = -1;
      if(callback){
        callback();
      }
    }
  },

  /**
   * Kill all Libre Office instance.
   * Clean the temp directory on exit.
   *
   * When this method is called, we must call init() to re-initialize the converter
   *
   * @param {function} callback : when everything is off
   */
  exit : function(callback){
    doNotRestart = true;
    for (var i in officeListeners) {
      var _pid = officeListeners[i].pid;
      //empty queue
      jobQueue = [];
      queueInProgress = false;
      //kill all libre office instances. THe callback of exec will automatically detete the cache of LibreOffice on exit
      process.kill(_pid);
    };
    if(callback){
      setTimeout(function(){
        callback();
      }, EXIT_TIMEOUT);
    }
  },

  /**
   * Convert a document 
   *
   * @param {string} inputFile : absolute path to the source document
   * @param {string} outputType : destination type among all types returned by getTypes
   * @param {function} callback : function(buffer) result 
   */
  convertFile : function(inputFile, outputType, callback){
    var _job = {
      'inputFilePath': inputFile,
      'outputFormat': _formats.document.pdf.format,
      'callback': callback,
      'nbAttempt' : 0
    };

    jobQueue.push(_job);

    if(queueInProgress === false){ //very important
      executeQueue();
      queueInProgress = true;
    }
  }

};


/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/


/**
 * Start a LibreOffice listener
 *
 * @param {integer} listenerID : listener internal id [0-N].
 * @param {function} callback : function(listenerID) called when the listener is ready to convert documents. It passed also the listenerID which was started
 */
function startListener(listenerID, callback){
  var _currentTimestamp = parseInt((new Date().getTime()) / 1000);
  var _uniqueName = _currentTimestamp + '_' + listenerID + '_' + process.pid;
  //generate a unique path to a fake user profile. We cannot start multiple instances of LibreOffice if it uses the same user cache
  var _userCachePath = path.join(tempPath, '_office_' + _uniqueName);
  //generate a unique pipe name
  var _pipeName = converterOptions.pipeNamePrefix + '_' +_uniqueName;
  var _connectionString = '"pipe,name=' + _pipeName + ';urp;StarOffice.ComponentContext"';
  var _officeParams = [
    '--headless',
    '--invisible',
    '--nocrashreport',
    '--nodefault',
    '--nologo',
    '--nofirststartwizard',
    '--norestore',
    '--quickstart',
    '--nolockcheck',
    '--accept='+_connectionString,
    '-env:UserInstallation=file://'+_userCachePath
  ];

  var _startCmd = converterOptions.sofficeExecPath+' '+_officeParams.join(' ');

  //If we use spawn LibreOffice it use 100% of CPU, so we use exec.
  var _officeInstance = exec(_startCmd, getListenerCallback(listenerID));

  if(_officeInstance !== null){
    var _officeListener = {
      'mode' : converterOptions.mode,
      'pipeName' : _pipeName,
      'userCachePath' : _userCachePath,
      'pid': _officeInstance.pid,
      'isReady': false,
      'isConverting' : false
    };
    officeListeners[listenerID] = _officeListener;
  }
  else{
     throw new Error('Cannot start LibreOffice Listener');
  }

  //When Libre Office start, we must wait a little otherwise it corrupts converted files 
  setTimeout(function(){
    //test if the listener object still exists (protection against converter.exit method is called while a listener is restarting)
    if(officeListeners[listenerID]){
      officeListeners[listenerID].isReady = true;
    }
    //execute the job list if some jobs are waiting
    executeQueue();
    if(callback){
      callback(listenerID);
    }
  }, converterOptions.startDelay);
}

/**
 * Return a function which is used when a LibreOffice listener crashes (callback of require('child_process').exec)
 *
 * @param {integer} listenerID: listener internal id [0-N].
 * @return {function} function (error, stdout, stderr) to be used as the callback of require('child_process').exec
 */
function getListenerCallback(listenerID){
  return function (error, stdout, stderr) {
    var _listener = officeListeners[listenerID];

    if(!_listener){
      throw new Error('LibreOffice crashed but the listener is not known!');
    }
    if (error !== null) {
      console.log('\n\nOffice listener killed\n\n');
    }

    //Stop sending document to this listener
    _listener.isReady = false;

    helper.rmDirRecursiveAsync(_listener.userCachePath, function(){
      //On process exit, delete everything
      if(doNotRestart === true){
        //remove the cache of LibreOffice 
        //remove the listener from the officeListeners list
        delete officeListeners[listenerID];
        nbActiveListeners--;
      }
      //Restart Libre Office
      else{
        startListener(listenerID);
      }
    });
  }
}


/**
 * Execute the queue of conversion.
 * It will auto executes itself until the queue is empty
 */
function executeQueue(){
  if(jobQueue.length===0){
    queueInProgress = false;
    return;
  }

  //if there is no active listeners, start them
  if(nbActiveListeners === -1){
    nbActiveListeners = 0;
    converter.init({'startOnInit':true}, executeQueue);
    return;
  }

  //what happens if the listener crash ???
  for (var i in officeListeners) {
    if(jobQueue.length > 0){
      var _listener = officeListeners[i];
      if(_listener.isReady === true && _listener.isConverting === false){
        var _job = jobQueue.shift();
        sendToOffice(_listener, _job, executeQueue);
      }
    }
  };
}

/**
 * Send the document to LibreOffice
 *
 * @param {object} listener : LibreOffice listener to send to
 * @param {object} job : job description (file to convert, callback to call when finished)
 * @param {function} callback : function() called the job is finished
 */
function sendToOffice(listener, job, callback){
  listener.isConverting = true;

  //keep the number of attempts to convert this file
  job.nbAttempt++;

  //console.log('\n executing job on listener pipe '+listener.pipeName+' \n');
  var _outputBuffer = [];
  var _options = [pythonFile, '--file', job.inputFilePath, '--pipe', listener.pipeName, '--format', job.outputFormat];
  var _python = spawn(converterOptions.pythonExecPath, _options);
  _python.stdout.on('data', function(data){
    _outputBuffer.push(data);
  });

  _python.on('exit', function(error){
    if(error){
      console.log('\n\n\n Warning, error during conversion on document '+job.inputFilePath+': '+pythonErrors[error]+' \n\n');
    }

    //if there is an error while converting the document, it may come from a LibreOffice crash, so let's try another time
    if(error && job.nbAttempt < converterOptions.nbAttemptMax){
      jobQueue.push(job);
    }
    else{
      job.callback(Buffer.concat(_outputBuffer));
    }

    listener.isConverting = false;
    callback();
  });
}


/**
 * Detect If LibreOffice and python are available at startup
 * TODO: 
 *  - Try many path in a loop until we find right version of LibreOffice and Python:
 *  - Test that python can import uno -> it garuantee we are using the right python
 *  - Test we are using the right couple :
 *    -  LibreOffice 4 with Python 3.3
 *    -  LibreOffice 3.6 with Python 2.7...
 */
function detectLibreOffice(){
  var _redColor = '\033[31m';
  var _resetColor = '\033[0m';

  if(process.platform === 'darwin'){
    //it is better to use the python bundled with LibreOffice
    converterOptions.pythonExecPath = '/Applications/LibreOffice.app/Contents/MacOS/python';
    converterOptions.sofficeExecPath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
  }
  else if (process.platform === 'linux'){
    converterOptions.pythonExecPath = '/opt/libreoffice4.0/program/python';
    converterOptions.sofficeExecPath = '/opt/libreoffice4.0/program/soffice';
  }
  else{
    console.log(_redColor+'-- CarboneJS: your platform is not supported yet.'+_resetColor);
  }

  exec(converterOptions.pythonExecPath + ' --version', function(error, stdout, stderr){
    if(error){
      console.log(_redColor+'-- CarboneJS: python executable not found.'+_resetColor);
    }
  });
  exec(converterOptions.sofficeExecPath + ' --version', function(error, stdout, stderr){
    if(error){
      console.log(_redColor+'-- CarboneJS: LibreOffice executable not found.'+_resetColor);
    }
  });
}

detectLibreOffice();


module.exports = converter;