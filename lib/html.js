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
          // Get the style name and insert a maker to generate the new style name
          xmlBeg = xmlBeg.replace(/style-name="([^"]*?)"/, function (xmlStyle, styleName) {
            if (styleName) {
              _styleName = styleName;
              return `style-name="{${_cleanedMarker}:getHtmlStyleName(${styleName})}"`;
            }
            return xmlStyle;
          });
          // return the new XML
          return `${xmlBeg}{${_cleanedMarker}:getHtmlContent(${_styleName})}`;
        }
      }
      return xml;
    });
    console.log(_file.data);
  },
  generateStyleName : function (id) {
    return 'CS' + id;
  },
  parseStyleAndGetStyleList : function (htmlContent) {
    const styleList = [];
    htmlContent = htmlContent.replace(/<[/]?(.*?)>/g, function (xml, tagName) {
      if (tagName && Object.prototype.hasOwnProperty.call(html.htmlTagsList, tagName) === true && styleList.indexOf(html.htmlTagsList[tagName]) === -1) {
        styleList.push(html.htmlTagsList[tagName]);
      }
      return '';
    });
    return { styleList, content : htmlContent };
  },
  htmlTagsList : {
    em     : 'italic',
    b      : 'bold',
    strong : 'bold',
    u      : 'underlined',
    s      : 'striked',
    del    : 'striked'
  }
};

module.exports = html;