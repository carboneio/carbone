const path  = require('path');
const image = require('./image');
const color = require('./color');
const hyperlinks = require('./hyperlinks');
const html = require('./html');
const chart = require('./chart');

/** Regex to find empty table cells, a table cell properties "tcPr" can be inside a cell */
const emptyCellRegex = /(tc(Pr)?>)(<\/w:tc>)/g;

const postprocessor = {

  /**
   * Execute postprocessor on main, and embedded document
   * @param  {Object}   template
   * @param  {Function} callback
   */
  execute : function (template, data, options, callback) {
    if (template === null || template.files === undefined) {
      return callback(null, template);
    }
    // remove virtual file added by Carbone for :set formatter
    for (let j = 0; j < template.files.length; j++) {
      let _file = template.files[j];
      if (_file.name === '___CARBONE___') {
        template.files.splice(j, 1);
        break;
      }
    }

    for (var i = -1; i < template.embeddings.length; i++) {
      var _mainOrEmbeddedTemplate = template.filename;
      var _fileType = template.extension;
      if (i > -1) {
        // If the current template is an embedded file
        _mainOrEmbeddedTemplate = template.embeddings[i];
        _fileType = path.extname(_mainOrEmbeddedTemplate).toLowerCase().slice(1);
      }
      switch (_fileType) {
        case 'pptx':
          image.postProcessPPTX(template, data, options);
          try {
            chart.postProcessOffice(template, data, options);
          }
          catch (e) {
            console.log('Cannot postProcessPPTX');
          }
          break;
        case 'odp':
          color.postProcessLo(template, data, options);
        case 'odg':
          chart.postProcessLo(template, data, options);
          image.postProcessLo(template, data, options);
          break;
        case 'odt':
          color.postProcessLo(template, data, options);
          image.postProcessLo(template, data, options);
          chart.postProcessLo(template, data, options);
          html.postProcessODT(template, data, options);
          html.removeCarboneTags(template);
          break;
        case 'ods':
          color.postProcessLo(template, data, options);
          image.postProcessLo(template, data, options);
          break;
        case 'docx':
          hyperlinks.postProcessHyperlinksDocx(template, data, options);
          try {
            image.postProcessDocx(template, data, options);
            chart.postProcessOffice(template, data, options);
          }
          catch (e) {
            console.log('Cannot postProcessDocx');
          }
          html.postProcessDocx(template, data, options);
          html.removeCarboneTags(template);
          postprocessor.patchEmptyTableCells(template);
          break;
        case 'xlsx':
          image.postProcessXlsx(template, data, options);
          break;
        default:
          break;
      }
    }
    return callback(null, template);
  },

  /**
   * Called during Carbone builder process, one time per XML file
   *
   * @param  {Mixed}    data
   * @param  {Objectt}  options
   * @param  {Function} callback (err)
   * @return {[type]}            [description]
   */
  update : function (data, options, callback) {
    // manage images
    image.fetchImageDatabase(data, options, callback);
  },
  /**
   * Add an empty paragraph to table cells to make DOCX valid, otherwise MS Word throw an error "document corrupted".
   * The `drop(p)` or `:html` may remove all paragraphs from table cells if values are empty.
   * @param {Object} template template properties
   */
  patchEmptyTableCells : function (template) {
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1 || /** DOCX Templates */
           _file.name.indexOf('content.xml') !== -1)) {
        _file.data = _file.data.replace(emptyCellRegex, function (match, p1, p2, p3) {
          return p1 + '<w:p></w:p>' + p3;
        });
      }
    }
  }
};

module.exports = postprocessor;
