const fs = require('fs');
const path = require('path');
const cors = require('cors');
const params = require('./params');
const helper = require('./helper');
const crypto = require('crypto');
const formidable = require('formidable');
const converter = require('./converter');
const mimetype = require('./mimetype');
const bodyParser = require('body-parser');
const package = require('../package.json');
const restana = require('restana');
const kittenJwt = require('kitten-jwt');
const { exec, execFile } = require('child_process');
const { pipeline, finished } = require('stream');
const get = require('simple-get');
// require carbone only after setting params.renderPath.
// Carbone automatically creates renderPath directory in operating system TEMP dir if it does not exist.
// We avoid this by loading carbone after reading workdir from CLI or env variables
let carbone = {};

// set JWT cache size
kittenJwt.set({serverCacheSize : 1000});
let authAddon = null;
let storageAddon = null;
let middlewares = null;
let service = null;
let status = {
  code      : 200,
  message   : 'OK',
  updatedAt : Date.now()
};
let statusInterval = null;
let cleanInterval = null;
let webhookRenderJobInterval = null;
let totalWebhookJobsRendering = 0;
let watchdogInterval = null;
const AUTH_KEY_NAME = 'key';
const STATUS_INTERVAL_TIME = params.converterFactoryTimeout;
const CLEAN_INTERVAL_TIME = 60 * 60 * 1000;
const WEBHOOK_RENDER_JOB_INTERVAL_TIME = 1 * 20 * 1000;
const SERVER_TIMEOUT = params.converterFactoryTimeout + 2000;
const MAX_TEMPLATE_SIZE = 20 * 1024 * 1024;
let studioCache = '';
let studioIconCache = '';
let studioFaviconCache = '';

const errorCode = {
  w100 : () => 'Template not found',
  w101 : (error) => `Error while rendering template ${error}`,
  w102 : () => 'Rendered file does not exist',
  w103 : () => 'Cannot find template extension, does it exists?',
  w104 : () => 'File not found',
  w105 : () => 'Cannot remove template, does it exist?',
  w106 : () => 'Content-Type header should be multipart/form-data (preferred) or application/json (base64 mode)',
  w107 : () => 'Try uploading your file using form data',
  w108 : () => 'Cannot calculate hash id',
  w109 : () => 'Cannot write template',
  w110 : () => 'Content-Type header is not application/json',
  w111 : () => 'Missing data key in body',
  w112 : () => '"template" field is empty',
  w113 : () => 'Service cannot render template',
  w114 : () => 'Cannot execute beforeRender',
  w115 : () => 'Unvalid ID',
  w116 : () => 'Cannot read template',
  w117 : () => 'Error while setting up the webhook'
};

// If you replace this public key, DO NOT FORGET \n AT THE END OF EACH LINE
const LICENSE_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\n'
  + 'MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQAsTRWVxQWZ1UB8sLYgw2DWyGbj2oe\n'
  + 'MCigwprWb5TFTng6zkrCyL9f8Y5tzWfDkeP3OOCQyL0ycN/XYRgf+V0/wBQB9xjs\n'
  + 'ozjODF9hDB74lTfJRvtfoleNwBOEv8h3C4n6N+7m9PTIU7r8b6OM1j6jL4TRtgTj\n'
  + 'K2Po1Qh3pULkSyEKJK0=\n'
  + '-----END PUBLIC KEY-----\n'
;


var usage = [
  '\n***********************************************************************',
  ' Server usage:',

  '\n $ carbone webserver --port '+params.port+' --workdir /var/www/carbone',
  ' The command start a carbone webserver on port '+params.port+' on the folder /var/www/carbone.',
  '\n Available options:',
  '\t --bind [-b] host ('+params.bind+') ',
  '\t --port [-p] port number ('+params.port+') ',
  '\t --workdir [-w] working directory of carbone ('+params.workDir+') ',
  '\t --attempts [-a] set the number of re-try on rendering error ('+params.attempts+')',
  '\t --factories [-f] set the number of LibreOffice + Python factory to start. ('+params.factories+')',
  '\t --authentication [-A] enable authentication (default false)',
  '\t --studio [-A] enable a web interface to preview reports (default false)',
  '\t --help [-h] show Carbone On-premise CLI options (default false)',
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
      case '--bind':
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
      case '--templatePathRetention':
      case '-r':
        _cliParams.templatePathRetention = args.shift();
        break;
      case '--studio':
      case '-s':
        _cliParams.studio = true;
        break;
      case '--studioUser':
      case '-S':
        _cliParams.studioUser = args.shift();
        break;
      case '--lang':
      case '-l':
        _cliParams.lang = args.shift();
        break;
      case '--timezone':
      case '-t':
        _cliParams.timezone = args.shift();
        break;
      case '--currencySource':
      case '-cs':
        _cliParams.currencySource = args.shift();
        break;
      case '--currencyTarget':
      case '-ct':
        _cliParams.currencyTarget = args.shift();
        break;
      case '--licenseDir':
      case '-L':
        _cliParams.licenseDir = args.shift();
        break;
      case '--maxDataSize':
      case '-mds':
        _cliParams.maxDataSize = args.shift();
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
  console.log(helper.assignObjectIfAttributesExist(params, _configParams) + ' in config file'); // lowest priority
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

  helper.findCheckLicense(params.licenseDir, LICENSE_PUBLIC_KEY, (isValid, message, license) => {
    if (!isValid && process.pkg /* do not check in development */) {
      console.log(message);
      console.log('Please, ask a license at contact@carbone.io to use this software\n');
      return process.exit(1);
    }
    console.log('\n', helper.printVersion(license));
    if (params.authentication) {
      console.log('\nAuthentication is on');
    }
    console.log('\nCarbone: Starting server...');

    initSystemdWatchdog();
    converter.init(function () {
      startServer();
      console.log('Carbone webserver is started and listens on port '+params.port);
      return callback();
    });
  });
}

/**
 * Build the studio client code and put it in cache
 *
 */
function buildStudio () {
  let _html = fs.readFileSync(path.join(__dirname, '..', 'studio', 'index.html'), 'utf8');
  // We must use functions to replace otherwise replace parse the string content and it does not work with jsoneditor code
  studioCache = _html
    .replace('INJECT_STUDIO_CSS'     , () => fs.readFileSync(path.join(__dirname, '..', 'studio', 'index.css')                       , 'utf8'))
    .replace('INJECT_STUDIO_JS'      , () => fs.readFileSync(path.join(__dirname, '..', 'studio', 'index.js')                        , 'utf8'))
    .replace('INJECT_JSON_EDITOR_CSS', () => fs.readFileSync(path.join(__dirname, '..', 'studio', 'jsoneditor', 'jsoneditor.min.css'), 'utf8'))
    .replace('INJECT_JSON_EDITOR_JS' , () => fs.readFileSync(path.join(__dirname, '..', 'studio', 'jsoneditor', 'jsoneditor.min.js') , 'utf8'))
  ;
  studioIconCache = fs.readFileSync(path.join(__dirname, '..', 'studio', 'jsoneditor', 'img', 'jsoneditor-icons.svg'),'utf8');
  studioFaviconCache = fs.readFileSync(path.join(__dirname, '..', 'studio', 'icon.png'));
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
    const fileExists = fs.existsSync(path.join(params.workDir, 'plugin', filename));

    if ((e.code === 'MODULE_NOT_FOUND' && fileExists) || (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND')) {
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
  const server = service.getServer();
  server.setTimeout(SERVER_TIMEOUT);
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

  // Curls add automatically the "Expect: 100-continue" header when the request is a POST or PUT and the data size is larger than 1024 bytes
  // By default, curl waits up to 1 second for a reply to the 100-continue expectation.
  // https://github.com/curl/curl/blob/9ad034e5a1b2d42acfdbea184736066782c6c635/lib/http.c#L1527
  server.on('checkContinue', function (req, res) {
    if (req.method === 'POST') {
      // the writeContinue function is called after the url and form-data validation because the addTemplate body is a stream
      req.checkContinue = true;
    }
    else {
      respContinue(req, res);
    }
    server.emit('request', req, res);
  });

  // Set user-defined before middleware
  if (middlewares && middlewares.before !== undefined) {
    for (let i = 0; i < middlewares.before.length; i++) {
      service.use(middlewares.before[i]);
    }
  }

  if (params.studio === true) {
    console.log('\nStudio is on');
    buildStudio();
    service.get('/', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      if ( params.authentication === false || isAuthenticatedOnStudio(req) === true ) {
        return res.send(studioCache);
      }
      res.setHeader('WWW-Authenticate', 'Basic realm="User Visible Realm", charset="UTF-8"');
      res.send('', 401);
    });
    service.get('/img/jsoneditor-icons.svg', (req, res) => {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(studioIconCache);
    });
    service.get('/img/icon.png', (req, res) => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'private,max-age=7776000,immutable');
      res.send(studioFaviconCache);
    });
  }

  // Declare this route before authentication because we don't want it to get a render
  service.get('/render/:renderId', getRenderedReport);
  service.get('/status', getStatus);

  if (params.authentication) {
    let func = (authAddon && authAddon.getPublicKey !== undefined) ? authAddon.getPublicKey : getPublicKey;
    let _verifyTokenFn = kittenJwt.verifyHTTPHeaderFn(params.jwtAudience, func);
    service.use((req, res, next) => {
      if (req.skipAuthentication || isAuthenticatedOnStudio(req) === true || (req.method === 'GET' && req.url === '/status') || (req.method === 'GET' && req.url.startsWith('/render'))) {
        return next();
      }

      return _verifyTokenFn(req, res, next);
    });
  }
  service.post('/render/:templateId', bodyParser.json({ limit : params.maxDataSize }), generateReport);

  service.post('/template', bodyParser.json({limit : MAX_TEMPLATE_SIZE}), addTemplate);
  service.get('/template/:templateId', getTemplate);
  service.delete('/template/:templateId', deleteTemplate);

  // Set after middleware
  if (middlewares && middlewares.after !== undefined) {
    for (let i = 0; i < middlewares.after.length; i++) {
      service.use(middlewares.after[i]);
    }
  }

  service.start(params.port).then(() => {
    statusInterval = setInterval(executeStatusRender, STATUS_INTERVAL_TIME);
    cleanInterval  = setInterval(cleanDirectories, CLEAN_INTERVAL_TIME);
  });
}

/**
 * Init setInterval of the job management only if used
 */
function initQueuingSystemOnce () {
  if (webhookRenderJobInterval === null) {
    webhookRenderJobInterval = setInterval(runWebhookRenderJob, WEBHOOK_RENDER_JOB_INTERVAL_TIME, `id-${Date.now()}`);
  }
}

function isAuthenticatedOnStudio (req) {
  let _auth = req.headers.authorization || req.headers.Authorization || '';
  // TODO improve security removing indexoF
  return _auth.indexOf(helper.encodeSafeFilename(params.studioUser)) !== -1;
}

/**
 * Respond "100 continue" to receive the body/stream/socket.
 *
 * @param {Object} req request object
 * @param {Object} res response object
 */
function respContinue (req, res) {
  res.setHeader('checkcontinue', 'done');
  res.writeContinue();
}


function setDefaultStoragePlugins () {
  // write default storage plugin to simplify code (avoid if)
  storageAddon = {
    readTemplate   : (req, res, templateId, next)                         => { return next(null, path.join(params.templatePath, templateId)); }, // eslint-disable-line
    deleteTemplate : (req, res, templateId, next)                         => { return next(null, path.join(params.templatePath, templateId)); }, // eslint-disable-line
    writeTemplate  : (req, res, templateId, templatePathTemp, next)       => { return next(null, templateId); }, // eslint-disable-line
    beforeRender   : (req, res, data, options, next)                      => { return next(); }, // eslint-disable-line
    afterRender    : (req, res, err, reportPath, reportName, stats, next) => { return next(err); }, // eslint-disable-line
    readRender     : (req, res, renderId, next)                           => { return next(null, path.join(params.renderPath, renderId)); }, // eslint-disable-line
  };
}

function stopServer (callback) {
  authAddon = null;
  setDefaultStoragePlugins();
  clearInterval(statusInterval);
  clearInterval(cleanInterval);
  clearInterval(webhookRenderJobInterval);
  clearInterval(watchdogInterval);
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
      code    : errors.errorCode
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
  fs.readFile(path.join(params.configPath, AUTH_KEY_NAME + '.pem'), 'utf8', (err, content) => {
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
  generateToken,
  sanitizeValidateId,
  runWebhookRenderJob
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

/**
 * Respond current Carbone status
 *
 * @param  {Object}  req     The request
 * @param  {Object}  res     The resource
 */
function getStatus (req, res) {
  return res.send({
    success : (status.code === 200) ? true : false,
    code    : status.code,
    message : status.message,
    version : package.version
  }, status.code);
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
  params.queuePath    = path.join(params.workDir, 'queue');
  const configFile    = path.join(params.configPath, 'config.json');

  // must be 700 instead of 600 to allow search
  try { fs.mkdirSync(params.templatePath, { recursive: true, mode: 0o770 }); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.renderPath  , { recursive: true, mode: 0o770 }); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.assetPath   , { recursive: true, mode: 0o770 }); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.configPath  , { recursive: true, mode: 0o770 }); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.pluginPath  , { recursive: true, mode: 0o750 }); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.queuePath   , { recursive: true, mode: 0o750 }); } catch (e) {}; // eslint-disable-line

  // copy or update python code oustide of the package to make it accessible for python
  // stop working immediately if it cannot write the file in workdir
  try {
    var _pythonCode = fs.readFileSync(path.join(__dirname, './converter.py'));
    params.pythonPath = path.join(params.assetPath, './converter.py');
    fs.writeFileSync(params.pythonPath, _pythonCode, { mode : 0o770 });
  }
  catch (e) {
    console.log('ERROR: cannot write files in ' + params.assetPath);
    console.log('Is the working directory correct [--workdir]? ' + params.workDir);
    console.log('Does the process have the right to create files in it?');
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
    templatePathRetention : params.templatePathRetention,
    maxDataSize           : params.maxDataSize,
  };
  fs.writeFileSync(configFile, JSON.stringify(_defaultConfig, null, 2), { mode : 0o770 });
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

  if (req.checkContinue === true) {
    req.checkContinue = false;
    // send 100 Continue response to received the body
    respContinue(req, res);
  }

  // We'll store every data we need here
  let _renderOptions   = req.body;
  const _templateId    = sanitizeValidateId(req.params.templateId);

  if (_templateId === null) {
    return res.send(returnMessage({ errorCode : 'w115' }), 400);
  }

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
        console.log('[generate report] read template error: ' + err.toString());
        if (/not exist/.test(err) === true) {
          return res.send(returnMessage({ errorCode : 'w100' }), 404);
        }
        return res.send(returnMessage({ errorCode : 'w116' }), 400);
      }


      if (req.headers['carbone-webhook-url']) {
        return newWebhookItemToRender(req, res, templateAbsolutePath, _renderOptions);
      }
      return renderReport(req, res, templateAbsolutePath, _renderOptions.data, _renderOptions);
    });
  });
}

function newWebhookItemToRender (req, res, templateAbsolutePath, _renderOptions) {
  initQueuingSystemOnce(); // active setInterval only if the queue system is used
  let _queueItemData = '';
  const _queueItemName = `${Date.now()}${(req.jwtPayload !== undefined) ? '-' + req.jwtPayload.iss : ''}.json`;
  const _webhookSuccessUrl = req.headers['carbone-webhook-url'];
  try {
    _queueItemData = JSON.stringify({
      // renderReport arguments
      successUrl           : _webhookSuccessUrl,
      templateAbsolutePath : templateAbsolutePath,
      body                 : _renderOptions,
      req                  : { // req used by renderReport
        headers    : req.headers, // The 'afterRender' method uses the 'headers' object
        jwtPayload : req.jwtPayload,
        url        : `${req.url} to ${_webhookSuccessUrl}`,
        method     : `Webhook ${req.method}`
      }
    });
  }
  catch (err) {
    console.log('Error when saving a new render queue item: ', err.toString());
    return res.send(returnMessage({ errorCode : 'w117' }), 500);
  }

  const _queuePath = path.join(params.queuePath, _queueItemName);
  return fs.writeFile(_queuePath, _queueItemData, function (err) {
    if (err) {
      console.log('Error when saving a new render queue item: ', err.toString());
      return res.send(returnMessage({ errorCode : 'w117' }), 500);
    }
    return res.send(returnMessage(null, 'A render ID will be sent to your callback URL when the document is generated', { renderId : '' }));
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

    carbone.render(templateAbsolutePath, data, renderOptions, (err, reportAbsolutePath, reportName, debugInfo) => {
      let _renderId = '';

      if (!err) {
        console.log('RENDER GENERATED', path.basename(reportAbsolutePath));
        _renderId = path.basename(reportAbsolutePath);
      }

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
        let _response = {
          renderId : _renderId
        };
        if (debugInfo !== null) {
          _response.debug = debugInfo;
        }
        return res.send(returnMessage(null, null, _response));
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
  const _renderId = sanitizeValidateId(path.basename(req.params.renderId));
  if (_renderId === null) {
    return res.send(returnMessage({ errorCode : 'w115' }), 400);
  }
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
  const _extension = path.extname(filename+'').toLowerCase().substr(1);
  const _mimeType  = mimetype[_extension];
  if (_mimeType !== undefined) {
    let _contentType = _mimeType.mime;
    if (_mimeType.charset !== false) {
      _contentType += '; charset=' + _mimeType.charset;
    }
    res.setHeader('Content-Type', _contentType);
  }
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
  const _templateId = sanitizeValidateId(req.params.templateId);

  if (_templateId === null) {
    return res.send(returnMessage({ errorCode : 'w115' }), 400);
  }

  storageAddon.readTemplate(req, res, _templateId, (err, templateAbsolutePath) => {
    if (err) {
      console.log('[get template] error: ' + err.toString());
      return res.send(returnMessage({ errorCode : 'w116' }), 400);
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
  const _templateId = sanitizeValidateId(req.params.templateId);

  if (_templateId === null) {
    return res.send(returnMessage({ errorCode : 'w115' }), 400);
  }

  storageAddon.deleteTemplate(req, res, _templateId, (err, templateAbsolutePath) => {
    if (err) {
      console.log('[delete template] delet template error: ' + err.toString());
      return res.send(returnMessage({ errorCode : 'w105' }), 400);
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
  const _contentType = req.headers['content-type'];
  const _isJSONType  = /json/i.test(_contentType);      // application/json
  const _isMultipart = /multipart/i.test(_contentType); // multipart/form-data
  if (_isJSONType === false && _isMultipart === false) {
    return res.send(returnMessage({ errorCode : 'w106' }), 400);
  }

  if (req.checkContinue === true) {
    req.checkContinue = false;
    // send 100 Continue response to received the stream
    respContinue(req, res);
  }

  // if content-type = application/json, read file from body.template
  if ( _isJSONType === true ) {
    if (typeof(req.body.template) !== 'string' || req.body.template.length === 0) {
      return res.send(returnMessage({ errorCode : 'w112' }), 400);
    }
    const _templatePathTemp = path.join(params.templatePath, helper.getUID());
    const _template = req.body.template.replace(/^.*,/, '');
    const _payload = req.body.payload || '';
    const _hashId = crypto.createHash('sha256').update(_payload).update(_template, 'base64').digest('hex');
    return fs.writeFile(_templatePathTemp, _template, 'base64', (err) => {
      if (err) {
        console.log('Upload error: ', err.toString());
        return res.send(returnMessage({ errorCode : 'w109' }), 400);
      }
      writeTemplateAndEnd(req, res, _hashId, _templatePathTemp);
    });
  }

  // else if content-type = multipart/form-data
  const form = formidable({
    maxFileSize   : MAX_TEMPLATE_SIZE,
    uploadDir     : params.templatePath,
    hashAlgorithm : 'sha256' // compute sha256 on the fly
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
    if ( files.template === undefined ) {
      return res.send(returnMessage({ errorCode : 'w112' }), 400);
    }
    return writeTemplateAndEnd(req, res, files.template.hash, files.template.filepath);
  });
}

/**
 * Writes a template and ends
 *
 * @param  {Object}  req               The request
 * @param  {Object}  res               The resource
 * @param  {Sting}   hashId            The hash identifier of the file
 * @param  {Sting}   templatePathTemp  The temporary template path
 */
function writeTemplateAndEnd (req, res, hashId, templatePathTemp) {
  storageAddon.writeTemplate(req, res, hashId, templatePathTemp, (err, filename) => {
    if (err) {
      console.log('write template error: ', err);
      return res.send(returnMessage({ errorCode : 'w109' }), 400);
    }
    console.log(`Add template : ${templatePathTemp} => ${filename}`);
    fs.rename(templatePathTemp, path.join(params.templatePath, filename), (err) => {
      if (err) {
        console.log('renaming template error: ', err);
        return res.send(returnMessage({ errorCode : 'w109' }), 400);
      }
      return res.send(returnMessage(null, null, { templateId : hashId }));
    });
  });
}

/**
 * Render job which are saved in queue directory
 *
 * @param  {}  jobId         The job identifier
 * @param  {number}  newQueueSize  The new queue size
 */
function runWebhookRenderJob (jobId, newQueueSize) {

  if (newQueueSize <= 0) {
    // The queue is empty, finished rendering, the job is stopped
    // The method will be run next time interval
    console.log(`Webhook Render Job ${jobId} - stopped!`);
    totalWebhookJobsRendering -= 1;
    return;
  }

  if (newQueueSize === undefined || newQueueSize === null) {
    if (totalWebhookJobsRendering >= params.factories) {
      // All jobs are already rendering and this new instance should be stopped now
      // the method has been fired because of the time interval
      return;
    }
    else {
      // Start a new job
      console.log(`Webhook Render Job ${jobId} - created!`);
      totalWebhookJobsRendering += 1;
    }
  }

  fs.readdir(params.queuePath, (err, files) => {
    if (err) {
      console.log(`Webhook Render Job ${jobId} - cannot retreive queue: `, err.toString());
      return runWebhookRenderJob(jobId, 0);
    }

    if (files && files.length === 0) {
      console.log(`Webhook Render Job ${jobId} - Queue Empty`);
      return runWebhookRenderJob(jobId, 0);
    }

    const _queueSize = files.length;
    const _queueItemName = files[0];
    const _queueItemPath = path.join(params.queuePath, _queueItemName);
    console.log(`Webhook Render Job ${jobId} -  processing document "${_queueItemName}"`);
    fs.readFile(_queueItemPath, 'utf8', (err, content) => {
      if (err) {
        console.log(`Webhook Render Job ${jobId} - cannot read queue item "${_queueItemName}": ${err.toString()}`);
        return runWebhookRenderJob(jobId, _queueSize - 1);
      }
      fs.unlink(_queueItemPath, (err) => {
        if (err) {
          console.log(`Webhook Render Job ${jobId} - cannot delete queue item "${_queueItemName}": ${err.toString()}`);
          return runWebhookRenderJob(jobId, _queueSize - 1);
        }
        let _queueItemData = {};
        try {
          _queueItemData = JSON.parse(content);
        }
        catch (err) {
          console.log(`Webhook Render Job ${jobId} -  JSON not valid "${_queueItemName}": ${err.toString()}`);
          return runWebhookRenderJob(jobId, _queueSize - 1);
        }
        const _res = {
          send : (response) => {
            try {
              get.concat({
                url     : _queueItemData.successUrl,
                method  : 'POST',
                body    : JSON.stringify(response),
                headers : {
                  'Content-Type' : 'application/json'
                }
              }, function (err, res, data) {
                /** TODO: remonter sur Carbone Account si ça a fonctionné pour debugger pour l'utilisateur */
                if (err) {
                  console.log(`Webhook Render Job ${jobId} - Send render ID failled "${_queueItemName}": ${err.toString()} ${data}`);
                }
                else {
                  console.log(`Webhook Render Job ${jobId} - Send render ID success`);
                }
                return runWebhookRenderJob(jobId, _queueSize - 1);
              });
            }
            catch (err) {
              /** An error could happen if the JSON stringify throw an error */
              console.log(`Webhook Render Job ${jobId}- Send render ID failled "${_queueItemName}": ${err.toString()}`);
              return runWebhookRenderJob(jobId, _queueSize - 1);
            }
          }
        };
        return renderReport(_queueItemData.req, _res, _queueItemData.templateAbsolutePath, _queueItemData.body.data, _queueItemData.body);
      });
    });
  });
}

/**
 * Execute a status render and save state in status global variable
 */
function executeStatusRender () {
  const _filepath = path.join(__dirname, '..', 'examples', 'healthCheck.odt');
  if ((Date.now() - status.updatedAt) > (2 * STATUS_INTERVAL_TIME) ) {
    // executeStatusRender is called (about) twice and previous calls did not update updatedAt
    status.code = 503;
  }
  carbone.render(_filepath, { firstname : 'John', lastname : 'Doe' }, { convertTo : 'txt' }, (err) => {
    status.updatedAt = Date.now();
    if (err) {
      console.log('Internal self-check status error: ', err.toString());
      status.code = 503;
      status.message = 'Service cannot execute render';
      return;
    }
    status.code = 200;
    status.message = 'OK';
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

/**
 * Notify systemd if everything is ok
 */
function systemdNotify () {
  if (status.code === 200) {
    // execFile is faster than exec (no shell). It works only if systemd file contains "NotifyAccess=all" to
    // accept notification coming from child process
    execFile('/bin/systemd-notify', ['WATCHDOG=1'], (err, stdout, stderr) => {
      if (err || stderr) {
        console.log('ERROR: Cannot call bin/systemd-notify: ', err, stderr);
      }
    });
  }
}
/**
 * Init watchdog system
 *
 * For now, only on Linux with systemd
 * It pings systemd regularly. If systemd does not receive the ping, systemd restarts Carbone service automatically
 */
function initSystemdWatchdog () {
  let _watchDog = 0;
  if (process.env.WATCHDOG_USEC && parseInt(process.env.WATCHDOG_PID, 10) === process.pid && process.platform === 'linux') {
    _watchDog = parseInt(process.env.WATCHDOG_USEC, 10);
    if (isNaN(_watchDog) === false && _watchDog > 0) {
      _watchDog = parseInt(_watchDog / 1000, 10); // Convert to milliseconds
      console.log('Systemd watchdog activated: ' + _watchDog + ' ms');
      // Interval is half the watchdog timeout, as suggested by systemd documentation
      // http://0pointer.de/blog/projects/watchdog.html
      _watchDog = _watchDog / 2;
      watchdogInterval = setInterval(systemdNotify, _watchDog);
    }
  }
}


function sanitizeValidateId (input) {
  /** 1. sanitize */
  const _illegalCharacters = /[/?<>\\:*|"]/g; // forbidden printable ASCII characters
  // eslint-disable-next-line no-control-regex
  const _controlCodes = /[\x00-\x1f\x80-\x9f]/g; // ASCII Non-printable characters https://en.wikipedia.org/wiki/C0_and_C1_control_codes
  const _linuxReservedFilePath = /^[./]+/; // example: ../../
  const _windowsTrailingSpace = /[. ]+$/; // Filenames cannot end in a space or dot.
  input = input
    .replace(_linuxReservedFilePath, '')
    .replace(_illegalCharacters, '')
    .replace(_controlCodes, '')
    .replace(_windowsTrailingSpace, '');
  /** 2. validate
   * Should not be more than 255 characters
   * Should accept only a-z A-Z 1-9 _ - .
   * Should not use Windows reserved filenames
   * Should have none or only one extension
  */
  const _acceptedCharacters = /^[.a-zA-Z0-9_-]+$/;
  const _windowsReservedFilenames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  if (input.length > 255 ||
     _acceptedCharacters.test(input) === false ||
     _windowsReservedFilenames.test(input) === true ||
      (input.length - input.replace(/\./g, '').length > 1)) {
    return null;
  }
  return input;
}
