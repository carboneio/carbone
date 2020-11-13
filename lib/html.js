const file = require('./file.js');
const parser = require('./parser.js');

const html = {
  /**
   * @description find all the html markers and insert a new span around the marker with HTML formatters
   * @private
   * @param {Object} template list of xml files
   */
  preprocessODT : function (template) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }
    _file.data = _file.data.replace(/{([^{}]*?):html[^{}]*?}/g, function (xml, marker) {
      if (parser.isCarboneMarker(marker) === true) {
        return `<text:span text:style-name="{${marker}:getHtmlStyleName()}">{${marker}:getHtmlContent()}</text:span>`;
      }
      return xml;
    });
  },
  /**
   * @description insert new styles from the options.htmlDatabase
   * @private
   * @param {Object} template list of xml files
   * @param {Object} data dataset
   * @param {Object} options options with the htmlDatabase
   */
  postProcessODT : function (template, data, options) {
    if (
      options.htmlDatabase === undefined ||
      options.htmlDatabase.size === 0
    ) {
      return template;
    }
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }
    let _newXmlRelations = '';
    let _htmlIt = options.htmlDatabase.entries();
    let _item = _htmlIt.next();
    while (_item.done === false) {
      const _newStyleName = html.generateStyleName(_item.value[1].id);
      _newXmlRelations += `<style:style style:name="${_newStyleName}" style:family="text"><style:text-properties ${_item.value[1].styleList}/></style:style>`;
      _item = _htmlIt.next();
    }
    _file.data = _file.data.replace('</office:automatic-styles>', _newXmlRelations + '</office:automatic-styles>');
  },
  /**
   * @description Return a new style name from an ID
   * @private
   * @param {String} id
   * @returns {String} Style Name
   */
  generateStyleName : function (id) {
    // TC === Text Carbone
    return 'TC' + id;
  },
  /**
   * @description Parse the html content to retrieve the styles, and remove the tag from the string.
   * @param {Strong} htmlContent html content coming form the JSON dataset
   * @returns {Object<String,String>} styleList: new styles to insert inside an ODT report, content: the content without HTML tags
   */
  parseStyleAndGetStyleList : function (htmlContent) {
    let styleList = '';
    htmlContent = htmlContent.replace(/<[/]?(.*?)[/]?>/g, function (xml, tagName) {
      if (tagName && Object.prototype.hasOwnProperty.call(html.htmlXmlStyles, tagName) === true && styleList.indexOf(html.htmlXmlStyles[tagName]) === -1) {
        if (tagName === 'br') {
          // Exception: a line break is a not style but a XML tag.
          return html.htmlXmlStyles[tagName];
        }
        styleList += html.htmlXmlStyles[tagName] + ' ';
      }
      return '';
    });
    return { styleList, content : htmlContent };
  },
  /**
   * @description List of HTML tags with the corresponding XML style properties
   */
  htmlXmlStyles : {
    i      : 'fo:font-style="italic"',
    em     : 'fo:font-style="italic"',
    b      : 'fo:font-weight="bold"',
    strong : 'fo:font-weight="bold"',
    u      : 'style:text-underline-style="solid"',
    s      : 'style:text-line-through-style="solid"',
    del    : 'style:text-line-through-style="solid"',
    br     : '<text:line-break/>'
  }
};

module.exports = html;