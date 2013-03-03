var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Kendoc', function(){
  
  describe('cleanTag', function(){
    it('should clean and remove any xml which are arround the tag', function(){
      assert.equal(kendoc.cleanTag('menu<xmla>why[1].test'), 'menuwhy[1].test');
      assert.equal(kendoc.cleanTag('  menu<xmla>why[1].test    '), 'menuwhy[1].test');
      assert.equal(kendoc.cleanTag('menu<some xml data>why<sqs>[1<sas  >].test'), 'menuwhy[1].test');
      //assert.equal('menuwhy[1].test', kendoc.cleanTag('menu<some xml data>why<sqs>[1<sas  >\n<qqs>].test'));
      assert.equal(kendoc.cleanTag('menu</w:t></w:r><w:r w:rsidR="00013394"><w:t>why</w:t></w:r><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r w:rsidR="00013394"><w:t>[1].</w:t></w:r><w:r w:rsidR="00013394"><w:t>test</w:t></w:r><w:r w:rsidR="00013394"><w:t xml:space="preserve">'),
      'menuwhy[1].test');
    });
  });

  describe('extractTags', function(){
    it('should replace the tag in xml by the data in the object', function(){
      var _data = {
        'menu' : 'blabla',
        'names' : 'Morpheus and Neo',
        'address' : {
          'city' : 'Nebuchadnezzar',
          'zip' : '2999'
        }
      };
      assert.equal(kendoc.extractTags('<xmlstart>{{menu}}</xmlend>', _data), '<xmlstart>blabla</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>  {{  menu  }} </xmlend>', _data), '<xmlstart>  blabla </xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{names}}</xmlend>', _data), '<xmlstart>Morpheus and Neo</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', _data), '<xmlstart>blabla<interxml><bullshit></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', _data), '<xmlstart>Nebuchadnezzar 2999</xmlend>');
    });
    it.skip('should works also with array', function(){
      var _data = {
        'menu' : [{
          'date' : 20120101
        },{
          'date' : 20120102
        }]
      };
      assert.equal(kendoc.extractTags('{{menu[i].date}} ', _data), '20120101 20120102');
    });
    it('should remove the tag in xml if there is no corresponding data in the object', function(){
      var _data = {
        'AAmenu' : 'blabla',
        'address' : {
          'AAcity' : 'Nebuchadnezzar',
          'zip' : '2999'
        }
      };
      assert.equal(kendoc.extractTags('<xmlstart>{{menu}}</xmlend>', _data), '<xmlstart></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', _data), '<xmlstart><interxml><bullshit></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', _data), '<xmlstart> 2999</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{cars.wheels}}</xmlend>', _data), '<xmlstart></xmlend>');
    });
  });

  describe('cleanXml', function(){
    it('should extract the tag from xml', function(){
      assert.equal(kendoc.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(kendoc.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
  });

  describe('detectCommonPoint', function(){
    it('should detect the common point', function(){
      assert.equal(kendoc.detectCommonPoint('menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle'), ' </tr><tr> ');
      assert.equal(kendoc.detectCommonPoint('menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle'), ' </tr>   <tr> ');
      assert.equal(kendoc.detectCommonPoint('menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle'), '</tr><tr> ');
      assert.equal(kendoc.detectCommonPoint('menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle'), '</tr:w><tr:w color=test test=3> ');
    });
  });

//  describe('detectArray', function(){
//    it('should array', function(){
//      assert.equal(kendoc.detectArray({2:'menu[i].date',10:'menu[i+1].date'}), {
//        tags : [2, 10]
//      });
//    });
//  });

  describe('getSubsitition', function(){
    it('should extract the tags from the xml, return the xml without the tags and a list of tags with their position in the xml', function(){
      helper.assert(kendoc.getSubsitition('{{menu}}'), {
        tags : [{'pos': 0, 'name':'menu'}], 
        xml : ''
      });
      helper.assert(kendoc.getSubsitition('<div>{{menu}}<div>'), {
        tags : [{'pos': 5, 'name':'menu'}], 
        xml : '<div><div>'
      });
      helper.assert(kendoc.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>'), {
        tags : [{'pos': 10, 'name':'menu'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend>'
      });
      helper.assert(kendoc.getSubsitition('<div>{{menu}}<div>{{city}}'), {
        tags : [{'pos': 5, 'name':'menu'},{'pos':10, 'name':'city'}],
        xml : '<div><div>'
      });
      helper.assert(kendoc.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend><tga>{{ci<td>ty</td>}}<tga><bla>{{cars}}</bla>'), {
        tags : [{'pos': 10, 'name':'menu'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
      helper.assert(kendoc.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u[i].city}}</xmlend><tga>{{ci<td>ty</td>}}<tga><bla>{{cars[i].wheel}}</bla>'), {
        tags : [{'pos': 10, 'name':'menu[i].city'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars[i].wheel'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
    });
  });

  describe('compileXml', function(){
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
      helper.assert(_fn(_data), '<xml><p>Thomas</p><p>A. Anderson</p><p>Neo</p></xml>');
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
    it.only('should works even with a two nested arrays', function(){
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


//  describe('extractXmlToRepeat', function(){
//    it('should extract the xml which will be repe the common point', function(){
//      assert.equal(kendoc.extractXmlToRepeat('menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle'), ' </tr><tr> ');
//    });
//  });

  /*describe('replaceByData', function(){
    it('should replace the tag by the data', function(){
      var _data = {
        'menu' : [{
          'date' : 20120101
        },{
          'date' : 20120102
        }]
      }
      assert.equal(kendoc.extractTags('{{menu[i].date}} ', _data), '20120101 20120102');
    });
  });*/

  describe('decomposeTags', function(){
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
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'range':[
            {'begin':1, 'end':40}
          ]
        },
        'menuElement2':{
          'name':'menuElement',
          'type':'array',
          'range':[
            {'begin':20, 'end':30}
          ]
        },
        'product3':{
          'name':'product',
          'type':'object'
        },
      });
    });
    it('2 should decompose all tags', function(){
      var _tags = [
        {'pos': 1  , 'name': 'd.menu[i].id'},
        {'pos': 10 , 'name': 'd.menu[i].cars'},
        {'pos': 20 , 'name': 'd.site'},
        {'pos': 30 , 'name': 'd.product.id'},
        {'pos': 40 , 'name': 'd.menu[i].menuElement[0].id'},
        {'pos': 50 , 'name': 'd.menu[i+1].id'},
        {'pos': 60 , 'name': 'd.menu[i+1].menuElement[1].id'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
        },
        'menu1':{
          'name':'menu',
          'type':'array', 
          'range': [ 
            { 'begin': 1, 'end': 50 } 
          ] 
        },
        'product2':{
          'name':'product',
          'type':'object'
        },
        'menuElement3':{
          'name':'menuElement',
          'type':'array'
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
        {'pos': 6 , 'name': 'd.days[i]'}
      ];
      helper.assert(kendoc.decomposeTags(_tags), {
        'd0':{
          'name':'',
          'type': 'object',
        },
        'menu1':{
          'name':'menu',
          'type':'array',
          'range': [ 
            { 'begin': 1, 'end': 3 } 
          ] 
        },
        'menu2':{
          'name':'menu',
          'type':'array',
          'range': [ 
            { 'begin': 1, 'end': 2 } 
          ] 
        },
        'product3':{
          'name':'product',
          'type':'object'
        },
        'days4':{
          'name':'days',
          'type':'array'
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
        },
        'menu1':{
          'name':'menu',
          'type':'array'
        },
        'menu2':{
          'name':'menu',
          'type':'array'
        },
        'menu3':{
          'name':'menu',
          'type':'array'
        },
        'product4':{
          'name':'product',
          'type':'array'
        },
        'site5':{
          'name':'site',
          'type':'object'
        },
        'product6':{
          'name':'product',
          'type':'object'
        },
        'cars7':{
          'name':'cars',
          'type':'object'
        },
        'product8':{
          'name':'product',
          'type':'object'
        }
      });
    });
  });


  /*before(function(done){
  });
  
  after( function(done){
  });*/

//  describe('Public methods', function(){
//    describe('generate(data, doc, callback)', function(){
//      it('', function(){
//      /**
//       */
//      });
//      describe('tests', function(){
//        beforeEach( function(done){
//          done();
//        });
//
//        it('should unzip the file', function(done){
//          //kendoc.generate({'menu':'test'}, 'test/template.docx', 'test/generated.docx');
//        });
//      });/*End of descript test */
//    });
//  });
//
});


