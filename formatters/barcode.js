
let barcodesMethods = new Map();
barcodesMethods.set('ean13', _ean13);
barcodesMethods.set('ean8', _ean8);
barcodesMethods.set('code39', _code39);
barcodesMethods.set('code128', _ean128);

const _ean128TestNum = (mini, chaine, i) => {
  mini--;
  if (i + mini <= chaine.length) {
    let y = 0;
    while (mini >= 0 && y === 0) {
      const c = chaine.charCodeAt(i + mini -1);
      if (c < 48 || c > 57) {
        y = 1;
        mini++;
      }
      mini--;
    }
  }
  return mini;
};

const _ean128IsNumeric = (str) => {
  return /^\d+$/.test(str);
};

const _ean128GetDoubleNumber = (chaine) => {
  let j = 1;
  let chaine2 = '';
  while (j <= chaine.length) {
    if (_ean128IsNumeric(chaine.substr(j - 1, 1))) {
      chaine2 += chaine.substr(j - 1, 1);
      j++;
    }
    else {
      break;
    }
  }
  return chaine2;
};

/**
 * Translate an ean128 barcode to EAN128.TTF font code. Called only from the barcode formatter.
 *
 * @param {string} arg ean128 codebar
 * @returns {string} translated to EAN13.TTF font code
 */
const _ean128 = (chaine) => {

  let code128 = '';
  let dummy; // traitement de 2 caractères à la fois

  if (!chaine || chaine === '') {
    return '';
  }

  for (let i = 0; i < chaine.length; i++) {
    const c = chaine.charCodeAt(i);
    if (!(c >= 32 && c <= 126) && !(c === 203)) {
      return '';
    }
  }

  let i = 1;
  let tableB = true;
  // nb de caractères numériques suivants
  let mini;
  while (i <= chaine.length) {
    if (tableB) {
      // passer en table C pour 4 chiffres au début ou a la fin ou pour 6 chiffres
      mini = ((i === 1) || (i + 3 === chaine.length)) ? 4 : 6;

      // si les mini caractères à partir de index sont numériques, alors mini = 0
      mini = _ean128TestNum(mini, chaine, i);
      if (mini < 0) {
        // débuter sur la table C ou commuter sur la table C
        (i === 1 ? code128 = String.fromCharCode(210) : code128 += String.fromCharCode(204));
        tableB = false;
      }
      else if (i === 1) {
        // débuter sur la table B
        code128 = String.fromCharCode(209);
      }
    }

    if (!tableB) {
      // on est sur la table C, on va essayer de traiter 2 chiffres
      mini = 2;
      mini = _ean128TestNum(mini, chaine, i);
      if (mini < 0) {
        dummy = parseInt(_ean128GetDoubleNumber(chaine.substr(i - 1, 2)));
        if (dummy < 95) {
          dummy += 32;
        }
        else {
          dummy += 105;
        }
        code128 += String.fromCharCode(dummy);
        i += 2;
      }
      else {
        code128 += String.fromCharCode(205);
        tableB = true;
      }
    }

    if (tableB) {
      code128 += chaine.substr(i - 1, 1);
      i++;
    }
  }

  let checksum = 0;
  for (i = 1; i <= code128.length; i++) {
    dummy = code128.charCodeAt(i - 1);
    if (dummy < 127) {
      dummy -= 32;
    }
    else {
      dummy -= 105;
    }
    if (i === 1) {
      checksum = dummy;
    }
    checksum = (checksum + (i - 1) * dummy ) % 103;
  }

  if (checksum < 95) {
    checksum += 32;
  }
  else {
    checksum += 100;
  }

  code128 += String.fromCharCode(checksum) + String.fromCharCode(211);

  return code128;
};

/**
 * Translate an ean8 barcode to EAN13.TTF font code. Called only from the barcode formatter.
 *
 * @param {string} arg 8 numbers ean8 codebar
 * @returns {string} translated to EAN13.TTF font code
 */
function _ean8 (arg) {
  let _barcode = '';

  // Allow only a string of numbers
  if (isNaN(arg)) {
    // console.error('It should be a string.');
    return '';
  }

  // Check length of the string
  if (arg.length !== 8) {
    // console.error('Number too small, only 13 digits.');
    return '';
  }

  // _checksumEan8 (arg) // -> no checkum, accept all barcode for the moment

  // Define the first digits
  _barcode += ':';

  // Define the code from table A
  for (let i = 0; i < 4; i++) {
    _barcode += String.fromCharCode(65 - 48 + arg.charCodeAt(i));
  }

  // Middle Separator
  _barcode += '*';

  // Define the code from table A
  for (let i = 4; i < 8; i++) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  // End Mark
  _barcode += '+';

  return _barcode;
}

/**
  * Translate an ean13 barcode to EAN13.TTF font code. Called only from the barcode formatter.
  *
  * @param {string} arg 13 numbers ean13 codebar
  * @returns {string} translated code for EAN13.TTF font
 */
function _ean13 (arg) {
  var _first; // first number used to defined the type of numbers from A or B
  var _barcode = ''; // final result
  var _tableA; // Boolean used to define the table A or B


  // Allow only a string of numbers
  if (isNaN(arg)) {
    // console.error('It should be a string.');
    return '';
  }

  // Check length of the string
  if (arg.length !== 13) {
    // console.error('Number too small, only 13 digits.');
    return '';
  }

  // _checksumEan13(arg) // -> no checkum, accept all barcode for the moment

  // Translate the ean13code to ean13.ttf string.
  // Define the first digits, the second from A table
  _barcode = arg[0] + String.fromCharCode(65 - 48 + arg[1].charCodeAt(0));
  _first = arg[0].charCodeAt(0) - 48;

  // First part charaters from A or B table
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

  // Middle Separator
  _barcode += '*';

  // Second part characters from C table
  for (let i = 7 ; i <= 12 ; i++ ) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  // End Mark
  _barcode += '+';

  return _barcode;
}

/**
 * Translate an code39 barcode to CODE39.TTF font code. Called only from the barcode formatter.
 *
 * @param {string} data uppercase letters (A through Z), numeric digits (0 through 9) and a number of special characters (-.$/+% )
 * @returns {string} translated code for CODE39.TTF font
 */
function _code39 (data) {
  let _err = false;

  if (!data || data.length === 0) {
    return '';
  }

  for (let i = data.length - 1; i >= 0 && _err === false ; i--) {
    const c = data[i].charCodeAt(0);

    // characters not allowed
    if (c !== 32 &&
      c !== 36 &&
      c !== 37 &&
      c !== 43 &&
      !(c >= 45 && c <= 57) &&
      !(c >= 65 && c <= 90)) {
      console.error('Input error', data[i], data.charCodeAt(i));
      _err = true;
    }
  }

  if (_err) {
    return '';
  }

  return `*${data}*`;
}

/**
 * Translate a barcode to specific font code.
 *
 * You have to apply the barecode font to your text in order to display the barcode.
 *
 * @example [ "8056459824973" ,  "ean13"   ]
 * @example [ "9780201134476" ,  "ean13"   ]
 * @example [ "3754 KC 75"    ,  "ean128"  ]
 * @example [ "DR39"          ,  "ean128"  ]
 * @example [ "35967101"      ,  "ean8"    ]
 * @example [ "96385074"      ,  "ean8"    ]
 * @example [ "GSJ-220097"    ,  "code39"  ]
 * @example [ "ASDFGH-.$/+% " ,  "code39"  ]
 *
 * @param   {String} data Barcode numbers
 * @param   {String} type Barcode type: `ean13`, `ean8`, `ean128` or `code39`
 * @returns {String}      translated  to EAN13.TTF font code or empty string
 */
function barcode (data, type) {
  var _fc = barcodesMethods.get(type);
  if (_fc !== undefined ) {
    return _fc(data);
  }
  return '';
}

module.exports = {
  barcode : barcode
};


// List of barcode checksum function, unused for the moment
// /**
//  * Check if the barcode control key is valid
//  * @return {String} always return ''  (NOT USED FOR THE MOMENT)
//  */
// function _checksumEan8 (arg) {
//   let _checksum = 0;
//   let _controlKey = 0;
//
//   _checksum = 0;
//   for (let i = 0; i < 7 ; i += 2) {
//     _checksum +=  parseInt(arg[i]);
//   }
//   _checksum *= 3;
//   for (let j = 1; j < 6 ; j += 2) {
//     _checksum += parseInt(arg[j]);
//   }
//   _controlKey = 10 - _checksum % 10;
//   // Check result of the control key
//   if (parseInt(arg[arg.length - 1]) !== _controlKey) {
//     console.error('Barcode ean8 not valid!', 'Actual last digit = ' + arg[arg.length - 1], 'expected = ' + _controlKey);
//     return '';
//   }
// }
//
// /**
//  * Check if the barcode control key is valid
//  * @return {String} always return ''  (NOT USED FOR THE MOMENT)
//  */
// function _checksumEan13 (arg) {
//   let _checksum = 0;
//   let _controlKey = 0;
//
//   _checksum = 0;
//   for (let j = 1; j <= 12 ; j += 2) {
//     _checksum += parseInt(arg[j]);
//   }
//   _checksum *= 3;
//   for (let i = 0; i < 12 ; i += 2) {
//     _checksum +=  parseInt(arg[i]);
//   }
//   _controlKey = 10 - _checksum % 10;
//
//   // Check result of the control key
//   if (parseInt(arg[arg.length - 1]) !== _controlKey) {
//     console.error('Barcode ean13 not valid!', 'Actual last digit = ' + arg[arg.length - 1], 'expected = ' + _controlKey);
//     return '';
//   }
// }