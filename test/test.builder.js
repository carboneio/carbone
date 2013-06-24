var assert = require('assert');
var carbone = require('../lib/index');
var builder = require('../lib/builder');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('builder', function(){

  describe('getFormatterString', function(){
    it('should return a simple call of a function for a formatter without arguments', function(){
      var actual = builder.getFormatterString('d.number', [ 'int' ]);
      assert.equal(actual, 'formatters.int(d.number)');
    });
    it('should return a simple call of a function for a formatter without arguments but called with parenthesis', function(){
      var actual = builder.getFormatterString('d.number', [ 'int()' ]);
      assert.equal(actual, 'formatters.int(d.number)');
    });
    it('should return a call of a function for a formatter with one argument', function(){
      var actual = builder.getFormatterString('d.number', [ 'toFixed(2)' ]);
      assert.equal(actual, 'formatters.toFixed(d.number, \'2\')');
    });
    it('should return a call of a function for a formatter with one argument which is a string', function(){
      var actual = builder.getFormatterString('d.date', [ "format(YYYYMMDD)" ]);
      assert.equal(actual, "formatters.format(d.date, 'YYYYMMDD')");
    });
    it('should return a call of a function for a formatter with two arguments', function(){
      var actual = builder.getFormatterString('d.number', [ 'formatter(2, 3)' ]);
      assert.equal(actual, 'formatters.formatter(d.number, \'2\', \'3\')');
    });
    it('should return two calls of functions for two chained formatters', function(){
      var actual = builder.getFormatterString('d.number', [ 'int', 'toFixed(2)' ]);
      assert.equal(actual, 'formatters.toFixed(formatters.int(d.number), \'2\')');
    });
    it('should return two calls of functions for two chained formatters each with arguments', function(){
      var actual = builder.getFormatterString('d.number', [ 'formatter1(4, 5)', 'formatter2(2, 3)' ]);
      assert.equal(actual, 'formatters.formatter2(formatters.formatter1(d.number, \'4\', \'5\'), \'2\', \'3\')');
    });
  });

  describe('sortXmlParts', function(){
    it('should sort the array with a depth of 1 by default', function(){
      var _data     = [{'pos':[40]}, {'pos':[19]}, {'pos':[2 ]}, {'pos':[20]}];
      var _expected = [{'pos':[2 ]}, {'pos':[19]}, {'pos':[20]}, {'pos':[40]}];
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

    it('should sort a complex array (sort depth of 3) of xml parts and return an concatenate string', function(){
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
  });

  describe('assembleXmlParts', function(){
    it('should sort the array of xml parts and return an concatenate string', function(){
      var _data     = [
        {'pos':[40], 'str': '4'}, 
        {'pos':[19], 'str': '2'}, 
        {'pos':[2 ], 'str': '1'}, 
        {'pos':[20], 'str': '3'}
      ];
      helper.assert(builder.assembleXmlParts(_data), '1234');
    });

    it('should sort a complex array (sort depth of 3) of xml parts and return an concatenate string', function(){
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

    it('should sort a complex array (sort depth of 3) of xml parts and return an concatenate string', function(){
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
  });

  describe('generateXmlParts', function(){
    it('should return return an array of xml parts for static data if dynamicData is empty', function(){
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
    it('should return a function which return an array of xml parts according to the descriptor and the data and the formatters', function(done){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</xml>'
        },
        'hierarchy'   : ['d'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'd', 'attr':'number', 'pos':5 , 'depth':0, 'before':'<xml>', 'after': '', 'formatters' : [ 'int' ]}
            ]
          }
        }
      };
      var _data = {
        'number' : 24.55
      };
      var _fn = builder.getBuilderFunction(_desc);
      carbone.cacheFormatters(function(){
        helper.assert(_fn(_data, carbone.formatters), [{
            pos: [5  ],
            str: '<xml>24'
          },{
            pos: [6 ],
            str: '</xml>'
          }]
        );
        done();
      });
    });
    it('should return a function which return an array of xml parts according to the descriptor and the data', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['d'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':8 , 'depth':0, 'before':'<xml><p>', 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'surname'  , 'pos':22, 'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []}
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
      helper.assert(_fn(_data), [{
          pos: [8  ],
          str: '<xml><p>Thomas'
        },{
          pos: [15 ],
          str: '</p><p>A. Anderson'
        },{
          pos: [22 ],
          str: '</p><p>Neo'
        },{
          pos: [23 ],
          str: '</p></xml>'
        }]
      );
    });
    it('should return only the xml if the data is empty or null or if one of the attribute does not exist', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['d'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':8 , 'depth':0, 'before':'<xml><p>', 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'surname'  , 'pos':22, 'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []}
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
    it('should works even if there is a nested object in the descriptor', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['d', 'info1'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':8,  'depth':0, 'before':'<xml><p>', 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'lastname' , 'pos':15, 'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'surname'  , 'pos':40, 'depth':0, 'before':'</br><p>', 'after': '', 'formatters' : []}
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23, 'depth':0,  'before':'</p><br>' , 'after': '', 'formatters' : [] },
              {'obj': 'info1', 'attr':'job'  , 'pos':32, 'depth':0,  'before':'</br><br>', 'after': '', 'formatters' : [] }
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
      helper.assert(_fn(_data), [{
          pos: [ 8 ],
          str: '<xml><p>Thomas'
        },{
          pos: [ 15 ],
          str: '</p><p>A. Anderson'
        },{
          pos: [ 40 ],
          str: '</br><p>Neo'
        },{
          pos: [ 23 ],
          str: '</p><br>matrix'
        },{
          pos: [ 32 ],
          str: '</br><br>developer'
        },{
          pos: [ 41 ],
          str: '</p></xml>'
        }
      ]);
    });
    it('should travel the object in the correct order using the "hierarchy" array even if the dynamicData object is not declared in correct order', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['d', 'info1'],
        'dynamicData' : {
          'info1':{
            'name':'info',
            'parent' : 'd',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23,  'depth':0, 'before':'</p><br>' , 'after': '', 'formatters' : [] },
              {'obj': 'info1', 'attr':'job'  , 'pos':32,  'depth':0, 'before':'</br><br>', 'after': '', 'formatters' : [] }
            ]
          },
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'depth':0,
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':8,   'depth':0, 'before':'<xml><p>', 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'lastname' , 'pos':15,  'depth':0, 'before':'</p><p>' , 'after': '', 'formatters' : []},
              {'obj': 'd', 'attr':'surname'  , 'pos':40,  'depth':0, 'before':'</br><p>', 'after': '', 'formatters' : []}
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
    it('should works if the main object is an array of object', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd', 'array':'start'   , 'pos':6 , 'depth':1, 'after': '<tr><p>'  },
              {'obj': 'd', 'attr':'firstname', 'pos':13, 'depth':1, 'after' : '</p><p>' },
              {'obj': 'd', 'attr':'lastname' , 'pos':20, 'depth':1  },
              {'obj': 'd', 'array':'end'     , 'pos':29, 'depth':1,  'before': '</p></tr>'  }
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
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6, 0, 6 ], str: '<tr><p>'},
        { pos:[ 6, 0, 13 ], str: 'Thomas</p><p>'},
        { pos:[ 6, 0, 20 ], str: 'A. Anderson'},
        { pos:[ 6, 0, 29 ], str: '</p></tr>'},
        { pos:[ 6, 1, 6 ] , str: '<tr><p>'},
        { pos:[ 6, 1, 13 ], str: 'Trinity</p><p>'},
        { pos:[ 6, 1, 20 ], str: 'Unknown'},
        { pos:[ 6, 1, 29 ], str: '</p></tr>'},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('should works if there is an object in the array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'info1'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':10, 'depth':1, 'before':'<tr>', 'after': ''           },
              {'obj': 'd', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  }
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>', 'after': ''    }
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
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6, 0, 10 ], str: '<tr>Thomas'},
        { pos:[ 6, 0, 20 ], str: '</p><p>A. Anderson</p></tr>'},
        { pos:[ 6, 0, 13 ], str: '<p>matrix'},
        { pos:[ 6, 1, 10 ], str: '<tr>Trinity'},
        { pos:[ 6, 1, 20 ], str: '</p><p>Unknown</p></tr>'},
        { pos:[ 6, 1, 13 ], str: '<p>matrix2'},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('should works if there are three nested objects in the array (with one missing object in the last row) ', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'info1', 'info2', 'info3'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':10, 'depth':1, 'before':'<tr>', 'after': ''           },
              {'obj': 'd', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  }
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>', 'after': ''    }
            ]
          },
          'info2':{
            'name':'info',
            'parent' : 'info1',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info2', 'attr':'style', 'pos':14, 'depth':1, 'before':'', 'after': ''    }
            ]
          },
          'info3':{
            'name':'info',
            'parent' : 'info2',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info3', 'attr':'rate', 'pos':15, 'depth':1, 'before':'', 'after': ''    }
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
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6, 0, 10 ], str: '<tr>Thomas'},
        { pos:[ 6, 0, 20 ], str: '</p><p>A. Anderson</p></tr>'},
        { pos:[ 6, 0, 13 ], str: '<p>matrix'},
        { pos:[ 6, 0, 14 ], str: 'sf'},
        { pos:[ 6, 0, 15 ], str: '10'},
        { pos:[ 6, 1, 10 ], str: '<tr>Trinity'},
        { pos:[ 6, 1, 20 ], str: '</p><p>Unknown</p></tr>'},
        { pos:[ 6, 1, 13 ], str: '<p>matrix2'},
        { pos:[ 6, 1, 14 ], str: 'sf2'},
        { pos:[ 6, 1, 15 ], str: ''},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('should works if there are two adjacents array of objects', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'movies1', 'cars2'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : []
          },
          'movies1':{
            'name':'movies',
            'parent' : 'd',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :15},
            'xmlParts' : [
              {'obj': 'movies1', 'attr':'title', 'pos':10, 'depth':1, 'before':'<tr>', 'after': '</tr>'    }
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : 'd',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'cars2', 'attr':'brand', 'pos':24, 'depth':1, 'before':'<trow>', 'after': '</trow>'  }
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
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6 , 0, 10 ], str: '<tr>matrix</tr>'},
        { pos:[ 6 , 1, 10 ], str: '<tr>Lord of War</tr>'},
        { pos:[ 20, 0, 24 ], str: '<trow>Lumeneo</trow>'},
        { pos:[ 20, 1, 24 ], str: '<trow>Tesla motors</trow>'},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('2 should works if there are two adjacents array of objects and some xml data in between', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'movies1', 'cars2'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : []
          },
          'movies1':{
            'name':'movies',
            'parent' : 'd',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :15},
            'before' : '<T>',
            'xmlParts' : [
              {'obj': 'movies1', 'attr':'title', 'pos':10, 'depth':1, 'before':'<tr>', 'after': '</tr>'    }
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : 'd',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'cars2', 'attr':'brand', 'pos':24, 'depth':1, 'before':'<trow>', 'after': '</trow>'  }
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
        { pos:[ 0         ], str: '<xml> '},
        { pos:[ 6         ], str: '<T>'},
        { pos:[ 6 , 0, 10 ], str: '<tr>matrix</tr>'},
        { pos:[ 6 , 1, 10 ], str: '<tr>Lord of War</tr>'},
        { pos:[ 20, 0, 24 ], str: '<trow>Lumeneo</trow>'},
        { pos:[ 20, 1, 24 ], str: '<trow>Tesla motors</trow>'},
        { pos:[ 30        ], str: ' </xml>' }
      ]);
    });
    it('should works even with two nested arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'skills1'],
        'dynamicData' : {
          'd':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'obj': 'd', 'attr':'firstname', 'pos':13, 'depth':1, 'before':'<tr><p>', 'after': ''            },
              {'obj': 'd', 'attr':'lastname' , 'pos':29, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  }
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : 'd',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 13, 'end' :22},
            'xmlParts' : [
              {'obj': 'skills1', 'attr':'name', 'pos':17, 'depth':2, 'before':'<tr>', 'after': '</tr>'}
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
      helper.assert(_fn(_data), [{
          pos: [ 0 ],
          str: '<xml> '
        },{
          pos: [ 6, 0, 13 ],
          str: '<tr><p>Thomas'
        },{
          pos: [ 6, 0, 29 ],
          str: '</p><p>A. Anderson</p></tr>'
        },{
          pos: [ 6, 0, 17, 0 ],
          str: '<tr>survive</tr>'
        },{
          pos: [ 6, 0, 17, 1 ],
          str: '<tr>walk on the walls</tr>'
        },{
          pos: [ 6, 1, 13 ],
          str: '<tr><p>Trinity'
        },{
          pos: [ 6, 1, 29 ],
          str: '</p><p>Unknown</p></tr>'
        },{
          pos: [ 6, 1, 17, 0 ],
          str: '<tr>hack</tr>'
        },{
          pos: [ 39 ],
          str: ' </xml>'
        }
      ]);
    });
    it('should works even with two nested arrays used in the inverse order', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d', 'skills1'],
        'dynamicData' : {
          'd':{
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
            'parent' : 'd',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'obj': 'skills1', 'attr':''    , 'pos': 6 , 'depth':1, 'before':'<tr>', 'after': '' },
              {'obj': 'skills1', 'attr':'name', 'pos': 15, 'depth':2, 'before':'<td>'   , 'after': '</td>'     },
              {'obj': 'skills1', 'attr':''    , 'pos': 35, 'depth':1, 'after':'</tr>', 'before': '' }
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
      helper.assert(_fn(_data), [
        { pos: [ 0            ], str: '<xml> ' },
        { pos: [ 13, 0, 6     ], str: '<tr>' },
        { pos: [ 13, 0, 15, 0 ], str: '<td>skill1_1</td>' },
        { pos: [ 13, 0, 35    ], str: '</tr>' },
        { pos: [ 13, 1, 6     ], str: '<tr>' },
        { pos: [ 13, 1, 15, 0 ], str: '<td>skill1_2</td>' },
        { pos: [ 13, 1, 35    ], str: '</tr>' },
        { pos: [ 13, 2, 6     ], str: '<tr>' },
        { pos: [ 13, 2, 15, 0 ], str: '<td>skill1_3</td>' },
        { pos: [ 13, 2, 35    ], str: '</tr>' },
        { pos: [ 13, 0, 6     ], str: '<tr>' },
        { pos: [ 13, 0, 15, 1 ], str: '<td>skill2_1</td>' },
        { pos: [ 13, 0, 35    ], str: '</tr>' },
        { pos: [ 13, 1, 6     ], str: '<tr>' },
        { pos: [ 13, 1, 15, 1 ], str: '<td>skill2_2</td>' },
        { pos: [ 13, 1, 35    ], str: '</tr>' },
        { pos: [ 13, 2, 6     ], str: '<tr>' },
        { pos: [ 13, 2, 15, 1 ], str: '<td>skill2_3</td>' },
        { pos: [ 13, 2, 35    ], str: '</tr>' },
        { pos: [ 39           ], str: ' </xml>' }
      ]);
    });

  });


});


