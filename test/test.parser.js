var assert  = require('assert');
var parser  = require('../lib/parser');
var helper  = require('../lib/helper');
var count   = require('../formatters/array').count;

describe('parser', function () {

  describe('findMarkers', function () {
    it('should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object. It should replace the marker by a reserved character', function (done) {
      parser.findMarkers('{d.menu}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 1, name : '_root.d.menu'}]);
        helper.assert(cleanedXml, '\uFFFF');
        done();
      });
    });
    it('should find marker even if there is a bracket before the markers', function (done) {
      parser.findMarkers('<xml>{toto {d.toto}</xml>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 12, name : '_root.d.toto'}]);
        helper.assert(cleanedXml, '<xml>{toto \uFFFF</xml>');
        done();
      });
    });
    it('should find a marker without cleaning the XML', function (done) {
      parser.findMarkers('<xml><div>{d.<div/>to<br/>to}<div></xml>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 11, name : '_root.d.<div/>to<br/>to'}]);
        helper.assert(cleanedXml, '<xml><div>\uFFFF<div></xml>');
        done();
      });
    });
    it('should find multiple markers even if there are brackets before the markers', function (done) {
      parser.findMarkers('<xml>{d.tata} {to{c.menu} {to {d.toto}</xml>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.d.tata'}, {pos : 11, name : '_root.c.menu'}, {pos : 17, name : '_root.d.toto'}]);
        helper.assert(cleanedXml, '<xml>\uFFFF {to\uFFFF {to \uFFFF</xml>');
        done();
      });
    });
    it('2. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<div>{c.menu}<div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.c.menu'}]);
        helper.assert(cleanedXml, '<div>\uFFFF<div>');
        done();
      });
    });
    it('3. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      callFindMarkers('<xmlstart>{d.me<interxml>n<bullshit>u}</xmlend>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 11, name : '_root.d.menu'}]);
        helper.assert(cleanedXml, '<xmlstart>\uFFFF<interxml><bullshit></xmlend>');
        done();
      });
    });
    it('4. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      callFindMarkers('<div>{d.menu}<div>{d.city}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.d.menu'},{pos : 12, name : '_root.d.city'}]);
        helper.assert(cleanedXml, '<div>\uFFFF<div>\uFFFF');
        done();
      });
    });
    it('5. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      callFindMarkers('<xmlstart>{d.me<interxml>n<bullshit>u}</xmlend><tga>{d.ci<td>ty</td>}<tga><bla>{d.cars}</bla>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 11, name : '_root.d.menu'},{pos : 46, name : '_root.d.city'},{pos : 66, name : '_root.d.cars'}]);
        helper.assert(cleanedXml, '<xmlstart>\uFFFF<interxml><bullshit></xmlend><tga>\uFFFF<td></td><tga><bla>\uFFFF</bla>');
        done();
      });
    });
    it('6. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      callFindMarkers('<xmlstart>{d.me<interxml>n<bullshit>u[i].city}</xmlend><tga>{d.ci<td>ty</td>}<tga><bla>{c.cars[i].wheel}</bla>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 11, name : '_root.d.menu[i].city'},{pos : 46, name : '_root.d.city'},{pos : 66, name : '_root.c.cars[i].wheel'}]);
        helper.assert(cleanedXml, '<xmlstart>\uFFFF<interxml><bullshit></xmlend><tga>\uFFFF<td></td><tga><bla>\uFFFF</bla>');
        done();
      });
    });
    it('It should find marker which is in another marker', function (done) {
      callFindMarkers('<w:r><w:rPr><w:color /></w:rPr><w:t>{</w:t></w:r><w:r ><w:rPr><w:color w:val="{d.perso[i].color}" /></w:rPr><w:t>d.perso</w:t></w:r><w:r><w:rPr><w:color /></w:rPr><w:t>[i].nom}</w:t></w:r>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 37, name : '_root.d.perso[i].nom'},{pos : 79, name : '_root.d.perso[i].color'}]);
        helper.assert(cleanedXml, '<w:r><w:rPr><w:color /></w:rPr><w:t>\uFFFF</w:t></w:r><w:r ><w:rPr><w:color w:val="\uFFFF" /></w:rPr><w:t></w:t></w:r><w:r><w:rPr><w:color /></w:rPr><w:t></w:t></w:r>');
        done();
      });
    });
    it('It should find multiple markers which are in another marker', function (done) {
      callFindMarkers('<w:r><w:color /><w:t>{</w:t></w:r><w:r ><w:color w:val="{d.perso[i].color}" /><w:t>d.perso</w:t></w:r><w:r><w:rPr test="{d.perso[i].test}"><w:color /></w:rPr><w:t>[i].nom}</w:t></w:r>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 22, name : '_root.d.perso[i].nom'},{pos : 57, name : '_root.d.perso[i].color'},{pos : 97, name : '_root.d.perso[i].test'}]);
        helper.assert(cleanedXml, '<w:r><w:color /><w:t>\uFFFF</w:t></w:r><w:r ><w:color w:val="\uFFFF" /><w:t></w:t></w:r><w:r><w:rPr test="\uFFFF"><w:color /></w:rPr><w:t></w:t></w:r>');
        done();
      });
    });
    it('It should find multiple markers inside tag which are themselves in other markers', function (done) {
      callFindMarkers('<xml><tr>{d.to<ha a="{d.toto}" b="{d.tata}" c="{d.titi}">to[i]</ha>.na<he a="{d.toto}" b="{d.tata}" c="{d.titi}">me</he>}</tr><tr>{d.to<ha a="{d.toto}" b="{d.tata}" c="{d.titi}">to[i+</ha>1].na<he a="{d.toto}" b="{d.tata}" c="{d.titi}">me</he>}</tr></xml>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          {pos : 10, name : '_root.d.toto[i].name'},
          {pos : 18, name : '_root.d.toto'},
          {pos : 24, name : '_root.d.tata'},
          {pos : 30, name : '_root.d.titi'},
          {pos : 45, name : '_root.d.toto'},
          {pos : 51, name : '_root.d.tata'},
          {pos : 57, name : '_root.d.titi'},
          {pos : 74, name : '_root.d.toto[i+1].name'},
          {pos : 82, name : '_root.d.toto'},
          {pos : 88, name : '_root.d.tata'},
          {pos : 94, name : '_root.d.titi'},
          {pos : 109, name : '_root.d.toto'},
          {pos : 115, name : '_root.d.tata'},
          {pos : 121, name : '_root.d.titi'},
        ]);
        helper.assert(cleanedXml, '<xml><tr>\uFFFF<ha a="\uFFFF" b="\uFFFF" c="\uFFFF"></ha><he a="\uFFFF" b="\uFFFF" c="\uFFFF"></he></tr><tr>\uFFFF<ha a="\uFFFF" b="\uFFFF" c="\uFFFF"></ha><he a="\uFFFF" b="\uFFFF" c="\uFFFF"></he></tr></xml>');
        done();
      });
    });
    it('It should find multiple markers which are in another marker with others markers', function (done) {
      callFindMarkers('<w:r test="{d.lolo}">{d.color}<w:color /><w:t>{</w:t></w:r><w:r ><w:color w:val="{d.perso[i].color}" /><w:t>d.perso</w:t></w:r><w:r><w:rPr test="{d.perso[i].test}"><w:color /></w:rPr><w:t>[i].nom}</w:t class="{d.lala}">{d.test}</w:r>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          {pos : 12, name : '_root.d.lolo'},
          {pos : 15, name : '_root.d.color'},
          {pos : 32, name : '_root.d.perso[i].nom'},
          {pos : 67, name : '_root.d.perso[i].color'},
          {pos : 107, name : '_root.d.perso[i].test'},
          {pos : 147, name : '_root.d.lala'},
          {pos : 150, name : '_root.d.test'}
        ]);
        helper.assert(cleanedXml, '<w:r test="\uFFFF">\uFFFF<w:color /><w:t>\uFFFF</w:t></w:r><w:r ><w:color w:val="\uFFFF" /><w:t></w:t></w:r><w:r><w:rPr test="\uFFFF"><w:color /></w:rPr><w:t></w:t class="\uFFFF">\uFFFF</w:r>');
        done();
      });
    });
    it('It should find markers with loop and splited marker, it should order list of markers', function (done) {
      var str =
      '<xml>' +
        '<tr>' +
          '<td>' +
            '<span class="{d.perso[i].color}">{</span>' +
            '<span class="{d.perso[i].color}">d.perso[i]</span>' +
            '<span class="{d.perso[i].color}">.nom</span>' +
            '<span class="{d.perso[i].color}">}</span>' +
          '</td>' +
          '<td>' +
            '<span class="{d.perso[i].color}">{</span>' +
            '<span class="{d.perso[i].color}">d.perso[i]</span>' +
            '<span class="{d.perso[i].color}">.prenom</span>' +
            '<span class="{d.perso[i].color}">}</span>' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<td>' +
            '<span class="{d.perso[i+1].color}">{</span>' +
            '<span class="{d.perso[i+1].color}">d.perso[i+1]</span>' +
            '<span class="{d.perso[i+1].color}">.nom</span>' +
            '<span class="{d.perso[i+1].color}">}</span>' +
          '</td>' +
          '<td>' +
            '<span class="{d.perso[i+1].color}">{</span>' +
            '<span class="{d.perso[i+1].color}">d.perso[i+1]</span>' +
            '<span class="{d.perso[i+1].color}">.prenom</span>' +
            '<span class="{d.perso[i+1].color}">}</span>' +
          '</td>' +
        '</tr>' +
      '</xml>';
      callFindMarkers(str, function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [ { pos : 27, name : '_root.d.perso[i].color' },
          { pos : 30, name : '_root.d.perso[i].nom' },
          { pos : 51, name : '_root.d.perso[i].color' },
          { pos : 74, name : '_root.d.perso[i].color' },
          { pos : 97, name : '_root.d.perso[i].color' },
          { pos : 129, name : '_root.d.perso[i].color' },
          { pos : 132, name : '_root.d.perso[i].prenom' },
          { pos : 153, name : '_root.d.perso[i].color' },
          { pos : 176, name : '_root.d.perso[i].color' },
          { pos : 199, name : '_root.d.perso[i].color' },
          { pos : 240, name : '_root.d.perso[i+1].color' },
          { pos : 243, name : '_root.d.perso[i+1].nom' },
          { pos : 264, name : '_root.d.perso[i+1].color' },
          { pos : 287, name : '_root.d.perso[i+1].color' },
          { pos : 310, name : '_root.d.perso[i+1].color' },
          { pos : 342, name : '_root.d.perso[i+1].color' },
          { pos : 345, name : '_root.d.perso[i+1].prenom' },
          { pos : 366, name : '_root.d.perso[i+1].color' },
          { pos : 389, name : '_root.d.perso[i+1].color' },
          { pos : 412, name : '_root.d.perso[i+1].color' }  ]);
        helper.assert(cleanedXml, '<xml><tr><td><span class="\uFFFF">\uFFFF</span><span class="\uFFFF"></span><span class="\uFFFF"></span><span class="\uFFFF"></span></td><td><span class="\uFFFF">\uFFFF</span><span class="\uFFFF"></span>' +
          '<span class="\uFFFF"></span><span class="\uFFFF"></span></td></tr><tr><td><span class="\uFFFF">\uFFFF</span><span class="\uFFFF"></span><span class="\uFFFF"></span><span class="\uFFFF"></span></td><td>' +
          '<span class="\uFFFF">\uFFFF</span><span class="\uFFFF"></span><span class="\uFFFF"></span><span class="\uFFFF"></span></td></tr></xml>');
        done();
      });
    });

    it('should remove unwanted characters', function (done) {
      callFindMarkers('<div>{d.menu}<div> \n   {d.city}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.d.menu'},{pos : 17, name : '_root.d.city'}]);
        helper.assert(cleanedXml, '<div>\uFFFF<div>     \uFFFF');
        done();
      });
    });
    it('should convert conflicting characters', function (done) {
      callFindMarkers("<div>{d.menu}<div> it's \n   {d.city}", function (err, cleanedXml) {
        helper.assert(err, null);
        helper.assert(cleanedXml, "<div>\uFFFF<div> it's     \uFFFF");
        done();
      });
    });
    it('should keep whitespaces between simple quotes', function (done) {
      callFindMarkers("<div>{d.menu:test('hello, world is great')}<div>", function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.d.menu:test(\'hello, world is great\')'}]);
        done();
      });
    });
    it('should keep whitespaces between encoded simple quotes, and it should convert encoded quotes', function (done) {
      parser.findMarkers('<div>{d.menu:test(&apos;hello, world is great&apos;)}<div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 6, name : '_root.d.menu:test(\'hello, world is great\')'}]);
        done();
      });
    });
    it('should remove whitespaces which are inside {} and not inside <>. It should not count them for the position', function (done) {
      callFindMarkers(' <div>   {  d.menu  }   <div>   {   d.city  } ', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 10, name : '_root.d.menu'},{pos : 22, name : '_root.d.city'}]);
        helper.assert(cleanedXml, ' <div>   \uFFFF   <div>   \uFFFF ');
        callFindMarkers(' <xmlstart> {  d.me  <interxml> n <bull  sh it> u [ i ] . city } </xmlend> <tga> {d.ci  <td>  ty  </td>  } <tga><bla>{d.cars[i].wheel}</bla>', function (err, cleanedXml, markers) {
          helper.assert(err, null);
          helper.assert(markers, [{pos : 13, name : '_root.d.menu[i].city'},{pos : 54, name : '_root.d.city'},{pos : 75, name : '_root.d.cars[i].wheel'}]);
          helper.assert(cleanedXml, ' <xmlstart> \uFFFF<interxml><bull  sh it> </xmlend> <tga> \uFFFF<td></td> <tga><bla>\uFFFF</bla>');
          done();
        });
      });
    });
    it('should return the position of the last marker character when the markers ends with showEnd/hideEnd\
      it should not add special marker character for conditional block begin/end', function (done) {
      callFindMarkers('<div>{d.menu:<t>ifEQ(null):</t>showBegin}a<b>{d.menu:</b><r>ifEQ(null):showEnd</r><h>}</h><div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          {pos : 5, name : '_root.d.menu:ifEQ(null):showBegin'},
          {pos : 30, name : '_root.d.menu:ifEQ(null):showEnd'}
        ]);
        callFindMarkers('<div>{d.menu:<t>ifEQ(null):</t>hideBegin}a<b>{d.menu:</b><r>ifEQ(null):hideEnd</r><h>}</h><div>', function (err, cleanedXml, markers) {
          helper.assert(err, null);
          helper.assert(markers, [
            {pos : 5, name : '_root.d.menu:ifEQ(null):hideBegin'},
            {pos : 30, name : '_root.d.menu:ifEQ(null):hideEnd'}
          ]);
          callFindMarkers('<div>{d.menu:<t>ifEQ(null):</t>hideBegin()}a<b>{d.menu:</b><r>ifEQ(null):hideEnd<i></i>()</r><h>}</h>{d.menu:ifEQ(null):showBegin}<b>{d.menu:</b><r>ifEQ(null):showEnd<i></i>()</r><h>}<div>', function (err, cleanedXml, markers) {
            helper.assert(err, null);
            helper.assert(markers, [
              {pos : 5, name : '_root.d.menu:ifEQ(null):hideBegin()'},
              {pos : 37, name : '_root.d.menu:ifEQ(null):hideEnd()'},
              {pos : 41, name : '_root.d.menu:ifEQ(null):showBegin'},
              {pos : 65, name : '_root.d.menu:ifEQ(null):showEnd()'}
            ]);
            // accept whitespaces and XML inside markers
            callFindMarkers('<div>{d.menu:<t>ifEQ(null):</t>hideBegin()}a<b>{d.menu:</b><r>ifEQ(null): hid <b> </b> eEnd <i></i> ( ) </r><h>  }</h>{d.menu:ifEQ(null): showBegin}<b>{d.menu:</b><r>ifEQ(null): show <b> </b> End <i></i>  (  )  </r><h>  } <div>', function (err, cleanedXml, markers) {
              helper.assert(err, null);
              helper.assert(markers, [
                {pos : 5, name : '_root.d.menu:ifEQ(null):hideBegin()'},
                {pos : 44, name : '_root.d.menu:ifEQ(null):hideEnd()'},
                {pos : 48, name : '_root.d.menu:ifEQ(null):showBegin'},
                {pos : 79, name : '_root.d.menu:ifEQ(null):showEnd()'}
              ]);
              done();
            });
          });
        });
      });
    });
    it('should not return the position of the last marker character if attributes contains showEnd/hideEnd (not a formatter)', function (done) {
      callFindMarkers('<div>{d.showBegin:<t>ifEQ(null)</t>}a<b>{d.showEnd:</b><r>ifEQ(null)</r><h>}</h><div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          {pos : 6, name : '_root.d.showBegin:ifEQ(null)'},
          {pos : 18, name : '_root.d.showEnd:ifEQ(null)'}
        ]);
        callFindMarkers('<div>{d.hideBegin:<t>ifEQ(null)</t>}a<b>{d.hideEnd:</b><r>ifEQ(null)</r><h>}</h><div>', function (err, cleanedXml, markers) {
          helper.assert(err, null);
          helper.assert(markers, [
            {pos : 6, name : '_root.d.hideBegin:ifEQ(null)'},
            {pos : 18, name : '_root.d.hideEnd:ifEQ(null)'}
          ]);
          callFindMarkers('<div>{d.hideBegin<t></t>}a<b>{d.hideEnd</b><r><i></i></r><h>}</h>{d.showBegin}<b>{d.showEnd</b><r><i></i></r><h>}<div>', function (err, cleanedXml, markers) {
            helper.assert(err, null);
            helper.assert(markers, [
              {pos : 6, name : '_root.d.hideBegin'},
              {pos : 18, name : '_root.d.hideEnd'},
              {pos : 44, name : '_root.d.showBegin'},
              {pos : 48, name : '_root.d.showEnd'}
            ]);
            done();
          });
        });
      });
    });
    it('should not extract marker if it does not start by {d. {d[ {c. {c[ {$\
      should add float number if marker are at the same position', function (done) {
      var _xml = '<xml>{<td>d<td>.<td>menu</td></td></td>}</xml>'
               + '{d.menu}'
               + '{d[i].menu:ifNEM : showBegin}'
               + '{c.memu: showEnd}'
               + '{c[i].menu:ifEM : hideBegin ( ) }'
               + '{$menu: hideEnd ( ) }'
               + '{d.menu}' // not parsed
               + '{D.menu}' // not parsed
               + '{C.menu}' // not parsed
               + '{C.menu}' // not parsed
               + '{DZZDZD-DSDZD-1131}'; // not parsed
      callFindMarkers(_xml, function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          { pos : 6,  name : '_root.d.menu' },
          { pos : 40, name : '_root.d.menu' },
          { pos : 40.015625, name : '_root.d[i].menu:ifNEM:showBegin' },
          { pos : 40.03125, name : '_root.c.memu:showEnd' },
          { pos : 40.046875, name : '_root.c[i].menu:ifEM:hideBegin()' },
          { pos : 40.0625, name : '_root.$menu:hideEnd()' },
          { pos : 41, name : '_root.d.menu' }
        ]);
        helper.assert(cleanedXml, '<xml>\uFFFF<td><td><td></td></td></td></xml>\uFFFF\uFFFF{D.menu}{C.menu}{C.menu}{DZZDZD-DSDZD-1131}');
        done();
      });
    });
  });

  describe('removeXMLInsideMarkers', function () {

    it('should do not change the marker', function () {
      helper.assert(parser.removeXMLInsideMarkers('<xml>{d.value}</xml>'), '<xml>{d.value}</xml>');
    });

    it('should remove XML inside a marker', function () {
      var _xml = '<xml>{d.t<td>his</td>Is<td>A</td>Car<td>bo<br/>ne</td><td>Ma</td>rker}</xml>';
      let _expectedXML = '<xml>{d.thisIsACarboneMarker}<td></td><td></td><td><br/></td><td></td></xml>';
      helper.assert(parser.removeXMLInsideMarkers(_xml), _expectedXML);
    });

    it('should remove XML inside multiple markers', function () {
      var _xml = '<xml>{d.<div>lis<i>t</i></div>[i].value}<strong>{d.list</strong>[i+1].<ul>value</ul>}{d.name}<div><div>{d.addr</div>ess}</div></xml>';
      let _expectedXML = '<xml>{d.list[i].value}<div><i></i></div><strong>{d.list[i+1].value}</strong><ul></ul>{d.name}<div><div>{d.address}</div></div></xml>';
      helper.assert(parser.removeXMLInsideMarkers(_xml), _expectedXML);
    });

    it('should remove XML inside nested markers', function () {
      var _xml = '<xml> <tr>{<t_row bla={d.cars[i].brand}> d <i attr={d.id}>.</i> <b> type </b> </t_row>}</tr><tr>  { <b></b>  <t_row bla={d.cars [i+1].brand}> d <i> . </i> type}  </t_row></tr></xml>';
      let _newXML = parser.removeXMLInsideMarkers(_xml);
      let _expectedXML = ''
      + '<xml> '
      +  '<tr>{ d .  type  }'
      +    '<t_row bla={d.cars[i].brand}>'
      +      '<i attr={d.id}></i>'
      +      '<b></b>'
      +    '</t_row>'
      +  '</tr>'
      +  '<tr>  {    d  .  type}<b></b>'
      +    '<t_row bla={d.cars [i+1].brand}><i></i>  '
      +    '</t_row>'
      +   '</tr>'
      + '</xml>';

      helper.assert(_newXML, _expectedXML);
    });
  });

  describe('extractMarker', function () {
    it('should extract the marker from the xml and keep whitespaces and special characters (-> very important)', function () {
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

  describe('cleanMarker', function () {
    it('should remove whitespaces and special characters in the markers', function () {
      assert.equal(parser.cleanMarker('menuwhy[1\n].\ntest')            , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker('menuwhy[1\t].test')            , 'menuwhy[1].test');
      assert.equal(parser.cleanMarker(' menu &lt; &lt; ')      , ' menu < < ');
      assert.equal(parser.cleanMarker(' menu &gt; &gt; ')      , ' menu > > ');
      assert.equal(parser.cleanMarker(' menu &apos; &apos; ')      , ' menu \' \' ');
    });
  });

  describe('flattenXML', function () {
    it('should transform XML into an array of object and find the corresponding XML tag (match)', function () {
      helper.assert(parser.flattenXML('<xml></xml>'), [
        { id : 0, index : 0, lastIndex : 5 , depth : 0, match : 1 },
        { id : 1, index : 5, lastIndex : 11, depth : 1, match : 0 }
      ]);
    });
    it('should not crash if XML is null or undefined', function () {
      helper.assert(parser.flattenXML(null), []);
      helper.assert(parser.flattenXML(), []);
      helper.assert(parser.flattenXML(''), [
        { id : 0, index : 0, lastIndex : 0, depth : 0 }
      ]);
    });
    it('should keep non-XML part', function () {
      helper.assert(parser.flattenXML('<xml>a</xml>'), [
        { id : 0, index : 0, lastIndex : 5 , depth : 0, match : 2 },
        { id : 1, index : 5, lastIndex : 6 , depth : 1            },
        { id : 2, index : 6, lastIndex : 12, depth : 1, match : 0 }
      ]);
    });
    it('should consider self-closing tag as non-XML part', function () {
      helper.assert(parser.flattenXML('<xml><br/></xml>'), [
        { id : 0, index : 0 , lastIndex : 5 , depth : 0, match : 2 },
        { id : 1, index : 5 , lastIndex : 10, depth : 1            },
        { id : 2, index : 10, lastIndex : 16, depth : 1, match : 0 }
      ]);
    });
    it('should compute XML depth and works with multiple XML tag', function () {
      helper.assert(parser.flattenXML('<xml>a<td>b</td></xml>'), [
        { id : 0, index : 0 , lastIndex : 5 , depth : 0, match : 5 },
        { id : 1, index : 5 , lastIndex : 6 , depth : 1            },
        { id : 2, index : 6 , lastIndex : 10, depth : 1, match : 4 },
        { id : 3, index : 10, lastIndex : 11, depth : 2            },
        { id : 4, index : 11, lastIndex : 16, depth : 2, match : 2 },
        { id : 5, index : 16, lastIndex : 22, depth : 1, match : 0 }
      ]);
    });
  });

  describe('cleanXml', function () {
    it('should extract only the xml (it removes all markers from xml)', function () {
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
    it('should extract only the xml (it removes all markers from xml)', function () {
      assert.equal(parser.cleanXml('menu</xmlend>bla'), '</xmlend>');
      assert.equal(parser.cleanXml('menu</xmlend><text b>A<qskjhdq>bla'), '</xmlend><text b><qskjhdq>');
    });
  });

  describe('removeWhitespace', function () {
    it('should do nothing if there is no whitespaces', function () {
      assert.equal(parser.removeWhitespace('bla'), 'bla');
    });
    it('should remove whitespaces everywhere', function () {
      assert.equal(parser.removeWhitespace(' the matrix  has  you  <neo>  '), 'thematrixhasyou<neo>');
    });
    it('should remove whitespaces everywhere except between double quotes', function () {
      assert.equal(parser.removeWhitespace(' <trinity>  "the matrix  has  you"  <neo> <the> id=5  '), '<trinity>"the matrix  has  you"<neo><the>id=5');
    });
    it('should remove whitespaces everywhere except between simple quotes', function () {
      assert.equal(parser.removeWhitespace(' <trinity>  \'the matrix  has  you\'  <neo> <the> id=5  '), '<trinity>\'the matrix  has  you\'<neo><the>id=5');
    });
    it('should accept escaped simple quotes', function () {
      assert.equal(parser.removeWhitespace(' <trinity>  \'the matrix \\\' has  you\'  <neo> <the> id=5  '), '<trinity>\'the matrix \\\' has  you\'<neo><the>id=5');
    });
    it('should remove escaped double quotes', function () {
      assert.equal(parser.removeWhitespace(' <trinity>  "the matrix \\"  has  you"  <neo> <the> id=5  '), '<trinity>"the matrix \\"  has  you"<neo><the>id=5');
    });
    it('should not crash if undefined or null is passed', function () {
      assert.equal(parser.removeWhitespace(undefined), undefined);
      assert.equal(parser.removeWhitespace(null), null);
    });
  });

  describe('translate', function () {
    it('should do nothing if the xml is null or undefined', function (done) {
      parser.translate('', {}, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '');
        done();
      });
    });
    it('should do nothing if the xml is null or undefined without callback', function (done) {
      const xmlTranslated = parser.translate('', {});
      helper.assert(xmlTranslated, '');
      done();
    });
    it('should not crash if options is empty, and it should replace translation markers by the "not translated" text', function (done) {
      parser.translate('<xml> {t(yeah)} </xml>', {}, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml> yeah </xml>');
        done();
      });
    });
    it('should replace translation markers by the "not translated" text without callback', function (done) {
      const xmlTranslated = parser.translate('<xml> {t(yeah)} </xml>', {});
      helper.assert(xmlTranslated, '<xml> yeah </xml>');
      done();
    });
    it('should not consider marker which starts by "t" and which is not a translation marker', function (done) {
      parser.translate('<xml>{table}</xml>', {}, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml>{table}</xml>');
        done();
      });
    });
    it('should not consider marker which starts by "t" and which is not a translation marker (variable marker)', function (done) {
      parser.translate('<xml>{#t($a) = myvar=$a} </xml>', {}, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml>{#t($a) = myvar=$a} </xml>');
        done();
      });
    });
    /* it('not consider marker which starts by "t" and which is not a translation marker', function(done){
      var _objLang = {
        'Monday' : 'Lundi'
      };
      parser.translate('<xml>{tablet (option)}</xml>', _objLang, function(err, xmlTranslated){
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml>{tablet (option)}</xml>');
        done();
      });
    });*/
    it('should extract t(Mond<interxml>ay) and t(Tuesday is <bullshit>the second day of the week!) in order to transform them to Lundi (_found in objLang) and Tuesday is the second day of the week! (not found in the _objLang)', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            Monday : 'Lundi'
          }
        }
      };
      parser.translate('<xmlstart>{me<interxml>n<bullshit>u}<div>{t(Mond<interxml>ay)}</div><div>{#def = id=2  }</div><div>{t(Tuesday is <bullshit>the second day of the week!)}</div></xmlend>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart>{me<interxml>n<bullshit>u}<div>Lundi<interxml></div><div>{#def = id=2  }</div><div>Tuesday is the second day of the week!<bullshit></div></xmlend>');
        done();
      });
    });
    it('should extract t(I have a dog) and t(I\'ve a cat) and translate it to J\'ai un chien and J\'ai un chat', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            'I have a dog' : 'J\'ai un chien',
            'I\'ve a cat'  : 'J\'ai un chat',
          }
        }
      };
      parser.translate('<xmlstart><div>{t(I have a dog)}</div><div>{t(I&apos;ve a cat)}</div></xmlend>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div>J&apos;ai un chien</div><div>J&apos;ai un chat</div></xmlend>');
        done();
      });
    });
    it('should extract t(I saw a spirit(with green eyes and a transparent body) and I cried) and translate this', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            'I saw a spirit(with green eyes and a transparent body) and I cried' : 'J ai vu un esprit(avec des yeux verts et un corps transparent) et j ai crié'
          }
        }
      };
      parser.translate('<xmlstart><div>{t(I saw a spi<interxml>rit(with green eyes and a trans<interxml>parent body) and I cried)}</div></xmlend>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div>J ai vu un esprit(avec des yeux verts et un corps transparent) et j ai crié<interxml><interxml></div></xmlend>');
        done();
      });
    });
    it('should translate this string and keep tags inside t(). The final result include <b> <i>', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            cat : 'chat',
            dog : 'chien'
          }
        }
      };
      parser.translate('<xmlstart><div><b>{</b>t(<i><b>cat</b></i>)}<b>thanks</b>{t(<i>do<interxml>g</i>)}</div></xmlend>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div><b>chat</b><i><b></b></i><b>thanks</b>chien<i><interxml></i></div></xmlend>');
        done();
      });
    });
    it('should translate the sentence and keep the smiley :)', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            'my smiley :) ' : 'mon emoticon :) '
          }
        }
      };
      parser.translate('<xmlstart>{t(my smiley :) )}<b>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart>mon emoticon :) <b>');
        done();
      });
    });
    it('should translate this sentence with special characters', function (done) {
      var _options = {
        lang         : 'fr',
        translations : {
          fr : {
            'price < 100'                                     : 'prix < 100',
            'productPrice >= salePrice > mac\'doProductPrice' : 'prixProduit >= prixVente > prixProduitMac\'Do',
          }
        }
      };
      parser.translate('<xmlstart>{t(price &lt; 100)}<b>test</b><span>{t(productPrice &gt;= salePrice &gt; mac&apos;doProductPrice)}</span>', _options, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart>prix &lt; 100<b>test</b><span>prixProduit &gt;= prixVente &gt; prixProduitMac&apos;Do</span>');
        done();
      });
    });
    /* Should be activated if we encoded others special characters (non operators special characters)
    it('should translate this sentence with special characters', function(done){
      var _objLang = {
        'ñôñË' : '¥€§'
      };
      parser.translate('<xmlstart><b>test{t(&ntilde;&ocirc;&ntilde;&Euml;)}</b></span>', _objLang, function(err, xmlTranslated){
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><b>test&yen;&euro;&sect;</b></span>');
        done();
      });
    });*/
  });

  describe('findVariables', function () {
    it('should do nothing if the xml is null or undefined', function (done) {
      parser.findVariables(undefined, function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '');
        helper.assert(variables, []);
        done();
      });
    });
    it('should do nothing because there is no declared variables', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}</xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}</xmlend>');
        helper.assert(variables, []);
        done();
      });
    });
    it('should extract variables from the xml', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#def=id=2}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div></div></xmlend>');
        helper.assert(variables[0].name, 'def');
        helper.assert(variables[0].code, 'id=2');
        done();
      });
    });
    it('should extract variables even if there multiple variables next to each other and some whitespaces between the brace and the #', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#def = id=2  } { #two = id=3}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div> </div></xmlend>');
        helper.assert(variables[0].name, 'def');
        helper.assert(variables[0].code, 'id=2');
        helper.assert(variables[1].name, 'two');
        helper.assert(variables[1].code, 'id=3');
        done();
      });
    });
    it('should accept a pre-declared variable object', function (done) {
      var _variables = [{
        name  : 'otherVar',
        code  : 'i=5',
        regex : /$otherVar/g
      }];
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#def= id=2}</div></xmlend>', _variables, function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div></div></xmlend>');
        helper.assert(variables[0].name, 'otherVar');
        helper.assert(variables[0].code, 'i=5');
        helper.assert(variables[1].name, 'def');
        helper.assert(variables[1].code, 'id=2');
        helper.assert(variables[1].regex.test('<sdjh> test[$def)] <td>' ), true);
        done();
      });
    });
    it('should extract variables from the xml even if there are some xml tags everywhere', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{ <br> # <bla> def <br/> =  id<bla>=2    }</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div><br><bla><br/><bla></div></xmlend>');
        helper.assert(variables[0].name, 'def');
        helper.assert(variables[0].code, 'id=2');
        done();
      });
    });
    it('should work if there are whitespaces and xml in the variable name and xml tags around each braces', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#de <br> f <br> =<br>id=2  <br>}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div><br><br><br><br></div></xmlend>');
        helper.assert(variables[0].name, 'def');
        helper.assert(variables[0].code, 'id=2');
        done();
      });
    });
    it('should extract multiple variables ', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{ <br> # <bla> def =<br/>  id<bla>=2  }</div>{ <br> # <bla> my_Var2= <br/>  test<bla>[1=5]}</xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div><br><bla><br/><bla></div><br><bla><br/><bla></xmlend>');
        helper.assert(variables[0].name, 'def');
        helper.assert(variables[0].code, 'id=2');
        helper.assert(variables[1].name, 'my_Var2');
        helper.assert(variables[1].code, 'test[1=5]');
        done();
      });
    });
    it('should extract variables with parameters. It should replace parameters by $0, $1, ...', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#myFn($a,$b)=id=$a,g=$b}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div></div></xmlend>');
        helper.assert(variables[0].name, 'myFn');
        helper.assert(variables[0].code, 'id=_$0_,g=_$1_');
        done();
      });
    });
    it('should not confuse two parameters which begin with the same word', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{#myFn($a,$ab)=id=$a,g=$ab}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div></div></xmlend>');
        helper.assert(variables[0].name, 'myFn');
        helper.assert(variables[0].code, 'id=_$0_,g=_$1_');
        done();
      });
    });
    it('should extract variables with parameters even if there are xml tags everywhere', function (done) {
      parser.findVariables('<xmlstart>{me<interxml>n<bullshit>u}<div>{ <br> # <bla> myFn <tr> ( <tr> $a,$b)<tr/> = id= <tr/>$ <td>a<td> , g=$b<tf>}</div></xmlend>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<xmlstart>{me<interxml>n<bullshit>u}<div><br><bla><tr><tr><tr/><tr/><td><td><tf></div></xmlend>');
        helper.assert(variables[0].name, 'myFn');
        helper.assert(variables[0].code, 'id=_$0_,g=_$1_');
        helper.assert(variables[0].regex.test('<sdjh> test[$myFn(1, 2)] <td>' ), true);
        helper.assert(variables[0].regex.test('<sdjh> test[myFn(1, 2)] <td>' ), false);
        done();
      });
    });
    it('should keep whitespaces between simple quotes', function (done) {
      parser.findVariables("<div>{#myFn = test ('hello, world is great')}<div>", function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<div><div>');
        helper.assert(variables[0].name, 'myFn');
        helper.assert(variables[0].code, 'test(\'hello, world is great\')');
        done();
      });
    });
    it('should keep whitespaces between encoded simple quotes, and it should convert encoded quotes', function (done) {
      parser.findVariables('<div>{#myFn = test (&apos;hello, world is great&apos;)}<div>', function (err, xml, variables) {
        helper.assert(err, null);
        helper.assert(xml, '<div><div>');
        helper.assert(variables[0].name, 'myFn');
        helper.assert(variables[0].code, 'test(\'hello, world is great\')');
        done();
      });
    });
  });

  describe('preprocessMarkers', function () {
    it('should return the marker array if there is no variable declared', function () {
      var _markers  = [{pos : 10, name : '_root.menu'}];
      parser.preprocessMarkers(_markers, [], function (err, processedMarkers) {
        helper.assert(err, null);
        helper.assert(processedMarkers, _markers);
      });
    });
    it('should detect used variable and replace them in all markers', function () {
      var _markers  = [
        {pos : 10, name : '_root.menu[$myVar]'}
      ];
      var _variables = [{
        name  : 'myVar',
        code  : 'id=1',
        regex : new RegExp('\\$myVar(?:\\(([\\s\\S]+?)\\))?','g')
      }];
      parser.preprocessMarkers(_markers, _variables, function (err, processedMarkers) {
        helper.assert(err, null);
        helper.assert(processedMarkers, [ {pos : 10, name : '_root.menu[id=1]'}]);
      });
    });
    it('should work in complex cases', function () {
      var _markers  = [
        {pos : 10, name : '_root.menu[$myVar].test::int($myVar)'},
        {pos : 20, name : '_root.menu[$myVar].$car_shortcut.bla[$myVar].id'},
        {pos : 30, name : 'nothing'}
      ];
      var _variables = [
        {
          name  : 'myVar',
          code  : 'id=1',
          regex : new RegExp('\\$myVar(?:\\(([\\s\\S]+?)\\))?','g')
        },{
          name  : 'car_shortcut',
          code  : 'car . menu  [i = 1: int(sds, sqd)]',
          regex : new RegExp('\\$car_shortcut(?:\\(([\\s\\S]+?)\\))?','g')
        }
      ];
      parser.preprocessMarkers(_markers, _variables, function (err, processedMarkers) {
        helper.assert(err, null);
        helper.assert(processedMarkers, [
          {pos : 10, name : '_root.menu[id=1].test::int(id=1)'},
          {pos : 20, name : '_root.menu[id=1].car . menu  [i = 1: int(sds, sqd)].bla[id=1].id'},
          {pos : 30, name : 'nothing'}
        ]);
      });
    });
    it('should accept variable with parameters', function () {
      var _markers  = [
        {pos : 10, name : '_root.menu[$myVar(2)]'}
      ];
      var _variables = [{
        name  : 'myVar',
        code  : 'id=_$0_',
        regex : new RegExp('\\$myVar(?:\\(([\\s\\S]+?)\\))?','g')
      }];
      parser.preprocessMarkers(_markers, _variables, function (err, processedMarkers) {
        helper.assert(err, null);
        helper.assert(processedMarkers, [ {pos : 10, name : '_root.menu[id=2]'}]);
      });
    });
    it('should accept variable with multiple parameters', function () {
      var _markers  = [
        {pos : 10, name : '_root.menu[$myVar(2, "bla")]'},
        {pos : 11, name : '_root.menu[$myVar(5, 6)] and $myVar(2, 3)'}
      ];
      var _variables = [{
        name  : 'myVar',
        code  : 'id=_$0_, text>_$1_',
        regex : new RegExp('\\$myVar(?:\\(([\\s\\S]+?)\\))?','g')
      }];
      parser.preprocessMarkers(_markers, _variables, function (err, processedMarkers) {
        helper.assert(err, null);
        helper.assert(processedMarkers, [
          {pos : 10, name : '_root.menu[id=2, text>"bla"]'},
          {pos : 11, name : '_root.menu[id=5, text>6] and id=2, text>3'}
        ]);
      });
    });
  });

  describe('findOpeningTagPosition', function () {
    it('should return the index of the opening tag on the left', function () {
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqdsqd</tr>'), 5);
      assert.equal(parser.findOpeningTagPosition('aasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 5);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>sdasas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 16);
      assert.equal(parser.findOpeningTagPosition('a<tr><tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 13);
      assert.equal(parser.findOpeningTagPosition('a<tr></tr>asas<tr>sqd<tr></tr>s<tr>s</tr>sqd</tr>'), 14);
      assert.equal(parser.findOpeningTagPosition('<tr> qsjh k </tr><tr>start<tr> <tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr>'), 17);
    });
    it('should return 0 when the opening tag is not found', function () {
      assert.equal(parser.findOpeningTagPosition('aasqdsqd</tr>'), 0);
      assert.equal(parser.findOpeningTagPosition('aasas<tr></tr>sqdsqd</tr>'), 0);
      assert.equal(parser.findOpeningTagPosition('<p></p></p><p></p></p><br/>',22), 0);
      assert.equal(parser.findOpeningTagPosition('</p><p><p><br/></p></p><br/>',4), 0);
    });
    it('should accept a third parameter which indicates that the opening tag is before it.\
        It forces the algorithm to find the opening tag before this position', function () {
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
             even if there are self-closing tags...', function () {
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',13), 11);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',11), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',10), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/><file/>',6), 0);

      assert.equal(parser.findOpeningTagPosition('<p><p><p></p></p>',13), 3); // should return 3 in order to have a valid xml markup
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
        it should always return a position which is lower than "indexWhereToStopSearch"', function () {
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',11), 6);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',12), 11);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/>   <file/>',14), 13);
      assert.equal(parser.findOpeningTagPosition('<tar/><br/> qszd  <file/>',16), 15);
      assert.equal(parser.findOpeningTagPosition('<tar/><br color="3"/>   <file/>',24), 23);
    });
    it('should accept variable in xml', function () {
      assert.equal(parser.findOpeningTagPosition('<p color="dd" bold=true><p><p bold=true></p></p><br color="dd" bold=true /> <p color="aa" ><p></p></p><p></p>',48), 24);
    });
    it('should work even if XML contain http link with slashes', function () {
      assert.equal(parser.findOpeningTagPosition('<body> <tr><pic a="aa"></pic></tr>'), 7);
      assert.equal(parser.findOpeningTagPosition('<body> <tr><pic a="http://"></pic></tr>'), 7);
    });
  });

  describe('findClosingTagPosition', function () {
    it('should return the index of the closing tag on the right', function () {
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd</tr>sqdsd'), 15);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqdsd'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd<tr></tr>sd'), 35);
      assert.equal(parser.findClosingTagPosition('<tr>sq<tr></tr>s<tr>s</tr>dsqd</tr>sqd</tr></tr>sd'), 35);
    });
    it('should return -1 when the closing tag is not found', function () {
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqdsd'), -1);
      assert.equal(parser.findClosingTagPosition('<tr>sqdsqd<tr></tr>sqdsd'), -1);
      assert.equal(parser.findClosingTagPosition('<br/><p><p></p></p></p><br/>', 21), -1);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 10000), -1);
    });
    it('should accept a third parameter which indicates that the closing tag is after it.\
        It forces the algorithm to find the closing tag after this position', function () {
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 0), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 22), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 24), 25);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 25), 42);
      assert.equal(parser.findClosingTagPosition('xx <t_row>useless</t_row> <t_row>a</t_row>', 40), 42);
    });
    it('should always return a valid xml markup from the beginning to the closing tag position if an empty string is passed.\
             even if there are self-closing tags...', function () {
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 13), 17);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 12), 17);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 11), 12);
      assert.equal(parser.findClosingTagPosition('<tar/><tar/><br/><file/>', 0), 6);
      assert.equal(parser.findClosingTagPosition('<br/>'), 5);

      assert.equal(parser.findClosingTagPosition('<p><p></p></p></p>'), 14);
      assert.equal(parser.findClosingTagPosition('<p><p></p></p></p>',13), 14);
      assert.equal(parser.findClosingTagPosition('<br/><p><p></p></p></p><br/>', 6), 19);
    });
    it('should accept variable in xml', function () {
      assert.equal(parser.findClosingTagPosition('<p color="dd" bold=true><p><p bold=true></p></p><br color="dd" bold=true /> <p color="aa" ><p></p></p></p></p></p>'), 106);
    });
    it('should work even if XML contain http link with slashes', function () {
      assert.equal(parser.findClosingTagPosition('<tr><pic a="aa"></pic></tr><b>'), 27);
      assert.equal(parser.findClosingTagPosition('<tr><pic a="http://"></pic></tr><b>'), 32);
    });
  });

  describe('findPivot', function () {
    it('should return null if the pivot cannot be found', function () {
      var _str = '</tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '</tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '<tr><tr><tr></tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
      _str = '</tr></tr></tr></tr>';
      helper.assert(parser.findPivot(_str), null);
    });
    it('should detect the pivot point. It represents the transition between the two repeated parts', function () {
      var _str = '</td> </tr><tr> <td>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 11 },
        part2Start : {tag : 'tr', pos : 11 }
      });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 40 },
        part2Start : {tag : 'tr', pos : 40 }
      });
      _str = 'menu </p><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 43 },
        part2Start : {tag : 'tr', pos : 43 }
      });
      _str = 'menu </p><p teddds> bla </p></xml><p> foot </p> </image></tr><tr> <p> basket </p><tag><p> tennis </p><p> balle';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 61 },
        part2Start : {tag : 'tr', pos : 61 }
      });
      _str = '<h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> ';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 56 },
        part2Start : {tag : 'tr', pos : 56 }
      });
    });
    it('should work even if there are some tags between the two repeated parts (+ complex case)', function () {
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tab', pos : 35 },
        part2Start : {tag : 'tab', pos : 57 }
      });
    });
    it('should work even if the opening tag of the second part is not the same as the closing tag of the first part', function () {
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab2><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tab', pos : 35 },
        part2Start : {tag : 'tab2', pos : 57 }
      });
    });
    it('should accept tags with variables', function () {
      var _str = 'menu </p><p> </p></tr:w><tr:w color=test test=3> <p> basket </p> balle';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr:w', pos : 24 },
        part2Start : {tag : 'tr:w', pos : 24 }
      });
    });
    it('should accept tags with /', function () {
      var _str = '</w>  </p>  <a url=":/">  </a>  <p>    <w>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'p', pos : 12 },
        part2Start : {tag : 'p', pos : 32 }
      });
    });
    it('should detect the pivot point even if the repetition is not an array or a list (flat representation)', function () {
      var _str = '</h1> <h1></h1> <h1></h1> <h1></h1> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'h1', pos : 6 },
        part2Start : {tag : 'h1', pos : 36 }
      });
      _str = '</h1> <h1></h1> <h1></h1> <h3></h3> <h1> <h2>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'h1', pos : 6 },
        part2Start : {tag : 'h1', pos : 36 }
      });
      _str = ' </t_row> <t_row></t_row> <t_row> ';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 't_row', pos : 10 },
        part2Start : {tag : 't_row', pos : 26 }
      });
    });
    it('should accept self-closing tags and add a boolean "selfClosing" if the tag is a self-closing one', function () {
      var _str = '</p></p></tr><tr><p></p></tr></tab><inter/><br/><tab2><p></p><p><tr><td><p></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tab', pos : 35 },
        part2Start : {tag : 'tab2', pos : 48 }
      });
      _str = '</p></p><br/></tr><tr><p></p></tr><br/></tab><inter/><br/><tab><p></p><p><tr><td><br/><p><br/></p><a></a>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tab', pos : 45 },
        part2Start : {tag : 'tab', pos : 58 }
      });
      _str = '<br/><br/><br/>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'br', pos : 15, selfClosing : true},
        part2Start : {tag : 'br', pos : 15, selfClosing : true}
      });
      _str = '<br/><br/><br/><br/>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'br', pos : 20, selfClosing : true},
        part2Start : {tag : 'br', pos : 20, selfClosing : true}
      });
      _str = '<br/>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'br', pos : 5, selfClosing : true},
        part2Start : {tag : 'br', pos : 5, selfClosing : true}
      });
      _str = '<br/><br/><tr>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'br', pos : 5, selfClosing : true},
        part2Start : {tag : 'tr', pos : 10 }
      });
      _str = '<br/></tr><br/>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 10 },
        part2Start : {tag : 'br', pos : 10, selfClosing : true}
      });
    });
    it('should accept flat XML structure and return the last tag as the pivot', function () {
      var _str = ' <tr></tr>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'tr', pos : 10, selfClosing : true},
        part2Start : {tag : 'tr', pos : 10, selfClosing : true}
      });
      _str = '<tr></tr> <i></i>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'i', pos : 17, selfClosing : true},
        part2Start : {tag : 'i', pos : 17, selfClosing : true}
      });
    });
    it('should accept very complex case', function () {
      var _str = '<w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00137A31"><w:trPr><w:trHeight w:val="1760"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10012" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="auto"/></w:tcPr><w:p wsp:rsidR="00137A31" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00137A31" wsp:rsidP="007057CC"><w:pPr><w:rPr><w:b/><w:b-cs/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl><w:p wsp:rsidR="00F62BCC" wsp:rsidRDefault="00F62BCC"><w:pPr><w:rPr><w:sz w:val="32"/></w:rPr></w:pPr></w:p><w:tbl><w:tblPr><w:tblpPr w:leftFromText="180" w:rightFromText="180" w:horzAnchor="page" w:tblpX="1009"/><w:tblW w:w="10081" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:left w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:bottom w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:right w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/></w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="10081"/></w:tblGrid><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00F62BCC"><w:trPr><w:trHeight w:val="98"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10081" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="4F81BD"/></w:tcPr><w:p wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00F62BCC" wsp:rsidP="007E678B"><w:pPr><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr></w:pPr><w:r wsp:rsidRPr="00F62BCC"><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'w:tbl', pos : 485 },
        part2Start : {tag : 'w:tbl', pos : 593 }
      });
    });
    it('should accept non-XML structure', function () {
      var _str = '';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : '', pos : 0, selfClosing : true},
        part2Start : {tag : '', pos : 0, selfClosing : true}
      });
      _str = '  ,  ';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : '', pos : 5, selfClosing : true},
        part2Start : {tag : '', pos : 5, selfClosing : true}
      });
    });
  });

  describe('findRepetitionPosition', function () {
    it('should return null of the pivot is null', function () {
      var _xml = '<tr>  </tr><tr> </tr>';
      helper.assert(parser.findRepetitionPosition(_xml, null), null);
    });
    it('should detect the repetition', function () {
      var _xml = '<tr>  </tr><tr> </tr>';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 11 },
        part2Start : {tag : 'tr', pos : 11 }
      };
      var _expectedRange = {startEven : 0,  endEven : 11, startOdd : 11, endOdd : 21};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('2. should detect the repetition', function () {
      var _xml = 'qsjh k <tr> menu <r/><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 52 },
        part2Start : {tag : 'tr', pos : 52 }
      };
      var _expectedRange = {startEven : 7,  endEven : 52, startOdd : 52, endOdd : 102};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('detect repetition section even if XML contains slashes (http link)', function () {
      var _xml = '<body> <tr><w></w><pic a="http://"></pic></tr><tr><w></w><pic a="http://"></pic></tr></body>';
      var _pivot = {
        part1End   : { tag : 'p', pos : 46 },
        part2Start : { tag : 'p', pos : 46 }
      };
      var _expectedRange = {startEven : 7,  endEven : 46, startOdd : 46, endOdd : 85};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if the start tag contains some meta data', function () {
      var _xml = 'qsjh k <tr w:blue color=test> menu <r/><p> bla </p><p> foot </p> </tr><tr w:blue color=test> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 70 },
        part2Start : {tag : 'tr', pos : 70 }
      };
      var _expectedRange = {startEven : 7,  endEven : 70, startOdd : 70, endOdd : 138};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even if there a lot of similar tags and nested tags in the middle', function () {
      var _xml = '<tr> qsjh k </tr><tr>start<tr><tr> menu </tr><tr> bla </tr><tr> foot </tr></tr>   </tr><tr>   <tr> menu </tr><tr> bla </tr><tr><tr> balle </tr></tr> end </tr> <tr> </tr>';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 87 },
        part2Start : {tag : 'tr', pos : 87 }
      };
      var _expectedRange = {startEven : 17,  endEven : 87, startOdd : 87, endOdd : 158};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should detect the repetition even there is some whitespaces in the pivot', function () {
      var _xml = 'qsjh k <tr> menu <r/><p> bla </p><p> foot </p> </tr>   <tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 53 },
        part2Start : {tag : 'tr', pos : 53 }
      };
      var _expectedRange = {startEven : 7,  endEven : 53, startOdd : 53, endOdd : 105};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should return 0 if the start tag is not found', function () {
      var _xml = 'qsjh k  qsd:blue color=test   menu <r/><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 70 },
        part2Start : {tag : 'tr', pos : 70 }
      };
      var _expectedRange = {startEven : 0,  endEven : 70, startOdd : 70, endOdd : 120};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should accept a third parameter which indicates that the beginning of the repetition is before it', function () {
      var _xml = ' <t_row> </t_row> <t_row>useless</t_row><t_row> </t_row>';
      var _pivot = {
        part1End   : {tag : 't_row', pos : 40 },
        part2Start : {tag : 't_row', pos : 40 }
      };
      var _expectedRange = {startEven : 1,  endEven : 40, startOdd : 40, endOdd : 56};
      var _roughStart = 9;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should work even if there are some tags between the two repeated parts (+ complex case)', function () {
      var _xml = '<tab><p></p><tab><tr><p><p></p></p></tr><tr><p></p></tr></tab><inter><p></p></inter><tab><p></p><p><tr><td><p></p><a></a></td></tr></p></tab><p></p></tab>';
      var _pivot = {
        part1End   : {tag : 'tab', pos : 62 },
        part2Start : {tag : 'tab', pos : 84 }
      };
      var _expectedRange = {startEven : 12,  endEven : 84, startOdd : 84, endOdd : 141};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should work even if there are some self-closing tags', function () {
      var _xml = '<tab><p></p><tab><br/><tr><p><br/><p></p></p></tr><tr><p></p></tr></tab><inter/><br/><tab><p></p><p><tr><td><p></p><a></a></td></tr></p></tab><p></p></tab>';
      var _pivot = {
        part1End   : {tag : 'tab', pos : 72 },
        part2Start : {tag : 'tab', pos : 85 }
      };
      var _expectedRange = {startEven : 12,  endEven : 85, startOdd : 85, endOdd : 142};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should work even if the opening tag of the second part is not the same as the closing tag of the first part', function () {
      var _xml = '<tab><p></p><tab><br/><tr><p><br/><p></p></p></tr><tr><p></p></tr></tab><inter/><br/><tab2><p></p><p><tr><td><p></p><a></a></td></tr></p></tab2><p></p></tab>';
      var _pivot = {
        part1End   : {tag : 'tab', pos : 72 },
        part2Start : {tag : 'tab2', pos : 85 }
      };
      var _expectedRange = {startEven : 12,  endEven : 85, startOdd : 85, endOdd : 144};
      helper.assert(parser.findRepetitionPosition(_xml, _pivot), _expectedRange);
    });
    it('should accept self-closing tags', function () {
      var _xml = '<doc><br/><br/><br/><br/></doc>';
      var _pivot = {
        part1End   : {tag : 'br', pos : 10, selfClosing : true},
        part2Start : {tag : 'br', pos : 15, selfClosing : true}
      };
      var _expectedRange = {startEven : 5,  endEven : 15, startOdd : 15, endOdd : 20};
      var _roughStart = 11;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should accept only one self-closing tag between the two repeated parts', function () {
      var _xml = '<doc><br/></doc>';
      var _pivot = {
        part1End   : {tag : 'br', pos : 10, selfClosing : true},
        part2Start : {tag : 'br', pos : 10, selfClosing : true}
      };
      var _expectedRange = {startEven : 5,  endEven : 10, startOdd : 10, endOdd : 10};
      var _roughStart = 6;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should not over-estimate the length of the repeated parts', function () {
      var _xml = '<xml><p><p><br/></p></p><br/><br/></xml>';
      var _pivot = {
        part1End   : {tag : 'br', pos : 29, selfClosing : true},
        part2Start : {tag : 'br', pos : 29, selfClosing : true}
      };
      var _expectedRange = {startEven : 24,  endEven : 29, startOdd : 29, endOdd : 34};
      var _roughStart = 24;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
    it('should accept non-XML structure', function () {
      var _xml = '  ,  ';
      var _pivot = {
        part1End   : {tag : '', pos : 5, selfClosing : true},
        part2Start : {tag : '', pos : 5, selfClosing : true}
      };
      var _expectedRange = {startEven : 0,  endEven : 5, startOdd : 5, endOdd : 5};
      var _roughStart = 0;
      helper.assert(parser.findRepetitionPosition(_xml, _pivot, _roughStart), _expectedRange);
    });
  });

  describe('findSafeConditionalBlockPosition', function () {
    it('should return an array that contains a beginning and ending position of a conditional block which does not break XML', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<p><h1></h1>'), 0, 12), [[3, 12]]);
    });
    it('should parse xml only at the provided positions', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1></h1>a</p></xml>'), 5, 17), [[8, 17]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1></h1></p></xml>'), 8, 17), [[8, 17]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p>a<h1></h1></p> </xm>'), 8, 21), [[8, 17]]);
    });
    it('beginning and ending position should be the same if it not possible to find a valid conditional position', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>a</a></a></a></a></xml>'), 5, 17), [[17, 17]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>a</a></a></a></a></xml>'), 18, 34), [[34, 34]]);
    });
    it('should throw an error if XML is not valid', function () {
      assert.throws(
        () => {
          parser.findSafeConditionalBlockPosition(convXML('<xml></b><a><a><a><a>a</a></a></a></a></xml>'), 5, 17);
        },
        (err) => {
          helper.assert(err.message, 'XML not valid');
          return true;
        }
      );
    });
    it('should include self-closing tags', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1><br/><br/><br/></h1>a</p></xml>'), 5, 32), [[8, 32]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 37), [[8, 37]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><b>a</b><br/>ab<b>a</b></xm>'), 8, 22), [[12, 19]]);
    });
    it('should include non-XML part', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a> <br/> b</a></a></a></a></xml>'), 5, 24), [[17, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab</xml>'), 0, 13), [[0, 13]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><b>a</b>ab<b>a</b></xml>'), 8, 17), [[12, 14]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm>bab</xm><div>'), 5, 12), [[5, 7]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab<br/><div>'), 5, 12), [[5, 12]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab<br/> <div>'), 5, 13), [[5, 13]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a>ab<br/><br/><br/>'), 5, 20), [[8, 20]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a>ab<br/><br/><br/>'), 5, 23), [[11, 23]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1><br/><br/><br/></h1><br/>aa</p></xml>'), 5, 38), [[8, 38]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1><br/><br/><br/></h1><br/>a </p></xml>'), 5, 38), [[8, 38]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p>aa<h1><br/><br/><br/></h1><br/>aa</p></xm>'), 4, 39), [[7, 39]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p> a<h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 39), [[8, 39]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>a <h1><br/><br/><br/></h1><br/>aa</p></xml>'), 5, 40), [[8, 40]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>a<h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 38), [[8, 38]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  a</a></a></a></a></xml>'), 5, 19), [[17, 19]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab</xml>'), 5, 7), [[5, 7]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm>xab</xm>'), 5, 12), [[5, 7]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a>ab<br/>'), 5, 10), [[8, 10]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('ab'), 0, 2), [[0, 2]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('abcd'), 1, 3), [[1, 3]]);
    });
    it('should select multiple valid XML parts', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><b>x</b>ab<b><br/>a</b></xm>'), 8, 22), [[12, 14], [17, 22]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b>x<c></c> </b><d> textD <e>e</e> </d><f>  <g></g>'), 4, 51), [[4, 12], [16, 39], [42, 51]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p><p><p><p>x <a>b</a> </p></p></p></p> <br/><br/><br/> </xm>'), 17, 60), [[17, 27], [43, 60]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p><p><p><p>x <a>b</a> <br/></p></p></p></p> <br/><br/><br/> </xm>'), 17, 65), [[17, 32], [48, 65]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><b><br/><br/></b><br/>ab<br/><b><br/><br/></b></xml>'), 13, 42), [[13, 18], [22, 34], [37, 42]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b>x<c></c> </b><d> textD <e>e</e> </d><f>  <g>a</g>'), 4, 47), [[4, 12], [16, 39], [42, 44]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b>x<c></c> </b><d> textD <e>e</e> </d> <br/><d> textD <e>e</e> </d><f>  <g>a</g>'), 4, 76), [[4, 12], [16, 68], [71, 73]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b>w<c></c> </b><d> textD <e>e</e> </d> <br/> <d> textD <e>e</e> </d><f>  <g>a</g>'), 4, 77), [[4, 12], [16, 69], [72, 74]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <p><br/><br/><br/>x</p></xml>'), 5, 24), [[5, 6], [9, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <p><br/><br/><br/> w</p></xml>'), 5, 25), [[5, 6], [9, 25]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p><p><p><p>x </p></p></p></p> <br/><br/><br/> </xm>'), 17, 51), [[17, 18], [34, 51]]);
    });
    it('should include trailing characters', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<div><if>aa</if><if>bb</if></div>'), 10, 21), [[10, 11], [20, 21]]);
    });
    it('should accept tag with URLs and slashes', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<div><if url="https://">a<br></br>abb</if><if>sssss</if></div>'), 5, 49), [[5, 42], [46, 49]]);
    });
    it('should include non-XML part at the beginning and ending of condition', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>xtext</a><b></b><c></c><d>texta</d><br/>'), 4, 33), [[4, 8], [12, 26], [29,33]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>x</a><b></b><c></c><d>texta</d><br/>'), 4, 29), [[8, 22], [25, 29]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>xtext</a><b></b><c></c><d>a</d><br/>'), 4, 29), [[4, 8], [12, 26]]);
    });
    it('should create only one if-block section even if there are multiple opening and closing tags', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm>x<table><tr><td><p></p></td></tr><tr><td><p></p></td></tr></table></xm>'), 5, 79), [[5, 70]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><table> <tr> <td><p></p></td> </tr>   <tr> <td><p></p></td> </tr> </table></xml>'), 5, 79), [[5, 79]]);
    });
    it('should accept float position if markers are next to each over in XML', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a></a></a></a></a></xml>'), 17, 17.1), [[17, 17]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <table> <tr> <li> </li><li> </li> </tr> <tr></tr></table> </xml>'), 24, 24.03125), [[24, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <table> <tr> <li> </li><li> </li> </tr> <tr></tr></table> </xml>'), 24.03125, 24.8), [[24, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <table> <tr> <li> </li><li> </li> </tr> <tr></tr></table> </xml>'), 24, 24), [[24, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xm><p><p><p><p>x <a>b</a> <br/></p></p></p></p> <br/><br/><br/> </xm>'), 17.9, 65.9), [[17, 32], [48, 65]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>xtext</a><b></b><c></c><d>x</d><br/>'), 4.9, 29.1), [[4, 8], [12, 26]]);
    });
    it('should move if start/end before or after original start/end if there is only opening tag before, or ending tag after', function () {
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<body><a></a><p></p><p></p><n></n></body> '), 9, 30), [[6, 34]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a></a></a></a></a></xml>'), 5, 17), [[5, 33]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a></a></a></a></a></xml>'), 17, 33), [[5, 33]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a> <br/> </a></a></a></a></xml>'), 5, 24), [[5, 40]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 5, 19), [[5, 35]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 8, 19), [[8, 31]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 11, 19), [[11, 27]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 14, 19), [[14, 23]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 17, 23), [[14, 23]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 17, 27), [[11, 27]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 17, 31), [[8, 31]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a></xml>'), 17, 35), [[5, 35]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a>a<a><a><a><a>  </a></a></a></a></xml>'), 35, 48), [[35, 36]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a>a<a><a><a><a>  </a></a></a></a></xml>'), 35, 58), [[35, 66]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a></a></a></a>a<a><a><a><a>  </a></a>b</a></a></xml>'), 35, 58), [[35, 36], [42, 58]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<body><p>a</p><g></g><g></g><p></p></body>'), 10, 31), [[14, 35]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a><p></p></a></a></a></xml>'), 5, 19), [[14, 23]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a><p></p></a></a></a></xml>'), 17, 42), [[5, 42]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><p><p></p></p><a><p></p><a>  </a></a></a></a></xml>'), 5, 40), [[5, 56]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a>za<a>zd<p><p>dza</p></p><a><p></p><a>  </a></a></a></a></xml>'), 5, 47), [[5, 63]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><p></p><a>  </a></a></a></a></xml>'), 5, 26), [[5, 42]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><p></p><a>  </a></a></a></a></xml>'), 24, 42), [[21, 30]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a>x<a>  </a></a></a></a></xml>'), 18, 36), [[15, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a>x<a><a>  </a></a></a></a></xml>'), 18, 36), [[12, 28]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a>  </a><p>z</p></a><p>z</p></a></a></xml>'), 17, 51), [[5, 51]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a><p>qs</p></a></a></a></a></xml>'), 17, 26), [[17, 26]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><a><a><a><a> ed<br/><p>qs</p>qs </a></a></a></a></xml>'), 17, 37), [[17, 37]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <tr></tr>a<tr></tr> </xml>'), 10, 20), [[6, 25]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><b></b>ab<b></b></p></xml>'), 11, 20), [[8, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>ab<b></b>ab<b></b></p></xml>'), 13, 26), [[10, 26]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><b></b>ab<b></b>ab</p></xml>'), 11, 20), [[8, 24]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 38), [[5, 42]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>a<h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 39), [[5, 43]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>a <h1><br/><br/><br/></h1><br/>a</p></xml>'), 5, 40), [[5, 44]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p>a<h1><br/><br/><br/></h1><br/></p></xml>'), 5, 38), [[5, 42]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab</xml><div>'), 5, 13), [[0, 13]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml>ab</xml>'), 5, 13), [[0, 13]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><b></b>ab<b><br/>a</b></xml>'), 8, 22), [[5, 14], [17, 22]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><b></b>ab<b><br/></b></xml>'), 8, 22), [[5, 26]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d><f>  <g></g>'), 3, 50), [[0, 38], [41, 50]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><p><p><p> <a>b</a> </p></p></p></p> <br/><br/><br/> </xml>'), 17, 60), [[5, 60]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><p><p><p> <a>b</a> <br/></p></p></p></p> <br/><br/><br/> </xml>'), 17, 65), [[5, 65]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a><xml><p><p><p><p> <a>b</a> <br/></p></p></p></p> <br/><br/><br/> </xml></a>'), 20, 68), [[8, 68]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d><f>  <g>a</g>'), 3, 46), [[0, 38], [41, 43]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d><f>  <g></g>'), 3, 46), [[0, 38], [41, 50]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d> <br/><d> textD <e>e</e> </d><f>  <g>a</g>'), 3, 75), [[0, 67], [70, 72]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d> <br/><d> textD <e>e</e> </d><f>  <g></g>'), 3, 75), [[0, 67], [70, 79]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d> <br/> <d> textD <e>e</e> </d><f>  <g>a</g>'), 3, 76), [[0, 68], [71, 73]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<b><c></c> </b><d> textD <e>e</e> </d> <br/> <d> textD <e>e</e> </d><f>  <g></g>'), 3, 76), [[0, 68], [71, 80]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml> <p><br/><br/><br/></p> </xml>'), 5, 29), [[5, 29]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><p><p><p> </p></p></p></p> <br/><br/><br/> </xml>'), 17, 51), [[5, 51]]);

      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>text</a><b></b><c></c><d>text</d><br/>'), 3, 32), [[0, 36]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a></a><b></b><c></c><d>text</d><br/>'), 3, 28), [[0, 32]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>text</a><b></b><c></c><d></d><br/>'), 3, 28), [[0, 32]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><table><tr><td><p></p></td></tr><tr><td><p></p></td></tr></table></xml>'), 5, 79), [[0, 76]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<xml><p><p><p><p> <a>b</a> <br/></p></p></p></p> <br/><br/><br/> </xml>'), 17.9, 65.9), [[5, 65]]);
      helper.assert(parser.findSafeConditionalBlockPosition(convXML('<a>text</a><b></b><c></c><d>x</d><br/>'), 3.9, 28.1), [[0, 25]]);
    });
  });

  describe('count formatter', function () {

    describe('Preprocess', function () {

      it('should assign loop id (without parenthesis)', function (done) {
        var _xml = '<xml><p>{d.cars[i].brand:count}:{d.cars[i].brand }</p><p>{d.cars[i+1].brand} : {d.cars[i+1].brand}</p></xml>';
        // eslint-disable-next-line no-unused-vars
        var _data = {
          cars : [
            {brand : 'Lumeneo'},
            {brand : 'Tesla'  },
            {brand : 'Toyota' }
          ]
        };

        parser.findMarkers(_xml, function (err, xmlWithoutMarkers, markers) {
          parser.preprocessMarkers(markers, [], function (err, markers) {
            helper.assert(markers[0].name, '_root.d.cars[i].brand:count(09)');
            done();
          });
        });
      });

      it('should assign loop id (with parenthesis)', function (done) {
        var _xml = '<xml><p>{d.cars[i].brand:count()}:{d.cars[i].brand }</p><p>{d.cars[i+1].brand} : {d.cars[i+1].brand}</p></xml>';
        // eslint-disable-next-line no-unused-vars
        var _data = {
          cars : [
            {brand : 'Lumeneo'},
            {brand : 'Tesla'  },
            {brand : 'Toyota' }
          ]
        };

        parser.findMarkers(_xml, function (err, xmlWithoutMarkers, markers) {
          parser.preprocessMarkers(markers, [], function (err, markers) {
            helper.assert(markers[0].name, '_root.d.cars[i].brand:count(09)');
            done();
          });
        });
      });
      it('should assign loop id (with start given)', function (done) {
        var _xml = '<xml><p>{d.cars[i].brand:count(42)}:{d.cars[i].brand }</p><p>{d.cars[i+1].brand} : {d.cars[i+1].brand}</p></xml>';
        // eslint-disable-next-line no-unused-vars
        var _data = {
          cars : [
            {brand : 'Lumeneo'},
            {brand : 'Tesla'  },
            {brand : 'Toyota' }
          ]
        };

        parser.findMarkers(_xml, function (err, xmlWithoutMarkers, markers) {
          parser.preprocessMarkers(markers, [], function (err, markers) {
            helper.assert(markers[0].name, '_root.d.cars[i].brand:count(09, 42)');
            done();
          });
        });
      });

      it('should assign loop id (with start given)', function (done) {
        var _xml = '<xml> <t_row> {d[speed=100,i].brand:count} </t_row><t_row> {d[  speed =  100 ,  i+1].brand} </t_row></xml>';
        // eslint-disable-next-line no-unused-vars
        var _data = [
          {brand : 'Lumeneo'     , speed : 100},
          {brand : 'Tesla motors', speed : 200},
          {brand : 'Toyota'      , speed : 100}
        ];

        parser.findMarkers(_xml, function (err, xmlWithoutMarkers, markers) {
          parser.preprocessMarkers(markers, [], function () {
            // helper.assert(markers[0].name, '_root.d.cars[i].brand:count(08, 42)')
            done();
          });
        });
      });

    });


    describe('Exec', function () {

      it('should return __COUNT_0_0__ each time', function () {
        helper.assert(count('', 0), '__COUNT_0_1__');
        helper.assert(count('', 0), '__COUNT_0_1__');
        helper.assert(count('', 0), '__COUNT_0_1__');
      });

      it('should return __COUNT_1337_42__ each time', function () {
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');
      });

      it('should return __COUNT_1337_42__ then __COUNT_42_1337__', function () {
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');
        helper.assert(count('', 1337, 42), '__COUNT_1337_42__');

        helper.assert(count('', 42, 1337), '__COUNT_42_1337__');
        helper.assert(count('', 42, 1337), '__COUNT_42_1337__');
        helper.assert(count('', 42, 1337), '__COUNT_42_1337__');
      });

    });


  });

});

/**
 * Convert XML to flattened XML.
 *
 * It is easier to work with XML in tests
 *
 * @param  {String} xml xml to parser
 * @return {Array}      xml array
 */
function convXML (xml) {
  return parser.flattenXML(xml);
}

/**
 * @description Function used to call removeXMLInsideMarkers and findMarker
 * @param {String} xml xml to parse
 * @param {Function} cb callback function
 */
function callFindMarkers(xml, cb) {
  xml = parser.removeXMLInsideMarkers(xml);
  return parser.findMarkers(xml, cb);
}