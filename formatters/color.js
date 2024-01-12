const colorLib = require('../lib/color');

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

  if (!options.colorDatabase.has(colorId)) {
    _colorDatabaseProperties = {
      id        : options.colorDatabase.size,
      colors    : colors,
      styleName : styleName
    };
    options.colorDatabase.set(colorId, _colorDatabaseProperties);
  }
}

/** ==================================== ODT FORMATTERS ========================================= */

/**
 * Generate color a reference id for ODT documents
 *
 * Called by the builder.
 *
 * `this` is the options
 *
 * @private
 */
function updateColorAndGetReferenceLo () {
  let _newColorId = '';
  let _styleName = '';
  let _colors = [];

  for (let i = 0, j = arguments.length; i < j; i++) {
    const _arg = typeof arguments[i] === 'string' && arguments[i].indexOf('C_ERROR') !== -1 ? '' : arguments[i];
    if (i % 2 === 0 && i + 1 < arguments.length) {
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

  addColorDatabase(this, _newColorId, _styleName, _colors);

  // return a function to call at the end of the building process
  return {
    fn   : getNewColorReferencePostProcessingLo,
    args : [_newColorId]
  };
}

/**
 * @private
 * @param {String} colorId
 */
function getNewColorReferencePostProcessingLo (colorId) {
  const _colorData = this.colorDatabase.get(colorId);
  return  colorLib.getColorReference(_colorData.id);
}

/**
 * Transfrom color for Docx
 *
 * @private
 * @param {String} d
 */
function colorToDocx (d) {
  if (typeof (d) === 'string') {
    const _colorWithoutHash = d.replace(/^#/, '');
    if (/^[0-9a-f]{6}$/i.test(_colorWithoutHash) === true) {
      return _colorWithoutHash;
    }
  }
  return 'ffffff';
}

/**
 * Transfrom color for Html
 *
 * @private
 * @param {String} d
 */
function colorToHtml (d) {
  if (typeof (d) === 'string') {
    const _colorWithoutHash = d.startsWith('#') === true ? d : '#' + d;
    if (/^#[0-9a-f]{6}$/i.test(_colorWithoutHash) === true) {
      return _colorWithoutHash;
    }
  }
  return '#ffffff';
}

/**
 * Apply the color on the text, paragraph, table row or table cell
 *
 * @version 4.16.0
 * @param  {String} d    data
 * @param  {Mixed} scope "p", "row", "cell"
 * @param  {Mixed} type  "text", "highlight", "background"
 */
function color (d, scope, type) {
  return d;
}

/** ==================================== DOCX FORMATTERS ========================================= */

/**
 * @private
 *
 * @description Color format converter for DOCX reports
 * @param {String} colorName
 * @param {String} colorType
 * @param {String} elementType
 */
function getAndConvertColorDocx (colorName, colorType, elementType) {
  // check if colorName exist, the element is probably null or undefined on the JSON dataset
  if (colorName && colorType && elementType) {
    return colorLib.colorFormatConverter[colorType](colorName, 'docx', elementType);
  }
  return '';
}

module.exports = {
  color,
  colorToDocx,
  colorToHtml,
  updateColorAndGetReferenceLo,
  getNewColorReferencePostProcessingLo,
  getAndConvertColorDocx
};