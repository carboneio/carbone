var assert = require('assert');
var parser = require('../lib/parser');
var helper = require('../lib/helper');

describe('parser', function () {
  
  describe('findMarkers', function () {
    it('should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('{d.menu}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 0, name : '_root.d.menu'}]);
        helper.assert(cleanedXml, '');
        done();
      });
    });
    it('2. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<div>{c.menu}<div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 5, name : '_root.c.menu'}]);
        helper.assert(cleanedXml, '<div><div>');
        done();
      });
    });
    it('3. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<xmlstart>{d.me<interxml>n<bullshit>u}</xmlend>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 10, name : '_root.d.menu'}]);
        helper.assert(cleanedXml, '<xmlstart><interxml><bullshit></xmlend>');
        done();
      });
    });
    it('4. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<div>{d.menu}<div>{d.city}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 5, name : '_root.d.menu'},{pos : 10, name : '_root.d.city'}]);
        helper.assert(cleanedXml, '<div><div>');
        done();
      });
    });
    it('5. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<xmlstart>{d.me<interxml>n<bullshit>u}</xmlend><tga>{d.ci<td>ty</td>}<tga><bla>{d.cars}</bla>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 10, name : '_root.d.menu'},{pos : 44, name : '_root.d.city'},{pos : 63, name : '_root.d.cars'}]);
        helper.assert(cleanedXml, '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>');
        done();
      });
    });
    it('6. should extract the markers from the xml, return the xml without the markers and a list of markers with their position in the xml\
        it should add the root object.', function (done) {
      parser.findMarkers('<xmlstart>{d.me<interxml>n<bullshit>u[i].city}</xmlend><tga>{d.ci<td>ty</td>}<tga><bla>{c.cars[i].wheel}</bla>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 10, name : '_root.d.menu[i].city'},{pos : 44, name : '_root.d.city'},{pos : 63, name : '_root.c.cars[i].wheel'}]);
        helper.assert(cleanedXml, '<xmlstart><interxml><bullshit></xmlend><tga><td></td><tga><bla></bla>');
        done();
      });
    });
    it('should remove unwanted characters', function (done) {
      parser.findMarkers('<div>{d.menu}<div> \n   {d.city}', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 5, name : '_root.d.menu'},{pos : 15, name : '_root.d.city'}]);
        helper.assert(cleanedXml, '<div><div>     ');
        done();
      });
    });
    it('should convert conflicting characters', function (done) {
      parser.findMarkers("<div>{d.menu}<div> it's \n   {d.city}", function (err, cleanedXml) {
        helper.assert(err, null);
        helper.assert(cleanedXml, "<div><div> it\\\'s     ");
        done();
      });
    });
    it('should keep whitespaces between simple quotes', function (done) {
      parser.findMarkers("<div>{d.menu:test('hello, world is great')}<div>", function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 5, name : '_root.d.menu:test(\'hello, world is great\')'}]);
        done();
      });
    });
    it('should keep whitespaces between encoded simple quotes, and it should convert encoded quotes', function (done) {
      parser.findMarkers('<div>{d.menu:test(&apos;hello, world is great&apos;)}<div>', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 5, name : '_root.d.menu:test(\'hello, world is great\')'}]);
        done();
      });
    });
    it('should remove whitespaces which are inside {} and not inside <>. It should not count them for the position', function (done) {
      parser.findMarkers(' <div>   {  d.menu  }   <div>   {   d.city  } ', function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [{pos : 9, name : '_root.d.menu'},{pos : 20, name : '_root.d.city'}]);
        helper.assert(cleanedXml, ' <div>      <div>    ');
        parser.findMarkers(' <xmlstart> {  d.me  <interxml> n <bull  sh it> u [ i ] . city } </xmlend> <tga> {d.ci  <td>  ty  </td>  } <tga><bla>{d.cars[i].wheel}</bla>', function (err, cleanedXml, markers) {
          helper.assert(err, null);
          helper.assert(markers, [{pos : 12, name : '_root.d.menu[i].city'},{pos : 52, name : '_root.d.city'},{pos : 72, name : '_root.d.cars[i].wheel'}]);
          helper.assert(cleanedXml, ' <xmlstart> <interxml><bull  sh it> </xmlend> <tga> <td></td> <tga><bla></bla>');
          done();
        });
      });
    });
    it('should not extract marker if it does not start by {d. {d[ {c. {c[ {$', function (done) {
      var _xml = '<xml>{<td>d<td>.<td>menu</td></td></td>}</xml>'
               + '{d.menu}'
               + '{d[i].menu}'
               + '{c.memu}'
               + '{c[i].menu}'
               + '{$menu}'
               + '{D.menu}' // not parsed
               + '{C.menu}' // not parsed
               + '{C.menu}' // not parsed
               + '{DZZDZD-DSDZD-1131}'; // not parsed
      parser.findMarkers(_xml, function (err, cleanedXml, markers) {
        helper.assert(err, null);
        helper.assert(markers, [
          { pos : 5,  name : '_root.d.menu' },
          { pos : 38, name : '_root.d.menu' },
          { pos : 38, name : '_root.d[i].menu' },
          { pos : 38, name : '_root.c.memu' },
          { pos : 38, name : '_root.c[i].menu' },
          { pos : 38, name : '_root.$menu' }
        ]);
        helper.assert(cleanedXml, '<xml><td><td><td></td></td></td></xml>{D.menu}{C.menu}{C.menu}{DZZDZD-DSDZD-1131}');
        done();
      });
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
      var _objLang = {
        Monday : 'Lundi'
      };
      parser.translate('', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '');
        done();
      });
    });
    it('should not crash if objLang is undefined, and it should replace translation markers by the "not translated" text', function (done) {
      parser.translate('<xml> {t(yeah)} </xml>', undefined, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml> yeah </xml>');
        done();
      });
    });
    it('should not consider marker which starts by "t" and which is not a translation marker', function (done) {
      var _objLang = {
        Monday : 'Lundi'
      };
      parser.translate('<xml>{table}</xml>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xml>{table}</xml>');
        done();
      });
    });
    it('should not consider marker which starts by "t" and which is not a translation marker (variable marker)', function (done) {
      var _objLang = {
        Monday : 'Lundi'
      };
      parser.translate('<xml>{#t($a) = myvar=$a} </xml>', _objLang, function (err, xmlTranslated) {
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
      var _objLang = {
        Monday : 'Lundi'
      };
      parser.translate('<xmlstart>{me<interxml>n<bullshit>u}<div>{t(Mond<interxml>ay)}</div><div>{#def = id=2  }</div><div>{t(Tuesday is <bullshit>the second day of the week!)}</div></xmlend>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart>{me<interxml>n<bullshit>u}<div>Lundi<interxml></div><div>{#def = id=2  }</div><div>Tuesday is the second day of the week!<bullshit></div></xmlend>');
        done();
      });
    });
    it('should extract t(I have a dog) and t(I\'ve a cat) and translate it to J\'ai un chien and J\'ai un chat', function (done) {
      var _objLang = {
        'I have a dog' : 'J\'ai un chien',
        'I\'ve a cat'  : 'J\'ai un chat',
      };
      parser.translate('<xmlstart><div>{t(I have a dog)}</div><div>{t(I&apos;ve a cat)}</div></xmlend>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div>J&apos;ai un chien</div><div>J&apos;ai un chat</div></xmlend>');
        done();
      });
    });
    it('should extract t(I saw a spirit(with green eyes and a transparent body) and I cried) and translate this', function (done) {
      var _objLang = {
        'I saw a spirit(with green eyes and a transparent body) and I cried' : 'J ai vu un esprit(avec des yeux verts et un corps transparent) et j ai crié'
      };
      parser.translate('<xmlstart><div>{t(I saw a spi<interxml>rit(with green eyes and a trans<interxml>parent body) and I cried)}</div></xmlend>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div>J ai vu un esprit(avec des yeux verts et un corps transparent) et j ai crié<interxml><interxml></div></xmlend>');
        done();
      });
    });
    it('should translate this string and keep tags inside t(). The final result include <b> <i>', function (done) {
      var _objLang = {
        cat : 'chat',
        dog : 'chien'
      };
      parser.translate('<xmlstart><div><b>{</b>t(<i><b>cat</b></i>)}<b>thanks</b>{t(<i>do<interxml>g</i>)}</div></xmlend>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart><div><b>chat</b><i><b></b></i><b>thanks</b>chien<i><interxml></i></div></xmlend>');
        done();
      });
    });
    it('should translate the sentence and keep the smiley :)', function (done) {
      var _objLang = {
        'my smiley :) ' : 'mon emoticon :) '
      };
      parser.translate('<xmlstart>{t(my smiley :) )}<b>', _objLang, function (err, xmlTranslated) {
        helper.assert(err, null);
        helper.assert(xmlTranslated, '<xmlstart>mon emoticon :) <b>');
        done();
      });
    });
    it('should translate this sentence with special characters', function (done) {
      var _objLang = {
        'price < 100'                                     : 'prix < 100',
        'productPrice >= salePrice > mac\'doProductPrice' : 'prixProduit >= prixVente > prixProduitMac\'Do',
      };
      parser.translate('<xmlstart>{t(price &lt; 100)}<b>test</b><span>{t(productPrice &gt;= salePrice &gt; mac&apos;doProductPrice)}</span>', _objLang, function (err, xmlTranslated) {
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
    it('should return -1 when the opening tag is not found', function () {
      assert.equal(parser.findOpeningTagPosition('aasqdsqd</tr>'), -1);
      assert.equal(parser.findOpeningTagPosition('aasas<tr></tr>sqdsqd</tr>'), -1);
      assert.equal(parser.findOpeningTagPosition('<p></p></p><p></p></p><br/>',22), -1);
      assert.equal(parser.findOpeningTagPosition('</p><p><p><br/></p></p><br/>',4), -1);
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
  });

  describe('findPivot', function () {
    it('should return null if the pivot cannot be found', function () {
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
        part1End   : {tag : 'br', pos : 5, selfClosing : true},
        part2Start : {tag : 'br', pos : 10, selfClosing : true}
      });
      _str = '<br/><br/><br/><br/>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'br', pos : 5, selfClosing : true},
        part2Start : {tag : 'br', pos : 15, selfClosing : true}
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
    it('should accept very complex case', function () {
      var _str = '<w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00137A31"><w:trPr><w:trHeight w:val="1760"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10012" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="auto"/></w:tcPr><w:p wsp:rsidR="00137A31" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00137A31" wsp:rsidP="007057CC"><w:pPr><w:rPr><w:b/><w:b-cs/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl><w:p wsp:rsidR="00F62BCC" wsp:rsidRDefault="00F62BCC"><w:pPr><w:rPr><w:sz w:val="32"/></w:rPr></w:pPr></w:p><w:tbl><w:tblPr><w:tblpPr w:leftFromText="180" w:rightFromText="180" w:horzAnchor="page" w:tblpX="1009"/><w:tblW w:w="10081" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:left w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:bottom w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/><w:right w:val="single" w:sz="8" wx:bdrwidth="20" w:space="0" w:color="4F81BD"/></w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="10081"/></w:tblGrid><w:tr wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidTr="00F62BCC"><w:trPr><w:trHeight w:val="98"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10081" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="4F81BD"/></w:tcPr><w:p wsp:rsidR="00F62BCC" wsp:rsidRPr="00F62BCC" wsp:rsidRDefault="00F62BCC" wsp:rsidP="007E678B"><w:pPr><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr></w:pPr><w:r wsp:rsidRPr="00F62BCC"><w:rPr><w:b/><w:b-cs/><w:color w:val="FFFFFF"/></w:rPr>';
      helper.assert(parser.findPivot(_str), {
        part1End   : {tag : 'w:tbl', pos : 485 },
        part2Start : {tag : 'w:tbl', pos : 593 }
      });
    });
    /* it.skip('should accept non-XML structure', function(){
      var _str = ' ';
      helper.assert(parser.findPivot(_str), {
        'part1End'  :{'tag':'', 'pos': 1 },
        'part2Start':{'tag':'', 'pos': 1 }
      });
    });*/
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
    it('should return -1 if the start tag is not found', function () {
      var _xml = 'qsjh k  qsd:blue color=test   menu <r/><p> bla </p><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p>    balle </tr> dqd';
      var _pivot = {
        part1End   : {tag : 'tr', pos : 70 },
        part2Start : {tag : 'tr', pos : 70 }
      };
      var _expectedRange = {startEven : -1,  endEven : 70, startOdd : 70, endOdd : 120};
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
  });


});


