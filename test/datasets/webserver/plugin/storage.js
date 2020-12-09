const fs = require('fs');
const path = require('path');
const os = require('os');

function beforeRender (req, res, data, options, next) {
  options.renderPrefix = 'REPORT_';
  next();
}

function writeTemplate (req, res, templateId, templatePathTemp, callback) {
  fs.rename(templatePathTemp, path.join(os.tmpdir(), 'PREFIX_' + templateId), () => {
    return callback(null);
  });
}

function readTemplate (req, res, templateId, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function deleteTemplate (req, res, templateId, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function afterRender (req, res, err, reportPath, reportName) {
  fs.readFile(reportPath, (err, content) => {
    fs.writeFile(path.join(os.tmpdir(), 'titi' + reportName), content, () => {

      return res.send({
        success : true,
        data    : {
          renderId : reportName
        }
      });
    });
  });
}

function readRender (req, res, renderId, next) {
  return next(null, 'titi' + renderId, os.tmpdir());
}

module.exports = {
  beforeRender,
  writeTemplate,
  readTemplate,
  afterRender,
  deleteTemplate,
  readRender
};
