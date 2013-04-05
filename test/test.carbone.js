var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Carbone', function(){

  describe('buildXML', function(){
    it('should return the xml if no data is passed', function(){
      var _xml = '<xml> </xml>';
      var _xmlBuilt = carbone.buildXML(_xml);
      helper.assert(_xmlBuilt, '<xml> </xml>');
    });

    it('should the simple tag with the data', function(){
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

    it('1. should remove the tags of the data is not what you expect', function(){
      var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
      var _data = {
        'bullshit' : 'boo'
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml>  <br>  </xml>');
    });

    it('2. should remove the tags part of the data is not provided', function(){
      var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
      var _data = {
        'title' : 'boo'
      };
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo <br>  </xml>');
    });

    it.skip('1. should automatically repeat the xml (even with strange tags) if there is a simple array', function(){
      var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ];
      var _xmlBuilt = carbone.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });

    it('2. should handle array in an object', function(){
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
    it('should render a template (docx), generate to PDF and give output', function(done){
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.renderPDF(_filePath, data, function(result){
        var buf = new Buffer(result);
        assert.equal(buf.slice(0, 4).toString(), '%PDF');
        done();
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


