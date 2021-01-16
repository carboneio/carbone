/**
 * Change the default operator between conditional formatters.
 *
 * For example: `{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}`
 * means "if  d.car equals 'delorean' AND d.speed is greater than 80, then it prints 'TravelInTime', otherwise
 * it prints 'StayHere'
 *
 * @version 2.0.0
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
 * Change the default operator between conditional formatters.
 *
 * For example: `{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}`
 * means "if  d.car equals 'delorean' OR d.speed is greater than 80, then it prints 'TravelInTime', otherwise
 * it prints 'StayHere'
 *
 *
 * @version 2.0.0
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
 * Update the condition according to the operator and / or.
 *
 * By default, we consider "or" operator.
 * @private
 *
 * @version 2.0.0
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
 * @version 2.0.0
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
 * Matches not empty values, string, arrays or objects.
 *
 * @version 2.0.0
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
 * Matches all values that are equal to a specified value. It can be combined with other formatters to create conditional content. It returns the initial marker. The state of the condition is not returned.
 *
 * @version 2.0.0
 * @exampleContextFormatter [ 100      , 100     ] true
 * @exampleContextFormatter [ 100      , 101     ] false
 * @exampleContextFormatter [ "homer"  , "homer" ] true
 * @exampleContextFormatter [ "homer"  , "bart"  ] false
 * @exampleContextFormatter [ ""       , ""      ] true
 * @exampleContextFormatter [ null     , 100     ] false
 * @exampleContextFormatter [ null     , null    ] true
 * @exampleContextFormatter [ 0        , 100     ] false
 *
 * @param {String|Integer} d
 * @param {String|Integer} value value to test
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
 * @version 2.0.0
 * @exampleContextFormatter [ 100      , 100     ] false
 * @exampleContextFormatter [ 100      , 101     ] true
 * @exampleContextFormatter [ "homer"  , "homer" ] false
 * @exampleContextFormatter [ "homer"  , "bart"  ] true
 * @exampleContextFormatter [ ""       , ""      ] false
 * @exampleContextFormatter [ null     , 100     ] true
 * @exampleContextFormatter [ null     , null    ] false
 * @exampleContextFormatter [ 0        , 100     ] true
 *
 * @param {String|Integer} d
 * @param {String|Integer} value value to test
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
 * Matches values that are greater than a specified value.
 *
 * @version 2.0.0
 * @exampleContextFormatter [1234, 1] true
 * @exampleContextFormatter ["50", "-29"] true
 * @exampleContextFormatter ["32q", "4q2"] true
 * @exampleContextFormatter ["1234Hello", "1"] true
 * @exampleContextFormatter ["10", "8Hello1234"] true
 * @exampleContextFormatter [-23, 19] false
 * @exampleContextFormatter [1, 768] false
 * @exampleContextFormatter [0, 0] false
 * @exampleContextFormatter [-2891, "33Hello"] false
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

/**
 * Matches values that are greater than or equal to a specified value.
 *
 * @version 2.0.0
 * @exampleContextFormatter [50, -29] true
 * @exampleContextFormatter [1, 1] true
 * @exampleContextFormatter [1290, 768] true
 * @exampleContextFormatter ["1234", "1"] true
 * @exampleContextFormatter [-23, 19] false
 * @exampleContextFormatter [1, 768] false
 * @exampleContextFormatter ["1" , "1234"] false
 *
 * @param {Integer} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
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

/**
 * Matches values that are less than a specified value.
 *
 * @version 2.0.0
 * @exampleContextFormatter [-23, 19] true
 * @exampleContextFormatter [1, 768] true
 * @exampleContextFormatter ["1" , "1234"] true
 * @exampleContextFormatter ["123dsf", "103123"] true
 * @exampleContextFormatter [-1299283, "-2891feihuwf"] true
 * @exampleContextFormatter [50, -29] false
 * @exampleContextFormatter [0, 0] false
 * @exampleContextFormatter [1290, 768] false
 * @exampleContextFormatter ["1234", "1"] false
 *
 * @param {Integer} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
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

/**
 * Matches values that are less than or equal to a specified value.
 *
 * @version 2.0.0
 * @exampleContextFormatter [-23, 19] true
 * @exampleContextFormatter [1, 768] true
 * @exampleContextFormatter [5, 5] true
 * @exampleContextFormatter ["1" , "1234"] true
 * @exampleContextFormatter [1290, 768] false
 * @exampleContextFormatter ["1234", "1"] false
 *
 * @param {Integer} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
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

/**
 * Matches any of the values specified in an array or string, it replaces `ifContain`.
 *
 * @version 2.0.0
 * @exampleContextFormatter ["car is broken", "is"] true
 * @exampleContextFormatter [[1, 2, "toto"], 2] true
 * @exampleContextFormatter ["car is broken", "are"] false
 * @exampleContextFormatter [[1, 2, "toto"], "titi"] false
 *
 * @param {Integer|String|Array} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
function ifIN (d, value) {
  var _result = false;
  if (value && (typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) !== -1) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

/**
 * Matches none of the values specified in an array or string.
 *
 * @version 2.0.0
 * @exampleContextFormatter ["car is broken", "are"] true
 * @exampleContextFormatter [[1, 2, "toto"], "titi"] true
 * @exampleContextFormatter ["car is broken", "is"] false
 * @exampleContextFormatter [[1, 2, "toto"], 2] false
 *
 * @param {Integer|String|Array} d
 * @param {Integer} value value to test
 * @returns It returns the initial value `d`. The state of the condition is not returned.
 */
function ifNIN (d, value) {
  var _result = false;
  if (value && (typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) === -1) {
    _result = true;
  }
  this.isConditionTrue = _updateCondition(this.isAndOperator, this.isConditionTrue, _result);
  return d;
}

/**
 * Print a message if the condition is true. It should be used with other formatters to print conditional content.
 *
 * @version 2.0.0
 * @example ["Carbone.io"]
 *
 * @param {Mixed} d marker
 * @param {*} message message to print
 */
function show (d, message) {
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    return message;
  }
  return d;
}

/**
 * Print a message if the condition is false. It should be used with other formatters to print conditional content.
 *
 * @version 2.0.0
 * @param {Mixed} d marker
 * @param {*} message message to print
 */
function elseShow (d, message) {
  if (this.isConditionTrue === false || this.isConditionTrue === null && !d) {
    this.stopPropagation = true;
    return message;
  }
  return d;
}

/**
 * Show a text block between showBegin and showEnd if the condition is true
 * @version 2.0.0
 * @private
 * @param {*} d
 */
function showBegin (d) {
  this.isHidden = 1;
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    this.isHidden = 0;
  }
  return '';
}

/**
 * show a text block between showBegin and showEnd if the condition is true
 * @version 2.0.0
 * @private
 */
function showEnd () {
  this.isHidden = -1;
  return '';
}

/**
 * hide text block between hideBegin and hideEnd if the condition is true
 * @version 2.0.0
 * @private
 * @param {*} d
 */
function hideBegin (d) {
  this.isHidden = 0;
  if (this.isConditionTrue === true || this.isConditionTrue === null && d) {
    this.stopPropagation = true;
    this.isHidden = 1;
  }
  return '';
}

/**
 * hide text block between hideBegin and hideEnd if the condition is true
 * @version 2.0.0
 * @private
 */
function hideEnd () {
  this.isHidden = -1;
  return '';
}

/**
 * Returns the length of a string or array.
 *
 * @version 2.0.0
 * @example ["Hello World"]
 * @example [""]
 * @example [[1, 2, 3, 4, 5]]
 * @example [[1, "Hello"]]
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

/**
 * Test if data is empty (null, undefined, [], {}, ...). The new formatter `ifEM` should be used instead of this one.
 *
 * @deprecated
 * @version 0.12.5 deprecated
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
 * Test if a value equals a variable. The new formatter `ifEQ` should be used instead of this one.
 *
 * @deprecated
 * @version 0.13.0 deprecated
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
 * Test if a string or an array contains a value. The new formatter `ifIN` should be used instead of this one.
 *
 * @deprecated
 * @version 0.13.0 deprecated
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
 * Detect conditional block begin/end
 *
 * @private
 * @param  {String}   marker
 * @return {Boolean}  true if there is a showEnd/hideEnd formatter
 */
function _isConditionalBlockEndMarker (marker) {
  return /:(?:showEnd|hideEnd)/.test(marker.replace(/\s/g, ''));
}
/**
 * Detect conditional block begin/end
 *
 * @private
 * @param  {String}   marker
 * @return {Boolean}  true if there is a showBegin/hideBegin formatter
 */
function _isConditionalBlockBeginMarker (marker) {
  return /:(?:showBegin|hideBegin)/.test(marker.replace(/\s/g, ''));
}

module.exports = {
  _isConditionalBlockEndMarker,
  _isConditionalBlockBeginMarker,
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
