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
/* (\{.+?)(.+?\})[\s\S]*\1\+1\2 */
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
      assert.equal(parser.extractTags('<xmlstart>{{menu}}</xmlend>', _data), '<xmlstart>blabla</xmlend>');
      assert.equal(parser.extractTags('<xmlstart>  {{  menu  }} </xmlend>', _data), '<xmlstart>  blabla </xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{names}}</xmlend>', _data), '<xmlstart>Morpheus and Neo</xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', _data), '<xmlstart>blabla<interxml><bullshit></xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', _data), '<xmlstart>Nebuchadnezzar 2999</xmlend>');
    });
    it.skip('should works also with array', function(){
      var _data = {
        'menu' : [{
          'date' : 20120101
        },{
          'date' : 20120102
        }]
      };
      assert.equal(parser.extractTags('{{menu[i].date}} ', _data), '20120101 20120102');
    });
    it('should remove the tag in xml if there is no corresponding data in the object', function(){
      var _data = {
        'AAmenu' : 'blabla',
        'address' : {
          'AAcity' : 'Nebuchadnezzar',
          'zip' : '2999'
        }
      };
      assert.equal(parser.extractTags('<xmlstart>{{menu}}</xmlend>', _data), '<xmlstart></xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', _data), '<xmlstart><interxml><bullshit></xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', _data), '<xmlstart> 2999</xmlend>');
      assert.equal(parser.extractTags('<xmlstart>{{cars.wheels}}</xmlend>', _data), '<xmlstart></xmlend>');
    });
  });

  describe('cleanXml', function(){
    it('should extract the tag from xml', function(){
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
  });

  describe('detectCommonPoint', function(){
    it('should detect the common point', function(){
      var _str = 'menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr><tr>', 'pos': 40 });

      _str = 'menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr>   <tr>', 'pos': 40 });

      _str = 'menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr><tr>', 'pos': 61 });

      _str = 'menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle';
      helper.assert(parser.detectCommonPoint(_str), {'tag':'</tr:w><tr:w color=test test=3>', 'pos': 24 });
    });
  });


  describe('detectRepetition', function(){
    it('should detect the repetition', function(){
      var _xml = 'qsjh k <tr> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '<tr></tr>', 'pos': 52};
      var _expectedRange = {start: 7,  end : 52};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('should detect the repetition even if the start tag contains some meta data', function(){
      var _xml = 'qsjh k <tr w:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '<tr></tr>', 'pos': 70};
      var _expectedRange = {start: 7,  end : 70};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('should detect the repetition even if there a lot of similar tags in the middle', function(){
      var _xml = '<tr> qsjh k <tr> menu </tr><tr> bla </tr><tr> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd </tr>';
      var _pivot = {'tag' : '<tr></tr>', 'pos': 61};
      var _expectedRange = {start: 12,  end : 61};
      helper.assert(parser.detectRepetition(_xml, _pivot), _expectedRange);
    });

    it('should throw an error if the start tag is not found', function(){
      var _xml = 'qsjh k <qsd:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '<tr></tr>', 'pos': 70};
      assert.throws(function(){parser.detectRepetition(_xml, _pivot)}, /Repetition/);
    });
  });


  describe('generateXml', function(){
    it('should repeat and generate all the possible cases', function(){
      var _data ={
        'menu[i]':3
      };
      assert.equal(parser.generateXml(_data, '<tr>{{menu[i].id}}</tr>'), '<tr>{{menu[0].id}}</tr><tr>{{menu[1].id}}</tr><tr>{{menu[2].id}}</tr>');
    });
    it('should works with multiple keys', function(){
      var _data ={
        'menu[i]':2
      };
      assert.equal(parser.generateXml(_data, '<tr>{{menu[i].id}}<br>{{menu[i].label}}</tr>'), '<tr>{{menu[0].id}}<br>{{menu[0].label}}</tr><tr>{{menu[1].id}}<br>{{menu[1].label}}</tr>');
    });
    it('should repeat only the last part of the array (the iterator)', function(){
      var _data = {
        'menu[test=1][0][i]':2
      };
      assert.equal(parser.generateXml(_data, '<tr>{{menu[test=1][0][i].id}}</tr>'), '<tr>{{menu[test=1][0][0].id}}</tr><tr>{{menu[test=1][0][1].id}}</tr>');
    });
    it('should works also when the iterator is not "i"', function(){
      var _data = {
        'menu[test=1][0][dish.id+1]':2
      };
      assert.equal(parser.generateXml(_data, '<tr>{{menu[test=1][0][dish.id + 1].id}}</tr>'), '<tr>{{menu[test=1][0][0].id}}</tr><tr>{{menu[test=1][0][1].id}}</tr>');
    });
    it('should works with whitespaces. It should remove whitespace only on the iterator', function(){
      var _data = {
        ' menu [ test =1 ] [0] [ dish .id + 1 ]':2
      };
      assert.equal(parser.generateXml(_data, '<tr>{{ menu [ test =1 ] [0] [ dish .id + 1 ].id}}</tr>'), '<tr>{{ menu [ test =1 ] [0] [0].id}}</tr><tr>{{ menu [ test =1 ] [0] [1].id}}</tr>');
    });
    it('should repeat nested arrays', function(){
      var _data ={
        'menu[i]':3,
        'menu[i][i]':2
      };
      assert.equal(parser.generateXml(_data, '<tr>{{menu[i].id}}<td>{{menu[i].element[i].id}}</td></tr>'), '<tr>{{menu[0].id}}</tr><tr>{{menu[1].id}}</tr><tr>{{menu[2].id}}</tr>');
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

    it('should sort the array even if some arrays are incomplete, undefined values are appears first', function(){
      var _data     = [{'pos':[4, 4, 2]}, {'pos':[4, 4, 1]}, {'pos':[2, 4   ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[1      ]}];
      var _expected = [{'pos':[1      ]}, {'pos':[1, 9, 1]}, {'pos':[2, 3   ]}, {'pos':[2, 4   ]}, {'pos':[4, 4, 1]}, {'pos':[4, 4, 2]}];
      parser.sortXmlString(_data, 3)
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

  });


  describe('getSubsitition', function(){
    it('should extract the tags from the xml, return the xml without the tags and a list of tags with their position in the xml', function(){
      helper.assert(parser.getSubsitition('{{menu}}'), {
        tags : [{'pos': 0, 'name':'menu'}], 
        xml : ''
      });
      helper.assert(parser.getSubsitition('<div>{{menu}}<div>'), {
        tags : [{'pos': 5, 'name':'menu'}], 
        xml : '<div><div>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>'), {
        tags : [{'pos': 10, 'name':'menu'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend>'
      });
      helper.assert(parser.getSubsitition('<div>{{menu}}<div>{{city}}'), {
        tags : [{'pos': 5, 'name':'menu'},{'pos':10, 'name':'city'}],
        xml : '<div><div>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend><tga>{{ci<td>ty</td>}}<tga><bla>{{cars}}</bla>'), {
        tags : [{'pos': 10, 'name':'menu'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
      helper.assert(parser.getSubsitition('<xmlstart>{{me<interxml>n<bullshit>u[i].city}}</xmlend><tga>{{ci<td>ty</td>}}<tga><bla>{{cars[i].wheel}}</bla>'), {
        tags : [{'pos': 10, 'name':'menu[i].city'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars[i].wheel'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
    });
  });


  describe('extractXmlParts', function(){
    it('should extract xml parts', function(){
      var _xml = '<div></div>';
      var _tags = [
        {'pos': 5, 'name': 'd.menu'},
      ];
      var _descriptor = {
        'd0':{
          'name':'',
          'type': 'object',
        }
      };
      helper.assert(parser.extractXmlParts(_xml, _tags, _descriptor), {
        'staticData'  : {
          'before':'<div>',
          'after' :'</div>'
        },
        'dynamicData' : {
          'd0':{
            'name':'',
            'type': 'object',
            'xmlParts' : [
              {'before':'', 'obj': 'd0', 'attr':'menu', 'position':5, 'after': ''}
            ]
          }
        }
      });
    });
  });


});


