var util = require('util');
var parser = require('./parser');

var extracter = {

  /**
   * Split markers in order to build a usable descriptor
   *
   * @param {array} markers : array of markers with their position
   * @return {object} descriptor
   */
  splitMarkers : function(markers){
    var _res = {};
    var _visitedArray = {};
    for (var i = 0; i < markers.length; i++){
      var _marker = markers[i].name;
      var _markerPos = markers[i].pos;

      var _word = '';
      var _prevMarker = ''; 
      var _uniqueMarkerName = '';
      var _uniqueArrayName = '';
      var _arrayName = '';
      var _iterators = [];
      var _prevChar = '';
      var _isFormatter = false;
      var _isFormatterParenthesis = false;
      var _isString = false;
      var _formaters = [];
      var _formatterStr = '';
      var _isArray = false;
      var _conditions = [];
      // Loop on each char.
      // We do not use regular expressions because it is a lot easier like that.
      for (var c = 0; c < _marker.length; c++){
        var _char = _marker.charAt(c);

        //if we enter in a string (it will keep whitespaces)
        if(_char==="'"){
          _isString = !_isString;
        }

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
        else if(_isFormatter === true && (_char!==' ' || _isString===true) ){
          _formatterStr += _char;
        }
        //if we enter into the brakets of an array
        else if (_char==='['){
          _isArray = true;
          _uniqueMarkerName += _word;
          _arrayName = _word;
          //If we are in a multidimensional array
          if(_prevChar === ']'){
            _uniqueMarkerName += '_';
          }
          _uniqueArrayName = _uniqueMarkerName;
          _uniqueMarkerName += _visitedArray[_uniqueArrayName] || '';
          _word = '';
          _isFormatter = false;
        }
        //if we enter into an object
        else if(_char==='.' && _isArray === false){
          _uniqueMarkerName += _word;
          if(!_res[_uniqueMarkerName]){
            _res[_uniqueMarkerName]={
              'name' : _word,
              'type' : 'object',
              'parent': _prevMarker,
              'xmlParts' : []
            };
          }
          _prevMarker = _uniqueMarkerName;
          _word = '';
          _isFormatter = false;
        }
        //if this is not a whitespace, keep the word
        else if (_char!==' ' || _isString===true) {
          _word += _char;
        }
        
        if (_isArray === true){
          //detect array condition
          var _result = /([^,]+)([=><])(\S+)[,\]]$/.exec(_word);
          if(_result instanceof Array){
            var _operator = (_result[2] === '=') ? '==' : _result[2];
            var _condition = {
              'left': {'parent':_uniqueMarkerName, 'attr':_result[1]},
              'operator' : _operator,
              'right' : _result[3]
            };
            _conditions.push(_condition);
            _word = '';
          }
          //detect array iteration
          if(_word.substr(-2)==='+1'){
            var _iterator = _word.slice(0,-2).replace(',','');
            _iterators.push({'str':_iterator});
            _word = '';
          }
          else if (_word.substr(-2)==='++'){
            var _iterator = _word.slice(0,-2).replace(',','');
            _iterators.push({'str':_iterator,'isSpecial':true});
            _word = '';
          }
        }

        //if we exit the bracket of an array
        if (_char===']' && _isArray===true){
          //console.log(_word);
          
          //If it was the first part of the array (i without "i+1")
          if(_iterators.length === 0){
            //If we detect new start of an already known array
            if(_res[_uniqueMarkerName] && _res[_uniqueMarkerName].position.end !== undefined){
              
              if(!_visitedArray[_uniqueArrayName]){
                _visitedArray[_uniqueArrayName] = '';
              }
              _visitedArray[_uniqueArrayName] += '$';
              //correction of previously detected conditions
              for (var k = 0; k < _conditions.length; k++) {
                var _condition = _conditions[k];
                if(_condition.left.parent===_uniqueMarkerName){
                  _condition.left.parent += '$';
                }
              }
              _uniqueMarkerName += '$';
            }
            //create the new array
            if(!_res[_uniqueMarkerName]){
              _res[_uniqueMarkerName]={
                'name' : _arrayName,
                'type' : 'array',
                'parent': _prevMarker,
                'position' : {'start' : _markerPos},
                'iterators' :[],
                'xmlParts' : []
              };
            }
            _prevMarker = _uniqueMarkerName;
          }
          //If it was the second part of the array ("i+1")
          else {

            if(_res[_uniqueMarkerName].position.end === undefined){
              _res[_uniqueMarkerName].position.end = _markerPos;
              for (var it = 0; it < _iterators.length; it++) {
                var _iterator = _iterators[it];
                var _iteratorStr = _iterator.str;
                //if the iterator is in a sub-object. Ex: movie.sort+1
                var _iteratorInfo = {};
                if(/\./.test(_iteratorStr)===true){
                  var _splitIterator = _iteratorStr.split('.');
                  _iteratorInfo = {'obj':_splitIterator[0],'attr' : _splitIterator[1]};
                }
                else{
                  _iteratorInfo = {'attr' : _iteratorStr};
                }
                if(_iterator.isSpecial===true){
                  _iteratorInfo.isSpecial = true;
                  _res[_uniqueMarkerName].containSpecialIterator = true;
                }
                _res[_uniqueMarkerName].iterators.push(_iteratorInfo);
              };
            }
          }

          _word = '';
          _isFormatter = false;
          _isArray = false;
        }

        //remove whitespaces
        if(_char!==' '){
          _prevChar = _char;
        }
      }
      //do not store the odd part of an array
      if(_iterators.length === 0){
        //If there is a formatter, add it in the array of formatters
        if(_formatterStr !== ''){
          _formaters.push(_formatterStr);
        }
        var _xmlPart = {
          'attr' : _word,
          'formatters': _formaters,
          'obj' : _prevMarker,
          'pos' : _markerPos
        }
        if(_conditions.length>0){
          _xmlPart.conditions = _conditions;
        }
        _res[_prevMarker].xmlParts.push(_xmlPart);
      }
    }
    return _res;
  },

  /**
   * Sort xml parts. Used in splitXml 
   * @param  {Array} xmlParts (modified by the function)
   */
  sortXmlParts : function(xmlParts){
    xmlParts.sort(function(a,b){ 
      if (a.pos > b.pos) { return  1;}
      if (a.pos < b.pos) { return -1;}
      //When two arrays are incremented in the same time (d.tab[i+1].subtab[i+1]), pos is the same... 
      //I use the length of the string to garuantee that the loop "d.tab" is before "d.tab.subtab". 
      if (a.array==='start' && b.array==='start') { return (a.obj.length - b.obj.length);} 
      if (a.array==='end'   && b.array==='end'  ) { return (b.obj.length - a.obj.length);}
      //other basic cases:
      if (a.array==='start') { return -1;}
      if (b.array==='start') { return  1;}
      if (a.array==='end')   { return  1;}
      if (b.array==='end')   { return -1;}
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
  splitXml : function(xml, descriptor){
    var _that =this;
    var _res = {
      'staticData' : {
        'before': '',
        'after' : ''
      },
      'dynamicData': descriptor
    };

    // Find the exact positions of all arrays *********************
    for(var _objName in descriptor){
      var _obj = descriptor[_objName];
      if(_obj.type === 'array' && _obj.iterators.length>0){
        var _roughPosStart = descriptor[_objName].position.start;
        var _roughPosEnd = descriptor[_objName].position.end;
        var _subString = xml.slice(_roughPosStart, _roughPosEnd);
        var _pivot = parser.findPivot(_subString);
        //TODO test if the _pivot is not null !!!!!!!!!!!!
        //absolute position of the pivot 
        _pivot.part2Start.pos += _roughPosStart;
        _pivot.part1End.pos += _roughPosStart;
        var _realArrayPosition = parser.findRepetitionPosition(xml, _pivot, _roughPosStart);
        //TODO test if the repetition is found !!!!!!!!!!!!
        descriptor[_objName].position = {'start':_realArrayPosition.startEven, 'end':_realArrayPosition.endEven/*, 'startOdd':_realArrayPosition.startOdd, 'endOdd':_realArrayPosition.endOdd*/};
        descriptor[_objName].xmlParts.push({'obj':_objName, 'array':'start','pos':_realArrayPosition.startEven });
        descriptor[_objName].xmlParts.push({'obj':_objName, 'array':'end'  ,'pos':_realArrayPosition.endEven  ,'next':_realArrayPosition.endOdd});
      }
    }

    // Extract all parts independently and sort them by ascendant positions ******************
    var _allSortedParts = [];
    for(var _objName in descriptor){
      var _xmlParts = descriptor[_objName].xmlParts;
      for (var i = 0; i < _xmlParts.length; i++) {
        var _part = _xmlParts[i];
        _allSortedParts.push(_part);
      }
    }

    extracter.sortXmlParts(_allSortedParts);

    //if all parts are empty, return all the xml
    if(_allSortedParts.length === 0){
      _res.staticData.before = xml.slice(0);
    }

    // Slice the xml *********************************************
    var _prevPos = 0;
    var _prevPart = {};
    var _arrayDepth = 0;
    for (var i = 0; i < _allSortedParts.length; i++) {
      var _part = _allSortedParts[i];
      var _pos  = _part.pos;
      if(i===0){
        _res.staticData.before = xml.slice(_prevPos, _pos);
      }
      if(_prevPart.array === 'start'){
        _arrayDepth++;
        _prevPart.after = xml.slice(_prevPos, _pos);
        _prevPart.depth = _arrayDepth;
      }
      descriptor[_part.obj].depth = _arrayDepth;
      _part.depth = _arrayDepth;
      if(_part.array === 'end'){
        _part.before = xml.slice(_prevPos, _pos );
        _arrayDepth--;
      }
      if(!_prevPart.array && _part.array !== 'end'){
        _prevPart.after = xml.slice(_prevPos, _pos );
      }
      if(_prevPart.array && _prevPart.array === 'end'){
        if(_prevPos!==_pos){
          //if we have two adjacent arrays, keep the xml which is between in two arrys
          if(_part.array && _part.array==='start'){
            descriptor[_part.obj].before =  xml.slice(_prevPos, _pos);
          }
          else{
            _part.before = xml.slice(_prevPos, _pos);
          }
        }
      }
      _prevPos = _pos;
      //if there is a dead zone (ex. odd part of the array), jump to the next part
      if(_part.next){
        _prevPos = _part.next;
        delete _part.next;
      }
      //the end, put the last xml part in the staticData object
      if(i=== _allSortedParts.length-1){
        _res.staticData.after = xml.slice(_prevPos);
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
  buildSortedHierarchy : function(descriptor){
    var _treeLeaves = [];
    var _hasChildren = {};
    var _sortedNodes = [];

    //find all node which have parents
    for(var _objName in descriptor.dynamicData){
      var _obj = descriptor.dynamicData[_objName];
      _hasChildren[_obj.parent] = true;
    };
    //keep only leaves of the tree
    for(var _objName in descriptor.dynamicData){
      if(_hasChildren[_objName] === undefined){
        var _obj = descriptor.dynamicData[_objName];
        var _tempObj = {
          'objName' : _objName,
          'parent' : _obj.parent,
          'type': _obj.type,
          'parents' :[],
          'hasOnlyObjects' : (_obj.type === 'object') ? true : false,
          'branchName' :''
        };
        _treeLeaves.push(_tempObj);
      }
    };

    //for each leaf, go up in the tree until we reach the root
    for (var i = 0; i < _treeLeaves.length; i++) {
      var _obj = _treeLeaves[i];
      var _objParentName = _obj.parent;
      var _nbParents = 0;
      //go up in the hierarchy until we reach the root
      while(_objParentName !== ''){
        _obj.parents.push(_objParentName);
        var _objParent = descriptor.dynamicData[_objParentName];
        if(_objParent.type !== 'object'){
          _obj.hasOnlyObjects = false;
        }
        _obj.branchName = _objParentName + ' ' +_obj.branchName; //the whitespace is the only character which cannot exist in the name of a node
        _objParentName = _objParent.parent;
        _nbParents++; //count the number of parents
      }
      //store the depth of the leaf (= nb parents)
      _obj.depth = _nbParents;
    };
    
    //sort by depth  
    _treeLeaves.sort(function(a,b){ 
      //if the branch contains only objects, put it first
      if(a.hasOnlyObjects === true && b.hasOnlyObjects === false){
        return -1;
      }
      else if (a.hasOnlyObjects === false && b.hasOnlyObjects === true){
        return 1;
      }
      //if the two items do not share the same branch at all, sort them by branch name. 
      if(a.branchName.indexOf(b.branchName) === -1 &&  b.branchName.indexOf(a.branchName) === -1){
        if(a.branchName > b.branchName){
          return 1;
        }
        else if (a.branchName < b.branchName){
          return -1;
        }
      }
      //if we are in the same branch, sort by depth, shortest depth first
      if(a.depth > b.depth){
        return 1;
      }
      else if (a.depth < b.depth){
        return -1;
      }
      //if the depth is the same, put objects before arrays
      if(a.type === 'object' && b.type === 'array'){
        return -1;
      }
      else if (a.type === 'array' && b.type === 'object'){
        return 1;
      }

      return 0;
    });

    function insertIfNotExists(table, node){
      for(var i = 0; i < table.length; i++) {
        if(table[i] === node){
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
  }

};

module.exports = extracter;