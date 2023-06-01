var path  = require('path');
var fs = require('fs');
var os = require('os');
var helper = require('./helper');
var spawn = require('child_process').spawn;
var params = require('./params');
var debug = require('debug')('carbone:converter');
var which = require('which');


/* Factories object */
var conversionFactory = {};
/* An active factory is a factory which is starting (but not started completely), running or stopping (but not stopped completely) */
var activeFactories = [];
/* Every conversion is placed in this job queue */
var jobQueue = [];
/* If true, a factory will restart automatically */
var isAutoRestartActive = true;

var isLibreOfficeFound = false;

var converterOptions = {
  /* Python path */
  pythonExecPath  : 'python',
  /* Libre Office executable path */
  sofficeExecPath : 'soffice',
  /* Delay before killing the other process (either LibreOffice or Python) when one of them died */
  delayBeforeKill : 500
};

/* get the total memory available on the system (unit: MB) */
const totalMemoryAvailableMB = os.totalmem() / 1024 / 1024;

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
        clearTimeout(_factory.timeoutId);
        _factory.exitCallback = factoryExitFn;
        // kill Python thread first.
        if (_factory.pythonThread !== null) {
          _factory.pythonThread.kill('SIGKILL');
        }
        if (_factory.officeThread !== null) {
          _factory.officeThread.kill('SIGKILL');
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
   * @param {string} outputType : destination type of format.js (ex. writer_pdf_Export for PDF)
   * @param {string} formatOptions : options string passed to convert
   * @param {string} outputFile : outputFile to generate
   * @param {function} callback(err, outputFile)
   */
  convertFile : function (inputFile, outputType, formatOptions, outputFile, callback, exportFilters={}) {

    if (isLibreOfficeFound === false) {
      return callback('Cannot find LibreOffice. Document conversion cannot be used');
    }

    let _export = '';
    let exportFiltersKeys = Object.keys(exportFilters);
    for (let i = 0, n = exportFiltersKeys.length; i< n;i++) {
      _export += `${exportFiltersKeys[i]}="${exportFilters[exportFiltersKeys[i]]}" `;
    }
    if (_export === '') {
      _export = '""';
    }

    var _job = {
      inputFilePath  : inputFile,
      outputFilePath : outputFile,
      outputFormat   : outputType,
      formatOptions  : formatOptions || '',
      callback       : callback,
      nbAttempt      : 0,
      error          : null,
      export         : _export
    };
    jobQueue.push(_job);
    executeQueue();
  },

  /**
   * Do we need to restart LibreOffice?
   *
   * Temporal fix for memory leaks of LibreOffice 6+
   *
   * @param  {Objecct} params
   * @param  {Integer} availableMemory system available memory
   * @param  {Integer} nbReports       nb reborts computed by one factory
   * @return {Boolean}                 true if LibreOffice must be restarted, false otherwise
   */
  shouldTheFactoryBeRestarted : function (params, availableMemory, nbReports) {
    const _percentageFactoryMemoryLoaded = nbReports * params.factoryMemoryFileSize * 100 / availableMemory;
    if (_percentageFactoryMemoryLoaded < params.factoryMemoryThreshold || params.factoryMemoryThreshold === 0) {
      return false;
    }
    return true;
  }

};


/** ***************************************************************************************************************/
/* Private methods */
/** ***************************************************************************************************************/


/**
 * Add a LibreOffice + Python factory (= 2 threads)
 *
 * WARNING: the callback must be used only by converter.init()
 *
 * @param {function} callback : function() called when the factory is ready to convert documents.
 */
function addConversionFactory (callback) {
  debug('ask to add a conversion factory');
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
    if (callback) {
      callback();
    }
    return;
  }
  var _uniqueName = helper.getUID();

  // generate a unique path to a fake user profile. We cannot start multiple instances of LibreOffice if it uses the same user cache
  var _userCachePath = path.join(params.tempPath, '_office_' + _uniqueName);
  if (_prevFactory) {
    // re-use previous directory if possible (faster restart)
    if (_prevFactory.userCachePath !== undefined) {
      _userCachePath = _prevFactory.userCachePath;
    }
    // If soffice crashes as soon as it was started, the callback of the previous starting process must be passed to the new started factory
    // On Linux, it happens when LibreOffice creates its directory for the first time (oosplash seems to hide this)
    if (_prevFactory.readyCallback) {
      callback = _prevFactory.readyCallback;
    }
  }
  // generate a URL in LibreOffice's format so that it's portable across OSes:
  // see: https://wiki.openoffice.org/wiki/URL_Basics
  var _userCacheURL = convertToURL(_userCachePath);
  initLibreOfficeUserConfig (_userCachePath, () => {
    // generate a unique pipe name
    var _pipeName = params.pipeNamePrefix + '_' +_uniqueName;
    var _connectionString = 'pipe,name=' + _pipeName + ';urp;StarOffice.ComponentContext';
    var _officeParams = ['--headless', '--invisible', '--nocrashreport', '--nodefault', '--nologo', '--nofirststartwizard', '--norestore',
      '--quickstart', '--nolockcheck', '--accept='+_connectionString, '-env:UserInstallation='+_userCacheURL ];

    // save unique name
    activeFactories.push(_pipeName);

    var _officeThread = spawn(converterOptions.sofficeExecPath, _officeParams);
    _officeThread.on('close', generateOnExitCallback(_startListenerID, false, _pipeName));
    debug('office thread started with PID ' + _officeThread.pid);

    var _pythonThread = spawn(converterOptions.pythonExecPath, [params.pythonPath, '--pipe', _pipeName]);
    debug('python thread started with PID ' + _pythonThread.pid);
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
        readyCallback : callback,
        nbrReports    : 0,
        timeoutId     : null
      };
      conversionFactory[_startListenerID] = _factory;
    }
    else {
      throw new Error('Carbone: Cannot start LibreOffice or Python Thread');
    }
  });
}

/**
 * Kill one LibreOffice factory
 *
 * @param  {Object} factory
 */
function killFactory (factory) {
  if (factory.isReady === false) {
    return;
  }
  factory.isReady      = false;
  factory.isConverting = false;
  factory.nbrReports   = 0;
  clearTimeout(factory.timeoutId);
  if (factory.officeThread !== null) {
    factory.officeThread.kill('SIGKILL');
  }
  else if (factory.pythonThread !== null) {
    factory.pythonThread.kill('SIGKILL');
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
    clearTimeout(_factory.timeoutId);

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

    debug('process '+_processName+' (PID ' +_factory.pid+ ') of factory '+factoryID+' died ' + error);

    // if both processes Python and Office are off...
    if (_factory.pythonThread === null && _factory.officeThread === null) {
      debug('factory '+factoryID+' is completely off');
      // remove factory from activeFactories to avoid infinite loop
      activeFactories.splice(activeFactories.indexOf(factoryUniqueName), 1);
      whenFactoryIsCompletelyOff(_factory);
    }
    else {
      _otherThreadToKill.kill('SIGKILL');
      // Fixes #12
      // SIGKILL to make sure everything is off
      //
      // Be careful, LibreOffice has two threads oosplash (parent) -> soffice (child) if launched with "soffice".
      // On Linux, we decided to launch the child process directly to simplify the thread management.
      // Otherwise, only oosplash is killed if SIGKILL is sent. In that case:
      //   - The child "soffice" is still alive and stdin, stdout and stderr of are not closed automatically.
      //   - The event "spawn.close" is received only if stdin, stdout and stderr are closed. So carbone hangs indefinitely :(
      // When killing the oospash parent process, we should close stdin, stdout and stderr and kill the child thread soffice ourself (like "pkill soffice")
      //
      // Also, we could use SIGTERM. In that case, oosplash (parent) sends the signal to its child... but this signal is not powerful enough to 
      // guarantee a shutdown. If LibreOffice hangs, we could wait forever.
      //
      // It is easier to only launch directly soffice.bin directly on Linux (see below)
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
    if (factory.currentJob) {
      // if there is an error while converting a document, let's try another time
      factory.currentJob.error = new Error('Could not convert the document');
    }
    onCurrentJobEnd(factory);
    // avoid restarting too early
    setTimeout(addConversionFactory, 50);
  }
  // else if Carbone is shutting down and there is an exitCallback
  else {
    // TODO delete async
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
    // Ready to receive document conversion
    if (data === '204') {
      debug('factory '+factoryID+' ready');
      _factory.isReady = true;
      if (_factory.readyCallback) {
        _factory.readyCallback();
        // void readyCallback to avoid calling it twice when the factory object is re-used.
        _factory.readyCallback = null;
      }
      return executeQueue();
    }
    // Document converted with or without errors
    if (_factory.currentJob) {
      _factory.currentJob.error = (pythonErrors[data] !== undefined) ? new Error(pythonErrors[data]) : null;
    }
    onCurrentJobEnd(_factory);
  };
}

/**
 * Called when the job is finished
 *
 * @param  {Object} factory factory object
 */
function onCurrentJobEnd (factory) {
  var _job = factory.currentJob;
  factory.currentJob = null;
  factory.isConverting = false;
  clearTimeout(factory.timeoutId);
  if (_job && _job.callback instanceof Function) {
    // save the number of report converted to check the memory level of the LO process
    // if it reach a threshold, the LO process is killed
    if (converter.shouldTheFactoryBeRestarted(params, totalMemoryAvailableMB, ++factory.nbrReports) === true) {
      killFactory(factory);
    }
    _job.callback(_job.error, _job.outputFilePath);
  }
  executeQueue();
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
    addConversionFactory();
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
  factory.pythonThread.stdin.write(`--format="${job.outputFormat}" --input="${job.inputFilePath}" --output="${job.outputFilePath}" --formatOptions="${job.formatOptions}" --export ${job.export}\n`);
  // keep the number of attempts to convert this file
  job.nbAttempt++;
  // Timeout to kill long conversions
  if (params.converterFactoryTimeout > 0) {
    clearTimeout(factory.timeoutId); // by security
    factory.timeoutId = setTimeout(function () {
      job.nbAttempt = params.attempts; // do not retry
      job.error = new Error('Document conversion timeout reached ('+params.converterFactoryTimeout+' ms)');
      killFactory(factory);
      onCurrentJobEnd(factory);
    }, params.converterFactoryTimeout);
  }
}


/**
 * Error for path
 *
 * @param {[type]} message [description]
 */
function PathError (message) {
  this.name = 'PathError';
  this.code = 'PathError';
  this.message = message || 'Failed to convert path';
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, PathError);
  }
}
PathError.prototype = new Error();

/**
 * Convert an absolute path to an absolute URL understood by LibreOffice and
 *  OpenOffice. This is necessary because LO/OO use a cross-platform path format
 *  that does not match paths understood natively by OSes.
 * If the input is already a URL, it is returned as-is.
 *
 * @param {string} inputPath - An absolute path to convert to a URL.
 * @returns {string} A string suitable for use with LibreOffice as an absolute file path URL.
 */
function convertToURL (inputPath) {
  // Guard clause: if it already looks like a URL, keep it that way.
  if (inputPath.slice(0, 8) === 'file:///') {
    return inputPath;
  }
  if (!path.isAbsolute(inputPath)) {
    throw new PathError('Paths to convert must be absolute');
  }
  // Split into parts so that we can join into a URL:
  var _normalizedPath = path.normalize(inputPath);
  // (Use both delimiters blindly - we're aiming for maximum compatibility)
  var _pathComponents = _normalizedPath.split(/[\\/]/);
  // Make sure there is no leading empty element, since we always add a leading "/" anyway.
  if (_pathComponents[0] === '') {
    _pathComponents.shift();
  }
  var outputURL = 'file:///' + _pathComponents.join('/');
  return outputURL;
}


/**
 * Detect If LibreOffice and python are available at startup
 */
function detectLibreOffice (additionalPaths) {
  function _findBundledPython (sofficePath, pythonName) {
    if (!sofficePath) {
      return null;
    }
    // Try finding a Python binary shipped alongside the soffice binary,
    //  either in its actual directory, or - if it's a symbolic link -
    //  in the directory it points to.
    var _sofficeActualDirectory;
    var _symlinkDestination;
    try {
      _symlinkDestination = path.resolve(path.dirname(sofficePath), fs.readlinkSync(sofficePath));
      // Assume symbolic link, will throw in case it's not:
      _sofficeActualDirectory = path.dirname(_symlinkDestination);
    }
    catch (errorToIgnore) {
      // Not a symlink.
      _sofficeActualDirectory = path.dirname(sofficePath);
    }
    // Check for the Python binary in the actual soffice path:
    try {
      return which.sync(pythonName, { path : _sofficeActualDirectory });
    }
    catch (errorToIgnore) {
      // No bundled Python found.
      return null;
    }
  }

  function _findBinaries (paths, pythonName, sofficeName) {
    var _whichPython;
    var _whichSoffice;
    // Look for the soffice binary - first in the well-known paths, then in
    //  the system PATH. On Linux, this prioritizes "upstream" (TDF) packages
    //  over distro-provided ones from the OS' repository.
    _whichSoffice = which.sync(sofficeName, { path : paths.join(':'), nothrow : true }) || which.sync(sofficeName, { nothrow : true }) || null;
    // Check for a Python binary bundled with soffice, fall back to system-wide:
    // This is a bit more complex, since we deal with some corner cases.
    // 1. Hopefully use the python from the original soffice package, same dir
    //  (this might fail on Mac if python is not in MacOS/, but in Resources/).
    // 1a. Corner case: on Linux, if soffice was in /usr/bin/soffice and NOT
    //  a symlink, then we would hit /usr/bin/python, which is probably python2.
    //  This is why we try with python3 first, to defend against this.
    // 2. Try finding it in any of the well-known paths - this might result in
    //  using Python from *another install* of LibreOffice, but it should be ok.
    //  This is only attempted if the paths exist on this system to avoid
    //  a fallback to system PATH that "which" does when passed an empty string.
    // 3. Fall back to system python (hopefully named python3).
    _whichPython = _findBundledPython(_whichSoffice, 'python3') ||
                  _findBundledPython(_whichSoffice, 'python') ||
                  (paths.length > 0 && which.sync('python3', { path : paths.join(':'), nothrow : true })) ||
                  (paths.length > 0 && which.sync('python', { path : paths.join(':'), nothrow : true })) ||
                  which.sync('python3', { nothrow : true }) ||
                  which.sync('python', { nothrow : true }) || null;
    return {
      soffice : _whichSoffice,
      python  : _whichPython
    };
  }

  function _listProgramDirectories (basePath, pattern) {
    try {
      return fs.readdirSync(basePath).filter(function _isLibreOfficeDirectory (dirname) {
        return pattern.test(dirname);
      }).map(function _buildFullProgramPath (dirname) {
        return path.join(basePath, dirname, 'program');
      });
    }
    catch (errorToIgnore) {
      return [];
    }
  }

  var _pathsToCheck = additionalPaths || [];
  // overridable file names to look for in the checked paths:
  var _pythonName = 'python';
  var _sofficeName = 'soffice';
  var _linuxDirnamePattern = /^libreoffice\d+\.\d+$/;
  var _windowsDirnamePattern = /^LibreOffice( \d+(?:\.\d+)*?)?$/i;

  if (process.platform === 'darwin') {
    _pathsToCheck = _pathsToCheck.concat([
      // It is better to use the python bundled with LibreOffice:
      '/Applications/LibreOffice.app/Contents/MacOS',
      '/Applications/LibreOffice.app/Contents/Resources'
    ]);
  }
  else if (process.platform === 'linux') {
    // on Linux, avoid oosplash parent process to simplify SIGKILL propagation. Launch directly soffice.bin.
    // Fixes #12
    _sofficeName = 'soffice.bin';
    // The Document Foundation packages (.debs, at least) install to /opt,
    // into a directory named after the contained LibreOffice version.
    // Add any existing directories that match this to the list.
    _pathsToCheck = _pathsToCheck.concat(_listProgramDirectories('/opt', _linuxDirnamePattern));
  }
  else if (process.platform === 'win32') {
    _pathsToCheck = _pathsToCheck
      .concat(_listProgramDirectories('C:\\Program Files', _windowsDirnamePattern))
      .concat(_listProgramDirectories('C:\\Program Files (x86)', _windowsDirnamePattern));
    _pythonName = 'python.exe';
  }
  else {
    debug('your platform "%s" is not supported yet', process.platform);
  }

  // Common logic for all OSes: perform the search and save results as options:
  var _foundPaths = _findBinaries(_pathsToCheck, _pythonName, _sofficeName);
  if (_foundPaths.soffice) {
    debug('LibreOffice found: soffice at %s, python at %s', _foundPaths.soffice, _foundPaths.python);
    isLibreOfficeFound = true;
    converterOptions.pythonExecPath = _foundPaths.python;
    converterOptions.sofficeExecPath = _foundPaths.soffice;
  }

  if (isLibreOfficeFound === false) {
    debug('cannot find LibreOffice. Document conversion cannot be used');
  }
}

detectLibreOffice();

['SIGINT', 'SIGHUP', 'SIGQUIT'].forEach(function (signal) {
  process.on(signal, function () {
    converter.exit();
  });
});


process.on('exit', function () {
  converter.exit();
});


/**
 * Initializes the Libre office configuration for maximum security
 *
 * These properties can be defined in 3 levels, the default config, admin config and user config.
 * Here we define the user configuration for each thread.
 *
 * https://github.com/LibreOffice/core/blob/master/officecfg/registry/schema/org/openoffice/Office/Common.xcs
 * https://people.freedesktop.org/~vmiklos/2013/oor-document-format.html
 * https://ask.libreoffice.org/t/admin-configuration/8005
 *
 *  * Official recommendation from BSI (ANSI for Germany) :  https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_146.pdf?__blob=publicationFile&v=7
 *
 * @param {<type>}  parentPath  The parent path
 */
function initLibreOfficeUserConfig (parentPath, callback) {

  const _defaultConfig = ''
  + '<?xml version="1.0" encoding="UTF-8"?>'
  + '<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'

  // Fix charts when converting a DOCX to PDF. If the document contains more charts, charts are distorted / blurry (20 by default)
  + '<item oor:path="/org.openoffice.Office.Common/Cache/Writer"><prop oor:name="OLE_Objects" oor:op="fuse"><value>500</value></prop></item>'
  // Determines the maximum number of OLE objects that can be held in RAM for drawings, presentations and inserted drawing objects.
  // The more OLE objects in RAM, the faster you can page through the objects since they do not always need to be loaded from the hard drive. (200 by default)
  + '<item oor:path="/org.openoffice.Office.Common/Cache/DrawingEngine"><prop oor:name="OLE_Objects" oor:op="fuse"><value>500</value></prop></item>'
  // Specifies number of PDF image instances to cache on export - can save potentially huge amount of CPU time on re-compressing the same JPEG image over and over again (15 by default)
  + '<item oor:path="/org.openoffice.Office.Common/VCL"> <prop oor:name="PDFExportImageCacheSize" oor:op="fuse"> <value>50</value></prop></item>'

  // TODO activate all these new parameters step by step. How many document contains macro in our storage?

  //  // Specifies the allowed cumulated memory that the graphic objects can occupy before they start to get swapped to the disk to save memory (30000000 by default)
  //  + '<item oor:path="/org.openoffice.Office.Common/Cache/GraphicManager"><prop oor:name="GraphicMemoryLimit" oor:op="fuse"><value>30000000</value></prop></item>'
  //  // Specifies the maximum cache size in bytes for all glyphs used when laying out text. Larger size may improve text drawing performance in large documents (20000000 by default)
  //  + '<item oor:path="/org.openoffice.Office.Common/Cache/Font"><prop oor:name="GlyphsCacheSize" oor:op="fuse"><value>20000000</value></prop></item>'
  //  // Specifies the maximum cache size in bytes for all text run data used when laying out text. Larger size may improve text drawing performance in large documents. (100000 by default)
  //  + '<item oor:path="/org.openoffice.Office.Common/Cache/Font"><prop oor:name="TextRunsCacheSize" oor:op="fuse"><value>100000</value></prop></item>'
  //  // Specifies the maximum cache size in bytes for all images used by Skia-based drawing code. Larger size may improve drawing performance when using many large images in software rendering mode (64000000 by default)
  //  + '<item oor:path="/org.openoffice.Office.Common/Cache/Skia"><prop oor:name="ImageCacheSize" oor:op="fuse"><value>64000000</value></prop></item>'
  //
  //  // TODO: Removes author, revision author and commments?
  //  // + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="RemovePersonalInfoOnSaving" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //
  //  // TODO: test Images won't be loaded anymore?
  //  // Fix CVE-2018-10583  https://www.libreoffice.org/about-us/security/advisories/cve-2018-10583/
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="BlockUntrustedRefererLinks" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //  // Highest macro security
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse" oor:type="xs:int"><value>3</value></prop></item>'
  //  // Deactivate macro
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="DisableMacrosExecution" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //  // Disallow loading exotic file format to reduce attack surface:
  //  // AbiWord Document, T602 Document, StarOffice XML (Base), StarOffice XML (Writer), X PixMap (XPM), Hangul Office (HWP), Documents Mac Office hérités
  //  + '<item oor:path="/org.openoffice.Office.Common/Security"><prop oor:name="LoadExoticFileFormats" oor:op="fuse" oor:type="xs:int"><value>0</value></prop></item>'
  //
  //  // Determines if the user has access to the entire configuration via the Expert Configuration button.
  //  + '<item oor:path="/org.openoffice.Office.Common/Security"><prop oor:name="EnableExpertConfiguration" oor:type="xs:boolean" oor:op="fuse"><value>false</value></prop></item>'
  //
  //  // Never handle Office Basic scripts
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="OfficeBasic" oor:op="fuse" oor:type="xs:int"><value>0</value></prop></item>'
  //  // Specifies whether execution of plugins found inside a document is allowed
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="ExecutePlugins" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  // Warn on load when a document binds an event to a macro (no warning, keep on, macro are disabled)
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="CheckDocumentEvents" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //  // List of script URLS which are allowed to be called by document events (NONE, ex: vnd.sun.star.script:Standard.Module1)
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="AllowedDocumentEventURLs" oor:op="fuse" oor:type="oor:string-list"/> </item>'
  //  // List of safe file path to execute macro (none)
  //  + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting" oor:type="oor:string-list"><prop oor:name="SecureURL" oor:op="fuse"/></item>'
  //
  //  // TODO: relative file URL ???
  //  // + '<item oor:path="/org.openoffice.Office.Common/Filter/PDF/Export"><prop oor:name="ExportLinksRelativeFsys" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //
  //  // Contains a list of URLs that should be accessed using system credentials of the user (none)
  //  + '<item oor:path="/org.openoffice.Office.Common/Passwords"><prop oor:name="AuthenticateUsingSystemCredentials" oor:op="fuse" oor:type="oor:string-list"/></item>'
  //  // Specifies if authentication using system credentials should be tried automatically for all resources that support it
  //  + '<item oor:path="/org.openoffice.Office.Common/Passwords"><prop oor:name="TrySystemCredentialsFirst" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //
  //  // TODO: Without time servers, we cannot create signed PDF with hashed timestamp?
  //  // + '<item oor:path="/org.openoffice.Office.Common/Security/Scripting">'
  //  //   <prop oor:name="TSAURLs" oor:op="fuse" oor:type="oor:string-list">
  //  //     <value>
  //  //       <it>http://zeitstempel.dfn.de</it>
  //  //       <it>https://freetsa.org/tsr</it>
  //  //     </value>
  //  //   </prop>
  //  // </item>
  //
  //  // do not store password
  //  + '<item oor:path="/org.openoffice.Office.Common/Passwords"><prop oor:name="UseStorage" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  // list of URL using system credential (NONE)
  //  + '<item oor:path="/org.openoffice.Office.Common/Passwords"><prop oor:name="AuthenticateUsingSystemCredentials" oor:op="fuse" oor:type="oor:string-list"/></item>'
  //  + '<item oor:path="/org.openoffice.Office.Common/Passwords"><prop oor:name="TrySystemCredentialsFirst" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  // No auto update
  //  + '<item oor:path="/org.openoffice.Office.Jobs/Jobs/org.openoffice.Office.Jobs:Job[\'UpdateCheck\']/Arguments"><prop oor:name="AutoCheckEnabled" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  + '<item oor:path="/org.openoffice.Office.Jobs/Jobs/org.openoffice.Office.Jobs:Job[\'UpdateCheck\']/Arguments"><prop oor:name="ExtendedUserAgent" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  // Disable etxension installation
  //  + '<item oor:path="/org.openoffice.Office.ExtensionManager/ExtensionSecurity"><prop oor:name="DisableExtensionInstallation" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //  + '<item oor:path="/org.openoffice.Office.ExtensionManager/ExtensionSecurity"><prop oor:name="DisableExtensionRemoval" oor:op="fuse" oor:type="xs:boolean"><value>true</value></prop></item>'
  //  // disable automatic installation of (font, lang, ...)
  //  + '<item oor:path="/org.openoffice.Office.Common/PackageKit"><prop oor:name="EnableFontInstallation" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop> </item>'
  //  + '<item oor:path="/org.openoffice.Office.Common/PackageKit"><prop oor:name="EnableLangpackInstallation" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop> </item>'
  //  + '<item oor:path="/org.openoffice.Office.Common/PackageKit"><prop oor:name="EnableBaseInstallation" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  //  // disable usage collection
  //  + '<item oor:path="/org.openoffice.Office.Common/Misc"><prop oor:name="CrashReport" oor:op="fuse" oor:type="xs:boolean"><value>false</value></prop></item>'
  + '</oor:items>';

  const _userPath = path.join(parentPath, 'user');
  const _configPath = path.join(_userPath, 'registrymodifications.xcu');
  fs.mkdir(_userPath, { recursive : true, mode : '0755' } , () => {
    fs.writeFile(_configPath, _defaultConfig, function (err) {
      if (err) {
        console.log('ERROR: Cannot write LibreOffice user config in ' + _configPath + '\n' + err);
        console.log('WARNING: LibreOffice is started with default configuration (not safe)');
      }
      callback();
    });
  });
}

module.exports = converter;
