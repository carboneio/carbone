var fs = require('fs');
var path = require('path');
var helper = require('./helper');
var params = require('./params');
var converter = require('./converter');
var file = require('./file');
var parser = require('./parser');

var usage = [
  '\n/******************************************************************************\\',
  '                                Translator usage:',
  'Description :', 
  '   -------------', 
  '   generateLang find all t() markers in the specified directory ',
  '   and insert them in a new json file',
  '   This file will be created if it not exist. If the file exist, delete unused ',
  '   translator keys and keep existant translator markers and add the new ones.',
  '   mandatory options :',
  'Mandatory options :', 
  '   -------------------', 
  '   -l [lang] or --lang [lang] : the lang extension (fr,en,de,etc)',
  '   -p [path] or --path [path] : The path of the docs directory which must be parse',
  'Example :', 
  '   -------------------', 
  '   node carbone generateLang -l fr -p path/to/docs/directory', 
  '\\******************************************************************************/'
].join('\n');

var translator = { 

/**
 * Handle parameters of the command easylink server
 * @param {array} args : args passed by easylink (process.argv.slice(3))
 */
  handleParams: function (args) {
    var translator_command_error= false;
    var _argumentLang = args[0];
    var _lang = args[1];

    switch(_argumentLang){
      case "--lang":
      case "-l":
      case "--translate":
      case "-t":
        if(_lang)
        {
          var _argumentPath = args[2];
          var _dirpath = args[3];
          switch(_argumentPath){
            case "--path":
            case "-p":
            if(_dirpath)
            {
              translator.generateLang(_dirpath,_lang);
            }else{
              translator_command_error = true;
            }
            break;
          default:
            translator_command_error = true
            break;
          }
        }else{
          translator_command_error = true;
        }
        break;
      case "--help":
      case "-h":
        console.log(usage);
        process.exit();
        break;
      default:
        translator_command_error = true
        break;
    }
    if(translator_command_error || args.length ===0)
    {
      console.log('/!\\ Invalid argument : write generateLang --help or -h for assistance ');
      process.exit();
    }

  },
   /**
 * Read all files of a directory and select all translate marker
 *
 * @param {string} dir : path to the directory we want to scan
 * @return {object} : {'file/path/name.js':'content of the file', ...}
 */
generateLang: function (dir,lang,callback){
    var _res = {};
    var _dirLangPath = dir+'/lang';
    var _templatePath =  path.resolve(_dirLangPath+'/', lang+'.json');

    if(!fs.existsSync(dir)){
      return "docs folder does not exist";
    }

    if(!fs.existsSync(_dirLangPath)){
     fs.mkdirSync(_dirLangPath, 0766, function(err){
       if(err){ 
         console.log(err);
         response.send("error! Can't create the lang directory! \n");    // echo the result back
       }else{
         console.log('Lang directory created');
       }
     });  
    }
    fs.readFile(_templatePath, 'utf8', function (err,data) {
      if (err) {
        if(err.code == 'ENOENT')
        {
           fs.writeFileSync(_templatePath,null);
           console.log('Carbone : lang file : '+lang+'.json created');
           translator.generateLang(dir,lang);
           return;
        }else{
          return console.log(err);
        }
      }

      var oldObjLang = JSON.parse(data);
      var oldObjLangKeyNotFound = JSON.parse(data);
      var oldKeyInObjLang = {};
      var newKeyInObjLang = {};

      if(data !== undefined )
      {
        var _files = helper.walkDirSync(dir,"(doc|ods|odt|docx|xls?)");
        for (var j = 0; j < _files.length; j++) {
          var _filePath = _files[j];
          file.openTemplate(_filePath, function(err, template){
            if(err){
              return callback(err, null);
            }
            for (var k =0; k< template.files.length;k++)
            {
              var _file = template.files[k];
              if(_file.isMarked === true)
              {
                var xml = _file.data;
                if(typeof(xml) !== 'string'){
                  return callback(null, xml);
                }
                //capture {t  } markers. The part "(?:\s*<[^>]*>\s*)*" is used to eleminate xml tags
                  var _cleanedXml = xml.replace(/\{\s*((?:\s*<[^>]*>\s*)*t[\s\S]+?)\}/g, function(m, text, offset) {
                  var _xmlOnly = parser.cleanXml(text);
                  //capture words inside () in order to translate them with the correct lang.json.
                  var _pattern = /\((.*)\)/.exec(text);
                  // If there is an expression inside () _pattern contains [_cleanMarkerStr without 't', words inside (), index, _cleanMarkerStr] 
                  if(_pattern instanceof Array && _pattern.length > 1){
                    // If _pattern[1] exist, we translate the expression. Else we write _pattern[1]
                    var _strToTranslate = parser.extractMarker(_pattern[1]);
                    //decode encoded characters
                    _strToTranslate = parser.replaceEncodedOperatorCharactersByNoEncodedCharacters(_strToTranslate);
                    if(oldObjLang && oldObjLang[_strToTranslate] !== undefined && oldObjLang[_strToTranslate] !=="")
                    {
                      oldKeyInObjLang[_strToTranslate] = oldObjLang[_strToTranslate];
                    }else{
                      newKeyInObjLang[_strToTranslate] = "";
                    }

                    if(oldObjLangKeyNotFound){
                      delete oldObjLangKeyNotFound[_strToTranslate];
                    }
                  }
                  
                });    
              }
            };

            var newObjLang = {};

            //TODO : exit the below code of this loop
            if(oldObjLangKeyNotFound)
            {
              var oldObjectLangKeyNotFound = Object.keys(oldObjLangKeyNotFound);
              oldObjectLangKeyNotFound.sort(function (a, b) {
                  return a.toLowerCase().localeCompare(b.toLowerCase());
              });

               //Firstly, write the old not found keys
              oldObjectLangKeyNotFound.forEach(function(keyNotFound) {
                if(keyNotFound.substring(0,3)!='<!>')
                {
                  newObjLang['<!>'+keyNotFound] = oldObjLangKeyNotFound[keyNotFound];
                }else{
                  newObjLang[keyNotFound] = oldObjLangKeyNotFound[keyNotFound];
                }
              });
            }
            

            // sort newKeyInObjLang object
            var newObjectLangKeys = Object.keys(newKeyInObjLang);
            newObjectLangKeys.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            //Secondly, write news keys
            newObjectLangKeys.forEach(function(newKey) {
              newObjLang[newKey] = '';
            });

            
            //sort oldKeyInObjLang object
            var oldObjectLangKeys = Object.keys(oldKeyInObjLang);
            oldObjectLangKeys.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            //Thirdly, write the old keys
            oldObjectLangKeys.forEach(function(oldKey) {
              newObjLang[oldKey] = oldKeyInObjLang[oldKey];
            });

            //create and fill the file
            fs.writeFileSync(_templatePath, JSON.stringify(newObjLang, null, 2));
          });
        };
      }
      console.log('Carbone : generate the lang file : '+lang+'.json done');
    });
  }
}


module.exports = translator;


