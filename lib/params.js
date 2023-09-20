var os = require('os');
var path = require('path');

// manage node 0.8 / 0.10 differences
var nodeVersion = process.versions.node.split('.');
var tmpDir = (parseInt(nodeVersion[0], 10) === 0 && parseInt(nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();
const isRunningTest = typeof global.it === 'function';

module.exports  = {
  /* activate feature of the next major version available since vXXX.XXXX.XXX. Deactivated by default  */
  preReleaseFeatureIn     : (isRunningTest === true ? 4015000 : 0), // activate v5 for tests
  /* Temp directory */
  tempPath                : tmpDir,
  /* Sub directory automatically created in tempPath to store temporal render */
  // renderPath              : path.join(tmpDir, 'carbone_render'),
  pythonPath              : path.join(__dirname, 'converter.py'),
  authentication          : false,
  studio                  : false,
  studioUser              : '',               // Format: admin:pass encoded in base64. Deactivate studio basic authentication if empty or undefined
  maxDataSize             : 60 * 1024 * 1024, // Default: 60MB for rendering
  maxTemplateSize         : 20 * 1024 * 1024, // Default: 20MB
  /* Template path */
  /* If true, carbone will send the conversion job to a carbone server */
  delegateToServer        : false,
  /* Serves's address, (client) */
  host                    : '127.0.0.1',
  /* IP accepted to listen (server) */
  bind                    : '127.0.0.1',
  /* Port of the server */
  port                    : 4000,
  /* where are stored template locally */
  templatePath            : path.join(process.cwd(), 'template'),
  /* Template path retention in days. 0 means infinite retention (use disk access time) */
  templatePathRetention   : 0,
  /* where rendered report are saved temporary */
  renderPath              : path.join(process.cwd(), 'render'),
  /* Render path retention in minutes if file not downloaded. 0 means infinite retention (use disk modified time) */
  renderPathRetention     : 60,
  renderFilePrefixLength  : 0,
  queuePath               : path.join(process.cwd(), 'queue'),
  assetPath               : path.join(process.cwd(), 'asset'),
  configPath              : path.join(process.cwd(), 'config'),
  pluginPath              : path.join(process.cwd(), 'plugin'),
  licenseDir              : path.join(process.cwd(), 'config'),
  license                 : '',
  workDir                 : process.cwd(),
  jwtAudience             : 'carbone-ee',
  /* Number of LibreOffice + Python factory to start by default. One factory = 2 threads */
  factories               : 1,
  /* If LibreOffice fails to convert one document, how many times we re-try to convert this file? */
  attempts                : 1,
  /* If true, it will start LibreOffice + Python factory immediately (true by default if the carbone server is used).
     If false, it will start LibreOffice + Python factory only when at least one document conversion is needed.*/
  startFactory            : false,
  /* approximated LibreOffice memory leak per report convered, unit: MegaBytes. Set the value to 0 to disable */
  factoryMemoryFileSize   : 1,
  /* max percentage of memory used by one LibreOffice process. Set the value to 0 to disable */
  factoryMemoryThreshold  : 50,
  /* Timeout used to kill a factory if a report is converting for a long time. Set the value to 0 to disable. (unit: ms) */
  converterFactoryTimeout : 60000,
  /* Enable XLSM file support */
  xlsmEnabled             : false,
  // bit field to activate securoty feature.
  securityLevel           : 0,
  /* The method helper.getUID() add this prefix in the uid */
  uidPrefix               : 'c',
  /* If multiple factories are used, the pipe name is generated automatically to avoid conflicts */
  pipeNamePrefix          : '_carbone',
  /* list of file parsed for translation and find tools */
  extensionParsed         : '(odt|ods|odp|xlsx|docx|pptx|xml|html)',
  /* lang of carbone and moment.js */
  lang                    : 'en',
  /* default output timezone for dates */
  timezone                : 'Europe/Paris',
  /* all locales are loaded in memory */
  translations            : {},
  /* Retry on error for egress traffic */
  egressUserAgent         : 'carbone-ee',
  /* Automatically retry on errors */
  egressMaxRetry          : 0,
  egressTenantFilter      : [],
  /* Does egressIssuerFilter contain tenant to exclude (true, by default) or to include (false) */
  egressExcludeFilterMode : true,
  /* Forward Proxy URL of egress traffic (get image) */
  egressProxyPrimary      : '', // must be a valid URL like this: http://192.168.1.1:4000
  egressProxySecondary    : '',
  // Available variables:
  //   - {protocol}  : https / http
  //   - {hostname}  : example.com
  //   - {port}      : 443
  //   - {tenantId}  : JWT issuer if used. 0 by default.
  //   - {requestId} : Unique id generated for each new request received by Carbone Webserver. 0 by default
  //   - {path}      : original path of the request (start with /)
  egressProxyPath         : '{path}', // Example if URL rewritted:  /${protocol}/${hostname}/${port}/${tenantId}/${requestId}${path}
  /* currency of data, it depends on the locale if empty */
  currencySource          : '',
  /* default target currency when the formatter convCurr is used without target. It depends on the locale if empty */
  currencyTarget          : '',
  /* currency rates, always based on EUR. So EUR should always equals "1" */
  currencyRates           : {
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
