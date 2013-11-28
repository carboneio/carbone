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
var Socket = require('./socket');
var clientSocket = null;

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
   *                           host : '127.0.0.1',
   *                           port : 4000,
   *                           tempPath : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                           ... see params.js
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
    if(params.delegateToServer === true){
      clientSocket = new Socket(params.port, params.host);
      clientSocket.startClient(); 
      clientSocket.on('error', function(err){
      }); //we must catch error otherwise it does not work
    }
    else if(params.delegateToServer === false && clientSocket!== null){
      clientSocket.stop(); 
    }
  },

  /**
   * Reset parameters (for test purpose)
   */
  reset : function(){
    //manage node 0.8 / 0.10 differences
    var _nodeVersion = process.versions.node.split('.');
    var _tmpDir = (parseInt(nodeVersion[0], 10) === 0 && parseInt(nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();

    params.tempPath         = tmpDir;
    params.templatePath     = tmpDir;
    params.delegateToServer = false;
    params.host             = '127.0.0.1';
    params.bind             = '127.0.0.1';
    params.port             = 4000;
    params.factories        = 1;
    params.attempts         = 2;
    params.startFactory     = false;
    params.uidPrefix        = 'c';
    params.pipeNamePrefix   = '_carbone';
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
   * @param {String}       templateId : file name of the template (or absolute path)
   * @param {Object|Array} data : Datas to be inserted in the template represented by the {d.****}
   * @param {Object|Array} complement (optional) : Datas to be inserted in the template represented by the {c.****}
   * @param {String}       convertTo (optional) : Convert the document in the format specified
   * @param {Function}     callback(err, res) : Function called after generation with the result
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
        if(err){
          return callback(err, null);
        }
        if(typeof(convertTo) === "string" && convertTo !== ''){
          convert(result, convertTo, function(err, result){
            callback(err, result);
          });
        }
        else{
          callback(null, result);
        }
      });
    });
  }


};

/*****************************************************************************************************************/
/* Privates methods */
/*****************************************************************************************************************/

/**
 * Convert a file using LibreOffice. If delegateToServer is true it will send the conversion to the Carbone server
 * @param  {Buffer|String}   data      
 * @param  {String}          convertTo 
 * @param  {Function}        callback(err, data)
 */
function convert(data, convertTo, callback){
  var _fileFormat = format.document[convertTo].format;
  var _filenameInput = path.join(params.tempPath, helper.getUID());
  var _filenameOutput = path.join(params.tempPath, helper.getUID());
  fs.writeFile(_filenameInput, data, function(err){
    if(err){
      return callback(err);
    }
    if(params.delegateToServer===true && clientSocket !== null){
      var _job = {
        'inputFile'  : _filenameInput,
        'outputFile' : _filenameOutput,
        'format' : _fileFormat
      };
      clientSocket.send(_job, function(err, res){
        if(err){
          return callback(err);
        }
        fs.readFile(_filenameOutput, function(errRead, data){
          fs.unlink(_filenameInput);
          fs.unlink(_filenameOutput);
          if(errRead){
            return callback(err)
          }
          callback(null, data);
        });
      });
    }
    else{
      converter.convertFile(_filenameInput, _fileFormat, function(data){
        fs.unlink(_filenameInput);
        callback(null, data);
      });
    }
  });
}

//add default formatters
carbone.addFormatters(require('../formatters/date.js'));
carbone.addFormatters(require('../formatters/number.js'));
module.exports = carbone;
