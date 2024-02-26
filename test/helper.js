const assert    = require('assert');
const path      = require('path');
const fs        = require('fs');
const xmlFormat = require('xml-beautifier');
const helperLib = require('../lib/helper');

const helperTests = {

  /**
   * Beautiful assert between two objects
   * Be careful, it will inspect with a depth of 100
   *
   * @param {object} result : result
   * @param {object} expected : expected
   * @return {type} throw an error if the two objects are different
   */
  assert : function (result, expected, message) {
    try {
      assert.strictEqual(JSON.stringify(result, null, 2), JSON.stringify(expected, null, 2), message);
    }
    catch (e) {
      e.showDiff = true;
      throw e;
    }
  },
  /**
   * Open a an unzipped template and return a list of XML files.
   *
   * @param {String} template template name
   * @param {Boolean} getHiddenFiles (optional) retrieve hidden files
   * @returns {Array} List of XML file inside a template.
   */
  openTemplate : function  (template, getHiddenFiles = false) {
    return helperTests.openUnzippedDocument(template, 'template', getHiddenFiles);
  },
  /**
   * Assert a full report based on an unzipped expected report.
   *
   * @param {Array} carboneResult List of XML files after the Carbone rendering
   * @param {String} expectedDirname directory name to search the result
   * @param {Boolean} getHiddenFiles (optional) retrieve hidden files
   */
  assertFullReport : function  (carboneResult, expectedDirname, getHiddenFiles = false) {
    var _expected = helperTests.openUnzippedDocument(expectedDirname, 'expected', getHiddenFiles);
    var _max = Math.max(carboneResult.files.length, _expected.files.length);
    carboneResult.files.sort(sortFilename);
    _expected.files.sort(sortFilename);

    for (var i = 0; i < _max; i++) {
      var _resultFile   = carboneResult.files[i] || {};
      var _expectedFile = _expected.files[i] || {};
      if (_resultFile.name === undefined) {
        throw Error ('Missing file in the result.\n\nRESULT:\n' + carboneResult.files.map(e => e.name).join('\n')+ '\n\nEXPECTED:\n'+_expected.files.map(e => e.name).join('\n'));
      }
      if (_resultFile.name !== _expectedFile.name) {
        for (var j = 0; j < _expected.files.length; j++) {
          _expectedFile = _expected.files[j];
          if (_resultFile.name === _expectedFile.name && _resultFile.parent === _expectedFile.parent) {
            break;
          }
        }
      }
      assert.strictEqual(_resultFile.name, _expectedFile.name);
      if (Buffer.isBuffer(_expectedFile.data) === false && Buffer.isBuffer(_resultFile.data) === true) {
        _resultFile.data = _resultFile.data.toString();
      }
      if (Buffer.isBuffer(_resultFile.data) === true) {
        if (_resultFile.data.equals(_expectedFile.data) === false) {
          // This line of can be used to udpate barcode image (used when passing from Node16 to Node18 -> zlib -> compression changes)
          // fs.writeFileSync(path.join(__dirname, 'datasets', expectedDirname, 'expected', 'xl', 'media', path.basename(_resultFile.name)), _resultFile.data);
          throw Error ('Buffer of (result) '+_resultFile.name + 'is not the same as (expected) '+_expectedFile.name);
        }
      }
      else {
        // re-indent xml to make the comparison understandable
        _resultFile.data = xmlFormat(_resultFile.data.replace(/(\r\n|\n|\r)/g,' '));
        _expectedFile.data = xmlFormat(_expectedFile.data.replace(/(\r\n|\n|\r)/g,' '));
        if (_resultFile.data !== _expectedFile.data) {
          console.log('\n\n----------------------');
          console.log(_resultFile.name + ' !== ' +  _expectedFile.name);
          console.log('----------------------\n\n');
          assert.strictEqual(_resultFile.data, _expectedFile.data);
        }
      }
    }
  },
  openUnzippedDocument : function (dirname, type, getHiddenFiles = false) {
    var _dirname = path.join(__dirname, 'datasets', dirname, type);
    var _files = helperLib.walkDirSync(_dirname, getHiddenFiles === true ? /.*[^.DS_Store]/ : undefined);
    var _report = {
      isZipped   : false,
      filename   : dirname,
      embeddings : [],
      files      : []
    };
    _files.forEach(file => {
      var _data = fs.readFileSync(file);
      var _extname = path.extname(file);
      var _relativePath = path.relative(_dirname, file);
      var _parent = '';
      var _indexOfEmbeddings = _relativePath.indexOf('embeddings/');
      if (_indexOfEmbeddings !== -1) {
        if (_extname === '.xlsx') {
          _report.embeddings.push(_relativePath);
          return;
        }
        var _indexOfEmbeddedFile = _relativePath.indexOf('/', _indexOfEmbeddings + 11);
        _parent = _relativePath.slice(0, _indexOfEmbeddedFile) + '.xlsx';
        _relativePath = _relativePath.slice(_indexOfEmbeddedFile + 1);
      }
      var _file = {
        name     : _relativePath,
        data     : _data,
        isMarked : false,
        parent   : _parent
      };
      if (_extname === '.xml' || _extname === '.rels') {
        _file.data = _data.toString();
        _file.isMarked = true;
      }
      if (_extname === '.svg') {
        _file.data = _data.toString();
      }
      _report.files.push(_file);
    });
    return _report;
  }
};

function sortFilename (a, b) {
  if (a.parent === b.parent) {
    return (a.name < b.name) ? 1 : -1;
  }
  return (a.parent < b.parent) ? 1 : -1;
}

module.exports = helperTests;