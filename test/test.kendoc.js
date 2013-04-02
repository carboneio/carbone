var assert = require('assert');
var kendoc = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('Kendoc', function(){

  describe.skip('compileXmlNew', function(){
    it('should return nothing if the descriptor is empty', function(){
      var _desc = {};
      var _data = {
        'firstname':'Thomas',
        'lastname':'A. Anderson',
        'surname': 'Neo'
      };
      var _fn = kendoc.getXMLBuilderFunction(_desc);
      helper.assert(_fn(_data), '');
    });
  });
  
});


