var assert = require('assert');
var carbone = require('../lib/index');
var builder = require('../lib/builder');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('builder', function(){

  describe('getFormatterString', function(){
    it('should return a simple call of a function for a formatter without arguments', function(){
      var _actual = builder.getFormatterString('d.number', [ 'int' ]);
      assert.equal(_actual, 'formatters.int(d.number)');
    });
    it('should return a simple call of a function for a formatter without arguments but called with parenthesis', function(){
      var _actual = builder.getFormatterString('d.number', [ 'int()' ]);
      assert.equal(_actual, 'formatters.int(d.number)');
    });
    it('should return a call of a function for a formatter with one argument', function(){
      var _actual = builder.getFormatterString('d.number', [ 'toFixed(2)' ]);
      assert.equal(_actual, 'formatters.toFixed(d.number, \'2\')');
    });
    it('should return a call of a function for a formatter with one argument which is a string', function(){
      var _actual = builder.getFormatterString('d.date', [ "format(YYYYMMDD)" ]);
      assert.equal(_actual, "formatters.format(d.date, 'YYYYMMDD')");
    });
    it('should return a call of a function for a formatter with two arguments', function(){
      var _actual = builder.getFormatterString('d.number', [ 'formatter(2, 3)' ]);
      assert.equal(_actual, 'formatters.formatter(d.number, \'2\', \'3\')');
    });
    it('should return two calls of functions for two chained formatters', function(){
      var _actual = builder.getFormatterString('d.number', [ 'int', 'toFixed(2)' ]);
      assert.equal(_actual, 'formatters.toFixed(formatters.int(d.number), \'2\')');
    });
    it('should return two calls of functions for two chained formatters each with arguments', function(){
      var _actual = builder.getFormatterString('d.number', [ 'formatter1(4, 5)', 'formatter2(2, 3)' ]);
      assert.equal(_actual, 'formatters.formatter2(formatters.formatter1(d.number, \'4\', \'5\'), \'2\', \'3\')');
    });
  });

  describe('getFilterString', function(){
    it('should return an empty string if code is empty, attr is empty, the conditions array is not defined', function(){
      var _actual = builder.getFilterString([{'left':{'parent':'myObj','attr':'sort'}, 'operator':'>', 'right':'10'}]);
      assert.equal(_actual, '');
      _actual = builder.getFilterString([]);
      assert.equal(_actual, '');
      _actual = builder.getFilterString();
      assert.equal(_actual, '');
      _actual = builder.getFilterString('d', 'code');
      assert.equal(_actual, '');
    });
    it('should return a string which contain an "if-condition"', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'sort'}, 'operator':'>', 'right':'10'}
      ];
      var _actual = builder.getFilterString(_conditions, 'code');
      assert.equal(_actual, 'if((myObj && myObj["sort"]>10)){\n code;\n }');
    });
    it('should accept multiple conditions', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'sort'}, 'operator':'>', 'right':'10'},
        {'left':{'parent':'myObj','attr':'id'}, 'operator':'<', 'right':'15'}
      ];
      var _actual = builder.getFilterString(_conditions, 'code');
      assert.equal(_actual, 'if((myObj && myObj["sort"]>10 && myObj["id"]<15)){\n code;\n }');
    });
    it('should accept than the left part of the condition is in an object', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'>', 'right':'10'},
      ];
      var _actual = builder.getFilterString(_conditions, 'code');
      assert.equal(_actual, 'var _menu_filter=myObj["menu"];\nif((_menu_filter && _menu_filter["sort"]>10)){\n code;\n }');
    });
    it('should add a prefix on the declared variable', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'>', 'right':'10'},
      ];
      var _actual = builder.getFilterString(_conditions, 'code', 'prefix');
      assert.equal(_actual, 'var _prefixmenu_filter=myObj["menu"];\nif((_prefixmenu_filter && _prefixmenu_filter["sort"]>10)){\n code;\n }');
    });
    it('should not declare the same variable twice if there are two conditions on the same variable', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'>', 'right':'10'},
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'<', 'right':'20'},
      ];
      var _actual = builder.getFilterString(_conditions, 'code');
      assert.equal(_actual, 'var _menu_filter=myObj["menu"];\nif((_menu_filter && _menu_filter["sort"]>10 && _menu_filter["sort"]<20)){\n code;\n }');
    });
    it('should iverse the condition', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'>', 'right':'10'},
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'<', 'right':'20'},
      ];
      var _actual = builder.getFilterString(_conditions, 'code', '', true);
      assert.equal(_actual, 'var _menu_filter=myObj["menu"];\nif(!(_menu_filter && _menu_filter["sort"]>10 && _menu_filter["sort"]<20)){\n code;\n }');
    });
    it('should accept multiple conditions nested in an object', function(){
      var _conditions = [
        {'left':{'parent':'myObj','attr':'menu.sort'}, 'operator':'>', 'right':'10'},
        {'left':{'parent':'myObj','attr':'car.sort'}, 'operator':'<', 'right':'20'},
      ];
      var _actual = builder.getFilterString(_conditions, 'code');
      assert.equal(_actual, 
        'var _menu_filter=myObj["menu"];\n'+
        'var _car_filter=myObj["car"];\n'+
        'if((_menu_filter && _menu_filter["sort"]>10 && _car_filter && _car_filter["sort"]<20)){\n'+
        ' code;\n }'
      );
    });
  });

  describe('sortXmlParts', function(){
    it('should sort the array with a depth of 1 by default', function(){
      var _data     = [{'pos':[40]}, {'pos':[19]}, {'pos':[2 ]}, {'pos':[20]}];
      var _expected = [{'pos':[2 ]}, {'pos':[19]}, {'pos':[20]}, {'pos':[40]}];
      builder.sortXmlParts(_data)
      helper.assert(_data, _expected);
    });
    it('should sort the array even with strings', function(){
      var _data     = [{'pos':['zz']}, {'pos':['ab']}, {'pos':['a' ]}, {'pos':['ac']}];
      var _expected = [{'pos':['a' ]}, {'pos':['ab']}, {'pos':['ac']}, {'pos':['zz']}];
      builder.sortXmlParts(_data)
      helper.assert(_data, _expected);
    });
    it('should sort the array with a depth of 2', function(){
      var _data     = [{'pos':[40, 4]}, {'pos':[40, 3]}, {'pos':[51, 100]}, {'pos':[29, 8  ]}];
      var _expected = [{'pos':[29, 8]}, {'pos':[40, 3]}, {'pos':[40, 4  ]}, {'pos':[51, 100]}];
      builder.sortXmlParts(_data, 2)
      helper.assert(_data, _expected);
    });
    it('should sort the array with a depth of 3', function(){
      var _data     = [{'pos':[4, 4, 2]}, {'pos':[4, 4, 1]}, {'pos':[4, 3, 2]}, {'pos':[1, 9, 1]}, {'pos':[2, 5, 6]}, {'pos':[1, 8, 9]}];
      var _expected = [{'pos':[1, 8, 9]}, {'pos':[1, 9, 1]}, {'pos':[2, 5, 6]}, {'pos':[4, 3, 2]}, {'pos':[4, 4, 1]}, {'pos':[4, 4, 2]}];
      builder.sortXmlParts(_data, 3)
      helper.assert(_data, _expected);
    });
    it('should sort the array even if some arrays are incomplete, undefined values appears first', function(){
      var _data     = [{'pos':[4, 4, 2]}, {'pos':[4, 4, 1]}, {'pos':[2, 4   ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[1      ]}];
      var _expected = [{'pos':[1      ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[2, 4   ]}, {'pos':[4, 4, 1]}, {'pos':[4, 4, 2]}];
      builder.sortXmlParts(_data, 3)
      helper.assert(_data, _expected);
    });
    it('should sort a complex array (sort depth of 3) of xml parts', function(){
      var _data     = [ 
        { 'pos': [ 6, 1, 14 ], 'str': 'Tesla motors' },
        { 'pos': [ 0        ], 'str': '<xml> '       },
        { 'pos': [ 6, 1, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 1, 23 ], 'str': '</tr>'        },
        { 'pos': [ 6, 0, 14 ], 'str': 'Lumeneo'      },
        { 'pos': [ 6, 0, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 0, 23 ], 'str': '</tr>'        },
        { 'pos': [ 6, 2, 14 ], 'str': 'Toyota'       },
        { 'pos': [ 6, 2, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 2, 23 ], 'str': '</tr>'        },
        { 'pos': [ 24       ], 'str': '</xml>'       } 
      ];
      var _expected     = [ 
        { 'pos': [ 0        ], 'str': '<xml> '       },
        { 'pos': [ 6, 0, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 0, 14 ], 'str': 'Lumeneo'      },
        { 'pos': [ 6, 0, 23 ], 'str': '</tr>'        },
        { 'pos': [ 6, 1, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 1, 14 ], 'str': 'Tesla motors' },
        { 'pos': [ 6, 1, 23 ], 'str': '</tr>'        },
        { 'pos': [ 6, 2, 6  ], 'str': '<tr>'         },
        { 'pos': [ 6, 2, 14 ], 'str': 'Toyota'       },
        { 'pos': [ 6, 2, 23 ], 'str': '</tr>'        },
        { 'pos': [ 24       ], 'str': '</xml>'       } 
      ];
      builder.sortXmlParts(_data, 10);
      helper.assert(_data, _expected);
    });
    /*
    complex example, should we tets it?
    [
      {"pos": [0],                                 "str": "<xml>" },
      {"pos": [5, "david",  0, 5],                 "str": "<t_row>"},
      {"pos": [5, "david",  0, 38],                "str": "</t_row>"},
      {"pos": [5, "david",  0, 12, "B", 0, 16 ],   "str": "B"},
      {"pos": [5, "david",  0, 12, "B", 0, 12 ],   "str": "<td>"},
      {"pos": [5, "david",  0, 12, "B", 0, 21 ],   "str": "</td>"},
      {"pos": [5, "david",  0, 12, "A", 1, 16 ],   "str": "A"},
      {"pos": [5, "david",  0, 12, "A", 1, 12 ],   "str": "<td>"},
      {"pos": [5, "david",  0, 12, "A", 1, 21 ],   "str": "</td>"},
      {"pos": [5, "bob",  1, 5 ],                  "str": "<t_row>"},
      {"pos": [5, "bob",  1, 38 ],                 "str": "</t_row>"},
      {"pos": [5, "bob",  1, 12, "D", 0, 16 ],     "str": "D"},
      {"pos": [5, "bob",  1, 12, "D", 0, 12 ],     "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "D", 0, 21 ],     "str": "</td>"},
      {"pos": [5, "bob",  1, 12, "C", 1, 16 ],     "str": "C"},
      {"pos": [5, "bob",  1, 12, "C", 1, 12 ],     "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "C", 1, 21 ],     "str": "</td>"},
      {"pos": [5, "bob",  1, 12, "E", 2, 16],      "str": "E"},
      {"pos": [5, "bob",  1, 12, "E", 2, 12],      "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "E", 2, 21 ],     "str": "</td>"},
      {"pos": [39],                                "str": "</xml>"}
    ]
    [
      {"pos": [0],                                 "str": "<xml>" },
      {"pos": [5, "david",  0, 5],                 "str": "<t_row>"},
      {"pos": [5, "david",  0, 12, "A", 1, 12 ],   "str": "<td>"},
      {"pos": [5, "david",  0, 12, "A", 1, 16 ],   "str": "A"},
      {"pos": [5, "david",  0, 12, "A", 1, 21 ],   "str": "</td>"},
      {"pos": [5, "david",  0, 12, "B", 0, 12 ],   "str": "<td>"},
      {"pos": [5, "david",  0, 12, "B", 0, 16 ],   "str": "B"},
      {"pos": [5, "david",  0, 12, "B", 0, 21 ],   "str": "</td>"},
      {"pos": [5, "david",  0, 38],                "str": "</t_row>"},
      {"pos": [5, "bob",  1, 5 ],                  "str": "<t_row>"},
      {"pos": [5, "bob",  1, 12, "C", 1, 12 ],     "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "C", 1, 16 ],     "str": "C"},
      {"pos": [5, "bob",  1, 12, "C", 1, 21 ],     "str": "</td>"},
      {"pos": [5, "bob",  1, 12, "D", 0, 12 ],     "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "D", 0, 16 ],     "str": "D"},
      {"pos": [5, "bob",  1, 12, "D", 0, 21 ],     "str": "</td>"},
      {"pos": [5, "bob",  1, 12, "E", 2, 12 ],     "str": "<td>"},
      {"pos": [5, "bob",  1, 12, "E", 2, 16 ],     "str": "E"},
      {"pos": [5, "bob",  1, 12, "E", 2, 21 ],     "str": "</td>"},
      {"pos": [5, "bob",  1, 38 ],                 "str": "</t_row>"},
      {"pos": [39],                                "str": "</xml>"}
    ]*/
  });
  describe('forEachArrayExit call a function for each array we are leaving', function(){
    it('should never call the callback if _currentlyVisitedArrays is empty', function(){
      var _currentlyVisitedArrays = [];
      var _objDependencyDescriptor = {
        'd' :{'type': 'array', 'parent':''},
        'cars' :{'type': 'array', 'parent':'d'}
      };
      var _nextAttrName = '';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);

      _nextAttrName = '';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, {}, _nextAttrName, function(arrayLeft){
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);

      _nextAttrName = 'cars';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
    });
    it('should call the callback once if we are leaving the array "cars".\
      It should return the name of the array we are leaving.\
      It should remove the array name in _currentlyVisitedArrays', function(){
      var _currentlyVisitedArrays = ['d', 'cars'];
      var _objDependencyDescriptor = {
        'd' :{'type': 'array', 'parent':''},
        'cars' :{'type': 'array', 'parent':'d'},
        'test' :{'type': 'array', 'parent':'d'}
      };
      var _nextAttrName = 'test';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        helper.assert(arrayLeft, 'cars');
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
    it('should call the callback for each array we are leaving', function(){
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        'd'      :{'type': 'array', 'parent':''},
        'cars'   :{'type': 'array', 'parent':'d'},
        'wheels' :{'type': 'array', 'parent':'cars'},
        'site'   :{'type': 'object', 'parent':'d'}
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        var _leftArrays = ['wheels', 'cars'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 2);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
    it('2. should call the callback for each array we are leaving', function(){
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        'd'      :{'type': 'array', 'parent':''},
        'cars'   :{'type': 'array', 'parent':'d'},
        'wheels' :{'type': 'array', 'parent':'cars'},
        'site'   :{'type': 'object', 'parent':'cars'}
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        var _leftArrays = ['wheels'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 1);
      helper.assert(_currentlyVisitedArrays, ['d', 'cars']);
    });
    it('should works even if the arrays are nested in objects', function(){
      var _currentlyVisitedArrays = ['d', 'cars', 'wheels'];
      var _objDependencyDescriptor = {
        'd'      :{'type': 'array' , 'parent':''},
        'obj'    :{'type': 'object', 'parent':'d'},
        'cars'   :{'type': 'array' , 'parent':'obj'},
        'spec'   :{'type': 'object', 'parent':'cars'},
        'wheels' :{'type': 'array' , 'parent':'spec'},
        'site'   :{'type': 'object', 'parent':'wheels'},
        'players':{'type': 'array', 'parent':'obj'}
      };
      var _nextAttrName = 'site';
      var _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 0);
      helper.assert(_currentlyVisitedArrays, ['d', 'cars', 'wheels']);

      _nextAttrName = 'players';
      _nbArrayExit = 0;
      builder.forEachArrayExit(_currentlyVisitedArrays, _objDependencyDescriptor, _nextAttrName, function(arrayLeft){
        var _leftArrays = ['wheels', 'cars'];
        helper.assert(arrayLeft, _leftArrays[_nbArrayExit]);
        _nbArrayExit++;
      });
      helper.assert(_nbArrayExit, 2);
      helper.assert(_currentlyVisitedArrays, ['d']);
    });
  });

  describe('assembleXmlParts', function(){
    it('should sort the array of xml parts according to the "pos" attribute and assemble all strings', function(){
      var _data     = [
        {'pos':[40], 'str': '4'}, 
        {'pos':[19], 'str': '2'}, 
        {'pos':[2 ], 'str': '1'}, 
        {'pos':[20], 'str': '3'}
      ];
      helper.assert(builder.assembleXmlParts(_data), '1234');
    });
    it('should sort a complex array (sort depth of 3) of xml parts and assemble all strings', function(){
      var _data     = [
        {'pos':[4, 4, 2], 'str': '6'},
        {'pos':[4, 4, 1], 'str': '5'},
        {'pos':[2, 4   ], 'str': '4'},
        {'pos':[1, 9, 1], 'str': '2'},
        {'pos':[2, 3   ], 'str': '3'},
        {'pos':[1      ], 'str': '1'}
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '123456');
    });
    it('should sort a complex array and assemble all strings. It should keep all the parts if rowShow,rowStart,rowEnd are undefined', function(){
      var _data     = [ 
        { 'pos': [ 0        ], 'str': '<xml>' },
        { 'pos': [ 6, 1, 14 ], 'str': 'Tesla motors' },
        { 'pos': [ 6, 1, 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 1, 23 ], 'str': '</tr>' },
        { 'pos': [ 6, 0, 14 ], 'str': 'Lumeneo' },
        { 'pos': [ 6, 0, 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 0, 23 ], 'str': '</tr>' },
        { 'pos': [ 6, 2, 14 ], 'str': 'Toyota' },
        { 'pos': [ 6, 2, 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 2, 23 ], 'str': '</tr>' },
        { 'pos': [ 24       ], 'str': '</xml>' } 
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml><tr>Lumeneo</tr><tr>Tesla motors</tr><tr>Toyota</tr></xml>');
    });
    it('should accept to sort strings.', function(){
      var _data     = [ 
        { 'pos': [ 0           ], 'str': '<xml>' },
        { 'pos': [ 6, 'ab', 14 ], 'str': 'Tesla motors' },
        { 'pos': [ 6, 'ab', 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 'ab', 23 ], 'str': '</tr>' },
        { 'pos': [ 6, 'aa', 14 ], 'str': 'Lumeneo' },
        { 'pos': [ 6, 'aa', 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 'aa', 23 ], 'str': '</tr>' },
        { 'pos': [ 6, 'c' , 14 ], 'str': 'Toyota' },
        { 'pos': [ 6, 'c' , 6  ], 'str': '<tr>' },
        { 'pos': [ 6, 'c' , 23 ], 'str': '</tr>' },
        { 'pos': [ 24          ], 'str': '</xml>' } 
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml><tr>Lumeneo</tr><tr>Tesla motors</tr><tr>Toyota</tr></xml>');
    });
    it('should remove the entire row of an array if all attributes "rowShow" equals false', function(){
      var _data     = [
        { pos:[ 0        ], str: '<xml> '                   },
        { pos:[ 6, 0, 6  ], str: '<tr><p>'  , rowStart:true },
        { pos:[ 6, 0, 13 ], str: 'Thomas'   , rowShow:true  },
        { pos:[ 6, 0, 29 ], str: '</p></tr>', rowEnd:true   },
        { pos:[ 6, 1, 6  ] , str: '<tr><p>' , rowStart:true },
        { pos:[ 6, 1, 13 ], str: 'Trinity'  , rowShow:false },
        { pos:[ 6, 1, 29 ], str: '</p></tr>', rowEnd:true   },
        { pos:[ 30       ], str: ' </xml>'                  }
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '<xml> <tr><p>Thomas</p></tr> </xml>');
    });
    it('should remove all rows if rowShow is undefined', function(){
      var _data     = [
        { pos:[ 0        ], str: '<xml> '                   },
        { pos:[ 6, 0, 6  ], str: '<tr><p>'  , rowStart:true },
        { pos:[ 6, 0, 13 ], str: 'Thomas'                   },
        { pos:[ 6, 0, 29 ], str: '</p></tr>', rowEnd:true   },
        { pos:[ 6, 1, 6  ] , str: '<tr><p>' , rowStart:true },
        { pos:[ 6, 1, 13 ], str: 'Trinity'                  },
        { pos:[ 6, 1, 29 ], str: '</p></tr>', rowEnd:true   },
        { pos:[ 30       ], str: ' </xml>'                  }
      ];
      helper.assert(builder.assembleXmlParts(_data, 3), '<xml>  </xml>');
    });
    it('should remove (nested array) the entire row of an array if all attributes "rowShow" equals false', function(){
      var _data     = [ 
        { pos: [ 0               ], str: '<xml> '             },
        { pos: [ 6, 0, 6         ], str: '<tr><p>'            ,rowStart:true},
        { pos: [ 6, 0, 13        ], str: 'Thomas'             ,rowShow:false},
        { pos: [ 6, 0, 20        ], str: '</p><p>A. Anderson' ,rowShow:false},
        { pos: [ 6, 0, 20, 0, 20 ], str: '<tr>'               ,rowStart:true},
        { pos: [ 6, 0, 20, 0, 24 ], str: 'survive'            ,rowShow:false},
        { pos: [ 6, 0, 20, 0, 29 ], str: '</tr>'              ,rowEnd:true},
        { pos: [ 6, 0, 20, 1, 20 ], str: '<tr>'               ,rowStart:true},
        { pos: [ 6, 0, 20, 1, 24 ], str: 'walk on the walls'  ,rowShow:true}, // <-- at least one part to keep 
        { pos: [ 6, 0, 20, 1, 29 ], str: '</tr>'              ,rowEnd:true},
        { pos: [ 6, 0, 38        ], str: '</p></tr>'          ,rowEnd:true},
        { pos: [ 6, 1, 6         ], str: '<tr><p>'            ,rowStart:true},
        { pos: [ 6, 1, 13        ], str: 'Trinity'            ,rowShow:false},
        { pos: [ 6, 1, 20        ], str: '</p><p>Unknown'     ,rowShow:false},
        { pos: [ 6, 1, 20, 0, 20 ], str: '<tr>'               ,rowStart:true},
        { pos: [ 6, 1, 20, 0, 24 ], str: 'hack'               ,rowShow:false},
        { pos: [ 6, 1, 20, 0, 29 ], str: '</tr>'              ,rowEnd:true},
        { pos: [ 6, 1, 38        ], str: '</p></tr>'          ,rowEnd:true},
        { pos: [ 39              ], str: ' </xml>'            } 
      ];
      helper.assert(builder.assembleXmlParts(_data, 5), '<xml> <tr><p>Thomas</p><p>A. Anderson<tr>walk on the walls</tr></p></tr> </xml>');
    });
  });

  describe('getBuilderFunction', function(){
    it('should return a function which returns an array of xml parts for static data if dynamicData is empty', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml>',
          'after' :'</xml>'
        },
        'hierarchy'   : [],
        'dynamicData' : {}
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(null), [{pos:[0], str:'<xml>'}, {pos:[1], str:'</xml>'}]);
    });
    it('should return an array of xml parts according to the descriptor, the data and the formatters', function(done){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': '_root', 'attr':'number', 'pos':5 , 'depth':0, 'before':'<xml>', 'formatters' : [ 'int' ]}
            ]
          }
        }
      };
      var _data = {
        'number' : 24.55
      };
      var _fn = builder.getBuilderFunction(_desc);
      carbone.cacheFormatters(function(){
        helper.assert(_fn(_data, carbone.formatters), [
          {pos: [5 ],str: '<xml>24'},
          {pos: [6 ],str: '</xml>'}
        ]);
        done();
      });
    });
    it('should manage multiple attributes in the main object "_root"', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': '_root', 'attr':'firstname', 'pos':8 , 'depth':0, 'before':'<xml><p>', 'formatters' : []},
              {'obj': '_root', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' , 'formatters' : []},
              {'obj': '_root', 'attr':'surname'  , 'pos':22, 'depth':0, 'before':'</p><p>' , 'formatters' : []}
            ]
          }
        }
      };
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo'
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        {pos: [8  ],str: '<xml><p>Thomas'},
        {pos: [15 ],str: '</p><p>A. Anderson'},
        {pos: [22 ],str: '</p><p>Neo'},
        {pos: [23 ],str: '</p></xml>'}
      ]);
    });
    it('should return only the xml if the data is empty or null or if one of the attribute does not exist. (the object formatters is not provided)', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': '_root', 'attr':'firstname', 'pos':8 , 'depth':0, 'before':'<xml><p>'},
              {'obj': '_root', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' },
              {'obj': '_root', 'attr':'surname'  , 'pos':22, 'depth':0, 'before':'</p><p>' }
            ]
          }
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      var _data = {};
      helper.assert(_fn(_data), [{pos:[8], str:'<xml><p>'}, {pos:[15], str:'</p><p>'}, {pos:[22], str:'</p><p>'}, {pos:[23], str:'</p></xml>'}]);
      helper.assert(_fn(null) , [{pos:[8], str:'<xml><p>'}, {pos:[15], str:'</p><p>'}, {pos:[22], str:'</p><p>'}, {pos:[23], str:'</p></xml>'}]);
      _data = {
        'firstname':'Thomas',
        'surname': 'Neo'
      };
      helper.assert(_fn(_data) , [{pos:[8], str:'<xml><p>Thomas'}, {pos:[15], str:'</p><p>'}, {pos:[22], str:'</p><p>Neo'}, {pos:[23], str:'</p></xml>'}]);
    });
    it('should work even if there is a nested object in the descriptor', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['_root', 'info1'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': '_root', 'attr':'firstname', 'pos':8,  'depth':0, 'before':'<xml><p>'},
              {'obj': '_root', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' },
              {'obj': '_root', 'attr':'surname'  , 'pos':40, 'depth':0, 'before':'</br><p>'}
            ]
          },
          'info1':{
            'name':'info',
            'parent' : '_root',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23, 'depth':0,  'before':'</p><br>' },
              {'obj': 'info1', 'attr':'job'  , 'pos':32, 'depth':0,  'before':'</br><br>'}
            ]
          }
        }
      };
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo',
        'info':{
          'movie': 'matrix',
          'job' : 'developer'
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos: [ 8 ] , str: '<xml><p>Thomas'},
        { pos: [ 15 ], str: '</p><p>A. Anderson'},
        { pos: [ 40 ], str: '</br><p>Neo'},
        { pos: [ 23 ], str: '</p><br>matrix'},
        { pos: [ 32 ], str: '</br><br>developer'},
        { pos: [ 41 ], str: '</p></xml>'}
      ]);
    });
    it('should travel the object in the correct order using the "hierarchy" array even if the dynamicData object is not built in correct order', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['_root', 'info1'],
        'dynamicData' : {
          'info1':{
            'name':'info',
            'parent' : '_root',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23,  'depth':0, 'before':'</p><br>'  },
              {'obj': 'info1', 'attr':'job'  , 'pos':32,  'depth':0, 'before':'</br><br>' }
            ]
          },
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': '_root', 'attr':'firstname', 'pos':8,   'depth':0, 'before':'<xml><p>'},
              {'obj': '_root', 'attr':'lastname' , 'pos':15,  'depth':0, 'before':'</p><p>' },
              {'obj': '_root', 'attr':'surname'  , 'pos':40,  'depth':0, 'before':'</br><p>'}
            ]
          }
        }
      };
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo',
        'info':{
          'movie': 'matrix',
          'job' : 'developer'
        }
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 8  ], str: '<xml><p>Thomas'},
        { pos:[ 15 ], str: '</p><p>A. Anderson'},
        { pos:[ 40 ], str: '</br><p>Neo'},
        { pos:[ 23 ], str: '</p><br>matrix'},
        { pos:[ 32 ], str: '</br><br>developer'},
        { pos:[ 41 ], str: '</p></xml>' }
      ]);
    });
    it('should work if the main object is an array of object', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr><p>'     },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1,                        },
              {'obj': '_root', 'attr':'lastname' , 'pos':20, 'depth':1, 'before' : '</p><p>'   },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</p></tr>'  }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson'},
        {'firstname':'Trinity',  'lastname':'Unknown'}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0        ], str: '<xml> '                           },
        { pos:[ 6, 0, 6 ], str: '<tr><p>'            , rowStart:true},
        { pos:[ 6, 0, 13 ], str: 'Thomas'            , rowShow:true },
        { pos:[ 6, 0, 20 ], str: '</p><p>A. Anderson', rowShow:true },
        { pos:[ 6, 0, 29 ], str: '</p></tr>'         , rowEnd:true  },
        { pos:[ 6, 1, 6 ] , str: '<tr><p>'           , rowStart:true},
        { pos:[ 6, 1, 13 ], str: 'Trinity'           , rowShow:true },
        { pos:[ 6, 1, 20 ], str: '</p><p>Unknown'    , rowShow:true },
        { pos:[ 6, 1, 29 ], str: '</p></tr>'         , rowEnd:true  },
        { pos:[ 30       ], str: ' </xml>'                          }
      ]);
    });
    it('should insert an empty string and set rowShow=false if the condition is not satisfied', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr><p>'     },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1                          , 'conditions':[{'left':{'parent':'_root','attr':'show'}, 'operator':'==', 'right':'1'}] },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</p></tr>'  }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson', 'show':'0'},
        {'firstname':'Trinity',  'lastname':'Unknown'    , 'show':'1'}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0        ], str: '<xml> '                  },
        { pos:[ 6, 0, 6 ], str: '<tr><p>'   , rowStart:true},
        { pos:[ 6, 0, 13 ], str: ''         , rowShow:false},
        { pos:[ 6, 0, 29 ], str: '</p></tr>', rowEnd:true  },
        { pos:[ 6, 1, 6 ] , str: '<tr><p>'  , rowStart:true},
        { pos:[ 6, 1, 13 ], str: 'Trinity'  , rowShow:true },
        { pos:[ 6, 1, 29 ], str: '</p></tr>', rowEnd:true  },
        { pos:[ 30       ], str: ' </xml>'                 }
      ]);
    });
    it('should work if there is an object in the array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'info1'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr>'       },
              {'obj': '_root', 'attr':'firstname', 'pos':10, 'depth':1, 'before':''           },
              {'obj': '_root', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>'    },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</p></tr>' }
            ]
          },
          'info1':{
            'name':'info',
            'parent' : '_root',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>'      }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson', 'info' : {'movie': 'matrix'} },
        {'firstname':'Trinity',  'lastname':'Unknown', 'info' : {'movie': 'matrix2'}}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [ 
        { pos: [ 0        ], str: '<xml> '                            },
        { pos: [ 6, 0, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 10 ], str: 'Thomas'             , rowShow:true },
        { pos: [ 6, 0, 20 ], str: '</p><p>A. Anderson' , rowShow:true },
        { pos: [ 6, 0, 29 ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 6, 0, 13 ], str: '<p>matrix'          , rowShow:true },
        { pos: [ 6, 1, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 1, 10 ], str: 'Trinity'            , rowShow:true },
        { pos: [ 6, 1, 20 ], str: '</p><p>Unknown'     , rowShow:true },
        { pos: [ 6, 1, 29 ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 6, 1, 13 ], str: '<p>matrix2'         , rowShow:true },
        { pos: [ 30       ], str: ' </xml>'                           } 
      ]);
    });
    it('should work if there are three nested objects in the array (with one missing object in the last row) ', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'info1', 'info2', 'info3'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr>'        },
              {'obj': '_root', 'attr':'firstname', 'pos':10, 'depth':1, 'before':''            },
              {'obj': '_root', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>'     },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</p></tr>'  }
            ]
          },
          'info1':{
            'name':'info',
            'parent' : '_root',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>' }
            ]
          },
          'info2':{
            'name':'info',
            'parent' : 'info1',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info2', 'attr':'style', 'pos':14, 'depth':1, 'before':'' }
            ]
          },
          'info3':{
            'name':'info',
            'parent' : 'info2',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info3', 'attr':'rate', 'pos':15, 'depth':1, 'before':'' }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson',
          'info' : {
            'movie': 'matrix',
            'info' : {
              'style' : 'sf',
              'info' : {
                'rate' : '10'
              }
            }
          }
        },
        {'firstname':'Trinity',  'lastname':'Unknown',
          'info' : {
            'movie': 'matrix2',
            'info' : {
              'style' : 'sf2'
            }
          }
        }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [ 
        { pos: [ 0        ], str: '<xml> '                            },
        { pos: [ 6, 0, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 10 ], str: 'Thomas'             , rowShow:true },
        { pos: [ 6, 0, 20 ], str: '</p><p>A. Anderson' , rowShow:true },
        { pos: [ 6, 0, 29 ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 6, 0, 13 ], str: '<p>matrix'          , rowShow:true },
        { pos: [ 6, 0, 14 ], str: 'sf'                 , rowShow:true },
        { pos: [ 6, 0, 15 ], str: '10'                 , rowShow:true },
        { pos: [ 6, 1, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 1, 10 ], str: 'Trinity'            , rowShow:true },
        { pos: [ 6, 1, 20 ], str: '</p><p>Unknown'     , rowShow:true },
        { pos: [ 6, 1, 29 ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 6, 1, 13 ], str: '<p>matrix2'         , rowShow:true },
        { pos: [ 6, 1, 14 ], str: 'sf2'                , rowShow:true },
        { pos: [ 6, 1, 15 ], str: ''                   , rowShow:true },
        { pos: [ 30       ], str: ' </xml>'                           } 
      ]);
    });
    it('should work if there are two adjacents array of objects', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'movies1', 'cars2'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : []
          },
          'movies1':{
            'name':'movies',
            'parent' : '_root',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :15},
            'xmlParts' : [
              {'obj': 'movies1', 'array':'start' , 'pos':6 , 'depth':1, 'after': '<tr>'  },
              {'obj': 'movies1', 'attr' :'title' , 'pos':10, 'depth':1, 'before':''      },
              {'obj': 'movies1', 'array':'end'   , 'pos':15, 'depth':1, 'before':'</tr>' }
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : '_root',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'cars2', 'array':'start' , 'pos':20, 'depth':1, 'after': '<trow>'  },
              {'obj': 'cars2', 'attr' :'brand' , 'pos':24, 'depth':1, 'before':''        },
              {'obj': 'cars2', 'array':'end'   , 'pos':29, 'depth':1, 'before': '</trow>'}
            ]
          }
        }
      };
      var _data = {
        'movies' : [
          {'title' : 'matrix' },
          {'title' : 'Lord of War' }
        ],
        'cars' : [
          {'brand' : 'Lumeneo' },
          {'brand' : 'Tesla motors' }
        ]
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [ 
        { pos: [ 0         ], str: '<xml> '                            },
        { pos: [ 6 , 0, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6 , 0, 10 ], str: 'matrix'             , rowShow:true },
        { pos: [ 6 , 0, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6 , 1, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6 , 1, 10 ], str: 'Lord of War'        , rowShow:true },
        { pos: [ 6 , 1, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 20, 0, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 20, 0, 24 ], str: 'Lumeneo'            , rowShow:true },
        { pos: [ 20, 0, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 20, 1, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 20, 1, 24 ], str: 'Tesla motors'       , rowShow:true },
        { pos: [ 20, 1, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 30        ], str: ' </xml>'                           } 
      ]);
    });
    it('Ashould work if there are two adjacents array of objects within main array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<x> ',
          'after' :' </x>'
        },
        'hierarchy'   : ['_root', 'movies1', 'cars2'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 4, 'end' :35},
            'xmlParts' : [
              {'obj': '_root', 'array':'start' , 'pos':4  , 'depth':1, 'after': '<tab>'  },
              {'obj': '_root', 'array':'end'   , 'pos':35 , 'depth':1, 'after': '</tab>'  },
            ]
          },
          'movies1':{
            'name':'movies',
            'parent' : '_root',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 6, 'end' :15},
            'xmlParts' : [
              {'obj': 'movies1', 'array':'start' , 'pos':6 , 'depth':2, 'after': '<tr>'  },
              {'obj': 'movies1', 'attr' :'title' , 'pos':10, 'depth':2, 'before':''      },
              {'obj': 'movies1', 'array':'end'   , 'pos':15, 'depth':2, 'before':'</tr>' }
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : '_root',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'cars2', 'array':'start' , 'pos':20, 'depth':2, 'after': '<trow>'  },
              {'obj': 'cars2', 'attr' :'brand' , 'pos':24, 'depth':2, 'before':''        },
              {'obj': 'cars2', 'array':'end'   , 'pos':29, 'depth':2, 'before': '</trow>'}
            ]
          }
        }
      };
      var _data = [{
        'movies' : [
          {'title' : 'matrix' },
          {'title' : 'Lord of War' }
        ],
        'cars' : [
          {'brand' : 'Lumeneo' },
          {'brand' : 'Tesla motors' }
        ]
      }];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = _fn(_data);
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [ 
        { pos: [ 0               ], str: '<x> '                              },
        { pos: [ 4, 0, 4         ], str: '<tab>'              , rowStart:true},
        { pos: [ 4, 0, 6 , 0, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 4, 0, 6 , 0, 10 ], str: 'matrix'             , rowShow:true },
        { pos: [ 4, 0, 6 , 0, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 4, 0, 6 , 1, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 4, 0, 6 , 1, 10 ], str: 'Lord of War'        , rowShow:true },
        { pos: [ 4, 0, 6 , 1, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 4, 0, 20, 0, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 4, 0, 20, 0, 24 ], str: 'Lumeneo'            , rowShow:true },
        { pos: [ 4, 0, 20, 0, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 4, 0, 20, 1, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 4, 0, 20, 1, 24 ], str: 'Tesla motors'       , rowShow:true },
        { pos: [ 4, 0, 20, 1, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 4, 0, 35        ], str: '</tab>'              , rowEnd:true },
        { pos: [ 36              ], str: ' </x>'                             } 
      ]);
    });
    it('should work if there are some xml between two adjacents arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'movies1', 'cars2'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : []
          },
          'movies1':{
            'name':'movies',
            'parent' : '_root',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :15},
            'before' : '<T>',
            'xmlParts' : [
              {'obj': 'movies1', 'array':'start' , 'pos':6 , 'depth':1, 'after': '<tr>'  },
              {'obj': 'movies1', 'attr' :'title' , 'pos':10, 'depth':1, 'before':''      },
              {'obj': 'movies1', 'array':'end'   , 'pos':15, 'depth':1, 'before':'</tr>' }
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : '_root',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 20, 'end' :29},
            'before' : '<T2>',
            'xmlParts' : [
              {'obj': 'cars2', 'array':'start' , 'pos':20, 'depth':1, 'after': '<trow>'  },
              {'obj': 'cars2', 'attr' :'brand' , 'pos':24, 'depth':1, 'before':''        },
              {'obj': 'cars2', 'array':'end'   , 'pos':29, 'depth':1, 'before': '</trow>'}
            ]
          }
        }
      };
      var _data = {
        'movies' : [
          {'title' : 'matrix' },
          {'title' : 'Lord of War' }
        ],
        'cars' : [
          {'brand' : 'Lumeneo' },
          {'brand' : 'Tesla motors' }
        ]
      };
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [ 
        { pos: [ 0         ], str: '<xml> '                            },
        { pos: [ 6         ], str: '<T>'                               },
        { pos: [ 6 , 0, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6 , 0, 10 ], str: 'matrix'             , rowShow:true },
        { pos: [ 6 , 0, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6 , 1, 6  ], str: '<tr>'               , rowStart:true},
        { pos: [ 6 , 1, 10 ], str: 'Lord of War'        , rowShow:true },
        { pos: [ 6 , 1, 15 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 20        ], str: '<T2>'               ,              },
        { pos: [ 20, 0, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 20, 0, 24 ], str: 'Lumeneo'            , rowShow:true },
        { pos: [ 20, 0, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 20, 1, 20 ], str: '<trow>'             , rowStart:true},
        { pos: [ 20, 1, 24 ], str: 'Tesla motors'       , rowShow:true },
        { pos: [ 20, 1, 29 ], str: '</trow>'            , rowEnd:true  },
        { pos: [ 30        ], str: ' </xml>'                           } 
      ]);
    });
    it('should manage nested arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'skills1'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'obj': '_root', 'array': 'start'  , 'pos':6 , 'depth':1, 'after': '<tr><p>'   },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1, 'before':'',         },
              {'obj': '_root', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>'   },
              {'obj': '_root', 'array': 'end'    , 'pos':38, 'depth':1, 'before':'</p></tr>' }
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : '_root',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'skills1', 'array': 'start', 'pos':20, 'depth':2, 'after': '<tr>'  },
              {'obj': 'skills1', 'attr':'name'   , 'pos':24, 'depth':2                   },
              {'obj': 'skills1', 'array': 'end'  , 'pos':29, 'depth':2, 'before':'</tr>' }
            ]
          }
        }
      };
      var _data = [{
          'firstname':'Thomas',
          'lastname':'A. Anderson',
          'skills':[
            {'name' : 'survive'},
            {'name' : 'walk on the walls'}
          ]
        },{
          'firstname':'Trinity',
          'lastname':'Unknown',
          'skills':[
            {'name' : 'hack'}
          ]
        }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = _fn(_data);
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [ 
        { pos: [ 0               ], str: '<xml> '                            },
        { pos: [ 6, 0, 6         ], str: '<tr><p>'            , rowStart:true},
        { pos: [ 6, 0, 13        ], str: 'Thomas'             , rowShow:true },
        { pos: [ 6, 0, 20        ], str: '</p><p>A. Anderson' , rowShow:true },
        { pos: [ 6, 0, 20, 0, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 20, 0, 24 ], str: 'survive'            , rowShow:true },
        { pos: [ 6, 0, 20, 0, 29 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 0, 20, 1, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 20, 1, 24 ], str: 'walk on the walls'  , rowShow:true },
        { pos: [ 6, 0, 20, 1, 29 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 0, 38        ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 6, 1, 6         ], str: '<tr><p>'            , rowStart:true},
        { pos: [ 6, 1, 13        ], str: 'Trinity'            , rowShow:true },
        { pos: [ 6, 1, 20        ], str: '</p><p>Unknown'     , rowShow:true },
        { pos: [ 6, 1, 20, 0, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 1, 20, 0, 24 ], str: 'hack'               , rowShow:true },
        { pos: [ 6, 1, 20, 0, 29 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 1, 38        ], str: '</p></tr>'          , rowEnd:true  },
        { pos: [ 39              ], str: ' </xml>' } ]
      );
    });
    it('should manage three level of arrays.\
        It should not crash if the third array is empty or does not exist\
        It should keep the xml which is between the second and the third array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'skills1', 'when2'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :48},
            'xmlParts' : [
              {'obj': '_root', 'array': 'start'  , 'pos':6 , 'depth':1, 'after': '<tr><p>'   },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1, 'before':'',         },
              {'obj': '_root', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>'   },
              {'obj': '_root', 'array': 'end'    , 'pos':48, 'depth':1, 'before':'</p></tr>' }
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : '_root',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 20, 'end' :39},
            'xmlParts' : [
              {'obj': 'skills1', 'array': 'start', 'pos':20, 'depth':2, 'after': '<tr>'  },
              {'obj': 'skills1', 'attr':'name'   , 'pos':24, 'depth':2                   },
              {'obj': 'skills1', 'array': 'end'  , 'pos':39, 'depth':2, 'before':'</tr>' }
            ]
          },
          'when2':{
            'name':'when',
            'parent' : 'skills1',
            'type': 'array',
            'depth' : 3,
            'position' : {'start': 25, 'end' :34},
            'before' : '<days>',
            'xmlParts' : [
              {'obj': 'when2', 'array': 'start', 'pos':25, 'depth':3, 'after': '<d>'  },
              {'obj': 'when2', 'attr' : 'day'  , 'pos':28, 'depth':3                   },
              {'obj': 'when2', 'array': 'end'  , 'pos':34, 'depth':3, 'before':'</d>' }
            ]
          }
        }
      };
      var _data = [{
          'firstname':'Thomas',
          'lastname':'A. Anderson',
          'skills':[
            {
              'name' : 'survive',
              'when' : [
                {'day':'monday'},
                {'day':'thursday'},
                {'day':'friday'}
              ]
            },
            {'name' : 'walk on the walls'}
          ]
        },{
          'firstname':'Trinity',
          'lastname':'Unknown',
          'skills':[
            {'name' : 'hack'}
          ]
        }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = _fn(_data);
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [ 
        { pos: [ 0 ], str: '<xml> '                                          },
        { pos: [ 6, 0, 6 ], str: '<tr><p>'                    , rowStart:true},
        { pos: [ 6, 0, 13 ], str: 'Thomas'                    , rowShow:true },
        { pos: [ 6, 0, 20 ], str: '</p><p>A. Anderson'        , rowShow:true },
        { pos: [ 6, 0, 20, 0, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 20, 0, 24 ], str: 'survive'            , rowShow:true },
        { pos: [ 6, 0, 20, 0, 25 ], str: '<days>'                            },
        { pos: [ 6, 0, 20, 0, 25, 0, 25 ], str: '<d>'         , rowStart:true},
        { pos: [ 6, 0, 20, 0, 25, 0, 28 ], str: 'monday'      , rowShow:true },
        { pos: [ 6, 0, 20, 0, 25, 0, 34 ], str: '</d>'        , rowEnd:true  },
        { pos: [ 6, 0, 20, 0, 25, 1, 25 ], str: '<d>'         , rowStart:true},
        { pos: [ 6, 0, 20, 0, 25, 1, 28 ], str: 'thursday'    , rowShow:true },
        { pos: [ 6, 0, 20, 0, 25, 1, 34 ], str: '</d>'        , rowEnd:true  },
        { pos: [ 6, 0, 20, 0, 25, 2, 25 ], str: '<d>'         , rowStart:true},
        { pos: [ 6, 0, 20, 0, 25, 2, 28 ], str: 'friday'      , rowShow:true },
        { pos: [ 6, 0, 20, 0, 25, 2, 34 ], str: '</d>'        , rowEnd:true  },
        { pos: [ 6, 0, 20, 0, 39 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 0, 20, 1, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 0, 20, 1, 24 ], str: 'walk on the walls'  , rowShow:true },
        { pos: [ 6, 0, 20, 1, 25 ], str: '<days>'                            },
        { pos: [ 6, 0, 20, 1, 39 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 0, 48 ], str: '</p></tr>'                 , rowEnd:true  },
        { pos: [ 6, 1, 6 ], str: '<tr><p>'                    , rowStart:true},
        { pos: [ 6, 1, 13 ], str: 'Trinity'                   , rowShow:true },
        { pos: [ 6, 1, 20 ], str: '</p><p>Unknown'            , rowShow:true },
        { pos: [ 6, 1, 20, 0, 20 ], str: '<tr>'               , rowStart:true},
        { pos: [ 6, 1, 20, 0, 24 ], str: 'hack'               , rowShow:true },
        { pos: [ 6, 1, 20, 0, 25 ], str: '<days>'                            },
        { pos: [ 6, 1, 20, 0, 39 ], str: '</tr>'              , rowEnd:true  },
        { pos: [ 6, 1, 48 ], str: '</p></tr>'                 , rowEnd:true  },
        { pos: [ 49 ], str: ' </xml>' } ]
      );
    });
    it('should work with a custom iterator. It should keep the array interator', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'iterator' : {'attr': 'sort'},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr>'     },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1,                        },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</tr>'  }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' , 'sort':31},
        {'firstname':'Trinity', 'sort':11}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0            ], str: '<xml> '                   },
        { pos:[ 6, 31, 0, 6  ], str: '<tr>'      , rowStart:true},
        { pos:[ 6, 31, 0, 13 ], str: 'Thomas'    , rowShow:true },
        { pos:[ 6, 31, 0, 29 ], str: '</tr>'     , rowEnd:true  },
        { pos:[ 6, 11, 1, 6  ], str: '<tr>'      , rowStart:true},
        { pos:[ 6, 11, 1, 13 ], str: 'Trinity'   , rowShow:true },
        { pos:[ 6, 11, 1, 29 ], str: '</tr>'     , rowEnd:true  },
        { pos:[ 30           ], str: ' </xml>'                  }
      ]);
    });
    it('should work even if the custom iterator is inside an object', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'iterator' : {'obj': 'movie', 'attr':'sort'},
            'xmlParts' : [
              {'obj': '_root', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr>'     },
              {'obj': '_root', 'attr':'firstname', 'pos':13, 'depth':1,                        },
              {'obj': '_root', 'array':'end'     , 'pos':29, 'depth':1, 'before': '</tr>'  }
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' , 'movie':{'sort':31}},
        {'firstname':'Trinity', 'movie':{'sort':11}}
      ];
      var _fn = builder.getBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0              ], str: '<xml> '                 },
        { pos:[ 6, 31, 0, 6  ], str: '<tr>'      , rowStart:true},
        { pos:[ 6, 31, 0, 13 ], str: 'Thomas'    , rowShow:true },
        { pos:[ 6, 31, 0, 29 ], str: '</tr>'     , rowEnd:true  },
        { pos:[ 6, 11, 1, 6  ], str: '<tr>'      , rowStart:true},
        { pos:[ 6, 11, 1, 13 ], str: 'Trinity'   , rowShow:true },
        { pos:[ 6, 11, 1, 29 ], str: '</tr>'     , rowEnd:true  },
        { pos:[ 30             ], str: ' </xml>'                }
      ]);
    });
    it('should work even with two nested arrays used in the inverse order. TODO: IMPROVE', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['_root', 'skills1'],
        'dynamicData' : {
          '_root':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 13, 'end' :22},
            'xmlParts' : [
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : '_root',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'obj': 'skills1', 'array':'start' , 'pos':6 , 'depth':1 , 'after' : '<tr>' },
              {'obj': '_root'  , 'array': 'start', 'pos':13, 'depth':2, 'after': '<td>'  },
              {'obj': 'skills1', 'attr' :'name'  , 'pos':15 , 'depth':2, 'before': ''     },
              {'obj': '_root'  , 'array': 'end'  , 'pos':22, 'depth':2, 'before':'</td>' },
              {'obj': 'skills1', 'array':'end'   , 'pos':38 , 'depth':1, 'before': '</tr>'}
            ]
          }
        }
      };
      var _data = [{
          'firstname':'Thomas',
          'lastname':'A. Anderson',
          'skills':[
            {'name' : 'skill1_1'},
            {'name' : 'skill1_2'},
            {'name' : 'skill1_3'}
          ]
        },{
          'firstname':'Trinity',
          'lastname':'Unknown',
          'skills':[
            {'name' : 'skill2_1'},
            {'name' : 'skill2_2'},
            {'name' : 'skill2_3'}
          ]
        }
      ];
      var _fn = builder.getBuilderFunction(_desc);
      var _xmlParts = _fn(_data);
      builder.sortXmlParts(_xmlParts, 100);
      helper.assert(_xmlParts, [ 
        { pos: [ 0              ], str: '<xml> '                   },
        { pos: [ 6, 0, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 0, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 0, 6, 0, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 0, 6, 0, 15 ], str: 'skill1_1'  , rowShow:true },
        { pos: [ 6, 0, 6, 0, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 0, 6, 1, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 0, 6, 1, 15 ], str: 'skill2_1'  , rowShow:true },
        { pos: [ 6, 0, 6, 1, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 0, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 6, 0, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 6, 1, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 1, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 1, 6, 0, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 1, 6, 0, 15 ], str: 'skill1_2'  , rowShow:true },
        { pos: [ 6, 1, 6, 0, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 1, 6, 1, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 1, 6, 1, 15 ], str: 'skill2_2'  , rowShow:true },
        { pos: [ 6, 1, 6, 1, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 1, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 6, 1, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 6, 2, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 2, 6        ], str: '<tr>'      , rowStart:true},
        { pos: [ 6, 2, 6, 0, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 2, 6, 0, 15 ], str: 'skill1_3'  , rowShow:true },
        { pos: [ 6, 2, 6, 0, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 2, 6, 1, 13 ], str: '<td>'      , rowStart:true},
        { pos: [ 6, 2, 6, 1, 15 ], str: 'skill2_3'  , rowShow:true },
        { pos: [ 6, 2, 6, 1, 22 ], str: '</td>'     , rowEnd:true  },
        { pos: [ 6, 2, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 6, 2, 38       ], str: '</tr>'     , rowEnd:true  },
        { pos: [ 39            ], str: ' </xml>'                   } 
      ]);
    });

  });


});


