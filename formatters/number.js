
module.exports = {
  /**
   * Converts a number to an INT
   * @return {Number}
   */
  int : function(d){
    return parseInt(d, 10);
  },
  /**
   * Converts a number with English specifications (decimal separator is '.')
   * @return {String}
   */
  toEN : function(d){
    return (d + '').replace(/,/g, '.');
  },
  /**
   * Converts a number into string, keeping only <nb> decimals
   * @param  {Number} nb
   * @return {String}
   */
  toFixed : function(d, nb){
    return parseFloat(d).toFixed(nb);
  },
  /**
   * Converts a number with French specifications (decimal separator is ',')
   * @return {String}
   */
  toFR : function(d){
    return (d + '').replace(/\./g, ',');
  }
};
