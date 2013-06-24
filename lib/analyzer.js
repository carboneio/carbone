var util = require('util');

var analyzer = {

  getXMLBuilderFunction : function(descriptor){
    var that = this;
    var _str = "var _strResult = '';\n";
    _str += "var d = (data !== null)?data:{};\n";
    _str += "var _strPart = {};\n";
    _str += "var _strParts = [];\n";
    _str += "var _absPosition = 0;\n";
    _str += "var _depthPos = [];\n";
    //_str += "var _nestedArrayParams = [];\n";
    var _lastArrayEnd = 0;
    var _nestedArray  = 0;
    var _nestedArrayDepth  = 0;
    var _dType = 'object';
    var _lastPos = 0;

    var _dynamicData = descriptor.dynamicData || {};
    var _staticData = descriptor.staticData || {};
    var _hierarchy = descriptor.hierarchy || [];

    if(_staticData.before !== ''){
      _str += "_strPart = {\n";
      _str += "  'pos' : [0],\n";
      _str += "  'str' : '"+_staticData.before + "'\n";
      _str += "};\n";
      _str += "_strParts.push(_strPart);\n";
    }

    //delcare all variable
    for(var _objName in _dynamicData){
      if(_objName !== 'd' ){
        _str+= "var "+_objName+" = {};\n";
      }
      else{
        _dType = _dynamicData[_objName].type;
      }
    }

    //For each object, generate the code
    for (var _objIndex = 0; _objIndex < _hierarchy.length; _objIndex++) {
      var _objName = _hierarchy[_objIndex];
      var _realObjName = _dynamicData[_objName].name;
      var _type = _dynamicData[_objName].type;
      var _objParentName = _dynamicData[_objName].parent;
      var _xmlParts = _dynamicData[_objName].xmlParts;
      var _arrayDepth = _dynamicData[_objName].depth || 0;
      var _atStart = _dynamicData[_objName].atStart;
      var _atEnd = _dynamicData[_objName].atEnd;
      var _beforeStr = _dynamicData[_objName].before;

      //close previously created for-loops
      if( (_dynamicData[_objName].position && _lastArrayEnd <= _dynamicData[_objName].position.start) || _arrayDepth === 0 ){
        while(_nestedArrayDepth > 0){
          _str += "}\n";
          _nestedArrayDepth--;
        }
      }
      //detect if we are in a new array, if yes, close the previous loop

      //Object type
      if(_type === 'object'){
        //declare any nested object
        if(_objName!=='d'){
          _str += _objName+"="+ _objParentName+"['"+_realObjName+"'];\n";
        }
      }
      //Array type
      else if(_type === 'array'){
        var _posStart = _dynamicData[_objName].position.start;
        var _posEnd = _dynamicData[_objName].position.end;

        var _arrayIndexName = _objName+"_i";
        var _arrayName = _objName+"_array";
        //declare any nested object
        if(_objName!=='d'){
          _str += "var "+_arrayName+"="+ _objParentName+"['"+_realObjName+"'];\n";
        }
        else{
          _str += "var "+_arrayName+"="+ _objName+";\n";
        }
        //keep the end of the array
        _lastArrayEnd = (_posEnd>_lastArrayEnd)? _posEnd : _lastArrayEnd;

        if(_lastArrayEnd > _lastPos){
          _lastPos = _lastArrayEnd;
        }
        if(_nestedArrayDepth === 0){
          _str += "_absPosition = ["+_posStart+"];\n";
          _str += "_depthPos[0] = "+_posStart+";\n";
        }
        //add xml which are before the array repetition section
        if(_beforeStr !== undefined && _beforeStr !== ''){
          _str += "_strPart = {\n";
          _str += "  'pos' :  _absPosition.slice(0),\n";
          _str += "  'str' : '"+_beforeStr + "'\n";
          _str += "};\n";
          _str += "_strParts.push(_strPart);\n";
        }
        //increment 
        _nestedArrayDepth++;
        //_str += "_nestedArrayParams.push({index});\n";
        _str += "for (var "+_arrayIndexName+" = 0; "+_arrayIndexName+" < "+_arrayName+".length; "+_arrayIndexName+"++) {\n";
        _str += "  var "+_objName+" = "+_arrayName+"["+_arrayIndexName+"];\n";
        _str += "_depthPos["+_arrayDepth+"]="+_arrayIndexName+";\n";
        //_str += "_absPosition["+(_arrayDepth*2-1)+"] = "+_arrayIndexName+";\n";
          //_str += "_absPosition[2] = "+_posStart+";\n";
      }
      //Generate code which will concatenate each xml parts
      for (var i = 0; i < _xmlParts.length; i++) {
        var _xmlPart = _xmlParts[i];
        var _dataObj = _xmlPart.obj ;
        var _dataAttr = _xmlPart.attr;
        var _partDepth = _xmlPart.depth;
        var _formatters = _xmlPart.formatters || [];

        if(_type ==='object' && _arrayDepth === 0){
          _str += "_absPosition = ["+_xmlPart.pos+"];\n";
          if(_xmlPart.pos > _lastPos){
            _lastPos = _xmlPart.pos;
          }
        }
        else{
          //_str += "_absPosition["+(_arrayDepth*2-1)+"] = "+_arrayIndexName+";\n";
          _str += "_absPosition = [];\n";
          _str += "_absPosition[0] = _depthPos[0];\n";
          for (var d = 1; d <= _partDepth; d++) {
            _str += "_absPosition["+(d*2-1)+"] = _depthPos["+d+"];\n";
          }
          _str += "_absPosition[2] = "+_xmlPart.pos+";\n";
        }

        _str += "_strPart = {\n";
        _str += "  'pos' : _absPosition.slice(0),\n";
        _str += "  'str'    : ''\n";
        _str += "};\n";
        //concatenate each sub parts if they exist
        if(_xmlPart.before){
          _str += "_strPart.str += '"+_xmlPart.before + "';\n";
        }
        //insert the data only it it not null
        if(_dataAttr){
          var _field = that.getFormatterString(_dataObj + "['" + _dataAttr + "']", _formatters);
          _str += "if("+ _dataObj +" !== undefined){\n";
          _str += "var _str = " + _field + ";\n";
          _str += "_strPart.str += (_str !== null && _str !== undefined)?_str:''"+";\n";
          _str += "}\n";
        }
        if(_xmlPart.after){
          _str += "_strPart.str += '"+_xmlPart.after + "';\n";
        }
        //push each part in a array (this array will be sorted at the end)
        _str += "_strParts.push(_strPart);\n";

      }

    }
    //close previously created for-loops
    while(_nestedArrayDepth > 0){
      _str += "}\n";
      _nestedArrayDepth--;
    }

    if(_staticData.after !== ''){
      _str += "_strPart = {\n";
      _str += "  'pos' : ["+(_lastPos+1)+"],\n";
      _str += "  'str' : '"+_staticData.after + "'\n";
      _str += "};\n";
      _str += "_strParts.push(_strPart);\n";
    }

    _str += 'return _strParts;';
    //console.log(_str);
    //The function is built, we compile it and check errors in the same time
    var _fn;
    try{
      _fn = new Function('data', 'formatters', _str);
    }
    catch (err){
      throw new Error('getSubstitutionFunction: Impossible to generate the XML builder.\n'+err+'\n--------------------------------\n'+_str+'\n--------------------------------\n');
    }
    return _fn;
  },

  decomposeTags : function(tags){
    var _res = {};
    for (var i = 0; i < tags.length; i++){
      var _tag = tags[i].name;
      var _tagPos = tags[i].pos;

      //we loop on each char because it simpler and faster than many regex
      var _word = '';
      var _prevTag = ''; 
      var _uniqueTagName = '';
      var _iterator = '';
      var _prevChar = '';
      var _isFormatter = false;
      var _isFormatterParenthesis = false;
      var _formaters = [];
      var _formatterStr = '';
      for (var c = 0; c < _tag.length; c++){
        var _char = _tag.charAt(c);

        //if we enter in a formatter and we are not between two parenthesis of a formatter (the character ":" is allowed within the parenthesis)
        if (_char===':' && _isFormatterParenthesis === false){
          _isFormatter = true;
          //if we enter in a second formatter, keep the previous one. Ex. three nested formaters : formater1:formater2:formater3
          if(_formatterStr !== ''){
            _formaters.push(_formatterStr);
            _formatterStr = '';
          }
        }
        //if we are in a formatter, and if we enter in a parenthesis 
        else if (_isFormatter === true && _char==='('){
          _formatterStr += _char;
          _isFormatterParenthesis = true;
        }
        //if we are in a formatter and we exit 
        else if (_isFormatter === true && _char===')'){
          _formatterStr += _char;
          _isFormatterParenthesis = false;
          _isFormatter = false;
          _formaters.push(_formatterStr);
          _formatterStr = '';
        }
        else if(_isFormatter === true && _char!==' ' ){
          _formatterStr += _char;
        }
        //if we enter into an object
        else if(_char==='.'){
          _uniqueTagName += _word;
          if(!_res[_uniqueTagName]){
            _res[_uniqueTagName]={
              'name' : _word,
              'type' : 'object',
              'parent': _prevTag,
              'xmlParts' : []
            };
          }
          _prevTag = _uniqueTagName;
          _word = '';
          _isFormatter = false;
        }
        //if we enter into the brakets of an array
        else if (_char==='['){
          _uniqueTagName += _word;
          //If we are in a multidimensional array
          if(_prevChar === ']'){
            _uniqueTagName += '_';
          }
          if(!_res[_uniqueTagName]){
            _res[_uniqueTagName]={
              'name' : _word,
              'type' : 'array',
              'parent': _prevTag,
              'position' : {'start' : _tagPos},
              'xmlParts' : []
            };
          }
          _prevTag = _uniqueTagName;
          _word = '';
          _isFormatter = false;
        }
        //if we exit the bracket of an array
        else if (_char===']'){
          //console.log(_word);
          _word = '';
          _isFormatter = false;
        }
        //if this is not a whitespace, keep the word
        else if (_char!==' ') {
          _word += _char;
        }

        //detect array iteration
        if(_word.substr(-2)==='+1'){
          _iterator = _word.substr(-2);
          if(_res[_uniqueTagName].position.end === undefined){
            _res[_uniqueTagName].position.end = _tagPos;
          }
          _word = '';
        }

        if(_char!==' '){
          _prevChar = _char;
        }
      }
      //do not store the odd part of an array
      if(_iterator === ''){
        //If there is a formatter, add it in the array of formatters
        if(_formatterStr !== ''){
          _formaters.push(_formatterStr);
        }
        var _xmlPart = {
          'attr' : _word,
          'formatters': _formaters,
          'obj' : _prevTag,
          'pos' : _tagPos
        }
        _res[_prevTag].xmlParts.push(_xmlPart);
      }

      //console.log('\n\n\n');
      //console.log(JSON.stringify(_res, null,2));
      //console.log('\n\n\n');
    }
    return _res;
  },


  reOrderHierarchy : function(descriptor){
    var _hierarchyPerDepth = [];
    var _hierarchy=[];
    for(var _objName in descriptor.dynamicData){
      var _obj = descriptor.dynamicData[_objName];
      var _depth = _obj.depth || 0;
      if(_hierarchyPerDepth[_depth] === undefined){
        _hierarchyPerDepth[_depth] = [];
      }
      _hierarchyPerDepth[_depth].push(_objName);
    }
    _hierarchyPerDepth.sort();
    for (var i = 0; i < _hierarchyPerDepth.length; i++) {
      _hierarchy = _hierarchy.concat(_hierarchyPerDepth[i]);
    }
    descriptor.hierarchy = _hierarchy;
    return descriptor;
  },

  /**
   * Creates a string of the formatter(s) function(s) call of the attribute
   * @param  {String} attr. Example 'd.number'
   * @param  {Array} formatters. Example [ 'int', 'toFixed(2)' ]
   * @return {String}. Example 'toFixed(int(d.number), 2)'
   */
  getFormatterString : function(attr, formatters){
    var _str = attr;
    for (var i = 0; i < formatters.length; i++) {
      var _splitFormatter = formatters[i].replace(/\)/g, '').split('(');
      var _arguments = _splitFormatter.slice(1).filter(function(item){
        return item.replace(/ +/g, '') !== '';
      });
      if(_arguments.length > 0){
        _arguments = _arguments.toString()
                      .replace(/^ +/g, '')
                      .replace(/ +$/g, '')
                      .replace(/ *, */g, '\', \'');
        _arguments = ', \'' + _arguments + '\'';
      }
      _str = 'formatters.' + _splitFormatter[0] + '(' + _str + _arguments + ')';
    }
    return _str;
  }

};

module.exports = analyzer;