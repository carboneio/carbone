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
  const _styleTag = options.colorStyleList[styleName];
  if (!options.colorDatabase.has(colorId) && _styleTag) {
    // Loop through colorStyleList to find the color element
    for (let i = 0, j = _styleTag.colors.length; i < j; i++) {
      const styleTagColor = _styleTag.colors[i];
      for (let k = 0, l = colors.length; k < l; k++) {
        if (styleTagColor.color === colors[k].oldColor) {
          colors[k].element = styleTagColor.element;
          colors[k].colorType = styleTagColor.colorType;
        }
      }
    }
    _colorDatabaseProperties = {
      id          : options.colorDatabase.size,
      colors      : colors,
      styleFamily : _styleTag.styleFamily // the familly of the tag ['paragraph', 'text', 'shape']
    };
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
    const _arg = typeof arguments[i] === 'string' && arguments[i].indexOf('C_ERROR') !== -1 ? '' : arguments[i];
    if (i % 2 === 0 && i+1 < arguments.length) {
      // Aggregate the color object (oldColor/newColor)
      // if arguments[i] return an error (ex: C_ERROR), it means the color was undefined on the data object
      _colors.push({
        newColor : _arg,          // color from the data object
        oldColor : arguments[i+1] // color from the template
      });
    }
    else {
      // Retrieve the style name as last argument
      _styleName = _arg;
    }
    // Generate an ID from the argument list
    // If the new color is an object (rgb or hsl), it is converted to a string
    _newColorId += typeof _arg === 'object' ? JSON.stringify(_arg) : _arg;

  }

  // console.log(_newColorId, _styleName, _colors);
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