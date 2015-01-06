var path  = require('path');
var fs = require('fs');
var params = require('./params');
var helper = require('./helper');


var preprocessor = {
  
  convertSharedStringToInlineString : function(template){
    if(template === null || template.files === undefined || /xlsx$/i.test(template.name)===false){
      return template;
    }
    var _sharedStrings = [];
    var _filesToConvert = [];
    //parse all files and find shared strings first
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if(/sharedStrings\.xml$/.test(_file.name) === true){
        _sharedStrings = preprocessor.readSharedString(_file.data);
      }
      else if (/\.xml$/.test(_file.name) === true){
        _filesToConvert.push(_file);
      }
    };
    //once shared string is found, convert files
    for (var i = 0; i < _filesToConvert.length; i++) {
      var _file = _filesToConvert[i];
      _file.data = preprocessor.convertToInlineString(_file.data, _sharedStrings);
    }
    return template;
  },

  readSharedString : function(sharedStringXml){
    var _sharedStrings = [];
    if(sharedStringXml === null || sharedStringXml === undefined){
      return _sharedStrings;
    }
    var _tagRegex = new RegExp('<si>(.+?)<\/si>','g');
    while ((_tag = _tagRegex.exec(sharedStringXml)) !== null){
      _sharedStrings.push(_tag[1]);
    }      
    return _sharedStrings;
  },

  convertToInlineString : function(xml, sharedStrings){
    if(typeof(xml) !== 'string'){
      return xml;
    }
    //find all tags which have attribute t="s" (type = shared string) 
    var _inlinedXml = xml.replace(/(<(\w)[^>]*t="s"[^>]*>)(.*?)(<\/\2>)/g, function(m, openTag, tagName, content, closeTag){
      //change type of tag to "inline string"
      var _newXml = openTag.replace('t="s"', 't="inlineStr"');
      //get the index of shared string
      var _tab = /<v>(\d+?)<\/v>/.exec(content);
      if(_tab instanceof Array && _tab.length > 0){
        //replace the index by the string
        var _sharedStringIndex = parseInt(_tab[1], 10);
        _newXml += '<is>' + sharedStrings[_sharedStringIndex] + '</is>' + closeTag;
        return _newXml;
      }
      //if something goes wrong, do nothing
      return m;
    });
    return _inlinedXml;
  }
};

module.exports = preprocessor;