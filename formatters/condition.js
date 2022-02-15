
/**
 * Test if data is empty (null, undefined, [], {}, ...)
 *
 * @example [ null     ,  "D'oh!" ]
 * @example [ []       ,  "D'oh!" ]
 * @example [ {}       ,  "D'oh!" ]
 * @example [ ""       ,  "D'oh!" ]
 * @example [ 0        ,  "D'oh!" ]
 * @example [ "homer"  ,  "D'oh!" ]
 * @example [ [23]     ,  "D'oh!" ]
 * @example [ {"id":3} ,  "D'oh!" ]
 *
 * @param  {Mixed} d                   data
 * @param  {String} message            message to print if JSON data is empty
 * @param  {Boolean} continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                     `message` if condition is true, `d` otherwise
 */
function ifEmpty (d, message, continueOnSuccess) {
  if (  d === null
    || typeof(d) === 'undefined'
    || d === ''
    || d instanceof Array && d.length === 0
    || d.constructor === Object && Object.keys(d).length === 0
    || Number.isNaN(d) === true) {
    if (continueOnSuccess !== true && continueOnSuccess !== 'true') {
      this.stopPropagation = true;
    }
    return message;
  }
  return d;
}

/**
 * Test if a value equals a variable
 *
 * @example [ 100      , 100     ,  "bingo" ]
 * @example [ 100      , 101     ,  "bingo" ]
 * @example [ "homer"  , "homer" ,  "bingo" ]
 * @example [ "homer"  , "bart"  ,  "bingo" ]
 * @example [ ""       , ""      ,  "bingo" ]
 * @example [ null     , 100     ,  "bingo" ]
 * @example [ null     , null    ,  "bingo" ]
 * @example [ 0        , 100     ,  "bingo" ]
 *
 * @param  {String|Integer|Boolean}   d                 data
 * @param  {String|Integer|Boolean}   value             value to test
 * @param  {String}                   messageIfTrue     message to print if the value equals JSON data
 * @param  {Boolean}                  continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                    `message` if condition is true, `d` otherwise
 */
function ifEqual (d, value, messageIfTrue, continueOnSuccess) {
  // Convert everything in string (not strict Equal)
  if (d + '' === value + '') {
    if (continueOnSuccess !== true && continueOnSuccess !== 'true') {
      this.stopPropagation = true;
    }
    return messageIfTrue;
  }
  return d;
}

/**
 * Test if a string or an array contains a value
 *
 * @example [ "your beautiful eyes", "beauti",  "bingo" ]
 * @example [ "your beautiful eyes", "leg"   ,  "bingo" ]
 * @example [ "your beautiful eyes", "eyes"  ,  "bingo" ]
 * @example [ ""                   , "eyes"  ,  "bingo" ]
 * @example [ "your beautiful eyes", ""      ,  "bingo" ]
 * @example [ [100, 120, 20]       , 120     ,  "bingo" ]
 * @example [ [100, 120, 20]       , 99      ,  "bingo" ]
 * @example [ ["your", "eyes"]     , "eyes"  ,  "bingo" ]
 * @example [ []                   , "eyes"  ,  "bingo" ]
 *
 * @param  {String|Array}             d                 data
 * @param  {String|Integer|Boolean}   value             value to search
 * @param  {String}                   messageIfTrue     message to print if JSON data contains the value
 * @param  {Boolean}                  continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                    `message` if condition is true, `d` otherwise
 */
function ifContain (d, value, messageIfTrue, continueOnSuccess) {
  if ((typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) !== -1) {
    if (continueOnSuccess !== true && continueOnSuccess !== 'true') {
      this.stopPropagation = true;
    }
    return messageIfTrue;
  }
  return d;
}

/* ***************************************************************************** */
/* CONDITION V2 */
/* ***************************************************************************** */

/**
 * Change default operator between conditional formatters
 *
 * For example: `{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}`
 * means "if  d.car equals 'delorean' AND d.speed is greater than 80, then it prints 'TravelInTime', otherwise
 * it prints 'StayHere'
 *
 * @version 2.0
 * @param  {Mixed} d      data
 * @param  {Mixed} value  [optional] new value to test
 * @return {Mixed}        if `value` is defined, the next formatter "sees" this new value instead of the original value
 */
function and (d, value) {
  this.isAndOperator = true;
  if (arguments.length === 1) {
    return d;
  }
  return value;
}

/**
 * Change default operator between conditional formatters
 *
 * For example: `{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}`
 * means "if  d.car equals 'delorean' OR d.speed is greater than 80, then it prints 'TravelInTime', otherwise
 * it prints 'StayHere'
 *
 *
 * @version 2.0
 * @param  {Mixed} d      data
 * @param  {Mixed} value  [optional] new value to test
 * @return {Mixed}        if `value` is defined, the next formatter "sees" this new value instead of the original value
 */
function or (d, value) {
  this.isAndOperator = false;
  if (arguments.length === 1) {
    return d;
  }
  return value;
}

/**
 * Update condition according to operator and / or
 *
 * By default, we consider "or" operator
 * @private
 *
 * @version 2.0
 * @param  {[type]} operator              [description]
 * @param  {[type]} currentConditionState [description]
 * @param  {[type]} newValue              [description]
 * @return {[type]}                       [description]
 */
function _updateCondition (isAndOperator, currentConditionState, newValue) {
  if (isAndOperator === true) {
    return currentConditionState = currentConditionState && newValue;
  }
  return currentConditionState = currentConditionState || newValue;
}

/**
 * Test if data is empty (null, undefined, [], {}, ...)
 *
 * @version 2.0
 * @example [ null     ]
 * @example [ []       ]
 * @example [ {}       ]
 * @example [ ""       ]
 * @example [ 0        ]
 * @example [ "homer"  ]
 * @example [ [23]     ]
 * @example [ {"id":3} ]
 *
 * @param  {Mixed} d  data
 */
function ifEM (d) {
  var _result = false;
  if (  d === null
    || typeof(d) === 'undefined'
    || d === ''
    || d instanceof Array && d.length === 0
    || d.constructor === Object && Object.keys(d).length === 0
    || Number.isNaN(d) === true) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifNEM (d) {
  var _result = true;
  if (  d === null
    || typeof(d) === 'undefined'
    || d === ''
    || d instanceof Array && d.length === 0
    || d.constructor === Object && Object.keys(d).length === 0
    || Number.isNaN(d) === true) {
    _result = false;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifEQ (d, value) {
  var _result = false;
  // Convert everything in string (not strict Equal)
  if (d + '' === value + '') {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifNE (d, value) {
  var _result = true;
  if (d + '' === value + '') {
    _result = false;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifGT (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);
  // Convert everything in string (not strict Equal)
  if (   Number.isNaN(_d) === false && _d                    > _value
      || d instanceof Array         && d.length              > _value
      || typeof d === 'string'      && d.length              > _value
      || d.constructor === Object   && Object.keys(d).length > _value ) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifGTE (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);
  // Convert everything in string (not strict Equal)
  if (   Number.isNaN(_d) === false && _d                    >= _value
      || d instanceof Array         && d.length              >= _value
      || typeof d === 'string'      && d.length              >= _value
      || d.constructor === Object   && Object.keys(d).length >= _value ) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifLT (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);
  // Convert everything in string (not strict Equal)
  if (   Number.isNaN(_d) === false && _d                    < _value
      || d instanceof Array         && d.length              < _value
      || typeof d === 'string'      && d.length              < _value
      || d.constructor === Object   && Object.keys(d).length < _value ) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifLTE (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);
  // Convert everything in string (not strict Equal)
  if (   Number.isNaN(_d) === false && _d                    <= _value
      || d instanceof Array         && d.length              <= _value
      || typeof d === 'string'      && d.length              <= _value
      || d.constructor === Object   && Object.keys(d).length <= _value ) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifIN (d, value) {
  var _result = false;
  if ((typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) !== -1) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifNIN (d, value) {
  var _result = false;
  if ((typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) === -1) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function show (d, message) {
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    return message;
  }
  return d;
}

function elseShow (d, message) {
  if (this.isConditionTrue === false || this.isConditionTrue === null && !d) {
    this.stopPropagation = true;
    return message;
  }
  return d;
}

function showBegin (d) {
  this.isHidden = 1;
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    this.isHidden = 0;
  }
  return '';
}

function showEnd () {
  this.isHidden = -1;
  return '';
}

function hideBegin (d) {
  this.isHidden = 0;
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    this.isHidden = 1;
  }
  return '';
}

function hideEnd () {
  this.isHidden = -1;
  return '';
}

module.exports = {
  ifContain,
  ifEmpty,
  ifEqual,
  ifEM,
  ifNEM,
  ifEQ,
  ifNE,
  ifGT,
  ifGTE,
  ifLT,
  ifLTE,
  ifIN,
  ifNIN,
  hideBegin,
  hideEnd,
  showBegin,
  showEnd,
  show,
  elseShow,
  and,
  or
};
