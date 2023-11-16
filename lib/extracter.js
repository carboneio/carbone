var parser = require('./parser');
var helper = require('./helper');
var params = require('./params');

const ARRAY_FILTER_OPERATORS = {
  '!=' : 'NE',
  '==' : 'EQ',
  '>'  : 'GT',
  '<'  : 'LT'
};

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

      var _currentMarkerStr = '';
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
        _currentMarkerStr += _char;
        // if we enter in a string (it will keep whitespaces)
        if (_char === "'" || _char === '"') {
          _isString = !_isString;
        }
        if (_isArray === true) {
          if (_char === '[') {
            throw Error(`Carbone does not accept square brackets inside array filters in ${helper.printMarker(markers, i)}. Please contact the support to add this feature.`);
          }
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
        else if (_isFormatter === true && _char===')' && _isString===false) {
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
          if (_objectNameWhereStartMultiplePoints !== '') {
            // when coming from .., set _prevMarker as usual
            _prevMarker = _uniqueMarkerName;
          }
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
        else if (_char === '.' && _prevChar === '.' && _isArray === false) {
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
            if (_res[_prevMarker] && _res[_prevMarker].type !== 'object') {
              _res[_prevMarker].hasSubAtt = true; // #patch20230227 (used as an array of string detector)
            }
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
            _isIteratorUsedInCurrentArray = true; // +1 or not
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
            if (_res[_uniqueMarkerName] && _res[_uniqueMarkerName].position === undefined) {
              throw Error(`The attribute "${_res[_uniqueMarkerName].name}" in ${helper.printMarker(markers, i)} cannot be used as an array "[]" and an object "." in the same time. Example: ${helper.printMarker(markers, _res[_uniqueMarkerName]?.xmlParts?.[0]?.markerId)}`);
            }
            // If we detect new start of an already known array
            if (_res[_uniqueMarkerName] && ( _res[_uniqueMarkerName].position.end !== undefined
              // case when {d[]:aggAcount} is used before a loop {d[i]:aggAcount}, we must start a new array. TODO: But we could avoid duplicated array like this
              || _isIteratorUsedInCurrentArray === true && _res[_uniqueMarkerName]?.type === 'objectInArray') ) {

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
              // extract filters
              [_uniqueMarkerName, _conditions, _conditionsToFindObjectInArray] = extracter.getNewArrayNameWithConditions(_uniqueMarkerName, _conditions);
            }
            // create the new array
            if (!_res[_uniqueMarkerName]) {
              if (_res[_prevMarker] && _res[_prevMarker].type !== 'object') {
                _res[_prevMarker].hasSubAtt = true; // #patch20230227 (used as an array of string detector)
              }
              _res[_uniqueMarkerName]={
                name      : _arrayName,
                type      : (_isIteratorUsedInCurrentArray === true) ? 'array' : 'objectInArray',
                parent    : _prevMarker,
                parents   : _parents.slice(0),
                position  : {},
                iterators : [],
                hasSubAtt : false, // for the moment, consider it is potentially an array of string or number #patch20230227
                xmlParts  : []
              };
            }
            if (_isIteratorUsedInCurrentArray === true && _res[_uniqueMarkerName].position.start === undefined) {
              _res[_uniqueMarkerName].position.start = _markerPos;
              _res[_uniqueMarkerName].position.startMarkerId = i; // keep marker index for error output
            }
            if (_isIteratorUsedInCurrentArray === false) {
              _res[_uniqueMarkerName].conditions = _conditionsToFindObjectInArray;
              _conditionsToFindObjectInArray = [];
            }
            _prevMarker = _uniqueMarkerName;
          }
          // If it was the second part of the array ("i+1")
          else {
            if (_isIteratorUsedInCurrentArray === false) {
              // extract filters
              [_uniqueMarkerName] = extracter.getNewArrayNameWithConditions(_uniqueMarkerName, _conditions);
            }
            if (_res[_uniqueMarkerName] === undefined) {
              throw Error(`The marker ${helper.printMarker(markers, i)} has no corresponding ${helper.printMissingMarker(_currentMarkerStr)} marker before or is not placed correctly. Please add markers to describe the i-th section of the repetition.`);
            }
            if (_res[_uniqueMarkerName].position.end === undefined) {
              _res[_uniqueMarkerName].position.end = _markerPos;
              _res[_uniqueMarkerName].position.endMarkerId = i; // keep marker index for error output
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
          posOrigin  : _markerPos,
          markerId   : i
        };
        if (_conditions.length > 0) {
          _xmlPart.conditions = _conditions;
        }
        _res[_objOwner].xmlParts.push(_xmlPart);
        if (_res[_objOwner].type !== 'object' && _word !== '') {
          _res[_objOwner].hasSubAtt = true; // #patch20230227 (used as an array of string detector)
        }
      }
    }
    return _res;
  },

  /**
   * Gets the new array name, and separate array conditions.
   *
   * @param   {String}  uniqueMarkerName  The unique marker name
   * @param   {Array}   allConditions     All conditions
   * @return  {Array}   The new array name with separated conditions
   */
  getNewArrayNameWithConditions : function (uniqueMarkerName, allConditions) {
    let _filterUniqueName = '';
    let i = allConditions.length - 1;
    for (; i >= 0 ; i--) {
      let _conditionToFindObject = allConditions[i];
      _filterUniqueName += helper.cleanJavascriptVariable(_conditionToFindObject.left.attr + '_' + ARRAY_FILTER_OPERATORS[_conditionToFindObject.operator] + '_' + _conditionToFindObject.right);
      // consider only allConditions of this array, thus only last rows which match with unique array name
      if (_conditionToFindObject.left.parent !== uniqueMarkerName ) {
        break;
      }
    }
    // extract conditions to find this object
    let _conditionsToFindObjectInArray = allConditions.slice(i + 1, allConditions.length);
    let _conditions = allConditions.slice(0, i + 1);
    let _uniqueMarkerName = this._cleanUniqueMarkerName(uniqueMarkerName + _filterUniqueName);

    // correction of previously detected conditions
    for (let m = 0; m < _conditionsToFindObjectInArray.length ; m++) {
      _conditionsToFindObjectInArray[m].left.parent += _filterUniqueName;
    }
    return [_uniqueMarkerName, _conditions,  _conditionsToFindObjectInArray];
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
  sortXmlParts_v5 : function (xmlParts) {
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
      if (a.array==='end'   && b.array==='end'  && b.obj !== a.obj /* happens when comparing end / oddEnd on same array */) {
        return (b.obj.length - a.obj.length);
      }

      // -1 =>  A comes first.
      // 1  =>  B comes first.
      // after detecting arrays and conditional blocks, some tags may have moved in XML.
      // It could create conflicts. Many tags of arrays and conditions can be at the same XML position.
      // So, we sort them using their start/end position to keep the XML hierarchy
      if (a.matchWithPos > 0 && b.matchWithPos > 0) {
        const _isAClosingTag = Math.trunc(a.pos) > Math.trunc(a.matchWithPos);
        const _isBClosingTag = Math.trunc(b.pos) > Math.trunc(b.matchWithPos);
        if (_isAClosingTag === false && _isBClosingTag === true) {
          return 1;
        }
        if (_isAClosingTag === true && _isBClosingTag === false) {
          return -1;
        }
        // two opening condition/array, or two closing condition/array. TODO trunc not necessary?
        if (Math.trunc(b.matchWithPos) !== Math.trunc(a.matchWithPos)) {
          return Math.trunc(b.matchWithPos) - Math.trunc(a.matchWithPos);
        }
        // array and condition perfectly aligned, array always wrap the condition to avoid deletion in odd zones (i+1) of endIf
        // two opening tags
        if (_isAClosingTag === true) {
          // a is an array, b is a condition
          if (a.array && !b.array) {
            return 1;
          }
          if (!a.array && b.array) {
            return -1;
          }
        }
        // two closing tags
        if (_isAClosingTag === false) {
          if (a.array && !b.array) {
            return -1;
          }
          if (!a.array && b.array) {
            return 1;
          }
        }
      }

      // if there is still a conflict (multiple condition at the same place)
      // Sort using their original position
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

      // if there is still a conflict (multiple condition at the same place)
      // Sort using their original position
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
   * Removes the <:tblGrid> of the table we are visiting
   *
   * If there is an horizontal repetition detected by splitXml, we remove <w:tblGrid> to fix tables in DOCX.
   * LibreOffice and MS Office re-computes this grid automatically: http://officeopenxml.com/WPtableGrid.php
   *
   * MS spec says:
   * If the table grid is omitted, then a new grid shall be constructed from the actual contents of the table assuming that all grid columns have a width of 0.
   * https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablegrid?view=openxml-2.8.1
   *
   * We remove the tableGrid of the table which contains hozirontal loop only. Otherwise it changes the format of all other tables!
   *
   * @param   {string}  str     The string
   * @return  {Object}  { isFound : true, text : textWithoutTableGrid }
   */
  removeLastTableGridDocx : function (str) {
    const _res = {
      isFound : true,
      text    : str
    };
    // find the beginning of the table we are visiting
    const _tableIndex = str?.lastIndexOf('<w:tbl>') ?? -1;
    // Find the last occurrence of '<w:tblGrid>`
    const _tableGridLastIndex = str?.lastIndexOf('<w:tblGrid>') ?? -1;
    // Maybe '<w:tblGrid>' is already removed, so we check that the '<w:tblGrid>' we've found is after the beginning of the table
    if (_tableGridLastIndex < _tableIndex) {
      return _res;
    }
    if (_tableGridLastIndex !== -1) {
      const _tableGridLastIndexEnd = str.lastIndexOf('</w:tblGrid>');
      _res.text = str.slice(0, _tableGridLastIndex) + str.slice(_tableGridLastIndexEnd + 12);
      return _res;
    }
    _res.isFound = false;
    return _res;
  },

  /**
   * Divide up the xml in the descriptor
   *
   * @param {string} xml : pure xml withous markers
   * @param {object} descriptor : descriptor generated by the function splitMarkers
   * @param {array} markers : list of all markers, used for error output
   * @return {object} descriptor with xml inside
   * @return {object} options
   */
  splitXml : function (xml, descriptor, markers, options) {
    const MARKER_PRESENCE_CHAR_REGEX = /\uFFFF/g;
    var _res = {
      staticData : {
        before : '',
        after  : ''
      },
      dynamicData : descriptor
    };

    var _allSortedParts = [];

    if (options?.preReleaseFeatureIn >= 4015000 || params.preReleaseFeatureIn >= 4015000) {
      // TODO next step v5
      // - make addFakeNodeForEachConditionalBlock safe when there are multiple time the same conditionnal block / array [9,9], [9,9] instead of removing duplicated node and hoping on posOrigin to keep the ordering
      //  - use posOrign to place the first part (ifBegin, or arrayStart), or parentArray/childArray and then the end is placed accordingly
      // - keep part position in flattened XML as a fake self-closing node with 1 char length
      // - insert fake begin/end loop node in  flattened XML, exactly like if/end wile conserving the hierarchy
      // - use directly this tree to spllit the XML. It should remove fixConditionalBlockPositionAroundArrays_v5  and sortXmlParts
      // - and use node.id as a sorting position for assembleXML instead of node.pos with floats?
      const _xmlFlattened = parser.flattenXML_v5(xml);
      // find and fix conditional block to keep a valid XML
      const _newFlattenedXML = findAndSetValidPositionOfConditionalBlocks_v5(_xmlFlattened, descriptor, markers);
      // Find the exact positions of all arrays, using the new XML m
      findAndSetExactPositionOfArrays_v5(_newFlattenedXML, descriptor, markers);
      // Extract all parts independently
      _allSortedParts = getAllParts(descriptor);
      // And sort them by ascendant positions
      extracter.sortXmlParts_v5(_allSortedParts);
    }
    else {
      findAndSetValidPositionOfConditionalBlocks(xml, descriptor, markers);
      // Find the exact positions of all arrays
      findAndSetExactPositionOfArrays(xml, descriptor, markers);
      // Extract all parts independently
      _allSortedParts = getAllParts(descriptor);
      // And sort them by ascendant positions
      extracter.sortXmlParts(_allSortedParts);
    }

    // if all parts are empty, return all the xml
    if (_allSortedParts.length === 0) {
      _res.staticData.before = xml.slice(0).replace(MARKER_PRESENCE_CHAR_REGEX,'');
      return _res;
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
          if (_part.isOdd === true) {
            descriptor[_part.obj].position.endOdd = _part.pos;
          }
          else {
            descriptor[_part.obj].position.end = _part.pos;
          }
        }
      }
      _prevPart = _part;
    }
    // Detect parts and objects which are in i+1 section of a parent array. All these part will be removed later
    detectElementInOddSection(descriptor, _allSortedParts);

    const _horizontalRepetitionPart = [];
    _prevPart = {};
    for (var i = 0; i < _allSortedParts.length; i++) {
      var _part = _allSortedParts[i];
      if (_part.toDelete === true) {
        // if toDelete = true, we are in the odd part of the array. This xml part will be removed. TODO, why not deleted earlier?
        continue;
      }
      var _pos  = Math.trunc(_part.pos); // can be a float
      if (i===0) {
        _res.staticData.before = xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
      }
      if (_prevPart.array === 'start') {
        _arrayDepth++;
        _prevPart.after = xml.slice(_prevPos, _pos).replace(MARKER_PRESENCE_CHAR_REGEX,'');
        // DOCX: detect horizontal loop in docx to remove `<w:tblGrid> </w:tblGrid>`
        // In Carbone v5, it would be better to detect there is an horizontal loop in preprocessing instead of here
        if (options?.extension === 'docx' && /^[\s]*<w:tc>/.test(_prevPart.after) === true && xml.indexOf('<w:document ') !== -1) {
          _horizontalRepetitionPart.push(i);
        }
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
        _prevPart.after = _xmlPart;
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
      _prevPart = _part;
    }
    // the end, put the last xml part in the staticData object
    _res.staticData.after = xml.slice(_prevPos).replace(MARKER_PRESENCE_CHAR_REGEX,'');

    // If there is at least one horizontal loop, remove  <w:tblGrid> of each table containing an horizontal loop
    if (_horizontalRepetitionPart.length > 0) {
      let _removedTableGridText = {};
      for (let h = _horizontalRepetitionPart.length - 1 ; h >= 0; h--) {
        const _indexHorizontal = _horizontalRepetitionPart[h];
        for (let k = _indexHorizontal; k >= 0; k--) {
          const _part = _allSortedParts[k];
          _removedTableGridText = extracter.removeLastTableGridDocx(_part.after);
          _part.after = _removedTableGridText.text;
          if (_removedTableGridText.isFound === true) {
            break;
          }
          _removedTableGridText = extracter.removeLastTableGridDocx(_part.before);
          _part.before = _removedTableGridText.text;
          if (_removedTableGridText.isFound === true) {
            break;
          }
          if (_part.array === 'start') {
            _removedTableGridText = extracter.removeLastTableGridDocx(descriptor[_part.obj].before);
            descriptor[_part.obj].before = _removedTableGridText.text;
            if (_removedTableGridText.isFound === true) {
              break;
            }
          }
        }
        if (_removedTableGridText.isFound === false) {
          _res.staticData.before = extracter.removeLastTableGridDocx(_res.staticData.before).text;
        }
      }
    }

    return _res;
  },


  /**
   * Generate an array which contains in which order the builder should travel the dynamicData
   * 
   * NEW version for Carbone v5
   *
   * @param  {object} descriptor : descriptor returned by splitXml
   * @return {object} descriptor with the hierarchy array
   */
  buildSortedHierarchyNew : function (descriptor) {
    const _objectsToSort = [];
    // build a temp array for sorting
    for (const _objName in descriptor.dynamicData) {
      const _obj = descriptor.dynamicData[_objName];
      const _sortObj = {
        objName        : _objName,
        posArrayStart  : _obj?.position?.start,
        jsonDepth      : 0
      };
      // go up in the hierarchy until we reach the root
      let _objParentName = _obj.parent;
      while (_objParentName !== '') {
        const _objParent = descriptor.dynamicData[_objParentName];
        if (_objParent.type === 'array') {
          if (_sortObj.posArrayStart === undefined) {
            _sortObj.posArrayStart = _objParent.position.start;
          }
        }
        _objParentName = _objParent.parent;
        _sortObj.jsonDepth++;
      }
      if (_sortObj.posArrayStart === undefined) {
        _sortObj.posArrayStart = 0;
      }
      _objectsToSort.push(_sortObj);
    }
    _objectsToSort.sort(sortByXMLloopAndJSONDepth);
    // store result
    descriptor.hierarchy = _objectsToSort.map(a => a.objName);
    return descriptor;
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
   * delete and move xmlPart which are not in the right place and add preparsed formatters
   *
   * @param  {object} descriptor : descriptor returned by splitXml
   * @return {object} descriptor with modified xmlParts
   */
  deleteAndMoveNestedParts : function (descriptor) {
    for (var _objName in descriptor.dynamicData) {
      var _xmlParts =  descriptor.dynamicData[_objName].xmlParts;
      for (var i = 0; i < _xmlParts.length; i++) {
        var _part = _xmlParts[i];
        if (_part.formatters) {
          _part.parsedFormatter = _part.formatters.map(extracter.parseFormatter);
        }
        if (_part.moveTo !== undefined && _part.moveTo !== _objName /* avoid infinite loop patch20231116 */) {
          descriptor.dynamicData[_part.moveTo].xmlParts.push(_part);
          // For aggregator, we must keep xml part. These duplicated parts are removed later in the builder
          if (descriptor.dynamicData[_objName].type !== 'objectInArray') {
            _xmlParts.splice(i--, 1);
            delete _part.moveTo;
          }
        }
        else if (_part.toDelete === true) {
          delete _part.toDelete;
          _xmlParts.splice(i--, 1);
        }
      }
      if (descriptor.dynamicData[_objName].toDelete === true) {
        const _indexOfObject = descriptor.hierarchy.indexOf(_objName);
        descriptor.hierarchy.splice(_indexOfObject, 1);
        delete descriptor.dynamicData[_objName];
      }
    }
    return descriptor;
  },

  /**
   * Parse formatters
   *
   * @param  {String} formatterString  formatter string "sumAgg(.i)"
   * @return {Object}                  { str : 'sumAgg', args : '.i' }
   */
  parseFormatter : function (formatterString = '') {
    if (typeof(formatterString) !== 'string' || formatterString.length === 0 ) {
      return null;
    }
    // extract formatter only
    const _firstIndexParenthesis    = formatterString.indexOf('(');
    const _startPositionOfArguments = _firstIndexParenthesis === -1 ? formatterString.length : _firstIndexParenthesis;
    const _formatterObj = {
      str  : formatterString.slice(0, _startPositionOfArguments).trim(),
      args : []
    };
    // extract arguments only
    const _lastIndexParenthesis     = formatterString.lastIndexOf(')');
    const _endPositionOfArguments   = _lastIndexParenthesis === -1 ? formatterString.length : _lastIndexParenthesis;
    const _argumentStr = formatterString.slice(_startPositionOfArguments+1, _endPositionOfArguments).trim();
    if (_argumentStr === '') {
      return _formatterObj;
    }
    // escape "comma" which are between quotes by an invisible character
    const _argumentStrWithEscapedComma = _argumentStr.replace(/'[^']*?'/g, function (matched) {
      return matched.replace(/,/g, '\uFFFF');
    });
    const _arguments = _argumentStrWithEscapedComma.split(/ *, */);
    for (let i = 0; i < _arguments.length; i++) {
      // unescape commas, remove ending quote
      let _argument = _arguments[i].replace(/^ */, '').replace(/'? *$/, '').replace(/\uFFFF/g, ',');
      // if it starts with a quote
      if (_argument[0] === "'") {
        // remove it
        _argument = _argument.slice(1);
        // and if there is a dot just after the quote, we must disable the "dynamic variable system"
        // We insert a invisible character before the dot, which is removed by the builder later
        if (_argument[0] === '.' || _argument.startsWith('d.') === true || _argument.startsWith('c.') === true) {
          _argument = helper.HIDDEN_CHAR_DISABLE_VARIABLE + _argument;
        }
      }
      else if ( _formatterObj.str === 'set') {
        // the formatter set is special. We must deactivate the "dynamic variable system"
        _argument = helper.HIDDEN_CHAR_DISABLE_VARIABLE + _argument;
      }
      _formatterObj.args.push(_argument);
    }
    return _formatterObj;
  },

  /**
   * Generate data from marker descriptor
   *
   * Can be called multiple time to update the object, when markers are used in multiple XML files
   *
   * @param   {Object}  descriptor  The descriptor
   * @param   {Object}  data        Fake data generated or updated accessible in data.rootD
   * @return  {Object}  data        Fake data generated or updated accessible in data.d
   */
  generateDataFromMarker : function (descriptor, data = {}) {
    // TODO detect loop on object
    // TODO detect attributre in condition
    // put fake URL
    let _index = 0;
    for (const _objName in descriptor) {
      const _obj      = descriptor[_objName];
      const _xmlParts = _obj.xmlParts;
      if (data[_objName] === undefined) {
        data[_objName] = {};
      }
      // nest object or array
      if (_obj.parent !== '' && data[_obj.parent][_obj.name] === undefined) {
        data[_obj.parent][_obj.name] = data[_objName];
        if (_obj.type !== 'object') {
          // array or objectInArray
          data[_obj.parent][_obj.name] = [ data[_objName] ];
        }
      }
      // create attributes
      for (let i = 0; i < _xmlParts.length; i++) {
        let _part = _xmlParts[i];
        if ( _part.formatters.some( e => /formatN|div|add|sub|div/.test(e) === true )) {
          data[_objName][_part.attr] = _index++;
        }
        else {
          data[_objName][_part.attr] = _part.attr + _index++;
        }
      }
    }
    return data;
  }

};

module.exports = extracter;


/**
 * Find and change the position of IF/END to keep a valid XML
 *
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @param  {Object} markers    markers for debugging
 * @return {Array}
 */
function findAndSetValidPositionOfConditionalBlocks_v5 (xmlFlattened, descriptor, markers) {
  let _newFlattenXML = xmlFlattened;
  const _allConditionalBlock = [];
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
          throw new Error(`Missing showBegin or hideBegin of this tag ${helper.printMarker(markers, _part.markerId)}`);
        }
        // convert XML string into an array and find the array index of beginTextIndex
        var _safeXMLBlocks = parser.findSafeConditionalBlockPosition_v5(xmlFlattened, _beginPart.pos, _part.pos);
        if (_safeXMLBlocks.length > 0) {
          _beginPart.posOrigin = _beginPart.pos;
          _part.posOrigin      = _part.pos;
          _beginPart.pos       = _safeXMLBlocks[0][0];
          _part.pos            = _safeXMLBlocks[0][1];
          _part.matchWithPos      = _beginPart.pos;
          _beginPart.matchWithPos = _part.pos;
          _allConditionalBlock.push(_safeXMLBlocks[0]);
          for (var j = 1; j < _safeXMLBlocks.length; j++) {
            var _safeXMLBlock = _safeXMLBlocks[j];
            _allConditionalBlock.push(_safeXMLBlock);
            const _end   = { obj : _beginPart.obj, formatters : _part.formatters     , attr : _beginPart.attr, pos : _safeXMLBlock[1], posOrigin : _part.posOrigin     , conditions : _beginPart.conditions, matchWithPos : _safeXMLBlock[0]  };
            const _begin = { obj : _beginPart.obj, formatters : _beginPart.formatters, attr : _beginPart.attr, pos : _safeXMLBlock[0], posOrigin : _beginPart.posOrigin, conditions : _beginPart.conditions, matchWithPos : _safeXMLBlock[1] };
            _newParts.push(_begin);
            _newParts.push(_end);
          }
        }
      }
    }
    if (_conditionalBlockDetected.length > 0) {
      throw new Error(`Missing showEnd or hideEnd of these tags: ${_conditionalBlockDetected.map((item) => {
        return helper.printMarker(markers, item.markerId);
      }).join(', ')}`);
    }
    descriptor[_objName].xmlParts = descriptor[_objName].xmlParts.concat(_newParts);
  }
  _newFlattenXML = parser.addFakeNodeForEachConditionalBlock(_allConditionalBlock, _newFlattenXML);
  return _newFlattenXML;
}


/**
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @param  {Object} markers    markers for debugging
 * @return {Array}
 */
function findAndSetValidPositionOfConditionalBlocks (xml, descriptor, markers) {
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
          throw new Error(`Missing showBegin or hideBegin of this tag ${helper.printMarker(markers, _part.markerId)}`);
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
      throw new Error(`Missing showEnd or hideEnd of these tags: ${_conditionalBlockDetected.map((item) => {
        return helper.printMarker(markers, item.markerId);
      }).join(', ')}`);
    }
    descriptor[_objName].xmlParts = descriptor[_objName].xmlParts.concat(_newParts);
  }
}


/**
 * Find begin and end of each part to repeat, and add info in descriptor
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @param  {array} markers     list of all markers, used for error output
 * @return {Array}             modify descriptor and return an array of odd parts
 * ]
 */
function findAndSetExactPositionOfArrays_v5 (xmlFlattened, descriptor, markers) {
  var _oddZones = [];
  for (var _objName in descriptor) {
    var _obj = descriptor[_objName];
    if (_obj.type === 'array' && _obj.iterators.length>0) {
      var _arrayPosition = descriptor[_objName].position;
      var _roughPosStart = _arrayPosition.start;
      var _roughPosEnd = _arrayPosition.end;
      var _realArrayPosition = parser.findPivot_v5(xmlFlattened, Math.trunc(_roughPosStart), Math.trunc(_roughPosEnd));

      // if (!_pivot) {
      //  throw Error(`Unable to find what to repeat between marker ${helper.printMarker(markers, _arrayPosition.startMarkerId)} and ${helper.printMarker(markers, _arrayPosition.endMarkerId)}. Is the i-th [+1] section a repetition of the i-th section?`);

      descriptor[_objName].position = {start : _realArrayPosition.part1Start, end : _realArrayPosition.part1End, endOdd : _realArrayPosition.part2End};
      descriptor[_objName].xmlParts.push({obj : _objName, array : 'start', pos : _realArrayPosition.part1Start, posOrigin : _roughPosStart, matchWithPos : _realArrayPosition.part1End   });
      descriptor[_objName].xmlParts.push({obj : _objName, array : 'end'  , pos : _realArrayPosition.part1End  , posOrigin : _roughPosEnd  , matchWithPos : _realArrayPosition.part1Start });
      // keep endOdd to sort all parts with conditions and avoid some cases where a condition is partially removed in the odd part
      descriptor[_objName].xmlParts.push({obj : _objName, array : 'end', pos : _realArrayPosition.part2End , posOrigin : _roughPosEnd , matchWithPos : _realArrayPosition.part1End, isOdd : true, toDelete : true });
      _oddZones.push([_realArrayPosition.part1End, _realArrayPosition.part2End]);
    }
  }
  return _oddZones;
}

/**
 * Find begin and end of each part to repeat, and add info in descriptor
 * @param  {String} xml        xml to parse
 * @param  {Object} descriptor descriptor generated by the function splitMarkers
 * @param  {array} markers     list of all markers, used for error output
 * @return {Array}             modify descriptor and return an array of odd parts
 */
function findAndSetExactPositionOfArrays (xml, descriptor, markers) {
  var _oddZones = [];
  for (var _objName in descriptor) {
    var _obj = descriptor[_objName];
    if (_obj.type === 'array' && _obj.iterators.length>0) {
      var _arrayPosition = descriptor[_objName].position;
      var _roughPosStart = _arrayPosition.start;
      var _roughPosEnd = _arrayPosition.end;
      var _subString = xml.slice(Math.trunc(_roughPosStart), Math.trunc(_roughPosEnd));
      var _pivot = parser.findPivot(_subString);
      if (!_pivot) {
        throw Error(`Unable to find what to repeat between marker ${helper.printMarker(markers, _arrayPosition.startMarkerId)} and ${helper.printMarker(markers, _arrayPosition.endMarkerId)}. Is the i-th [+1] section a repetition of the i-th section?`);
      }
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
        objName         : _objName,
        parent          : _obj.parent,
        type            : _obj.type,
        parents         : [], // TODO use _obj.parents
        hasOnlyObjects  : (_obj.type !== 'array') ? true : false,
        branchName      : '',
        branchArrayOnly : ''
      };
      _treeLeaves.push(_tempObj);
    }
  }
  return _treeLeaves;
}


/**
 * Sort function used by buildSortedHierarchyNew
 *
 * @param  {Object} a
 * @param  {Object} b
 * @return {Integer}  1, -1, 0
 */
function sortByXMLloopAndJSONDepth (a,b) {
  if (a.posArrayStart < b.posArrayStart) {
    return -1;
  }
  else if (a.posArrayStart > b.posArrayStart) {
    return 1;
  }
  if (a.jsonDepth < b.jsonDepth) {
    return -1;
  }
  else if (a.jsonDepth > b.jsonDepth) {
    return 1;
  }
  return 0;
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
      // the whitespace is the only character which cannot exist in the name of a node
      // sort by object first
      _obj.branchName = (_objParent.type === 'array' ? 1 : 0) + _objParentName + ' ' +_obj.branchName;
      _obj.branchArrayOnly = (_objParent.type === 'array') ? _objParentName + ' ' +_obj.branchArrayOnly : _obj.branchArrayOnly;
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
    // only if the two elements share the same parent array branch #patch20221205
    if (a.branchArrayOnly === b.branchArrayOnly) {
      // even in this case, sort by object first. See the unit test containing the text #patch20221130
      if (a.type !== 'array' && b.type === 'array') {
        return -1;
      }
      else if (a.type === 'array' && b.type !== 'array') {
        return 1;
      }
    }
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

/**
 * Determines if [start, end] range is included in a list of ranges
 *
 * @param   {number}   start         The start of the range to search
 * @param   {number}   end           The end of the range to search
 * @param   {<type>}   sortedRanges  List of range with this format: [[start, end], [start, end]]
 * @return  {boolean}  True if included in ranges, False otherwise.
 */
function isIncludedInRanges (start, end, sortedRanges) {
  for (var i = 0; i < sortedRanges.length && sortedRanges[i][0] < end; i++) {
    var _range = sortedRanges[i];
    if (start > _range[0] && end < _range[1]) {
      return true;
    }
  }
  return false;
}

/**
 * Detect markers and loops which are inside the i-th+1 section (odd part) of a parent loop
 *
 * It sets toDelete = true on parts and objects. It will be deleted later.
 *
 * @param  {Object}  descriptor     The descriptor
 * @param  {Array}   allSortedParts  All sorted parts
 */
function detectElementInOddSection (descriptor, allSortedParts) {
  const _oddZones = [];
  // get only odd zones
  for (let _objName in descriptor) {
    const _obj = descriptor[_objName];
    if (_obj.type === 'array') {
      _oddZones.push([_obj.position.end, _obj.position.endOdd]);
    }
  }
  // sort for performance
  _oddZones.sort((a, b) => {
    return a[1] - b[0];
  });
  // delete nested arrays which are repeated in i+1 section. Useless for the algorithm, as we repeat only the i-th section
  for (let _objName in descriptor) {
    const _obj = descriptor[_objName];
    if (_obj.type === 'array') {
      if (isIncludedInRanges( _obj.position.start,  _obj.position.end, _oddZones) === true) {
        _obj.toDelete = true;
      }
    }
  }
  for (var i = 0; i < allSortedParts.length; i++) {
    const _part = allSortedParts[i];
    if (isIncludedInRanges(_part.pos, _part.pos, _oddZones) === true) {
      _part.toDelete = true;
    }
  }
}

