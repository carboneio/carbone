var helper = require('./helper');
var tool = require('./tool');

var parser = {

  /**
   * Find all dynamic pictures in the xml.
   * Each image is wrapped in <draw:frame> tag, the caption too.
   * Dynamic picture schema example :
   * DrawFrame
   *    DrawFrame
   *      DrawImage
   *    / DrawFrame
   *    TextMarker
   * / DrawFrame
   * If we can match these tokens, we got a dynamic picture to handle,
   * A new marker is created (the caption marker is removed) with the 'pic' type.
   * This marker will add an inline <draw:image> tag with correct link instead of the link only.
   *
   * @param {String} xml : xml string
   * @param {Array} markers : Array of found markers
   * @param {Function} callback(err, xml, markers) where markers are the new markers (with pictures markers)
   */
  findPictures : function (xml, markers, callback) {
    var that = this;
    var _markers = markers;
    var _pictures = [];
    var _picturesRegex = /<draw:image.*?\/>/g;
    var _picRegexResult;
    var _drawframesOpen = [];
    var _drawframesClose = [];
    var _dfOpenRegex = /<draw:frame.*?>/g;
    var _dfCloseRegex = /<\/draw:frame>/g;
    var _dfOpenRegexResult;
    var _dfCloseRegexResult;
    var _builtPicture;

    // These loops will find the xml tags we are interested in

    // First, <draw:image> 
    while (_picRegexResult = _picturesRegex.exec(xml)) {
      _pictures.push({
        pos  : _picRegexResult.index,
        type : 'pic'
      });
    }
    // Then, <drawframe>
    while (_dfOpenRegexResult = _dfOpenRegex.exec(xml)) {
      _drawframesOpen.push({
        pos  : _dfOpenRegexResult.index,
        type : 'dfOpen'
      });
    }
    // And </drawframe>
    while (_dfCloseRegexResult = _dfCloseRegex.exec(xml)) {
      _drawframesClose.push({
        pos  : _dfCloseRegexResult.index,
        type : 'dfClose'
      });
    }
    if (_pictures.length === 0) {
      return callback(null, xml, markers);
    }
    // We merge "old" markers with "new"
    _markers = _markers.concat(_pictures);
    _markers = _markers.concat(_drawframesOpen);
    _markers = _markers.concat(_drawframesClose);
    _markers = tool.sortMarkersByPos(_markers);
    _pictures = [];
    // Now we can detect potential dynamic pictures by analyzing the markers (like a lexer parser)
    this._getPotentialPicturesFromMarkers(_markers, function (potentialPictures) {
      if (potentialPictures.length === 0) {
        return callback(null, xml, markers);
      } else {
        for (var i = 0; i < potentialPictures.length; i++) {
          var _potentialPicture = potentialPictures[i];
          var _picture = { type : 'pic' };

          if (_potentialPicture.length >= 2) {
            for (var j = 0; j < _potentialPicture.length; j++) {
              // We iterate over the potential picture markers to "build" the picture
              if (_potentialPicture[j].type === 'pic') {
                _picture.pos = _potentialPicture[j].pos;
              }
              _picture.name = _potentialPicture[j].name;
              // Needed to remove caption marker
              _picture.namePos = _potentialPicture[j].pos;
            }
          }
          // If the picture is dynamic
          if (_picture.name) {
            // We remove useless fields
            for (var j = 0; j < markers.length; j++) {
              if (markers[j] && markers[j].pos === _picture.namePos) {
                markers[j] = null;
              }
            }
            delete _picture.namePos;
            // Dynamic picture is added to the dynamic pictures array
            _pictures.push(_picture);
          }
          // If the loop is over
          if (i === potentialPictures.length - 1) {
            var finalMarkers = [];

            // We merge given markers in parameters with the 'pic' markers we found
            markers = markers.concat(_pictures);
            // And we rebuild markers array because the "removed" markers (see above) are juste set to null
            for (var j = 0; j < markers.length; j++) {
              // If the marker has not be removed, we push it
              if (markers[j]) {
                finalMarkers.push(markers[j]);
              }
              if (j === markers.length - 1) {
                return that._eraseDynamicPicturesLinks(xml, tool.sortMarkersByPos(finalMarkers), callback);
              }
            }
          }
        }
      }
    });
  },

  /**
   * Erase pictures links and compute the offset of caption markers
   * to put them in href attr
   *
   * @param {String} xml : xml string
   * @param {Array} markers : Markers list
   * @param {Function} callback(err, xml, markers) where markers are the new markers
   */
  _eraseDynamicPicturesLinks : function (xml, markers, callback) {
    var that = this;
    var offsets = [];
    var offset = 0;
    var _newXml;
    var currentMarker;

    // We find every picture (dynamic or not)
    _newXml = xml.replace(/<draw:image.*?xlink:href="(.*?)".*?\/>/g, function (match, p1, pos) {
      // If the found picture is dynamic = a marker with the same pos exists
      if (currentMarker = tool.markerExists(markers, pos)) {
        // Length of `<draw:image xlink:href="`
        currentMarker.pos += 24;
        // Next markers offset will be the link length
        offset -= p1.length;
        // Memorize this offset
        offsets.push({
          pos   : pos + 24,
          value : offset
        });
        // We replace the tag by one with empty href attr
        // TODO : maybe copy each attr instead of creating the same tag every time
        return '<draw:image xlink:href="" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>';
      } else {
        return match;
      }
    });
    process.nextTick(function () {
      // Now we can apply offsets
      that._applyOffsets(_newXml, markers, offsets, callback);
    });
  },

  /**
   * Apply offset previously computed
   *
   * @param {String} xml : xml string
   * @param {Array} markers : Markers list
   * @param {Array} offsets : Offsets list, like this [{ pos : OffsetStarts, value : OffsetValue }]
   * @param {Function} callback(err, xml, markers) where markers are the new markers (shifted)
   */
  _applyOffsets : function (xml, markers, offsets, callback) {
    var currentOffset = { pos : 0, value : 0 };
    var nextOffset = offsets[0];
    var offsetIndex = 0;

    // Iterate over markers
    for (var i = 0; i < markers.length; i++) {
      // If marker pos is after the nextOffset pos, it becomes the currentOffset
      if (nextOffset && markers[i].pos > nextOffset.pos) {
        currentOffset = nextOffset;
        offsetIndex++;
        nextOffset = offsets[offsetIndex];
      }
      // Apply offset
      markers[i].pos += currentOffset.value;
      // If the loop is over
      if (i === markers.length - 1) {
        // We can call the callback
        return callback(null, xml, markers);
      }
    }
  },

  /**
   * Find potential dynamic pictures as markers by analyzing the schema described in FindPictures description. ^ just above ^
   *
   * @param {Array} markers : Array of drawframe, drawimage and caption markers
   * @param {Function} callback(markers) : markers is an array of array of markers, an array of markers is a potential dynamic picture
   */
  _getPotentialPicturesFromMarkers : function (markers, cb) {
    var _pictures = [[]];
    var _indexPictures = 0;
    var _indexMarkers = 0;
    var _dfCount = -1;

    while (_indexMarkers < markers.length) {
      var _marker = markers[_indexMarkers];

      if (_marker.type === 'dfOpen') {
        if (_dfCount <= 0) {
          _dfCount = 1;
        } else {
          _dfCount++;
        }
      } else if (_marker.type === 'dfClose') {
        _dfCount--;
      } else if (_dfCount > 0) {
        // If we have left a DrawFrame block, memorized markers (potential dynamic picture) are pushed
        _pictures[_indexPictures].push(_marker);
      }
      if (_dfCount === 0) {
        _indexPictures++;
        _pictures.push([]);
      }
      _indexMarkers++;
      if (_indexMarkers === markers.length - 1) {
        return cb(_pictures);
      }
    }
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
    // "?:" avoiding capturing 
    var _cleanedXml = xml.replace(/(\r\n|\n|\r)/g,' ').replace(/\{([\s\S]+?)\}/g, function (m, text, offset) {
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

    process.nextTick(function () {
      callback(null, _cleanedXml, _allMarkers);
    });
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
    var _tagRegex = new RegExp('<(\/)?([^\/|^>| ]*)[^\/|^>]*(\/)?>','g');
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