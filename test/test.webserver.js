let webserver  = null;
const get        = require('simple-get');
const fs         = require('fs');
const path       = require('path');
const FormData   = require('form-data');
const assert     = require('assert');
const carbone    = require('../lib/index');
const sinon      = require('sinon');
const os         = require('os');
const { exec }   = require('child_process');
const package    = require('../package.json');
const params     = require('../lib/params');
const helper     = require('../lib/helper');

function deleteRequiredFiles () {
  try {
    delete require.cache[require.resolve('../lib/webserver')];
    delete require.cache[require.resolve(path.join(os.tmpdir(), 'plugin', 'authentication.js'))];
    delete require.cache[require.resolve(path.join(os.tmpdir(), 'plugin', 'storage.js'))];
  }
  catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.log(e);
    }
  }
}

function getBody (port, route, method, body, token) {
  let toSend = {
    url     : `http://localhost:${port}${route}`,
    method  : method,
    headers : {}
  };

  if (method === 'POST') {
    if (body !== undefined) {
      toSend.body = body;
    }

    if (body.constructor === FormData) {
      toSend.headers['Content-Type'] = 'multipart/form-data;boundary=' + body.getBoundary();
    }
    else if (body !== undefined && body !== null) {
      toSend.json = true;
    }
  }

  if (token !== undefined && token !== null) {
    toSend.headers.Authorization = 'Bearer ' + token;
  }

  return toSend;
}

/**
 * Upload a template file for test
 * @param {Number} port Server port
 * @param {String} token Auth token
 * @param {Function} callback
 */
function uploadFile (port, token, callback) {
  let form = new FormData();

  form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

  let headers = {
    'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
  };

  if (token !== null) {
    headers.Authorization = 'Bearer ' + token;
  }

  get.concat({
    url    : 'http://localhost:'+port+'/template',
    method : 'POST',
    headers,
    body   : form
  }, (err, res, data) => {
    assert.strictEqual(err, null);
    data = JSON.parse(data);
    assert.strictEqual(data.success, true);
    callback();
  });
}

/**
 * Write a default config on disk including plugins and config directory
 */
function writeConfigFile () {
  const pluginDir = path.join(os.tmpdir(), 'plugin');
  const configDir = path.join(os.tmpdir(), 'config');

  if (fs.existsSync(configDir) === false) {
    fs.mkdirSync(path.join(os.tmpdir(), 'config'));
  }
  if (fs.existsSync(pluginDir) === false) {
    fs.mkdirSync(path.join(os.tmpdir(), 'plugin'));
  }
  fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'config', 'config.json'), path.join(os.tmpdir(), 'config', 'config.json'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'config', 'key.pem'), path.join(os.tmpdir(), 'config', 'key.pem'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'config', 'key.pub'), path.join(os.tmpdir(), 'config', 'key.pub'));
}

/**
 * Clean config wrote on disk
 */
function unlinkConfigFile () {
  const fileToCheck = [
    path.join(os.tmpdir(), 'plugin', 'authentication.js'),
    path.join(os.tmpdir(), 'plugin', 'storage.js'),
    path.join(os.tmpdir(), 'plugin', 'middlewares.js'),
    path.join(os.tmpdir(), 'beforeFile'),
    path.join(os.tmpdir(), 'beforeFile2'),
    path.join(os.tmpdir(), 'afterFile'),
    path.join(os.tmpdir(), 'afterFile2'),
    path.join(os.tmpdir(), 'config', 'config.json'),
    path.join(os.tmpdir(), 'config', 'key.pem'),
    path.join(os.tmpdir(), 'config', 'key.pub')
  ];

  for (let i = 0; i < fileToCheck.length; i++) {
    if (fs.existsSync(fileToCheck[i])) {
      fs.unlinkSync(fileToCheck[i]);
    }
  }

  delete process.env.CARBONE_EE_AUTHENTICATION;

  fs.rmdirSync(path.join(os.tmpdir(), 'config'));
  fs.rmdirSync(path.join(os.tmpdir(), 'plugin'));
}

describe('Webserver', () => {
  before(() => {
    writeConfigFile();
  });

  after(() => {
    unlinkConfigFile();
  });

  describe('WebServer Initialisations', () => {
    describe('handleParams', () => {
      it('should change the default configurations from the CLI', (done) => {
        params.bind = '127.0.0.2';
        const _port = '4321';
        const _workdir = path.join(os.tmpdir(), 'testCLI');
        const _factories = '2';
        const _attempts = '3';
        const _bind = '127.0.0.1';
        webserver = require('../lib/webserver');
        webserver.handleParams(['--port', _port, '--workdir', _workdir, '--factories', _factories, '--attempts', _attempts,'--bind', _bind, '--authentication'], () => {
          assert.strictEqual(params.port, _port);
          assert.strictEqual(fs.existsSync(_workdir), true);
          helper.rmDirRecursive(_workdir);
          assert.strictEqual(params.factories, _factories);
          assert.strictEqual(params.attempts, _attempts);
          assert.strictEqual(params.bind, _bind);
          params.bind = '127.0.0.1';
          assert.strictEqual(params.authentication, true);
          webserver.stopServer(done);
        });
      });

      it('should change the default configurations from the ENV', (done) => {
        params.bind = '127.0.0.2';
        process.env.CARBONE_EE_PORT = '4006';
        process.env.CARBONE_EE_WORKDIR = path.join(os.tmpdir(), 'testENV');
        process.env.CARBONE_EE_FACTORIES = '2';
        process.env.CARBONE_EE_ATTEMPTS = 2;
        process.env.CARBONE_EE_BIND = '127.0.0.1';
        process.env.CARBONE_EE_AUTHENTICATION = 'true';
        webserver = require('../lib/webserver');
        webserver.handleParams([], () => {
          assert.strictEqual(params.port + '', process.env.CARBONE_EE_PORT);
          assert.strictEqual(fs.existsSync(process.env.CARBONE_EE_WORKDIR), true);
          assert.strictEqual(params.factories + '', process.env.CARBONE_EE_FACTORIES + '');
          assert.strictEqual(params.attempts + '', process.env.CARBONE_EE_ATTEMPTS + '');
          assert.strictEqual(params.bind, process.env.CARBONE_EE_BIND);
          params.bind = '127.0.0.1';
          assert.strictEqual(params.authentication + '', process.env.CARBONE_EE_AUTHENTICATION);
          // clean
          helper.rmDirRecursive(process.env.CARBONE_EE_WORKDIR);
          delete process.env.CARBONE_EE_PORT;
          delete process.env.CARBONE_EE_WORKDIR;
          delete process.env.CARBONE_EE_FACTORIES;
          delete process.env.CARBONE_EE_ATTEMPTS;
          delete process.env.CARBONE_EE_BIND;
          delete process.env.CARBONE_EE_AUTHENTICATION;
          webserver.stopServer(done);
        });
      });

      it('should change the default configurations from the config.json file', (done) => {
        params.bind = '127.0.0.2';
        const _workdir = path.join(os.tmpdir(), 'testConfig');
        const _workdirConfig = path.join(_workdir, 'config');
        const _configContent = {
          port           : 4008,
          bind           : '127.0.0.1',
          factories      : 4,
          attempts       : 2,
          authentication : true
        };
        fs.mkdirSync(_workdirConfig, { recursive : true });
        fs.writeFileSync(path.join(_workdirConfig, 'config.json'), JSON.stringify(_configContent));
        webserver = require('../lib/webserver');
        webserver.handleParams(['--workdir', _workdir], () => {
          assert.strictEqual(params.port, _configContent.port);
          assert.strictEqual(params.factories, _configContent.factories);
          assert.strictEqual(params.attempts, _configContent.attempts);
          assert.strictEqual(params.bind, _configContent.bind);
          params.bind = '127.0.0.1';
          assert.strictEqual(params.authentication, _configContent.authentication);
          helper.rmDirRecursive(_workdir);
          webserver.stopServer(done);
        });
      });

      it('should configure with this priority order: CLI > ENV > config.json', function (done) {
        const _expectedPort = 4011;
        const _expectedFactories = 2;
        const _expectedAttempts = 5;
        const _expectedBind = '127.0.0.1';
        const _workdir = path.join(os.tmpdir(), 'testPriority');
        const _workdirConfig = path.join(_workdir, 'config');
        // INIT ENV
        process.env.CARBONE_EE_PORT = 4010;
        process.env.CARBONE_EE_FACTORIES = 2;
        // INIT CONFIG FILE
        const _configContent = {
          port           : 4008,
          bind           : '127.0.0.5',
          factories      : 5,
          attempts       : _expectedAttempts,
          authentication : false
        };
        fs.mkdirSync(_workdirConfig, { recursive : true });
        fs.writeFileSync(path.join(_workdirConfig, 'config.json'), JSON.stringify(_configContent));
        // RUN SERVER
        webserver = require('../lib/webserver');
        webserver.handleParams(['--bind', _expectedBind, '--port', _expectedPort ,'--workdir', _workdir, '--authentication'], () => {
          assert.strictEqual(params.port, _expectedPort);
          assert.strictEqual(params.factories, _expectedFactories);
          assert.strictEqual(params.attempts, _expectedAttempts);
          assert.strictEqual(params.bind, _expectedBind);
          assert.strictEqual(params.authentication, true);
          // clean
          helper.rmDirRecursive(_workdir);
          delete process.env.CARBONE_EE_PORT;
          delete process.env.CARBONE_EE_FACTORIES;
          webserver.stopServer(done);
        });
      });
    });

    describe('initWorkingDirectory (handleParams is calling the function)', () => {
      it('should create nested workdir with sub directories if it does not exist and \
          the asset folder should contain the converter.py and \
          the config folder should contain the config files (keys + config.json)', (done) => {
        const _listDir = ['template', 'render', 'asset', 'config', 'plugin'];
        const _workdir = path.join(os.tmpdir(), '/this/is/a/special/dir/1/2/3/');
        webserver = require('../lib/webserver');
        webserver.handleParams(['--port', 4000, '--workdir', _workdir], () => {
          assert.strictEqual(fs.existsSync(_workdir), true);
          _listDir.forEach(subdir => {
            const _subPath = path.join(_workdir, subdir);
            assert.strictEqual(fs.existsSync(_subPath), true);
            if (subdir === 'asset') {
              assert.strictEqual(fs.existsSync(path.join(_subPath, 'converter.py')), true);
            }
            if (subdir === 'config') {
              assert.strictEqual(fs.existsSync(path.join(os.tmpdir(), 'config', 'config.json')), true);
              assert.strictEqual(fs.existsSync(path.join(os.tmpdir(), 'config', 'key.pem')), true);
              assert.strictEqual(fs.existsSync(path.join(os.tmpdir(), 'config', 'key.pub')), true);
            }
          });
          helper.rmDirRecursive(_workdir);
          assert.strictEqual(fs.existsSync(_workdir), false);
          webserver.stopServer(done);
        });
      });
    });
  });

  describe('With authentication with plugins / middlewares', () => {
    let token = null;
    let toDelete = [];

    describe('Plugins: writeTemplate, readTemplate, onRenderEnd (with res), readRender and middlewares', () => {
      before((done) => {
        fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'plugin', 'authentication.js'), path.join(os.tmpdir(), 'plugin', 'authentication.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'plugin', 'storage.js'), path.join(os.tmpdir(), 'plugin', 'storage.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'plugin', 'middlewares.js'), path.join(os.tmpdir(), 'plugin', 'middlewares.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'webserver', 'config', 'key.pub'), path.join(os.tmpdir(), 'key.pub'));
        deleteRequiredFiles();
        webserver = require('../lib/webserver');
        webserver.handleParams(['--authentication', '--port', 4001, '--workdir', os.tmpdir()], () => {
          webserver.generateToken((_, newToken) => {
            token = newToken;
            done();
          });
        });
      });

      after((done) => {
        const fileToCheck = [
          path.join(os.tmpdir(), 'plugin', 'authentication.js'),
          path.join(os.tmpdir(), 'plugin', 'storage.js'),
          path.join(os.tmpdir(), 'plugin', 'middlewares.js'),
          path.join(os.tmpdir(), 'beforeFile'),
          path.join(os.tmpdir(), 'beforeFile2'),
          path.join(os.tmpdir(), 'afterFile'),
          path.join(os.tmpdir(), 'afterFile2'),
          path.join(os.tmpdir(), 'key.pub')
        ];

        for (let i = 0; i < fileToCheck.length; i++) {
          if (fs.existsSync(fileToCheck[i])) {
            fs.unlinkSync(fileToCheck[i]);
          }
        }

        webserver.stopServer(done);
      });

      afterEach(() => {
        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(os.tmpdir(), 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(os.tmpdir(), 'template', toDelete[i]));
          }
        }

        toDelete = [];
      });

      it('should upload the template and use authentication and storage plugin', (done) => {
        let form = new FormData();

        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

        get.concat(getBody(4001, '/template', 'POST', form, token), (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          let exists = fs.existsSync(path.join(os.tmpdir(), 'PREFIX_9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          assert.strictEqual(exists, true);
          fs.unlinkSync(path.join(os.tmpdir(), 'PREFIX_9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          setTimeout(() => {
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'beforeFile')).toString(), 'BEFORE FILE');
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'beforeFile2')).toString(), 'BEFORE FILE 2');
            // assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'afterFile')).toString(), 'AFTER FILE');
            // assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'afterFile2')).toString(), 'AFTER FILE 2');
            done();
          }, 100);
        });
      });

      it('should render a template using readTemplate, onRenderEnd and readRender plugins', (done) => {
        let templateId = '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47';
        let body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          complement : {},
          enum       : {}
        };

        uploadFile(4001, token, () => {
          get.concat(getBody(4001, `/render/${templateId}`, 'POST', body, token), (err, res, data) => {
            assert.strictEqual(err, null);
            assert.strictEqual(data.success, true);
            assert.strictEqual(fs.existsSync(path.join(os.tmpdir(), 'titi' + data.data.renderId)), true);
            assert.strictEqual(data.data.renderId.startsWith('REPORT'), true);
            assert.strictEqual(data.data.renderId.endsWith('.html'), true);

            get.concat({
              url     : 'http://localhost:4001/render/' + data.data.renderId,
              headers : {
                Authorization : 'Bearer ' + token
              }
            }, (err, res, data) => {
              assert.strictEqual(data.toString(), '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
              done();
            });
          });
        });
      });

      it('should return template in the user location choice', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'PREFIX_abcdefghi')}`, () => {
          get.concat(getBody(4001, '/template/abcdefghi', 'GET', null, token), (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="abcdefghi.html"');
            assert.strictEqual(data.toString(), '<!DOCTYPE html>\n<html>\n<p>I\'m a Carbone template !</p>\n<p>I AM {d.firstname} {d.lastname}</p>\n</html>\n');
            fs.unlinkSync(path.join(os.tmpdir(), 'PREFIX_abcdefghi'));
            done();
          });
        });
      });

      it('should delete a template in the user location choice', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'PREFIX_abcdef')}`, () => {
          get.concat(getBody(4001, '/template/abcdef', 'DELETE', null, token), (err, res, data) => {
            data = JSON.parse(data.toString());
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.message, 'Template deleted');
            done();
          });
        });
      });

      it('should delete a template in the user location choice with the header Expect:100-continue', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'PREFIX_abcdef')}`, () => {
          const _request = getBody(4001, '/template/abcdef', 'DELETE', null, token);
          _request.headers.Expect = '100-continue';
          get.concat(_request, (err, res, data) => {
            data = JSON.parse(data.toString());
            assert.strictEqual(res.headers.checkcontinue, 'done');
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.message, 'Template deleted');
            done();
          });
        });
      });

    });
  });

  describe('With authentication without plugin', () => {
    let token = null;
    let toDelete = [];

    before((done) => {
      deleteRequiredFiles();
      webserver = require('../lib/webserver');

      webserver.handleParams(['--authentication', '--port', 4001, '--workdir', os.tmpdir()], () => {
        webserver.generateToken((_, newToken) => {
          token = newToken;
          done();
        });
      });
    });

    after((done) => {
      webserver.stopServer(done);
    });

    afterEach(() => {
      for (let i = 0; i < toDelete.length; i++) {
        if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
          fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]));
        }
      }

      toDelete = [];
    });

    it('should not upload template if user is not authenticated', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

      get.concat(getBody(4001, '/template', 'POST', form, null), (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error, 'Error: No JSON Web Token detected in Authorization header or Cookie. Format is "Authorization: jwt" or "Cookie: access_token=jwt"');
        done();
      });
    });

    it('should access status route if user is not authenticated', (done) => {

      get.concat(getBody(4001, '/status', 'GET'), (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.version, package.version);
        done();
      });
    }).timeout(20000);

    it('should upload the template if user is authenticated', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

      get.concat(getBody(4001, '/template', 'POST', form, token), (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        let exists = fs.existsSync(path.join(os.tmpdir(), 'template', '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
        assert.strictEqual(exists, true);
        toDelete.push('9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        done();
      });
    });

    it('should upload the template if user is authenticated with the header Expect:100-continue', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

      const _request = getBody(4001, '/template', 'POST', form, token);
      _request.headers.Expect = '100-continue';
      get.concat(_request, (err, res, data) => {
        assert.strictEqual(res.headers.checkcontinue, 'done');
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        let exists = fs.existsSync(path.join(os.tmpdir(), 'template', '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
        assert.strictEqual(exists, true);
        toDelete.push('9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        done();
      });
    });
  });

  describe('With authentication with environment variable', () => {
    let toDelete = [];

    before((done) => {
      process.env.CARBONE_EE_AUTHENTICATION = true;
      deleteRequiredFiles();
      webserver = require('../lib/webserver');

      webserver.handleParams(['--port', 4002, '--workdir', os.tmpdir()], done);
    });

    after((done) => {
      delete process.env.CARBONE_EE_AUTHENTICATION;
      webserver.stopServer(done);
    });

    afterEach(() => {
      for (let i = 0; i < toDelete.length; i++) {
        if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
          fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]));
        }
      }

      toDelete = [];
    });

    it('should not upload template if user is not authenticated', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

      get.concat(getBody(4002, '/template', 'POST', form), (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error, 'Error: No JSON Web Token detected in Authorization header or Cookie. Format is "Authorization: jwt" or "Cookie: access_token=jwt"');
        done();
      });
    });
  });

  describe('Without authentication', () => {
    let templateId = '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47';

    before((done) => {
      deleteRequiredFiles();
      webserver = require('../lib/webserver');

      process.env.CARBONE_EE_AUTHENTICATION = false;

      webserver.handleParams(['--port', 4000, '--workdir', os.tmpdir()], done);
    });

    after((done) => {
      delete process.env.CARBONE_EE_AUTHENTICATION;
      webserver.stopServer(done);
    });

    describe('Render template', () => {
      let toDelete = [];
      let spyRender = null;

      before((done) => {
        uploadFile(4000, null, done);
      });

      beforeEach(() => {
        spyRender = sinon.spy(carbone, 'render');
      });

      afterEach(() => {
        spyRender.restore();

        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(os.tmpdir(), 'render', toDelete[i]))) {
            fs.unlinkSync(path.join(os.tmpdir(), 'render', toDelete[i]));
          }

          if (fs.existsSync(path.join(os.tmpdir(), 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(os.tmpdir(), 'template', toDelete[i]));
          }
        }

        toDelete = [];
      });

      after((done) => {
        if (fs.existsSync(path.join(os.tmpdir(), 'template', templateId))) {
          fs.unlinkSync(path.join(os.tmpdir(), 'template', templateId));
        }

        done();
      });

      it('should render a template', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, true);
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should render a template with the 100-continue header', (done) => {
        const _body = getBody(4000, `/render/${templateId}`, 'POST', {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          }
        });
        _body.headers.Expect = '100-continue';
        get.concat(_body, (err, res, data) => {
          assert.strictEqual(res.headers.checkcontinue, 'done');
          assert.strictEqual(data.success, true);
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should not crash if data key does not exists', (done) => {
        const body = {
          firstname : 'John',
          lastname  : 'Doe'
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Missing data key in body');
          done();
        });
      });

      it('should render template and keep all user choice in a prod env', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          convertTo : {
            formatName    : 'pdf',
            formatOptions : {
              EncryptFile          : false,
              DocumentOpenPassword : 'Pass',
              Watermark            : 'My Watermark'
            }
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, true);
          const renderOptions = spyRender.firstCall.args;
          assert.deepStrictEqual(renderOptions[2].convertTo, {
            formatName    : 'pdf',
            formatOptions : {
              EncryptFile           : false,
              DocumentOpenPassword  : 'Pass',
              ReduceImageResolution : false,
              Watermark             : 'My Watermark'
            }
          });
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should return a 404 error if the template does not exists', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, '/render/nopeidontexists', 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(res.statusCode, 404);
          assert.strictEqual(data.error, 'Template not found');
          done();
        });
      });

      it('should render template and encode filename on disk', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          reportName : 'hello how are you?',
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, true);
          const decodedFilename = carbone.decodeRenderedFilename(data.data.renderId);
          assert.deepStrictEqual(decodedFilename, {
            reportName : 'hello how are you?',
            extension  : 'html'
          });
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          done();
        });
      });

      it('should render template and format the renderId well', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.endsWith('.html'), true);
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should render template with given filename processed by Carbone', (done) => {
        const body = {
          reportName : '{d.title}.oui',
          data       : {
            title : 'MyRender'
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          const _expect = '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM  </p> </html> ';
          const decodedFilename = carbone.decodeRenderedFilename(data.data.renderId);

          assert.deepStrictEqual(decodedFilename, {
            reportName : 'MyRender.oui',
            extension  : 'html'
          });

          assert.strictEqual(err, null);
          assert.strictEqual(data.success, true);
          assert.strictEqual(_renderedFile, _expect);
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should not render template if the "content-type" is not set to "application/json"', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          method : 'POST'
        }, (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Content-Type header is not application/json');
          done();
        });
      });

      it('should not render template (path injection)', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, '/render/..%2F..%2F..%2F..%2Fdatasets%2Ftemplate.html', 'POST', body), (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Template not found');
          done();
        });
      });
    });

    describe('Get render', () => {
      let toDelete = [];

      before((done) => {
        uploadFile(4000, null, done);
      });

      afterEach(() => {
        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(os.tmpdir(), 'render', toDelete[i]))) {
            fs.unlinkSync(path.join(os.tmpdir(), 'render', toDelete[i]));
          }

          if (fs.existsSync(path.join(os.tmpdir(), 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(os.tmpdir(), 'template', toDelete[i]));
          }
        }

        toDelete = [];
      });

      after((done) => {
        if (fs.existsSync(path.join(os.tmpdir(), 'template', templateId))) {
          fs.unlinkSync(path.join(os.tmpdir(), 'template', templateId));
        }

        done();
      });

      it('should retrieve the render file', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          reportName : 'renderedReport',
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(err, null);
          get.concat(getBody(4000, `/render/${data.data.renderId}`, 'GET'), (err, res, data) => {
            assert.strictEqual(err, null);
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
            done();
          });
        });
      });

      it('should retrieve the render file, get the filename and get the header "access-control-expose-headers" for CORS', (done) => {
        const body = {
          data : {
            firstname : 'John',
            lastname  : 'Doe'
          },
          reportName : 'renderedReport',
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(err, null);

          get.concat(getBody(4000, `/render/${data.data.renderId}`, 'GET'), (err, res) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            done();
          });
        });
      });

      it('should delete the rendered file after download it', (done) => {
        const body = {
          data       : { firstname : 'John', lastname : 'Doe' },
          reportName : 'renderedReport',
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          assert.strictEqual(err, null);
          const renderId = data.data.renderId;
          let exists = fs.existsSync(`${params.renderPath}/${renderId}`);

          assert.strictEqual(exists, true);

          get.concat(getBody(4000, `/render/${data.data.renderId}`, 'GET'), (err, res) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            // add a timeout because we receive the response before the file unlinking
            setTimeout(() => {
              let exists = fs.existsSync(`${params.renderPath}/${renderId}`);

              assert.strictEqual(exists, false);
              done();
            }, 10);
          });
        });
      });

      it('should retrieve the render file and have its name encoded', (done) => {
        const body = {
          data       : { firstname : 'John', lastname : 'Doe' },
          reportName : 'encoded filename',
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          get.concat(getBody(4000, `/render/${data.data.renderId}`, 'GET'), (err, res) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="encoded%20filename.html"');
            done();
          });
        });
      });

      it('should retrieve the rendered file with report as filename. And set access-control-allow-origin to allow fetch from another domain', (done) => {
        const body = {
          data       : { firstname : 'John', lastname : 'Doe' },
          complement : {},
          enum       : {}
        };

        get.concat(getBody(4000, `/render/${templateId}`, 'POST', body), (err, res, data) => {
          get.concat(getBody(4000, `/render/${data.data.renderId}`, 'GET'), (err, res) => {
            assert.strictEqual(res.headers['access-control-allow-origin'], '*');
            assert.strictEqual(res.headers['content-disposition'], 'filename="report.html"');
            done();
          });
        });
      });

      it('should not retrieve anything (does not exist)', (done) => {
        get.concat(getBody(4000, '/render/nopeidontexists', 'GET'), (err, res) => {
          assert.strictEqual(res.statusCode, 404);
          done();
        });
      });
    });

    describe('Add template', () => {
      let toDelete = [];

      afterEach(() => {
        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]));
          }
        }

        toDelete = [];
      });

      it('should upload the template', (done) => {
        let form = new FormData();

        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

        get.concat(getBody(4000, '/template', 'POST', form), (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          let exists = fs.existsSync(path.join(os.tmpdir(), 'template', '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          assert.strictEqual(exists, true);
          toDelete.push('9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          done();
        });
      });

      it('should upload a big template', (done) => {
        let form = new FormData();

        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'big_template.docx')));

        get.concat(getBody(4000, '/template', 'POST', form), (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, 'df32a1905950a4c49c9ba5cc27ba2f4ad46845bcf29bbef6d3099f5dc5c0e99e');
          let exists = fs.existsSync(path.join(os.tmpdir(), 'template', 'df32a1905950a4c49c9ba5cc27ba2f4ad46845bcf29bbef6d3099f5dc5c0e99e'));
          assert.strictEqual(exists, true);
          toDelete.push('df32a1905950a4c49c9ba5cc27ba2f4ad46845bcf29bbef6d3099f5dc5c0e99e');
          done();
        });
      });

      it('should return an error if no form data is used', (done) => {
        get.concat({
          url     : 'http://localhost:4000/template',
          method  : 'POST',
          headers : {
            'Content-Type' : 'multipart/form-data'
          },
          body : fs.createReadStream(path.join(__dirname, 'datasets', 'template.html'))
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data.toString());
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error.endsWith('Try uploading your file using form data'), true);
          done();
        });
      });

      it('should return an error if content type is different than multipart/form-data', (done) => {
        const body = {
          template : 'tete'
        };

        get.concat(getBody(4000, '/template', 'POST', body), (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Content-Type header should be multipart/form-data');
          done();
        });
      });

      it('should upload the template and inject data in the hash', (done) => {
        let form = new FormData();

        form.append('payload', 'unepayload');
        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

        get.concat(getBody(4000, '/template', 'POST', form), (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449');
          let exists = fs.existsSync(path.join(os.tmpdir(), 'template', '049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449'));
          assert.strictEqual(exists, true);
          toDelete.push('049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449');
          done();
        });
      });

      it('should not upload the template (no file given)', (done) => {
        let form = new FormData();

        get.concat(getBody(4000, '/template', 'POST', form), (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, '"template" field is empty');
          done();
        });
      });
    });

    describe('Get template', () => {
      let templatePath = path.join(os.tmpdir(), 'template', 'abcdef');
      let templateFilePath = path.join(__dirname, 'datasets', 'template.html');

      before(() => {
        fs.copyFileSync(templateFilePath, templatePath);
      });

      after(() => {
        fs.unlinkSync(path.join(templatePath));
      });

      it('should return template', (done) => {
        get.concat(getBody(4000, '/template/abcdef', 'GET'), (err, res, data) => {
          assert.strictEqual(res.headers['content-disposition'], 'filename="abcdef.html"');
          assert.strictEqual(data.toString(), '<!DOCTYPE html>\n<html>\n<p>I\'m a Carbone template !</p>\n<p>I AM {d.firstname} {d.lastname}</p>\n</html>\n');
          done();
        });
      });

      it('should return an error if template does not exists', (done) => {
        get.concat(getBody(4000, '/template/dontexists', 'GET'), (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Cannot find template extension, does it exists?');
          done();
        });
      });
    });

    describe('Delete template', () => {
      it('should delete a template', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'template', 'abcdef')}`, () => {
          get.concat(getBody(4000, '/template/abcdef', 'DELETE'), (err, res, data) => {
            data = JSON.parse(data.toString());
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.message, 'Template deleted');
            done();
          });
        });
      });

      it('should return an error if template does not exist', (done) => {
        get.concat(getBody(4000, '/template/nopenopenope', 'DELETE'), (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Cannot remove template, does it exist?');
          done();
        });
      });
    });
  });
});
