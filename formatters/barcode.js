const ean13 = require('./barcode_ean13.js');
const ean8 = require('./barcode_ean8.js');
const code39 = require('./barcode_code39.js');

/**
 * Translate a barcode to specific font code.
 *
 * You have to apply the font `EAN13.ttf` to your text in order to display the barcode.
 *
 * @example [ "8056459824973" ,  "ean13"   ]
 * @example [ "9780201134476" ,  "ean13"   ]
 * @example [ "35967101"      ,  "ean8"    ]
 * @example [ "96385074"      ,  "ean8"    ]
 * @example [ "GSJ-220097"    ,  "code39"  ]
 * @example [ "ASDFGH-.$/+% " ,  "code39"  ]
 *
 * @param   {String} data Barcode numbers
 * @param   {String} type Barcode type: `ean13`, `ean8` or `code39`
 * @returns {String}      translated  to EAN13.TTF font code or empty string
 */
const barcode = (data, type) => {
  var _fc;
  var _barcodesMethods = new Map();
  // SET MAP NAME AND METHOD
  _barcodesMethods.set('ean13', ean13);
  _barcodesMethods.set('ean8', ean8);
  _barcodesMethods.set('code39', code39);

  // GET FUNCTION FROM MAP
  _fc = _barcodesMethods.get(type);
  if (_fc !== undefined ) {
    return _fc(data);
  }
  return '';
};

module.exports = {
  barcode : barcode
};