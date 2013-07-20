var assert = require('assert');
var parser = require('../lib/parser');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('parser', function(){
  
  describe('findMarkers', function(){
    it('should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml', function(){
      helper.assert(parser.findMarkers('{menu}'), {
        markers : [{'pos': 0, 'name':'menu'}], 
        xml : ''
      });
      helper.assert(parser.findMarkers('<div>{menu}<div>'), {
        markers : [{'pos': 5, 'name':'menu'}], 
        xml : '<div><div>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u}</xmlend>'), {
        markers : [{'pos': 10, 'name':'menu'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend>'
      });
      helper.assert(parser.findMarkers('<div>{menu}<div>{city}'), {
        markers : [{'pos': 5, 'name':'menu'},{'pos':10, 'name':'city'}],
        xml : '<div><div>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars}</bla>'), {
        markers : [{'pos': 10, 'name':'menu'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u[i].city}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars[i].wheel}</bla>'), {
        markers : [{'pos': 10, 'name':'menu[i].city'},{'pos':44, 'name':'city'},{'pos':63, 'name':'cars[i].wheel'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
    });
    it('should remove unwanted characters', function(){
      helper.assert(parser.findMarkers('<div>{menu}<div> \n   {city}'), {
        markers : [{'pos': 5, 'name':'menu'},{'pos':15, 'name':'city'}],
        xml : '<div><div>     '
      });
    });
    it('should convert conflicting characters', function(){
      assert.equal(parser.findMarkers("<div>{menu}<div> it's \n   {city}").xml, "<div><div> it\\\'s     ");
    });
    it('should remove whitespaces which are inside {} and not inside <>. It should not count them for the position', function(){
      helper.assert(parser.findMarkers(' <div>   {  menu  }   <div>   {   city  } '), {
        markers : [{'pos': 9, 'name':'menu'},{'pos':20, 'name':'city'}],
        xml : ' <div>      <div>    '
      });
      helper.assert(parser.findMarkers(' <xmlstart> {  me  <interxml> n <bull  sh it> u [ i ] . city } </xmlend> <tga> {ci  <td>  ty  </td>  } <tga><bla>{cars[i].wheel}</bla>'), {
        markers : [{'pos': 12, 'name':'menu[i].city'},{'pos':52, 'name':'city'},{'pos':72, 'name':'cars[i].wheel'}], 
        xml : ' <xmlstart> <interxml><bull  sh it> </xmlend> <tga> <td></td> <tga><bla></bla>'
      });
    });
  });
  
  describe('extractMarker', function(){
    it('should extract the marker from the xml and keep whitespaces and special characters (-> very important)', function(){
      assert.equal(parser.extractMarker('menu<xmla>why[1].test'), 'menuwhy[1].test');
      assert.equal(parser.extractMarker('  menu<xmla>why[1].test    '), '  menuwhy[1].test    ');
      assert.equal(parser.extractMarker('  menu <xmla> why[ $ <tr> dead = <bd> true + 1 ].test : int    '), '  menu  why[ $  dead =  true + 1 ].test : int    ');
      assert.equal(parser.extractMarker('menu<some xml data>why<sqs>[1<sas  >].test'), 'menuwhy[1].test');
      assert.equal(parser.extractMarker(' menu  <some xml data>  why  <sqs> [ 1 <sas  >] . test '), ' menu    why   [ 1 ] . test ');
      assert.equal(parser.extractMarker('menu<some xml data>why<sqs>[1<sas  >\n<qqs>].test'), 'menuwhy[1\n].test');
      assert.equal(parser.extractMarker('menu<some xml data>why<sqs>[1<sas  >\t<qqs>].test'), 'menuwhy[1\t].test');
      assert.equal(parser.extractMarker('menu</w:t></w:r><w:r w:rsidR="00013394"><w:t>why</w:t></w:r><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r w:rsidR="00013394"><w:t>[1].</w:t></w:r><w:r w:rsidR="00013394"><w:t>test</w:t></w:r><w:r w:rsidR="00013394"><w:t xml:space="preserve">'),
      'menuwhy[1].test');
    });
  });

  describe('cleanMarker', function(){
    it('should remove whitespaces and special characters in the markers', function(){
      assert.equal(parser.cleanMarker(' menuwhy[1].test    ')         , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker(' menu    why   [ 1 ] . test ') , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker('menuwhy[1\n].test')            , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker('menuwhy[1\t].test')            , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker('menuwhy[ i + 1 \n ].test')     , 'menuwhy[i+1].test');
      assert.equal(parser.cleanMarker(' menu  . t   .b :  int ')      , 'menu.t.b:int');
    });
  });

  describe('cleanXml', function(){
    it('should extract only the xml (it removes all markers from xml)', function(){
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
    it('should extract only the xml (it removes all markers from xml)', function(){
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
  });

  describe('findOpeningTagPosition', function(){
    it('should return the index of the opening tag on the left', function(){
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqdsqd</tr>', 'tr'), 5);
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 5);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 16);
      assert.equal(parser.findOpeningTagPosition('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 13);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr'), 14);
      assert.equal(parser.findOpeningTagPosition('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>', 'tr'), 17);
    });
    it('should return -1 when the opening tag is not found', function(){
      assert.equal(parser.findOpeningTagPosition('aasqdsqd</tr>', 'tr'), -1);
      assert.equal(parser.findOpeningTagPosition('aasas<tr></tr>sqdsqd</tr>', 'tr'), -1);
    });
    it('should accept a third parameter which indicates that the opening tag is before it.\
        It forces the algorithm to find the opening tag before this position', function(){
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 14), 3);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 22), 3);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 23), 3);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 30), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 37), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 40), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 88), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 54), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 't_row', 1000), 23);

      assert.equal(parser.findOpeningTagPosition('xx <td> <td> tab </td> </td>', 'td', 13), 3);

      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqdsqd</tr>', 'tr',9), 5);
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr', 11), 5);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr', 22), 16);
      assert.equal(parser.findOpeningTagPosition('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr', 20), 13);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 'tr', 23), 14);
      assert.equal(parser.findOpeningTagPosition('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>', 'tr', 37), 17);
    });
  });

  describe('findClosingTagPosition', function(){
    it('should return the index of the closing tag on the right', function(){
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd</tr>sqdsd', 'tr'), 15);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqdsd', 'tr'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd<tr></tr>sd', 'tr'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd</tr></tr>sd', 'tr'), 35);
    });
    it('should return -1 when the closing tag is not found', function(){
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqdsd', 'tr'), -1);
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd<tr></tr>sqdsd', 'tr'), -1);
    });
  });

  describe('findPivot', function(){
    it('should detect the pivot point, where the transition between two rows (or columns) happens', function(){
      var _str = '</td> </tr><tr> <td>';
      helper.assert(parser.findPivot(_str), {'tag':'</tr><tr>', 'pos': 11 });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {'tag':'</tr><tr>', 'pos': 40 });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {'tag':'</tr>   <tr>', 'pos': 40 });
      _str = 'menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {'tag':'</tr><tr>', 'pos': 61 });
      _str = 'menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle';
      helper.assert(parser.findPivot(_str), {'tag':'</tr:w><tr:w color=test test=3>', 'pos': 24 });
      _str = '<h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> ';
      helper.assert(parser.findPivot(_str), {'tag':'</tr> <tr A>', 'pos': 55 });
    });
    it('should detect the pivot point even if the repetition is not an array or a list', function(){
      var _str = '</h1> <h1></h1> <h1></h1> <h1></h1> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {'tag':'</h1> <h1>', 'pos': 35 });
      var _str = '</h1> <h1></h1> <h1></h1> <h3></h3> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {'tag':'</h3> <h1>', 'pos': 35 });
      var _str = ' </t_row> <t_row></t_row> <t_row> ';
      helper.assert(parser.findPivot(_str), {'tag':'</t_row> <t_row>', 'pos': 25 });
    });
  });

  describe('findRepetitionPosition', function(){
    it('should detect the repetition', function(){
      var _xml = '<tr>  </tr><tr> </tr>';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 11};
      var _expectedRange = {startEven: 0,  endEven : 11, startOdd:11, endOdd:21};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition', function(){
      var _xml = 'qsjh k <tr> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 52};
      var _expectedRange = {startEven: 7,  endEven : 52, startOdd:52, endOdd:102};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if the start tag contains some meta data', function(){
      var _xml = 'qsjh k <tr w:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr w:blue color=test> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 70};
      var _expectedRange = {startEven: 7,  endEven : 70, startOdd:70, endOdd:138};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if there a lot of similar tags and nested tags in the middle', function(){
      var _xml = '<tr> qsjh k </tr><tr>start<tr><tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr><tr>   <tr> menu </tr><tr> bla </tr><tr><tr> balle </tr></tr> end </tr> <tr> </tr>';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 87};
      var _expectedRange = {startEven: 17,  endEven : 87, startOdd:87, endOdd:158};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even there is some whitespaces in the pivot', function(){
      var _xml = 'qsjh k <tr> menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 53};
      var _expectedRange = {startEven: 7,  endEven : 53, startOdd:53, endOdd:105};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should return -1 if the start tag is not found', function(){
      var _xml = 'qsjh k <qsd:blue color=test> menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle </tr> dqd';
      var _pivot = {'tag' : '</tr><tr>', 'pos': 70};
      var _expectedRange = {startEven: -1,  endEven : 70, startOdd:70, endOdd:69};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should accept a third parameter which indicates that the beginning of the repetition is before it', function(){
      var _xml = ' <t_row> </t_row> <t_row>useless</t_row><t_row> </t_row>';
      var _pivot = {'tag' : '</t_row> <t_row>', 'pos': 40};
      var _expectedRange = {startEven: 1,  endEven : 40, startOdd:40, endOdd:56};
      var _roughStart = 9;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
  });


});


