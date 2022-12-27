var dayjs = require('dayjs');


/**
 * Format dates
 *
 * Since 1.2.0, by default, it considers the input format is "ISO 8601"
 *
 * @exampleContext {"lang":"en"}
 * @example ["20160131", "L"]
 * @example ["20160131", "LL"]
 * @example ["20160131", "LLLL"]
 * @example ["20160131", "dddd"]
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
    dayjs.locale(this.lang);
    if (patternIn) {
      return dayjs(d + '', patternIn).format(patternOut);
    }
    return dayjs(d + '').format(patternOut);
  }
  return d;
}


/**
 * Format dates
 *
 * @deprecated
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
    dayjs.locale(this.lang);
    return dayjs(d + '', patternIn).format(patternOut);
  }
  return d;
}




module.exports = {
  formatD : formatD,
  convDate : convDate
};
