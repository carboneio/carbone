const fs = require('fs');
const path = require('path');
const cors = require('cors');
const params = require('./params');
const helper = require('./helper');
const formidable = require('formidable');
const converter = require('./converter');
const bodyParser = require('body-parser');
const package = require('../package.json');
const restana = require('restana');
const kittenJwt = require('kitten-jwt');
const { exec } = require('child_process');
const { pipeline, finished } = require('stream');
// require carbone only after setting params.renderPath.
// Carbone automatically creates renderPath directory in operating system TEMP dir if it does not exist.
// We avoid this by loading carbone after reading workdir from CLI or env variables
let carbone = {};

let authAddon = null;
let storageAddon = null;
let middlewares = null;
let service = null;
let status = {
  state   : null,
  message : ''
};
let statusRenderInterval = null;
let cleanInterval = null;
const AUTH_KEY_NAME = 'key';
const STATUS_RENDER_INTERVAL_TIME = 10000;
const CLEAN_INTERVAL_TIME = 60 * 60 * 1000;
const SERVER_TIMEOUT = 20000;
const MAX_TEMPLATE_SIZE = 20 * 1024 * 1024;

const errorCode = {
  w100 : () => 'Template not found',
  w101 : (error) => `Error while rendering template ${error}`,
  w102 : () => 'Rendered file does not exist',
  w103 : () => 'Cannot find template extension, does it exists?',
  w104 : () => 'File not found',
  w105 : () => 'Cannot remove template, does it exist?',
  w106 : () => 'Content-Type header should be multipart/form-data',
  w107 : () => 'Try uploading your file using form data',
  w108 : () => 'Cannot calculate hash id',
  w109 : () => 'Cannot write template',
  w110 : () => 'Content-Type header is not application/json',
  w111 : () => 'Missing data key in body',
  w112 : () => '"template" field is empty',
  w113 : () => 'Service cannot render template',
  w114 : () => 'Cannot execute beforeRender'
};

var usage = [
  '\n***********************************************************************',
  ' Server usage:',

  '\n # carbone webserver --port 4000 --workdir /var/www/carbone',
  '\t Start a carbone webserver by default on port '+params.port,
  '\t --port [-p] port number ('+params.port+') ',

  '\t --workdir [-w] working directory of carbone ('+params.workDir+') ',

  '\n # carbone webserver --help',
  '\t Get this help.',
  '\t You could use "-h" instead of "--help".',
].join('\n');


/**
 * Handle parameters of the command webserver
 *
 * @param {array} args : args passed by webserver (process.argv.slice(3))
 */
function handleParams (args, callback = () => {}) {

  // read environnment variable
  let _envParams = helper.readEnvironmentVariable(process.env, params);
  // workDir must be set before reading the config file, which is in the workdir
  if (_envParams.workDir) {
    params.workDir = _envParams.workDir;
  }
  let _cliParams = {};
  while (args.length > 0) {
    var _argument = args.shift();
    switch (_argument) {
      case '--port':
      case '-p':
        _cliParams.port = args.shift();
        break;
      case '--bind': // TODO unused for the moment
      case '-b':
        _cliParams.bind = args.shift();
        break;
      case '--factories':
      case '-f':
        _cliParams.factories = args.shift();
        break;
      case '--workdir':
      case '-w':
        // workDir must be set before reading the config file, which is in the workdir
        params.workDir = args.shift();
        break;
      case '--attempts':
      case '-a':
        _cliParams.attempts = args.shift();
        break;
      case '--authentication':
      case '-A':
        _cliParams.authentication = true;
        break;
      case '--help':
      case '-h':
        console.log(usage);
        process.exit(0);
        break;
      default:
        console.log(usage);
        process.exit(0);
        break;
    }
  }
  // create all files in workdir, read config file if it exists
  let _configParams = initWorkingDirectory();
  // apply configuration respecting priority, write warning if config file contains unkwown parameters
  process.stdout.write(helper.assignObjectIfAttributesExist(params, _configParams)); // lowest priority
  helper.assignObjectIfAttributesExist(params, _envParams);
  helper.assignObjectIfAttributesExist(params, _cliParams);  // highest priority

  // Now, all params are set, load carbone to start with a custom renderPath
  carbone = require('./index');

  // Load all plugins
  setDefaultStoragePlugins();
  authAddon    = loadPlugin('authentication.js');
  storageAddon = loadPlugin('storage.js', storageAddon);
  middlewares  = loadPlugin('middlewares.js');

  // handle exit signals
  ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'].forEach(function (signal) {
    process.on(signal, function () {
      exit('\nCarbone: Exit with signal '+signal);
    });
  });
  params.startFactory = true;
  console.log('\nCarbone Render On-Premise [EE] : v' + package.version);
  console.log('License:');
  console.log('- Trial period valid until 29th December 2020');
  console.log('- Not for commercial use, only for testing purpose');
  console.log('- Proprietary software made by Ideoys SAS - France - 521 295 162 00023 RCS');
  if (Date.now() > 1609279200000) {
    // Hello, if you find this code, congratulation :). You must respect the license.
    console.log('Trial period expired');
    process.exit();
  }
  if (params.authentication) {
    console.log('\nAuthentication is on');
  }
  console.log('\nCarbone: Starting server...');

  converter.init(function () {
    startServer();
    console.log('Carbone webserver is started and listens on port '+params.port);
    return callback();
  });
}

/**
 * Load plugin
 *
 * @param  {String}  filename  The filename in plugin dir
 * @param  {Object}  model     [optional] the model of the plugin, overwrite function if it exists
 * @return {Object}  the module
 */
function loadPlugin (filename, model) {
  let _plugin = null;
  try {
    _plugin = require(path.join(params.workDir, 'plugin', filename));
    console.log('Loading plugin '+ filename);
    var _error = helper.assignObjectIfAttributesExist(model, _plugin);
    if (_error) {
      console.log('Warning: '+ _error);
    }
  }
  catch (e) {
    if (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND') {
      console.log('Cannot load plugin/' + filename);
      console.log(e);
    }
  }
  // if model is not passed, return plugin directly
  return model || _plugin;
}

/**
 * Start a server
 */
function startServer () {
  service = restana({
    ignoreTrailingSlash : true,
    errorHandler (err, req, res) {
      console.log(`An error occured on route ${req.url}: ${err.message || err}`);
      return res.send({
        success : false,
        error   : err.toString()
      }, 500);
    }
  });
  service.getServer().setTimeout(SERVER_TIMEOUT);
  service.use(bodyParser.json({limit : '60mb'}));
  // enables cors globally and enables cors pre-flight for every route
  // https://github.com/expressjs/cors#enabling-cors-pre-flight
  // https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
  service.use(cors({
    // When cors is enable, "Access-Control-Expose-Headers" have to be defined to return specific headers
    exposedHeaders : ['X-Request-URL', 'Content-Disposition']
  }));
  service.options('*', cors());
  service.use((req, res, next) => {
    // https://github.com/github/fetch#obtaining-the-response-url
    res.setHeader('X-Request-URL', req.url);
    return next();
  });

  // Set user-defined before middleware
  if (middlewares && middlewares.before !== undefined) {
    for (let i = 0; i < middlewares.before.length; i++) {
      service.use(middlewares.before[i]);
    }
  }

  // Declare this route before authentication because we don't want it to get a render
  service.get('/render/:renderId', getRenderedReport);
  service.get('/status', getStatus);

  if (params.authentication) {
    let func = (authAddon && authAddon.getPublicKey !== undefined) ? authAddon.getPublicKey : getPublicKey;
    let _verifyTokenFn = kittenJwt.verifyHTTPHeaderFn(params.jwtAudience, func);
    service.use((req, res, next) => {
      if (req.skipAuthentication || (req.method === 'GET' && req.url === '/status') || (req.method === 'GET' && req.url.startsWith('/render'))) {
        return next();
      }

      return _verifyTokenFn(req, res, next);
    });
  }

  service.post('/render/:templateId', generateReport);

  service.post('/template', addTemplate);
  service.get('/template/:templateId', getTemplate);
  service.delete('/template/:templateId', deleteTemplate);

  // Set after middleware
  if (middlewares && middlewares.after !== undefined) {
    for (let i = 0; i < middlewares.after.length; i++) {
      service.use(middlewares.after[i]);
    }
  }

  service.start(params.port).then(() => {
    statusRenderInterval = setInterval(executeStatusRender, STATUS_RENDER_INTERVAL_TIME);
    cleanInterval        = setInterval(cleanDirectories, CLEAN_INTERVAL_TIME);
  });
}


function setDefaultStoragePlugins () {
  // write default storage plugin to simplify code (avoid if)
  storageAddon = {
    readTemplate   : (req, res, templateId, next)                         => { return next(null, path.join(params.templatePath, templateId)); }, // eslint-disable-line
    deleteTemplate : (req, res, templateId, next)                         => { return next(null, path.join(params.templatePath, templateId)); }, // eslint-disable-line
    writeTemplate  : (req, res, templateId, templatePathTemp, next)       => { return next(); }, // eslint-disable-line
    beforeRender   : (req, res, data, options, next)                      => { return next(); }, // eslint-disable-line
    afterRender    : (req, res, err, reportPath, reportName, stats, next) => { return next(); }, // eslint-disable-line
    readRender     : (req, res, renderId, next)                           => { return next(null, path.join(params.renderPath, renderId)); }, // eslint-disable-line
    // Old function signatures
    // readTemplate   : (req, templateId, next)                   => { return next(null, path.join(params.templatePath, templateId)); }, // eslint-disable-line
    // writeTemplate  : (req, res, templatePath, templateId, next)     => { return next(); }, // eslint-disable-line
    // onRenderEnd    : (req, res, reportName, reportPath, statistics, next)  => { return next(); }, // eslint-disable-line
  };
}

function stopServer (callback) {
  authAddon = null;
  setDefaultStoragePlugins();
  clearInterval(statusRenderInterval);
  clearInterval(cleanInterval);
  converter.exit(() => {
    service.close().then(() => {
      service = null;
      return callback();
    });
  });
}

/**
 * Return a json object to return to client
 * @param {String} error Error code
 * @param {String} message Message to return
 * @param {Object} data Data to return
 * @param {Array} args Args to send to get error message
 */
function returnMessage (errors, message, data) {
  if (errors !== null && errors.errorCode !== undefined) {
    return {
      success : false,
      error   : errorCode[errors.errorCode].apply(null, errors.args),
      more    : {
        code : errors.errorCode
      }
    };
  }

  let toReturn = {
    success : true
  };

  if (message !== undefined && message !== null) {
    toReturn.message = message;
  }

  if (data !== undefined && data !== null) {
    toReturn.data = data;
  }

  return toReturn;
}


/**
 * Read the public key for authentication
 * @param {Object} req Req from request
 * @param {Object} res Response from request
 * @param {String} payload
 * @param {Function} callback
 */
function getPublicKey (req, res, payload, callback) {
  fs.readFile(path.join(params.configPath, AUTH_KEY_NAME + '.pub'), 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read public key ' + err.toString()));
    }

    return callback(content);
  });
}

/**
 * Generate a JWT token to use the webserver with authentication
 * @param {Function} callback
 */
function generateToken (callback) {
  // Read the private key
  fs.readFile(path.join(params.workDir, 'config', AUTH_KEY_NAME + '.pem'), 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read file ' + path.join(params.workDir, 'config', AUTH_KEY_NAME + '.pem')));
    }

    let token = kittenJwt.generate('carbone-user', params.jwtAudience, 40 * 365 * 24 * 60 * 60, content, {});

    return callback(null, token);
  });
}

module.exports = {
  stopServer,
  handleParams,
  generateToken
};

/**
 * Gracefully exits
 *
 * @param {string} msg : final message
 */
function exit (msg) {
  if (msg) {
    console.log(msg);
    console.log('Carbone: Shutdown in progress...');
  }
  stopServer(function () {
    process.exit();
  });
}

function getStatus (req, res) {
  if (status.state === null) {
    return setTimeout(() => {
      getStatus(req, res);
    }, 3000);
  }

  const success = (status.state === 200) ? true : false;

  res.send({
    success,
    code    : status.state,
    message : status.message,
    version : package.version
  });
}

/**
 * Init working directory
 *
 * @return config file if it exists, an empty object otherwise
 */
function initWorkingDirectory () {
  params.templatePath = path.join(params.workDir, 'template');
  params.renderPath   = path.join(params.workDir, 'render');
  params.assetPath    = path.join(params.workDir, 'asset');
  params.configPath   = path.join(params.workDir, 'config');
  params.pluginPath   = path.join(params.workDir, 'plugin');
  const configFile    = path.join(params.configPath, 'config.json');
  try { fs.mkdirSync(params.templatePath); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.renderPath);   } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.assetPath);    } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.configPath);   } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.pluginPath);   } catch (e) {}; // eslint-disable-line

  // copy or update python code oustide of the package to make it accessible for python
  // stop working immediately if it cannot write the file in workdir
  try {
    var _pythonCode = fs.readFileSync(path.join(__dirname, './converter.py'));
    params.pythonPath = path.join(params.assetPath, './converter.py');
    fs.writeFileSync(params.pythonPath, _pythonCode);
  }
  catch (e) {
    console.log('ERROR: cannot write files in ' + params.assetPath);
    console.log('Is the working directory correct [--workdir]? ' + params.workDir);
    process.exit(1);
  }

  // Generate pub/priv key for JWT authentication
  if (fs.existsSync(path.join(params.configPath, AUTH_KEY_NAME + '.pub')) === false) {
    kittenJwt.generateECDHKeys(params.configPath, 'key', (err) => {
      if (err) {
        return console.log('Cannot generate Keys: '+ err);
      }
      console.log('Keys generated');
    });
  }

  // read config if it exists
  if (fs.existsSync(configFile) === true) {
    let _config = {};
    try {
      _config = require(configFile);
    }
    catch (e) {
      console.log('ERROR: Cannot read config file: '+ e);
      process.exit(1);
    }
    return _config;
  }
  // create default config file if it does not exists
  const _defaultConfig = {
    port                  : params.port,
    bind                  : params.bind,
    factories             : params.factories,
    attempts              : params.attempts,
    authentication        : params.authentication,
    jwtAudience           : params.jwtAudience,
    templatePathRetention : params.templatePathRetention
  };
  fs.writeFileSync(configFile, JSON.stringify(_defaultConfig, null, 2));
  return {};
}


/**
 * [generateReport description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function generateReport (req, res) {
  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('application/json') === -1) {
    return res.send(returnMessage({ errorCode : 'w110' }), 400);
  }

  console.log('REQUEST ' + req.method + ' ' + req.url);
  // We'll store every data we need here
  let _renderOptions   = req.body;
  const _templateId    = req.params.templateId; // TODO sanitize

  if (_renderOptions.data === undefined) {
    return res.send(returnMessage({ errorCode : 'w111' }), 400);
  }

  // reset renderPrefix coming from insecure source
  // it forces Carbone to return a path instead of a buffer
  _renderOptions.renderPrefix = '';

  storageAddon.beforeRender(req, res, _renderOptions.data, _renderOptions, (err) => {
    if (err) {
      return res.send(returnMessage({ errorCode : 'w114' }), 400);
    }
    storageAddon.readTemplate(req, res, _templateId, (err, templateAbsolutePath) => {
      if (err) {
        return res.send({ success : false, error : err.toString() }, 400);
      }
      return renderReport(req, res, templateAbsolutePath, _renderOptions.data, _renderOptions);
    });
  });
}

/**
 * Render a report calling carbone.render with the correct template path
 * @param {Object} req req from request
 * @param {Object} res res from request
 * @param {String} templateId file id
 * @param {Object} data Data to render
 * @param {Object} renderOptions Render options
 */
function renderReport (req, res, templateAbsolutePath, data, renderOptions) {
  try {
    let jsonSize = JSON.stringify(data).length;

    carbone.render(templateAbsolutePath, data, renderOptions, (err, reportAbsolutePath, reportName) => {
      console.log('RENDER GENERATED', path.basename(reportAbsolutePath));
      const _renderId = path.basename(reportAbsolutePath);

      let _statistics = {
        renderId : _renderId,
        template : path.basename(templateAbsolutePath),
        user     : (req.jwtPayload !== undefined) ? req.jwtPayload.iss : null,
        options  : err ? renderOptions : null,
        jsonSize : jsonSize
        // error    : err
      };

      storageAddon.afterRender(req, res, err, reportAbsolutePath, reportName, _statistics, (err) => {
        if (err) {
          console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + err);
          // Check if the error is a ENOENT error
          if (err.code === 'ENOENT') {
            return res.send(returnMessage({ errorCode : 'w100' }), 404);
          }
          return res.send(returnMessage({ errorCode : 'w101', args : [err.toString()] }), 500);
        }
        return res.send(returnMessage(null, null, { renderId : _renderId }));
      });
    });
  }
  catch (e) {
    console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + e);
    res.send(returnMessage({ errorCode : 'w101', args : [e.toString()] }), 500);
  }
}

/**
 * [getRenderedReport description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function getRenderedReport (req, res) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  // remove slash, dot and dangerous characters like ..\
  const _renderId = path.basename(req.params.renderId); // TODO Sanitize
  // extract report name from encode file name
  const _report   = carbone.decodeRenderedFilename(_renderId, params.renderFilePrefixLength);
  const _filename = _report.reportName + '.' +_report.extension;

  storageAddon.readRender(req, res, _renderId, (err, renderAbsolutePath) => {
    if (err) {
      console.log('Send rendered report error: ' + err);
      return res.send(returnMessage({ errorCode : 'w102' }));
    }
    sendFile(res, renderAbsolutePath, _filename, (err) => {
      if (err) {
        console.log('Send rendered report error: ' + err);
      }
      fs.unlink(renderAbsolutePath, (err) => {
        if (err) {
          // silent error, it will be cleand by the global job
          // sendFile has already answered to the client
          console.log('Cannot delete rendered report: ' + err);
        }
      });
    });
  });
}

function sendFile (res, filePath, filename, callback) {
  res.setHeader('Content-Disposition', `filename="${encodeURIComponent(filename)}"`);
  const _file = fs.createReadStream(filePath);
  // TODO, I am not sure, but here is the solution I've found to answer before closing rquest
  const _cleanup = finished(_file, (err) => {
    if (err) {
      res.send(returnMessage({ errorCode : 'w104' }), 404);
      _cleanup();
    }
  });
  pipeline(_file, res, callback);
}

// function sendFileOld (res, filepath, filename, callback) {
//   res.setHeader('Content-Disposition', `filename="${encodeURIComponent(filename)}"`);
//   let _file = fs.createReadStream(filepath);
//   let _done = false;
//   function onError (err) {
//     if (_done === true) {
//       return;
//     }
//     _done = true;
//     callback(err);
//   }
//   function onEnd () {
//     if (_done === true) {
//       return;
//     }
//     _done = true;
//     callback();
//   }
//   _file.on('end', onEnd);
//   _file.on('end', onEnd);
//   _file.on('error', onError);
//   _file.pipe(res);
// }

/**
 * Return template content
 * @param {Object} req Req from request
 * @param {Object} res Res from request
 * @param {Function} next
 */
function getTemplate (req, res) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  const _templateId = req.params.templateId; // TODO sanitize

  storageAddon.readTemplate(req, res, _templateId, (err, templateAbsolutePath) => {
    if (err) {
      return res.send({ success : false, error : err.toString() }, 400);
    }
    carbone.getFileExtension(templateAbsolutePath, (err, extension) => {
      if (err) {
        console.log('[get template] error: ' + err.toString());
        return res.send(returnMessage({ errorCode : 'w103' }));
      }
      const _filename = _templateId + '.' +extension;
      sendFile(res, templateAbsolutePath, _filename, (err) => {
        if (err) {
          console.log('Send template error: ' + err.toString());
        }
      });
    });
  });
}


/**
 * Delete a template
 * @param {Object} req Req from request
 * @param {Object} res Res from request
 * @param {Function} next
 */
function deleteTemplate (req, res) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  const _templateId = req.params.templateId; // TODO sanitize
  storageAddon.deleteTemplate(req, res, _templateId, (err, templateAbsolutePath) => {
    if (err) {
      return res.send({ success : false, error : err.toString() }, 400);
    }
    fs.unlink(templateAbsolutePath, (err) => {
      if (err) {
        return res.send(returnMessage({ errorCode : 'w105' }), 404);
      }
      return res.send(returnMessage(null, 'Template deleted'));
    });
  });
}

/**
 * [addTemplate description]
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
function addTemplate (req, res) {
  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('form-data') === -1) {
    return res.send(returnMessage({ errorCode : 'w106' }), 400);
  }

  const form = formidable({
    maxFileSize : MAX_TEMPLATE_SIZE,
    uploadDir   : params.templatePath,
    hash        : 'sha256' // compute sha256 on the fly
  });

  let _hashSalt = '';
  // payload field must be passed before template field like in the documentation!
  form.on('field', (fieldName, fieldValue) => {
    if (fieldName === 'payload') {
      _hashSalt = fieldValue;
    }
  });
  form.on('fileBegin', (name, file) => {
    file.hash.update(_hashSalt);
  });

  form.parse(req, (error, fields, files) => {
    if (error) {
      console.log('Upload error: ', error.toString());
      return res.send(returnMessage({ errorCode : 'w107' }), 400);
    }

    if (files.template === undefined) {
      return res.send(returnMessage({ errorCode : 'w112' }), 400);
    }

    const _templatePathTemp = files.template.path;
    const _hashId = files.template.hash;
    storageAddon.writeTemplate(req, res, _hashId, _templatePathTemp, (err) => {
      if (err) {
        console.log('write template error: ', err);
        return res.send(returnMessage({ errorCode : 'w109' }), 400);
      }
      console.log(`Add template : ${_templatePathTemp} => ${_hashId}`);
      fs.rename(_templatePathTemp, path.join(params.templatePath, _hashId), (err) => {
        if (err) {
          console.log('renaming template error: ', err);
          return res.send(returnMessage({ errorCode : 'w109' }), 400);
        }
        return res.send(returnMessage(null, null, { templateId : _hashId }));
      });
    });
  });
}


/**
 * Execute a status render and save state in status global variable
 */
function executeStatusRender () {
  const _filepath = path.join(__dirname, '..', 'examples', 'healthCheck.odt');
  // console.log('RUN STATUS RENDER');

  carbone.render(_filepath, { firstname : 'John', lastname : 'Doe' }, { convertTo : 'txt' }, (err) => {
    // console.log('DONE');
    if (err) {
      console.log('status route: render error', err.toString());
      status.state = 500;
      status.message = 'Service cannot execute render';
      return;
    }
    status.state = 200;
    status.message = 'Service is OK';
    return;
  });
}

/**
 * Delete render or template path periodically
 *
 */
function cleanDirectories () {
  // Clean render directory
  if (params.renderPathRetention > 0) {
    deleteFilesEfficiently(params.renderPath, params.renderPathRetention, false);
  }
  // Clean template directory
  if (params.templatePathRetention > 0) {
    deleteFilesEfficiently(params.templatePath, params.templatePathRetention, true);
  }
}

/**
 * Delete efficiently files of a directory according to access/modified time
 *
 * @param {string}  directory      The directory to clean
 * @param {Number}  value          Delete files that have not been accessed since N days if useAccessTime = true
 *                                 Delete files that have not been modified since N minutes if useAccessTime = false
 * @param {string}  useAccessTime  which mthod is used (access time in days or modified in minutes)
 */
function deleteFilesEfficiently (directory, value, useAccessTime) {
  let _time = useAccessTime === true ? 'atime' : 'mmin';
  // TODO on Windows ?
  exec(`find ${directory} -type f -${_time} +${value} -delete;`, (err, stdout, stderr) => {
    console.log('Automatic clean of '+directory);
    if (err || stderr) {
      console.log('Automatic clean directory error: ', err, stderr);
    }
  });
}
