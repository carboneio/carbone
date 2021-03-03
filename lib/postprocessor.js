const path  = require('path');
const image = require('./image');
const color = require('./color');
const hyperlinks = require('./hyperlinks');
const html = require('./html');

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
    for (var i = -1; i < template.embeddings.length; i++) {
      var _mainOrEmbeddedTemplate = template.filename;
      var _fileType = template.extension;
      if (i > -1) {
        // If the current template is an embedded file
        _mainOrEmbeddedTemplate = template.embeddings[i];
        _fileType = path.extname(_mainOrEmbeddedTemplate).toLowerCase().slice(1);
      }
      switch (_fileType) {
        case 'odp':
        case 'odg':
          image.postProcessLo(template, data, options);
          break;
        case 'odt':
          color.postProcessLo(template, data, options);
          image.postProcessLo(template, data, options);
          html.postProcessODT(template, data, options);
          break;
        case 'ods':
          color.postProcessLo(template, data, options);
          image.postProcessLo(template, data, options);
          break;
        case 'docx':
          hyperlinks.postProcessHyperlinksDocx(template, data, options);
          image.postProcessDocx(template, data, options);
          html.postProcessDocx(template, data, options);
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
  }
};

module.exports = postprocessor;
