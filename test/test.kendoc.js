var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');


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
      var data = {
        'menu' : 'blabla',
        'names' : 'Morpheus and Neo',
        'address' : {
          'city' : 'Nebuchadnezzar',
          'zip' : '2999'
        }
      };
      assert.equal(kendoc.extractTags('<xmlstart>{{menu}}</xmlend>', data), '<xmlstart>blabla</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>  {{  menu  }} </xmlend>', data), '<xmlstart>  blabla </xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{names}}</xmlend>', data), '<xmlstart>Morpheus and Neo</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', data), '<xmlstart>blabla<interxml><bullshit></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', data), '<xmlstart>Nebuchadnezzar 2999</xmlend>');
    });
    it('should remove the tag in xml if there is no corresponding data in the object', function(){
      var data = {
        'AAmenu' : 'blabla',
        'address' : {
          'AAcity' : 'Nebuchadnezzar',
          'zip' : '2999'
        }
      };
      assert.equal(kendoc.extractTags('<xmlstart>{{menu}}</xmlend>', data), '<xmlstart></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{me<interxml>n<bullshit>u}}</xmlend>', data), '<xmlstart><interxml><bullshit></xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{address.city}} {{address.zip}}</xmlend>', data), '<xmlstart> 2999</xmlend>');
      assert.equal(kendoc.extractTags('<xmlstart>{{cars.wheels}}</xmlend>', data), '<xmlstart></xmlend>');
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

  //describe('detectArray', function(){
  //  it('should detect array', function(){
  //    assert.equal(kendoc.detectArray('<tr> <tc>{tab[i]}</tc> </tr><tr> <tc>{tab[i+1]}</tc> </tr>'), '{tab[i]}</tc> </tr><tr> <tc>{tab[i+1]}');
  //  });
  //});
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


