const fs = require('fs');
const path = require('path');

function getPublicKey (req, res, payload, callback) {
  fs.readFile(path.join(__dirname, '..', 'key.pub'), 'utf8', (err, content) => {
    if (err) {
      console.log(err);
      return callback(new Error('Cannot read public key ' + err.toString()));
    }

    return callback(content);
  });
}

module.exports = {
  getPublicKey
};
