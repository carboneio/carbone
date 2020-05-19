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
   * @description correct and insert carbone markers with post process formatters on hyperlinks attributes
   *
   * @param {Object} template object describing the template with an array of files and xml.
   */
  preProcesstHyperlinksDocx : function (template) {
    var _hyperlinksMap = new Map();
    const _regexRels = /<Relationship[^<]*?Target="[^"]*?(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|}+?)([^"<>]*?)(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D|{|})+?[^>]*?"\/>/g;
    const _regexDoc = /<w:hyperlink r:id="([^<">]*?)">/g;

    for (let i = 0, n = template.files.length; i < n; i++) {
      const _file = template.files[i];
      if (/_rels\/document.xml.rels/.test(_file.name)) {
        _file.data = _file.data.replace(_regexRels, function (xmlHyperlink, markerStart, marker) {
          if (parser.isCarboneMarker(marker) === true) {
            xmlHyperlink = xmlHyperlink.replace(/%7B|%257B|7b|%257b/g, '{').replace(/%7D|%257D|%7d|%257d/g, '}').replace(/%5D|%255D|%5d|%255d/g, ']').replace(/%5B|%255B|%5b|%255b/g, '[')
              .replace(/[^="{}]*{/g, '{')
              .replace(/}[^<>{}"]*/g, ':generateHyperlinkReference()}');
            _hyperlinksMap.set(/Id="(.*?)"/g.exec(xmlHyperlink)[1], /{[^{]+?\}/g.exec(xmlHyperlink)[0]);
            return '';
          }
          return xmlHyperlink;
        });
        break;
      }
    }

    // If hyperlinks has been found
    // hyperlinks tags in the `document.xml` are updated with a marker + post process formatter
    if (_hyperlinksMap.size > 0) {
      for (let i = 0, n = template.files.length; i < n; i++) {
        const _file = template.files[i];
        if (/word\/document.xml/.test(_file.name)) {
          _file.data = _file.data.replace(_regexDoc, function (xmlHyperlink, rId) {
            let _marker = _hyperlinksMap.get(rId);
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
    // stop immediately if no post-processing is necessary
    if (options.hyperlinkDatabase === undefined || options.hyperlinkDatabase.size === 0) {
      return template;
    }
    let _relsFile = file.getTemplateFile(template, 'word/_rels/document.xml.rels');
    if (_relsFile === null || typeof(_relsFile.data) !== 'string' ) {
      debug('the `manifest.xml` file does not exist');
      return template;
    }
    let _hyperlinkRels = [];
    let _hyperlinkDatabaseIt = options.hyperlinkDatabase.entries();
    let _item = _hyperlinkDatabaseIt.next();
    while (_item.done === false) {
      console.log(_item.value[0], _item.value[1].id);
      let _url = _item.value[0];
      let _urlId = hyperlinks.getHyperlinkReferenceId(_item.value[1].id);
      _hyperlinkRels.push(`<Relationship Id="${_urlId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${_url}" TargetMode="External"/>`);
      _item = _hyperlinkDatabaseIt.next();
    }
    _relsFile.data = _relsFile.data.replace('</Relationships>', _hyperlinkRels.join('') + '</Relationships>');
    console.log(_relsFile.data);
    return template;
  },

  /**
   * TO TEST
   *
   * @description correct and insert carbone markers into hyperlink attribute for XLSX and DOCX files.
   * @param {Object} template object describing the template with an array of files and xml.
   */
  insertHyperlinksXLSX : function (template) {
    template.files.forEach((file, $index) => {
      if (/_rels\/sheet+\d*.xml.rels/.test(file.name)) {
        // console.log(template.files[$index].data);
        template.files[$index].data = template.files[$index].data.replace(/Target="(http[s]?:\/\/d\.[^"]*)"/g, function (xmlHyperlink) {
          return xmlHyperlink.replace(/http[s]?:\/\//g, '{').replace(/[/]?"$/g, '}"');
        });
      }
    });
  },
  getHyperlinkReferenceId : function (id) {
    return `CarboneHyperlinkId${id}`;
  }
};

module.exports = hyperlinks;