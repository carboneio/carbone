const parser = require('./parser');
const file = require('./file');
const debug = require('debug')('carbone:hyperlinks');

const BOOKMARK_DOCX_AUTO_UPDATE_MARKER = '{c.now:private:cumCount}';

const hyperlinks = {
  /**
   * @description correct and insert carbone markers into hyperlink attribute for ODS and ODT files.
   *
   * @param {Object} template object describing the template with an array of files and xml.
   */
  insertHyperlinksLO : function (template) {
    const _contentFileId = template.files.findIndex(x => x.name === 'content.xml');
    if (_contentFileId > -1 && !!template.files[_contentFileId] === true) {
      template.files[_contentFileId].data = template.files[_contentFileId].data.replace(/<(text|draw):a[^]*?xlink:href="([^<>"]*(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|})*?[^<>"]*?)"/g, function (xml) {
        /**
         * 1. Replace encoded characters to ascii characters. Example: %7B change to {
         * 2. Remove the content before, after and between multiple markers.
         */
        return hyperlinks.decodeMarker(xml).replace(/[^="{}]*{/g, '{').replace(/}([^<>{}"]*)/g, ':validateURL}');
      });
    }
    return template;
  },

  /**
   * @description correct and insert carbone markers into hyperlink attribute for XLSX and DOCX files.
   * @param {Object} template object describing the template with an array of files and xml.
   */
  insertHyperlinksXLSX : function (template) {
    for (let i = 0, n = template.files.length; i < n; i++) {
      const _file = template.files[i];
      if (/_rels\/sheet+\d*.xml.rels/.test(_file.name)) {
        _file.data = _file.data.replace(/Target="((http[s]?:\/\/)?[dc]\.[^"]*)"/g, function (xmlHyperlink) {
          return hyperlinks.decodeMarker(xmlHyperlink).replace(/Target="(http[s]?:\/\/)?/g, 'Target="{').replace(/\/?"$/g, ':validateURL}"');
        });
      }
    }
  },

  /**
   * Add markers to generate automatically new Ids for bookmarks
   * Remove Carbone markers in table of content and force LIbreOffice to update the Table of Content
   *
   *
   * @param  {Object} template
   * @return {Object} options  (modified)
   */
  preprocessBookmarkAndTableOfContentDocx : function (template, options) {
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        _file.data = hyperlinks.replaceBookmarkAndTableOfContentDocx(_file.data, options);
      }
    }
    return template;
  },

  /**
   * Add markers to generate automatically new Ids for bookmarks
   * Remove Carbone markers in table of content and force LIbreOffice to update the Table of Content
   *
   * @param   {String}  str      The string of XML
   * @param   {Object}  options  The options
   * @return  {String}           XML modified
   */
  replaceBookmarkAndTableOfContentDocx : function (str, options) {
    // TODO create privateMarker
    const _fieldRefs = [];
    return str
      .replace(/<w:bookmarkStart [^>]+?>/g, (bookmarkStartTag) => {
        // TODO avoid replacing Toc attribute ?
        return bookmarkStartTag
          .replace(/w:id="(\d+?)"/  , (str, id)  => {
            return `w:id="${BOOKMARK_DOCX_AUTO_UPDATE_MARKER}${id.padStart(3, '0')}"`;
          })
          .replace(/w:name="(\w+?)"/, (str, ref) => {
            _fieldRefs.push(ref);
            return `w:name="${ref}_${BOOKMARK_DOCX_AUTO_UPDATE_MARKER}"`;
          });
      })
      .replace(/<w:bookmarkEnd [^>]+?>/g, (bookmarkEndTag) => {
        return bookmarkEndTag.replace(/w:id="(\d+?)"/, (str, id) => {
          return `w:id="${BOOKMARK_DOCX_AUTO_UPDATE_MARKER}${id.padStart(3, '0')}"`;
        });
      })
      // make sure we replace reference only inside w:instrText XML tag
      .replace(/<w:instrText[\s\S]+?<\/w:instrText>/g, (automaticField) => {
        for (var j = 0; j < _fieldRefs.length; j++) {
          const _ref = _fieldRefs[j];
          automaticField = automaticField.replaceAll(_ref, `${_ref}_${BOOKMARK_DOCX_AUTO_UPDATE_MARKER}`);
        }
        return automaticField;
      })
      // find all <w:hyperlink w:anchor="_Toc118845175" w:history="1"> and delete marker inside + force hardRefresh
      .replace(/<w:hyperlink ([^>]+?)>[\s\S]+?<\/w:hyperlink>/g, (insideHyperlink, hyperlinkAttributes) => {
        const _isTableOfContentHyperlink = hyperlinkAttributes.indexOf('_Toc') !== -1;
        if (_isTableOfContentHyperlink === false) {
          return insideHyperlink;
        }
        options.hardRefresh = true;
        return insideHyperlink.replace(/(\{[^{]+?\})/g, function (m, marker) {
          return parser.isCarboneMarker(marker) === true ? marker.slice(1, -1) : marker;
        });
      });
  },

  /**
   * @description correct and insert carbone markers with post process formatters on hyperlinks attributes
   * @param {Object} template object describing the template with an array of files and xml.
   */
  preProcesstHyperlinksDocx : function (template) {
    var _hyperlinksMap = new Map();
    const _regexRels = /<Relationship[^<]*?Target="[^"]*?(%7b|%257b|%7B|%257B|{+?)([^"<>]*?)(%7d|%257d|%7D|%257D|})+?[^>]*?"\/>/g;

    for (let i = 0, n = template.files.length; i < n; i++) {
      const _file = template.files[i];

      // if markers have been inserted into the file `document.xml.rels`, it is removed and saved to be used in the `document.xml`
      if (/_rels\/document.xml.rels/.test(_file.name)) {
        _file.data = _file.data.replace(_regexRels, function (xmlHyperlink, markerStart, marker) {
          if (parser.isCarboneMarker(marker) === true) {
            xmlHyperlink = hyperlinks.decodeMarker(xmlHyperlink).replace(/[^="{}]*{/g, '{').replace(/}[^<>{}"]*/g, ':generateHyperlinkReference()}');
            const _rId = /Id="(.*?)"/g.exec(xmlHyperlink)[1];
            const _marker = /{[^{]+?\}/g.exec(xmlHyperlink)[0];
            if (_rId && _marker) {
              _hyperlinksMap.set(_rId, _marker);
              return '';
            }
            else {
              debug('PreProcess: The rId or marker is invalid on the `_rels/document.xml.rels` file');
            }
          }
          return xmlHyperlink;
        });
        break;
      }
    }

    // If hyperlinks are found, hyperlinks tags in the `document.xml` are updated with a marker + post process formatter
    // w:hyperlink = text
    // a:hlinkClick = image
    const _regexDoc = /<(w:hyperlink|a:hlinkClick)[^<>]*?r:id="([^<">]*?)"[^<>]*?[/]?>/g;
    // w:instrText = defined the type of data inserted by the field, in this case the HYPERLINK type is searched
    const _regexHead = /<w:instrText[^<>]*>\s*?HYPERLINK\s*?"([^<">]*)"\s*?<\/w:instrText>/g;
    for (let i = 0, n = template.files.length; i < n; i++) {
      const _file = template.files[i];
      if (/word\/document.xml/.test(_file.name)) {

        /** Special hyperkink inside a w:instrText tag */
        _file.data = _file.data.replace(_regexHead, function (xmlHyperLink, link) {
          if (parser.isCarboneMarker(hyperlinks.decodeMarker(link)) === true) {
            return hyperlinks.decodeMarker(xmlHyperLink);
          }
          return xmlHyperLink;
        });

        /** Normal Hyperlink */
        if (_hyperlinksMap.size > 0) {
          _file.data = _file.data.replace(_regexDoc, function (xmlHyperlink, tagType, rId) {
            const _marker = _hyperlinksMap.get(rId);
            if (_marker) {
              xmlHyperlink = xmlHyperlink.replace(/r:id=".*?"/, `r:id="${_marker}"`);
            }
            return xmlHyperlink;
          });
          break;
        }
      }
    }
  },

  /**
   * Post-processing : update DOCX hyperlinks using options.hyperlinkDatabase
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with imageDatabase
   * @return {Object}          template
   */
  postProcessHyperlinksDocx : function (template, data, options) {
    let _hasHtmlLinks = false;
    // if hyperlinkDatase is empty, post-processing isn't necessary
    if (options.hyperlinkDatabase === undefined || options.hyperlinkDatabase.size === 0) {
      return template;
    }
    let _relsFile = file.getTemplateFile(template, 'word/_rels/document.xml.rels');
    if (_relsFile === null || typeof(_relsFile.data) !== 'string' ) {
      debug('the `word/_rels/document.xml.rels` file does not exist');
      return template;
    }
    // Create the hyperlinks relations from the new rId and URL
    let _hyperlinkRels = [];
    let _hyperlinkDatabaseIt = options.hyperlinkDatabase.entries();
    let _item = _hyperlinkDatabaseIt.next();
    while (_item.done === false) {
      const _url = _item.value[0];
      const _rId = hyperlinks.getHyperlinkReferenceId(_item.value[1].id);
      if (Object.prototype.hasOwnProperty.call(_item.value[1], "fromHTML") === true && _item.value[1].fromHTML === true) {
        _hasHtmlLinks = true;
      }
      if (_url && _rId) {
        _hyperlinkRels.push(`<Relationship Id="${_rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${_url}" TargetMode="External"/>`);
      }
      else {
        debug('PostProcess: the URL or rId is invalid.');
      }
      _item = _hyperlinkDatabaseIt.next();
    }
    _relsFile.data = _relsFile.data.replace('</Relationships>', _hyperlinkRels.join('') + '</Relationships>');

    /** If the Hyperlink is coming from the HTML content, the hyperlink style should be created otherwise the link on PDF can not be clicked */
    if (_hasHtmlLinks === true) {
      let _styleFile = file.getTemplateFile(template, 'word/styles.xml');
      if (_styleFile === null || typeof(_styleFile.data) !== 'string' ) {
        debug('the `word/styles.xml` file does not exist');
        return template;
      }
      if (_styleFile.data.indexOf('w:styleId="Hyperlink"') === -1) {
        _styleFile.data = _styleFile.data.replace('</w:styles>', '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:uiPriority w:val="99"/><w:rPr><w:color w:val="0563C1" w:themeColor="hyperlink"/><w:u w:val="single"/></w:rPr></w:style></w:styles>');
      }
    }
    return template;
  },
  /**
   * Function to create a unique reference ID in 2 files: `document.xml.rels` and `document.xml`
   * @param {String} id rId of the hyperlink coming from the hyperlinkDatabase
   * @returns {String} Hyperlink reference ID
   */
  getHyperlinkReferenceId : function (id) {
    return `CarboneHyperlinkId${id}`;
  },
  decodeMarker : function (encodedMarker) {
    return encodedMarker.replace(/%7B|%257B|%7b|%257b/g, '{').replace(/%7D|%257D|%7d|%257d/g, '}').replace(/%5D|%255D|%5d|%255d/g, ']').replace(/%5B|%255B|%5b|%255b/g, '[');
  },
  validateURL : function (link, defaultUrlOnError = '') {
    let urlInfos = null;

    defaultUrlOnError = defaultUrlOnError || hyperlinks.URL_ON_ERROR;

    /** Encode the URL if it is not encoded, */
    const _decodedLink = decodeURIComponent(link);
    if (_decodedLink === link) {
      link = encodeURI(link);
    }

    /** Check if the protocol exists */
    if (/^(https?:\/\/)/.test(link) === false) {
      link = 'https://' + link;
    }

    /** Test if it contains a minimum of a domain OR ipv4 with a port, a domain extension and an optional path */
    if (/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(link) === false) {
      return defaultUrlOnError;
    }

    try {
      urlInfos = new URL(link);
    }
    catch (_) {
      return defaultUrlOnError;
    }

    /**
     * Check if the domain contains query parameters with a slash before the question mark,
     * Error example: https://carbone.io?quer=23
     * Should be: https://carbone.io/?quer=23
     * */
    let _qmarkIndex = link.indexOf('?');
    if (_qmarkIndex > 0) {
      let _hasSlash = false;
      while (_qmarkIndex > 0 && _qmarkIndex > urlInfos.origin.length - 1 &&  _hasSlash === false) {
        if (link[_qmarkIndex] === '/') {
          _hasSlash = true;
        }
        _qmarkIndex--;
      }
      if (_hasSlash === false) {
        return defaultUrlOnError;
      }
    }
    /**
     * Encode '&' character to avoid libre office crash
     * Does not encode urls with '&amp;'
     * */
    link = link.replace(/&(?!amp;)/g, () => {
      return '&amp;';
    });
    return link;
  },
  /**
   * @private
   * @description Add hyperlinks to the option.hyperlinkDatabse
   * @param {Object} options Carbone options that contains the hyperlinkDatabse
   * @param {String} hyperlink new hyperlink to insert
   */
  addLinkDatabase : function (options, hyperlink, properties = {}) {
    properties.id = options.hyperlinkDatabase.size;
    if (!options.hyperlinkDatabase.has(hyperlink)) {
      // If the image doesn't exist, it create a new ID
      options.hyperlinkDatabase.set(hyperlink, properties);
    }
    else {
      properties = options.hyperlinkDatabase.get(hyperlink);
    }
    return properties;
  },
  URL_ON_ERROR : 'https://carbone.io/documentation.html#hyperlink-validation'
};

module.exports = hyperlinks;