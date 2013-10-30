var os = require('os');

module.exports  = {
  'delegateToServer': false,
  'delegateLevel'   : 1,     /* 1 : only document conversion */
  'host'            : '127.0.0.1',
  'port'            : 4000,
  'tempPath'        : os.tmpdir(),
  'templatePath'    : os.tmpdir(),
  'uidPrefix'       : 'c'
};

