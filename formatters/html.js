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
  // var _htmlDatabaseProperties = null;

  if (!options.htmlDatabase.has(htmlContent)) {
    // const { styleList, content } = html.parseStyleAndGetStyleList(htmlContent);
    // console.log(content, styleList);
    // _htmlDatabaseProperties = {
    //   id : options.htmlDatabase.size,
    //   content,
    //   styleList
    // };
    // options.htmlDatabase.set(htmlContent, _htmlDatabaseProperties);
  }
}

const getHTMLSubContentDocx = function (htmlContent) {
  addHtmlDatabaseDOCX(this, htmlContent);

  return {
    fn   : getHTMLSubContentDocxPostProcess,
    args : []
  };
};

const getHTMLSubContentDocxPostProcess = function () {
  /**
   * `<w:br/>
  <w:r>
  <w:rPr>
    <w:lang w:val="en-US"/>
  </w:rPr>
  <w:t xml:space="preserve"> Pouette pouette </w:t>
  </w:r>`
   */
  return '';
};

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

const getHTMLContentStyleDocx = function (htmlContent) {
  addHtmlDatabaseDOCX(this, htmlContent);
  return {
    fn   : getHTMLContentStyleDocxPostProcess,
    args : [htmlContent]
  };
};

const getHTMLContentStyleDocxPostProcess = function (contentId) {
  const _htmlProperties = this.htmlDatabase.get(contentId);
  return _htmlProperties.styleList;
};

module.exports = {
  getHtmlContent,
  getHtmlContentPostProcess,
  getHtmlStyleName,
  getHtmlStyleNamePostProcess,
  html : function () {
    return '';
  },
  getHTMLSubContentDocx,
  getHTMLContentDocx,
  getHTMLContentStyleDocx
};