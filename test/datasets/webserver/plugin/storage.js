const fs = require('fs');
const path = require('path');
const os = require('os');

function generateOutputFile () {
  return {
    renderPath   : path.join(process.cwd(), 'render'),
    renderPrefix : 'REPORT_'
  };
}

function writeTemplate (req, res, localPath, filename, callback) {
  fs.rename(localPath, path.join(os.tmpdir(), 'PREFIX_' + filename), () => {
    return callback(null);
  });
}

function readTemplate (req, templateName, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateName));
}

function deleteTemplate (req, res, templateName, callback) {
  return callback(null, path.join(os.tmpdir(), 'PREFIX_' + templateName));
}

function onRenderEnd (req, res, reportName, reportPath) {
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

function readRender (req, res, renderName, next) {
  return next(null, 'titi' + renderName, os.tmpdir());
}

module.exports = {
  generateOutputFile,
  writeTemplate,
  readTemplate,
  onRenderEnd,
  deleteTemplate,
  readRender
};
