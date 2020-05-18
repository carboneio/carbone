const hyperlinks = {
  /**
   * TO TEST
   *
   * @description correct and insert carbone markers into hyperlink attribute for ODS and ODT files.
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
   * TO TEST
   *
   * @description correct and insert carbone markers into hyperlink attribute for XLSX and DOCX files.
   * @param {Object} template object describing the template with an array of files and xml.
   */
  insertHyperlinksDOCX : function (template) {
    template.files.forEach((file, $index) => {
      // /_rels\/(sheet|document)+\d*.xml.rels/
      if (/_rels\/document.xml.rels/.test(file.name)) {
        template.files[$index].data = template.files[$index].data.replace(/<Relationship .*Target=".*(%7b|%7d|%257b|%257d|%7B|%7D|%257B|%257D)+.*"\/>/g, function (xmlHyperlink) {
          return xmlHyperlink
            .replace(/%7B|%257B|7b|%257b/g, '{').replace(/%7D|%257D|%7d|%257d/g, '}').replace(/%5D|%255D|%5d|%255d/g, ']').replace(/%5B|%255B|%5b|%255b/g, '[')
            .replace(/[^="{}]*{/g, '{')
            .replace(/}([^<>{}"]*)/g, '}');
        });
      }
    });
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
  }
};

module.exports = hyperlinks;