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
var params = require('./params');

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
    const _onlySetMarkers = [];
    for (let i = 0, len = template.files.length; i < len; i++) {
      template.files[i].data = preprocessor.preParseXML(template.files[i].data, options);
      template.files[i].data = preprocessor.preParseSetFormatters(template.files[i].data, _onlySetMarkers);
    }
    // if there are some :set() markers, create an XML files and add it at the top of template.files (first file to be parsed by builder)
    if (_onlySetMarkers.length > 0) {
      template.files.unshift({
        name     : '___CARBONE___',
        data     : _onlySetMarkers.join('\n'),
        isMarked : true
      });
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
          case 'html':
            preprocessor.handleDropFormatter(template, 'html');
            color.preProcessHtmlColor(template);
            break;
          case 'pptx':
            image.preProcessPPTX(template);
            chart.preProcessOffice(template, options);
            break;
          case 'odp':
            preprocessor.handleDropFormatter(template, 'odp');
            chart.preProcessLo(template, options);
            image.preProcessLo(template);
            color.preProcessLo(template, options);
            color.preProcessLOColorFormatter(template, options);
            break;
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
            preprocessor.handleDropFormatter(template, 'docx');
            hyperlinks.preProcesstHyperlinksDocx(template);
            color.preProcessDocx(template);
            color.preProcessDocxColor(template);
            image.preProcessDocx(template);
            chart.preProcessOffice(template, options);
            html.preProcessDocx(template, options);
            hyperlinks.preprocessBookmarkAndTableOfContentDocx(template, options);
            preprocessor.generateUniqueIds(template);
            break;
          case 'odt':
            preprocessor.handleDropFormatter(template, 'odt');
            form.preProcessODT(template);
            html.preProcessODT(template, options);
            color.preProcessLo(template, options);
            color.preProcessLOColorFormatter(template, options);
            preprocessor.removeSoftPageBreak(template);
            image.preProcessLo(template);
            chart.preProcessLo(template, options);
            hyperlinks.insertHyperlinksLO(template);
            preprocessor.removeMacroLO(template, options);
            break;
          case 'ods':
            preprocessor.handleDropFormatter(template, 'ods');
            color.preProcessLo(template, options);
            preprocessor.convertNumberMarkersIntoNumericFormat(template);
            hyperlinks.insertHyperlinksLO(template);
            image.preProcessLo(template);
            preprocessor.removeMacroLO(template, options);
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

  handleDropFormatter : function (template, format) {
    let _xmlFormat = null;

    if (format === 'odt' || format === 'odp') {
      _xmlFormat = {
        row : {
          start : '<table:table-row',
          end   : '</table:table-row>'
        },
        img : {
          start : '<draw:frame',
          end   : '</draw:frame>'
        },
        p : {
          start : '<text:p',
          end   : '</text:p>'
        },
        shape : {
          start : '<draw:custom-shape',
          end   : '</draw:custom-shape>'
        },
        chart : {
          start : '<draw:frame',
          end   : '</draw:frame>'
        },
        table : {
          start : '<table:table',
          end   : '</table:table>'
        },
        h : {
          start : '<text:h',
          end   : '</text:h>'
        }
      };

      if (format === 'odp') {
        _xmlFormat.slide = {
          start : '<draw:page',
          end   : '</draw:page>'
        };
      }
    }
    else if (format === 'html') {
      _xmlFormat = {
        row : {
          start : '<tr',
          end   : '</tr>'
        },
        p : {
          start : '<p',
          end   : '</p>'
        },
        table : {
          start : '<table',
          end   : '</table>'
        }
      };
    }
    else if (format === 'ods') {
      _xmlFormat = {
        row : {
          start : '<table:table-row',
          end   : '</table:table-row>'
        },
        img : {
          start : '<draw:frame',
          end   : '</draw:frame>'
        }
      };
    }
    else if (format === 'docx') {
      _xmlFormat = {
        row : {
          start : '<w:tr',
          end   : '</w:tr>'
        },
        img : {
          start : '<w:drawing',
          end   : '</w:drawing>'
        },
        p : {
          start : '<w:p',
          end   : '</w:p>'
        },
        shape : {
          start : '<mc:AlternateContent',
          end   : '</mc:AlternateContent>'
        },
        chart : {
          start : '<w:drawing',
          end   : '</w:drawing>'
        },
        table : {
          start : '<w:tbl',
          end   : '</w:tbl>'
        }
      };
    }

    if (!_xmlFormat) {
      return;
    }

    const findPosXmlElement = (file, index, xmlFormat, options) => {
      let dropPos = index;
      let startTagPos = index;
      let childEndTagPosFound = [];
      let childStartTagPosFound = [];
      let nbrToHide = 0;
      let lastCorrectEndTagPos = -1;

      while (startTagPos >= 0) {
        startTagPos = file.data.lastIndexOf(xmlFormat.start, startTagPos); // E.G. Searching '<table:table-row>'
        /** Verifying if the starting tag is correct because tags can be similar, like DOCX documents: "<w:trP>" is similar to "<w:tr>" */
        if (startTagPos !== -1 && file.data[startTagPos + xmlFormat.start.length] !== '>' && file.data[startTagPos + xmlFormat.start.length] !== ' ') {
          startTagPos -= 1;
          continue;
        }
        /** Check if it is the correct row, instead of a child-table within the cell */
        const _endRowPos = file.data.indexOf(xmlFormat.end, startTagPos); // E.G. Searching '</table:table-row>'
        if (childEndTagPosFound.includes(_endRowPos) === false && _endRowPos < dropPos) {
          childEndTagPosFound.push(_endRowPos);
        }
        else {
          break;
        }
        startTagPos -= 1;
      }

      let endTagPos = dropPos;

      while (endTagPos < file.data.length) {
        endTagPos = file.data.indexOf(xmlFormat.end, endTagPos); // E.G. Searching '</table:table-row>'

        if (endTagPos < 0) {
          /** if the options.nbrElementsToHide is greater than the actual number of row, the lastCorrectEndTag is used */
          endTagPos = lastCorrectEndTagPos;
          break;
        }

        /** Search the starting tag */
        let _verifiedStartTagPos = endTagPos;
        while (_verifiedStartTagPos !== -1) {
          _verifiedStartTagPos = file.data.lastIndexOf(xmlFormat.start, _verifiedStartTagPos);  // E.G. Searching '<table:table-row>'
          /** check if it is the correct tag name */
          if (_verifiedStartTagPos !== -1 && file.data[_verifiedStartTagPos + xmlFormat.start.length] !== '>' && file.data[_verifiedStartTagPos + xmlFormat.start.length] !== ' ') {
            _verifiedStartTagPos -= 1;
            continue;
          }
          break;
        }

        const _beginRowPos = _verifiedStartTagPos;
        /** Check if it is the correct row, instead of a child-table within the cell */
        if (childStartTagPosFound.includes(_beginRowPos) === false && _beginRowPos > dropPos) {
          childStartTagPosFound.push(_beginRowPos);
        }
        else {
          endTagPos += xmlFormat.end.length;
          lastCorrectEndTagPos = endTagPos;
          nbrToHide += 1;
          /**
           * When using the `:drop(row, nbrElementToHide)` the dropPos index is moved to the next start tag.
           * `dropPos` is used to verify if the row start/end positions are correct
           */
          dropPos = endTagPos;

          /**
           * ~ Rare situation ~
           * When moving the "dropPos" to the first <row/p> tag,
           * The index may not be accurate because other XML tags
           * can be inserted between paragraphs or rows, such as for DOCX:
           * "</w:tr><w:bookmarkEnd w:id="0"/><w:tr>"
           * The condition verifies if the start tag is correct,
           * If not, the "dropPos" is moved to the correct start tag position.
           */
          if (file.data?.[dropPos + xmlFormat.start.length - 1] !== xmlFormat.start?.[xmlFormat.start.length - 1] &&
              file.data?.[dropPos + xmlFormat.start.length - 2] !== xmlFormat.start?.[xmlFormat.start.length - 2] &&
              file.data?.substring(dropPos, dropPos + 14)?.indexOf('w:bookmark') > -1) {
            const _correctStartTagIndex = file.data.indexOf(xmlFormat.start, dropPos);
            if (_correctStartTagIndex !== -1) {
              dropPos = _correctStartTagIndex;
            }
          }
          if (!options?.nbrElementsToHide || options?.nbrElementsToHide === nbrToHide) {
            break;
          }
        }
        endTagPos += 1;
      }

      return {
        start : startTagPos,
        end   : endTagPos
      };
    };

    /**
     * Find all drop expressions
     */
    const _dropFormatterRegex = /({[^{}]+?):(drop|keep)\(([^),]*),?([^)}]*)?\)[^)}]*}/g;

    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (format === 'html' || _file.name.indexOf('.xml') !== -1 && _file.name.indexOf('.rels') === -1 && _file.name.indexOf('Layout') === -1 && _file.name.indexOf('Master') === -1 &&
          (_file.name.indexOf('document') !== -1 || _file.name.indexOf('header') !== -1 || _file.name.indexOf('footer') !== -1 || _file.name.indexOf('content.xml') !== -1 || _file.name.indexOf('styles.xml') !== -1 )) {

        const _newMarkerPosList = [];
        const _allDropMarkers = [];
        let _totalTextRemoved = 0;
        // find all drop markers and remove them in the same time
        _file.data = _file.data.replace(_dropFormatterRegex, (markerFull, markerWithoutDrop, keepOrDrop, typeWithQuote, typeOptionWithQuote, dropIndex) => {
          // check if it starts by {d. or {c. and if it is not a binary file (security)
          if (parser.isCarboneMarker(markerFull) === false) {
            return markerFull;
          }
          const _type = (helper.removeQuote(typeWithQuote || '')).trim();
          const _typeOption = (helper.removeQuote(typeOptionWithQuote || '')).trim();
          const _options = {};
          if (_xmlFormat?.[_type] === undefined) {
            const _alternativeType = helper.findClosest(_type, _xmlFormat);
            throw Error('Unknown parameter in formatter '+keepOrDrop+'() of "'+markerFull+'". Do you mean ":'+keepOrDrop+'('+_alternativeType+')"?');
          }
          if (_type === 'row' || _type === 'p') {
            _options.nbrElementsToHide = parseInt(_typeOption) || 1;
          }
          _allDropMarkers.push({ index : (dropIndex - _totalTextRemoved), withoutDrop : markerWithoutDrop, format : _xmlFormat[_type], options : _options, hideOrShow : (keepOrDrop === 'drop' ? 'hide' : 'show') });
          _totalTextRemoved += markerFull.length;
          return '';
        });

        for (let i = 0; i < _allDropMarkers.length; i++) {
          const _marker = _allDropMarkers[i];
          /** get positions of the element to insert hideBegin/hideEnd without transforming the XML */
          const _tagPos = findPosXmlElement(_file, _marker.index, _marker.format, _marker.options);
          if (_tagPos.start < 0 || _tagPos.end < 0) {
            continue;
          }
          const _foundEndPos = _newMarkerPosList.find(el => el.pos === _tagPos.end);
          /** if marker duplicated, the marker is skipped */
          if (_foundEndPos && _foundEndPos.xml.indexOf(_marker.withoutDrop) !== -1) {
            continue;
          }
          /** if a position is already saved for the hideEnd, the marker is moved before the existing marker */
          if (_foundEndPos) {
            _foundEndPos.xml = `<carbone>${_marker.withoutDrop}:${_marker.hideOrShow}End}</carbone>` + _foundEndPos.xml;
          }
          else {
            /** Create a new end position [{pos: X, xml: '' }] */
            _newMarkerPosList.push({ pos : _tagPos.end, xml : `<carbone>${_marker.withoutDrop}:${_marker.hideOrShow}End}</carbone>` });
          }
          /** if a position is already saved for the hideBegin, the marker is moved after the existing marker */
          const _foundStartPos = _newMarkerPosList.find(el => el.pos === _tagPos.start);
          if (_foundStartPos) {
            _foundStartPos.xml += `<carbone>${_marker.withoutDrop}:${_marker.hideOrShow}Begin}</carbone>`;
          }
          else {
            _newMarkerPosList.push({ pos : _tagPos.start, xml : `<carbone>${_marker.withoutDrop}:${_marker.hideOrShow}Begin}</carbone>` });
          }
        }

        /** Reorder new markers in descending order to inject makers from the bottom of the document */
        _newMarkerPosList.sort((a, b) => b.pos - a.pos);

        /** Inject new markers at the correct position */
        for (let i = 0; i < _newMarkerPosList.length; i++) {
          _file.data = `${_file.data.substring(0, _newMarkerPosList[i].pos)}${_newMarkerPosList[i].xml}${_file.data.substring(_newMarkerPosList[i].pos)}`;
        }
      }
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
    xml = parser.removeXMLInsideMarkers(xml, options);
    // this code is not beautiful but I need to deliver rapidly and sleep
    const _indexOfOptionTag = xml?.indexOf('{o.preReleaseFeatureIn=');
    if (_indexOfOptionTag !== -1) {
      const _endOfTag = xml.indexOf('}', _indexOfOptionTag);
      const _version = parseInt(xml.slice(_indexOfOptionTag+23, _endOfTag), 10);
      if (_version >= 4009000) {
        options.preReleaseFeatureIn = _version;
      }
    }
    return xml;
  },
  /**
   * Loop through XML files to extract carbone markers which modify data object with `:set()``
   *
   * @param {Object} template
   */
  preParseSetFormatters : function (xml, onlySetMarkers) {
    const _dropFormatterRegex = /({[^{}]+?):set\(([^)]*)\)}/g;
    if (!xml || typeof xml !== 'string') {
      return xml;
    }
    return xml.replace(_dropFormatterRegex, function (marker) {
      if (parser.isCarboneMarker(marker) === true) {
        onlySetMarkers.push(marker);
        return '';
      }
      return marker;
    });
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
        _file.data = _file.data.replace(/<wp:docPr ([^>]*)id="\d+"/g, '<wp:docPr $1id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}"');
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
        const _contentAsNumber = /{[^{]+?:formatN(?:\(\s*\d*\s*\))?}/.exec(_selectedSharedString);
        if (_contentAsNumber instanceof Array && _tab.length > 0) {
          // Convert the marker into number cell type when it using the ':formatN' formatter
          _selectedSharedString = _contentAsNumber[0].replace(/:formatN(?:\(\s*\d*\s*\))?/, '');
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
        const _marker = _markers[0].replace(/:formatN(?:\(.*\))?/, '');
        xml = xml.replace(/:formatN(?:\(.*\))?/, '');
        xml = xml.replace(/office:value-type="string"/, `office:value-type="float" office:value="${_marker}"`);
        xml = xml.replace(/calcext:value-type="string"/, 'calcext:value-type="float"');
        return xml;
      });
    }
    return template;
  },
  /**
   * 
   * Deletes Macros and Scripts from ODT and ODS templates
   * 
   * @param {Object} template 
   */
  removeMacroLO : function (template) {
    if (params.securityLevel & helper.SECURITY_API_REMOVE_MACROS) {
      template.files = template.files.filter((file) => {
        /** Should we add the "Macros" folder ? can't find ODT examples */
        if (file.name.includes('manifest.xml') === true) {
          file.data = file.data.replace(/<[^<]*"((Basic|Scripts|Dialogs)[^"]*)"[^>]*>/g, function(value, scriptFilePath) {
            return '';
          })
        }
        if (file.name.startsWith('Basic') === false && 
            file.name.startsWith('Scripts') === false && 
            file.name.startsWith('Dialogs') === false &&
            file.name.includes('.bsh') === false /** BeamShell Scripts */ &&
            file.name.includes('.js') === false /** Javascript **/ &&
            file.name.includes('.py') === false /** python **/ && 
            file.data.includes('script:module') === false /** Basic code only run into `<script:module>` tags */ && 
            file.data.includes('g_exportedScripts') === false /** export function in python */ &&
            file.data.includes('import uno') === false /** import function in python */ &&
            file.data.includes('importClass') === false /** import module in javascript */) {
          return true;
        }
      })
    }
  },

};





module.exports = preprocessor;