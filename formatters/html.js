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
function addHtmlDatabaseOdt (options, contentID, htmlContent, templateDefaultStyleId = '') {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentID)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const id = html.generateStyleID(options.htmlDatabase.size);
    const { content, style, styleLists } = html.buildXMLContentOdt(id, descriptor, options, templateDefaultStyleId);

    _htmlDatabaseProperties = {
      content,
      style,
      styleLists
    };
    options.htmlDatabase.set(contentID, _htmlDatabaseProperties);
  }
}

/**
 * @private
 *
 * @description Add the htmlContent to the database and return a post process formatter
 * @param {String} htmlContent
 * @returns {Function} Return a post process formatter
 */
const getHTMLContentOdt = function (htmlContent, templateDefaultStyleId) {
  htmlContent = htmlContent || '';
  templateDefaultStyleId = templateDefaultStyleId || '';
  const _contentID = htmlContent + templateDefaultStyleId;
  addHtmlDatabaseOdt(this, _contentID, htmlContent, templateDefaultStyleId);
  return {
    fn   : getHTMLContentOdtPostProcess,
    args : [_contentID]
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
function addHtmlDatabaseDOCX (options, contentId, htmlContent = '', templateDefaultStyleId = '') {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentId)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(descriptor, options, templateDefaultStyleId);
    _htmlDatabaseProperties = {
      id : options.htmlDatabase.size,
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
const getHTMLContentDocx = function (htmlContent, styleId) {
  htmlContent = htmlContent || '';
  styleId = styleId || '';
  const _contentId = htmlContent + styleId;
  addHtmlDatabaseDOCX(this, _contentId, htmlContent, styleId);
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