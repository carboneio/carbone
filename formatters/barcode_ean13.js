/**
 * @description Translate an ean13 barcode to EAN13.TTF font code.
 *
 * @example "8056459824973"
 * @example "9780201134476"
 *
 * @param {string} arg 13 numbers ean13 codebar
 * @returns {string} translated code for EAN13.TTF font
 */
const ean13 = (arg) =>{
  var _first; // first number used to defined the type of numbers from A or B
  var _barcode = ''; // final result
  var _tableA; // Boolean used to define the table A or B
  // var _checksum = 0; // result calcul pour la clef de controle
  // var _controlKey; // last digit computed

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
  if (arg.length !== 13) {
    // console.error('Number too small, only 13 digits.');
    return '';
  }

  // DISABLED => SOME BARCODE ARE BEGINING WITH 000000
  /**
   * Check if the barcode control key is valid
   * Calcul of the control key
   */
  // _checksum = 0;
  // for (let j = 1; j <= 12 ; j += 2) {
  //   _checksum += parseInt(arg[j]);
  // }
  // _checksum *= 3;
  // for (let i = 0; i < 12 ; i += 2) {
  //   _checksum +=  parseInt(arg[i]);
  // }
  // _controlKey = 10 - _checksum % 10;

  /**
   * Check result of the control key
   */
  // if (parseInt(arg[arg.length - 1]) !== _controlKey) {
  //   console.error('Barcode ean13 not valid!', 'Actual last digit = ' + arg[arg.length - 1], 'expected = ' + _controlKey);
  //   return '';
  // }

  /**
   * If everything ok, start translate the ean13code to ean13.tff string.
   * Define the first digits, the second from A table
   */
  _barcode = arg[0] + String.fromCharCode(65 - 48 + arg[1].charCodeAt(0));
  _first = arg[0].charCodeAt(0) - 48;

  /**
   * First part charaters from A or B table
   */
  for (let i = 2; i <= 6; i++) {
    _tableA = false;
    if (i === 2) {
      if (_first >= 0 && _first <= 3) {
        _tableA = true;
      }
    }
    else if (i === 3) {
      if (_first === 0 || _first === 4 ||
          _first === 7 || _first === 8) {
        _tableA = true;
      }
    }
    else if (i === 4) {
      if (_first === 0 || _first === 1 ||
          _first === 4 || _first === 5 || _first === 9) {
        _tableA = true;
      }
    }
    else if (i === 5) {
      if (_first === 0 || _first === 2 ||
          _first === 5 || _first === 6 || _first === 7) {
        _tableA = true;
      }
    }
    else if (i === 6) {
      if (_first === 0 || _first === 3 ||
          _first === 6 || _first === 8 ||
          _first === 9) {
        _tableA = true;
      }
    }
    if (_tableA) {
      _barcode += String.fromCharCode(65 - 48 + arg.charCodeAt(i));
    }
    else {
      _barcode += String.fromCharCode(75 - 48 + arg.charCodeAt(i));
    }
  }

  /**
   * Middle Separator
   */
  _barcode += '*';

  /**
   * Second part charaters from C table
   */
  for (let i = 7 ; i <= 12 ; i++ ) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  /**
   * End Mark
   */
  _barcode += '+';

  return _barcode;
};

module.exports = ean13;