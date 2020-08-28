const html = require('../lib/html');

/**
 * Add the color to the htmlDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {Array} color
 */
function addHtmlDatabase (options, contentId, htmlContent, styleFamily) {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(contentId)) {
    const { styleList, content } = html.parseStyleAndGetStyleList(htmlContent);
    _htmlDatabaseProperties = {
      id : options.htmlDatabase.size,
      styleFamily,
      content,
      styleList
    };
    options.htmlDatabase.set(contentId, _htmlDatabaseProperties);
  }
}


const getHtmlContent = function (htmlContent, styleFamily) {
  const _contentId = htmlContent + styleFamily;
  addHtmlDatabase(this, _contentId, htmlContent, styleFamily);
  return {
    fn   : getHtmlContentPostProcess,
    args : [_contentId]
  };
};

const getHtmlContentPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties.content;
};

const getHtmlStyleName = function (htmlContent, styleFamily) {
  const _contentId = htmlContent + styleFamily;
  addHtmlDatabase(this, _contentId, htmlContent, styleFamily);
  return {
    fn   : getHtmlStyleNamePostProcess,
    args : [_contentId]
  };
};

const getHtmlStyleNamePostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return html.generateStyleName(_htmlProperties.id);
};

module.exports = {
  getHtmlContent,
  getHtmlContentPostProcess,
  getHtmlStyleName,
  getHtmlStyleNamePostProcess
};