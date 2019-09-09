const ean13 = require('./barcode_ean13.js');
const ean8 = require('./barcode_ean8.js');

/**
 * Translate a ean13/ean8 barcode to EAN13.TTF font code.
 *
 * You have to apply the font `EAN13.ttf` to your text in order to display the barcode.
 *
 * @example ["8056459824973", "ean13"]
 * @example ["9780201134476", "ean13"]
 * @example ["35967101", "ean8"      ]
 * @example ["96385074", "ean8"      ]
 *
 * @param   {String} data Barcode numbers
 * @param   {String} args Barcode format: ean13 or ean8
 * @returns {S tring} translated  to EAN13.TTF font code or empty string
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