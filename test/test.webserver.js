let webserver  = null;
const get        = require('simple-get');
const fs         = require('fs');
const path       = require('path');
const FormData   = require('form-data');
const assert     = require('assert');
const carbone    = require('../lib/index');
const { render } = require('../lib/index');
const sinon      = require('sinon');
const os         = require('os');
const { exec }   = require('child_process');

function uploadFile (callback) {
  let form = new FormData();

  form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

  get.concat({
    url: 'http://localhost:4000/template',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary()
    },
    body: form
  }, (err, res, data) => {
    assert.strictEqual(err, null);
    data = JSON.parse(data);
    assert.strictEqual(data.success, true);
    callback()
  })
}

function writeConfigFile () {
  const addonsDir = path.join(process.cwd(), 'addons');
  const configDir = path.join(process.cwd(), 'config');

  if (fs.existsSync(addonsDir)) {
    fs.renameSync(addonsDir, path.join(process.cwd(), 'wait-addons'))
  }
  if (fs.existsSync(configDir)) {
    fs.renameSync(configDir, path.join(process.cwd(), 'wait-config'))
  }

  fs.mkdirSync(path.join(process.cwd(), 'config'));
  fs.mkdirSync(path.join(process.cwd(), 'addons'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'config.json'), path.join(process.cwd(), 'config', 'config.json'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pem'), path.join(process.cwd(), 'config', 'key.pem'));
  fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pub'), path.join(process.cwd(), 'config', 'key.pub'));
}

function unlinkConfigFile () {
  const addonsDir = path.join(process.cwd(), 'wait-addons');
  const configDir = path.join(process.cwd(), 'wait-config');

  fs.unlinkSync(path.join(process.cwd(), 'config', 'config.json'));
  fs.unlinkSync(path.join(process.cwd(), 'config', 'key.pem'));
  fs.unlinkSync(path.join(process.cwd(), 'config', 'key.pub'));
  fs.rmdirSync(path.join(process.cwd(), 'config'));
  fs.rmdirSync(path.join(process.cwd(), 'addons'));

  if (fs.existsSync(addonsDir)) {
    fs.renameSync(addonsDir, path.join(process.cwd(), 'addons'))
  }
  if (fs.existsSync(configDir)) {
    fs.renameSync(configDir, path.join(process.cwd(), 'config'))
  }
}

describe.only('Webserver', () => {
  before(() => {
    writeConfigFile();
  });

  after(() => {
    unlinkConfigFile();
  });

  describe('With authentication with addons', () => {
    let token = null;
    let toDelete = [];

    before((done) => {
      fs.copyFileSync(path.join(__dirname, 'datasets', 'addons', 'authentication.js'), path.join(process.cwd(), 'addons', 'authentication.js'));
      fs.copyFileSync(path.join(__dirname, 'datasets', 'addons', 'storage.js'), path.join(process.cwd(), 'addons', 'storage.js'));
      fs.unlinkSync(path.join(process.cwd(), 'config', 'key.pub'));
      fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pub'), path.join(process.cwd(), 'key.pub'));
      webserver = require('../lib/webserver');
      webserver.handleParams(['--auth', '--port', 4001], () => {
        webserver.generateToken((_, newToken) => {
          token = newToken;
          done();
        });
      });
    });

    after((done) => {
      fs.unlinkSync(path.join(process.cwd(), 'key.pub'));
      fs.copyFileSync(path.join(__dirname, 'datasets', 'config', 'key.pub'), path.join(process.cwd(), 'config', 'key.pub'));
      fs.unlinkSync(path.join(process.cwd(), 'addons', 'authentication.js'));
      fs.unlinkSync(path.join(process.cwd(), 'addons', 'storage.js'));
      webserver.stopServer(done);
    });

    afterEach(() => {
      for (let i = 0; i < toDelete.length; i++) {
        if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
          fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]))
        }
      }

      toDelete = [];
    });

    it('should upload the template and use authentication and storage addons', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

      get.concat({
        url: 'http://localhost:4001/template',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary(),
          'Authorization': 'Bearer ' + token
        },
        body: form
      }, (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        let exists = fs.existsSync(path.join(os.tmpdir(), '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
        assert.strictEqual(exists, true);
        fs.unlinkSync(path.join(os.tmpdir(), '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
        done();
      });
    });
  });

  describe('With authentication without addons', () => {
    let token = null;
    let toDelete = [];

    before((done) => {
      webserver = require('../lib/webserver');

      webserver.handleParams(['--auth', '--port', 4001], () => {
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
          fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]))
        }
      }

      toDelete = [];
    });

    it('should not upload template if user is not authenticated', (done) => {
      let form = new FormData();

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

      get.concat({
        url: 'http://localhost:4001/template',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary()
        },
        body: form
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

      form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

      get.concat({
        url: 'http://localhost:4001/template',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary(),
          'Authorization': 'Bearer ' + token
        },
        body: form
      }, (err, res, data) => {
        assert.strictEqual(err, null);
        data = JSON.parse(data);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        let exists = fs.existsSync(path.join(__dirname, '..', 'template', '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
        assert.strictEqual(exists, true);
        toDelete.push('9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
        done();
      });
    });
  });

  describe('Without authentication', () => {
    let templateId = '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47';

    before((done) => {
      webserver = require('../lib/webserver');

      webserver.handleParams([], done)
    });

    after((done) => {
      webserver.stopServer(done)
    });

    describe('Render template', () => {
      let toDelete = [];
      let spyRender = null;

      before((done) => {
        uploadFile(done)
      });

      beforeEach(() => {
        spyRender = sinon.spy(carbone, 'render');
      })

      afterEach(() => {
        spyRender.restore();

        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(__dirname, '..', 'render', toDelete[i]))) {
            fs.unlinkSync(path.join(__dirname, '..', 'render', toDelete[i]))
          }

          if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]))
          }
        }

        toDelete = [];
      });

      after((done) => {
        if (fs.existsSync(path.join(__dirname, '..', 'template', templateId))) {
          fs.unlinkSync(path.join(__dirname, '..', 'template', templateId))
        }

        done();
      });

      it('should render a template', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          const _renderedFile = fs.readFileSync(path.join(__dirname, '..', 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done()
        });
      });

      it('should not crash if data key does not exists', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            firstname: 'John',
            lastname: 'Doe'
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Missing data key in body');
          done()
        });
      });

      it('should render template and keep all user choice in a prod env', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            convertTo: {
              formatName: 'pdf',
              formatOptions: {
                EncryptFile : false,
                DocumentOpenPassword : 'Pass',
                Watermark: 'My Watermark'
              }
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          const renderOptions = spyRender.firstCall.args;
          assert.deepStrictEqual(renderOptions[2].convertTo, {
            formatName: 'pdf',
            formatOptions: {
              EncryptFile : false,
              DocumentOpenPassword : 'Pass',
              Watermark: 'My Watermark'
            }
          });
          toDelete.push(data.data.renderId);
          done();
        });
      });

      it('should return a 404 error if the template does not exists', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/nopeidontexists',
          json: true,
          method: 'POST',
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            complement: {},
            enum: {}
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
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            reportName: 'hello how are you?',
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.endsWith('hello%20how%20are%20you%3F.html'), true)
          const _renderedFile = fs.readFileSync(path.join(__dirname, '..', 'render', data.data.renderId)).toString();
          assert.strictEqual(_renderedFile, '<!DOCTYPE html> <html> <p>I\'m a Carbone template !</p> <p>I AM John Doe</p> </html> ');
          toDelete.push(data.data.renderId);
          done()
        });
      });

      it('should render template and format the renderId well', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.endsWith('.html'), true)
          toDelete.push(data.data.renderId);
          done()
        });
      });

      it('should render template with given filename', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            reportName: 'renderedReport',
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.includes('renderedReport.html'), true);
          toDelete.push(data.data.renderId);
          done()
        });
      });

      it('should render template with given filename processed by Carbone', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          json: true,
          method: 'POST',
          body: {
            reportName: '{d.title}.oui',
            data: {
              title: 'MyRender'
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          const _renderedFile = fs.readFileSync(path.join(__dirname, '..', 'render', data.data.renderId)).toString();
          const _expect = `<!DOCTYPE html> <html> <p>I'm a Carbone template !</p> <p>I AM  </p> </html> `;

          assert.strictEqual(err, null);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.renderId.includes('MyRender.oui.html'), true);
          assert.strictEqual(_renderedFile, _expect);
          toDelete.push(data.data.renderId);
          done()
        });
      });

      it('should not render template if the "content-type" is not set to "application/json"', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/' + templateId,
          method: 'POST'
        }, (err, res, data) => {
          data = JSON.parse(data.toString());
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, "Request Error: Content-Type header is not application/json.");
          done()
        });
      });

      it('should not render template (path injection)', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/..%2F..%2F..%2F..%2Fdatasets%2Ftemplate.html',
          method: 'POST',
          json: true,
          body: {
            data: {
              firstname: 'John',
              lastname: 'Doe'
            },
            complement: {},
            enum: {}
          }
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Template not found');
          done()
        });
      });
    });

    describe('Get render', () => {
      let renderPath = path.join(__dirname, '..', 'render');
      let datasetsRenderPath = path.join(__dirname, 'datasets', 'renderedReport');
      let renderedFiles = [
        '0c7b6b9f8180e8206c0aa9a91d9c836fe5b271eed2a1d4cf5a1b05e4fd582fbarenderedReport.html',
        '8cb863d0af717a1229a01d21aa28895770080ac99e70d47a29554ba977d46ab7encoded%20filename.html',
        '118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html'
      ];

      it('should retrieve the render file', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, (err) => {
          get.concat({
            url: 'http://localhost:4000/render/' + renderedFiles[0],
            method: 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"')
            assert.strictEqual(data.toString(), 'I have been rendered\n')
            done()
          });
        });
      });

      it('should retrieve the render file, get the filename and get the header "access-control-expose-headers" for CORS', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, (err) => {
          get.concat({
            url: 'http://localhost:4000/render/' + renderedFiles[0],
            method: 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), 'I have been rendered\n');
            done()
          });
        });
      });

      it('should delete the rendered file after download it', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[0]} ${renderPath}`, (err) => {
          let exists = fs.existsSync(`${renderPath}/${renderedFiles[0]}`);

          assert.strictEqual(exists, true);

          get.concat({
            url: 'http://localhost:4000/render/' + renderedFiles[0],
            method: 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Request-URL,Content-Disposition');
            assert.strictEqual(res.headers['content-disposition'], 'filename="renderedReport.html"');
            assert.strictEqual(data.toString(), 'I have been rendered\n');
            // add a timeout because we receive the response before the file unlinking
            setTimeout(() => {
              let exists = fs.existsSync(`${renderPath}/${renderedFiles[0]}`);

              assert.strictEqual(exists, false);
              done()
            }, 10);
          });
        });
      });

      it('should retrieve the render file and have its name decoded', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[1]} ${renderPath}`, (err) => {
          get.concat({
            url: 'http://localhost:4000/render/' + renderedFiles[1],
            method: 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['content-disposition'], 'filename="encoded filename.html"');
            assert.strictEqual(data.toString(), 'Oh yes it works\n');
            done()
          });
        });
      });

      it('should retrieve the rendered file with UUID as filename. And set access-control-allow-origin to allow fetch from another domain', (done) => {
        exec(`cp ${datasetsRenderPath}/${renderedFiles[2]} ${renderPath}`, (err) => {
          get.concat({
            url: 'http://localhost:4000/render/' + renderedFiles[2],
            method: 'GET'
          }, (err, res, data) => {
            assert.strictEqual(res.headers['access-control-allow-origin'], '*');
            assert.strictEqual(res.headers['x-request-url'], '/render/118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html');
            assert.strictEqual(res.headers['content-disposition'], 'filename="118f03dd2bc1f79219fc8fbbf76f6cd2de8e9ae23b8836279e4cdaa98f4e4943.html"');
            assert.strictEqual(data.toString(), '<p>Hello</p>\n');
            done()
          });
        });
      });

      it('should not retrieve anything (does not exist)', (done) => {
        get.concat({
          url: 'http://localhost:4000/render/nopeidontexists',
          method: 'GET'
        }, (err, res, data) => {
          assert.strictEqual(res.statusCode, 404);
          done()
        });
      });
    });

    describe('Add template', () => {
      let toDelete = [];

      afterEach(() => {
        for (let i = 0; i < toDelete.length; i++) {
          if (fs.existsSync(path.join(__dirname, '..', 'template', toDelete[i]))) {
            fs.unlinkSync(path.join(__dirname, '..', 'template', toDelete[i]))
          }
        }

        toDelete = [];
      });

      it('should upload the template', (done) => {
        let form = new FormData();

        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

        get.concat({
          url: 'http://localhost:4000/template',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body: form
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          let exists = fs.existsSync(path.join(__dirname, '..', 'template', '9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47'));
          assert.strictEqual(exists, true);
          toDelete.push('9950a2403a6a6a3a924e6bddfa85307adada2c658613aa8fbf20b6d64c2b6b47');
          done();
        });
      });

      it('should return an error if no form data is used', (done) => {
        get.concat({
          url: 'http://localhost:4000/template',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          body: fs.createReadStream(path.join(__dirname, 'datasets', 'template.html'))
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
          url: 'http://localhost:4000/template',
          method: 'POST',
          json: true,
          body: {
            template: 'tete'
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
        form.append('template', fs.createReadStream(path.join(__dirname, 'datasets', 'template.html')))

        get.concat({
          url: 'http://localhost:4000/template',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body: form
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, true);
          assert.strictEqual(data.data.templateId, '049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449');
          let exists = fs.existsSync(path.join(__dirname, '..', 'template', '049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449'));
          assert.strictEqual(exists, true);
          toDelete.push('049f4454f4cd92f637965173cb90ddbfac22563d6711fc9fb0683fe8a46b5449');
          done();
        });
      });

      it('should not upload the template (no file given)', (done) => {
        let form = new FormData();

        get.concat({
          url: 'http://localhost:4000/template',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary()
          },
          body: form
        }, (err, res, data) => {
          assert.strictEqual(err, null);
          data = JSON.parse(data);
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.error, 'Request Error: "template" field is empty');
          done();
        });
      });
    });
  });
});
