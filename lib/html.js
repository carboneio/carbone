const { mi } = require('../formatters/_locale.js');
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
  preProcessDocx : function (template) {

    const _endTagStyleProperty = '</w:rPr>';
    const _endTagText = '</w:r>';

    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // 1 - Only edit the document, headers or footers
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
        (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        let marker;
        let patternHTML = /{([^{}]*?):html[^{}]*?}/g;
        // 2 - Find HTML markers and get the position
        // eslint-disable-next-line no-cond-assign
        while ((marker = patternHTML.exec(_file.data)) !== null) {
          console.log(marker[1]);
          let stylePropsPos = -1;
          let subContentPos = -1;
          let k = marker.index;
          // 3 - Find the position of text properties to insert the content style
          while (k > 0 && k >= marker.index - 100 && stylePropsPos === -1) {
            if (_file.data[k] === '<' && html.compareStringFromPosition(_endTagStyleProperty, _file.data, k) === true) {
              stylePropsPos = k;
            }
            k--;
          }
          k = marker.index + marker[0].length;
          // 4 - Fin the position of the next text block (end of </w:r>) to insert subcontent
          while (k < _file.data.length && k < marker.index + marker[0].length + 100 && subContentPos === -1) {
            if (_file.data[k] === '<' && html.compareStringFromPosition(_endTagText, _file.data, k) === true) {
              subContentPos = k;
            }
            k++;
          }
          // 5 - Replace the markers
          if (stylePropsPos !== -1 && subContentPos !== -1) {
            _file.data = html.insertAt(_file.data, subContentPos + _endTagText.length, `{${marker[1]}:getHTMLSubContentDocx}`);
            _file.data = _file.data.replace(marker[0], `{${marker[1]}:getHTMLContentDocx}`);
            _file.data = html.insertAt(_file.data, stylePropsPos, `{${marker[1]}:getHTMLContentStyleDocx}`);
          }
          else {
            _file.data = _file.data.replace(marker[0], `{${marker[1]}}`);
          }
        }
        console.log(_file.data);
      }
    }
  },
  insertAt : function (text, index, string) {
    return text.substr(0, index) + string + text.substr(index);
  },
  compareStringFromPosition : function (reference, text, pos) {
    let tmp = '';
    for (let i = 0, j = reference.length; i < j; i++) {
      if (reference[i] !== text[pos + i]) {
        return false;
      }
      tmp +=  text[pos + i];
    }
    console.log(tmp);
    return true;
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
  },
  htmlXmlStylesDOCX : {
    i      : '<w:i/><w:iCs/>',
    em     : '<w:i/><w:iCs/>',
    b      : '<w:b/><w:bCs/>',
    strong : '<w:b/><w:bCs/>',
    u      : '<w:u w:val="single"/>',
    s      : '<w:strike/>',
    del    : '<w:strike/>'
    // br     : '<w:br/>'
  }
};

module.exports = html;