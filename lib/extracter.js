var parser = require('./parser');
var helper = require('./helper');

var extracter = {

  /**
   * Split markers in order to build a usable descriptor
   *
   * @param {array} markers : array of markers with their position
   * @return {object} descriptor
   */
  splitMarkers : function (markers) {
    var _res = {};
    var _visitedArray = {};
    for (var i = 0; i < markers.length; i++) {
      var _marker = markers[i].name;
      var _markerPos = markers[i].pos;

      var _word = '';
      var _prevMarker = '';
      var _objectNameWhereStartMultiplePoints = '';
      var _parents = [];
      var _uniqueMarkerName = '';
      var _uniqueArrayName = '';
      var _arrayName = '';
      var _iterators = [];
      var _prevChar = '';
      var _repeater = '';
      var _isFormatter = false;
      var _isFormatterParenthesis = false;
      var _isString = false;
      var _formaters = [];
      var _formatterStr = '';
      var _isArray = false;
      var _conditions = [];
      var _isIteratorUsedInCurrentArray = false;
      var _conditionsToFindObjectInArray = [];
      // Loop on each char.
      // We do not use regular expressions because it is a lot easier like that.
      for (var c = 0; c < _marker.length; c++) {
        var _char = _marker.charAt(c);
        // if we enter in a string (it will keep whitespaces)
        if (_char === "'" || _char === '"') {
          _isString = !_isString;
        }

        // if we enter in a formatter and we are not between two parenthesis of a formatter (the character ":" is allowed within the parenthesis)
        if (_char===':' && _isFormatterParenthesis === false) {
          _isFormatter = true;
          // if we enter in a second formatter, keep the previous one. Ex. three nested formaters : formater1:formater2:formater3
          if (_formatterStr !== '') {
            _formaters.push(_formatterStr);
            _formatterStr = '';
          }
        }
        // if we are in a formatter, and if we enter in a parenthesis
        else if (_isFormatter === true && _char==='(') {
          _formatterStr += _char;
          _isFormatterParenthesis = true;
        }
        // if we are in a formatter and we exit
        else if (_isFormatter === true && _char===')') {
          _formatterStr += _char;
          _isFormatterParenthesis = false;
          _isFormatter = false;
          _formaters.push(_formatterStr);
          _formatterStr = '';
        }
        else if (_isFormatter === true && (_char!==' ' || _isString===true) ) {
          _formatterStr += _char;
        }
        // if we enter into the brakets of an array
        else if (_char==='[') {
          _isIteratorUsedInCurrentArray = false;
          _isArray = true;
          _uniqueMarkerName += _word;
          _uniqueMarkerName = this._cleanUniqueMarkerName(_uniqueMarkerName);
          _arrayName = _word;
          // If we are in a multidimensional array
          if (_prevChar === ']') {
            _uniqueMarkerName += '_';
          }
          _uniqueArrayName = _uniqueMarkerName;
          _uniqueMarkerName += _visitedArray[_uniqueArrayName] || '';
          _word = '';
          _isFormatter = false;
        }
        // if we multipe points are used
        else if (_char === '.' && _prevChar === '.') {
          if (_objectNameWhereStartMultiplePoints === '') {
            _objectNameWhereStartMultiplePoints = _prevMarker;
          }
          if (_parents.length === 0) {
            throw Error('Cannot access parent object in "'+_marker+'" (too high)');
          }
          if (_uniqueMarkerName === _parents[_parents.length-1]) {
            // special case when coming from an array
            _parents.pop();
          }
          _uniqueMarkerName = _parents.pop();
          _prevMarker = _uniqueMarkerName;
          if (_parents.length > 0) {
            _prevMarker = _parents[_parents.length-1];
          }
        }
        // if we enter into an object
        else if (_char ==='.' && _isArray === false) {
          if (_objectNameWhereStartMultiplePoints !== '') {
            // when coming from .., set _prevMarker as usual
            _prevMarker = _uniqueMarkerName;
          }
          _uniqueMarkerName += _word;
          _uniqueMarkerName = this._cleanUniqueMarkerName(_uniqueMarkerName);
          if (_prevMarker !== '' && _parents[_parents.length-1] !== _prevMarker) {
            _parents.push(_prevMarker);
          }
          if (!_res[_uniqueMarkerName]) {
            _res[_uniqueMarkerName]={
              name     : _word,
              type     : 'object',
              parent   : _prevMarker,
              parents  : _parents.slice(0),
              xmlParts : []
            };
          }
          _prevMarker = _uniqueMarkerName;
          _word = '';
          _isFormatter = false;
        }
        // if this is not a whitespace, keep the word
        else if (_char!==' ' || _isString===true) {
          _word += _char;
        }

        if (_isArray === true) {
          // detect array condition, or direct access in arrays such as myAarray[10]
          var _result = /([^,!]+)(!=|=|>|<)([\s\S]+)[,\]]$/.exec(_word) || /(\d+)\]$/.exec(_word);
          // detect direct
          if (_result instanceof Array) {
            if (_result.length === 2) {
              // if this is a direct access such as "myArray[10]", adapt the result as if it was "myArray[i=10]"
              _result = [0, 'i', '=', _result[1]];
            }
            var _operator = (_result[2] === '=') ? '==' : _result[2];
            var _conditionObj = {
              left     : {parent : _uniqueMarkerName, attr : _result[1]},
              operator : _operator,
              right    : _result[3]
            };
            _conditions.push(_conditionObj);
            _word = '';
          }
          else if (_word.length > 1 && (_char===',' || _char===']')) {
            _isIteratorUsedInCurrentArray = true; // +1 or not
            if (_word[0] === '*') {
              _repeater = _word.slice(1, -1);
              _word = _char;
            }
          }
          // detect array iteration
          if (_word.substr(-2)==='+1') {
            var _iteratorNormal = _word.slice(0,-2).replace(',','');
            _iterators.push({str : _iteratorNormal});
            _word = '';
          }
          else if (_word.substr(-2)==='++') {
            var _iteratorCustom = _word.slice(0,-2).replace(',','');
            _iterators.push({str : _iteratorCustom, isSpecial : true});
            _word = '';
          }
        }
        // if we exit the bracket of an array
        if (_char===']' && _isArray===true) {

          // If it was the first part of the array (i without "i+1")
          if (_iterators.length === 0) {
            // If we detect new start of an already known array
            if (_res[_uniqueMarkerName] && _res[_uniqueMarkerName].position.end !== undefined) {

              if (!_visitedArray[_uniqueArrayName]) {
                _visitedArray[_uniqueArrayName] = '';
              }
              _visitedArray[_uniqueArrayName] += '$';
              // correction of previously detected conditions
              for (var k = 0; k < _conditions.length; k++) {
                var _condition = _conditions[k];
                if (_condition.left.parent===_uniqueMarkerName) {
                  _condition.left.parent += '$';
                }
              }
              _uniqueMarkerName += '$';
            }
            if (_prevMarker !== '' && _parents[_parents.length-1] !== _prevMarker) {
              _parents.push(_prevMarker);
            }
            if (_isIteratorUsedInCurrentArray === false) {
              var _filterUniqueName = '';
              var h = _conditions.length - 1;
              for (; h >= 0 ; h--) {
                var _conditionToFindObject = _conditions[h];
                _filterUniqueName += helper.cleanJavascriptVariable(_conditionToFindObject.left.attr + '__' + _conditionToFindObject.right);
                // consider only conditions of this array, thus only last rows which match with unique array name
                if (_conditionToFindObject.left.parent !== _uniqueMarkerName ) {
                  break;
                }
              }
              // extract conditions to find this object
              _conditionsToFindObjectInArray = _conditions.slice(h + 1, _conditions.length);
              _conditions = _conditions.slice(0, h + 1);
              // generate a new object
              _uniqueMarkerName += _filterUniqueName;
              _uniqueMarkerName = this._cleanUniqueMarkerName(_uniqueMarkerName);
              // correction of previously detected conditions
              for (var m = 0; m < _conditionsToFindObjectInArray.length ; m++) {
                _conditionsToFindObjectInArray[m].left.parent += _filterUniqueName;
              }
            }
            // create the new array
            if (!_res[_uniqueMarkerName]) {
              _res[_uniqueMarkerName]={
                name      : _arrayName,
                type      : (_isIteratorUsedInCurrentArray === true) ? 'array' : 'objectInArray',
                parent    : _prevMarker,
                parents   : _parents.slice(0),
                position  : {},
                iterators : [],
                xmlParts  : []
              };
            }
            if (_isIteratorUsedInCurrentArray === true && _res[_uniqueMarkerName].position.start === undefined) {
              _res[_uniqueMarkerName].position.start = _markerPos;
            }
            if (_isIteratorUsedInCurrentArray === false) {
              _res[_uniqueMarkerName].conditions = _conditionsToFindObjectInArray;
              _conditionsToFindObjectInArray = [];
            }
            _prevMarker = _uniqueMarkerName;
          }
          // If it was the second part of the array ("i+1")
          else {
            if (_res[_uniqueMarkerName].position.end === undefined) {
              _res[_uniqueMarkerName].position.end = _markerPos;
              if (_repeater) {
                _res[_uniqueMarkerName].repeater = _repeater;
                _repeater = '';
              }
              var _prevIteratorStr = '';
              for (var it = 0; it < _iterators.length; it++) {
                var _iterator = _iterators[it];
                var _iteratorStr = _iterator.str;
                if (_prevIteratorStr !== _iteratorStr) {
                  var _iteratorInfo = {};
                  // if the iterator is in a sub-object. Ex: movie.sort+1
                  if (/\./.test(_iteratorStr)===true) {
                    var _splitIterator = _iteratorStr.split('.');
                    _iteratorInfo = {obj : _splitIterator[0],attr : _splitIterator[1]};
                  }
                  else {
                    _iteratorInfo = {attr : _iteratorStr};
                  }
                  if (_iterator.isSpecial===true) {
                    _iteratorInfo.isSpecial = true;
                    _res[_uniqueMarkerName].containSpecialIterator = true;
                  }
                  _res[_uniqueMarkerName].iterators.push(_iteratorInfo);
                }
                _prevIteratorStr = _iteratorStr;
              }
            }
          }

          _word = '';
          _isFormatter = false;
          _isArray = false;
        }

        // remove whitespaces
        if (_char!==' ') {
          _prevChar = _char;
        }
      }
      // do not store the odd part of an array
      if (_iterators.length === 0) {
        // If there is a formatter, add it in the array of formatters
        if (_formatterStr !== '') {
          _formaters.push(_formatterStr);
        }
        var _objParent = _prevMarker;
        var _objOwner = _prevMarker;
        // If the the user uses multiple points ...
        if (_objectNameWhereStartMultiplePoints !== '') {
          _objOwner = _objectNameWhereStartMultiplePoints;
          _objParent = _uniqueMarkerName;
        }
        var _xmlPart = {
          attr       : _word,
          formatters : _formaters,
          obj        : _objParent,
          pos        : _markerPos,
          posOrigin  : _markerPos
        };
        if (_conditions.length > 0) {
          _xmlPart.conditions = _conditions;
        }
        _res[_objOwner].xmlParts.push(_xmlPart);
      }
    }
    return _res;
  },

  /**
   * Remove dash from string to avoir errors
   * @param {String} markerName Marker name to clean
   */
  _cleanUniqueMarkerName : function (markerName) {
    return markerName.replace(/-/g, '');
  },

  /**
   * Sort xml parts. Used in splitXml
   * @param  {Array} xmlParts (modified by the function)
   */
  sortXmlParts : function (xmlParts) {
    xmlParts.sort(function (a,b) {
      if (Math.trunc(a.pos) > Math.trunc(b.pos)) {
        return  1;
      }
      if (Math.trunc(a.pos) < Math.trunc(b.pos)) {
        return -1;
      }
      // When two arrays are incremented in the same time (d.tab[i+1].subtab[i+1]), pos is the same...
      // I use the length of the string to garuantee that the loop "d.tab" is before "d.tab.subtab".
      if (a.array==='start' && b.array==='start') {
        return (a.obj.length - b.obj.length);
      }
      if (a.array==='end'   && b.array==='end'  ) {
        return (b.obj.length - a.obj.length);
      }
      // after detecting arrays and conditional blocks, some markers may have moved in XML
      // It could create conflicts (many markers at the same XML position).
      // So, we sort them using their original position
      if (a.posOrigin > b.posOrigin) {
        return  1;
      }
      if (a.posOrigin < b.posOrigin) {
        return -1;
      }
      // other basic cases:
      if (a.array==='start') {
        return -1;
      }
      if (b.array==='start') {
        return  1;
      }
      if (a.array==='end')   {
        return  1;
      }
      if (b.array==='end')   {
        return -1;
      }
      return 0;
    });
  },

  /**
   * Divide up the xml in the descriptor
   *
   * @param {string} xml : pure xml withous markers
   * @param {object} descriptor : descriptor generated by the function splitMarkers
   * @return {object} descriptor with xml inside
   */
  splitXml : function (xml, descriptor) {
    const MARKER_PRESENCE_CHAR_REGEX = /\uFFFF/g;
    var _res = {
      staticData : {
        before : '',
        after  : ''
      },
      dynamicData : descriptor
    };

    findAndSetValidPositionOfConditionalBlocks(xml, descriptor);

    // Find the exact positions of all arrays
    findAndSetExactPositionOfArrays(xml, descriptor);

    // Extract all parts independently
    var _allSortedParts = getAllParts(descriptor);


    // And sort them by ascendant positions
    extracter.sortXmlParts(_allSortedParts);

    // if all parts are empty, return all the xml
    if (_allSortedParts.length === 0) {
      _res.staticData.before = xml.slice(0).replace(MARKER_PRESENCE_CHAR_REGEX,'');
    }

    // Slice the xml
    var _prevPos = 0;
    var _prevPart = {};
    var _arrayDepth = 0;
    var _currentlyVisitedArray = [];
    var _lastVisitedArrayPos = {};

    // avoid having two (or more) markers at the same XML position for the final sort in builder.assembleXmlParts
    // fix this using float position.
    for (let i = 0; i < _allSortedParts.length; i++) {
      let _part = _allSortedParts[i];
      if (Math.trunc(_part.pos) === Math.trunc(_prevPart.pos)) {
        // Why adding 1/64? to avoid rounding problems of floats (http://0.30000000000000004.com)
        // This let us the possibility to have 64 markers at the same position. It should enough for all cases.
        _part.pos = _prevPart.pos + 1/64;
        // fix also beginning and ending of arrays
        if (_part.array === 'start') {
          descriptor[_part.obj].position.start = _part.pos;
        }
        else if (_part.array === 'end') {
          descriptor[_part.obj].position.end = _part.pos;
        }
      }
      _prevPart = _part;
    }

    _prevPart = {};
    for (var i = 0; i < _allSortedParts.length; i++) {
      var _part = _allSortedParts[i];
      var _pos  = Math.trunc(_part.pos); // can be a float
      if (i===0) {
        _res.staticData.before = xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
      }
      if (_prevPart.array === 'start') {
        _arrayDepth++;
        _prevPart.after = xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
        _prevPart.depth = _arrayDepth;
        _currentlyVisitedArray.push(_prevPart.obj);
        _lastVisitedArrayPos = descriptor[_prevPart.obj].position;
      }
      _part.depth = _arrayDepth;
      if (_part.array === 'end') {
        descriptor[_part.obj].depth = _arrayDepth;
        _arrayDepth--;
        _part.before = xml.slice(_prevPos, _pos ).replace(MARKER_PRESENCE_CHAR_REGEX,'');
      }
      // move or remove part which are not in the repetition section
      for (var j = _currentlyVisitedArray.length - 1; j >= 0; j--) {
        var _lastVisitedArrayName = _currentlyVisitedArray[j];
        var _arrayPos = descriptor[_lastVisitedArrayName].position;
        var _partParents = descriptor[_part.obj].parents;
        // if the part belongs to the current visited array, keep it in this array.
        if (_part.pos <= _arrayPos.end && (_part.depth === _arrayDepth &&  _lastVisitedArrayName === _part.obj || _part.array === 'start' || _part.array === 'end' || _partParents.indexOf(_lastVisitedArrayName) !== -1)) {
          break;
        }
        if (_part.pos > _arrayPos.start && _part.pos < _arrayPos.end && _partParents.indexOf(_lastVisitedArrayName) === -1 && _lastVisitedArrayName !== _part.obj) {
          _part.moveTo = _lastVisitedArrayName;
          break;
        }
        else if (Math.trunc(_part.pos) > Math.trunc(_arrayPos.end) && Math.trunc(_part.pos) < Math.trunc(_arrayPos.endOdd)) {
          _part.toDelete = true; // remove all parts which are in odd zone of arrays
          break;
        }
      }
      // when we leave completely a repetition section, update _lastVisitedArrayPos and _currentlyVisitedArray
      if (_arrayDepth > 0 && _part.pos >= _lastVisitedArrayPos.endOdd && _part.pos > _lastVisitedArrayPos.end) {
        _currentlyVisitedArray.pop();
        if (_currentlyVisitedArray.length > 0) {
          _lastVisitedArrayPos = descriptor[_currentlyVisitedArray[_currentlyVisitedArray.length-1]].position;
        }
        else {
          _lastVisitedArrayPos = {};
        }
      }
      if (!_prevPart.array && _part.array !== 'end') {
        let _xmlPart = xml.slice(_prevPos, _pos ).replace(MARKER_PRESENCE_CHAR_REGEX,'');
        // if toDelete = true, we are in the odd part of the array. This xml part will be removed
        if (_prevPart.toDelete !== true) {
          _prevPart.after = _xmlPart;
        }
        else if (_part.toDelete !== true) {
          _part.before = _xmlPart;
        }
      }
      if (_prevPart.array && _prevPart.array === 'end') {
        if (_prevPos!==_pos) {
          // if we have two adjacent arrays, keep the xml which is between in two arrys
          if (_part.array && _part.array==='start') {
            descriptor[_part.obj].before =  xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
          }
          else {
            _part.before = xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
          }
        }
      }
      // if there is a dead zone (ex. odd part of the array), jump to the next part
      if (_part.array === 'end') {
        _prevPos = Math.trunc(descriptor[_part.obj].position.endOdd);
      }
      else if (_pos > _prevPos) {
        _prevPos = _pos;
      }
      // the end, put the last xml part in the staticData object
      if (i === _allSortedParts.length-1) {
        _res.staticData.after = xml.slice(_prevPos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
      }
      _prevPart = _part;
    }

    return _res;
  },

  /**
   * Generate an array which contains in which order the builder should travel the dynamicData
   *
   * @param  {object} descriptor : descriptor returned by splitXml
   * @return {object} descriptor with the hierarchy array
   */
  buildSortedHierarchy : function (descriptor) {
    var _sortedNodes = [];

    // find all node which have parents
    var _hasChildren = getAllNodeWhichHaveParents(descriptor);

    // keep only leaves of the tree
    var _treeLeaves = getAllLeaves(_hasChildren, descriptor);

    // update treeLeave, compute depth and unique branch name
    computeDepthAndBranchNames(_treeLeaves, descriptor);

    // sort by depth
    _treeLeaves.sort(sortByDepth);

    function insertIfNotExists (table, node) {
      for (var i = 0; i < table.length; i++) {
        if (table[i] === node) {
          return;
        }
      }
      table.push(node);
    }
    for (var i = 0; i < _treeLeaves.length; i++) {
      var _obj = _treeLeaves[i];
      for (var j = _obj.parents.length - 1; j >= 0 ; j--) {
        insertIfNotExists(_sortedNodes, _obj.parents[j]);
      }
      insertIfNotExists(_sortedNodes,  _obj.objName);
    }
    descriptor.hierarchy = _sortedNodes;
    return descriptor;
  },

  /**
   * delete and move xmlPart which are not in the right place
   *
   * @param  {object} descriptor : descriptor returned by splitXml
   * @return {object} descriptor with modified xmlParts
   */
  deleteAndMoveNestedParts : function (descriptor) {
    for (var _objName in descriptor.dynamicData) {
      var _xmlParts =  descriptor.dynamicData[_objName].xmlParts;
      for (var i = 0; i < _xmlParts.length; i++) {
        var _part = _xmlParts[i];
        if (_part.moveTo !== undefined) {
          _xmlParts.splice(i--, 1);
          descriptor.dynamicData[_part.moveTo].xmlParts.push(_part);
          delete _part.moveTo;
        }
        else if (_part.toDelete === true) {
          delete _part.toDelete;
          _xmlParts.splice(i--, 1);
        }
      }
    }
    return descriptor;
  }

};

module.exports = extracter;


/**
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @return {Array}
 */
function findAndSetValidPositionOfConditionalBlocks (xml, descriptor) {
  // TODO performance: flattenXML should be called earlier and used also to find array positions
  var _xmlFlattened = parser.flattenXML(xml);
  for (var _objName in descriptor) {
    var _xmlParts = descriptor[_objName].xmlParts;
    var _conditionalBlockDetected = [];
    var _newParts = [];
    for (var i = 0; i < _xmlParts.length; i++) {
      var _part = _xmlParts[i];
      var _formatters = _part.formatters || [];
      var _nbFormatters = _formatters.length;
      if (_nbFormatters === 0) {
        continue;
      }
      var _lastFormatter = _formatters[_nbFormatters - 1];
      if (_lastFormatter.indexOf('showBegin') !== -1 || _lastFormatter.indexOf('hideBegin') !== -1) { // TODO return error if not last
        _conditionalBlockDetected.push(_part);
      }
      else if (_lastFormatter.indexOf('showEnd') !== -1 || _lastFormatter.indexOf('hideEnd') !== -1) {
        var _beginPart = _conditionalBlockDetected.pop();
        if (_beginPart === undefined) {
          throw new Error('Missing at least one showBegin or hideBegin');
        }
        // convert XML string into an array and find the array index of beginTextIndex
        var _safeXMLBlocks = parser.findSafeConditionalBlockPosition(_xmlFlattened, _beginPart.pos, _part.pos);
        if (_safeXMLBlocks.length > 0) {
          _beginPart.posOrigin = _beginPart.pos;
          _part.posOrigin      = _part.pos;
          _beginPart.pos       = _safeXMLBlocks[0][0];
          _part.pos            = _safeXMLBlocks[0][1];
          for (var j = 1; j < _safeXMLBlocks.length; j++) {
            var _safeXMLBlock = _safeXMLBlocks[j];
            _newParts.push({ obj : _beginPart.obj, formatters : _beginPart.formatters, attr : _beginPart.attr, pos : _safeXMLBlock[0], posOrigin : _beginPart.posOrigin, conditions : _beginPart.conditions });
            _newParts.push({ obj : _beginPart.obj, formatters : _part.formatters     , attr : _beginPart.attr, pos : _safeXMLBlock[1], posOrigin : _part.posOrigin     , conditions : _beginPart.conditions });
          }
        }
      }
    }
    if (_conditionalBlockDetected.length > 0) {
      throw new Error('Missing at least one showEnd or hideEnd');
    }
    descriptor[_objName].xmlParts = descriptor[_objName].xmlParts.concat(_newParts);
  }
}


/**
 * Find begin and end of each part to repeat, and add info in descriptor
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @return {Array}             modify descriptor and return an array of odd parts
 */
function findAndSetExactPositionOfArrays (xml, descriptor) {
  var _oddZones = [];
  for (var _objName in descriptor) {
    var _obj = descriptor[_objName];
    if (_obj.type === 'array' && _obj.iterators.length>0) {
      var _roughPosStart = descriptor[_objName].position.start;
      var _roughPosEnd = descriptor[_objName].position.end;
      var _subString = xml.slice(Math.trunc(_roughPosStart), Math.trunc(_roughPosEnd));
      var _pivot = parser.findPivot(_subString);
      // TODO test if the _pivot is not null !!!!!!!!!!!!
      // absolute position of the pivot
      _pivot.part2Start.pos += _roughPosStart;
      _pivot.part1End.pos += _roughPosStart;
      var _realArrayPosition = parser.findRepetitionPosition(xml, _pivot, _roughPosStart);
      // TODO test if the repetition is found !!!!!!!!!!!!
      descriptor[_objName].position = {start : _realArrayPosition.startEven, end : _realArrayPosition.endEven, endOdd : _realArrayPosition.endOdd};
      descriptor[_objName].xmlParts.push({obj : _objName, array : 'start', pos : _realArrayPosition.startEven, posOrigin : _roughPosStart});
      descriptor[_objName].xmlParts.push({obj : _objName, array : 'end'  , pos : _realArrayPosition.endEven  , posOrigin : _roughPosEnd });
      _oddZones.push([_realArrayPosition.endEven, _realArrayPosition.endOdd]);
    }
  }
  return _oddZones;
}

/**
 * Return an array of all parts of the descriptor
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @return {Array}             all parts in one array
 */
function getAllParts (descriptor) {
  var _allSortedParts = [];
  for (var _objName in descriptor) {
    var _xmlParts = descriptor[_objName].xmlParts;
    for (var i = 0; i < _xmlParts.length; i++) {
      var _part = _xmlParts[i];
      _allSortedParts.push(_part);
    }
  }
  return _allSortedParts;
}

/**
 * get all node which have parents
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @return {Object}            the keys are a list of parent's names
 */
function getAllNodeWhichHaveParents (descriptor) {
  var _hasChildren = {};
  for (var _objName in descriptor.dynamicData) {
    var _obj = descriptor.dynamicData[_objName];
    _hasChildren[_obj.parent] = true;
  }
  return _hasChildren;
}

/**
 * get all leaves
 * @param  {Object} hasChildren object returned by getAllNodeWhichHaveParents
 * @param  {Object} descriptor  descriptor generated by the function splitMarkers
 * @return {Array}              array of leaves
 */
function getAllLeaves (hasChildren, descriptor) {
  var _treeLeaves = [];
  for (var _objName in descriptor.dynamicData) {
    if (hasChildren[_objName] === undefined) {
      var _obj = descriptor.dynamicData[_objName];
      var _tempObj = {
        objName        : _objName,
        parent         : _obj.parent,
        type           : _obj.type,
        parents        : [], // TODO use _obj.parents
        hasOnlyObjects : (_obj.type !== 'array') ? true : false,
        branchName     : ''
      };
      _treeLeaves.push(_tempObj);
    }
  }
  return _treeLeaves;
}

/**
 * Update treeLeaves, compute depth and unique branch name ...
 * @param  {Array}  treeLeaves  array returned by getAllLeaves
 * @param  {Object} descriptor  descriptor generated by the function splitMarkers
 */
function computeDepthAndBranchNames (treeLeaves, descriptor) {
  // for each leaf, go up in the tree until we reach the root
  for (var i = 0; i < treeLeaves.length; i++) {
    var _obj = treeLeaves[i];
    var _objParentName = _obj.parent;
    var _nbParents = 0;
    var _firstParentDepth = 0;
    // go up in the hierarchy until we reach the root
    while (_objParentName !== '') {
      _obj.parents.push(_objParentName);
      var _objParent = descriptor.dynamicData[_objParentName];
      if (_objParent.type === 'array') {
        _obj.hasOnlyObjects = false;
        if (_firstParentDepth === 0) {
          _firstParentDepth = _objParent.depth;
        }
      }
      _obj.branchName = _objParentName + ' ' +_obj.branchName; // the whitespace is the only character which cannot exist in the name of a node
      _objParentName = _objParent.parent;
      _nbParents++;
    }
    // store the depth of the leaf (= the depth of the first parent array)
    if (_obj.depth === undefined ) {
      _obj.depth = _firstParentDepth;
    }
    _obj.jsonDepth = _nbParents;
  }
}

/**
 * Sort function used by buildSortedHierarchy
 * @param  {Object} a one object of treeLeaves
 * @param  {Object} b one object of treeLeaves
 * @return {Integer}  1, -1, 0
 */
function sortByDepth (a,b) {
  // if the branch contains only objects, put it first
  if (a.hasOnlyObjects === true && b.hasOnlyObjects === false) {
    return -1;
  }
  else if (a.hasOnlyObjects === false && b.hasOnlyObjects === true) {
    return 1;
  }
  // if the two items do not share the same branch at all, sort them by branch name.
  if (a.branchName.indexOf(b.branchName) === -1 &&  b.branchName.indexOf(a.branchName) === -1) {
    if (a.branchName > b.branchName) {
      return 1;
    }
    else if (a.branchName < b.branchName) {
      return -1;
    }
  }
  // if we are in the same branch, sort by depth, shortest depth first
  if (a.depth > b.depth) {
    return 1;
  }
  else if (a.depth < b.depth) {
    return -1;
  }
  // if the depth is the same, put objects before arrays
  if (a.type !== 'array' && b.type === 'array') {
    return -1;
  }
  else if (a.type === 'array' && b.type !== 'array') {
    return 1;
  }
  if (a.jsonDepth > b.jsonDepth) {
    return 1;
  }
  else if (a.jsonDepth < b.jsonDepth) {
    return -1;
  }

  return 0;
}
