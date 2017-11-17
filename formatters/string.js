var toMd5 = require('./md5');

/**
 * Lower case all letters
 * 
 * @example [ "My Car" ]
 * @example [ "my car" ]
 * @example [ null ]
 * @example [ 1203 ]
 * 
 * @param  {String} d string to parse
 * @return {String}   lower case on all letters, or `d` is it not a string
 */
function lowerCase (d) {
  if (typeof d === 'string') {
    return d.toLowerCase();
  }
  return d;
}

/**
 * Upper case all letters
 * 
 * @example [ "My Car" ]
 * @example [ "my car" ]
 * @example [ null ]
 * @example [ 1203 ]
 * 
 * @param  {String} d string to parse
 * @return {String}   upper case on all letters, or `d` is it not a string
 */
function upperCase (d) {
  if (typeof d === 'string') {
    return d.toUpperCase();
  }
  return d;
}

/**
 * Upper case first letter
 * 
 * @example [ "My Car" ]
 * @example [ "my car" ]
 * @example [ null ]
 * @example [      ]
 * @example [ 1203 ]
 * 
 * @param  {String} d string to parse
 * @return {String}   upper case on the first letter, or `d` is it not a string
 */
function ucFirst (d) {
  if (typeof d === 'string') {
    return d.charAt(0).toUpperCase() + d.slice(1);
  }
  return d;
}

/**
 * Upper case the first letter of all words
 * 
 * @example [ "my car" ]
 * @example [ "My cAR" ]
 * @example [ null ]
 * @example [      ]
 * @example [ 1203 ]
 * 
 * @param  {String} d string to parse
 * @return {String}   upper case on all words, or `d` is it not a string
 */
function ucWords (d) {
  if (typeof d === 'string') {
    return d.replace(/(?:^|\s)\S/g, function (a) {
      return a.toUpperCase();
    });
  }
  return d;
}

/**
 * Always return the same message if called (sort of "catch all" formatter)
 * 
 * @example [ "My Car", "hello!" ]
 * @example [ "my car", "hello!" ]
 * @example [ null    , "hello!" ]
 * @example [ 1203    , "hello!" ]
 * 
 * @param  {Mixed}   d           data
 * @param  {String}  message     text to print
 * @return {String} `message` is always printed
 */
function print (d, message) {
  return message;
}

/**
 * Convert user-defined enums to human readable values
 *
 * User-defined enums must be passed in `options` of `carbone.render`.
 *
 * @exampleContext { "enum" : { "ORDER_STATUS"  : ["pending", "sent", "delivered"] } }
 * @example [ 0    , "ORDER_STATUS" ]
 * @example [ 1    , "ORDER_STATUS" ]
 * @example [ 5    , "ORDER_STATUS" ]
 * 
 * @exampleContext { "enum" : { "YES_NO"        : {"true" : "Yes", "false" : "No"} } }
 * @example [ false, "YES_NO"       ]
 * @example [ true , "YES_NO"       ]
 * @example [ null , "YES_NO"       ]
 * @example [ 3    , "UNKNOWN_ENUM" ]
 * 
 * @param  {Integer|String} d
 * @param  {String}         type   enum name passed in `options` of `carbone.render(data, options)`
 * @return {String}         return human readable enum or original value if it cannot be converted
 */
function convEnum (d, type) {
  if (this.enum !== undefined) {
    var _type = this.enum[type];
    if (_type !== undefined && _type[d] !== undefined) {
      return _type[d];
    }
  }
  return d;
}

function md5 (d) {
  return toMd5(d);
}

module.exports = {
  lowerCase : lowerCase,
  upperCase : upperCase,
  ucFirst   : ucFirst,
  ucWords   : ucWords,
  convEnum  : convEnum,
  print     : print,
  md5       : md5
};
