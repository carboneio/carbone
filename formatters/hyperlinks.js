const hyperlinks = require('../lib/hyperlinks');

function addLinkDatabase (options, hyperlink) {
  if (!options.hyperlinkDatabase.has(hyperlink)) {
    // If the image doesn't exist, it create a new ID
    options.hyperlinkDatabase.set(hyperlink, {
      id : options.hyperlinkDatabase.size
    });
  }
}

function generateHyperlinkReference (hyperlink) {
  addLinkDatabase(this, hyperlink);
  return {
    fn   : generateHyperkinReferencePostProcessing,
    args : [hyperlink]
  };
}

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
