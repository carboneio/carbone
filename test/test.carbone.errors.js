const carbone = require('../lib/index');
const helper  = require('../lib/helper');

describe('Carbone error management', function () {
  after(function (done) {
    carbone.reset();
    done();
  });
  it('should return an error if there is a missing i for i+1', function (done) {
    const _data = [ { brand : 'Lumeneo' }, { brand : 'Toyota' } ];
    carbone.renderXML('<xml> <t_row> </t_row><t_row> {d[i+1].brand} </t_row></xml>', _data, function (err, result) {
      helper.assert(err+'', 'Error: The marker {d[i+1].brand} has no corresponding "[i]" marker before. Please add markers to describe the i-th section of the repetition.');
      helper.assert(result, null);
      done();
    });
  });
  it('should return an error if Carbone cannot find the repeated section', function (done) {
    const _data = [ { brand : 'Lumeneo' }, { brand : 'Toyota' } ];
    carbone.renderXML('<xml> <t_row> {d[i].brand} </t_row> {d[i+1].brand} <t_row> </t_row></xml>', _data, function (err, result) {
      helper.assert(err+'', 'Error: Unable to find what to repeat between marker {d[i].brand} and {d[i+1].brand}. Is the i-th [+1] section a repetition of the i-th section?');
      helper.assert(result, null);
      done();
    });
  });
  it('should return an error when an attribute is used like an object and an array in the same time', function (done) {
    const _xml    = '<xml> {d.myArray.id} <b/> {d.myArray[i].id} <b/> {d.myArray[i+1].id} </xml>';
    const _data = { myArray : [] };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'Error: The attribute "myArray" in {d.myArray[i].id} cannot be used as an array "[]" and an object "." in the same time. Example: {d.myArray.id}');
      helper.assert(_xmlBuilt, null);
      done();
    });
  });
  // TODO test with bindColor which adds [i] in repeated section i+1
  it.skip('should return an error when an attribute is used like an object and an array in the same time. But the object is used after the array', function (done) {
    const _xml    = '<xml> <p> {d.myArray[i].id} <b/> {d.myArray[i+1].id} </p> </xml> <p> {d.myArray.o} </p> ';
    const _data = { myArray : [{id : 1, o : 'a'}, {id : 2, o : 'b'}] };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'Error: The attribute "myArray" in {d.myArray[i].id} cannot be used as an array "[]" and an object "." in the same time. Example: {d.myArray.id}');
      helper.assert(_xmlBuilt, null);
      done();
    });
  });
  it('should return an error when there is a syntax error (dot before []) ', function (done) {
    const _xml  = '<xml> {d.myArray.[i].id} <b/> {d.myArray.[i+1].id} </xml>';
    const _data = { myArray : [] };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'Error: The attribute "myArray" in {d.myArray.[i].id} cannot be used as an array "[]" and an object "." in the same time. Example: {}');
      helper.assert(_xmlBuilt, null);
      done();
    });
  });
  it('should NOT return an error when an object is used with both method (direct access and attributes loop)', function (done) {
    // WARNING: {d.myArray.id} returns always nothing in that case
    const _xml  = '<xml>  <b/> {d.myArray[i].att} {d.myArray[i].val} <b/> {d.myArray[i+1].att} {d.myArray.id} </xml>';
    const _data = {
      myArray : {
        id  : 2,
        val : 'st'
      },
    };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(err+'', 'null');
      helper.assert(_xmlBuilt, '<xml>  <b/> id 2  <b/> val st <b/>  </xml>');
      done();
    });
  });
});
