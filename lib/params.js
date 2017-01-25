var os = require('os');
var path = require('path');
var fs = require('fs');

// manage node 0.8 / 0.10 differences
var defaultLang = 'en';
var nodeVersion = process.versions.node.split('.');
var tmpDir = (parseInt(nodeVersion[0], 10) === 0 && parseInt(nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();
var langFilePath =  path.resolve(tmpDir+'/lang/', defaultLang+'.json');
var objLang = {};
if (fs.existsSync(langFilePath)) {
  var _langData = fs.readFileSync(langFilePath, 'utf8');
  objLang = JSON.parse(_langData);
}

module.exports  = {
  /* Temp directory */
  tempPath         : tmpDir,
  /* Template path */
  templatePath     : tmpDir,
  /* If true, carbone will send the conversion job to a carbone server */
  delegateToServer : false,
  /* Serves's address, (client) */
  host             : '127.0.0.1', 
  /* IP accepted to listen (server) */
  bind             : '127.0.0.1',
  /* Port of the server */
  port             : 4000,
  /* Number of LibreOffice + Python factory to start by default. One factory = 2 threads */
  factories        : 1,
  /* If LibreOffice fails to convert one document, how many times we re-try to convert this file? */
  attempts         : 3,
  /* If true, it will start LibreOffice + Python factory immediately (true by default if the carbone server is used). 
     If false, it will start LibreOffice + Python factory only when at least one document conversion is needed.*/
  startFactory     : false,
  /* The method helper.getUID() add this prefix in the uid */
  uidPrefix        : 'c',
  /* If multiple factories are used, the pipe name is generated automatically to avoid conflicts */
  pipeNamePrefix   : '_carbone',
  /* lang of moment (formatters) */
  lang             : defaultLang,
  objLang          : objLang
};

