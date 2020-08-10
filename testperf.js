const findMarkerRelativePath = function (from, to) {
  let _finalMaker = '';
  let _isDiff  = false;

  for (let i = 0, j = from.length; i <= j; i++) {
    if (from[i] !== to[i]) {
      _isDiff = true;
    }
    if (from[i] === '.' && _isDiff === true) {
      _finalMaker += '.';
    }
  }
  _isDiff = false;
  let _actualWord = '';
  for (let i = 0, j = to.length; i <= j; i++) {
    let _c = to[i];
    if (_c !== from[i]) {
      _isDiff = true;
    }
    if (_c === '.' || i === to.length) {
      if (_isDiff === true) {
        _finalMaker += '.' + _actualWord;
      }
      _actualWord = '';
    }
    else {
      _actualWord += _c;
    }
  }
  return _finalMaker;
};

const findMarkerRelativePath2 = function (from, to) {
  let _finalMaker = '';
  if (!from || !to) {
    debug('Error findMarkerRelativePath: from or to is undefined.');
    return _finalMaker;
  }
  let _splitFrom = from.split('.');
  let _splitTo =  to.split('.');
  let _diff = false;

  for (let i = 0, j = _splitFrom.length; i < j; i++) {
    if (_splitFrom[i] !== _splitTo[i] || _diff === true) {
      if (_diff === true) { // used to pass the first element
        _finalMaker += '.';
      }
      _diff = true;
    }
  }
  _diff = false;
  for (let i = 0, j = _splitTo.length; i < j; i++) {
    if (_splitTo[i] !== _splitFrom[i] || _diff === true) {
      _finalMaker += '.' + _splitTo[i];
      _diff = true;
    }
  }
  return _finalMaker;
};

var _start = process.hrtime();
findMarkerRelativePath('d.list[i].color', 'd.list[i].color2');
var _diff = process.hrtime(_start);
var _elapsed1 = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
console.log('A1: ' + _elapsed1 + ' ms ');

_start = process.hrtime();
findMarkerRelativePath('d.list[i].color', 'd.list[i].color2');
_diff = process.hrtime(_start);
_elapsed1 = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
console.log('A1: ' + _elapsed1 + ' ms ');

var _start2 = process.hrtime();
findMarkerRelativePath2('d.list[i].color', 'd.list[i].color2');
var _diff2 = process.hrtime(_start2);
var _elapsed2 = ((_diff2[0] * 1e9 + _diff2[1]) / 1e6);
console.log('A2: ' + _elapsed2 + ' ms \n');

_start = process.hrtime();
findMarkerRelativePath('d.list[i].color.red', 'd.list2[i].color2.red.blue');
_diff = process.hrtime(_start);
_elapsed1 = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
console.log('B1: ' + _elapsed1 + ' ms ');

_start2 = process.hrtime();
findMarkerRelativePath2('d.list[i].color.red', 'd.list2[i].color2.red.blue');
_diff2 = process.hrtime(_start2);
_elapsed2 = ((_diff2[0] * 1e9 + _diff2[1]) / 1e6);
console.log('B2: ' + _elapsed2 + ' ms \n');