var path  = require('path');
var helper = require('./helper');


var preprocessor = {

  /**
   * Execute preprocessor on main, and embedded document
   * @param  {Object}   template
   * @param  {Function} callback
   */
  execute : function (template, callback) {
    if (template === null || template.files === undefined) {
      return callback(null, template);
    }
    for (var i = -1; i < template.embeddings.length; i++) {
      var _mainOrEmbeddedTemplate = template.filename;
      var _parentFilter = '';
      if (i > -1) {
        _mainOrEmbeddedTemplate = _parentFilter = template.embeddings[i];
      }
      var _fileType = path.extname(_mainOrEmbeddedTemplate);
      switch (_fileType) {
        case '.xlsx':
          preprocessor.convertSharedStringToInlineString(template, _parentFilter);
          break;
        case '.odt':
          preprocessor.replaceColorMarkers(template);
        default:
          break;
      }
    }
    return callback(null, template);
  },

  replaceColorMarkers : function (template) {
    var _xmlPart = null;

    for (var _i = 0 ; _i < template.files.length ; _i++) {
      var _replacement = {};
      var _replacementCheckDuplicate = {};
      var _status = 0;
      var _toInsert = [];
      var _file = template.files[_i];
      var _colors = [];
      var _toAdd = [];
      var _finalStrToAdd = '';
      var _markerInserted = {};
      var _replacedName = [];
      if (/.+\.xml/.test(_file.name) === true) {
        // Search all bindColor
        var _reBindColor = /{(?:\s+)?bindColor\([^}]+}/m;
        while (_xmlPart = _reBindColor.exec(_file.data)) {
          var _marker = cleanMarker(_xmlPart[0]);
          var _reColors = /\(\s*(\S*)\s*,\s*(\S*)\s*\)\s*=\s*([^}]*)/g;
          var _dataColor = _reColors.exec(_marker);
          var _color = {
            color: '#' + _dataColor[1].toLowerCase(),
            marker: _dataColor[3]
          }
          _colors.push(_color);
          var _cleanXml = cleanXml(_xmlPart[0]);
          _file.data = [_file.data.slice(0, _xmlPart.index), _cleanXml, _file.data.slice(_xmlPart.index + _xmlPart[0].length)].join('');
        }
        // Get style tag to check color
        var _reStyle = /<style:style.*?<\/style:style>/gim;
        while (_xmlPart = _reStyle.exec(_file.data)) {
          var _reTextProp = /<style:text-properties.*?\/>/gi;
          if (_reTextProp.test(_xmlPart[0]) === true) {
            _reHexa = /(#[0-9a-z]{6})/gi;
            while (_xmlPart2 = _reHexa.exec(_xmlPart[0])) {
              var _newTag = null;
              // Check if this color is wanted to be replace
              var _newStr = _xmlPart[0];
              if ((_newTag = checkReplaceColor(_colors, _xmlPart2[1])) !== null) {
                // Check if the corresponding tag is a table
                if (_newTag.indexOf('[') === -1) {
                  // Replace color for a simple tag ex: {d.color}
                  _newStr = [_xmlPart[0].slice(0, _xmlPart2.index), _newTag, _xmlPart[0].slice(_xmlPart2.index + _xmlPart2[1].length)].join('');
                } else {
                  // Replace color for a table ex: d.perso[i].color, we create a new style with new name. Then we replace the name
                  // for each row of the table
                  for (var _k = 0 ; _k < _colors.length ; _k++) {
                    var _color = _colors[_k];
                    if (_xmlPart2[1] === _color.color) {
                      // Get the first and the last part of style tag
                      var _reTag = /(<.*?>)/gi;
                      var _index = 0;
                      var _firstTag = '';
                      var _lastTag = '';
                      while (_tag = _reTag.exec(_xmlPart[0])) {
                        if (_index === 0) {
                          _firstTag = _tag[1];
                        }
                        _index += 1;
                        _lastTag = _tag[1];
                      }
                      var _reTextProp = /<style:text-properties.*?\/>/gi;
                      var _reColor = /fo:color="([^"]*)"/gi;
                      var _reBackgroundColor = /fo:background-color="([^"]*)"/gi;
                      var _colorProp = null;
                      var _backProp = null;
                      var _newTagColor = null;
                      var _newTagBack = null;
                      // Get text-properties
                      var _properties = _reTextProp.exec(_xmlPart[0]);
                      if (_properties !== null) {
                        _colorProp = _reColor.exec(_properties[0]);
                        _backProp = _reBackgroundColor.exec(_properties[0]);
                        if (_colorProp !== null) {                        
                          _newTagColor = checkReplaceColor(_colors, _colorProp[1]);
                          if (_newTagColor === null) {
                            _newTagColor = _colorProp[1];
                          } else {
                            _newTagColor = _newTagColor;
                          }
                        }
                        if (_backProp !== null) {                        
                          _newTagBack = checkReplaceColor(_colors, _backProp[1]);
                          if (_newTagBack === null) {
                            _newTagBack = _backProp[1];
                          } else {
                            _newTagBack = _newTagBack;
                          }
                        }
                      }
                      // Get the name then replace it
                      var _name = /.*?style:name="([^"]*)"/gi.exec(_firstTag);
                      var _newName = _name[1].charAt(0) + _newTagColor + ' ' + _newTagBack;
                      var _strToAdd = '';
                      _replacedName.push({ oldName: _name[1], newName: _newName });
                      if (_markerInserted[_newTagColor + _newTagBack] === undefined) {
                        _strToAdd = _strToAdd + _firstTag.replace(_name[1], _newName) + '<style:text-properties ';
                        if (_colorProp !== null) {
                          _strToAdd = _strToAdd + 'fo:color="' + _newTagColor + '" ';
                        }
                        if (_backProp !== null) {
                          _strToAdd = _strToAdd + 'fo:background-color="' + _newTagBack + '" ';
                        }
                        _strToAdd = _strToAdd + '/>' + _lastTag;
                        _toAdd.push({ key: _newName, str: _strToAdd });
                      }
                      _markerInserted[_newTagColor + _newTagBack] = 1;
                    }
                  }
                }
              }
              // replace new style in _file.data
              _file.data = [_file.data.slice(0, _xmlPart.index), _newStr, _file.data.slice(_xmlPart.index + _xmlPart[0].length)].join('');
            }
          }
        }
        _toAdd = orderList(_toAdd);
        for (var _k = 0 ; _k < _toAdd.length ; _k++) {
          _finalStrToAdd = _finalStrToAdd + _toAdd[_k].str;
        }
        // Wait correction of boucle in tag
        var _indexAutoStyle = _file.data.indexOf('<office:automatic-styles>') + '<office:automatic-styles>'.length;
        _file.data = [_file.data.slice(0, _indexAutoStyle), _finalStrToAdd, _file.data.slice(_indexAutoStyle)].join('');
        // Now style have been added, we must replace old name by the new Name of the style
        for (var _j = 0 ; _j < _replacedName.length ; _j++) {
          _file.data = _file.data.replace(new RegExp('text:style-name="' + _replacedName[_j].oldName + '"', 'g'), 'text:style-name="' + _replacedName[_j].newName + '"');
        }
      }
    }
    return;
  },
  
  /**
   * [XLSX] Convert shared string to inline string in Excel format in order to be compatible with Carbone algorithm
   * @param  {Object} template     (modified)
   * @param  {String} parentFilter apply the transformation on a specific embedded file
   * @return {Object}              the modified template
   */
  convertSharedStringToInlineString : function (template, parentFilter) {
    var _sharedStrings = [];
    var _filesToConvert = [];
    var _sharedStringIndex = -1;
    // parse all files and find shared strings first
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (_file.parent === parentFilter) {
        if (/sharedStrings\.xml$/.test(_file.name) === true) {
          _sharedStringIndex = i;
          _sharedStrings = preprocessor.readSharedString(_file.data);
        }
        else if (/\.xml$/.test(_file.name) === true) {
          if (_file.name.indexOf('sheet') !== -1) {
            _filesToConvert.push(_file);
          }
        }
      }
    }
    preprocessor.removeOneFile(template, _sharedStringIndex, parentFilter);
    // once shared string is found, convert files
    for (var f = 0; f < _filesToConvert.length; f++) {
      var _modifiedFile = _filesToConvert[f];
      _modifiedFile.data = preprocessor.removeRowCounterInWorksheet(
                    preprocessor.convertToInlineString(_modifiedFile.data, _sharedStrings)
                  );
    }
    return template;
  },
  
  /**
   * [XLSX] Remove one file in the template and its relations
   * @param  {Object} template
   * @param  {Integer} indexOfFileToRemove index of the file to remove
   * @param  {String} parentFilter         filter to modify only an embedded document
   * @return {}                            it modifies the template directly
   */
  removeOneFile : function (template, indexOfFileToRemove, parentFilter) {
    if (indexOfFileToRemove < 0 || indexOfFileToRemove >= template.files.length) {
      return;
    }
    var _fileToRemove = template.files[indexOfFileToRemove];
    var _dirname  = path.dirname(_fileToRemove.name);
    var _basename = path.basename(_fileToRemove.name);
    template.files.splice(indexOfFileToRemove, 1);
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (_file.parent === parentFilter) {
        // remove relations
        if (_dirname + '/_rels/workbook.xml.rels' === _file.name) {
          var _regExp = new RegExp('<Relationship [^>]*Target="' + helper.regexEscape(_basename) + '"[^>]*\/>');
          _file.data = _file.data.replace(_regExp, '');
        }
      }
    }
  },

  /**
   * [XLSX] Parse and generate an array of shared string
   * @param  {String} sharedStringXml shared string content
   * @return {Array}                  array
   */
  readSharedString : function (sharedStringXml) {
    var _sharedStrings = [];
    if (sharedStringXml === null || sharedStringXml === undefined) {
      return _sharedStrings;
    }
    var _tagRegex = new RegExp('<si>(.+?)<\/si>','g');
    var _tag = _tagRegex.exec(sharedStringXml);
    while (_tag !== null) {
      _sharedStrings.push(_tag[1]);
      _tag = _tagRegex.exec(sharedStringXml);
    }      
    return _sharedStrings;
  },

  /**
   * [XLSX] Inject shared string in sheets
   * @param  {String} xml           sheets where to insert shared strings
   * @param  {Array} sharedStrings  shared string
   * @return {String}               updated xml
   */
  convertToInlineString : function (xml, sharedStrings) {
    if (typeof(xml) !== 'string') {
      return xml;
    }
    // find all tags which have attribute t="s" (type = shared string) 
    var _inlinedXml = xml.replace(/(<(\w)[^>]*t="s"[^>]*>)(.*?)(<\/\2>)/g, function (m, openTag, tagName, content, closeTag) {
      // change type of tag to "inline string"
      var _newXml = openTag.replace('t="s"', 't="inlineStr"');
      // get the index of shared string
      var _tab = /<v>(\d+?)<\/v>/.exec(content);
      if (_tab instanceof Array && _tab.length > 0) {
        // replace the index by the string
        var _sharedStringIndex = parseInt(_tab[1], 10);
        _newXml += '<is>' + sharedStrings[_sharedStringIndex] + '</is>' + closeTag;
        return _newXml;
      }
      // if something goes wrong, do nothing
      return m;
    });
    return _inlinedXml;
  },

  /**
   * [XLSX] Remove row and column counter (r=1, c=A1) in sheet (should be added in post-processing)
   * Carbone Engine cannot update these counter itself
   * @param  {String} xml sheet
   * @return {String}     sheet updated
   */
  removeRowCounterInWorksheet : function (xml) {
    if (typeof(xml) !== 'string') {
      return xml;
    }
    return xml.replace(/<(?:c|row)[^>]*(r="\S+")[^>]*>/g, function (m, rowValue) {
      return m.replace(rowValue, '');
    }).replace(/<(?:c|row)[^>]*(spans="\S+")[^>]*>/g, function (m, rowValue) {
      return m.replace(rowValue, '');
    }); 
  }
};

function orderList (list) {
  var _reI = /.*(\[i\]).([^}]*)/i;
  var _reIP1 = /.*(\[i\+1\]).([^}]*)/i;
  var _status = {};
  var _listI = [];
  var _listIP1 = [];
  var _finalList = [];

  for (var _i = 0 ; _i < list.length ; _i++) {
    var _resI = _reI.exec(list[_i].key);
    var _resIP1 = _reIP1.exec(list[_i].key);
    if (_resIP1 !== null) {
      _listIP1.push(list[_i])
    }
    if (_resI !== null) {
      _listI.push(list[_i])
    }
  }
  for (var _i = 0 ; _i < _listI.length ; _i++) {
    var _key = _listI[_i].key;
    var _splitedKey = _key.split(new RegExp('{|}', 'g'));
    var _strSearch = '';
    for (var _j = 0 ; _j < _splitedKey.length ; _j++) {
      var _elem = _splitedKey[_j];
      if (_elem.lastIndexOf('[i]') === -1) {
        _strSearch = _strSearch + _elem;
      } else {
        var _index = _elem.lastIndexOf('[i]');
        _strSearch = _strSearch + '{' + [_elem.slice(0, _index + 2), '+1', _elem.slice(_index + 2)].join('') + '}';
      }
    }
    var _result = null;
    for (var _j = 0 ; _j < _listIP1.length ; _j++) {
      if (_listIP1[_j].key === _strSearch) {
        _result = _listIP1[_j];
        _listIP1.splice(_j, 1);
        break;
      }
    }
    if (_result !== null) {
      _finalList.push(_listI[_i]);
      _finalList.push(_result);
    }
  }
  return _finalList;
}

function checkReplaceColor(colors, color) {
  var _newTag = null;
  for (var _i = 0 ; _i < colors.length ; _i++) {
    if (colors[_i].color.toLowerCase() === color.toLowerCase()) {
      _newTag = '{' + colors[_i].marker + '}';
    }
  }
  return _newTag;
}

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

module.exports = preprocessor;