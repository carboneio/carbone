var assert = require('assert');
var helper  = require('../lib/helper');
var path  = require('path');
var fs  = require('fs');
var rootPath = process.cwd(); // where "make test" is called
var testPath = rootPath+'/test/test/';
var jwt = require('kitten-jwt');

describe('helper', function () {

  describe('getUID', function () {
    it('should return a unique id', function () {
      var _uid = helper.getUID();
      var _uid2 = helper.getUID();
      helper.assert((_uid!==_uid2), true);
    });
  });

  describe('readEnvironmentVariable', function () {
    it('should do nothing', function () {
      helper.readEnvironmentVariable();
    });
    it('should return updated params object if there are matching env variable', function () {
      var _params = {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      };
      var _env = {
        CARBONE_EE_ISACTIVE  : 'false',
        CARBONE_EE_NBATTEMPT : '1222',
        CARBONE_EE_PATH      : '/yeah/',
        OTHER_STUFF          : 'matrix'
      };
      let _valuesToUpdate = helper.readEnvironmentVariable(_env, _params);
      helper.assert(_params.nbAttempt, 4);
      helper.assert(_valuesToUpdate, {
        isActive  : false,
        nbAttempt : 1222,
        path      : '/yeah/'
      });
    });
    it('should return an empty object if there is no matching env variable', function () {
      var _params = {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      };
      var _env = {
        OTHER_STUFF : 'matrix'
      };
      let _valuesToUpdate = helper.readEnvironmentVariable(_env, _params);
      helper.assert(_params.nbAttempt, 4);
      helper.assert(_valuesToUpdate, {});
    });
  });

  describe('isSafeFilename', function () {
    it('should do nothing', function () {
      helper.assert(helper.isSafeFilename(), false);
    });
    it('should detect unsafe filename', function () {
      helper.assert(helper.isSafeFilename('/../../id.txt'), false);
      helper.assert(helper.isSafeFilename('COM2'), false);
      helper.assert(helper.isSafeFilename(null), false);
      helper.assert(helper.isSafeFilename(undefined), false);
      helper.assert(helper.isSafeFilename('LPT4'), false);
      helper.assert(helper.isSafeFilename('NUL'), false);
      helper.assert(helper.isSafeFilename('../qsdssdDDFdqsdqsd'), false);
      helper.assert(helper.isSafeFilename('..abqsdqsdqsdqsdqsd'), false);
      helper.assert(helper.isSafeFilename('dqsdq'), false); // too short
      helper.assert(helper.isSafeFilename('💎qsdqsdqs233dqsd'), false);
      helper.assert(helper.isSafeFilename('iq-s1d_5R-TDd_kAOqsdqsdqdDHDZI8408-_P3d..docx'), false);
      helper.assert(helper.isSafeFilename('.qqadazsdssd'), false);
      helper.assert(helper.isSafeFilename('qqads?zads.sd'), false);
      helper.assert(helper.isSafeFilename('qq/\\ad?az/szads.sd'), false);
      helper.assert(helper.isSafeFilename('qq\\adszads.sd'), false);
      helper.assert(helper.isSafeFilename('qq/adszads.sd'), false);
      helper.assert(helper.isSafeFilename('qqad%az:sds.sd'), false);
      helper.assert(helper.isSafeFilename('qqad*.sd'), false);
    });
    it('should detect safe filename', function () {
      helper.assert(helper.isSafeFilename('iqsdd.txt'), true);
      helper.assert(helper.isSafeFilename('iq-s1d_5R-TDd_kAOP3d.docx'), true);
      helper.assert(helper.isSafeFilename('iq-s1d_5R-TDd_kAOqsdqsdqdDHDZI8408-_P3d.docx'), true);
      helper.assert(helper.isSafeFilename('iq-s1d_5R-TDd_kAOqsdqsd.qdDHDZI8408-_P3d'), true);
    });
  });



  describe('assignObjectIfAttributesExist', function () {
    it('should do nothing', function () {
      helper.assignObjectIfAttributesExist();
    });
    it('should assign value of target, only if it exists, and return messages for unknown attributes', function () {
      var _target = {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      };
      var _source = {
        isActive   : false,
        nbAttempt  : 1222,
        nbAttempt2 : 4,
        path       : '/yeah/',
        unkown     : 'sds'
      };

      var _messages = helper.assignObjectIfAttributesExist(_target, _source);
      helper.assert(_target, {
        isActive   : false,
        nbAttempt  : 1222,
        path       : '/yeah/',
        doNotTouch : 55
      });
      helper.assert(_messages, 'Unknown parameter(s): nbAttempt2, unkown');
    });
    it('should assign value of target, and return an empty message if all parameters are known', function () {
      var _target = {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      };
      var _source = {
        isActive : false,
        path     : '/yeah/',
      };

      var _messages = helper.assignObjectIfAttributesExist(_target, _source);
      helper.assert(_target, {
        isActive   : false,
        nbAttempt  : 4,
        path       : '/yeah/',
        doNotTouch : 55
      });
      helper.assert(_messages, '');
    });
    it('should return no error if target is null or undefined', function () {
      var _source = {
        isActive : false,
        path     : '/yeah/',
      };
      helper.assert(helper.assignObjectIfAttributesExist(null, _source), '');
      helper.assert(helper.assignObjectIfAttributesExist(undefined, _source), '');
    });
    it('should not crash if source is null or undefined', function () {
      var _target = {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      };
      helper.assert(helper.assignObjectIfAttributesExist(_target, null), '');
      helper.assert(helper.assignObjectIfAttributesExist(_target, undefined), '');
      helper.assert(_target, {
        isActive   : true,
        nbAttempt  : 4,
        path       : '/blabla/',
        doNotTouch : 55
      });
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
      helper.assert(_elapsed < (10 * helper.CPU_PERFORMANCE_FACTOR), true, 'getRandomString is too slow');
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

      helper.assert(helper.encodeSafeFilename('k�'), 'a--_vQ');
      helper.assert(helper.decodeSafeFilename('a--_vQ'), 'k�');
      helper.assert(helper.decodeSafeFilename('a--_vQ'), 'k�');
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

  describe('getSafePathCode', function () {
    // simulate getSafeValue, which normally must return dictionary[index] to get the content of str
    const getSafeValue = (str) => '_'+str+'_';
    it('should do nothing if object is undefined', function () {
      helper.assert(helper.getSafePathCode(), undefined);
    });
    it('should return a safe string with optional chaining', function () {
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id'), 'root?.[_id_]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id.car.auto'), 'root?.[_id_]?.[_car_]?.[_auto_]');
    });
    it('should return a safe string with optional chaining and arrays', function () {
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[1]'), 'root?.[_id_]?.[1]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[243][1212]'), 'root?.[_id_]?.[243]?.[1212]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[243].bus[1212].id.bidule'), 'root?.[_id_]?.[243]?.[_bus_]?.[1212]?.[_id_]?.[_bidule_]');
    });
    it('should accept whitespaces', function () {
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', '   id [1]'), 'root?.[_id_]?.[1]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', ' id  [ 243  ]  [ 1212  ]  '), 'root?.[_id_]?.[243]?.[1212]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', ' id[243] .   bus [ 1212].id .   bidule'), 'root?.[_id_]?.[243]?.[_bus_]?.[1212]?.[_id_]?.[_bidule_]');
    });
    it('should return error if direct array access is not safe', function () {
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[a]'), new Error('Forbidden array access in "id[a]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[]'), new Error('Forbidden array access in "id[]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id]sd'), new Error('Forbidden array access in "id]sd". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[12][b]'), new Error('Forbidden array access in "id[12][b]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id  [  12  ] [ b ]'), new Error('Forbidden array access in "id  [  12  ] [ b ]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[undefined]'), new Error('Forbidden array access in "id[undefined]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[?/2/éxs\n*¨%£_°]'), new Error('Forbidden array access in "id[?/2/éxs\n*¨%£_°]". Only positive integers are allowed in []'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[-121]'), new Error('Forbidden array access in "id[-121]". Only positive integers are allowed in []'));
    });
    it('should return error if empty attributes', function () {
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', '[1]'), new Error('Forbidden array access in "[1]". Only non-empty attributes are allowed'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', '  [1]'), new Error('Forbidden array access in "  [1]". Only non-empty attributes are allowed'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', '   '), new Error('Forbidden array access in "   ". Only non-empty attributes are allowed'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id..sd'), new Error('Forbidden array access in "id..sd". Only non-empty attributes are allowed'));
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[0].di....sd'), new Error('Forbidden array access in "id[0].di....sd". Only non-empty attributes are allowed'));
    });
    it('should accept dynamic array direct access with .i', function () {
      const _currentIterators = ['it1', 'it2'];
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[.i]', _currentIterators), 'root?.[_id_]?.[it2]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[..i]', _currentIterators), 'root?.[_id_]?.[it1]');
      helper.assert(helper.getSafePathCode(getSafeValue, 'root', 'id[..i].toto.titi[.i].id', _currentIterators), 'root?.[_id_]?.[it1]?.[_toto_]?.[_titi_]?.[it2]?.[_id_]');
      assert.throws(() => helper.getSafePathCode(getSafeValue, 'root', 'id[...i]', _currentIterators), new Error('Forbidden array access in "id[...i]". No array iterators matching with ...i'));
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

  describe('printVersion', function () {
    it('should print info', function () {
      let _text = helper.printVersion();
      helper.assert(/Carbone Render On-Premise Enterprise Edition/.test(_text), true);
    });
    it('should print license info', function () {
      let _licenseObj = {
        exp  : Date.now(),
        data : {
          name      : 'Acme',
          address   : 'FR',
          email     : 'client@email.com',
          startedAt : Date.now() / 1000,
          plan      : 'eternity'
        }
      };
      let _text = helper.printVersion(_licenseObj);
      helper.assert(/Carbone Render On-Premise Enterprise Edition/.test(_text), true);
      helper.assert(/Acme/.test(_text), true);
      helper.assert(/FR/.test(_text), true);
      helper.assert(/client@email\.com/.test(_text), true);
      helper.assert(/eternity/.test(_text), true);
    });
  });

  describe('findCheckLicense', function () {
    const _testDir = path.join(__dirname, 'licenseTest');
    const privKey = '-----BEGIN EC PRIVATE KEY-----\n'
      +'MIHcAgEBBEIBRhN047ucYKhfv1OpX+KGrdouwGAOLVLeBpRhzAmJHp9TC2b6lcyW\n'
      +'IGV6r7VHPlAEOGzA+kF9pCy0DYkVj4Usz1ugBwYFK4EEACOhgYkDgYYABAETL1OP\n'
      +'PY8KAduLmA19YahowjKjlO/JjWPWvn77uACakR8/25dD9scyYdYMchrBm6nqHvWO\n'
      +'1LNMlplBqyTFL/LCbACAuqyRUp/G7JPxkuRKZpMCrKUNrHbGBP6rsjUq6cVZJqOT\n'
      +'Jye4hyhtrUhrsE2dMjhDICxrNk9aAH3EAWZtznOPiQ==\n'
      +'-----END EC PRIVATE KEY-----\n';
    const pubKey = '-----BEGIN PUBLIC KEY-----\n'
      + 'MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBEy9Tjz2PCgHbi5gNfWGoaMIyo5Tv\n'
      + 'yY1j1r5++7gAmpEfP9uXQ/bHMmHWDHIawZup6h71jtSzTJaZQaskxS/ywmwAgLqs\n'
      + 'kVKfxuyT8ZLkSmaTAqylDax2xgT+q7I1KunFWSajkycnuIcoba1Ia7BNnTI4QyAs\n'
      + 'azZPWgB9xAFmbc5zj4k=\n'
      + '-----END PUBLIC KEY-----\n';
    const badPrivKey = '-----BEGIN EC PRIVATE KEY-----\n'
      + 'MIHcAgEBBEIBEfrcY6EOraHxV/4dyq2mrbFGy+6Z0U7ZlLQHIBM1Jh85r10o5qm/\n'
      + 'mbEww9OORJaN32s3355CEegAchkYUz0RxHOgBwYFK4EEACOhgYkDgYYABADXEndW\n'
      + 'J2TsG7WCkj/YaZXgqcyZCsgUVi+jAWlFvYqkeBmCESRxhJQVZsNGBMiV3j5Eg+Xr\n'
      + 'A4J9xkl7X+BYzcKl8wH3jRIXfqPOgvL/2w1deiR19twIL/tQ2+nfEmYLhzBeH11H\n'
      + 'xIOSBHq2z7MJRzd63QgyDvukm1n7DjqrFv5dyUANug==\n'
      + '-----END EC PRIVATE KEY-----\n';
    const _createAt = parseInt(Date.now() / 1000, 10);

    beforeEach(function () {
      helper.rmDirRecursive(_testDir);
      fs.mkdirSync(_testDir);
    });
    after(function () {
      helper.rmDirRecursive(_testDir);
    });

    it('should check if the license is valid from the license params (CLI or ENV)', function (done) {
      const _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      const _path = path.join(_testDir, 'acme_2020-10-10.carbone-license');
      generateLicense(_path, 123, 'carbone-ee-on-premise', 1000, privKey, _data);
      let _license = '';
      try {
        _license = fs.readFileSync(_path).toString();
      } catch(err) {
        helper.assert(err, null);
      }
      helper.findCheckLicense({ license: _license }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'Valid license ');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2020-12-29T15:47:12.636Z');
    });

    it('should read a directory and check if the license is valid', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'Valid license acme_2020-10-10.carbone-license');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2020-12-29T15:47:12.636Z');
    });
    it('should read a directory and check if the license is valid', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'Valid license acme_2020-10-10.carbone-license');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2020-12-29T15:47:12.636Z');
    });
    it('should be an invalid license if the publication date of Carbone is more recent than license expiration date\
        even if this expiration date is in the future. It happens if the client cheat system clock', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 100, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license. Check system clock. acme_2020-10-10.carbone-license');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2040-01-29T15:47:12.000Z');
    });
    it('should be a valid license (eternity plan) if the publication date of Carbone is older than license expiration date, even if expiration date is in the past', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', -1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'WARNING: Your license acme_2020-10-10.carbone-license has expired. Carbone-ee sill works but without support & updates');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be an invalid license (eternity plan) if the publication date of Carbone is newer than license expiration date', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', -1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2040-12-29T15:47:12.636Z');
    });
    it('should be an invalid license (not eternity plan) if expiration date is in the past', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'other' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', -1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be a valid trial license', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'trial' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'Trial license acme_2020-10-10.carbone-license');
        helper.assert(payload.data.plan, 'trial');
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be a invalid trial license if the signature is incorrect', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'trial' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 1000, badPrivKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be a invalid trial license if the audience is incorrect', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'trial' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee', 1000, privKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license (not for carbone-ee-on-premise) acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be an invalid license if the signature is not correct even if the plan is eternity and the license expiration date is before carbone package date', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', -1000, badPrivKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should be an invalid license if the signature is not correct even if the plan is eternity and the expiration date is after carbone package date', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 5000, badPrivKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2010-12-29T15:47:12.636Z');
    });
    it('should read a directory and select the most recent *.carbone-license file (valid)', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acm.otherfile')                  , 123, 'carbone-ee-on-premise', 10000, badPrivKey, _data);
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 10000, badPrivKey, _data);
      generateLicense(path.join(_testDir, 'file.carbone-license')           , 123, 'carbone-ee-on-premise', 10000, privKey   , _data);
      generateLicense(path.join(_testDir, 'license.txt')                    , 123, 'carbone-ee-on-premise', 10000, badPrivKey   , _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, true);
        helper.assert(message, 'Valid license file.carbone-license');
        helper.assert(payload.data.plan, 'eternity');
        done();
      }, '2020-12-29T15:47:12.636Z');
    });
    it('should read a directory and select the most recent *.carbone-license file (invalid)', function (done) {
      let _data = { name : 'Acme', address : 'FR', email : 'client@email.com', startedAt : _createAt, plan : 'eternity' };
      generateLicense(path.join(_testDir, 'acm.otherfile')                  , 123, 'carbone-ee-on-premise', 5000, badPrivKey, _data);
      generateLicense(path.join(_testDir, 'file.carbone-license')           , 123, 'carbone-ee-on-premise', 5000, privKey   , _data);
      generateLicense(path.join(_testDir, 'acme_2020-10-10.carbone-license'), 123, 'carbone-ee-on-premise', 5000, badPrivKey, _data);
      generateLicense(path.join(_testDir, 'license.txt')                    , 123, 'carbone-ee-on-premise', 5000, badPrivKey, _data);
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(message, 'Invalid license acme_2020-10-10.carbone-license');
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });


    it('should return an error if the directory does not contain a license', function (done) {
      helper.findCheckLicense({ licenseDir: _testDir }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/No/.test(message), true);
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });
    it('should return an error if the directory does exists', function (done) {
      helper.findCheckLicense({ licenseDir: path.join(__dirname, 'sdqdazlzedz')}, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/Cannot/.test(message), true);
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });
    it('should return an error if the licenseDir Option is missing or not correct', function (done) {
      helper.findCheckLicense({ licenseDir: undefined }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/Cannot/.test(message), true);
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });

    it('should return an error if the license option is not correct', function (done) {
      helper.findCheckLicense({ license: 'THIS IS NOT CORRECT' }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/Invalid license/.test(message), true);
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });

    it('should return an error if the license option is missing or not correct', function (done) {
      helper.findCheckLicense({ license: undefined }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/Cannot/.test(message), true);
        done();
      }, '2020-12-29T15:47:12.636Z');
    });

    it('should return an error if the license and licenseDir options are missing', function (done) {
      helper.findCheckLicense({ }, pubKey, (isValid, message, payload) => {
        helper.assert(isValid, false);
        helper.assert(/Cannot/.test(message), true);
        helper.assert(payload, undefined);
        done();
      }, '2020-12-29T15:47:12.636Z');
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

  describe('Find the relative path between 2 markers', function () {
    it('should find the relative path between 2 markers', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color', 'd.list[i].color2'), '.color2');
    });
    it('should find the relative path between a list and an object 1', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color', 'd.color2'), '..color2');
    });
    it('should find the relative path between a list and an object 2', function () {
      helper.assert(helper.getMarkerRelativePath('d.color', 'd.list2[i].color2'), '.list2[i].color2');
    });
    it('should find the relative path between a list and an object 3', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color', 'd.element.color2'), '..element.color2');
    });
    it('should find the relative path between a list and an object 4', function () {
      helper.assert(helper.getMarkerRelativePath('d.element.color2', 'd.list[i].color'), '..list[i].color');
    });
    it('should find the relative path between a list and an object 5', function () {
      helper.assert(helper.getMarkerRelativePath('d.element.color2', 'd.element.list[i].color'), '.list[i].color');
    });
    it('should find the relative path between a list and an object 6', function () {
      helper.assert(helper.getMarkerRelativePath('d.element.color2.object.apple.yellow', 'd.element.list[i].color'), '....list[i].color');
    });
    it('should find the relative path between two list 1', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color', 'd.list[i].list[i].color2'), '.list[i].color2');
    });
    it('should find the relative path between two list 2', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].list[2].color', 'd.list[i].color2'), '..color2');
    });
    it('should find the relative path between two list 3', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color', 'd.list2[i].color2'), '..list2[i].color2');
    });
    it('should find the relative path between two list 4 with similar object names', function () {
      helper.assert(helper.getMarkerRelativePath('d.list[i].color.red', 'd.list2[i].color2.red.blue'), '...list2[i].color2.red.blue');
    });
    it('Test errors with invalid args', function () {
      helper.assert(helper.getMarkerRelativePath('', 'd.list2[i].color2.red.blue'), '');
      helper.assert(helper.getMarkerRelativePath('d.list', ''), '');
      helper.assert(helper.getMarkerRelativePath(null, 'd.element'), '');
      helper.assert(helper.getMarkerRelativePath('d.element', null), '');
      helper.assert(helper.getMarkerRelativePath(undefined, 'd.element'), '');
      helper.assert(helper.getMarkerRelativePath('d.element', undefined), '');
      helper.assert(helper.getMarkerRelativePath(21, 'd.element'), '');
      helper.assert(helper.getMarkerRelativePath('d.element', 32), '');
    });
  });

  describe('insertAt', function () {
    it('should insert text inside a content at a specific position', function () {
      const _content = 'Western robin (Eopsaltria griseogularis).';
      helper.assert(helper.insertAt(_content, 7, ' yellow'), 'Western yellow robin (Eopsaltria griseogularis).');
      helper.assert(helper.insertAt(_content, 0, 'yellow '), 'yellow Western robin (Eopsaltria griseogularis).');
      helper.assert(helper.insertAt(_content, _content.length, ' yellow'), 'Western robin (Eopsaltria griseogularis). yellow');
      helper.assert(helper.insertAt('', 0, 'yellow'), 'yellow');
    });

    it('should throw errors if the arguments are invalid', function () {
      // Null arguments
      assert.throws(() => helper.insertAt(null, 7, ' yellow'), new Error('The arguments are invalid (null or undefined).'));
      assert.throws(() => helper.insertAt('text', null, ' yellow'), new Error('The arguments are invalid (null or undefined).'));
      assert.throws(() => helper.insertAt('text', 8, null), new Error('The arguments are invalid (null or undefined).'));
      // position out of the range
      assert.throws(() => helper.insertAt('text', -1, 'yellow'), new Error('The index is outside of the text length range.'));
      assert.throws(() => helper.insertAt('text', 10, 'yellow'), new Error('The index is outside of the text length range.'));
      assert.throws(() => helper.insertAt('', 1, 'yellow'), new Error('The index is outside of the text length range.'));
    });
  });

  describe('compareStringFromPosition', function () {
    it('Should find the text searched on the content at a specific position.', function () {
      const _content = 'Western yellow robin (Eopsaltria griseogularis).';
      helper.assert(helper.compareStringFromPosition('yellow', _content, 8), true);
      helper.assert(helper.compareStringFromPosition(' robin ', _content, 14), true);
      helper.assert(helper.compareStringFromPosition('opsaltr', _content, 23), true);
      helper.assert(helper.compareStringFromPosition('griseogularis).', _content, 33), true);
    });

    it('Should NOT find the text searched on the content at a specific position.', function () {
      const _content = 'Western yellow robin (Eopsaltria griseogularis).';
      helper.assert(helper.compareStringFromPosition('yelow', _content, 8), false);
      helper.assert(helper.compareStringFromPosition('robin ', _content, 14), false);
      helper.assert(helper.compareStringFromPosition('opsaltr', _content, 24), false);
      helper.assert(helper.compareStringFromPosition('griseogularis).', _content, 1), false);
      helper.assert(helper.compareStringFromPosition('yellow', 'yel', 1), false);
    });

    it('Should throw an error if an argument is invalid', function () {
      // arguments undefined or null
      assert.throws(() => helper.compareStringFromPosition(null, 'text', 1), new Error('The arguments are invalid (null or undefined).'));
      assert.throws(() => helper.compareStringFromPosition('text', null, 1), new Error('The arguments are invalid (null or undefined).'));
      assert.throws(() => helper.compareStringFromPosition('text', 'text 1234', undefined), new Error('The arguments are invalid (null or undefined).'));
      // the index is out of the text range
      assert.throws(() => helper.compareStringFromPosition('blue', 'blue', -1), new Error('The index is outside of the text length range.'));
      assert.throws(() => helper.compareStringFromPosition('blue', 'blue', 10), new Error('The index is outside of the text length range.'));
    });
  });
});


function generateLicense (licensePath, clientId, serverId, expireInSecond, privKey, infoClient) {
  fs.writeFileSync(licensePath, jwt.generate(clientId, serverId, expireInSecond, privKey, infoClient), 'utf8');
}
