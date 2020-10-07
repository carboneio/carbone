const fs = require('fs');
const path = require('path');
const os = require('os');

function onRenderEnd (req, res, reportName, content, next) {
  return next(null, 'tata' + reportName)
}

module.exports = {
  onRenderEnd
}
