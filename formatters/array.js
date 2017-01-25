
/**
 * Flatten an array of String or Number
 *
 * @example [ ["homer", "bart", "lisa"]        ]
 * @example [ ["homer", "bart", "lisa"] , " | "]
 * @example [ ["homer", "bart", "lisa"] , ""   ]
 * @example [ [10, 50]                         ]
 * @example [ []                               ]
 * @example [ null                             ]
 * @example [ {}                               ]
 * @example [ 20                               ]
 * @example [                                  ]
 * 
 * @param  {Array}  d           array passed by carbone
 * @param  {String} separator   [optional] item separator (`,` by default)
 * @return {String}             computed result, or `d` if `d` is not an array
 */
function arrayJoin (d, separator) {
  if (separator === undefined) {
    separator = ', ';
  }
  if (d instanceof Array) {
    return d.join(separator);
  }
  return d;
}

/**
 * Flatten an array of objects?
 * It ignores nested objects and arrays
 *
 * @example [ [{"id":2, "name":"homer"}, {"id":3, "name":"bart"} ]              ]
 * @example [ [{"id":2, "name":"homer"}, {"id":3, "name":"bart"} ] , " - "      ]
 * @example [ [{"id":2, "name":"homer"}, {"id":3, "name":"bart"} ] , " ; ", "|" ]
 * @example [ [{"id":2, "name":"homer", "obj":{"id":20}, "arr":[12,23] }]       ]
 * @example [ ["homer", "bart", "lisa"]                                         ]
 * @example [ [10, 50]                                                          ]
 * @example [ []                                                                ]
 * @example [ null                                                              ]
 * @example [ {}                                                                ]
 * @example [ 20                                                                ]
 * @example [                                                                   ]
 *
 * @param  {Array} d                     array passed by carbone
 * @param  {String} objSeparator         [optional] object separator (`, ` by default)
 * @param  {String} attributeSeparator   [optional] attribute separator (`:` by default)
 * @return {String}                      the computed result, or `d` if `d` is not an array
 */
function arrayMap (d, objSeparator, attributeSeparator) {
  if (objSeparator === undefined) {
    objSeparator = ', ' ;
  }
  if (attributeSeparator === undefined) {
    attributeSeparator = ':' ;
  }
  var _isAttributeFilterActive = arguments.length > 3;
  var _res = [];
  if (d instanceof Array) {
    for (var i = 0; i < d.length; i++) {
      var _obj = d[i];
      var _flatObj = [];
      // if user want to print only some attributes, avoid looping on whole object
      if (_isAttributeFilterActive === true) {
        for (var j = 3; j < arguments.length; j++) {
          var _attr = arguments[j];
          _flatObj.push(_obj[_attr]);
        }
      }
      // else, loop on all attributes and print each one it is not an object
      else {
        for (var _attr in _obj) {
          var _val = _obj[_attr];
          if (!(_val instanceof Object)) {
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
