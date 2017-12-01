var helper = require('./helper');
var tool = require('./tool');

var parser = {

  /**
   * Find all markers in the xml.
   * All markers are declared with braces like this: {d.title}.
   * It returns an object which contains two things:
   * - a cleaned xml string where the markers are removed
   * - an array of markers with their position in the cleaned xml
   *
   * @param {string} xml : xml string
   * @param {Function} callback(err, cleanedXml, markers) where "markers" is an array like this [{pos:5, name:'title'}]
   */
  findMarkers : function (xml, callback) {
    var that = this;
    var _allMarkers = [];
    var _previousMarkerLength = 0;
    var _insidePreviousMarkerLength = 0;
    var _allMarkersLength = 0;
    var _alreadyFound = {};
    // "?:" avoiding capturing
    var _cleanedXml = xml.replace(/(\r\n|\n|\r)/g,' ').replace(/<[^<>]*\{([\s\S]+?)\}.*?>/g, function (m, text, offset, last) {
      // clean the marker
      var _index = 1;
      if (_alreadyFound[m] !== undefined) {
        _index = _alreadyFound[m] + 1;
        _alreadyFound[m] += 1;
      } else {
        _alreadyFound[m] = 1;
      }
      _insidePreviousMarkerLength = that.countCharNotInXml(xml, 0, that.getPosition(xml, m, _index));
      _insidePreviousMarkerLength += _allMarkersLength;
      offset += m.indexOf('{');
      var _marker = that.extractMarker(text);
      // clean the xml (remove the marker)
      var _xmlOnly = [m.slice(0, m.indexOf('{')), m.slice(m.indexOf('}') + 1)].join('');
      var _cleanedMarker = that.removeWhitespace(that.cleanMarker(_marker));
      if (/^(?:d\.|d\[|c\.|c\[|\$)/.test(_cleanedMarker) === false) {
        return m;
      }
      var _obj = {
        pos  : offset- _insidePreviousMarkerLength,
        name : '_root.'+_cleanedMarker
      };
      _allMarkers.push(_obj);
      _allMarkersLength += (_marker.length + 2);
      return _xmlOnly;
    }).replace(/\{([\s\S]+?)\}/g, function (m, text, offset) {
      // clean the marker
      var _marker = that.extractMarker(text);
      // clean the xml (remove the marker)
      var _xmlOnly = that.cleanXml(text);
      var _cleanedMarker = that.removeWhitespace(that.cleanMarker(_marker));
      if (/^(?:d\.|d\[|c\.|c\[|\$)/.test(_cleanedMarker) === false) {
        return m;
      }
      var _obj = {
        pos  : offset-_previousMarkerLength,
        name : '_root.'+_cleanedMarker
      };
      _allMarkers.push(_obj);
      _previousMarkerLength += (_marker.length + 2);  // 2 equals the number of braces '{' or '}'
      return _xmlOnly;
    }).replace(/'/g, '\\\'');

    _allMarkers = _allMarkers.sort(function (a, b) {
      if (a.pos > b.pos) {
        return 1;
      } else {
        return -1;
      }
    });

    process.nextTick(function () {
      callback(null, _cleanedXml, _allMarkers);
    });
  },

  /**
   * Get the nth position of a substring in a string
   * @param {string} string: initial string
   * @param {string} subString: the string to search
   * @param {integer} index: the index for the substring
   */
  getPosition : function (string, subString, index) {
    return string.split(subString, index).join(subString).length;
  },

  /**
   * Count characters between XML tag between start and stop
   *
   * @param {string} str
   * @param {integer} start
   * @param {integer} stop
   * @return {integer} number of characters
   */
  countCharNotInXml : function (str, start, stop) {
    var _open = false;
    var _count = 0;
    var _openPar = false;
    for (var _i = start ; _i < stop ; _i++) {
      var _char = str[_i];
      if (_char !== undefined) {
        if (_char === '<') {
          _open = true;
        }
        if (_open == false) {
          if (_char === '{') {
            _openPar = true;
          }
          if (_openPar === true) {
            _count++;
          }
          if (_char === '}') {
            _openPar = false;
          }
        }
        if (_char === '>') {
          if (_open === false) {
            _count = 0;
          }
          _open = false;
        }
      }
    }
    return _count;
  },

  /**
   * Extract markers from the xml
   *
   * @param {string} markerStr : xml with marker
   * @return {string} marker without xml
   */
  extractMarker : function (markerStr) {
    // "?:" avoiding capturing. otther method /\s*<([^>]*)>\s*/g
    var _res = markerStr
      .replace(/<(?:[\s\S]+?)>/g, function () {
        return '';
      });
    return _res;
  },

  /**
   * Remove extra whitespaces and remove special characters in the markers
   *
   * @param {string} markerStr : polluted marker string with whitespaces
   * @return {string} cleaned marker string
   */
  cleanMarker : function (markerStr) {
    var _res = markerStr
      // Remove special characters
      .replace(/[\n\t]/g, '')
      // Replace encoded "<" and ">" by non encoded characters
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, '\'');
    return _res;
  },

  /**
   * Replace encoded operator characters by no encoded characters
   * @param  {String} str
   * @return {String} string with decoded characters
   */
  replaceEncodedOperatorCharactersByNoEncodedCharacters : function (str) {
    var _res = str
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, '\'')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&brvbar;/g, '¦');
    return _res;
  },

  /**
   * Replace no encoded operator characters by encoded characters
   * @param  {String} str
   * @return {String} string with encoded characters
   */
  replaceNoEncodedOperatorCharactersByEncodedCharacters : function (str) {
    var _res = str
      .replace(/&/g, '&amp;')
      .replace(/\'/g,'&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/¦/g, '&brvbar;');
    return _res;
  },

  /**
   * Remove markers, get only xml
   *
   * @param {string} xml : xml string with markers.  Ex: menu[<tr>i</xml>]
   * @return {string} only xml without marker.  Ex: <tr></xml>
   */
  cleanXml : function (xml) {
    var _res = '';
    xml.replace(/\s*(<[^>]*>)\s*/g, function (m, text) {
      _res += text;
      return '';
    });
    return _res;
  },

  /**
   * Remove whitespace in a string except between quotes
   * @param  {String} str text to parse
   * @return {String}     text without whitespace
   */
  removeWhitespace : function (str) {
    var _res = '';
    // do we need to manage escaped quotes ? /([^"]+)|("(?:[^"\\]|\\.)+")/
    if (str) {
      _res = str.replace(/([^"^']+)|(["|'](?:[^"'\\]|\\.)+["|'])/g, function (m, strWithoutQuotes, strWithQuotes) {
        if (strWithoutQuotes) {
          return strWithoutQuotes.replace(/\s/g, '');
        }
        else {
          return strWithQuotes; 
        } 
      });
      return _res;
    }
    return str;
  },

  /**
   * Parse the xml, select the {t()} marker and translate them by using the corresponding translation
   * @param  {String}   xml
   * @param  {Object}   options {
   *                              'lang'         : selected lang: 'fr',
   *                              'translations' : all translations: {fr: {}, en: {}, es: {}} 
   *                            }
   * @param  {Function} callback(err, xmlTranslated) : xml with all marker {t()} replaced by the traduction
   */
  translate : function (xml, options, callback) {
    var _translations = options.translations !== undefined ? options.translations[options.lang] : {};
    if (typeof(xml) !== 'string') {
      return callback(null, xml);
    }
    // capture {t  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
    var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*t[\s\S]+?)\}/g, function (m, text) {
      var _xmlOnly = parser.cleanXml(text);
      // capture words inside () in order to translate them with the correct lang.json.
      var _pattern = /\((.*)\)/.exec(text);
      /* If there is an expression inside ()
         _pattern contains [_cleanMarkerStr without 't', words inside (), index, _cleanMarkerStr] */
      if (_pattern instanceof Array && _pattern.length > 1) {
        // If _pattern[1] exist, we translate the expression. Else we write _pattern[1]
        var _strToTranslate = parser.extractMarker(_pattern[1]);
        // decode encoded characters
        _strToTranslate = parser.replaceEncodedOperatorCharactersByNoEncodedCharacters(_strToTranslate);
        var _translatedStr = _strToTranslate;
        // if the translation exists and different of null, translate it. 
        if (_translations !== undefined && _translations[_strToTranslate] !== undefined && _translations[_strToTranslate] !== '') {
          _translatedStr = _translations[_strToTranslate];
        }
        _translatedStr = parser.replaceNoEncodedOperatorCharactersByEncodedCharacters(_translatedStr);
        return _translatedStr + _xmlOnly;
      }
      else {
        return m;
      }
    });    
    callback(null, _cleanedXml);
  },

  /**
   * Find declared variables in xml
   * @param  {String}   xml                xml document
   * @param  {Array}   existingVariables   existing variables
   * @param  {Function} callback(err, cleanedXml, variables)  
   */
  findVariables : function (xml, existingVariables, callback) {
    if (typeof(existingVariables) === 'function') {
      callback = existingVariables;
      existingVariables = [];
    }
    if (existingVariables === undefined) {
      existingVariables = [];
    }
    if (typeof(xml) !== 'string') {
      return callback(null, '', []);
    }
    // capture {#  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
    var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*#[\s\S]+?)\}/g, function (m, text) {
      var _marker = parser.extractMarker(text);
      var _xmlOnly = parser.cleanXml(text);
      var _variableStr = parser.cleanMarker(_marker);
      // find pattern #myVar($a,$b) menu[$a+$b]
      var _pattern = /#\s*([\s\S]+?)\s*(?:\(([\s\S]+?)\))?\s*=\s*([\s\S]+?)$/g.exec(_variableStr);
      if (_pattern instanceof Array) {
        var _variable = parser.removeWhitespace(_pattern[1]);
        var _paramStr = parser.removeWhitespace(_pattern[2]);
        var _code = parser.removeWhitespace(_pattern[3]);
        // if the variable is a function with parameters
        if (_paramStr !== undefined) {
          // separate each parameters
          var _params = _paramStr.split(/ *, */);
          var _sortedParams = [];
          // sort all params, longest params first to avoid a problem when two variable begin with the same word
          for (var i = 0; i < _params.length; i++) {
            _sortedParams.push({index : i, name : _params[i]});
          }
          _sortedParams.sort(function (a,b) {
            return a.name.length < b.name.length;
          });
          // replace all parameters by _$0_, _$1_, _$2_, ..., in the code
          for (var p = 0; p < _sortedParams.length; p++) {
            var _param  = _sortedParams[p];
            _code = _code.replace(new RegExp('\\'+_param.name,'g'), '_$'+_param.index+'_');
          }
        }
        var _regex = new RegExp('\\$'+_variable+'(?:\\(([\\s\\S]+?)\\))?', 'g');
        existingVariables.push({
          name  : _variable,
          code  : _code,
          regex : _regex
        });
        return _xmlOnly;
      }
      else {
        return m;
      }
    });
    process.nextTick(function () {
      callback(null, _cleanedXml, existingVariables);
    });
  },


  /**
   * Detect used variables and update all markers accordingly (replace variables by their values)
   * @param {Array} markers : all markers of the document
   * @param {Array} variables : all declared variables of the document
   */
  preprocessMarkers : function (markers, variables, callback) {
    if (variables instanceof Array && variables.length > 0) {
      // preprocess all markers
      for (var i = 0; i < markers.length; i++) {
        var _marker = markers[i];
        var _markerName = _marker.name;
        // Does the marker contain a variable?
        if (_markerName.indexOf('$') !== -1) {
          // check if it matches with one previously declared variable
          for (var j=0; j < variables.length; j++) {
            var _variable = variables[j];
            var _pattern = _variable.regex.exec(_markerName);
            while (_pattern !== null) {
              var _code =  _variable.code;
              var _varStr = _pattern[0];
              var _paramStr = _pattern[1];
              // if there some parameters?
              if (_paramStr !== undefined) {
                // separate each parameters
                var _params = _paramStr.split(/ *, */);
                // replace all parameters _$0_, _$1_, _$2_, ..., by their real values
                for (var p = 0; p < _params.length; p++) {
                  var _param  = _params[p];
                  _code = _code.replace(new RegExp('_\\$'+p+'_','g'), _param);
                }
              }
              _marker.name =  helper.replaceAll(_marker.name, _varStr, _code);
              _pattern = _variable.regex.exec(_markerName);
            }
          }
        }
      }
    }
    callback(null, markers);
  },

  /**
   * Find position of the opening tag which matches with the last tag of the xml string
   *
   * @param {string} leftSideXml : xml string 
   * @param {integer} indexWhereToStopSearch (optional) : force the algorithm to find the opening tag before this position 
   * @return {integer} index position in the xml string 
   */
  findOpeningTagPosition : function (leftSideXml, indexWhereToStopSearch) {
    indexWhereToStopSearch = indexWhereToStopSearch || leftSideXml.length;
    var _tagCount = 0;
    var _prevTagPosEnd = 0;
    var _openingTagIndex = {};
    var _lastOpeningTagIndexBeforeStop = {};
    var _similarTag =  new RegExp('<(\/)?\\b[^\/|^>]*(\/)?>', 'g');
    var _tag = _similarTag.exec(leftSideXml);
    while (_tag !== null) {
      if (_tag[1]==='/') {
        _tagCount--;
      }
      else {
        if (_prevTagPosEnd<indexWhereToStopSearch) {
          _lastOpeningTagIndexBeforeStop[_tagCount] = (_tag.index >= indexWhereToStopSearch)? indexWhereToStopSearch-1 : _tag.index;
        }
        _openingTagIndex[_tagCount] = _tag.index;
        // eliminate self-closing tag
        if (_tag[2] !== '/') {
          _tagCount++;
        }
      }
      _prevTagPosEnd = _tag.index + _tag[0].length;
      _tag = _similarTag.exec(leftSideXml);
    }
    if (_openingTagIndex[_tagCount] === undefined) {
      return -1;
    }
    else if (_openingTagIndex[_tagCount] < indexWhereToStopSearch) {
      return _openingTagIndex[_tagCount];
    }
    else {
      return (_lastOpeningTagIndexBeforeStop[_tagCount]!==undefined)? _lastOpeningTagIndexBeforeStop[_tagCount] : -1 ;
    }
  },

  /**
   * Find position of the closing tag which matches with the opening tag at the beginning of the xml string
   *
   * @param {string} rightSideXml : xml string
   * @param {integer} indexWhereToStartSearch (optional) : force the algorithm to find the opening tag after this position 
   * @return {integer} index position in the xml string
   */
  findClosingTagPosition : function (rightSideXml, indexWhereToStartSearch) {
    indexWhereToStartSearch = indexWhereToStartSearch || 0;
    var _startTagCount = 0;
    var _endTagCount = 0;
    var _endTagPos = -1;
    var _similarTag =  new RegExp('<(\/)?\\b[^\/|^>]*(\/)?>', 'g'); // reset the regex
    var _tag = _similarTag.exec(rightSideXml);
    while (_tag !== null) {
      if (_tag[1]==='/') {
        _endTagCount++;
      }
      else {
        // eliminate self-closing tag
        if (_tag[2] !== '/') {
          _startTagCount++;
        }
      }
      if (_endTagCount === _startTagCount) {
        _endTagPos = _tag.index + _tag[0].length;
        if (_endTagPos > indexWhereToStartSearch) {
          break;
        }
      }
      _tag = _similarTag.exec(rightSideXml);
    }
    if (_endTagPos > indexWhereToStartSearch) {
      return _endTagPos;
    }
    else {
      return -1;
    }
  },

  /**
   * Find the xml tag which defines the transition between two repeated sections.
   * Example: In HTML, the transition between two rows is "</tr><tr>". The first tag is the closing tag of the previous row, 
   * the second one is the opening tag of the next row. We call it "pivot".
   *
   * @param {string} partialXml : xml string which contains the transition
   * @return {object} an object like this : {
   *                                          'part1End'  :{'tag':'tr', 'pos': 5 },
   *                                          'part2Start':{'tag':'tr', 'pos': 5 }
   *                                        }. 
   */
  findPivot : function (partialXml) {
    var _tagCount = 0;
    var _prevTagCount = 0;
    var _highestTags = [];
    var _highestTagCount = 0;
    // capture all tags
    var _tagRegex = new RegExp('<(\/)?([^\/|^>| ]*)[^\/|^>]*(\/)?>?','g');
    var _tag = _tagRegex.exec(partialXml);
    while (_tag !== null) {
      var _tagType = '';
      if (_tag[1]==='/') {
        _tagCount++;
        _tagType = '>'; // closing
      }
      else {
        _tagCount--;
        _tagType = '<'; // opening
      }
      if (_tag[3]==='/') {
        _tagCount++;
        _tagType = 'x'; // self-closing
      }
      if (_tagCount > _highestTagCount) {
        _highestTagCount = _tagCount;
        _highestTags = [];
      }
      if (_tagCount === _highestTagCount || _prevTagCount === _highestTagCount) {
        var _tagInfo = {
          tag    : _tag[2],
          pos    : _tag.index,
          type   : _tagType,
          posEnd : partialXml.length // by default 
        };
        // the end position of a tag equals the beginning of the next one
        if (_highestTags.length>0) {
          _highestTags[_highestTags.length-1].posEnd = _tagInfo.pos;
        }
        _highestTags.push(_tagInfo);
      }
      _prevTagCount = _tagCount;
      _tag = _tagRegex.exec(partialXml);
    }
    if (_highestTags.length===0 || (_highestTags.length===1 && _highestTags[0].type!=='x') || _highestTags[0].type==='<') {
      return null;
    }
    var _firstTag = _highestTags[0];
    var _lastTag = _highestTags[_highestTags.length-1];
    var _pivot = {
      part1End   : {tag : _firstTag.tag, pos : _firstTag.posEnd},
      part2Start : {tag : _lastTag.tag, pos : _lastTag.pos }
    };
    if (_firstTag.type==='x') {
      _pivot.part1End.selfClosing = true;
    }
    if (_lastTag.type==='x') {
      _pivot.part2Start.selfClosing = true;
    }
    // exceptional case where there is only one self-closing tag which separate the two parts.
    if (_highestTags.length===1) {
      _pivot.part2Start.pos = _pivot.part1End.pos;
    }
    return _pivot;
  },

  /**
   * Find exact position in the XML of the repeated area (first, and second part)
   *
   * @param {string} xml : xml string of the repeated area
   * @param {object} pivot : object returned by findPivot.
   * @param {integer} roughStartIndex (optional) : forces the algorithm to find the beginning of the repetition before it
   * @return {object} object which specify the start position and the end position of a repeated area.
   */
  findRepetitionPosition : function (xml, pivot, roughStartIndex) {
    var _that = this;
    if (!pivot) {
      return null;
    }
    // First part 
    var _leftSideXml = xml.slice(0, pivot.part1End.pos);
    var _startTagPos = _that.findOpeningTagPosition(_leftSideXml, roughStartIndex+1);

    // Second part
    var _rightSideXml = xml.slice(pivot.part2Start.pos);
    var _endTagPos = _that.findClosingTagPosition(_rightSideXml);
    // if the closing tag is not found and this is a flat structure
    if (_endTagPos === -1 && pivot.part2Start.selfClosing === true) {
      _endTagPos = 0; // TODO should be the rough end of the array
    }
    return {startEven : _startTagPos, endEven : pivot.part2Start.pos, startOdd : pivot.part2Start.pos, endOdd : pivot.part2Start.pos + _endTagPos};
  }
  
};

module.exports = parser;