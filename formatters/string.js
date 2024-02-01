var toMd5 = require('./md5');


const LINEBREAK = {
  odt  : '<text:line-break/>',
  ods  : '</text:p><text:p>',
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
 * It renders carriage return `\\r\\n` and line feed `\\n` into documents instead of printing them as a string.
 * Importante notes:
 * - Feature supported for DOCX, PDF, ODT, and ODS files.
 * - ODS supports is experimental for now, contact the support if you find issues.
 * - Since `v3.5.3`, using the `:convCRLF` formatter before `:html` converts `\\n` to `<br>` tags. Usage example: `{d.content:convCRLF:html}`

 *
 * @version 4.1.0
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
convCRLF.isExecutionNotConditionnalyExecuted;

/**
 * Specific formatter used to replace, when convCRLF is used before :html formatter
 *
 * @private
 *
 * @param   {String} d
 * @return  {string} replaced "\r\n" by html tag "<br>"
 */
function convCRLFH (d) {
  if (typeof d === 'string') {
    return d.replace(/\r?\n/g, '<br>');
  }
  return d;
}

/**
 * Slice a string with a begin and an end.
 *
 * @version 4.17.0 new
 *
 * @example ["foobar" , 0  , 3 ]
 * @example ["foobar" , 1      ]
 * @example ["foobar" , -2     ]
 * @example ["foobar" , 2  , -1]
 * @example ["abcd efg hijklm" , 0 , 11, true]
 * @example ["abcd efg hijklm" , 1 , 11, true]
 *
 * @param {String}  d
 * @param {Integer} begin      Zero-based Index at which to begin extraction.
 * @param {Integer} end        [optional] Zero-based index before which to end extraction
 * @param {Mixed}   wordMode   [optional] If `true`, it never cuts words. In such a case:
 *                                          - `end` must be greater than `begin` and negative values cannot be used.
 *                                            `end - begin` = maximum number of characters per line of text
 *                                          - A word can only be truncated only if it does not fit in the line.
 *                                            In this case, the word always starts at the beginning of a new line, just like in Word or LibreOffice
 *                                          - The same line width (end - begin) must be used between successive calls of `substr` to print all the words of the text (no gaps). Ex:
 *                                              `{d.text(0  , 50 , true)}` -> line 1 of 50 characters
 *                                              `{d.text(50 , 100, true)}` -> line 2 of 50 characters
 *                                              `{d.text(100, 150, true)}` -> line 3 of 50 characters
 *                                              `{d.text(150, 200, last)}` -> line 4 of infinite characters
 *                                          - `last` can be used instead of `true` to print the rest of the text, even if it is longer than the defined line width
 * @return {String} return the formatted string
 */
function substr (d, begin, end, wordMode = false) {
  if (typeof d !== 'string') {
    return d;
  }
  if (wordMode === true || wordMode === 'true' || wordMode === 'last') {
    end   = parseInt(end, 10);
    begin = parseInt(begin, 10);
    if (end < 0) {
      end = 0;
    }
    if (begin < 0) {
      begin = 0;
    }
    const _lineWidth      = end - begin;
    const _regex          = /^\s$/;
    let _wantedLine       = Math.floor(begin / _lineWidth);
    let _currentLine      = 0;
    let _currentLineStart = 0;
    if (begin % _lineWidth > 0) {
      // if begin is lower than line width. Add virtually N whitespace at the begining of the string
      _currentLineStart = -(_lineWidth - (begin % _lineWidth));
      _wantedLine++;
    }
    let _nbCharInCurrentLine  = 0;
    let _currentLineEnd       = 0;
    let _isNextWhitespaceChar = false;
    let _isWhitespaceChar     = _regex.test(d[0]);
    let _pos                  = 0;
    // avoid any string allocation in the loop for performance reason.
    for (_pos = 0; _pos < d.length; _pos++) {
      const _nextChar = d[_pos+1] ?? ' ';
      _isNextWhitespaceChar = _regex.test(_nextChar);
      if (_isNextWhitespaceChar === true || _isWhitespaceChar === true) {
        _currentLineEnd = _pos+1;
      }
      _nbCharInCurrentLine = (_pos - _currentLineStart + 1);
      if (_nbCharInCurrentLine >= _lineWidth) {
        _currentLine++;  // new line of text
        if (_currentLineStart === _currentLineEnd) {
          _currentLineEnd = _pos+1; // word bigger than line width, cut the word
        }
        if (_currentLine > _wantedLine) {
          break; // searched line reached, leave
        }
        _currentLineStart = _currentLineEnd;
      }
      _isWhitespaceChar = _isNextWhitespaceChar;
    }
    // end of text reached but searched line not reached
    if (_pos === d.length && _currentLine < _wantedLine) {
      return '';
    }
    if (wordMode === 'last') {
      _currentLineEnd = d.length;
    }
    return d.slice(_currentLineStart, _currentLineEnd);
  }

  return d.slice(begin, end);
}

/**
 * Split a string using a delimiter
 *
 * It can be used with `arrayJoin('', 1, 2)` to select one specific item of the generated array
 *
 * @version 4.12.0 new
 *
 * @example ["abcdefc12", "c" ]
 * @example [1222.100   , "." ]
 * @example ["ab/cd/ef" , "/" ]
 *
 * @param  {String}  d
 * @param  {String}  delimiter  The delimiter
 * @return {Array}              return an array, which can be filtered and join with arrayJoin
 */
function split (d, delimiter) {
  if (d === null || d === undefined) {
    return d;
  }
  if (delimiter instanceof RegExp) {
    delimiter = null;
  }
  return (d+'').split(delimiter);
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

/**
 * Add "..." if the text is too long
 *
 * @version 4.12.0 new
 *
 * @example ["abcdef" , 3 ]
 * @example ["abcdef" , 6 ]
 * @example ["abcdef" , 10]
 *
 * @param {String} d
 * @param {Integer} maximum number of characters to print.
 * @return {String} return the formatted string
 */
function ellipsis (d, maxLength) {
  if (typeof d !== 'string') {
    return d;
  }
  return d.length <= maxLength ? d : d.slice(0, maxLength) + '...';
}

function md5 (d) {
  return toMd5(d);
}

/**
 * add a prefix to a text
 *
 * @version 4.12.0 new
 *
 * @example ["abcdef", "123" ]
 *
 * @param   {string}  d
 * @param   {string}  textToPrepend  text to prepend
 * @return  {string}  return textToPrepend + d
 */
function prepend (d, textToPrepend) {
  return (textToPrepend ?? '') + '' + (d ?? '');
}

/**
 * Add a suffix to a text
 *
 * @version 4.12.0 new
 *
 * @example ["abcdef", "123" ]
 *
 * @param   {string}  d
 * @param   {string}  textToAppend  text to append
 * @return  {string}  return d + textToAppend
 */
function append (d, textToAppend = '') {
  return (d ?? '') + '' + (textToAppend ?? '');
}

/**
 * Replace a text based on a pattern
 *
 * All matches of the pattern (first argument: `oldText`) is replaced by the replacement string (second argument: `newText`).
 * The pattern can only be a string.
 *
 * @version 4.12.0 new
 *
 * @example [ "abcdef abcde", "cd", "OK" ]
 * @example [ "abcdef abcde", "cd"       ]
 * @example [ "abcdef abcde", "cd", null ]
 * @example [ "abcdef abcde", "cd", 1000 ]
 *
 * @param   {string}  d
 * @param   {string}  oldText  old text to replace
 * @param   {string}  newText  new text
 * @return  {string}  return text with replaced text
 */
function replace (d, oldText, newText = '') {
  if (oldText instanceof RegExp) {
    return d;
  }
  return ((d ?? '') + '').replaceAll(oldText, newText ?? '');
}

/**
 * Neutral for array filters
 *
 * This formatter can be used to "ignore" Carbone tags if an array filter is used.
 * For example:
 *   XML: {d[i, id>0].id} {c.now:neutralForArrayFilter:somethingElse} {d[i, id>0].name}
 *
 * Array filters works only if all Carbone tags are filtered. But `{c.now}` has no filter, so it will print all
 * rows of the d[] array because there is at least one Carbone tag without a filter.
 * With :neutralForArrayFilter formatter, we can tell to Carbone: "filter array rows regardless the presence of this Carbone tag"
 *
 * @private
 */
function neutralForArrayFilter (d) {
  return d;
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
  padr      : padr,
  len       : len,
  md5       : md5,
  prepend   : prepend,
  append    : append,
  ellipsis  : ellipsis,
  replace   : replace,
  split     : split,
  neutralForArrayFilter : neutralForArrayFilter,
  // private
  convCRLFH : convCRLFH
};
