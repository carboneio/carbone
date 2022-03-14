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
      helper.assert(err+'', 'Error: The marker {d[i+1].brand} has no corresponding {d[i]...} marker before or is not placed correctly. Please add markers to describe the i-th section of the repetition.');
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
  it('should not crash if a repetition is done in the "i+1 section" of a parent repetition. It should ignore this error because it is allowed to repeat every part in i+1 section', function (done) {
    const _xml = '<xml>'
               + '<t_row> <td> {d.cars[i].id} </td> <td> {d.cars[i].brand} </td> <td> {d.cars[i].nb} </td> </t_row>'
               + '<t_row> <td> {d.cars[i+1].id} </td> <td> {d.cars[i].brand} </td> <td> {d.cars[i+1].nb} </td> </t_row>'
               + '</xml>';
    const _data = {
      cars : [
        {id : 1, nb : 10, brand : 'Lumeneo'     },
        {id : 2, nb : 20, brand : 'Tesla motors'},
        {id : 3, nb : 30, brand : 'Toyota'      }
      ]
    };
    carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml><t_row> <td> 1 </td> <td> Lumeneo </td> <td> 10 </td> </t_row><t_row> <td> 2 </td> <td> Tesla motors </td> <td> 20 </td> </t_row><t_row> <td> 3 </td> <td> Toyota </td> <td> 30 </td> </t_row></xml>');
      done();
    });
  });
  it('should return an error when repetition are not correct', function (done) {
    const _xml = '<xml>'
              +'<t_row> <td> {d.cars[i].id}     </td> <td> {d.cars[i].wheel[i].id}   </td>  </t_row>'
              +'<t_row> <td> {d.cars[i+1].id}   </td> <td> {d.cars[i].wheel[i+1].id} </td>  </t_row>'
              +'</xml>';
    carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
      helper.assert(err+'', 'Error: The marker {d.cars[i].wheel[i+1].id} has no corresponding {d.cars[i].wheel[i]...} marker before or is not placed correctly. Please add markers to describe the i-th section of the repetition.');
      helper.assert(_xmlBuilt, null);
      done();
    });
  });
  it('should return an error when repetition are not correct with custom iterator', function (done) {
    const _xml = '<xml>'
              +'<t_row> <td> {d.cars[i].id}     </td> <td> {d.cars[i].wheel[sort, meal.id].id}   </td>  </t_row>'
              +'<t_row> <td> {d.cars[i+1].id}   </td> <td> {d.cars[i].wheel[sort+1, meal.id+1].id} </td>  </t_row>'
              +'</xml>';
    carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
      helper.assert(err+'', 'Error: The marker {d.cars[i].wheel[sort+1,meal.id+1].id} has no corresponding {d.cars[i].wheel[sort,meal.id]...} marker before or is not placed correctly. Please add markers to describe the i-th section of the repetition.');
      helper.assert(_xmlBuilt, null);
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
