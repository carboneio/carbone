
/**
 * Lower case all letters
 * @param  {String} d string to parse
 * @return {String}   lower case on all letters, or `d` is it not a string
 */
function lowerCase(d){
  if(typeof d === 'string'){
    return d.toLowerCase();
  }
  return d;
}

/**
 * Upper case all letters
 * @param  {String} d string to parse
 * @return {String}   upper case on all letters, or `d` is it not a string
 */
function upperCase(d){
  if(typeof d === 'string'){
    return d.toUpperCase();
  }
  return d;
}

/**
 * Upper case first letter
 * @param  {String} d string to parse
 * @return {String}   upper case on the first letter, or `d` is it not a string
 */
function ucFirst(d){
  if(typeof d === 'string'){
    return d.charAt(0).toUpperCase() + d.slice(1);
  }
  return d;
}

/**
 * Upper case all words
 * @param  {String} d string to parse
 * @return {String}   upper case on all words, or `d` is it not a string
 */
function ucWords(d){
  if(typeof d === 'string'){
    return d.replace(/(?:^|\s)\S/g, function(a) {
        return a.toUpperCase();
    });
  }
  return d;
}

/**
 * Always return the same message if called (sort of "catch all" formatter)
 * @param  {Mixed}   d           data
 * @param  {String}  message     message to print
 * @return {String} `message` is always printed
 */
function print(d, message){
  return message;
}

/**
 * Should convert enums to human readable values
 * @param  {Integer|String} d    data
 * @param  {String}         type enum type name 
 * @return {String}         return human readable enum or original value if it cannot be converted
 */
function convEnum(d, type){
  if(this.enum !== undefined){
    var _type = this.enum[type];
    if(_type !== undefined && _type[d] !== undefined){
      return _type[d];
    }
  }
  return d;
}

module.exports = {
  lowerCase : lowerCase,
  upperCase : upperCase,
  ucFirst   : ucFirst,
  ucWords   : ucWords,
  convEnum  : convEnum,
  print     : print
};
