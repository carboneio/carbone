
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
  if (d + '' === value + '') { // eslint-disable-line
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

module.exports = {
  ifContain : ifContain,
  ifEmpty   : ifEmpty,
  ifEqual   : ifEqual
};
