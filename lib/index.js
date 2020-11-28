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
var locale = require('../formatters/_locale.js');
var debug = require('debug')('carbone');
var dayjs = require('dayjs');

var carbone = {

  formatters : {},

  /**
   * This function is NOT asynchrone (It may create the template or temp directory synchronously)
   * @param {Object} options {
   *                           tempPath     : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                           lang         : set default lang of carbone, can be overwrite in carbone.render options.lang
   *                           timezone     : set default timezone of carbone, can be overwrite in carbone.render options.timezone
   *                           translations : overwrite carbone translations object
   *                           currencySource : currency of data, it depends on the locale if empty
   *                           currencyTarget : default target currency when the formatter convCurr is used without target
   *                                            it depends on the locale if empty
   *                           currencyRates  : rates, based on EUR { EUR : 1, USD : 1.14 }
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
      if (options.translations === undefined) {
        translator.loadTranslations(params.templatePath);
      }
    }
    if (options.tempPath !== undefined && fs.existsSync(params.tempPath) === false) {
      fs.mkdirSync(params.tempPath, '0755');
    }
    if (options.factories !== undefined || options.startFactory !== undefined) {
      converter.init();
    }
    dayjs.tz.setDefault(params.timezone);
    dayjs.locale(params.lang.toLowerCase());
  },

  /**
   * Reset parameters (for test purpose)
   */
  reset : function () {
    // manage node 0.8 / 0.10 differences
    var _nodeVersion = process.versions.node.split('.');
    var _tmpDir = (parseInt(_nodeVersion[0], 10) === 0 && parseInt(_nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();

    params.tempPath                = _tmpDir;
    params.templatePath            = process.cwd();
    params.factories               = 1;
    params.attempts                = 2;
    params.startFactory            = false;
    params.factoryMemoryFileSize   = 1;
    params.factoryMemoryThreshold  = 50;
    params.converterFactoryTimeout = 60000;
    params.uidPrefix               = 'c';
    params.pipeNamePrefix          = '_carbone';
    params.lang                    = 'en';
    params.timezone                = 'Europe/Paris';
    params.translations            = {};
    params.currencySource          = '';
    params.currencyTarget          = '';
    params.currencyRates           = { EUR : 1, USD : 1.14 };
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
      // Clean XML tags inside Carbone markers and translate
      xml = preprocessor.preParseXML(xml, options);
      return builder.buildXML(xml, data, options, callback);
    });
  },

  /**
   * Renders a template with given datas and return result to the callback function
   * @param {String}       templatePath : file name of the template (or absolute path)
   * @param {Object|Array} data : Datas to be inserted in the template represented by the {d.****}
   * @param {Object}       optionsRaw [optional] : {
   *                          'complement'   : {}    data which is represented by the {c.****}
   *                          'convertTo'    : 'pdf' || { 'formatName', 'formatOptions'} Convert the document in the format specified
   *                          'extension'    : 'odt' || undefined Specify the template extension
   *                          'variableStr'  : ''    pre-declared variables,
   *                          'lang'         : overwrite default lang. Ex. "fr"
   *                          'timezone'     : set timezone for date formatters (Europe/Paris) by default
   *                          'translations' : overwrite all loaded translations {fr: {}, en: {}, es: {}}
   *                          'enum'         : { ORDER_STATUS : ['open', 'close', 'sent']
   *                          'currencySource'   : currency of data, 'EUR'
   *                          'currencyTarget' : default target currency when the formatter convCurr is used without target
   *                          'currencyRates'  : rates, based on EUR { EUR : 1, USD : 1.14 }
   *                          'hardRefresh'  : (default: false) if true, LibreOffice is used to render and refresh the content of the report at the end of Carbone process
   *                       }
   * @param {Function}     callbackRaw(err, res, reportName) : Function called after generation with the result
   */
  render : function (templatePath, data, optionsRaw, callbackRaw) {
    parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      // open the template (unzip if necessary)
      file.openTemplate(templatePath, function (err, template) {
        if (err) {
          return callback(err, null);
        }
        // Determine the template extension.
        var _extension = file.detectType(template);
        // It takes the user defined one, or use the file type.
        options.extension = optionsRaw.extension || _extension;

        if (options.extension === null) {
          return callback('Unknown input file type. It should be a docx, xlsx, pptx, odt, ods, odp, xhtml, html or an xml file');
        }
        if (options.extension === options.convertTo && options.hardRefresh === false) {
          options.convertTo = null; // avoid calling LibreOffice if the output file type is the same as the input file type
        }
        template.reportName = options.reportName;
        template.extension = options.extension;
        preprocessor.execute(template, options, function (err, template) {
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
                let optionsConvert = {
                  extension : options.extension
                };
                convert(result, options.convertTo, optionsConvert, function (err, result) {
                  callback(err, result, report.reportName);
                });
              }
              else if (typeof(options.convertTo) === 'object'
                  && options.convertTo !== null
                  && typeof(options.convertTo.formatName) === 'string' && options.convertTo.formatName !== '') {
                let optionsConvert = {
                  formatOptions : options.convertTo.formatOptionsRaw ? options.convertTo.formatOptionsRaw : options.convertTo.formatOptions ? options.convertTo.formatOptions : {},
                  extension     : options.extension
                };
                convert(result, options.convertTo.formatName, optionsConvert, function (err, result) {
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
   * Return the file extension
   * @param {String} filePath File path
   * @param {Function} callback
   */
  getFileExtension : function (filePath, callback) {
    file.openTemplate(filePath, function (err, template) {
      if (err) {
        return callback(err);
      }

      var ext = file.detectType(template);

      if (ext === null) {
        return callback('Cannot detect file extension');
      }

      return callback(null, ext);
    });
  },

  /**
   * Convert a file format to another
   * @param  {Buffer}   data      raw data returned by fs.readFile (no utf-8)
   * @param  {String}   convertTo output format. Example: 'csv', 'xls', 'xlsx'
   * @param  {Object}   options   Example for CSV files:
   *                              {
   *                                formatOptions : {
   *                                  fieldSeparator  : ',',
   *                                  textDelimiter   : '"',
   *                                  characterSet    : '76',   // utf8  https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
   *                                }
   *                                extension       : 'csv'   // extension of source file returned by path.extname(filename). It helps LibreOffice to understand the source format (mandatory for CSV files)
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
      currency          : {},
      lang              : (options.lang || params.lang).toLowerCase(), // TODO test toLowerCase
      timezone          : (options.timezone || params.timezone),
      translations      : options.translations || params.translations,
      complement        : options.complement,
      reportName        : options.reportName,
      convertTo         : options.convertTo,
      extension         : options.extension,
      formatters        : carbone.formatters,
      existingVariables : variables,
      hardRefresh       : options.hardRefresh || false
    };
    var _currency           = _options.currency;
    var _locale             = locale[_options.lang] || locale.en;
    var _currencyFromLocale = _locale.currency.code;
    _currency.source        = options.currencySource || params.currencySource;
    _currency.target        = options.currencyTarget || params.currencyTarget;
    _currency.rates         = options.currencyRates  || params.currencyRates;
    if (!_currency.source) {
      _currency.source = _currencyFromLocale;
    }
    if (!_currency.target) {
      _currency.target = _currencyFromLocale;
    }
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
    data = {};
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
 * Verify the files extension type based on the format.js
 *
 * @param  {String} extensionIn extension type coming from the template file.
 * @param  {String} extensionOut extension type expected to be converted.
 * @return {Boolean} Return true if the extensions format are not matching, otherwhise false.
 */
function checkDocTypeAndOutputExtensions (extensionIn, extensionOut) {
  for (var docType in format) {
    if (format[docType][extensionIn] !== undefined
        && format[docType][extensionOut] !== undefined) {
      return docType;
    }
  }
  return null;
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

  if (!options.extension) {
    return callback('options.extension must be set to detect input file type', null);
  }
  const docType = checkDocTypeAndOutputExtensions(options.extension, convertTo);
  if (docType === null) {
    return callback(`Format "${options.extension}" can't be converted to "${convertTo}".`);
  }
  var _fileFormatOutput = format[docType][convertTo].format;
  var _filePathInput = path.join(params.tempPath, helper.getUID()) + '.' + options.extension;
  var _formatOptions = extractValuesFromOptions(options.formatOptions);

  fs.writeFile(_filePathInput, data, function (err) {
    if (err) {
      return callback(err);
    }
    converter.convertFile(_filePathInput, _fileFormatOutput, _formatOptions, function (errConvert, data) {
      fs.unlink(_filePathInput, function (err) {
        debug('cannot remove file ' + err);
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

// We must include all locales like this for PKG
require('dayjs/locale/af.js');
require('dayjs/locale/am.js');
require('dayjs/locale/ar-dz.js');
require('dayjs/locale/ar-kw.js');
require('dayjs/locale/ar-ly.js');
require('dayjs/locale/ar-ma.js');
require('dayjs/locale/ar-sa.js');
require('dayjs/locale/ar-tn.js');
require('dayjs/locale/ar.js');
require('dayjs/locale/az.js');
require('dayjs/locale/be.js');
require('dayjs/locale/bg.js');
require('dayjs/locale/bi.js');
require('dayjs/locale/bm.js');
require('dayjs/locale/bn.js');
require('dayjs/locale/bo.js');
require('dayjs/locale/br.js');
require('dayjs/locale/bs.js');
require('dayjs/locale/ca.js');
require('dayjs/locale/cs.js');
require('dayjs/locale/cv.js');
require('dayjs/locale/cy.js');
require('dayjs/locale/da.js');
require('dayjs/locale/de-at.js');
require('dayjs/locale/de-ch.js');
require('dayjs/locale/de.js');
require('dayjs/locale/dv.js');
require('dayjs/locale/el.js');
require('dayjs/locale/en-au.js');
require('dayjs/locale/en-ca.js');
require('dayjs/locale/en-gb.js');
require('dayjs/locale/en-ie.js');
require('dayjs/locale/en-il.js');
require('dayjs/locale/en-in.js');
require('dayjs/locale/en-nz.js');
require('dayjs/locale/en-sg.js');
require('dayjs/locale/en-tt.js');
require('dayjs/locale/en.js');
require('dayjs/locale/eo.js');
require('dayjs/locale/es-do.js');
require('dayjs/locale/es-pr.js');
require('dayjs/locale/es-us.js');
require('dayjs/locale/es.js');
require('dayjs/locale/et.js');
require('dayjs/locale/eu.js');
require('dayjs/locale/fa.js');
require('dayjs/locale/fi.js');
require('dayjs/locale/fo.js');
require('dayjs/locale/fr-ca.js');
require('dayjs/locale/fr-ch.js');
require('dayjs/locale/fr.js');
require('dayjs/locale/fy.js');
require('dayjs/locale/ga.js');
require('dayjs/locale/gd.js');
require('dayjs/locale/gl.js');
require('dayjs/locale/gom-latn.js');
require('dayjs/locale/gu.js');
require('dayjs/locale/he.js');
require('dayjs/locale/hi.js');
require('dayjs/locale/hr.js');
require('dayjs/locale/ht.js');
require('dayjs/locale/hu.js');
require('dayjs/locale/hy-am.js');
require('dayjs/locale/id.js');
require('dayjs/locale/is.js');
require('dayjs/locale/it-ch.js');
require('dayjs/locale/it.js');
require('dayjs/locale/ja.js');
require('dayjs/locale/jv.js');
require('dayjs/locale/ka.js');
require('dayjs/locale/kk.js');
require('dayjs/locale/km.js');
require('dayjs/locale/kn.js');
require('dayjs/locale/ko.js');
require('dayjs/locale/ku.js');
require('dayjs/locale/ky.js');
require('dayjs/locale/lb.js');
require('dayjs/locale/lo.js');
require('dayjs/locale/lt.js');
require('dayjs/locale/lv.js');
require('dayjs/locale/me.js');
require('dayjs/locale/mi.js');
require('dayjs/locale/mk.js');
require('dayjs/locale/ml.js');
require('dayjs/locale/mn.js');
require('dayjs/locale/mr.js');
require('dayjs/locale/ms-my.js');
require('dayjs/locale/ms.js');
require('dayjs/locale/mt.js');
require('dayjs/locale/my.js');
require('dayjs/locale/nb.js');
require('dayjs/locale/ne.js');
require('dayjs/locale/nl-be.js');
require('dayjs/locale/nl.js');
require('dayjs/locale/nn.js');
require('dayjs/locale/oc-lnc.js');
require('dayjs/locale/pa-in.js');
require('dayjs/locale/pl.js');
require('dayjs/locale/pt-br.js');
require('dayjs/locale/pt.js');
require('dayjs/locale/ro.js');
require('dayjs/locale/ru.js');
require('dayjs/locale/rw.js');
require('dayjs/locale/sd.js');
require('dayjs/locale/se.js');
require('dayjs/locale/si.js');
require('dayjs/locale/sk.js');
require('dayjs/locale/sl.js');
require('dayjs/locale/sq.js');
require('dayjs/locale/sr-cyrl.js');
require('dayjs/locale/sr.js');
require('dayjs/locale/ss.js');
require('dayjs/locale/sv.js');
require('dayjs/locale/sw.js');
require('dayjs/locale/ta.js');
require('dayjs/locale/te.js');
require('dayjs/locale/tet.js');
require('dayjs/locale/tg.js');
require('dayjs/locale/th.js');
require('dayjs/locale/tk.js');
require('dayjs/locale/tl-ph.js');
require('dayjs/locale/tlh.js');
require('dayjs/locale/tr.js');
require('dayjs/locale/tzl.js');
require('dayjs/locale/tzm-latn.js');
require('dayjs/locale/tzm.js');
require('dayjs/locale/ug-cn.js');
require('dayjs/locale/uk.js');
require('dayjs/locale/ur.js');
require('dayjs/locale/uz-latn.js');
require('dayjs/locale/uz.js');
require('dayjs/locale/vi.js');
require('dayjs/locale/yo.js');
require('dayjs/locale/zh-cn.js');
require('dayjs/locale/zh-hk.js');
require('dayjs/locale/zh-tw.js');
require('dayjs/locale/zh.js');

dayjs.extend(require('dayjs/plugin/advancedFormat'));    // Support Quarter, ...
dayjs.extend(require('dayjs/plugin/localizedFormat'));   // Support L LL LLLL
dayjs.extend(require('dayjs/plugin/customParseFormat')); // Support custom format as input
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

dayjs.tz.setDefault('Europe/Paris');
dayjs.locale('en');

module.exports = carbone;