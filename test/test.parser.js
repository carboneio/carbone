var assert = require('assert');
var parser = require('../lib/parser');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('parser', function(){
  
  describe('findMarkers', function(){
    it('should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function(){
      helper.assert(parser.findMarkers('{menu}'), {
        markers : [{'pos': 0, 'name':'_root.menu'}], 
        xml : ''
      });
      helper.assert(parser.findMarkers('<div>{menu}<div>'), {
        markers : [{'pos': 5, 'name':'_root.menu'}], 
        xml : '<div><div>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u}</xmlend>'), {
        markers : [{'pos': 10, 'name':'_root.menu'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend>'
      });
      helper.assert(parser.findMarkers('<div>{menu}<div>{city}'), {
        markers : [{'pos': 5, 'name':'_root.menu'},{'pos':10, 'name':'_root.city'}],
        xml : '<div><div>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars}</bla>'), {
        markers : [{'pos': 10, 'name':'_root.menu'},{'pos':44, 'name':'_root.city'},{'pos':63, 'name':'_root.cars'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
      helper.assert(parser.findMarkers('<xmlstart>{me<interxml>n<bullshit>u[i].city}</xmlend><tga>{ci<td>ty</td>}<tga><bla>{cars[i].wheel}</bla>'), {
        markers : [{'pos': 10, 'name':'_root.menu[i].city'},{'pos':44, 'name':'_root.city'},{'pos':63, 'name':'_root.cars[i].wheel'}], 
        xml : '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>'
      });
    });
    it('should remove unwanted characters', function(){
      helper.assert(parser.findMarkers('<div>{menu}<div> \n   {city}'), {
        markers : [{'pos': 5, 'name':'_root.menu'},{'pos':15, 'name':'_root.city'}],
        xml : '<div><div>     '
      });
    });
    it('should convert conflicting characters', function(){
      assert.equal(parser.findMarkers("<div>{menu}<div> it's \n   {city}").xml, "<div><div> it\\\'s     ");
    });
    it('should remove whitespaces which are inside {} and not inside <>. It should not count them for the position', function(){
      helper.assert(parser.findMarkers(' <div>   {  menu  }   <div>   {   city  } '), {
        markers : [{'pos': 9, 'name':'_root.menu'},{'pos':20, 'name':'_root.city'}],
        xml : ' <div>      <div>    '
      });
      helper.assert(parser.findMarkers(' <xmlstart> {  me  <interxml> n <bull  sh it> u [ i ] . city } </xmlend> <tga> {ci  <td>  ty  </td>  } <tga><bla>{cars[i].wheel}</bla>'), {
        markers : [{'pos': 12, 'name':'_root.menu[i].city'},{'pos':52, 'name':'_root.city'},{'pos':72, 'name':'_root.cars[i].wheel'}], 
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
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqdsqd</tr>'), 5);
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 5);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 16);
      assert.equal(parser.findOpeningTagPosition('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 13);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 14);
      assert.equal(parser.findOpeningTagPosition('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>'), 17);
    });
    it('should return -1 when the opening tag is not found', function(){
      assert.equal(parser.findOpeningTagPosition('aasqdsqd</tr>'), -1);
      assert.equal(parser.findOpeningTagPosition('aasas<tr></tr>sqdsqd</tr>'), -1);
      assert.equal(parser.findOpeningTagPosition('<p></p></p><p></p></p><br/>',22), -1);
      assert.equal(parser.findOpeningTagPosition('</p><p><p><br/></p></p><br/>',4), -1);
    });
    it('should accept a third parameter which indicates that the opening tag is before it.\
        It forces the algorithm to find the opening tag before this position', function(){
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 14), 3);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 22), 3);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 23), 22);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 30), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 37), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 40), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 88), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 54), 23);
      assert.equal(parser.findOpeningTagPosition('xx <t_row> qq </t_row> <t_row>useless</t_row>', 1000), 23);

      assert.equal(parser.findOpeningTagPosition('xx <td> <td> tab </td> </td>', 13), 3);

      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqdsqd</tr>',9), 5);
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 11), 5);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 22), 16);
      assert.equal(parser.findOpeningTagPosition('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 20), 13);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>', 23), 14);
      assert.equal(parser.findOpeningTagPosition('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>', 37), 17);
    });
    it('should always return a valid xml markup from the opening tag position to the end if an empty string is passed.\
             even if there are self-closing tags...', function(){
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',13), 11);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',11), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',10), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',6), 0);

      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p>',13), 3); //should return 3 in order to have a valid xml markup
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/>',16), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/>',17), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/>',18), 17);
      assert.equal(parser.findOpeningTagPosition('<p><p><p><br/></p></p><br/>',25), 22);
      assert.equal(parser.findOpeningTagPosition('<p><p><p><br/></p></p><br/>',27), 22);
      assert.equal(parser.findOpeningTagPosition('<p><p><p><br/></p></p><br/>',22), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p><br/></p></p><br/>',6), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/><p></p>',16), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/><p></p>',17), 3);
      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/><p></p>',18), 17);

      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p><br/> <p><p></p></p><p></p>',17), 3);
    });
    it('should not take into account the whitespaces between tags.\
        it should always return a position which is lower than "indexWhereToStopSearch"', function(){
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',11), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',12), 11);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',14), 13);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/> qszd  <file/>',16), 15);
      assert.equal(parser.findOpeningTagPosition('<tar/><br color="3"/>   <file/>',24), 23);
    });
    it('should accept variable in xml', function(){
      assert.equal(parser.findOpeningTagPosition('<p color="dd" bold=true><p><p bold=true></p></p><br color="dd" bold=true /> <p color="aa" ><p></p></p><p></p>',48), 24);
    });
  });

  describe('findClosingTagPosition', function(){
    it('should return the index of the closing tag on the right', function(){
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd</tr>sqdsd'), 15);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqdsd'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd<tr></tr>sd'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd</tr></tr>sd'), 35);
    });
    it('should return -1 when the closing tag is not found', function(){
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqdsd'), -1);
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd<tr></tr>sqdsd'), -1);
      assert.equal(parser.findClosingTagPosition('<br/><p><p></p></p></p><br/>', 21), -1);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 10000), -1);
    });
    it('should accept a third parameter which indicates that the closing tag is after it.\
        It forces the algorithm to find the closing tag after this position', function(){
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 0), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 22), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 24), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 25), 42);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 40), 42);
    });
    it('should always return a valid xml markup from the beginning to the closing tag position if an empty string is passed.\
             even if there are self-closing tags...', function(){
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 13), 17);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 12), 17);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 11), 12);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 0), 6);
      assert.equal(parser.findClosingTagPosition('<br/>'), 5);

      assert.equal(parser.findClosingTagPosition('<p><p></p></p></p>'), 14); 
      assert.equal(parser.findClosingTagPosition('<p><p></p></p></p>',13), 14);
      assert.equal(parser.findClosingTagPosition('<br/><p><p></p></p></p><br/>', 6), 19);
    });
    it('should accept variable in xml', function(){
      assert.equal(parser.findClosingTagPosition('<p color="dd" bold=true><p><p bold=true></p></p><br color="dd" bold=true /> <p color="aa" ><p></p></p></p></p></p>'), 106);
    });
  });

  describe('findPivot', function(){
    it('should return null if the pivot cannot be found', function(){
      var _str = '';
      helper.assert(parser.findPivot(_str), null);
      _str = '</tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '</tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr></tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '</tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
    });
    it('should detect the pivot point. It represents the transition between the two repeated parts', function(){
      var _str = '</td> </tr><tr> <td>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 11 },
        'part2Start':{'tag':'tr', 'pos': 11 }
      });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 40 },
        'part2Start':{'tag':'tr', 'pos': 40 }
      });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 43 },
        'part2Start':{'tag':'tr', 'pos': 43 }
      });
      _str = 'menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 61 },
        'part2Start':{'tag':'tr', 'pos': 61 }
      });
      _str = '<h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> ';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 56 },
        'part2Start':{'tag':'tr', 'pos': 56 }
      });
    });
    it('should work even if there are some tags between the two repeated parts (+ complex case)', function(){
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tab', 'pos': 35 },
        'part2Start':{'tag':'tab', 'pos': 57 }
      });
    });
    it('should work even if the opening tag of the second part is not the same as the closing tag of the first part', function(){
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab2><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tab', 'pos': 35 },
        'part2Start':{'tag':'tab2', 'pos': 57 }
      });
    });
    it('should accept tags with variables', function(){
      var _str = 'menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr:w', 'pos': 24 },
        'part2Start':{'tag':'tr:w', 'pos': 24 }
      });
    });
    it('should detect the pivot point even if the repetition is not an array or a list (flat representation)', function(){
      var _str = '</h1> <h1></h1> <h1></h1> <h1></h1> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'h1', 'pos': 6 },
        'part2Start':{'tag':'h1', 'pos': 36 }
      });
      _str = '</h1> <h1></h1> <h1></h1> <h3></h3> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'h1', 'pos': 6 },
        'part2Start':{'tag':'h1', 'pos': 36 }
      });
      _str = ' </t_row> <t_row></t_row> <t_row> ';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'t_row', 'pos': 10 },
        'part2Start':{'tag':'t_row', 'pos': 26 }
      });
    });
    it('should accept self-closing tags and add a boolean "selfClosing" if the tag is a self-closing one', function(){
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter/><br/><tab2><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tab', 'pos': 35 },
        'part2Start':{'tag':'tab2', 'pos': 48 }
      });
      _str = '</p></p><br/></tr><tr><p></p></tr><br/></tab><inter/><br/><tab><p></p><p><tr><td><br/><p><br/></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tab', 'pos': 45 },
        'part2Start':{'tag':'tab', 'pos': 58 }
      });
      _str = '<br/><br/><br/>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'br', 'pos': 5, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 10, 'selfClosing':true}
      });
      _str = '<br/><br/><br/><br/>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'br', 'pos': 5, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 15, 'selfClosing':true}
      });
      _str = '<br/>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'br', 'pos': 5, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 5, 'selfClosing':true}
      });
      _str = '<br/><br/><tr>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'br', 'pos': 5, 'selfClosing':true},
        'part2Start':{'tag':'tr', 'pos': 10 }
      });
      _str = '<br/></tr><br/>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'tr', 'pos': 10 },
        'part2Start':{'tag':'br', 'pos': 10, 'selfClosing':true}
      });
    });
    it('should accept very complex case', function(){
      var _str = '<w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00137A31"><w:trPr><w:trHeight w:val="1760"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10012" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="auto"/></w:tcPr><w:p wsp:rsidR="00137A31" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00137A31" wsp:rsidP="007057CC"><w:pPr><w:rPr><w:b/><w:b-cs/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl><w:p wsp:rsidR="00F62BCC" wsp:rsidRDefault="00F62BCC"><w:pPr><w:rPr><w:sz w:val="32"/></w:rPr></w:pPr></w:p><w:tbl><w:tblPr><w:tblpPr w:leftFromText="180" w:rightFromText="180" w:horzAnchor="page" w:tblpX="1009"/><w:tblW w:w="10081" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:left w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:bottom w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:right w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/></w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="10081"/></w:tblGrid><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00F62BCC"><w:trPr><w:trHeight w:val="98"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10081" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="4F81BD"/></w:tcPr><w:p wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00F62BCC" wsp:rsidP="007E678B"><w:pPr><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr></w:pPr><w:r wsp:rsidRPr="00F62BCC"><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr>';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'w:tbl', 'pos': 485 },
        'part2Start':{'tag':'w:tbl', 'pos': 593 }
      });
    });
    /*it.skip('should accept non-XML structure', function(){
      var _str = ' ';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'', 'pos': 1 },
        'part2Start':{'tag':'', 'pos': 1 }
      });
    });*/
  });

  describe('findRepetitionPosition', function(){
    it('should return null of the pivot is null', function(){
      var _xml = '<tr>  </tr><tr> </tr>';
      helper.assert(parser.findRepetitionPosition(_xml, null), null);
    });
    it('should detect the repetition', function(){
      var _xml = '<tr>  </tr><tr> </tr>';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 11 },
        'part2Start':{'tag':'tr', 'pos': 11 }
      };
      var _expectedRange = {startEven: 0,  endEven : 11, startOdd:11, endOdd:21};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('2. should detect the repetition', function(){
      var _xml = 'qsjh k <tr> menu <r/><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 52 },
        'part2Start':{'tag':'tr', 'pos': 52 }
      };
      var _expectedRange = {startEven: 7,  endEven : 52, startOdd:52, endOdd:102};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if the start tag contains some meta data', function(){
      var _xml = 'qsjh k <tr w:blue color=test> menu <r/><p> bla </p><p> foot </p> </tr><tr w:blue color=test> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 70 },
        'part2Start':{'tag':'tr', 'pos': 70 }
      };
      var _expectedRange = {startEven: 7,  endEven : 70, startOdd:70, endOdd:138};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if there a lot of similar tags and nested tags in the middle', function(){
      var _xml = '<tr> qsjh k </tr><tr>start<tr><tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr><tr>   <tr> menu </tr><tr> bla </tr><tr><tr> balle </tr></tr> end </tr> <tr> </tr>';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 87 },
        'part2Start':{'tag':'tr', 'pos': 87 }
      };
      var _expectedRange = {startEven: 17,  endEven : 87, startOdd:87, endOdd:158};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even there is some whitespaces in the pivot', function(){
      var _xml = 'qsjh k <tr> menu <r/><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 53 },
        'part2Start':{'tag':'tr', 'pos': 53 }
      };
      var _expectedRange = {startEven: 7,  endEven : 53, startOdd:53, endOdd:105};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should return -1 if the start tag is not found', function(){
      var _xml = 'qsjh k  qsd:blue color=test   menu <r/><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        'part1End'  :{'tag':'tr', 'pos': 70 },
        'part2Start':{'tag':'tr', 'pos': 70 }
      };
      var _expectedRange = {startEven: -1,  endEven : 70, startOdd:70, endOdd:120};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should accept a third parameter which indicates that the beginning of the repetition is before it', function(){
      var _xml = ' <t_row> </t_row> <t_row>useless</t_row><t_row> </t_row>';
      var _pivot = {
        'part1End'  :{'tag':'t_row', 'pos': 40 },
        'part2Start':{'tag':'t_row', 'pos': 40 }
      };
      var _expectedRange = {startEven: 1,  endEven : 40, startOdd:40, endOdd:56};
      var _roughStart = 9;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should work even if there are some tags between the two repeated parts (+ complex case)', function(){
      var _xml = '<tab><p></p><tab><tr><p><p></p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab><p></p><p><tr><td><p></p><a></a></td></tr></p></tab><p></p></tab>';
      var _pivot = {
        'part1End'  :{'tag':'tab', 'pos': 62 },
        'part2Start':{'tag':'tab', 'pos': 84 }
      };
      var _expectedRange = {startEven: 12,  endEven : 84, startOdd:84, endOdd:141};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should work even if there are some self-closing tags', function(){
      var _xml = '<tab><p></p><tab><br/><tr><p><br/><p></p></p></tr><tr><p></p></tr></tab><inter/><br/><tab><p></p><p><tr><td><p></p><a></a></td></tr></p></tab><p></p></tab>';
      var _pivot = {
        'part1End'  :{'tag':'tab', 'pos': 72 },
        'part2Start':{'tag':'tab', 'pos': 85 }
      };
      var _expectedRange = {startEven: 12,  endEven : 85, startOdd:85, endOdd:142};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should work even if the opening tag of the second part is not the same as the closing tag of the first part', function(){
      var _xml = '<tab><p></p><tab><br/><tr><p><br/><p></p></p></tr><tr><p></p></tr></tab><inter/><br/><tab2><p></p><p><tr><td><p></p><a></a></td></tr></p></tab2><p></p></tab>';
      var _pivot = {
        'part1End'  :{'tag':'tab', 'pos': 72 },
        'part2Start':{'tag':'tab2', 'pos': 85 }
      };
      var _expectedRange = {startEven: 12,  endEven : 85, startOdd:85, endOdd:144};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should accept self-closing tags', function(){
      var _xml = '<doc><br/><br/><br/><br/></doc>';
      var _pivot = {
        'part1End'  :{'tag':'br', 'pos': 10, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 15, 'selfClosing':true}
      };
      var _expectedRange = {startEven: 5,  endEven : 15, startOdd:15, endOdd:20};
      var _roughStart = 11;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should accept only one self-closing tag between the two repeated parts', function(){
      var _xml = '<doc><br/></doc>';
      var _pivot = {
        'part1End'  :{'tag':'br', 'pos': 10, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 10, 'selfClosing':true}
      };
      var _expectedRange = {startEven: 5,  endEven : 10, startOdd:10, endOdd:10};
      var _roughStart = 6;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should not over-estimate the length of the repeated parts', function(){
      var _xml = '<xml><p><p><br/></p></p><br/><br/></xml>';
      var _pivot = {
        'part1End'  :{'tag':'br', 'pos': 29, 'selfClosing':true},
        'part2Start':{'tag':'br', 'pos': 29, 'selfClosing':true}
      };
      var _expectedRange = {startEven: 24,  endEven : 29, startOdd:29, endOdd:34};
      var _roughStart = 24;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
  });


});


