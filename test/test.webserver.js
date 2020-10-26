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

function deleteRequiredFiles () {
  try {
    delete require.cache[require.resolve('../lib/webserver')];
    delete require.cache[require.resolve(path.join(os.tmpdir(), 'plugin', 'authentication.js'))];
    delete require.cache[require.resolve(path.join(os.tmpdir(), 'plugin', 'storage.js'))];
  }
  catch (e) {
    console.log(e);
  }
}

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

function writeConfigFile () {
  const pluginDir = path.join(os.tmpdir(), 'plugin');
  const configDir = path.join(os.tmpdir(), 'config');

  if (fs.existsSync(configDir) === false) {
    fs.mkdirSync(path.join(os.tmpdir(), 'config'));
  }
  if (fs.existsSync(pluginDir) === false) {
    fs.mkdirSync(path.join(os.tmpdir(), 'plugin'));
  }
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'config.json'), path.join(os.tmpdir(), 'config', 'config.json'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pem'), path.join(os.tmpdir(), 'config', 'key.pem'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pub'), path.join(os.tmpdir(), 'config', 'key.pub'));
}

function unlinkConfigFile () {
  fs.unlinkSync(path.join(os.tmpdir(), 'config', 'config.json'));
  fs.unlinkSync(path.join(os.tmpdir(), 'config', 'key.pem'));
  fs.unlinkSync(path.join(os.tmpdir(), 'config', 'key.pub'));
  fs.rmdirSync(path.join(os.tmpdir(), 'config'));
  fs.rmdirSync(path.join(os.tmpdir(), 'plugin'));
}

describe.only('Webserver', () => {
  before(() => {
    writeConfigFile();
  });

  after(() => {
    unlinkConfigFile();
  });

  describe('With authentication with plugins / middlewares', () => {
    let token = null;
    let toDelete = [];

    describe('Plugins: writeTemplate, readTemplate, onRenderEnd (with res), readRender and middlewares', () => {
      before((done) => {
        fs.copyFileSync(path.join(__dirname, 'datasets', 'plugin', 'authentication.js'), path.join(os.tmpdir(), 'plugin', 'authentication.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'plugin', 'storage.js'), path.join(os.tmpdir(), 'plugin', 'storage.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'plugin', 'middlewares.js'), path.join(os.tmpdir(), 'plugin', 'middlewares.js'));
        fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pub'), path.join(os.tmpdir(), 'key.pub'));
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
        fs.unlinkSync(path.join(os.tmpdir(), 'plugin', 'authentication.js'));
        fs.unlinkSync(path.join(os.tmpdir(), 'plugin', 'storage.js'));
        fs.unlinkSync(path.join(os.tmpdir(), 'plugin', 'middlewares.js'));
        fs.unlinkSync(path.join(os.tmpdir(), 'key.pub'));
        fs.unlinkSync(path.join(os.tmpdir(), 'beforeFile'));
        fs.unlinkSync(path.join(os.tmpdir(), 'beforeFile2'));
        fs.unlinkSync(path.join(os.tmpdir(), 'afterFile'));
        fs.unlinkSync(path.join(os.tmpdir(), 'afterFile2'));
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

        get.concat({
          url     : 'http://localhost:4001/template',
          method  : 'POST',
          headers : {
            'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary(),
            Authorization  : 'Bearer ' + token
          },
          body : form
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          let exists = fs.existsSync(path.join(os.tmpdir(), '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          assert.strictEqual(exists, true);
          fs.unlinkSync(path.join(os.tmpdir(), '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          setTimeout(() => {
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'beforeFile')).toString(), 'BEFORE FILE');
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'beforeFile2')).toString(), 'BEFORE FILE 2');
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'afterFile')).toString(), 'AFTER FILE');
            assert.strictEqual(fs.readFileSync(path.join(os.tmpdir(), 'afterFile2')).toString(), 'AFTER FILE 2');
            done();
          }, 100);
        });
      });

      it('should render a template using readTemplate, onRenderEnd and readRender plugins', (done) => {
        let templateId = '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47';

        uploadFile(4001, token, () => {
          get.concat({
            url     : 'http://localhost:4001/render/' + templateId,
            method  : 'POST',
            headers : {
              Authorization : 'Bearer ' + token
            },
            json : true,
            body : {
              data : {
                firstname : 'John',
                lastname  : 'Doe'
              },
              complement : {},
              enum       : {}
            }
          }, (err, res, data) => {
            assert.strictEqual(err, null);
            assert.strictEqual(data.success, true);
            assert.strictEqual(fs.existsSync(path.join(os.tmpdir(), 'titi' + data.data.renderId)), true);
            assert.strictEqual(data.data.renderId.startsWith('REPORT_'), true);
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
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'abcdefghi')}`, () => {
          get.concat({
            url     : 'http://localhost:4001/template/abcdefghi',
            method  : 'GET',
            headers : {
              Authorization : 'Bearer ' + token
            }
          }, (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="abcdefghi.html"');
            assert.strictEqual(data.toString(), '<!DOCTYPE html>\n<html>\n<p>I\'m a Carbone template !</p>\n<p>I AM {d.firstname} {d.lastname}</p>\n</html>\n');
            fs.unlinkSync(path.join(os.tmpdir(), 'abcdefghi'));
            done();
          });
        });
      });

      it('should delete a template in the user location choice', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'abcdef')}`, () => {
          get.concat({
            url     : 'http://localhost:4001/template/abcdef',
            method  : 'DELETE',
            headers : {
              Authorization : 'Bearer ' + token
            }
          }, (err, res, data) => {
            data = JSON.parse(data.toString());
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

      get.concat({
        url     : 'http://localhost:4001/template',
        method  : 'POST',
        headers : {
          'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
        },
        body : form
      }, (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error, 'Error: No JSON Web Token detected in Authorization header or Cookie. Format is "Authorization: jwt" or "Cookie: access_token=jwt"');
        done();
      });
    });

    it('should upload the template if user is authenticated', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

      get.concat({
        url     : 'http://localhost:4001/template',
        method  : 'POST',
        headers : {
          'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary(),
          Authorization  : 'Bearer ' + token
        },
        body : form
      }, (err, res, data) => {
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

      get.concat({
        url     : 'http://localhost:4002/template',
        method  : 'POST',
        headers : {
          'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
        },
        body : form
      }, (err, res, data) => {
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

      webserver.handleParams(['--workdir', os.tmpdir()], done);
    });

    after((done) => {
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
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            data : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should not crash if data key does not exists', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            firstname : 'John',
            lastname  : 'Doe'
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Missing data key in body');
          done();
        });
      });

      it('should render template and keep all user choice in a prod env', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
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
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          const renderOptions = spyRender.firstCall.args;
          assert.deepStrictEqual(renderOptions[2].convertTo, {
            formatName    : 'pdf',
            formatOptions : {
              EncryptFile          : false,
              DocumentOpenPassword : 'Pass',
              Watermark            : 'My Watermark'
            }
          });
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should return a 404 error if the template does not exists', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/nopeidontexists',
          json   : true,
          method : 'POST',
          body   : {
            data : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(res.statusCode, 404);
          assert.strictEqual(data.error, 'Template not found');
          done();
        });
      });

      it('should render template and encode filename on disk', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            data : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            reportName : 'hello how are you?',
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.endsWith('hello%20how%20are%20you%3F.html'), true);
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should render template and format the renderId well', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            data : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.endsWith('.html'), true);
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should render template with given filename', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            reportName : 'renderedReport',
            data       : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.includes('renderedReport.html'), true);
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should render template with given filename processed by Carbone', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/' + templateId,
          json   : true,
          method : 'POST',
          body   : {
            reportName : '{d.title}.oui',
            data       : {
              title : 'MyRender'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          const _renderedFile = fs.readFileSync(path.join(os.tmpdir(), 'render', data.data.renderId)).toString();
          const _expect = '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM  </p> </html> ';

          assert.strictEqual(err, null);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.includes('MyRender.oui.html'), true);
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
          assert.strictEqual(data.error, 'Request Error: Content-Type header is not application/json.');
          done();
        });
      });

      it('should not render template (path injection)', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/..%2F..%2F..%2F..%2Fdatasets%2Ftemplate.html',
          method : 'POST',
          json   : true,
          body   : {
            data : {
              firstname : 'John',
              lastname  : 'Doe'
            },
            complement : {},
            enum       : {}
          }
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Template not found');
          done();
        });
      });
    });

    describe('Get render', () => {
      let renderPath = path.join(os.tmpdir(), 'render');
      let datasetsRenderPath = path.join(__dirname, 'datasets', 'renderedReport');
      let renderedFiles = [
        '0c7b6b9f8180e8206c0aa9a91d9c836fe5b271eed2a1d4cf5a1b05e4fd582fbarenderedReport.html',
        '8cb863d0af717a1229a01d21aa28895770080ac99e70d47a29554ba977d46ab7encoded%20filename.html',
        '118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html'
      ];

      it('should retrieve the render file', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, () => {
          get.concat({
            url    : 'http://localhost:4000/render/' + renderedFiles[0],
            method : 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), 'I have been rendered\n');
            done();
          });
        });
      });

      it('should retrieve the render file, get the filename and get the header "access-control-expose-headers" for CORS', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, () => {
          get.concat({
            url    : 'http://localhost:4000/render/' + renderedFiles[0],
            method : 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), 'I have been rendered\n');
            done();
          });
        });
      });

      it('should delete the rendered file after download it', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, () => {
          let exists = fs.existsSync(`${renderPath}/${renderedFiles[0]}`);

          assert.strictEqual(exists, true);

          get.concat({
            url    : 'http://localhost:4000/render/' + renderedFiles[0],
            method : 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), 'I have been rendered\n');
            // add a timeout because we receive the response before the file unlinking
            setTimeout(() => {
              let exists = fs.existsSync(`${renderPath}/${renderedFiles[0]}`);

              assert.strictEqual(exists, false);
              done();
            }, 10);
          });
        });
      });

      it('should retrieve the render file and have its name decoded', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[1]} ${renderPath}`, () => {
          get.concat({
            url    : 'http://localhost:4000/render/' + renderedFiles[1],
            method : 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="encoded filename.html"');
            assert.strictEqual(data.toString(), 'Oh yes it works\n');
            done();
          });
        });
      });

      it('should retrieve the rendered file with UUID as filename. And set access-control-allow-origin to allow fetch from another domain', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[2]} ${renderPath}`, () => {
          get.concat({
            url    : 'http://localhost:4000/render/' + renderedFiles[2],
            method : 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-allow-origin'], '*');
            assert.strictEqual(res.headers['x-request-url'], '/render/118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html');
            assert.strictEqual(res.headers['content-disposition'], 'filename="118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html"');
            assert.strictEqual(data.toString(), '<p>Hello</p>\n');
            done();
          });
        });
      });

      it('should not retrieve anything (does not exist)', (done) => {
        get.concat({
          url    : 'http://localhost:4000/render/nopeidontexists',
          method : 'GET'
        }, (err, res) => {
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

        get.concat({
          url     : 'http://localhost:4000/template',
          method  : 'POST',
          headers : {
            'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body : form
        }, (err, res, data) => {
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
        get.concat({
          url    : 'http://localhost:4000/template',
          method : 'POST',
          json   : true,
          body   : {
            template : 'tete'
          }
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Request Error: Content-Type header should be multipart/form-data');
          done();
        });
      });

      it('should upload the template and inject data in the hash', (done) => {
        let form = new FormData();

        form.append('payload', 'unepayload');
        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')));

        get.concat({
          url     : 'http://localhost:4000/template',
          method  : 'POST',
          headers : {
            'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body : form
        }, (err, res, data) => {
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

        get.concat({
          url     : 'http://localhost:4000/template',
          method  : 'POST',
          headers : {
            'Content-Type' : 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body : form
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Request Error: "template" field is empty');
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
        get.concat({
          url    : 'http://localhost:4000/template/abcdef',
          method : 'GET'
        }, (err, res, data) => {
          assert.strictEqual(res.headers['content-disposition'], 'filename="abcdef.html"');
          assert.strictEqual(data.toString(), '<!DOCTYPE html>\n<html>\n<p>I\'m a Carbone template !</p>\n<p>I AM {d.firstname} {d.lastname}</p>\n</html>\n');
          done();
        });
      });

      it('should return an error if template does not exists', (done) => {
        get.concat({
          url    : 'http://localhost:4000/template/dontexists',
          method : 'GET'
        }, (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Template not found');
          done();
        });
      });
    });

    describe('Delete template', () => {
      it('should delete a template', (done) => {
        exec(`cp ${path.join(__dirname, 'datasets', 'template.html')} ${path.join(os.tmpdir(), 'template', 'abcdef')}`, () => {
          get.concat({
            url    : 'http://localhost:4000/template/abcdef',
            method : 'DELETE'
          }, (err, res, data) => {
            data = JSON.parse(data.toString());
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.message, 'Template deleted');
            done();
          });
        });
      });

      it('should return an error if template does not exist', (done) => {
        get.concat({
          url    : 'http://localhost:4000/template/nopenopenope',
          method : 'DELETE'
        }, (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Cannot remove template, does it exist?');
          done();
        });
      });
    });
  });
});
