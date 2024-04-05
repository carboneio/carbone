

function Time (name, store) {
  this.name = name;
  this.store = store;
  this.start = process.hrtime();
}

Time.prototype.timeEnd = function () {
  const _diff    = process.hrtime(this.start);
  const _elapsed = parseInt(((_diff[0] * 1e9 + _diff[1]) / 1e3), 10);
  this.store[this.name] += _elapsed;
};


function Metrics (initialStore = {
  preProcessTime  : 0,
  planTime        : 0,
  mergeTime       : 0,
  concatTime      : 0,
  fetchImageTime  : 0,
  fetchImageBytes : 0,
  fetchFileTime   : 0,
  fetchFileBytes  : 0,
  postProcessTime : 0,
  convertTime     : 0,
  renderTime      : 0,
  batchSize       : 0 }) {
  this.store = initialStore;
}

Metrics.prototype.time = function (name) {
  return new Time(name, this.store);
};

Metrics.prototype.set = function (name, val) {
  this.store[name] = val;
};

Metrics.prototype.add = function (name, val) {
  this.store[name] += val;
};

Metrics.prototype.get = function (name) {
  return this.store[name] ?? this.store;
};


module.exports = Metrics;
