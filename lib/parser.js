

var process = {

  extractTags : function(xml, data){
    var that = this;
    //"?:" avoiding capturing 
    var _res = xml.replace(/\{\{([\s\S]+?)\}\}/g, function(m, text, offset) {
      var _tag = that.cleanTag(text);
      var _xmlCleaned = that.cleanXml(text);

      var _splitted = _tag.split('.');
      if(_splitted.length>1){
        if(data[_splitted[0]] && data[_splitted[0]][_splitted[1]]){
          return data[_splitted[0]][_splitted[1]]+_xmlCleaned;
        }
      }
      else if(data[_tag]){
        return data[_tag]+_xmlCleaned;
      }
      return _xmlCleaned;
    });

    return _res;
  },

  cleanTag : function(text){
    //"?:" avoiding capturing. otther method /\s*<([^>]*)>\s*/g
    var _res = text
      .replace(/<(?:[\s\S]+?)>/g, function(m, text) {
        return '';
      })
      .replace(/^\s+|\s+$/g, '');
    return _res;
  },

  sortXmlString : function(arrayToSort, sortDepth){
    if(sortDepth === undefined){
      sortDepth = 1;
    }
    for (var i = 0; i < sortDepth; i++) {
      arrayToSort.sort(function(a, b){
        if(i>0 && b.pos[i-1] !== a.pos[i-1]){
          return 0;
        }
        else{
          if(a.pos[i] == undefined){
            return -1;
          }
          else if(b.pos[i] === undefined){
            return 1
          }
          else{
            return a.pos[i]-b.pos[i];
          }
        }
      });
    };
  },

  concatString : function(arrayOfStringPart, sortDepth){
    var _res = '';
    this.sortXmlString(arrayOfStringPart, sortDepth);
    for (var i = 0; i < arrayOfStringPart.length; i++) {
      _res += arrayOfStringPart[i].str;
    };
    return _res;
  },

  cleanXml : function(xml){
    var _res = '';
    xml.replace(/\s*(<[^>]*>)\s*/g, function(m, text) {
      _res += text;
      return '';
    });
    return _res;
  },

  extractXmlParts : function(xml, descriptor){
    var _that =this;
    var _res = {
      'staticData' : {
        'before': '',
        'after' : ''
      },
      'dynamicData': descriptor
    };

    var _posBeforeEverything = xml.length;
    var _posAfterEverything = 0;
    var _visitedArray = {};
    var _visitedArrayRange = [];
    var _part;

    // Find the exact positions of all arrays *********************
    for(var _objName in descriptor){
      var _type = descriptor[_objName].type; 
      if(_type === 'array'){
        var _roughPosStart = descriptor[_objName].range.start;
        var _roughPosEnd = descriptor[_objName].range.end;
        var _subString = xml.slice(_roughPosStart, _roughPosEnd);
        var _pivot = _that.detectCommonPoint(_subString);
        //absolute position of the pivot 
        _pivot.pos += _roughPosStart;
        var _realRange = _that.detectRepetition(xml, _pivot);
        descriptor[_objName].range = {'start':_realRange.startEven, 'end':_realRange.endEven, 'startOdd':_realRange.startOdd, 'endOdd':_realRange.endOdd};
      }
    }

    // Sort all xml parts by ascendant positions ******************
    var _allSortedParts = [];
    for(var _objName in descriptor){
      var _xmlParts = descriptor[_objName].xmlParts; 
      for (var i = 0; i < _xmlParts.length; i++) {
        _part = _xmlParts[i];
        _allSortedParts.push(_part);
      }
    }
    _allSortedParts.sort(function(a,b){ return a.pos - b.pos;});

    var _prevPos = 0;
    if(_allSortedParts.length > 0){
      _prevPos = _allSortedParts[0].pos;
    }
    // Extract xml parts *******************************************
    var _prevPart; 
    for (var i = 0; i < _allSortedParts.length; i++) {
      var _part = _allSortedParts[i];
      var _pos = _part.pos;
      var _objDesc = descriptor[_part.obj];
      var _type = _objDesc.type; 
      _part.before = '';
      _part.after = '';
      
      //detect if we enter into an array
      if(_type === 'array' &&  !_visitedArray[_part.obj]){
        _visitedArray[_part.obj] = true;
        _visitedArrayRange.push(_objDesc.range);
        if(_objDesc.range.start < _pos ){
          _prevPos = _objDesc.range.start;
        }
      }

      //detect if we exit an array
      if(_visitedArrayRange.length > 0 &&  _visitedArrayRange[_visitedArrayRange.length-1].end <= _pos){
        var _lastArray = _visitedArrayRange[_visitedArrayRange.length-1];
        _visitedArray[_part.obj] = false;
        _prevPart.after = xml.slice(_prevPos, _lastArray.end);        
        _prevPos = _lastArray.endOdd;
        _visitedArrayRange.pop();
        delete _lastArray.endOdd;
        delete _lastArray.startOdd;
      }
      _part.before = xml.slice(_prevPos, _pos);
      _posBeforeEverything = (_prevPos < _posBeforeEverything) ?_prevPos : _posBeforeEverything;
      _prevPos = _pos;
      _prevPart = _part;
      _posAfterEverything = (_prevPos > _posAfterEverything) ? _prevPos : _posAfterEverything;
    }

    //if there is a last array opened
    if(_visitedArrayRange.length > 0){
      var _lastArray = _visitedArrayRange[_visitedArrayRange.length-1];
      _prevPart.after = xml.slice(_prevPos, _lastArray.end);
      if(_lastArray.endOdd > _posAfterEverything){
        _posAfterEverything = _lastArray.endOdd;
      }
      _visitedArrayRange.pop();
      delete _lastArray.endOdd;
      delete _lastArray.startOdd;
    }

     //static data before
    _res.staticData.before = xml.slice(0, _posBeforeEverything);
    _res.staticData.after = xml.slice(_posAfterEverything);
    return _res;
  },

  getSubsitition : function(xml){
    var that = this;

    var _allTags = [];
    var _previousTagLength = 0;

    //"?:" avoiding capturing 
    var _res = xml.replace(/\{\{([\s\S]+?)\}\}/g, function(m, text, offset) {
      var _tag = that.cleanTag(text);
      var _obj = {};

      _obj = {
        'pos' : offset-_previousTagLength,
        'name' : _tag
      };
      _allTags.push(_obj);
      _previousTagLength += (_tag.length + 4);

      var _xmlCleaned = that.cleanXml(text);
      return _xmlCleaned;
    });

    return {
      "tags": _allTags,
      "xml" : _res
    };
  },

  generateXml : function(data, xml){
    var _res = '';

    for(var _key in data){
      //TODO optimize
      var _arrayMaxLength = data[_key]; //menu\[(.+?)\]
      var _prefix = _key.split(/(.+)\[.+\]$/)[1];
      //anti-slash everything which can be interpreted 
      var _prefixNeutralized = _prefix.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\./g, '\\.').replace(/\+/g, '\\+').replace(/\$/g, '\\$');
      var _regex = new RegExp(_prefixNeutralized+'\\[.+?\\]','g');
      //console.log(_regex);
      for (var i = 0; i < _arrayMaxLength; i++) {
        _res += xml.replace(_regex, _prefix+'['+i+']'); 
      };
    }

    return _res;
  },


  /* How to detect i i+1 repetition : (?=(\{.+?)(.+?\})[\s\S]*\1\+1\2)
     Or biggest (\{.+?)(.+?\})[\s\S]*\1\+1\2
     test string : <tr>{menu[date.id].id}<td>{menu[date.id].me[i].test}</td><td>{menu[date.id].me[i+1].test}</td><br>{menu[date.id+1].id}<tr>
  */
  detectRepetition : function(xml, pivot){
    var _that = this;
    var _tag = [];
    var _pivotTag = pivot.tag;
    var _pivotPos = pivot.pos;
    //get tag name </tr> -> tr
    var _tagName = /<\/([^>]*)>/.exec(_pivotTag)[1];

    /***** Even part ****/
    var _leftSideXml = xml.slice(0, _pivotPos); 
    var _startTagPos = _that.findOpeningTagIndex(_leftSideXml, _tagName);
    

    /***** Odd part ****/
    var _rightSideXml = xml.slice(_pivotPos);
    var _endTagPos = _that.findClosingTagIndex(_rightSideXml, _tagName);

    return {'startEven':_startTagPos, 'endEven':_pivotPos, 'startOdd':_pivotPos, 'endOdd':_pivotPos + _endTagPos};
  },

  findOpeningTagIndex : function(leftSideXml, tagName){
    var _tag = [];
    var _tagCount = 0;
    var _startTagIndex = {};
    var _similarTag =  new RegExp('<(\/)?'+tagName+'\\b[^>]*>', 'g');
    while ((_tag = _similarTag.exec(leftSideXml)) !== null){
      if(_tag[1]==='/'){
        _tagCount--;
      }
      else{
        _startTagIndex[_tagCount] = _tag.index;
        _tagCount++;
      }
    }
    return (_startTagIndex[_tagCount] === undefined) ? -1 : _startTagIndex[_tagCount];
  },

  findClosingTagIndex : function(rightSideXml, tagName){
    var _tag = [];
    var _startTagCount = 0;
    var _endTagCount = 0;
    var _endTagPos = -1;
    var _similarTag =  new RegExp('<(\/)?'+tagName+'\\b[^>]*>', 'g'); //reset the regex
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


  /* find neightbors: 
    \s*(<\/[^>]*> *<[^\/|^>]*>)\s*

    menu </p><p> bla <sdsd /> </p></ds><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><ds><p> balle</p><p>

    find tags which corresponds: 

    <([a-z]*)\b[^>]*>.*?<\/\1>
    laternative :
    <([\S]*)\b[^>]*>.*?<\/\1>
    */
  detectCommonPoint : function(xml){
    var _that = this;
    //find all couples like that  : //here we have each couple like "</p><p>", "</link><p>", "</tr><tr>", "</td><td sqdqsdsq>"
    var myRe = /\s*<\/([^>]*)> *<([^\/|^>| ]*)[^\/|^>]*>\s*/g;
    var tags;
    while ((tags = myRe.exec(xml)) !== null)
    {
      //if the tags are equals (eliminates "</link><p>")
      if(tags[1] === tags[2]){
        var _tagIndexStart =  tags.index;
        var _tagIndexEnd  = tags[0].search('>') + _tagIndexStart + 1;
        var _leftSideXml = xml.slice(0, _tagIndexEnd);
        var _rightSideXml = xml.slice(_tagIndexEnd);
        var _tagValue = tags[1];
        //test if each tag has a corresponding tag on the right and on the left
        if(_that.findOpeningTagIndex(_leftSideXml, _tagValue) === -1 && _that.findClosingTagIndex(_rightSideXml, _tagValue) === -1){
          var _trimTag = tags[0].replace(/^\s+/g,'').replace(/\s+$/g,'');
          return {'tag': _trimTag, 'pos':_tagIndexEnd} ;
        }
      }
    }
    return 'bad';

//    var _res = /\s*(<\/[^>]*> *<[^\/|^>]*>)\s*/g.exec(xml);
//    for (var i = 0; i < _res.length; i++) {
//      var _couple = _res[i]; //here we have each couple like "</p><p>", "</link><p>", "</tr><tr>", "</td><td sqdqsdsq>"
//
//      //extract the two tags
//      var _tags = /<\/([\S]*)> *<\1[^>]*>/g.exec(_couple);
//      //if the tags are equals (eliminates "</link><p>")
//      if(tags[0] !== ''){
//        //test if the closed tag has a corresponding opened tag before
//        var _regExp = new RegExp('<'+tags[0]+' +[^>]*>.*<\/'+tags[0]+'>');  
//        _regExp.test()
//      }
//    };
  }

}

module.exports = process;