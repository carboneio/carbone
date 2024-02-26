var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var testPath = path.join(__dirname, 'test_file');
var params = require('../lib/params');
var spawn = require('child_process').spawn;

describe('Carbone.batch', function () {
  before(function () {
    var _templatePath = path.resolve('./test/datasets');
    carbone.set({templatePath : _templatePath});
    helper.rmDirRecursive(testPath);
    params.nbReportMaxPerBatch = 10;
  });
  afterEach(function () {
    helper.rmDirRecursive(testPath);
    params.nbReportMaxPerBatch = 10;
  });
  after(function () {
    params.nbReportMaxPerBatch = 0;
    carbone.reset();
  });
  it('should not accept batch in many cases', function (done) {
    const _data = {
      items  : [],
      values : [{id : 1}, {id : 2}, {id : 3}],
      sub    : {
        items : [
          { value : 'AA' },
          { value : 'BB' }
        ]
      }
    };
    carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.items[0]' }, function (err) {
      assert.equal(err+'', 'batchSplitBy accepts only "d" or "d.myArrayName" format');
      carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd' }, function (err) {
        assert.equal(err+'', '"d" must be a non empty array');
        carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.sub.items' }, function (err) {
          assert.equal(err+'', 'batchSplitBy accepts only "d" or "d.myArrayName" format');
          carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.items' }, function (err) {
            assert.equal(err+'', '"d.items" must be a non empty array');
            params.nbReportMaxPerBatch = 0;
            carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.values' }, function (err) {
              assert.equal(err+'', 'Batch processing deactivated. nbReportMaxPerBatch = 0');
              params.nbReportMaxPerBatch = 2;
              carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.values' }, function (err) {
                assert.equal(err+'', 'Cannot process more than 2 documents');
                params.nbReportMaxPerBatch = 10;
                carbone.render('batch/test_word_object.xml', _data, { renderPrefix : 'prefix-', batchSplitBy : 'd.undefined' }, function (err) {
                  assert.equal(err+'', '"d.undefined" must be a non empty array');
                  carbone.render('batch/test_word_object.xml', _data, { renderPrefix : '', batchSplitBy : 'd.values' }, function (err) {
                    assert.equal(err+'', 'Cannot use batch processing in buffer mode');
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  it('should generate a ZIP with a template of type OBJECT', function (done) {
    const _data = {
      items : [
        { value : 'CARBONE_AA_CARBONE' },
        { value : 'CARBONE_BB_CARBONE' }
      ]
    };
    const _opt = {
      renderPrefix : 'prefix-',
      batchSplitBy : 'd.items'
    };
    carbone.render('batch/test_word_object.xml', _data, _opt, function (err, resultFilePath) {
      assert.equal(err, null);
      assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
      fs.mkdirSync(testPath, parseInt('0755',8));
      const _unzipPath = path.join(testPath, 'unzip');
      unzipSystem(resultFilePath, _unzipPath, function (err, files) {
        assert.strictEqual(files.length, 2);
        let _firstFile = files[0].data;
        let _secondFile = files[1].data;
        if (_firstFile.indexOf('CARBONE_AA_CARBONE') === -1) {
          _secondFile = files[0].data;
          _firstFile = files[1].data;
        }
        assert.strictEqual(_firstFile.indexOf('CARBONE_AA_CARBONE') !== -1, true);
        assert.strictEqual(_secondFile.indexOf('CARBONE_BB_CARBONE') !== -1, true);
        assert.strictEqual(_secondFile.indexOf('CARBONE_AA_CARBONE') !== -1, false);
        assert.strictEqual(_firstFile.indexOf('CARBONE_BB_CARBONE') !== -1, false);
        fs.unlinkSync(resultFilePath);
        done();
      });
    });
  });
  it('should generate a ZIP with a template of type ARRAY', function (done) {
    const _data = {
      subArray : [
        { value : 'CARBONE_AA_CARBONE' },
        { value : 'CARBONE_BB_CARBONE' }
      ]
    };
    const _opt = {
      renderPrefix : 'prefix-',
      batchSplitBy : 'd.subArray'
    };
    carbone.render('batch/test_word_array.xml', _data, _opt, function (err, resultFilePath) {
      assert.equal(err, null);
      assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
      fs.mkdirSync(testPath, parseInt('0755',8));
      const _unzipPath = path.join(testPath, 'unzip');
      unzipSystem(resultFilePath, _unzipPath, function (err, files) {
        assert.strictEqual(files.length, 2);
        let _firstFile = files[0].data;
        let _secondFile = files[1].data;
        if (_firstFile.indexOf('CARBONE_AA_CARBONE')  === -1) {
          _secondFile = files[0].data;
          _firstFile = files[1].data;
        }
        assert.strictEqual(_firstFile.indexOf('CARBONE_AA_CARBONE') !== -1, true);
        assert.strictEqual(_secondFile.indexOf('CARBONE_BB_CARBONE') !== -1, true);
        assert.strictEqual(_secondFile.indexOf('CARBONE_AA_CARBONE') !== -1, false);
        assert.strictEqual(_firstFile.indexOf('CARBONE_BB_CARBONE') !== -1, false);
        fs.unlinkSync(resultFilePath);
        done();
      });
    });
  });
});



function unzipSystem (filePath, destPath, callback) {
  var _unzippedFiles = [];
  var _unzip = spawn('unzip', ['-o', filePath, '-d', destPath]);
  _unzip.on('error', function () {
    throw Error('\n\nPlease install unzip program to execute tests. Ex: sudo apt install unzip\n\n');
  });
  _unzip.stderr.on('data', function (data) {
    throw Error(data);
  });
  _unzip.on('exit', function () {
    var _filesToParse = helper.walkDirSync(destPath);
    for (var i = 0; i < _filesToParse.length; i++) {
      var _file = _filesToParse[i];
      var _content = fs.readFileSync(_file, 'utf8');
      _unzippedFiles.push({ name : path.relative(destPath, _file), data : _content})
    }
    callback(null, _unzippedFiles);
  });
}