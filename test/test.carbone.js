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
    it('should works if two adjacents arrays are used. It should work even if there are a lot of whitespaces ', function(){
      var _xml = 
         '<xml>'
        +  '<t_cars>   <td>{  d.cars[i].brand   } </td> <td>{   d.cars[i+1].brand   } </td> </t_cars>'
        +  '<t_wheels> <td>{  d.wheels[i].size  } </td> <td>{   d.wheels[i+1].size  } </td> </t_wheels>'
        +'</xml>';
      var _data = {
        'cars'  : [ {'brand': 'Tesla'}, {'brand': 'Lumeneo'}, {'brand': 'Venturi'} ],
        'wheels': [ {'size': 'A'},      {'size': 'B'} ]
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_cars>   <td>Tesla </td><td>Lumeneo </td><td>Venturi </td> </t_cars><t_wheels> <td>A </td><td>B </td> </t_wheels></xml>');
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


