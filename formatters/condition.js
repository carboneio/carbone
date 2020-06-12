
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
 * @param  {Boolean} operator              if true, the operator is AND, otherwhise it is OR
 * @param  {Boolean} currentConditionState the current condition state
 * @param  {Boolean} newValue              the value coming form the previous condition
 * @return {Boolean}                       the condition result
 */
function _updateCondition (isAndOperator, currentConditionState, newValue) {
  if (isAndOperator === true) {
    return currentConditionState = currentConditionState && newValue;
  }
  return currentConditionState = currentConditionState || newValue;
}

/**
 * Matches empty values, string, arrays or objects (null, undefined, [], {}, ...), it replaces `ifEmpty`.
 *
 * @version 2.0
 * @exampleContextFormatter [ null     ] true
 * @exampleContextFormatter [ []       ] true
 * @exampleContextFormatter [ {}       ] true
 * @exampleContextFormatter [ ""       ] true
 * @exampleContextFormatter [ 0        ] false
 * @exampleContextFormatter [ "homer"  ] false
 * @exampleContextFormatter [ [23]     ] false
 * @exampleContextFormatter [ {"id":3} ] false
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

/**
 * Matches not empty values, string, arrays or objects
 *
 * @version 2.0
 * @exampleContextFormatter [ 0        ] true
 * @exampleContextFormatter [ "homer"  ] true
 * @exampleContextFormatter [ [23]     ] true
 * @exampleContextFormatter [ {"id":3} ] true
 * @exampleContextFormatter [ null     ] false
 * @exampleContextFormatter [ []       ] false
 * @exampleContextFormatter [ {}       ] false
 * @exampleContextFormatter [ ""       ] false
 *
 * @param  {Mixed} d  data
 */
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

/**
 * Matches all values that are not equal to a specified value. It can be combined with other formatters to create conditional content. It returns the initial marker. The state of the condition is not returned.
 *
 * @exampleContextFormatter [ 100      , 100     ] false
 * @exampleContextFormatter [ 100      , 101     ] true
 * @exampleContextFormatter [ "homer"  , "homer" ] false
 * @exampleContextFormatter [ "homer"  , "bart"  ] true
 * @exampleContextFormatter [ ""       , ""      ] false
 * @exampleContextFormatter [ null     , 100     ] true
 * @exampleContextFormatter [ null     , null    ] false
 * @exampleContextFormatter [ 0        , 100     ] true
 *
 * @param {String|Array|Integer} d
 * @param {String|Array|Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
function ifEQ (d, value) {
  var _result = false;
  // Convert everything in string (not strict Equal)
  if (d + '' === value + '') {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

/**
 * Matches all values that are not equal to a specified value. It can be combined with other formatters to create conditional content. It returns the initial marker. The state of the condition is not returned.
 *
 * @exampleContextFormatter [ 100      , 100     ] false
 * @exampleContextFormatter [ 100      , 101     ] true
 * @exampleContextFormatter [ "homer"  , "homer" ] false
 * @exampleContextFormatter [ "homer"  , "bart"  ] true
 * @exampleContextFormatter [ ""       , ""      ] false
 * @exampleContextFormatter [ null     , 100     ] true
 * @exampleContextFormatter [ null     , null    ] false
 * @exampleContextFormatter [ 0        , 100     ] true
 *
 * @param {String|Array|Integer} d
 * @param {String|Array|Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
function ifNE (d, value) {
  var _result = true;
  if (d + '' === value + '') {
    _result = false;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

/**
 * Matches values, string.length, array.length or object.length that are greater than a specified value.
 *
 * @exampleContextFormatter [ 3      , 10     ] true
 * @exampleContextFormatter [ 100      , 101     ] true
 * @exampleContextFormatter [ "homer"  , "homer" ] false
 * @exampleContextFormatter [ "homer"  , "bart"  ] true
 * @exampleContextFormatter [ ""       , ""      ] false
 * @exampleContextFormatter [ null     , 100     ] true
 * @exampleContextFormatter [ null     , null    ] false
 * @exampleContextFormatter [ 0        , 100     ] true
 *
 * @param {Integer} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
function ifGT (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);

  if (Number.isNaN(_d) === false && Number.isNaN(_value) === false && _d > _value) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifGTE (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);

  if (Number.isNaN(_d) === false && Number.isNaN(_value) === false && _d >= _value) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifLT (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);

  if (Number.isNaN(_d) === false && Number.isNaN(_value) === false && _d < _value) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifLTE (d, value) {
  var _result = false;
  var _value = parseFloat(value);
  var _d     = parseFloat(d);

  if (Number.isNaN(_d) === false && Number.isNaN(_value) === false && _d <= _value) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifIN (d, value) {
  var _result = false;
  if (value && (typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) !== -1) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

function ifNIN (d, value) {
  var _result = false;
  if (value && (typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) === -1) {
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

/**
 * Returns the length of a string or array.
 *
 * @param {Mixed} d Array or String
 * @returns {Number} Length of the element
 */
function len (d) {
  if (typeof d === 'string' || Array.isArray(d)) {
    return d.length;
  }
  return 0;
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
  or,
  len
};
