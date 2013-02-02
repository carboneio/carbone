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
