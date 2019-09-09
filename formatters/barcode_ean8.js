/**
 * @description Translate an ean8 barcode to EAN13.TTF font code.
 *
 * @example "35967101"
 * @example "96385074"
 *
 * @param {string} arg 8 numbers ean8 codebar
 * @returns {string} translated to EAN13.TTF font code
 */
const ean8 = (arg) => {

  let _barcode = '';
  let _checksum = 0;
  let _controlKey = 0;

  /**
   * Allow only a string of numbers
   */
  if (isNaN(arg)) {
    // console.error('It should be a string.');
    return '';
  }

  /**
   * Check lenght of the string
   */
  if (arg.length !== 8) {
    // console.error('Number too small, only 13 digits.');
    return '';
  }

  /**
   * Check if the barcode control key is valid
   * Calcul of the control key
   */
  _checksum = 0;
  for (let i = 0; i < 7 ; i += 2) {
    _checksum +=  parseInt(arg[i]);
  }
  _checksum *= 3;
  for (let j = 1; j < 6 ; j += 2) {
    _checksum += parseInt(arg[j]);
  }
  _controlKey = 10 - _checksum % 10;
  /**
   * Check result of the control key
   */
  if (parseInt(arg[arg.length - 1]) !== _controlKey) {
    // console.error('Barcode ean8 not valid!', 'Actual last digit = ' + arg[arg.length - 1], 'expected = ' + _controlKey);
    return '';
  }

  /**
   * Define the first digits
   */
  _barcode += ':';

  /**
   * Define the code from table A
   */
  for (let i = 0; i < 4; i++) {
    _barcode += String.fromCharCode(65 - 48 + arg.charCodeAt(i));
  }

  /**
   * Middle Separator
   */
  _barcode += '*';

  /**
   * Define the code from table A
   */
  for (let i = 4; i < 8; i++) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  /**
   * End Mark
   */
  _barcode += '+';

  return _barcode;
};

module.exports = ean8;