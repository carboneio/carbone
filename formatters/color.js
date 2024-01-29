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
 * We do not execute immediately the color formatter for Libreoffice documents.
 *
 * We force the builder to execute it in post processing. In post-processing, every formatter
 * is called in the right order, one after an other, respecting XML order.
 * So we can aggregate multiple color (for example highlight and text) in the temporary table this.colorStyleAgg (done by :colorLO2 below)
 * Then, :colorLOEnd is called to create a unique style, for each unique combination of colors which were aggregated in  this.options.colorStyleAgg.
 * And :colorLOEnd resets the temporary table  this.colorStyleAgg for the next part of a document where a new style must be created.
 *
 * @private
 * @param {String} d
 */
function colorLO1 (d, scope, type) {
  return  {
    fn   : colorLO2,
    args : [{ type, value : d }]
  };
}

/**
 * Post processing formatter, which aggregate all applied color on the current paragraph, cell or row in the temp variable colorStyleAgg
 *
 * @private
 * @param {String} colorId
 */
function colorLO2 (colorObj) {
  this.colorStyleAgg.push(colorObj);
  return '';
}

/**
 * This formatter is called after all applied colors of the current paragraph / cell
 * It will post-execute colorLoPostProcessing to read the content of the temp variable colorStyleAgg
 *
 * @private
 * @param {String} colorId
 */
function colorLOEnd (d, oldStyleName) {
  return {
    fn   : colorLOPostProcessing,
    args : [oldStyleName]
  };
}

/**
 * Post processing formatter, which generates a unique style name for each combination of applied color on the current paragraph, cell or row
 *
 * @private
 * @param  {String}  oldStyleName  The old style name
 * @return {String}                A unique style name
 */
function colorLOPostProcessing (oldStyleName) {
  const _colors         = this.colorStyleAgg; // for example text color + text highlight
  let _newUniqueStyle   = '';
  for (let i = 0; i < _colors.length; i++) {
    const _color = _colors[i];
    _newUniqueStyle += _color.type + _color.value;
  }
  _newUniqueStyle += oldStyleName;
  let _style  = this.colorDatabaseNew.get(_newUniqueStyle);
  if (_style === undefined) {
    _style = {
      id           : this.colorDatabaseNew.size,
      oldStyleName : oldStyleName,
      colors       : _colors
    };
    this.colorDatabaseNew.set(_newUniqueStyle, _style);
  }
  this.colorStyleAgg = [];
  return colorLib.generateColorStyleNameLO(_style.id);
}

/**
 * Transfrom color for Docx. Remove hashtag
 *
 * The color is already validated and always in format #ababab before calling this formatter
 *
 * @private
 * @param {String} d
 */
function colorToDocx (d) {
  return d.slice(1);
}

/**
 * Apply the color on the text, paragraph, table row or table cell
 *
 * Template format supported: ODT, ODP, HTML, DOCX. Please, contact us if you need more format.
 *
 * WARNING: There are known limitations in v4.17.0:
 *  - in ODP (text, table, and shapes) and ODT (shapes only), the `:color` formatter requires that a non-default style is already applied to the target element in the template (for example, a custom text color).
 *  - complex nested tables with colors on sub-tables are not fully supported.
 *  - `highlight` is not managed in docx template
 *  - Cannot be used with aliases
 *
 * @version 4.17.0
 *
 * @param  {String} d     The color in format 6-digit hex color notation with or without hashtag, lowercase or uppercase: `#FF0000` or `FF0000`.
 *                        Carbone replaces wrong color values with light gray (#888888)
 * @param  {Mixed} scope  The scope where to apply the color
 *                          - `p`     : the current paragraph where the tag is (by default)
 *                          - `cell`  : the current cell of a table
 *                          - `row`   : the current row of a table
 *                          - `shape` : the current shape
 * @param  {Mixed} type   Where the color is applied
 *                          - `text` (by default)
 *                          - `highlight` to highlight the text
 *                          - `background` for cells, rows and shapes
 *                          - `border` for shapes only
 */
function color (d, scope = 'p', type = 'text') {
  // Here we validate only the color, scope and type are validated in preprocessind or postprocessing
  if (typeof (d) === 'string') {
    const _lowerCase     = d.toLowerCase();
    const _colorWithHash = _lowerCase[0] === '#' ? _lowerCase : '#' + _lowerCase;
    if (/^#[0-9a-f]{6}$/.test(_colorWithHash) === true) {
      return _colorWithHash;
    }
  }
  return '#888888';
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
  colorLO1,
  colorLO2,
  colorLOEnd,
  updateColorAndGetReferenceLo,
  getNewColorReferencePostProcessingLo,
  getAndConvertColorDocx
};