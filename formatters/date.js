var moment = require('moment');


/**
 * Format dates
 * Doc: http://momentjs.com/docs/#/parsing/string-format/
 * 
 * @param  {String|Number} d    date to format
 * @param  {String} patternIn  input format 
 * @param  {String} patternOut output format
 * @return {String}            return formatted date
 */
function convDate(d, patternIn, patternOut){
  if(d !== null && typeof d !== 'undefined'){
    moment.locale(this.lang);
    return moment(d + '', patternIn).format(patternOut);
  }
  return d;
}


module.exports = {
  convDate : convDate,
  convert : convDate,

  /**
   * Adds a number of days to the date
   * @param  {Integer} nbDay: the number of days to add
   * @return {String}
   */
  addDays : function(d, nbDay){
    if(d !== null && typeof d !== 'undefined'){
      return moment(d).add('days', parseInt(nbDay));
    }
    return d;
  },
  /**
   * Converts a date to a string with given pattern
   * DEPRECATED
   * @param  {String} pattern
   * @return {String}
   */
  format : function(d, pattern){
    if(d !== null && typeof d !== 'undefined'){
      return moment(d).format(pattern);
    }
    return d;
  },
  /**
   * Converts a string with given pattern to date
   * DEPRECATED
   * @param  {String} pattern
   * @return {Date}
   */
  parse : function(d, pattern){
    if(d !== null && typeof d !== 'undefined'){
      return moment(d + '', pattern).toDate();
    }
    return d;
  }
};
