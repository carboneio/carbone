const parser = require('./parser');
const file = require('./file');
const debug = require('debug')('carbone:hyperlinks');

const hyperlinks = {
  /**
   * @description correct and insert carbone markers into hyperlink attribute for ODS and ODT files.
   *
   * @param {Object} template object describing the template with an array of files and xml.
   */
  insertHyperlinksLO : function (template) {
    const _contentFileId = template.files.findIndex(x => x.name === 'content.xml');
    if (_contentFileId > -1 && !!template.files[_contentFileId] === true) {
      template.files[_contentFileId].data = template.files[_contentFileId].data.replace(/xlink:href="[^<>"]*(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|})*[^<>"]*"/g, function (attributeXlinkHref) {
        /**
         * 1. Replace encoded characters to ascii characters. Example: %7B change to {
         * 2. Remove the content before, after and between multiple markers.
         */
        return attributeXlinkHref
          .replace(/%7B|%257B|7b|%257b/g, '{').replace(/%7D|%257D|%7d|%257d/g, '}').replace(/%5D|%255D|%5d|%255d/g, ']').replace(/%5B|%255B|%5b|%255b/g, '[')
          .replace(/[^="{}]*{/g, '{')
          .replace(/}([^<>{}"]*)/g, '}');
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
        _file.data = _file.data.replace(/Target="(http[s]?:\/\/d\.[^"]*)"/g, function (xmlHyperlink) {
          return xmlHyperlink.replace(/http[s]?:\/\//g, '{').replace(/\/?"$/g, '}"');
        });
      }
    }
  },

  /**
   * @description correct and insert carbone markers with post process formatters on hyperlinks attributes
   * @param {Object} template object describing the template with an array of files and xml.
   */
  preProcesstHyperlinksDocx : function (template) {
    var _hyperlinksMap = new Map();
    const _regexRels = /<Relationship[^<]*?Target="[^"]*?(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|}+?)([^"<>]*?)(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|})+?[^>]*?"\/>/g;

    for (let i = 0, n = template.files.length; i < n; i++) {
      const _file = template.files[i];

      // if markers have been inserted into the file `document.xml.rels`, it is removed and saved to be used in the `document.xml`
      if (/_rels\/document.xml.rels/.test(_file.name)) {
        _file.data = _file.data.replace(_regexRels, function (xmlHyperlink, markerStart, marker) {
          if (parser.isCarboneMarker(marker) === true) {
            xmlHyperlink = xmlHyperlink.replace(/%7B|%257B|7b|%257b/g, '{').replace(/%7D|%257D|%7d|%257d/g, '}').replace(/%5D|%255D|%5d|%255d/g, ']').replace(/%5B|%255B|%5b|%255b/g, '[')
              .replace(/[^="{}]*{/g, '{')
              .replace(/}[^<>{}"]*/g, ':generateHyperlinkReference()}');
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
    if (_hyperlinksMap.size > 0) {
      // w:hyperlink = text
      // a:hlinkClick = image
      const _regexDoc = /<(w:hyperlink|a:hlinkClick)[^<>]*?r:id="([^<">]*?)"[/]?>/g;
      for (let i = 0, n = template.files.length; i < n; i++) {
        const _file = template.files[i];
        if (/word\/document.xml/.test(_file.name)) {
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
      if (_url && _rId) {
        _hyperlinkRels.push(`<Relationship Id="${_rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${_url}" TargetMode="External"/>`);
      }
      else {
        debug('PostProcess: the URL or rId is invalid.');
      }
      _item = _hyperlinkDatabaseIt.next();
    }
    _relsFile.data = _relsFile.data.replace('</Relationships>', _hyperlinkRels.join('') + '</Relationships>');
    return template;
  },
  /**
   * Function to create a unique reference ID in 2 files: `document.xml.rels` and `document.xml`
   * @param {String} id rId of the hyperlink coming from the hyperlinkDatabase
   * @returns {String} Hyperlink reference ID
   */
  getHyperlinkReferenceId : function (id) {
    return `CarboneHyperlinkId${id}`;
  }
};

module.exports = hyperlinks;