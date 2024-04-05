const Metrics = require('../lib/metrics');
const helper = require('../lib/helper');

describe('metrics', function () {

  it('should create a new statistics instance and returns its content', function () {
    const _metrics = new Metrics({
      keyA : 0,
      keyB : 5
    });
    helper.assert(_metrics.get()      , { keyA : 0, keyB : 5 });
    helper.assert(_metrics.get('keyA'), 0);
    helper.assert(_metrics.get('keyB'), 5);
  });

  it('should count the time', function (done) {
    const _metrics = new Metrics({
      keyA : 0,
      keyB : 0
    });
    const _keyA = _metrics.time('keyA');
    setTimeout(() => {
      _keyA.timeEnd();
      helper.assert(_metrics.get('keyA') > 90*1000, true);
      helper.assert(_metrics.get('keyA') < 120*1000, true);
      done();
    }, 100);
  });

  it('should count the total time of multiple callback', function (done) {
    const _metrics = new Metrics({
      10 : 0,
      20 : 0,
      30 : 0
    });
    let _count = 7;
    function asyncFn (key, cb) {
      const _key = _metrics.time(key);
      setTimeout (() => {
        _key.timeEnd();
        cb();
      }, key + 5);
    }
    function detectEnd () {
      _count--;
      if (_count === 0) {
        helper.assert(_metrics.get(10) > 43*1000 && _metrics.get(10) < 55*1000, true); // 45
        helper.assert(_metrics.get(20) > 73*1000 && _metrics.get(20) < 85*1000, true); // 75
        helper.assert(_metrics.get(30) > 33*1000 && _metrics.get(30) < 45*1000, true); // 35
        done();
      }
    }
    asyncFn(10, detectEnd); // 15
    asyncFn(30, detectEnd); // 35
    asyncFn(20, detectEnd); // 25
    asyncFn(20, detectEnd); // 25
    asyncFn(20, detectEnd); // 25
    asyncFn(10, detectEnd); // 15
    asyncFn(10, detectEnd); // 15
  });

  it('should set the value of a key', function () {
    const _metrics = new Metrics({
      keyA : 5,
      keyB : 0
    });
    _metrics.set('keyA', 1000);
    helper.assert(_metrics.get('keyA'), 1000);
    helper.assert(_metrics.get('keyB'), 0);
  });

  it('should add value', function () {
    const _metrics = new Metrics({
      keyA : 6,
      keyB : 0
    });
    _metrics.add('keyA', 100);
    _metrics.add('keyA', 1);
    helper.assert(_metrics.get('keyA'), 107);
  });

});
