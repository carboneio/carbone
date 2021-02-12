const file = require('./file.js');
const parser = require('./parser.js');
const helper = require('./helper.js');
const hyperlinks = require('./hyperlinks.js');
const htmlEntities = require('../formatters/_entities.js')

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
    // _file.data = _file.data.replace(/{([^{}]*?):html[^{}]*?}/g, function (xml, marker) {
    //   if (parser.isCarboneMarker(marker) === true) {
    //     return `{${marker}:getHTMLContentOdt}`;
    //   }
    //   return xml;
    // });

    let marker;
    let patternHTML = /{([^{}]*?):html[^{}]*?}/g;
    /** 2 - Find HTML markers and get the position */
    // eslint-disable-next-line no-cond-assign
    while ((marker = patternHTML.exec(_file.data)) !== null) {
      let k = marker.index + marker[0].length;
      /** 3 - Find the position of the next text block (end of </w:p>) to insert subcontent */
      let subContentPos = _file.data.indexOf('</text:p>', k) + '</text:p>'.length;
      /** 4 - Insert HTML markers if positions are found */
      if (subContentPos !== -1) {
        _file.data = helper.insertAt(_file.data, subContentPos, `{${marker[1]}:getHTMLContentOdt}`);
        _file.data = _file.data.replace(marker[0], '');
      }
    }
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
      if (_item.value[1].styleLists) {
        _newXmlRelations += _item.value[1].styleLists;
      }
      _item = _htmlIt.next();
    }
    _file.data = _file.data.replace('</office:automatic-styles>', _newXmlRelations + '</office:automatic-styles>');
  },
  /**
   *
   * TODO: Improve paragraphs inside list items
   *
   * @description Create the xml content for ODT reports. It translate an HTML descriptor to ODT xml.
   * @param {String} styleID marker ID corresponding to the HTML map max size
   * @param {Array} descriptor the descriptor returned by "parseHTML"
   * @returns {String, String} new XML to inject inside ODT reports at 2 places: the content and the style.
   */
  buildXMLContentOdt : function (styleID, descriptor = []) {
    let _content = '';
    let _style = '';
    let _styleLists = '';
    /** ------ */
    let _isHTMLP = 0;
    let _isXMLP = false;
    let _isXMLA = 0;
    let _contentStyleId = '';
    let _isList = 0;

    for (let i = 0, j = descriptor.length; i < j; i++) {
      _contentStyleId = ''

      if (_isHTMLP === 0 && _isXMLP === false && _isList === 0 && (descriptor[i].type === '' || descriptor[i].type === '#AB#') && descriptor[i].tags.includes('li') === false) {
        _isHTMLP++;
        _isXMLP = true;
        _content += '<text:p>';
      }

      if (descriptor[i].type === html.types.BREAK_LINE) {
        if (_isXMLP === true || _isHTMLP > 0 || _isList > 0) {
          _content += html.xmlStyles.odt.br;
        } else {
          _content += '<text:p text:style-name="Standard"/>'
        }
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_BEGIN && _isList === 0) {
        if (_isHTMLP === 0) {
          _content += '<text:p>';
        }
        _isHTMLP++;
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_END && _isList === 0) {
        if (_isHTMLP === 1) {
          _content += '</text:p>'; // empty paragraph is more stable than a break line
          _content += '<text:p text:style-name="Standard"/>';
        }
        _isHTMLP--;
      }
      else if (descriptor[i].type === html.types.ANCHOR_BEGIN && descriptor[i].href !== undefined) {
        if (_isXMLA === 0) {
          _content +=  `<text:a xlink:type="simple" xlink:href="${hyperlinks.validateURL(descriptor[i].href)}">`;
        }
        _isXMLA++;
      }
      else if (descriptor[i].type === html.types.ANCHOR_END) {
        if (_isXMLA === 1) {
          _content += '</text:a>';
        }
        _isXMLA--;
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_BEGIN || descriptor[i].type === html.types.ORDERED_LIST_BEGIN) {
        let _listID = '';

        // ===== Manage Ordered or Unordored lists
        if (_isList === 0) {
          _listID = ` text:style-name="L${styleID + i}"`;
          _styleLists += `<text:list-style style:name="L${styleID + i}">`;
        }

        _isList++;

        _styleLists += html.getListStyleOdt(descriptor[i].type, _isList);

        if (_isList > 1) {
          if (descriptor[i - 1].type === '') {
            _content += '</text:p>';
          } else  if (descriptor[i - 1].type !== html.types.LIST_ITEM_BEGIN) {
            _content += '<text:list-item>';
          }
        }
        _content += `<text:list${_listID}>`;
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_END || descriptor[i].type === html.types.ORDERED_LIST_END) {
        _content += '</text:list>';
        if (_isList > 1 && i + 1 !== descriptor.length && descriptor[i + 1].type !== html.types.LIST_ITEM_END) {
          _content += '</text:list-item>';
        } else if (_isList === 1) {
          _content += `<text:p text:style-name="Standard"/>`;
        }
        _isList--;
        if (_isList === 0) {
          _styleLists += `</text:list-style>`;
        }
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_BEGIN) {
        _content += '<text:list-item>'
        if (descriptor[i + 1].type === '' || descriptor[i + 1].type === html.types.PARAGRAPH_BEGIN) {
          _content += '<text:p>';
        }
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_END) {
        if (descriptor[i - 1].type !== html.types.ORDERED_LIST_END && descriptor[i - 1].type !== html.types.UNORDERED_LIST_END) {
          _content += '</text:p>';
        }
        _content += '</text:list-item>'
      }
      else if (descriptor[i].content !== '') {
        if (descriptor[i].tags && descriptor[i].tags.length > 0) {
          const _uniqueStyleID = styleID + i;
          _styleContent = html.buildXMLStyle('odt', descriptor[i].tags)
          _style += `<style:style style:name="${_uniqueStyleID}" style:family="text"><style:text-properties ${_styleContent}/></style:style>`;
          _contentStyleId += ` text:style-name="${_uniqueStyleID}"`;
        }
        _content += `<text:span${_contentStyleId}>${descriptor[i].content}</text:span>`;
      }

      if (_isHTMLP > 0 && ((i + 1 === descriptor.length ) ||
                          (_isXMLP === true && descriptor[i + 1].type === html.types.PARAGRAPH_BEGIN) ||
                          (_isXMLP === true && (descriptor[i + 1].type === html.types.ORDERED_LIST_BEGIN || descriptor[i + 1].type === html.types.UNORDERED_LIST_BEGIN)))) {
        _content += '</text:p>';
        _isXMLP = false;
        _isHTMLP--;
      }
    }
    return { content : _content, style : _style, styleLists : _styleLists};
  },
  getListStyleOdt : function (type, level) {
    const _bulletChars = "•◦▪";
    const _position = (0.635 + 0.635 * level).toFixed(2);
    let _style = '';
    if (type === html.types.ORDERED_LIST_BEGIN) {
      _style += `<text:list-level-style-number text:level="${level}" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">`+
          '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
            `<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="${_position}cm" fo:text-indent="-0.635cm" fo:margin-left="${_position}cm"/>`+
          '</style:list-level-properties>'+
        '</text:list-level-style-number>';
    } else if (type === html.types.UNORDERED_LIST_BEGIN) {
      _style += `<text:list-level-style-bullet text:level="${level}" text:style-name="Bullet_20_Symbols" text:bullet-char="${_bulletChars[level % 3]}">` +
        `<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">` +
          `<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="${_position}cm" fo:text-indent="-0.635cm" fo:margin-left="${_position}cm"/>` +
        `</style:list-level-properties>` +
      `</text:list-level-style-bullet>`;
    }
    return _style;
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
          let subContentPos = _file.data.indexOf('</w:p>', k) + '</w:p>'.length;
          /** 4 - Insert HTML markers if positions are found */
          if (subContentPos !== -1) {
            _file.data = helper.insertAt(_file.data, subContentPos, `{${marker[1]}:getHTMLContentDocx}`);
            _file.data = _file.data.replace(marker[0], '');
          }
        }
      }
    }
  },
  postProcessDocx : function (template, data, options) {
    if (
      options.htmlDatabase === undefined ||
      options.htmlDatabase.size === 0
    ) {
      return template;
    }
    let _file = null;
    for (let i = 0, j = template.files.length; i < j; i++) {
      if (template.files[i].name.indexOf('numbering.xml') !== -1) {
        _file = template.files[i];
      }
    }
    if (!_file) {
      return;
    }
    let _xmlStyleListAbstract = '';
    let _xmlStyleListNum = '';
    let _htmlIt = options.htmlDatabase.entries();
    let _item = _htmlIt.next();
    while (_item.done === false) {
      _xmlStyleListAbstract += _item.value[1].listStyleAbstract;
      _xmlStyleListNum += _item.value[1].listStyleNum;
      _item = _htmlIt.next();
    }
    if (_xmlStyleListAbstract !== '') {
      _file.data = _file.data.replace('<w:abstractNum', _xmlStyleListAbstract + '<w:abstractNum');
      _file.data = _file.data.replace('</w:numbering>', _xmlStyleListNum + '</w:numbering>');
    }
  },
  /**
   * @description Create the sub Content XML for DOCX reports. It translate an HTML descriptor to DOCX xml.
   * @param {Array} descriptor the descriptor returned by "parseHTML"
   * @returns {String} new XML to inject inside DOCX reports.
   */
  buildContentDOCX : function (descriptor, options) {
    let _listId = 1000; // 1: ID of the first list created on the report
    let _isHTMLP = 0;
    let _isXMLA = 0;
    let _isXMLP = false;
    let _isXMLPList = false;
    let _listLevel = -1;
    let _listLevelMax = -1;
    let _content = '';
    let _listStyleAbstract = '';
    let _listStyleNum = '';


    if (!descriptor) {
      return { content: _content, listStyleAbstract: _listStyleAbstract, listStyleNum: _listStyleNum };
    }

    for (let i = 0, j = descriptor.length; i < j; i++) {

      if (_isHTMLP === 0 && _isXMLP === false && _listLevel === -1 && (descriptor[i].type === '' || descriptor[i].type === '#AB#') && descriptor[i].tags.includes('li') === false) {
        _isHTMLP++;
        _isXMLP = true;
        _content += '<w:p>';
      }

      if (descriptor[i].type === html.types.BREAK_LINE) {
        if ( _isHTMLP > 0 || _isXMLP === true || _listLevel > -1) {
          _content += `<w:r>${html.xmlStyles.docx.br}</w:r>`;
        }
        else {
          _content += '<w:p/>';
        }
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_BEGIN) {
        if (_isHTMLP === 0) {
          _content += '<w:p>';
        }
        _isHTMLP++;
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_END) {
        if (_isHTMLP === 1) {
          _content += '</w:p><w:p/>'; // empty paragraph is more stable than a break line
        }
        _isHTMLP--;
      }
      else if (descriptor[i].type === html.types.ANCHOR_BEGIN && descriptor[i].href !== undefined) {
        if (_isXMLA === 0) {
          const _hpProperties = hyperlinks.addLinkDatabase(options, hyperlinks.validateURL(descriptor[i].href, 'docx'), { fromHTML : true });
          _content +=  `<w:hyperlink r:id="${hyperlinks.getHyperlinkReferenceId(_hpProperties.id)}">`;
        }
        _isXMLA++;
      }
      else if (descriptor[i].type === html.types.ANCHOR_END) {
        if (_isXMLA === 1) {
          _content += '</w:hyperlink>';
        }
        _isXMLA--;
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_BEGIN || descriptor[i].type === html.types.ORDERED_LIST_BEGIN) {
        if (_listLevel > -1 && i - 1  >= 0 && descriptor[i - 1].type === '') {
          _content += '</w:p>';
          _isXMLPList = false;
        }
        _listLevel++;

        /** Generate Style of the list */
        if (_listLevel === 0) {
          _listStyleAbstract += `<w:abstractNum w:abstractNumId="${_listId}"><w:multiLevelType w:val="hybridMultilevel"/>`;
        }
        if (_listLevel > _listLevelMax) {
          _listStyleAbstract += html.getListStyleDocx(descriptor[i].type, _listLevel);
          _listLevelMax = _listLevel;
        }
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_END || descriptor[i].type === html.types.ORDERED_LIST_END) {
        if (_listLevel === 0) {
          _content += '<w:p/>';
          /** Generate Style of the list */
          _listStyleAbstract += `</w:abstractNum>`;
          _listStyleNum += `<w:num w:numId="${_listId}"><w:abstractNumId w:val="${_listId}"/></w:num>`;
          _listLevelMax = -1;
          _listId++;
        }
        _listLevel--;
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_BEGIN) {
        _content += `<w:p><w:pPr><w:numPr><w:ilvl w:val="${_listLevel}"/><w:numId w:val="${_listId}"/></w:numPr></w:pPr>`;
        _isXMLPList = true;
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_END && _isXMLPList === true) {
        _content += '</w:p>';
        _isXMLPList = false;
      }
      else if (descriptor[i].content !== '') {
        /** CONTENT + STYLE */
        let _contentProperties = html.buildXMLStyle('docx', descriptor[i].tags);
        if (_isXMLA > 0) {
          _contentProperties += '<w:rStyle w:val="Hyperlink"/>';
        }
        if (_contentProperties !== '') {
          _contentProperties = `<w:rPr>${_contentProperties}</w:rPr>`
        }
        _content += `<w:r>${_contentProperties}<w:t xml:space="preserve">${descriptor[i].content}</w:t></w:r>`;
      }

      if (_isHTMLP > 0 && ((i + 1 === descriptor.length ) ||
                          (_isXMLP === true && descriptor[i + 1].type === html.types.PARAGRAPH_BEGIN) ||
                          (_isXMLP === true && (descriptor[i + 1].type === html.types.ORDERED_LIST_BEGIN || descriptor[i + 1].type === html.types.UNORDERED_LIST_BEGIN)) )) {

        _content += '</w:p>';
        _isXMLP = false;
        _isHTMLP--;
      }
    }
    return { content: _content, listStyleAbstract: _listStyleAbstract, listStyleNum: _listStyleNum };
  },
  getListStyleDocx : function (type, level) {
    let _bulletChars = "o";
    let _charPos = level % 3;
    let _pos = 720 + 720 * level;
    let _style = '';
    if (type === html.types.UNORDERED_LIST_BEGIN) {
      _style = '' +
        `<w:lvl w:ilvl="${level}">` +
          '<w:start w:val="1"/>' +
          '<w:numFmt w:val="bullet"/>' +
          `<w:lvlText w:val="${_bulletChars[_charPos]}"/>` +
          '<w:lvlJc w:val="left"/>' +
          '<w:pPr>' +
            `<w:ind w:left="${_pos}" w:hanging="360"/>` +
          '</w:pPr>' +
          '<w:rPr>';
      if (_charPos === 0) {
        _style += '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>';
      } else if (_charPos === 1) {
        _style += '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>';
      } else if (_charPos === 2) {
        _style += '<w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/>';
      }
      _style += '</w:rPr>' +
        '</w:lvl>';
    } else if (type === html.types.ORDERED_LIST_BEGIN) {
      _style = '' +
        `<w:lvl w:ilvl="${level}">` +
          '<w:start w:val="1"/>' +
          '<w:numFmt w:val="decimal"/>' +
          `<w:lvlText w:val="%${level + 1}."/>` +
          '<w:lvlJc w:val="left"/>' +
          '<w:pPr>' +
            `<w:ind w:left="${_pos}" w:hanging="360"/>` +
          '</w:pPr>' +
        '</w:lvl>';
    }
    return _style;
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
  parseHTML : function (xml) {
    var _res = [];
    if (typeof (xml) !== 'string') {
      return [];
    }
    var _xmlTagRegExp = /<([^>]+?)>/g;
    var _tag = _xmlTagRegExp.exec(xml);
    var _activeTags = [];
    var _prevLastIndex = 0;
    while (_tag !== null) {
      var _tagStr = _tag[1];
      // push non XML part
      if ( _prevLastIndex < _tag.index) {
        _res.push({
          content : xml.slice(_prevLastIndex, _tag.index),
          type    : '',
          tags    : _activeTags.slice()
        });
      }
      // remove attributes from HTML tags <div class="s"> become div
      var _tagAttributeIndex = _tagStr.indexOf(' ');
      var _tagOnly = _tagStr.slice(0, _tagAttributeIndex > 0 ? _tagAttributeIndex : _tagStr.length);
      // special case for breaking line
      if (_tagOnly === 'br' || _tagOnly === 'br/') {
        _res.push({
          content : '',
          type    : html.types.BREAK_LINE,
          tags    : []
        });
      }
      else if ( _tagOnly === 'p' ) {
        _res.push({
          content : '',
          type    : html.types.PARAGRAPH_BEGIN,
          tags    : []
        });
      }
      else if ( _tagOnly === '/p' ) {
        _res.push({
          content : '',
          type    : html.types.PARAGRAPH_END,
          tags    : []
        });
      }
      else if (_tagOnly === 'ol' ) {
        _res.push({
          content : '',
          type    : html.types.ORDERED_LIST_BEGIN,
          tags    : []
        });
      }
      else if (_tagOnly === '/ol' ) {
        _res.push({
          content : '',
          type    : html.types.ORDERED_LIST_END,
          tags    : []
        });
      }
      else if (_tagOnly === 'ul' ) {
        _res.push({
          content : '',
          type    : html.types.UNORDERED_LIST_BEGIN,
          tags    : []
        });
      }
      else if (_tagOnly === '/ul' ) {
        _res.push({
          content : '',
          type    : html.types.UNORDERED_LIST_END,
          tags    : []
        });
      }
      else if (_tagOnly === 'li' ) {
        _res.push({
          content : '',
          type    : html.types.LIST_ITEM_BEGIN,
          tags    : []
        });
      }
      else if (_tagOnly === '/li' ) {
        _res.push({
          content : '',
          type    : html.types.LIST_ITEM_END,
          tags    : []
        });
      }
      else if ( _tagOnly === 'a' ) {
        const _regResp = _tagStr.match(/href="([^<">]*?)"/);
        _res.push({
          content : '',
          type    : html.types.ANCHOR_BEGIN,
          href    : _regResp !== null && _regResp[1] ? _regResp[1] : '',
          tags    : []
        });
      }
      else if ( _tagOnly === '/a' ) {
        _res.push({
          content : '',
          type    : html.types.ANCHOR_END,
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
      _prevLastIndex = _xmlTagRegExp.lastIndex;
      _tag = _xmlTagRegExp.exec(xml);
    }

    if (_prevLastIndex < xml.length) {
      _res.push({
        content : xml.slice(_prevLastIndex),
        type    : '',
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
  convertHTMLEntities : function (htmlContent = '') {
    /** 1. remove new line, CRLF */
    htmlContent = htmlContent.replace(/\n|\r|\t/g, '');
    /** 2. convert HTML entities to charater */
    return htmlContent.replace(/(&[\w\d#]*;)/g, function (entity) {
      if (Object.prototype.hasOwnProperty.call(htmlEntities, entity) === true) {
        return String.fromCodePoint(htmlEntities[entity][0]);
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
  types : {
    BREAK_LINE           : '#break#',
    ANCHOR_BEGIN         : '#AB#',
    ANCHOR_END           : '#AE#',
    PARAGRAPH_BEGIN      : '#PB#',
    PARAGRAPH_END        : '#PE#',
    LIST_ITEM_BEGIN      : '#LIB#',
    LIST_ITEM_END        : '#LIE#',
    ORDERED_LIST_BEGIN   : '#OLB#',
    ORDERED_LIST_END     : '#OLE#',
    UNORDERED_LIST_BEGIN : '#ULB#',
    UNORDERED_LIST_END   : '#ULE#',
  }
};

module.exports = html;
