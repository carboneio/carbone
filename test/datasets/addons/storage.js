const fs = require('fs');
const path = require('path');
const os = require('os');

function writeTemplate (stream, filename, callback) {
  const writeStream = fs.createWriteStream(path.join(os.tmpdir(), filename));

  writeStream.on('error', (err) => {
    return callback(new Error('Error when uploading file'));
  });

  writeStream.on('finish', () => {
    return callback(null);
  });

  stream.pipe(writeStream);
}

module.exports = {
  writeTemplate
}
