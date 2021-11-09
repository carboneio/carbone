const bwipjs = require("bwip-js");

let barcodesMethods = new Map();
barcodesMethods.set("ean13", _ean13);
barcodesMethods.set("ean8", _ean8);
barcodesMethods.set("code39", _code39);
barcodesMethods.set("ean128", _ean128);

/**
 * Return true if letters from `fromIndex` to (`fromIndex` + `length`) are numbers
 *
 * @private
 * @param  {String}  str       string to test
 * @param  {Integer} fromIndex the index of the first character
 * @param  {Integer} length    the number of characters to analyze
 * @return {Boolean}
 */
function _isNumber(str, fromIndex, length) {
  if (fromIndex + length - 1 > str.length) {
    return false;
  }
  return /^\d+$/.test(str.substr(fromIndex - 1, length));
}

/**
 * @description Translate an ean128 barcode to EAN128.TTF font code. Called only from the barcode formatter.
 *
 * @private
 * @param {string}   arg ean128 barcode
 * @returns {string}     string translated to EAN128.TTF font code
 */
function _ean128(arg) {
  let code128 = "";
  // For optimisation purpose, `dummy` is used to handle 2 characters
  let dummy;

  // u0020 hex = 32 decimal | u007E hex = 126 decimal | u00CB hex = 203 decimal
  if (!arg || !/^(?:[\u0020-\u007E]|\u00CB)+$/.test(arg)) {
    return "";
  }

  let i = 1;
  let tableB = true;
  // Number of digital characters
  let mini;
  while (i <= arg.length) {
    if (tableB) {
      // Change to table C if `i` is the first iterator or 4 digits following
      mini = i === 1 || i + 3 === arg.length ? 4 : 6;

      if (_isNumber(arg, i, mini) === true) {
        // Table C
        i === 1
          ? (code128 = String.fromCharCode(210))
          : (code128 += String.fromCharCode(204));
        tableB = false;
      } else if (i === 1) {
        // Table B
        code128 = String.fromCharCode(209);
      }
    }

    if (!tableB) {
      mini = 2;
      if (_isNumber(arg, i, mini) === true) {
        dummy = parseInt(arg.substr(i - 1, 2));
        if (dummy < 95) {
          dummy += 32;
        } else {
          dummy += 105;
        }
        code128 += String.fromCharCode(dummy);
        i += 2;
      } else {
        code128 += String.fromCharCode(205);
        tableB = true;
      }
    }

    if (tableB) {
      code128 += arg.substr(i - 1, 1);
      i++;
    }
  }

  let checksum = 0;
  for (i = 1; i <= code128.length; i++) {
    dummy = code128.charCodeAt(i - 1);
    if (dummy < 127) {
      dummy -= 32;
    } else {
      dummy -= 105;
    }
    if (i === 1) {
      checksum = dummy;
    }
    checksum = (checksum + (i - 1) * dummy) % 103;
  }

  if (checksum < 95) {
    checksum += 32;
  } else {
    checksum += 100;
  }

  code128 += String.fromCharCode(checksum) + String.fromCharCode(211);

  return code128;
}

/**
 * @description Translate an ean8 barcode to EAN13.TTF font code. Called only from the barcode formatter.
 *
 * @private
 * @param {string} arg 8 numbers ean8 barcode
 * @returns {string} translated to EAN13.TTF font code
 */
function _ean8(arg) {
  let _barcode = "";

  // Allow only a string of numbers
  if (isNaN(arg)) {
    // console.error('It should be a string.');
    return "";
  }

  // Check length of the string
  if (arg.length !== 8) {
    // console.error('Number too small, only 13 digits.');
    return "";
  }

  // _checksumEan8 (arg) // -> no checkum, accept all barcode for the moment

  // Define the first digits
  _barcode += ":";

  // Define the code from table A
  for (let i = 0; i < 4; i++) {
    _barcode += String.fromCharCode(65 - 48 + arg.charCodeAt(i));
  }

  // Middle Separator
  _barcode += "*";

  // Define the code from table A
  for (let i = 4; i < 8; i++) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  // End Mark
  _barcode += "+";

  return _barcode;
}

/**
 * @description Translate an ean13 barcode to EAN13.TTF font code. Called only from the barcode formatter.
 *
 * @private
 * @param {string} arg 13 numbers ean13 barcode
 * @returns {string} translated code for EAN13.TTF font
 */
function _ean13(arg) {
  var _first; // first number used to defined the type of numbers from A or B
  var _barcode = ""; // final result
  var _tableA; // Boolean used to define the table A or B

  // Allow only a string of numbers
  if (isNaN(arg)) {
    // console.error('It should be a string.');
    return "";
  }

  // Check length of the string
  if (arg.length !== 13) {
    // console.error('Number too small, only 13 digits.');
    return "";
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
    } else if (i === 3) {
      if (_first === 0 || _first === 4 || _first === 7 || _first === 8) {
        _tableA = true;
      }
    } else if (i === 4) {
      if (
        _first === 0 ||
        _first === 1 ||
        _first === 4 ||
        _first === 5 ||
        _first === 9
      ) {
        _tableA = true;
      }
    } else if (i === 5) {
      if (
        _first === 0 ||
        _first === 2 ||
        _first === 5 ||
        _first === 6 ||
        _first === 7
      ) {
        _tableA = true;
      }
    } else if (i === 6) {
      if (
        _first === 0 ||
        _first === 3 ||
        _first === 6 ||
        _first === 8 ||
        _first === 9
      ) {
        _tableA = true;
      }
    }
    if (_tableA) {
      _barcode += String.fromCharCode(65 - 48 + arg.charCodeAt(i));
    } else {
      _barcode += String.fromCharCode(75 - 48 + arg.charCodeAt(i));
    }
  }

  // Middle Separator
  _barcode += "*";

  // Second part characters from C table
  for (let i = 7; i <= 12; i++) {
    _barcode += String.fromCharCode(97 - 48 + arg.charCodeAt(i));
  }

  // End Mark
  _barcode += "+";

  return _barcode;
}

/**
 * @description Translate an code39 barcode to CODE39.TTF font code. Called only from the barcode formatter.
 *
 * @private
 * @param {string} data uppercase letters (A through Z), numeric digits (0 through 9) and a number of special characters (-.$/+% )
 * @returns {string} translated code for CODE39.TTF font
 */
function _code39(data) {
  let _err = false;

  if (!data || data.length === 0) {
    return "";
  }

  for (let i = data.length - 1; i >= 0 && _err === false; i--) {
    const c = data[i].charCodeAt(0);

    // characters not allowed
    if (
      c !== 32 &&
      c !== 36 &&
      c !== 37 &&
      c !== 43 &&
      !(c >= 45 && c <= 57) &&
      !(c >= 65 && c <= 90)
    ) {
      _err = true;
    }
  }

  if (_err) {
    return "";
  }

  return `*${data}*`;
}

/**
 *
 * Formatter injected before the `:barcode` formatter is used into image.
 * It is used to know if the barcode is an image or not.
 *
 * @private
 * @param {*} value
 * @returns
 */
function isImage(value) {
  this.isBarcodeImage = true;
  return value;
}

/**
 * Translate a barcode to specific font code.
 *
 * @version 3.0.0 UPDATED
 *
 * @param   {String} data Barcode numbers
 * @param   {String} type Barcode type: `ean13`, `ean8`, `ean128` or `code39`
 * @returns {String}      translated  to EAN13.TTF font code or empty string
 */
function barcode(data, type) {
  if (!this.isBarcodeImage) {
    /** BARCODE as a FONT - Previous system */
    var _fc = barcodesMethods.get(type);
    if (_fc !== undefined) {
      return _fc(data);
    }
    return "";
  }
  this.isBarcodeImage = false;
  /**
   * BARCODE as an IMAGE
   * Arguments are saved as URL parameters string because it is saved on the Image Database Map
   */
  return `bcid=${encodeURIComponent(type)}&text=${encodeURIComponent(data)}`;
}

/**
 * @private
 * @param {String} type
 * @returns
 */
function initBarcodeValuesBasedOnType(bcid) {
  const _barcodeObject = {
    scale: 3,
    rotate: "N",
    includetext: true, // Show human-readable text
    textxalign: "center", // Always good to set this
  };

  if (bcid === "mailmark") {
    _barcodeObject.type = "9"; //7, 9 or 29 The type number should be a string
  }
  if (bcid === "rectangularmicroqrcode") {
    _barcodeObject.version = "R17x139";
  }
  if (bcid === "gs1-cc") {
    _barcodeObject.ccversion = "b";
    _barcodeObject.cccolumns = 4;
  }
  if (bcid === "maxicode") {
    // Mode 2 Formatted data containing a Structured Carrier Message with a numeric (US domestic) postal code.
    // Mode 3 Formatted data containing a Structured Carrier Message with an alphanumeric (international) postal code.
    _barcodeObject.mode = 2;
    _barcodeObject.parse = true;
  }
  return _barcodeObject;
}

/**
 * @private
 * @param {Function} callback
 * @returns
 */
function generateBarcodeImage(barcodeUrlParams, callback) {
  let _barcodeData = {};
  try {
    _barcodeData = Object.fromEntries(new URLSearchParams(barcodeUrlParams));
  } catch (err) {
    return callback("Barcode read values: " + err.toString());
  }
  return bwipjs.toBuffer(
    {
      ...initBarcodeValuesBasedOnType(_barcodeData.bcid),
      ..._barcodeData,
    },
    function (err, png) {
      if (err) {
        // `err` may be a string or Error object
        return callback("Barcode generation error: " + err.toString());
      } else {
        return callback(null, {
          data: new Buffer.from(png, "base64"),
          extension: "png",
          mimetype: "image/png",
        });
      }
    }
  );
}

const mailmark24x24type7 = "JGB 012800011000000744BN189AA1B0W1T1HQ       TEST";
const mailmark32x32type9 = "JGB 011123456712345678CW14NJ1T 0EC2M2QS      REFERENCE1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
const mailmark16x48type29 = "JGB 011123456712345678CW14NJ1T 0EC2M2QS      REF1234567890QWERTYUIOPASD";
const mailmark16x48type29v2 = "JGB 012100123412345678AB19XY1A 0             www.xyz.com"

/**
 * List of supported barcodes with the symbol, the fullname, a text example, and available options
 * The 'tested' at false means: the barcode was not tested because the scanner is really specific and not available on smartphone
 */
const supportedBarcodes = [
  {
    // GOOD
    tested: true,
    sym: "ean5",
    desc: "EAN-5 (5 digit addon)",
    text: "90200",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "ean2",
    desc: "EAN-2 (2 digit addon)",
    text: "05",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "ean13",
    desc: "EAN-13",
    text: "2112345678900",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "ean8",
    desc: "EAN-8",
    text: "02345673",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "upca",
    desc: "UPC-A",
    text: "416000336108",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "upce",
    desc: "UPC-E",
    text: "00123457",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "isbn",
    desc: "ISBN",
    text: "978-1-56581-231-4 90000",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "ismn",
    desc: "ISMN",
    text: "979-0-2605-3211-3",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "issn",
    desc: "ISSN",
    text: "0311-175X 00 17",
    opts: "includetext guardwhitespace",
  },
  {
    // GOOD
    tested: true,
    sym: "code128",
    desc: "Code 128",
    text: "5715311709768", // Count01234567!
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1-128",
    desc: "GS1-128",
    text: "(01)95012345678903(3103)000123",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "ean14",
    desc: "GS1-14",
    text: "(01) 0 46 01234 56789 3",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "sscc18",
    desc: "SSCC-18",
    text: "(00) 0 0614141 123456789 0",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "code39",
    desc: "Code 39",
    text: "THIS IS CODE 39",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "code39ext",
    desc: "Code 39 Extended",
    text: "Code39 Ext!",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "code32",
    desc: "Italian Pharmacode",
    text: "01234567",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "pzn",
    desc: "Pharmazentralnummer (PZN)",
    text: "123456",
    opts: "includetext",
  },
  {
    tested: false,
    sym: "code93",
    desc: "Code 93",
    text: "THIS IS CODE 93",
    opts: "includetext includecheck",
  },
  {
    tested: false,
    sym: "code93ext",
    desc: "Code 93 Extended",
    text: "Code93 Ext!",
    opts: "includetext includecheck",
  },
  {
    // GOOD
    tested: true,
    sym: "interleaved2of5",
    desc: "Interleaved 2 of 5 (ITF)",
    text: "2401234567",
    opts: "height=12 includecheck includetext includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "itf14",
    desc: "ITF-14",
    text: "0 46 01234 56789 3",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "identcode",
    desc: "Deutsche Post Identcode",
    text: "563102430313",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "leitcode",
    desc: "Deutsche Post Leitcode",
    text: "21348075016401",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "databaromni",
    desc: "GS1 DataBar Omnidirectional",
    text: "(01)24012345678905",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarstacked",
    desc: "GS1 DataBar Stacked",
    text: "(01)24012345678905",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarstackedomni",
    desc: "GS1 DataBar Stacked Omnidirectional",
    text: "(01)24012345678905",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databartruncated",
    desc: "GS1 DataBar Truncated",
    text: "(01)24012345678905",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarlimited",
    desc: "GS1 DataBar Limited",
    text: "(01)15012345678907",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarexpanded",
    desc: "GS1 DataBar Expanded",
    text: "(01)95012345678903(3103)000123",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarexpandedstacked",
    desc: "GS1 DataBar Expanded Stacked",
    text: "(01)95012345678903(3103)000123",
    opts: "segments=4",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1northamericancoupon",
    desc: "GS1 North American Coupon",
    text: "(8110)106141416543213500110000310123196000",
    opts: "includetext segments=8",
  },
  {
    // GOOD
    tested: true,
    sym: "pharmacode",
    desc: "Pharmaceutical Binary Code",
    text: "117480",
    opts: "showborder",
  },
  {
    tested: false,
    sym: "pharmacode2",
    desc: "Two-track Pharmacode",
    text: "117480",
    opts: "includetext showborder",
  },
  {
    // GOOD
    tested: true,
    sym: "code2of5",
    desc: "Code 25",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "industrial2of5",
    desc: "Industrial 2 of 5",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "iata2of5",
    desc: "IATA 2 of 5",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "matrix2of5",
    desc: "Matrix 2 of 5",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    tested: false,
    sym: "coop2of5",
    desc: "COOP 2 of 5",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "datalogic2of5",
    desc: "Datalogic 2 of 5",
    text: "01234567",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "code11",
    desc: "Code 11",
    text: "0123456789",
    opts: "includetext includecheck includecheckintext",
  },
  {
    tested: false,
    sym: "bc412",
    desc: "BC412",
    text: "BC412",
    opts: "semi includetext includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "rationalizedCodabar",
    desc: "Codabar",
    text: "A0123456789B",
    opts: "includetext includecheck includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "onecode",
    desc: "USPS Intelligent Mail",
    text: "0123456709498765432101234567891",
    opts: "barcolor=FF0000",
  },
  {
    // GOOD
    tested: true,
    sym: "postnet",
    desc: "USPS POSTNET",
    text: "01234",
    opts: "includetext includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "planet",
    desc: "USPS PLANET",
    text: "01234567890",
    opts: "includetext includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "royalmail",
    desc: "Royal Mail 4 State Customer Code",
    text: "LE28HS9Z",
    opts: "includetext barcolor=FF0000",
  },
  {
    // GOOD
    tested: true,
    sym: "auspost",
    desc: "AusPost 4 State Customer Code",
    text: "5956439111ABA 9",
    opts: "includetext custinfoenc=character",
  },
  {
    // GOOD
    tested: true,
    sym: "kix",
    desc: "Royal Dutch TPG Post KIX",
    text: "1231FZ13XHS",
    opts: "includetext",
  },
  {
    tested: false,
    sym: "japanpost",
    desc: "Japan Post 4 State Customer Code",
    text: "6540123789-A-K-Z",
    opts: "includetext includecheckintext",
  },
  {
    // GOOD
    tested: true,
    sym: "msi",
    desc: "MSI Modified Plessey",
    text: "0123456789",
    opts: "includetext includecheck includecheckintext",
  },
  {
    tested: false,
    sym: "plessey",
    desc: "Plessey UK",
    text: "01234ABCD",
    opts: "includetext includecheckintext",
  },
  {
    tested: false,
    sym: "telepen",
    desc: "Telepen",
    text: "ABCDEF",
    opts: "includetext",
  },
  {
    tested: false,
    sym: "telepennumeric",
    desc: "Telepen Numeric",
    text: "01234567",
    opts: "includetext",
  },
  {
    tested: false,
    sym: "posicode",
    desc: "PosiCode",
    text: "ABC123",
    opts: "version=b inkspread=-0.5 parsefnc includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "codablockf",
    desc: "Codablock F",
    text: "CODABLOCK F 34567890123456789010040digit",
    opts: "columns=8",
  },
  {
    // GOOD
    tested: true,
    sym: "code16k",
    desc: "Code 16K",
    text: "Abcd-1234567890-wxyZ",
    opts: "",
  },
  {
    tested: false,
    sym: "code49",
    desc: "Code 49",
    text: "MULTIPLE ROWS IN CODE 49",
    opts: "",
  },
  {
    tested: false,
    sym: "channelcode",
    desc: "Channel Code",
    text: "3493",
    opts: "height=12 includetext",
  },
  {
    tested: false,
    sym: "flattermarken",
    desc: "Flattermarken",
    text: "11099",
    opts: "inkspread=-0.25 showborder borderleft=0 borderright=0",
  },
  {
    tested: false,
    sym: "raw",
    desc: "Custom 1D symbology",
    text: "331132131313411122131311333213114131131221323",
    opts: "height=12",
  },
  {
    tested: false,
    sym: "daft",
    desc: "Custom 4 state symbology",
    text: "FATDAFTDAD",
    opts: "",
  },
  {
    tested: false,
    sym: "symbol",
    desc: "Miscellaneous symbols",
    text: "fima",
    opts: "backgroundcolor=DD000011",
  },
  {
    // GOOD
    tested: true,
    sym: "pdf417",
    desc: "PDF417",
    text: "This is PDF417",
    opts: "columns=2",
  },
  {
    // GOOD
    tested: true,
    sym: "pdf417compact",
    desc: "Compact PDF417",
    text: "This is compact PDF417",
    opts: "columns=2",
  },
  {
    // GOOD
    tested: true,
    sym: "micropdf417",
    desc: "MicroPDF417",
    text: "MicroPDF417",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "datamatrix",
    desc: "Data Matrix",
    text: "This is Data Matrix!",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "datamatrixrectangular",
    desc: "Data Matrix Rectangular",
    text: "1234",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "datamatrixrectangularextension",
    desc: "Data Matrix Rectangular Extension",
    text: "1234",
    opts: "version=8x96",
  },
  {
    // GOOD
    tested: true,
    sym: "mailmark",
    desc: "Royal Mail Mailmark",
    text: mailmark32x32type9, //
    opts: "type=29", // type 7 or 9
  },
  {
    // GOOD
    tested: true,
    sym: "qrcode",
    desc: "QR Code",
    text: "http://goo.gl/0bis",
    opts: "eclevel=M",
  },
  {
    // GOOD
    tested: true,
    sym: "swissqrcode",
    desc: "Swiss QR Code",
    text: "SPC\n0200\n1\nCH5800791123000889012\nS\nRobert Schneider AG\nRue du Lac\n1268\n2501\nBiel\nCH\n\n199.95\nCHF\nKPia-Maria Rutschmann-Schnyder\nGrosse Marktgasse 28\n9400 Rorschach\n\n\nCH\nSCOR\nRF18539007547034\n\nEPD\n",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "microqrcode",
    desc: "Micro QR Code",
    text: "1234",
    opts: "",
  },
  {
    tested: false,
    sym: "rectangularmicroqrcode",
    desc: "Rectangular Micro QR Code",
    text: "1234",
    opts: "version=R17x139",
  },
  {
    // GOOD
    tested: true,
    sym: "maxicode",
    desc: "MaxiCode",
    text: "[)>^03001^02996152382802^029840^029001^0291Z00004951^029UPSN^02906X610^029159^0291234567^0291/1^029^029Y^029634 ALPHA DR^029PITTSBURGH^029PA^029^004",
    opts: "mode=2 parse",
  },
  {
    // GOOD
    tested: true,
    sym: "azteccode",
    desc: "Aztec Code",
    text: "This is Aztec Code",
    opts: "format=full",
  },
  {
    // GOOD
    tested: true,
    sym: "azteccodecompact",
    desc: "Compact Aztec Code",
    text: "1234",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "aztecrune",
    desc: "Aztec Runes",
    text: "255",
    opts: "",
  },
  {
    tested: false,
    sym: "codeone",
    desc: "Code One",
    text: "Code One",
    opts: "",
  },
  {
    tested: false,
    sym: "hanxin",
    desc: "Han Xin Code",
    text: "This is Han Xin",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "dotcode",
    desc: "DotCode",
    text: "This is DotCode",
    opts: "inkspread=0.16",
  },
  {
    tested: false,
    sym: "ultracode",
    desc: "Ultracode",
    text: "Awesome colours!",
    opts: "eclevel=EC2",
  },
  {
    tested: false,
    sym: "gs1-cc",
    desc: "GS1 Composite 2D Component",
    text: "(01)95012345678903(3103)000123",
    opts: "ccversion=b cccolumns=4",
  },
  {
    // GOOD
    tested: true,
    sym: "ean13composite",
    desc: "EAN-13 Composite",
    text: "2112345678900|(99)1234-abcd",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "ean8composite",
    desc: "EAN-8 Composite",
    text: "02345673|(21)A12345678",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "upcacomposite",
    desc: "UPC-A Composite",
    text: "416000336108|(99)1234-abcd",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "upcecomposite",
    desc: "UPC-E Composite",
    text: "00123457|(15)021231",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "databaromnicomposite",
    desc: "GS1 DataBar Omnidirectional Composite",
    text: "(01)03612345678904|(11)990102",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarstackedcomposite",
    desc: "GS1 DataBar Stacked Composite",
    text: "(01)03412345678900|(17)010200",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarstackedomnicomposite",
    desc: "GS1 DataBar Stacked Omnidirectional Composite",
    text: "(01)03612345678904|(11)990102",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databartruncatedcomposite",
    desc: "GS1 DataBar Truncated Composite",
    text: "(01)03612345678904|(11)990102",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarlimitedcomposite",
    desc: "GS1 DataBar Limited Composite",
    text: "(01)03512345678907|(21)abcdefghijklmnopqrst",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarexpandedcomposite",
    desc: "GS1 DataBar Expanded Composite",
    text: "(01)93712345678904(3103)001234|(91)1A2B3C4D5E",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "databarexpandedstackedcomposite",
    desc: "GS1 DataBar Expanded Stacked Composite",
    text: "(01)00012345678905(10)ABCDEF|(21)12345678",
    opts: "segments=4",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1-128composite",
    desc: "GS1-128 Composite",
    text: "(00)030123456789012340|(02)13012345678909(37)24(10)1234567ABCDEFG",
    opts: "ccversion=c",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1datamatrix",
    desc: "GS1 Data Matrix",
    text: "(01)03453120000011(17)120508(10)ABCD1234(410)9501101020917",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1datamatrixrectangular",
    desc: "GS1 Data Matrix Rectangular",
    text: "(01)03453120000011(17)120508(10)ABCD1234(410)9501101020917",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1qrcode",
    desc: "GS1 QR Code",
    text: "(01)03453120000011(8200)http://www.abc.net(10)ABCD1234(410)9501101020917",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "gs1dotcode",
    desc: "GS1 DotCode",
    text: "(235)5vBZIF%!<B;?oa%(01)01234567890128(8008)19052001",
    opts: "rows=16",
  },
  {
    // GOOD
    tested: true,
    sym: "hibccode39",
    desc: "HIBC Code 39",
    text: "A123BJC5D6E71",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "hibccode128",
    desc: "HIBC Code 128",
    text: "A123BJC5D6E71",
    opts: "includetext",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcdatamatrix",
    desc: "HIBC Data Matrix",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcdatamatrixrectangular",
    desc: "HIBC Data Matrix Rectangular",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcpdf417",
    desc: "HIBC PDF417",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcmicropdf417",
    desc: "HIBC MicroPDF417",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcqrcode",
    desc: "HIBC QR Code",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibccodablockf",
    desc: "HIBC Codablock F",
    text: "A123BJC5D6E71",
    opts: "",
  },
  {
    // GOOD
    tested: true,
    sym: "hibcazteccode",
    desc: "HIBC Aztec Code",
    text: "A123BJC5D6E71",
    opts: "",
  }
];

module.exports = {
  isImage,
  barcode,
  generateBarcodeImage,
  initBarcodeValuesBasedOnType,
  supportedBarcodes,
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
