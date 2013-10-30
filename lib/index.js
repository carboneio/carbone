var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var file = require('./file');
var params = require('./params');
var helper = require('./helper');
var format = require('./format');
var builder = require('./builder');
var converter = require('./converter');


/**
 * Carbone framework
 */
var carbone = {

  formatters : {},

  /**
   * This function is NOT asynchrone (It may create the template or temp directory synchronously)
   * Set carbone options. By default carbone spawns LibreOffice itself. Unfortunately, it may generate some problems when the main application uses node's cluster.
   * Carbone provides a way to deleguate the conversion to a Carbone server.
   * @param {Object} options {
   *                           delegateToServer : false|true,
   *                           delegateLevel : 1,
   *                           host : '127.0.0.1',
   *                           port : 4000,
   *                           tempPath : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                         }
   */
  set : function(options){
    for(var attr in options){
      if(params[attr]!== undefined){
        params[attr] = options[attr];
      }
      else{
        throw Error('Undefined options :' + attr);
      }
    }
    if(fs.existsSync(params.templatePath) === false){
      fs.mkdirSync(params.templatePath, '0755');
    }
    if(fs.existsSync(params.tempPath) === false){
      fs.mkdirSync(params.tempPath, '0755');
    }
  },

  /**
   * Add a template in Carbone datastore (template path)
   * @param {String}            fileId   Unique file name. All templates will be saved in the same folder (templatePath). It will overwrite if the template already exists.
   * @param {String|Buffer}     data     The content of the template
   * @param {Function}          callback(err) called when done
   */
  addTemplate : function(fileId, data, callback){
    /*if(path.isAbsolute(fileId)===true){  //possible with Node v0.11
      return callback('The file id should not be an absolute path: '+fileId);
    }*/
    var _fullPath = path.join(params.templatePath, fileId);
    fs.writeFile(_fullPath, data, function(err){
      callback(err);
    });
  },

  /**
   * add formatters
   * @param {Object} formatters {toInt: function(d, args, agrs, ...)}
   */
  addFormatters : function(customFormatters){
    for(var f in customFormatters){
      carbone.formatters[f] = customFormatters[f];
    }
  },

  /**
   * Remove a template from the Carbone datastore (template path)
   * @param  {String}   fileId   Unique file name.
   * @param  {Function} callback(err) 
   */
  removeTemplate : function(fileId, callback){
    var _fullPath = path.join(params.templatePath, fileId);
    fs.unlink(_fullPath, callback);
  },

  /**
   * Return the list of possible conversion format 
   * @param  {String} documentType  Must be 'document', 'web', 'graphics', 'spreadsheet', 'presentation'
   * @return {Array}                List of format
   */
  listConversionFormats : function(documentType){
    var _res = [];
    if(format[documentType] === undefined){
      throw Error('Unknown document type');
    }
    var _doc = format[documentType];
    for(var attr in _doc){
      var _format = _doc[attr];
      _format.id = attr;
      _res.push(_format);
    }
    return _res;
  },

  /**
   * Renders a template with given datas and giving result to the callback function
   * @param {String}       templateId : file name of the template
   * @param {Object|Array} data : Datas to be inserted in the template represented by the {d.****}
   * @param {Object|Array} complement (optional) : Datas to be inserted in the template represented by the {c.****}
   * @param {String}       convertTo (optional) : Convert the document in the format specified
   * @param {Function}     callback : Function called after generation with the result
   */
  render : function(templateId, data, complement, convertTo, callback){
    //complement and convertTo are optional
    callback = arguments[arguments.length-1]; 
    if(typeof(complement) === "string"){
      convertTo = complement;
      complement = undefined;
    }
    else if (typeof(complement) === "function"){
      complement = undefined;
    }

    file.openTemplate(templateId, function(err, template){
      if(err){
        return callback(err, null);
      }
      for (var i = 0; i < template.files.length; i++) {
        var _file = template.files[i];
        if(_file.isMarked===true){
          _file.data = builder.buildXML(_file.data, data, complement, carbone.formatters);
        }
      }
      file.buildFile(template, function(err, result){
        callback(err, result);
      });
    });
  },

  /*renderPDF : function(templateId, data, complement, callback){
    if(typeof complement === 'function') {
      callback = complement;
      complement = undefined;
    }
    carbone.render(templatePath, data, complement, 'pdf', function(content){
      var _tempFileName = path.join(rootPath, 'temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + templatePath.replace(/\//g, '_'));
      fs.writeFile(_tempFileName, content, function(err){
        if(err){
          throw new Error('-- CarboneJS: renderPDF '+err);
        }
        converter.convertFile(_tempFileName, 'pdf', callback);
      });
    });
  },*/

  /**
   * Renders a template with given datas and giving result to the callback function
   * @param {string} templatePath : Absolute path of the template
   * @param {mixed} data : Datas to be inserted in the template represented by the {d.****}
   * @param {mixed} complement (optional) : Datas to be inserted in the template represented by the {c.****}
   * @param {function} callback : Function called after generation with the result
   * @return {void}
   */
  /*render : function(templatePath, data, complement, callback){
    var that = this;
    var _filesToParse = [];
    if(typeof complement === 'function') {
      callback = complement;
    }
    templatePath = path.resolve(templatePath);
    prepareCarbone(templatePath, function(isZipped){
      if(isZipped){
        unzip(templatePath, function(destDir){
          _filesToParse = helper.walkDirSync(destDir, 'xml');

          for (var i = 0; i < _filesToParse.length; i++) {
            var _file = _filesToParse[i];
            var _content = fs.readFileSync(_file, 'utf8');
            var _newContent = that.buildXML(_content, data, complement);
            fs.writeFileSync(_file, _newContent, 'utf8');
          }
          zip(destDir, function(result){
            helper.rmDirRecursive(destDir);
            callback(result);
          });
        });
      }
      else{
        fs.readFile(templatePath, 'utf8', function(err, content){
          var _newContent = that.buildXML(content, data, complement);
          callback(_newContent);
        });
      }
    });
  },*/


};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/

//add default formatters
carbone.addFormatters(require('../formatters/date.js'));
carbone.addFormatters(require('../formatters/number.js'));
module.exports = carbone;
