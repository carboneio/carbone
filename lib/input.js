const params = require('./params');
const format = require('./format');
const parser = require('./parser');
const locale = require('../formatters/_locale.js');
const formatters = Object.create(null); // Remove  __proto__ and constructor attributes. Mitigates prototype pollution attacks.

/**
 * Parse options coming from user-side. Clean it and generate a safe options object for internal use
 *
 * @param {Object}    userDefinedOptions  The options object coming from user-side, passed in carbone.render(XML) is used
 * @param {<type>}    callbackFn          The callback function of carbone.render(XML)
 * @param {Function}  callback            The callback of this function
 */
function parseOptions (userDefinedOptions, callbackFn, callback) {
  if (typeof(userDefinedOptions) === 'function') {
    callbackFn = userDefinedOptions;
    userDefinedOptions = {};
  }
  // define a default complement object with the current date
  if (typeof(userDefinedOptions.complement) !== 'object' || userDefinedOptions.complement === null) {
    userDefinedOptions.complement = {};
  }
  if (!userDefinedOptions.complement.now) {
    Object.defineProperty(userDefinedOptions.complement, 'now', {
      value      : (new Date()).toISOString(),
      enumerable : false
    });
  }
  // analyze pre-declared variables in the Object "userDefinedOptions"
  parser.findVariables(userDefinedOptions.variableStr, function (err, str, variables) {
    var _options = {
      enum              : userDefinedOptions.enum,
      currency          : {},
      lang              : (userDefinedOptions.lang || params.lang).toLowerCase(),
      timezone          : (userDefinedOptions.timezone || params.timezone),
      translations      : userDefinedOptions.translations || params.translations,
      complement        : userDefinedOptions.complement,
      reportName        : userDefinedOptions.reportName,
      convertTo         : userDefinedOptions.convertTo, // clean by parseConvertTo after
      extension         : userDefinedOptions.extension,
      formatters        : formatters,
      existingVariables : variables,
      hardRefresh       : userDefinedOptions.hardRefresh || false,
      isDebugActive     : userDefinedOptions.isDebugActive || false,     // show info about the template
      renderPrefix      : userDefinedOptions.renderPrefix,
      debugInfo         : { markers : [] } // filled and returned after POST /render if isDebugActive === true
    };
    var _currency           = _options.currency;
    var _locale             = locale[_options.lang] || locale.en;
    var _currencyFromLocale = _locale.currency.code;
    _currency.source        = userDefinedOptions.currencySource || params.currencySource;
    _currency.target        = userDefinedOptions.currencyTarget || params.currencyTarget;
    _currency.rates         = userDefinedOptions.currencyRates  || params.currencyRates;
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
 * Parse user-defined convertTo object and set options.convertTo with safe values
 *
 * options.extension must be set
 *
 * @param   {Object}  options               coming from parseOptions. It updates options.convertTo and generates this object
 *                                          {
 *                                            extension  : 'pdf',
 *                                            format     : 'writer_pdf_Export' // coming from lib/format.js
 *                                            optionsStr : '44,34,76',         // only for CSV
 *                                            filters    : {                   // only for PDF, JPG, ...
 *                                              ReduceImageResolution : true
 *                                            }
 *                                          }
 * @param   {Object}  userDefinedConvertTo  convertTo, coming from user-side
 * @return  {String}  options               Return null if no error. Return a string if there is an error.
 */
function parseConvertTo (options, userDefinedConvertTo) {
  if (!options.extension) {
    return 'options.extension must be set to detect input file type';
  }
  var _extensionOutput = userDefinedConvertTo;
  var _optionsOutput = {};
  if (typeof(userDefinedConvertTo) === 'object' && userDefinedConvertTo !== null) {
    _extensionOutput = userDefinedConvertTo.formatName;
    _optionsOutput =  userDefinedConvertTo.formatOptions;
  }
  // by default, output = input
  if (!_extensionOutput || typeof(_extensionOutput) !== 'string') {
    _extensionOutput = options.extension;
  }
  // clean output file extension
  _extensionOutput = _extensionOutput.toLowerCase().trim();
  // detect if the conversion is possible and return the output format key for LibreOffice
  const _fileFormatOutput = checkDocTypeAndOutputExtensions(options.extension, _extensionOutput);
  if (_fileFormatOutput === null && (_extensionOutput !== options.extension || options.hardRefresh === true)) {
    return `Format "${options.extension}" can't be converted to "${_extensionOutput}".`;
  }
  // set default output options
  // build internal safe convertTo object
  options.convertTo = {
    extension  : _extensionOutput, // Ex. pdf
    format     : _fileFormatOutput,// Ex. writer_pdf_Export coming from lib/format.js
    optionsStr : '',               // Ex. '44,34,76' for CSVs
    filters    : {}                // Ex. { ReduceImageResolution : true, Quality : ... } for PDF, jpg, png, ...
  };
  switch (_extensionOutput) {
    case 'csv':
      // set options.convertTo.optionsStr and return null of there is no error
      return checkAndSetOptionsForCSV(_optionsOutput, options.convertTo);
    case 'pdf':
      // set options.convertTo.filters and return null of there is no error
      return checkAndSetOptionsForPDF(_optionsOutput, options.convertTo);
    case 'png':
    case 'jpg':
      // set options.convertTo.filters and return null of there is no error
      return checkAndSetOptionsForImage(_optionsOutput, options.convertTo);
    default:
      break;
  }
  return null;
}

/**
 * Parse options of userDefinedCSVOptions coming from user side and update internal options.convertTo
 *
 * @param      {Object}  userDefinedCSVOptions  The csv options coming from user-side
 *                                              https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
 *                                              {
 *                                                 fieldSeparator    : ',',
 *                                                 textDelimiter     : '"',
 *                                                 characterSet      : '76',
 *                                                 numberOfFirstLine : 1,
 *                                                 cellFormat        : 1
 *                                              }
 * @param      {Object}  convertToObj  updates convertTo.optionsStr
 * @return     {String}                null of there is no error, a string if there is an error
 */
function checkAndSetOptionsForCSV (userDefinedCSVOptions, convertToObj) {
  // By default, it means:
  // Separator : ','
  // Delimiter : '"'
  // Encoding  : UTF-8
  var _options = [ '44', '34', '76'];
  if (typeof(userDefinedCSVOptions) === 'object' && userDefinedCSVOptions !== null) {
    _options[0] = (userDefinedCSVOptions.fieldSeparator || ',').charCodeAt(0);
    _options[1] = (userDefinedCSVOptions.textDelimiter  || '"').charCodeAt(0);
    _options[2] = userDefinedCSVOptions.characterSet    || '76';
    if (userDefinedCSVOptions.numberOfFirstLine) {
      _options[3] = userDefinedCSVOptions.numberOfFirstLine;
    }
    if (userDefinedCSVOptions.cellFormat) {
      _options[4] = userDefinedCSVOptions.cellFormat;
    }
  }
  // set options
  convertToObj.optionsStr = _options.join(',');
  return null;
}

/**
 * Parse options of userDefinedPDFFilters coming from user side and update internal options.convertTo
 *
 * @param      {Object}  userDefinedPDFFilters    The pdf filters like ReduceImageResolution, ...
 * @param      {Object}  convertToObj             updates convertTo.optionsStr
 * @return     {String}                           null of there is no error, a string if there is an error
 */
function checkAndSetOptionsForPDF (userDefinedPDFFilters, convertToObj) {
  if (userDefinedPDFFilters.ReduceImageResolution === undefined) {
    // by default, deactivate compression to speed up conversion
    userDefinedPDFFilters.ReduceImageResolution = false;
  }
  convertToObj.filters = userDefinedPDFFilters;
  return null;
}

/**
 * Parse options of userDefinedImageFilters coming from user side and update internal options.convertTo
 *
 * @param      {Object}  userDefinedImageFilters  Image filters
 * @param      {Object}  convertToObj             updates convertTo.optionsStr
 * @return     {String}                           null of there is no error, a string if there is an error
 */
function checkAndSetOptionsForImage (userDefinedImageFilters, convertToObj) {
  convertToObj.filters = userDefinedImageFilters;
  return null;
}

/**
 * Verify files extensions type based on the format.js
 *
 * @param  {String} extensionIn extension type coming from the template file.
 * @param  {String} extensionOut extension type expected to be converted.
 * @return {Boolean} Return true if the extensions format are not matching, otherwise false.
 */
function checkDocTypeAndOutputExtensions (extensionIn, extensionOut) {
  for (var docType in format) {
    if (format[docType][extensionIn] !== undefined
        && format[docType][extensionOut] !== undefined) {
      return format[docType][extensionOut].format;
    }
  }
  return null;
}

module.exports = {
  formatters,
  parseOptions,
  parseConvertTo,
  checkAndSetOptionsForCSV,
  checkAndSetOptionsForPDF,
  checkDocTypeAndOutputExtensions
};
