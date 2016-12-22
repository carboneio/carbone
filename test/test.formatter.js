var assert = require('assert');
var dateFormatter = require('../formatters/date');
var conditionFormatter = require('../formatters/condition');
var stringFormatter = require('../formatters/string');
var arrayFormatter = require('../formatters/array');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('formatter', function(){
  describe('convDate', function(){
    it('should accept use this.lang to set convert date', function(){
      helper.assert(dateFormatter.convDate.call({lang: 'en'}, '20101201', 'YYYYMMDD', 'L'), '12/01/2010');
      helper.assert(dateFormatter.convert.call({lang: 'fr'}, '20101201', 'YYYYMMDD', 'L'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function(){
      helper.assert(dateFormatter.convDate.call({lang: 'en'}, undefined, 'YYYYMMDD', 'L'), undefined);
      helper.assert(dateFormatter.convert.call({lang: 'fr'}, null, 'YYYYMMDD', 'L'), null);
    });
    it('should convert unix timestamp', function(){
      helper.assert(dateFormatter.convDate.call({lang: 'en'}, 1318781876, 'X', 'LLLL'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.convert.call({lang: 'fr'}, 1318781876, 'X', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
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
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty', true), 'msgIfEmpty');
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

  describe('ifEquals', function(){
    it('should show a message if data is equal to a variable', function(){
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 0, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '0', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, true, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, false, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
    });
    it('should propagate to next formatter if continueOnSuccess is true', function(){
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
    it('should return data if data is not equal to a variable', function(){
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 3, 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '1', 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, false, 'msgIfTrue'), true);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, true, 'msgIfTrue'), false);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'toto', 'msgIfTrue'), 'titi');
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('ifContains', function(){
    it('should show a message if data contains a variable', function(){
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
    it('should propagate to next formatter if continueOnSuccess is true', function(){
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
    it('should return data if data does not contain the variable', function(){
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
    it('should not crash if data is not a String or an Array. It should transfer to next formatter', function(){
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, null, 'is', 'msgIfTrue'), null);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, undefined, 'is', 'msgIfTrue'), undefined);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 12, 'titi', 'msgIfTrue'), 12);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, {'toto':2 }, 3, 'msgIfTrue'),  {'toto':2 });
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('print', function(){
    it('should print the message', function(){
      var _context = {};
      helper.assert(callWithContext(stringFormatter.print, _context, null, 'msg'), 'msg');
    });
  });

  describe('convEnum', function(){
    it('should convert enums to human readable values', function(){
      var _context = {
        enum : {
          'DAY'          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          'ORDER_STATUS' : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 0, 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'DAY'), 'wednesday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'ORDER_STATUS'), 'received');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, '1', 'ORDER_STATUS'), 'sent');
    });
    it('should accept objects for enums', function(){
      var _context = {
        enum : {
          'DAY' : {
            'mon' : 'monday',
            'tue' : 'tuesday',
            'wed' : 'wednesday',
            'thu' : 'thursday',
            'fri' : 'friday'
          }
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'mon', 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'wed', 'DAY'), 'wednesday');
    });
    it('should return value if enum translation is not possible', function(){
      var _context = {
        enum : {
          'DAY'          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          'ORDER_STATUS' : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 3, 'UNKNOWN_TYPE'), 3);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, null, 'UNKNOWN_TYPE'), null);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, undefined, 'UNKNOWN_TYPE'), undefined);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, [1, 2], 'UNKNOWN_TYPE'), [1, 2]);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, {'data': 3}, 'UNKNOWN_TYPE'), {'data': 3});
    });
    it('should not crash if enum is not defined. It should return the value', function(){
      var _context = {};
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
    });
  });

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
  context.stopPropagation = false; //reset propagation
  var _args = Array.prototype.slice.call(arguments);
  return func.apply(context, _args.slice(2));
}
