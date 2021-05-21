var dateFormatter = require('../formatters/date');
var conditionFormatter = require('../formatters/condition');
var stringFormatter = require('../formatters/string');
var arrayFormatter = require('../formatters/array');
var numberFormatter = require('../formatters/number');
var helper = require('../lib/helper');

describe('formatter', function () {
  describe('convDate', function () {
    var _tz = 'Europe/Paris';
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, '20101201', 'YYYYMMDD', 'L'), '12/01/2010');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, '20101201', 'YYYYMMDD', 'L'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, undefined, 'YYYYMMDD', 'L'), undefined);
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, null, 'YYYYMMDD', 'L'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, 1318781876, 'X', 'LLLL'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, 1318781876, 'X', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, 1318781876000, 'x', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
    });
  });
  describe('formatD', function () {
    var _tz = 'Europe/Paris';
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '20101201', 'L', 'YYYYMMDD'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'L', 'YYYYMMDD'), '01/12/2010');
    });
    it('should return week number', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'W', 'YYYYMMDD'), '48');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, undefined, 'L', 'YYYYMMDD'), undefined);
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, null, 'L',  'YYYYMMDD'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'dimanche 16 octobre 2011 18:17');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, 1318781876000, 'LLLL', 'x'), 'dimanche 16 octobre 2011 18:17');
    });
    it('should accept de-de even if de-de does not exists in DaysJS by default (only de)', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'de-de', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'Sonntag, 16. Oktober 2011 18:17');
    });
    it('should consider input format is ISO 8601 by default if not provided', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '2017-05-10T15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '2017-05-10 15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 4:37 PM');
    });
    it('should accepts real locales', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en-gb', timezone : _tz}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en'   , timezone : _tz}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr-ca', timezone : _tz}, '20101201', 'L'), '2010-12-01');
      helper.assert(dateFormatter.formatD.call({lang : 'fr'   , timezone : _tz}, '20101201', 'L'), '01/12/2010');
    });
    it('should manage timezone', function () {
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Paris' }, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 4:37 PM'
      );
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'America/New_York' }, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 10:37 AM'
      );
      // By default if no timezone in date, it considers the timezone is Europe/Paris
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'America/New_York' }, '1997-12-17 18:32:16', 'LLLL'), 'Wednesday, December 17, 1997 12:32 PM'
      );
    });
  });
  describe('convCRLF', function () {
    it('should convert LF and CR in odt', function () {
      helper.assert(stringFormatter.convCRLF.call({extension : 'odt'}, 'qsdqsd \n sd \r\n qsd \n sq'), 'qsdqsd <text:line-break/> sd <text:line-break/> qsd <text:line-break/> sq');
    });
    it('should convert LF and CR in docx', function () {
      helper.assert(stringFormatter.convCRLF.call({extension : 'docx'}, 'qsdqsd \n'), 'qsdqsd </w:t><w:br/><w:t>');
    });
  });
  describe('ifEmpty', function () {
    it('should show a message if data is empty. It should stop propagation to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, ''       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, null     , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, undefined, 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, []       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, NaN      , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty', 'true'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty', true), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, false);
    });

    it('should return data if the message is not empty... and keep on propagation to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 0           , 'msgIfEmpty'), 0);
      helper.assert(_context.stopPropagation, false);

      var _date = new Date();
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, _date       , 'msgIfEmpty'), _date);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 'sdsd'      , 'msgIfEmpty'), 'sdsd');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 12.33       , 'msgIfEmpty'), 12.33);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, true        , 'msgIfEmpty'), true);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, [12, 23]    , 'msgIfEmpty'), [12, 23]);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {d : 'd'}     , 'msgIfEmpty'), {d : 'd'});
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('ifEqual', function () {
    it('should show a message if data is equal to a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 0, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '0', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, true, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'true', 'true', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, 'true', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'false', 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, false, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
    });
    it('should propagate to next formatter if continueOnSuccess is true', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 0, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '0', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, true, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, false, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue', true), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
    });
    it('should return data if data is not equal to a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 3, 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '1', 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, false, 'msgIfTrue'), true);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'true', false, 'msgIfTrue'), 'true');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'false', 'true', 'msgIfTrue'), 'false');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, true, 'msgIfTrue'), false);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'toto', 'msgIfTrue'), 'titi');
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('ifContains', function () {
    it('should show a message if data contains a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'is', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'car is', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'toto', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
    });
    it('should propagate to next formatter if continueOnSuccess is true', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'is', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'car is', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'toto', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue', true), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
    });
    it('should return data if data does not contain the variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'are', 'msgIfTrue'), 'car is broken');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'caris', 'msgIfTrue'), 'car is broken');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'titi', 'msgIfTrue'), [1, 2, 'toto']);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [], 3, 'msgIfTrue'), []);
      helper.assert(_context.stopPropagation, false);
    });
    it('should not crash if data is not a String or an Array. It should transfer to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, null, 'is', 'msgIfTrue'), null);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, undefined, 'is', 'msgIfTrue'), undefined);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 12, 'titi', 'msgIfTrue'), 12);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, {toto : 2 }, 3, 'msgIfTrue'),  {toto : 2 });
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('New conditional system ifEQ, ifNE, ...', function () {

    const _contextAndExpectedResultWhenConditionIsTrue = [
      { isConditionTrue : false, isAndOperator : false, isConditionTrueExpected : true  }, // false || true = true
      { isConditionTrue : false, isAndOperator : true , isConditionTrueExpected : false }, // false && true = false
      { isConditionTrue : true , isAndOperator : false, isConditionTrueExpected : true  }, // true  || true = true
      { isConditionTrue : true , isAndOperator : true , isConditionTrueExpected : true  }  // true  && true = true
    ];
    const _contextAndExpectedResultWhenConditionIsFalse = [
      { isConditionTrue : false, isAndOperator : false, isConditionTrueExpected : false }, // false || false = false
      { isConditionTrue : false, isAndOperator : true , isConditionTrueExpected : false }, // false && false = false
      { isConditionTrue : true , isAndOperator : false, isConditionTrueExpected : true  }, // true  || false = true
      { isConditionTrue : true , isAndOperator : true , isConditionTrueExpected : false }  // true  && false = false
    ];

    /**
     * Generic function to test all combination of context + datasets and print error
     *
     * @param  {String} formatter           formatter to call
     * @param  {Array}  data                dataset to test
     * @param  {Array}  expectedResult      true or false
     */
    function testCondition (formatter, data, expectedResult) {
      var _context = {};
      for (let i = 0, n = data.length; i < n; i++) {
        const el = data[i];
        const expectedFromContext = (expectedResult === true) ? _contextAndExpectedResultWhenConditionIsTrue : _contextAndExpectedResultWhenConditionIsFalse;
        for (let j = 0, len = expectedFromContext.length; j < len; j++) {
          const _test = expectedFromContext[j];
          _context.isConditionTrue = _test.isConditionTrue;
          _context.isAndOperator   = _test.isAndOperator;
          var _returnedValue = callWithContext(conditionFormatter[formatter], _context, el[0], el[1]);
          try {
            helper.assert(_context.isConditionTrue, _test.isConditionTrueExpected);
            helper.assert(_context.isAndOperator  , _test.isAndOperator);
            helper.assert(_returnedValue          , el[0]);
            helper.assert(_context.stopPropagation, false);
          }
          catch (e) {
            // Prints better error output for debugging
            console.log('\x1b[31m');
            console.log(`\nContext :\n  ${JSON.stringify(_context)}`);
            console.log('\nFormatter called:');
            console.log(`  ${formatter}(${JSON.stringify(el[0])}, ${JSON.stringify(el[1])})`);
            console.log('\n\x1b[0m');
            throw e;
          }
        }
      }
    }

    describe('ifEQ', function () {
      it('should turn the `isConditionTrue` to True if a data is equal to a variable', function () {
        const _dataSet = [
          [0, 0],
          [0, '0'],
          [23.232, 23.232],
          [23.232, '23.232'],
          ['23.232', 23.232],
          [true, true],
          ['true', 'true'],
          [true, 'true'],
          ['false', 'false'],
          [false, 'false'],
          [false, false],
          ['titi', 'titi'],
          [undefined, undefined],
          [null, null],
          // object identiques, it is comparing "[object Object]" === "[object Object]"
          [{value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}}],
          [{ name : '85 street'}, {value : 10, name : 'wick', address : { name : '321 street'}}],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]]
        ];
        testCondition('ifEQ', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
        const _dataSet = [
          [0, 3],
          [0, '1'],
          [22.2222, 22.2223],
          [22.2222, '22.2223'],
          [true, false],
          ['true', false],
          ['false', 'true'],
          [false, true],
          ['titi', 'toto'],
          [undefined, 'titi'],
          ['titi', null],
          [[1, 2, 3], [1, 3]],
        ];
        testCondition('ifEQ', _dataSet, false);
      });
    });

    describe('ifNE', function () {
      it('should turn the `isConditionTrue` to false if a data is equal to a variable', function () {
        const _dataSet = [
          [0, 0],
          [0, '0'],
          [22.2222, '22.2222'],
          [22.2222, 22.2222],
          ['22.2222', 22.2222],
          [true, true],
          ['true', 'true'],
          [true, 'true'],
          [false, 'false'],
          ['false', 'false'],
          [false, false],
          [false, 'false'],
          ['titi', 'titi'],
          [undefined, undefined],
          [null, null],
          // Objects appear as "[object Object]"
          [{value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}}],
          [{value : 20, name : 'Eric', address : { name : '85 street'} }, {value : 10, name : 'wick', address : { name : '321 street'}}],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]],
        ];
        testCondition('ifNE', _dataSet, false);
      });

      it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
        const _dataSet = [
          [0, 3],
          [0, '1'],
          [true, false],
          [22.2222, '22.2224'],
          ['true', false],
          ['false', 'true'],
          [false, true],
          ['titi', 'toto'],
          [undefined, 'titi'],
          ['titi', null],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 6, 7, 8, 9]],
        ];
        testCondition('ifNE', _dataSet, true);
      });
    });

    describe('ifGT', function () {
      it('should matches values, string.length, array.length or object.length that are greater than a specified value', function () {
        const _dataSet = [
          [50, -29],
          [1290, 768],
          ['1234', '1'],
          [1.1223 , '1.12221'],
          ['32q', '4q2'],
          ['1234Hello', '1'],
          ['1234Hello', 8],
          [10, '8Hello1234'],
          [[1, 2, 3, 4, 5].length, 3],
          ['6', [1, 2, 3, 4, 5].length],
          [['apple', 'banana', 'jackfruit'].length, ['tomato', 'cabbage'].length],
          [Object.keys({id : 2, name : 'John', lastname : 'Wick', city : 'Paris'}).length, Object.keys({id : 3, name : 'John'}).length],
        ];
        testCondition('ifGT', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT greater than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [0, 0],
          [-2891, '33Hello'],
          [1.1221 , '1.12221'],
          ['1' , '1234'],
          ['123dsf', '103123'],
          ['13dsf21354t43534534543', '103123093fcce3'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Hello1234', 10],
          ['Hello1234', 9],
          [2, 'Hello1234'],
          [9, 'Hello1234'],
          [['apple', 'banana'], ['tomato']],
          [['apple', 'banana'].length, ['tomato', 'cabbage', 'jackfruit', 'berry']],
          [{id : 2, name : 'John'}, {id : 3, name : 'John',  lastname : 'Wick', city : 'Paris'}],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [{id : 2, name : 'John'}, {id : 3, name : 'Wick'}]
        ];
        testCondition('ifGT', _dataSet, false);
      });
    });
    describe('ifGTE', function () {
      it('Matches values, string.length, array.length or object.length that are greater than or equal to a specified value', function () {
        let _dataSet = [
          [50, -29],
          [0, 0],
          [1290, 768],
          [1.1222 , '1.1222'],
          [1.1223 , '1.12221'],
          ['1234', '1'],
          ['1234Hello', '1'],
          ['1234Hello'.length, 8],
          ['Hello1234'.length, 9],
          [10, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 3],
          [[1, 2, 3, 4, 5].length, 5],
          [6, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifGTE', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT greater than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          ['1' , '1234'],
          ['1.1221' , '1.1222'],
          [1.1221 , '1.1222'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Hello1234', 10],
          [2, '1234Hello'],
          [[1, 2, 3, 4, 5].length, '10'],
          ['3', [1, 2, 3, 4, 5].length],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null]
        ];
        testCondition('ifGTE', _dataSet, false);
      });
    });
    describe('ifLT', function () {
      it ('should matches values, string.length, array.length or object.length that are less than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [1.12, 1.13],
          [1.12, '1.13'],
          ['1' , '1234'],
          ['123dsf', '103123'],
          [-1299283, '-2891feihuwf'],
          ['Hello1234'.length, 10],
          [2, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 20],
          [3, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifLT', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT less than a specified value', function () {
        const _dataSet = [
          [50, -29],
          [0, 0],
          [1290, 768],
          ['1234', '1'],
          [111, '30'],
          ['32qdwq', '4q2'],
          ['256sddwq', -202],
          ['2This is a long string', '1Hello'],
          ['1234Hello', '1'],
          ['Hello1234'.length, 2],
          ['Hello1234'.length, 9],
          [10, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 2],
          [6, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length],
          [['apple', 'banana'], ['tomato', 'cabbage']],
          [{id : 2, name : 'John', lastname : 'Wick', city : 'Paris'}, {id : 3, name : 'John'}],
          [{id : 2, name : 'John'}, {id : 3, name : 'Wick'}],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null],
        ];
        testCondition('ifLT', _dataSet, false);
      });
    });
    describe('ifLTE', function () {
      it('should matches values, string.length, array.length or object.length that are less than or equal to a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [0, 0],
          ['1' , '1234'],
          [22.233 , '22.233'],
          ['54356fewfewf432', '54356HelloThere'],
          ['23fwe', 123],
          ['4Hello', 10],
          ['Hello1234'.length, 9],
          [2, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 10],
          [[1, 2, 3, 4, 5].length, 5],
          [3, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifLTE', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT less than or equal to a specified value', function () {
        const _dataSet = [
          [50, -29],
          [1290, 768],
          ['1234', '1'],
          [22.2331 , '22.233'],
          ['1234ThisIsText', 1],
          ['Hello1234', '1'],
          ['Hello1234', 2],
          [10, 'Hello1234'],
          [[1, 2, 3, 4, 5].length, 2],
          [6, [1, 2, 3, 4, 5].length],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null],
        ];
        testCondition('ifLTE', _dataSet, false);
      });
    });
    describe('ifIN', function () {
      it('Matches any of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'is'],
          ['car is broken', 'car is'],
          [[1, 2, 'toto'], 'toto'],
          [[1, 2, 'toto'], 2],
        ];
        testCondition('ifIN', _dataSet, true);
      });
      it('Matches none of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'are'],
          ['car is broken',  'caris'],
          [[1, 2, 'toto'], 'titi'],
          [[], 3],
          [null, 'titi'],
          ['titi', null],
          [null, null],
          [undefined, null],
          [undefined, 'titi'],
          ['titi', undefined],
          [undefined, undefined],
          [12, 'titi'],
          [{toto : 2 }, 3],
        ];
        testCondition('ifIN', _dataSet, false);
      });
    });
    describe('ifNIN', function () {
      it('should matches none of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'are'],
          ['car is broken',  'caris'],
          [[1, 2, 'toto'], 'titi'],
          [[], 3],
        ];
        testCondition('ifNIN', _dataSet, true);
      });

      it('should matches any of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'is'],
          ['car is broken', 'car is'],
          [[1, 2, 'toto'], 'toto'],
          [[1, 2, 'toto'], 2],
          [null, 'titi'],
          ['titi', null],
          [null, null],
          [undefined, null],
          [undefined, 'titi'],
          ['titi', undefined],
          [undefined, undefined],
          [12, 'titi'],
          [{toto : 2 }, 3],
        ];
        testCondition('ifNIN', _dataSet, false);
      });
    });

    describe('ifEM', function () {
      it ('should matches empty values, string, arrays or objects', function () {
        const _dataSet = [
          [''],
          [null],
          [undefined],
          [[]],
          [NaN],
          [{}],
        ];
        testCondition('ifEM', _dataSet, true);
      });

      it('should matches not empty values, string, arrays or objects', function () {
        const _dataSet = [
          [0],
          [new Date()],
          ['sdsd'],
          [12.33],
          [true],
          [[12, 23]],
          [{d : 'd'}],
        ];
        testCondition('ifEM', _dataSet, false);
      });
    });
    describe('ifNEM', function () {
      it('should matches not empty values, string, arrays or objects', function () {
        const _dataSet = [
          [0],
          [new Date()],
          ['sdsd'],
          [12.33],
          [true],
          [[12, 23]],
          [{d : 'd'}],
        ];
        testCondition('ifNEM', _dataSet, true);
      });

      it ('should matches empty values, string, arrays or objects', function () {
        const _dataSet = [
          [''],
          [null],
          [undefined],
          [[]],
          [NaN],
          [{}],
        ];
        testCondition('ifNEM', _dataSet, false);
      });
    });

    describe('ifBlocks - showBegin/showEnd/hideBegin/hideEnd + Combined conditions', function () {
      it('should show the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
        callWithContext(conditionFormatter.showBegin, _context);
        helper.assert(_context.isHidden, 0);
        helper.assert(_context.stopPropagation, true);
        helper.assert(_context.isConditionTrue, true);
        callWithContext(conditionFormatter.showEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should not show the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
        callWithContext(conditionFormatter.showBegin, _context);
        helper.assert(_context.isHidden, 1);
        helper.assert(_context.stopPropagation, false);
        helper.assert(_context.isConditionTrue, false);
        callWithContext(conditionFormatter.showEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should hide the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
        callWithContext(conditionFormatter.hideBegin, _context);
        helper.assert(_context.isHidden, 1);
        helper.assert(_context.stopPropagation, true);
        helper.assert(_context.isConditionTrue, true);
        callWithContext(conditionFormatter.hideEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should not hide the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
        callWithContext(conditionFormatter.hideBegin, _context);
        helper.assert(_context.isHidden, 0);
        helper.assert(_context.stopPropagation, false);
        helper.assert(_context.isConditionTrue, false);
        callWithContext(conditionFormatter.hideEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
    });

    describe('Combined conditions', function () {
      describe('AND', function () {
        it('should be true | ifNE / ifEQ / ifGTE / ifGT / ifLT / ifLTE / ifIN / ifNIN / ifEM / ifNEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEQ, _context, 'dragon', 'dragon');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGT, _context, 20, 1);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -100, -100);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, -1000, 30);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 13987, 13987);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'grapes');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, null);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNEM, _context, new Date());
          callWithContext(conditionFormatter.and, _context);
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
        });
        it('should be false | ifNE / ifNIN', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
        });
        it('should be false | ifEQ / ifEM / ifNEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, []);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, {id : '1'});
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNEM, _context, 'Hey');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
        });
      });
      describe('OR', function () {
        it('should be true | ifNE / ifNIN', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
        });

        it('should be true | ifEQ / ifNEM / ifEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNEM, _context, [1, 2, 3, 4, 5]);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, {});
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNEM, _context, 'Hey');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
        });
      });
      describe('AND/OR/SHOW/ELSE SHOW', function () {
        it('Should SHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGT, _context, 234, 2);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 10, 2);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should NOT SHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGTE, _context, 2, 20);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLT, _context, 10, 2);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, false);
        });
        it('Should ELSESHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGTE, _context, 2, 20);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLT, _context, 10, 2);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(_context.stopPropagation, false);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + and', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifIN, _context, [2, 30, 'apple', -1], 'apple');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, -199, 21);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + multiple and', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'Hello');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 200, 200);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, 0, 1);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + multiple or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'hey');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 22333333, 2100);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, null);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -1, 0);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should elseShow + multiple or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'hey');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 22222222, 2100);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, 'no empty');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -1, 0);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should show + AND + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLTE, _context, conditionFormatter.len(['Banana', 'Apple', 'Bread', 'Blue Cheese']), 1997);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGT, _context, conditionFormatter.len('This Is a long string with numbers 12345'), 10);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'Pineapple'), 'Pineapple');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });

        it('Should elseShow + AND + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLTE, _context, conditionFormatter.len(['Banana', 'Apple', 'Bread', 'Blue Cheese']), 10);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGTE, _context, conditionFormatter.len('This Is a long string with numbers 12345'), 41);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'Apple'), 'Apple');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });

        it('Should show + OR + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLT, _context, conditionFormatter.len(['car', 'train', 'plane']), 2);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, conditionFormatter.len('Hello12345'), 10);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'Pineapple'), 'Pineapple');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
      });
    });
  });

  describe('LEN', function () {
    it('should return the string length or array length', function () {
      helper.assert(conditionFormatter.len('This is a string'), 16);
      helper.assert(conditionFormatter.len(''), 0);
      helper.assert(conditionFormatter.len('樂而不淫 建章曰'), 8);
      helper.assert(conditionFormatter.len('This is a longer string lenght'), 30);
      helper.assert(conditionFormatter.len([0, 1, 2, 3]), 4);
      helper.assert(conditionFormatter.len([1, 2, 'This is a string', 3, 9, 10]), 6);
      helper.assert(conditionFormatter.len([]), 0);
      helper.assert(conditionFormatter.len({name : 'John'}), 0);
      helper.assert(conditionFormatter.len(undefined), 0);
      helper.assert(conditionFormatter.len(null), 0);
      helper.assert(conditionFormatter.len(-1), 0);
    });
  });

  describe('print', function () {
    it('should print the message', function () {
      var _context = {};
      helper.assert(callWithContext(stringFormatter.print, _context, null, 'msg'), 'msg');
    });
  });

  describe('convEnum', function () {
    it('should convert enums to human readable values', function () {
      var _context = {
        enum : {
          DAY          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ORDER_STATUS : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 0, 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'DAY'), 'wednesday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'ORDER_STATUS'), 'received');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, '1', 'ORDER_STATUS'), 'sent');
    });
    it('should accept objects for enums', function () {
      var _context = {
        enum : {
          DAY : {
            mon : 'monday',
            tue : 'tuesday',
            wed : 'wednesday',
            thu : 'thursday',
            fri : 'friday'
          }
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'mon', 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'wed', 'DAY'), 'wednesday');
    });
    it('should return value if enum translation is not possible', function () {
      var _context = {
        enum : {
          DAY          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ORDER_STATUS : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 3, 'UNKNOWN_TYPE'), 3);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, null, 'UNKNOWN_TYPE'), null);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, undefined, 'UNKNOWN_TYPE'), undefined);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, [1, 2], 'UNKNOWN_TYPE'), [1, 2]);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, {data : 3}, 'UNKNOWN_TYPE'), {data : 3});
    });
    it('should not crash if enum is not defined. It should return the value', function () {
      var _context = {};
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
    });
  });

  describe('lowerCase', function () {
    it('should convert a string to lower case', function () {
      helper.assert(stringFormatter.lowerCase('AZERTY'), 'azerty');
      helper.assert(stringFormatter.lowerCase('qskhREqsLLK;d:sdRTH234'), 'qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.lowerCase(null), null);
      helper.assert(stringFormatter.lowerCase(undefined), undefined);
      helper.assert(stringFormatter.lowerCase(120), 120);
    });
  });

  describe('upperCase', function () {
    it('should convert a string to upper case', function () {
      helper.assert(stringFormatter.upperCase('azerty'), 'AZERTY');
      helper.assert(stringFormatter.upperCase('qskhreqsllk;d:sdrth234'), 'QSKHREQSLLK;D:SDRTH234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.upperCase(null), null);
      helper.assert(stringFormatter.upperCase(undefined), undefined);
      helper.assert(stringFormatter.upperCase(120), 120);
    });
  });

  describe('ucFirst', function () {
    it('should upper case the first letter', function () {
      helper.assert(stringFormatter.ucFirst('azerty ss'), 'Azerty ss');
      helper.assert(stringFormatter.ucFirst(' azerty'), ' azerty');
      helper.assert(stringFormatter.ucFirst('qskhreqsllk;d:sdrth234'), 'Qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.ucFirst(null), null);
      helper.assert(stringFormatter.ucFirst(undefined), undefined);
      helper.assert(stringFormatter.ucFirst(120), 120);
      helper.assert(stringFormatter.ucFirst([]), []);
    });
  });

  describe('ucWords', function () {
    it('should upper case the first letter of each word', function () {
      helper.assert(stringFormatter.ucWords('azerty ss zzzeZ'), 'Azerty Ss ZzzeZ');
      helper.assert(stringFormatter.ucWords(' azerty'), ' Azerty');
      helper.assert(stringFormatter.ucWords('qskhreqsllk;  D:sdrt :h234'), 'Qskhreqsllk;  D:sdrt :h234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.ucWords(null), null);
      helper.assert(stringFormatter.ucWords(undefined), undefined);
      helper.assert(stringFormatter.ucWords(120), 120);
      helper.assert(stringFormatter.ucWords([]), []);
    });
  });

  describe('unaccent', function () {
    it('should remove accent from string', function () {
      helper.assert(stringFormatter.unaccent('crème brulée'), 'creme brulee');
      helper.assert(stringFormatter.unaccent('CRÈME BRULÉE'), 'CREME BRULEE');
      helper.assert(stringFormatter.unaccent('être'), 'etre');
      helper.assert(stringFormatter.unaccent('éùïêèà'), 'euieea');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.unaccent(null), null);
      helper.assert(stringFormatter.unaccent(undefined), undefined);
      helper.assert(stringFormatter.unaccent(120), 120);
    });
  });

  describe('substr', function () {
    it('should keep only the selection', function () {
      helper.assert(stringFormatter.substr('coucou', 0, 3), 'cou');
      helper.assert(stringFormatter.substr('coucou', 0, 0), '');
      helper.assert(stringFormatter.substr('coucou', 3, 4), 'c');
    });
    it('should not crash if data is null or undefined', function () {
      helper.assert(stringFormatter.substr(null, 0, 3), null);
      helper.assert(stringFormatter.substr(undefined, 0, 3), undefined);
    });
  });

  describe('padl', function () {
    it('should be up to the target length with padding string to complete', () => {
      helper.assert(stringFormatter.padl('coucou', 6), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padl('coucou', 7), ' coucou', 'one more length, adding one space before');
      helper.assert(stringFormatter.padl('coucou', 7, 'x'), 'xcoucou', 'one more length, adding one padding string "x" before');
      helper.assert(stringFormatter.padl('coucou', '10', 'x'), 'xxxxcoucou', 'one more length, adding padding string "x" before');
      helper.assert(stringFormatter.padl('coucou', 6, 'x'), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padl('coucou', 3), 'coucou', 'lower target length, no change');
      helper.assert(stringFormatter.padl('coucou', 3, 'x'), 'coucou', 'lower target length with padding string defined, no change');
    });
    it('should accept numbers, strings for all parameters and accept 0 for the padding string', () => {
      helper.assert(stringFormatter.padl(  1223,  8 ,  0 ), '00001223');
      helper.assert(stringFormatter.padl(  1223,  8 , '0'), '00001223');
      helper.assert(stringFormatter.padl(  1223, '8', '0'), '00001223');
      helper.assert(stringFormatter.padl('1223', '8', '0'), '00001223');
      helper.assert(stringFormatter.padl('1223', '8',  0 ), '00001223');
      helper.assert(stringFormatter.padl('1223',  8 , '0'), '00001223');
    });
    it('should not crash if data is null or undefined', () => {
      helper.assert(stringFormatter.padl(null, 0), null, 'if data is null, not a string so return null 1');
      helper.assert(stringFormatter.padl(null, 4), null, 'if data is null, not a string so return null 2');
      helper.assert(stringFormatter.padl(null, 5), null, 'if data is null, not a string so return null 3');
      helper.assert(stringFormatter.padl(null, 0, 'x'), null, 'if data is null, not a string so return null 4');
      helper.assert(stringFormatter.padl(null, 5, 'x'), null, 'if data is null, not a string so return null 5');
      helper.assert(stringFormatter.padl(undefined, 0), undefined, 'if data is undefined, not a string so return undefined 1');
      helper.assert(stringFormatter.padl(undefined, 9), undefined, 'if data is undefined, not a string so return undefined 2');
      helper.assert(stringFormatter.padl(undefined, 10), undefined, 'if data is undefined, not a string so return undefined 3');
      helper.assert(stringFormatter.padl(undefined, 9, 'x'), undefined, 'if data is undefined, not a string so return undefined 4');
      helper.assert(stringFormatter.padl(undefined, 10, 'x'), undefined, 'if data is undefined, not a string so return undefined 5');
    });
    it('should not crash if data is object', () => {
      helper.assert(stringFormatter.padl({id : 2}, 5), {id : 2}, 'if data is object, should return it with no change');
    });
    it('should not crash if data is array', () => {
      helper.assert(stringFormatter.padl([{id : 1}], 5), [{id : 1}], 'if data is array, should return it with no change');
    });
  });
  describe('padr', function () {
    it('should be up to the target length with padding string to complete', () => {
      helper.assert(stringFormatter.padr('coucou', 6), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padr('coucou', 7), 'coucou ', 'one more length, adding one space before');
      helper.assert(stringFormatter.padr('coucou', 7, 'x'), 'coucoux', 'one more length, adding one padding string "x" before');
      helper.assert(stringFormatter.padr('coucou', 10, 'x'), 'coucouxxxx', 'one more length, adding padding string "x" before');
      helper.assert(stringFormatter.padr('coucou', 6, 'x'), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padr('coucou', 3), 'coucou', 'lower target length, no change');
      helper.assert(stringFormatter.padr('coucou', 3, 'x'), 'coucou', 'lower target length with padding string defined, no change');
    });
    it('should accept numbers, strings for all parameters and accept 0 for the padding string', () => {
      helper.assert(stringFormatter.padr(  1223,  8 ,  0 ), '12230000');
      helper.assert(stringFormatter.padr(  1223,  8 , '0'), '12230000');
      helper.assert(stringFormatter.padr(  1223, '8', '0'), '12230000');
      helper.assert(stringFormatter.padr('1223', '8', '0'), '12230000');
      helper.assert(stringFormatter.padr('1223', '8',  0 ), '12230000');
      helper.assert(stringFormatter.padr('1223',  8 , '0'), '12230000');
    });
    it('should not crash if data is null or undefined', () => {
      helper.assert(stringFormatter.padr(null, 0), null, 'if data is null, not a string so return null 1');
      helper.assert(stringFormatter.padr(null, 4), null, 'if data is null, not a string so return null 2');
      helper.assert(stringFormatter.padr(null, 5), null, 'if data is null, not a string so return null 3');
      helper.assert(stringFormatter.padr(null, 0, 'x'), null, 'if data is null, not a string so return null 4');
      helper.assert(stringFormatter.padr(null, 5, 'x'), null, 'if data is null, not a string so return null 5');
      helper.assert(stringFormatter.padr(undefined, 0), undefined, 'if data is undefined, not a string so return undefined 1');
      helper.assert(stringFormatter.padr(undefined, 9), undefined, 'if data is undefined, not a string so return undefined 2');
      helper.assert(stringFormatter.padr(undefined, 10), undefined, 'if data is undefined, not a string so return undefined 3');
      helper.assert(stringFormatter.padr(undefined, 9, 'x'), undefined, 'if data is undefined, not a string so return undefined 4');
      helper.assert(stringFormatter.padr(undefined, 10, 'x'), undefined, 'if data is undefined, not a string so return undefined 5');
    });
    it('should not crash if data is object', () => {
      helper.assert(stringFormatter.padr({id : 2}, 5), {id : 2}, 'if data is object, should return it with no change');
    });
    it('should not crash if data is array', () => {
      helper.assert(stringFormatter.padr([{id : 1}], 5), [{id : 1}], 'if data is array, should return it with no change');
    });
  });

  describe('arrayMap', function () {
    it('should flatten the each object of the array (only the first level, ignoring sub arrays, sub objects,...)', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}, arr : [12, 23]},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}, arr : [12, 23]}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas), '2:car:toy, 3:plane:concept');
    });
    it('should accept array of strings', function () {
      var _datas = ['car', 'plane', 'toy', 42];
      helper.assert(arrayFormatter.arrayMap(_datas), 'car, plane, toy, 42');
    });
    it('should change object and attribute separators', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; '), '2 ; car ; toy | 3 ; plane ; concept');
      helper.assert(arrayFormatter.arrayMap(_datas, '', ''), '2cartoy3planeconcept');
    });
    it('should print only given attribute', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; ', 'name'), 'car | plane');
    });
    it('should print a list of given attribute in the same order', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ', ', ':', 'name', 'id', 'type'), 'car:2:toy, plane:3:concept');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(arrayFormatter.arrayMap(null), null);
      helper.assert(arrayFormatter.arrayMap(undefined), undefined);
      helper.assert(arrayFormatter.arrayMap(120), 120);
      helper.assert(arrayFormatter.arrayMap([]), '');
      helper.assert(arrayFormatter.arrayMap({}), {});
    });
  });

  describe('arrayJoin', function () {
    it('should flatten the array of string', function () {
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas), '1, 2, hey!');
    });
    it('should change separator', function () {
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas, ''), '12hey!');
      helper.assert(arrayFormatter.arrayJoin(_datas, ' | '), '1 | 2 | hey!');
      helper.assert(arrayFormatter.arrayJoin(_datas, '\\n'), '1\n2\nhey!');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(arrayFormatter.arrayMap(null), null);
      helper.assert(arrayFormatter.arrayMap(undefined), undefined);
      helper.assert(arrayFormatter.arrayMap(120), 120);
      helper.assert(arrayFormatter.arrayMap([]), '');
      helper.assert(arrayFormatter.arrayMap({}), {});
    });
  });

  describe('convCurr', function () {
    it('should return the same value if the currency source is the same as the currency target', function () {
      var _this = {currency : { source : 'EUR', target : 'EUR', rates : {EUR : 1, USD : 1.14, GBP : 0.89} }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1), 10.1);
    });

    it('should not crash if value or rate is null or undefined', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, null), 0);

      _this = {currency : { source : null, target : null, rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10), 10);
    });

    it('should convert currency', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1), 11.514);

      _this = {currency : { source : 'USD', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 11.514), 10.1);

      _this = {currency : { source : 'GBP', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4), 125.5);

      _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 125.5), 143.07);

      _this = {currency : { source : 'GBP', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4), 143.07);
    });

    it('should accept to change target in the formatter', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1, 'GBP'), 8.08);
    });

    it('should accept to change source in the formatter', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4, 'EUR', 'GBP'), 125.5);
    });
  });

  describe('formatN', function () {
    it('should format number according to the locale a percentage', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, 1), '10 000,1');
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, '1'), '10 000,1');
      helper.assert(numberFormatter.formatN.call(_this, 10000.1), '10 000,100');
      helper.assert(numberFormatter.formatN.call(_this, null, 1), null);
      helper.assert(numberFormatter.formatN.call(_this, undefined, 1), undefined);
      helper.assert(numberFormatter.formatN.call(_this, 10000.30202, 5), '10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, -10000.30202, 5), '-10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, -10000.30202, '5'), '-10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, '-10000.30202', '5'), '-10 000,30202');

      _this = {lang : 'en-gb'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, 1), '10,000.1');
      helper.assert(numberFormatter.formatN.call(_this, '10000000.1', 1), '10,000,000.1');
    });

    it.skip('should keep maximal precision if precision is not defined', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.12345566789), '10 000,12345566789');
    });

    it('should round number', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 222.1512, 2), '222,15');
      helper.assert(numberFormatter.formatN.call(_this, 222.1552, 2), '222,16');

      helper.assert(numberFormatter.formatN.call(_this, 1.005, 2), '1,01');
      helper.assert(numberFormatter.formatN.call(_this, 1.005, 3), '1,005');

      helper.assert(numberFormatter.formatN.call(_this, -1.005, 3), '-1,005');
      helper.assert(numberFormatter.formatN.call(_this, -1.006, 2), '-1,01');
    });
  });

  describe('round', function () {

    it('should round number', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.round.call(_this, 222.1512, 2), 222.15);
      helper.assert(numberFormatter.round.call(_this, 222.1552, 2), 222.16);

      helper.assert(numberFormatter.round.call(_this, 1.005, 2), 1.01);
      helper.assert(numberFormatter.round.call(_this, 1.005, 3), 1.005);

      helper.assert(numberFormatter.round.call(_this, -1.005, 3), -1.005);
      helper.assert(numberFormatter.round.call(_this, -1.006, 2), -1.01);
      helper.assert(numberFormatter.round.call(_this, -1.005, 2), -1);
    });
  });

  describe('formatC', function () {
    it('should format number according to the locale, currencyTarget, and set automatically the precision', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '$10,000.10');

      _this.currency.target = 'EUR';
      helper.assert(numberFormatter.formatC.call(_this, 10000.155), '€10,000.16');

      _this.lang = 'fr-fr';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '10 000,10 €');
      helper.assert(numberFormatter.formatC.call(_this, -10000.1), '-10 000,10 €');

      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');

      helper.assert(numberFormatter.formatC.call(_this, null, 1), null);
      helper.assert(numberFormatter.formatC.call(_this, undefined, 1), undefined);
    });

    it('should change currency output format', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'dollars');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'M'), 'dollar');
      helper.assert(numberFormatter.formatC.call(_this, 10.15678, 5), '$10.15678');
      helper.assert(numberFormatter.formatC.call(_this, 10.15678, 'LL'), '10.16 dollars');
      _this.currency.target = 'EUR';
      _this.lang = 'fr-fr';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'L'), '10 000,10 €');
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'LL'), '10 000,10 euros');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'LL'), '1,00 euro');
    });

    it('should convert currency automatically if target != source using rates', function () {
      var _rates = {EUR : 1, USD : 2, GBP : 10};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '$20,000.20');
      _this.currency.target = 'GBP';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '£100,001.00');
    });

    it('should convert to crypto-currencies/USD by using rates (USD to BTC/ETH AND BTC/ETH to USD)', function () {
      var _rates = {USD : 1, BTC : 0.000102618, ETH : 0.003695354, XMR : 0.01218769 };
      /**  USD to BTC */
      var _this = {lang : 'en-us', currency : { source : 'USD', target : 'BTC', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 1255), '₿0.12878559');
      /**  USD to ETH */
      _this.currency.target = 'ETH';
      helper.assert(numberFormatter.formatC.call(_this, 32.41), 'Ξ0.119766423');
      /** USD to XMR */
      _this.currency.target = 'XMR';
      helper.assert(numberFormatter.formatC.call(_this, 383991.32), 'XMR4,679.96717085');
      /**  BTC to USD */
      _rates = {USD : 9736.03, BTC : 1};
      _this = {lang : 'en-us', currency : { source : 'BTC', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 2.3155321), '$22,544.09');
      /** ETH to USD */
      _this.currency.source = 'ETH';
      _this.currency.rates = { USD : 247.37, ETH : 1 };
      helper.assert(numberFormatter.formatC.call(_this, 0.54212345), '$134.11');
    });

    it('should accept custom format', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'fr-fr', currency : { source : 'EUR', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'M'), 'euro');
    });

    it('should be fast', function () {
      var _rates = {EUR : 1, USD : 2, GBP : 10};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      var _loops = 10000;
      var _res = [];
      var _start = process.hrtime();
      for (var i = 0; i < _loops; i++) {
        _res.push(numberFormatter.formatC.call(_this, 10000.1));
      }
      var _diff = process.hrtime(_start);
      var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
      console.log('\n formatC number speed : ' + _elapsed + ' ms (around 30ms for 10k) \n');
      helper.assert(_elapsed > 50, false, 'formatC is too slow');
    });
  });

  describe('Number operations', function () {
    it('should add number', function () {
      helper.assert(numberFormatter.add('120', '67'), 187);
    });

    it('should substract number', function () {
      helper.assert(numberFormatter.sub('120', '67'), 53);
    });

    it('should multiply number', function () {
      helper.assert(numberFormatter.mul('120', '67'), 8040);
    });

    it('should divide number', function () {
      helper.assert(numberFormatter.div('120', '80'), 1.5);
    });
  });

});

/**
 * Call a formatter, passing `context` object as `this`
 * @param  {Function} func    formatter to call
 * @param  {Object} context   object
 * @return {Mixed}            [description]
 */
function callWithContext (func, context) {
  context.stopPropagation = false; // reset propagation
  var _args = Array.prototype.slice.call(arguments);
  return func.apply(context, _args.slice(2));
}
