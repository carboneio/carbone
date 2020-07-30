const color = require('../lib/color');

/**
 * Add the color to the colorDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {Array} color
 */
function addColorDatabase (options, colorId, styleName, colors) {
  var _colorDatabaseProperties = null;

  // If the colorReference doesn't exist, it create a new ID and set the new color
  if (!options.colorDatabase.has(colorId) && options.colorStyleList[styleName]) {
    // Loop through colorStyleList to find the color element
    for (let i = 0, j = options.colorStyleList[styleName].colors.length; i < j; i++) {
      const colorStyleEl = options.colorStyleList[styleName].colors[i];
      for (let k = 0, l = colors.length; k < l; k++) {
        if (colorStyleEl.color === colors[k].oldColor) {
          colors[k].element = colorStyleEl.element;
        }
      }
    }
    _colorDatabaseProperties = {
      id          : options.colorDatabase.size,
      colors      : colors,
      styleFamily : options.colorStyleList[styleName].styleFamily // the familly of the tag ['paragraph', 'text', 'shape']
    };
    // console.log(_colorDatabaseProperties);
    options.colorDatabase.set(colorId, _colorDatabaseProperties);
    // console.log(options.colorDatabase);
  }
}

/**
 * Generate color areference id for MS DOCX documents
 *
 * Called by the builder.
 *
 * `this` is the options
 *
 * @private
 */
function updateColorAndGetReference () {
  let _newColorId = '';
  let _styleName = '';
  let _colors = [];

  for (let i = 0, j = arguments.length; i < j; i++) {
    if (i % 2 === 0 && i+1 < arguments.length) {
      // Aggregate the color object (oldColor/newColor)
      _colors.push({
        newColor : arguments[i] && arguments[i].indexOf('C_ERROR') === -1 ? arguments[i] : '',
        oldColor : arguments[i+1]
      });
    }
    else {
      // Retrieve the style name, it is the last argument
      _styleName = arguments[i];
    }
    // Generate an ID from the argument list
    if (arguments[i] && arguments[i].indexOf('C_ERROR') === -1) {
      _newColorId += arguments[i];
    }
  }

  addColorDatabase(this, _newColorId, _styleName, _colors);

  // return a function to call at the end of the building process
  return {
    fn   : getColorOdtReferencePostProcessing,
    args : [_newColorId]
  };
}

/** ==================================== POST PROCESSING ========================================= */

function getColorOdtReferencePostProcessing (colorId) {
  const _colorData = this.colorDatabase.get(colorId);
  return  color.getColorReference(_colorData.id);
}

module.exports = {
  updateColorAndGetReference,
  getColorOdtReferencePostProcessing
};