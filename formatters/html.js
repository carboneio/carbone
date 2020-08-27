const html = require('../lib/html');

/**
 * Add the color to the htmlDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {Array} color
 */
function addHtmlDatabase (options, htmlContent, styleName) {
  var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(htmlContent)) {
    const { styleList, content } = html.parseStyleAndGetStyleList(htmlContent);
    _htmlDatabaseProperties = {
      id : options.htmlDatabase.size,
      styleName,
      content,
      styleList
    };
    options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}


const getHtmlContent = function (htmlContent, styleName) {
  addHtmlDatabase(this, htmlContent, styleName);
  return {
    fn   : getHtmlContentPostProcess,
    args : [htmlContent]
  };
};

const getHtmlContentPostProcess = function (htmlContentId) {
  const _htmlProperties = this.htmlDatabase.get(htmlContentId);
  return _htmlProperties.content;
};

const getHtmlStyleName = function (htmlContent, styleName) {
  addHtmlDatabase(this, htmlContent, styleName);
  return {
    fn   : getHtmlStyleNamePostProcess,
    args : [htmlContent]
  };
};

const getHtmlStyleNamePostProcess = function (htmlContentId) {
  const _htmlProperties = this.htmlDatabase.get(htmlContentId);
  return html.generateStyleName(_htmlProperties.id);
};

module.exports = {
  getHtmlContent,
  getHtmlContentPostProcess,
  getHtmlStyleName,
  getHtmlStyleNamePostProcess
};