const file = require('./file.js');
const parser = require('./parser.js');
const helper = require('./helper.js');
const hyperlinks = require('./hyperlinks.js');

const html = {
  /** ============================= ODT ONLY ============================= */
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
        return `{${marker}:getHTMLContentOdt}`;
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
      _newXmlRelations += _item.value[1].style;
      _item = _htmlIt.next();
    }
    _file.data = _file.data.replace('</office:automatic-styles>', _newXmlRelations + '</office:automatic-styles>');
  },
  /**
   * @description Create the xml content for ODT reports. It translate an HTML descriptor to ODT xml.
   * @param {String} styleID marker ID corresponding to the HTML map max size
   * @param {Array} descriptor the descriptor returned by "parseHTML"
   * @returns {String, String} new XML to inject inside ODT reports at 2 places: the content and the style.
   */
  buildXMLContentOdt : function (styleID, descriptor) {
    let _content = '';
    let _style = '';
    for (let i = 0, j = descriptor.length; i < j; i++) {
      if (descriptor[i].content === html.BREAK_LINE) {
        _content += html.xmlStyles.odt.br;
      }
      else {
        const _uniqueStyleID = styleID + i;
        _content += `<text:span text:style-name="${_uniqueStyleID}">${descriptor[i].content}</text:span>`;
        if (descriptor[i].tags && descriptor[i].tags.length > 0) {
          _style += `<style:style style:name="${_uniqueStyleID}" style:family="text"><style:text-properties ${html.buildXMLStyle('odt', descriptor[i].tags)}/></style:style>`;
        }
      }
    }
    return { content : _content, style : _style};
  },
  /** ============================= DOCX ONLY ============================= */
  /**
   * @description find ":html" formatters and inject a special formatter used during post processing: :getHTMLContentDocx
   * @description also it inject a special attribute to keep space characters on the content: xml:space="preserve
   * @param {Object} template list of xml files
   */
  preProcessDocx : function (template) {

    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      /** 1 - Only edit the document, headers or footers */
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
        (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        let marker;
        let patternHTML = /{([^{}]*?):html[^{}]*?}/g;
        /** 2 - Find HTML markers and get the position */
        // eslint-disable-next-line no-cond-assign
        while ((marker = patternHTML.exec(_file.data)) !== null) {
          let k = marker.index + marker[0].length;
          /** 3 - Find the position of the next text block (end of </w:p>) to insert subcontent */
          let subContentPos = _file.data.indexOf('</w:p>', k) + '</w:p>'.length
          /** 4 - Insert HTML markers if positions are found */
          if (subContentPos !== -1) {
            _file.data = helper.insertAt(_file.data, subContentPos, `{${marker[1]}:getHTMLContentDocx}`);
            _file.data = _file.data.replace(marker[0], '');
          }
        }
      }
    }
  },
  /**
   * @description Create the sub Content XML for DOCX reports. It translate an HTML descriptor to DOCX xml.
   * @param {Array} descriptor the descriptor returned by "parseHTML"
   * @returns {String} new XML to inject inside DOCX reports.
   */
  buildContentDOCX : function (descriptor) {
    let _listId = 1; // 1: ID of the first list created on the report
    let _isList = false;
    let _isXmlP = false;
    let _isXmlA = false;
    let _isHtmlP = false;
    let _content = '';
    if (!descriptor) {
      return _content;
    }
    // console.log(descriptor);
    for (let i = 0, j = descriptor.length; i < j; i++) {

      if (descriptor[i].content === html.BREAK_LINE) {
        if (_isXmlP === true) {
          _content += html.xmlStyles.docx.br;
        } else {
          _content += '<w:p/>'; // empty paragraph is more stable than a break line
        }
      }
      // else if () {
      //   const _newHpId = ''
      //   _content += `<w:p>
      //     <w:hyperlink r:id="${_newHpId}">
      //       <w:r>
      //         <w:rPr>
      //           <w:rStyle w:val="InternetLink"/>
      //         </w:rPr>
      //         <w:t>Firstname</w:t>
      //       </w:r>
      //     </w:hyperlink>
      //   </w:p>`;

      // }
      else if (descriptor[i].tags.includes('li') && (descriptor[i].tags.includes('ul') || descriptor[i].tags.includes('ol'))) {
        _isList = true;
        /** Compute the style list */
        let _listStyle = html.buildXMLStyle('docx', descriptor[i].tags);
        _listStyle = _listStyle ? '<w:rPr>'+_listStyle+'</w:rPr>' : '';
        /** Compute the list level for the tag <w:ilvl> */
        let _listLevel = -1;
        for (let k = descriptor[i].tags.length; k > 0; k--) {
          if (descriptor[i].tags[k] === 'li') {
            _listLevel++;
          }
        }
        _content += `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="${_listLevel}"/><w:numId w:val="${_listId}"/></w:numPr>${_listStyle}</w:pPr><w:r>${_listStyle}<w:t>${descriptor[i].content}</w:t></w:r></w:p>`;
      }
      else {
        if (_isXmlP === false) {
          _isXmlP = true;
          if (descriptor[i].tags.includes('p') === true) {
            // _content += `<w:p/>`
            _isHtmlP = true;
          }
          _content += `<w:p>`
        }

        // if (_isXmlA === false && descriptor[i].tags.includes('a') === true) {
        //   _content +=  `<w:hyperlink r:id="0">`
        // }

        _content += `<w:r><w:rPr>${html.buildXMLStyle('docx', descriptor[i].tags)}</w:rPr><w:t xml:space="preserve">${descriptor[i].content}</w:t></w:r>`;

        if (_isXmlP === true && (i + 1 === descriptor.length || // end of descriptor
                               (_isHtmlP === false && descriptor[i + 1].tags.includes('p') === true)) || // if the element is not an HTML paragraph and the next tag is a paragraph
                               (_isHtmlP === true && descriptor[i + 1].tags.includes('p') === false)) { // if it is already in an HTML paragraph and the next tag is not a paragraph
          _content += `</w:p>`
          if (_isHtmlP === true) {
            _content += `<w:p/>`
          }
          _isXmlP = false;
          _isHtmlP = false;

        }


        if (_isList === true) {
          // _listId++;
          _isList = false;
        }
      }
    }
    return _content;
  },
  /** ============================= UTILS / SHARED FUNCTIONS ============================= */
  /**
   * @description Return a new style name from an ID
   * @private
   * @param {String} id
   * @returns {String} Style Name
   */
  generateStyleID : function (id) {
    /** TC === Text Carbone */
    return 'TC' + id;
  },

  /**
   * Parse a HTML content and create a descriptor
   *
   * @param   {string} htmlContent HTML content
   * @returns {Array}  an HTML descriptor: [{ "content" : "content without html", "style": "list of style used"}, ...]
   * @example htmlContent: '<b><i>blue</i>sky</b>' => descriptor result: [{ 'content' : 'blue', tags: ['b', 'i'] }, { 'content' : 'sky', tags: ['b'] }]
   */
  parseHTML : function (html) {
    var _res = [];
    if (typeof (html) !== 'string') {
      return [];
    }
    var _xmlTagRegExp = /<([^>]+?)>/g;
    var _tag = _xmlTagRegExp.exec(html);
    var _activeTags = [];
    var _prevLastIndex = 0;
    while (_tag !== null) {
      var _tagStr = _tag[1];
      // push non XML part
      if ( _prevLastIndex < _tag.index) {
        _res.push({
          content : html.slice(_prevLastIndex, _tag.index),
          tags    : _activeTags.slice()
        });
      }
      // remove attributes from HTML tags <div class="s"> become div
      var _tagAttributeIndex = _tagStr.indexOf(' ');
      var _tagOnly = _tagStr.slice(0, _tagAttributeIndex > 0 ? _tagAttributeIndex : _tagStr.length);
      // console.log(_tagStr, html.slice(_prevLastIndex, _tag.index));
      // special case for breaking line
      if (_tagOnly === 'br' || _tagOnly === 'br/') {
        _res.push({
          content : '#break#',
          tags    : []
        });
      }
      // closing tag
      else if (_tagStr[0] === '/') {
        _activeTags.pop();
      }
      // is not a self-closing tag, so it is an opening tag
      else if (_tagStr[_tagStr.length - 1] !== '/') {
        _activeTags.push(_tagOnly);
      }

      // Set isStart at false for next round
      // _activeTags.forEach(x => { x.isStart = false })

      _prevLastIndex = _xmlTagRegExp.lastIndex;
      _tag = _xmlTagRegExp.exec(html);
    }
    if (_prevLastIndex < html.length) {
      _res.push({
        content : html.slice(_prevLastIndex),
        tags    : []
      });
    }
    return _res;
  },

  /**
   * @description Create XML style of DOCX/ODT from a list of tags.
   * @param {string} fileType can be either "ods" or "docx"
   * @param {string} tags list of tags used to create a style XML list for DOCX or ODT reports
   * @returns {string} the XML style list as a string
   */
  buildXMLStyle : function (fileType, tags) {
    let _styles = '';
    if (!Object.prototype.hasOwnProperty.call(html.xmlStyles, fileType)) {
      throw new Error ('HTML error: the file type is not supported.');
    }
    for (let i = 0, j = tags.length; i < j; i++) {
      if (Object.prototype.hasOwnProperty.call(html.xmlStyles[fileType], tags[i])) {
        _styles += html.xmlStyles[fileType][tags[i]];
        if (fileType === 'odt' && i + 1 < tags.length) {
          _styles += ' ';
        }
      }
    }
    return _styles;
  },
  /**
   * @description Convert not supported HTML entity into supported XML characters
   * @param {String} html HTML content with entities
   * @returns {String} Valid HTML content
   */
  convertHTMLEntities : function (htmlContent) {
    htmlContent = htmlContent || '';
    return htmlContent.replace(/&[\w\d#]*;/g, function (entity) {
      if (Object.prototype.hasOwnProperty.call(html.htmlEntities, entity)) {
        return html.htmlEntities[entity];
      }
      return entity;
    });
  },
  /**
   * @description List of HTML tags with the corresponding XML style properties
   */
  xmlStyles : {
    docx : {
      i      : '<w:i/><w:iCs/>',
      em     : '<w:i/><w:iCs/>',
      b      : '<w:b/><w:bCs/>',
      strong : '<w:b/><w:bCs/>',
      u      : '<w:u w:val="single"/>',
      s      : '<w:strike/>',
      del    : '<w:strike/>',
      br     : '<w:br/>'
    },
    odt : {
      i      : 'fo:font-style="italic"',
      em     : 'fo:font-style="italic"',
      b      : 'fo:font-weight="bold"',
      strong : 'fo:font-weight="bold"',
      u      : 'style:text-underline-style="solid"',
      s      : 'style:text-line-through-style="solid"',
      del    : 'style:text-line-through-style="solid"',
      br     : '<text:line-break/>'
    }
  },
  htmlEntities : {
    '&nbsp;'  : '&#160;',
    '&cent;'  : '¢',
    '&pound;' : '£',
    '&yen;'   : '¥',
    '&euro;'  : '€',
    '&copy;'  : '©',
    '&reg;'   : '®'

  },
  BREAK_LINE : '#break#'
};

module.exports = html;
