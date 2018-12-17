const numeral = require('numeral');

module.exports = {
  /**
   * Converts a number to an INT
   * @return {Number}
   */
  int : function (d) {
    return parseInt(d, 10);
  },
  /**
   * Converts a number with English specifications (decimal separator is '.')
   * @return {String}
   */
  toEN : function (d) {
    return (d + '').replace(/,/g, '.');
  },
  /**
   * Converts a number into string, keeping only <nb> decimals
   * @param  {Number} nb
   * @return {String}
   */
  toFixed : function (d, nb) {
    return parseFloat(d).toFixed(nb);
  },
  /**
   * Converts a number with French specifications (decimal separator is ',')
   * @return {String}
   */
  toFR : function (d) {
    return (d + '').replace(/\./g, ',');
  },
  /**
   * Binds number formatting system to Numeral
   * @param {String} format String formatter
   * @return {String} Formatted string
   */
  format : function (d, format) {
    if (format)
      return numeral(d).format(format);
    return numeral(d).value();
  },
  /**
   * Add two numbers
   * @param {Number} value Value to add
   * @return {Number} Result
   */
  add : function(d, value) {
    return numeral(d).add(value).value();
  },
  /**
   * Substract two numbers
   * @param {Number} value Value to substract
   * @return {Number} Result
   */
  substract : function (d, value) {
    return numeral(d).subtract(value).value();
  },
  /**
   * Multiply two numbers
   * @param {Number} value Value to multiply
   * @return {Number} Result
   */
  multiply : function (d, value) {
    return numeral(d).multiply(value).value();
  },
  /**
   * Divide two numbers
   * @param {Number} value Value to divide
   * @return {Number} Result
   */
  divide : function (d, value) {
    return numeral(d).divide(value).value();
  }
};
