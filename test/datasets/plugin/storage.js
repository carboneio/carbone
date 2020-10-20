const fs = require('fs');
const path = require('path');
const os = require('os');

function generateOutputFile () {
  return {
    renderPath   : path.join(process.cwd(), 'render'),
    renderPrefix : 'REPORT_'
  };
}

function writeTemplate (stream, filename, callback) {
  const writeStream = fs.createWriteStream(path.join(os.tmpdir(), filename));

  writeStream.on('error', () => {
    return callback(new Error('Error when uploading file'));
  });

  writeStream.on('finish', () => {
    return callback(null);
  });

  stream.pipe(writeStream);
}

function readTemplate (templateName, callback) {
  return callback(null, path.join(os.tmpdir(), templateName));
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
  readRender
};
