var path  = require('path');
var fs = require('fs');
var helper = require('./helper');
var formats = require('./format');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var params = require('./params');

var pythonFile = path.join(__dirname, 'converter.py');

/* Factories object */
var conversionFactory = {};
/* An active factory is a factory which is starting (but not started completely), running or stopping (but not stopped completely) */
var activeFactories = [];
/* Every conversion is placed in this job queue */
var jobQueue = [];
/* If true, a factory will restart automatically */
var isAutoRestartActive = true;


var converterOptions = {
  /* Python path */
  'pythonExecPath' : 'python',
  /* Libre Office executable path */
  'sofficeExecPath' : 'soffice',
  /* Delay before killing the other process (either LibreOffice or Python) when one of them died */
  'delayBeforeKill' : 500
};


var pythonErrors = {
  '1'  : 'Global error',
  '100': 'Existing office server not found.',
  '102': 'The document could not be opened.'
};


var converter = {

  /**
   * Initialize the converter.
   * @param {Object}   options : same options as carbone's options
   * @param {function} callback(factory): called when all factories are ready. if startFactory is true, the first parameter will contain the object descriptor of all factories
   */
  init : function(options, callback){
    if(typeof(options) === 'function'){
      callback = options;
    }
    else{
      for(var attr in options){
        if(params[attr]!== undefined){
          params[attr] = options[attr];
        }
        else{
          throw Error('Undefined options :' + attr);
        }
      }
    }
    //restart Factory automatically if it crashes. 
    isAutoRestartActive = true;
   
    //if we must start all factory now
    if(params.startFactory === true){
      //and if the maximum of factories is not reached
      if(activeFactories.length < params.factories){
        var _nbFactoriesStarting=0;
        for (var i = 0; i < params.factories; i++) {
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
                conversionFactory = {};
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
    if(_nbFactoriesStopping===0 && callback){
      conversionFactory = {};
      callback();
    }
  },

  /**
   * Convert a document 
   *
   * @param {string} inputFile : absolute path to the source document
   * @param {string} outputType : destination type among all types returned by getTypes
   * @param {string} formatOptions : options passed to convert
   * @param {function} callback : function(buffer) result 
   */
  convertFile : function(inputFile, outputType, formatOptions, callback, returnLink, outputFile){
    var _output = helper.getUID();
    var _job = {
      'inputFilePath': inputFile,
      'outputFilePath': outputFile || path.join(params.tempPath, _output),
      'outputFormat': outputType,
      'formatOptions' : formatOptions || '',
      'returnLink' : returnLink || false,
      'callback': callback,
      'nbAttempt' : 0,
      'error' : null
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
  for (var i = 0; i < params.factories; i++) {
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
  var _uniqueName = helper.getUID();
  
  //generate a unique path to a fake user profile. We cannot start multiple instances of LibreOffice if it uses the same user cache
  var _userCachePath = path.join(params.tempPath, '_office_' + _uniqueName);
  if(_prevFactory && _prevFactory.userCachePath !== undefined){
    //re-use previous directory if possible (faster restart)
    _userCachePath = _prevFactory.userCachePath;
  }

  //generate a unique pipe name
  var _pipeName = params.pipeNamePrefix + '_' +_uniqueName;
  var _connectionString = 'pipe,name=' + _pipeName + ';urp;StarOffice.ComponentContext';
  var _officeParams = ['--headless', '--invisible', '--nocrashreport', '--nodefault', '--nologo', '--nofirststartwizard', '--norestore',
                       '--quickstart', '--nolockcheck', '--accept='+_connectionString, '-env:UserInstallation=file://'+_userCachePath ];

  //save unique name
  activeFactories.push(_pipeName);

  var _officeThread = spawn(converterOptions.sofficeExecPath, _officeParams);
  _officeThread.on('close', generateOnExitCallback(_startListenerID, false, _pipeName));

  var _pythonThread = spawn(converterOptions.pythonExecPath, [pythonFile, '--pipe', _pipeName]);
  _pythonThread.on('close', generateOnExitCallback(_startListenerID, true, _pipeName));
  _pythonThread.stdout.on('data', generateOnDataCallback(_startListenerID));
  _pythonThread.stderr.on('data', function(err){
    console.log('Carbone: Python stderr :', err.toString());
  });

  if(_officeThread !== null && _pythonThread !== null){
    var _factory = {
      'mode' : 'pipe',
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
 * @param  {Integer} factoryID         factoryID
 * @param  {Boolean} isPythonProcess   true if the callback is used by the Python thread, false if it used by the Office Thread
 * @param  {String}  factoryUniqueName factory unique name (equals pipeName)
 * @return {Function}                  function(error)
 */
function generateOnExitCallback(factoryID, isPythonProcess, factoryUniqueName){
  return function (error) {
    var _processName = isPythonProcess === true ? 'Python' : 'Office'; 
    //ignore the second thread which has been killed after the first one.
    //For example, if officeThread is killed first, pythonThread will be killed immediately after so ignore the exitCallback of the second one
    if(activeFactories.indexOf(factoryUniqueName) === -1){
      console.log('Carbone: Associated process '+_processName+' killed too ');
      return;
    }

    var _factory = conversionFactory[factoryID];
    if(!_factory){
      throw new Error('Carbone: Process crashed but the factory is unknown!');
    }
    if(error!==null){
      console.log('Carbone: Process '+_processName+' killed '+error);
    }
    //the factory cannot receive jobs anymore
    _factory.isReady = false;
    _factory.isConverting = false;

    //remove it from activeFactories to avoid infinite loop
    activeFactories.splice(activeFactories.indexOf(factoryUniqueName), 1);

    //kill the associated thread immediately  
    if(isPythonProcess === true){
      _factory.pythonThread = null;
      _factory.officeThread.kill('SIGKILL');
      _factory.officeThread = null;
    }
    else{
      _factory.officeThread = null;
      _factory.pythonThread.kill('SIGKILL');
      _factory.pythonThread = null;
    }
    //if Carbone is not shutting down
    if(isAutoRestartActive === true){
      //if there is an error while converting a document, let's try another time 
      var _job = _factory.currentJob;
      if(_job){
        if(_job.nbAttempt < params.attempts){
          _factory.currentJob = null;
          jobQueue.push(_job);
        }
        else{
          _job.callback('Could not convert the document', null);
        }
      }
      addConversionFactory(executeQueue);
    }
    //else if Carbone is shutting down and there is an exitCallback
    else if(_factory.exitCallback){
      _factory.exitCallback();
      _factory.exitCallback = null;
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
    data = data.toString();
    if(data === '200' || data === '400'){ //Document converted
      var _job = _factory.currentJob;
      _factory.currentJob = null;
      _factory.isConverting = false;
      if(_job){
        _job.error = (data !== '400') ? null : 'Could not open document';
        if(_job.returnLink===true || data === '400'){
          _job.callback(_job.error);
          executeQueue();
        }
        else{
          fs.readFile(_job.outputFilePath, function(err, content){
            _job.callback(_job.error, content);
            try{
              fs.unlink(_job.outputFilePath);
            } catch(e){};
            executeQueue();
          });
        }
      }
    }
    else if (data === '204'){ //Ready to receive conversion
      console.log('Carbone: factory '+factoryID+' ready');
      _factory.isReady = true;
      if(_factory.readyCallback){
        _factory.readyCallback();
      }
      executeQueue();
    }
    else {
      console.log('Carbone: it should not print this message');
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
  if(activeFactories.length < params.factories){
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
  factory.pythonThread.stdin.write('--format="'+job.outputFormat+'" --input="'+job.inputFilePath+'" --output="'+job.outputFilePath+'" --formatOptions="'+job.formatOptions+'"\n');
  //keep the number of attempts to convert this file
  job.nbAttempt++;
}


/**
 * Detect If LibreOffice and python are available at startup
 * TODO: 
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
    var directories = fs.readdirSync('/opt');
    var isLibreOfficeFound = false;
    var patternLibreOffice = /libreoffice\d+\.\d+/;
    for (var i = 0; i < directories.length; i++) {
      if (patternLibreOffice.test(directories[i]) === true) {
        var directoryLibreOffice = '/opt/' + directories[i] + '/program';
        if(fs.existsSync(directoryLibreOffice + '/python') === true){
          converterOptions.pythonExecPath = directoryLibreOffice + '/python';
          converterOptions.sofficeExecPath = directoryLibreOffice + '/soffice';
          isLibreOfficeFound = true;
        }
      }
    }
    if (isLibreOfficeFound === false) {
      console.log(_redColor+'-- CarboneJS: cannot find LibreOffice.'+_resetColor);
    }
  }
  else{
    console.log(_redColor+'-- CarboneJS: your platform is not supported yet.'+_resetColor);
  }
}


detectLibreOffice();


module.exports = converter;