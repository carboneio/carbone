const fs = require('fs');
const path = require('path');
const os = require('os');

function beforeRender (req, res, data, options, next) {
  options.renderPrefix = 'REPORT';
  next();
}

function writeTemplate (req, res, templateId, templatePathTemp) {
  fs.rename(templatePathTemp, path.join(os.tmpdir(), 'PREFIX_' + templateId), () => {
    return res.send({
      success : true,
      data    : {
        templateId : templateId
      }
    });
  });
}

function readTemplate (req, res, templateId, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function deleteTemplate (req, res, templateId, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateId));
}

function afterRender (req, res, err, reportPath, reportName, callback) {
  if (err) {
    return callback(err);
  }

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
