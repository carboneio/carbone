var fs = require('fs');
var os = require('os');
var path = require('path');
var file = require('./file');
var params = require('./params');
var helper = require('./helper');
var format = require('./format');
var builder = require('./builder');
var parser = require('./parser');
var preprocessor = require('./preprocessor');
var translator = require('./translator');
var converter = require('./converter');
var moment = require('moment');

/**
 * Carbone framework
 */
var carbone = {

  formatters : {},

  /**
   * This function is NOT asynchrone (It may create the template or temp directory synchronously)
   * Set carbone options. By default carbone spawns LibreOffice itself. Unfortunately, it may generate some problems when the main application uses node's cluster.
   * @param {Object} options {
   *                           tempPath     : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                           lang         : set default lang of carbone, can be overwrite in carbone.render options
   *                           translations : overwrite carbone translations object
   *                         }
   */
  set : function (options) {
    for (var attr in options) {
      if (params[attr] !== undefined) {
        params[attr] = options[attr];
      }
      else {
        throw Error('Undefined options :' + attr);
      }
    }
    if (options.templatePath !== undefined) {
      if (fs.existsSync(params.templatePath) === false) {
        fs.mkdirSync(params.templatePath, '0755');
      }
      if (fs.existsSync(path.join(params.templatePath, 'lang')) === false) {
        fs.mkdirSync(path.join(params.templatePath, 'lang'), '0755');
      }
      translator.loadTranslations(params.templatePath);
    }
    if (options.tempPath !== undefined && fs.existsSync(params.tempPath) === false) {
      fs.mkdirSync(params.tempPath, '0755');
    }
    // update moment lang if it changes
    moment.locale(params.lang);
  },

  /**
   * Reset parameters (for test purpose)
   */
  reset : function () {
    // manage node 0.8 / 0.10 differences
    var _nodeVersion = process.versions.node.split('.');
    var _tmpDir = (parseInt(_nodeVersion[0], 10) === 0 && parseInt(_nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();

    params.tempPath         = _tmpDir;
    params.templatePath     = 'carbone_reports';
    params.factories        = 1;
    params.attempts         = 2;
    params.startFactory     = false;
    params.uidPrefix        = 'c';
    params.pipeNamePrefix   = '_carbone';
    params.lang             = 'en';
    params.translations     = {};
  },

  /**
   * Add a template in Carbone datastore (template path)
   * @param {String}            fileId   Unique file name. All templates will be saved in the same folder (templatePath). It will overwrite if the template already exists.
   * @param {String|Buffer}     data     The content of the template
   * @param {Function}          callback(err) called when done
   */
  addTemplate : function (fileId, data, callback) {
    /* if(path.isAbsolute(fileId)===true){  //possible with Node v0.11
      return callback('The file id should not be an absolute path: '+fileId);
    }*/
    var _fullPath = path.join(params.templatePath, fileId);
    fs.writeFile(_fullPath, data, function (err) {
      callback(err);
    });
  },

  /**
   * add formatters
   * @param {Object} formatters {toInt: function(d, args, agrs, ...)}
   */
  addFormatters : function (customFormatters) {
    for (var f in customFormatters) {
      carbone.formatters[f] = customFormatters[f];
    }
  },

  /**
   * Remove a template from the Carbone datastore (template path)
   * @param  {String}   fileId   Unique file name.
   * @param  {Function} callback(err) 
   */
  removeTemplate : function (fileId, callback) {
    var _fullPath = path.join(params.templatePath, fileId);
    fs.unlink(_fullPath, callback);
  },

  /**
   * Return the list of possible conversion format 
   * @param  {String} documentType  Must be 'document', 'web', 'graphics', 'spreadsheet', 'presentation'
   * @return {Array}                List of format
   */
  listConversionFormats : function (documentType) {
    var _res = [];
    if (format[documentType] === undefined) {
      throw Error('Unknown document type');
    }
    var _doc = format[documentType];
    for (var attr in _doc) {
      var _format = _doc[attr];
      _format.id = attr;
      _res.push(_format);
    }
    return _res;
  },

  renderXML : function (xml, data, optionsRaw, callbackRaw) {
    parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      return builder.buildXML(xml, data, options, callback);
    });
  },

  /**
   * Renders a template with given datas and return result to the callback function
   * @param {String}       templateId : file name of the template (or absolute path)
   * @param {Object|Array} data : Datas to be inserted in the template represented by the {d.****}
   * @param {Object}       optionsRaw [optional] : {
   *                          'complement'   : {}    data which is represented by the {c.****}
   *                          'convertTo'    : 'pdf' || { 'formatName', 'formatOptions'} Convert the document in the format specified
   *                          'variableStr'  : ''    pre-declared variables,
   *                          'lang'         : overwrite default lang. Ex. "fr"
   *                          'translations' : overwrite all loaded translations {fr: {}, en: {}, es: {}} 
   *                       }
   * @param {Function}     callbackRaw(err, res) : Function called after generation with the result
   */
  render : function (templateId, data, optionsRaw, callbackRaw) {
    parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      // open the template (unzip if necessary)
      file.openTemplate(templateId, function (err, template) {
        if (err) {
          return callback(err, null);
        }
        template.reportName = options.reportName;
        preprocessor.execute(template, function (err, template) {
          if (err) {
            return callback(err, null);
          }
          // parse all files of the template
          walkFiles(template, data, options, 0, function (err, report) {
            if (err) {
              return callback(err, null);
            }
            // assemble all files and zip if necessary
            file.buildFile(report, function (err, result) {
              if (err) {
                return callback(err, null);
              }
              if (typeof(options.convertTo) === 'string' && options.convertTo !== '') {
                convert(result, options.convertTo, function (err, result) {
                  callback(err, result, report.reportName);
                });
              }
              else if (typeof(options.convertTo) === 'object'
                && options.convertTo !== null
                && typeof(options.convertTo.formatName) === 'string' && options.convertTo.formatName !== '') {
                convert(result, options.convertTo.formatName, options.convertTo.formatOptionsRaw || options.convertTo.formatOptions || {}, function (err, result) {
                  callback(err, result, report.reportName);
                });
              }
              else {
                callback(null, result, report.reportName);
              }
            });
          });
        });
      });
    });
  },

  /**
   * Convert a file format to another
   * @param  {Buffer}   data      raw data returned by fs.readFile (no utf-8)
   * @param  {String}   convertTo output format. Example: 'csv', 'xls', 'xlsx'
   * @param  {Object}   options   Example for CSV files:
   *                              {
   *                                fieldSeparator  : ',',
   *                                textDelimiter   : '"',
   *                                characterSet    : '76',   // utf8  https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
   *                                sourceExtension : '.csv'  // extension of source file returned by path.extname(filename). It helps LibreOffice to understand the source format (mandatory for CSV files)
   *                              }
   * @param  {Function} callback  (err, result) result is a buffer (file converted)
   */
  convert : function (data, convertTo, options, callback) {
    convert(data, convertTo, options, callback);
  }


};

/** ***************************************************************************************************************/
/* Privates methods */
/** ***************************************************************************************************************/

function parseOptions (options, callbackFn, callback) {
  if (typeof(options) === 'function') {
    callbackFn = options;
    options = {};
  }
  // analyze pre-declared variables in the Object "options"
  parser.findVariables(options.variableStr, function (err, str, variables) {
    var _options = {
      enum              : options.enum,
      lang              : options.lang || params.lang,
      translations      : options.translations || params.translations,
      complement        : options.complement,
      reportName        : options.reportName,
      convertTo         : options.convertTo,
      formatters        : carbone.formatters,
      existingVariables : variables
    };
    return callback(_options, callbackFn);
  });
}

/**
 * Parse and compute xml for all files of the template
 * @param  {Object}   template     template file returned by file.js
 * @param  {Object}   data         data to insert
 * @param  {Object}   options      {'complement', 'variables', ...}
 * @param  {Integer}  currentIndex currently visited files in the template
 * @param  {Function} callback(err, template)
 */
function walkFiles (template, data, options, currentIndex, callback) {
  if (currentIndex >= template.files.length) {
    // we have parsed all files, now parse the reportName
    if (template.reportName !== undefined) {
      builder.buildXML(template.reportName, data, options, function (err, reportNameResult) {
        template.reportName = reportNameResult;
        callback(null, template);
      });
    }
    else {
      callback(null, template);
    }
    return;
  }
  var _file = template.files[currentIndex];
  if (_file.isMarked===true) {
    builder.buildXML(_file.data, data, options, function (err, xmlResult) {
      if (err) {
        return callback(err, template);
      }
      _file.data = xmlResult;
      process.nextTick(function () {
        walkFiles(template, data, options, ++currentIndex, callback);
      });
    });
  }
  else {
    walkFiles(template, data, options, ++currentIndex, callback);
  }
}

/**
 * Extract the option values and convert it to LibreOffice format
 * https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
 * @param  {String || Object} data
 * @return {String}
 */
function extractValuesFromOptions (data) {
  // most of the case, there is no options
  if (data === '' || data === null || data === undefined) {
    return '';
  }
  /*
    Default values 
      Separator : ','
      Delimiter : '"'
      Encoding  : UTF-8
   */
  var _optionsArray = [ '44', '34', '76'];
  if (typeof(data) === 'string') {
    var _dataToArray = data.split(',');
    for (var i = 0; i < _dataToArray.length; i++) {
      _optionsArray[i] = _dataToArray[i].trim();
    }
  }
  else if (typeof(data) === 'object') {
    _optionsArray[0] = (data.fieldSeparator || ',').charCodeAt(0);
    _optionsArray[1] = (data.textDelimiter  || '"').charCodeAt(0);
    _optionsArray[2] = data.characterSet    || '0';
    if (data.numberOfFirstLine) {
      _optionsArray[3] = data.numberOfFirstLine;
    }
    if (data.cellFormat) {
      _optionsArray[4] = data.cellFormat;
    }
  }
  return _optionsArray.join(',');
}

/**
 * Convert a file using LibreOffice.
 * @param  {Buffer|String}   data      
 * @param  {String}          convertTo 
 * @param  {Object}          options (optional) {
 *                                formatName', 'formatOptions'}
 * @param  {Function}        callback(err, data)
 */
function convert (data, convertTo, options, callback) {
  if (typeof(options) === 'function') {
    callback = options;
    options = {};
  }
  var _fileFormatOutput = format.document[convertTo].format;
  var _filePathInput = path.join(params.tempPath, helper.getUID());
  if (options.sourceExtension !== undefined) {
    _filePathInput += options.sourceExtension;
  }
  var _formatOptions = extractValuesFromOptions(options);

  fs.writeFile(_filePathInput, data, function (err) {
    if (err) {
      return callback(err);
    }
    converter.convertFile(_filePathInput, _fileFormatOutput, _formatOptions, function (errConvert, data) {
      fs.unlink(_filePathInput, function (err) {
        console.log('Cannot remove file '+err);
      });
      callback(errConvert, data);
    });
  });
}

// add default formatters
carbone.addFormatters(require('../formatters/array.js'));
carbone.addFormatters(require('../formatters/condition.js'));
carbone.addFormatters(require('../formatters/date.js'));
carbone.addFormatters(require('../formatters/number.js'));
carbone.addFormatters(require('../formatters/string.js'));
translator.loadTranslations(params.templatePath);
module.exports = carbone;
