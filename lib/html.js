const file = require('./file.js');
const parser = require('./parser.js');

// Big master plan
// 1 - [x] preprocessODT: ajouter l'id de style + propritété du style dans le formatter comme arguments, example :html(P1, 'style:family="paragraph" style:parent-style-name="Standard"')
// 2 - [x] formatter: ajouter à une styleDatabase (new Map) le contenu + style name + style properties + style to apply. Ajouter ensuite un formatter de post processing pour appliquer un nouvel ID de style.
// 3 - [ ] postprocessODT: parcourir styleDatabase et ajouter les nouvelles références dans le style

const html = {
  preprocessODT : function (template) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      console.error("content.xml doesn't exist!");
      return;
    }
    _file.data = _file.data.replace(/(<text:p[^/]*?)({[^]*?})/g, function (xml, xmlBeg, marker) {
      let _isHTMLMarker = false;
      marker = parser.removeWhitespace(parser.extractMarker(marker));
      if (parser.isCarboneMarker(marker) === true) {
        const _cleanedMarker = marker.replace(/{(.*?):(html)\(\)}/, function (xmlMarker, singleMarker, htmlFormatter) {
          if (htmlFormatter === 'html') {
            _isHTMLMarker = true;
            return singleMarker;
          }
          return xmlMarker;
        });
        if (_isHTMLMarker === true) {
          let _styleName = null;
          // Get the style name and insert a marker + formatter to generate the new style name
          xmlBeg = xmlBeg.replace(/style-name="([^"]*?)"/, function (xmlStyle, styleName) {
            if (styleName) {
              _styleName = styleName;
              return `style-name="{${_cleanedMarker}:getHtmlStyleName(${styleName})}"`;
            }
            return xmlStyle;
          });
          // return the new XML with a marker + formatter to only get the HTML content
          return `${xmlBeg}{${_cleanedMarker}:getHtmlContent(${_styleName})}`;
        }
      }
      return xml;
    });
    // console.log(_file.data);
  },
  postProcessODT : function (template, data, options) {
    if (
      options.htmlDatabase === undefined ||
      options.htmlDatabase.size === 0
    ) {
      return template;
    }
    const _file = file.getTemplateFile(template,'content.xml');
    if (!_file) {
      console.error("content.xml doesn't exist!");
      return;
    }
    let _newXmlRelations = '';
    let _htmlIt = options.htmlDatabase.entries();
    let _item = _htmlIt.next();
    while (_item.done === false) {
      const _newStyleName = html.generateStyleName(_item.value[1].id);
      _newXmlRelations += `<style:style style:name="${_newStyleName}" style:family="paragraph"><style:text-properties ${_item.value[1].styleList}/></style:style>`
      _item = _htmlIt.next();
    }
    _file.data = _file.data.replace('</office:automatic-styles>', _newXmlRelations + '</office:automatic-styles>');
    // console.log("\n\nPost process:\n", _file.data);
  },
  generateStyleName : function (id) {
    return 'CS' + id;
  },
  parseStyleAndGetStyleList : function (htmlContent) {
    let styleList = '';
    htmlContent = htmlContent.replace(/<[/]?(.*?)>/g, function (xml, tagName) {
      if (tagName && Object.prototype.hasOwnProperty.call(html.htmlTagsList, tagName) === true && styleList.indexOf(html.htmlTagsList[tagName]) === -1) {
        styleList += html.htmlTagsList[tagName] + ' ';
      }
      return '';
    });
    return { styleList, content : htmlContent };
  },
  htmlTagsList : {
    em     : 'fo:font-style="italic"',
    b      : 'fo:font-weight="bold"',
    strong : 'fo:font-weight="bold"',
    u      : 'style:text-underline-style="solid"',
    s      : 'style:text-line-through-style="solid"',
    del    : 'style:text-line-through-style="solid"'
  }
};

module.exports = html;