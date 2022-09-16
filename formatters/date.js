var dayjs = require('dayjs');


/**
 * Format dates. It takes an output date pattern as an argument. Date patterns are available on [this section](#date-formats).
 * It is possible to change the timezone through the option `options.timezone` and the lang through `options.lang`.
 * List of timezones: [https://en.wikipedia.org/wiki/List_of_tz_database_time_zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
 *
 * @version 3.0.0 updated
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
 * @exampleContext {"lang":"fr", "timezone": "Asia/Singapore"}
 * @example ["20160131", "dddd", "YYYYMMDD"]
 * @example [1410715640, "LLLL", "X" ]
 *
 * @param  {String|Number} d   date to format
 * @param  {String} patternOut output format
 * @param  {String} patternIn  [optional] input format, "ISO 8601" by default
 * @return {String}            return formatted date
 */
function formatD (d, patternOut, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    // avoid timezone when only a date is provided without time
    // checking length is fast and seems to cover 99.9% of cases when patternIn is undefined
    if (d.length < 13 && /[Hhms]/.test(patternIn) === false) {
      return parse(d, patternIn).locale(this.lang).format(patternOut);
    }
    return parse(d, patternIn).tz(this.timezone).locale(this.lang).format(patternOut);
  }
  return d;
}


/**
 * Format intervals / duration. List of format name :
 *   - `human+`
 *   - `human`
 *   - `millisecond(s)` or `ms`
 *   - `second(s)` or `s`
 *   - `minute(s)` or `m`
 *   - `hour(s)` or `h`
 *   - `year(s)` or `y`
 *   - `month(s)` or `M`
 *   - `week(s)` or `w`
 *   - `day(s)` or `d`
 *
 * @version 4.1.0
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example [2000, "second"]
 * @example [2000, "seconds"]
 * @example [2000, "s"]
 * @example [3600000, "minute"]
 * @example [3600000, "hour"]
 * @example [2419200000, "days"]
 *
 * @exampleContext {"lang":"fr", "timezone":"Europe/Paris"}
 * @example [2000, "human"]
 * @example [2000, "human+"]
 * @example [-2000, "human+"]
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example [2000, "human"]
 * @example [2000, "human+"]
 * @example [-2000, "human+"]
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example [60, "ms", "minute"]
 * @example [4, "ms", "weeks"]
 *
 * @exampleContext {"lang":"en", "timezone":"Europe/Paris"}
 * @example ["P1M", "ms"]
 * @example ["P1Y2M3DT4H5M6S", "hour"]
 *
 * @param  {String|Number} d   Interval to format in milliseconds (by default), or ISO format (ex. P1Y2M3DT4H5M6S)
 * @param  {String} patternOut output format: human, human+, milliseconds, seconds, ...
 * @param  {String} patternIn  [optional] input unit: milliseconds, seconds, ...
 * @return {String}            return formatted interval
 */
function formatI (d, patternOut, patternIn) {
  if (d !== null && typeof d !== 'undefined') {
    const _duration = dayjs.duration(d, patternIn);
    if (patternOut === 'human') {
      return _duration.locale(this.lang).humanize();
    }
    else if (patternOut === 'human+') {
      return _duration.locale(this.lang).humanize(true);
    }
    return _duration.as(patternOut);
  }
  return d;
}



/**
 *
 * Add a time to a date. Available units: day, week,	month, quarter, year, hour, minute, second and millisecond.
 * Units are case insensitive, and support plural and short forms.
 *
 * @version 3.0.0 new
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
 *
 * Subtract a time to a date. Available units: day, week,	month, quarter, year, hour, minute, second and millisecond.
 * Units are case insensitive, and support plural and short forms.
 *
 * @version 3.0.0 new
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
 *
 * Create a date and set it to the start of a unit of time.
 *
 * @version 3.0.0 new
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
 *
 * Create a date and set it to the end of a unit of time.
 *
 * @version 3.0.0 new
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
 * @version 1.0.0 deprecated
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
  return dayjs(d, patternIn);
}



module.exports = {
  formatD,
  formatI,
  convDate,
  convert : convDate, // deprecated but used by Easilys
  addD,
  subD,
  startOfD,
  endOfD
};
