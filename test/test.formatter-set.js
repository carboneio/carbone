const carbone = require('../lib/index');
const helper = require('../lib/helper');

describe('Formatter :set', function () {

  it('should save the result in data, and it can be used later', function (done) {
    var _xml = '<xml>{d.title:substr(0, 4):set(d.other)} {d.other} </xml>';
    var _data = {title : 'boo1234'};
    var _complement = {date : 'today'};
    carbone.renderXML(_xml, _data, {complement : _complement}, function (err, _xmlBuilt) {
      helper.assert(err+'', 'null');
      helper.assert(_xmlBuilt, '<xml> boo1 </xml>');
      done();
    });
  });
  it('should save the result in complement, and it can be used later', function (done) {
    var _xml = '<xml>{d.title:substr(0, 4):set(c.other)} {c.other} </xml>';
    var _data = {title : 'boo1234'};
    var _complement = {date : 'today'};
    carbone.renderXML(_xml, _data, {complement : _complement}, function (err, _xmlBuilt) {
      helper.assert(err+'', 'null');
      helper.assert(_xmlBuilt, '<xml> boo1 </xml>');
      done();
    });
  });
  it('should execute variables in the order of declaration', function (done) {
    const _xml = '<xml>{d.sub.title:append(b):set(d.var1)}{d.var1:append(c):set(d.var2)}{d.var2:append(d):set(d.var3)}{d.var3}</xml>';
    const _data = {
      sub : {
        title : 'A'
      }
    };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'null');
      helper.assert(_xmlBuilt, '<xml>Abcd</xml>');
      done();
    });
  });

  it('should do two aggregations without issues', function (done) {
    const _xml = '<xml>{d.arr[].id:aggSum:set(d.var1)} {d.arr[].id:aggSum:set(d.var2)} {d.var1} {d.var2}</xml>';
    const _data = { arr : [{id : 1}, {id : 1}, {id : 1}] };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'null');
      helper.assert(_xmlBuilt, '<xml>  3 3</xml>');
      done();
    });
  });

});
