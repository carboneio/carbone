var helper = require('./helper');
var params = require('./params');

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
  findMarkers : function(xml, callback){
    var that = this;
    var _allMarkers = [];
    var _previousMarkerLength = 0;
    //"?:" avoiding capturing 
    var _cleanedXml = xml.replace(/(\r\n|\n|\r)/g,' ').replace(/\{([\s\S]+?)\}/g, function(m, text, offset) {
      //clean the marker
      var _marker = that.extractMarker(text);
      //clean the xml (remove the marker)
      var _xmlOnly = that.cleanXml(text);
      var _obj = {
        'pos' : offset-_previousMarkerLength,
        'name' : '_root.'+that.removeWhitespace(that.cleanMarker(_marker))
      };
      _allMarkers.push(_obj);
      _previousMarkerLength += (_marker.length + 2);  //2 equals the number of braces '{' or '}'
      return _xmlOnly;
    }).replace(/'/g, '\\\'');

    process.nextTick(function(){
      callback(null, _cleanedXml, _allMarkers);
    });
  },

  /**
   * Extract markers from the xml
   *
   * @param {string} markerStr : xml with marker
   * @return {string} marker without xml
   */
  extractMarker : function(markerStr){
    //"?:" avoiding capturing. otther method /\s*<([^>]*)>\s*/g
    var _res = markerStr
      .replace(/<(?:[\s\S]+?)>/g, function(m, markerStr) {
        return '';
      })
    return _res;
  },

  /**
   * Remove extra whitespaces and remove special characters in the markers
   *
   * @param {string} markerStr : polluted marker string with whitespaces
   * @return {string} cleaned marker string
   */
  cleanMarker : function(markerStr){
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
   * @param  {[type]} str
   * @return {[type]}
   */
  replaceEncodedOperatorCharactersByNoEncodedCharacters : function(str){
    var _res = str
      .replace(/&gteq;/g, '>=')
      .replace(/&lteq;/g, '<=')
      .replace(/&brvbar;/g, '¦')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
      
    return _res;
  },

  /**
   * Replace encoded special characters by no encoded characters
   * @param  {[type]} str
   * @return {[type]}
   */
  replaceEncodedSpecialCharactersByNoEncodedCharacters : function(str){
    var _res = str
      // Remove special characters
      .replace(/[\n\t]/g, '')

      .replace(/&euro;/g, '€')
      .replace(/&pound;/g, '£')
      .replace(/&yen;/g, '¥')
      .replace(/&cent;/g, '¢')

      .replace(/&oelig;/g, 'oe')
      .replace(/&Yuml;/g, 'Y')
      .replace(/&nbsp;/g, ' ')
      .replace(/&iexcl;/g, '¡')
      .replace(/&curren;/g, '¤')
      .replace(/&sect;/g, '§')
      .replace(/&uml;/g, '¨')
      .replace(/&copy;/g, '©')
      .replace(/&ordf;/g, 'ª')
      .replace(/&laquo;/g, '«')
      .replace(/&not;/g, '¬')
      .replace(/&reg;/g, '®')
      .replace(/&masr;/g, '¯')
      .replace(/&deg;/g, '°')
      .replace(/&plusmn;/g, '±')
      .replace(/&sup2;/g, '²')
      .replace(/&sup3;/g, '³')
      .replace(/&acute;/g, '\'')
      .replace(/&micro;/g, 'µ')
      .replace(/&para;/g, '¶')
      .replace(/&middot;/g, '·')
      .replace(/&cedil;/g,'¸')
      .replace(/&sup1;/g, '¹')
      .replace(/&ordm;/g, 'º')
      .replace(/&raquo;/g, '»')
      .replace(/&frac14;/g, '¼')
      .replace(/&frac12;/g, '½')
      .replace(/&frac34;/g, '¾')
      .replace(/&iquest;/g, '¿')
      .replace(/&Agrave;/g, 'À')
      .replace(/&Acute;/g, 'Á')
      .replace(/&Acirc;/g, 'Â')
      .replace(/&Atilde;/g, 'Ã')
      .replace(/&Auml;/g, 'Ä')
      .replace(/&Aring;/g, 'Å')
      .replace(/&Aelig;/g, 'Æ')
      .replace(/&Ccedil;/g, 'Ç')
      .replace(/&Egrave;/g, 'È')
      .replace(/&Eacute;/g, 'É')
      .replace(/&Ecirc;/g, 'Ê')
      .replace(/&Euml;/g, 'Ë')
      .replace(/&Igrave;/g, 'Ì')
      .replace(/&Iacute;/g, 'Í')
      .replace(/&Icirc;/g, 'Î')
      .replace(/&Iuml;/g, 'Ï')
      .replace(/&eth;/g, 'Ð')
      .replace(/&Ntilde;/g, 'Ñ')
      .replace(/&Ograve;/g, 'Ò')
      .replace(/&Oacute;/g, 'Ó')
      .replace(/&Ocirc;/g, 'Ô')
      .replace(/&Otilde;/g, 'Õ')
      .replace(/&Ouml;/g, 'Ö')
      .replace(/&times;/g, '×')
      .replace(/&Oslash;/g, 'Ø')
      .replace(/&Ugrave;/g, 'Ù')
      .replace(/&Uacute;/g, 'Ú')
      .replace(/&Ucirc;/g, 'Û')
      .replace(/&Uuml;/g, 'Ü')
      .replace(/&Yacute;/g, 'Ý')
      .replace(/&thorn;/g, 'Þ')
      .replace(/&szlig;/g, 'ß')
      .replace(/&agrave;/g, 'à')
      .replace(/&aacute;/g, 'á')
      .replace(/&acirc;/g, 'â')
      .replace(/&atilde;/g, 'ã')
      .replace(/&auml;/g, 'ä')
      .replace(/&aring;/g, 'å')
      .replace(/&aelig;/g, 'æ')
      .replace(/&ccedil;/g, 'ç')
      .replace(/&egrave;/g, 'è')
      .replace(/&eacute;/g, 'é')
      .replace(/&ecirc;/g, 'ê')
      .replace(/&euml;/g, 'ë')
      .replace(/&igrave;/g, 'ì')
      .replace(/&iacute;/g, 'í')
      .replace(/&icirc;/g, 'î')
      .replace(/&iuml;/g, 'ï')
      .replace(/&oeth;/g, 'ð')
      .replace(/&ntilde;/g, 'ñ')
      .replace(/&ograve;/g, 'ò')
      .replace(/&oacute;/g, 'ó')
      .replace(/&ocirc;/g, 'ô')
      .replace(/&otilde;/g, 'õ')
      .replace(/&ouml;/g, 'ö')
      .replace(/&divide;/g, '÷')
      .replace(/&oslash;/g, 'ø')
      .replace(/&ugrave;/g, 'ù')
      .replace(/&uacute;/g, 'ú')
      .replace(/&ucirc;/g, 'û')
      .replace(/&uuml;/g, 'ü')
      .replace(/&yacute;/g, 'ý')
      .replace(/&thorn;/g, 'þ')
      .replace(/&yuml;/g, 'ÿ')
      .replace(/&apos;/g, '\'');

    return _res;
  },
/**
 * Replace no encoded operator characters by encoded characters
 * @param  {[type]} str
 * @return {[type]}
 */
  replaceNoEncodedOperatorCharactersByEncodedCharacters : function(str){
    var _res = str
      .replace(/&/g, '&amp;')
      .replace(/>=/g,'&gteq;')
      .replace(/<=/g,'&lteq;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/¦/g, '&brvbar;')
    
    return _res;
  },


/**
 * Replace no encoded special characters by encoded characters
 * @param  {[type]} str
 * @return {[type]}
 */
  replaceNoEncodedSpecialCharactersByEncodedCharacters : function(str){
    var _res = str

      .replace(/€/g,'&euro;')
      .replace(/£/g,'&pound;')
      .replace(/¥/g,'&yen;')
      .replace(/¢/g,'&cent;')

      .replace(/oe/g,'&oelig;')
      .replace(/Y/g,'&Yuml;')
      .replace(/' '/g,'&nbsp;')
      .replace(/¡/g,'&iexcl;')
      .replace(/¤/g,'&curren;')
      .replace(/§/g,'&sect;')
      .replace(/¨/g,'&uml;')
      .replace(/©/g,'&copy;')
      .replace(/ª/g,'&ordf;')
      .replace(/«/g,'&laquo;')
      .replace(/¬/g,'&not;')
      .replace(/®/g,'&reg;')
      .replace(/¯/g,'&masr;')
      .replace(/°/g,'&deg;')
      .replace(/±/g,'&plusmn;')
      .replace(/²/g,'&sup2;')
      .replace(/³/g,'&sup3;')

      .replace(/µ/g,'&micro;')
      .replace(/¶/g,'&para;')
      .replace(/·/g,'&middot;')
      .replace(/¸/g,'&cedil;')
      .replace(/¹/g,'&sup1;')
      .replace(/º/g,'&ordm;')
      .replace(/»/g,'&raquo;')
      .replace(/¼/g,'&frac14;')
      .replace(/½/g,'&frac12;')
      .replace(/¾/g,'&frac34;')
      .replace(/¿/g,'&iquest;')

      .replace(/À/g,'&Agrave;')
      .replace(/Á/g,'&Acute;')
      .replace(/Â/g,'&Acirc;')
      .replace(/Ã/g,'&Atilde;')
      .replace(/Ä/g,'&Auml;')
      .replace(/Å/g,'&Aring;')
      .replace(/Æ/g,'&Aelig;')
      .replace(/Ç/g,'&Ccedil;')
      .replace(/È/g,'&Egrave;')
      .replace(/É/g,'&Eacute;')
      .replace(/Ê/g,'&Ecirc;')
      .replace(/Ë/g,'&Euml;')
      .replace(/Ì/g,'&Igrave;')
      .replace(/Í/g,'&Iacute;')
      .replace(/Î/g,'&Icirc;')
      .replace(/Ï/g,'&Iuml;')
      .replace(/Ð/g,'&eth;')
      .replace(/Ñ/g,'&Ntilde;')
      .replace(/Ò/g,'&Ograve;')
      .replace(/Ó/g,'&Oacute;')
      .replace(/Ô/g,'&Ocirc;')
      .replace(/Õ/g,'&Otilde;')
      .replace(/Ö/g,'&Ouml;')
      .replace(/×/g,'&times;')
      .replace(/Ø/g,'&Oslash;')
      .replace(/Ù/g,'&Ugrave;')
      .replace(/Ú/g,'&Uacute;')
      .replace(/Û/g,'&Ucirc;')
      .replace(/Ü/g,'&Uuml;')
      .replace(/Ý/g,'&Yacute;')
      .replace(/Þ/g,'&thorn;')
      .replace(/ß/g,'&szlig;')
      .replace(/à/g,'&agrave;')
      .replace(/á/g,'&aacute;')
      .replace(/â/g,'&acirc;')
      .replace(/ã/g,'&atilde;')
      .replace(/ä/g,'&auml;')
      .replace(/å/g,'&aring;')
      .replace(/æ/g,'&aelig;')
      .replace(/ç/g,'&ccedil;')
      .replace(/è/g,'&egrave;')
      .replace(/é/g,'&eacute;')
      .replace(/ê/g,'&ecirc;')
      .replace(/ë/g,'&euml;')
      .replace(/ì/g,'&igrave;')
      .replace(/í/g,'&iacute;')
      .replace(/î/g,'&icirc;')
      .replace(/ï/g,'&iuml;')
      .replace(/ð/g,'&oeth;')
      .replace(/ñ/g,'&ntilde;')
      .replace(/ò/g,'&ograve;')
      .replace(/ó/g,'&oacute;')
      .replace(/ô/g,'&ocirc;')
      .replace(/õ/g,'&otilde;')
      .replace(/ö/g,'&ouml;')
      .replace(/÷/g,'&divide;')
      .replace(/ø/g,'&oslash;')
      .replace(/ù/g,'&ugrave;')
      .replace(/ú/g,'&uacute;')
      .replace(/û/g,'&ucirc;')
      .replace(/ü/g,'&uuml;')
      .replace(/ý/g,'&yacute;')
      .replace(/þ/g,'&thorn;')
      .replace(/ÿ/g,'&yuml;')
      .replace('\'','&apos;');
    
    return _res;
  },

  /**
   * Remove markers, get only xml
   *
   * @param {string} xml : xml string with markers.  Ex: menu[<tr>i</xml>]
   * @return {string} only xml without marker.  Ex: <tr></xml>
   */
  cleanXml : function(xml){
    var _res = '';
    xml.replace(/\s*(<[^>]*>)\s*/g, function(m, text) {
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
  removeWhitespace : function(str){
    var _res = '';
    //do we need to manage escaped quotes ? /([^"]+)|("(?:[^"\\]|\\.)+")/
    if(str){
      _res = str.replace(/([^"^']+)|(["|'](?:[^"'\\]|\\.)+["|'])/g, function(m, strWithoutQuotes, strWithQuotes) {
        if (strWithoutQuotes) {
          return strWithoutQuotes.replace(/\s/g, '');
        } else {
          return strWithQuotes; 
        } 
      });
      return _res;
    }
    return str;
  },

  /********************************************************\
    Parse the xml, select the t() marker and translate them 
    by using the associate lang.json file
  \********************************************************/
  /**
   * [translate description]
   * @param  {[type]}   xml
   * @param  {[type]}   objLang
   * @param  {Function} callback
   * @return {[type]}
   */
  translate : function(xml, objLang, callback){
    if(typeof(xml) !== 'string'){
      return callback(null, '');
    }

    //capture {t  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
    var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*t[\s\S]+?)\}/g, function(m, text, offset) {

      var _xmlOnly=parser.cleanXml(text);
     //capture words inside () in order to translate them with the correct lang.json.
      var _pattern = /\((.*)\)/.exec(text);

      /*--------------------------------------------------------------------------*\
          If there is an expression inside (), we use by the _patternArray

        _pattern[_cleanMarkerStr without 't',words inside (),index,_cleanMarkerStr]
      \*--------------------------------------------------------------------------*/
      if(_pattern instanceof Array){
        /*--------------------------------------------------------------*\
              If the _pattern[1] translate version exist, we translate 
              the expression. Else we write _pattern[1] with T_ delimiters
        \*--------------------------------------------------------------*/
        var _sentenceToTranslate = parser.extractMarker(_pattern[1]);
        _sentenceToTranslate=parser.replaceEncodedSpecialCharactersByNoEncodedCharacters(_sentenceToTranslate);
        _sentenceToTranslate= parser.replaceEncodedOperatorCharactersByNoEncodedCharacters(_sentenceToTranslate);


        var finalStr="";
        if(objLang[_sentenceToTranslate] !== undefined){
          finalStr = objLang[_sentenceToTranslate];
        }
        else{
          finalStr = 'T_'+ _sentenceToTranslate +'_T';
        }

        finalStr = parser.replaceNoEncodedOperatorCharactersByEncodedCharacters(finalStr) ;
        finalStr = parser.replaceNoEncodedSpecialCharactersByEncodedCharacters(finalStr) + _xmlOnly;
        
        return finalStr;

      }
      else{
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
  findVariables : function(xml, existingVariables, callback){
    if(typeof(existingVariables) === 'function'){
      callback = existingVariables;
      existingVariables = [];
    }
    if(existingVariables === undefined){
      existingVariables = [];
    }
    if(typeof(xml) !== 'string'){
      return callback(null, '', []);
    }
    //capture {#  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
    var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*#[\s\S]+?)\}/g, function(m, text, offset) {
      var _marker = parser.extractMarker(text);
      var _xmlOnly = parser.cleanXml(text);
      var _variableStr = parser.cleanMarker(_marker);
      //find pattern #myVar($a,$b) menu[$a+$b]
      var _pattern = /#\s*([\s\S]+?)\s*(?:\(([\s\S]+?)\))?\s*=\s*([\s\S]+?)$/g.exec(_variableStr);
      if(_pattern instanceof Array){
        var _variable = parser.removeWhitespace(_pattern[1]);
        var _paramStr = parser.removeWhitespace(_pattern[2]);
        var _code = parser.removeWhitespace(_pattern[3]);
        //if the variable is a function with parameters
        if(_paramStr !== undefined){
          //separate each parameters
          var _params = _paramStr.split(/ *, */);
          var _sortedParams = [];
          //sort all params, longest params first to avoid a problem when two variable begin with the same word
          for (var i = 0; i < _params.length; i++) {
            _sortedParams.push({'index':i, 'name':_params[i]});
          };
          _sortedParams.sort(function(a,b){return a.name.length < b.name.length});
          //replace all parameters by _$0_, _$1_, _$2_, ..., in the code
          for (var p = 0; p < _sortedParams.length; p++) {
            var _param  = _sortedParams[p];
            _code = _code.replace(new RegExp('\\'+_param.name,'g'), '_$'+_param.index+'_');
          };
        }
        var _regex = new RegExp('\\$'+_variable+'(?:\\(([\\s\\S]+?)\\))?', 'g');
        existingVariables.push({
          'name' : _variable,
          'code' : _code,
          'regex' : _regex
        });
        return _xmlOnly;
      }
      else{
        return m;
      }
    });
    process.nextTick(function(){
      callback(null, _cleanedXml, existingVariables);
    });
  },


  /**
   * Detect used variables and update all markers accordingly (replace variables by their values)
   * @param {Array} markers : all markers of the document
   * @param {Array} variables : all declared variables of the document
   */
  preprocessMarkers : function(markers, variables, callback){
    if(variables instanceof Array && variables.length > 0){
      //preprocess all markers
      for (var i = 0; i < markers.length; i++) {
        var _marker = markers[i];
        var _markerName = _marker.name;
        //Does the marker contain a variable?
        if(_markerName.indexOf('$') !== -1){
          //check if it matches with one previously declared variable
          for(var j=0; j < variables.length; j++){
            var _variable = variables[j];
            var _pattern = [];
            while ((_pattern = _variable.regex.exec(_markerName)) !== null){
              var _code =  _variable.code;
              var _varStr = _pattern[0];
              var _paramStr = _pattern[1];
              //if there some parameters?
              if(_paramStr !== undefined){
                //separate each parameters
                var _params = _paramStr.split(/ *, */);
                //replace all parameters _$0_, _$1_, _$2_, ..., by their real values
                for (var p = 0; p < _params.length; p++) {
                  var _param  = _params[p];
                  _code = _code.replace(new RegExp('_\\$'+p+'_','g'), _param);
                };
              }
              _marker.name =  helper.replaceAll(_marker.name, _varStr, _code);
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
  findOpeningTagPosition : function(leftSideXml, indexWhereToStopSearch){
    indexWhereToStopSearch = indexWhereToStopSearch || leftSideXml.length;
    var _tag = [];
    var _tagCount = 0;
    var _prevTagPosEnd = 0;
    var _openingTagIndex = {};
    var _lastOpeningTagIndexBeforeStop = {};
    var _similarTag =  new RegExp('<(\/)?\\b[^\/|^>]*(\/)?>', 'g');
    while ((_tag = _similarTag.exec(leftSideXml)) !== null){
      if(_tag[1]==='/'){
        _tagCount--;
      }
      else {
        if(_prevTagPosEnd<indexWhereToStopSearch){
          _lastOpeningTagIndexBeforeStop[_tagCount] = (_tag.index >= indexWhereToStopSearch)? indexWhereToStopSearch-1 : _tag.index;
        }
        _openingTagIndex[_tagCount] = _tag.index;
        //eliminate self-closing tag
        if (_tag[2] !== '/'){
         _tagCount++;
        }
      }
      _prevTagPosEnd = _tag.index+_tag[0].length;
    }
    if(_openingTagIndex[_tagCount] === undefined){
      return -1;
    }
    else if(_openingTagIndex[_tagCount] < indexWhereToStopSearch){
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
  findClosingTagPosition : function(rightSideXml, indexWhereToStartSearch){
    indexWhereToStartSearch = indexWhereToStartSearch || 0;
    var _tag = [];
    var _startTagCount = 0;
    var _endTagCount = 0;
    var _endTagPos = -1;
    var _similarTag =  new RegExp('<(\/)?\\b[^\/|^>]*(\/)?>', 'g'); //reset the regex
    while ((_tag = _similarTag.exec(rightSideXml)) !== null){
      if(_tag[1]==='/'){
        _endTagCount++;
      }
      else{
        //eliminate self-closing tag
        if (_tag[2] !== '/'){
          _startTagCount++;
        }
      }
      if(_endTagCount === _startTagCount){
        _endTagPos = _tag.index + _tag[0].length;
        if(_endTagPos > indexWhereToStartSearch){
          break;
        }
      }
    }
    if(_endTagPos > indexWhereToStartSearch){
      return _endTagPos;
    }
    else{
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
  findPivot : function(partialXml){
    var _tag = [];
    var _tagCount = 0;
    var _prevTagCount = 0;
    var _highestTags = [];
    var _highestTagCount = 0;
    //capture all tags
    var _tagRegex = new RegExp('<(\/)?([^\/|^>| ]*)[^\/|^>]*(\/)?>','g');
    while ((_tag = _tagRegex.exec(partialXml)) !== null){
      var _tagType = '';
      if(_tag[1]==='/'){
        _tagCount++;
        _tagType = '>'; //closing
      }
      else{
        _tagCount--;
        _tagType = '<'; //opening
      }
      if(_tag[3]==='/'){
        _tagCount++;
        _tagType = 'x'; //self-closing
      }
      if(_tagCount > _highestTagCount){
        _highestTagCount = _tagCount;
        _highestTags = [];
      }
      if(_tagCount === _highestTagCount || _prevTagCount === _highestTagCount){
        var _tagInfo = {
          'tag' : _tag[2],
          'pos' : _tag.index,
          'type' : _tagType,
          'posEnd' : partialXml.length //by default 
        };
        //the end position of a tag equals the beginning of the next one
        if(_highestTags.length>0){
          _highestTags[_highestTags.length-1].posEnd = _tagInfo.pos;
        }
        _highestTags.push(_tagInfo);
      }
      _prevTagCount = _tagCount;
    }
    if(_highestTags.length===0 || (_highestTags.length===1 && _highestTags[0].type!=='x') || _highestTags[0].type==='<'){
      return null;
    }
    var _firstTag = _highestTags[0];
    var _lastTag = _highestTags[_highestTags.length-1];
    var _pivot = {
      'part1End'  : {'tag': _firstTag.tag, 'pos': _firstTag.posEnd},
      'part2Start': {'tag': _lastTag.tag, 'pos': _lastTag.pos }
    };
    if(_firstTag.type==='x'){
      _pivot.part1End.selfClosing = true;
    }
    if(_lastTag.type==='x'){
      _pivot.part2Start.selfClosing = true;
    }
    //exceptional case where there is only one self-closing tag which separate the two parts.
    if(_highestTags.length===1){
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
  findRepetitionPosition : function(xml, pivot, roughStartIndex){
    var _that = this;
    if(!pivot){
      return null;
    }
    // First part 
    var _leftSideXml = xml.slice(0, pivot.part1End.pos);
    var _startTagPos = _that.findOpeningTagPosition(_leftSideXml, roughStartIndex+1);

    // Second part
    var _rightSideXml = xml.slice(pivot.part2Start.pos);
    var _endTagPos = _that.findClosingTagPosition(_rightSideXml);
    //if the closing tag is not found and this is a flat structure
    if(_endTagPos === -1 && pivot.part2Start.selfClosing === true){
      _endTagPos = 0; //TODO should be the rough end of the array
    }
    return {'startEven':_startTagPos, 'endEven':pivot.part2Start.pos, 'startOdd':pivot.part2Start.pos, 'endOdd':pivot.part2Start.pos + _endTagPos};
  }
  
};

module.exports = parser;