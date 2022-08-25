var path  = require('path');
var helper = require('./helper');
var parser = require('./parser');
var image = require('./image');
var hyperlinks = require('./hyperlinks');
var color = require('./color');
var html = require('./html');
var form = require('./form');
var file = require('./file');

var preprocessor = {

  /**
   * Execute preprocessor on main, and embedded document
   * @param  {Object}   template
   * @param  {Function} callback
   */
  execute : function (template, options, callback) {
    if (!(callback instanceof Function)) {
      callback = options;
      options = {};
    }
    if (template === null || template.files === undefined) {
      return callback(null, template);
    }
    for (let i = 0, len = template.files.length; i < len; i++) {
      template.files[i].data = preprocessor.preParseXML(template.files[i].data, options);
    }
    for (var i = -1; i < template.embeddings.length; i++) {
      var _mainOrEmbeddedTemplate = template.filename;
      var _parentFilter = '';
      var _fileType = template.extension;
      if (i > -1) {
        // If the current template is an embedded file
        _mainOrEmbeddedTemplate = _parentFilter = template.embeddings[i];
        _fileType = path.extname(_mainOrEmbeddedTemplate).toLowerCase().slice(1);
      }
      try {
        switch (_fileType) {
          case 'odp':
          case 'odg':
            image.preProcessLo(template);
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
          case 'xlsx':
            preprocessor.removeCalcChain(template, _parentFilter);
            preprocessor.convertSharedStringToInlineString(template, _parentFilter);
            hyperlinks.insertHyperlinksXLSX(template);
            image.preProcessXLSX(template);
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
          case 'docx':
            hyperlinks.preProcesstHyperlinksDocx(template);
            color.preProcessDocx(template);
            image.preProcessDocx(template);
            html.preProcessDocx(template, options);
            // TODO image prepararion
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
          case 'odt':
            preprocessor.handleHideRowFormatter(template)
            form.preProcessODT(template);
            html.preProcessODT(template, options);
            color.preProcessLo(template, options);
            preprocessor.removeSoftPageBreak(template);
            image.preProcessLo(template);
            hyperlinks.insertHyperlinksLO(template);
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
          case 'ods':
            color.preProcessLo(template, options);
            preprocessor.convertNumberMarkersIntoNumericFormat(template);
            hyperlinks.insertHyperlinksLO(template);
            image.preProcessLo(template);
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
          default:
            if (i === template.embeddings.length - 1) {
              return callback(null, template);
            }
            break;
        }
      }
      catch (e) {
        return callback(e, template);
      }
    }
  },

  handleHideRowFormatter : function (template) {
    const _file = file.getTemplateFile(template, 'content.xml');
    if (!_file) {
      return;
    }

    /**
     * [x] Récupérer le marker (début/fin)
     * [x] Trouver le début de la ligne du tableau
     * [x] Trouver la fin de la ligne du tableau
     * [ ] Positionner les nouveaux marker hideBegin/hideEnd
     */

    const injectHideFormattersVersion1 = (file, index) => {
      let markerBegin = '';
      let markerBeginPos = -1;
      let markerEndPos = -1;

      for (let i = index - 1; i > 0; i--) {
        const _char = file.data[i];
        if (markerBeginPos === -1) {
          markerBegin = _char + markerBegin;
          if (_char === '{') {
            markerBeginPos = i;
            break;
          }
        }
      }
      for (let i = index; i < file.data.length; i++) {
        const _char = file.data[i];
        if (_char === '}') {
          markerEndPos = i;
          break;
        }
      }

      /** Remove the elements */
      file.data = file.data.slice(0, markerBeginPos) + file.data.slice(markerEndPos + 1);
      // console.log(file.data);

      const rowBeginPos = file.data.lastIndexOf('<table:table-row>', markerBeginPos)
      const rowEndPos = file.data.indexOf('</table:table-row>', index) + '</table:table-row>'.length;
      console.log(rowBeginPos, rowEndPos, `${markerBegin}:hideBegin}`, `${markerBegin}:hideEnd}`);

      file.data = `${file.data.slice(0, rowEndPos)}<carbone>${markerBegin}:hideEnd}</carbone>${file.data.slice(rowEndPos)}`
      file.data = `${file.data.slice(0, rowBeginPos)}<carbone>${markerBegin}:hideBegin}</carbone>${file.data.slice(rowBeginPos)}`
      console.log(file.data);
    }

    const extractTableRow = (file, index) => {
      /**
       * [ ] Extract the row
       * [ ] Remove the marker and inject it around the row
       * [ ] Bonus: extract multiple rows
      */

      const hideRowPos = index;
      let rowStartPos = index;

      while (rowStartPos >= 0) {
        rowStartPos = file.data.lastIndexOf('<table:table-row>', rowStartPos)
        if (file.data.indexOf('</table:table-row>', rowStartPos) > hideRowPos) {
          // POSITION FOUND
          break;
        }
        rowStartPos -= 1;
      }

      let rowEndPos = index;

      while (rowStartPos < file.data.length) {
        rowEndPos = file.data.indexOf('</table:table-row>', rowEndPos)
        if (file.data.lastIndexOf('<table:table-row>', rowStartPos) < hideRowPos) {
          // POSITION FOUND
          rowEndPos += 18;
          break;
        }
        rowStartPos += 1;
        /** IF MULTIPLE LINES CONTINUE THE PARSING HERE */
      }

      /** Check if -1 */
      return {
        xml: file.data.substring(rowStartPos, rowEndPos),
        start: rowStartPos,
        end: rowEndPos,
        markers: []
      }
    }

    const _hideRowPattern = /:hideRow(\((-?[\d]*)\))?/g
    const _hideRowPos = [];
    console.log(_file);
    while ((res = _hideRowPattern.exec(_file.data)) !== null) {
      let _marker = '';
      for (let i = res?.index - 1; i > 0; i--) {
        _marker = _file.data[i] + _marker;
        if (_file.data[i] === '{') {
          break;
        }
      }
      _hideRowPos.unshift({
        index    : res?.index,
        nbrRows  : res?.[2] ?? 1,
        marker   : _marker,
        processed: false
      })
    }
    // console.log(_hideRowPos);
    const _rows = [];

    for (let i = 0; i < _hideRowPos.length; i++) {
      console.log(_rows, _hideRowPos[i].index);
      const _foundRow = _rows.findIndex(el => el.start > _hideRowPos[i].index && el.end < _hideRowPos[i].index);
      console.log("Found row:",_foundRow);
      if (_foundRow !== -1) {

        _foundRow.markers.push(i);
        continue;
      }
      _rows.push(extractTableRow(_file, _hideRowPos[i].index))
      _rows[_rows.length - 1].markers.push(i)
    }

    console.log(_rows);
  },

  /**
   * Loop through XML files to clean tags inside markers and to translate
   *
   * @param {Object} template
   */
  preParseXML : function (xml, options) {
    // find translation markers {t()} and translate before other processing
    xml = parser.translate(xml, options);
    // Remove XML tags inside markers
    xml = parser.removeXMLInsideMarkers(xml);
    return xml;
  },
  /**
   * Remove soft page break in ODT document as we modify them
   *
   * Search title "text:use-soft-page-breaks" in
   * http://docs.oasis-open.org/office/v1.2/os/OpenDocument-v1.2-os-part1.html#__RefHeading__1415190_253892949
   *
   * TODO: Should we do it in Word?
   *
   * @param  {Object} template (modified)
   * @return {Object}          template
   */
  removeSoftPageBreak : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (/content\.xml$/.test(_file.name) === true) {
        _file.data = _file.data
          .replace(/text:use-soft-page-breaks="true"/g, '')
          .replace(/<text:soft-page-break\/>/g, '')
          .replace(/<text:soft-page-break><\/text:soft-page-break>/g, '');
        return template;
      }
    }
    return template;
  },

  /**
   * [XLSX] Convert shared string to inline string in Excel format in order to be compatible with Carbone algorithm
   * @param  {Object} template     (modified)
   * @param  {String} parentFilter apply the transformation on a specific embedded file
   * @return {Object}              the modified template
   */
  convertSharedStringToInlineString : function (template, parentFilter) {
    var _sharedStrings = [];
    var _filesToConvert = [];
    var _sharedStringIndex = -1;
    // parse all files and find shared strings first
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (_file.parent === parentFilter) {
        if (/sharedStrings\.xml$/.test(_file.name) === true) {
          _sharedStringIndex = i;
          _sharedStrings = preprocessor.readSharedString(_file.data);
        }
        else if (/\.xml$/.test(_file.name) === true) {
          if (_file.name.indexOf('sheet') !== -1) {
            _filesToConvert.push(_file);
          }
        }
      }
    }
    preprocessor.removeOneFile(template, _sharedStringIndex, parentFilter);
    // once shared string is found, convert files
    for (var f = 0; f < _filesToConvert.length; f++) {
      var _modifiedFile = _filesToConvert[f];
      _modifiedFile.data = preprocessor.removeRowCounterInWorksheet(
        preprocessor.convertToInlineString(_modifiedFile.data, _sharedStrings)
      );
    }
    return template;
  },

  /**
   * Removes uselss calc chain file.
   *
   * https://docs.microsoft.com/en-us/office/open-xml/working-with-the-calculation-chain
   *
   * This file is a sort of "cache" for Excel. The Calculation Chain part specifies the order in
   * which cells in the workbook were last calculated.
   *
   * As Carbone will modify the Excel file, this file may become incorrect.
   * We can safely remove this file to force Excel to recompute this file on opening.
   *
   * It removes the "alert" when opening the generated report with Excel
   *
   * @param      {<type>}  template      The template
   * @param      {<type>}  parentFilter  The parent filter
   * @return     {<type>}  { description_of_the_return_value }
   */
  removeCalcChain : function (template, parentFilter) {
    // parse all files and find shared strings first
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (_file.parent === parentFilter && /xl\/calcChain\.xml$/.test(_file.name) === true) {
        preprocessor.removeOneFile(template, i, parentFilter);
        break;
      }
    }
    return template;
  },

  /**
   * [XLSX] Remove one file in the template and its relations
   * @param  {Object} template
   * @param  {Integer} indexOfFileToRemove index of the file to remove
   * @param  {String} parentFilter         filter to modify only an embedded document
   * @return {}                            it modifies the template directly
   */
  removeOneFile : function (template, indexOfFileToRemove, parentFilter) {
    if (indexOfFileToRemove < 0 || indexOfFileToRemove >= template.files.length) {
      return;
    }
    var _fileToRemove = template.files[indexOfFileToRemove];
    var _dirname  = path.dirname(_fileToRemove.name);
    var _basename = path.basename(_fileToRemove.name);
    template.files.splice(indexOfFileToRemove, 1);
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      if (_file.parent === parentFilter) {
        // remove relations
        if (_dirname + '/_rels/workbook.xml.rels' === _file.name) {
          var _regExp = new RegExp('<Relationship [^>]*Target="' + helper.regexEscape(_basename) + '"[^>]*/>');
          _file.data = _file.data.replace(_regExp, '');
        }
      }
    }
  },

  /**
   * [XLSX] Parse and generate an array of shared string
   * @param  {String} sharedStringXml shared string content
   * @return {Array}                  array
   */
  readSharedString : function (sharedStringXml) {
    var _sharedStrings = [];
    if (sharedStringXml === null || sharedStringXml === undefined) {
      return _sharedStrings;
    }
    var _tagRegex = new RegExp('<si>(.+?)</si>','g');
    var _tag = _tagRegex.exec(sharedStringXml);
    while (_tag !== null) {
      _sharedStrings.push(_tag[1]);
      _tag = _tagRegex.exec(sharedStringXml);
    }
    return _sharedStrings;
  },

  /**
   * [XLSX] Inject shared string in sheets
   * @param  {String} xml           sheets where to insert shared strings
   * @param  {Array} sharedStrings  shared string
   * @return {String}               updated xml
   */
  convertToInlineString : function (xml, sharedStrings) {
    if (typeof(xml) !== 'string') {
      return xml;
    }
    // find all tags which have attribute t="s" (type = shared string)
    var _inlinedXml = xml.replace(/(<(\w)[^>]*t="s"[^>]*>)(.*?)(<\/\2>)/g, function (m, openTag, tagName, content, closeTag) {
      var _newXml = '';
      // get the index of shared string
      var _tab = /<v>(\d+?)<\/v>/.exec(content);
      if (_tab instanceof Array && _tab.length > 0) {
        // replace the index by the string
        var _sharedStringIndex = parseInt(_tab[1], 10);
        var _selectedSharedString = sharedStrings[_sharedStringIndex];
        const _contentAsNumber = /{[d|c][.].*:formatN\(.*\)}/.exec(_selectedSharedString);
        if (_contentAsNumber instanceof Array && _tab.length > 0) {
          // Convert the marker into number cell type when it using the ':formatN' formatter
          _selectedSharedString = _contentAsNumber[0].replace(/:formatN\(.*\)/, '');
          _newXml = openTag.replace('t="s"', 't="n"');
          _newXml += '<v>' + _selectedSharedString + '</v>';
        }
        else {
          // change type of tag to "inline string"
          _newXml = openTag.replace('t="s"', 't="inlineStr"');
          _newXml += '<is>' + _selectedSharedString + '</is>';
        }
        _newXml += closeTag;
        return _newXml;
      }
      // if something goes wrong, do nothing
      return m;
    });
    return _inlinedXml;
  },

  /**
   * [XLSX] Remove row and column counter (r=1, c=A1) in sheet (should be added in post-processing)
   * Carbone Engine cannot update these counter itself
   * @param  {String} xml sheet
   * @return {String}     sheet updated
   */
  removeRowCounterInWorksheet : function (xml) {
    if (typeof(xml) !== 'string') {
      return xml;
    }
    return xml.replace(/<(?:c|row)[^>]*\s(r="\S+")[^>]*>/g, function (m, rowValue) {
      return m.replace(rowValue, '');
    }).replace(/<(?:c|row)[^>]*(spans="\S+")[^>]*>/g, function (m, rowValue) {
      return m.replace(rowValue, '');
    });
  },

  /**
   * @description [ODS] convert number markers with the `formatN()` formatter into numeric format
   *
   * @param {Object} template
   * @return
   */
  convertNumberMarkersIntoNumericFormat : function (template) {
    const _contentFileId = template.files.findIndex(x => x.name === 'content.xml');
    if (_contentFileId > -1 && !!template.files[_contentFileId] === true) {
      template.files[_contentFileId].data = template.files[_contentFileId].data.replace(/<table:table-cell[^<]*>\s*<text:p>[^<]*formatN[^<]*<\/text:p>\s*<\/table:table-cell>/g, function (xml) {
        const _markers = xml.match(/(\{[^{]+?\})/g);
        // we cannot convert to number of there are multiple markers in the same cell
        if (_markers.length !== 1) {
          return xml;
        }
        const _marker = _markers[0].replace(/:formatN\(.*\)/, '');
        xml = xml.replace(/:formatN\(.*\)/, '');
        xml = xml.replace(/office:value-type="string"/, `office:value-type="float" office:value="${_marker}"`);
        xml = xml.replace(/calcext:value-type="string"/, 'calcext:value-type="float"');
        return xml;
      });
    }
    return template;
  }
};





module.exports = preprocessor;