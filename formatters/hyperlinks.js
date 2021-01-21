const hyperlinks = require('../lib/hyperlinks');

/**
 * @private
 * @description Add hyperlinks to the option.hyperlinkDatabse
 * @param {Object} options Carbone options that contains the hyperlinkDatabse
 * @param {String} hyperlink new hyperlink to insert
 */
function addLinkDatabase (options, hyperlink) {
  if (!options.hyperlinkDatabase.has(hyperlink)) {
    // If the image doesn't exist, it create a new ID
    options.hyperlinkDatabase.set(hyperlink, {
      id : options.hyperlinkDatabase.size
    });
  }
}

/**
 * @private
 * @description Formatter used to add the hyperlink to the database and to return a post process formatter.
 * @param {String} hyperlink New hyperlink
 * @returns {Function} Post process formatter
 */
function generateHyperlinkReference (hyperlink = '') {

  /** 1 - Check if the URL is not encoded to encode, it protects Libre Office from crashing */
  const _decodedLink = decodeURIComponent(hyperlink);
  if (_decodedLink == hyperlink) {
    hyperlink = encodeURI(hyperlink)
  }
  /** 2 - Replace everytime & characters by an encoded '&amp;', it protects Libre Office from crashing */
  hyperlink = hyperlink.replace(/&/g, () => {
    return '&amp;';
  });

  /** 3 - Check the URL */
  hyperlink = hyperlinks.validateURL(hyperlink);

  addLinkDatabase(this, hyperlink);
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

module.exports = {
  generateHyperlinkReference
};
