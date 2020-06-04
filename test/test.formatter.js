var dateFormatter = require('../formatters/date');
var conditionFormatter = require('../formatters/condition');
var stringFormatter = require('../formatters/string');
var arrayFormatter = require('../formatters/array');
var numberFormatter = require('../formatters/number');
var helper = require('../lib/helper');

describe('formatter', function () {
  describe('convDate', function () {
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en'}, '20101201', 'YYYYMMDD', 'L'), '12/01/2010');
      helper.assert(dateFormatter.convDate.call({lang : 'fr'}, '20101201', 'YYYYMMDD', 'L'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en'}, undefined, 'YYYYMMDD', 'L'), undefined);
      helper.assert(dateFormatter.convDate.call({lang : 'fr'}, null, 'YYYYMMDD', 'L'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en'}, 1318781876, 'X', 'LLLL'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.convDate.call({lang : 'fr'}, 1318781876, 'X', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
    });
  });
  describe('formatD', function () {
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, '20101201', 'L', 'YYYYMMDD'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr'}, '20101201', 'L', 'YYYYMMDD'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, undefined, 'L', 'YYYYMMDD'), undefined);
      helper.assert(dateFormatter.formatD.call({lang : 'fr'}, null, 'L',  'YYYYMMDD'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, 1318781876, 'LLLL', 'X'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'fr'}, 1318781876, 'LLLL', 'X'), 'dimanche 16 octobre 2011 18:17');
    });
    it('should consider input format is ISO 8601 by default if not provided', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr'}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, '2017-05-10T15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, '2017-05-10 15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en'}, '1997-12-17 07:37:16-08', 'LLLL'), 'Wednesday, December 17, 1997 4:37 PM');
    });
    it('should accepts real locales', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en-GB'}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en-gb'}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en-US'}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr-CA'}, '20101201', 'L'), '2010-12-01');
      helper.assert(dateFormatter.formatD.call({lang : 'fr-FR'}, '20101201', 'L'), '01/12/2010');
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

  describe.only('ifEQ', function () {
    it('should turn the `isConditionTrue` to True if a data is equal to a variable', function () {
      var _context = {};
      callWithContext(conditionFormatter.ifEQ, _context, 0, 0);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 0, '0');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, true, true);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'true', 'true');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, true, 'true');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, false, 'false');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'false', 'false');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, false, false);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, false, 'false');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'titi', 'titi');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, undefined, undefined);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, null, null);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      // object identiques, it is comparing "[object Object]" === "[object Object]"
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifEQ, _context, {value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}});
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      // different objects, it is comparing "[object Object]" === "[object Object]"
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifEQ, _context, {value : 20, name : 'Eric', address : { name : '85 street'} }, {value : 10, name : 'wick', address : { name : '321 street'}});
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      // Tableau identique
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifEQ, _context, [1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
    });

    it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
      var _context = {};
      callWithContext(conditionFormatter.ifEQ, _context, 0, 3);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 0, '1');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, true, false);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'true', false);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'false', 'true');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, false, true);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, 'titi', 'toto');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifEQ, _context, undefined, 'titi');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifEQ, _context, 'titi', null);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifEQ, _context, [1, 2, 3], [1, 3]);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe.only('ifNE', function () {
    it('should turn the `isConditionTrue` to false if a data is equal to a variable', function () {
      var _context = {};
      callWithContext(conditionFormatter.ifNE, _context, 0, 0);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 0, '0');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, true, true);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'true', 'true');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, true, 'true');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, false, 'false');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'false', 'false');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, false, false);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, false, 'false');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'titi', 'titi');
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, undefined, undefined);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, null, null);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      // object identiques
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifNE, _context, {value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}});
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      // object différents
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifNE, _context, {value : 20, name : 'Eric', address : { name : '85 street'} }, {value : 10, name : 'wick', address : { name : '321 street'}});
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
      // Tableau identique
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifNE, _context, [1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]);
      helper.assert(_context.isConditionTrue, false);
      helper.assert(_context.stopPropagation, false);
    });

    it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
      var _context = {};
      callWithContext(conditionFormatter.ifNE, _context, 0, 3);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 0, '1');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, true, false);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'true', false);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'false', 'true');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, false, true);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'titi', 'toto');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, undefined, 'titi');
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      callWithContext(conditionFormatter.ifNE, _context, 'titi', null);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
      // Tableau différents
      _context.isConditionTrue = false;
      callWithContext(conditionFormatter.ifNE, _context, [1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 6, 7, 8, 9]);
      helper.assert(_context.isConditionTrue, true);
      helper.assert(_context.stopPropagation, false);
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
