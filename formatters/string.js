
const LINEBREAK = {
  odt  : '<text:line-break/>',
  docx : '</w:t><w:br/><w:t>'
};

/**
 * Lower case all letters
 *
 * @version 0.12.5
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
 * @version 0.12.5
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
 * @version 0.12.5
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
 * @version 0.12.5
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
 * @version 0.13.0
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
 * @version 0.13.0
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


/**
 * Removes accents from text
 *
 * @version 1.1.0
 *
 * @example [ "crème brulée" ]
 * @example [ "CRÈME BRULÉE" ]
 * @example [ "être"         ]
 * @example [ "éùïêèà"       ]
 *
 * @param  {String} d string to parse
 * @return {String}   string without accent
 */
function unaccent (d) {
  if (typeof d === 'string') {
    return d.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return d;
}


/**
 * Convert carriage return `\\r\\n` and line feed `\\n` to XML-specific code in rendered document
 *
 * Compatible with odt, and docx (beta)
 *
 * @version 1.1.0
 *
 * @exampleContext { "extension" : "odt" }
 * @example [ "my blue \\n car"   ]
 * @example [ "my blue \\r\\n car" ]
 *
 * @exampleContext { "extension" : "docx" }
 * @example [ "my blue \\n car"   ]
 * @example [ "my blue \\r\\n car" ]
 *
 * @param  {Integer|String} d
 * @return {String}         return "XML carriage return" for odt and docx
 */
function convCRLF (d) {
  if (typeof d === 'string') {
    var _lineBreak = LINEBREAK[this.extension];
    if (_lineBreak) {
      return d.replace(/\r?\n/g, _lineBreak);
    }
  }
  return d;
}
// this formatter is separately to inject code
convCRLF.canInjectXML = true;

/**
 * Slice a string with a begin and an end
 *
 * @version 1.2.0
 *
 * @example ["foobar" , 0  , 3 ]
 * @example ["foobar" , 1      ]
 * @example ["foobar" , -2     ]
 * @example ["foobar" , 2  , -1]
 *
 * @param {String} d
 * @param {Integer} begin Zero-based index at which to begin extraction.
 * @param {Integer} end Zero-based index before which to end extraction
 * @return {String} return the formatted string
 */
function substr (d, begin, end) {
  if (typeof d === 'string') {
    return d.slice(begin, end);
  }
  return d;
}

/**
 * Pad the string from the start with another string
 *
 * @version 3.0.0 new
 *
 * @example ["abc", 10         ]
 * @example ["abc", 10, "foo"  ]
 * @example ["abc", 6, "123465"]
 * @example ["abc", 8, "0"     ]
 * @example ["abc", 1          ]
 *
 * @param {String} d
 * @param {number} targetLength  The length of the resulting string once the string has been padded.
 *                               If the value is less than string length, then string is returned as-is.
 * @param {String} padString     The string to pad the current str with. If padString is too long to stay
 *                               within the targetLength, it will be truncated from the end. The default value is " "
 * @return {String} return the padded left string
 */
function padl (d, targetLength, padString) {
  var _padString = ' ';
  if (padString !== undefined) {
    _padString = padString;
  }
  if (typeof d === 'string') {
    return d.padStart(targetLength, _padString);
  }
  if (typeof d === 'number') {
    return d.toString().padStart(targetLength, _padString);
  }
  return d;
}

/**
 * Pad the string from the end with another string
 *
 * @version 3.0.0 new
 *
 * @example ["abc", 10         ]
 * @example ["abc", 10, "foo"  ]
 * @example ["abc", 6, "123465"]
 * @example ["abc", 8, "0"     ]
 * @example ["abc", 1          ]
 *
 * @param {String} d
 * @param {number} targetLength  The length of the resulting string once the string has been padded.
 *                               If the value is less than string length, then string is returned as-is.
 * @param {String} padString     The string to pad the current str with. If padString is too long to stay
 *                               within the targetLength, it will be truncated from the end. The default value is " "
 * @return {String} return the padded right string
 */
function padr (d, targetLength, padString) {
  var _padString = ' ';
  if (padString !== undefined) {
    _padString = padString;
  }
  if (typeof d === 'string') {
    return d.padEnd(targetLength, _padString);
  }
  if (typeof d === 'number') {
    return d.toString().padEnd(targetLength, _padString);
  }
  return d;
}

module.exports = {
  lowerCase : lowerCase,
  upperCase : upperCase,
  ucFirst   : ucFirst,
  ucWords   : ucWords,
  convEnum  : convEnum,
  convCRLF  : convCRLF,
  unaccent  : unaccent,
  print     : print,
  substr    : substr,
  slice     : substr,
  padl      : padl,
  padr      : padr
};
