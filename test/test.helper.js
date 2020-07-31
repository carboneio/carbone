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

  describe('genericQueue', () => {

    it('should process one element', () => {
      let _nb    = [];
      let _queue = helper.genericQueue(
        [{ id : 1 }]
        , item => {
          _nb.push(item.id);
        }
      );

      _queue.start();
      helper.assert(_nb, [1]);
    });

    it('should process multiple elements', () => {
      let _nb    = [];
      let _queue = helper.genericQueue(
        [{ id : 1 }, { id : 2 }, { id : 3 }]
        , (item, next) => {
          _nb.push(item.id);
          next();
        }
      );

      _queue.start();
      helper.assert(_nb, [1, 2, 3]);
    });

    it('should return error', () => {
      let _nb    = [];
      let _error = null;
      let _queue = helper.genericQueue(
        [{ id : 1 , error : 'error' }, { id : 2 }, { id : 3 }]
        , (item, next) => {
          if (item.error) {
            return next(item.error);
          }

          _nb.push(item.id);
          next();
        }
        , err => {
          _error = err;
        }
      );

      _queue.start();
      helper.assert(_nb,[2, 3]);
      helper.assert(_error, 'error');
    });

    it('should stop the queue on error when option is set', () => {

      let _nb    = [];
      let _error = null;
      let _success = false;
      let _items = [{ id : 1 }, { id : 2, error : 'error' }, { id : 3 }];
      let _options = { stopOnError : true };

      function handlerItem (item, next) {
        if (item.error) {
          return next(item.error);
        }

        _nb.push(item.id);
        next();
      }

      function handlerSuccess () {
        _success = true;
      }

      function handlerError (err) {
        _error = err;
      }

      helper.genericQueue(_items, handlerItem, handlerError, handlerSuccess, _options).start();

      helper.assert(_nb, [1]);
      helper.assert(_error, 'error');
      helper.assert(_success, false);
    });

    it('should process multiple elements and call callback end function when it is finished', (done) => {
      let _nb    = [];
      let _queue = helper.genericQueue(
        [{ id : 1 }, { id : 2 }, { id : 3 }]
        , (item, next) => {
          setTimeout(() => {
            _nb.push(item.id);
            next();
          }, 100);
        }
        , null
        , () => {
          helper.assert(_nb, [1, 2, 3]);
          done();
        }
      );

      _queue.start();
    });

    it('should not start the queue twice if .start is called twice', (done) => {
      let _nb    = [];
      let _queue = helper.genericQueue(
        [{ id : 1 }, { id : 2 }, { id : 3 }]
        , (item, next) => {
          setTimeout(() => {
            _nb.push(item.id);
            next();
          }, 100 / item.id);
        }
        , null
        , () => {
          helper.assert(_nb, [1, 2, 3]);
          done();
        }
      );
      _queue.start();
      _queue.start();
    });

    it('should restart even after a first run', () => {
      let _nb    = [];
      let _queue = helper.genericQueue(
        [{ id : 1 }]
        , (item, next) => {
          _nb.push(item.id);
          next();
        }
      );
      _queue.start();
      helper.assert(_nb, [1]);
      _queue.items.push({ id : 2 });
      _queue.start();
      helper.assert(_nb, [1, 2]);
    });

  });

  describe('mergeObjects', () => {
    it('should merge obj2 into obj1 with a simple property', function () {
      let obj1 = { firstname : 'John' };
      let obj2 = { lastname : 'Wick' };
      obj1 = helper.mergeObjects(obj1, obj2);
      helper.assert(obj1, {firstname : 'John', lastname : 'Wick' });
    });
    it('should merge obj2 into obj1 with multiple properties 1', function () {
      let obj1 = { firstname : 'John', lastname : 'Wick', age : 55, city : 'Toronto', postalcode : 32123 };
      let obj2 = { lastname : 'Cena', age : 43, city : 'West Newbury' };
      obj1 = helper.mergeObjects(obj1, obj2);
      helper.assert(obj1, { firstname : 'John', lastname : 'Cena', age : 43, city : 'West Newbury', postalcode : 32123 });
    });
    it('should merge obj2 into obj1 with multiple properties 2', function () {
      let obj1 = { fruit : 'apple', id : 2, validate : false, limit : 5, name : 'foo' };
      let obj2 = { firstname : 'John', lastname : 'Wick', id : 9, validate : true, name : 'bar' };
      obj1 = helper.mergeObjects(obj1, obj2);
      helper.assert(obj1, { fruit : 'apple', id : 9,  validate : true, limit : 5, name : 'bar', firstname : 'John', lastname : 'Wick' });
    });
    it('should merge obj2 into obj1 with multiple properties 3', function () {
      let obj1 = { validate : false, limit : 5, name : 'foo', fruitsList : ['banana'], properties : { child : { id : 1}} };
      let obj2 = { validate : true, name : 'bar', fruitsList : ['tomatoes', 'apples', 'pineapples'], properties : { child : { id : 2}} };
      obj1 = helper.mergeObjects(obj1, obj2);
      helper.assert(obj1, { validate : true, limit : 5, name : 'bar', fruitsList : ['tomatoes', 'apples', 'pineapples'], properties : { child : { id : 2 } }  });
    });
  });

  describe('Get file extension from URL', function () {
    it('should return a png/jpeg/gif/txt extension', function () {
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image-flag-fr.png'), 'png');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image.gif'), 'gif');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image.with.lot.of.points.jpeg'), 'jpeg');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image-flag-fr.txt'), 'txt');
    });
    it('should return a png/jpeg/gif/txt extension with query parameters', function () {
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image-flag-fr.png?fewfw=223&lala=few'), 'png');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image.gif#fewfw=223?lala=few'), 'gif');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image.with.lot.of.points.jpeg&name=John'), 'jpeg');
      helper.assert(helper.getFileExtensionFromUrl('https://google.com/image-flag-fr.txt?name=john&age=2#lala'), 'txt');
    });
  });

  describe.only('Find the relative path between 2 markers', function () {
    it('should find the relative path between 2 markers', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].color', 'd.list[i].color2'), '.color2');
    });
    it('should find the relative path from a list 2', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].color', 'd.color2'), '..color2');
    });
    it('should find the relative path from list and return an empty string', function () {
      helper.assert(helper.findMarkerRelativePath('d.color', 'd.list2[i].color2'), '.list2[i].color2');
    });
    it('should find the relative path from a nested list', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].list[2].color', 'd.list[i].color2'), '..color2');
    });
    it('should find the relative path from list and return an empty string', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].color', 'd.element.color2'), '..element.color2');
    });
    it('should find the relative path from list and return an empty string', function () {
      helper.assert(helper.findMarkerRelativePath('d.element.color2', 'd.list[i].color'), '..list[i].color');
    });
    it('should find the relative path from list and return an empty string', function () {
      helper.assert(helper.findMarkerRelativePath('d.element.color2', 'd.element.list[i].color'), '.list[i].color');
    });
    it('should find the relative path from list and return an empty string', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].color', 'd.list2[i].color2'), '..list2[i].color2');
    });
    it('should find the relative path between two list and with similar object names', function () {
      helper.assert(helper.findMarkerRelativePath('d.list[i].color.red', 'd.list2[i].color2.red.blue'), '...list2[i].color2.red.blue');
    });
  });

});
