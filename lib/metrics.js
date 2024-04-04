

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
  preT       : 0,
  planT      : 0,
  feedT      : 0,
  concatT    : 0,
  imgFetchT  : 0,
  imgFetchS  : 0,
  fileFetchT : 0,
  fileFetchS : 0,
  postT      : 0,
  convertT   : 0,
  renderT    : 0 }) {
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

/*
{
  dataB,
  complementB,
  templateB,
  templateIsVolatile,
  imageB,
  imageUS,
  imageCt,
  fileB,
  fileUS,
  fileCt,
  template  : [10, 10, 10]
  data      : [10, 10, 10]
  images    : [10, 10, 10]
  files     : [10, 10, 10]
  execution : [10, 10, 10, 10, 10]
  preProcessUS,
  postProcessUS,
  planningUS,
  injectionUS,
  assemblyUS,
  executionUS,
  convertUS

  timeUS : {

  }
  dataS
  tmplS
  imgS
  imgT
  imgC
  fileS
  fileC
  fileT
  preT
  planT
  feedT
  buildT
  postT
  convT
  execT
}
        assert.notStrictEqual(stat.templateSizetemplateSize, undefined);
        assert.notStrictEqual(stat.preProcessingTime, undefined);
        assert.notStrictEqual(stat.planningTime, undefined);
        assert.notStrictEqual(stat.injectionTime, undefined);
        assert.notStrictEqual(stat.assemblyTime, undefined);
        assert.notStrictEqual(stat.renderSizeBeforeConversion, undefined);
        assert.notStrictEqual(stat.convertTime, undefined);
        assert.notStrictEqual(stat.executionTime, undefined);
*/