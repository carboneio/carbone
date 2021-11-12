var assert = require('assert');
var carbone = require('../lib/index');
var input = require('../lib/input');
var builder = require('../lib/builder');
var helper = require('../lib/helper');

describe('builder', function () {

  describe('getFormatterString' , function () {
    var _testedFormatters = {
      int        : function () {},
      toFixed    : function () {},
      format     : function () {},
      formatter  : function () {},
      formatter1 : function () {},
      formatter2 : function () {},
      print      : function () {},
      convCRLF   : function () {}
    };
    let _safeAccessor = null;
    let _getSafeValue = null;
    beforeEach(function () {
      _safeAccessor = builder.generateSafeJSValueAccessor('dictionary');
      _getSafeValue = _safeAccessor.get;
    });
    it('should return an empty string if there is no formatter', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_str', 'context', []);
      helper.assert(_actual, '');
    });
    it('should return a simple call of a function for a formatter without arguments', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_str', 'context', [ 'int' ], _testedFormatters);
      helper.assert(_actual, '_str = formatters.int.call(context, _str);\n');
      helper.assert(_safeAccessor.getDictionary(), []);
    });
    it('should return a simple call of a function for a formatter without arguments but called with parenthesis', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_otherString', '_meta', [ 'int()' ], _testedFormatters);
      helper.assert(_actual, '_otherString = formatters.int.call(_meta, _otherString);\n');
      helper.assert(_safeAccessor.getDictionary(), []);
    });
    it('should return a call of a function for a formatter with one argument', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'toFixed(2)' ], _testedFormatters);
      helper.assert(_actual,  '_str = formatters.toFixed.call(_options, _str, dictionary[0]);\n');
      helper.assert(_safeAccessor.getDictionary(), ['2']);
    });
    it('should return a call of a function for a formatter with one argument which is a string', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'format(YYYYMMDD)' ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ['YYYYMMDD']);
    });
    it('should keep whitespaces if it is a string', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ "format('YYYY MM DD')" ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ['YYYY MM DD']);
    });
    it('should keep anti-slash quotes', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ "format('YYYY \\' MM DD')" ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ["YYYY \\' MM DD"]);
    });
    it('should keep parenthesis in the string', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ "format('(YYYY) ' (MM) DD')" ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ["(YYYY) ' (MM) DD"]);
    });
    it('should return a call of a function for a formatter with two arguments', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'formatter(2, 3)' ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ['2', '3']);
    });
    it('should remove extra whitespaces between arguments', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'formatter(   2   ,   3   )' ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ['2', '3']);
    });
    it('should return two calls of functions for two chained formatters', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'int', 'toFixed(2)' ], _testedFormatters);
      // helper.assert(_actual, '_str = formatters.toFixed.call(_options, formatters.int(d.number), \'2\');');
      helper.assert(_actual, '_str = formatters.int.call(_options, _str);\n'
                           +'if(_options.stopPropagation === false){\n'
                           +  '_str = formatters.toFixed.call(_options, _str, dictionary[0]);\n'
                           +'}');
      helper.assert(_safeAccessor.getDictionary(), ['2']);
    });
    it('should return two calls of functions for two chained formatters each with arguments', function () {
      builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'formatter1(4, 5)', 'formatter2(2, 3)' ], _testedFormatters);
      helper.assert(_safeAccessor.getDictionary(), ['4', '5', '2', '3']);
    });
    it('should return three calls of functions for three chained formatters each with arguments', function () {
      var _actual = builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'formatter1(4, 5)', 'formatter2(2, 3)', 'print(\'ok\')' ], _testedFormatters);
      assert.equal(_actual, '_str = formatters.formatter1.call(_options, _str, dictionary[0], dictionary[1]);\n'
                           +'if(_options.stopPropagation === false){\n'
                           +  '_str = formatters.formatter2.call(_options, _str, dictionary[2], dictionary[3]);\n'
                           +  'if(_options.stopPropagation === false){\n'
                           +    '_str = formatters.print.call(_options, _str, dictionary[4]);\n'
                           +  '}'
                           +'}');
      helper.assert(_safeAccessor.getDictionary(), ['4', '5', '2', '3', 'ok']);
    });
    it('should return formatter code according to the filter "canInjectXML"', function () {
      _testedFormatters.convCRLF.canInjectXML = true;
      var _actual = builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'convCRLF()', 'formatter1(4)' ], _testedFormatters);
      helper.assert(_actual, '_str = formatters.formatter1.call(_options, _str, dictionary[0]);\n');

      _actual = builder.getFormatterString(_getSafeValue, '_str', '_options', [ 'convCRLF()', 'formatter1(4)' ], _testedFormatters, true);
      helper.assert(_actual, '_str = formatters.convCRLF.call(_options, _str);\n');
    });
  });

  describe('generateSafeJSValueAccessor', function () {
    it('should update an array, generate JS code to access this value, return its position in the dictionary, and return the dictionary', function () {
      var _safeValue = builder.generateSafeJSValueAccessor('dictionary');
      helper.assert(_safeValue.get('<xml>'  ), 'dictionary[0]');
      helper.assert(_safeValue.getIndex('<xml>'  ), 0);
      // should work even if getIndex is called first
      helper.assert(_safeValue.getIndex('<b></b>'), 1);
      helper.assert(_safeValue.get('<b></b>'), 'dictionary[1]');
      helper.assert(_safeValue.getIndex('<a>'    ), 2);
      helper.assert(_safeValue.getIndex(';\\\''  ), 3);
      // should return the same index if the string was already registred
      helper.assert(_safeValue.getIndex('<b></b>'), 1);
      helper.assert(_safeValue.get('<b></b>'), 'dictionary[1]');
      helper.assert(_safeValue.getDictionary(), ['<xml>', '<b></b>', '<a>', ';\\\'']);
      // should reset the dictionary
      var _safeValue2 = builder.generateSafeJSValueAccessor('dictionary');
      helper.assert(_safeValue2.getDictionary(), []);
    });
    it('should return separate values (one for each instance) even if arrays are the same', function () {
      var _safeValue = builder.generateSafeJSValueAccessor('dictionary');
      var _array1 = [1, 2];
      var _array2 = [1, 2];
      helper.assert(_safeValue.get(_array1), 'dictionary[0]');
      helper.assert(_safeValue.get(_array2), 'dictionary[1]');
      helper.assert(_safeValue.get(_array1), 'dictionary[0]');
    });
  });

  describe('generateSafeJSVariable', function () {
    it('should generate safe JS variable', function () {
      var _safeVar = builder.generateSafeJSVariable();
      helper.assert(_safeVar('<xml>'  ), '_gV0');
      helper.assert(_safeVar('<b></b>'), '_gV1');
      helper.assert(_safeVar('<a>'    ), '_gV2');
      helper.assert(_safeVar('<a>'    ), '_gV2');
      helper.assert(_safeVar('<xml>'  ), '_gV0');
    });
  });

  describe('getFilterString', function () {
    let _safeAccessor = null;
    let _getSafeValue = null;
    let _getSafeVar = null;
    beforeEach(function () {
      _safeAccessor = builder.generateSafeJSValueAccessor('dictionary');
      _getSafeVar   = builder.generateSafeJSVariable();
      _getSafeValue = _safeAccessor.get;
    });
    it('should return an empty string if code is empty, attr is empty, the conditions array is not defined', function () {
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, [{left : {parent : 'myObj',attr : 'sort'}, operator : '>', right : '10'}]);
      assert.equal(_actual, '');
      _actual = builder.getFilterString(_getSafeVar, _getSafeValue, []);
      assert.equal(_actual, '');
      _actual = builder.getFilterString(_getSafeVar, _getSafeValue);
      assert.equal(_actual, '');
      _actual = builder.getFilterString(_getSafeVar, _getSafeValue, 'd', 'code');
      assert.equal(_actual, '');
    });
    it('should return a string which contain an "if-condition"', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'sort'}, operator : '>', right : '10'}
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code');
      assert.equal(_actual, 'if((_gV0 && _gV0[dictionary[0]]>dictionary[1])){\n code;\n }');
      helper.assert(_safeAccessor.getDictionary(), ['sort', '10']);
    });
    it('should accept multiple conditions', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'sort'}, operator : '>', right : '10'},
        {left : {parent : 'myObj',attr : 'id'}, operator : '<', right : '15'}
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code');
      assert.equal(_actual, 'if((_gV0 && _gV0[dictionary[0]]>dictionary[1] && _gV0[dictionary[2]]<dictionary[3])){\n code;\n }');
      helper.assert(_safeAccessor.getDictionary(), ['sort', '10', 'id', '15']);
    });
    it('should accept than the left part of the condition is in an object', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '>', right : '10'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code');
      assert.equal(_actual, 'var _gV0=_gV1[dictionary[0]];\nif((_gV0 && _gV0[dictionary[1]]>dictionary[2])){\n code;\n }');
      helper.assert(_safeAccessor.getDictionary(), ['menu', 'sort', '10']);
    });
    it('should add a prefix on the declared variable', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '>', right : '10'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'var _gV0=_gV1[dictionary[0]];\nif((_gV0 && _gV0[dictionary[1]]>dictionary[2])){\n code;\n }');
    });
    it('should handle the reserved index iterator "i"', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'i'}, operator : '>', right : '10'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'if((_gV0_i >10)){\n code;\n }');
    });
    it('should handle the reserved index iterator "i" and negative values', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'i'}, operator : '=', right : '-10'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'if((_gV0_i =_gV0_array_length -10)){\n code;\n }');
    });
    it('should not inject JS if the index contains weird characters (negative index)', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'i'}, operator : '=', right : '-10;console.log'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'if((_gV0_i =_gV0_array_length -10)){\n code;\n }');
    });
    it('should not inject JS if the index contains weird characters (not int)', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'i'}, operator : '=', right : ';-10;console.log'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'if((_gV0_i =NaN)){\n code;\n }');
    });
    it('should not inject JS if the index contains weird characters (positive index)', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'i'}, operator : '=', right : '10;console.log'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', 'prefix');
      assert.equal(_actual, 'if((_gV0_i =10)){\n code;\n }');
    });
    it('should not declare the same variable twice if there are two conditions on the same variable', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '>', right : '10'},
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '<', right : '20'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code');
      assert.equal(_actual, 'var _gV0=_gV1[dictionary[0]];\nif((_gV0 && _gV0[dictionary[1]]>dictionary[2] && _gV0[dictionary[1]]<dictionary[3])){\n code;\n }');
      helper.assert(_safeAccessor.getDictionary(), ['menu', 'sort', '10', '20']);
    });
    it('should inverse the condition', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '>', right : '10'},
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '<', right : '20'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code', '', true);
      assert.equal(_actual, 'var _gV0=_gV1[dictionary[0]];\nif(!(_gV0 && _gV0[dictionary[1]]>dictionary[2] && _gV0[dictionary[1]]<dictionary[3])){\n code;\n }');
    });
    it('should accept multiple conditions nested in an object', function () {
      var _conditions = [
        {left : {parent : 'myObj',attr : 'menu.sort'}, operator : '>', right : '10'},
        {left : {parent : 'myObj',attr : 'car.sort'}, operator : '<', right : '20'},
      ];
      var _actual = builder.getFilterString(_getSafeVar, _getSafeValue, _conditions, 'code');
      assert.equal(_actual,
        'var _gV0=_gV1[dictionary[0]];\n'+
        'var _gV2=_gV1[dictionary[3]];\n'+
        'if((_gV0 && _gV0[dictionary[1]]>dictionary[2] && _gV2 && _gV2[dictionary[1]]<dictionary[4])){\n'+
        ' code;\n }'
      );
      helper.assert(_safeAccessor.getDictionary(), ['menu', 'sort', '10', 'car', '20']);
    });
  });

  describe('sortXmlParts', function () {
    it('should sort the array with a depth of 1 by default', function () {
      var _data     = [{pos : [40]}, {pos : [19]}, {pos : [2 ]}, {pos : [20]}];
      var _expected = [{pos : [2 ]}, {pos : [19]}, {pos : [20]}, {pos : [40]}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort the array even with strings', function () {
      var _data     = [{pos : ['zz']}, {pos : ['ab']}, {pos : ['a' ]}, {pos : ['ac']}];
      var _expected = [{pos : ['a' ]}, {pos : ['ab']}, {pos : ['ac']}, {pos : ['zz']}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort the array with a depth of 2', function () {
      var _data     = [{pos : [40, 4]}, {pos : [40, 3]}, {pos : [51, 100]}, {pos : [29, 8  ]}];
      var _expected = [{pos : [29, 8]}, {pos : [40, 3]}, {pos : [40, 4  ]}, {pos : [51, 100]}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort the array with a depth of 3', function () {
      var _data     = [{pos : [4, 4, 2]}, {pos : [4, 4, 1]}, {pos : [4, 3, 2]}, {pos : [1, 9, 1]}, {pos : [2, 5, 6]}, {pos : [1, 8, 9]}];
      var _expected = [{pos : [1, 8, 9]}, {pos : [1, 9, 1]}, {pos : [2, 5, 6]}, {pos : [4, 3, 2]}, {pos : [4, 4, 1]}, {pos : [4, 4, 2]}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort the array even if some arrays are incomplete, undefined values appears first', function () {
      var _data     = [{pos : [4, 4, 2]}, {pos : [4, 4, 1]}, {pos : [2, 4   ]}, {pos : [1, 9, 1]}, {pos : [2, 3   ]}, {pos : [1      ]}];
      var _expected = [{pos : [1      ]}, {pos : [1, 9, 1]}, {pos : [2, 3   ]}, {pos : [2, 4   ]}, {pos : [4, 4, 1]}, {pos : [4, 4, 2]}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort a complex array (sort depth of 3) of xml parts', function () {
      var _data     = [
        { pos : [ 6, 1, 14 ], str : 'Tesla motors' },
        { pos : [ 0        ], str : '<xml> '       },
        { pos : [ 6, 1, 6  ], str : '<tr>'         },
        { pos : [ 6, 1, 23 ], str : '</tr>'        },
        { pos : [ 6, 0, 14 ], str : 'Lumeneo'      },
        { pos : [ 6, 0, 6  ], str : '<tr>'         },
        { pos : [ 6, 0, 23 ], str : '</tr>'        },
        { pos : [ 6, 2, 14 ], str : 'Toyota'       },
        { pos : [ 6, 2, 6  ], str : '<tr>'         },
        { pos : [ 6, 2, 23 ], str : '</tr>'        },
        { pos : [ 24       ], str : '</xml>'       }
      ];
      var _expected     = [
        { pos : [ 0        ], str : '<xml> '       },
        { pos : [ 6, 0, 6  ], str : '<tr>'         },
        { pos : [ 6, 0, 14 ], str : 'Lumeneo'      },
        { pos : [ 6, 0, 23 ], str : '</tr>'        },
        { pos : [ 6, 1, 6  ], str : '<tr>'         },
        { pos : [ 6, 1, 14 ], str : 'Tesla motors' },
        { pos : [ 6, 1, 23 ], str : '</tr>'        },
        { pos : [ 6, 2, 6  ], str : '<tr>'         },
        { pos : [ 6, 2, 14 ], str : 'Toyota'       },
        { pos : [ 6, 2, 23 ], str : '</tr>'        },
        { pos : [ 24       ], str : '</xml>'       }
      ];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should be fast to sort 1 Millons of rows', function () {
      var _nbRows = 1000000;
      var _data = [];
      for (var i = 0; i < _nbRows; i++) {
        _data.push({
          pos : [i % 100, i % 50, i % 1000, i % 60]
        });
      }
      var _start = process.hrtime();
      builder.sortXmlParts(_data, 10);
      var _diff = process.hrtime(_start);
      var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
      console.log('\n sortXmlParts speed : ' + _elapsed + ' ms (usually around 800 ms)\n');
      helper.assert(_elapsed < 2000, true);
    });
    it('should sort by rowShow first if "pos" are the same', function () {
      var _data     = [{pos : [4], rowShow : false}, {pos : [4], rowShow : false}, {pos : [4], rowShow : true }, {pos : [1], rowShow : false}];
      var _expected = [{pos : [1], rowShow : false}, {pos : [4], rowShow : true }, {pos : [4], rowShow : false}, {pos : [4], rowShow : false}];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
    it('should sort complex datasets', function () {
      var _data     =     [
        {pos : [0                                 ], str : '<xml>' },
        {pos : [5, 'david',  0, 5                 ], str : '<t_row>'},
        {pos : [5, 'david',  0, 38                ], str : '</t_row>'},
        {pos : [5, 'david',  0, 12, 'B', 0, 16    ], str : 'B'},
        {pos : [5, 'david',  0, 12, 'B', 0, 12    ], str : '<td>'},
        {pos : [5, 'david',  0, 12, 'B', 0, 21    ], str : '</td>'},
        {pos : [5, 'david',  0, 12, 'A', 1, 16    ], str : 'A'},
        {pos : [5, 'david',  0, 12, 'A', 1, 12    ], str : '<td>'},
        {pos : [5, 'david',  0, 12, 'A', 1, 21    ], str : '</td>'},
        {pos : [5, 'bob',  1, 5                   ], str : '<t_row>'},
        {pos : [5, 'bob',  1, 38                  ], str : '</t_row>'},
        {pos : [5, 'bob',  1, 12, 'D', 0, 16      ], str : 'D'},
        {pos : [5, 'bob',  1, 12, 'D', 0, 12      ], str : '<td>'},
        {pos : [5, 'bob',  1, 12, 'D', 0, 21      ], str : '</td>'},
        {pos : [5, 'bob',  1, 12, 'C', 1, 16      ], str : 'C'},
        {pos : [5, 'bob',  1, 12, 'C', 1, 12      ], str : '<td>'},
        {pos : [5, 'bob',  1, 12, 'C', 1, 21      ], str : '</td>'},
        {pos : [5, 'bob',  1, 12, 'E', 2, 16      ], str : 'E'},
        {pos : [5, 'bob',  1, 12, 'E', 2, 12      ], str : '<td>'},
        {pos : [5, 'bob',  1, 12, 'E', 2, 21      ], str : '</td>'},
        {pos : [39                                ], str : '</xml>'}
      ];
      var _expected = [
        {pos : [0                              ], str : '<xml>' },
        {pos : [5, 'bob'  ,  1, 5              ], str : '<t_row>'},
        {pos : [5, 'bob'  ,  1, 12, 'C', 1, 12 ], str : '<td>'},
        {pos : [5, 'bob'  ,  1, 12, 'C', 1, 16 ], str : 'C'},
        {pos : [5, 'bob'  ,  1, 12, 'C', 1, 21 ], str : '</td>'},
        {pos : [5, 'bob'  ,  1, 12, 'D', 0, 12 ], str : '<td>'},
        {pos : [5, 'bob'  ,  1, 12, 'D', 0, 16 ], str : 'D'},
        {pos : [5, 'bob'  ,  1, 12, 'D', 0, 21 ], str : '</td>'},
        {pos : [5, 'bob'  ,  1, 12, 'E', 2, 12 ], str : '<td>'},
        {pos : [5, 'bob'  ,  1, 12, 'E', 2, 16 ], str : 'E'},
        {pos : [5, 'bob'  ,  1, 12, 'E', 2, 21 ], str : '</td>'},
        {pos : [5, 'bob'  ,  1, 38             ], str : '</t_row>'},
        {pos : [5, 'david',  0, 5              ], str : '<t_row>'},
        {pos : [5, 'david',  0, 12, 'A', 1, 12 ], str : '<td>'},
        {pos : [5, 'david',  0, 12, 'A', 1, 16 ], str : 'A'},
        {pos : [5, 'david',  0, 12, 'A', 1, 21 ], str : '</td>'},
        {pos : [5, 'david',  0, 12, 'B', 0, 12 ], str : '<td>'},
        {pos : [5, 'david',  0, 12, 'B', 0, 16 ], str : 'B'},
        {pos : [5, 'david',  0, 12, 'B', 0, 21 ], str : '</td>'},
        {pos : [5, 'david',  0, 38             ], str : '</t_row>'},
        {pos : [39                             ], str : '</xml>'}
      ];
      builder.sortXmlParts(_data);
      helper.assert(_data, _expected);
    });
  });
  describe('forEachArrayExit call a function for each array we are leaving', function () {
    it('should never call the callback if _currentlyVisitedArrays is empty', function () {
      var _currentlyVisitedArrays = [];
      var _objDependencyDescriptor = {
        d    : {type : 'array', parent : ''},
        cars : {type : 'array', parent : 'd'}
      };
      var _nextAttrName = '';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function () {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);

      _nextAttrName = '';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, {}, _nextAttrName, function () {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);

      _nextAttrName = 'cars';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function () {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
    });
    it('should call the callback once if we are leaving the array "cars".\
      It should return the name of the array we are leaving.\
      It should remove the array name in _currentlyVisitedArrays', function () {
      var _currentlyVisitedArrays = ['d', 'cars'];
      var _objDependencyDescriptor = {
        d    : {type : 'array', parent : '' , depth : 1},
        cars : {type : 'array', parent : 'd', depth : 2},
        test : {type : 'array', parent : 'd', depth : 2}
      };
      var _nextAttrName = 'test';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        helper.assert(arrayLeft, 'cars');
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
    it('should call the callback for each array we are leaving', function () {
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        d      : {type : 'array', parent : ''     , depth : 1},
        cars   : {type : 'array', parent : 'd'    , depth : 2},
        wheels : {type : 'array', parent : 'cars' , depth : 3},
        site   : {type : 'object', parent : 'd' }
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        var _leftArrays = ['wheels', 'cars'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 2);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
    it('2. should call the callback for each array we are leaving', function () {
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        d      : {type : 'array', parent : ''      , depth : 1},
        cars   : {type : 'array', parent : 'd'     , depth : 2},
        wheels : {type : 'array', parent : 'cars'  , depth : 3},
        site   : {type : 'object', parent : 'cars' }
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        var _leftArrays = ['wheels'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['d', 'cars']);
    });
    it('should works even if the arrays are nested in objects', function () {
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        d       : {type : 'array' , parent : ''       , depth : 1},
        obj     : {type : 'object', parent : 'd'                 },
        cars    : {type : 'array' , parent : 'obj'    , depth : 2},
        spec    : {type : 'object', parent : 'cars'              },
        wheels  : {type : 'array' , parent : 'spec'   , depth : 3},
        site    : {type : 'object', parent : 'wheels'            },
        players : {type : 'array', parent : 'obj'     , depth : 2}
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function () {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
      helper.assert(_currentlyVisitedArrays, ['d', 'cars', 'wheels']);

      _nextAttrName = 'players';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        var _leftArrays = ['wheels', 'cars'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 2);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
    it('should not leave the array "wheels" if the array "tyres" is nested in "wheels" in XML (depth >)', function () {
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        d      : {type : 'array' , parent : ''     , depth : 1 },
        cars   : {type : 'array' , parent : 'd'    , depth : 2 },
        wheels : {type : 'array' , parent : 'cars' , depth : 3 },
        tyres  : {type : 'array' , parent : 'cars' , depth : 4 },
        site   : {type : 'object', parent : 'cars'                                     }
      };
      var _nextAttrName = 'tyres';
      var _nbArrayExit = 0;
      // eslint-disable-next-line no-unused-vars
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
      helper.assert(_currentlyVisitedArrays, ['d', 'cars', 'wheels']);
    });
    it('should not leave the array "countries" if the array "movies" is nested in "countries" in XML (depth >)', function () {
      var _currentlyVisitedArrays = ['countries', 'cars'];
      var _objDependencyDescriptor = {
        d          : {type : 'object' , parent : ''                 },
        countries  : {type : 'array'  , parent : 'd'    , depth : 1 },
        movies     : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject  : {type : 'object' , parent : 'movies'           },
        cars       : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject2 : {type : 'object' , parent : 'cars'             }
      };
      var _nextAttrName = 'movies';
      var _nbArrayExit = 0;
      // eslint-disable-next-line no-unused-vars
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['countries']);
    });
    it('should not leave the array "cars" if the object "subObject3" come from cars', function () {
      var _currentlyVisitedArrays = ['countries', 'cars'];
      var _objDependencyDescriptor = {
        d          : {type : 'object' , parent : ''                 },
        countries  : {type : 'array'  , parent : 'd'    , depth : 1 },
        movies     : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject  : {type : 'object' , parent : 'movies'           },
        cars       : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject2 : {type : 'object' , parent : 'cars'             },
        subObject3 : {type : 'object' , parent : 'subObject2'       }
      };
      var _nextAttrName = 'subObject3';
      var _nbArrayExit = 0;
      // eslint-disable-next-line no-unused-vars
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
      helper.assert(_currentlyVisitedArrays, ['countries', 'cars']);
    });
    it('should leave the array "cars" if the object "subObject4" come from movies and movies is at the same depth in XML', function () {
      var _currentlyVisitedArrays = ['countries', 'cars'];
      var _objDependencyDescriptor = {
        d          : {type : 'object' , parent : ''                 },
        countries  : {type : 'array'  , parent : 'd'    , depth : 1 },
        movies     : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject  : {type : 'object' , parent : 'movies'           },
        subObject4 : {type : 'object' , parent : 'subObject'        },
        cars       : {type : 'array'  , parent : 'd'    , depth : 2 },
        subObject2 : {type : 'object' , parent : 'cars'             },
        subObject3 : {type : 'object' , parent : 'subObject2'       }
      };
      var _nextAttrName = 'subObject4';
      var _nbArrayExit = 0;
      // eslint-disable-next-line no-unused-vars
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function (arrayLeft) {
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['countries']);
    });
  });

  describe('assembleXmlParts', function () {
    it('should sort the array of xml parts according to the "pos" attribute and assemble all strings', function () {
      var _data     = [
        {pos : [40], str : '4'},
        {pos : [19], str : '2'},
        {pos : [2 ], str : '1'},
        {pos : [20], str : '3'}
      ];
      helper.assert(builder.assembleXmlParts(_data), '1234');
    });
    it('should sort a complex array (sort depth of 3) of xml parts and assemble all strings', function () {
      var _data     = [
        {pos : [4, 4, 2], str : '6'},
        {pos : [4, 4, 1], str : '5'},
        {pos : [2, 4   ], str : '4'},
        {pos : [1, 9, 1], str : '2'},
        {pos : [2, 3   ], str : '3'},
        {pos : [1      ], str : '1'}
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '123456');
    });
    it('should sort a complex array and assemble all strings. It should keep all the parts if rowShow,rowStart,rowEnd are undefined', function () {
      var _data     = [
        { pos : [ 0        ], str : '<xml>' },
        { pos : [ 6, 1, 14 ], str : 'Tesla motors' },
        { pos : [ 6, 1, 6  ], str : '<tr>' },
        { pos : [ 6, 1, 23 ], str : '</tr>' },
        { pos : [ 6, 0, 14 ], str : 'Lumeneo' },
        { pos : [ 6, 0, 6  ], str : '<tr>' },
        { pos : [ 6, 0, 23 ], str : '</tr>' },
        { pos : [ 6, 2, 14 ], str : 'Toyota' },
        { pos : [ 6, 2, 6  ], str : '<tr>' },
        { pos : [ 6, 2, 23 ], str : '</tr>' },
        { pos : [ 24       ], str : '</xml>' }
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml><tr>Lumeneo</tr><tr>Tesla motors</tr><tr>Toyota</tr></xml>');
    });
    it('should accept to sort strings.', function () {
      var _data     = [
        { pos : [ 0           ], str : '<xml>' },
        { pos : [ 6, 'ab', 14 ], str : 'Tesla motors' },
        { pos : [ 6, 'ab', 6  ], str : '<tr>' },
        { pos : [ 6, 'ab', 23 ], str : '</tr>' },
        { pos : [ 6, 'aa', 14 ], str : 'Lumeneo' },
        { pos : [ 6, 'aa', 6  ], str : '<tr>' },
        { pos : [ 6, 'aa', 23 ], str : '</tr>' },
        { pos : [ 6, 'c' , 14 ], str : 'Toyota' },
        { pos : [ 6, 'c' , 6  ], str : '<tr>' },
        { pos : [ 6, 'c' , 23 ], str : '</tr>' },
        { pos : [ 24          ], str : '</xml>' }
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml><tr>Lumeneo</tr><tr>Tesla motors</tr><tr>Toyota</tr></xml>');
    });
    it('should remove the entire row of an array if all attributes "rowShow" equals false', function () {
      var _data     = [
        { pos : [ 0        ], str : '<xml> '                   },
        { pos : [ 6, 0, 6  ], str : '<tr><p>'  , rowStart : true },
        { pos : [ 6, 0, 13 ], str : 'Thomas'   , rowShow : true  },
        { pos : [ 6, 0, 29 ], str : '</p></tr>', rowEnd : true   },
        { pos : [ 6, 1, 6  ] , str : '<tr><p>' , rowStart : true },
        { pos : [ 6, 1, 13 ], str : 'Trinity'  , rowShow : false },
        { pos : [ 6, 1, 29 ], str : '</p></tr>', rowEnd : true   },
        { pos : [ 30       ], str : ' </xml>'                  }
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '<xml> <tr><p>Thomas</p></tr> </xml>');
    });
    it('should remove all rows if rowShow is undefined', function () {
      var _data     = [
        { pos : [ 0        ], str : '<xml> '                   },
        { pos : [ 6, 0, 6  ], str : '<tr><p>'  , rowStart : true },
        { pos : [ 6, 0, 13 ], str : 'Thomas'                   },
        { pos : [ 6, 0, 29 ], str : '</p></tr>', rowEnd : true   },
        { pos : [ 6, 1, 6  ] , str : '<tr><p>' , rowStart : true },
        { pos : [ 6, 1, 13 ], str : 'Trinity'                  },
        { pos : [ 6, 1, 29 ], str : '</p></tr>', rowEnd : true   },
        { pos : [ 30       ], str : ' </xml>'                  }
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '<xml>  </xml>');
    });
    it('should remove (nested array) the entire row of an array if all attributes "rowShow" equals false', function () {
      var _data     = [
        { pos : [ 0               ], str : '<xml> '             },
        { pos : [ 6, 0, 6         ], str : '<tr><p>'            ,rowStart : true},
        { pos : [ 6, 0, 13        ], str : 'Thomas'             ,rowShow : false},
        { pos : [ 6, 0, 20        ], str : '</p><p>A. Anderson' ,rowShow : false},
        { pos : [ 6, 0, 20, 0, 20 ], str : '<tr>'               ,rowStart : true},
        { pos : [ 6, 0, 20, 0, 24 ], str : 'survive'            ,rowShow : false},
        { pos : [ 6, 0, 20, 0, 29 ], str : '</tr>'              ,rowEnd : true},
        { pos : [ 6, 0, 20, 1, 20 ], str : '<tr>'               ,rowStart : true},
        { pos : [ 6, 0, 20, 1, 24 ], str : 'walk on the walls'  ,rowShow : true}, // <-- at least one part to keep
        { pos : [ 6, 0, 20, 1, 29 ], str : '</tr>'              ,rowEnd : true},
        { pos : [ 6, 0, 38        ], str : '</p></tr>'          ,rowEnd : true},
        { pos : [ 6, 1, 6         ], str : '<tr><p>'            ,rowStart : true},
        { pos : [ 6, 1, 13        ], str : 'Trinity'            ,rowShow : false},
        { pos : [ 6, 1, 20        ], str : '</p><p>Unknown'     ,rowShow : false},
        { pos : [ 6, 1, 20, 0, 20 ], str : '<tr>'               ,rowStart : true},
        { pos : [ 6, 1, 20, 0, 24 ], str : 'hack'               ,rowShow : false},
        { pos : [ 6, 1, 20, 0, 29 ], str : '</tr>'              ,rowEnd : true},
        { pos : [ 6, 1, 38        ], str : '</p></tr>'          ,rowEnd : true},
        { pos : [ 39              ], str : ' </xml>'            }
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml> <tr><p>Thomas</p><p>A. Anderson<tr>walk on the walls</tr></p></tr> </xml>');
    });
    it('should hide or show according to conditional block boolean', function () {
      var _data     = [
        { pos : [ 0 ]    , str : '<a> hey </a><b> <c></c> </b>'                                 },
        { pos : [ 27.8 ] , str : ''                                                             },
        { pos : [ 27.9 ] , str : '<d> textD <e>e</e> </d>'                          , hide : 0  },
        { pos : [ 50.8 ] , str : ''                                                 , hide : -1 },
        { pos : [ 50.9 ] , str : '<f>  <g></g><h></h><i></i></f><j/><k><l></l></k>'             },
        { pos : [ 98.8 ] , str : ''                                                             },
        { pos : [ 98.9 ] , str : '<m>  <n> textN </n></m>'                          , hide : 1  },
        { pos : [ 121.8] , str : ''                                                 , hide : -1 },
        { pos : [ 121.9] , str : ''                                                             },
        { pos : [ 122.9] , str : '<o>  <p></p><q></q><r></r></o>'                               }
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<a> hey </a><b> <c></c> </b><d> textD <e>e</e> </d><f>  <g></g><h></h><i></i></f><j/><k><l></l></k><o>  <p></p><q></q><r></r></o>');
    });
    it('should hide all XML within a surrounding conditional block', function () {
      var _data     = [
        { pos : [ 0               ], str : '<xml> '                         },
        { pos : [ 6, 0, 6         ], str : '<tr><p>'            , hide : 1  },
        { pos : [ 6, 0, 13        ], str : 'Thomas'             ,           },
        { pos : [ 6, 0, 20        ], str : '</p><p>A. Anderson' ,           },
        { pos : [ 6, 0, 20, 0, 20 ], str : '<tr>'               ,           },
        { pos : [ 6, 0, 20, 0, 24 ], str : 'survive'            , hide : 0  },
        { pos : [ 6, 0, 20, 0, 29 ], str : '</tr>'              , hide : -1 },
        { pos : [ 6, 0, 20, 1, 20 ], str : '<tr>'               , hide : 1  },
        { pos : [ 6, 0, 20, 1, 24 ], str : 'walk on the walls'  ,           },
        { pos : [ 6, 0, 20, 1, 29 ], str : '</tr>'              , hide : -1 },
        { pos : [ 6, 0, 38        ], str : '</p></tr>'          ,           },
        { pos : [ 6, 1, 6         ], str : '<tr><p>'            ,           },
        { pos : [ 6, 1, 13        ], str : 'Trinity'            ,           },
        { pos : [ 6, 1, 20        ], str : '</p><p>Unknown'     ,           },
        { pos : [ 6, 1, 20, 0, 20 ], str : '<tr>'               ,           },
        { pos : [ 6, 1, 20, 0, 24 ], str : 'hack'               ,           },
        { pos : [ 6, 1, 20, 0, 29 ], str : '</tr>'              ,           },
        { pos : [ 6, 1, 38        ], str : '</p></tr>'          , hide : -1 },
        { pos : [ 39              ], str : ' </xml>'                        }
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml> </p></tr> </xml>');
    });
  });


  describe('getBuilderFunction', function () {
    /**
     * Take XML strings from dictionary (using part.bef and part.aft index) and place them directly in the part.str
     *
     * This function was created when I modified the methode to inject XML string.
     * To avoid updating all unit tests, this function adapt the new result to old unit tests.
     *
     * @param  {Array} dict        dictionary generated by the builder function
     * @param  {Array} arrayParts  array of XML part coming from builder function
     * @return {Arrau}             array of XML part updated for old unit tests
     */
    function simplify (dict, arrayParts) {
      for (var i = arrayParts.length - 1; i >= 0; i--) {
        var _part = arrayParts[i];
        if (_part.bef !== undefined) {
          _part.str = dict[_part.bef] + _part.str;
        }
        if (_part.aft !== undefined) {
          _part.str += dict[_part.aft];
        }
        delete _part.bef;
        delete _part.aft;
      }
      return arrayParts;
    }
    it('should return a function which returns an array of xml parts for static data if dynamicData is empty', function () {
      var _desc = {
        staticData : {
          before : '<xml>',
          after  : '</xml>'
        },
        hierarchy   : [],
        dynamicData : {}
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(null, {}, helper, _fn.builderDictionary), [{pos : [0], str : '', bef : 0}, {pos : [1], str : '', aft : 1}]);
      helper.assert(_fn.builderDictionary, ['<xml>', '</xml>']);
    });
    it('should return an array of xml parts according to the descriptor, the data and the formatters', function (done) {
      var _desc = {
        staticData : {
          before : '',
          after  : '</xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : '_root', attr : 'number', pos : 5 , depth : 0, before : '<xml>', formatters : [ 'int' ]}
            ]
          }
        }
      };
      var _data = {
        number : 24.55
      };
      var _fn = builder.getBuilderFunction(_desc, input.formatters);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {formatters : input.formatters}, helper, _fn.builderDictionary)), [
        {pos : [5 ],str : '<xml>24', rowShow : true},
        {pos : [6 ],str : '</xml>'}
      ]);
      done();
    });
    it('should manage multiple attributes in the main object "_root"', function () {
      var _desc = {
        staticData : {
          before : '',
          after  : '</p></xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : '_root', attr : 'firstname', pos : 8 , depth : 0, before : '<xml><p>', formatters : []},
              {obj : '_root', attr : 'lastname' , pos : 15, depth : 0, before : '</p><p>' , formatters : []},
              {obj : '_root', attr : 'surname'  , pos : 22, depth : 0, before : '</p><p>' , formatters : []}
            ]
          }
        }
      };
      var _data = {
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        surname   : 'Neo'
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        {pos : [8  ],str : '<xml><p>Thomas', rowShow : true},
        {pos : [15 ],str : '</p><p>A. Anderson', rowShow : true},
        {pos : [22 ],str : '</p><p>Neo', rowShow : true},
        {pos : [23 ],str : '</p></xml>'}
      ]);
    });
    it('should return only the xml if the data is empty or null or if one of the attribute does not exist. (the object formatters is not provided)', function () {
      var _desc = {
        staticData : {
          before : '',
          after  : '</p></xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : '_root', attr : 'firstname', pos : 8 , depth : 0, before : '<xml><p>'},
              {obj : '_root', attr : 'lastname' , pos : 15, depth : 0, before : '</p><p>' },
              {obj : '_root', attr : 'surname'  , pos : 22, depth : 0, before : '</p><p>' }
            ]
          }
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      var _data = {};
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [{pos : [8], str : '<xml><p>', rowShow : true}, {pos : [15], str : '</p><p>', rowShow : true}, {pos : [22], str : '</p><p>', rowShow : true}, {pos : [23], str : '</p></xml>'}]);
      helper.assert(simplify(_fn.builderDictionary, _fn(null, {}, helper, _fn.builderDictionary)), [{pos : [8], str : '<xml><p>', rowShow : true}, {pos : [15], str : '</p><p>', rowShow : true}, {pos : [22], str : '</p><p>', rowShow : true}, {pos : [23], str : '</p></xml>'}]);
      _data = {
        firstname : 'Thomas',
        surname   : 'Neo'
      };
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)) , [{pos : [8], str : '<xml><p>Thomas', rowShow : true}, {pos : [15], str : '</p><p>', rowShow : true}, {pos : [22], str : '</p><p>Neo', rowShow : true}, {pos : [23], str : '</p></xml>'}]);
    });
    it('should work even if there is a nested object in the descriptor', function () {
      var _desc = {
        staticData : {
          before : '',
          after  : '</p></xml>'
        },
        hierarchy   : ['_root', 'info1'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : '_root', attr : 'firstname', pos : 8,  depth : 0, before : '<xml><p>'},
              {obj : '_root', attr : 'lastname' , pos : 15, depth : 0, before : '</p><p>' },
              {obj : '_root', attr : 'surname'  , pos : 40, depth : 0, before : '</br><p>'}
            ]
          },
          info1 : {
            name     : 'info',
            parent   : '_root',
            parents  : ['_root'],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : 'info1', attr : 'movie', pos : 23, depth : 0,  before : '</p><br>' },
              {obj : 'info1', attr : 'job'  , pos : 32, depth : 0,  before : '</br><br>'}
            ]
          }
        }
      };
      var _data = {
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        surname   : 'Neo',
        info      : {
          movie : 'matrix',
          job   : 'developer'
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 8 ] , str : '<xml><p>Thomas', rowShow : true},
        { pos : [ 15 ], str : '</p><p>A. Anderson', rowShow : true},
        { pos : [ 40 ], str : '</br><p>Neo', rowShow : true},
        { pos : [ 23 ], str : '</p><br>matrix', rowShow : true},
        { pos : [ 32 ], str : '</br><br>developer', rowShow : true},
        { pos : [ 41 ], str : '</p></xml>'}
      ]);
    });
    it('should travel the object in the correct order using the "hierarchy" array even if the dynamicData object is not built in correct order', function () {
      var _desc = {
        staticData : {
          before : '',
          after  : '</p></xml>'
        },
        hierarchy   : ['_root', 'info1'],
        dynamicData : {
          info1 : {
            name     : 'info',
            parent   : '_root',
            parents  : ['_root'],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : 'info1', attr : 'movie', pos : 23,  depth : 0, before : '</p><br>'  },
              {obj : 'info1', attr : 'job'  , pos : 32,  depth : 0, before : '</br><br>' }
            ]
          },
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            depth    : 0,
            xmlParts : [
              {obj : '_root', attr : 'firstname', pos : 8,   depth : 0, before : '<xml><p>'},
              {obj : '_root', attr : 'lastname' , pos : 15,  depth : 0, before : '</p><p>' },
              {obj : '_root', attr : 'surname'  , pos : 40,  depth : 0, before : '</br><p>'}
            ]
          }
        }
      };
      var _data = {
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        surname   : 'Neo',
        info      : {
          movie : 'matrix',
          job   : 'developer'
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 8  ], str : '<xml><p>Thomas', rowShow : true},
        { pos : [ 15 ], str : '</p><p>A. Anderson', rowShow : true},
        { pos : [ 40 ], str : '</br><p>Neo', rowShow : true},
        { pos : [ 23 ], str : '</p><br>matrix', rowShow : true},
        { pos : [ 32 ], str : '</br><br>developer', rowShow : true},
        { pos : [ 41 ], str : '</p></xml>' }
      ]);
    });
    it('should work if the main object is an array of object', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr><p>'     },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1,                        },
              {obj : '_root', attr : 'lastname' , pos : 20, depth : 1, before : '</p><p>'   },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</p></tr>'  }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' ,  lastname : 'A. Anderson'},
        {firstname : 'Trinity',  lastname : 'Unknown'}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0        ], str : '<xml> '                           },
        { pos : [ 6, 0, 6 ], str : '<tr><p>'            , rowStart : true},
        { pos : [ 6, 0, 13 ], str : 'Thomas'            , rowShow : true },
        { pos : [ 6, 0, 20 ], str : '</p><p>A. Anderson', rowShow : true },
        { pos : [ 6, 0, 29 ], str : '</p></tr>'         , rowEnd : true  },
        { pos : [ 6, 1, 6 ] , str : '<tr><p>'           , rowStart : true},
        { pos : [ 6, 1, 13 ], str : 'Trinity'           , rowShow : true },
        { pos : [ 6, 1, 20 ], str : '</p><p>Unknown'    , rowShow : true },
        { pos : [ 6, 1, 29 ], str : '</p></tr>'         , rowEnd : true  },
        { pos : [ 30       ], str : ' </xml>'                          }
      ]);
    });
    it('should insert an empty string and set rowShow=false if the condition is not satisfied', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr><p>'     },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1                          , conditions : [{left : {parent : '_root',attr : 'show'}, operator : '==', right : '1'}] },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</p></tr>'  }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' ,  lastname : 'A. Anderson', show : '0'},
        {firstname : 'Trinity',  lastname : 'Unknown'    , show : '1'}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0        ], str : '<xml> '                  },
        { pos : [ 6, 0, 6 ], str : '<tr><p>'   , rowStart : true},
        { pos : [ 6, 0, 13 ], str : ''         , rowShow : false},
        { pos : [ 6, 0, 29 ], str : '</p></tr>', rowEnd : true  },
        { pos : [ 6, 1, 6 ] , str : '<tr><p>'  , rowStart : true},
        { pos : [ 6, 1, 13 ], str : 'Trinity'  , rowShow : true },
        { pos : [ 6, 1, 29 ], str : '</p></tr>', rowEnd : true  },
        { pos : [ 30       ], str : ' </xml>'                 }
      ]);
    });


    // @see test line 822 in test.builder.buildXML.js that where we got our _desc data
    it('when the template is not using i+1 kind of iterator ( but using filters ), xmlpart who are filtered out should not be added to the xmlParts array ( array to be sorted later ) except when no data fullfill the condition. This will help getting better performance result for this kind of template', function () {
      var _desc = {
        staticData : {
          before : '<xml> <t_row> ',
          after  : ' </t_row></xml>'
        },
        dynamicData : {
          _root : {
            name     : '_root',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : []
          },
          _rootd : {
            name    : 'd',
            type    : 'array',
            parent  : '_root',
            parents : [
              '_root'
            ],
            position : {
              start : 14
            },
            iterators : [],
            xmlParts  : [
              {
                attr       : 'brand',
                formatters : [],
                obj        : '_rootd',
                pos        : 14,
                conditions : [
                  {
                    left : {
                      parent : '_rootd',
                      attr   : 'id'
                    },
                    operator : '==',
                    right    : '3'
                  }
                ],
                depth : 0,
                after : ' </t_row><t_row> '
              },
              {
                attr       : 'brand',
                formatters : [],
                obj        : '_rootd',
                pos        : 31,
                conditions : [
                  {
                    left : {
                      parent : '_rootd',
                      attr   : 'id'
                    },
                    operator : '==',
                    right    : '4'
                  }
                ],
                depth : 0,
                after : ' </t_row><t_row> '
              },
              {
                attr       : 'brand',
                formatters : [],
                obj        : '_rootd',
                pos        : 49,
                conditions : [
                  {
                    left : {
                      parent : '_rootd',
                      attr   : 'id'
                    },
                    operator : '==',
                    right    : '1'
                  }
                ],
                depth : 0
              },
            ]
          }
        },
        hierarchy : [
          '_root',
          '_rootd'
        ]
      };
      var _data = {
        d : [
          {brand : 'Lumeneo'     , id : 1},
          {brand : 'Tesla motors', id : 2},
          {brand : 'Toyota'      , id : 3}
        ]
      };
      var _fn = builder.getBuilderFunction(_desc);
      // console.log('\n\n');
      // console.log(simplify(_fn.builderDictionary, _fn(_data));
      // console.log('\n\n');

      var _xmlParts = simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary));
      var _xmlResult = builder.assembleXmlParts(_xmlParts, 20);

      helper.assert(_xmlResult, '<xml> <t_row> Toyota </t_row><t_row>  </t_row><t_row> Lumeneo </t_row></xml>');

      helper.assert(_xmlParts, [
        { pos : [0] , str : '<xml> <t_row> '                                      },
        { pos : [ 14 ], str : 'Toyota </t_row><t_row> '         , rowShow : true   },
        { pos : [ 14 ], str : ' </t_row><t_row> '               , rowShow : false  }, // fill position with the first element found ( even it's rowshow false ) it will eventually get replaced if a position 14 with a rowShow at true is found
        { pos : [ 31 ], str : ' </t_row><t_row> '               , rowShow : false  }, // as such when nothing fill the condition the position will still be occupied by the first element (even if its rowshow is false )
        { pos : [ 49 ], str : 'Lumeneo'                         , rowShow : true   },
        { pos : [ 50 ], str : ' </t_row></xml>'                                     }
      ]);
    });




    it('should work if there is an object in the array', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'info1'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr>'       },
              {obj : '_root', attr : 'firstname', pos : 10, depth : 1, before : ''           },
              {obj : '_root', attr : 'lastname' , pos : 20, depth : 1, before : '</p><p>'    },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</p></tr>' }
            ]
          },
          info1 : {
            name     : 'info',
            parent   : '_root',
            parents  : ['_root'],
            type     : 'object',
            depth    : 1,
            xmlParts : [
              {obj : 'info1', attr : 'movie', pos : 13, depth : 1, before : '<p>'      }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' ,  lastname : 'A. Anderson', info : {movie : 'matrix'} },
        {firstname : 'Trinity',  lastname : 'Unknown', info : {movie : 'matrix2'}}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0        ], str : '<xml> '                            },
        { pos : [ 6, 0, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 10 ], str : 'Thomas'             , rowShow : true },
        { pos : [ 6, 0, 20 ], str : '</p><p>A. Anderson' , rowShow : true },
        { pos : [ 6, 0, 29 ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 6, 0, 13 ], str : '<p>matrix'          , rowShow : true },
        { pos : [ 6, 1, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 1, 10 ], str : 'Trinity'            , rowShow : true },
        { pos : [ 6, 1, 20 ], str : '</p><p>Unknown'     , rowShow : true },
        { pos : [ 6, 1, 29 ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 6, 1, 13 ], str : '<p>matrix2'         , rowShow : true },
        { pos : [ 30       ], str : ' </xml>'                           }
      ]);
    });
    it('should work if there are three nested objects in the array (with one missing object in the last row) ', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'info1', 'info2', 'info3'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr>'        },
              {obj : '_root', attr : 'firstname', pos : 10, depth : 1, before : ''            },
              {obj : '_root', attr : 'lastname' , pos : 20, depth : 1, before : '</p><p>'     },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</p></tr>'  }
            ]
          },
          info1 : {
            name     : 'info',
            parent   : '_root',
            parents  : ['_root'],
            type     : 'object',
            depth    : 1,
            xmlParts : [
              {obj : 'info1', attr : 'movie', pos : 13, depth : 1, before : '<p>' }
            ]
          },
          info2 : {
            name     : 'info',
            parent   : 'info1',
            parents  : ['_root', 'info1'],
            type     : 'object',
            depth    : 1,
            xmlParts : [
              {obj : 'info2', attr : 'style', pos : 14, depth : 1, before : '' }
            ]
          },
          info3 : {
            name     : 'info',
            parent   : 'info2',
            parents  : ['_root', 'info1', 'info2'],
            type     : 'object',
            depth    : 1,
            xmlParts : [
              {obj : 'info3', attr : 'rate', pos : 15, depth : 1, before : '' }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' ,  lastname  : 'A. Anderson',
          info      : {
            movie : 'matrix',
            info  : {
              style : 'sf',
              info  : {
                rate : '10'
              }
            }
          }
        },
        {firstname : 'Trinity',  lastname  : 'Unknown',
          info      : {
            movie : 'matrix2',
            info  : {
              style : 'sf2'
            }
          }
        }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0        ], str : '<xml> '                            },
        { pos : [ 6, 0, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 10 ], str : 'Thomas'             , rowShow : true },
        { pos : [ 6, 0, 20 ], str : '</p><p>A. Anderson' , rowShow : true },
        { pos : [ 6, 0, 29 ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 6, 0, 13 ], str : '<p>matrix'          , rowShow : true },
        { pos : [ 6, 0, 14 ], str : 'sf'                 , rowShow : true },
        { pos : [ 6, 0, 15 ], str : '10'                 , rowShow : true },
        { pos : [ 6, 1, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 1, 10 ], str : 'Trinity'            , rowShow : true },
        { pos : [ 6, 1, 20 ], str : '</p><p>Unknown'     , rowShow : true },
        { pos : [ 6, 1, 29 ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 6, 1, 13 ], str : '<p>matrix2'         , rowShow : true },
        { pos : [ 6, 1, 14 ], str : 'sf2'                , rowShow : true },
        { pos : [ 6, 1, 15 ], str : ''                   , rowShow : true },
        { pos : [ 30       ], str : ' </xml>'                           }
      ]);
    });
    it('should work if there are two adjacents array of objects', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'movies1', 'cars2'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            xmlParts : []
          },
          movies1 : {
            name      : 'movies',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 15},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'movies1', array : 'start' , pos : 6 , depth : 1, after : '<tr>'  },
              {obj : 'movies1', attr : 'title' , pos : 10, depth : 1, before : ''      },
              {obj : 'movies1', array : 'end'   , pos : 15, depth : 1, before : '</tr>' }
            ]
          },
          cars2 : {
            name      : 'cars',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 1,
            position  : {start : 20, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'cars2', array : 'start' , pos : 20, depth : 1, after : '<trow>'  },
              {obj : 'cars2', attr : 'brand' , pos : 24, depth : 1, before : ''        },
              {obj : 'cars2', array : 'end'   , pos : 29, depth : 1, before : '</trow>'}
            ]
          }
        }
      };
      var _data = {
        movies : [
          {title : 'matrix' },
          {title : 'Lord of War' }
        ],
        cars : [
          {brand : 'Lumeneo' },
          {brand : 'Tesla motors' }
        ]
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0         ], str : '<xml> '                            },
        { pos : [ 6 , 0, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6 , 0, 10 ], str : 'matrix'             , rowShow : true },
        { pos : [ 6 , 0, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6 , 1, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6 , 1, 10 ], str : 'Lord of War'        , rowShow : true },
        { pos : [ 6 , 1, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 20, 0, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 20, 0, 24 ], str : 'Lumeneo'            , rowShow : true },
        { pos : [ 20, 0, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 20, 1, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 20, 1, 24 ], str : 'Tesla motors'       , rowShow : true },
        { pos : [ 20, 1, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 30        ], str : ' </xml>'                           }
      ]);
    });
    it('Ashould work if there are two adjacents array of objects within main array', function () {
      var _desc = {
        staticData : {
          before : '<x> ',
          after  : ' </x>'
        },
        hierarchy   : ['_root', 'movies1', 'cars2'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 4, end : 35},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start' , pos : 4  , depth : 1, after : '<tab>'  },
              {obj : '_root', array : 'end'   , pos : 35 , depth : 1, after : '</tab>'  },
            ]
          },
          movies1 : {
            name      : 'movies',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 2,
            position  : {start : 6, end : 15},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'movies1', array : 'start' , pos : 6 , depth : 2, after : '<tr>'  },
              {obj : 'movies1', attr : 'title' , pos : 10, depth : 2, before : ''      },
              {obj : 'movies1', array : 'end'   , pos : 15, depth : 2, before : '</tr>' }
            ]
          },
          cars2 : {
            name      : 'cars',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 2,
            position  : {start : 20, end : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'cars2', array : 'start' , pos : 20, depth : 2, after : '<trow>'  },
              {obj : 'cars2', attr : 'brand' , pos : 24, depth : 2, before : ''        },
              {obj : 'cars2', array : 'end'   , pos : 29, depth : 2, before : '</trow>'}
            ]
          }
        }
      };
      var _data = [{
        movies : [
          {title : 'matrix' },
          {title : 'Lord of War' }
        ],
        cars : [
          {brand : 'Lumeneo' },
          {brand : 'Tesla motors' }
        ]
      }];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary));
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [
        { pos : [ 0               ], str : '<x> '                              },
        { pos : [ 4, 0, 4         ], str : '<tab>'              , rowStart : true},
        { pos : [ 4, 0, 6 , 0, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 4, 0, 6 , 0, 10 ], str : 'matrix'             , rowShow : true },
        { pos : [ 4, 0, 6 , 0, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 4, 0, 6 , 1, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 4, 0, 6 , 1, 10 ], str : 'Lord of War'        , rowShow : true },
        { pos : [ 4, 0, 6 , 1, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 4, 0, 20, 0, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 4, 0, 20, 0, 24 ], str : 'Lumeneo'            , rowShow : true },
        { pos : [ 4, 0, 20, 0, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 4, 0, 20, 1, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 4, 0, 20, 1, 24 ], str : 'Tesla motors'       , rowShow : true },
        { pos : [ 4, 0, 20, 1, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 4, 0, 35        ], str : '</tab>'              , rowEnd : true },
        { pos : [ 36              ], str : ' </x>'                             }
      ]);
    });
    it('should work if there are some xml between two adjacents arrays', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'movies1', 'cars2'],
        dynamicData : {
          _root : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            xmlParts : []
          },
          movies1 : {
            name      : 'movies',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 15},
            iterators : [{ attr : 'i' }],
            before    : '<T>',
            xmlParts  : [
              {obj : 'movies1', array : 'start' , pos : 6 , depth : 1, after : '<tr>'  },
              {obj : 'movies1', attr : 'title' , pos : 10, depth : 1, before : ''      },
              {obj : 'movies1', array : 'end'   , pos : 15, depth : 1, before : '</tr>' }
            ]
          },
          cars2 : {
            name      : 'cars',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 1,
            position  : {start : 20, end : 29},
            iterators : [{ attr : 'i' }],
            before    : '<T2>',
            xmlParts  : [
              {obj : 'cars2', array : 'start' , pos : 20, depth : 1, after : '<trow>'  },
              {obj : 'cars2', attr : 'brand' , pos : 24, depth : 1, before : ''        },
              {obj : 'cars2', array : 'end'   , pos : 29, depth : 1, before : '</trow>'}
            ]
          }
        }
      };
      var _data = {
        movies : [
          {title : 'matrix' },
          {title : 'Lord of War' }
        ],
        cars : [
          {brand : 'Lumeneo' },
          {brand : 'Tesla motors' }
        ]
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0         ], str : '<xml> '                            },
        { pos : [ 6         ], str : '<T>'                               },
        { pos : [ 6 , 0, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6 , 0, 10 ], str : 'matrix'             , rowShow : true },
        { pos : [ 6 , 0, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6 , 1, 6  ], str : '<tr>'               , rowStart : true},
        { pos : [ 6 , 1, 10 ], str : 'Lord of War'        , rowShow : true },
        { pos : [ 6 , 1, 15 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 20        ], str : '<T2>'               ,              },
        { pos : [ 20, 0, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 20, 0, 24 ], str : 'Lumeneo'            , rowShow : true },
        { pos : [ 20, 0, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 20, 1, 20 ], str : '<trow>'             , rowStart : true},
        { pos : [ 20, 1, 24 ], str : 'Tesla motors'       , rowShow : true },
        { pos : [ 20, 1, 29 ], str : '</trow>'            , rowEnd : true  },
        { pos : [ 30        ], str : ' </xml>'                           }
      ]);
    });
    it('should manage nested arrays', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'skills1'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 38},
            iterators : [{attr : 'i'}],
            xmlParts  : [
              {obj : '_root', array : 'start'  , pos : 6 , depth : 1, after : '<tr><p>'   },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1, before : '',         },
              {obj : '_root', attr : 'lastname' , pos : 20, depth : 1, before : '</p><p>'   },
              {obj : '_root', array : 'end'    , pos : 38, depth : 1, before : '</p></tr>' }
            ]
          },
          skills1 : {
            name      : 'skills',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 2,
            position  : {start : 20, end : 29},
            iterators : [{attr : 'i'}],
            xmlParts  : [
              {obj : 'skills1', array : 'start', pos : 20, depth : 2, after : '<tr>'  },
              {obj : 'skills1', attr : 'name'   , pos : 24, depth : 2                   },
              {obj : 'skills1', array : 'end'  , pos : 29, depth : 2, before : '</tr>' }
            ]
          }
        }
      };
      var _data = [{
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        skills    : [
          {name : 'survive'},
          {name : 'walk on the walls'}
        ]
      },{
        firstname : 'Trinity',
        lastname  : 'Unknown',
        skills    : [
          {name : 'hack'}
        ]
      }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary));
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [
        { pos : [ 0               ], str : '<xml> '                            },
        { pos : [ 6, 0, 6         ], str : '<tr><p>'            , rowStart : true},
        { pos : [ 6, 0, 13        ], str : 'Thomas'             , rowShow : true },
        { pos : [ 6, 0, 20        ], str : '</p><p>A. Anderson' , rowShow : true },
        { pos : [ 6, 0, 20, 0, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 20, 0, 24 ], str : 'survive'            , rowShow : true },
        { pos : [ 6, 0, 20, 0, 29 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 0, 20, 1, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 20, 1, 24 ], str : 'walk on the walls'  , rowShow : true },
        { pos : [ 6, 0, 20, 1, 29 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 0, 38        ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 6, 1, 6         ], str : '<tr><p>'            , rowStart : true},
        { pos : [ 6, 1, 13        ], str : 'Trinity'            , rowShow : true },
        { pos : [ 6, 1, 20        ], str : '</p><p>Unknown'     , rowShow : true },
        { pos : [ 6, 1, 20, 0, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 1, 20, 0, 24 ], str : 'hack'               , rowShow : true },
        { pos : [ 6, 1, 20, 0, 29 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 1, 38        ], str : '</p></tr>'          , rowEnd : true  },
        { pos : [ 39              ], str : ' </xml>' } ]
      );
    });
    it('should manage three level of arrays.\
        It should not crash if the third array is empty or does not exist\
        It should keep the xml which is between the second and the third array', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'skills1', 'when2'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 48},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_root', array : 'start'  , pos : 6 , depth : 1, after : '<tr><p>'   },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1, before : '',         },
              {obj : '_root', attr : 'lastname' , pos : 20, depth : 1, before : '</p><p>'   },
              {obj : '_root', array : 'end'    , pos : 48, depth : 1, before : '</p></tr>' }
            ]
          },
          skills1 : {
            name      : 'skills',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 2,
            position  : {start : 20, end : 39},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'skills1', array : 'start', pos : 20, depth : 2, after : '<tr>'  },
              {obj : 'skills1', attr : 'name'   , pos : 24, depth : 2                   },
              {obj : 'skills1', array : 'end'  , pos : 39, depth : 2, before : '</tr>' }
            ]
          },
          when2 : {
            name      : 'when',
            parent    : 'skills1',
            parents   : ['_root', 'skills1'],
            type      : 'array',
            depth     : 3,
            position  : {start : 25, end : 34},
            iterators : [{ attr : 'i' }],
            before    : '<days>',
            xmlParts  : [
              {obj : 'when2', array : 'start', pos : 25, depth : 3, after : '<d>'  },
              {obj : 'when2', attr : 'day'  , pos : 28, depth : 3                   },
              {obj : 'when2', array : 'end'  , pos : 34, depth : 3, before : '</d>' }
            ]
          }
        }
      };
      var _data = [{
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        skills    : [
          {
            name : 'survive',
            when : [
              {day : 'monday'},
              {day : 'thursday'},
              {day : 'friday'}
            ]
          },
          {name : 'walk on the walls'}
        ]
      },{
        firstname : 'Trinity',
        lastname  : 'Unknown',
        skills    : [
          {name : 'hack'}
        ]
      }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary));
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [
        { pos : [ 0 ], str : '<xml> '                                          },
        { pos : [ 6, 0, 6 ], str : '<tr><p>'                    , rowStart : true},
        { pos : [ 6, 0, 13 ], str : 'Thomas'                    , rowShow : true },
        { pos : [ 6, 0, 20 ], str : '</p><p>A. Anderson'        , rowShow : true },
        { pos : [ 6, 0, 20, 0, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 20, 0, 24 ], str : 'survive'            , rowShow : true },
        { pos : [ 6, 0, 20, 0, 25 ], str : '<days>'                            },
        { pos : [ 6, 0, 20, 0, 25, 0, 25 ], str : '<d>'         , rowStart : true},
        { pos : [ 6, 0, 20, 0, 25, 0, 28 ], str : 'monday'      , rowShow : true },
        { pos : [ 6, 0, 20, 0, 25, 0, 34 ], str : '</d>'        , rowEnd : true  },
        { pos : [ 6, 0, 20, 0, 25, 1, 25 ], str : '<d>'         , rowStart : true},
        { pos : [ 6, 0, 20, 0, 25, 1, 28 ], str : 'thursday'    , rowShow : true },
        { pos : [ 6, 0, 20, 0, 25, 1, 34 ], str : '</d>'        , rowEnd : true  },
        { pos : [ 6, 0, 20, 0, 25, 2, 25 ], str : '<d>'         , rowStart : true},
        { pos : [ 6, 0, 20, 0, 25, 2, 28 ], str : 'friday'      , rowShow : true },
        { pos : [ 6, 0, 20, 0, 25, 2, 34 ], str : '</d>'        , rowEnd : true  },
        { pos : [ 6, 0, 20, 0, 39 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 0, 20, 1, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 0, 20, 1, 24 ], str : 'walk on the walls'  , rowShow : true },
        { pos : [ 6, 0, 20, 1, 25 ], str : '<days>'                            },
        { pos : [ 6, 0, 20, 1, 39 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 0, 48 ], str : '</p></tr>'                 , rowEnd : true  },
        { pos : [ 6, 1, 6 ], str : '<tr><p>'                    , rowStart : true},
        { pos : [ 6, 1, 13 ], str : 'Trinity'                   , rowShow : true },
        { pos : [ 6, 1, 20 ], str : '</p><p>Unknown'            , rowShow : true },
        { pos : [ 6, 1, 20, 0, 20 ], str : '<tr>'               , rowStart : true},
        { pos : [ 6, 1, 20, 0, 24 ], str : 'hack'               , rowShow : true },
        { pos : [ 6, 1, 20, 0, 25 ], str : '<days>'                            },
        { pos : [ 6, 1, 20, 0, 39 ], str : '</tr>'              , rowEnd : true  },
        { pos : [ 6, 1, 48 ], str : '</p></tr>'                 , rowEnd : true  },
        { pos : [ 49 ], str : ' </xml>' } ]
      );
    });
    it('should work with a custom iterator. It should keep the array interator', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{attr : 'sort'},{attr : 'i'}],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr>'     },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1,                        },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</tr>'  }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' , sort : 31},
        {firstname : 'Trinity', sort : 11}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0            ], str : '<xml> '                   },
        { pos : [ 6, 31, 0, 6  ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 31, 0, 13 ], str : 'Thomas'    , rowShow : true },
        { pos : [ 6, 31, 0, 29 ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 11, 1, 6  ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 11, 1, 13 ], str : 'Trinity'   , rowShow : true },
        { pos : [ 6, 11, 1, 29 ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 30           ], str : ' </xml>'                  }
      ]);
    });
    it('should work even if the custom iterator is inside an object', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 29},
            iterators : [{obj : 'movie', attr : 'sort'}, {attr : 'i'}],
            xmlParts  : [
              {obj : '_root', array : 'start'   , pos : 6 , depth : 1, after : '<tr>'     },
              {obj : '_root', attr : 'firstname', pos : 13, depth : 1,                        },
              {obj : '_root', array : 'end'     , pos : 29, depth : 1, before : '</tr>'  }
            ]
          }
        }
      };
      var _data = [
        {firstname : 'Thomas' , movie : {sort : 31}},
        {firstname : 'Trinity', movie : {sort : 11}}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary)), [
        { pos : [ 0              ], str : '<xml> '                 },
        { pos : [ 6, 31, 0, 6  ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 31, 0, 13 ], str : 'Thomas'    , rowShow : true },
        { pos : [ 6, 31, 0, 29 ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 11, 1, 6  ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 11, 1, 13 ], str : 'Trinity'   , rowShow : true },
        { pos : [ 6, 11, 1, 29 ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 30             ], str : ' </xml>'                }
      ]);
    });
    it('should work even with two nested arrays used in the inverse order. TODO: IMPROVE', function () {
      var _desc = {
        staticData : {
          before : '<xml> ',
          after  : ' </xml>'
        },
        hierarchy   : ['_root', 'skills1'],
        dynamicData : {
          _root : {
            name      : '',
            parent    : '',
            parents   : [],
            type      : 'array',
            depth     : 2,
            position  : {start : 13, end : 22},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
            ]
          },
          skills1 : {
            name      : 'skills',
            parent    : '_root',
            parents   : ['_root'],
            type      : 'array',
            depth     : 1,
            position  : {start : 6, end : 38},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'skills1', array : 'start' , pos : 6 , depth : 1 , after : '<tr>' },
              {obj : '_root'  , array : 'start', pos : 13, depth : 2, after : '<td>'  },
              {obj : 'skills1', attr : 'name'  , pos : 15 , depth : 2, before : ''     },
              {obj : '_root'  , array : 'end'  , pos : 22, depth : 2, before : '</td>' },
              {obj : 'skills1', array : 'end'   , pos : 38 , depth : 1, before : '</tr>'}
            ]
          }
        }
      };
      var _data = [{
        firstname : 'Thomas',
        lastname  : 'A. Anderson',
        skills    : [
          {name : 'skill1_1'},
          {name : 'skill1_2'},
          {name : 'skill1_3'}
        ]
      },{
        firstname : 'Trinity',
        lastname  : 'Unknown',
        skills    : [
          {name : 'skill2_1'},
          {name : 'skill2_2'},
          {name : 'skill2_3'}
        ]
      }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = simplify(_fn.builderDictionary, _fn(_data, {}, helper, _fn.builderDictionary));
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [
        { pos : [ 0              ], str : '<xml> '                   },
        { pos : [ 6, 0, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 0, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 0, 6, 0, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 0, 6, 0, 15 ], str : 'skill1_1'  , rowShow : true },
        { pos : [ 6, 0, 6, 0, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 0, 6, 1, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 0, 6, 1, 15 ], str : 'skill2_1'  , rowShow : true },
        { pos : [ 6, 0, 6, 1, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 0, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 0, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 1, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 1, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 1, 6, 0, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 1, 6, 0, 15 ], str : 'skill1_2'  , rowShow : true },
        { pos : [ 6, 1, 6, 0, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 1, 6, 1, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 1, 6, 1, 15 ], str : 'skill2_2'  , rowShow : true },
        { pos : [ 6, 1, 6, 1, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 1, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 1, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 2, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 2, 6        ], str : '<tr>'      , rowStart : true},
        { pos : [ 6, 2, 6, 0, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 2, 6, 0, 15 ], str : 'skill1_3'  , rowShow : true },
        { pos : [ 6, 2, 6, 0, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 2, 6, 1, 13 ], str : '<td>'      , rowStart : true},
        { pos : [ 6, 2, 6, 1, 15 ], str : 'skill2_3'  , rowShow : true },
        { pos : [ 6, 2, 6, 1, 22 ], str : '</td>'     , rowEnd : true  },
        { pos : [ 6, 2, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 6, 2, 38       ], str : '</tr>'     , rowEnd : true  },
        { pos : [ 39            ], str : ' </xml>'                   }
      ]);
    });

  });

});


