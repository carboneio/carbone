var assert = require('assert');
var dateFormatter = require('../formatters/date');
var conditionFormatter = require('../formatters/condition');
var stringFormatter = require('../formatters/string');
var arrayFormatter = require('../formatters/array');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('formatter', function(){
  describe('convert', function(){
    it.skip('should accept use this.lang to set convert date', function(){
      helper.assert(dateFormatter.convert.call({lang: 'en'}, '20101201', 'YYYYMMDD', 'L'), '12/01/2010');
      //helper.assert(dateFormatter.convert.call({lang: 'fr'}, '20101201', 'YYYYMMDD', 'L'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function(){
      helper.assert(dateFormatter.convert.call({lang: 'en'}, undefined, 'YYYYMMDD', 'L'), undefined);
      //helper.assert(dateFormatter.convert.call({lang: 'fr'}, null, 'YYYYMMDD', 'L'), null);
    });
  });
  describe('ifEmpty', function(){
    it('should show a message if data is empty. It should stop propagation to next formatter', function(){
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
    });

    it('should return data if the message is not empty... and keep on propagation to next formatter', function(){
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
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {d:'d'}     , 'msgIfEmpty'), {d:'d'});
      helper.assert(_context.stopPropagation, false);
    });
  });

  //describe('ifEqual', function(){
  //  it('should show a message if data is equal to a variable', function(){
  //    var _context = {};
  //    helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0 , 0, 'msgIfTrue'), 'msgIfTrue');
  //    helper.assert(_context.stopPropagation, true);
  //  });
  //});

  describe('lowerCase', function(){
    it('should convert a string to lower case', function(){
      helper.assert(stringFormatter.lowerCase('AZERTY'), 'azerty');
      helper.assert(stringFormatter.lowerCase('qskhREqsLLK;d:sdRTH234'), 'qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(stringFormatter.lowerCase(null), null);
      helper.assert(stringFormatter.lowerCase(undefined), undefined);
      helper.assert(stringFormatter.lowerCase(120), 120);
    });
  });

  describe('upperCase', function(){
    it('should convert a string to upper case', function(){
      helper.assert(stringFormatter.upperCase('azerty'), 'AZERTY');
      helper.assert(stringFormatter.upperCase('qskhreqsllk;d:sdrth234'), 'QSKHREQSLLK;D:SDRTH234');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(stringFormatter.upperCase(null), null);
      helper.assert(stringFormatter.upperCase(undefined), undefined);
      helper.assert(stringFormatter.upperCase(120), 120);
    });
  });

  describe('ucFirst', function(){
    it('should upper case the first letter', function(){
      helper.assert(stringFormatter.ucFirst('azerty ss'), 'Azerty ss');
      helper.assert(stringFormatter.ucFirst(' azerty'), ' azerty');
      helper.assert(stringFormatter.ucFirst('qskhreqsllk;d:sdrth234'), 'Qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(stringFormatter.ucFirst(null), null);
      helper.assert(stringFormatter.ucFirst(undefined), undefined);
      helper.assert(stringFormatter.ucFirst(120), 120);
      helper.assert(stringFormatter.ucFirst([]), []);
    });
  });

  describe('ucWords', function(){
    it('should upper case the first letter of each word', function(){
      helper.assert(stringFormatter.ucWords('azerty ss zzzeZ'), 'Azerty Ss ZzzeZ');
      helper.assert(stringFormatter.ucWords(' azerty'), ' Azerty');
      helper.assert(stringFormatter.ucWords('qskhreqsllk;  D:sdrt :h234'), 'Qskhreqsllk;  D:sdrt :h234');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(stringFormatter.ucWords(null), null);
      helper.assert(stringFormatter.ucWords(undefined), undefined);
      helper.assert(stringFormatter.ucWords(120), 120);
      helper.assert(stringFormatter.ucWords([]), []);
    });
  });

  describe('arrayMap', function(){
    it('should flatten the each object of the array (only the first level, ignoring sub arrays, sub objects,...)', function(){
      var _datas = [
        {id: 2, name : 'car'  , type : 'toy'    , sub : {id : 3}, arr:[12, 23]},
        {id: 3, name : 'plane', type : 'concept', sub : {id : 3}, arr:[12, 23]}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas), '2:car:toy, 3:plane:concept');
    });
    it('should change object and attribute separators', function(){
      var _datas = [
        {id: 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id: 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; '), '2 ; car ; toy | 3 ; plane ; concept');
      helper.assert(arrayFormatter.arrayMap(_datas, '', ''), '2cartoy3planeconcept');
    });
    it('should print only given attribute', function(){
      var _datas = [
        {id: 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id: 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; ', 'name'), 'car | plane');
    });
    it('should print a list of given attribute in the same order', function(){
      var _datas = [
        {id: 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id: 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ', ', ':', 'name', 'id', 'type'), 'car:2:toy, plane:3:concept');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(arrayFormatter.arrayMap(null), null);
      helper.assert(arrayFormatter.arrayMap(undefined), undefined);
      helper.assert(arrayFormatter.arrayMap(120), 120);
      helper.assert(arrayFormatter.arrayMap([]), '');
      helper.assert(arrayFormatter.arrayMap({}), {});
    });
  });

  describe('arrayJoin', function(){
    it('should flatten the array of string', function(){
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas), '1, 2, hey!');
    });
    it('should change separator', function(){
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas, ''), '12hey!');
      helper.assert(arrayFormatter.arrayJoin(_datas, ' | '), '1 | 2 | hey!');
    });
    it('should not crash if datas is null or undefined', function(){
      helper.assert(arrayFormatter.arrayMap(null), null);
      helper.assert(arrayFormatter.arrayMap(undefined), undefined);
      helper.assert(arrayFormatter.arrayMap(120), 120);
      helper.assert(arrayFormatter.arrayMap([]), '');
      helper.assert(arrayFormatter.arrayMap({}), {});
    });
  });
});

/**
 * Call a formatter, passing `context` object as `this` 
 * @param  {Function} func    formatter to call
 * @param  {Object} context   object 
 * @return {Mixed}            [description]
 */
function callWithContext(func, context){
  context.stopPropagation = null; //reset propagation
  var _args = Array.prototype.slice.call(arguments);
  return func.apply(context, _args.slice(2));
}
