const color = require("../lib/color")

/**
 * Add the color to the colorDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {String} color
 */
function addColorDatabase (options, colorReference, colorValue, colorElement) {
  var _colorDatabaseProperties = null;
  const _newColor = {color: colorValue, element: colorElement};
  console.log(_newColor);
  if (!options.colorDatabase.has(colorReference)) {
    // If the colorReference doesn't exist, it create a new ID and set the new color
    _colorDatabaseProperties = {
      id : options.colorDatabase.size,
      colors: [_newColor]
    }
  } else {
    // retrieve the colorReference and add the new color
    _colorDatabaseProperties = options.colorDatabase.get(colorReference)
    _colorDatabaseProperties.colors.push(_newColor);
  }
  options.colorDatabase.set(colorReference, _colorDatabaseProperties);
  console.log("Add Color Datase called: ", options.colorDatabase);
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
 * @param {String} colorValue new color from the dataset
 * @param {String} colorReference style name used as reference (example "P1", "P2", "P3")
 * @param {String} colorElement The element where the color is applied
 * @param {Integer} returnReference if returnReference === 0, the post process formatter should return de new reference.
 */
function saveColorAndGetReference (colorValue, colorReference, colorElement, returnReference) {
  addColorDatabase(this, colorReference, colorValue, colorElement);
  if (returnReference>0) return;
  // return a function to call at the end of the building process
  return {
    fn   : getColorOdtReferencePostProcessing,
    args : [colorReference]
  };
}

/** ==================================== POST PROCESSING ========================================= */

function getColorOdtReferencePostProcessing (colorReference) {
  var _colorData = this.colorDatabase.get(colorReference);
  return  color.getColorReference(_colorData.id);
}

module.exports = {
  saveColorAndGetReference,
  getColorOdtReferencePostProcessing
}