var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var testPath = path.join(__dirname, 'test_file');

describe.only('Carbone.batch', function () {
  before(function () {
    var _templatePath = path.resolve('./test/datasets');
    carbone.set({templatePath : _templatePath});
    helper.rmDirRecursive(testPath);
  });
  afterEach(function () {
    helper.rmDirRecursive(testPath);
  });
  after(function () {
    carbone.reset();
  });
  it('should render a template and return a path instead of a buffer if renderPrefix is defined', function (done) {
    var data = {
      itemsCustom : [{
        field1 : 'field_1',
        field2 : 'field_2'
      },{
        field1 : 'field_3',
        field2 : 'field_4'
      }]
    };
    var opt = {
      renderPrefix  : 'prefix-',
      splitReportOn : 'd.itemsCustom'
    };
    carbone.render('test_word_render_A.docx', data, opt, function (err, resultFilePath) {
      assert.equal(err, null);
      // console.log(resultFilePath)
      //var _filename = path.basename(resultFilePath);
      //assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
      fs.unlinkSync(resultFilePath);
      done();
    });
  });
});

