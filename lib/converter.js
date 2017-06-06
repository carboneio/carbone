var path  = require('path');
var fs = require('fs');
var helper = require('./helper');
var spawn = require('child_process').spawn;
var params = require('./params');
var debug = require('debug')('carbone:converter');

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
  pythonExecPath  : 'python',
  /* Libre Office executable path */
  sofficeExecPath : 'soffice',
  /* Delay before killing the other process (either LibreOffice or Python) when one of them died */
  delayBeforeKill : 500
};


var pythonErrors = {
  1   : 'Global error',
  100 : 'Existing office server not found',
  400 : 'Could not open document',
  401 : 'Could not convert document'
};


var converter = {

  /**
   * Initialize the converter.
   * @param {Object}   options : same options as carbone's options
   * @param {function} callback(factory): called when all factories are ready. if startFactory is true, the first parameter will contain the object descriptor of all factories
   */
  init : function (options, callback) {
    if (typeof(options) === 'function') {
      callback = options;
    }
    else {
      for (var attr in options) {
        if (params[attr]!== undefined) {
          params[attr] = options[attr];
        }
        else {
          throw Error('Undefined options :' + attr);
        }
      }
    }
    // restart Factory automatically if it crashes. 
    isAutoRestartActive = true;
   
    // if we must start all factory now
    if (params.startFactory === true) {
      // and if the maximum of factories is not reached
      if (activeFactories.length < params.factories) {
        var _nbFactoriesStarting=0;
        for (var i = 0; i < params.factories; i++) {
          _nbFactoriesStarting++;
          addConversionFactory(function () {
            // here all factories are ready
            _nbFactoriesStarting--;
            if (_nbFactoriesStarting === 0 && callback) {
              callback(conversionFactory);
            }
          });
        }
      }
    }
    else {
      // else, start LibreOffice when needed 
      if (callback) {
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
  exit : function (callback) {
    isAutoRestartActive = false;
    jobQueue = [];
    for (var i in conversionFactory) {
      var _factory = conversionFactory[i];
      // if a factory is running
      if (_factory && (_factory.pythonThread !== null || _factory.officeThread !== null)) {
        _factory.exitCallback = factoryExitFn;
        // kill Python thread first.
        if (_factory.pythonThread !== null) {
          _factory.pythonThread.kill();
        }
        if (_factory.officeThread !== null) {
          _factory.officeThread.kill();
          helper.rmDirRecursive(_factory.userCachePath);
        }
      }
    }
    // if all factories are already off
    if (activeFactories.length === 0) {
      factoryExitFn();
    }

    function factoryExitFn () {
      if (activeFactories.length === 0) {
        conversionFactory = {};
        debug('exit!');
        if (callback !== undefined) {
          callback();
        }
      }
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
  convertFile : function (inputFile, outputType, formatOptions, callback, returnLink, outputFile) {
    var _output = helper.getUID();
    var _job = {
      inputFilePath  : inputFile,
      outputFilePath : outputFile || path.join(params.tempPath, _output),
      outputFormat   : outputType,
      formatOptions  : formatOptions || '',
      returnLink     : returnLink || false,
      callback       : callback,
      nbAttempt      : 0,
      error          : null
    };
    jobQueue.push(_job);
    executeQueue();
  }

};


/** ***************************************************************************************************************/
/* Private methods */
/** ***************************************************************************************************************/


/**
 * Add a LibreOffice + Python factory (= 2 threads)
 * @param {function} callback : function() called when the factory is ready to convert documents.
 */
function addConversionFactory (callback) {
  // find a free factory
  var _prevFactory = {};
  var _startListenerID = -1;
  for (var i = 0; i < params.factories; i++) {
    _prevFactory = conversionFactory[i];
    if (_prevFactory === undefined) {
      _startListenerID = i;
      break;
    }
    else if (_prevFactory.pythonThread === null && _prevFactory.officeThread === null) {
      _startListenerID = i;
      break;
    }
  }
  // maximum of factories reached
  if (_startListenerID === -1) {
    return callback();
  }
  var _uniqueName = helper.getUID();
  
  // generate a unique path to a fake user profile. We cannot start multiple instances of LibreOffice if it uses the same user cache
  var _userCachePath = path.join(params.tempPath, '_office_' + _uniqueName);
  if (_prevFactory && _prevFactory.userCachePath !== undefined) {
    // re-use previous directory if possible (faster restart)
    _userCachePath = _prevFactory.userCachePath;
  }

  // generate a unique pipe name
  var _pipeName = params.pipeNamePrefix + '_' +_uniqueName;
  var _connectionString = 'pipe,name=' + _pipeName + ';urp;StarOffice.ComponentContext';
  var _officeParams = ['--headless', '--invisible', '--nocrashreport', '--nodefault', '--nologo', '--nofirststartwizard', '--norestore',
    '--quickstart', '--nolockcheck', '--accept='+_connectionString, '-env:UserInstallation=file://'+_userCachePath ];

  // save unique name
  activeFactories.push(_pipeName);

  var _officeThread = spawn(converterOptions.sofficeExecPath, _officeParams);
  _officeThread.on('close', generateOnExitCallback(_startListenerID, false, _pipeName));

  var _pythonThread = spawn(converterOptions.pythonExecPath, [pythonFile, '--pipe', _pipeName]);
  _pythonThread.on('close', generateOnExitCallback(_startListenerID, true, _pipeName));
  _pythonThread.stdout.on('data', generateOnDataCallback(_startListenerID));
  _pythonThread.stderr.on('data', function (err) {
    debug('python stderr :', err.toString());
  });

  if (_officeThread !== null && _pythonThread !== null) {
    var _factory = {
      mode          : 'pipe',
      pipeName      : _pipeName,
      userCachePath : _userCachePath,
      pid           : _officeThread.pid,
      officeThread  : _officeThread,
      pythonThread  : _pythonThread,
      isReady       : false,
      isConverting  : false,
      readyCallback : callback
    };
    conversionFactory[_startListenerID] = _factory;
  }
  else {
    throw new Error('Carbone: Cannot start LibreOffice or Python Thread');
  }
}


/**
 * Generate a callback which is used to handle thread error and exit
 * @param  {Integer} factoryID         factoryID
 * @param  {Boolean} isPythonProcess   true if the callback is used by the Python thread, false if it used by the Office Thread
 * @param  {String}  factoryUniqueName factory unique name (equals pipeName)
 * @return {Function}                  function(error)
 */
function generateOnExitCallback (factoryID, isPythonProcess, factoryUniqueName) {
  return function (error) {
    var _processName = ''; 
    var _otherThreadToKill = null;

    // get factory object
    var _factory = conversionFactory[factoryID];
    if (!_factory) {
      throw new Error('Carbone: Process crashed but the factory is unknown!');
    }

    // the factory cannot receive jobs anymore
    _factory.isReady = false;
    _factory.isConverting = false;

    // if the Python process died...
    if (isPythonProcess === true) {
      _processName = 'Python';
      _factory.pythonThread = null;
      _otherThreadToKill = _factory.officeThread;
    }
    else {
      _processName = 'Office';
      _factory.officeThread = null;
      _otherThreadToKill = _factory.pythonThread;
    }

    debug('process '+_processName+' of factory '+factoryID+' died ' + error);
      
    // if both processes Python and Office are off...
    if (_factory.pythonThread === null && _factory.officeThread === null) {
      debug('factory '+factoryID+' is completely off');
      // remove factory from activeFactories to avoid infinite loop
      activeFactories.splice(activeFactories.indexOf(factoryUniqueName), 1);
      whenFactoryIsCompletelyOff(_factory);
    }
    else {
      _otherThreadToKill.kill('SIGKILL'); 
    }
  };
}


/**
 * Manage factory restart ot shutdown when a factory is completly off 
 * @param  {Object} factory factory description
 */
function whenFactoryIsCompletelyOff (factory) {
  // if Carbone is not shutting down
  if (isAutoRestartActive === true) {
    // if there is an error while converting a document, let's try another time 
    var _job = factory.currentJob;
    if (_job) {
      if (_job.nbAttempt < params.attempts) {
        factory.currentJob = null;
        jobQueue.push(_job);
      }
      else {
        _job.callback('Could not convert the document', null);
      }
    }
    // avoid restarting too early
    setTimeout(function () {
      addConversionFactory(executeQueue);
    },50);
  }
  // else if Carbone is shutting down and there is an exitCallback
  else { 
    // delete office files synchronously (we do not care because Carbone is shutting down) when office is dead 
    helper.rmDirRecursive(factory.userCachePath);
    if (factory.exitCallback) {
      factory.exitCallback();
      factory.exitCallback = null;
    }
  }
}


/**
 * Generate a callback which handle communication with the Python thread
 * @param  {Integer} factoryID factoryID
 * @return {Function}          function(data)
 */
function generateOnDataCallback (factoryID) {
  return function (data) {
    var _factory = conversionFactory[factoryID];
    data = data.toString();
    if (data !== '204') { // Document converted
      var _job = _factory.currentJob;
      _factory.currentJob = null;
      _factory.isConverting = false;
      if (_job) {
        _job.error = (pythonErrors[data] !== undefined) ? pythonErrors[data]  : null;
        if (_job.returnLink===true || _job.error !== null) {
          if (_job.error && _job.nbAttempt < params.attempts) {
            debug(_job.error + ': attempt '+_job.nbAttempt, _job);
            _job.error = null;
            jobQueue.push(_job);
          }
          else {
            _job.callback(_job.error);
          }
          executeQueue();
        }
        else {
          fs.readFile(_job.outputFilePath, function (err, content) {
            _job.callback(_job.error, content);
            fs.unlink(_job.outputFilePath, function (err) {
              if (err) {
                debug('cannot remove file' + _job.outputFilePath);
              }
            });
            executeQueue();
          });
        }
      }
    }
    else if (data === '204') { // Ready to receive conversion
      debug('factory '+factoryID+' ready');
      _factory.isReady = true;
      if (_factory.readyCallback) {
        _factory.readyCallback();
      }
      executeQueue();
    }
    else {
      debug('it should not print this message');
    }
  };
}


/**
 * Execute the queue of conversion.
 * It will auto executes itself until the queue is empty
 */
function executeQueue () {
  if (jobQueue.length===0) {
    return;
  }
  // if there is no active factories, start them
  if (activeFactories.length < params.factories) {
    addConversionFactory(executeQueue);
    return;
  }
  for (var i in conversionFactory) {
    if (jobQueue.length > 0) {
      var _factory = conversionFactory[i];
      if (_factory.isReady === true && _factory.isConverting === false) {
        var _job = jobQueue.shift();
        sendToFactory(_factory, _job);
      }
    }
  }
}

/**
 * Send the document to the Factory
 *
 * @param {object} factory : LibreOffice + Python factory to send to
 * @param {object} job : job description (file to convert, callback to call when finished, ...)
 */
function sendToFactory (factory, job) {
  factory.isConverting = true;
  factory.currentJob = job;
  factory.pythonThread.stdin.write('--format="'+job.outputFormat+'" --input="'+job.inputFilePath+'" --output="'+job.outputFilePath+'" --formatOptions="'+job.formatOptions+'"\n');
  // keep the number of attempts to convert this file
  job.nbAttempt++;
}


/**
 * Detect If LibreOffice and python are available at startup
 */
function detectLibreOffice () {

  if (process.platform === 'darwin') {
    // it is better to use the python bundled with LibreOffice
    var _path = 'MacOS';
    if (fs.existsSync('/Applications/LibreOffice.app/Contents/' + _path + '/python') === false) {
      _path = 'Resources';
    }

    if (fs.existsSync('/Applications/LibreOffice.app/Contents/' + _path + '/python') === true) {
      converterOptions.pythonExecPath = '/Applications/LibreOffice.app/Contents/' + _path + '/python';
      converterOptions.sofficeExecPath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
    }
    else {
      debug('cannot find LibreOffice');
    }
  }
  else if (process.platform === 'linux') {
    var directories = fs.readdirSync('/opt');
    var isLibreOfficeFound = false;
    var patternLibreOffice = /libreoffice\d+\.\d+/;
    for (var i = 0; i < directories.length; i++) {
      if (patternLibreOffice.test(directories[i]) === true) {
        var directoryLibreOffice = '/opt/' + directories[i] + '/program';
        if (fs.existsSync(directoryLibreOffice + '/python') === true) {
          converterOptions.pythonExecPath = directoryLibreOffice + '/python';
          converterOptions.sofficeExecPath = directoryLibreOffice + '/soffice';
          isLibreOfficeFound = true;
        }
      }
    }
    if (isLibreOfficeFound === false) {
      debug('cannot find LibreOffice. Document conversion cannot be used');
    }
  }
  else {
    debug('your platform is not supported yet');
  }
}


detectLibreOffice();

process.on('exit', function () {
  converter.exit();
});

module.exports = converter;