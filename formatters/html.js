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
    const { content, style } = html.buildXMLContentOdt(id, descriptor);

    _htmlDatabaseProperties = {
      content,
      style
    };
    options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}


const getHTMLContentOdt = function (htmlContent) {
  addHtmlDatabase(this, htmlContent);
  return {
    fn   : getHTMLContentOdtPostProcess,
    args : [htmlContent]
  };
};

const getHTMLContentOdtPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties.content;
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
function addHtmlDatabaseDOCX (options, htmlContent) {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(htmlContent)) {
    const descriptor = html.parseHTML(html.convertHTMLEntities(htmlContent));
    _htmlDatabaseProperties = {
      id      : options.htmlDatabase.size,
      content : html.buildContentDOCX(descriptor)
    };
    options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}

const getHTMLContentDocx = function (htmlContent) {
  addHtmlDatabaseDOCX(this, htmlContent);
  return {
    fn   : getHTMLContentDocxPostProcess,
    args : [htmlContent]
  };
};

const getHTMLContentDocxPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties.content;
};

module.exports = {
  getHTMLContentOdt,
  getHTMLContentDocx,
  html : () => ''
};