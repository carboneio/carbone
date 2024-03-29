

/**
 * Append an external file inside the generated the document
 *
 * Current limitation:
 *
 * Only PDF files can be added at the end of the current generated document.
 * If the generated file is not a PDF, the command is ignored.
 *
 * Carbone will return an error and will not generate the report in the following scenarios:
 *   - If the provided URL returns an error (2 retries for Carbone Cloud).
 *   - If the downloaded document is not recognized as a valid PDF.
 *   - If more than 20 files are to be downloaded (On-Premise parameter: `maxDownloadFileCount`)
 *   - If the total size of all downloaded files exceeds 10 MB (On-Premise parameter: `maxDownloadFileSizeTotal`).
 * Carbone will ignore the formatter and proceed to generate the report in the following cases:
 *   - If the provided URL is null, undefined, or an empty string.
 *   - If the final report is not in PDF format
 *
 * @version 4.22.0
 *
 * @param  {String}  urlOrBase64  And external link to the PDF
 * @return {String}               This tags prints nothing
 */
function appendFile (urlOrBase64, where = 'end' /* not implemented yet */ ) {
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

