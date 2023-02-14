var helper = require('./helper');
var condition = require('../formatters/condition');
const MARKER_PRESENCE_CHAR = '\uFFFF';

var parser = {

  /**
   * Determines whether the specified one marker is a carbone marker.
   *
   * @param {String}  oneMarker  One marker
   */
  isCarboneMarker : function (oneMarker) {
    const _isCarboneMarkerRegexp = /^\{?\s*(?:[cdt]\s*[.[:(])|^\{?\s*[#$]|^\{?\s*bindColor/;
    return _isCarboneMarkerRegexp.test(oneMarker);
  },

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
    var _previousMarkerPos = -1;
    var _nbMarkerPresenceChar = 0;
    var _markerPresenceChar = MARKER_PRESENCE_CHAR;
    var _cleanedXml = xml;

    // Capture { } markers again and extract them
    _cleanedXml = _cleanedXml.replace(/\{([^{]+?)\}/g, function (m, marker, offset) {
      if (that.isCarboneMarker(marker) === false) {
        return m;
      }
      var _cleanedMarker = that.removeWhitespace(that.cleanMarker(marker));
      _markerPresenceChar = '';
      if (condition._isConditionalBlockEndMarker(_cleanedMarker) === false && condition._isConditionalBlockBeginMarker(_cleanedMarker) === false) {
        // Replace the marker by a special character for all markers, except begin/end conditional blocks. This character is removed after.
        // This is the simplest method to manage this case "<p>{d.id}{d.id:showBegin}a</p>{d.id:showEnd}" -> "<p>\uFFFFa</p>"
        // It prevents the if-block system deleting the whole paragraph "<p></p>" when there is a marker just after <p>
        ++_nbMarkerPresenceChar;
        _markerPresenceChar = MARKER_PRESENCE_CHAR;
      }
      var _pos = offset - _previousMarkerLength + _nbMarkerPresenceChar;
      if (_pos === Math.trunc(_previousMarkerPos)) {
        // Avoid exactly the same XML position to sort all parts at the end of the process
        // Why adding 1/64? to avoid rounding problems of floats (http://0.30000000000000004.com)
        // It let us the possibility to have 64 markers at the same position. It should be enough for all cases.
        _pos = _previousMarkerPos + 1/64;
      }
      var _obj = {
        pos  : _pos,
        name : '_root.'+_cleanedMarker
      };
      _allMarkers.push(_obj);
      _previousMarkerLength += (marker.length + 2);  // 2 equals the number of braces '{' or '}'
      _previousMarkerPos = _pos;
      return _markerPresenceChar;
    });
    process.nextTick(function () {
      callback(null, _cleanedXml, _allMarkers);
    });
  },
  /**
   * @description Remove XML tags inside markers
   * @param   {String} xml
   * @returns {String} Return a clean XML
   */
  removeXMLInsideMarkers : function (xml) {
    if (!xml || typeof xml !== 'string') {
      return xml;
    }
    var _cleanedXml = xml.replace(/(\r\n|\n|\r)/g,' ');
    // Markers inside xml tag break the system which find markers because we can have nested markers.
    // So we find all xml tags and replace { } which are inside xml by a temporary character
    _cleanedXml = _cleanedXml.replace(/((?:<[^>]+>)+)/g, function (m, xmlTag) {
      // \u0000 and \uFFFF are forbidden character in XML so we should not have any conflict with other characters
      return xmlTag.replace(/\{/g, '\u0000').replace(/\}/g, '\uFFFF');
    });
    // Capture { } markers and remove XML inside markers
    _cleanedXml = _cleanedXml.replace(/(\{[^{]+?\})/g, function (m, markerWithXml) {
      // is this marker contains xml? like this {d. <xml> <tr> menu}  </xml> </tr>
      if (/</.test(markerWithXml) === true) {
        let _markerOnly = parser.extractMarker(markerWithXml);
        let _xmlOnly    = parser.cleanXml(markerWithXml);
        // verify if it is really a Carbone marker, otherwise do nothing
        if (parser.isCarboneMarker(_markerOnly) === false) {
          return m;
        }
        // put the conditional block beginEnd/hideEnd markers at the end of the brace to remove everything in-between
        if (condition._isConditionalBlockEndMarker(_markerOnly) === true) {
          return _xmlOnly + _markerOnly;
        }
        // separate clearly the marker and the xml
        return _markerOnly + _xmlOnly;
      }
      return m;
    });
    // put back markers inside XML
    // eslint-disable-next-line no-control-regex
    _cleanedXml = _cleanedXml.replace(/\u0000/g, '{').replace(/\uFFFF/g, '}');
    return _cleanedXml;
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
      .replace(/'/g,'&apos;')
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
   * @param  {Function} callback Optional callback (err, xmlTranslated) : xml with all marker {t()} replaced by the traduction
   */
  translate : function (xml, options, callback) {
    var _translations = options.translations !== undefined ? options.translations[options.lang] : {};
    if (typeof(xml) !== 'string') {
      return callback ? callback(null, xml) : xml;
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
    return callback ? callback(null, _cleanedXml) : _cleanedXml;
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
            return b.name.length - a.name.length;
          });
          // replace all parameters by _$0_, _$1_, _$2_, ..., in the code
          for (var p = 0; p < _sortedParams.length; p++) {
            var _param  = _sortedParams[p];
            _code = _code.replace(new RegExp('\\'+_param.name,'g'), '_$'+_param.index+'_');
          }
        }
        var _regex = new RegExp('\\$'+_variable+'(?!\\w)(?:\\(([\\s\\S]+?)\\))?', 'g');
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
    parser.assignLoopId(markers);
    callback(null, markers);
  },

  /**
   * Assign loop IDs for count formatter
   *
   * @param   {Array}  markers  Array of markers
   * @return  {Array}           Array of markers with loop ID in count parameters
   */
  assignLoopId : function (markers) {
    var _loopWithRowNumberRegex = /.*?:count(\((.*?)\))?/g;
    var match;

    for (var _key in markers) {
      var _marker = markers[_key];

      // If the marker has a count formatter
      match = _loopWithRowNumberRegex.exec(_marker.name);
      if (match) {
        var _parameters = '()';
        var _before = '(';
        var _after = ', ' + match[2] + ')';
        var _loopId = _key + _marker.pos;

        // If parameters are given, we store it
        if (match[1]) {
          _parameters = match[1];
        }
        // If no parameters are given, _after is set to )
        if (match[2] === undefined || match[2] === '') {
          _after = ')';
        }
        // Now we can concatenate _before, _loopId and _after
        // _after are the given parameters
        _parameters = _parameters.replace(/\(.*?\)/, _before + _loopId + _after);
        // And we can replace _marker.name by the new one
        _marker.name = _marker.name.replace(/count(\(.*?\))?/, 'count' + _parameters);
      }
    }
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
    var _similarTag =  new RegExp('<(/)?[^>]+?(/)?>', 'g');
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
      return 0;
    }
    else if (_openingTagIndex[_tagCount] < indexWhereToStopSearch) {
      return _openingTagIndex[_tagCount];
    }
    else {
      return (_lastOpeningTagIndexBeforeStop[_tagCount]!==undefined)? _lastOpeningTagIndexBeforeStop[_tagCount] : 0 ;
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
    var _similarTag =  new RegExp('<(/)?[^>]+?(/)?>', 'g'); // reset the regex
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
    var _hasAChanceToContainAtLeastOnePivot = false;
    // capture all tags
    var _tagRegex = new RegExp('<(/)?([^>]*)>?','g');
    var _tag = _tagRegex.exec(partialXml);
    if (_tag === null) {
      // when there is no XML, return the end of the string as the pivot
      return {
        part1End   : {tag : '', pos : partialXml.length, selfClosing : true},
        part2Start : {tag : '', pos : partialXml.length, selfClosing : true}
      };
    }
    while (_tag !== null) {
      var _xmlAllAttributes = _tag[2] || '';
      var _tagType = '';
      if (_tag[1]==='/') {
        _tagCount++;
        _tagType = '>'; // closing
      }
      else {
        _tagCount--;
        _tagType = '<'; // opening
      }
      if (_xmlAllAttributes.endsWith('/')) {
        _xmlAllAttributes = _xmlAllAttributes.slice(0, -1);
        _tagCount++;
        _tagType = 'x'; // self-closing
      }
      if (_tagCount > 0) {
        _hasAChanceToContainAtLeastOnePivot = true;
      }
      if (_tagCount > _highestTagCount) {
        _highestTagCount = _tagCount;
        _highestTags = [];
      }
      if (_tagCount === _highestTagCount || _prevTagCount === _highestTagCount) {
        var _spaceIndex   = _xmlAllAttributes.indexOf(' ');
        var _xmlAttribute = _spaceIndex === -1 ? _xmlAllAttributes : _xmlAllAttributes.substr(0, _spaceIndex);
        var _tagInfo = {
          tag    : _xmlAttribute,
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
    if ( _tagCount !== 0 && (_highestTags.length===0 || (_highestTags.length===1 && _highestTags[0].type!=='x') || _highestTags[0].type==='<')) {
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
    // TODO, this code could be simplified and generalized when there is no XML
    // if it contains a flat XML structure, considers it is a selfClosing tag
    if ( _tagCount === 0 && _hasAChanceToContainAtLeastOnePivot === false) {
      _pivot = {
        part1End   : {tag : _lastTag.tag, pos : _lastTag.posEnd, selfClosing : true},
        part2Start : {tag : _lastTag.tag, pos : _lastTag.posEnd, selfClosing : true}
      };
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
  },

  /**
   * Transform XML in a flat array of objects
   *
   * @param  {String} xml
   * @return {Array}
   */
  flattenXML : function (xml) {
    var _array = [];
    if (typeof (xml) !== 'string') {
      return [];
    }
    var _xmlTagRegExp = /<([^>]+)>/g;
    var _tag = _xmlTagRegExp.exec(xml);
    var _depth = 0;
    var _prevLastIndex = 0;
    var _openingTagPos = [];
    if (_tag === null) {
      _array.push({
        id        : 0,
        index     : 0,
        lastIndex : xml.length,
        depth     : 0
      });
    }
    while (_tag !== null) {
      if ( _prevLastIndex < _tag.index) {
        // non XML part
        _array.push({
          id        : _array.length,
          index     : _prevLastIndex,
          lastIndex : _tag.index,
          depth     : _depth
        });
      }
      var _xmlTag = {
        id        : _array.length,
        index     : _tag.index,
        lastIndex : _xmlTagRegExp.lastIndex,
        depth     : _depth
      };
      // closing tag
      if (_tag[1].startsWith('/') === true) {
        _xmlTag.depth = _depth--;
        var _correspondingOpenPos = _openingTagPos.pop();
        if (_correspondingOpenPos === undefined) {
          throw new Error('XML not valid');
        }
        _correspondingOpenPos.match = _xmlTag.id;
        _xmlTag.match = _correspondingOpenPos.id;
      }
      // is not a self-closing tag, so it is an opening tag
      else if (_tag[1].endsWith('/') === false) {
        _xmlTag.depth = _depth++;
        _xmlTag.match = -1; // temp
        _openingTagPos.push(_xmlTag);
      }
      _array.push(_xmlTag);
      _prevLastIndex = _xmlTagRegExp.lastIndex;
      _tag = _xmlTagRegExp.exec(xml);
    }
    return _array;
  },

  /**
   * Detect and move the if-block beginning and ending if possible
   *
   * For example "<p>{d.id:showBegin}blabla</p>{d.id:showEnd}" becomes "{d.id:showBegin}<p>blabla</p>{d.id:showEnd}"
   * It pushes/pulls the begin/end beyond the limit in order to include surrounded XML tags
   *
   * @param  {Array}   xmlTree              List of all XML tag, returned by parser.flattenXML
   * @param  {Integer} beginFlattenXMLIndex where is the beginTextIndex in the xmlTree
   * @param  {Integer} beginTextIndex       char position of if-block's beginning
   * @param  {Integer} endTextIndex         char position of if-block's ending
   * @return {Object}                       new begin/end position for if-block
   */
  moveConditionalBlockBeginEnd : function (xmlTree, beginFlattenXMLIndex, beginTextIndex, endTextIndex) {
    const _dummyObject     = {};  // constant, empty object to avoid instanciation in the loop below
    var _newBeginTreeIndex = beginFlattenXMLIndex;
    var _newBeginTextIndex = beginTextIndex;
    var _newEndTextIndex   = endTextIndex;

    for (var i = beginFlattenXMLIndex; i < xmlTree.length; i++) {
      var _tag = xmlTree[i];
      var _matchingTag = _tag.match > -1 ? xmlTree[_tag.match] : _dummyObject;
      // if this XML part is included in the if-block, and if it is an opening tag
      if (_matchingTag.lastIndex < endTextIndex && _tag.id < _matchingTag.id) {
        // jump directly to the end of this currently visited XML (optimization)
        i = _matchingTag.id;
      }
      // if we find a corresponding opening tag next to the first tag of the if-block
      // move the if-block's beginning earlier
      if (_matchingTag.lastIndex === _newBeginTextIndex) {
        _newBeginTextIndex = _matchingTag.index;
        _newBeginTreeIndex = _matchingTag.id;
      }
      // if we find a corresponding ending tag next to the last tag of the if-block
      // move the if-block's ending further
      if (_tag.index >= endTextIndex && _matchingTag.index < _tag.index && _matchingTag.index >= beginTextIndex ) {
        _newEndTextIndex = _tag.lastIndex;
      }
      if (_tag.lastIndex > _newEndTextIndex || (_matchingTag.lastIndex < _newBeginTextIndex  && _tag.index > _newEndTextIndex)) {
        break;
      }
    }
    if (_newBeginTreeIndex !== beginFlattenXMLIndex) {
      _newBeginTextIndex = xmlTree[_newBeginTreeIndex].index;
    }
    return [_newBeginTreeIndex, _newBeginTextIndex, _newEndTextIndex];
  },

  /**
   * Find safe position of the conditional block in XML
   *
   * Safe means "does not break XML if the XML block between beginning and end is removed"
   *
   * @param  {String}  xmlFlattened     flattened XML returned by flattenXML
   * @param  {Integer} startSearchIndex beginning index of the conditional block
   * @param  {Integer} endSearchIndex   ending index of the conditional block
   * @return {Array}                    [newBegining, newEnding]
   */
  findSafeConditionalBlockPosition : function (xmlFlattened, beginTextIndex, endTextIndex) {
    beginTextIndex = Math.trunc(beginTextIndex);
    endTextIndex   = Math.trunc(endTextIndex);
    var _validCandidates = [];
    var _newCandidate    = null;
    var _lastCandidate   = [];
    const _dummyObject   = {};  // constant, empty object to avoid instanciation in the loop below

    // TODO: we can improve performance of we store beginFlattenXMLIndex for each XML part
    // We could avoid this loop for each call of findSafeConditionalBlockPosition
    var _beginFlattenXMLIndex = 0;
    while (_beginFlattenXMLIndex < xmlFlattened.length) {
      if (xmlFlattened[_beginFlattenXMLIndex].lastIndex > beginTextIndex) {
        break;
      }
      _beginFlattenXMLIndex++;
    }

    // find better begin/end conditional blocks
    var _newBeginEndValues = parser.moveConditionalBlockBeginEnd(xmlFlattened, _beginFlattenXMLIndex, beginTextIndex, endTextIndex);
    _beginFlattenXMLIndex  = _newBeginEndValues[0];
    beginTextIndex         = Math.trunc(_newBeginEndValues[1]);
    endTextIndex           = Math.trunc(_newBeginEndValues[2]);

    var _tag = xmlFlattened[_beginFlattenXMLIndex] || {};
    while (_beginFlattenXMLIndex < xmlFlattened.length) {
      if (_tag.index >= endTextIndex) {
        break;
      }
      var _matchingTag = _tag.match > -1 ? xmlFlattened[_tag.match] : _dummyObject;

      _beginFlattenXMLIndex++;
      // if this XML part is included in the if-block, and if it is an opening tag
      if (_matchingTag.lastIndex <= endTextIndex && _tag.id < _matchingTag.id) {
        _newCandidate = [_tag.index, _matchingTag.lastIndex];
        // jump directly to the next valid XML part
        _beginFlattenXMLIndex = _matchingTag.id + 1;
      }
      // no XML
      else if (_tag.match === undefined) {
        _newCandidate = [_tag.index, _tag.lastIndex];
      }

      if (_newCandidate !== null) {
        // merge adjacent valid XML part
        if (_newCandidate[0] === _lastCandidate[1]) {
          _lastCandidate[1] = _newCandidate[1];
        }
        else if (_newCandidate[1] === _lastCandidate[0]) {
          _lastCandidate[0] = _newCandidate[0];
        }
        else {
          // or add new part
          _validCandidates.push(_newCandidate);
          _lastCandidate = _newCandidate;
        }
        _newCandidate = null;
      }
      _tag = xmlFlattened[_beginFlattenXMLIndex];
    }
    // edge case: when there is no XML tags, return directly
    if (xmlFlattened.length === 0) {
      return [[beginTextIndex, endTextIndex]];
    }
    if (_validCandidates.length === 0) {
      return [[endTextIndex, endTextIndex]];
    }
    // never go beyond limits
    if (_lastCandidate[1] > endTextIndex) {
      _lastCandidate[1] = endTextIndex;
    }
    if (_validCandidates[0][0] < beginTextIndex) {
      _validCandidates[0][0] = beginTextIndex;
    }
    return _validCandidates;
  },


  /**
   * Simple mathematical expression parser without parenthesis
   *
   * @param   {String}    mathExpr                 The mathematics expression coming from a formatter calc, add, mul, div, sub
   * @param   {Function}  safeVariableInjectionFn  The safe variable injection function
   * @return  {String}    code to inject in builder
   */
  parseMathematicalExpression : function (mathExpr, safeVariableInjectionFn) {
    if (typeof mathExpr !== 'string' || mathExpr.trim() === '') {
      return '';
    }
    let _currMathExprIndex = mathExpr.length - 1;
    let _injectedCode = '';
    let _prevVariable = '';
    let _prevOperator = '';
    const _variables = mathExpr.split(/[*+/\-]/);
    for(let i = _variables.length - 1; i > -1; i--) {
      const _variable = _variables[i];
      _currMathExprIndex -= (_variable.length + 1); // add operator length, which is always "1"
      const _operator = mathExpr[_currMathExprIndex + 1] ?? '';
      const _trimVariable = _variable.trim();
      if (_trimVariable.length === 0 && _prevOperator !== '-') {
        throw Error ('Bad Mathematical Expression in "'+mathExpr+'"');
      }
      // accept variable with dashes for example
      if (/^[0-9\.]/.test(_trimVariable) === false) {
        _prevVariable = _operator + _trimVariable + _prevVariable;
        continue;
      }
      const _fullVariable = _trimVariable + _prevVariable;
      const _safeVarCode = safeVariableInjectionFn(_fullVariable);
      _prevVariable = '';
      _injectedCode = _operator + 'parseFloat(' + _safeVarCode + ')' + _injectedCode;
      _prevOperator = _operator;
    }
    return _injectedCode;
  }

};

module.exports = parser;
