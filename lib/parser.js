

var parser = {

  /**
   * Find all markers in the xml.
   * All markers are declared with braces like this: {d.title}.
   * It returns an object which contains two things:
   * - a cleaned xml string where the markers are removed
   * - an array of markers with their position in the cleaned xml
   *
   * @param {string} xml : xml string
   * @return {object} an object {
   *                             tags : [{pos:5, name:'title'}]
   *                             xml : '<xml></<xml>' 
   *                            }
   */
  findMarkers : function(xml){
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
        'name' : that.cleanMarker(_marker)
      };
      _allMarkers.push(_obj);
      _previousMarkerLength += (_marker.length + 2);  //2 equals the number of braces '{' or '}'
      return _xmlOnly;
    }).replace(/'/g, '\\\'');
    return {
      "markers": _allMarkers,
      "xml": _cleanedXml
    };
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
      // Remove all whitespaces 
      .replace(/\s+/g, '')
      // Remove special characters
      .replace(/[\n\t]/g, '');
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
   * Find position of the opening tag which matches with the closing tag "closingTagName" in the xml string
   *
   * @param {string} leftSideXml : xml string which is on the left of closingTagName
   * @param {string} closingTagName : closing tag name. Ex: "tr" for "</tr>"
   * @param {integer} indexWhereToStopSearch (optional) : force the algorithm to find the opening tag before this position 
   * @return {integer} index position in the xml string 
   */
  findOpeningTagPosition : function(leftSideXml, closingTagName, indexWhereToStopSearch){
    indexWhereToStopSearch = indexWhereToStopSearch || leftSideXml.length;
    var _tag = [];
    var _tagCount = 0;
    var _startTagIndex = {};
    var _lastOpeningTagIndexBeforeStop = 0;
    var _similarTag =  new RegExp('<(\/)?'+closingTagName+'\\b[^>]*>', 'g');
    while ((_tag = _similarTag.exec(leftSideXml)) !== null){
      if(_tag[1]==='/'){
        _tagCount--;
      }
      else{
        if(_tag.index<indexWhereToStopSearch){
          _lastOpeningTagIndexBeforeStop = _tag.index;
        }
        _startTagIndex[_tagCount] = _tag.index;
        _tagCount++;
      }
    }
    if(_startTagIndex[_tagCount] === undefined){
      return -1;
    }
    else if(_startTagIndex[_tagCount] < indexWhereToStopSearch){
      return _startTagIndex[_tagCount];
    }
    else {
      return _lastOpeningTagIndexBeforeStop;
    }
  },

  /**
   * Find position of the closing tag which matches with the opening tag "openingTagName" in the xml string
   *
   * @param {string} rightSideXml : xml string which is on the right of openingTagName
   * @param {string} openingTagName : description
   * @return {integer} index position in the xlm string
   */
  findClosingTagPosition : function(rightSideXml, openingTagName){
    var _tag = [];
    var _startTagCount = 0;
    var _endTagCount = 0;
    var _endTagPos = -1;
    var _similarTag =  new RegExp('<(\/)?'+openingTagName+'\\b[^>]*>', 'g'); //reset the regex
    while ((_tag = _similarTag.exec(rightSideXml)) !== null){
      if(_tag[1]==='/'){
        _endTagCount++;
      }
      else{
        _startTagCount++;
      }
      if(_endTagCount === _startTagCount){
        _endTagPos = _tag.index + _tag[0].length;
        break;
      }
    }
    return _endTagPos;
  },

  /**
   * Find the xml tag which defines the transition between two rows (or columns) of an array.
   * Example: In HTML, the transition between two rows is "</tr><tr>". The first tag is the end tag of the previous row, 
   * the second one is the start tag of the next row. We call it "pivot".
   *
   * @param {string} xml : xml string which contains the transition
   * @return {object} an object like this : {'tag': '</tr><tr>', 'pos': 10}. 
   */
  findPivot : function(xml){
    var _that = this;
    //find all couples like that  : //here we have each couple like "</p><p>", "</link><p>", "</tr><tr>", "</td><td sqdqsdsq>"
    var myRe = /\s*<\/([^>]*)> *<([^\/|^>| ]*)[^\/|^>]*>\s*/g;
    var tags;
    var lastTags;
    while ((tags = myRe.exec(xml)) !== null)
    {
      lastTags = tags; //keep last tags
      //if the tags are equals (eliminates "</link><p>")
      if(tags[1] === tags[2]){
        var _tagIndexStart =  tags.index;
        var _tagIndexEnd  = tags[0].search('>') + _tagIndexStart + 1;
        var _leftSideXml = xml.slice(0, _tagIndexEnd);
        var _rightSideXml = xml.slice(_tagIndexEnd);
        var _tagValue = tags[1];
        //test if each tag has a corresponding tag on the right and on the left
        if(_that.findOpeningTagPosition(_leftSideXml, _tagValue) === -1 && _that.findClosingTagPosition(_rightSideXml, _tagValue) === -1){
          var _trimTag = tags[0].replace(/^\s+/g,'').replace(/\s+$/g,'');
          return {'tag': _trimTag, 'pos':_tagIndexEnd} ;
        }
      }
    }
    /* If we have not found a pivot, we consider we are in flat structure */
    var _tagIndexStart =  lastTags.index;
    var _tagIndexEnd  = lastTags[0].search('>') + _tagIndexStart + 1;
    var _trimTag = lastTags[0].replace(/^\s+/g,'').replace(/\s+$/g,'');
    return {'tag': _trimTag, 'pos':_tagIndexEnd} ;
  },

  /**
   * Find exact position in the XML of the repeated area (odd, and even part)
   *
   * @param {string} xml : xml string of the repeated area
   * @param {object} pivot : object returned by findPivot.
   * @param {integer} roughStartIndex (optional) : forces the algorithm to find the beginning of the repetition before it
   * @return {object} object which specify the start position and the end position of a repeated area.
   */
  findRepetitionPosition : function(xml, pivot, roughStartIndex){
    var _that = this;
    var _tag = [];
    var _pivotTag = pivot.tag;
    var _pivotPos = pivot.pos;
    //get tag name </tr> -> tr
    var _tagName = /<\/([^>]*)>/.exec(_pivotTag)[1];

    // Even part 
    var _leftSideXml = xml.slice(0, _pivotPos);
    var _startTagPos = _that.findOpeningTagPosition(_leftSideXml, _tagName, roughStartIndex);
    // Odd part
    var _rightSideXml = xml.slice(_pivotPos);
    var _endTagPos = _that.findClosingTagPosition(_rightSideXml, _tagName);
    return {'startEven':_startTagPos, 'endEven':_pivotPos, 'startOdd':_pivotPos, 'endOdd':_pivotPos + _endTagPos};
  }
  
};

module.exports = parser;