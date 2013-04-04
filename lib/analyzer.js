var util = require('util');

var analyzer = {

  getXMLBuilderFunction : function(descriptor){
    var that = this;
    var _str = "var _strResult = '';\n";
    _str += "var d0 = (data !== null)?data:{};\n";
    _str += "var _strPart = {};\n";
    _str += "var _strParts = [];\n";
    _str += "var _absPosition = 0;\n";
    _str += "var _depthPos = [];\n";
    //_str += "var _nestedArrayParams = [];\n";
    var _lastArrayEnd = 0;
    var _nestedArray  = 0;
    var _nestedArrayDepth  = 0;
    var _d0Type = 'object';
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
      if(_objName !== 'd0' ){
        _str+= "var "+_objName+" = {};\n";
      }
      else{
        _d0Type = _dynamicData[_objName].type;
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

      //close previously created for loops

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
        if(_objName!=='d0'){
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
        if(_objName!=='d0'){
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
          _str += "if("+ _dataObj +" !== undefined){;\n";
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
    //close previously created for loops
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
    var _alreadyVisited = {};
    var _arrayNames = {};
    var _depth = 0;
    var _uid = 1;
    var _res = {
      'd0' : {
        'name' : '',
        'type' : 'object',
        'parent': '',
        'xmlParts' : []
      }
    };
    for (var i = 0; i < tags.length; i++) {
      var _tag = tags[i].name;
      var _tagPos = tags[i].pos;
      var _tagParts = _tag.split('.');
      var _prevTagPart = _tagParts[0];
      _depth = 0;
      for (var j = 1; j < _tagParts.length; j++) {
        // We split the tagName to extract formatters that can may be applied to it
        var _formatters = _tagParts[j].split(':');
        // The tag is always in first position of the split
        var _tagPart = _formatters[0];
        // Filters, if so, are the rest of the split
        // date:parse('YYYYMMDD'):format('DD/MM/YYYY')
        // Will be splitted : [ 'parse('YYYYMMDD')', 'format('DD/MM/YYYY')' ]
        _formatters.splice(0, 1);

        if(_arrayNames[_tagPart]){
          var _uName = _arrayNames[_tagPart];
          var _lastArrayDetection = _res[_uName].position;
          if(!_lastArrayDetection.end){
            _lastArrayDetection.end = tags[i].pos;
          }
        }

        //if it an array decompose it
        var _arrayParts = _tagPart.split(/\[\S+?\]/);

        //store path
        var _uniqueName = _prevTagPart+_arrayParts;

        var _lastObjName = 'd0';
        if(_prevTagPart !== 'd'){
          _lastObjName  = _alreadyVisited[_prevTagPart];
        }

        //it it is the last attribute, keep the xml part
        if(j === _tagParts.length-1){
          if(!(/\+1/g.test(_tag))){
            _res[_lastObjName].xmlParts.push({
              'attr': _tagPart,
              'formatters' : _formatters,
              'obj': _lastObjName,
              'pos': _tagPos
            });
          }
        }
        _prevTagPart = _uniqueName;
        if(_alreadyVisited[_uniqueName]){
          continue;
        }

        //it is an array
        if(_arrayParts.length > 1){
          var _arrayTag = _tagPart;
          _depth+=2;

          //if it is a multi-dimension array, extract each array
          var _multiArray = '';
          var _multiArrayEnd = '';
          for (var k = 2; k < _arrayParts.length; k++) {
            _multiArrayEnd += '[i]';
          }
          var _parentArrayUniqueName = '';
          for (var k = 1; k < _arrayParts.length; k++) {
            var _arrayPart = _arrayParts[0];

            //var _arrayBeginSearch = /([\S]+?)\[i\]$/g.exec(_arrayTag);
            //
            var _arrayEndSearch = _arrayPart + _multiArray + '[i+1]' + _multiArrayEnd;
            _arrayNames[_arrayEndSearch] = _arrayPart+(_uid);
            //console.log('\n');
            //console.log(_arrayEndSearch);
            //console.log('\n');

            _alreadyVisited[_uniqueName] = _arrayPart+(_uid);


            _res[_arrayPart+(_uid)] = {
              'name' : _arrayPart,
              'type' : 'array',
              'parent' : (k>1)? _parentArrayUniqueName : _lastObjName,
              'position' : {'start': tags[i].pos},
              'xmlParts':[]
            };


            _parentArrayUniqueName = _arrayPart+(_uid);

            _multiArray += '[i]';
            _multiArrayEnd = _multiArrayEnd.slice(0, -3);
            _uid++;

          }
        }
        //it is an object
        else if (j!== _tagParts.length-1){
          _alreadyVisited[_uniqueName] = _tagPart+(_uid);

          _res[_tagPart+(_uid)] = {
            'name' : _tagPart,
            'type' : 'object',
            'parent' : _lastObjName,
            /*'depth' : j,*/
            'xmlParts' : []
          };
          _uid++;
        }
      }
    }
    //clean false detecions
    for (var _group in _res) {
      if(_res[_group].position && _res[_group].position.end === undefined){
        //var _arrayRange = _res[_group].position.slice();
        delete _res[_group].position;
      }
    }
    //console.log('\n');
    //console.log( util.inspect(_res, false, 100, true));
    //console.log('\n\n');
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
   * @return {String}. Example 'toFixed.apply(int.apply(d.number), [ 2 ])'
   */
  getFormatterString : function(attr, formatters){
    var _str = attr;
    for (var i = 0; i < formatters.length; i++) {
      var _splitFormatter = formatters[i].replace(/\)/g, '').split('(');
      var _arguments = _splitFormatter
                          .slice(1)
                          .toString()
                          .replace(/ +/g, ' ')
                          .replace(/’|‘/g, '\'')
                          .split(',');
      if(_arguments.length > 0 && _arguments.join().replace(/ /g, '') !== ''){
        _arguments = ', [ ' + _arguments + ' ]';
      }
      _str = 'formatters.' + _splitFormatter[0] + '.apply(' + _str + _arguments + ')';
    }
    return _str;
  }

};

module.exports = analyzer;