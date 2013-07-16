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
    for (var i = 0; i < markers.length; i++){
      var _marker = markers[i].name;
      var _markerPos = markers[i].pos;

      var _word = '';
      var _prevMarker = ''; 
      var _uniqueMarkerName = '';
      var _iterator = '';
      var _prevChar = '';
      var _isFormatter = false;
      var _isFormatterParenthesis = false;
      var _formaters = [];
      var _formatterStr = '';
      var _isArray = false;
      var _conditions = [];
      // Loop on each char.
      // We do not use regular expressions because it is a lot easier like that.
      for (var c = 0; c < _marker.length; c++){
        var _char = _marker.charAt(c);

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
        //if we enter into the brakets of an array
        else if (_char==='['){
          _isArray = true;
          _uniqueMarkerName += _word;
          //If we are in a multidimensional array
          if(_prevChar === ']'){
            _uniqueMarkerName += '_';
          }
          if(!_res[_uniqueMarkerName]){
            _res[_uniqueMarkerName]={
              'name' : _word,
              'type' : 'array',
              'parent': _prevMarker,
              'position' : {'start' : _markerPos},
              'xmlParts' : []
            };
          }
          _prevMarker = _uniqueMarkerName;
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
        else if (_char!==' ') {
          _word += _char;
        }
        
        if (_isArray === true){
          //detect array condition
          var _result = /(\S+)([=><])(\S+)[,\]]$/.exec(_word);
          if(_result instanceof Array){
            var _operator = (_result[2] === '=') ? '==' : _result[2];
            var _condition = {
              'left': _result[1],
              'operator' : _operator,
              'right' : _result[3]
            };
            _conditions.push(_condition);
            _word = '';
          }

          //detect array iteration
          if(_word.substr(-2)==='+1'){
            _iterator = _word.slice(0,-2);
            if(_res[_uniqueMarkerName].position.end === undefined){
              _res[_uniqueMarkerName].position.end = _markerPos;
              //if this is a custom iterator, store its name
              if(_iterator !== 'i'){
                //if the iterator is in a sub-object. Ex: movie.sort+1
                if(/\./.test(_iterator)){
                  var _splitIterator = _iterator.split('.');
                  _res[_uniqueMarkerName].iterator = {'obj':_splitIterator[0],'attr' : _splitIterator[1]};
                }
                else{
                  _res[_uniqueMarkerName].iterator = {'attr' : _iterator};
                }
              }
            }
            _word = '';
          }
        }

        //if we exit the bracket of an array
        if (_char===']' && _isArray===true){
          //console.log(_word);
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
      if(_iterator === ''){
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

      //console.log('\n\n\n');
      //console.log(JSON.stringify(_res, null,2));
      //console.log('\n\n\n');
    }
    return _res;
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
      var _type = descriptor[_objName].type;
      if(_type === 'array'){
        var _roughPosStart = descriptor[_objName].position.start;
        var _roughPosEnd = descriptor[_objName].position.end;
        var _subString = xml.slice(_roughPosStart, _roughPosEnd);
        var _pivot = parser.findPivot(_subString);
        //absolute position of the pivot 
        _pivot.pos += _roughPosStart;
        var _realArrayPosition = parser.findRepetitionPosition(xml, _pivot);
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
    _allSortedParts.sort(function(a,b){ 
      if(a.pos > b.pos){
        return 1;
      }
      else if (a.pos < b.pos){
        return -1;
      }
      return 0;
    });

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
    var _hasChildren = {};
    var _sortedObj = [];

    //copy a part of the descriptor to simplify the sort algorithm
    for(var _objName in descriptor.dynamicData){
      var _obj = descriptor.dynamicData[_objName];
      var _tempObj = {
        'objName' : _objName,
        'parent' : _obj.parent,
        'type': _obj.type
      };
      _hasChildren[_obj.parent] = true;
      _sortedObj.push(_tempObj);
    }

    //resolve object dependency
    _sortedObj.sort(function(a,b){ 
      //the root "d" is always the first
      if(a.parent === ''){
        return -1;
      }
      if(b.parent === ''){
        return 1;
      }
      var _parentA = a.parent;
      var _parentB = b.parent;
      var _levelA = 0;
      var _levelB = 0;
      //go up in the hierarchy until we reach the root
      while(_parentA !== b.objName && _parentB !== a.objName && !(_parentA==='' && _parentB ==='')){
        if(_parentA!==''){
          _parentA =  descriptor.dynamicData[_parentA].parent;
          _levelA++;
        }
        if(_parentB!==''){
          _parentB =  descriptor.dynamicData[_parentB].parent;
          _levelB++;
        }
      }
      //manage direct dependency
      if(a.objName === _parentB){
        return -1;
      }
      if(_parentA === b.objName){
        return 1;
      }
      //push objects above arrays in general
      if(a.type === 'object' && b.type === 'array'){
        return -1;
      }
      if(b.type === 'object' && a.type === 'array'){
        return 1;
      }
      //push smallest branches above tallest ones (checking through parents)
      if(_levelA < _levelB){
        return -1;
      }
      if(_levelA > _levelB){
        return 1;
      }
      //push smallest branches above tallest ones (checking through children)
      if(_hasChildren[a.objName] === true && !_hasChildren[b.objName]){
        return 1;
      }
      if(_hasChildren[b.objName] === true && !_hasChildren[a.objName]){
        return -1;
      }
      return 0;
    });

    descriptor.hierarchy = [];
    for(var i=0; i < _sortedObj.length; i++){
      descriptor.hierarchy.push(_sortedObj[i].objName);
    }
    return descriptor;
  }

};

module.exports = extracter;