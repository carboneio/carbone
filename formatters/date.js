var moment = require('moment');


/**
 * Format dates
 * 
 * @exampleContext {"lang":"en"}
 * @example ["20160131", "YYYYMMDD", "L"]
 * @example ["20160131", "YYYYMMDD", "LL"]
 * @example ["20160131", "YYYYMMDD", "LLLL"]
 * @example ["20160131", "YYYYMMDD", "dddd"]
 * @example [1410715640, "X", "LLLL"]
 *
 * @exampleContext {"lang":"fr"}
 * @example ["20160131", "YYYYMMDD", "LLLL"]
 * @example ["20160131", "YYYYMMDD", "dddd"]
 * 
 * @param  {String|Number} d   date to format
 * @param  {String} patternIn  input format 
 * @param  {String} patternOut output format
 * @return {String}            return formatted date
 */
function convDate (d, patternIn, patternOut) {
  if (d !== null && typeof d !== 'undefined') {
    moment.locale(this.lang);
    return moment(d + '', patternIn).format(patternOut);
  }
  return d;
}

/**
 * Format dates 
 * 
 * @exampleContext {"lang":"en"}
 * @example ["20160131", "L"]
 * @example ["20160131", "LL"]
 * @example ["20160131", "LLLL"]
 * @example ["20160131", "dddd"]
 * @example [1410715640, "LLLL"]
 *
 * @exampleContext {"lang":"fr"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "LLLL"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "LLLL"]
 * @example ["20160131", "LLLL"]
 * @example ["20160131", "dddd"]
 *
 * @exampleContext {"lang":"fr"}
 * @example ["20160131", "dddd", "YYYYMMDD"]
 * @example [1410715640, "LLLL", "X" ]
 * 
 * @param  {String|Number} d   date to format
 * @param  {String} patternOut output format
 * @param  {String} patternIn  [optional] input format, ISO8601 by default
 * @return {String}            return formatted date
 */
function formatD (d, patternOut, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    moment.locale(this.lang);
    if (patternIn) {
      return moment(d + '', patternIn).format(patternOut);
    }
    return moment(d + '').format(patternOut);
  }
  return d;
}



module.exports = {
  formatD : formatD,

  convDate : convDate, // DEPRECTAED
  convert  : convDate, // DEPRECTAED

  /**
   * Adds a number of days to the date
   * @private
   * @param  {Integer} nbDay: the number of days to add
   * @return {String}
   */
  addDays : function (d, nbDay) {
    if (d !== null && typeof d !== 'undefined') {
      return moment(d).add('days', parseInt(nbDay));
    }
    return d;
  },
  /**
   * Converts a date to a string with given pattern
   * DEPRECATED
   * @private
   * @param  {String} pattern
   * @return {String}
   */
  format : function (d, pattern) {
    if (d !== null && typeof d !== 'undefined') {
      return moment(d).format(pattern);
    }
    return d;
  },
  /**
   * Converts a string with given pattern to date
   * DEPRECATED
   * @private
   * @param  {String} pattern
   * @return {Date}
   */
  parse : function (d, pattern) {
    if (d !== null && typeof d !== 'undefined') {
      return moment(d + '', pattern).toDate();
    }
    return d;
  }
};
