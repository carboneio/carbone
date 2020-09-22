const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const params = require('./params');
const carbone = require('./index');
const formidable = require('formidable');
const busboy = require('busboy');
const converter = require('./converter');
const bodyParser = require('body-parser');
const package = require('../package.json');
const restana = require('restana');
const kittenJwt = require('kitten-jwt');
const stream = require('stream');
let authAddon = null;
let storageAddon = null;
let service = null;

try {
  authAddon = require(path.join(params.workDir, 'addons', 'authentication.js'))
  storageAddon = require(path.join(params.workDir, 'addons', 'storage.js'))
} catch (e) {}

var usage = [
  '\n***********************************************************************',
  ' Server usage:',

  '\n # carbone webserver --port 4000 --workdir /var/www/carbone',
  '\t Start a carbone webserver by default on port '+params.port,
  '\t --port [-p] port number ('+params.port+') ',

  '\t --workdir [-w] working directory of carbone ('+params.workdir+') ',

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
  params.workdir = process.cwd();
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
          params.workdir = args.shift();
          break;
        case '--attempts':
        case '-a':
          params.attempts = args.shift();
          break;
        case '--auth':
        case '-A':
          params.authentication = true;
          break;
        case '--help':
        case '-h':
          exit(usage);
          break;
        default:
          exit(usage);
          break;
      }
    }
    // handle exit signals
    ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'].forEach(function (signal) {
      process.on(signal, function () {
        exit('\nCarbone: Exit with signal '+signal);
      });
    });
    params.startFactory = true;
    initWorkingDirectory();
    console.log('\nCarbone-Enterprise-Edition (BETA On-Premise) : v' + package.version);
    console.log('License:');
    console.log('- Trial period valid until 30th September 2020');
    console.log('- Not for commercial use, only for testing purpose');
    console.log('- Proprietary software made by Ideoys SAS - France - 521 295 162 00023 RCS');
    if (Date.now() > 1601503200000) {
      // Hello, if you find this code, congratulation :). You must respect the license.
      console.log('Trial period expired');
      process.exit();
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
  service.use(bodyParser.json({limit : '60mb'}));
  service.use(cors({
    // When cors is enable, "Access-Control-Expose-Headers" have to be defined to return specific headers
    exposedHeaders: ['X-Request-URL', 'Content-Disposition']
  }));
  service.options('*', cors());
  service.use((req, res, next) => {
    // https://github.com/github/fetch#obtaining-the-response-url
    res.setHeader('X-Request-URL', req.url);
    return next();
  });

  if (params.authentication) {
    let func = (authAddon && authAddon.getPublicKey !== undefined) ? authAddon.getPublicKey : getPublicKey;
    service.use(kittenJwt.verifyHTTPHeaderFn('carbone-ee', func))
  }

  formidable({
    uploadDir : params.templatePath
  });

  service.start(params.port).then(() => {});

  service.get('/status', getStatus);

  service.post('/render/:templateId', generateReport);
  service.get ('/render/:renderId', getRenderedReport);

  service.post('/template', addTemplate);
}

function stopServer (callback) {
  authAddon = null;
  storageAddon = null;
  converter.exit(() => {
    service.close().then(() => {
      service = null;
      return callback();
    });
  });
}

/**
 * Read, parse and assign value to params object
 * @param {Function} callback
 */
function parseConfig (callback) {
  let configPath = path.join(params.workDir, 'config', 'config.json');

  fs.readFile(configPath, 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read config file in ' + configPath));
    }

    let config = {};

    try {
      config = JSON.parse(content);
    } catch (e) {
      return callback(new Error('Cannot parse config file in ' + configPath));
    }

    for (let i = 0; i < Object.keys(config).length; i++) {
      let key = Object.keys(config)[i];

      if (params[key] === undefined) {
        return callback(new Error('Unknown parameter ' + key + ' in config file: ' + configPath));
      }

      params[key] = process.env['CARBONE_EE_' + key.toUpperCase()] || config[key];
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
  fs.readFile(path.join(__dirname, '..', 'config', 'key.pub'), 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read public key ' + err.toString()));
    }

    return callback(content)
  });
}

/**
 * Generate a JWT token to use the webserver with authentication
 * @param {Function} callback
 */
function generateToken (callback) {
  // Read the private key
  fs.readFile(path.join(params.workDir, 'config', 'key.pem'), 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read file ' + path.join(params.workDir, 'config', 'key.pem')));
    }

    let token = kittenJwt.getToken('carbone-user', 'carbone-ee', content);

    return callback(null, token);
  });
}

module.exports = {
  stopServer,
  handleParams,
  generateToken
};

function test (req, res, next) {
  console.log(_addons)
  if (_addons) {
    _addons()
  }

  next()
}

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
  res.body = {
    success : true,
    version : package.version
  };
  res.send();
}

/**
 * Init working directory
 */
function initWorkingDirectory () {
  params.templatePath = path.join(params.workdir, 'template');
  params.renderPath   = path.join(params.workdir, 'render');
  params.assetPath    = path.join(params.workdir, 'asset');
  try { fs.mkdirSync(params.templatePath); } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.renderPath);   } catch (e) {}; // eslint-disable-line
  try { fs.mkdirSync(params.assetPath);    } catch (e) {}; // eslint-disable-line
  try {
    // copy python code oustide of the package to make it accessible for python
    var _pythonCode = fs.readFileSync(path.join(__dirname, './converter.py'));
    params.pythonPath = path.join(params.assetPath, './converter.py');
    fs.writeFileSync(params.pythonPath, _pythonCode);
  }
  catch (e) {
    console.log('Cannot write files in ' + params.assetPath);
    console.log('Is the working directory correct [--workdir]? ' + params.workdir);
  }
}

function getUUID () {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * [generateReport description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function generateReport (req, res) {

  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('application/json') === -1) {
    return res.send({
      success : false,
      error   : 'Request Error: Content-Type header is not application/json.'
    }, 400);
  }


  console.log('REQUEST ' + req.method + ' ' + req.url);
  // We'll store every data we need here
  let _renderOptions   = req.body;
  const _templateId    = req.params.templateId;
  const _filename      = _templateId || '';
  const _resolvedInput = _filename.replace(/\.\./g,'');

  if (_renderOptions.data == undefined) {
    return res.send({
      success : false,
      error   : 'Missing data key in body'
    }, 400);
  }

  // Set the report name to empty string if does not exist
  _renderOptions.reportName = _renderOptions.reportName || '';
  // Prepend by the UUID
  _renderOptions.reportName = getUUID() + _renderOptions.reportName;

  const _data = _renderOptions.data;

  try {
    carbone.render(_resolvedInput, _data, _renderOptions, (err, data, reportName, extension) => {
      if (err) {
        console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + err);
        // Check if the error is a ENOENT error
        if (err.code === 'ENOENT') {
          return res.send({
            success : false,
            error   : 'Template not found'
          }, 404);
        }
        return res.send({
          success : false,
          error   : 'Error while rendering template ' + err.toString()
        }, 500);
      }

      let _ext = extension;
      if (typeof(_renderOptions.convertTo) === 'object' && _renderOptions.convertTo.formatName) {
        _ext = _renderOptions.convertTo.formatName;
      }
      else if (_renderOptions.convertTo) {
        _ext = _renderOptions.convertTo;
      }

      reportName = encodeURIComponent(`${reportName}.${_ext}`);

      const _outputFilename = path.join(params.renderPath, reportName);

      console.log('RENDER DONE ' + req.method + ' ' + req.url + '' + _outputFilename);

      fs.writeFile(_outputFilename, data, err => {
        if (err) {
          console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + err);
          return res.send({
            success : false,
            error   : 'Error while rendering template ' + err.toString()
          }, 500);
        }
        return res.send({
          success : true,
          data    : {
            renderId : reportName
          }
        });
      });
    });
  }
  catch (e) {
    console.log('RENDERING ERROR ' + req.method + ' ' + req.url + ' ' + e);
    return res.send({
      success : false,
      error   : 'Error while rendering template ' + e.toString()
    });
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
  const _renderId       = encodeURIComponent(decodeURIComponent(req.params.renderId));
  const _finalFilename  = path.join(params.renderPath, _renderId);
  console.log(req.params.renderId)

  let _reportName = decodeURIComponent(path.basename(_finalFilename));

  if (_reportName.split('.')[0].length !== 64) {
    _reportName = _reportName.substring(64);
  }

  res.setHeader('Content-Disposition', `filename="${_reportName}"`);
  fs.createReadStream(_finalFilename)
    .on('error', (e) => {
      res.send({
        success : false,
        error   : 'Request Error: rendered file does not exist'
      }, 404);
    })
    .on('close', () => {
      fs.unlink(_finalFilename, (err) => {
        if (err) {
          console.log('[retrieve render] unlink error ', err);
        }
      });
    })
    .pipe(res);
}


/**
 * [addTemplate description]
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
function addTemplate (req, res) {
  if (!req.headers['content-type'] || req.headers['content-type'].indexOf('form-data') === -1) {
    return res.send({ success : false, error : 'Request Error: Content-Type header should be multipart/form-data' }, 400);
  }

  let bb = null;

  try {
    bb = new busboy({ headers: req.headers });
  } catch (err) {
    console.log('Busboy error', err.toString());
    return res.send({ success : false, error : 'Try uploading your file using form data' }, 400);
  }

  let template = null;
  let payload = '';
  let gotFile = false;

  bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
    gotFile = true;

    if (fieldname !== 'template') {
      return res.send({ success : false, error : 'Request Error: "template" field is empty' }, 400);
    }

    let hashStream = file.pipe(new stream.PassThrough());
    let fileWriteStream = file.pipe(new stream.PassThrough());

    if (fieldname === 'template') {
      computeHash(hashStream, payload, (err, hashId) => {
        if (err) {
          return res.send({ success : false, error : 'Error when uploading file' }, 500);
        }

        console.log(`file uploaded : err: ${err} file: ${filename} => ${hashId}`);

        writeTemplateLocally(fileWriteStream, hashId, (err) => {
          if (err) {
            console.log('Write stream error: ', err);

            return res.send({ success : false, error : err.message || err.toString() }, 500);
          }

          return res.send({
            success : true,
            data    : {
              templateId : hashId
            }
          });
        });
      });
    }
  });

  bb.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    if (fieldname !== 'payload') {
      return res.send({ success : false, error : 'Request Error: "' + fieldname + '" is an unknown field, do you mean payload?' }, 400);
    }

    payload = val;
  });

  bb.on('finish', () => {
    if (gotFile === false) {
      return res.send({ success : false, error : 'Request Error: "template" field is empty' }, 400);
    }
  })

  req.pipe(bb)
}

/**
 * Write a file on disk
 * @param {Stream} readStream File stream
 * @param {String} filename Filename to write on disk
 * @param {Function} callback
 */
function writeTemplateLocally (readStream, hashId, callback) {
  if (storageAddon && storageAddon.writeTemplate) {
    return storageAddon.writeTemplate(readStream, hashId, callback);
  }

  const writeStream = fs.createWriteStream(path.join(params.templatePath, hashId));

  writeStream.on('error', (err) => {
    return callback(new Error('Error when uploading file'));
  });

  writeStream.on('finish', () => {
    return callback(null);
  });

  readStream.pipe(writeStream);
}

// https://stackoverflow.com/questions/7860449/accessing-the-raw-file-stream-from-a-node-formidable-file-upload

function computeHash (stream, payload, callback) {
  const _hash = crypto.createHash('sha256');

  _hash.setEncoding('hex');

  if (payload) {
    _hash.update(new Buffer(payload));
  }

  _hash.on('error', (err) => {
    console.log('Hash error', err);
    return callback(err.toString);
  });

  // When the hash has been computed
  _hash.on('finish', () => {
    return callback(null, _hash.read());
  });

  // Compute the hash
  stream.pipe(_hash);
}
