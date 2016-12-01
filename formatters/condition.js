
/**
 * Test if data is empty (null, undefined, [], {}, ...)
 * @param  {Mixed} d                   data
 * @param  {String} message            message to print of true
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
    this.stopPropagation = (continueOnSuccess !== 'true') ? true : false;
    return message;
  }
  this.stopPropagation = false;
  return d;
}

//function ifEqual(d, value, messageIfTrue, continueOnSuccess){
//  if(d == value){
//    return messageIfTrue;
//  }
//  return d;
//}

module.exports = {
  ifEmpty : ifEmpty
  //ifEqual : ifEqual
};
