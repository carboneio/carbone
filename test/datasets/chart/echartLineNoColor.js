const echartLineNoColor = JSON.parse(JSON.stringify(require('./echartLine.js')));
delete echartLineNoColor.color;
module.exports = echartLineNoColor;