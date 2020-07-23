const color = require("../lib/color")

/**
 * Add the color to the colorDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {String} color
 */
function addColorDatabase (options, colorValue) {
  var _colorDatabaseProperties = null;
  if (options.colorDatabase.has(colorValue)) {
    return ;
  }
  // If the color doesn't exist, it create a new ID
  _colorDatabaseProperties = {
    id : options.colorDatabase.size
  };
  options.colorDatabase.set(colorValue, _colorDatabaseProperties);
}

/**
 * Generate color areference id for MS DOCX documents
 *
 * Called by the builder.
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} color image data (link or base64)
 * @returns {String}             generated link for OpenDocument
 */
function generateColorOdtReference (colorValue) {
  addColorDatabase(this, colorValue);
  // return a function to call at the end of the building process
  return {
    fn   : generateColorOdtReferencePostProcessing,
    args : [colorValue]
  };
}

/** ==================================== POST PROCESSING ========================================= */

function generateColorOdtReferencePostProcessing (colorValue) {
  var _colorData = this.colorDatabase.get(colorValue);
  return  color.getColorReference(_colorData.id);
}

module.exports = {
  generateColorOdtReference,
  generateColorOdtReferencePostProcessing
}