const file = require('./file.js');
const parser = require('./parser.js');

const html = {
  preprocessODT : function (template) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }
    _file.data = parser.removeXMLInsideMarkers(_file.data);
    _file.data = _file.data.replace(/{([^{}]*?):html[^{}]*?}/g, function (xml, marker) {
      if (parser.isCarboneMarker(marker) === true) {
        return `<text:span text:style-name="{${marker}:getHtmlStyleName()}">{${marker}:getHtmlContent()}</text:span>`;
      }
      return xml;
    });
  },
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
  generateStyleName : function (id) {
    // TC === Text Carbone
    return 'TC' + id;
  },
  parseStyleAndGetStyleList : function (htmlContent) {
    let styleList = '';
    htmlContent = htmlContent.replace(/<[/]?(.*?)>/g, function (xml, tagName) {
      if (tagName && Object.prototype.hasOwnProperty.call(html.htmlXmlStyles, tagName) === true && styleList.indexOf(html.htmlXmlStyles[tagName]) === -1) {
        styleList += html.htmlXmlStyles[tagName] + ' ';
      }
      return '';
    });
    return { styleList, content : htmlContent };
  },
  htmlXmlStyles : {
    i      : 'fo:font-style="italic"',
    em     : 'fo:font-style="italic"',
    b      : 'fo:font-weight="bold"',
    strong : 'fo:font-weight="bold"',
    u      : 'style:text-underline-style="solid"',
    s      : 'style:text-line-through-style="solid"',
    del    : 'style:text-line-through-style="solid"'
  }
};

module.exports = html;