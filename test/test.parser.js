var assert = require('assert');
var parser = require('../lib/parser');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('parser', function(){
  
  describe('cleanTag', function(){
    it('should clean and remove any xml which are arround the tag', function(){
      assert.equal(parser.cleanTag('menu<xmla>why[1].test'), 'menuwhy[1].test');
      assert.equal(parser.cleanTag('  menu<xmla>why[1].test    '), 'menuwhy[1].test');
      assert.equal(parser.cleanTag('menu<some xml data>why<sqs>[1<sas  >].test'), 'menuwhy[1].test');
      //assert.equal('menuwhy[1].test', parser.cleanTag('menu<some xml data>why<sqs>[1<sas  >\n<qqs>].test'));
      assert.equal(parser.cleanTag('menu</w:t></w:r><w:r w:rsidR="00013394"><w:t>why</w:t></w:r><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r w:rsidR="00013394"><w:t>[1].</w:t></w:r><w:r w:rsidR="00013394"><w:t>test</w:t></w:r><w:r w:rsidR="00013394"><w:t xml:space="preserve">'),
      'menuwhy[1].test');
    });
  });

  describe('cleanXml', function(){
    it('should extract the tag from xml', function(){
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
  });

  describe('findClosingTagIndex', function(){
    it('should return the index of the closing tag on the right', function(){
      assert.equal(parser.findClosingTagIndex('<tr>sqdsqd</tr>sqdsd', 'tr'), 15);
      assert.equal(parser.findClosingTagIndex('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqdsd', 'tr'), 35);
      assert.equal(parser.findClosingTagIndex('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd<tr></tr>sd', 'tr'), 35);
      assert.equal(parser.findClosingTagIndex('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd</tr></tr>sd', 'tr'), 35);
    });
    it('should return -1 when the closing tag is not found', function(){
      assert.equal(parser.findClosingTagIndex('<tr>sqdsqdsd', 'tr'), -1);
      assert.equal(parser.findClosingTagIndex('<tr>sqdsqd<tr></tr>sqdsd', 'tr'), -1);
    });
  });

  describe('findOpeningTagIndex', function(){
    it('should return the index of the opening tag on the left', function(){
      assert.equal(parser.findOpeningTagIndex('aasas<tr>sqdsqd</tr>', 'tr'), 5);
      assert.equal(parser.findOpeningTagIndex('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 5);
      assert.equal(parser.findOpeningTagIndex('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 16);
      assert.equal(parser.findOpeningTagIndex('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 13);
      assert.equal(parser.findOpeningTagIndex('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 14);
      assert.equal(parser.findOpeningTagIndex('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>', 'tr'), 17);
    });
    it('should return -1 when the opening tag is not found', function(){
      assert.equal(parser.findOpeningTagIndex('aasqdsqd</tr>', 'tr'), -1);
      assert.equal(parser.findOpeningTagIndex('aasas<tr></tr>sqdsqd</tr>', 'tr'), -1);
    });
  });

  describe('detectCommonPoint', function(){
    it('1. should detect the common point', function(){
      var _str = 'menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr><tr>', 'pos': 40 });

      _str = 'menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr>   <tr>', 'pos': 40 });

      _str = 'menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr><tr>', 'pos': 61 });

      _str = 'menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr:w><tr:w color=test test=3>', 'pos': 24 });
    });
    it('2. should detect the common point', function(){
      var _str = '<h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> ';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr> <tr A>', 'pos': 55 });
    });
  });


  describe('detectRepetition', function(){
    it('1. should detect the repetition', function(){
      var _xml = 'qsjh k <tr> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 52};
      var _expectedRange = {startEven: 7,  endEven : 52, startOdd:52, endOdd:102};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('2. should detect the repetition even if the start tag contains some meta data', function(){
      var _xml = 'qsjh k <tr w:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr w:blue color=test> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 70};
      var _expectedRange = {startEven: 7,  endEven : 70, startOdd:70, endOdd:138};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('3. should detect the repetition even if there a lot of similar tags and nested in the middle', function(){
      var _xml = '<tr> qsjh k </tr><tr>start<tr><tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr><tr>   <tr> menu </tr><tr> bla </tr><tr><tr> balle </tr></tr> end </tr> <tr> </tr>';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 87};
      var _expectedRange = {startEven: 17,  endEven : 87, startOdd:87, endOdd:158};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('5. should detect the repetition even there is some spaces in the pivot', function(){
      var _xml = 'qsjh k <tr> menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 53};
      var _expectedRange = {startEven: 7,  endEven : 53, startOdd:53, endOdd:105};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('4. should returnu -1 if the start tag is not found', function(){
      var _xml = 'qsjh k <qsd:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 70};
      var _expectedRange = {startEven: -1,  endEven : 70, startOdd:70, endOdd:69};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });
  });



  describe('sortXmlString', function(){
    it('should sort the array with a depth of 1 by default', function(){
      var _data     = [{'pos':[40]}, {'pos':[19]}, {'pos':[2 ]}, {'pos':[20]}];
      var _expected = [{'pos':[2 ]}, {'pos':[19]}, {'pos':[20]}, {'pos':[40]}];
      parser.sortXmlString(_data)
      helper.assert(_data, _expected);
    });

    it('should sort the array with a depth of 2', function(){
      var _data     = [{'pos':[40, 4]}, {'pos':[40, 3]}, {'pos':[51, 100]}, {'pos':[29, 8  ]}];
      var _expected = [{'pos':[29, 8]}, {'pos':[40, 3]}, {'pos':[40, 4  ]}, {'pos':[51, 100]}];
      parser.sortXmlString(_data, 2)
      helper.assert(_data, _expected);
    });

    it('should sort the array with a depth of 3', function(){
      var _data     = [{'pos':[4, 4, 2]}, {'pos':[4, 4, 1]}, {'pos':[4, 3, 2]}, {'pos':[1, 9, 1]}, {'pos':[2, 5, 6]}, {'pos':[1, 8, 9]}];
      var _expected = [{'pos':[1, 8, 9]}, {'pos':[1, 9, 1]}, {'pos':[2, 5, 6]}, {'pos':[4, 3, 2]}, {'pos':[4, 4, 1]}, {'pos':[4, 4, 2]}];
      parser.sortXmlString(_data, 3)
      helper.assert(_data, _expected);
    });

    it('should sort the array even if some arrays are incomplete, undefined values appears first', function(){
      var _data     = [{'pos':[4, 4, 2]}, {'pos':[4, 4, 1]}, {'pos':[2, 4   ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[1      ]}];
      var _expected = [{'pos':[1      ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[2, 4   ]}, {'pos':[4, 4, 1]}, {'pos':[4, 4, 2]}];
      parser.sortXmlString(_data, 3)
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
      parser.sortXmlString(_data, 10);
      helper.assert(_data, _expected);
    });
  });

  describe('concatString', function(){
    it('should sort the array of xml parts and return an concatenate string', function(){
      var _data     = [
        {'pos':[40], 'str': '4'}, 
        {'pos':[19], 'str': '2'}, 
        {'pos':[2 ], 'str': '1'}, 
        {'pos':[20], 'str': '3'}
      ];
      helper.assert(parser.concatString(_data), '1234');
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
      helper.assert(parser.concatString(_data, 3), '123456');
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
      helper.assert(parser.concatString(_data, 5), '<xml><tr>Lumeneo</tr><tr>Tesla motors</tr><tr>Toyota</tr></xml>');
    });
  });


  describe('getSubsitition', function(){
    it('should extract the tags from the xml, return the xml without the tags and a list of tags with their position in the xml', function(){
      helper.assert(parser.getSubsitition('{menu}'), {
        tags : [{'pos': 0, 'name':'menu'}], 
        xml : ''
      });
      helper.assert(parser.getSubsitition('<div>{menu}<div>'), {
        tags : [{'pos': 5, 'name':'menu'}], 
        xml : '<div><div>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{me<interxml>n<bullshit>u}</xmlend>'), {
        tags : [{'pos': 10, 'name':'menu'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend>'
      });
      helper.assert(parser.getSubsitition('<div>{menu}<div>{city}'), {
        tags : [{'pos': 5, 'name':'menu'},{'pos':10, 'name':'city'}],
        xml : '<div><div>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{me<interxml>n<bullshit>u}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars}</bla>'), {
        tags : [{'pos': 10, 'name':'menu'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{me<interxml>n<bullshit>u[i].city}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars[i].wheel}</bla>'), {
        tags : [{'pos': 10, 'name':'menu[i].city'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars[i].wheel'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
    });
    it('should remove unwanted characters', function(){
      helper.assert(parser.getSubsitition('<div>{menu}<div> \n   {city}'), {
        tags : [{'pos': 5, 'name':'menu'},{'pos':15, 'name':'city'}],
        xml : '<div><div>     '
      });
    });
  });


  describe('extractXmlParts', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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
    it('should extract xml parts', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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
    it('2 should extract xml parts', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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
    it('3 should extract xml parts', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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
    
    it('4 should extract xml parts nested object in an array', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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

    it('5 should extract xml parts: two nested arrays', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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

    it('6 should extract xml parts: two nested arrays', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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

    it('7 should extract xml parts: two nested arrays inverse order', function(){
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
      helper.assert(parser.extractXmlParts(_xml, _descriptor), {
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


});


