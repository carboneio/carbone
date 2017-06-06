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

module.exports = {
  convDate : convDate
};
