var dayjs = require('dayjs');


/**
 * Format dates
 *
 * Since 1.2.0, by default, it considers the input format is "ISO 8601"
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example ["20160131", "L"]
 * @example ["20160131", "LL"]
 * @example ["20160131", "LLLL"]
 * @example ["20160131", "dddd"]
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "LLLL"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "LLLL"]
 * @example ["20160131", "LLLL"]
 * @example ["20160131", "dddd"]
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
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
    return parse(d, patternIn).tz(this.timezone).locale(this.lang).format(patternOut);
  }
  return d;
}

/**
 * Adds days, hour, year, ... to a date
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "3", "day"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "3", "month"]
 * @example ["20160131", "3", "day"]
 * @example ["20160131", "3", "month"]
 * @example ["31-2016-01", "3", "month", "DD-YYYY-MM"]
 *
 * @param      {String|Number}  d   input date
 * @param      {Number}  amount     The amount
 * @param      {String}  unit       The unit
 * @param      {String}  patternIn  [optional] input format, ISO8601 by default
 * @return     {Date}               return a date, which can be formatted with formatD, or manipulated with other formatters
 */
function addD (d, amount, unit, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    return parse(d, patternIn).add(parseInt(amount, 10), unit || 'day');
  }
  return d;
}

/**
 * Subtract days, hour, year, ... to a date
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "3", "day"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "3", "month"]
 * @example ["20160131", "3", "day"]
 * @example ["20160131", "3", "month"]
 * @example ["31-2016-01", "3", "month", "DD-YYYY-MM"]
 *
 * @param      {String|Number}  d   input date
 * @param      {Number}  amount     The amount
 * @param      {String}  unit       The unit
 * @param      {String}  patternIn  [optional] input format, ISO8601 by default
 * @return     {Date}               return a date, which can be formatted with formatD, or manipulated with other formatters
 */
function subD (d, amount, unit, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    return parse(d, patternIn).subtract(parseInt(amount, 10), unit || 'day');
  }
  return d;
}

/**
 * Set a date to the start of a unit of time.
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "day"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "month"]
 * @example ["20160131", "day"]
 * @example ["20160131", "month"]
 * @example ["31-2016-01", "month", "DD-YYYY-MM"]
 *
 * @param      {String|Number}  d   input date
 * @param      {String}  unit       The unit
 * @param      {String}  patternIn  [optional] input format, ISO8601 by default
 * @return     {Date}               return a date, which can be formatted with formatD, or manipulated with other formatters
 */
function startOfD (d, unit, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    return parse(d, patternIn).startOf( unit || 'year');
  }
  return d;
}

/**
 * Set a date to the end of a unit of time.
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["2017-05-10T15:57:23.769561+03:00", "day"]
 * @example ["2017-05-10 15:57:23.769561+03:00", "month"]
 * @example ["20160131", "day"]
 * @example ["20160131", "month"]
 * @example ["31-2016-01", "month", "DD-YYYY-MM"]
 *
 * @param      {String|Number}  d   input date
 * @param      {String}  unit       The unit
 * @param      {String}  patternIn  [optional] input format, ISO8601 by default
 * @return     {Date}               return a date, which can be formatted with formatD, or manipulated with other formatters
 */
function endOfD (d, unit, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    return parse(d, patternIn).endOf(unit || 'year');
  }
  return d;
}


/**
 * Format dates
 *
 * @deprecated
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example ["20160131", "YYYYMMDD", "L"]
 * @example ["20160131", "YYYYMMDD", "LL"]
 * @example ["20160131", "YYYYMMDD", "LLLL"]
 * @example ["20160131", "YYYYMMDD", "dddd"]
 * @example [1410715640, "X", "LLLL"]
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example ["20160131", "YYYYMMDD", "LLLL"]
 * @example ["20160131", "YYYYMMDD", "dddd"]
 *
 * @param  {String|Number} d   date to format
 * @param  {String} patternIn  input format
 * @param  {String} patternOut output format
 * @return {String}            return formatted date
 */
function convDate (d, patternIn, patternOut) {
  return formatD.call(this, d, patternOut, patternIn);
}


/**
 * Convert old MomentJS format to DayJS format
 *
 * @private
 * @param      {string}  d          not undefined/null date
 * @param      {string}  patternIn  The pattern
 * @return     {Object}             dayjs
 */
function parse (d, patternIn) {
  // if the date is already parsed
  if (typeof(d) === 'object' && d.isValid) {
    return d;
  }
  if (!patternIn) {
    return dayjs(d + '');
  }
  if (patternIn === 'X') {
    return dayjs.unix(d);
  }
  if (patternIn === 'x') {
    return dayjs(d);
  }
  return dayjs(d, patternIn);
}



module.exports = {
  formatD,
  convDate,
  addD,
  subD,
  startOfD,
  endOfD
};
