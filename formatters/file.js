

/**
 * Merge an external file inside the generated the document
 *
 * Current limitation:
 *
 * Only external PDF files can be added at the end of the current generated document.
 * If the generated file is not a PDF, the command is ignored.
 *
 * @version 4.22.0
 *
 * @param  {String}  urlOrBase64  And external link to the PDF
 * @param  {String}  where        Only two values are accepted:
 *                                  - "end":    add the external PDF at the end of this document (default)
 *                                  - "begin":  add the external PDF at the beginning of this document
 * @return {String}               This tags prints nothing
 */
function appendFile (urlOrBase64, where = 'end') {
  if (!urlOrBase64) {
    return '';
  }
  this.fileDatabase.set(urlOrBase64, {
    id       : this.fileDatabase.size,
    position : (where === 'begin' ? 'begin' : 'end')
  });
  return '';
}

// Potential new function in the future:
//
// - appendTemplate(idTemplate, begin/end, d.data.id, c.complement) -> render the template and append it like new PDF pages (~ appendFile)
// - mergeTemplate(idTemplate, d.data.id, c.complement)             -> inject the text of the template inside this template
// - updateSVG                  : update the internal SVG
// - setPDFOption(options)      : modify export PDF options (instead of using the API)


module.exports = {
  appendFile
};

