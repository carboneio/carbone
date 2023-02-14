var fs = require('fs');
var os = require('os');
var path = require('path');
var file = require('./file');
var params = require('./params');
var helper = require('./helper');
var format = require('./format');
var builder = require('./builder');
var input = require('./input');
var preprocessor = require('./preprocessor');
var translator = require('./translator');
var converter = require('./converter');
var debug = require('debug')('carbone');
var dayjs = require('dayjs');
var locales = require('../formatters/_locale');

var carbone = {

  /**
   * This function is NOT asynchronous (It may create the template or temp directory synchronously)
   * @param {Object} options {
   *                           tempPath     : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                           renderPath   : where rendered files are temporary saved. It will create the directory if it does not exists
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
    if (fs.existsSync(params.renderPath) === false) {
      fs.mkdirSync(params.renderPath, '0755');
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
    params.renderPath              = path.join(params.tempPath, 'carbone_render');
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
      input.formatters[f] = customFormatters[f];
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

  /**
   * Render XML directly
   *
   * @param {String}        xml          The XML
   * @param {Object|Array}  data         The data
   * @param {Object}        optionsRaw   The options raw
   * @param {Function}      callbackRaw  The callback raw
   */
  renderXML : function (xml, data, optionsRaw, callbackRaw) {
    input.parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      // Clean XML tags inside Carbone markers and translate
      xml = preprocessor.preParseXML(xml, options);
      return builder.buildXML(xml, data, options, callback);
    });
  },

  /**
   * Renders a template with given datas and return result to the callback function
   *
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
   *                          'renderPrefix' : If defined, it returns a path instead of a buffer, and it adds this prefix in the filename
   *                                           The filename will contains also the report name URL Encoded
   *                       }
   * @param {Function}     callbackRaw(err, bufferOrPath, reportName) : Function called after generation with the result
   */
  render : function (templatePath, data, optionsRaw, callbackRaw) {
    input.parseOptions(optionsRaw, callbackRaw, function (options, callback) {
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
        // check and clean convertTo object, options.convertTo contains a clean version of optionsRaw.convertTo
        var _error = input.parseConvertTo(options, optionsRaw.convertTo);
        if (_error) {
          return callback(_error);
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
              convert (result, report.reportName, options, function (err, bufferOrFile) {
                if (report.reportName === undefined && typeof bufferOrFile === 'string') {
                  report.reportName = path.basename(bufferOrFile);
                }
                callback(err, bufferOrFile, report.reportName, (options.isDebugActive === true ? options.debugInfo : null) );
              });
            });
          });
        });
      });
    });
  },

  /**
   * Decodes a rendered filename.
   *
   * When carbone.render is called with the options renderPrefix, the callback returns a path instead of a buffer
   * The filename is built like this (3 distinct parts), with only alphanumeric characters to be able to write it on the disk safely
   *
   * <prefix><22-random-chars><encodedReportName.extension>
   *
   * This function decodes the part `<encodedReportName.extension>` `
   *
   * @param  {String}   pathOrFilename  The path or filename
   * @param  {Integer}  prefixLength    The prefix length used in options.renderPrefix
   * @return {Object}   {
   *                      extension  : 'pdf',
   *                      reportName : 'decoded filename'
   *                    }
   */
  decodeRenderedFilename : function (pathOrFilename, prefixLength = 0) {
    var _filename = path.basename(pathOrFilename);
    var _extension = path.extname(_filename);
    var _onlyReportName = _filename.slice(prefixLength + helper.RANDOM_STRING_LENGTH, -_extension.length);

    return {
      reportName : helper.decodeSafeFilename(_onlyReportName),
      extension  : _extension.slice(1)
    };
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
   *
   * @param  {Buffer}   data      raw data returned by fs.readFile (no utf-8)
   * @param  {Object}   options   Same as carbone.render
   *                              {
   *                                convertTo : pdf || {formatName, formatOptions}
   *                                extension : 'csv'  // extension of input file returned by path.extname(filename).
   *                                                   // It helps LibreOffice to understand the source format (mandatory for CSV files)
   *                              }
   * @param  {Function} callback  (err, result) result is a buffer (file converted)
   */
  convert : function (fileBuffer, optionsRaw, callbackRaw) {
    input.parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      options.extension = optionsRaw.extension;
      if (options.extension === null) {
        return callback('Unknown input file type. options.extension should be equals to docx, xlsx, pptx, odt, ods, odp, xhtml, html or an xml');
      }
      var _error = input.parseConvertTo(options, optionsRaw.convertTo);
      if (_error) {
        return callback(_error);
      }
      convert (fileBuffer, undefined, options, callback);
    });
  },

  formatters : input.formatters
};

/** ***************************************************************************************************************/
/* Privates methods */
/** ***************************************************************************************************************/

/**
 * Parse and compute XML for all files of the template
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
 * { function_description }
 *
 * @param {Buffer}    inputFileBuffer  The input file buffer
 * @param {String}    customReportName user-defined report name computed by Carbone
 * @param {Function}  options          options coming from input.parseOptions and input.parseConvertTo
 *                                     {
 *                                       convertTo : {
 *                                         extension  : 'pdf',
 *                                         format     : 'writer_pdf_Export' // coming from lib/format.js
 *                                         optionsStr : '44,34,76',         // only for CSV
 *                                         filters    : {                   // only for PDF, JPG, ...
 *                                           ReduceImageResolution : true
 *                                         }
 *                                       }
 *                                       extension    : 'odt' || Force input template extension
 *                                       hardRefresh  : (default: false) if true, LibreOffice is used to render and refresh the content of the report at the end of Carbone process
 *                                       renderPrefix : If defined, it add a prefix to the report name
 *                                     }
 * @param {Function}  callback(err, bufferOrPath) return a path if renderPrefix is defined, a buffer otherwise
 */
function convert (inputFileBuffer, customReportName, options, callback) {
  const _convertTo         = options.convertTo;
  const _hasConversion     = options.extension !== _convertTo.extension || options.hardRefresh === true;
  const _isReturningBuffer = options.renderPrefix === undefined || options.renderPrefix === null;

  // If there is no conversion, and there is no renderPrefix, we return the buffer directly
  if (_hasConversion === false && _isReturningBuffer === true) {
    return callback(null, inputFileBuffer);
  }

  // generate a unique random & safe filename
  const _renderPrefix     = (options.renderPrefix || '').replace(/[^0-9a-z-]/gi, '');
  const _randomNamePart   = helper.getRandomString();
  const _customReportName = customReportName !== undefined ? customReportName : 'report';
  const _renderFilename   = _renderPrefix + _randomNamePart + helper.encodeSafeFilename(_customReportName) + '.' + _convertTo.extension;
  const _renderFile       = path.join(params.renderPath, _renderFilename);

  // no conversion, but return a path
  if (_hasConversion === false) {
    return fs.writeFile(_renderFile, inputFileBuffer, function (err) {
      if (err) {
        debug('Cannot write rendered file on disk' + err);
        return callback('Cannot write rendered file on disk', null);
      }
      return callback(null, _renderFile);
    });
  }

  // A conversion is necessary, generate a intermediate file for the converter
  const _intermediateFilename = _renderPrefix + _randomNamePart + '_tmp.' + options.extension;
  const _intermediateFile     = path.join(params.renderPath, _intermediateFilename);
  fs.writeFile(_intermediateFile, inputFileBuffer, function (err) {
    if (err) {
      debug('Cannot write rendered file on disk' + err);
      return callback('Cannot write rendered file on disk', null);
    }
    // call the converter and tell him to generate directly the wanted filename
    converter.convertFile(_intermediateFile, _convertTo.format, _convertTo.optionsStr, _renderFile, function (errConvert, outputFile) {
      fs.unlink(_intermediateFile, function (err) {
        if (err) {
          debug('Cannot remove intermediate file before conversion ' + err);
        }
      });
      if (errConvert) {
        return callback(errConvert, null);
      }
      if (_isReturningBuffer === false) {
        return callback(null, outputFile);
      }
      fs.readFile(outputFile, function (err, outputBuffer) {
        fs.unlink(outputFile, function (err) {
          if (err) {
            debug('Cannot remove rendered file ' + err);
          }
        });
        if (err) {
          debug('Cannot returned file buffer ' + err);
          return callback('Cannot returned file buffer', null);
        }
        callback(null, outputBuffer);
      });
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

// if DayJS does not have a locale defined with country code, define it
// For example "de-de" does not exists in DaysJS, but "de" exists.
// So add locale "de-de" in DaysJS
for (let _locale in locales) {
  if (dayjs.Ls[_locale] === undefined) {
    let _localeWithoutCountry = _locale.replace(/-\S+/g, '');
    if (dayjs.Ls[_localeWithoutCountry] !== undefined) {
      dayjs.locale(_locale, dayjs.Ls[_localeWithoutCountry]);
    }
  }
}

dayjs.extend(require('dayjs/plugin/advancedFormat'));    // Support Quarter, ...
dayjs.extend(require('dayjs/plugin/localizedFormat'));   // Support L LL LLLL
dayjs.extend(require('dayjs/plugin/customParseFormat')); // Support custom format as input
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs-timezone-iana-plugin'));
dayjs.extend(require('dayjs/plugin/isoWeek'));

dayjs.tz.setDefault('Europe/Paris');
dayjs.locale('en');

if (fs.existsSync(params.renderPath) === false) {
  fs.mkdirSync(params.renderPath, '0755');
}

module.exports = carbone;
