const locale   = require('./_locale.js');
const currency = require('./_currency.js');

/**
 * Convert from one currency to another
 *
 * Exchange rates are included by default in Carbone but you can provide a new echange rate
 * for one report in `options.currencyRates` of `Carbone.render` or globally with `Carbone.set`
 *
 * `convCurr()`  without parameters converts automatically from `options.currencySource` to `options.currencyTarget`.
 *
 * @version 1.2.0
 *
 * @exampleContext {"currency": { "source":"EUR", "target":"USD", "rates": { "EUR":1, "USD":2 }} }
 * @example [10                  ]
 * @example [1000                ]
 * @example [1000, "EUR"         ]
 * @example [1000, "USD"         ]
 * @example [1000, "USD",  "USD" ]
 *
 * @param  {Number} d        Number to convert
 * @param  {String} target   [optional] convert to this currency ('EUR'). By default it equals `options.currencyTarget`
 * @param  {String} source   [optional] currency of source data ('USD'). By default it equals `options.currencySource`
 * @return {String}          return converted values
 */
function convCurr (d, target, source) {
  var _target        = target ? target : this.currency.target;
  var _source        = source ? source : this.currency.source;
  var _targetRate    = this.currency.rates[_target] || 1;
  var _sourceRate    = this.currency.rates[_source] || 1;
  var _valueInEuro   = d / _sourceRate;
  this.modifiedCurrencyTarget = _target;
  return _valueInEuro * _targetRate;
  // raseError(this.currency[_target] === undefined, 'Unknown rate for currency target "'+_target+'"');
  // raseError(this.currency[_base] === undefined  , 'Unknown rate for currency base "'+_base+'"');
}

/**
 * Round a number
 *
 * Same as toFixed(2) but it rounds number correclty `round(1.05, 1) = 1.1`
 *
 * @version 1.2.0
 *
 * @example [10.05123  , 2  ]
 * @example [1.05      , 1  ]
 *
 * @param  {Number} num       number
 * @param  {Number} precision number of decimal
 * @return {Number}
 */
function round (num, precision) {
  if (!('' + num).includes('e')) {
    return +(Math.round(num + 'e+' + precision)  + 'e-' + precision);
  }
  else {
    var _arr = ('' + num).split('e');
    var _sig = '';
    if (+_arr[1] + precision > 0) {
      _sig = '+';
    }
    return +(Math.round(+_arr[0] + 'e' + _sig + (+_arr[1] + precision)) + 'e-' + precision);
  }
}

/**
 * Fast method to format a number
 * Inspired by https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-dollars-currency-string-in-javascript
 *
 * Tested solutions (at least 5x slower to 10x slower):
 *   - numeralJs
 *   - https://github.com/BenjaminVanRyseghem/numbro
 *   - http://mottie.github.io/javascript-number-formatter/
 *   - http://openexchangerates.github.io/accounting.js
 *   - fastest method is native Intl.NumberFormat but locales are not included in Nodejs : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/NumberFormat
 *
 * Other method to test and analyze
 *   - https://jsperf.com/number-formatting-with-commas/5
 *   - https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
 *
 * @private
 * @param  {Number} value
 * @param  {Number} value
 * @param  {Number} precision
 * @return {String}
 */
function _format (value, format, precision = 3) {
  var _re    = '\\d(?=(\\d{' + (format.group) + '})+' + (precision > 0 ? '\\D' : '$') + ')';
  var _value = round(value, precision);
  var _num   = _value.toFixed(Math.max(0, ~~precision));

  return (format.decimal ? _num.replace('.', format.decimal) : _num).replace(new RegExp(_re, 'g'), '$&' + (format.separator || ','));
}

/**
 * Format number according to the locale.
 * Applying a number of decimals depends on the report type:
 * - For ODS/XLSX, the number of decimals has to be formatted based on the text editor.
 * - For the other type of files, the number of decimals depends on the `precision` parameter passed to the formatter.
 *
 * @version 1.2.0
 *
 * @exampleContext {"lang":"en-us"}
 * @example ["10"          ]
 * @example ["1000.456"    ]
 *
 * @param  {Number} d          Number to format
 * @param  {Number} precision  [optional] Number of decimals
 * @return {String} return     converted values
 */
function formatN (d, precision) {
  if (d !== null && typeof d !== 'undefined') {
    var _locale = locale[this.lang] || locale.en;
    return _format(d, _locale.number, precision);
  }
  return d;
}

/**
 *
 * @version 1.2.0
 *
 * Format currency numbers
 *
 * Currencies are defined by the locale (`options.lang`). It can be overwritten by
 * `options.currencySource` and `options.currencyTarget` for one report  in `Carbone.render`
 * or globally with `Carbone.set`
 *
 * When `options.lang === 'fr-FR'` the `currencySource` and `currencyTarget` equals by default `EUR`.
 *
 * If the formatter `convCurr()` is used before, formatC prints the corresponding target currency used in `convCurr()`.
 *
 * By default, it prints with the currency symbol only, but you can use other output formats:
 *
 * @exampleContext {"lang":"en-us", "currency": { "source":"EUR", "target":"USD", "rates": { "EUR":1, "USD":2 }} }
 * @example ["1000.456"        ]
 * @example ["1000.456", "M"   ]
 * @example ["1"       , "M"   ]
 * @example ["1000"    , "L"   ]
 * @example ["1000"    , "LL"  ]
 *
 * @exampleContext {"lang":"fr-fr", "currency": { "source":"EUR", "target":"USD", "rates": { "EUR":1, "USD":2 }} }
 * @example ["1000.456"    ]
 *
 * @exampleContext {"lang":"fr-fr", "currency": { "source":"EUR", "target":"EUR", "rates": { "EUR":1, "USD":2 }} }
 * @example ["1000.456"    ]
 *
 * @param  {Number} d                 Number to format
 * @param  {Number} precisionOrFormat [optional] Number of decimal, or specific format <br>
 *                                      - Integer : change default precision of the currency
 *                                      - M  : print Major currency name without the number
 *                                      - L  : prints number with currency symbol (by default)
 *                                      - LL : prints number with Major currency name
 * @return {String}                   return converted values
 *
 */
function formatC (d, precisionOrFormat) {
  if (d !== null && typeof d !== 'undefined') {
    var _locale       = locale[this.lang] || locale.en; // TODO optimize, this test should be done before
    var _currency     = this.modifiedCurrencyTarget || this.currency.target;
    var _currencyInfo = currency[_currency];
    var _precision    = _currencyInfo.precision;
    var _customPrec   = parseInt(precisionOrFormat, 10);
    var _formatFn     = _locale.currency.L;
    if (!isNaN(_customPrec)) {
      _precision = _customPrec;
    }
    else if ( _locale.currency[precisionOrFormat] instanceof Function ) {
      _formatFn = _locale.currency[precisionOrFormat];
    }
    var _valueRaw  = _format(convCurr.call(this, d), _locale.number, _precision);
    // reset modifiedCurrencyTarget for next use
    this.modifiedCurrencyTarget = null;
    return _formatFn(_valueRaw,
      _currencyInfo.symbol,
      _currencyInfo.minSymbol,
      // eslint-disable-next-line eqeqeq
      (d != 1 ? _currencyInfo.major + 's' : _currencyInfo.major),
      // eslint-disable-next-line eqeqeq
      (d != 1 ? _currencyInfo.minor + 's' : _currencyInfo.minor),
      _currencyInfo.name
    );
  }
  return d;
}

/**
 * Add two numbers
 *
 * @version 1.2.0
 *
 * @example [1000.4  ,  2  ]
 * @example ["1000.4", "2" ]
 *
 * @param {Number} value Value to add
 * @return {Number} Result
 */
function add (d, value) {
  if (d !== null && typeof d !== 'undefined') {
    return parseFloat(d) + parseFloat(value);
  }
  return d;
}

/**
 * Substract two numbers
 *
 * @version 1.2.0
 *
 * @example [1000.4  ,  2  ]
 * @example ["1000.4", "2" ]
 *
 * @param {Number} value Value to substract
 * @return {Number} Result
 */
function sub (d, value) {
  if (d !== null && typeof d !== 'undefined') {
    return parseFloat(d) - parseFloat(value);
  }
  return d;
}

/**
 * Multiply two numbers
 *
 * @version 1.2.0
 *
 * @example [1000.4  ,  2  ]
 * @example ["1000.4", "2" ]
 *
 * @param {Number} value Value to multiply
 * @return {Number} Result
 */
function mul (d, value) {
  if (d !== null && typeof d !== 'undefined') {
    return parseFloat(d) * parseFloat(value);
  }
  return d;
}

/**
 * Divide two numbers
 *
 * @version 1.2.0
 *
 * @example [1000.4   ,  2  ]
 * @example ["1000.4" , "2" ]
 *
 * @param {Number} value Value to divide
 * @return {Number} Result
 */
function div (d, value) {
  if (d !== null && typeof d !== 'undefined' && parseFloat(value) !== 0) {
    return parseFloat(d) / parseFloat(value);
  }
  return d;
}

module.exports = {
  formatN  : formatN,
  formatC  : formatC,
  convCurr : convCurr,
  round    : round,
  add      : add,
  sub      : sub,
  mul      : mul,
  div      : div,

  /**
   * Converts a number to an INT
   * @deprecated
   * @version 1.0.0 deprecated
   *
   * @return {Number}
   */
  int : function (d) {
    return parseInt(d, 10);
  },

  /**
   * Converts a number with English specifications (decimal separator is '.')
   * @deprecated
   * @version 1.0.0 deprecated
   *
   * @return {String}
   */
  toEN : function (d) {
    return (d + '').replace(/,/g, '.');
  },

  /**
   * Converts a number into string, keeping only <nb> decimals
   * @deprecated
   * @version 1.0.0 deprecated
   *
   * @param  {Number} nb
   * @return {String}
   */
  toFixed : function (d, nb) {
    return parseFloat(d).toFixed(nb);
  },

  /**
   * Converts a number with French specifications (decimal separator is ',')
   * @deprecated
   * @version 1.0.0 deprecated
   *
   * @return {String}
   */
  toFR : function (d) {
    return (d + '').replace(/\./g, ',');
  }

};
