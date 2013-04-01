var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Kendoc', function(){

  describe.skip('compileXmlNew', function(){
    it('should return nothing if the descriptor is empty', function(){
      var _desc = {};
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo'
      };
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), '');
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(null), [{pos:[0], str:'<xml>'}, {pos:[1], str:'</xml>'}]);
    });
    it('should return a function which return an array of xml parts according to the descriptor and the data', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'hierarchy'   : ['d0'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':8 , 'before':'<xml><p>', 'after': ''}, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':15, 'before':'</p><p>' , 'after': ''},
              {'obj': 'd0', 'attr':'surname'  , 'pos':22, 'before':'</p><p>' , 'after': ''}
            ]
          }
        }
      };
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo'
      };
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':8 , 'before':'<xml><p>', 'after': ''}, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':15, 'before':'</p><p>' , 'after': ''},
              {'obj': 'd0', 'attr':'surname'  , 'pos':22, 'before':'</p><p>' , 'after': ''}
            ]
          }
        }
      };
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0', 'info1'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':8,  'before':'<xml><p>', 'after': ''}, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':15, 'before':'</p><p>' , 'after': ''},
              {'obj': 'd0', 'attr':'surname'  , 'pos':40, 'before':'</br><p>', 'after': ''}
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23, 'before':'</p><br>' , 'after': '' }, 
              {'obj': 'info1', 'attr':'job'  , 'pos':32, 'before':'</br><br>', 'after': '' }
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0', 'info1'],
        'dynamicData' : {
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':23, 'before':'</p><br>' , 'after': '' }, 
              {'obj': 'info1', 'attr':'job'  , 'pos':32, 'before':'</br><br>', 'after': '' }
            ]
          }, 
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':8,  'before':'<xml><p>', 'after': ''}, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':15, 'before':'</p><p>' , 'after': ''},
              {'obj': 'd0', 'attr':'surname'  , 'pos':40, 'before':'</br><p>', 'after': ''}
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':13, 'depth':1, 'before':'<tr><p>', 'after': ''           }, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  },
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson'},
        {'firstname':'Trinity',  'lastname':'Unknown'}
      ];
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6, 0, 13 ], str: '<tr><p>Thomas'},
        { pos:[ 6, 0, 20 ], str: '</p><p>A. Anderson</p></tr>'},
        { pos:[ 6, 1, 13 ], str: '<tr><p>Trinity'},
        { pos:[ 6, 1, 20 ], str: '</p><p>Unknown</p></tr>'},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('should works if there is an object in the array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d0', 'info1'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':10, 'depth':1, 'before':'<tr>', 'after': ''           }, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  },
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>', 'after': ''    }, 
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson', 'info' : {'movie': 'matrix'} },
        {'firstname':'Trinity',  'lastname':'Unknown', 'info' : {'movie': 'matrix2'}}
      ];
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0', 'info1', 'info2', 'info3'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':10, 'depth':1, 'before':'<tr>', 'after': ''           }, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':20, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  },
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info1', 'attr':'movie', 'pos':13, 'depth':1, 'before':'<p>', 'after': ''    }, 
            ]
          },
          'info2':{
            'name':'info',
            'parent' : 'info1',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info2', 'attr':'style', 'pos':14, 'depth':1, 'before':'', 'after': ''    }, 
            ]
          },
          'info3':{
            'name':'info',
            'parent' : 'info2',
            'type': 'object',
            'depth' : 1,
            'xmlParts' : [
              {'obj': 'info3', 'attr':'rate', 'pos':15, 'depth':1, 'before':'', 'after': ''    }, 
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0', 'movies1', 'cars2'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'xmlParts' : []
          },
          'movies1':{
            'name':'movies',
            'parent' : 'd0',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :15},
            'xmlParts' : [
              {'obj': 'movies1', 'attr':'title', 'pos':10, 'depth':1, 'before':'<tr>', 'after': '</tr>'    }, 
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : 'd0',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 20, 'end' :29},
            'xmlParts' : [
              {'obj': 'cars2', 'attr':'brand', 'pos':24, 'depth':1, 'before':'<trow>', 'after': '</trow>'  }, 
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), [
        { pos:[ 0        ], str: '<xml> '},
        { pos:[ 6 , 0, 10 ], str: '<tr>matrix</tr>'},
        { pos:[ 6 , 1, 10 ], str: '<tr>Lord of War</tr>'},
        { pos:[ 20, 0, 24 ], str: '<trow>Lumeneo</trow>'},
        { pos:[ 20, 1, 24 ], str: '<trow>Tesla motors</trow>'},
        { pos:[ 30       ], str: ' </xml>' }
      ]);
    });
    it('should works even with two nested arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'hierarchy'   : ['d0', 'skills1'],
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'obj': 'd0', 'attr':'firstname', 'pos':13, 'depth':1, 'before':'<tr><p>', 'after': ''            }, 
              {'obj': 'd0', 'attr':'lastname' , 'pos':29, 'depth':1, 'before':'</p><p>', 'after': '</p></tr>'  },
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : 'd0',
            'type': 'array',
            'depth' : 2,
            'position' : {'start': 13, 'end' :22},
            'xmlParts' : [
              {'obj': 'skills1', 'attr':'name', 'pos':17, 'depth':2, 'before':'<tr>', 'after': '</tr>'}, 
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
        'hierarchy'   : ['d0', 'skills1'],
        'dynamicData' : {
          'd0':{
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
            'parent' : 'd0',
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
      var _fn = kendoc.getXMLBuilderFunction(_desc);
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
    it('should create a descriptor', function(){
      var _tags = [
        {'pos': 20, 'name': 'd.site'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : [
            {'obj': 'd0', 'attr':'site', 'pos':20}
          ]
        }
      });
    });
    it('1should decompose all tags', function(){
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
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : [
            {'obj': 'd0', 'attr':'site', 'pos':80}
          ]
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d0',
          /*'depth' : 2,*/
          'range': {'start':1, 'end':40},
          'xmlParts' : [
            {'obj': 'menu1', 'attr':'id'  , 'pos':1},
            {'obj': 'menu1', 'attr':'cars', 'pos':10}
          ]
        },
        'menuElement2':{
          'name':'menuElement',
          'type':'array',
          'parent':'menu1',
          /*'depth' : 4,*/
          'range': {'start':20, 'end':30},
          'xmlParts' : [
            {'obj': 'menuElement2', 'attr':'id', 'pos':20}
          ]
        },
        'product3':{
          'name':'product',
          'type':'object',
          'parent':'d0',
          /*'depth' : 1,*/
          'xmlParts' : [
            {'obj': 'product3', 'attr':'id', 'pos':90}
          ]
        },
      });
    });
    it('2 inverse order should decompose all tags', function(){
      var _tags = [
        {'pos': 10, 'name': 'd.menu[i].menuElement[i].id'},
        {'pos': 20, 'name': 'd.menu[i+1].menuElement[i].id'},
        {'pos': 30, 'name': 'd.menu[i].menuElement[i+1].id'},
        {'pos': 40, 'name': 'd.menu[i+1].menuElement[i+1].id'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : []
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d0',
          /*'depth' : 2,*/
          'range': {'start':10, 'end':20},
          'xmlParts' : []
        },
        'menuElement2':{
          'name':'menuElement',
          'type':'array',
          'parent':'menu1',
          /*'depth' : 4,*/
          'range': {'start':10, 'end':30},
          'xmlParts' : [
            {'obj': 'menuElement2', 'attr':'id', 'pos':10}
          ]
        },
      });
    });
    it('2 should decompose all tags even if there are some objects within the array', function(){
      var _tags = [
        {'pos': 1  , 'name': 'd.menu[i].id'},
        {'pos': 10 , 'name': 'd.menu[i].cars'},
        {'pos': 20 , 'name': 'd.site'},
        {'pos': 30 , 'name': 'd.product.id'},
        {'pos': 40 , 'name': 'd.menu[i].menuElement[0].id'},
        {'pos': 50 , 'name': 'd.menu[i+1].id'},
        {'pos': 60 , 'name': 'd.menu[i+1].menuElement[0].id'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : [
            {'obj': 'd0', 'attr':'site', 'pos':20}
          ]
        },
        'menu1':{
          'name':'menu',
          'type':'array', 
          'parent':'d0',
          /*'depth' : 2,*/
          'range': { 'start': 1, 'end': 50 },
          'xmlParts' : [
            {'obj': 'menu1', 'attr':'id'  , 'pos':1},
            {'obj': 'menu1', 'attr':'cars', 'pos':10}
          ]
        },
        'product2':{
          'name':'product',
          'type':'object',
          'parent':'d0',
          /*'depth' : 1,*/
          'xmlParts' : [
            {'obj': 'product2', 'attr':'id', 'pos':30}
          ]
        },
        'menuElement3':{
          'name':'menuElement',
          'type':'array',
          'parent':'menu1',
          /*'depth' : 4,*/
          'xmlParts' : [
            {'obj': 'menuElement3', 'attr':'id', 'pos':40}
          ]
        },
      });
    });
    it('should decompose all tags even with multi-dimension array', function(){
      var _tags = [
        {'pos': 1 , 'name': 'd.menu[i][i].id'},
        {'pos': 2 , 'name': 'd.menu[i][i+1].id'},
        {'pos': 3 , 'name': 'd.menu[i+1][i].id'},
        {'pos': 4 , 'name': 'd.menu[i+1][i+1].id'},
        {'pos': 5 , 'name': 'd.product.id'},
        {'pos': 6 , 'name': 'd.days[i].name'},
        {'pos': 7 , 'name': 'd.days[i+1].name'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : []
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d0',
          /*'depth' : 2,*/
          'range': {'start': 1, 'end': 3 },
          'xmlParts' : []
        },
        'menu2':{
          'name':'menu',
          'type':'array',
          'parent':'menu1',
          /*'depth' : 3,*/
          'range':{'start': 1, 'end': 2 },
          'xmlParts' : [
            {'obj': 'menu2', 'attr':'id', 'pos':1},
          ]
        },
        'product3':{
          'name':'product',
          'type':'object',
          'parent':'d0',
          /*'depth' : 1,*/
          'xmlParts' : [
            {'obj': 'product3', 'attr':'id', 'pos':5}
          ]
        },
        'days4':{
          'name':'days',
          'type':'array',
          'parent':'d0',
          /*'depth' : 2,*/
          'range':{'start': 6, 'end': 7 },
          'xmlParts' : [
            {'obj': 'days4', 'attr':'name', 'pos':6}
          ]
        }
      });
    });
    it('should decompose even with very complex arrays', function(){
      var _tags = [
        {'pos': 1 , 'name': 'd.menu[1][0][1].product[0].site.id'},
        {'pos': 2 , 'name': 'd.product.id'},
        {'pos': 3 , 'name': 'd.cars.product.id'},
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
          'parent':'',
          /*'depth' : 0,*/
          'xmlParts' : []
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d0',
          /*'depth' : 2,*/
          'xmlParts' : []
        },
        'menu2':{
          'name':'menu',
          'type':'array',
          'parent':'menu1',
          /*'depth' : 4,*/
          'xmlParts' : []
        },
        'menu3':{
          'name':'menu',
          'type':'array',
          'parent':'menu2',
          /*'depth' : 6,*/
          'xmlParts' : []
        },
        'product4':{
          'name':'product',
          'type':'array',
          'parent':'menu3',
          /*'depth' : 8,*/
          'xmlParts' : []
        },
        'site5':{
          'name':'site',
          'type':'object',
          'parent':'product4',
          /*'depth' : 7,*/
          'xmlParts' : [
            {'obj': 'site5', 'attr':'id', 'pos':1},
          ]
        },
        'product6':{
          'name':'product',
          'type':'object',
          'parent':'d0',
          /*'depth' : 1,*/
          'xmlParts' : [
            {'obj': 'product6', 'attr':'id', 'pos':2},
          ]
        },
        'cars7':{
          'name':'cars',
          'type':'object',
          'parent':'d0',
          /*'depth' : 1,*/
          'xmlParts' : []
        },
        'product8':{
          'name':'product',
          'type':'object',
          'parent':'cars7',
          /*'depth' : 2,*/
          'xmlParts' : [
            {'obj': 'product8', 'attr':'id', 'pos':3},
          ]
        }
      });
    });
  });
});


