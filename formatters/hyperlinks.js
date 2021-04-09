const hyperlinks = require('../lib/hyperlinks');

/**
 * @private
 * @description Formatter used to add the hyperlink to the database and to return a post process formatter.
 * @param {String} hyperlink New hyperlink
 * @returns {Function} Post process formatter
 */
function generateHyperlinkReference (hyperlink = '') {
  /** Check the URL */
  hyperlink = hyperlinks.validateURL(hyperlink, this.defaultUrlOnError, 'docx');
  hyperlinks.addLinkDatabase(this, hyperlink);
  return {
    fn   : generateHyperkinReferencePostProcessing,
    args : [hyperlink]
  };
}

/**
 * @private
 * @description Post process formatter used to insert the new hyperlink ID
 * @param {String} hyperlink
 * @returns {String} new hyperlink ID
 */
function generateHyperkinReferencePostProcessing (hyperlink) {
  const _hyperlinkProperties = this.hyperlinkDatabase.get(hyperlink);
  if (_hyperlinkProperties) {
    return hyperlinks.getHyperlinkReferenceId(_hyperlinkProperties.id);
  }
  return '';
}


/**
 * Validate and correct dynamic hyperlinks, or return a carbone URL with a special error URL
 *
 * @private
 * @param {String} hyperlink
 */
function validateURL (hyperlink = '') {
  return hyperlinks.validateURL(hyperlink, this.defaultUrlOnError);
}

/**
 * Replace the default value hyperlinks.URL_ON_ERROR when dynamic hyperlinks are injected into a report.
 * If the `newDefaultUrlOnError` argument is invalid, it is replaced by the default hyperlinks.URL_ON_ERROR.
 *
 * @private
 * @param {String} content Main content coming from the marker.
 * @param {String} newDefaultUrlOnError new URL replacing the hyperlinks.URL_ON_ERROR
 * @returns {String} the content
 */
function defaultURL (content, newDefaultUrlOnError = '') {
  this.defaultUrlOnError = hyperlinks.validateURL(newDefaultUrlOnError);
  return content;
}

module.exports = {
  generateHyperlinkReference,
  validateURL,
  defaultURL
};
