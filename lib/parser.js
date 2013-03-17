

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

  extractXmlParts : function(xml, tags, descriptor){
    var _that =this;
    var _res = {
      'staticData' : {
        'before': '',
        'after' : ''
      },
      'dynamicData': descriptor
    };

    //static data before
    _res.staticData.before = xml.slice(0, tags[0].pos);
    _res.staticData.after = xml.slice(tags[tags.length-1].pos);

    for (var i = 0; i < tags.length; i++) {
      var _tag = tags[i].name;
      var _pos = tags[i].pos;
    };

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
        descriptor[_objName].range = _realRange;
      }
    }

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
    var _pivotTag = pivot.tag;
    var _pivotPos = pivot.pos;
    //get tag name </tr> -> tr
    var _endTagName = /<\/([^>]*)>/.exec(_pivotTag)[1];

    var _leftSideXml = xml.slice(0, _pivotPos); 

    var _startTagRegex =  new RegExp('<'+_endTagName+'\\b[^>]*>.*<\/'+_endTagName+'>$');
    var _searchRes = _startTagRegex.exec(_leftSideXml);

    if(_searchRes == null){
      throw new Error('Repetition not found');
    }

    /*console.log('\n');
    console.log(_searchRes);
    console.log('\n\n');*/

    return {'start':_searchRes.index, 'end':_pivotPos};
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
        var _regExCorrespondingTag = new RegExp('<'+_tagValue+'[^>]*>[^<|^>]*<\/'+_tagValue+'>'); //<pa[^>]*>[^<|^>]*<\/pa> 
        if(!_regExCorrespondingTag.test(_leftSideXml) && !_regExCorrespondingTag.test(_rightSideXml)){
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