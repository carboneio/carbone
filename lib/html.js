const file = require('./file.js');
const parser = require('./parser.js');
const helper = require('./helper.js');

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
   * @description find ":html" formatters and inject special formatters used during post processing: :getHTMLSubContentDocx, :getHTMLContentDocx, :getHTMLContentStyleDocx
   * @description also it inject a special attribute to keep space characters on the content: xml:space="preserve
   * @param {Object} template list of xml files
   */
  preProcessDocx : function (template) {
    const _endTagStyleProperty = '</w:rPr>';
    const _endTagText = '</w:r>';
    const _startContent = '<w:t>';

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
          let stylePropsPos = -1;
          let subContentPos = -1;
          let spacePreservePos = -1;
          let k = marker.index;
          /** 3 - Find the position of text properties to insert the content style */
          while (k > 0 && k >= marker.index - 100 && stylePropsPos === -1) {
            if (_file.data[k] === '<' && helper.compareStringFromPosition(_endTagStyleProperty, _file.data, k) === true) {
              stylePropsPos = k;
            }
            if (_file.data[k] === '<' && helper.compareStringFromPosition(_startContent, _file.data, k) === true) {
              spacePreservePos = k;
            }
            k--;
          }
          k = marker.index + marker[0].length;
          /** 4 - Fin the position of the next text block (end of </w:r>) to insert subcontent */
          while (k < _file.data.length && k < marker.index + marker[0].length + 100 && subContentPos === -1) {
            if (_file.data[k] === '<' && helper.compareStringFromPosition(_endTagText, _file.data, k) === true) {
              subContentPos = k;
            }
            k++;
          }
          /** 5 - Insert HTML markers if positions are found */
          if (stylePropsPos !== -1 && subContentPos !== -1) {
            _file.data = helper.insertAt(_file.data, subContentPos + _endTagText.length, `{${marker[1]}:getHTMLSubContentDocx}`);
            _file.data = _file.data.replace(marker[0], `{${marker[1]}:getHTMLContentDocx}`);
            if (spacePreservePos !== -1) {
              _file.data = helper.insertAt(_file.data, spacePreservePos + 4, ' xml:space="preserve"');
            }
            _file.data = helper.insertAt(_file.data, stylePropsPos, `{${marker[1]}:getHTMLContentStyleDocx}`);
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
  buildSubContentDOCX : function (descriptor) {
    let _subContent = '';
    if (!descriptor) {
      return _subContent;
    }
    for (let i = 1, j = descriptor.length; i < j; i++) {
      if (descriptor[i].content === html.BREAK_LINE) {
        _subContent += html.xmlStyles.docx.br;
      }
      else {
        _subContent += `<w:r><w:rPr>${html.buildXMLStyle('docx', descriptor[i].tags)}</w:rPr><w:t xml:space="preserve">${descriptor[i].content}</w:t></w:r>`;
      }
    }
    return _subContent;
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
        _activeTags.push( _tagOnly );
      }
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
   * @description Parse a HTML content and create a descriptor
   * @param {string} htmlContent HTML content
   * @returns {Array} an HTML descriptor: [{ "content" : "content without html", "style": "list of style used"}, ...]
   * @example htmlContent: '<b><i>blue</i>sky</b>' => descriptor result: [{ 'content' : 'blue', tags: ['b', 'i'] }, { 'content' : 'sky', tags: ['b'] }]
   */
  parseHTMLOld : function (htmlContent) {
    let charToSave = '';
    let activeTags = [];
    let descriptor = [];
    let actualTag = {};
    let previousTagType = null;
    let tagsToDelete = [];

    /** 1 - loop through all characters of the HTML string */
    for (let i = 0, j = htmlContent.length; i < j; i++) {
      actualTag = {};

      /** 2 - if a left arrow character is detected, the tag has to be identified */
      if (htmlContent[i] === '<') {
        actualTag = html.identifyTag(htmlContent, i);
        /** Shift 'i' at the end of the tag */
        i = actualTag.pos;

        /** 2.5 if the element is a closing tag, we have to delete it for the next time something is saved in the descriptor */
        if (Object.prototype.hasOwnProperty.call(actualTag, 'type') && actualTag.type === 'end' && actualTag.name !== 'br') {
          tagsToDelete.push(actualTag.name);
        }
      }
      else {
        charToSave += htmlContent[i];
      }

      /** 3 - conditions to save an element in the descriptor */
      if (charToSave.length > 0 &&
          ((i + 1 >= htmlContent.length) || /** if at the end of the string */
            (htmlContent[i + 1] !== '<' && htmlContent[i + 1] !== '>' && actualTag.type === 'end') || /** if the next character is a text and the actual element an end tag */
            (previousTagType === 'end' && actualTag.type === 'begin') || /** the element is an opening tag and the previous element a closing tag */
            (previousTagType !== 'begin' && actualTag.type === 'begin') || /** if actual element is a starting tag and the previous element is different than a starting tag */
            (actualTag.name === 'br')) /** if the actual tag is a break line */
      ) {
        descriptor.push({
          content : charToSave,
          tags    : activeTags
        });
        charToSave = '';

        /** 3.5 - clean active tags based on the tagsToDelete array */
        activeTags = activeTags.filter((x) => {
          if (tagsToDelete.indexOf(x) === -1) {
            return true;
          }
          tagsToDelete = tagsToDelete.filter(k => k !== x);
          return false;
        });
      }

      /** 4 - Exception to save the break line */
      if (actualTag.name === 'br') {
        descriptor.push({
          content : html.BREAK_LINE,
          tags    : []
        });
      }
      /** 5 - Save the identified tag to the activeTags array */
      if (Object.prototype.hasOwnProperty.call(actualTag, 'type') && actualTag.type === 'begin' && actualTag.name !== 'br') {
        activeTags.push(actualTag.name);
      }

      previousTagType = Object.prototype.hasOwnProperty.call(actualTag, 'type') && activeTags.name !== 'br' ? actualTag.type : null;
    }
    /** Error Checking: all tags should be deleted at the end of the loop. */
    if (tagsToDelete.length > 0 || activeTags.length > 0) {
      activeTags.push(...tagsToDelete);
      let tagListError = activeTags.reduce((acc, cu, id) => acc += '<' + cu + '>' + (id + 1 !== activeTags.length ? ' ' : '') , '');
      throw new Error(`Invalid HTML tags: ${tagListError}`);
    }
    return descriptor;
  },
  /**
   * @description identify a tag at a specific position and return the corresponding style and end position
   * @param {String} htmlContent html content used to be parsed
   * @param {Integer} pos position of the opening tag, it should always be "<"
   * @returns {Object} an object with the tag description
   */
  identifyTag : function (htmlContent, index) {
    let name = '';
    let i = index + 1; /** start at the second character instead of '<' */
    let type = 'begin';
    let done = 0;
    /** 1 Error checking before the parsing */
    if (index < 0 || index > htmlContent.length ) {
      throw new Error('The index is outside of the text length range.');
    }
    if (htmlContent[index] !== '<') {
      throw new Error('Invalid HTML tag: the first character is not a left arrow key.');
    }
    /** 2 tag parsing at a given position starting at 'index' */
    while (i < htmlContent.length && htmlContent[i] !== '>') {
      const c = htmlContent[i];
      if (c === ' ' && done === 0) {
        /** valid tag */
        done = 1;
      }
      else if (c === '<') {
        /** unvalid tag */
        done = 2;
      }
      if (c !== '<' && c !== '/' && done !== 1) {
        name += c;
      }
      else if (c === '/' && htmlContent[i - 1] === '<') {
        type = 'end';
      }
      i++;
    }
    /** 3 Error checking after the parsing */
    if (htmlContent[i] !== '>' || done === 2 || name.length === 0) {
      throw new Error('Invalid HTML tag' + (name ? `: ${name}` : ''));
    }
    return { pos : i, name, type };
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
  BREAK_LINE : '#break#'
};

module.exports = html;