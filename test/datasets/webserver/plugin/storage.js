const fs = require('fs');
const path = require('path');
const os = require('os');

function beforeRender (req, res, data, options, next) {
  if (req?.query.error === 'true') {
    return next(new Error('Something went wrong'));
  }
  options.renderPrefix = 'REPORT';
  req.isProd = true;
  next();
}

function writeTemplate (req, res, templateId, templatePathTemp, next) {
  if (req.query.error === 'true') {
    return next(new Error('Something went wrong'));
  }
  fs.rename(templatePathTemp, path.join(os.tmpdir(), 'PREFIX_' + templateId), () => {
    return res.send({
      success : true,
      data    : {
        templateId : templateId,
        extension  : req.headers['carbone-template-extension'],
        mimetype   : req.headers['carbone-template-mimetype'],
        size       : req.headers['carbone-template-size']
      }
    });
  });
}

function readTemplate (req, res, templateId, callback) {
  if (templateId === 'template_not_exists') {
    // simulate error from Carbone SaaS Plugin
    return callback(new Error('File does not exist'));
  }
  if (templateId === 'storage_error') {
    return callback(new Error('Storage error'));
  }
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function deleteTemplate (req, res, templateId, callback) {
  if (templateId === 'template_not_exists') {
    // simulate error from Carbone SaaS Plugin
    return callback(new Error('File does not exist'));
  }
  if (templateId === 'storage_error') {
    return callback(new Error('Storage error'));
  }
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function afterRender (req, res, err, reportPath, reportName, statObject, callback) {
  if (err) {
    return callback(err);
  }
  fs.readFile(reportPath, (err, content) => {
    fs.writeFile(path.join(os.tmpdir(), 'titi' + reportName), content, () => {
      return res.send({
        success : true,
        data    : {
          renderId  : reportName
        }
      });
    });
  });
}

function readRender (req, res, renderId, next) {
  if (renderId === 'render_not_exist') {
    // simulate error from Carbone SaaS Plugin
    return next(new Error('File does not exist'));
  }
  return next(null, path.join(os.tmpdir(), 'titi' + renderId));
}

module.exports = {
  beforeRender,
  writeTemplate,
  readTemplate,
  afterRender,
  deleteTemplate,
  readRender
};
