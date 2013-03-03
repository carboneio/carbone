var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var helper = require('./helper');

var rootPath = process.cwd();


var dataSource = {
  'companyName':'Ideolys',
  'companyAddress':'52 rue Jacques Yves Cousteau',
  'companyCity':'La Roche Sur Yon',
  'companyPostal':'85000',
  'name' : 'David Grelaud',
  'menus' : {
    'date' : '31 décembre 2012',
    'entree' : 'carottes',
    'plat' : 'boudin aux pommes',
    'dessert' : 'cookies à doudinette'
  },
  'menu' : [{
    'date':'Lundi',
    'mealType':'Dejeuner',
    'menuElement':[
      {
        'label' : 'carottes'
      },{
        'label' : 'Patates'
      },{
        'label' : 'Steak haché'
      },{
        'label' : 'Glace à la vanille'
      }
    ]
  }]
};

/**
 * kendoc framework
 */
var kendoc = {

  generate : function(data, template, destination){
    var that = this;
    var _filesToParse = [];

    unzip('./word.docx', function(destDir){
      _filesToParse = helper.walkDirSync(destDir, 'xml');

      for (var i = 0; i < _filesToParse.length; i++) {
        var _file = _filesToParse[i];
        console.log(_file);
        var _content = fs.readFileSync(_file, 'utf8');

        var _newContent = that.extractTags(_content, dataSource);

        fs.writeFileSync(_file, _newContent, 'utf8');
      };
      var _result = path.join(rootPath, 'wordResult.docx');
      zip(destDir, _result, function(){
        console.log('end');
      });
    });

  },

  getXMLBuilderFunction : function(descriptor){
    var _str = "var _strResult = '';\n";
    _str += "var d0 = (data != null)?data:{};\n";
    _str += "var _strPart = {};\n";
    _str += "var _strParts = [];\n";
    _str += "var _absPosition = 0;\n";
    _str += "var _localPosition = 0;\n";
    //_str += "var _nestedArrayParams = [];\n";
    var _lastArrayEnd = 0;
    var _nestedArray  = 0;
    var _d0Type = 'object';

    var _dynamicData = descriptor.dynamicData || {};
    var _staticData = descriptor.staticData || {};
    //delcare all variable
    for(var _objName in _dynamicData){
      if(_objName !== 'd0' ){
        _str+= "var "+_objName+" = {};\n";
      }
      else{
        _d0Type = _dynamicData[_objName].type;
      }
    }

    //For each object, generate the code
    for(var _objName in _dynamicData){
      var _realObjName = _dynamicData[_objName].name;
      var _type = _dynamicData[_objName].type; 
      var _objParentName = _dynamicData[_objName].parent; 
      var _xmlParts = _dynamicData[_objName].xmlParts; 
      var _posStart = _dynamicData[_objName].position.start;
      var _posEnd = _dynamicData[_objName].position.end;
      var _width = _posEnd - _posStart; 

      //close previously created for loops
      if((_nestedArray > 0) && (_lastArrayEnd <= _posStart)){
        while(_nestedArray > 0){
          _str += "}\n";
          _nestedArray--;
        }
      }
      //Object type
      if(_type === 'object'){
        //declare any nested object
        if(_objName!=='d0'){
          _str += _objName+"="+ _objParentName+"['"+_realObjName+"'];\n";
        }
      }
      //Array type
      else if(_type === 'array'){
        var _arrayIndexName = _objName+"_i"; 
        var _arrayName = _objName+"_array"; 
        //declare any nested object
        if(_objName!=='d0'){
          _str += "var "+_arrayName+"="+ _objParentName+"['"+_realObjName+"'];\n";
        }
        else{
          _str += "var "+_arrayName+"="+ _objName+";\n";
        }
        //keep the end of the array
        _lastArrayEnd = (_posEnd>_lastArrayEnd)? _posEnd : _lastArrayEnd;
        //increment 
        _nestedArray++;
        //_str += "_nestedArrayParams.push({index});\n";
        _str += "for (var "+_arrayIndexName+" = 0; "+_arrayIndexName+" < "+_arrayName+".length; "+_arrayIndexName+"++) {\n";
        _str += "  var "+_objName+" = "+_arrayName+"["+_arrayIndexName+"];\n";
      }
      //Generate code which will concatenate each xml parts
      for (var i = 0; i < _xmlParts.length; i++) {
        var _xmlPart = _xmlParts[i];
        var _dataObj = _xmlPart.obj ;
        var _dataIndex = (_type!=='array')? 0 : _xmlPart.obj+"_i";
        var _dataAttr = _xmlPart.attr;
        _str += "_absPosition += ("+_dataIndex+" * "+_width+");\n";
        _str += "_localPosition = (("+_xmlPart.position+".0 - "+_posStart+".0)/"+_arrayName+".length)*"+_arrayIndexName+"*"+_width+"/"+_arrayName+".length;\n";
        _str += "_strPart = {\n";
        _str += "  'tmplPos': "+_xmlPart.position+",\n";
        _str += "  'relPos' : _absPosition,\n";
        _str += "  'localPos' : _localPosition,\n";
        _str += "  'str'    : ''\n";
        _str += "};\n";
        //concatenate each sub parts if they exist
        if(_xmlPart.before !== ''){
          _str += "_strPart.str += '"+_xmlPart.before + "';\n";
        }
        //insert the data only it it not null
        _str += "_strPart.str += ("+ _dataObj +"['"+_dataAttr+"'] != null)?"+ _dataObj +"['"+_dataAttr+"']:''"+";\n";
        if(_xmlPart.after !== ''){
          _str += "_strPart.str += '"+_xmlPart.after + "';\n";
        }
        //push each part in a array (this array will be sorted at the end)
        _str += "_strParts.push(_strPart);\n";
      };

    }
    //close previously created for loops
    while(_nestedArray > 0){
      _str += "}\n";
      _nestedArray--;
    }

    //sort the string parts 
    _str += "_strParts.sort(";
    _str += "function(a, b){\n"
         + "  if(a.relPos < b.relPos){\n"
         + "    return -1;\n"
         + "  }\n"
         + "  else if (a.relPos > b.relPos){\n"
         + "    return 1;\n"
         + "  }\n"
         + "  else{\n"
         + "    return (a.tmplPos - b.tmplPos);\n"
         + "  }\n"
         + "});\n";

    //concatenate xml
    if(_staticData.before!=null){
      _str += "_strResult += '"+_staticData.before+"';\n";
    }
    _str += "for (var i = 0; i < _strParts.length; i++) {\n";
    //_str += "  _strPart = _strParts[i];\n";
    _str += "  _strPart = _strParts[i];\n console.log(_strPart); ";
    _str += "  _strResult += _strPart.str;\n";
    _str += "}\n";
    if(_staticData.after!=null){
      _str += "_strResult += '"+_staticData.after+"';\n console.log('\\n\\n');";
    }

    _str += 'return _strResult;';
    //The function is built, we compile it and check errors in the same time
    var _fn;
    try{
      _fn = new Function('data', _str);
    } 
    catch (err){
      throw new Error('getSubstitutionFunction: Impossible to generate the XML builder.\n'+err+'\n--------------------------------\n'+_str+'\n--------------------------------\n');
    }
    return _fn;
  },

  
  extractTags : function(xml, data){
    var that = this;
    //"?:" avoiding capturing 
    var _res = xml.replace(/\{\{([\s\S]+?)\}\}/g, function(m, text, offset) {
      var _tag = that.cleanTag(text);
      var _xmlCleaned = that.cleanXml(text);

      var _splitted = _tag.split('.');
      if(_splitted.length>1){
        if(data[_splitted[0]] && data[_splitted[0]][_splitted[1]]){
          return data[_splitted[0]][_splitted[1]]+_xmlCleaned;
        }
      }
      else if(data[_tag]){
        return data[_tag]+_xmlCleaned;
      }
      return _xmlCleaned;
    });

    return _res;
  },

  cleanTag : function(text){
    //"?:" avoiding capturing. otther method /\s*<([^>]*)>\s*/g
    var _res = text
      .replace(/<(?:[\s\S]+?)>/g, function(m, text) {
        return '';
      })
      .replace(/^\s+|\s+$/g, '');
    return _res;
  },

  cleanXml : function(xml){
    var _res = '';
    xml.replace(/\s*(<[^>]*>)\s*/g, function(m, text) {
      _res += text;
      return '';
    });
    return _res;
  },

  decomposeTags : function(tags){
    var _uid = 1;
    var _alreadyVisited = {};
    var _arrayNames = {};
    var _res = {
      'd0' : {
        'name' : '',
        'type' : 'object'
      }
    };
    for (var i = 0; i < tags.length; i++) {
      var _tag = tags[i].name;
      var _tagParts = _tag.split('.');
      var _prevTagPart = _tagParts[0];
      for (var j = 1; j < _tagParts.length; j++) {
        var _tagPart = _tagParts[j];

        /*var _arrayBeginSearch = /([\S]+?)\[i\]$/g.exec(_tagPart);
        var _arrayEndSearch   = /([\S]+?)\[i\+1\]$/g.exec(_tagPart);
        if(_arrayBeginSearch!=null && _arrayBeginSearch.length>1){
          var _arrayBegin  = _arrayBeginSearch[1];
          if(!_arrayNames[_arrayBegin]){
            _arrayNames[_arrayBegin] = [{'begin': tags[i].pos}];
          }
          else{
            var _lastArrayDetection = _arrayNames[_arrayBegin][_arrayNames[_arrayBegin].length-1];
            if(!_lastArrayDetection.end){
              _arrayNames[_arrayBegin].push({'begin': tags[i].pos});
            }
          }
        }
        if(_arrayEndSearch!=null && _arrayEndSearch.length>1){
          var _arrayEnd  = _arrayEndSearch[1];
          var _lastArrayDetection = _arrayNames[_arrayEnd][_arrayNames[_arrayEnd].length-1];
          _lastArrayDetection.end = tags[i].pos;
        }*/

        //console.log('\n');
        //console.log(_tagPart);
        //console.log('\n');
        if(_arrayNames[_tagPart]){
          var _uName = _arrayNames[_tagPart];
          var _lastArrayDetection = _res[_uName].range[ _res[_uName].range.length-1 ];
          if(!_lastArrayDetection.end){
            _lastArrayDetection.end = tags[i].pos;
          }
        }
        //var _arrayEndSearch = /([\S]+?)\[i\+1\]$/g.exec(_tagPart);
        //if(_arrayEndSearch!=null && _arrayEndSearch.length>1){
        //  var _arrayEnd  = _arrayEndSearch[1];
        //  //console.log('\n');
        //  //console.log(_arrayEnd);
        //  //console.log('\n');
        //  if(_arrayNames[_arrayEnd]){
        //    var _uName = _arrayNames[_arrayEnd];
        //    var _lastArrayDetection = _res[_uName].range[ _res[_uName].range.length-1 ];
        //    if(!_lastArrayDetection.end){
        //      _lastArrayDetection.end = tags[i].pos;
        //    }
        //  }
        //}

        var _arrayParts = _tagPart.split(/\[\S+?\]/);

        var _uniqueName = _prevTagPart+_arrayParts;
        _prevTagPart = _uniqueName;
        if(_alreadyVisited[_uniqueName]===true){
          continue;
        }
        _alreadyVisited[_uniqueName] = true;
        //it is an array
        if(_arrayParts.length > 1){
          var _arrayTag = _tagPart;
          //if it is a multi-dimension array, extract each array
          var _multiArray = '';
          var _multiArrayEnd = '';
          for (var k = 2; k < _arrayParts.length; k++) {
            _multiArrayEnd += '[i]';
          }
          for (var k = 1; k < _arrayParts.length; k++) {
            //var _arrayBeginSearch = /([\S]+?)\[i\]$/g.exec(_arrayTag);

            var _arrayPart = _arrayParts[0];
            var _arrayEndSearch = _arrayPart + _multiArray + '[i+1]' + _multiArrayEnd;
            _arrayNames[_arrayEndSearch] = _arrayPart+_uid;
            //console.log('\n');
            //console.log(_arrayEndSearch);
            //console.log('\n');
            _res[_arrayPart+_uid] = {
              'name' : _arrayPart,
              'type' : 'array',
              'range' : [{'begin': tags[i].pos}]
            };

            _multiArray += '[i]';
            _multiArrayEnd = _multiArrayEnd.slice(0, -3);
            _uid++;
          }
        }
        else if (j!== _tagParts.length-1){
          _res[_tagPart+_uid] = {
            'name' : _tagPart,
            'type' : 'object'
          };
          _uid++;
        }
      };
    };
    //clean false detecions
    for (var _group in _res) {
      if(_res[_group].range){
        var _arrayRange = _res[_group].range.slice();
        delete _res[_group].range;
        for (var i = 0; i < _arrayRange.length; i++) {
          if(_arrayRange[i].begin>=0 && _arrayRange[i].end>=0){
            if(!_res[_group].range){
              _res[_group].range = [_arrayRange[i]];
            }
            else{
              _res[_group].range.push(_arrayRange[i]);
            }
          }
        };
      }
    };
    return _res;
  },

  getSubsitition : function(xml){
    var that = this;

    var _allTags = [];
    var _previousTagLength = 0;

    //"?:" avoiding capturing 
    var _res = xml.replace(/\{\{([\s\S]+?)\}\}/g, function(m, text, offset) {
      var _tag = that.cleanTag(text);
      var _obj = {};

      _obj = {
        'pos' : offset-_previousTagLength,
        'name' : _tag
      };
      _allTags.push(_obj);
      _previousTagLength += (_tag.length + 4);

      var _xmlCleaned = that.cleanXml(text);
      return _xmlCleaned;
    });

    return {
      "tags": _allTags,
      "xml" : _res
    };
  },


//  detectArray : function(data){
//    for(var _pos in data){
//      var _tag = data[_pos];
//      var _split = _tag.split('.');
//
//      for (var i = 0; i < _split.length; i++) {
//        var _part = _split[i];
//        
//      };
//
//    }
//    return _tag;
//  },

  /* find neightbors: 
    \s*(<\/[^>]*> *<[^\/|^>]*>)\s*

    menu </p><p> bla <sdsd /> </p></ds><p> foot </p> </tr><tr> <p> basket </p><p> tennis </p><ds><p> balle</p><p>

    find tags which corresponds: 

    <([a-z]*)\b[^>]*>.*?<\/\1>
    laternative :
    <([\S]*)[^>]*>.*?<\/\1>
    */
  detectCommonPoint : function(xml){

    //find all couples like that  : //here we have each couple like "</p><p>", "</link><p>", "</tr><tr>", "</td><td sqdqsdsq>"
    var myRe = /\s*<\/([^>]*)> *<([^\/|^>| ]*)[^\/|^>]*>\s*/g;
    var tags;
    while ((tags = myRe.exec(xml)) !== null)
    {
      //if the tags are equals (eliminates "</link><p>")
      if(tags[1] === tags[2]){
        var _tagIndexStart =  tags.index;
        var _tagIndexEnd  = tags[0].search('>') + _tagIndexStart + 1;
        var _leftSideXml = xml.slice(0, _tagIndexEnd);
        var _rightSideXml = xml.slice(_tagIndexEnd);
        var _tagValue = tags[1];
        //test if each tag has a corresponding tag on the right and on the left
        var _regExCorrespondingTag = new RegExp('<'+_tagValue+'[^>]*>[^<|^>]*<\/'+_tagValue+'>'); //<pa[^>]*>[^<|^>]*<\/pa> 
        if(!_regExCorrespondingTag.test(_leftSideXml) && !_regExCorrespondingTag.test(_rightSideXml)){
          return tags[0];
        }
      }
    }
    return 'bad';

//    var _res = /\s*(<\/[^>]*> *<[^\/|^>]*>)\s*/g.exec(xml);
//    for (var i = 0; i < _res.length; i++) {
//      var _couple = _res[i]; //here we have each couple like "</p><p>", "</link><p>", "</tr><tr>", "</td><td sqdqsdsq>"
//
//      //extract the two tags
//      var _tags = /<\/([\S]*)> *<\1[^>]*>/g.exec(_couple);
//      //if the tags are equals (eliminates "</link><p>")
//      if(tags[0] !== ''){
//        //test if the closed tag has a corresponding opened tag before
//        var _regExp = new RegExp('<'+tags[0]+' +[^>]*>.*<\/'+tags[0]+'>');  
//        _regExp.test()
//      }
//    };
  }

};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/


  function unzip(sourceFile, callback){
    var _destDir = path.join(rootPath,'temp'); 
    //-o overwrite without prompting
    var unzip = spawn('unzip', ['-o', sourceFile, '-d', _destDir]);

    unzip.stdout.on('data', function (data) {
      //console.log('stdout: ' + data);
    });

    unzip.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    unzip.on('exit', function (code) {
      callback(_destDir);
    });
  }

  function zip(sourceDir, destFile, callback){
    //if DS_Store is present, the file is corrupted for Word
    var zip = spawn('zip', ['-m', '-r', destFile, '.', '-x', '*.DS_Store'], {'cwd': sourceDir});

    zip.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    zip.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    zip.on('exit', function (code) {
      callback();
    });
  }

module.exports = kendoc;
