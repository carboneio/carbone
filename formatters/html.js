const html = require('../lib/html');

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
    const { styleList, content } = html.parseStyleAndGetStyleList(htmlContent);
    _htmlDatabaseProperties = {
      id : options.htmlDatabase.size,
      content,
      styleList
    };
    options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}


const getHtmlContent = function (htmlContent) {
  addHtmlDatabase(this, htmlContent);
  return {
    fn   : getHtmlContentPostProcess,
    args : [htmlContent]
  };
};

const getHtmlContentPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties.content;
};

const getHtmlStyleName = function (htmlContent) {
  addHtmlDatabase(this, htmlContent);
  return {
    fn   : getHtmlStyleNamePostProcess,
    args : [htmlContent]
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