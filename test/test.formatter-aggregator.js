const assert  = require('assert');
const carbone = require('../lib/index');
const helper  = require('../lib/helper');

describe.only('Aggregator', function () {
  describe.skip('countDistinct', function () {
    it('should print a counter', function (done) {
      var _xml = '<xml><t_row> {d.cars[sort,i].brand:countDistinct} {d.cars[sort,i].brand} </t_row><t_row> {d.cars[sort+1,i+1].brand} </t_row></xml>';
      var _data = {
        cars : [
          {brand : 'Lumeneo'      , sort : 1},
          {brand : 'Tesla motors' , sort : 4},
          {brand : 'Venturi'      , sort : 3},
          {brand : 'Tesla motors' , sort : 2},
          {brand : 'Toyota'       , sort : 1}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><t_row> 1 Lumeneo </t_row><t_row> 2 Toyota </t_row><t_row> 3 Tesla motors </t_row><t_row> 4 Venturi </t_row><t_row> 3 Tesla motors </t_row></xml>');
        done();
      });
    });
  });
  describe('sum', function () {
    it.skip('Ashould print a counter', function (done) {
      var _xml = '<xml><t_row> {d.cars[sort=1,i].brand:count()} {d.cars[sort=1,i].brand} </t_row><t_row> {d.cars[sort=1,i+1].brand} </t_row></xml>';
      var _data = {
        cars : [
          {brand : 'Lumeneo'     , sort : 1},
          {brand : 'Tesla motors', sort : 2},
          {brand : 'Toyota'      , sort : 1}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><t_row> 1 Lumeneo </t_row><t_row> 2 Toyota </t_row><t_row> 3 Tesla motors </t_row></xml>');
        done();
      });
    });
    it('should do a sum', function (done) {
      var _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:sum} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Fa' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Lu 21 </tr><tr> To 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr></xml>');
        done();
      });
    });
    it('should do a sum by brand', function (done) {
      var _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:sum(.brand)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Lu' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Lu 5 </tr><tr> To 1 </tr><tr> Fa 2 </tr><tr> Vi 13 </tr><tr> Lu 5 </tr><tr> Vi 13 </tr></xml>');
        done();
      });
    });
    it('should filter and do a sum', function (done) {
      var _xml = '<xml><tr> {d.cars[sort>1,i].brand} {d.cars[sort>1,i].qty:sum} </tr><tr> {d.cars[sort>1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Fa' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Fa 19 </tr><tr> Vi 19 </tr><tr> Fa 19 </tr><tr> Vi 19 </tr></xml>');
        done();
      });
    });
  });
  describe('avg', function () {
    it('should do a avg', function (done) {
      var _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:avg} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Fa' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Lu 3.5 </tr><tr> To 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr></xml>');
        done();
      });
    });
    it('should do a avg by brand', function (done) {
      var _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:avg(.brand)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Lu' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Lu 2.5 </tr><tr> To 1 </tr><tr> Fa 2 </tr><tr> Vi 6.5 </tr><tr> Lu 2.5 </tr><tr> Vi 6.5 </tr></xml>');
        done();
      });
    });
    it('should filter and do a avg', function (done) {
      var _xml = '<xml><tr> {d.cars[sort>1,i].brand} {d.cars[sort>1,i].qty:avg} </tr><tr> {d.cars[sort>1,i+1].brand} </tr></xml>';
      var _data = {
        cars : [
          {brand : 'Lu' , qty : 1  , sort : 1},
          {brand : 'Fa' , qty : 4  , sort : 4},
          {brand : 'Vi' , qty : 3  , sort : 3},
          {brand : 'Fa' , qty : 2  , sort : 2},
          {brand : 'To' , qty : 1  , sort : 1},
          {brand : 'Vi' , qty : 10 , sort : 5}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr></xml>');
        done();
      });
    });
  });
});

