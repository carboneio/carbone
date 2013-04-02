var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Kendoc', function(){

  describe('buildXML', function(){
    it('should return the xml if no data is passed', function(){
      var _xml = '<xml> </xml>';
      var _xmlBuilt = kendoc.buildXML(_xml);
      helper.assert(_xmlBuilt, '<xml> </xml>');
    });

    it('should the simple tag with the data', function(){
      var _xml = '<xml> {{d.title}} </xml>';
      var _data = {'title' : 'boo'};
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo </xml>');
    });

    it('should works with two nested objects', function(){
      var _xml = '<xml> {{d.title}} <br> {{d.city.id}} </xml>';
      var _data = {
        'title' : 'boo', 
        'city' :{
          'id' : 5
        }
      };
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo <br> 5 </xml>');
    });

    it('1. should remove the tags of the data is not what you expect', function(){
      var _xml = '<xml> {{d.title}} <br> {{d.city.id}} </xml>';
      var _data = {
        'bullshit' : 'boo'
      };
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml>  <br>  </xml>');
    });

    it('2. should remove the tags part of the data is not provided', function(){
      var _xml = '<xml> {{d.title}} <br> {{d.city.id}} </xml>';
      var _data = {
        'title' : 'boo'
      };
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> boo <br>  </xml>');
    });

    it.skip('1. should automatically repeat the xml (even with strange tags) if there is a simple array', function(){
      var _xml = '<xml> <t_row> {{d[i].brand}} </t_row><t_row> {{d[i+1].brand}} </t_row></xml>';
      var _data = [
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ];
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });

    it('2. should handle array in an object', function(){
      var _xml = '<xml><t_row> {{d.cars[i].brand}} </t_row><t_row> {{d.cars[i+1].brand}} </t_row></xml>';
      var _data = {
        'cars':[
          {'brand' : 'Lumeneo'},
          {'brand' : 'Tesla motors'},
          {'brand' : 'Toyota'}
        ]
      };
      var _xmlBuilt = kendoc.buildXML(_xml, _data);
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
    });
  });
  
});


