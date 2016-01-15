var util = require('util');
var extracter = require('./extracter');
var parser = require('./parser');
var params = require('./params');
var path = require('path');
var fs = require('fs');

var builder = {

  /**
   * Build the xml according to the data
   * @param  {String}       xml        xml to parse
   * @param  {Object|Array} data
   * @param  {Object}       options {
   *                                  'complement': data which accessible with the market {c.}
   *                                  'formatters' : formatters
   *                                  'existingVariables' : existing variables (Array returned by parser.findVariables())
   *                                }
   * @param  {Function}     callback
   */
  buildXML : function(xml, data, options, callback){
    if(typeof(options) === 'function'){
      callback = options;
      options = {};
    }
    //find translation markers {t()}
    parser.translate(xml,params.objLang,function(err, xmlWithoutTranslation){
      //find declared variable {#myVar }
      parser.findVariables(xmlWithoutTranslation, options.existingVariables, function(err, xmlWithoutVariable, variables){
        //find markers { d. } or { c. }
        parser.findMarkers(xmlWithoutVariable, function(err, xmlWithoutMarkers, markers){
          //exit if there is no markers
          if(markers.length===0){
            return callback(null, xml);
          }
          parser.preprocessMarkers(markers, variables, function(err, preprocessedMarkers){
            var _dynamicDescriptor = extracter.splitMarkers(preprocessedMarkers);
            var _descriptor = extracter.splitXml(xmlWithoutMarkers, _dynamicDescriptor);
            _descriptor = extracter.buildSortedHierarchy(_descriptor);
            _descriptor = extracter.deleteAndMoveNestedParts(_descriptor);
            //console.log('\n\n\n');
            //console.log(JSON.stringify(_descriptor,null,2));
            //console.log('\n\n\n');
            var _builder = builder.getBuilderFunction(_descriptor);
            //console.log('\n\n\n');
            //console.log(_builder.toString());
            //console.log('\n\n\n');
            var _obj = {
              'd' : data,
              'c' : options.complement
            };
            //var _start = Date.now();
            var _xmlParts = _builder(_obj, options.formatters);
            //console.log('\n\n'+(Date.now()-_start)+'ms\n\n');
            //console.log('\n\n\n');
            //console.log(JSON.stringify(_xmlParts));
            //console.log('\n\n\n');
            var _xmlResult = builder.assembleXmlParts(_xmlParts, 20); //TODO -> adapt the depth of the sort according to the maximum depth in _xmlParts
            return callback(null, _xmlResult);

          });
        });
      });
    });
  },

  /**
   * Creates a string of the formatter(s) function(s) call of the attribute
   * INTERNAL USE ONLY
   *
   * @param  {String} attr. Example 'd.number'
   * @param  {Array} formatters. Example [ 'int', 'toFixed(2)' ]
   * @return {String}. Example 'toFixed(int(d.number), 2)'
   */
  getFormatterString : function(attr, formatters){
    var _str = attr;
    for (var i = 0; i < formatters.length; i++) {
      var _formatter = formatters[i];
      var _indexFirstParenthesis = _formatter.indexOf('(');
      var _argumentStr = '';
      var _functionStr = '';
      //this function contains arguments
      if(_indexFirstParenthesis !== -1){
        _functionStr = _formatter.slice(0, _indexFirstParenthesis);
        var _indexLastParenthesis = _formatter.lastIndexOf(')'); //TODO error if last Parenthesis is not found
        var _arguments = _formatter.slice(_indexFirstParenthesis+1, _indexLastParenthesis).split(/ *, */);
        for (var j = 0; j < _arguments.length; j++) {
          if(_arguments[j] !== ''){
            //remove existing quotes (everything is converted to a string for the momemt. It should change in the future)
            _argumentStr += ', \''+_arguments[j].replace(/^ *'?/, '').replace(/'? *$/, '')+'\'';
          }
        }
      }
      else{
        _functionStr = _formatter;
      }

      _str = 'formatters.' + _functionStr + '(' + _str + _argumentStr + ')';
    }
    return _str;
  },

  /**
   * build the condition string which will be used to filter rows
   *
   * @param {string} objName : Example 'd.number'
   * @param {array} conditions : array of conditions. Example [{'left':'sort', 'operator':'>', 'right':'10'}]
   * @param {string} codeIfTrue : code to insert if the condition is true. Example 'row = true'
   * @param {string} prefix (optional) : if we need to create local variable, this prefix will be added in front of the variable.
   * @param {boolean} inverseCondition (optional, default false) : if true, it will inverse the condition
   * @return {string}. Example : 'if(d.number['sort'] > 10) { row = true }'
   */
  getFilterString : function(conditions, codeIfTrue, prefix, inverseCondition){
    prefix = prefix || '';
    if(!codeIfTrue || !(conditions instanceof Array) || conditions.length ===0){
      return '';
    }
    var _str = '';
    var _alreadyDeclaredFilter = {};
    var _declareStr = '';
    _str += 'if(';
    _str += (inverseCondition === true) ? '!(':'(';
    for (var c = 0; c < conditions.length; c++) {
      var _condition = conditions[c];
      var _attr = _condition.left.attr;
      var _objName = _condition.left.parent;
      //if the left part is an object
      var _objectSeparatorIndex = _attr.indexOf('.');
      if(_objectSeparatorIndex !== -1){
        var _obj = _attr.slice(0, _objectSeparatorIndex);
        _attr = _attr.slice(_objectSeparatorIndex+1);
        _objName = '_'+prefix+_obj+'_filter';
        if(_alreadyDeclaredFilter[_objName] === undefined){
          _declareStr += 'var '+_objName+'='+_condition.left.parent+'["'+_obj+'"];\n';
        }
      }
      if(_attr === 'i'){
        _str += _objName + '_i '+_condition.operator+_condition.right;
      }
      else{
        if(_alreadyDeclaredFilter[_objName] === undefined){
          _str += _objName + ' && ';
        }
        _str += _objName+'["'+_attr+'"]'+_condition.operator+_condition.right;
      }
      if(c < conditions.length - 1){
        _str += ' && ';
      }
      _alreadyDeclaredFilter[_objName] = true;
    }
    _str += ')){\n ';
    _str += codeIfTrue +';\n';
    _str += ' }';

    return _declareStr + _str;
  },

  /**
   * Assemble all xml parts and return the final result, the xml string with data
   *
   * @param {array} arrayOfStringPart :  special array which is generated by the function returned by getBuilderFunction
   * @param {integer} sortDepth : description
   * @return {string} final result
   */
  assembleXmlParts : function(arrayOfStringPart, sortDepth){
    var _res = '';
    builder.sortXmlParts(arrayOfStringPart, sortDepth);
    //console.log('\n\n\n');
    //console.log(JSON.stringify(arrayOfStringPart));
    //console.log('\n\n\n');
    var _rowInfo = [];
    var _prevDepth = 0;
    var _prevPos = [];
    var _arrayLevel = 0;
    //TODO MANAGE  sortDepth
    var sortDepth = (sortDepth) ? sortDepth : 1;
    //init _rowInfo
    for (var i = 0; i <= sortDepth; i++) {
      _rowInfo.push({
        'xmlPos' : 0,
        'rowShow' : 0
      });
    };
    for (var i = 0; i < arrayOfStringPart.length; i++) {
      var _part = arrayOfStringPart[i];
      if(isArrayEqual(_prevPos, _part.pos)===false){
        _prevPos = _part.pos;
      }
      else{
        continue;
      }
      _res += _part.str;

      var _depth = _part.pos.length;
      if(_prevDepth < _depth){
        _arrayLevel++;
      }
      else if (_prevDepth > _depth) {
        _arrayLevel--;
      }
      _prevDepth = _depth;

      //TODO. Protection is sortDepth is too short
      if(_rowInfo[_arrayLevel] === undefined){
        _rowInfo[_arrayLevel] = {
          'xmlPos' : 0,
          'rowShow' : 0
        };
      }
      _rowInfo[_arrayLevel].rowShow |= _part.rowShow;
      if(_part.rowStart===true){
        _rowInfo[_arrayLevel].xmlPos = _res.length - _part.str.length;
      }
      else if(_part.rowEnd===true){
        if(_rowInfo[_arrayLevel].rowShow === 0){
          _res = _res.slice(0, _rowInfo[_arrayLevel].xmlPos);
        }
        _rowInfo[_arrayLevel-1].rowShow |= _rowInfo[_arrayLevel].rowShow;
        _rowInfo[_arrayLevel].rowShow = 0;
      }
    }
    return _res;
  },

  /**
   * Sort the special array which is generated by the function returned by getBuilderFunction.
   * INTERNAL USE ONLY (USED ONLY BY assembleXmlParts)
   *
   * @param {array} arrayToSort : array of objects
   * @param {integer} sortDepth
   */
  sortXmlParts : function(arrayToSort, sortDepth){
    if(sortDepth === undefined){
      sortDepth = 1;
    }
    arrayToSort.sort(function(a, b){
      var i = 0;
      var _a = a.pos[i];
      var _b = b.pos[i];
      while(_a === _b && !(_a === undefined && _b === undefined) && i < sortDepth){
        i++;
        _a = a.pos[i];
        _b = b.pos[i];
      }
      if(_a === undefined && _b === undefined && a.rowShow === true && b.rowShow === false){
        return -1;
      }
      else if(_a === undefined && _b === undefined && a.rowShow === false && b.rowShow === true){
        return 1;
      }
      else if(_a === undefined){
        return -1;
      }
      else if(_b === undefined){
        return 1;
      }
      else{
        return (_a > _b) ? 1 : -1;
      }
    });
  },

  /**
   * Call a function for each array we are leaving.
   * Update the array "currentlyVisitedArrays": it removes array names we leave
   *
   * @param {array} currentlyVisitedArrays (modified) : currently visited arrays. Ex ['d', 'site']
   * @param {object} objDependencyDescriptor : descriptor returned by extracter
   * @param {string} nextAttrName : next attribute name of the descriptor we will visit
   * @param {function} execute(exitedArrayName) : called for each array we are leaving.
   */
  forEachArrayExit : function(currentlyVisitedArrays, objDependencyDescriptor, nextAttrName, execute){
    var _currentParentAttr = '';
    if(objDependencyDescriptor[nextAttrName] !== undefined){
      _currentParentAttr = objDependencyDescriptor[nextAttrName].parent;
    }
    if(currentlyVisitedArrays.length>0){
      var _firstParentOfTypeArray = _currentParentAttr;
      //go up in the tree until we meet an array
      while(_firstParentOfTypeArray !== '' && objDependencyDescriptor[_firstParentOfTypeArray].type !== 'array'){
        _firstParentOfTypeArray = objDependencyDescriptor[_firstParentOfTypeArray].parent;
      };
      var _lastArrayName = currentlyVisitedArrays[currentlyVisitedArrays.length-1];
      while(_firstParentOfTypeArray !== _lastArrayName && currentlyVisitedArrays.length>0){
        execute(_lastArrayName);
        currentlyVisitedArrays.pop();
        if(currentlyVisitedArrays.length>0){
          _lastArrayName = currentlyVisitedArrays[currentlyVisitedArrays.length-1];
        }
      }
    }
  },

  /**
   * Generate a function which will return an array of strings.
   * This array of strings will be sorted and assemble by assembleXmlParts to get final result.
   *
   * @param {object} descriptor : data descriptor computed by the analyzer
   * @return {function} f
   */
  getBuilderFunction : function(descriptor){
    var that = this;
    //declare an object which will contain all the code (by section) of the generated function
    var _code = {
      'init':'',
      'prev':'',
      'main':'',
      'add':function(){
        var _lastIndex = arguments.length - 1;
        var _str = arguments[_lastIndex];
        for (var i = 0; i < _lastIndex; i++) {
          this[arguments[i]] += _str;
        };
      }
    };
    _code.add('prev', addIfNotExist.toString()+'\n'+removeFrom.toString()+'\n');
    _code.add('init', "var _strResult = '';\n");
    _code.add('init', "var _root = (data !== null)?data:{};\n");
    _code.add('init', "var _strPart = {};\n");
    _code.add('init', "var _strParts = [];\n");
    _code.add('init', "var _xmlPos = [0];\n");

    var _atLeastOneSpecialIterator = false;
    //_str += "var _nestedArrayParams = [];\n";
    var _lastArrayEnd = 0;
    var _nestedArray = [];
    var _keepHighestPosition = 0;
    var _nbCustomIterator = 0;

    var _dynamicData = descriptor.dynamicData || {};
    var _staticData = descriptor.staticData || {};
    var _hierarchy = descriptor.hierarchy || [];

    if(_staticData.before !== ''){
      _code.add('main', "_strPart = {\n");
      _code.add('main', "  'pos' : [0],\n");
      _code.add('main', "  'str' : '"+_staticData.before + "'\n");
      _code.add('main', "};\n");
      _code.add('main', "_strParts.push(_strPart);\n");
    }

    //no iterator template optimisation
    var _noIteratorTemplate = true;
    for( exitedArrayName in _dynamicData ){
      if(_dynamicData[exitedArrayName].iterators !== undefined && _dynamicData[exitedArrayName].iterators.length > 0 ){
        _noIteratorTemplate = false;
        //TODO break;
      }
    }
    if( _noIteratorTemplate ){
      _code.add('main', "var _registeredXml = {};\n");
    }

    //declare all variables
    for(var _objName in _dynamicData){
      //the root "_" object is already declared above
      if(_objName !== '_root' ){
        _code.add('init', "var "+_objName+" = {};\n");
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
      var _beforeStr = _dynamicData[_objName].before;


      //close nested for-loop brackets
      that.forEachArrayExit(_nestedArray, _dynamicData, _objName, function(exitedArrayName){
        _code.add('prev','main', "}\n");
        if(_dynamicData[exitedArrayName].iterators !== undefined){
          _nbCustomIterator -= _dynamicData[exitedArrayName].iterators.length-1;
        }
      });

      //Object type
      if(_type === 'object'){
        //declare any nested object
        if(_objName!=='_root'){
          if(_atLeastOneSpecialIterator===true){
            _code.add('main', "if("+ _objParentName +" !== undefined){\n");
          }
          _code.add('prev','main', _objName+"="+ _objParentName+"['"+_realObjName+"'];\n");
          if(_atLeastOneSpecialIterator===true){
            _code.add('main', "}else{\n");
            _code.add('main', _objName+"={}\n");
            _code.add('main', "}\n");
          }
        }
      }
      //Array type
      else if(_type === 'array'){
        var _posStart = _dynamicData[_objName].position.start;
        var _posEnd = _dynamicData[_objName].position.end;
        var _arrayIndexName = _objName+"_i";
        var _arrayName = _objName+"_array";
        var _iterators = _dynamicData[_objName].iterators;
        var _containSpecialIterator = _dynamicData[_objName].containSpecialIterator;



        _code.add('main', "_xmlPos["+(_nbCustomIterator+_arrayDepth*2-2)+"] = "+_posStart+";\n");
        _code.add('main', "_xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_posStart+";\n");

        //declare any nested object
        if(_objName!=='_root'){
          _code.add('prev', 'main', "var "+_arrayName+"="+ _objParentName+"['"+_realObjName+"'];\n");
        }
        else{
          _code.add('prev', 'main', "var "+_arrayName+"="+ _objName+";\n");
        }
        //keep the end of the array
        _lastArrayEnd = (_posEnd>_lastArrayEnd)? _posEnd : _lastArrayEnd;

        //add xml which are before the array repetition section
        if(_beforeStr !== undefined && _beforeStr !== ''){
          _code.add('main', "_strPart = {\n");
          _code.add('main', "  'pos' :  _xmlPos.slice(0, "+(_nbCustomIterator+_arrayDepth*2-1)+"),\n");
          _code.add('main', "  'str' : '"+_beforeStr + "'\n");
          _code.add('main', "};\n");
          _code.add('main', "_strParts.push(_strPart);\n");
        }
        //store array name
        _nestedArray.push(_objName);
        if(_containSpecialIterator===true){
          var _missingIteratorArrayName = _arrayName+"_missingIterators";
          _code.add('main'       , "var "+_missingIteratorArrayName+"=[];\n");
        }
        _code.add('prev','main', "var "+_arrayName+"_length = ("+_arrayName+" instanceof Array)?"+_arrayName+".length : 0;\n");
        _code.add('prev','main', "for (var "+_arrayIndexName+" = 0; "+_arrayIndexName+" < "+_arrayName+"_length ");
        if(_containSpecialIterator===true){
          _code.add(       'main', "  | "+_missingIteratorArrayName+".length>0");
        }
        _code.add('prev','main', "  ; "+_arrayIndexName+"++) {\n");
        _code.add('prev','main', "  var "+_objName+" = "+_arrayName+"["+_arrayIndexName+"];\n");

        //use a custom iterator?
        for (var it = 0; it < _iterators.length; it++) {
          var _iterator = _iterators[it];
          if(it>0){
            _nbCustomIterator++;
          }
          if(_iterator.attr === 'i'){
            _code.add('main', "  _xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_arrayIndexName+";\n");
          }
          else{
            var _iteratorName = _objName+"_it";
            var _iteratorObjName = _objName+"_itObj";
            _code.add('prev', 'main', " var "+_iteratorName+" = 0;\n"); //TODO return errors if the iterator is not defined
            if(_containSpecialIterator===true){
              _code.add('main', "if("+ _objName +" !== undefined){\n");
            }
            //the iterator is inside an object
            if(_iterator.obj !== undefined){
              _code.add('prev','main', " var "+_iteratorObjName+" = "+_objName+"['"+_iterator.obj+"'];\n");
              _code.add('prev','main', " if("+_iteratorObjName+" !== undefined) {\n");
              _code.add('prev','main', "   "+_iteratorName+" = "+_iteratorObjName+"['"+_iterator.attr+"'];\n");
              _code.add('prev','main', " }\n");
            }
            else{
              _code.add('prev','main', " "+_iteratorName+" = "+_objName+"['"+_iterator.attr+"'];\n");
            }
            if(_containSpecialIterator===true){
              _code.add('main', "  removeFrom("+_missingIteratorArrayName+", "+_iteratorName+");\n");
              _code.add('main', "}else{\n");
              _code.add('main', "  "+_iteratorName+" = "+_missingIteratorArrayName+".pop();\n");
              _code.add('main', "}\n");
            }
            _code.add('main', "  _xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_iteratorName+";\n");
            //count the number of custom iterator
            //_str += "  _xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_arrayIndexName+";\n";
            if(_iterator.isSpecial === true){
              _atLeastOneSpecialIterator = true;
              var _allIteratorArrayName = _iteratorName + "_wanted";
              _code.main = _code.main.replace(_missingIteratorArrayName+"=[]", _missingIteratorArrayName+"="+_allIteratorArrayName+".slice()");
              _code.add('init', "var "+_allIteratorArrayName+"=[];\n");
              _code.add('prev', " addIfNotExist("+_allIteratorArrayName+", "+_iteratorName+");\n");
            }
          }
        };
      }
      //Generate code which will concatenate each xml parts
      for (var i = 0; i < _xmlParts.length; i++) {
        var _xmlPart = _xmlParts[i];
        var _dataObj = _xmlPart.obj;
        var _dataAttr = _xmlPart.attr;
        var _partDepth = _xmlPart.depth;
        var _formatters = _xmlPart.formatters || [];
        var _conditions = _xmlPart.conditions || [];

        //keep highest position for the last xml part
        if(_xmlPart.pos > _keepHighestPosition){
          _keepHighestPosition = _xmlPart.pos;
        }
        //console.log('\n_nbCustomIterator:'+_nbCustomIterator);
        //console.log('\npartDepth:'+_partDepth);
        //console.log('\npartDepth2:'+(_nbCustomIterator+_partDepth*2));
        //console.log('\n');
        //create the xml part and set its absolute position in the xml
        _code.add('main', "_xmlPos["+(_nbCustomIterator+_partDepth*2)+"] = "+_xmlPart.pos+";\n");
        _code.add('main', "_strPart = {\n");
        _code.add('main', "  'pos' : _xmlPos.slice(0, "+(_nbCustomIterator+_partDepth*2+1)+"),\n");
        _code.add('main', "  'str'    : ''\n");
        _code.add('main', "};\n");
        if(_xmlPart.before){
          _code.add('main', "_strPart.str = '"+_xmlPart.before + "';\n");
        }
        if(_xmlPart.array === 'start'){
          _code.add('main', "_strPart.rowStart = true;\n");
        }
        else if (_xmlPart.array === 'end'){
          _code.add('main', "_strPart.rowEnd = true;\n");
        }
        //insert the data only if it not null
        if(_dataAttr){
          var _field = that.getFormatterString(_dataObj + "['" + _dataAttr + "']", _formatters);
          //handle conditions
          _code.add('main', '_strPart.rowShow = true;\n');
          _code.add('main', that.getFilterString(_conditions, '_strPart.rowShow = false', _objName, true));
          _code.add('main', "if("+ _dataObj +" !== undefined){\n");
          _code.add('main', "var _str = " + _field + ";\n");
          //replace null or undefined value by an empty string
          _code.add('main', "if(_str === null || _str === undefined) {\n");
          _code.add('main', "  _str = '';\n");
          _code.add('main', "};\n");
          //escape special characters for xml if the data is a string
          _code.add('main', "if(typeof(_str) === 'string') {\n");
          _code.add('main', "  _str = _str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n");
          _code.add('main', "};\n");
          _code.add('main', "_strPart.str += (_strPart.rowShow !== false)?_str:''"+";\n");
          _code.add('main', "}\n");
        }
        if(_xmlPart.after){
          _code.add('main', "_strPart.str += '"+_xmlPart.after + "';\n");
        }
        //push the xml part in a array (this array will be sorted at the end)
        //add this if there is an iterator ( template is using i+1 form )
        if( _noIteratorTemplate === false ){
          _code.add('main', "_strParts.push(_strPart);\n");
        //when no iterator only push when the part position is new or rowshow is true
        } else {
          _code.add('main', "if(_registeredXml["+_xmlPart.pos+"] !== true || _strPart.rowShow === true ) {\n");
          _code.add('main', "  _strParts.push(_strPart);\n");
          _code.add('main', "  _registeredXml["+_xmlPart.pos+"] = true;\n");
          _code.add('main', "};\n");
        }
      }
    }
    //close previously created for-loops
    while(_nestedArray.length > 0){
      _code.add('prev', 'main', "}\n");
      _nestedArray.pop();
    }
    if(_staticData.after !== ''){
      _code.add('main', "_strPart = {\n");
      _code.add('main', "  'pos' : ["+(_keepHighestPosition+1)+"],\n");
      _code.add('main', "  'str' : '"+_staticData.after + "'\n");
      _code.add('main', "};\n");
      _code.add('main', "_strParts.push(_strPart);\n");
    }
    _code.add('main', 'return _strParts;');

    var _codeAssembled = _code.init;
    if(_atLeastOneSpecialIterator===true){
      _codeAssembled += _code.prev;
    }
    _codeAssembled += _code.main;
    //console.log(_codeAssembled, '\n\n');
    //The function is built, we compile it and check errors in the same time
    var _fn;
    try{
      _fn = new Function('data', 'formatters', _codeAssembled);
    }
    catch (err){
      throw new Error('getSubstitutionFunction: Impossible to generate the XML builder.\n'+err+'\n--------------------------------\n'+_codeAssembled+'\n--------------------------------\n');
    }
    return _fn;
  }

};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/

module.exports = builder;


/**
 * Test if two arrays are equal
 * @param  {Array}  arrA
 * @param  {Array}  arrB
 * @return {Boolean}  true if the two arrays are equals, false otherwise
 */
function isArrayEqual(arrA, arrB){
  var _arrALength = arrA.length;
  var _arrBLength = arrB.length;
  if(_arrALength !== _arrBLength){
    return false;
  }
  for (var i = 0; i < _arrALength; i++) {
    if(arrA[i] !== arrB[i]){
      return false;
    }
  };
  return true;
}

/**
 * Add an element in the array if does not already exist
 * @param {Array} arr   array
 * @param {Mixed} value value
 */
function addIfNotExist(arr, value){
  for (var i = 0; i < arr.length; i++) {
    var _value = arr[i];
    if(_value === value){
      return;
    }
  };
  arr.push(value);
}

/**
 * Find and remove the element of the array
 * @param  {Array} arr   array
 * @param  {Mixed} value value
 * @return {Array}       array modified
 */
function removeFrom(arr, value){
  for (var i = 0; i < arr.length; i++) {
    if(arr[i]===value){
      arr.splice(i, 1);
      return arr;
    }
  };
  return arr;
}


