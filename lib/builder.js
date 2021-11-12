var extracter = require('./extracter');
var parser = require('./parser');
var helper = require('./helper');

var builder = {

  /**
   * Build the xml according to the data
   * @param  {String}       xml        xml to parse
   * @param  {Object|Array} data
   * @param  {Object}       options {
   *                                  'complement'        : data which accessible with the market {c.}
   *                                  'formatters'        : formatters
   *                                  'lang'              : selected lang, ex. "fr"
   *                                  'translations'      : all translations {fr: {}, en: {}, es: {}}
   *                                  'existingVariables' : existing variables (Array returned by parser.findVariables())
   *                                  'extension'         : template file extension
   *                                }
   * @param  {Function}     callback
   */
  buildXML : function (xml, data, options, callback) {
    if (typeof(options) === 'function') {
      callback = options;
      options = {};
    }

    // find declared variable {#myVar }
    parser.findVariables(xml, options.existingVariables, function (err, xmlWithoutVariable, variables) {
      // find markers { d. } or { c. }
      parser.findMarkers(xmlWithoutVariable, function (err, xmlWithoutMarkers, markers) {
        // exit if there is no markers
        if (markers.length === 0) {
          return callback(null, xmlWithoutVariable);
        }
        parser.preprocessMarkers(markers, variables, function (err, preprocessedMarkers) {
          var _xmlParts = [];
          var _xmlResult = '';
          try {
            var _dynamicDescriptor = extracter.splitMarkers(preprocessedMarkers);
            var _descriptor = extracter.splitXml(xmlWithoutMarkers, _dynamicDescriptor);
            _descriptor = extracter.buildSortedHierarchy(_descriptor);
            _descriptor = extracter.deleteAndMoveNestedParts(_descriptor);
            var _builder = builder.getBuilderFunction(_descriptor, options.formatters);
            var _obj = {
              d : data,
              c : options.complement
            };
            options.stopPropagation = false;
            _xmlParts = _builder(_obj, options, helper, _builder.builderDictionary);
            _xmlResult = builder.assembleXmlParts(_xmlParts, 20, _builder.builderDictionary); // TODO -> adapt the depth of the sort according to the maximum depth in _xmlParts
          }
          catch (e) {
            return callback(e, null);
          }
          return callback(null, _xmlResult);
        });
      });
    });
  },

  /**
   * Creates a string of the formatter(s) function(s) call of the attribute
   * INTERNAL USE ONLY
   *
   * @param  {Function} getSafeValue generate safe value accessor
   * @param  {String} attr. Example 'd.number'
   * @param  {Array} formatters. Example [ 'int', 'toFixed(2)' ]
   * @param  {Object} existingFormatters
   * @param  {Boolean} onlyFormatterWhichInjectXML  : if undefined|false, it returns only formatters which do not inject XML
   *                                                  if true, it returns only formatters which do inject XML. These formatters have
   *                                                  the property canInjectXML = true
   * @return {String}. Example 'toFixed(int(d.number), 2)'
   */
  getFormatterString : function (getSafeValue, varName, contextName, formatters, existingFormatters, onlyFormatterWhichInjectXML) {
    var _lineOfCodes = [];
    for (var i = 0; i < formatters.length; i++) {
      var _formatter = formatters[i];
      // Percent-Encode the commas when the paramater is string with single quotes: ',' to '%2c'
      _formatter = _formatter.replace(/[']{1}[^']*[']{1}/g, function (matched) {
        return matched.replace(/,/g, '%2c');
      });
      var _indexFirstParenthesis = _formatter.indexOf('(');
      var _argumentStr = '';
      var _functionStr = '';
      // this function contains arguments
      if (_indexFirstParenthesis !== -1) {
        _functionStr = _formatter.slice(0, _indexFirstParenthesis);
        var _indexLastParenthesis = _formatter.lastIndexOf(')'); // TODO error if last Parenthesis is not found
        var _arguments = _formatter.slice(_indexFirstParenthesis+1, _indexLastParenthesis).split(/ *, */);
        for (var j = 0; j < _arguments.length; j++) {
          if (_arguments[j] !== '') {
            // remove existing quotes (everything is converted to a string for the momemt. It should change in the future)
            // Percent-Decode the commas to obtain the initial string argument: '%2c' to ','
            var _argument = _arguments[j].replace(/^ *'?/, '').replace(/'? *$/, '').replace(/%2c/g, ',');
            var _injectedArgument = getSafeValue(_argument);
            if (_argument.startsWith('.') === true) {
              var _nbPoint = 0;
              for (; _argument[_nbPoint] === '.'; _nbPoint++) {
                // count number of point nothing
              }
              var _dynamicVariable = _argument.slice(_nbPoint);
              // TODO warn if undefined variable
              _injectedArgument = 'helper.getValueOfPath( '+contextName+'.parentsData['+(_nbPoint-1)+'], '+getSafeValue(_dynamicVariable)+')';
            }
            _argumentStr += `, ${_injectedArgument}`;
          }
        }
      }
      else {
        _functionStr = _formatter;
      }
      if (existingFormatters[_functionStr] === undefined) {
        var _alternativeFnName = helper.findClosest(_functionStr, existingFormatters);
        throw Error('Formatter "'+_functionStr+'" does not exist. Do you mean "'+_alternativeFnName+'"?');
      }
      if ( (existingFormatters[_functionStr].canInjectXML === true && onlyFormatterWhichInjectXML === true)
        || (existingFormatters[_functionStr].canInjectXML !== true && onlyFormatterWhichInjectXML !== true)) {
        _lineOfCodes.push(varName +' = formatters.' + _functionStr + '.call(' + contextName + ', ' + varName + _argumentStr + ');\n');
      }
    }
    var _str = _lineOfCodes.join('if('+contextName+'.stopPropagation === false){\n');
    var _nbClosingBraces = _lineOfCodes.length - 1;
    while (_nbClosingBraces-- > 0) {
      _str += '}';
    }
    return _str;
  },

  /**
   * build the condition string which will be used to filter rows
   *
   * @param {Function} getSafeVar   : generate safe variable
   * @param {Function} getSafeValue : generate safe value accessor
   * @param {array} conditions : array of conditions. Example [{'left':'sort', 'operator':'>', 'right':'10'}]
   * @param {string} codeIfTrue : code to insert if the condition is true. Example 'row = true'
   * @param {string} prefix (optional) : if we need to create local variable, this prefix will be added in front of the variable.
   * @param {boolean} inverseCondition (optional, default false) : if true, it will inverse the condition
   * @param {string} forceObjectTested (optional) : use forceObjectTested instead of _condition.left.parent
   * @return {string}. Example : 'if(d.number['sort'] > 10) { row = true }'
   */
  getFilterString : function (getSafeVar, getSafeValue,  conditions, codeIfTrue, prefix, inverseCondition, forceObjectTested) {
    prefix = prefix || '';
    if (!codeIfTrue || !(conditions instanceof Array) || conditions.length ===0) {
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
      if (forceObjectTested) {
        _objName = forceObjectTested;
      }
      // if the left part is an object
      var _objectSeparatorIndex = _attr.indexOf('.');
      if (_objectSeparatorIndex !== -1) {
        var _obj = _attr.slice(0, _objectSeparatorIndex);
        _attr = _attr.slice(_objectSeparatorIndex+1);
        var _subObjName = '_'+prefix+_obj+'_filter';
        if (_alreadyDeclaredFilter[_subObjName] === undefined) {
          _declareStr += 'var '+getSafeVar(_subObjName)+'='+getSafeVar(_objName)+'['+getSafeValue(_obj)+'];\n';
        }
        _objName = _subObjName;
      }
      if (_attr === 'i') {
        var _rightOperator = parseInt(_condition.right, 10);
        var _arrayName = _condition.left.parent;
        if (parseInt(_condition.right, 10) < 0) {
          _rightOperator = getSafeVar(_arrayName) + '_array_length ' +  parseInt(_condition.right, 10);
        }
        _str += getSafeVar(_arrayName) + '_i '+_condition.operator + _rightOperator;
      }
      else {
        if (_alreadyDeclaredFilter[_objName] === undefined) {
          _str += getSafeVar(_objName) + ' && ';
        }
        _str += getSafeVar(_objName)+'['+getSafeValue(_attr)+']';
        if (_condition.right === 'true' || _condition.right === 'false') {
          // for boolean, convert data to string to accept both cases ('true' == true) and (true == true) for backward compatibility with Carbone v1 & v2
          _str += "+''";
        }
        _str += _condition.operator + getSafeValue(helper.removeQuote(_condition.right));
      }
      if (c < conditions.length - 1) {
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
   * @param {array} builderDictionary : xml part coming from template
   * @return {string} final result
   */
  assembleXmlParts : function (arrayOfStringPart, sortDepth, builderDictionary) {
    var _res = '';
    builder.sortXmlParts(arrayOfStringPart);
    var _rowInfo = [];
    var _prevDepth = 0;
    var _prevPart = {pos : []};
    var _arrayLevel = 0;
    var _loopIds = {};
    var _hideBlock = 0;
    var _prevHideBlock = 0;

    // TODO MANAGE  sortDepth
    sortDepth = (sortDepth) ? sortDepth : 1;
    // init _rowInfo
    for (var loop = 0; loop <= sortDepth; loop++) {
      _rowInfo.push({
        xmlPos  : 0,
        rowShow : 0
      });
    }
    for (var i = 0; i < arrayOfStringPart.length; i++) {
      var _part = arrayOfStringPart[i];
      var _str = '';
      // Get count value if needed
      builder.getLoopIteration(_loopIds, _part);
      // keep parts if positions are not the same as the last one OR if the it the beginning of an array
      if ((_prevPart.rowStart === true && _part.rowStart !== true) || isArrayEqual(_prevPart.pos, _part.pos) === false) {
        _prevPart = _part;
      }
      else {
        continue;
      }
      _prevHideBlock = _hideBlock;
      if (_part.hide !== undefined) {
        _hideBlock += (_hideBlock && 1) | _part.hide;
        if (_hideBlock < 0) {
          _hideBlock = 0;
        }
      }
      if (_hideBlock > 0 && _prevHideBlock > 0) {
        continue;
      }
      // include "before" XML string all the time, except at the end of if block
      if (!(_hideBlock === 0 && _prevHideBlock > 0)) {
        _str = _part.bef !== undefined ? builderDictionary[_part.bef] : '';
      }
      // include "after" XML string and the value to inject (_part.str) all the time, except at the beginning of if block
      if (!(_hideBlock > 0 && _prevHideBlock === 0)) {
        _str += _part.str;
        _str += _part.aft !== undefined ? builderDictionary[_part.aft] : '';
      }
      _res += _str;

      var _depth = _part.pos.length;
      if (_prevDepth < _depth) {
        _arrayLevel++;
      }
      else if (_prevDepth > _depth) {
        _arrayLevel--;
      }
      _prevDepth = _depth;

      // TODO. Protection if sortDepth is too short
      if (_rowInfo[_arrayLevel] === undefined) {
        _rowInfo[_arrayLevel] = {
          xmlPos  : 0,
          rowShow : 0
        };
      }
      _rowInfo[_arrayLevel].rowShow |= _part.rowShow;
      if (_part.rowStart===true) {
        _rowInfo[_arrayLevel].xmlPos = _res.length - _str.length;
      }
      else if (_part.rowEnd===true) {
        if (_rowInfo[_arrayLevel].rowShow === 0) {
          _res = _res.slice(0, _rowInfo[_arrayLevel].xmlPos);
        }
        if (_arrayLevel > 0) {
          _rowInfo[_arrayLevel-1].rowShow |= _rowInfo[_arrayLevel].rowShow;
        }
        _rowInfo[_arrayLevel].rowShow = 0;
      }
    }
    return _res;
  },

  /**
   * Replace __COUNT_*_*__ by the right value (part.str)
   * INTERNAL USE ONLY (USED ONLY BY assembleXmlParts)
   *
   * @param {Object} loopIds  Stored loop IDs with their start value
   * @param {Object} part     Xml part
   */
  getLoopIteration : function (loopIds, part) {
    var _rowColumnRegex = /__COUNT_(\d*?)_(\d*?)__/;
    var _rowColumnMatch = _rowColumnRegex.exec(part.str);

    // If we match a COUNT marker
    if (_rowColumnMatch !== null && part.rowShow === true) {
      var _loopId = _rowColumnMatch[1];
      var _loopStart = _rowColumnMatch[2];

      // Define loop ID if does not exist
      if (loopIds[_loopId] === undefined) {
        loopIds[_loopId] = _loopStart;
      }
      // And replace by the good value
      part.str = part.str.replace(_rowColumnMatch[0], loopIds[_loopId]++);
    }
  },

  /**
   * Sort the special array which is generated by the function returned by getBuilderFunction.
   * INTERNAL USE ONLY (USED ONLY BY assembleXmlParts)
   *
   * @param {array} arrayToSort : array of objects
   */
  sortXmlParts : function (arrayToSort) {

    function compare (a, b) {
      var i = 0;
      var _a = a.pos[i];
      var _b = b.pos[i];
      var _aLength = a.pos.length;
      var _bLength = b.pos.length;
      while (_a === _b && i < _aLength && i < _bLength) {
        i++;
        _a = a.pos[i];
        _b = b.pos[i];
      }
      if (_a !== undefined && _b !== undefined) {
        return (_a > _b) ? 1 : -1;
      }
      if (_a === undefined && _b === undefined && a.rowShow !== b.rowShow) {
        return (a.rowShow === false && b.rowShow === true) ? 1 : -1;
      }
      return _aLength - _bLength;
    }

    return arrayToSort.sort(compare);
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
  forEachArrayExit : function (currentlyVisitedArrays, objDependencyDescriptor, nextAttrName, execute) {
    var _currentParentAttr = '';
    if (objDependencyDescriptor[nextAttrName] !== undefined) {
      _currentParentAttr = objDependencyDescriptor[nextAttrName].parent;
    }
    if (currentlyVisitedArrays.length>0) {
      var _firstParentOfTypeArray = _currentParentAttr;
      // go up in the tree until we meet an array
      while (_firstParentOfTypeArray !== '' && objDependencyDescriptor[_firstParentOfTypeArray].type !== 'array') {
        _firstParentOfTypeArray = objDependencyDescriptor[_firstParentOfTypeArray].parent;
      }
      var _lastArrayName = currentlyVisitedArrays[currentlyVisitedArrays.length-1];
      var _nextArrayXmlDepth = objDependencyDescriptor[nextAttrName].depth;
      if (_nextArrayXmlDepth === undefined) {
        _nextArrayXmlDepth = -1;
        if (objDependencyDescriptor[_firstParentOfTypeArray] !== undefined && objDependencyDescriptor[_firstParentOfTypeArray].depth !== undefined) {
          _nextArrayXmlDepth = objDependencyDescriptor[_firstParentOfTypeArray].depth;
        }
      }
      var _lastArrayXmlDepth = objDependencyDescriptor[_lastArrayName].depth || Number.MAX_SAFE_INTEGER;
      while (_firstParentOfTypeArray !== _lastArrayName && currentlyVisitedArrays.length>0 && _nextArrayXmlDepth <= _lastArrayXmlDepth) {
        execute(_lastArrayName);
        currentlyVisitedArrays.pop();
        if (currentlyVisitedArrays.length>0) {
          _lastArrayName = currentlyVisitedArrays[currentlyVisitedArrays.length-1];
          _lastArrayXmlDepth = objDependencyDescriptor[_lastArrayName].depth || Number.MAX_SAFE_INTEGER;
        }
      }
    }
  },

  /**
   * Generate safe and unique variable names generator for builder
   *
   * @return {Function} a function which generate variable names
   */
  generateSafeJSVariable : function () {
    let _dictionary = new Map();
    return (jsVariable) => {
      let _alreadyCreatedVar = _dictionary.get(jsVariable);
      if (_alreadyCreatedVar !== undefined) {
        return _alreadyCreatedVar;
      }
      let _newVar = '_gV' + _dictionary.size;
      _dictionary.set(jsVariable, _newVar);
      return _newVar;
    };
  },

  /**
   * Generate a functions which store and get values coming from insecure
   * source (XMl, carbone markers in document, formatters variable, ...) in a dictionary
   *
   * @param  {String} dictionaryName name of the dictionary in the builder function
   */
  generateSafeJSValueAccessor : function (dictionaryName) {
    let _dictionaryIndex = new Map();
    let _dictionary      = [];

    function getIndex (xmlOrConstantValue) {
      let _dictIndex = _dictionaryIndex.get(xmlOrConstantValue);
      if (_dictIndex !== undefined) {
        return _dictIndex;
      }
      _dictIndex = (_dictionary.push(xmlOrConstantValue) - 1);
      _dictionaryIndex.set(xmlOrConstantValue, _dictIndex);
      return _dictIndex;
    }
    return {
      // get index where the value or XML part is stored in the dictionary
      getIndex : getIndex,
      // get the JS code to access securely to a dictionary's value in the builder function
      get      : function (xmlOrConstantValue) {
        let _dictIndex = getIndex(xmlOrConstantValue);
        return dictionaryName + '[' + _dictIndex + ']';
      },
      // get the dictionary
      getDictionary : function () {
        return _dictionary;
      }
    };
  },

  /**
   * Generate a function which will return an array of strings.
   * This array of strings will be sorted and assemble by assembleXmlParts to get final result.
   *
   * @param {object} descriptor : data descriptor computed by the analyzer
   * @return {function} f
   */
  getBuilderFunction : function (descriptor, existingFormatters) {
    var that = this;
    // declare an object which will contain all the code (by section) of the generated function
    var _code = {
      init : '',
      prev : '',
      main : '',
      add  : function () {
        var _lastIndex = arguments.length - 1;
        var _str = arguments[_lastIndex];
        for (var i = 0; i < _lastIndex; i++) {
          this[arguments[i]] += _str;
        }
      }
    };
    var _getSafeVar     = that.generateSafeJSVariable();
    var _dictionaryName = '_dictionary';
    var _safeAccessor   = that.generateSafeJSValueAccessor(_dictionaryName);
    var _getSafeValue   = _safeAccessor.get;
    var _getXMLStrIndex = _safeAccessor.getIndex;
    _code.add('prev', addIfNotExist.toString()+'\n'+removeFrom.toString()+'\n');
    _code.add('init', "var _strResult = '';\n");
    _code.add('init', 'var '+_getSafeVar('_root') + '= (data !== null)?data:{};\n');
    _code.add('init', 'var _strPart = {};\n');
    _code.add('init', 'var _strParts = [];\n');
    _code.add('init', 'var _xmlPos = [0];\n');
    _code.add('init', 'var formatters = context.formatters;\n'); // used by getFormatterString

    var _atLeastOneSpecialIterator = false;
    // _str += "var _nestedArrayParams = [];\n";
    var _lastArrayEnd = 0;
    var _nestedArray = [];
    var _keepHighestPosition = 0;
    var _nbCustomIterator = 0;

    var _dynamicData = descriptor.dynamicData || {};
    var _staticData = descriptor.staticData || {};
    var _hierarchy = descriptor.hierarchy || [];

    if (_staticData.before !== '') {
      _code.add('main', '_strPart = {\n');
      _code.add('main', "  'pos' : [0],\n");
      _code.add('main', "  'str' : '',\n");
      _code.add('main', "  'bef' : "+_getXMLStrIndex(_staticData.before) + '\n');
      _code.add('main', '};\n');
      _code.add('main', '_strParts.push(_strPart);\n');
    }

    // no iterator template optimisation
    var _noIteratorTemplate = true;
    for (var exitedArrayName in _dynamicData ) {
      if (_dynamicData[exitedArrayName].iterators !== undefined && _dynamicData[exitedArrayName].iterators.length > 0 ) {
        _noIteratorTemplate = false;
        // TODO break;
      }
    }
    if ( _noIteratorTemplate ) {
      _code.add('main', 'var _registeredXml = {};\n');
    }

    // declare all variables
    for (var _objNameDeclaration in _dynamicData) {
      // the root "_" object is already declared above
      if (_objNameDeclaration !== '_root' ) {
        _code.add('init', 'var '+_getSafeVar(_objNameDeclaration)+' = {};\n');
      }
    }

    // For each object, generate the code
    for (var _objIndex = 0; _objIndex < _hierarchy.length; _objIndex++) {
      var _objName = _hierarchy[_objIndex];
      var _realObjName = _getSafeValue(_dynamicData[_objName].name);
      var _type = _dynamicData[_objName].type;
      var _objParentName = _dynamicData[_objName].parent;
      var _objParentNames = _dynamicData[_objName].parents.reverse();
      var _xmlParts = _dynamicData[_objName].xmlParts;
      var _arrayDepth = _dynamicData[_objName].depth || 0;
      var _beforeStr = _dynamicData[_objName].before;


      // close nested for-loop brackets
      that.forEachArrayExit(_nestedArray, _dynamicData, _objName, function (exitedArrayName) {
        _code.add('prev','main', '}\n');
        if (_dynamicData[exitedArrayName].iterators !== undefined) {
          _nbCustomIterator -= _dynamicData[exitedArrayName].iterators.length-1;
        }
      });

      // Object type
      if (_type === 'object') {
        // declare any nested object
        if (_objName!=='_root') {
          _code.add('prev','main', _getSafeVar(_objName)+'='+'('+_getSafeVar(_objParentName)+' instanceof Object)?'+_getSafeVar(_objParentName)+'['+_realObjName+']:{};\n');
        }
      }
      else if (_type === 'objectInArray') {
        var _arrayOfObjectNameG = _getSafeVar(_objName)+'_array';
        var _arrayOfObjectIndexNameG = _getSafeVar(_objName)+'_i';
        _code.add('prev','main', 'var ' + _arrayOfObjectNameG+'='+'('+_getSafeVar(_objParentName)+' instanceof Object)? '+_getSafeVar(_objParentName)+'['+_realObjName+']:[];\n');
        var _conditionToFindObject = _dynamicData[_objName].conditions || [];
        var _objNameTemp = _objName+'_temp';

        _code.add('prev', 'main', _getSafeVar(_objName) + '={};\n');
        _code.add('prev', 'main', 'var '+_arrayOfObjectNameG+'_length = ('+_arrayOfObjectNameG+' instanceof Array)?'+_arrayOfObjectNameG+'.length : 0;\n');
        _code.add('prev', 'main', 'for (var '+_arrayOfObjectIndexNameG+' = 0; '+_arrayOfObjectIndexNameG+' < '+_arrayOfObjectNameG+'_length ; '+_arrayOfObjectIndexNameG+'++) {\n');
        _code.add('prev', 'main', '  var '+_getSafeVar(_objNameTemp)+' = '+_arrayOfObjectNameG+'['+_arrayOfObjectIndexNameG+'];\n');
        _code.add('prev', 'main', that.getFilterString(_getSafeVar, _getSafeValue, _conditionToFindObject, _getSafeVar(_objName)+'='+_arrayOfObjectNameG+'['+_arrayOfObjectIndexNameG+'];\n break;\n', _objNameTemp, false, _objNameTemp));
        _code.add('prev', 'main', '}\n');
      }
      // Array type
      else if (_type === 'array') {
        var _posStart = _dynamicData[_objName].position.start;
        var _posEnd = _dynamicData[_objName].position.end;
        var _arrayIndexNameG = _getSafeVar(_objName)+'_i';
        var _arrayNameG = _getSafeVar(_objName)+'_array';
        var _iterators = _dynamicData[_objName].iterators;
        var _containSpecialIterator = _dynamicData[_objName].containSpecialIterator;



        _code.add('main', '_xmlPos['+(_nbCustomIterator+_arrayDepth*2-2)+'] = '+_posStart+';\n');
        _code.add('main', '_xmlPos['+(_nbCustomIterator+_arrayDepth*2-1)+'] = '+_posStart+';\n');

        // declare any nested object
        if (_objName!=='_root') {
          _code.add('prev', 'main', 'var '+_arrayNameG+'='+'('+ _getSafeVar(_objParentName)+' instanceof Object) ?'+ _getSafeVar(_objParentName)+'['+_realObjName+']:[];\n');
        }
        else {
          _code.add('prev', 'main', 'var '+_arrayNameG+'='+ _getSafeVar(_objName)+';\n');
        }
        // keep the end of the array
        _lastArrayEnd = (_posEnd>_lastArrayEnd)? _posEnd : _lastArrayEnd;

        // add xml which are before the array repetition section
        if (_beforeStr !== undefined && _beforeStr !== '') {
          _code.add('main', '_strPart = {\n');
          _code.add('main', "  'pos' :  _xmlPos.slice(0, "+(_nbCustomIterator+_arrayDepth*2-1)+'),\n');
          _code.add('main', "  'str' : '',\n");
          _code.add('main', "  'bef' : "+_getXMLStrIndex(_beforeStr) + '\n');
          _code.add('main', '};\n');
          _code.add('main', '_strParts.push(_strPart);\n');
        }
        // store array name
        _nestedArray.push(_objName);
        var _missingIteratorArrayNameG = _arrayNameG+'_missingIterators';
        if (_containSpecialIterator===true) {
          _missingIteratorArrayNameG = _arrayNameG+'_missingIterators';
          _code.add('main'       , 'var '+_missingIteratorArrayNameG+'=[];\n');
        }

        _code.add('prev','main', 'var '+_arrayNameG+'_length = 0;\n');
        _code.add('prev','main', 'if ('+_arrayNameG+' instanceof Array) {\n');
        _code.add('prev','main', _arrayNameG+'_length = '+_arrayNameG+'.length;\n');
        _code.add('prev','main', '} else if ('+_arrayNameG+' instanceof Object) {\n');
        _code.add('prev','main', _arrayNameG+' = Object.entries('+_arrayNameG+').map((a) => { return {att : a[0], val : a[1] } });\n');
        _code.add('prev','main', _arrayNameG+'_length = '+_arrayNameG+'.length;\n');
        _code.add('prev','main', '}\n');

        _code.add('prev','main', 'for (var '+_arrayIndexNameG+' = 0; '+_arrayIndexNameG+' < '+_arrayNameG+'_length ');
        if (_containSpecialIterator===true) {
          _code.add(       'main', '  || '+_missingIteratorArrayNameG+'.length>0');
        }
        _code.add('prev','main', '  ; '+_arrayIndexNameG+'++) {\n');
        _code.add('prev','main', '  var '+ _getSafeVar(_objName)+' = '+_arrayNameG+'['+_arrayIndexNameG+'];\n');

        // use a custom iterator?
        for (var it = 0; it < _iterators.length; it++) {
          var _iterator = _iterators[it];
          var _iteratorObjG = _getSafeValue(_iterator.obj);
          var _iteratorAttrG = _getSafeValue(_iterator.attr);
          if (it>0) {
            _nbCustomIterator++;
          }
          if (_iterator.attr === 'i') {
            _code.add('main', '  _xmlPos['+(_nbCustomIterator+_arrayDepth*2-1)+'] = '+_arrayIndexNameG+';\n');
          }
          else {
            var _iteratorNameG = _getSafeVar(_objName)+'_it';
            var _iteratorObjNameG = _getSafeVar(_objName)+'_itObj';
            _code.add('prev', 'main', ' var '+_iteratorNameG+' = 0;\n'); // TODO return errors if the iterator is not defined
            if (_containSpecialIterator===true) {
              _code.add('main', 'if('+ _getSafeVar(_objName) +' !== undefined){\n');
            }
            // the iterator is inside an object
            if (_iterator.obj !== undefined) {
              _code.add('prev','main', ' var '+_iteratorObjNameG+' = '+_getSafeVar(_objName)+'['+_iteratorObjG+'];\n');
              _code.add('prev','main', ' if('+_iteratorObjNameG+' !== undefined) {\n');
              _code.add('prev','main', '   '+_iteratorNameG+' = '+_iteratorObjNameG+'['+_iteratorAttrG+'];\n');
              _code.add('prev','main', ' }\n');
            }
            else {
              _code.add('prev','main', ' '+_iteratorNameG+' = '+_getSafeVar(_objName)+'['+_iteratorAttrG+'];\n');
            }
            if (_containSpecialIterator===true) {
              _code.add('main', '  removeFrom('+_missingIteratorArrayNameG+', '+_iteratorNameG+');\n');
              _code.add('main', '}else{\n');
              _code.add('main', '  '+_iteratorNameG+' = '+_missingIteratorArrayNameG+'.pop();\n');
              _code.add('main', '}\n');
            }
            _code.add('main', '  _xmlPos['+(_nbCustomIterator+_arrayDepth*2-1)+'] = '+_iteratorNameG+';\n');
            // count the number of custom iterator
            // _str += "  _xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_arrayIndexNameG+";\n";
            if (_iterator.isSpecial === true) {
              _atLeastOneSpecialIterator = true;
              var _allIteratorArrayNameG = _iteratorNameG + '_wanted';
              _code.main = _code.main.replace(_missingIteratorArrayNameG+'=[]', _missingIteratorArrayNameG+'='+_allIteratorArrayNameG+'.slice()');
              _code.add('init', 'var '+_allIteratorArrayNameG+'=[];\n');
              _code.add('prev', ' addIfNotExist('+_allIteratorArrayNameG+', '+_iteratorNameG+');\n');
            }
          }
        }
      }
      // Generate code which will concatenate each xml parts
      for (var i = 0; i < _xmlParts.length; i++) {
        var _xmlPart = _xmlParts[i];
        var _dataObj = _xmlPart.obj;
        var _dataAttr = _xmlPart.attr;
        var _partDepth = _xmlPart.depth;
        var _formatters = _xmlPart.formatters || [];
        var _conditions = _xmlPart.conditions || [];

        // keep highest position for the last xml part
        if (_xmlPart.pos > _keepHighestPosition) {
          _keepHighestPosition = _xmlPart.pos;
        }
        // create the xml part and set its absolute position in the xml
        _code.add('main', '_xmlPos['+(_nbCustomIterator+_partDepth*2)+'] = '+_xmlPart.pos+';\n');
        _code.add('main', '_strPart = {\n');
        _code.add('main', "  'pos' : _xmlPos.slice(0, "+(_nbCustomIterator+_partDepth*2+1)+'),\n');
        _code.add('main', "  'str' : ''\n");
        _code.add('main', '};\n');
        if (_xmlPart.before) {
          _code.add('main', '_strPart.bef = '+_getXMLStrIndex(_xmlPart.before) + ';\n');
        }
        if (_xmlPart.array === 'start') {
          _code.add('main', '_strPart.rowStart = true;\n');
        }
        else if (_xmlPart.array === 'end') {
          _code.add('main', '_strPart.rowEnd = true;\n');
        }
        // insert the data only if it not null
        if (_dataAttr) {
          // handle conditions
          _code.add('main', '_strPart.rowShow = true;\n');
          _code.add('main', that.getFilterString(_getSafeVar, _getSafeValue, _conditions, '_strPart.rowShow = false', _getSafeVar(_objName), true));
          _code.add('main', 'var _str = ' + _getSafeVar(_dataObj) + ' !== undefined &&  ' + _getSafeVar(_dataObj) + ' !== null ? ' + _getSafeVar(_dataObj) + '[' + _getSafeValue(_dataAttr) + ']' + ' : undefined ;\n');
          // TODO optimize avoid using all this options for all formatters
          _code.add('main', 'context.stopPropagation = false;\n');
          _code.add('main', 'context.isConditionTrue = null;\n');
          _code.add('main', 'context.isAndOperator = null;\n');
          _code.add('main', 'context.isHidden = null;\n');
          _code.add('main', 'context.parentsData = ['+_getSafeVar(_dataObj)+', '+_objParentNames.map(_getSafeVar).join(',')+'];\n');
          _code.add('main', that.getFormatterString(_getSafeValue, '_str', 'context', _formatters, existingFormatters, false));
          // replace null or undefined value by an empty string
          _code.add('main', 'if(_str === null || _str === undefined) {\n');
          _code.add('main', "  _str = '';\n");
          _code.add('main', '};\n');
          _code.add('main', 'if (context.isHidden !== null){\n');
          _code.add('main', '  _strPart.hide = context.isHidden;\n');
          _code.add('main', '}\n');
          // escape special characters for xml if the data is a string
          _code.add('main', "if(typeof(_str) === 'string') {\n");
          _code.add('main', "  _str = _str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\u0000-\\u0008]|[\\u000B-\\u000C]|[\\u000E-\\u001F]/g, '');\n");
          _code.add('main', '};\n');
          // insert formatters which can inject XML, so after .replace(/</g, '&lt;') ... etc
          _code.add('main', that.getFormatterString(_getSafeValue, '_str', 'context', _formatters, existingFormatters, true));

          _code.add('main', "_strPart.str += (_strPart.rowShow !== false)?_str:''"+';\n');
        }
        if (_xmlPart.after) {
          _code.add('main', '_strPart.aft = ' + _getXMLStrIndex(_xmlPart.after) + ';\n');
        }
        // push the xml part in a array (this array will be sorted at the end)
        // add this if there is an iterator ( template is using i+1 form )
        if ( _noIteratorTemplate === false ) {
          _code.add('main', '_strParts.push(_strPart);\n');
          // when no iterator only push when the part position is new or rowshow is true
        }
        else {
          _code.add('main', 'if(_registeredXml['+_xmlPart.pos+'] !== true || _strPart.rowShow === true ) {\n');
          _code.add('main', '  _strParts.push(_strPart);\n');
          _code.add('main', '  _registeredXml['+_xmlPart.pos+'] = true;\n');
          _code.add('main', '};\n');
        }
      }
    }
    // close previously created for-loops
    while (_nestedArray.length > 0) {
      _code.add('prev', 'main', '}\n');
      _nestedArray.pop();
    }
    if (_staticData.after !== '') {
      _code.add('main', '_strPart = {\n');
      _code.add('main', "  'pos' : ["+(_keepHighestPosition+1)+'],\n');
      _code.add('main', "  'str' : '',\n");
      _code.add('main', "  'aft' : "+ _getXMLStrIndex(_staticData.after) + '\n');
      _code.add('main', '};\n');
      _code.add('main', '_strParts.push(_strPart);\n');
    }
    _code.add('main', 'return _strParts;');

    var _codeAssembled = _code.init;
    if (_atLeastOneSpecialIterator === true) {
      _codeAssembled += _code.prev;
    }
    _codeAssembled += _code.main;
    // The function is built, we compile it and check errors in the same time
    var _fn;
    try {
      _fn = new Function('data', 'context', 'helper', _dictionaryName, _codeAssembled);
      _fn.builderDictionary = _safeAccessor.getDictionary();
    }
    catch (err) {
      throw new Error('getSubstitutionFunction: Impossible to generate the XML builder.\n'+err+'\n--------------------------------\n'+_codeAssembled+'\n--------------------------------\n');
    }
    return _fn;
  }

};

/** ***************************************************************************************************************/
/* Privates methods */
/** ***************************************************************************************************************/

module.exports = builder;


/**
 * Test if two arrays are equal
 * @param  {Array}  arrA
 * @param  {Array}  arrB
 * @return {Boolean}  true if the two arrays are equals, false otherwise
 */
function isArrayEqual (arrA, arrB) {
  var _arrALength = arrA.length;
  var _arrBLength = arrB.length;
  if (_arrALength !== _arrBLength) {
    return false;
  }
  for (var i = _arrALength - 1; i >= 0; i--) {
    if (arrA[i] !== arrB[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Add an element in the array if does not already exist
 * @param {Array} arr   array
 * @param {Mixed} value value
 */
function addIfNotExist (arr, value) {
  for (var i = 0; i < arr.length; i++) {
    var _value = arr[i];
    if (_value === value) {
      return;
    }
  }
  arr.push(value);
}

/**
 * Find and remove the element of the array
 * @param  {Array} arr   array
 * @param  {Mixed} value value
 * @return {Array}       array modified
 */
function removeFrom (arr, value) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]===value) {
      arr.splice(i, 1);
      return arr;
    }
  }
  return arr;
}
