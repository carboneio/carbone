
function countPostProcessing (d, id) {
  let _val = this.aggDatabase.get(id) + 1;
  this.aggDatabase.set(id, _val);
  return _val;
}

function countDistinct (d, start) {
  if (this.aggDatabase.has(this.id) === false) {
    this.aggDatabase.set(this.id, start || 0);
  }
  return {
    fn   : countPostProcessing,
    args : [d, this.id]
  };
}


function sumPostProcessing (d, id) {
  let _val = this.aggDatabase.get(id);
  return _val;
}


function sum (d, by) {
  let _id  = this.id + '_' + by;
  let _val = this.aggDatabase.get(this.id + '_' + by);
  if (_val === undefined) {
    _val = 0;
  }
  _val += d;
  this.aggDatabase.set(_id, _val);
  return {
    fn   : sumPostProcessing,
    args : [d, _id]
  };
}

function avgPostProcessing (d, id) {
  let _val = this.aggDatabase.get(id);
  return _val.sum / _val.nb;
}


function avg (d, by) {
  let _id  = this.id + '_' + by;
  let _val = this.aggDatabase.get(_id);
  if (_val === undefined) {
    _val = {sum : 0, nb : 0};
  }
  _val.nb++;
  _val.sum += d;
  this.aggDatabase.set(_id, _val);
  return {
    fn   : avgPostProcessing,
    args : [d, _id]
  };
}

module.exports = {
  countDistinct : countDistinct,
  sum,
  avg
};
