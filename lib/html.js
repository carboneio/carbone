const file = require('./file.js');
const parser = require('./parser.js');

// Big master plan
// 1 - [x] preprocessODT: ajouter l'id de style + propritété du style dans le formatter comme arguments, example :html(P1, 'style:family="paragraph" style:parent-style-name="Standard"')
// 2 - [x] formatter: ajouter à une styleDatabase (new Map) le contenu + style name + style properties + style to apply. Ajouter ensuite un formatter de post processing pour appliquer un nouvel ID de style.
// 3 - [x] postprocessODT: parcourir styleDatabase et ajouter les nouvelles références dans le style
// 4 - [x] améliorer le parsing des markers (génère une balise avec un nouveau style)
// 5 - [x] récupérer la famille de style!!
// 6 - [ ] Ajouter des tests unitaires

const html = {
  preprocessODT : function (template) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }
    _file.data = parser.removeXMLInsideMarkers(_file.data);
    _file.data = _file.data.replace(/{([^{}]*?):html[^{}]*?}/g, function (xml, marker) {
      if (parser.isCarboneMarker(marker) === true) {
        return `<text:span text:style-name="{${marker}:getHtmlStyleName(text)}">{${marker}:getHtmlContent(text)}</text:span>`;;
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
    const _file = file.getTemplateFile(template,'content.xml');
    if (!_file) {
      return;
    }
    let _newXmlRelations = '';
    let _htmlIt = options.htmlDatabase.entries();
    let _item = _htmlIt.next();
    while (_item.done === false) {
      const _newStyleName = html.generateStyleName(_item.value[1].id);
      const _newStyleFamily = _item.value[1].styleFamily;
      _newXmlRelations += `<style:style style:name="${_newStyleName}" style:family="${_newStyleFamily}"><style:text-properties ${_item.value[1].styleList}/></style:style>`
      _item = _htmlIt.next();
    }
    _file.data = _file.data.replace('</office:automatic-styles>', _newXmlRelations + '</office:automatic-styles>');
    console.log('\n\nPost process:\n', _file.data);
  },
  getStyleFamilyFromStyleName : function (styleName) {
    if (styleName && styleName[0] === 'P') {
      return  'paragraph';
    }
    else {
      return 'text';
    }
  },
  generateStyleName : function (id) {
    // TC === Text Carbone
    return 'TC' + id;
  },
  parseStyleAndGetStyleList : function (htmlContent) {
    let styleList = '';
    htmlContent = htmlContent.replace(/<[/]?(.*?)>/g, function (xml, tagName) {
      if (tagName && Object.prototype.hasOwnProperty.call(html.htmlXmlStyles, tagName) === true && styleList.indexOf(html.htmlXmlStyles[tagName]) === -1) {
        styleList += html.htmlTagsList[tagName] + ' ';
      }
      return '';
    });
    return { styleList, content : htmlContent };
  },
  htmlXmlStyles : {
    em     : 'fo:font-style="italic"',
    b      : 'fo:font-weight="bold"',
    strong : 'fo:font-weight="bold"',
    u      : 'style:text-underline-style="solid"',
    s      : 'style:text-line-through-style="solid"',
    del    : 'style:text-line-through-style="solid"'
  }
};

module.exports = html;