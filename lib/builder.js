var extracter = require('./extracter');
var parser = require('./parser');
var helper = require('./helper');
var params = require('./params');
var postprocessor = require('./postprocessor');

const conditionalFormatters = require('../formatters/condition.js');

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
    var _descriptor = {};

      // find declared variable {#myVar }
      parser.findVariables(xml, options.existingVariables, function (err, xmlWithoutVariable, variables) {
        if (err) {
          return callback(err);
        }
        // find markers { d. } or { c. }
        parser.findMarkers(xmlWithoutVariable, function (err, xmlWithoutMarkers, markers) {
          // exit if there is no markers
          if (markers.length === 0) {
            return callback(null, xmlWithoutVariable);
          }
          parser.preprocessMarkers(markers, variables, function (err, preprocessedMarkers) {
            var _xmlParts = [];
            var _builder;
            try {
              var _dynamicDescriptor = extracter.splitMarkers(preprocessedMarkers);
              if (options.isDebugActive === true) {
                extracter.generateDataFromMarker(_dynamicDescriptor, options.tempSample);
                options.debugInfo.markers = [...options.debugInfo.markers, ...preprocessedMarkers.filter(m => !/neutralForArrayFilter/.test(m.name)).map((marker) => '{'+marker.name.replace(/^_root\./, '')+'}' )];
                options.debugInfo.sample = {
                  data       : options.tempSample._rootd,
                  complement : options.tempSample._rootc
                };
              }
              _descriptor = extracter.splitXml(xmlWithoutMarkers, _dynamicDescriptor, markers, options);
              if (options.preReleaseFeatureIn >= 4009000 || params.preReleaseFeatureIn >= 4009000) {
                _descriptor = extracter.buildSortedHierarchyNew(_descriptor);
              }
              else {
                _descriptor = extracter.buildSortedHierarchy(_descriptor);
              }
              _descriptor = extracter.deleteAndMoveNestedParts(_descriptor);
              _builder = builder.getBuilderFunction(_descriptor, options.formatters);
              options.d = data; // for :set formatter
              var _obj = {
                d : data,
                c : options.complement
              };
              options.stopPropagation = false;
              _xmlParts = _builder(_obj, options, helper, _builder.builderDictionary);
            }
            catch (e) {
              console.log('Builder Error: ' + e.stack);
              return callback(e, null);
            }
            postprocessor.update(data, options, function (err) {
              if (err) {
                return callback(err, xmlWithoutMarkers);
              }
              var _xmlResult = '';
              try {
                _xmlResult = builder.assembleXmlParts(_xmlParts, 20, _builder.builderDictionary, options); // TODO -> adapt the depth of the sort according to the maximum depth in _xmlParts
              } catch (e) {
                console.log('Builder Error in assembleXmlParts: ' + e);
                return callback(new Error('Cannot build XML file'));
              }
              return callback(null, _xmlResult);
            });
          });
        });
      });

  },

  /**
   * Creates a string of the formatter(s) function(s) call of the attribute
   *
   * @param   {Function}  getSafeValue             Generate safe value accessor
   * @param   {String}    varName                  varName. Example 'd.number'
   * @param   {Number}    xmlPos                   The xml position
   * @param   {String}    contextName              The context name (_str)
   * @param   {Array}     currentIterators         The current iterators
   * @param   {Array}     currentParents           The current parents
   * @param   {Array}     parsedFormatters         The parsed formatters
   * @param   {Object}    existingFormatters       The existing formatters
   * @param   {Boolean}   isCalledInReduceLoop     Indicates if called in reduce loop.
   * @return  {String}    The formatter string.
   */
  getFormatterString : function (getSafeValue, varName, xmlPos, contextName, currentIterators, currentParents, parsedFormatters = [], existingFormatters, isCalledInReduceLoop = false) {
    const that = this;
    let _lineOfCodes = [];
    _lineOfCodes._nbConditionToClose = 0;
    let _lineOfFormattersSourceCode                  = _lineOfCodes;
    let _lineOfFormattersSourceCodePostponeExecution = [];
    let _lineOfFormattersWhichInjectXML              = '';
    let _hasAtLeastOneFormatterCalledInReduceLoop = false;
    let _hasAtLeastOneConditionalFormatter        = false;
    let _isPropagationUpdatedByPreviousFormatter  = false;

    function getInjectedArgument (argument) {
      let _nbStartDot = (argument.match(/[^.]/))?.index ?? 0;
      let _nbCharToRemove = _nbStartDot;
      if (argument.startsWith('d.') === true || argument.startsWith('c.') === true) {
        _nbStartDot = currentParents.length;
        _nbCharToRemove = 0;
      }
      const _argumentWithoutStartDot = argument.replace(helper.HIDDEN_CHAR_DISABLE_VARIABLE, '').slice(_nbCharToRemove);
      // transform argument to safe value, and manage dynamic variable .i, .size, ...
      const _injectedArgument = _nbStartDot === 0
        ? getSafeValue(_argumentWithoutStartDot)
        : _argumentWithoutStartDot === 'i'
          ? currentIterators[_nbStartDot-1]
          : helper.getSafePathCode(getSafeValue, currentParents[_nbStartDot-1], _argumentWithoutStartDot, currentIterators);
      return _injectedArgument;
    }

    for (let i = 0; i < parsedFormatters.length; i++) {
      const _originalFormatter     = parsedFormatters[i];
      const _originalFormatterStr  = _originalFormatter.str;
      const _originalFormatterFn   = existingFormatters[_originalFormatterStr];
      if (_originalFormatterFn === undefined) {
        const _alternativeFnName = helper.findClosest(_originalFormatterStr, existingFormatters);
        throw Error('Formatter "'+_originalFormatterStr+'" does not exist. Do you mean "'+_alternativeFnName+'"?');
      }
      _hasAtLeastOneFormatterCalledInReduceLoop      = _originalFormatterFn.canBeCalledInPrecomputedLoop || _hasAtLeastOneFormatterCalledInReduceLoop;
      _hasAtLeastOneConditionalFormatter             = conditionalFormatters[_originalFormatterStr]      || _hasAtLeastOneConditionalFormatter;
      // the formatter can be replaced dynamically by one or many new formatters
      const _formatters = _originalFormatter.executedFormattersInPreprocessReduce ?? _originalFormatterFn?.replacedBy?.(_originalFormatter, currentIterators, isCalledInReduceLoop === true) ?? [_originalFormatter];

      // generate source code for each formatter
      for (let k = 0; k < _formatters.length; k++) {
        const _formatter       = _formatters[k];
        const _formatterStr    = _formatter.str;
        const _formatterArgs   = _formatter.args;
        let _injectedArguments = [];
        // safely generate function arguments
        for (let j = 0; j < _formatterArgs.length; j++) {
          const _argument = _formatterArgs[j];
          if (_originalFormatterFn?.isAcceptingMathExpression === true) {
            _injectedArguments.push(parser.parseMathematicalExpression(_argument, getInjectedArgument));
          }
          else {
            _injectedArguments.push(getInjectedArgument(_argument));
          }
        }
        const _allArgs = [contextName, varName, ..._injectedArguments];
        let _sourceCode = '';
        const _formatterCall = varName +' = formatters.' + _formatterStr + '.call(' + _allArgs.join(', ') + ');\n';
        if (_isPropagationUpdatedByPreviousFormatter === true && (conditionalFormatters[_originalFormatterStr] !== undefined || _originalFormatterStr === 'print')) {
          _sourceCode += 'if('+contextName+'.stopPropagation === false) {\n';
          _sourceCode += _formatterCall + '}\n';
          _lineOfCodes._nbConditionToClose++;
        }
        else {
          _sourceCode += _formatterCall;
        }
        if (_originalFormatterFn.canInjectXML === true) {
          _lineOfFormattersWhichInjectXML += _sourceCode;
        }
        else {
          _lineOfCodes.push(_sourceCode);
        }
        // If next formatter must be called later
        if (_formatter.isNextFormatterExecutionPostponed === true) {
          // if previous formatters have been already called in preprocess/reduce loop, do not call them twice by removing all lines of code of the first part. Otherwise, keep line of code
          _lineOfFormattersSourceCode = _originalFormatter.executedFormattersInPreprocessReduce instanceof Array ? [] : _lineOfCodes;
          // now update the execution of new formatters will be executed later, either in a normal loop or in assemblyXML
          _lineOfFormattersSourceCodePostponeExecution = _lineOfCodes = [];
          _lineOfFormattersSourceCodePostponeExecution.isNextFormatterForcedToBeExecutedInPostProcess = _formatter.isNextFormatterForcedToBeExecutedInPostProcess;
          _lineOfCodes._nbConditionToClose = 0; // re-init counter of condition to close with "}"
        }
      }
      _isPropagationUpdatedByPreviousFormatter = _isPropagationUpdatedByPreviousFormatter || _originalFormatterFn.isUpdatingPropagation;
      if (isCalledInReduceLoop === true && _originalFormatterFn.canBeCalledInPrecomputedLoop === true) {
        _originalFormatter.executedFormattersInPreprocessReduce = _formatters;
        break;
      }
    }

    // TODO TEST
    if (_lineOfFormattersSourceCode._nbConditionToClose > 0 && _lineOfFormattersSourceCodePostponeExecution._nbConditionToClose > 0) {
      throw Error('Conditional formatter cannot be used before aggregators and after in the same time');
    }
    // if there are no formatter to call in precomputed loop
    if (isCalledInReduceLoop === true) {
      return _hasAtLeastOneFormatterCalledInReduceLoop === false ? '' : _lineOfFormattersSourceCode.join(';\n');
    }
    if (_lineOfFormattersSourceCodePostponeExecution.length > 0) {
      const _argumentsForPostProcessing = [...currentParents, ...currentIterators]; // TODO reduce inclusion  (currentIterators only if necessary)
      const _postProcessingFormatter = varName + ' = ' + that.generatePostProcessingFormatter(getSafeValue, xmlPos, _argumentsForPostProcessing, _lineOfFormattersSourceCodePostponeExecution.join(';\n'));
      _lineOfFormattersSourceCode.push(_postProcessingFormatter);
    }
    // insert formatters which can inject XML, so after .replace(/</g, '&lt;') ... etc
    const _removeForbiddenChar = ''
      + "if(typeof(_str) === 'string') {\n"
      + "  _str = _str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\u0000-\\u0008]|[\\u000B-\\u000C]|[\\u000E-\\u001F]/g, '');\n"
      + '}\n'
      + _lineOfFormattersWhichInjectXML;
    _lineOfFormattersSourceCode.push(_removeForbiddenChar);

    return _lineOfFormattersSourceCode.join('\n');
  },

  /**
   * Generate postprocessing code which will be executed in assembleXmlParts
   *
   * @param   {Function}  getSafeValue          The get safe value
   * @param   {string}    xmlPos                The xml position
   * @param   {string[]}  formatterArguments    The formatter arguments
   * @param   {string}    nestedFormattersCode  The nested formatters code
   * @return  {string}
   */
  generatePostProcessingFormatter : function (getSafeValue, xmlPos, formatterArguments, nestedFormattersCode) {
    let _fnCode = ''
        + '  var context = this;\n'
        + '  var formatters = context.formatters;\n'
        + '  context.stopPropagation = false;\n'
        + '  context.isConditionTrue = null;\n'
        + '  context.isAndOperator = null;\n'
        + '  this.isHidden = null;\n'
        + '  context.id = currentXMLPos;\n'
        + nestedFormattersCode
        + '  return _str;\n';
    try {
      const _fn = new Function('_dictionary', 'currentXMLPos', '_str', ...formatterArguments, _fnCode);
      let _args = '_dictionary, '+xmlPos+', _str';
      if (formatterArguments.length > 0) {
        _args += ', ' + formatterArguments.join(',');
      }
      return  '{ fn : '+getSafeValue(_fn)+', args : [ '+_args+' ]};';
    }
    catch (err) {
      console.log('Error: generatePostProcessingFormatter ' + err + ' in:\n' + _fnCode);
      throw new Error('Impossible to prepare execution plan in formatters. Please, contact the support');
    }
  },

  /**
   * Gets the filter string.
   *
   * @param      {Function}   getSafeVar         The get safe variable
   * @param      {Function}   getSafeValue       The get safe value
   * @param      {Array}      currentIterators   The current iterators
   * @param      {Array}      currentParents     The current parents
   * @param      {Array}      conditions         array of conditions. Example [{'left':'sort', 'operator':'>', 'right':'10'}]
   * @param      {String}     codeIfTrue         code to insert if the condition is true. Example 'row = true'
   * @param      {Boolean}    inverseCondition   if true, it will inverse the condition
   * @param      {String}     forceObjectTested  use forceObjectTested instead of _condition.left.parent
   * @return     {String}     The code condition to inject in builder. Example:  'if(d.number['sort'] > 10) { row = true }'.
   */
  getFilterString : function (getSafeVar, getSafeValue, currentIterators, currentParents, conditions, codeIfTrue, inverseCondition, forceObjectTested) {
    if (!codeIfTrue || !(conditions instanceof Array) || conditions.length ===0) {
      return '';
    }
    const _codeConditions = [];
    for (var c = 0; c < conditions.length; c++) {
      const _condition = conditions[c];
      const _leftOperand = _condition.left.attr;
      currentParents[0] = getSafeVar(_condition.left.parent);
      if (forceObjectTested) {
        currentParents[0] = getSafeVar(forceObjectTested);
      }
      if (_leftOperand === 'i') {
        let _rightOperandCode = 'parseInt(' + builder.getDynamicVariable(getSafeValue, _condition.right, currentIterators, currentParents)+', 10)';
        if (parseInt(_condition.right, 10) < 0) {
          _rightOperandCode = getSafeVar(_condition.left.parent) + '_array_length ' +  parseInt(_condition.right, 10);
        }
        _codeConditions.push(getSafeVar(_condition.left.parent) + '_i '+_condition.operator + _rightOperandCode);
      }
      else {
        const _leftOperandLegacy   = _leftOperand.indexOf('.') === 0 ? _leftOperand : ('.' + _leftOperand); // accept both syntax with dot or without dot for left operand
        const _leftOperandCode     = builder.getDynamicVariable(getSafeValue, _leftOperandLegacy, currentIterators, currentParents);
        const _rightOperandCode    = builder.getDynamicVariable(getSafeValue, _condition.right, currentIterators, currentParents);
        // for boolean, convert data to string to accept both cases ('true' == true) and (true == true) for backward compatibility with Carbone v1 & v2
        const _leftOperandCodeCast = (_condition.right === 'true' || _condition.right === 'false' || _condition.right === 'null' || _condition.right === 'undefined') ? _leftOperandCode+"+''" : _leftOperandCode;
        _codeConditions.push(_leftOperandCodeCast + _condition.operator + _rightOperandCode);
      }
    }
    let _str = 'if(';
    _str += (inverseCondition === true) ? '!(':'(';
    _str += _codeConditions.join(' && ') + ')){\n ';
    _str += codeIfTrue +';\n';
    _str += ' }\n';
    return _str;
  },

  /**
   * Gets the dynamic variable
   *
   * @param      {Function}  getSafeValue      The get safe value
   * @param      {string}    argument          The argument
   * @param      {array}     currentIterators  The current iterators
   * @param      {array}     currentParents    The current parents
   * @return     {number}    The dynamic variable
   */
  getDynamicVariable : function (getSafeValue, argument, currentIterators, currentParents) {
    const _nbStartDot = (argument.match(/[^.]/))?.index ?? 0;
    const _argumentWithoutStartDot = argument.slice(_nbStartDot);
    // transform argument to safe value, and manage dynamic variable .i, .size, ...
    const _injectedArgument = _nbStartDot === 0
      ? getSafeValue(helper.removeQuote(_argumentWithoutStartDot))
      : _argumentWithoutStartDot === 'i'
        ? currentIterators[_nbStartDot-1]
        : helper.getSafePathCode(getSafeValue, currentParents[_nbStartDot-1], _argumentWithoutStartDot);
    return _injectedArgument;
  },
  /**
   * Assemble all xml parts and return the final result, the xml string with data
   *
   * @param {array} arrayOfStringPart :  special array which is generated by the function returned by getBuilderFunction
   * @param {integer} sortDepth : description
   * @param {array} builderDictionary : xml part coming from template
   * @param {object} options
   * @return {string} final result
   */
  assembleXmlParts : function (arrayOfStringPart, sortDepth, builderDictionary, options = {}) {
    var _res = [];
    builder.sortXmlParts(arrayOfStringPart);
    var _rowInfo = [];
    var _prevDepth = 0;
    var _prevPart = {pos : []};
    var _arrayLevel = 0;
    var _hideBlock = 0;
    var _prevHideBlock = 0;
    var _currentIndex = 0;

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
      // keep parts if positions are not the same as the last one OR if the it the beginning of an array
      if ((_prevPart.rowStart === true && _part.rowStart !== true) || isArrayEqual(_prevPart.pos, _part.pos) === false) {
        _prevPart = _part;
      }
      else {
        continue;
      }
      // TODO test avec reptition des part au-dessus
      // Execute postProcess formatters, which can contain if..., so we must update _part.hide here
      options.isHidden = null;
      let _tempStr = _part.postProcess === undefined ? _part.str : _part.postProcess.fn.apply(options, _part.postProcess.args);
      if (options.isHidden !== null ) {
        _part.hide = options.isHidden;
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
        _str += _tempStr;
        _str += _part.aft !== undefined ? builderDictionary[_part.aft] : '';
      }
      if (_currentIndex < _res.length) {
        _res[_currentIndex++] = _str;
      }
      else {
        _res.push(_str);
        _currentIndex++;
      }

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
        _rowInfo[_arrayLevel].xmlPos = _currentIndex - 1;
      }
      else if (_part.rowEnd===true) {
        if (_rowInfo[_arrayLevel].rowShow === 0) {
          _currentIndex = _rowInfo[_arrayLevel].xmlPos;
        }
        if (_arrayLevel > 0) {
          _rowInfo[_arrayLevel-1].rowShow |= _rowInfo[_arrayLevel].rowShow;
        }
        _rowInfo[_arrayLevel].rowShow = 0;
      }
    }

    // concatenate the result
    if (_res.length === _currentIndex) {
      return _res.join('');
    }
    var _strRes = '';
    for (var i = 0; i < _currentIndex; i++) {
      _strRes += _res[i];
    }
    return _strRes;
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
    _code.add('init', "var _str = '';\n");
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
    let _iteratorsUsedToGroupByInAggrerators = [];
    let _codeForLevel = {};

    // For each object, generate the code
    for (var _objIndex = 0; _objIndex < _hierarchy.length; _objIndex++) {
      var _objName = _hierarchy[_objIndex];
      var _realObjName = _getSafeValue(_dynamicData[_objName].name);
      var _isArrayOfArrayAccess = _dynamicData[_objName].name === '' ? true : false;  //#patch20230227
      var _hasSubAttributeAccess = _dynamicData[_objName].hasSubAtt;  //#patch20230227
      var _type = _dynamicData[_objName].type;
      var _objParentName = _dynamicData[_objName].parent;
      var _objParentNames = _dynamicData[_objName].parents.reverse();
      var _xmlParts = _dynamicData[_objName].xmlParts;
      var _arrayDepth = _dynamicData[_objName].depth || 0;
      var _beforeStr = _dynamicData[_objName].before;


      // close nested for-loop brackets
      that.forEachArrayExit(_nestedArray, _dynamicData, _objName, function (exitedArrayName) {
        _code.add('prev','main', '}\n');
        _iteratorsUsedToGroupByInAggrerators.pop();
        if (_dynamicData[exitedArrayName].iterators !== undefined) {
          _nbCustomIterator -= _dynamicData[exitedArrayName].iterators.length-1;
          _iteratorsUsedToGroupByInAggrerators.splice(_iteratorsUsedToGroupByInAggrerators.length - _nbCustomIterator);
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
        var _conditionToFindObject = _dynamicData[_objName].conditions || [];
        var _objNameTemp = _objName+'_temp';
        let _loopCode = '';
        let _loopCodeForAgg = '';
        let _aggCode = '';
        for (let i = 0; i < _xmlParts.length; i++) {
          let _xmlPart = _xmlParts[i];
          let _dataObj = _xmlPart.obj;
          let _dataAttr = _xmlPart.attr;
          let _currentParentsVariable = [_getSafeVar(_dataObj), ..._objParentNames.map(_getSafeVar)];
          if (_dataAttr !== undefined && _dataAttr !== null && (_dataAttr !== '' || _hasSubAttributeAccess !== true /* #patch20230227 */)) {
            const _formatterCode = that.getFormatterString(_getSafeValue, '_str', _xmlPart.pos, 'context', _iteratorsUsedToGroupByInAggrerators, _currentParentsVariable, _xmlPart.parsedFormatter, existingFormatters, true);
            if (_formatterCode !== '') {
              if (_dataAttr === '') {
                // #patch20230227
                _aggCode += '_str = ' + _getSafeVar(_dataObj) + ';\n';
              }
              else {
                _aggCode += '_str = ' + _getSafeVar(_dataObj) + '?.[' + _getSafeValue(_dataAttr) + ']' + ';\n';
              }
              _aggCode += 'context.stopPropagation = false;\n';
              _aggCode += 'context.isConditionTrue = null;\n';
              _aggCode += 'context.isAndOperator = null;\n';
              _aggCode += 'context.id = '+_xmlPart.pos+';\n';
              _aggCode += _formatterCode;
            }
          }
          if (_xmlPart.moveTo !== undefined) {
            _xmlParts.splice(i--, 1);
          }
        }
        const _injectionChar = '\u0000'; // invisible char to replace
        const _foundCode = _getSafeVar(_objName)+'='+_getSafeVar(_objNameTemp)+'; break;\n';
        const _currentParentsVariable = [_getSafeVar(_objNameTemp), ..._objParentNames.map(_getSafeVar)];
        const _conditionCode = that.getFilterString(_getSafeVar, _getSafeValue, _iteratorsUsedToGroupByInAggrerators, _currentParentsVariable, _conditionToFindObject, _foundCode , false, _objNameTemp);
        if ( _isArrayOfArrayAccess===true) {
          // #patch20230227
          _loopCode += 'var ' + _arrayOfObjectNameG+'='+'('+_getSafeVar(_objParentName)+' instanceof Array)? '+_getSafeVar(_objParentName)+':[];\n';
        }
        else {
          _loopCode += 'var ' + _arrayOfObjectNameG+'='+'('+_getSafeVar(_objParentName)+' instanceof Object)? '+_getSafeVar(_objParentName)+'['+_realObjName+']:[];\n';
        }
        _loopCode += _getSafeVar(_objName) + '={};\n';
        _loopCode += 'var '+_arrayOfObjectNameG+'_length = ('+_arrayOfObjectNameG+' instanceof Array)?'+_arrayOfObjectNameG+'.length : 0;\n';
        _loopCode += 'for (var '+_arrayOfObjectIndexNameG+' = 0; '+_arrayOfObjectIndexNameG+' < '+_arrayOfObjectNameG+'_length ; '+_arrayOfObjectIndexNameG+'++) {\n';
        // reverse the loop when aggregation is used to finish with the first occurence of each filter
        _loopCodeForAgg += 'for (var '+_arrayOfObjectIndexNameG+' = '+_arrayOfObjectNameG+'_length - 1; '+_arrayOfObjectIndexNameG+' > -1 ; '+_arrayOfObjectIndexNameG+'--) {\n';
        _loopCode += '  var '+_getSafeVar(_objNameTemp)+' = '+_arrayOfObjectNameG+'['+_arrayOfObjectIndexNameG+'];\n';
        _codeForLevel[_objName] = _loopCode.replace(/for[^\n]+\n/, _loopCodeForAgg) + (_conditionCode || _foundCode).replace('break;\n', _injectionChar + '\n}');
        // if there is an aggregator, concatenate all for-loops without break
        if (_aggCode !== '') {
          var _finalString = _injectionChar;
          for (let i = _objParentNames.length - 3; i >= 0; i--) {
            let _parentName = _objParentNames[i];
            _finalString = _finalString.replace(_injectionChar, _codeForLevel[_parentName] || _injectionChar);
          }
          _finalString = _finalString.replace(_injectionChar, _codeForLevel[_objName]);
          _finalString = _finalString.replace(_injectionChar, _aggCode);
          _code.add('prev', 'main', _finalString);
        }
        else {
          _code.add('prev','main', _loopCode);
          _code.add('prev', 'main', _conditionCode);
          _code.add('prev', 'main', '}\n');
        }
      }
      // Array type
      else if (_type === 'array') {
        var _posStart = _dynamicData[_objName].position.start;
        var _posEnd = _dynamicData[_objName].position.end;
        var _arrayIndexNameG = _getSafeVar(_objName)+'_i';
        var _arrayNameG = _getSafeVar(_objName)+'_array';
        var _iterators = _dynamicData[_objName].iterators;
        var _repeater = _dynamicData[_objName].repeater;
        var _repeaterGlobalCounter = _getSafeVar(_objName)+'_repeatCount';
        var _containSpecialIterator = _dynamicData[_objName].containSpecialIterator;



        _code.add('main', '_xmlPos['+(_nbCustomIterator+_arrayDepth*2-2)+'] = '+_posStart+';\n');
        _code.add('main', '_xmlPos['+(_nbCustomIterator+_arrayDepth*2-1)+'] = '+_posStart+';\n');

        // declare any nested object
        if (_objName!=='_root') {
          if ( _isArrayOfArrayAccess===true) {
            // #patch20230227
            _code.add('prev', 'main', 'var '+_arrayNameG+'='+'('+ _getSafeVar(_objParentName)+' instanceof Array) ?'+ _getSafeVar(_objParentName)+':[];\n');
          }
          else {
            _code.add('prev', 'main', 'var '+_arrayNameG+'='+'('+ _getSafeVar(_objParentName)+' instanceof Object) ?'+ _getSafeVar(_objParentName)+'['+_realObjName+']:[];\n');
          }
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

        if ( _repeater ) {
          _code.add('prev','main', 'var '+_repeaterGlobalCounter+' = 0;\n');
          _nestedArray.push(_objName);
        }
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
            _iteratorsUsedToGroupByInAggrerators.push(_arrayIndexNameG);
            if ( _repeater ) {
              var _repeaterAttr = _getSafeValue(_repeater);
              var _repeaterName = _getSafeVar(_objName)+'_repeat';
              _code.add('prev', 'main', ' let '+_repeaterName+' = '+_getSafeVar(_objName)+'['+_repeaterAttr+'];\n');
              _code.add('prev', 'main', ' if ( '+_repeaterName+' > 400 ) { throw Error("The repeater cannot be above 400"); }\n');
              // TODO
              _code.add('main', 'while( '+_repeaterName+'-- > 0) {\n');
              _code.add('main', '  _xmlPos['+(_nbCustomIterator+_arrayDepth*2-1)+'] = '+_repeaterGlobalCounter+'++;\n');
            }
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
            _iteratorsUsedToGroupByInAggrerators.push(_iteratorNameG);
            // count the number of custom iterator
            // _str += "  _xmlPos["+(_nbCustomIterator+_arrayDepth*2-1)+"] = "+_arrayIndexNameG+";\n";
            if (_iterator.isSpecial === true) {
              // TODO ++ ???????
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
        if (_dataAttr !== undefined && _dataAttr !== null && (_dataAttr !== '' || _hasSubAttributeAccess !== true /* #patch20230227 */)) {
          let _currentParentsVariable = [_getSafeVar(_dataObj), ..._objParentNames.map(_getSafeVar)];
          // handle conditions
          _code.add('main', '_strPart.rowShow = true;\n');
          _code.add('main', that.getFilterString(_getSafeVar, _getSafeValue, _iteratorsUsedToGroupByInAggrerators, _currentParentsVariable, _conditions, '_strPart.rowShow = false', true));
          _code.add('main', '_str = "";\n');
          // TODO optimize avoid using all this options for all formatters
          _code.add('main', 'context.isHidden = null;\n');
          _code.add('main', 'if(_strPart.rowShow === true) {\n');
          if (_dataAttr === '') {
            // _dataAttr is empty when d.myArray[i] is used without attribute. 
            _code.add('main', '_str = ' + _getSafeVar(_dataObj) + ';\n'); // #patch20230227
          }
          else {
            _code.add('main', '_str = ' + _getSafeVar(_dataObj) + '?.[' + _getSafeValue(_dataAttr) + '];\n');
          }
          _code.add('main', 'context.stopPropagation = false;\n');
          _code.add('main', 'context.isConditionTrue = null;\n');
          _code.add('main', 'context.isAndOperator = null;\n');
          _code.add('main', 'context.id = '+_xmlPart.pos+';\n');
          _code.add('main', that.getFormatterString(_getSafeValue, '_str', _xmlPart.pos, 'context', _iteratorsUsedToGroupByInAggrerators, _currentParentsVariable, _xmlPart.parsedFormatter, existingFormatters, false));
          // if a loop is used with a filter, added Carbone tags in preprocessing (generate unique id, bookmark, ...) must be neutral regarding row filtering
          // otherwise, an entire row can stay visible because one Carbone tag is still visible!
          if (_xmlPart.parsedFormatter?.[0]?.str === 'neutralForArrayFilter') {
            _code.add('main', '_strPart.rowShow = false;\n');
          }
          _code.add('main', '};\n');
          _code.add('main', 'if(_str instanceof Object && _str.fn instanceof Function) {\n');
          _code.add('main', '  _strPart.postProcess = _str;\n');
          _code.add('main', '  _str = "";\n');
          _code.add('main', '};\n');
          // replace null or undefined value by an empty string
          if (_dataAttr === '') {
            // #patch20230227 Avoid printing [object Object] if an array of string contains an object. Maybe we could generalize this rule in v5
            _code.add('main', 'if(_str === null || _str === undefined || (_str instanceof Object && !(_str instanceof Array))) {\n');
          }
          else {
            _code.add('main', 'if(_str === null || _str === undefined) {\n');
          }
          _code.add('main', "  _str = '';\n");
          _code.add('main', '};\n');
          _code.add('main', 'if (context.isHidden !== null){\n');
          _code.add('main', '  _strPart.hide = context.isHidden;\n');
          _code.add('main', '}\n');
          _code.add('main', '_strPart.str = _str;\n');
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
      console.log('Execution plan error; ' + err + '\n' + _codeAssembled);
      throw new Error('Impossible to prepare execution plan. Please, contact the support');
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
