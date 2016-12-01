
/**
 * Flatten an array of String or Number
 * @param  {Array} d  array passed by carbone
 * @return {String}   computed result, or `d` if `d` is not an array
 */
function arrayJoin(d, separator){
  if(separator === undefined){
    separator = ', ';
  }
  if(d instanceof Array){
    return d.join(separator);
  }
  return d;
}

/**
 * Flatten an array of objects.
 * @param  {Array} d                   array passed by carbone
 * @param  {String} objSeparator       object separator (`, ` by default)
 * @param  {String} attributeSeparator attribute separator (`:` by default)
 * @return {String}                    the computed result, or `d` if `d` is not an array
 */
function arrayMap(d, objSeparator, attributeSeparator){
  if(objSeparator === undefined){
    objSeparator = ', ' ;
  }
  if(attributeSeparator === undefined){
    attributeSeparator = ':' ;
  }
  var _isAttributeFilterActive = arguments.length > 3;
  var _res = [];
  if(d instanceof Array){
    for (var i = 0; i < d.length; i++) {
      var _obj = d[i];
      var _flatObj = [];
      //if user want to print only some attributes, avoid looping on whole object
      if(_isAttributeFilterActive === true){
        for (var j = 3; j < arguments.length; j++) {
          var _attr = arguments[j];
          _flatObj.push(_obj[_attr]);
        }
      }
      //else, loop on all attributes and print each one it is not an object
      else{
        for(var _attr in _obj){
          var _val = _obj[_attr];
          if(!(_val instanceof Object)){
            _flatObj.push(_val);
          }
        }
      }
      _res.push(_flatObj.join(attributeSeparator));
    }
    return _res.join(objSeparator);
  }
  return d;
}

module.exports = {
  arrayJoin : arrayJoin,
  arrayMap  : arrayMap
};
