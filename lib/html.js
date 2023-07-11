const file = require('./file.js');
const helper = require('./helper.js');
const hyperlinks = require('./hyperlinks.js');
const htmlEntities = require('../formatters/_entities.js');
const debug = require('debug')('carbone:html');
const imageFormatters = require('../formatters/image.js')

const html = {
  /** ============================= ODT ONLY ============================= */
  /**
   * Seperate mixed HTML formatters, static content and others markers into seperated paragraphs.
   * HTML markers are wrapped by <carbone></carbone> tags to protect the build stage of Carbone.
   * It is executed only during the pre-precessing of DOCX and ODT documents
   *
   * @param {String} content XML content
   * @returns {String}
   */
  reorderXML : function (content, options) {
    /** If the content does not contain HTML markers */
    if (content.indexOf(':html') === -1) {
      return content;
    }

    const _patternHTML = /{([^{}]*?):html[^{}]*?}/g;
    const _markerList = [];
    const _paragraphList = [];
    let marker = null;
    let _tagsToSearchs = options.extension === 'docx' ? [['<w:p'], ['</w:p>']] : [['<text:p', '<text:h'], ['</text:p>', '</text:h>']]; // default ODT
    // eslint-disable-next-line no-cond-assign
    while ((marker = _patternHTML.exec(content)) !== null) {
      const { paragraphStartPos, tagToSearchIndex } = this.findStartingParagraph(_tagsToSearchs[0], content, marker.index);

      if ( paragraphStartPos === -1 ) {
        debug('Reorder XML: no paragraph found');
        return content;
      }
      const _tagsToSearchEnd = _tagsToSearchs[1]?.[tagToSearchIndex];
      const _paragraphEndPos = content.indexOf(_tagsToSearchEnd, marker.index + marker[0].length) + _tagsToSearchEnd.length;

      /** If multiple html markers are included inside the same paragraphe, it is skipped because it is already parsed and reordered. */
      if (_paragraphList.includes(paragraphStartPos) === true) {
        continue;
      }
      _paragraphList.push(paragraphStartPos);

      const _paragraph = content.substring(paragraphStartPos, _paragraphEndPos);

      /** Substring to get only the paragraph styles properties <w:pPr>*<w:rPr>*</w:rPr></w:pPr> (DOCX) or <text:p text:style-name="P1"> (ODT) */
      const _styles = html.getTemplateDefaultStyles(_paragraph.substring(0, marker.index - paragraphStartPos), options, content);

      _markerList.push({
        newContent    : this.createNewXMLContent(_paragraph, options.extension, _styles),
        beginTagFirst : paragraphStartPos,
        endTagLast    : _paragraphEndPos
      });
    }

    /** Insert the previous paragraph with the new XML content created */
    for (let i = _markerList.length -  1; i >= 0; i--) {
      content = content.slice(0, _markerList[i].beginTagFirst) + _markerList[i].newContent + content.slice(_markerList[i].endTagLast);
    }
    return content;
  },
  /**
   * Find the position of the first starting paragraph.
   * Using the lastIndexOf function is not enough, the DOCX parapgraph tag "<w:p ... >"" could be mistaken by another tag such as <w:pPr>, <w:proofErr/>
   *
   * @param {Array} tagsToSearch Array of 2 elements as a String: the beginning and ending paragraph
   * @param {String} content file content
   * @param {Integer} initialPos The index of the last character in the string to be considered as the beginning of a match.
   * @returns {Integer} Position of the first starting paragraph.
   */
  findStartingParagraph : function (tagsToSearch, content, initialPos) {
    let _posToSearch = initialPos;
    let _tagToSearchIndex = 0;

    /** Support all unit tests */
    if (Array.isArray(tagsToSearch) === false) {
      tagsToSearch = [tagsToSearch];
    }



    while (_posToSearch > 0) {
      let _paragraphStartPos = -1;
      /**
       * Loop through tag to search Array: it could be either '<text:p' or '<text:h',
       * the array is a maximum of 2 elements for now
       */
      for (let i = 0; i < tagsToSearch.length; i++) {
        const _tagToSearchTmp = tagsToSearch[i];
        const _lastIndexOfRes = content.lastIndexOf(_tagToSearchTmp, _posToSearch);
        if (_lastIndexOfRes > _paragraphStartPos) {
          _tagToSearchIndex = i;
          _paragraphStartPos = _lastIndexOfRes;
        }
      }
      const _tmpContent = content.slice(_paragraphStartPos, _paragraphStartPos + tagsToSearch[_tagToSearchIndex].length + 1);
      const _lastCharacter = _tmpContent[_tmpContent.length - 1];
      /** Tag verification because it could be something else, such as <w:pPr>, <w:proofErr/> */
      if (_lastCharacter === ' ' || _lastCharacter === '>') {
        return { paragraphStartPos: _paragraphStartPos, tagToSearchIndex: _tagToSearchIndex }
      }
      _posToSearch = _paragraphStartPos - 1;
    }
    return { paragraphStartPos: -1, tagToSearchIndex: -1 }
  },
  /**
   * Parse the paragraphe to create a descriptor and recreate the new content.
   *
   * @param {String} content the paragraph to parse that include a HTML marker
   * @param {String} fileType ODS or ODT file
   * @param {String} styles style of the initial paragraph, such as (text:style-name="P5") or (\'American Typewriter\', null)
   * @returns
   */
  createNewXMLContent : function (content, fileType, styles) {
    let _xmlTagRegExp = /<([^>]+?)>/g;
    let _prevIndex = -1;
    let _totalContentLength = 0;
    let _xmlTemplate = '';
    let _descriptor = [];
    let tag = null;

    /**
     * Loop to seperate tags and content (html marker, simple marker, and static content)
     * Seperated tags are used to create a "xml template", it is later used to recreate the content.
    */
    // eslint-disable-next-line no-cond-assign
    while ((tag = _xmlTagRegExp.exec(content)) !== null) {
      if (_prevIndex !== -1 && _prevIndex !== tag.index) {
        const _content = content.substring(_prevIndex, tag.index);
        _descriptor.push(...this.seperateHTMLMarker(_content, _prevIndex - _totalContentLength, fileType, styles));
        _totalContentLength += _content.length;
      }
      _xmlTemplate += tag[0];
      _prevIndex = tag.index + tag[0].length;
    }

    /**
     * Recreate the content based on the descriptor
     * It insert the new content inside the xmlTemplate at the right positions.
     * If a HTML marker comes, a new xmlTemplate paragraph is used.
     */
    let _newContent = '';
    let _tmpContent = '';
    for (let i = _descriptor.length - 1; i >= 0; i--) {
      const _el = _descriptor[i];

      if (_el.isHTML === true) {
        _newContent = _tmpContent + _newContent;
        _newContent = _el.data + _newContent;
        _tmpContent = '';
      }
      else {
        const _xmlToUse = _tmpContent !== '' ? _tmpContent : _xmlTemplate;
        _tmpContent = helper.insertAt(_xmlToUse, _el.pos, _el.data);
      }
    }
    if (_tmpContent) {
      _newContent = _tmpContent + _newContent;
    }
    return _newContent;
  },
  /**
   * Create a descriptor of a string that contain only HTML markers and static content/basic markers.
   * It is not possible to pass a string that contain a XML tag.
   *
   * @param {String} content String with ONLY html markers and static content
   * @param {Integer} pos position of the content
   * @param {String} fileType 'ODS' or 'DOCX' file type
   * @param {String} styles style of the initial paragraph, such as (text:style-name="P5") or (\'American Typewriter\', null)
   * @returns {Array<{pos: Integer, data: String, isHTML: Boolean}>} descriptor seperating HTML markers and static content
   */
  seperateHTMLMarker : function(content, pos, fileType, styles) {
    const patternHTML = /{([^{}]*?):html[^{}]*?}/g;
    let _descriptor = [];
    let _lastIndex = -1;
    let marker = null;
    styles = styles || '';
    const _postProcessFormatter = fileType === 'docx' ? `:getHTMLContentDocx${styles}` : `:getHTMLContentOdt${styles}`;

    if (content.indexOf(':html') === -1) {
      _descriptor.push({
        pos    : pos,
        data   : content,
        isHTML : false
      });
      return _descriptor;
    }
    // automatically replace convCRLF by convCRLFH to convert CR/LF to <br>
    content = content.replace(':convCRLF', ':convCRLFH');
    // eslint-disable-next-line no-cond-assign
    while ((marker = patternHTML.exec(content)) !== null) {
      const _contentBetweenHtml = content.substring(_lastIndex === -1 ? 0 : _lastIndex, marker.index);
      if (_contentBetweenHtml.length > 0) {
        _descriptor.push({
          pos    : pos,
          data   : _contentBetweenHtml,
          isHTML : false
        });
      }
      _descriptor.push({
        pos    : pos,
        data   : `<carbone>{${marker[1]}${_postProcessFormatter}}</carbone>`,
        isHTML : true
      });
      _lastIndex = marker.index + marker[0].length;
    }
    const _contentAfterHtml = content.substring(_lastIndex, content.length);
    if (_contentAfterHtml.length > 0) {
      _descriptor.push({
        pos    : pos,
        data   : _contentAfterHtml,
        isHTML : false
      });
    }
    return _descriptor;
  },
  /**
   * Remove <carbone></carbone> from a template.
   * It is executed during post processing.
   *
   * @param {Array} template Array of xml files
   */
  removeCarboneTags : function (template) {
    const _carboneTagRegex = /<\/?carbone>/g;
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1 || /** DOCX Templates */
           _file.name.indexOf('content.xml') !== -1)) { /** ODT Templates */
        _file.data = _file.data.replace(_carboneTagRegex, '');
      }
    }
  },
  /**
   * @description find all the html markers and insert a new span around the marker with HTML formatters
   * @private
   * @param {Object} template list of xml files
   */
  preProcessODT : function (template, options) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }
    _file.data = html.reorderXML(_file.data, options);
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
   * @description Return a "content builder" object that will be use to generate the final XML, it contains 3 elements:
   * @description "elements" array: list content as a string or as a function that will be called during post processing
   * @description "add" function: add new content to the `elements` attribute, it accepts a string or a function
   * @description "get" function: contact each elements of the `elements` list and return a string, if an element is a function, it is executed then contacted as a string
   * @returns {Object}
   */
  getNewContentBuilder : function () {
    return {
      elements : [],
      add: function (newContent) {
        const _lastElement = this.elements[this.elements.length > 0 ? this.elements.length - 1 : 0];
        if ((typeof newContent === 'string' || typeof newContent === 'number') && _lastElement?.type === 'string') {
          _lastElement.data += newContent;
        } else {
          /** The content can be a string or a function (post process function) */
          this.elements.push({
            data: newContent,
            type: typeof newContent
          });
        }
      },
      /**
       * Build the content by executing post process function (for images)
       * @returns {string}
       */
      get: function (options) {
        let _buildedContent = '';
        for (let i = 0; i < this.elements?.length; i++) {
          const _part = this.elements[i];
          if (_part?.type === 'object' && typeof _part?.data?.fn === 'function') {
            _buildedContent += _part?.data?.fn?.apply(options ?? {}, _part?.data?.args ?? []) ?? '';
          } else if (typeof _part?.type === 'string') {
            _buildedContent += _part?.data ?? '';
          }
        }
        return _buildedContent;
      }
    }
  },
  buildXMLContentOdt : function (styleID, descriptor, options, defaultStyleId) {
    let _content = this.getNewContentBuilder();
    let _style = '';
    let _styleLists = '';
    descriptor = descriptor ?? [];
    /** ------ */
    let _isHTMLP = 0;
    let _isXMLP = false;
    let _isXMLA = 0;
    let _contentStyleId = '';
    let _isList = 0;
    let _xmlAnchorLink = '';

    this.skipEmptyParagraphs(descriptor);

    /** Retreive the style coming from the template */
    let _defaultStylesObject = this.getHtmlDefaultStylesDatabase(options, defaultStyleId);

    for (let i = 0, j = descriptor.length; i < j; i++) {
      _contentStyleId = '';

      /** Jump to another index into the descriptor if the paragraph should be skipped */
      if (descriptor[i]?.toSkip > 0) {
        i = descriptor[i]?.toSkip - 1;
        continue;
      }

      if (_isXMLP === false && _isList === 0 && (descriptor[i].type === '' || descriptor[i].type === html.types.ANCHOR_BEGIN || descriptor[i].type === html.types.IMAGE)) {
        _isXMLP = true;
        _content.add(`<text:p${_defaultStylesObject.paragraph ? ' ' + _defaultStylesObject.paragraph : ''}>`);
      }

      if (descriptor[i].type === html.types.BREAK_LINE) {
        if (_isXMLP === true || _isHTMLP > 0 || _isList > 0) {
          _content.add(html.xmlStyles.odt.br);
        }
        else {
          /** Empty paragraph */
          _content.add(`<text:p${_defaultStylesObject.paragraph ? ' '+ _defaultStylesObject.paragraph : ' text:style-name="Standard"'}/>`);
        }
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_BEGIN && _isHTMLP === 0 && _isXMLA === 0) {
        _content.add(`<text:p${_defaultStylesObject.paragraph ? ' ' + _defaultStylesObject.paragraph : ''}>`);
        _isXMLP = true;
        _isHTMLP++;
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_END && _isHTMLP > 0 && _isList === 0  && _isXMLA === 0) {
        _content.add(`</text:p><text:p${_defaultStylesObject.paragraph ? ' '+ _defaultStylesObject.paragraph : ' text:style-name="Standard"'}/>`);
        _isXMLP = false;
        _isHTMLP--;
      }
      else if (descriptor[i].type === html.types.ANCHOR_BEGIN && descriptor[i].href !== undefined) {
        if (_isXMLA === 0) {
          _xmlAnchorLink = hyperlinks.validateURL(descriptor[i].href, options.defaultUrlOnError);
          _content.add(`<text:a xlink:type="simple" xlink:href="${_xmlAnchorLink}">`);
        }
        _isXMLA++;
      }
      else if (descriptor[i].type === html.types.ANCHOR_END) {
        if (_isXMLA === 1) {
          _content.add('</text:a>');
        }
        _xmlAnchorLink = '';
        _isXMLA--;
      }
      else if (descriptor[i].type === html.types.IMAGE && ( _isXMLP > 0 || _isList > 0)) {
        if (_xmlAnchorLink !== '' && _isXMLA > 0) {
          _content.add(`<draw:a xlink:type="simple" xlink:href="${_xmlAnchorLink}">`);
        }
        _content.add(`<draw:frame draw:name="carbone-html-image-`);
        _content.add(imageFormatters.generateOpenDocumentUniqueNumber.call(options, descriptor[i].src));
        _content.add(`" text:anchor-type="as-char" svg:width="`);
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'width', (descriptor[i].width > 0 ? descriptor[i].width * 0.0265 : descriptor[i].width), 'cm', 'fill'));
        _content.add(`cm" svg:height="`);
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'height', (descriptor[i].height > 0 ? descriptor[i].height * 0.0265 : descriptor[i].height), 'cm', 'fill'));
        _content.add(`cm" draw:z-index="0"><draw:image xlink:href="`);
        _content.add(imageFormatters.generateOpenDocumentImageHref.call(options, descriptor[i].src));
        _content.add(`" draw:mime-type="`);
        _content.add(imageFormatters.generateOpenDocumentImageMimeType.call(options, descriptor[i].src));
        _content.add(`" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>`);
        if (_xmlAnchorLink !== '' && _isXMLA > 0) {
          _content.add(`</draw:a>`);
        }
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
          if (descriptor[i - 1].type === '' || descriptor[i - 1].type === html.types.BREAK_LINE) {
            _content.add('</text:p>');
            _isXMLP = false;
            if (_isHTMLP > 0) {
              _isHTMLP--;
            }
          }
          else if (descriptor[i - 1].type !== html.types.LIST_ITEM_BEGIN) {
            _content.add('<text:list-item>');
          }
        }
        _content.add(`<text:list${_listID}>`);
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_END || descriptor[i].type === html.types.ORDERED_LIST_END) {
        _content.add('</text:list>');
        if (_isList > 1 && i + 1 !== descriptor.length && descriptor[i + 1].type !== html.types.LIST_ITEM_END) {
          _content.add('</text:list-item>');
        }
        else if (_isList === 1) {
          /** Empty paragraph */
          _content.add(`<text:p${_defaultStylesObject.paragraph ? ' '+ _defaultStylesObject.paragraph : ' text:style-name="Standard"'}/>`);
        }
        _isList--;
        if (_isList === 0) {
          _styleLists += '</text:list-style>';
        }
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_BEGIN) {
        _content.add('<text:list-item>');
        if (descriptor[i + 1].type === '' || descriptor[i + 1].type === html.types.IMAGE || descriptor[i + 1].type === html.types.ANCHOR_BEGIN) {
          _content.add(`<text:p${_defaultStylesObject.paragraph ? ' ' + _defaultStylesObject.paragraph : ''}>`);
          _isXMLP = true;
        }
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_END) {
        if (descriptor[i - 1].type !== html.types.ORDERED_LIST_END && descriptor[i - 1].type !== html.types.UNORDERED_LIST_END) {
          _content.add('</text:p>');
          _isXMLP = false;
          if (_isHTMLP > 0) {
            _isHTMLP--;
          }
        }
        _content.add('</text:list-item>');
      }
      else if (descriptor[i].content !== '' && _isXMLP === true) {
        /** Retreive the new style from the HTML and apply the default style coming from the template. */
        if ((descriptor[i].tags && descriptor[i].tags.length > 0) || _defaultStylesObject.text !== '') {
          const _uniqueStyleID = styleID + i;
          let _styleContent = html.buildXMLStyle('odt', descriptor[i].tags);
          _styleContent = _styleContent !== '' && _styleContent[0] !== ' ' ? ' ' + _styleContent : _styleContent;
          _defaultStylesObject.text = _defaultStylesObject.text !== '' && _defaultStylesObject.text[0] !== ' ' ? ' ' + _defaultStylesObject.text : _defaultStylesObject.text;
          _style += `<style:style style:name="${_uniqueStyleID}" style:family="text"><style:text-properties${_styleContent}${_defaultStylesObject.text}/></style:style>`;
          _contentStyleId += ` text:style-name="${_uniqueStyleID}"`;
        }
        _content.add(`<text:span${_contentStyleId}>${descriptor[i].content}</text:span>`);
      }

      if (_isXMLP === true && ((i + 1 === descriptor.length ) ||
                          (descriptor[i + 1]?.type === html.types.PARAGRAPH_BEGIN && _isXMLA === 0) ||
                          (_isList === 0 && (descriptor[i + 1]?.type === html.types.ORDERED_LIST_BEGIN || descriptor[i + 1]?.type === html.types.UNORDERED_LIST_BEGIN)))) {
        _content.add('</text:p>');
        _isXMLP = false;
        if (_isHTMLP > 0) {
          /** Empty paragraph */
          _content.add(`<text:p${_defaultStylesObject.paragraph ? ' '+ _defaultStylesObject.paragraph : ' text:style-name="Standard"'}/>`);
          _isHTMLP--;
        }
      }
    }
    return { content : _content, style : _style, styleLists : _styleLists};
  },
  getListStyleOdt : function (type, level) {
    const _bulletChars = '•◦▪';
    const _position = (0.635 + 0.635 * level).toFixed(2);
    let _style = '';
    if (type === html.types.ORDERED_LIST_BEGIN) {
      _style += `<text:list-level-style-number text:level="${level}" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">`+
          '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
            `<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="${_position}cm" fo:text-indent="-0.635cm" fo:margin-left="${_position}cm"/>`+
          '</style:list-level-properties>'+
        '</text:list-level-style-number>';
    }
    else if (type === html.types.UNORDERED_LIST_BEGIN) {
      _style += `<text:list-level-style-bullet text:level="${level}" text:style-name="Bullet_20_Symbols" text:bullet-char="${_bulletChars[level % 3]}">` +
        '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
          `<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="${_position}cm" fo:text-indent="-0.635cm" fo:margin-left="${_position}cm"/>` +
        '</style:list-level-properties>' +
      '</text:list-level-style-bullet>';
    }
    return _style;
  },
  /** ============================= DOCX ONLY ============================= */
  /**
   * @description find ":html" formatters and inject a special formatter used during post processing: :getHTMLContentDocx
   * @description also it inject a special attribute to keep space characters on the content: xml:space="preserve
   * @param {Object} template list of xml files
   */
  preProcessDocx : function (template, options) {
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      /** Only edit the document, headers or footers */
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
        (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        _file.data = html.reorderXML(_file.data, options);
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
      if (template.files[i].name.indexOf('numbering.xml') !== -1 && template.files[i].name.indexOf('.rels') === -1) {
        _file = template.files[i];
        break;
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
  buildXmlContentDOCX : function (descriptor, options, styleId = '') {
    let _listId = 1000; // 1: ID of the first list created on the report
    let _isHTMLP = 0;
    let _isXMLA = 0;
    let _isXMLP = false;
    let _isXMLPList = false;
    let _listLevel = -1;
    let _listLevelMax = -1;
    let _content = this.getNewContentBuilder();
    let _listStyleAbstract = '';
    let _listStyleNum = '';
    let _activeHyperlinkReference = '';

    let _defaultTemplateStyles = this.getHtmlDefaultStylesDatabase(options, styleId);

    if (!descriptor) {
      return { content : _content, listStyleAbstract : _listStyleAbstract, listStyleNum : _listStyleNum };
    }

    this.skipEmptyParagraphs(descriptor);

    for (let i = 0, j = descriptor.length; i < j; i++) {

      /** Jump to another index into the descriptor if the paragraph should be skipped */
      if (descriptor[i]?.toSkip > 0) {
        i = descriptor[i]?.toSkip - 1;
        continue;
      }

      if (_isHTMLP === 0 && _isXMLP === false && _listLevel === -1 && (descriptor[i].type === '' || descriptor[i].type === html.types.ANCHOR_BEGIN || descriptor[i].type === html.types.IMAGE)) {
        _isXMLP = true;
        _content.add('<w:p>');
        if (_defaultTemplateStyles.paragraph) {
          /** RTL and Text Alignement */
          _content.add(`<w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr>`);
        }
      }

      if (descriptor[i].type === html.types.BREAK_LINE) {
        if ( _isHTMLP > 0 || _isXMLP === true || _listLevel > -1) {
          _content.add(`<w:r>${html.xmlStyles.docx.br}</w:r>`)
        }
        else {
          /** Empty paragraph */
          _content.add(_defaultTemplateStyles.paragraph ? `<w:p><w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr></w:p>` : '<w:p/>');
        }
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_BEGIN && _isHTMLP === 0 && _listLevel === -1 && _isXMLA === 0) {
        _content.add('<w:p>');
        _isXMLP = true;
        _isHTMLP++;
        if (_defaultTemplateStyles.paragraph) {
          /** RTL and Text Alignement */
          _content.add(`<w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr>`)
        }
      }
      else if (descriptor[i].type === html.types.PARAGRAPH_END && _isHTMLP > 0 && _listLevel === -1 && _isXMLA === 0) {
        _content.add('</w:p>')
        /** Empty paragraph */
        _content.add(_defaultTemplateStyles.paragraph ? `<w:p><w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr></w:p>` : '<w:p/>');
        _isXMLP = false;
        _isHTMLP--;
      }
      else if (descriptor[i].type === html.types.IMAGE && (_isXMLP === true || _isXMLPList === true)) {
        _content.add(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="`)
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'width', (descriptor[i].width >= 0 ? descriptor[i].width * 914400 / 96 : descriptor[i].width), 'emu', 'fill', { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`" cy="`);
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'height', (descriptor[i].height >= 0 ? descriptor[i].height * 914400 / 96 : descriptor[i].height), 'emu', 'fill', { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="`);
        _content.add(imageFormatters.generateImageDocxId.call(options, descriptor[i].src, { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`" name="" descr="">`);
        if (_isXMLA > 0 && _activeHyperlinkReference) {
          _content.add(`<a:hlinkClick xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:id="${_activeHyperlinkReference}"/>`);
        }
        _content.add(`</wp:docPr>`);
        _content.add(`<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="`);
        _content.add(imageFormatters.generateImageDocxId.call(options, descriptor[i].src, { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`" name="" descr="">`);
        if (_isXMLA > 0 && _activeHyperlinkReference) {
          _content.add(`<a:hlinkClick r:id="${_activeHyperlinkReference}"/>`);
        }
        _content.add(`</pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="`);
        _content.add(imageFormatters.generateImageDocxReference.call(options, descriptor[i].src, 'document.xml', { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="`)
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'width',(descriptor[i].width >= 0 ? descriptor[i].width * 914400 / 96 : descriptor[i].width), 'emu', 'fill', { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`" cy="`);
        _content.add(imageFormatters.scaleImage.call(options, descriptor[i].src, 'height', (descriptor[i].height >= 0 ? descriptor[i].height * 914400 / 96 : descriptor[i].height), 'emu', 'fill', { width: descriptor[i].width, height: descriptor[i].height }));
        _content.add(`"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`);
      }
      else if (descriptor[i].type === html.types.ANCHOR_BEGIN && descriptor[i].href !== undefined && _isXMLA === 0 && (_isXMLP === true || _isXMLPList === true)) {
        const _hpProperties = hyperlinks.addLinkDatabase(options, hyperlinks.validateURL(descriptor[i].href, options.defaultUrlOnError), { fromHTML : true });
        _activeHyperlinkReference = hyperlinks.getHyperlinkReferenceId(_hpProperties.id);
        _content.add(`<w:hyperlink r:id="${_activeHyperlinkReference}">`)
        _isXMLA++;
      }
      else if (descriptor[i].type === html.types.ANCHOR_END && _isXMLA === 1 && (_isXMLP === true || _isXMLPList === true)) {
        _content.add('</w:hyperlink>')
        _isXMLA--;
      }
      else if (descriptor[i].type === html.types.UNORDERED_LIST_BEGIN || descriptor[i].type === html.types.ORDERED_LIST_BEGIN) {
        /** SPECIAL CASE, if the previous element is a text inside a list, we must close the paragraphe to create a new list */
        if (_listLevel > -1 && i - 1  >= 0 && (descriptor[i - 1].type === '' || descriptor[i - 1].type === html.types.LIST_ITEM_BEGIN || descriptor[i - 1].type === html.types.BREAK_LINE)) {
          _content.add('</w:p>');
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
          /** Empty paragraph */
          _content.add(_defaultTemplateStyles.paragraph ? `<w:p><w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr></w:p>` : '<w:p/>');
          /** Generate Style of the list */
          _listStyleAbstract += '</w:abstractNum>';
          _listStyleNum += `<w:num w:numId="${_listId}"><w:abstractNumId w:val="${_listId}"/></w:num>`;
          _listLevelMax = -1;
          _listId++;
        }
        _listLevel--;
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_BEGIN) {
        _content.add(`<w:p><w:pPr><w:numPr><w:ilvl w:val="${_listLevel}"/><w:numId w:val="${_listId}"/></w:numPr>${_defaultTemplateStyles?.paragraph ?? ''}${_defaultTemplateStyles?.text ? '<w:rPr>' + _defaultTemplateStyles?.text + '</w:rPr>' : ''}</w:pPr>`)
        _isXMLPList = true;
      }
      else if (descriptor[i].type === html.types.LIST_ITEM_END && _isXMLPList === true) {
        _content.add('</w:p>');
        _isXMLPList = false;
      }
      else if (descriptor[i].content !== '' && (_isXMLP === true || _isXMLPList === true)) {
        /** CONTENT + STYLE */
        /** Apply the style coming from the HTML */
        let _contentProperties = html.buildXMLStyle('docx', descriptor[i].tags);
        if (_isXMLA > 0) {
          _contentProperties += '<w:rStyle w:val="Hyperlink"/>';
        }
        /** Apply the style coming from the template */
        if (_defaultTemplateStyles.text) {
          _contentProperties += _defaultTemplateStyles.text;
        }
        if (_contentProperties !== '') {
          _contentProperties = `<w:rPr>${_contentProperties}</w:rPr>`;
        }
        _content.add(`<w:r>${_contentProperties}<w:t xml:space="preserve">${descriptor[i].content}</w:t></w:r>`);
      }

      if (_isXMLP === true && (
            (i + 1 === descriptor.length) ||
            (descriptor[i + 1].type === html.types.PARAGRAPH_BEGIN && _isXMLA === 0) ||
            (descriptor[i + 1].type === html.types.ORDERED_LIST_BEGIN || descriptor[i + 1].type === html.types.UNORDERED_LIST_BEGIN)
          )
        ) {
        _content.add('</w:p>');
        _isXMLP = false;
        if (_isHTMLP > 0) {
          /** Empty paragraph */
          _content.add(_defaultTemplateStyles.paragraph ? `<w:p><w:pPr>${_defaultTemplateStyles.paragraph}</w:pPr></w:p>` : '<w:p/>');
          _isHTMLP--;
        }
      }
    }
    return { content : _content, listStyleAbstract : _listStyleAbstract, listStyleNum : _listStyleNum };
  },
  getListStyleDocx : function (type, level) {
    let _bulletChars = 'o';
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
      }
      else if (_charPos === 1) {
        _style += '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>';
      }
      else if (_charPos === 2) {
        _style += '<w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/>';
      }
      _style += '</w:rPr>' +
        '</w:lvl>';
    }
    else if (type === html.types.ORDERED_LIST_BEGIN) {
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
   * Remove empty paragraph otherwise it is creating an empty line into documents
   * @param {Array} descriptor
   */
  skipEmptyParagraphs: function (descriptor) {
    let _paragraphBeginPos = -1;
    let _isEmpty = true;
    for (let j = 0; j < descriptor.length; j++) {
      if (_isEmpty === true && _paragraphBeginPos >= 0 &&
          ((descriptor[j].type === html.types.PARAGRAPH_BEGIN) ||
          (descriptor[j]?.type === html.types.ORDERED_LIST_BEGIN || descriptor[j]?.type === html.types.UNORDERED_LIST_BEGIN))) {
        descriptor[_paragraphBeginPos].toSkip = j;
      }
      if (descriptor[j].type === html.types.PARAGRAPH_BEGIN) {
        _paragraphBeginPos = j;
        _isEmpty = true;
      }
      /** Content can be: string, non breaking space, links, images */
      if (descriptor[j].type === html.types.IMAGE || descriptor[j].type === html.types.ANCHOR_BEGIN || descriptor[j].content.includes('\xa0') === true || (descriptor[j].content !== '' && descriptor[j].content?.trim()?.length > 0 && descriptor[j].type !== html.types.PARAGRAPH_BEGIN)) {
        _isEmpty = false;
        _paragraphBeginPos = -1;
        continue;
      }
    }
  },
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
   * Retreive the font styles and properties from a paragraph and text.
   * It is saved in the htmlStylesDatabase and used to recreate the new XML with the default styles coming from the template
   * Only ODT and DOCX are supported
   *
   * @param {String} paragraphStyles portion of xml used to search the default style
   * @param {Object} options Main options
   * @param {String} xmlContent the whole xml of the page
   * @returns {String} Style ID surrounded by parentheses because it is passed to postprocess formatters
   */
   getTemplateDefaultStyles : function (paragraphStyles, options, xmlContent) {
    let _defaultTemplateStylesId = 'style';
    let _defaultTemplateStyles = {
     ...this.templateDefaultStyles
    };

    if (options.extension === 'docx') {
      // Font Family
      const _regFontResult = paragraphStyles.match(/<w:rFonts[^]*?(w:ascii|w:hAnsi|w:cs|w:eastAsia)="([^]*?)"[^]*?\/>/);
      if (_regFontResult !== null && _regFontResult.length > 0 && _regFontResult[0] !== '' && _regFontResult[2] !== '') {
        _defaultTemplateStylesId += `-ff${_regFontResult[2]}`
        _defaultTemplateStyles.text += _regFontResult[0];
        _defaultTemplateStyles.paragraph += _regFontResult[0];
      }
      // Font Size
      const _regFontSizeResult = paragraphStyles.match(/<w:sz[^]*?w:val="([^]*?)"\/>/);
      if (_regFontSizeResult !== null && _regFontSizeResult.length > 0 && _regFontSizeResult[0] !== '' && _regFontSizeResult[1] !== '') {
        _defaultTemplateStylesId += `-fs${_regFontSizeResult[1]}`
        _defaultTemplateStyles.text += _regFontSizeResult[0];
        _defaultTemplateStyles.paragraph += _regFontSizeResult[0];
      }
      // RTL
      const _regRtlResult = paragraphStyles.match(/<w:bidi[^]*?\/>/);
      if (_regRtlResult !== null && _regRtlResult.length > 0 && _regRtlResult[0] !== '') {
        _defaultTemplateStylesId += `-rtl`
        _defaultTemplateStyles.paragraph += _regRtlResult[0];
      }
      // text color
      const _regTextColorResult = paragraphStyles.match(/<w:color[^]*?w:val="([^]*?)"[^]*?\/>/);
      if (_regTextColorResult !== null && _regTextColorResult.length > 0 && _regTextColorResult[0] !== '' && _regTextColorResult[1] !== '') {
        _defaultTemplateStylesId += `-tcolor${_regTextColorResult[1]}`
        _defaultTemplateStyles.text += _regTextColorResult[0];
      }
      // text bg color
      const _regBgColorResult = paragraphStyles.match(/<w:highlight[^]*?w:val="([^]*?)"[^]*?\/>/);
      if (_regBgColorResult !== null && _regBgColorResult.length > 0 && _regBgColorResult[0] !== '' && _regBgColorResult[1] !== '') {
        _defaultTemplateStylesId += `-bgcolor${_regBgColorResult[1]}`;
        _defaultTemplateStyles.text += _regBgColorResult[0];
      }
      // text alignment
      const _regAlignmentResult = paragraphStyles.match(/<w:jc[^]*?w:val="([^]*?)"[^]*?\/>/);
      if (_regAlignmentResult !== null && _regAlignmentResult.length > 0 && _regAlignmentResult[0] !== '' && _regAlignmentResult[1] !== '') {
        _defaultTemplateStylesId += `-textalign${_regAlignmentResult[1]}`
        _defaultTemplateStyles.paragraph += _regAlignmentResult[0];
      }
    }
    else if (options.extension === 'odt') {
      // Get the paragraph style ID: RTL, Text Alignement
      const _regParagraphStyle = paragraphStyles.match(/text:style-name="(P[^"]*)"/);
      if (_regParagraphStyle !== null && _regParagraphStyle.length > 0 && _regParagraphStyle[0] !== '' && _regParagraphStyle[1] !== '') {
        _defaultTemplateStylesId += `-${_regParagraphStyle[1]}`;
        _defaultTemplateStyles.paragraph = _regParagraphStyle[0];
      }
      // Get the text style ID
      const _regTextStyleId = paragraphStyles.match(/text:style-name="(T[^"]*)"/);
      if (_regTextStyleId !== null && _regTextStyleId.length > 0 && _regTextStyleId[0] !== '' && _regTextStyleId[1] !== '') {
        /**
         * Get the text style Properties: Font Size, Font Family, text colors and background colors
         * Heading properties can't be retreive from the 'content.xml', it must be search inside the 'style.xml' file
         */
        const _reqTextStyle = xmlContent.match(new RegExp(`<style:style style:name="${_regTextStyleId[1]}"[^]*?style:text-properties ([^]*?)/><\/style:style>`))
        if (_reqTextStyle !== null && _reqTextStyle.length > 0 && _reqTextStyle[0] !== '' && _reqTextStyle[1] !== '') {
          _defaultTemplateStylesId += `-${_regTextStyleId[1]}`;
          _reqTextStyle[1].replace(/(style:font-name|style:font-name-complex|fo:font-size|fo:background-color|fo:color)="[^]*?"/g, function (xmlStyleProperties) {
            _defaultTemplateStyles.text += ` ${xmlStyleProperties}`;
          });
        }
      }
    }
    if (_defaultTemplateStylesId !== 'style') {
      this.addHtmlDefaultStylesDatabase(options, _defaultTemplateStylesId, _defaultTemplateStyles);
      return `('${_defaultTemplateStylesId}')`;
    }
    return '';
  },
 /**
  * Add a style object of "templateDefaultStyles" inside the "htmlStylesDatabase".
  * The "htmlStylesDatabase" is used to recreate the new XML with the default styles coming from the template
  * The "styleID" is the key passed to buildXmlContent to retreive and recreate the xml.
  *
  * @param {Object} options Main option object
  * @param {String} styleID Unique ID of the style coming from the template, it is used as a key for the htmlStylesDatabase Map
  * @param {Object} styleObject it is a "templateDefaultStyles" object with the styles for paragraph and text
  */
  addHtmlDefaultStylesDatabase : function (options, styleID, styleObject) {
    if (options && styleID && options.htmlStylesDatabase && !options.htmlStylesDatabase.has(styleID)) {
      options.htmlStylesDatabase.set(styleID, styleObject);
    }
  },
  /**
   * Return the default style object based on a styleID.
   * It is called by buildXmlContent to retreive and recreate the xml with the default styles coming from the template
   *
   * @param {Object} options Main option object
   * @param {String} styleID Unique ID of the style coming from the template, it is used as a key for the htmlStylesDatabase Map
   * @returns {Object} styleObject
   */
  getHtmlDefaultStylesDatabase : function (options, styleID = '') {
    if (!options || Object.prototype.hasOwnProperty.call(options, 'htmlStylesDatabase') === false || !styleID) {
      return this.templateDefaultStyles;
    }
    const _htmlDefaultStyles = options.htmlStylesDatabase.get(styleID);
    if (_htmlDefaultStyles && typeof _htmlDefaultStyles === 'object') {
      return _htmlDefaultStyles;
    }
    return this.templateDefaultStyles;
  },
  /**
   * Default styles retreive from a template
   * This object is replicated for each ":html" marker and it is saved inside the htmlStylesDatabase
  */
  templateDefaultStyles : {
    paragraph: '',
    text: ''
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
    var _endCommentIndex = -1;
    while (_tag !== null) {
      var _tagStr = _tag[1];
      // push non XML part
      if (_prevLastIndex < _tag.index && _endCommentIndex < _tag.index) {
        _res.push({
          content : html.convertUnsupportedXMLCharactersIntoXMLEntities(xml.slice(_endCommentIndex > _prevLastIndex ? _endCommentIndex : _prevLastIndex, _tag.index)),
          type    : '',
          tags    : _activeTags.slice()
        });
        _endCommentIndex = -1;
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
      // Comments tags
      else if (_tagOnly?.[0] === '!' && _tagOnly?.[1] === '-' && _tagOnly?.[2] === '-' ) {
        _endCommentIndex = xml.indexOf('-->', _tag.index);
        if (_endCommentIndex === -1) {
          // If the end comment tag is missing, the whole content is skipped
          _endCommentIndex = xml.length;
        } else {
          _endCommentIndex += 3;
        }
      }
      else if ( _tagOnly === 'img' ) {
        const _regRespSrc = _tagStr.match(/src="([^<">]*?)"/);
        const _regRespWidth = _tagStr.match(/width="([^<">]*?)"/);
        const _regRespHeight = _tagStr.match(/height="([^<">]*?)"/);
        if (_regRespSrc?.[1]) {
          const _urlOrBase64 = _regRespSrc?.[1];
          _res.push({
            content : '',
            type    : html.types.IMAGE,
            tags    : [],
            src     : _urlOrBase64,
            /** Get width and height as pixels */
            width   : _regRespWidth?.[1] ? parseInt(_regRespWidth?.[1]) : -1,
            height  : _regRespHeight?.[1] ? parseInt(_regRespHeight?.[1]) : -1
          });
        }
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
      else if (_tagStr[_tagStr.length - 1] !== '/' && _activeTags.includes(_tagOnly) === false) {
        _activeTags.push(_tagOnly);
      }
      _prevLastIndex = _xmlTagRegExp.lastIndex;
      _tag = _xmlTagRegExp.exec(xml);
    }

    if (_prevLastIndex < xml.length && _endCommentIndex < xml.length) {
      _res.push({
        content : html.convertUnsupportedXMLCharactersIntoXMLEntities(xml.slice(_endCommentIndex > _prevLastIndex ? _endCommentIndex : _prevLastIndex)),
        type    : '',
        tags    : []
      });
      _endCommentIndex = -1;
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
    if (typeof(htmlContent) !== 'string') {
      htmlContent = typeof htmlContent !== 'object' ? htmlContent+'' : '';
    }
    /** 1. remove new line, CRLF */
    htmlContent = htmlContent.replace(/\n|\r|\t/g, '');
    /** 2. convert HTML entities to charater */
    return htmlContent.replace(/(&[\w\d#]*;)/g, function (entity) {
      if (Object.prototype.hasOwnProperty.call(htmlEntities, entity) === true) {
        return String.fromCodePoint(htmlEntities[entity][0]);
      } else if (['&amp;', '&apos;', '&quot;', '&lt;', '&gt;'].includes(entity) === false) {
        return entity.replace(/&/g, '&amp;')
      }
      return entity;
    });
  },
  convertUnsupportedXMLCharactersIntoXMLEntities : function (content = '') {
    return content
      /** Negative lookup to do not replace & characters from HTML entities */
      .replace(/&(?![\w\d#]*;)/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
    IMAGE                : '#image#',
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
