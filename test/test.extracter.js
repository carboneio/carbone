var assert = require('assert');
var carbone = require('../lib/index');
var extracter = require('../lib/extracter');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('extracter', function(){


  describe('splitMarkers', function(){
    it('should return an empty descriptor if there are no markers', function(){
      var _markers = [];
      helper.assert(extracter.splitMarkers(_markers), {});
    });
    it('should create a descriptor which be used to build the xml generator', function(){
      var _markers = [
        {'pos': 20, 'name': 'd.site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.site'},
        {'pos': 30, 'name': 'd.name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.site.name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 10, 'name': 'd.movie'},
        {'pos': 20, 'name': 'd.site.name'},
        {'pos': 30, 'name': 'd.site.id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd[i].site'},
        {'pos': 30, 'name': 'd[i+1].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd[i].site.id'},
        {'pos': 25, 'name': 'd[i].movie'},
        {'pos': 30, 'name': 'd[i+1].site.id'},
        {'pos': 35, 'name': 'd[i+1].movie'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.site[i].id'},
        {'pos': 30, 'name': 'd.site[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.site[i].id'},
        {'pos': 28, 'name': 'd.movie'},
        {'pos': 30, 'name': 'd.site[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
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
      helper.assert(extracter.splitMarkers(_markers), {
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
    it('2 inverse order should decompose all markers', function(){
      var _markers = [
        {'pos': 10, 'name': 'd.menu[i].menuElement[i].id'},
        {'pos': 20, 'name': 'd.menu[i+1].menuElement[i].id'},
        {'pos': 30, 'name': 'd.menu[i].menuElement[i+1].id'},
        {'pos': 40, 'name': 'd.menu[i+1].menuElement[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
    it.skip('2 should decompose all markers even if there are some objects within the array', function(){
      var _markers = [
        {'pos': 1  , 'name': 'd.menu[i].id'},
        {'pos': 10 , 'name': 'd.menu[i].cars'},
        {'pos': 20 , 'name': 'd.site'},
        {'pos': 30 , 'name': 'd.product.id'},
        {'pos': 40 , 'name': 'd.menu[i].menuElement[0].id'},
        {'pos': 50 , 'name': 'd.menu[i+1].id'},
        {'pos': 60 , 'name': 'd.menu[i+1].menuElement[0].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 1 , 'name': 'd.menu[i][i].id'},
        {'pos': 2 , 'name': 'd.menu[i][i+1].id'},
        {'pos': 3 , 'name': 'd.menu[i+1][i].id'},
        {'pos': 4 , 'name': 'd.menu[i+1][i+1].id'},
        {'pos': 5 , 'name': 'd.product.id'},
        {'pos': 6 , 'name': 'd.days[i].name'},
        {'pos': 7 , 'name': 'd.days[i+1].name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 1 , 'name': 'd.menu[1][0][1].product[0].site.id'},
        {'pos': 2 , 'name': 'd.product.id'},
        {'pos': 3 , 'name': 'd.cars.product.id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.number:int'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.number:int:float:decimal'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.number : int  :   float   :  decimal'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.number:parse(YYYYMMDD)'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 10, 'name': 'd.site'},
        {'pos': 20, 'name': 'd.number:int'},
        {'pos': 30, 'name': 'd.date:parse(Y)'},
        {'pos': 40, 'name': 'd.date:parse(YYYYMMDD):format(DD/MM/YYYY)'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd.number:parse(YY, YY:MM:D.ZZ [Z]menu[i+1][i] d.bla)'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 20, 'name': 'd[day:weekday].meteo'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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
      var _markers = [
        {'pos': 10, 'name': ' d.site'},
        {'pos': 20, 'name': 'd. number:int '},
        {'pos': 30, 'name': 'd . date:parse(Y)'},
        {'pos': 40, 'name': 'd.date: parse(YYYYMMDD) :format(DD/MM/YYYY)'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
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

  describe('splitXml', function(){
    it('should extract return the staticData if there is no dynamic data', function(){
      var _xml = '<div></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'object',
          'parent':'',
          'xmlParts' : []
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div></div>',
          'after' :''
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'object',
            'parent':'',
            'xmlParts' : [],
            /*'depth' : 0*/
          }
        }
      });
    });
    it('should extract xml parts in the staticData object', function(){
      var _xml = '<div></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'object',
          'parent':'',
          /*'depth': null,*/
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':5}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'object',
            'parent':'',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu', 'pos':5, 'depth' : 0}
            ],
            'depth' : 0
          }
        }
      });
    });
    it('2 should extract xml parts for each tag attribute', function(){
      var _xml = '<div><p><h1></h1></p></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'object',
          'parent':'',
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':5},
            {'obj': 'd0', 'attr':'val', 'pos':8},
            {'obj': 'd0', 'attr':'test', 'pos':12}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</h1></p></div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'object',
            'parent':'',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu' , 'pos':5 , 'depth' : 0, 'after':'<p>'},
              {'obj': 'd0', 'attr':'val'  , 'pos':8 , 'depth' : 0, 'after':'<h1>'},
              {'obj': 'd0', 'attr':'test' , 'pos':12, 'depth' : 0}
            ],
            'depth' : 0
          }
        }
      });
    });

    it('3 should extract xml parts of an array', function(){
      var _xml = '<div><tr> <h1> </h1> </tr><tr> <h1> </h1> </tr></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'array',
          'parent':'',
          'position' : {'start':9, 'end':30}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':9},
            {'obj': 'd0', 'attr':'val' , 'pos':14},
            {'obj': 'd0', 'attr':'test', 'pos':20}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'array',
            'parent':'',
            'position' : {'start':5, 'end':26}, /* exact position */
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu' , 'pos':9,  'depth' : 1,  'after':' <h1>'},
              {'obj': 'd0', 'attr':'val'  , 'pos':14, 'depth' : 1,  'after':' </h1>'},
              {'obj': 'd0', 'attr':'test' , 'pos':20, 'depth' : 1},
              {'obj': 'd0', 'array':'start' , 'pos':5, 'depth' : 1,  'after':'<tr>'},
              {'obj': 'd0', 'array':'end'   , 'pos':26, 'depth' : 1, 'before':' </tr>'}
            ],
            'depth' : 1
          }
        }
      });
    });

    it('3 should extract xml parts even if there are some dynamic data just after the array', function(){
      var _xml = '<div><tr> <h1> </h1> </tr><tr> <h1> </h1> </tr><p></p></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'object',
          'parent':'',
          'xmlParts' : [
            {'obj': 'd0', 'attr':'info', 'pos':50}
          ]
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'parent':'d0',
          'position' : {'start':9, 'end':30}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'menu1', 'attr':'menu', 'pos':9},
            {'obj': 'menu1', 'attr':'val' , 'pos':14},
            {'obj': 'menu1', 'attr':'test', 'pos':20}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</p></div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'object',
            'parent':'',
            'xmlParts' : [
              {'obj': 'd0', 'attr':'info', 'pos':50, 'depth' : 0, 'before':'<p>'}
            ],
            'depth' : 0
          },
          'menu1':{
            'name':'menu',
            'type':'array',
            'parent':'d0',
            'position' : {'start':5, 'end':26}, /* exact position */
            'xmlParts' : [
              {'obj': 'menu1', 'attr':'menu' , 'pos':9,  'depth' : 1,  'after':' <h1>'},
              {'obj': 'menu1', 'attr':'val'  , 'pos':14, 'depth' : 1,  'after':' </h1>'},
              {'obj': 'menu1', 'attr':'test' , 'pos':20, 'depth' : 1},
              {'obj': 'menu1', 'array':'start' , 'pos':5, 'depth' : 1,  'after':'<tr>'},
              {'obj': 'menu1', 'array':'end'   , 'pos':26, 'depth' : 1, 'before':' </tr>'}
            ],
            'depth' : 1
          }
        }
      });
    });
    
    it('4 should extract xml parts even if there is a nested object in an array', function(){
      var _xml = '<div><tr> <h1> </h1> <p></p> </tr><tr> <h1> </h1> <p></p> </tr></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'array',
          'parent':'',
          'position' : {'start':9, 'end':38}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':9},
            {'obj': 'd0', 'attr':'val', 'pos':14},
            {'obj': 'd0', 'attr':'test', 'pos':20}
          ]
        },
        'info1':{
          'name':'info',
          'type':'object',
          'parent':'d0',
          'xmlParts' : [
            {'obj': 'info1', 'attr':'id', 'pos':24}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'array',
            'parent':'',
            'position' : {'start':5, 'end':34}, /* exact position */
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu' , 'pos':9,  'depth': 1,  'after':' <h1>'},
              {'obj': 'd0', 'attr':'val'  , 'pos':14, 'depth': 1,  'after':' </h1>'},
              {'obj': 'd0', 'attr':'test' , 'pos':20, 'depth': 1,  'after':' <p>'},
              {'obj': 'd0', 'array':'start', 'pos':5,  'depth': 1, 'after':'<tr>'},
              {'obj': 'd0', 'array':'end'  , 'pos':34, 'depth': 1, 'before':'</p> </tr>'}
            ],
            'depth' : 1
          },
          'info1':{
            'name':'info',
            'type':'object',
            'parent':'d0',
            'xmlParts' : [
              {'obj': 'info1', 'attr':'id', 'pos':24, 'depth': 1}
            ],
            'depth' : 1
          }
        }
      });
    });

    it('4 should extract xml parts even if there are two adjacents arrays', function(){
      var _xml = '<div><tr1> </tr1><tr1> </tr1> <tr2> </tr2><tr2> </tr2></div>';
      var _descriptor = {
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
          'position' : {'start': 10, 'end' :22}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'movies1', 'attr':'title', 'pos':11, 'depth':1 }
          ]
        },
        'cars2':{
          'name':'cars',
          'parent' : 'd0',
          'type': 'array',
          'depth' : 1,
          'position' : {'start': 35, 'end' :48},
          'xmlParts' : [
            {'obj': 'cars2', 'attr':'brand', 'pos':36, 'depth':1 }
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
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
            'position' : {'start': 5, 'end' :17},
            'xmlParts' : [
              {'obj': 'movies1',  'attr': 'title', 'pos': 11, 'depth':1 },
              {'obj': 'movies1', 'array': 'start', 'pos': 5 , 'depth': 1,'after': '<tr1> ' },
              {'obj': 'movies1', 'array': 'end'  , 'pos': 17, 'depth': 1,'before': '</tr1>' } 
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : 'd0',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 30, 'end' :42},
            'xmlParts' : [
              {'obj': 'cars2',  'attr': 'brand', 'pos': 36,'depth':1 },
              {'obj': 'cars2', 'array': 'start', 'pos': 30,'depth': 1,'after': '<tr2> ' },
              {'obj': 'cars2', 'array': 'end'  , 'pos': 42,'depth': 1,'before': '</tr2>' } 
            ],
            'before': ' '
          }
        }
      });
    });

    it('4 should extract xml parts even if there is some xml between two adjacents arrays. It should add a "before" attribute on the last array part', function(){
      var _xml = '<div><tr1> </tr1><tr1> </tr1> <b> <tr2> </tr2><tr2> </tr2></div>';
      var _descriptor = {
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
          'position' : {'start': 10, 'end' :22}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'movies1', 'attr':'title', 'pos':11, 'depth':1 }
          ]
        },
        'cars2':{
          'name':'cars',
          'parent' : 'd0',
          'type': 'array',
          'depth' : 1,
          'position' : {'start': 39, 'end' :52},
          'xmlParts' : [
            {'obj': 'cars2', 'attr':'brand', 'pos':40, 'depth':1 }
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
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
            'position' : {'start': 5, 'end' :17},
            'xmlParts' : [
              {'obj': 'movies1',  'attr': 'title', 'pos': 11, 'depth':1 },
              {'obj': 'movies1', 'array': 'start', 'pos': 5 , 'depth': 1,'after': '<tr1> ' },
              {'obj': 'movies1', 'array': 'end'  , 'pos': 17, 'depth': 1,'before': '</tr1>' } 
            ]
          },
          'cars2':{
            'name':'cars',
            'parent' : 'd0',
            'type': 'array',
            'depth' : 1,
            'position' : {'start': 34, 'end' :46},
            'xmlParts' : [
              {'obj': 'cars2',  'attr': 'brand', 'pos': 40,'depth':1 },
              {'obj': 'cars2', 'array': 'start', 'pos': 34,'depth': 1,'after': '<tr2> ' },
              {'obj': 'cars2', 'array': 'end'  , 'pos': 46,'depth': 1,'before': '</tr2>' } 
            ],
            'before' : ' <b> '
          }
        }
      });
    });

    it('5 should extract xml parts even if there are two nested arrays and an object', function(){
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'array',
          'parent':'',
          'position' : {'start':11, 'end':75}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':11},
          ]
        },
        'element1':{
          'name':'element',
          'type':'array',
          'parent':'d0',
          'position' : {'start':26, 'end':46}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'element1', 'attr':'id', 'pos':26}
          ]
        },
        'info1':{
          'name':'info',
          'type':'object',
          'parent':'d0',
          'xmlParts' : [
            {'obj': 'info1', 'attr':'id', 'pos':56}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'array',
            'parent':'',
            'position' : {'start':5, 'end':67}, /* exact position */
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu'   , 'pos':11, 'depth':1, 'after': ' <h1>'},
              {'obj': 'd0', 'array':'start' , 'pos':5,  'depth':1, 'after': '<tr A>'},
              {'obj': 'd0', 'array':'end'   , 'pos':67, 'depth':1, 'before':'</h1> </tr>'},
            ],
            'depth':1
          },
          'element1':{
            'name':'element',
            'type':'array',
            'parent':'d0',
            'position' : {'start':16, 'end':36}, /* exact position */
            'xmlParts' : [
              {'obj': 'element1', 'attr':'id', 'pos':26, 'depth':2},
              {'obj': 'element1', 'array':'start', 'pos':16, 'depth':2, 'after':'<tr B> <p>'},
              {'obj': 'element1', 'array':'end'  , 'pos':36, 'depth':2, 'before':'</p> </tr>'}
            ],
            'depth':2
          },
          'info1':{
            'name':'info',
            'type':'object',
            'parent':'d0',
            'xmlParts' : [
              {'obj': 'info1', 'attr':'id', 'pos':56, 'depth':1}
            ],
            'depth':1
          }
        }
      });
    });

    it('6 should extract xml parts even if there are two nested arrays', function(){
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'array',
          'parent':'',
          'position' : {'start':11, 'end':75}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'd0', 'attr':'menu', 'pos':11},
            {'obj': 'd0', 'attr':'val', 'pos':56}
          ]
        },
        'element1':{
          'name':'element',
          'type':'array',
          'parent':'d0',
          'position' : {'start':26, 'end':46}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'element1', 'attr':'id', 'pos':26}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'array',
            'parent':'',
            'position' : {'start':5, 'end':67}, /* exact position */
            'xmlParts' : [
              {'obj': 'd0', 'attr':'menu'  , 'pos':11, 'depth':1, 'after' : ' <h1>' },
              {'obj': 'd0', 'attr':'val'   , 'pos':56, 'depth':1, },
              {'obj': 'd0', 'array':'start', 'pos':5,  'depth':1,  'after':'<tr A>'},
              {'obj': 'd0', 'array':'end'  , 'pos':67, 'depth':1,  'before':'</h1> </tr>'}
            ],
            'depth':1
          },
          'element1':{
            'name':'element',
            'type':'array',
            'parent':'d0',
            'position' : {'start':16, 'end':36}, /* exact position */
            'xmlParts' : [
              {'obj': 'element1', 'attr':'id'    , 'pos':26, 'depth':2},
              {'obj': 'element1', 'array':'start', 'pos':16, 'depth':2, 'after':'<tr B> <p>'},
              {'obj': 'element1', 'array':'end'  , 'pos':36, 'depth':2, 'before':'</p> </tr>'}
            ],
            'depth':2
          }
        }
      });
    });

    it('7 should extract xml parts even if the two nested arrays are in inverse order', function(){
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        'd0':{
          'name':'',
          'type':'array',
          'parent':'',
          'position' : {'start':26, 'end':46}, /* Approximative position */
          'xmlParts' : []
        },  
        'element1':{
          'name':'element',
          'type':'array',
          'parent':'d0',
          'position' : {'start':11, 'end': 75}, /* Approximative position */
          'xmlParts' : [
            {'obj': 'element1', 'attr':'id', 'pos':26}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type':'array',
            'parent':'',
            'position' : {'start':16 , 'end':36 }, /* Exact position */
            'xmlParts' : [
              {'obj': 'd0', 'array':'start', 'pos':16, 'depth':2, 'after':'<tr B> <p>'},
              {'obj': 'd0', 'array':'end'  , 'pos':36, 'depth':2, 'before':'</p> </tr>'},
            ],
            'depth':2
          },
          'element1':{
            'name':'element',
            'type':'array',
            'parent':'d0',
            'position' : {'start':5, 'end': 67}, /* Exact position */
            'xmlParts' : [
              {'obj': 'element1', 'attr':'id'    , 'pos':26, 'depth':2},
              {'obj': 'element1', 'array':'start', 'pos':5,  'depth':1, 'after':'<tr A> <h1>'},
              {'obj': 'element1', 'array':'end'  , 'pos':67, 'depth':1, 'before':'</h1> </tr>'}
            ],
            'depth':1
          }
        }
      });
    });
  });


  describe('buildSortedHierarchy', function(){
    it('should not use the depth attribute to resolve dependency', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'd'      :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [], 'depth':5 },
          'menu1'  :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':1}
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'menu1']
      });
    });
    it('should not generate an array with undefined values if the "d" is an array (depth>0)', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'd': {'name':'d' , 'type':'array' , 'parent':''  , 'xmlParts' : [], 'depth':1},
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d']
      });
    });
    it('The returned array should describe in which order the builder should travel the dynamicData without using depth attribute', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'd'      :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [], 'depth':500},
          'menu1'   :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':4},
          'menu2'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu1'   , 'xmlParts' : [], 'depth':2},
          'menu3'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu2'   , 'xmlParts' : [], 'depth':3},
          'product4':{'name':'product', 'type':'array'  , 'parent':'menu3'   , 'xmlParts' : [], 'depth':4},
          'site5'   :{'name':'site'   , 'type':'object' , 'parent':'product4', 'xmlParts' : [], 'depth':4},
          'product6':{'name':'product', 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'cars7'   :{'name':'cars'   , 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'product8':{'name':'product', 'type':'object' , 'parent':'cars7'   , 'xmlParts' : [], 'depth':0}
        }
      };

      helper.assert(extracter.buildSortedHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
    it('"cars7" should appears before "product8" because "cars7" is the parent of "product8".\
        "d" should be the first\
        "product6" should appears before "cars7" because "product6" has no children', function(){
      var _data = {
        'staticData': {},
        'dynamicData': {
          'product4':{'name':'product', 'type':'array'  , 'parent':'menu3'   , 'xmlParts' : [], 'depth':4},
          'menu3'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu2'   , 'xmlParts' : [], 'depth':3},
          'menu1'   :{'name':'menu'   , 'type':'array'  , 'parent':'d'      , 'xmlParts' : [], 'depth':1},
          'menu2'   :{'name':'menu'   , 'type':'array'  , 'parent':'menu1'   , 'xmlParts' : [], 'depth':2},
          'product8':{'name':'product', 'type':'object' , 'parent':'cars7'   , 'xmlParts' : [], 'depth':0},
          'cars7'   :{'name':'cars'   , 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'product6':{'name':'product', 'type':'object' , 'parent':'d'      , 'xmlParts' : [], 'depth':0},
          'site5'   :{'name':'site'   , 'type':'object' , 'parent':'product4', 'xmlParts' : [], 'depth':4},
          'd'       :{'name':''       , 'type':'object' , 'parent':''        , 'xmlParts' : [], 'depth':0}
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        'staticData': {},
        'dynamicData': _data.dynamicData,
        'hierarchy' : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
  });

});


