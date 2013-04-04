var moment = require('moment');

module.exports = {
  /**
   * Converts a date from a pattern to another pattern
   * @param  {String} patternIn
   * @param  {String} patternOut
   * @return {String}
   */
  convert : function(patternIn, patternOut){
    return moment(this, patternIn).format(patternOut);
  },
  /**
   * Converts a date to a string with given pattern
   * @param  {String} pattern
   * @return {String}
   */
  format : function(pattern){
    return moment(this).format(pattern);
  },
  /**
   * Converts a string with given pattern to date
   * @param  {String} pattern
   * @return {Date}
   */
  parse : function(pattern){
    return moment(this, pattern).toDate();
  }
};
