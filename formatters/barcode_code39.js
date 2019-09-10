/**
 * Translate an code39 barcode to CODE39.TTF font code. Called only from the barcode formatter.
 *
 * @example [ "GSJ-220097"    ,  "code39"  ]
 * @example [ "96385074"      ,  "code39"  ]
 *
 * @param {string} data uppercase letters (A through Z), numeric digits (0 through 9) and a number of special characters (-.$/+% )
 * @returns {string} translated code for CODE39.TTF font
 */
const _code39 = (data) => {
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
};

module.exports = _code39;