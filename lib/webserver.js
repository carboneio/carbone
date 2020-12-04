const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const params = require('./params');
const carbone = require('./index');
const formidable = require('formidable');
const converter = require('./converter');
const bodyParser = require('body-parser');
const package = require('../package.json');
const restana = require('restana');
const kittenJwt = require('kitten-jwt');
const { exec } = require('child_process');

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

const CARBONE_PREFIX = 'CARBONE_EE_';
const AUTH_KEY_NAME = 'key';
const STATUS_RENDER_INTERVAL_TIME = 10000;
const CLEAN_INTERVAL_TIME = 24 * 60 * 60 * 1000;
const SERVER_TIMEOUT = 20000;

const errorCode = {
  w100 : () => 'Template not found',
  w101 : (error) => `Error while rendering template ${error}`,
  w102 : () => 'Rendered file does not exist',
  w103 : () => 'Cannot find template extension, does it exists?',
  w104 : () => 'Cannot stream template',
  w105 : () => 'Cannot remove template, does it exist?',
  w106 : () => 'Content-Type header should be multipart/form-data',
  w107 : () => 'Try uploading your file using form data',
  w108 : () => 'Cannot calculate hash id',
  w109 : () => 'Cannot write template',
  w110 : () => 'Content-Type header is not application/json',
  w111 : () => 'Missing data key in body',
  w112 : () => '"template" field is empty',
  w113 : () => 'Service cannot render template'
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
 * @param {array} args : args passed by webserver (process.argv.slice(3))
 */
function handleParams (args, callback = () => {}) {
  // default params value
  params.port = 4000;
  params.factories = 1;
  params.workDir = process.cwd();
  params.authentication = false;

  parseConfig((err) => {
    if (err) {
      console.log(err.message);
      process.exit(1);
    }

    while (args.length > 0) {
      var _argument = args.shift();
      switch (_argument) {
        case '--port':
        case '-p':
          params.port = args.shift();
          break;
        case '--bind':
        case '-b':
          params.bind = args.shift();
          break;
        case '--factories':
        case '-f':
          params.factories = args.shift();
          break;
        case '--workdir':
        case '-w':
          params.workDir = args.shift();
          break;
        case '--attempts':
        case '-a':
          params.attempts = args.shift();
          break;
        case '--authentication':
        case '-A':
          params.authentication = true;
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
    initWorkingDirectory();

    try {
      authAddon = require(path.join(params.workDir, 'plugin', 'authentication.js'));
    }
    catch (e) {
      if (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND') {
        console.log('Cannot load auth plugin');
        console.log(e);
      }
    }

    try {
      storageAddon = require(path.join(params.workDir, 'plugin', 'storage.js'));
    }
    catch (e) {
      if (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND') {
        console.log('Cannot load storage plugin');
        console.log(e);
      }
    }

    try {
      middlewares = require(path.join(params.workDir, 'plugin', 'middlewares.js'));
    }
    catch (e) {
      if (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND') {
        console.log('Cannot load middlewares');
        console.log(e);
      }
    }

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
  });
}

/**
 * Start a server
 *
 * @param {integer} port : server port
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

  // Set before middleware
  if (middlewares && middlewares.before !== undefined) {
    for (let i = 0; i < middlewares.before.length; i++) {
      service.use(middlewares.before[i]);
    }
  }

  // Declare this route before authentication because we don't want it to get a render
  service.get ('/render/:renderId', getRenderedReport);
  service.get('/status', getStatus);

  if (params.authentication) {
    let func = (authAddon && authAddon.getPublicKey !== undefined) ? authAddon.getPublicKey : getPublicKey;
    let _verifyTokenFn = kittenJwt.verifyHTTPHeaderFn('carbone', func);
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
    statusRenderInterval = setInterval(() => {
      executeStatusRender();
    }, STATUS_RENDER_INTERVAL_TIME);

    cleanInterval = setInterval(() => {
      cleanDirectories();
    }, CLEAN_INTERVAL_TIME);
  });
}

function stopServer (callback) {
  authAddon = null;
  storageAddon = null;
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
 * Read, parse and assign value to params object
 * @param {Function} callback
 */
function parseConfig (callback) {
  let configPath = path.join(params.workDir, 'config', 'config.json');

  fs.readFile(configPath, 'utf8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return writeDefaultConfigFile((err) => {
          if (err) {
            return callback(err);
          }

          return parseConfig(callback);
        });
      }

      console.log(err);
      return callback(new Error('Cannot read config file in ' + configPath));
    }

    let config = {};

    try {
      config = JSON.parse(content);
    }
    catch (e) {
      return callback(new Error('Cannot parse config file in ' + configPath));
    }

    for (let i = 0; i < Object.keys(params).length; i++) {
      let key = Object.keys(params)[i];

      let value = process.env[CARBONE_PREFIX + key.toUpperCase()] || config[key];

      if (value !== undefined) {
        if (typeof params[key] === 'boolean' && typeof value !== 'boolean') {
          value = (value === 'true') ? true : false;
        }
        else if (typeof params[key] === 'number' && typeof value !== 'number') {
          value = parseInt(value, 10);
        }
      }

      params[key] = (value !== undefined) ? value : params[key];
    }

    return callback(null);
  });
}


/**
 * Write a default config file with default values
 * @param {Function} callback
 */
function writeDefaultConfigFile (callback) {
  const defaultConfig = {
    port           : 3000,
    bind           : '127.0.0.1',
    factories      : 1,
    workdir        : process.cwd(),
    attempts       : 1,
    authentication : false
  };

  if (fs.existsSync(path.join(params.workDir, 'config')) === false) {
    fs.mkdirSync(path.join(params.workDir, 'config'));
  }

  fs.writeFile(path.join(params.workDir, 'config', 'config.json'), JSON.stringify(defaultConfig, null, 2), (err) => {
    if (err) {
      console.log('Cannot write default config file', err.toString());
      return callback(err);
    }

    return callback(null);
  });
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

    let token = kittenJwt.generate('carbone-user', 'carbone-ee', 40 * 365 * 24 * 60 * 60, content, {});

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

function getStatus (req, res, next) {
  // console.log('GET STATUS');

  if (status.state === null) {
    return setTimeout(() => {
      getStatus(req, res, next);
    }, 3000);
  }

  const success = (status.state === 200) ? true : false;

  res.send({
    success,
    code    : status.state,
    message : status.message,
    version : package.version
  });
  return next();
}

/**
 * Init working directory
 */
function initWorkingDirectory () {
  params.templatePath = path.join(params.workDir, 'template');
  params.renderPath   = path.join(params.workDir, 'render');
  params.assetPath    = path.join(params.workDir, 'asset');
  params.configPath   = path.join(params.workDir, 'config');
  params.pluginPath   = path.join(params.workDir, 'plugin');
  try { fs.mkdirSync(params.templatePath); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.renderPath);   } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.assetPath);    } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.configPath);    } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.pluginPath);    } catch (e) {}; // eslint-disable-line

  if (fs.existsSync(path.join(params.configPath, AUTH_KEY_NAME + '.pub')) === false) {
    kittenJwt.generateECDHKeys(params.configPath, 'key', (err) => {
      if (!err) {
        console.log('Keys generated');
      }
    });
  }

  if (fs.existsSync(path.join(params.configPath, 'config.json')) === false) {
    fs.writeFileSync(path.join(params.configPath, 'config.json'), '{}');
  }

  try {
    // copy python code oustide of the package to make it accessible for python
    var _pythonCode = fs.readFileSync(path.join(__dirname, './converter.py'));
    params.pythonPath = path.join(params.assetPath, './converter.py');
    fs.writeFileSync(params.pythonPath, _pythonCode);
  }
  catch (e) {
    console.log('Cannot write files in ' + params.assetPath);
    console.log('Is the working directory correct [--workdir]? ' + params.workDir);
  }
}

function getUUID () {
  return crypto.randomBytes(32).toString('hex');
}

function generateOutputFile () {
  return {
    renderPath   : params.renderPath,
    renderPrefix : ''
  };
}

/**
 * [generateReport description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function generateReport (req, res, next) {
  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('application/json') === -1) {
    res.send(returnMessage({ errorCode : 'w110' }), 400);
    return next();
  }

  console.log('REQUEST ' + req.method + ' ' + req.url);
  // We'll store every data we need here
  let _renderOptions   = req.body;
  const _templateId    = req.params.templateId;
  const _filename      = _templateId || '';
  const _resolvedInput = _filename.replace(/\.\./g,'');

  if (_renderOptions.data === undefined) {
    res.send(returnMessage({ errorCode : 'w111' }), 400);
    return next();
  }

  // Set the report name to empty string if does not exist
  _renderOptions.reportName = _renderOptions.reportName || '';
  // Prepend by the UUID
  _renderOptions.reportName = getUUID() + _renderOptions.reportName;
  // Ask a path instead of a buffer

  _renderOptions = Object.assign(_renderOptions, generateOutputFile(req));

  if (storageAddon && storageAddon.generateOutputFile !== undefined) {
    _renderOptions = Object.assign(_renderOptions, storageAddon.generateOutputFile(req));
  }

  const _data = _renderOptions.data;

  if (storageAddon && storageAddon.readTemplate !== undefined) {
    return storageAddon.readTemplate(req, _filename, (err, localPath) => {
      if (err) {
        res.send({ success : false, error : err.toString() }, 400);
        return next();
      }

      return renderReport(req, res, localPath, _data, _renderOptions, next);
    });
  }

  return renderReport(req, res, _resolvedInput, _data, _renderOptions, next);
}

/**
 * Render a report calling carbone.render with the correct template path
 * @param {Object} req req from request
 * @param {Object} res res from request
 * @param {String} input file path
 * @param {Object} data Data to render
 * @param {Object} renderOptions Render options
 */
function renderReport (req, res, input, data, renderOptions, next) {
  try {
    let jsonSize = JSON.stringify(data).length;

    carbone.render(input, data, renderOptions, (err, reportPath, reportName) => {
      console.log('RENDER IN', reportPath, reportName);

      if (err) {
        console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + err);
        // Check if the error is a ENOENT error
        if (err.code === 'ENOENT') {
          res.send(returnMessage({ errorCode : 'w100' }), 404);
          return next();
        }
        res.send(returnMessage({ errorCode : 'w101', args : [err.toString()] }), 500);
        return next();
      }

      let statObject = {
        renderId : reportName,
        template : path.basename(input),
        user     : (req.jwtPayload !== undefined) ? req.jwtPayload.iss : null,
        options  : err ? renderOptions : null,
        jsonSize : jsonSize,
        error    : err
      };

      if (storageAddon && storageAddon.onRenderEnd !== undefined) {
        return storageAddon.onRenderEnd(req, res, reportName, reportPath, statObject, (err) => {
          if (err) {
            res.send(returnMessage({ errorCode : 'w101', args : [err.toString()] }), 500);
            return next();
          }

          res.send(returnMessage(null, null, { renderId : reportName }));
          return next();
        });
      }

      res.send({
        success : true,
        data    : {
          renderId : reportName
        }
      });
      return next();
    });
  }
  catch (e) {
    console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + e);
    res.send(returnMessage({ errorCode : 'w101', args : [e.toString()] }), 500);
    return next();
  }
}

/**
 * [getRenderedReport description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function getRenderedReport (req, res, next) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  const _renderId       = encodeURIComponent(decodeURIComponent(req.params.renderId));
  const _finalFilename  = path.join(params.renderPath, _renderId);

  if (storageAddon && storageAddon.readRender !== undefined) {
    return storageAddon.readRender(req, res, _renderId, (err, filename, localPath) => {
      const finalPath = (localPath === undefined) ? path.join(params.renderPath, filename) : path.join(localPath, filename);

      sendRenderedReport(req, res, finalPath, next);
    });
  }

  sendRenderedReport(req, res, _finalFilename, next);
}

/**
 * Send a rendered report
 * @param {Object} req req from request
 * @param {Object} res res from request
 * @param {String} finalFilename Render path to send
 */
function sendRenderedReport (req, res, finalFilename, next) {
  let _reportName = decodeURIComponent(path.basename(finalFilename));

  if (_reportName.split('.')[0].length !== 64) {
    _reportName = _reportName.substring(64);
  }

  res.setHeader('Content-Disposition', `filename="${_reportName}"`);
  fs.createReadStream(finalFilename)
    .on('error', (e) => {
      console.log('Send rendered report error: ' + e.toString());
      res.send(returnMessage({ errorCode : 'w102' }), 404);
      return next();
    })
    .on('close', () => {
      fs.unlink(finalFilename, (err) => {
        if (err) {
          console.log('[retrieve render] unlink error ', err);
        }

        return next();
      });
    })
    .pipe(res);
}

/**
 * Return template content
 * @param {Object} req Req from request
 * @param {Object} res Res from request
 * @param {Function} next
 */
function getTemplate (req, res, next) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  if (storageAddon && storageAddon.readTemplate !== undefined) {
    return storageAddon.readTemplate(req, req.params.templateId, (err, localPath) => {
      if (err) {
        res.send({ success : false, error : err.toString() }, 400);
        return next();
      }

      return sendTemplate(req, res, localPath, next);
    });
  }

  return sendTemplate(req, res, path.join(params.templatePath, req.params.templateId), next);
}

/**
 * Stream template to user
 * @param {Object} req Req from request
 * @param {Object} res Res from request
 * @param {String} localPath Local file path
 * @param {Function} next
 */
function sendTemplate (req, res, localPath, next) {
  carbone.getFileExtension(localPath, (err, extension) => {
    if (err) {
      console.log('[get template] error: ' + err.toString());
      res.send(returnMessage({ errorCode : 'w103' }));
      return next();
    }

    res.setHeader('Content-Disposition', `filename="${req.params.templateId}.${extension}"`);

    fs.createReadStream(localPath)
      .on('error', (e) => {
        console.log('Send template error: ' + e.toString());
        res.send(returnMessage({ errorCode : 'w104' }), 400);
        return next();
      })
      .on('close', () => {
        return next();
      })
      .pipe(res);
  });
}

/**
 * Delete a template
 * @param {Object} req Req from request
 * @param {Object} res Res from request
 * @param {Function} next
 */
function deleteTemplate (req, res, next) {
  console.log('REQUEST ' + req.method + ' ' + req.url);
  if (storageAddon && storageAddon.deleteTemplate !== undefined) {
    return storageAddon.deleteTemplate(req, res, req.params.templateId, (err, localPath) => {
      if (err) {
        res.send({ success : false, error : err.toString() }, 400);
        return next();
      }

      fs.unlink(localPath, (err) => {
        if (err) {
          res.send(returnMessage({ errorCode : 'w105' }), 404);
          return next();
        }

        res.send(returnMessage(null, 'Template deleted'));
        return next();
      });
    });
  }

  fs.unlink(path.join(params.templatePath, req.params.templateId), (err) => {
    if (err) {
      res.send(returnMessage({ errorCode : 'w105' }), 404);
      return next();
    }

    res.send(returnMessage(null, 'Template deleted'));
    return next();
  });
}

/**
 * [addTemplate description]
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
function addTemplate (req, res, next) {
  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('form-data') === -1) {
    res.send(returnMessage({ errorCode : 'w106' }), 400);
    return next();
  }

  const form = formidable({
    maxFileSize : 100 * 1024 * 1024,
    uploadDir   : params.templatePath
  });

  form.on('fileBegin', (name, file) => {
    file.path = path.join(params.templatePath, 'upload_' + name);
  });

  form.parse(req, (error, fields, files) => {
    if (error) {
      console.log('upload error: ', error.toString());
      res.send(returnMessage({ errorCode : 'w107' }), 400);
      return next();
    }

    if (files.template === undefined) {
      res.send(returnMessage({ errorCode : 'w112' }), 400);
      return next();
    }

    const payload = (fields.payload !== undefined) ? fields.payload : '';

    computeHash(files.template.path, payload, (err, hashId) => {
      if (err) {
        console.log('hash calculation error: ', err);
        res.send(returnMessage({ errorCode : 'w108' }), 400);
        return next();
      }

      writeTemplateLocally(req, res, files.template.path, hashId, (err) => {
        if (err) {
          console.log('write template error: ', err);
          res.send(returnMessage({ errorCode : 'w109' }), 400);
          return next();
        }

        console.log(`file uploaded : err: ${err} file: ${files.template.name} => ${hashId}`);

        res.send(returnMessage(null, null, { templateId : hashId }));
        return next();
      });
    });
  });
}

/**
 * Write a file on disk
 * @param {Stream} readStream File stream
 * @param {String} filename Filename to write on disk
 * @param {Function} callback
 */
function writeTemplateLocally (req, res, localPath, hashId, callback) {
  if (storageAddon && storageAddon.writeTemplate) {
    return storageAddon.writeTemplate(req, res, localPath, hashId, callback);
  }

  fs.rename(localPath, path.join(params.templatePath, hashId), (err) => {
    if (err) {
      return callback(err);
    }

    return callback(null);
  });
}

// https://stackoverflow.com/questions/7860449/accessing-the-raw-file-stream-from-a-node-formidable-file-upload

function computeHash (filepath, payload, callback) {
  const stream = fs.createReadStream(filepath);
  const _hash = crypto.createHash('sha256');

  _hash.setEncoding('hex');

  if (payload) {
    _hash.update(new Buffer(payload));
  }

  _hash.on('error', (err) => {
    console.log('Hash error', err);
    return callback(err.toString());
  });

  // When the hash has been computed
  _hash.on('finish', () => {
    return callback(null, _hash.read());
  });

  // Compute the hash
  stream.pipe(_hash);
}

/**
 * Execute a status render and save state in status global variable
 */
function executeStatusRender () {
  const filepath = path.join(__dirname, '..', 'health.docx');
  console.log('RUN STATUS RENDER');

  carbone.render(filepath, { firstname : 'John', lastname : 'Doe' }, { convertTo : 'pdf' }, (err) => {
    console.log('DONE');
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
 * Delete render older than 7 days and template older than 60 days
 */
function cleanDirectories () {
  console.log('LAUNCH DIRECTORY CLEANER');

  // Clean render directory
  exec(`cd ${params.renderPath} && find * -mtime +7 -exec rm {} \\;`, (err, stdout, stderr) => {
    console.log('CLEAN RENDERS EXECUTED');
    if (err) {
      console.log('Clean render directory error: ', err.message);
      return;
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
  });

  // Clean template directory
  exec(`cd ${params.templatePath} && find * -mtime +60 -exec rm {} \\;`, (err, stdout, stderr) => {
    console.log('CLEAN TEMPLATES EXECUTED');
    if (err) {
      console.log('Clean render directory error: ', err.message);
      return;
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
  });
}
