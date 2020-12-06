var assert = require('assert');
var helper  = require('../lib/helper');
var path  = require('path');
var fs  = require('fs');
var rootPath = process.cwd(); // where "make test" is called
var testPath = rootPath+'/test/test/';

describe('helper', function () {

  describe('getUID', function () {
    it('should return a unique id', function () {
      var _uid = helper.getUID();
      var _uid2 = helper.getUID();
      helper.assert((_uid!==_uid2), true);
    });
  });

  describe('getRandomString', function () {
    it('should return a random id', function () {
      var _uid = helper.getRandomString();
      var _uid2 = helper.getRandomString();
      helper.assert(_uid.length, 22);
      helper.assert((_uid!==_uid2), true);
    });
    it('should be fast and random', function () {
      var _loops = 1000;
      var _res = [];
      var _start = process.hrtime();
      for (let i = 0; i < _loops; i++) {
        _res.push(helper.getRandomString());
      }
      var _diff = process.hrtime(_start);
      helper.assert(_res.length, _loops);
      _res.sort();
      for (let i = 0; i < _loops - 1; i++) {
        if (_res[i] === _res[i+1]) {
          assert(false, 'Random string should be different');
        }
      }
      var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
      console.log('\n getRandomString : ' + _elapsed + ' ms (around 1.3ms for 1000) \n');
      helper.assert(_elapsed > 5, false, 'getRandomString is too slow');
    });
  });

  describe('encodeSafeFilename|decodeSafeFilename', function () {
    it('should not crash if string is undefined or null', function () {
      helper.assert(helper.encodeSafeFilename(), '');
      helper.assert(helper.encodeSafeFilename(null), '');
    });
    it('should generate a safe filename from any string, and should be able to decode it', function () {
      helper.assert(helper.encodeSafeFilename('azertyuioopqsdfghjklmwxcvbn'), 'YXplcnR5dWlvb3Bxc2RmZ2hqa2xtd3hjdmJu');
      helper.assert(helper.decodeSafeFilename('YXplcnR5dWlvb3Bxc2RmZ2hqa2xtd3hjdmJu'), 'azertyuioopqsdfghjklmwxcvbn');

      // base64 character ends with =
      helper.assert(helper.encodeSafeFilename('01234567890'), 'MDEyMzQ1Njc4OTA');
      helper.assert(helper.decodeSafeFilename('MDEyMzQ1Njc4OTA'), '01234567890');

      // base64 character ends with ==
      helper.assert(helper.encodeSafeFilename('0123456789'), 'MDEyMzQ1Njc4OQ');
      helper.assert(helper.decodeSafeFilename('MDEyMzQ1Njc4OQ'), '0123456789');

      helper.assert(helper.encodeSafeFilename('n?./+£%*¨^../\\&éé"\'(§è!çà)-)'), 'bj8uLyvCoyUqwqheLi4vXCbDqcOpIicowqfDqCHDp8OgKS0p');
      helper.assert(helper.decodeSafeFilename('bj8uLyvCoyUqwqheLi4vXCbDqcOpIicowqfDqCHDp8OgKS0p'), 'n?./+£%*¨^../\\&éé"\'(§è!çà)-)');

      helper.assert(helper.encodeSafeFilename('报道'), '5oql6YGT');
      helper.assert(helper.decodeSafeFilename('5oql6YGT'), '报道');

      helper.assert(helper.encodeSafeFilename('k�'), 'a__-vQ');
      helper.assert(helper.decodeSafeFilename('a__-vQ'), 'k�');
      helper.assert(helper.decodeSafeFilename('a__-vQ'), 'k�');
    });
  });

  describe('cleanJavascriptVariable', function () {
    it('should return the same attribute name if there is no forbidden character in it', function () {
      helper.assert(helper.cleanJavascriptVariable('aa'), 'aa');
      helper.assert(helper.cleanJavascriptVariable('aa$'), 'aa$');
      helper.assert(helper.cleanJavascriptVariable('aa_'), 'aa_');
    });
    it('should replace forbidden character in attribute', function () {
      helper.assert(helper.cleanJavascriptVariable('aa-2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa+2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa/2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa*2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa>2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa<2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa!2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa=2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa\'2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('aa"2'), 'aa_2');
      helper.assert(helper.cleanJavascriptVariable('ab-+-/*!=.f'), 'ab________f');
    });
  });

  describe('getValueOfPath', function () {
    it('should do nothing if object is undefined', function () {
      helper.assert(helper.getValueOfPath(), undefined);
    });
    it('should get value of attribute if (first level)', function () {
      var _obj = {
        id : 1
      };
      helper.assert(helper.getValueOfPath(_obj, 'id'), 1);
    });
    it('should do nothing if object is undefined', function () {
      var _obj = {
        subObj : {
          subObj : {
            end : {
              label : 'bla'
            }
          }
        }
      };
      helper.assert(helper.getValueOfPath(_obj, 'subObj.subObj.end.label'), 'bla');
    });
    it('should be fast to sort 1 Millons of rows', function () {
      var _nbRows = 100000;
      var _res = 0;
      var _obj = {
        subObj : {
          subObj : {
            end : {
              val : 10
            },
            val : 1
          }
        }
      };
      var _start = process.hrtime();
      var _random = ['subObj.subObj.end.val', 'subObj.subObj.val'];
      for (var i = 0; i < _nbRows; i++) {
        _res += helper.getValueOfPath(_obj, _random[Math.round(Math.random())]);
      }
      var _diff = process.hrtime(_start);
      var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
      console.log('\n getValueOfPath speed : ' + _elapsed  + ' ms (usually around 30 ms) '+_res+'\n');
      helper.assert(_elapsed < 100, true);
    });
  });

  describe('removeDuplicatedRows', function () {
    it('should do nothing if the array is empty', function () {
      helper.assert(helper.removeDuplicatedRows([]), []);
    });
    it('should do nothing with an array of length = 1', function () {
      helper.assert(helper.removeDuplicatedRows(['aa']), ['aa']);
    });
    it('should remove duplicated rows', function () {
      helper.assert(helper.removeDuplicatedRows(['aa', 'aa', 'aa', 'bb', 'cc', 'cc', 'yy']), ['aa', 'bb', 'cc', 'yy']);
    });
  });

  describe('removeQuote', function () {
    it('should do nothing if it is not a string', function () {
      helper.assert(helper.removeQuote(), undefined);
      helper.assert(helper.removeQuote(null), null);
      helper.assert(helper.removeQuote(22), 22);
    });
    it('should remove quote form string', function () {
      helper.assert(helper.removeQuote('sdsd'), 'sdsd');
      helper.assert(helper.removeQuote('\'sdsd\''), 'sdsd');
      helper.assert(helper.removeQuote('"sdsd"'), 'sdsd');
    });
    it('should not remove quote inside string', function () {
      helper.assert(helper.removeQuote('"sd \' sd"'), 'sd \' sd');
      helper.assert(helper.removeQuote('\'sd " sd\''), 'sd " sd');
    });
  });


  describe('readFileDirSync', function () {
    beforeEach(function () {
      helper.rmDirRecursive(testPath);
    });
    after(function () {
      helper.rmDirRecursive(testPath);
    });
    it('should read a directory and return the content of each file in an object', function (done) {
      // create the directory
      fs.mkdirSync(testPath, parseInt('0755', 8));
      var _allFiles = [
        path.join(testPath, 'test.sql'),
        path.join(testPath, 'test1.sql'),
        path.join(testPath, 'test2.sql')
      ];
      fs.writeFileSync(_allFiles[0], 'file 1');
      fs.writeFileSync(_allFiles[1], 'file 2');
      fs.writeFileSync(_allFiles[2], 'file 3');
      var _expectedResult = {};
      _expectedResult[_allFiles[0]] = 'file 1';
      _expectedResult[_allFiles[1]] = 'file 2';
      _expectedResult[_allFiles[2]] = 'file 3';
      helper.assert(helper.readFileDirSync(testPath), _expectedResult);
      done();
    });
    it('should only parse .sql files', function (done) {
      // create the directory
      fs.mkdirSync(testPath, parseInt('0755', 8));
      var _allFiles = [
        path.join(testPath, 'test.sql'),
        path.join(testPath, 'test1.js'),
        path.join(testPath, 'test2.csv')
      ];
      fs.writeFileSync(_allFiles[0], 'file 1');
      fs.writeFileSync(_allFiles[1], 'file 2');
      fs.writeFileSync(_allFiles[2], 'file 3');
      var _expectedResult = {};
      _expectedResult[_allFiles[0]] = 'file 1';
      helper.assert(helper.readFileDirSync(testPath, 'sql'), _expectedResult);
      done();
    });
  });


  describe('rmDirRecursive(dir)' ,function () {
    it('should remove the directory specified', function (done) {
      var _testedPath = path.join(__dirname, 'createdDir');
      // create the directory
      if (!fs.existsSync(_testedPath)) {
        fs.mkdirSync(_testedPath, parseInt('0755', 8));
      }
      fs.writeFileSync(path.join(_testedPath, 'test.js'), 'test');
      fs.writeFileSync(path.join(_testedPath, 'test2.sql'), 'test');
      var _subDir = path.join(_testedPath, 'otherDir');
      if (!fs.existsSync(_subDir)) {
        fs.mkdirSync(_subDir, parseInt('0755', 8));
      }
      fs.writeFileSync(path.join(_subDir, 'testsub.sql'), 'test');

      helper.rmDirRecursive(_testedPath);

      assert.equal(fs.existsSync(_testedPath), false);
      done();
    });
  });


  describe('walkDirSync(dir, extension)' ,function () {
    beforeEach(function () {
      var _testedPath = path.join(__dirname, 'walkDirTest');
      helper.rmDirRecursive(_testedPath);
    });
    after(function () {
      var _testedPath = path.join(__dirname, 'walkDirTest');
      helper.rmDirRecursive(_testedPath);
    });
    it('should return an empty array if the directory does not exist or if the directory is empty', function (done) {
      var _testedPath = path.join(__dirname, 'walkDirTest');
      var _result = helper.walkDirSync(_testedPath);
      assert.equal(_result.length, 0);
      done();
    });
    it('should return an empty array if the directory is empty', function (done) {
      var _testedPath = path.join(__dirname, 'walkDirTest');
      var _subDir = path.join(_testedPath, 'otherDir');
      // create the directory
      fs.mkdirSync(_testedPath, parseInt('0755', 8));
      fs.mkdirSync(_subDir, parseInt('0755', 8));
      var _result = helper.walkDirSync(_testedPath);
      assert.equal(_result.length, 0);
      done();
    });
    it('should return all the files if no extension is specified', function (done) {
      var _testedPath = path.join(__dirname, 'walkDirTest');
      var _subDir = path.join(_testedPath, 'otherDir');
      // create the directory
      fs.mkdirSync(_testedPath, parseInt('0755', 8));
      fs.mkdirSync(_subDir, parseInt('0755', 8));
      var _expectedResult = [
        path.join(_subDir, 'testsub1.sql'),
        path.join(_subDir, 'testsub2.sql'),
        path.join(_testedPath, 'test'),
        path.join(_testedPath, 'test1.js'),
        path.join(_testedPath, 'test2.js')
      ];
      fs.writeFileSync(_expectedResult[0], '');
      fs.writeFileSync(_expectedResult[1], '');
      fs.writeFileSync(_expectedResult[2], '');
      fs.writeFileSync(_expectedResult[3], '');
      fs.writeFileSync(_expectedResult[4], '');
      var _result = helper.walkDirSync(_testedPath);
      assert.equal(JSON.stringify(_result), JSON.stringify(_expectedResult));
      done();
    });
  });


  describe('copyDirSync(dirSource, dirDest)' ,function () {
    it('should remove the directory specified', function (done) {
      var _sourcePath = path.join(__dirname, 'datasets', 'helperDirTest');
      var _destPath = path.join(__dirname);
      helper.copyDirSync(_sourcePath, _destPath);
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest')));
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest', 'create.sql')));
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest', 'test', 'create.sql')));
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest', 'test', 'destroy.sql')));
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest', 'test', 'list.sql')));
      assert(fs.existsSync(path.join(__dirname, 'helperDirTest', 'test', 'update.sql')));
      var _testedDir = path.join(__dirname, 'helperDirTest');
      helper.rmDirRecursive(_testedDir);
      done();
    });
  });

  describe('distance(str, str)', function () {
    it('should return 0 with empty string', function () {
      assert.equal( helper.distance('', ''), 0 );
    });
    it('should return 2 if there is two different character', function () {
      assert.equal( helper.distance('titi', 'toto'), 2);
    });
    it('should return 2 if there is two different character', function () {
      assert.equal( helper.distance('azertyuiop12345', 'ytrezauiop02345'), 7);
    });
  });

  describe('findClosest(str, choices)', function () {
    it('should return an empty string', function () {
      assert.equal( helper.findClosest(''   , [])       , '' );
      assert.equal( helper.findClosest(''   , [''])     , '' );
      assert.equal( helper.findClosest('bla', [])       , '' );
      assert.equal( helper.findClosest(''   , ['bla'])  , '' );
    });
    it('should return toto', function () {
      assert.equal( helper.findClosest('titi', ['blabla', 'croco', 'toto']), 'toto');
    });
    it('should accept an object of choices', function () {
      assert.equal( helper.findClosest('titi', {blabla : 1, croco : 2, toto : 3}), 'toto');
    });
  });


});
