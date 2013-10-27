var path  = require('path');
var fs = require('fs');
var helper = require('./helper');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var tempPath = path.join(__dirname, '../', 'temp');
var pythonFile = path.join(__dirname, 'converter.py');

/* Factories object */
var conversionFactory = {};
/* An active factory is a factory which is starting (but not started completely), running or stopping (but not stopped completely) */
var nbActiveFactories = 0; 
/* Every conversion is placed in this job queue */
var jobQueue = [];
/* If true, a factory will restart automatically */
var isAutoRestartActive = true;


var converterOptions = {
  /* can be 'pipe' (socket is not implemented) */
  'mode' : 'pipe', 
  /* used only "pipe" mode. If multiple factories are used, the pipe name is generated automatically to avoid conflicts */
  'pipeNamePrefix' : '_carbone',
  /* used only in socket mode */
  /*'host' : '127.0.0.1',*/
  /* used only in socket mode. If multiple factories are used, the port number is incremented to avoid conflicts */
  /*'portStart' : 2000,*/
  /* Number of LibreOffice + Python factory to start by default. One factory = 2 threads */
  'nbFactories' : 1,
  /* If true, it will start LibreOffice + Python factory when Init method is called (for development environment). 
     If false, it will start LibreOffice + Python factory only when at least one document conversion is needed (for production environment).*/
  'startOnInit' : false,
  /* If LibreOffice fails to convert one document, how many times we re-try to convert this file? */
  'nbAttemptMax' : 2,
  /* Python path */
  'pythonExecPath' : 'python',
  /* Libre Office executable path */
  'sofficeExecPath' : 'soffice',
  /* Delay before killing the other process (either LibreOffice or Python) when one of them died */
  'delayBeforeKill' : 500
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
  '100': 'Existing office server not found.',
  '102': 'The document could not be opened.'
};


var converter = {

  /**
   * Initialize the converter.
   *
   * @param {object} options : {
   *   nbFactories    : number of LibreOffice+python factory which are started. Default : 1
   *   pipeNamePrefix : prefix name of the pipe which is used between Python and LibreOffice. Default : _carbone
   *   startOnInit    : if true it will start LibreOffice + Python  factory immediately, if false it will start LibreOffice + Python factory when needed (first conversion). Default: false
   *   nbAttemptMax   : number of attempts when a conversion fails. Default: 2
   * }
   * @param {function} callback(factory): called when all factories are ready. if startOnInit is true, the first parameter will contain the object descriptor of all factories
   */
  init : function(options, callback){
    if (typeof options === 'function'){
      callback = options;
    }
    else{
      converterOptions.nbFactories    = (options.nbFactories    !== undefined) ? options.nbFactories    : converterOptions.nbFactories;
      converterOptions.pipeNamePrefix = (options.pipeNamePrefix !== undefined) ? options.pipeNamePrefix : converterOptions.pipeNamePrefix;
      converterOptions.startOnInit    = (options.startOnInit    !== undefined) ? options.startOnInit    : converterOptions.startOnInit;
      converterOptions.nbAttemptMax   = (options.nbAttemptMax   !== undefined) ? options.nbAttemptMax   : converterOptions.nbAttemptMax;
    }
    //restart Factory automatically if it crashes. 
    isAutoRestartActive = true;
   
    //if we must start all factory now
    if(converterOptions.startOnInit === true){
      //and if the maximum of factories is not reached
      if(nbActiveFactories < converterOptions.nbFactories){
        var _nbFactoriesStarting=0;
        for (var i = 0; i < converterOptions.nbFactories; i++) {
          _nbFactoriesStarting++;
          addConversionFactory(function(){
            //here all factories are ready
            _nbFactoriesStarting--;
            if(_nbFactoriesStarting === 0 && callback){
              callback(conversionFactory);
            }
          });
        }
      }
    }
    else{
      //else, start LibreOffice when needed 
      if(callback){
        callback();
      }
    }
  },

  /**
   * Kill all LibreOffice + Python threads
   * When this method is called, we must call init() to re-initialize the converter
   *
   * @param {function} callback : when everything is off
   */
  exit : function(callback){
    isAutoRestartActive = false;
    jobQueue = [];
    var _nbFactoriesStopping=0;
    for (var i in conversionFactory) {
      var _factory = conversionFactory[i];
      //if a factory is running
      if(_factory && (_factory.officeThread || _factory.pythonThread)){
        _nbFactoriesStopping++;
        //add an exit callback which will be called when all the factory will be stopped
        (function(userCachePath){
          _factory.exitCallback = function(){
            helper.rmDirRecursiveAsync(userCachePath, function(){
              _nbFactoriesStopping--;
              if(_nbFactoriesStopping === 0 && callback){
                callback();
              }
            });
          };
        })(_factory.userCachePath);
        //kill LibreOffice thread. It will automatically kill Python thread. And if _factory.officeThread is already dead (null), Python thread will die soon automatically. 
        if(_factory.officeThread){
          _factory.officeThread.kill();
        }
      }
    }
    if(_nbFactoriesStopping===0){
      callback();
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
    var _output = getUID();
    var _job = {
      'inputFilePath': inputFile,
      'outputFilePath': path.join(tempPath, _output),
      'outputFormat': _formats.document.pdf.format,
      'callback': callback,
      'nbAttempt' : 0
    };
    jobQueue.push(_job);
    executeQueue();
  }

};


/*****************************************************************************************************************/
/* Private methods */
/*****************************************************************************************************************/


/**
 * Add a LibreOffice + Python factory (= 2 threads)
 * @param {function} callback : function() called when the factory is ready to convert documents.
 */
function addConversionFactory(callback){
  //find a free factory
  var _prevFactory = {};
  var _startListenerID = -1;
  for (var i = 0; i < converterOptions.nbFactories; i++) {
    _prevFactory = conversionFactory[i];
    if(_prevFactory === undefined){
      _startListenerID = i;
      break
    }
    else if(_prevFactory.pythonThread === null && _prevFactory.officeThread === null){
      _startListenerID = i;
      break;
    }
  }
  //maximum of factories reached
  if(_startListenerID === -1){
    return callback();
  }
  nbActiveFactories++;
  var _uniqueName = getUID();
  
  //generate a unique path to a fake user profile. We cannot start multiple instances of LibreOffice if it uses the same user cache
  var _userCachePath = path.join(tempPath, '_office_' + _uniqueName);
  if(_prevFactory && _prevFactory.userCachePath !== undefined){
    //re-use previous directory if possible (faster restart)
    _userCachePath = _prevFactory.userCachePath;
  }

  //generate a unique pipe name
  var _pipeName = converterOptions.pipeNamePrefix + '_' +_uniqueName;
  var _connectionString = 'pipe,name=' + _pipeName + ';urp;StarOffice.ComponentContext';
  var _officeParams = ['--headless', '--invisible', '--nocrashreport', '--nodefault', '--nologo', '--nofirststartwizard', '--norestore',
                       '--quickstart', '--nolockcheck', '--accept='+_connectionString, '-env:UserInstallation=file://'+_userCachePath ];

  var _officeThread = spawn(converterOptions.sofficeExecPath, _officeParams);
  _officeThread.on('close', generateOnExitCallback(_startListenerID, false));

  var _pythonThread = spawn(converterOptions.pythonExecPath, [pythonFile, '--pipe', _pipeName]);
  _pythonThread.on('close', generateOnExitCallback(_startListenerID, true));
  _pythonThread.stdout.on('data', generateOnDataCallback(_startListenerID));

  if(_officeThread !== null && _pythonThread !== null){
    var _factory = {
      'mode' : converterOptions.mode,
      'pipeName' : _pipeName,
      'userCachePath' : _userCachePath,
      'pid': _officeThread.pid,
      'officeThread' : _officeThread,
      'pythonThread' : _pythonThread,
      'isReady': false,
      'isConverting' : false,
      'readyCallback': callback
    };
    conversionFactory[_startListenerID] = _factory;
  }
  else{
     throw new Error('Carbone: Cannot start LibreOffice or Python Thread');
  }
}


/**
 * Generate a callback which is used to handle thread errors
 * @param  {Integer} factoryID       factoryID
 * @param  {Boolean} isPythonProcess true if the callback is used by the Python thread, false if it used by the Office Thread
 * @return {Function}                function(error)
 */
function generateOnExitCallback(factoryID, isPythonProcess){
  return function (error) {
    var _factory = conversionFactory[factoryID];
    if(!_factory){
      throw new Error('Carbone: Process crashed but the factory is unknown!');
    }
    if(error!==null){
      var _processName = isPythonProcess === true ? 'Python' : 'Office'; 
      console.log('Carbone: Process '+_processName+' killed '+error);
    }
    //the factory cannot receive jobs
    _factory.isReady = false;
    _factory.isConverting = false;

    if(isPythonProcess === true){
      _factory.pythonThread = null;
    }
    else{
      _factory.officeThread = null;
    }

    //if we know than both office and python are dead (wait mechanism)
    if(_factory.pythonThread === null && _factory.officeThread === null){
      console.log('Carbone: Both Python and Office died');
      nbActiveFactories--;
      //if Carbone is not shutting down
      if(isAutoRestartActive === true){
        //if there is an error while converting a document, let's try another time 
        var _job = _factory.currentJob;
        if(_job){
          if(_job.nbAttempt < converterOptions.nbAttemptMax){
            _factory.currentJob = null;
            jobQueue.push(_job);
          }
          else{
            _job.callback(''); //TODO send an error
          }
        }
        executeQueue();
      }
      //else if Carbone is shutting down and there is an exitCallback
      else if(_factory.exitCallback){
        _factory.exitCallback();
        _factory.exitCallback = null;
      } 
    }
    //else kill the other process if it does not die alone
    else{
      setTimeout(function(){
        if(isPythonProcess === false && _factory.pythonThread !== null){
          _factory.pythonThread.kill('SIGKILL');
        }
        else if (isPythonProcess === true && _factory.officeThread !== null){
          _factory.officeThread.kill('SIGKILL');
        }
      }, converterOptions.delayBeforeKill);
    }
  }
}


/**
 * Generate a callback which handle communication with the Python thread
 * @param  {Integer} factoryID factoryID
 * @return {Function}          function(data)
 */
function generateOnDataCallback(factoryID){
  return function (data) {
    var _factory = conversionFactory[factoryID];
    if(data=='END'){
      var _job = _factory.currentJob;
      _factory.currentJob = null;
      _factory.isConverting = false;
      if(_job){
        fs.readFile(_job.outputFilePath, function(err, content){
          _job.callback(content);
          try{
            fs.unlink(_job.outputFilePath);
          } catch(e){};
          executeQueue();
        });
      }
    }
    else if (data=='READY'){
      console.log('Carbone: factory '+factoryID+' ready');
      _factory.isReady = true;
      if(_factory.readyCallback){
        _factory.readyCallback();
      }
      executeQueue();
    }
  }
}


/**
 * Execute the queue of conversion.
 * It will auto executes itself until the queue is empty
 */
function executeQueue(){
  if(jobQueue.length===0){
    return;
  }
  //if there is no active factories, start them
  if(nbActiveFactories < converterOptions.nbFactories){
    addConversionFactory(executeQueue);
    return;
  }
  for (var i in conversionFactory) {
    if(jobQueue.length > 0){
      var _factory = conversionFactory[i];
      if(_factory.isReady === true && _factory.isConverting === false){
        var _job = jobQueue.shift();
        sendToFactory(_factory, _job);
      }
    }
  };
}

/**
 * Send the document to the Factory
 *
 * @param {object} factory : LibreOffice + Python factory to send to
 * @param {object} job : job description (file to convert, callback to call when finished, ...)
 */
function sendToFactory(factory, job){
  factory.isConverting = true;
  factory.currentJob = job;
  factory.pythonThread.stdin.write('--format '+job.outputFormat+' --input '+job.inputFilePath+' --output '+job.outputFilePath+'\n');
  //keep the number of attempts to convert this file
  job.nbAttempt++;
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
    if(fs.existsSync('/Applications/LibreOffice.app/Contents/MacOS/python') === true){
      converterOptions.pythonExecPath = '/Applications/LibreOffice.app/Contents/MacOS/python';
      converterOptions.sofficeExecPath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
    }
    else{
      console.log(_redColor+'-- CarboneJS: cannot find LibreOffice.'+_resetColor);
    }
  }
  else if (process.platform === 'linux'){
    if(fs.existsSync('/opt/libreoffice4.0/program/python') === true){
      converterOptions.pythonExecPath = '/opt/libreoffice4.0/program/python';
      converterOptions.sofficeExecPath = '/opt/libreoffice4.0/program/soffice';
    }
    else if (fs.existsSync('/opt/libreoffice4.1/program/python') === true){
      converterOptions.pythonExecPath = '/opt/libreoffice4.1/program/python';
      converterOptions.sofficeExecPath = '/opt/libreoffice4.1/program/soffice';
    }
    else {
      console.log(_redColor+'-- CarboneJS: cannot find LibreOffice.'+_resetColor);
    }
  }
  else{
    console.log(_redColor+'-- CarboneJS: your platform is not supported yet.'+_resetColor);
  }
}

/**
 * Generate a unique id
 * @return {String} unique id 
 */
var sameUIDCounter = 0;
var prevTimestamp = 0;
function getUID(){
  var _timestamp = (new Date().getTime());
  var _uid = 'c_' +_timestamp + '_' + process.pid + '_';
  if(_timestamp === prevTimestamp){
    _uid += ++sameUIDCounter;
  }
  else{
    _uid += '0';
    sameUIDCounter = 0;
  }
  prevTimestamp = _timestamp;
  return _uid;
}

detectLibreOffice();


module.exports = converter;