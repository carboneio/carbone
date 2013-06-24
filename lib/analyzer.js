var util = require('util');

var analyzer = {

  decomposeMarkers : function(markers){
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
      //we loop on each char because it simpler and faster than many regex
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
        //if we enter into an object
        else if(_char==='.'){
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
        //if we enter into the brakets of an array
        else if (_char==='['){
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
          if(_res[_uniqueMarkerName].position.end === undefined){
            _res[_uniqueMarkerName].position.end = _markerPos;
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
          'obj' : _prevMarker,
          'pos' : _markerPos
        }
        _res[_prevMarker].xmlParts.push(_xmlPart);
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
  }

};

module.exports = analyzer;