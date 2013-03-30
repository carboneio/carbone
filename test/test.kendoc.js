var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Kendoc', function(){

  describe('compileXmlNew', function(){
    it('should return a function which generate the xml according to the descriptor and the data', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'position' : {'start': 0, 'end' :22},
            'xmlParts' : [
              {'before':'<xml><p>', 'obj': 'd0', 'attr':'firstname', 'position':8 , 'after': ''}, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':15, 'after': ''},
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'surname'  , 'position':22, 'after': ''}
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
          pos: [ 0, 8 ],
          str: '<xml><p>Thomas' 
        },{
          pos: [ 0, 15 ],
          str: '</p><p>A. Anderson' 
        },{
          pos: [ 0, 22 ],
          str: '</p><p>Neo' 
        }]);
    });
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
    it('should return only the xml if the data is empty or null or of one of the attribute doea not exist', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'position' : {'start': 0, 'end' :22},
            'xmlParts' : [
              {'before':'<xml><p>', 'obj': 'd0', 'attr':'firstname', 'position':8, 'after': ''}, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':15, 'after': ''},
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'surname'  , 'position':22, 'after': ''}
            ]
          }
        }
      };
      var _data = {};
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), '<xml><p></p><p></p><p></p></xml>');

      _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(null), '<xml><p></p><p></p><p></p></xml>');

      _data = {
        'firstname':'Thomas',
        'surname': 'Neo'
      };
      _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), '<xml><p>Thomas</p><p></p><p>Neo</p></xml>');
    });
    it('should return the xml in the correct order even if the descriptor is unordered', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'position' : {'start': 0, 'end' :22},
            'xmlParts' : [
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'surname'  , 'position':22, 'after': ''},
              {'before':'<xml><p>', 'obj': 'd0', 'attr':'firstname', 'position':8, 'after': ''}, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':15, 'after': ''}
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
      helper.assert(_fn(_data), '<xml><p>Thomas</p><p>A. Anderson</p><p>Neo</p></xml>');
    });
    it('should works even if there is a nested object in the descriptor', function(){
      var _desc = {
        'staticData'  : {
          'before':'',
          'after' :'</p></xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'position' : {'start': 0, 'end' :40},
            'xmlParts' : [
              {'before':'<xml><p>' , 'obj': 'd0', 'attr':'firstname', 'position':8, 'after': ''}, 
              {'before':'</p><p>'  , 'obj': 'd0', 'attr':'lastname' , 'position':15, 'after': ''},
              {'before':'</br><p>' , 'obj': 'd0', 'attr':'surname'  , 'position':40, 'after': ''}
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'position' : {'start': 15, 'end' :32},
            'xmlParts' : [
              {'before':'</p><br>' , 'obj': 'info1', 'attr':'movie', 'position':23, 'after': '' }, 
              {'before':'</br><br>', 'obj': 'info1', 'attr':'job'  , 'position':32, 'after': '' }
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
      helper.assert(_fn(_data), '<xml><p>Thomas</p><p>A. Anderson</p><br>matrix</br><br>developer</br><p>Neo</p></xml>');
    });

    it('should works if the main object is an array of object', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'position' : {'start': 6, 'end' :29},
            'xmlParts' : [
              {'before':'<tr><p>', 'obj': 'd0', 'attr':'firstname', 'position':13, 'after': ''            }, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':20, 'after': '</p></tr>'  },
            ]
          }
        }
      };
      var _data = [
        {'firstname':'Thomas' ,  'lastname':'A. Anderson'},
        {'firstname':'Trinity',  'lastname':'Unknown'}
      ];
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), '<xml> <tr><p>Thomas</p><p>A. Anderson</p></tr><tr><p>Trinity</p><p>Unknown</p></tr> </xml>');
    });

    it('should works even with a nested object in an array', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'position' : {'start': 6, 'end' :47},
            'xmlParts' : [
              {'before':'<tr><p>'  , 'obj': 'd0', 'attr':'firstname', 'position':13, 'after': ''           }, 
              {'before':'</h1><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':38, 'after': '</p></tr>'  },
            ]
          },
          'info1':{
            'name':'info',
            'parent' : 'd0',
            'type': 'object',
            'position' : {'start': 13, 'end' :24},
            'xmlParts' : [
              {'before':'</p><h1>' , 'obj': 'info1', 'attr':'movie', 'position':21, 'after': '' }, 
              {'before':'</h1><h1>', 'obj': 'info1', 'attr':'job'  , 'position':30, 'after': '' }
            ]
          }
        }
      };
      var _data = [
        {
          'firstname':'Thomas', 
          'lastname':'A. Anderson', 
          'info':{
            'movie': 'matrix',
            'job' : 'developer'
          }
        },
        {
          'firstname':'Trinity',
          'lastname':'Unknown',
          'info':{
            'movie': 'matrix',
            'job' : 'hacker'
          }
        }
      ];
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), 
        '<xml> '
          +'<tr><p>Thomas</p>'
            +'<h1>matrix</h1><h1>developer</h1>'
            +'<p>A. Anderson</p>'
          +'</tr>'
          +'<tr><p>Trinity</p>'
            +'<h1>matrix</h1><h1>hacker</h1>'
            +'<p>Unknown</p>'
          +'</tr>'
        +' </xml>');
    });

    it('should works even with a nested array in the main object', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'object',
            'position' : {'start': 0, 'end' :24},
            'xmlParts' : [
              {'before':'<p>'     , 'obj': 'd0', 'attr':'firstname', 'position':10, 'after': ''}, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':20, 'after': '</p>'}
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : 'd0',
            'type': 'array',
            'position' : {'start': 24, 'end' :32},
            'xmlParts' : [
              {'before':'<tr>'  , 'obj': 'skills1', 'attr':'name', 'position':28, 'after': '</tr>'}, 
            ]
          }
        }
      };
      var _data = {
        'firstname':'Thomas',
        'lastname':'Anderson',
        'skills':[
          {'name' : 'survive'},
          {'name' : 'walk on the walls'}
        ]
      };
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      console.log('\n\n\n'+_fn(_data)+'\n\n\n');
      helper.assert(_fn(_data), 
        '<xml> '
          +'<p>Thomas</p>'
          +'<p>Anderson</p>'
            +'<tr>survive</tr>'
            +'<tr>walk on the walls</tr>'
        +' </xml>');
    });
    it('should works even with a two nested arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'nestedPos' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'before':'<tr><p>', 'obj': 'd0', 'attr':'firstname', 'position':13, 'after': ''            }, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':29, 'after': '</p></tr>'  },
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : 'd0',
            'type': 'array',
            'nestedPos' : 2,
            'position' : {'start': 13, 'end' :22},
            'xmlParts' : [
              {'before':'<tr>'  , 'obj': 'skills1', 'attr':'name', 'position':17, 'after': '</tr>'}, 
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
      console.log('\n\n\n'+_fn(_data)+'\n\n\n');
      helper.assert(_fn(_data), 
        '<xml> '
          +'<tr><p>Thomas</p>'
            +'<tr>survive</tr>'
            +'<tr>walk on the walls</tr>'
            +'<p>A. Anderson</p>'
          +'</tr>'
          +'<tr><p>Trinity</p>'
            +'<tr>hack</tr>'
            +'<p>Unknown</p>'
          +'</tr>'
        +' </xml>');
    });
  });
  
  describe('generateXmlParts', function(){
    it('should works even with a two nested arrays', function(){
      var _desc = {
        'staticData'  : {
          'before':'<xml> ',
          'after' :' </xml>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'parent' : '',
            'type': 'array',
            'nestedPos' : 1,
            'position' : {'start': 6, 'end' :38},
            'xmlParts' : [
              {'before':'<tr><p>', 'obj': 'd0', 'attr':'firstname', 'position':13, 'after': ''            }, 
              {'before':'</p><p>' , 'obj': 'd0', 'attr':'lastname' , 'position':29, 'after': '</p></tr>'  },
            ]
          },
          'skills1':{
            'name':'skills',
            'parent' : 'd0',
            'type': 'array',
            'nestedPos' : 2,
            'position' : {'start': 13, 'end' :22},
            'xmlParts' : [
              {'before':'<tr>'  , 'obj': 'skills1', 'attr':'name', 'position':17, 'after': '</tr>'}, 
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
          pos: [ 6, 1, 13, 1 ],
          str: '<tr><p>Trinity' 
        },{ 
          pos: [ 6, 1, 29, 1 ],
          str: '</p><p>Unknown</p></tr>' 
        },{ 
          pos: [ 6, 1, 17, 0 ],
          str: '<tr>hack</tr>'}
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


