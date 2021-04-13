const html = require('../lib/html');

/** ======================= ODT ======================== */

/**
 * Add the content to the htmlDatabase Map.
 *
 * @private
 *
 * @param  {Object} options contains htmlDatabase
 * @param  {String} htmlContent string with html tags
 */
function addHtmlDatabase (options, htmlContent) {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(htmlContent)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const id = html.generateStyleID(options.htmlDatabase.size);
    const { content, style, styleLists } = html.buildXMLContentOdt(id, descriptor, options);

    _htmlDatabaseProperties = {
      content,
      style,
      styleLists
    };
    options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}

/**
 * @private
 *
 * @description Add the htmlContent to the database and return a post process formatter
 * @param {String} htmlContent
 * @returns {Function} Return a post process formatter
 */
const getHTMLContentOdt = function (htmlContent) {
  htmlContent = htmlContent || '';
  addHtmlDatabase(this, htmlContent);
  return {
    fn   : getHTMLContentOdtPostProcess,
    args : [htmlContent]
  };
};

/**
 * @private
 *
 * @description return the HTML as an ODT XML content
 * @param {*} contentId
 */
const getHTMLContentOdtPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties !== undefined && _htmlProperties.content ? _htmlProperties.content : '';
};

/** ======================= DOCX ======================== */

/**
 * Add the content to the htmlDatabase Map.
 *
 * @private
 *
 * @param  {Object} options contains htmlDatabase
 * @param  {String} htmlContent string with html tags
 */
function addHtmlDatabaseDOCX (options, contentId, htmlContent = '', defaultFont = '', defaultFontSize = '') {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentId)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const { content, listStyleAbstract, listStyleNum } = html.buildContentDOCX(descriptor, options, defaultFont, defaultFontSize);
    _htmlDatabaseProperties = {
      id      : options.htmlDatabase.size,
      content,
      listStyleAbstract,
      listStyleNum
    };
    options.htmlDatabase.set(contentId, _htmlDatabaseProperties);
  }
}

/**
 * @private
 *
 * @description Add the new HTML content and return a post process formatter
 * @param {String} htmlContent New HTML content to inject
 */
const getHTMLContentDocx = function (htmlContent, defaultFont = '', defaultFontSize = '') {
  htmlContent = htmlContent || '';
  const _contentId = htmlContent + defaultFont + defaultFontSize;
  addHtmlDatabaseDOCX(this, _contentId, htmlContent, defaultFont, defaultFontSize);
  return {
    fn   : getHTMLContentDocxPostProcess,
    args : [_contentId]
  };
};

/**
 * @private
 *
 * @description Post process formatter that returns the new DOCX content based on the contentID
 * @param {String} contentId html content
 */
const getHTMLContentDocxPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties !== undefined && _htmlProperties.content ? _htmlProperties.content : '';
};

module.exports = {
  getHTMLContentOdt,
  getHTMLContentDocx,
  html : () => ''
};