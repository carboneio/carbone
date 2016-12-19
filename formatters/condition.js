
/**
 * Test if data is empty (null, undefined, [], {}, ...)
 * @param  {Mixed} d                   data
 * @param  {String} message            message to print if true
 * @param  {Boolean} continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                     `message` if condition is true, `d` otherwise
 */
function ifEmpty(d, message, continueOnSuccess){
  if(  d === null
    || typeof(d) === 'undefined'
    || d === ''
    || d instanceof Array && d.length === 0
    || d.constructor === Object && Object.keys(d).length === 0
    || Number.isNaN(d) === true){
    if(continueOnSuccess !== 'true'){
      this.stopPropagation = true;
    }
    return message;
  }
  return d;
}

/**
 * Test if a value equals a variable
 * @param  {String|Integer|Boolean}   d                 data
 * @param  {String|Integer|Boolean}   value             value to test
 * @param  {String}                   messageIfTrue     message to print if true
 * @param  {Boolean}                  continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                    `message` if condition is true, `d` otherwise
 */
function ifEqual(d, value, messageIfTrue, continueOnSuccess){
  //Convert everything in string (not strict Equal)
  if(d == value){
    if(continueOnSuccess !== 'true'){
      this.stopPropagation = true;
    }
    return messageIfTrue;
  }
  return d;
}

/**
 * Test if a string or an array contain a value
 * @param  {String|Array}             d                 data
 * @param  {String|Integer|Boolean}   value             data to search
 * @param  {String}                   messageIfTrue     message to print if true
 * @param  {Boolean}                  continueOnSuccess [optional], if true, next formatter will be called even if the condition is true
 * @return {Mixed}                    `message` if condition is true, `d` otherwise
 */
function ifContain(d, value, messageIfTrue, continueOnSuccess) {
  if((typeof(d) === 'string' || d instanceof Array) && d.indexOf(value) !== -1){
    if(continueOnSuccess !== 'true'){
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
