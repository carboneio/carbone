var path  = require('path');
var helper = require('./helper');
var parser = require('./parser');
var image = require('./image');
var hyperlinks = require('./hyperlinks');
var color = require('./color');
var html = require('./html');
var form = require('./form');
var file = require('./file');
var chart = require('./chart');

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
    // reversed loop, to parse embedded files before the main file (embedded xlsx -> docx) for charts
    for (var i = template.embeddings.length - 1; i > -2; i--) {
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
            break;
          case 'xlsx':
            preprocessor.removeCalcChain(template, _parentFilter);
            preprocessor.convertSharedStringToInlineString(template, _parentFilter);
            hyperlinks.insertHyperlinksXLSX(template);
            image.preProcessXLSX(template);
            break;
          case 'docx':
            preprocessor.handleHideRowFormatter(template, 'docx')
            hyperlinks.preProcesstHyperlinksDocx(template);
            color.preProcessDocx(template);
            image.preProcessDocx(template);
            chart.preProcessDocx(template, options);
            html.preProcessDocx(template, options);
            preprocessor.generateUniqueIds(template);
            break;
          case 'odt':
            preprocessor.handleHideRowFormatter(template, 'odt')
            form.preProcessODT(template);
            html.preProcessODT(template, options);
            color.preProcessLo(template, options);
            preprocessor.removeSoftPageBreak(template);
            image.preProcessLo(template);
            chart.preProcessLo(template, options);
            hyperlinks.insertHyperlinksLO(template);
            break;
          case 'ods':
            color.preProcessLo(template, options);
            preprocessor.convertNumberMarkersIntoNumericFormat(template);
            hyperlinks.insertHyperlinksLO(template);
            image.preProcessLo(template);
            break;
          default:
            break;
        }
      }
      catch (e) {
        return callback(e, template);
      }
      if (i === -1) {
        return callback(null, template);
      }
    }
  },

  handleHideRowFormatter : function (template, format) {
    let _file = null;
    let _xmlFormat = null;

    if (format === 'odt') {
      _file = file.getTemplateFile(template, 'content.xml');
      _xmlFormat = {
        start: '<table:table-row>',
        end  : '</table:table-row>'
     }
    } else if (format === 'docx') {
      _file = template.files.find(el => el.name.includes('document.xml') === true && el.name.includes('.rels') === false)
      _xmlFormat = {
        start: '<w:tr',
        end  : '</w:tr>'
      }
    }

    if (!_file || !_xmlFormat) {
      return;
    }

    const extractTableRow = (file, index, xmlFormat) => {
      /**
       * TODO: extract multiple rows
      */
      const hideRowPos = index;
      let rowStartPos = index;
      let childEndRowPosFound = [];
      let childBeginRowPosFound = [];

      while (rowStartPos >= 0) {
        rowStartPos = file.data.lastIndexOf(xmlFormat.start, rowStartPos) // E.G. Searching '<table:table-row>'
        /** Check if it is the correct row, instead of a child-table within the cell */
        let _endRowPos = file.data.indexOf(xmlFormat.end, rowStartPos); // E.G. Searching '</table:table-row>'
        if (childEndRowPosFound.includes(_endRowPos) === false && _endRowPos < hideRowPos) {
          childEndRowPosFound.push(_endRowPos);
        } else {
          break;
        }
        rowStartPos -= 1;
      }

      let rowEndPos = index;

      while (rowEndPos < file.data.length) {
        rowEndPos = file.data.indexOf(xmlFormat.end, rowEndPos) // E.G. Searching '</table:table-row>'
        /** Check if it is the correct row, instead of a child-table within the cell */
        let _beginRowPos = file.data.lastIndexOf(xmlFormat.start, rowEndPos)  // E.G. Searching '<table:table-row>'
        if (childBeginRowPosFound.includes(_beginRowPos) === false && _beginRowPos > hideRowPos) {
          childBeginRowPosFound.push(_beginRowPos);
        } else {
          rowEndPos += xmlFormat.end.length;
          break;
        }
        rowEndPos += 1;
        /** IF MULTIPLE LINES CONTINUE THE PARSING HERE */
      }

      return {
        xml: ((rowStartPos < 0 || rowEndPos < 0) ? file.data : file.data.substring(rowStartPos, rowEndPos)).replace(/{[^{]*:hideRow[^}]*}/g, ''),
        start: rowStartPos,
        end: rowEndPos
      }
    }


    /**
     * Find all hideRows, parse the marker and save positions
     */

    const _hideRowPattern = /:hideRow(\((-?[\d]*)\))?/g
    const _hideRowPos = [];

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

    if (_hideRowPos.length === 0) {
      return;
    }

    /**
     * Extract the row, extract hideRow makers and wrap the row with hideBegin/hideEnd
    */
    const _rows = [];
    for (let i = 0; i < _hideRowPos.length; i++) {
      /** Check if the row has already been extracted from the table */
      let _foundRow = _rows.find(el => el.start <= _hideRowPos[i].index && el.end >= _hideRowPos[i].index);
      if (!_foundRow) {
        /** Extract the row from the table, remove hideRow markers */
        _foundRow = extractTableRow(_file, _hideRowPos[i].index, _xmlFormat);
        _rows.push(_foundRow);
      }
      /** Wrap the row with hideBegin/hideEnd */
      _foundRow.xml = `<carbone>${_hideRowPos[i].marker}:hideBegin}</carbone>${_foundRow.xml}<carbone>${_hideRowPos[i].marker}:hideEnd}</carbone>`;
    }

    /** Inject the row into the file content */
    for (let i = 0; i < _rows.length; i++) {
      if (_rows[i].start < 0 || _rows[i].start < 0) {
        /** If the XML is not valid (missing start/end tag), the xml is not replaced */
        break;
      }
      _file.data = _file.data.substring(0, _rows[i].start) + _rows[i].xml + _file.data.substring(_rows[i].end);
    }
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
   * Generate unique id of shapes/images to avoid duplicated ids.
   * Otherwise, with shapes, it creates broken DOCX files (Libreoffice can open it, but not MS Word)
   *
   * DOCX files contains also "<mc:Fallback>" XML for older Word with an id. Do we need to change it?
   * Also, there is a "paraId": https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx/a0e7d2e2-2246-44c6-96e8-1cf009823615
   *
   * @param  {Object} template
   * @return {Object} template  (modified)
   */
  generateUniqueIds : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (_file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1)) {
        _file.data = _file.data.replace(/<wp:docPr ([^>]*)id="\d+"/g, '<wp:docPr $1id="{c.now:generateImageDocxGlobalId}"');
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

    // build a Map of cells for embedded Excel in Docx to insert markers in Docx charts
    const _embeddedXlsxCellValues = {};
    if (parentFilter?.length > 0) {
      if (!template.embeddedXlsxCellValues) {
        template.embeddedXlsxCellValues = {};
      }
      template.embeddedXlsxCellValues[parentFilter] = _embeddedXlsxCellValues;
    }
    // once shared string is found, convert files
    for (var f = 0; f < _filesToConvert.length; f++) {
      var _modifiedFile = _filesToConvert[f];
      _modifiedFile.data = preprocessor.removeRowCounterInWorksheet(
        preprocessor.convertToInlineString(_modifiedFile.data, _sharedStrings, _embeddedXlsxCellValues)
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
   * @param  {String} xml                     sheets where to insert shared strings
   * @param  {Array} sharedStrings            shared string
   * @param  {Object} embeddedXlsxCellValues  prepared object to store position of markers in sheet (B1 : {d[i].id}). Used by charts
   * @return {String}                         updated xml
   */
  convertToInlineString : function (xml, sharedStrings, embeddedXlsxCellValues = {}) {
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
        // store position of markers to inject these markers in corresponding charts because Word doesn't do this!
        var _cellId = /r="(\S+\d+)"/.exec(openTag);
        if (_cellId?.length > 0) {
          embeddedXlsxCellValues[_cellId[1]] = parser.extractMarker(_selectedSharedString).trim();
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