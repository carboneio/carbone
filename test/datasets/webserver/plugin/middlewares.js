const fs = require('fs');
const path = require('path');
const os = require('os');

function before (req, res, next) {
  fs.writeFile(path.join(os.tmpdir(), 'beforeFile'), 'BEFORE FILE', () => {
    return next();
  });
}

function before2 (req, res, next) {
  fs.writeFile(path.join(os.tmpdir(), 'beforeFile2'), 'BEFORE FILE 2', () => {
    return next();
  });
}

function after (req, res, next) {
  fs.writeFile(path.join(os.tmpdir(), 'afterFile'), 'AFTER FILE', () => {
    return next();
  });
}

function after2 (req, res, next) {
  fs.writeFile(path.join(os.tmpdir(), 'afterFile2'), 'AFTER FILE 2', () => {
    return next();
  });
}

module.exports = {
  before : [before, before2],
  after  : [after, after2]
};
