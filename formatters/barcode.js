const ean13 = require('./barcode_ean13.js');
const ean8 = require('./barcode_ean8.js');

/**
 * @description Translate an ean barcode to EAN13.TTF font code.
 *
 * @example ("8056459824973", "ean13")
 * @example ("9780201134476", "ean13")
 * @example ("35967101", "ean8")
 * @example ("96385074", "ean8")
 *
 * @param {string} data codebar numbers
 * @param {string} args codebar format
 * @returns {string} translated to EAN13.TTF font code or empty string
 */
const barcode = (data, args) => {
  var _fc;
  var _barcodesMethods = new Map();
  // SET MAP NAME AND METHOD
  _barcodesMethods.set('ean13', ean13);
  _barcodesMethods.set('ean8', ean8);

  // GET FUNCTION FROM MAP
  _fc = _barcodesMethods.get(args);
  if (_fc !== undefined ) {
    return _fc(data);
  }
  return '';
};

module.exports = {
  barcode : barcode
};