
module.exports = {
  /**
   * Converts a number to an INT
   * @return {Number}
   */
  int : function(){
    return parseInt(this, 10);
  },
  /**
   * Converts a number with English specifications (decimal separator is '.')
   * @return {String}
   */
  toEN : function(){
    return (this + '').replace(/,/g, '.');
  },
  /**
   * Converts a number into string, keeping only <nb> decimals
   * @param  {Number} nb
   * @return {String}
   */
  toFixed : function(nb){
    return parseFloat(this).toFixed(nb);
  },
  /**
   * Converts a number with French specifications (decimal separator is ',')
   * @return {String}
   */
  toFR : function(){
    return (this + '').replace(/\./g, ',');
  }
};
