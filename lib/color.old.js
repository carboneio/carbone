var colors = {
   /**
   * Search color marker in odt file and replace them
   * @param   {Object}  template
   * @return  {Array}   template: template without bindColor markers and with nex markers inserted
   */
  replaceColorMarkersOdt : function (template) {
    var _xmlPart = null;
    for (var _i = 0 ; _i < template.files.length ; _i++) {
      var _file = template.files[_i];
      var _replacement = {};
      var _replacementCheckDuplicate = {};
      var _toAdd = [];
      if (/.+\.xml/.test(_file.name) === true) {
        findAllColors(_file.data, function (_colors, data) {
          var _finalStrToAdd = null;
          _file.data = data;
          // Get style tag to check color
          var _reStyle = /<style:style.*?<\/style:style>/gim;
          // eslint-disable-next-line no-cond-assign
          while (_xmlPart = _reStyle.exec(_file.data)) {
            var _reInside = /<style:style .*?style:name="(.*?)".*?>(.*?)<\/style:style>/i;
            var _outerTag = getOuterTag(_xmlPart[0]);
            var _reSplitTag = /<.*?>?(?:\/|<\/.*?)>/gi;
            var _reHexa = /#[a-fA-F0-9]{6}/gi;
            var _insideTagTable = _reInside.exec(_xmlPart[0]);
            var _styleName = _insideTagTable[1];
            var _insideTag = _insideTagTable[2];
            var _newName = _styleName.charAt(0);
            var _isArray = false;
            var _splitedTagTable = null;
            var _splitedHexa = null;

            // Loop on each tag inside style:style tag
            // eslint-disable-next-line no-cond-assign
            while (_splitedTagTable = _reSplitTag.exec(_insideTag)) {
              var _oldSplitedTagTable = _splitedTagTable[0];
              // eslint-disable-next-line no-cond-assign
              while (_splitedHexa = _reHexa.exec(_splitedTagTable[0])) {
                var _newTag = null;
                // Check if we must replace the color
                // eslint-disable-next-line no-cond-assign
                if ((_newTag = checkReplaceColor(_colors, _splitedHexa[0]))) {
                  _splitedTagTable[0] = [_splitedTagTable[0].slice(0, _splitedHexa.index), _newTag, _splitedTagTable[0].slice(_splitedHexa.index + _splitedHexa[0].length)].join('');
                  if (_newTag.indexOf('[') !== -1) {
                    _isArray = true;
                    _newName = _newName + _newTag + ' ';
                  }
                }
              }
              // Rebuild string
              _insideTag = [_insideTag.slice(0, _splitedTagTable.index), _splitedTagTable[0], _insideTag.slice(_splitedTagTable.index + _oldSplitedTagTable.length)].join('');
            }

            // Check if we have already replace it
            if (_newName.length > 1 && _replacementCheckDuplicate[_newName] === undefined) {
              _replacementCheckDuplicate[_newName] = 1;
              _replacement[_newName] = [];
              _finalStrToAdd = _outerTag.firstTag.replace(new RegExp('style:name="' + _styleName + '"', 'g'), 'style:name="' + _newName + '"') + _insideTag + _outerTag.lastTag;
              _toAdd.push({
                key : _newName,
                str : _finalStrToAdd
              });
            }
            if (_newName.length > 1) {
              _replacement[_newName].push(_styleName);
            }
            // Rebuild string and rebuild in _file.data if it's not an array
            // if it's an array, we build our style and add it next
            var _oldXmlPart = _xmlPart[0];
            _xmlPart[0] = _xmlPart[0].replace(_insideTagTable[2], _insideTag);
            if (_isArray === false) {
              _file.data = [_file.data.slice(0, _xmlPart.index), _xmlPart[0], _file.data.slice(_xmlPart.index + _oldXmlPart.length)].join('');
            }
          }
          // Order list style
          _toAdd = orderList(_toAdd);
          _finalStrToAdd = '';
          for (var _k = 0 ; _k < _toAdd.length ; _k++) {
            _finalStrToAdd = _finalStrToAdd + _toAdd[_k].str;
          }
          // Search style tag to add our proper style for array
          var _indexStyle = -1;
          if (_file.data.indexOf('<office:automatic-styles>') === -1) {
            if (_file.data.indexOf('<office:styles>') !== -1) {
              _indexStyle = _file.data.indexOf('<office:styles>') + '<office:styles>'.length;
            }
          }
          else {
            _indexStyle = _file.data.indexOf('<office:automatic-styles>') + '<office:automatic-styles>'.length;
          }
          if (_indexStyle !== -1) {
            _file.data = [_file.data.slice(0, _indexStyle), _finalStrToAdd, _file.data.slice(_indexStyle)].join('');
            for (var _i = 0 ; _i < Object.keys(_replacement).length ; _i++) {
              if (_replacement[findCouple(Object.keys(_replacement)[_i])] !== undefined) {
                for (var _j = 0 ; _j < _replacement[Object.keys(_replacement)[_i]].length ; _j++) {
                  _file.data = _file.data.replace(new RegExp('style-name="' + _replacement[Object.keys(_replacement)[_i]][_j] + '"', 'g'), 'style-name="' + Object.keys(_replacement)[_i] + '"');
                }
              }
            }
          }
        });
        if (_file.name.indexOf("content.xml") !== -1) {
          console.log(_file.data);
        }
      }
    }
    return template;
  },

  /**
   * Search color marker in Docx file and replace them
   * @param   {Object}  template
   * @return  {Array}   template: template without bindColor markers and with nex markers inserted
   */
  replaceColorMarkersDocx : function (template) {
    for (var _i = 0 ; _i < template.files.length ; _i++) {
      var _file = template.files[_i];
      if (/.+\.xml/.test(_file.name) === true) {
        findAllColors(_file.data, function (_colors, data) {
          _file.data = data;

          // get w:rPr tag to check color
          var _reStyle = /(<w:rPr>.*?<\/w:rPr>)/gim;
          var _xmlPart = null;

          // eslint-disable-next-line no-cond-assign
          while (_xmlPart = _reStyle.exec(_file.data)) {
            var _reHexa = /"(\S+?)"/gi;
            var _hexa = null;
            var _oldLength = _xmlPart[1].length;
            // eslint-disable-next-line no-cond-assign
            while (_hexa = _reHexa.exec(_xmlPart[1])) {
              var _newTag = null;
              // eslint-disable-next-line no-cond-assign
              if ((_newTag = checkReplaceColor(_colors, '#' + _hexa[1]))) {
                _xmlPart[1] = [_xmlPart[1].slice(0, _hexa.index + 1), _newTag, _xmlPart[1].slice(_hexa.index + _hexa[1].length + 1)].join('');
              }
            }
            _file.data = [_file.data.slice(0, _xmlPart.index), _xmlPart[1], _file.data.slice(_xmlPart.index + _oldLength)].join('');
          }
        });
      }
    }
    return template;
  }
}


/**  =================== Private =====================  */

/**
 * It search all {bindColor()} marker and return them in an array
 * @param   {String}  data -> xml parts
 * @return  {Array}   return an array with all colors to replace and the marker and the new xml without {bindColor()} marker
 */
function findAllColors (data, callback) {
  // Search all bindColor
  var _colors = [];
  var _toReplace = [];
  var _reBindColor = /{([\s\S]+?)\}/gm;
  var _xmlPart = null;
  // eslint-disable-next-line no-cond-assign
  while (_xmlPart = _reBindColor.exec(data)) {
    if (_xmlPart[0].indexOf('bindColor') !== -1) {
      var _marker = cleanMarker(_xmlPart[0]);
      var _reColors = /\(\s*(\S*)\s*,\s*(\S*)\s*\)\s*=\s*([^} ]*)/g;
      var _dataColor = _reColors.exec(_marker);
      if (_dataColor[3] !== '') {
        var _color = {
          color  : '#' + _dataColor[1].toLowerCase(),
          marker : _dataColor[3]
        };
        _colors.push(_color);
      }
      var _cleanXml = cleanXml(_xmlPart[0]);
      _toReplace.push({
        index    : _xmlPart.index,
        str      : _cleanXml,
        original : _xmlPart[0]
      });
    }
  }
  for (var _i = 0 ; _i < _toReplace.length ; _i++) {
    data = data.replace(_toReplace[_i].original, _toReplace[_i].str);
  }
  return callback(_colors, data);
}

/**
 * Check if the color must be replaced
 * @param   {Array}   colors -> All colors found in xml and that have to be replaced
 * @param   {String}  color -> The color found
 * @return  {String}  return the tag if tge color found has to be replaced, return else otherwise
 */
function checkReplaceColor (colors, color) {
  var _newTag = null;
  for (var _i = 0 ; _i < colors.length ; _i++) {
    if (colors[_i].color.toLowerCase() === color.toLowerCase()) {
      _newTag = '{' + colors[_i].marker + '}';
    }
  }
  return _newTag;
}

/**
 * find the equivalent for a marker, exemple
 * d.perso[i].color -> d.perso[i+1].color
 * d.perso[i+1].color -> d.perso[i].color
 * @param   {String} key
 * @return  {String} return the equivalent value in loop
 */
function findCouple (key) {
  var _splitedKey = key.split(new RegExp('{|}', 'g'));
  var _strSearch = '';
  for (var _j = 0 ; _j < _splitedKey.length ; _j++) {
    var _elem = _splitedKey[_j];
    var _last = null;
    var _lastIindex = _elem.lastIndexOf('[i]');
    var _lastIP1index = _elem.lastIndexOf('[i+1]');
    if (_lastIindex > _lastIP1index) {
      _last = '[i]';
    }
    else if (_lastIP1index > _lastIindex) {
      _last = '[i+1]';
    }
    if (_last === null) {
      _strSearch = _strSearch + _elem;
    }
    else {
      var _index = _elem.lastIndexOf(_last);
      if (_last === '[i]') {
        _strSearch = _strSearch + '{' + [_elem.slice(0, _index + 2), '+1', _elem.slice(_index + 2)].join('') + '}';
      }
      else if (_last === '[i+1]') {
        _strSearch = _strSearch + '{' + [_elem.slice(0, _index + 2), _elem.slice(_index + 4)].join('') + '}';
      }
    }
  }
  return _strSearch;
}


/**
 * Return the first and the last xml tag in a string
 * @param   {String} str
 * @return  {Object} return an object with the first and the last tag of a xml string
 */
function getOuterTag (str) {
  var _reTag = /(<.*?>)/gi;
  var _tag = null;
  var _firstTag = '';
  var _lastTag = '';
  var _index = 0;

  // eslint-disable-next-line no-cond-assign
  while (_tag = _reTag.exec(str)) {
    if (_index === 0) {
      _firstTag = _tag[0];
    }
    _index += 1;
    _lastTag = _tag[0];
  }
  var _ret = {
    firstTag : _firstTag,
    lastTag  : _lastTag
  };
  return _ret;
}



/**
 * Order a list of key like :
 * [{
 *  key: 'd.perso[i+1].color',
 *  str: ''
 * }, {
 *  key; 'd.perso[i].color',
 *  str: ''
 * }]
 * for this exemple it return :
 * [{
 *  key: 'd.perso[i].color',
 *  str: ''
 * }, {
 *  key; 'd.perso[i+1].color',
 *  str: ''
 * }]
 * @param   {Array} list
 * @return  {Array} return the ordered list receive in parmeter
 */
function orderList (list) {
  var _reI = /.*(\[i\]).([^}]*)/i;
  var _reIP1 = /.*(\[i\+1\]).([^}]*)/i;
  var _listI = [];
  var _listIP1 = [];
  var _finalList = [];

  for (var _i = 0 ; _i < list.length ; _i++) {
    var _resI = _reI.exec(list[_i].key);
    var _resIP1 = _reIP1.exec(list[_i].key);
    if (_resIP1 !== null) {
      _listIP1.push(list[_i]);
    }
    if (_resI !== null) {
      _listI.push(list[_i]);
    }
  }
  for (var _l = 0 ; _l < _listI.length ; _l++) {
    var _key = _listI[_l].key;
    var _splitedKey = _key.split(new RegExp('{|}', 'g'));
    var _strSearch = '';
    for (var _j = 0 ; _j < _splitedKey.length ; _j++) {
      var _elem = _splitedKey[_j];
      if (_elem.lastIndexOf('[i]') === -1) {
        _strSearch = _strSearch + _elem;
      }
      else {
        var _index = _elem.lastIndexOf('[i]');
        _strSearch = _strSearch + '{' + [_elem.slice(0, _index + 2), '+1', _elem.slice(_index + 2)].join('') + '}';
      }
    }
    var _result = null;
    for (var _m = 0 ; _m < _listIP1.length ; _m++) {
      if (_listIP1[_m].key === _strSearch) {
        _result = _listIP1[_m];
        _listIP1.splice(_m, 1);
        break;
      }
    }
    if (_result !== null) {
      _finalList.push(_listI[_l]);
      _finalList.push(_result);
    }
  }
  return _finalList;
}


/**
 * Return only the xml tag of a string
 * @param   {String} str
 * @return  {String} return xml
 */
function cleanXml (str) {
  var _finalStr = '';
  var _open = false;

  for (var _i = 0 ; _i < str.length ; _i++) {
    var _char = str[_i];
    if (_char === '<') {
      _open = true;
    }
    if (_open) {
      _finalStr = _finalStr + _char;
    }
    if (_char === '>') {
      _open = false;
    }
  }
  return _finalStr;
}

/**
 * Return only the text of a string, it removes XML tag
 * @param   {String} str
 * @return  {String} return marker
 */
function cleanMarker (str) {
  var _newStr = '';
  var _open = false;

  for (var _i = 0 ; _i < str.length ; _i++) {
    var _char = str[_i];
    if (_char === '<') {
      _open = true;
    }
    if (_open === false) {
      _newStr = _newStr + _char;
    }
    if (_char === '>') {
      _open = false;
    }
  }
  return _newStr;
}

module.exports = colors;