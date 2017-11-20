var path = require('path');
var params = require('./params');
var file = require('./file');
var parser = require('./parser');
var helper = require('./helper');

var nbOccurencies = 0;

var tool = {
  findMarkers : function (strToFind) {
    var _files = helper.walkDirSync(process.cwd(), params.extensionParsed);
    walkReports(_files, 0, strToFind, function () {
      console.log(nbOccurencies + ' results in '+_files.length + ' files');
      console.log('The end! ');
    });
  }
};

module.exports = tool;


function walkReports (reports, currentIndex, strToFind, callback) {
  if (currentIndex >= reports.length) {
    return callback(null);
  }
  var _filename = reports[currentIndex];
  file.openTemplate(_filename, function (err, template) {
    // console.log('filename ' + _filename);
    walkReportFiles(template, 0, strToFind, function () {
      return walkReports(reports, ++currentIndex, strToFind, callback);
    });
  });
}

function walkReportFiles (template, currentIndex, strToFind, callback) {
  if (currentIndex >= template.files.length) {
    return callback(null);
  }
  var _file = template.files[currentIndex];

  parser.findVariables(_file.data, [], function (err, xmlWithoutVariable, variables) {
    if (err) {
      console.log('error when finding variables in ' + template.filename + err);
    }
    parser.findMarkers(xmlWithoutVariable, function (err, xmlWithoutMarkers, markers) {
      if (err) {
        console.log('error when finding markers in ' + template.filename + err);
      }
      var _allMarkers = Array.prototype.concat(variables, markers);
      for (var i = 0; i < _allMarkers.length; i++) {
        var _marker = _allMarkers[i];
        if (_marker.name !== undefined && _marker.name.indexOf(strToFind) !== -1) {
          nbOccurencies++;
          console.log('\033[37mfound in \033[0m' + path.basename(template.filename) + '\033[37m -> '+ _marker.name+'\033[0m');
        }
      }
      return walkReportFiles(template, ++currentIndex, strToFind, callback);
    });
  });
}

