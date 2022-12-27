var os = require('os');

// manage node 0.8 / 0.10 differences
var nodeVersion = process.versions.node.split('.');
var tmpDir = (parseInt(nodeVersion[0], 10) === 0 && parseInt(nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();

module.exports  = {
  /* Temp directory */
  tempPath         : tmpDir,
  /* Template path */
  templatePath     : process.cwd(),
  /* Number of LibreOffice + Python factory to start by default. One factory = 2 threads */
  factories        : 1,
  /* If LibreOffice fails to convert one document, how many times we re-try to convert this file? */
  attempts         : 3,
  /* If true, it will start LibreOffice + Python factory immediately (true by default if the carbone server is used).
     If false, it will start LibreOffice + Python factory only when at least one document conversion is needed.*/
  startFactory     : false,
  /* The method helper.getUID() add this prefix in the uid */
  uidPrefix        : 'c',
  /* If multiple factories are used, the pipe name is generated automatically to avoid conflicts */
  pipeNamePrefix   : '_carbone',
  /* list of file parsed for translation and find tools */
  extensionParsed  : '(odt|ods|odp|xlsx|docx|pptx|xml|html)',
  /* lang of carbone and dayjs.js */
  lang             : 'en',
  /* all locales are loaded in memory */
  translations     : {},
  /* currency of data, it depends on the locale if empty */
  currencySource   : '',
  /* default target currency when the formatter convCurr is used without target. It depends on the locale if empty */
  currencyTarget   : '',
  /* currency rates, always based on EUR. So EUR should always equals "1" */
  currencyRates    : {
    EUR : 1,
    USD : 1.1403,
    JPY : 123.20,
    BGN : 1.9558,
    CZK : 25.653,
    DKK : 7.4679,
    GBP : 0.854701,
    HUF : 321.45,
    PLN : 4.2957,
    RON : 4.6656,
    SEK : 10.2460,
    CHF : 1.1256,
    ISK : 134.00,
    NOK : 9.8648,
    HRK : 7.4335,
    RUB : 77.6790,
    TRY : 6.1707,
    AUD : 1.6189,
    BRL : 4.2889,
    CAD : 1.5328,
    CNY : 7.8280,
    HKD : 8.9325,
    IDR : 16241.35,
    ILS : 4.2320,
    INR : 79.4315,
    KRW : 1279.13,
    MXN : 22.3080,
    MYR : 4.7106,
    NZD : 1.7045,
    PHP : 59.809,
    SGD : 1.5525,
    THB : 36.587,
    ZAR : 16.1175
  }
};

