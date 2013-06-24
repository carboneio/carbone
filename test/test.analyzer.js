var assert = require('assert');
var carbone = require('../lib/index');
var analyzer = require('../lib/analyzer');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Analyzer', function(){


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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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
      var _fn = analyzer.getXMLBuilderFunction(_desc);
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

  describe('decomposeTags', function(){
    it('should return an empty descriptor if there are no tags', function(){
      var _tags = [];
      helper.assert(analyzer.decomposeTags(_tags), {});
    });
    it('should create a descriptor which be used to build the xml generator', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':20}
          ]
        }
      });
    });
    it('should detect multiple attributes', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site'},
        {'pos': 30, 'name': 'd.name'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':20},
            {'attr':'name', 'formatters' : [], 'obj': 'd', 'pos':30}
          ]
        }
      });
    });
    it('should accept two levels of object', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site.name'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : []
        },
        'dsite':{
          'name':'site',
          'type': 'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'name', 'formatters' : [], 'obj': 'dsite', 'pos':20},
          ]
        }
      });
    });
    it('should accept two levels of object and many attributes', function(){
      var _tags = [
        {'pos': 10, 'name': 'd.movie'},
        {'pos': 20, 'name': 'd.site.name'},
        {'pos': 30, 'name': 'd.site.id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'movie', 'formatters' : [], 'obj': 'd', 'pos':10}
          ]
        },
        'dsite':{
          'name':'site',
          'type': 'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'name', 'formatters' : [], 'obj': 'dsite', 'pos':20},
            {'attr':'id'  , 'formatters' : [], 'obj': 'dsite', 'pos':30}
          ]
        }
      });
    });
    it('should manage arrays', function(){
      var _tags = [
        {'pos': 20, 'name': 'd[i].site'},
        {'pos': 30, 'name': 'd[i+1].site'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name': 'd',
          'type': 'array',
          'parent':'',
          'position': { 'start': 20, 'end': 30 },
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':20}
          ]
        }
      });
    });
    it('should manage arrays with nested objects', function(){
      var _tags = [
        {'pos': 20, 'name': 'd[i].site.id'},
        {'pos': 25, 'name': 'd[i].movie'},
        {'pos': 30, 'name': 'd[i+1].site.id'},
        {'pos': 35, 'name': 'd[i+1].movie'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name': 'd',
          'type': 'array',
          'parent':'',
          'position': { 'start': 20, 'end': 30 },
          'xmlParts' : [
            {'attr':'movie', 'formatters' : [], 'obj': 'd', 'pos':25}
          ]
        },
        'dsite':{
          'name': 'site',
          'type': 'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dsite', 'pos':20}
          ]
        }
      });
    });
    it('should manage arrays within an object', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site[i].id'},
        {'pos': 30, 'name': 'd.site[i+1].id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name': 'd',
          'type': 'object',
          'parent':'',
          'xmlParts' : []
        },
        'dsite':{
          'name': 'site',
          'type': 'array',
          'parent':'d',
          'position': { 'start': 20, 'end': 30 },
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dsite', 'pos':20}
          ]
        }
      });
    });
    it('should manage arrays even if there are some attributes aside', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site[i].id'},
        {'pos': 28, 'name': 'd.movie'},
        {'pos': 30, 'name': 'd.site[i+1].id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name': 'd',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'movie', 'formatters' : [], 'obj': 'd', 'pos':28}
          ]
        },
        'dsite':{
          'name': 'site',
          'type': 'array',
          'parent':'d',
          'position': { 'start': 20, 'end': 30 },
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dsite', 'pos':20}
          ]
        }
      });
    });
    it('54should manage nested arrays', function(){
      var _tags = [
        {'pos': 1 , 'name': 'd.menu[i].id'},
        {'pos': 10, 'name': 'd.menu[i].cars'},
        {'pos': 20, 'name': 'd.menu[i].menuElement[i].id'},
        {'pos': 30, 'name': 'd.menu[i].menuElement[i+1].id'},
        {'pos': 40, 'name': 'd.menu[i+1].id'},
        {'pos': 50, 'name': 'd.menu[i+1].cars'},
        {'pos': 60, 'name': 'd.menu[i+1].menuElement[i].id'},
        {'pos': 70, 'name': 'd.menu[i+1].menuElement[i+1].id'},
        {'pos': 80, 'name': 'd.site'},
        {'pos': 90, 'name': 'd.product.id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type':'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':80}
          ]
        },
        'dmenu':{
          'name':'menu',
          'type':'array',
          'parent':'d',
          'position': {'start':1, 'end':40},
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dmenu', 'pos':1},
            {'attr':'cars', 'formatters' : [], 'obj': 'dmenu', 'pos':10}
          ]
        },
        'dmenumenuElement':{
          'name':'menuElement',
          'type':'array',
          'parent':'dmenu',
          'position': {'start':20, 'end':30},
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dmenumenuElement', 'pos':20}
          ]
        },
        'dproduct':{
          'name':'product',
          'type':'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dproduct', 'pos':90}
          ]
        }
      });
    });
    it('2 inverse order should decompose all tags', function(){
      var _tags = [
        {'pos': 10, 'name': 'd.menu[i].menuElement[i].id'},
        {'pos': 20, 'name': 'd.menu[i+1].menuElement[i].id'},
        {'pos': 30, 'name': 'd.menu[i].menuElement[i+1].id'},
        {'pos': 40, 'name': 'd.menu[i+1].menuElement[i+1].id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : []
        },
        'dmenu':{
          'name':'menu',
          'type':'array',
          'parent':'d',
          'position': {'start':10, 'end':20},
          'xmlParts' : []
        },
        'dmenumenuElement':{
          'name':'menuElement',
          'type':'array',
          'parent':'dmenu',
          'position': {'start':10, 'end':30},
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dmenumenuElement', 'pos':10}
          ]
        }
      });
    });
    it.skip('2 should decompose all tags even if there are some objects within the array', function(){
      var _tags = [
        {'pos': 1  , 'name': 'd.menu[i].id'},
        {'pos': 10 , 'name': 'd.menu[i].cars'},
        {'pos': 20 , 'name': 'd.site'},
        {'pos': 30 , 'name': 'd.product.id'},
        {'pos': 40 , 'name': 'd.menu[i].menuElement[0].id'},
        {'pos': 50 , 'name': 'd.menu[i+1].id'},
        {'pos': 60 , 'name': 'd.menu[i+1].menuElement[0].id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':20}
          ]
        },
        'dmenu':{
          'name':'menu',
          'type':'array',
          'parent':'d',
          'position': { 'start': 1, 'end': 50 },
          'xmlParts' : [
            {'attr':'id'  , 'formatters' : [], 'obj': 'dmenu', 'pos':1},
            {'attr':'cars', 'formatters' : [], 'obj': 'dmenu', 'pos':10}
          ]
        },
        'dproduct':{
          'name':'product',
          'type':'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dproduct', 'pos':30}
          ]
        },
        'dmenumenuElement':{
          'name':'menuElement',
          'type':'array',
          'parent':'dmenu',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dmenumenuElement' ,'pos':40, 'condition':0}
          ]
        }
      });
    });
    it('should manage multidimensional arrays and multiple arrays', function(){
      var _tags = [
        {'pos': 1 , 'name': 'd.menu[i][i].id'},
        {'pos': 2 , 'name': 'd.menu[i][i+1].id'},
        {'pos': 3 , 'name': 'd.menu[i+1][i].id'},
        {'pos': 4 , 'name': 'd.menu[i+1][i+1].id'},
        {'pos': 5 , 'name': 'd.product.id'},
        {'pos': 6 , 'name': 'd.days[i].name'},
        {'pos': 7 , 'name': 'd.days[i+1].name'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : []
        },
        'dmenu':{
          'name':'menu',
          'type':'array',
          'parent':'d',
          'position': {'start': 1, 'end': 3 },
          'xmlParts' : []
        },
        'dmenu_':{
          'name':'',
          'type':'array',
          'parent':'dmenu',
          'position':{'start': 1, 'end': 2 },
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dmenu_', 'pos':1}
          ]
        },
        'dproduct':{
          'name':'product',
          'type':'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'dproduct', 'pos':5}
          ]
        },
        'ddays':{
          'name':'days',
          'type':'array',
          'parent':'d',
          'position':{'start': 6, 'end': 7 },
          'xmlParts' : [
            {'attr':'name', 'formatters' : [], 'obj': 'ddays', 'pos':6}
          ]
        }
      });
    });
    it.skip('should decompose even with very complex arrays', function(){
      var _tags = [
        {'pos': 1 , 'name': 'd.menu[1][0][1].product[0].site.id'},
        {'pos': 2 , 'name': 'd.product.id'},
        {'pos': 3 , 'name': 'd.cars.product.id'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'',
          'type': 'object',
          'parent':'',
          'xmlParts' : []
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d',
          'xmlParts' : []
        },
        'menu2':{
          'name':'menu',
          'type':'array',
          'parent':'menu1',
          'xmlParts' : []
        },
        'menu3':{
          'name':'menu',
          'type':'array',
          'parent':'menu2',
          'xmlParts' : []
        },
        'product4':{
          'name':'product',
          'type':'array',
          'parent':'menu3',
          'xmlParts' : []
        },
        'site5':{
          'name':'site',
          'type':'object',
          'parent':'product4',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'site5', 'pos':1}
          ]
        },
        'product6':{
          'name':'product',
          'type':'object',
          'parent':'d',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'product6', 'pos':2}
          ]
        },
        'cars7':{
          'name':'cars',
          'type':'object',
          'parent':'d',
          'xmlParts' : []
        },
        'product8':{
          'name':'product',
          'type':'object',
          'parent':'cars7',
          'xmlParts' : [
            {'attr':'id', 'formatters' : [], 'obj': 'product8', 'pos':3}
          ]
        }
      });
    });
    it('should extract basic formatters', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.number:int'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'number', 'formatters' : [ 'int' ], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it('should extract basic three formatters', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.number:int:float:decimal'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'number', 'formatters' : [ 'int' ,'float', 'decimal' ], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it('should ignore whitespaces in formatters', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.number : int  :   float   :  decimal'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'number', 'formatters' : [ 'int' ,'float', 'decimal' ], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it('should detect formatters with parenthesis', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.number:parse(YYYYMMDD)'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'number', 'formatters' : [ 'parse(YYYYMMDD)'], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it('should detect multiple formatters', function(){
      var _tags = [
        {'pos': 10, 'name': 'd.site'},
        {'pos': 20, 'name': 'd.number:int'},
        {'pos': 30, 'name': 'd.date:parse(Y)'},
        {'pos': 40, 'name': 'd.date:parse(YYYYMMDD):format(DD/MM/YYYY)'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site'  , 'formatters' : []                                         , 'obj': 'd', 'pos':10},
            {'attr':'number', 'formatters' : [ 'int' ]                                  , 'obj': 'd', 'pos':20},
            {'attr':'date'  , 'formatters' : [ 'parse(Y)' ]                             , 'obj': 'd', 'pos':30},
            {'attr':'date'  , 'formatters' : [ 'parse(YYYYMMDD)', 'format(DD/MM/YYYY)' ], 'obj': 'd', 'pos':40}
          ]
        }
      });
    });
    it('should detect formatters even if we use special character in the parenthesis', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.number:parse(YY, YY:MM:D.ZZ [Z]menu[i+1][i] d.bla)'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'number', 'formatters' : [ 'parse(YY,YY:MM:D.ZZ[Z]menu[i+1][i]d.bla)'], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it.skip('should detect formatter even in the iterator of an array', function(){
      var _tags = [
        {'pos': 20, 'name': 'd[day:weekday].meteo'},
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'array',
          'parent':'',
          'xmlParts' : [
            {'attr':'meteo', 'formatters' : [ 'weekday=1'], 'obj': 'd', 'pos':20},
          ]
        }
      });
    });
    it('should clean unwanted spaces', function(){
      var _tags = [
        {'pos': 10, 'name': ' d.site'},
        {'pos': 20, 'name': 'd. number:int '},
        {'pos': 30, 'name': 'd . date:parse(Y)'},
        {'pos': 40, 'name': 'd.date: parse(YYYYMMDD) :format(DD/MM/YYYY)'}
      ];
      helper.assert(analyzer.decomposeTags(_tags), {
        'd':{
          'name':'d',
          'type': 'object',
          'parent':'',
          'xmlParts' : [
            {'attr':'site', 'formatters' : [], 'obj': 'd', 'pos':10},
            {'attr':'number', 'formatters' : [ 'int' ], 'obj': 'd', 'pos':20},
            {'attr':'date', 'formatters' : [ 'parse(Y)' ], 'obj': 'd', 'pos':30},
            {'attr':'date', 'formatters' : [ 'parse(YYYYMMDD)', 'format(DD/MM/YYYY)' ], 'obj': 'd', 'pos':40}
          ]
        }
      });
    });
  });

  describe('reOrderHierarchy', function(){
    it('should consider the depth is 0 when it is not specified', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'd'      :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [] },
          'menu1'   :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':1}
        }
      };
      helper.assert(analyzer.reOrderHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'menu1']
      });
    });
    it('should generate an array which contains the order of hierarchy', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'd'      :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [], 'depth':0},
          'menu1'   :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':1},
          'menu2'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu1'   , 'xmlParts' : [], 'depth':2},
          'menu3'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu2'   , 'xmlParts' : [], 'depth':3},
          'product4':{'name':'product', 'type':'array'  , 'parent':'menu3'   , 'xmlParts' : [], 'depth':4},
          'site5'   :{'name':'site'   , 'type':'object' , 'parent':'product4', 'xmlParts' : [], 'depth':4},
          'product6':{'name':'product', 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'cars7'   :{'name':'cars'   , 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'product8':{'name':'product', 'type':'object' , 'parent':'cars7'   , 'xmlParts' : [], 'depth':0}
        }
      };

      helper.assert(analyzer.reOrderHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
    it.skip('should work even if the dynamicData is not in the correct order; DO THIS TEST!!! ', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'product4':{'name':'product', 'type':'array'  , 'parent':'menu3'   , 'xmlParts' : [], 'depth':4},
          'menu3'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu2'   , 'xmlParts' : [], 'depth':3},
          'd'      :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [], 'depth':0},
          'menu1'   :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':1},
          'cars7'   :{'name':'cars'   , 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'menu2'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu1'   , 'xmlParts' : [], 'depth':2},
          'product8':{'name':'product', 'type':'object' , 'parent':'cars7'   , 'xmlParts' : [], 'depth':0},
          'product6':{'name':'product', 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'site5'   :{'name':'site'   , 'type':'object' , 'parent':'product4', 'xmlParts' : [], 'depth':4}
        }
      };

      helper.assert(analyzer.reOrderHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
  });

  describe('getFormatterString', function(){
    it('should return a simple call of a function for a formatter without arguments', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'int' ]);
      assert.equal(actual, 'formatters.int(d.number)');
    });
    it('should return a simple call of a function for a formatter without arguments but called with parenthesis', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'int()' ]);
      assert.equal(actual, 'formatters.int(d.number)');
    });
    it('should return a call of a function for a formatter with one argument', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'toFixed(2)' ]);
      assert.equal(actual, 'formatters.toFixed(d.number, \'2\')');
    });
    it('should return a call of a function for a formatter with one argument which is a string', function(){
      var actual = analyzer.getFormatterString('d.date', [ "format(YYYYMMDD)" ]);
      assert.equal(actual, "formatters.format(d.date, 'YYYYMMDD')");
    });
    it('should return a call of a function for a formatter with two arguments', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'formatter(2, 3)' ]);
      assert.equal(actual, 'formatters.formatter(d.number, \'2\', \'3\')');
    });
    it('should return two calls of functions for two chained formatters', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'int', 'toFixed(2)' ]);
      assert.equal(actual, 'formatters.toFixed(formatters.int(d.number), \'2\')');
    });
    it('should return two calls of functions for two chained formatters each with arguments', function(){
      var actual = analyzer.getFormatterString('d.number', [ 'formatter1(4, 5)', 'formatter2(2, 3)' ]);
      assert.equal(actual, 'formatters.formatter2(formatters.formatter1(d.number, \'4\', \'5\'), \'2\', \'3\')');
    });
  });

});


