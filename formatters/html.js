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
function addHtmlDatabaseOdt (options, contentID, htmlContent, templateDefaultStyleId = '', filename = '') {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentID)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const id = html.generateStyleID(options.htmlDatabase.size);
    const { content, style, styleLists } = html.buildXMLContentOdt(id, descriptor, options, templateDefaultStyleId);

    _htmlDatabaseProperties = {
      content,
      style,
      styleLists,
      filename
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
const getHTMLContentOdt = function (htmlContent, templateDefaultStyleId, filename) {
  htmlContent = htmlContent || '';
  templateDefaultStyleId = templateDefaultStyleId || '';
  filename = filename || '';
  
  const _contentID = htmlContent + templateDefaultStyleId + filename?.replace('.xml', '');

  addHtmlDatabaseOdt(this, _contentID, htmlContent, templateDefaultStyleId, filename);
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
  return _htmlProperties?.content?.get(this) ?? '';
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
function addHtmlDatabaseDOCX (options, contentId, htmlContent = '', templateDefaultStyleId = '', filename = '') {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentId)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(descriptor, options, templateDefaultStyleId, filename);
    _htmlDatabaseProperties = {
      id : options.htmlDatabase.size,
      content,
      listStyleAbstract,
      listStyleNum,
      filename
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
const getHTMLContentDocx = function (htmlContent, styleId, filename) {
  htmlContent = htmlContent || '';
  styleId = styleId || '';
  filename = filename || '';
  const _contentId = htmlContent + styleId + filename?.replace('.xml', '');
  addHtmlDatabaseDOCX(this, _contentId, htmlContent, styleId, filename);
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
  return _htmlProperties?.content?.get(this) ?? '';
};

module.exports = {
  getHTMLContentOdt,
  getHTMLContentDocx,
  html : () => ''
};