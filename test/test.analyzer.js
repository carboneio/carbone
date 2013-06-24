var assert = require('assert');
var carbone = require('../lib/index');
var analyzer = require('../lib/analyzer');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Analyzer', function(){


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

});


