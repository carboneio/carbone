var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var converter = require('../lib/converter');

var defaultOptions = {
  'mode' : 'pipe', 
  'pipeNamePrefix' : '_carbone',
  'nbListeners' : 1,
  'startDelay' : 4000,
  'startOnInit' : false,
  'nbAttemptMax' : 2
};

describe('Carbone', function(){

  describe('buildXML', function(){
    it('should work if the same array is repeated two times in the xml <tr>d[i].product</tr>    <tr>d[i].product</tr>');
    it.skip('should escape special characters > < & " \' even if a formatter is used');
    it('should return the xml if no data is passed', function(){
      var _xml = '<xml> </xml>';
      var _xmlBuilt = carbone.buildXML(_xml);
      helper.assert(_xmlBuilt, '<xml> </xml>');
    });
    it('should replace a simple tag by the data', function(){
      var _xml = '<xml> {d.title} </xml>';
      var _data = {'title' : 'boo'};
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo </xml>');
    });
    it('should replace null or undefined data by an empty string', function(){
      var _xml = '<xml> {d.title} </xml>';
      var _xmlBuilt = carbone.buildXML(_xml, {'title' : null});
      helper.assert(_xmlBuilt, '<xml>  </xml>');
      _xmlBuilt = carbone.buildXML(_xml, {'title' : undefined});
      helper.assert(_xmlBuilt, '<xml>  </xml>');
    });
    it('should escape special characters > < & for XML', function(){
      var _xml = '<xml> {d.title} </xml>';
      var _xmlBuilt = carbone.buildXML(_xml, {'title' : '&'});
      helper.assert(_xmlBuilt, '<xml> &amp; </xml>');
      _xmlBuilt = carbone.buildXML(_xml, {'title' : '<'});
      helper.assert(_xmlBuilt, '<xml> &lt; </xml>');
      _xmlBuilt = carbone.buildXML(_xml, {'title' : '>'});
      helper.assert(_xmlBuilt, '<xml> &gt; </xml>');
     /* 
      Apparently,  Word and LibreOffice accept " and ' directly in XML.
      _xmlBuilt = carbone.buildXML(_xml, {'title' : '\''});
      helper.assert(_xmlBuilt, '<xml> &apos; </xml>');
      _xmlBuilt = carbone.buildXML(_xml, {'title' : '"'});
      helper.assert(_xmlBuilt, '<xml> &quot; </xml>');*/
      _xmlBuilt = carbone.buildXML(_xml, {'title' : 'a & b c <table> <> & <'});
      helper.assert(_xmlBuilt, '<xml> a &amp; b c &lt;table&gt; &lt;&gt; &amp; &lt; </xml>');
    });
    it('should works with two nested objects', function(){
      var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
      var _data = {
        'title' : 'boo',
        'city' :{
          'id' : 5
        }
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo <br> 5 </xml>');
    });
    it('should remove the tags if the data is not what you expect', function(){
      var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
      var _data = {
        'bullshit' : 'boo'
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml>  <br>  </xml>');
    });
    it('should remove the tags part if the data is not provided', function(){
      var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
      var _data = {
        'title' : 'boo'
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo <br>  </xml>');
    });
    it('should automatically repeat the xml if the root is an array of objects', function(){
      var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should handle array in an object', function(){
      var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars[i+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'},
          {'brand' : 'Tesla motors'},
          {'brand' : 'Toyota'}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should accept custom iterators and sort the data using this iterator', function(){
      var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'     , 'sort':3},
          {'brand' : 'Tesla motors', 'sort':1},
          {'brand' : 'Toyota'      , 'sort':2}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row></xml>');
    });
    it('should use the default order of the array if the custom iterator cannot be used (always equals 1)', function(){
      var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'     , 'sort':1},
          {'brand' : 'Tesla motors', 'sort':1},
          {'brand' : 'Toyota'      , 'sort':1}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should use the default order of the array if the custom iterator is null', function(){
      var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'     , 'sort':null},
          {'brand' : 'Tesla motors', 'sort':null},
          {'brand' : 'Toyota'      , 'sort':null}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it.skip('should use the default order of the array if the custom iterator is undefined', function(){
      var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'     , 'sort':undefined},
          {'brand' : 'Tesla motors', 'sort':undefined},
          {'brand' : 'Toyota'      , 'sort':undefined}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should work if there is a whitespace between "cars" and "[" in some tags', function(){
      var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars [i+1].brand} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'},
          {'brand' : 'Tesla motors'},
          {'brand' : 'Toyota'}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should manage nested arrays', function(){
      var _xml = 
         '<xml>'
        +  '<t_row><td>{d.cars[i].wheels[i].size  }</td><td>{d.cars[i].wheels[i+1].size  }</td></t_row>'
        +  '<t_row><td>{d.cars[i+1].wheels[i].size}</td><td>{d.cars[i+1].wheels[i+1].size}</td></t_row>'
        +'</xml>';
      var _data = {
        'cars':[
          {'wheels': [ {'size': 'A'}, {'size': 'B'}               ]},
          {'wheels': [ {'size': 'C'}, {'size': 'D'},{'size': 'E'} ]}
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row><td>A</td><td>B</td></t_row><t_row><td>C</td><td>D</td><td>E</td></t_row></xml>');
    });
    it('should manage two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function(){
      var _xml = 
         '<xml>'
        +  '<table>'
        +  '<h1>{d[i].site.label}</h1>'
        +  '<cell><t_row>{d[i].cars[i].size}</t_row>'
        +  '<t_row>{d[i].cars[i+1].size}</t_row></cell>'
        +  '<cell><t_row>{d[i].trucks[i].size}</t_row>'
        +  '<t_row>{d[i].trucks[i+1].size}</t_row></cell>'
        +  '</table>'
        +  '<table>'
        +  '<h1>{d[i+1].site.label}</h1>'
        +  '</table>'
        +'</xml>';
      var _data = [{
        'site' : {'label':'site_A'},
        'cars' : [ {'size': 'A'}, {'size': 'B'}  ],
        'trucks' : [ {'size': 'X'} ]
      }];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row>A</t_row><t_row>B</t_row></cell><cell><t_row>X</t_row></cell></table></xml>');
    });
    it('should manage nested object with two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function(){
      var _xml = 
         '<xml>'
        +  '<table>'
        +  '<h1>{d[i].site.label}</h1>'
        +  '<cell><t_row><td>{d[i].cars[i].size}</td><td>{d[i].cars[i].spec.qty}</td></t_row>'
        +  '<t_row><td>{d[i].cars[i+1].size}</td><td>{d[i].cars[i+1].spec.qty}</td></t_row></cell>'
        +  '<cell><t_row><td>{d[i].trucks[i].size}</td></t_row>'
        +  '<t_row><td>{d[i].trucks[i+1].size}</td></t_row></cell>'
        +  '</table>'
        +  '<table>'
        +  '<h1>{d[i+1].site.label}</h1>'
        +  '</table>'
        +'</xml>';
      var _data = [{
        'site' : {'label':'site_A'},
        'cars' : [ {'size': 'A', 'spec':{'qty': 1}}, {'size': 'B', 'spec':{'qty': 2}}  ],
        'trucks' : [ {'size': 'X'} ]
      }];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row><td>A</td><td>1</td></t_row><t_row><td>B</td><td>2</td></t_row></cell><cell><t_row><td>X</td></t_row></cell></table></xml>');
    });
    it('should manage nested arrays with complex iterators', function(){
      var _xml = 
         '<xml>'
        +  '<t_row><td>{d.cars[driver.name].wheels[size].size  }</td><td>{d.cars[driver.name].wheels[size+1].size  }</td></t_row>'
        +  '<t_row><td>{d.cars[driver.name+1].wheels[size].size}</td><td>{d.cars[driver.name+1].wheels[size+1].size}</td></t_row>'
        +'</xml>';
      var _data = {
        'cars':[
          {
            'wheels': [ {'size': 'B'}, {'size': 'A'}                ],
            'driver': {'name' : 'david'}
          },
          {
            'wheels': [ {'size': 'D'}, {'size': 'C'}, {'size': 'E'} ],
            'driver': {'name' : 'bob'}
          }
        ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row><td>C</td><td>D</td><td>E</td></t_row><t_row><td>A</td><td>B</td></t_row></xml>');
    });
    it('should work with two adjacents arrays and some xml in between. It should work even if there are a lot of whitespaces ', function(){
      var _xml = 
         '<xml>'
        +  '<t_cars>   <td>{  d.cars[ i ].brand   } </td> <td>{   d.cars[i + 1 ].brand   } </td> </t_cars>'
        +  '<oo> hello </oo>'
        +  '<t_wheels> <td>{  d.wheels[ i ].size  } </td> <td>{   d.wheels[ i + 1].size  } </td> </t_wheels>'
        +'</xml>';
      var _data = {
        'cars'  : [ {'brand': 'Tesla'}, {'brand': 'Lumeneo'}, {'brand': 'Venturi'} ],
        'wheels': [ {'size': 'A'},      {'size': 'B'} ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_cars>   <td>Tesla </td><td>Lumeneo </td><td>Venturi </td> </t_cars><oo> hello </oo><t_wheels> <td>A </td><td>B </td> </t_wheels></xml>');
    });
    it('should accept condition "=" in arrays', function(){
      var _xml = '<xml> <t_row> {d[speed=100,i].brand} </t_row><t_row> {d[  speed =  100 ,  i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':100},
        {'brand' : 'Tesla motors', 'speed':200},
        {'brand' : 'Toyota'      , 'speed':100}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should accept condition ">" in arrays', function(){
      var _xml = '<xml> <t_row> {d[speed>100,i].brand} </t_row><t_row> {d[  speed >  100 ,  i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':50},
        {'brand' : 'Tesla motors', 'speed':200},
        {'brand' : 'Toyota'      , 'speed':100}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row></xml>');
    });
    it('should accept condition "<" in arrays', function(){
      var _xml = '<xml> <t_row> {d[speed<200,i].brand} </t_row><t_row> {d[  speed <  200 ,  i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':150},
        {'brand' : 'Tesla motors', 'speed':200},
        {'brand' : 'Toyota'      , 'speed':100}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
    });
    it('should accept multiple conditions in arrays', function(){
      var _xml = '<xml> <t_row> {d[speed=100, high < 15, i].brand} </t_row><t_row> {d[speed=100, high < 15,i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':100, 'high':12},
        {'brand' : 'Tesla motors', 'speed':200, 'high':5},
        {'brand' : 'Toyota'      , 'speed':100, 'high':44}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
    });
    it('should accept conditions in a nested object', function(){
      var _xml = '<xml> <t_row> {d[ speed . high > 13, i].brand} </t_row><t_row> {d[ speed.high > 13,i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':{'high':12, 'low':1}},
        {'brand' : 'Tesla motors', 'speed':{'high':5 , 'low':2 }},
        {'brand' : 'Toyota'      , 'speed':{'high':44, 'low':20}}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row></xml>');
    });
    it('should accept two conditions on the same object-attribute. It should accept extra whitespaces in the condition', function(){
      var _xml = '<xml> <t_row> {d[ speed . high > 8, s pe ed.h igh < 20, i].brand} </t_row><t_row> {d[ speed.high > 8, speed.high < 20, i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'     , 'speed':{'high':12, 'low':1}},
        {'brand' : 'Tesla motors', 'speed':{'high':5 , 'low':2 }},
        {'brand' : 'Toyota'      , 'speed':{'high':44, 'low':20}}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
    });
    it.skip('should work if the same array is repeated two times in the xml', function(){
      var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row><t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });

  });

  describe('render', function(){
    it('should render a template (docx) and give result with replacements', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _resultFilePath = path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.docx');
      carbone.render(_filePath, data, function(result){
        fs.writeFileSync(_resultFilePath, result);
        carbone.unzip(_resultFilePath, function(dir){
          var _xmlExpectedPath = path.join(dir, 'word', 'document.xml');
          var _xmlExpectedContent = fs.readFileSync(_xmlExpectedPath, 'utf8');
          assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
          fs.unlinkSync(_resultFilePath);
          helper.rmDirRecursive(dir);
          done();
        });
      });
    });
    it('should render a template (doc XML 2003) and give result with replacements', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _resultFilePath = path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.xml');
      carbone.render(_filePath, data, function(result){
        fs.writeFileSync(_resultFilePath, result);
        var _xmlExpectedContent = fs.readFileSync(_resultFilePath, 'utf8');
        assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
        assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
        assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
        assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
        fs.unlinkSync(_resultFilePath);
        done();
      });
    });
  });

  describe('renderPDF', function(){
    afterEach(function(done){
      converter.exit(function(){
        converter.init(defaultOptions, done);
      });
    });
    it('should render a template (docx), generate to PDF and give output', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.renderPDF(_filePath, data, function(result){
        var buf = new Buffer(result);
        assert.equal(buf.slice(0, 4).toString(), '%PDF');
        var bufPDF = new Buffer(buf.length);
        fs.open(_pdfResultPath, 'r', function(status, fd){
          fs.read(fd, bufPDF, 0, buf.length, 0, function(err, bytesRead, buffer){
            assert.equal(buf.slice(0, 100).toString(), buffer.slice(0, 100).toString());
            done();
          });
        });
      });
    });
  });

  describe('cacheFormatters', function(){
    it('should cache formatters available in carbone', function(done){
      carbone.formatters = {};
      assert.equal(Object.keys(carbone.formatters).length, 0);
      carbone.cacheFormatters(function(){
        assert.notEqual(Object.keys(carbone.formatters).length, 0);
        done();
      });
    });
    it('should cache formatters available in carbone and custom formatters', function(done){
      carbone.formatters = {};
      carbone.addFormatters({
        'yesOrNo' : function(d){ return 2; }
      });
      carbone.cacheFormatters(function(){
        assert.equal(typeof carbone.formatters['yesOrNo'], 'function');
        done();
      });
    });
  });

  describe('addFormatters', function(){
    it('should add a formatter to the list of custom formatters', function(){
      carbone.addFormatters({
        'yesOrNo' : function(d){
          return d === true ? 'yes' : 'no';
        }
      });
      assert.notEqual(typeof carbone.customFormatters['yesOrNo'], 'undefined');
      assert.equal(carbone.customFormatters['yesOrNo'](true), 'yes');
    });
  });

  describe('general', function(){
    it('should create the folder "temp" if not exists and not throw an error', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _tempFolderPath = path.resolve('temp');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      helper.rmDirRecursive(_tempFolderPath);
      carbone.render(_filePath, data, function(){
        done();
      });
    });
  });

});


