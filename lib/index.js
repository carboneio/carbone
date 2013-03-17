var fs = require('fs');
var path = require('path');
var util = require('util');
var spawn = require('child_process').spawn;
var helper = require('./helper');
var parser = require('./parser');
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
      var _nestedPos = _dynamicData[_objName].nestedPos;
      var _posEnd = _dynamicData[_objName].position.end;

      //close previously created for loops
      if((_nestedArray > 0) && (_lastArrayEnd <= _posStart)){
        while(_nestedArray > 0){
          _str += "}\n";
          _nestedArray--;
        }
      }
      //Object type
      if(_type === 'object'){
        _str += "_absPosition = ["+_posStart+"];\n";
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

        if(_nestedArray === 0){
          _str += "_absPosition = ["+_posStart+"];\n";
        }
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
        _str += "_absPosition["+(_nestedPos*2-1)+"] = "+_arrayIndexName+";\n";
        _str += "_absPosition[2] = "+_xmlPart.position+";\n";

        _str += "_strPart = {\n";
        _str += "  'pos' : _absPosition.slice(0),\n";
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

    _str += 'return _strParts;';
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

  decomposeTags : function(tags){
    var _alreadyVisited = {};
    var _arrayNames = {};
    var _uid = 1;
    var _res = {
      'd0' : {
        'name' : '',
        'type' : 'object',
        'xmlParts' : []
      }
    };
    for (var i = 0; i < tags.length; i++) {
      var _tag = tags[i].name;
      var _tagPos = tags[i].pos;
      var _tagParts = _tag.split('.');
      var _prevTagPart = _tagParts[0];
      for (var j = 1; j < _tagParts.length; j++) {
        var _tagPart = _tagParts[j];

        if(_arrayNames[_tagPart]){
          var _uName = _arrayNames[_tagPart];
          //console.log('\n');
          //console.log(_tagPart);
          //console.log('\n');
          var _lastArrayDetection = _res[_uName].range;
          if(!_lastArrayDetection.end){
            _lastArrayDetection.end = tags[i].pos;
          }
        }

        //if it an array decompose it
        var _arrayParts = _tagPart.split(/\[\S+?\]/);

        //store path
        var _uniqueName = _prevTagPart+_arrayParts;

        //it it is the last attribute, keep the xml part
        if(j === _tagParts.length-1){
          if(!(/\+1/g.test(_tag))){
            var _lastObjName = 'd0';
            if(_prevTagPart !== 'd'){
              _lastObjName  = _alreadyVisited[_prevTagPart];
            }
            _res[_lastObjName].xmlParts.push({
              'obj': _lastObjName,
              'attr': _tagPart,
              'pos': _tagPos
            });
          }
        }
        _prevTagPart = _uniqueName;
        if(_alreadyVisited[_uniqueName]){
          continue;
        }
        
        //it is an array
        if(_arrayParts.length > 1){
          var _arrayTag = _tagPart;
          //if it is a multi-dimension array, extract each array
          var _multiArray = '';
          var _multiArrayEnd = '';
          for (var k = 2; k < _arrayParts.length; k++) {
            _multiArrayEnd += '[i]';
          }
          var _depth = 0;
          for (var k = 1; k < _arrayParts.length; k++) {
            var _arrayPart = _arrayParts[0];

            //var _arrayBeginSearch = /([\S]+?)\[i\]$/g.exec(_arrayTag);
            //
            var _arrayEndSearch = _arrayPart + _multiArray + '[i+1]' + _multiArrayEnd;
            _arrayNames[_arrayEndSearch] = _arrayPart+(_uid);
            //console.log('\n');
            //console.log(_arrayEndSearch);
            //console.log('\n');

            _alreadyVisited[_uniqueName] = _arrayPart+(_uid);

            _res[_arrayPart+(_uid)] = {
              'name' : _arrayPart,
              'type' : 'array',
              'range' : {'start': tags[i].pos},
              'xmlParts':[]
            };

            _multiArray += '[i]';
            _multiArrayEnd = _multiArrayEnd.slice(0, -3);
            _uid++;
          }
        }
        //it is an object
        else if (j!== _tagParts.length-1){
          _alreadyVisited[_uniqueName] = _tagPart+(_uid);

          _res[_tagPart+(_uid)] = {
            'name' : _tagPart,
            'type' : 'object',
            'xmlParts' : []
          };
          _uid++;
        }

      };
    };
    //clean false detecions
    for (var _group in _res) {
      if(_res[_group].range && _res[_group].range.end === undefined){
        //var _arrayRange = _res[_group].range.slice();
        delete _res[_group].range;
      }
    };
    console.log('\n');
    console.log( util.inspect(_res, false, 100, true));
    console.log('\n\n');
    return _res;
  },

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
