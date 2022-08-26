const parser  = require('./parser');
const file    = require('./file');
const image   = require('./image');
const path    = require('path');

const XML_TAG_END = [' ', '>'];
const TEMP_MARKER_CHART = 'CARBONE_REPLACE_BY_';
const TEMP_MARKER_TOTAL_COUNT = TEMP_MARKER_CHART+'T';
const TEMP_MARKER_ROW_COUNT = TEMP_MARKER_CHART+'R';

/**
 * [ODT preprocessing] inject markers in chart coming from "bindChart"
 * This is a state machine, executed by the function executeStateMachine (see function doc below)
 */
const bindMarkerODT = {
  main        : { '<office:chart' : () => 'inChart'       },
  inChart     : { '<table:table' : () => 'inTable'        },
  inTable     : { '<table:table-row' : () => 'inTableRow' },
  inTableRow  : { '</table:table-row' : () => 'inTable',  '<table:table-cell' : () => 'inTableCell' },
  inTableCell : {
    ' office:value="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      // get value in chart
      const _value  = getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      // replace the value by the marker, which matches with this value (bindChart)
      const _marker = ctx.boundValues.get(_value);
      ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      return 'inTableCell';
    },
    '</table:table-cell' : () => 'inTableRow', // leave a table cell
    '<text:p'            : () => 'inText'
  },
  inText : {
    '</text:p' : (ctx, posEndOfLastTag, pos) => {
      // replace also the value by the marker here
      const _value  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      const _marker = ctx.boundValues.get(_value.trim());
      ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      return 'inTableCell';
    },
  }
};

/**
 * [ODT preprocessing] inject chart XML directly in main content.xml.
 * This is a state machine, executed by the function executeStateMachine (see function doc below)
 */
const injectChartInMainContentODT = {
  main : {
    '<draw:frame' : () => 'inChart'
  },
  inChart : {
    '</draw:frame' : () => {
      return 'main';
    },
    ' draw:name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      // Be careful, draw:frame can contain images with draw:name attribute.
      // So we do nothing here, except keeping the position of this attribute, to inject carbone data later when we enter in <draw:object
      ctx.posEndDrawName = posEnd;
      return 'inChart';
    },
    // TODO should we detect text:anchor-type="as-char" to tell the user to change the anchor of the chart?
    '<draw:object' : (ctx, posEndOfLastTag) => {
      // add carbone data in draw:name= attributed, detected earlier
      getValueFromAttributeAndConcat(ctx, 0, 0, ctx.posEndDrawName);
      ctx.xmlOut += 'carbone-chart-{c.now:generateOpenDocumentUniqueNumber}';
      // Now add XML and enter in draw:object
      ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, posEndOfLastTag);
      ctx.lastPos = posEndOfLastTag;
      return 'inDrawObject';
    }
  },
  inDrawObject : {
    ' xlink:href="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
      const _value               = ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
      const _chartId             = _value.slice(2);
      const _chartObj            = ctx.options.chartDatabase.get(_chartId);
      if (!_chartObj) {
        return 'inChart';
      }
      const _endOfDrawObjectXML  = ctx.xmlIn.indexOf('/>', posEnd) + 2;
      const _startDrawObjectXML  = ctx.xmlIn.slice(ctx.lastPos, posEnd);
      const _endDrawObjectXML    = ctx.xmlIn.slice(_endOfAttributeValue, _endOfDrawObjectXML);
      _chartObj.postInsert = (newChartRef) => {
        return _startDrawObjectXML + './' + newChartRef  + _endDrawObjectXML;
      };
      ctx.lastPos = _endOfDrawObjectXML;
      ctx.isFullyExecuted = true;
      ctx.xmlOut += `<CARBONE_FILE id="${_chartId}">${_chartObj.template}</CARBONE_FILE>`;
      return 'inChart';
    },
  }
};

/**
 * [DOCX preprocessing] inject markers in charts coming from bindChart or embedded XLSX (priority on XLSX)
 * This is a state machine, executed by the function executeStateMachine (see function doc below)
 */
const bindMarkerDOCX = {
  main : {
    '<c:plotArea'     : () => 'inPlotArea',
    '<c:externalData' : (ctx, posEndOfLastTag, pos) => {
      ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, pos);
      return 'inExternalData';
    }
  },
  inExternalData : {
    '</c:externalData' : (ctx, posEndOfLastTag, pos, posEnd) => {
      ctx.lastPos = posEnd+1;
      return 'main';
    }
  },
  inPlotArea : {
    '</c:plotArea' : () => 'main',
    '<c:ser'       : () => 'inSerie'
  },
  inSerie : {
    '</c:ser' : () => 'inPlotArea', // state machine should be simpler to write: if "<c:ser" put exit tag automatically if we enter in a state different frop himself
    '<c:cat'  : () => 'inCategory',
    '<c:val'  : () => 'inValues'
  },
  inCategory : {
    '</c:cat'    : () => 'inSerie',
    '<c:ptCount' : () => 'inPtCount',
    '<c:pt'      : () => 'inPt'
  },
  inPtCount : {
    ' val="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      ctx.xmlOut  += TEMP_MARKER_TOTAL_COUNT;
      return 'inCategory';
    }
  },
  inPt : {
    '</c:pt' : () => 'inCategory',
    '<c:v'   : () => 'inPtValue',
    ' idx="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      ctx.currentRow = parseInt(getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd), 10);
      ctx.xmlOut  += TEMP_MARKER_ROW_COUNT;
      return 'inPt';
    }
  },
  inPtValue : {
    '</c:v' : (ctx, posEndOfLastTag, pos) => {
      const _marker  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      ctx.rowMarkers[ctx.currentRow] = _marker;
      ctx.xmlOut += _marker;
      return 'inPt';
    }
  },
  inValues : {
    '</c:val'    : () => 'inSerie',
    '<c:f'       : () => 'inCellPointer',
    '<c:ptCount' : () => 'inPtCountInValue',
    '<c:pt'      : () => 'inPointInValue'
  },
  inCellPointer : {
    '</c:f' : (ctx, posEndOfLastTag, pos) => {
      const _cellId  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      ctx.currentCellRangeObj = chart.parseSpreadSheetRange(_cellId);
      ctx.xmlOut += _cellId;
      return 'inValues';
    }
  },
  inPtCountInValue : {
    ' val="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      ctx.xmlOut  += TEMP_MARKER_TOTAL_COUNT;
      return 'inValues';
    }
  },
  inPointInValue : {
    '</c:pt' : () => 'inValues',
    '<c:v'   : () => 'inValue',
    ' idx="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      ctx.currentRow = parseInt(getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd), 10);
      ctx.xmlOut  += TEMP_MARKER_ROW_COUNT;
      return 'inPointInValue';
    }
  },
  inValue : {
    '</c:v' : (ctx, posEndOfLastTag, pos) => {
      const _value  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      // we read value directly from XLSX because Word convert markers (string) to "0" (integer) in the chart
      const _markerFromXLSX = chart.getValueFromCell(ctx.currentCellRangeObj, ctx.xlsxCells, ctx.currentRow);
      const _markerFromBind = ctx.boundValues.get(_value) ?? ctx.boundValues.get(parseFloat(_value)+'');
      ctx.xmlOut += _markerFromXLSX ?? _markerFromBind ?? _value;
      ctx.isFullyExecuted = true;
      return 'inValues';
    }
  }
};

/**
 * [DOCX preprocessing] inject chart XML directly in main document.xml.
 * This is a state machine, executed by the function executeStateMachine (see function doc below)
 */
const injectChartInMainDocumentDOCX = {
  main : {
    '<w:drawing' : () => 'inDrawing'
  },
  inDrawing : {
    '<wp:docPr' : () => 'inDocPr',
    '<c:chart'  : (ctx, posEndOfLastTag, pos) => {
      ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, pos);
      ctx.lastPos = pos;
      return 'inChart';
    },
  },
  inDocPr : {
    ' id="' : () => {
      // Do we need to generate a unique chart id? Docx seems to accept duplicated chart id
      return 'inDocPr';
    },
    ' name="' : () => {
      // Do we need to generate a unique chart name? Docx seems to accept duplicated chart id
      return 'inDrawing';
    },
  },
  inChart : {
    ' r:id="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
      const _oldChartId          = ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
      const _chartObj            = ctx.options.chartDatabase.get(_oldChartId);
      if (!_chartObj) {
        return 'main';
      }
      // extract `<c:chart r:id="chartId"/>` and make the chartId dynamic.
      // This part will be inserted dynamically with postInsert for each new chart
      const _startDrawObjectXML  = ctx.xmlIn.slice(ctx.lastPos, posEnd);
      const _endDrawObjectXML    = ctx.xmlIn.slice(_endOfAttributeValue, posEndOfLastTag);
      _chartObj.postInsert = (newChartRef) => {
        return _startDrawObjectXML + newChartRef + _endDrawObjectXML;
      };
      ctx.lastPos = posEndOfLastTag;
      ctx.isFullyExecuted = true;
      ctx.xmlOut += `<CARBONE_FILE id="${_oldChartId}">${_chartObj.template}</CARBONE_FILE>`;
      return 'main';
    },
  }
};

/**
 * Helper function used in state machine
 *
 * @param      {Object}   ctx              The context:
 *                                         {
 *                                           lastPos : 0
 *                                           xmlIn   : '' // the XML we are reading
 *                                           xmlOut  : '' // the new XML we build
 *                                         }
 * @param      {Integer}  posEndOfLastTag  (see executeStateMachine function)
 * @param      {Integer}  pos              (see executeStateMachine function)
 * @param      {Integer}  posEnd           (see executeStateMachine function)
 * @return     {String}   The value read in XML attribute and concatenate.
 */
function getValueFromAttributeAndConcat (ctx, posEndOfLastTag, pos, posEnd) {
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
  ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, posEnd);
  ctx.lastPos = _endOfAttributeValue;
  return ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
}

/**
 * Gets the text since last tag and concatenate.
 *
 * @param      {Object}   ctx              The context:
 *                                         {
 *                                           lastPos : 0
 *                                           xmlIn   : '' // the XML we are reading
 *                                           xmlOut  : '' // the new XML we build
 *                                         }
 * @param      {Integer}  posEndOfLastTag  The position end of last tag
 * @param      {Integer}  pos              The position
 * @return     {String}   The text since last tag.
 */
function getTextSinceLastTagAndConcat (ctx, posEndOfLastTag, pos) {
  ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, posEndOfLastTag);
  ctx.lastPos = pos;
  return ctx.xmlIn.slice(posEndOfLastTag, pos);
}

const chart = {

  /* **********************************************************************************************************************
   * ODT functions
   * ********************************************************************************************************************** */

  /**
   * Gets the LibreOffice chart reference.
   *
   * "./Object 1"           => "Object 1"
   * "Object 1/content.xml" => "Object 1"
   *
   * @param  {String}  pathOrXMLRef  The path or xml reference
   */
  getLOChartRef : function (pathOrXMLRef) {
    return path.dirname(pathOrXMLRef);
  },

  /**
   * Gets LibreOffice related files.
   *
   * As we create new charts, we will need to duplicate all related files of that chart
   *
   * @param      {Object}  template     The template
   * @param      {String}  oldChartRef  The old chart reference
   * @return     {Array}   chart related files, which name, type, and content.
   */
  getLORelatedFiles : function (template, oldChartRef) {
    const _relatedFiles = [];
    const _directoryName = oldChartRef+'/';
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      let _filename = _file.name.slice(_directoryName.length);
      let _extension = path.extname(_file.name);
      if (_file.name.startsWith(_directoryName) === true) {
        const _mimeType = image.getMimeTypeFromExtensionImage(_extension) ?? 'text/xml';
        _relatedFiles.push({
          nameFn : (newChartRef) => `${newChartRef}/${_filename}`,
          relFn  : (newChartRef) => `<manifest:file-entry manifest:full-path="${newChartRef}/${_filename}" manifest:media-type="${_mimeType}"/>`,
          dataFn : (_filename === 'content.xml' ? (newXML) => newXML : () => _file.data)
        });
      }
    }
    // add a blank file to generate the rel "vnd.oasis.opendocument.chart"
    _relatedFiles.push({
      relFn : (newChartRef) => `<manifest:file-entry manifest:full-path="${newChartRef}/" manifest:media-type="application/vnd.oasis.opendocument.chart"/>`
    });
    return _relatedFiles;
  },

  /**
   * Update charts links in the template for LibreOffice documents (ODT/ODS)
   *
   * @param  {Object} template
   * @param  {Map}    imageDatabase
   * @return {Object} template
   */
  updateLOChartLinks : function (template, newObjectLinks) {
    if (newObjectLinks.length === 0) {
      return template;
    }
    let _manifestFile = file.getTemplateFile(template, 'META-INF/manifest.xml');
    if (_manifestFile === null || typeof(_manifestFile.data) !== 'string' ) {
      return template;
    }
    _manifestFile.data = _manifestFile.data.replace('</manifest:manifest>', newObjectLinks.join('') + '</manifest:manifest>');
    return template;
  },

  /**
   * Pre-process ODT files for charts.
   *
   * All charts which contains markers, are injected directly in the main content.xml, with markers places in chart
   * The engine of carbone will do the rest (inject data, duplicate chart if we are in a loop, ...)
   *
   * @param  {Object}  template  The template
   * @param  {Object}  options   The options
   * @return {Object}  the template preprocessed.
   */
  preProcessLo : function (template, options) {
    let _content = null;
    for (let i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      // seach only in sub directories
      if (_file.name === 'content.xml') {
        _content = _file;
        continue;
      }
      // TODO improve filtering only in chart directory
      if ( typeof (_file.data) !== 'string' || _file.name.indexOf('/content.xml') === -1) {
        continue;
      }
      const _boundValues = chart.getBindMarkers(_file);
      const _ctx = executeChartStateMachine(_file, _boundValues, bindMarkerODT, options);
      if (_ctx.xmlOut !== '') {
        const _chartRef = path.dirname(_file.name);
        const _template = parser.removeAndGetXMLDeclaration(_ctx.xmlOut);
        options.chartDatabase.set(_chartRef, {
          template    : _template.xml,
          declaration : _template.declaration,
          otherFiles  : chart.getLORelatedFiles(template, _chartRef),
          postInsert  : () => {}
        });
        // remove marker in sample chart
        _file.data = parser.removeMarkers(_file.data);
      }
    }
    const _ctxContent = executeChartStateMachine(_content, {}, injectChartInMainContentODT, options);
    if (_ctxContent.xmlOut !== '' && _ctxContent.isFullyExecuted === true) {
      _content.data = _ctxContent.xmlOut;
    }
    return template;
  },

  /**
   * Post-process ODT files
   *
   * Now, data is injected in charts. But chart content is in the main content.xml.
   * We must extract all theses charts, and put their content in separate files, create links and update relation files
   *
   * @param  {Object}  template  The template
   * @param  {Mixed}   data      The data
   * @param  {Object>}
   */
  postProcessLo : function (template, data, options) {
    if (options.chartDatabase.size === 0) {
      return;
    }
    const _objectLinks = [];
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (_file.name === 'content.xml') {
        const _xml = _file.data;
        let _index = -1;
        let _prevPos = 0;
        let _globalChartId = 0;
        let _xmlWithoutCarboneFile = [];
        // eslint-disable-next-line
        while ( (_index = _xml.indexOf('<CARBONE_FILE', ++_index)) !== -1) {
          const _startCarboneTagIndex = _index;
          const _startValueIndex      = _index = _xml.indexOf(' id="', ++_index) + 5; // 5 length of ' id="'
          const _endValueIndex        = _index = _xml.indexOf('"', ++_index);
          const _endChartXMLIndex     = _index = _xml.indexOf('</CARBONE_FILE>', ++_index);
          const _endCarboneTagIndex   = _endChartXMLIndex + 15; // 15 = length of </CARBONE_FILE>
          const _startChartXMLIndex   = _endValueIndex + 2; // length of ">
          const _chartXML = _xml.slice(_startChartXMLIndex, _endChartXMLIndex);
          const _chartId  = _xml.slice(_startValueIndex, _endValueIndex);
          const _chart    = options.chartDatabase.get(_chartId);
          const _newChartName = _chartId + 'c' + _globalChartId++;
          for (let j = 0; j < _chart.otherFiles.length; j++) {
            let _newFile = _chart.otherFiles[j];
            if (_newFile.nameFn !== undefined) {
              template.files.push({
                name   : _newFile.nameFn(_newChartName),
                data   : _newFile.dataFn(_chart.declaration + _chartXML),
                parent : ''
              });
            }
            _objectLinks.push(_newFile.relFn(_newChartName));
          }
          _xmlWithoutCarboneFile.push(_xml.slice(_prevPos, _startCarboneTagIndex));
          _xmlWithoutCarboneFile.push(_chart.postInsert(_newChartName));
          _prevPos = _endCarboneTagIndex;
        }
        if (_xmlWithoutCarboneFile.length > 0) {
          _xmlWithoutCarboneFile.push(_xml.slice(_prevPos));
          _file.data = _xmlWithoutCarboneFile.join('');
          chart.updateLOChartLinks(template, _objectLinks);
        }
        break;
      }
    }
  },

  /* **********************************************************************************************************************
   * DOCX functions
   * ********************************************************************************************************************** */

  /**
   * Update counter and indexes of the chart
   *
   * @param   {String}  chartXML  The chart xml
   * @return  {String}  XML updated, with right counter and index in XML
   */
  updateChartRowsAndColumnsCounter : function (chartXML) {
    let _index = -1;
    let _rowCounter = 0;
    let _newXML = '';
    let _prevXMLPos = 0;
    let _xmlBeforeTotalCount = '';
    let _xmlBeforeAllRows = '';
    // eslint-disable-next-line
    while ( (_index = chartXML.indexOf(TEMP_MARKER_CHART, ++_index)) !== -1) {
      const _startTotalCounterIndex = _index;
      const _endTotalCounterIndex = _startTotalCounterIndex + 20;
      const _type = chartXML[_endTotalCounterIndex - 1]; // can be T or C
      if (_type === 'T') {
        _newXML += _xmlBeforeTotalCount + (_rowCounter > 0 ? _rowCounter : '') + _xmlBeforeAllRows;
        _rowCounter = 0;
        _xmlBeforeAllRows = '';
        _xmlBeforeTotalCount = chartXML.slice(_prevXMLPos, _startTotalCounterIndex);
        _prevXMLPos = _endTotalCounterIndex;
      }
      else {
        _xmlBeforeAllRows += chartXML.slice(_prevXMLPos, _index) + (_rowCounter++);
        _prevXMLPos = _index + 20;
      }
    }
    // finish
    _newXML += _xmlBeforeTotalCount + (_rowCounter > 0 ? _rowCounter : '') + _xmlBeforeAllRows + chartXML.slice(_prevXMLPos);
    return _newXML;
  },

  generateChartRelName : function (filetype, newChartName) {
    return `${newChartName}_${filetype}.xml`;
  },

  /**
   * Generate content for [Content_Types].xml
   *
   * @param   {String}   filetype  chart, style, colors
   * @return  {Function}           function to dynamically create a relation according to the name of the file
   */
  getRelFromFilename : function (filetype) {
    const _globalRel = {
      chart  : (newChartName) => `<Override PartName="/word/charts/${newChartName}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`,
      style  : (newChartName) => `<Override PartName="/word/charts/${chart.generateChartRelName(filetype, newChartName)}" ContentType="application/vnd.ms-office.chartstyle+xml"/>`,
      colors : (newChartName) => `<Override PartName="/word/charts/${chart.generateChartRelName(filetype, newChartName)}" ContentType="application/vnd.ms-office.chartcolorstyle+xml"/>`
    };
    return _globalRel[filetype];
  },

  getChartRelFromFilename : function (filetype) {
    const _globalRel = {
      style  : (newChartName) => `<Relationship Id="rId1" Type="http://schemas.microsoft.com/office/2011/relationships/chartStyle" Target="${chart.generateChartRelName('style', newChartName)}"/>`,
      colors : (newChartName) => `<Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2011/relationships/chartColorStyle" Target="${chart.generateChartRelName('colors', newChartName)}"/>`
    };
    return _globalRel[filetype];
  },

  getFullChartRels : function (relChartFunctions) {
    return (newXML, newChartName) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relChartFunctions.map(fn => fn(newChartName)).join('')}</Relationships>`;
  },

  getChartDocumentRels : function (newChartName) {
    return `<Relationship Id="${newChartName}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/${newChartName}.xml"/>`;
  },

  /**
   * Gets the DOCX object identifier from relative chart path.
   *
   * @param   {Object}  template   The template
   * @param   {String}  chartPath  The chart path
   * @return  {String}  The chart ID
   */
  getDocxObjectIdFromRel : function (template, chartPath) {
    const _documentRelFile = file.getTemplateFile(template, 'word/_rels/document.xml.rels');
    const _chartPathWithoutWordDir = chartPath.slice(5);
    // we try to avoid regexp as much as possible
    const _indexOfChartFilename = _documentRelFile?.data?.indexOf(_chartPathWithoutWordDir);
    if (!_indexOfChartFilename || _indexOfChartFilename === -1) {
      return '';
    }
    const _startIndexOfChartId  = _documentRelFile.data.lastIndexOf(' Id="', _indexOfChartFilename) + 5;
    const _endIndexOfChartId    = _documentRelFile.data.indexOf('"', _startIndexOfChartId+1);
    return _documentRelFile.data.slice(_startIndexOfChartId, _endIndexOfChartId);
  },

  /**
   * Gets the chart related files in DOCX
   *
   * A chart is linked to many other files in a DOCX
   *
   * @param  {Object}  template                                 The template
   * @param  {String}  [oldChartPath='word/charts/chart1.xml']  The old chart path
   * @return {Object}  The docx related files.
   */
  getDocxRelatedFiles : function (template, oldChartPath = 'word/charts/chart1.xml') {
    const _relatedFiles = [];
    const _chartDir     = path.join('word', 'charts');
    const _oldChartName = path.basename(oldChartPath, path.extname(oldChartPath));
    const _fullRelPath  = path.join(_chartDir, '_rels', _oldChartName+'.xml.rels');
    const _chartRelFile = file.getTemplateFile(template, _fullRelPath);
    if (_chartRelFile?.name === undefined) {
      throw Error('This type of template is not supported by Carbone for dynamic charts. Please contact our support to improve this.');
    }
    const _chartRels = [..._chartRelFile.data.matchAll(/Target="(\S+)"/g)];
    if (_chartRels.length !== 3) {
      throw Error('This type of chart is not supported by Carbone. Please contact our support to improve this.');
    }
    const _relOfCharts = [];
    // Generate charts relations
    let _xlsxFile = '';
    for (var i = 0; i < _chartRels.length; i++) {
      let _fileRel  = _chartRels[i]?.[1] ?? '';
      let _filePath = path.join(_chartDir, _fileRel);
      if (/\.xlsx$/.test(_filePath) === true) {
        _xlsxFile = _filePath;
        // Carbone markers will be remove later in embedded XLSX file.
        // We update only the chart, and MS Word will generate the XLSX file himself from the chart
        continue;
      }
      let _file     = file.getTemplateFile(template, _filePath);
      let _fileType = _fileRel.replace(/\d+\.xml$/, ''); // chart, colors, or style
      _relOfCharts.push(chart.getChartRelFromFilename(_fileType));
      _relatedFiles.push({ nameFn : (newChartName) => `${_chartDir}/${chart.generateChartRelName(_fileType, newChartName)}`, dataFn : () => _file.data });
      _relatedFiles.push({ nameFn : '[Content_Types].xml', relFn : chart.getRelFromFilename(_fileType) });
    }
    if (_relOfCharts.length > 0) {
      _relatedFiles.push({ nameFn : (newChartName) => `${_chartDir}/_rels/${newChartName}.xml.rels`, dataFn : chart.getFullChartRels(_relOfCharts) });
    }
    // chart
    _relatedFiles.push({ nameFn : (newChartName) => `${_chartDir}/${newChartName}.xml`, dataFn : (newXML) => chart.updateChartRowsAndColumnsCounter(newXML)  });
    _relatedFiles.push({ nameFn : '[Content_Types].xml'                               , relFn : chart.getRelFromFilename('chart') });
    _relatedFiles.push({ nameFn : 'word/_rels/document.xml.rels'                      , relFn : chart.getChartDocumentRels        });
    return { files : _relatedFiles, xlsx : _xlsxFile };
  },

  /**
   * Removes markers in embedded spreadsheet, which are linked to a chart
   *
   * We update only the chart, and MS Word will generate the XLSX file himself from the chart
   * FIY, when the DOCX is generated by LibreOffice, it does not generate any embedded XLSX file
   *
   * @param  {Object}  template  The template
   * @param  {String}  xlsxFile  The XLSX file
   */
  removeMarkerInEmbeddedSpreasheet : function (template, xlsxFile) {
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      if (_file.parent === xlsxFile && typeof _file.data === 'string') {
        _file.data = parser.removeMarkers(_file.data);
      }
    }
  },

  /**
   * Post-processing: Update charts links in the template for Docx
   *
   * @param  {Object} template
   * @param  {Map}    imageDatabase
   * @return {Object} template
   */
  updateDocxChartLinks : function (template, newObjectLinks) {
    for (let _filename in newObjectLinks) {
      const _relationToAdd = newObjectLinks[_filename];
      const _relFile = file.getTemplateFile(template, _filename, '');
      if (_relFile !== null && typeof(_relFile.data) === 'string' ) {
        _relFile.data = _relFile.data.replace('</Relationships>', _relationToAdd.join('') + '</Relationships>');
        // TODO improve selection to avoid remplacment aveugle selon type de fichier raltion ou overide
        _relFile.data = _relFile.data.replace('</Types>', _relationToAdd.join('') + '</Types>');
      }
    }
    return template;
  },

  /**
   * Gets values from spread sheet range string
   *
   * @param      {String}  str     The cell string "Sheet1!$C$2:$C$3"
   * @return     {Object}          { col : C, fromRow : 2, toRow : 3 }
   */
  parseSpreadSheetRange : function (str) {
    if (typeof str !== 'string') {
      return {};
    }
    const _parsedSheetStr = [...str.matchAll(/\$([A-Z]+)\$(\d+)/g)];
    if (_parsedSheetStr?.length === 1) {
      return { col : _parsedSheetStr[0][1], fromRow : parseInt(_parsedSheetStr[0][2], 10)};
    }
    else if (_parsedSheetStr?.length === 2) {
      return { col : _parsedSheetStr[0][1], fromRow : parseInt(_parsedSheetStr[0][2], 10), toRow : parseInt(_parsedSheetStr[1][2], 10) };
    }
    return {};
  },

  /**
   * Gets the value from cell.
   *
   * @param      {Boolean}  sheetRangeObj  The sheet range object from parseSpreadSheetRange
   * @param      {Object}   sheetData      The sheet data   { b1 : '{d.id}'}
   * @param      {Number}   chartRowIndex  The chart row index
   * @return     {String}   The value from cell.
   */
  getValueFromCell : function (sheetRangeObj, sheetData, chartRowIndex) {
    const _cellStr = sheetRangeObj?.col + (sheetRangeObj?.fromRow + chartRowIndex);
    return sheetData?.[_cellStr];
  },

  /**
   * Pre-process DOCX files for charts.
   *
   * All charts which contains markers, are injected directly in the main document.xml, with markers places in chart
   * The engine of Carbone will do the rest (inject data, duplicate chart if we are in a loop, ...)
   *
   * @param  {Object}  template  The template
   * @param  {Object}  options   The options
   * @return {Object}  the template pre-processed.
   */
  preProcessDocx : function (template, options) {
    let _mainDocumentFile = null;
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      if (_file.name === 'word/document.xml') {
        _mainDocumentFile = _file;
      }
      // a chart is detected
      if (/\/chart\d+\.xml$/.test(_file.name) === false || typeof (_file.data) !== 'string') {
        continue;
      }
      const _related = chart.getDocxRelatedFiles(template, _file.name);
      const boundValues = chart.getBindMarkers(_file);

      // TODO leave if no marker
      let _ctx = {
        xmlIn               : _file.data,
        xmlOut              : '',
        lastPos             : 0,
        boundValues         : boundValues,
        currentRow          : 0, // current row idx
        currentCellRangeObj : 0, // current range pointer on XLSX
        xlsxCells           : template.embeddedXlsxCellValues[_related.xlsx],
        rowMarkers          : [], // markers detected on each row Index
        isFullyExecuted     : false
      };

      try {
        executeStateMachine(_ctx, bindMarkerDOCX);
        if (_ctx.xmlOut !== '' && _ctx.isFullyExecuted === true) {
          _ctx.xmlOut += _ctx.xmlIn.slice(_ctx.lastPos);
          const _oldChartId = chart.getDocxObjectIdFromRel(template, _file.name);
          const _template = parser.removeAndGetXMLDeclaration(_ctx.xmlOut);
          options.chartDatabase.set(_oldChartId, {
            template    : _template.xml,
            declaration : _template.declaration,
            otherFiles  : _related.files,
            postInsert  : () => {}
          });
          // remove marker in sample chart
          _file.data = parser.removeMarkers(_file.data);
          chart.removeMarkerInEmbeddedSpreasheet(template, _related.xlsx);
        }
      }
      catch (e) {
        console.log(e);
      }
    }
    const _ctxContent = executeChartStateMachine(_mainDocumentFile, {}, injectChartInMainDocumentDOCX, options);
    if (_ctxContent.xmlOut !== '' && _ctxContent.isFullyExecuted === true) {
      _mainDocumentFile.data = _ctxContent.xmlOut;
    }
    return template;
  },

  /**
   * Post-process ODT files
   *
   * Now, data is injected in charts. But chart content is in the main content.xml.
   * We must extract all theses charts, and put their content in separate files, create links and update relation files
   *
   * @param  {Object}  template  The template
   * @param  {Mixed}   data      The data
   * @param  {Object>}
   */
  postProcessDocx : function (template, data, options) {
    if (options.chartDatabase.size === 0) {
      return;
    }
    const _objectLinks = {};
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get only document, footers and headers without relation files
      if (_file.name === 'word/document.xml') {
        const _xml = _file.data;
        let _index = -1;
        let _prevPos = 0;
        let _globalChartId = 0;
        let _xmlWithoutCarboneFile = [];

        // eslint-disable-next-line
        while ( (_index = _xml.indexOf('<CARBONE_FILE', ++_index)) !== -1) {
          const _startCarboneTagIndex = _index;
          const _startValueIndex      = _index = _xml.indexOf(' id="', ++_index) + 5; // 5 length of ' id="'
          const _endValueIndex        = _index = _xml.indexOf('"', ++_index);
          const _endChartXMLIndex     = _index = _xml.indexOf('</CARBONE_FILE>', ++_index);
          const _endCarboneTagIndex   = _endChartXMLIndex + 15; // 15 = length of </CARBONE_FILE>
          const _startChartXMLIndex   = _endValueIndex + 2; // length of ">
          const _chartXML = _xml.slice(_startChartXMLIndex, _endChartXMLIndex);
          const _oldChartId   = _xml.slice(_startValueIndex, _endValueIndex);
          const _chart        = options.chartDatabase.get(_oldChartId);
          const _newChartName = _oldChartId + 'c' + _globalChartId++;
          for (let j = 0; j < _chart.otherFiles.length; j++) {
            let _newFile = _chart.otherFiles[j];
            const _fileName = _newFile.nameFn instanceof Function ? _newFile.nameFn(_newChartName) : _newFile.nameFn;
            // add new files
            if (_newFile.dataFn !== undefined) {
              // add the the beginning to let embedded files at the end otherwise it crashes when zipping file
              template.files.unshift({
                name   : _fileName,
                data   : _newFile.dataFn(_chart.declaration + _chartXML, _newChartName),
                parent : ''
              });
            }
            // append existing file
            else {
              if (!(_objectLinks[_fileName] instanceof Array)) {
                _objectLinks[_fileName] = [];
              }
              _objectLinks[_fileName].push(_newFile.relFn(_newChartName));
            }
          }
          _xmlWithoutCarboneFile.push(_xml.slice(_prevPos, _startCarboneTagIndex));
          _xmlWithoutCarboneFile.push(_chart.postInsert(_newChartName));
          _prevPos = _endCarboneTagIndex;
        }
        if (_xmlWithoutCarboneFile.length > 0) {
          _xmlWithoutCarboneFile.push(_xml.slice(_prevPos));
          _file.data = _xmlWithoutCarboneFile.join('');
          chart.updateDocxChartLinks(template, _objectLinks);
        }
        break;
      }
    }
  },


  /**
   * @description Search bindColor markers and it returns through a callback an error, the xml content without bindColor markers and a list of bindColor
   * @private
   * @param {String} xmlContent content from any kind of XML report
   * @param {Function} callback callback function that takes 3 arguments: (err, newXmlContent, bindColorList)
   */
  getBindMarkers : function (_file) {
    const _boundValues = new Map();
    // TODO TEST independent
    // use possessive quantifier only (*+, ++), so it never backtrack. It is faster and safe (no ReDOS)
    //
    // https://www.regular-expressions.info/redos.html
    // https://www.regular-expressions.info/possessive.html
    const _regexMarker = /{bindChart\s*?\(([^)]+?)\)\s*?=\s*?([^}]+?)}/g;
    if (!_file || typeof(_file.data) !== 'string') {
      return _boundValues;
    }
    _file.data = _file.data.replace(_regexMarker, function (marker, boundValue, realMarker) {
      if (!realMarker || !boundValue) {
        return '';
      }
      boundValue = boundValue.replace(',', '.'); // TODO improve doc ?
      // if (!boundValue || !realMarker) {
      //   throw new Error(`Carbone bindColor warning: the marker is not valid "${marker}".`);
      // }
      const _newMarker = '{'+realMarker.trim()+'}';

      if (_boundValues.has(boundValue) === true && _boundValues.get(boundValue) !== _newMarker ) { // TODO optimize
        // Check if a color has already been included
        throw new Error(`Carbone bind error: another marker bind the same value ${boundValue} in marker ${marker}`);
      }
      else if (!parser.isCarboneMarker(realMarker)) {
        throw new Error(`Carbone bindColor warning: the marker is not valid "${realMarker}"`);
      }
      _boundValues.set(boundValue, _newMarker); // TODO add formatter ?
      return '';
    });
    return _boundValues;
  }

};


/**
 * Execute state machine.
 *
 * Create a context object "ctx" for charts state machine
 *
 * @param   {Object}  file          The template
 * @param   {Object}  boundValues   The bound values with bindChart
 * @param   {Object}  stateMachine  The state machine to execute
 * @param   {Object}  options       The options
 * @return  {Object}
 */
function executeChartStateMachine  (file, boundValues, stateMachine, options) {
  if (typeof file?.data !== 'string') {
    return { xmlOut : '' };
  }
  let _ctx = {
    xmlIn           : file.data,
    xmlOut          : '',
    isFullyExecuted : false,
    lastPos         : 0,
    boundValues     : boundValues,
    options         : options
  };
  try {
    executeStateMachine(_ctx, stateMachine);
    if (_ctx.lastPos > 0) {
      _ctx.xmlOut += _ctx.xmlIn.slice(_ctx.lastPos);
    }
  }
  catch (e) {
    console.log(e);
  }
  return _ctx;
}


/**
 * Execute a state machine defined in an object. This object describes a method to travel efficiently an XML string without RegExp.
 *
 * Here is a sample state machine object
 *
 * const stateMachine = {
 *
 *   main : {                                                         // 'main' is the initial state of the state machine. 'main' is a reserved word.
 *     '<row'  : () => 'inTableRow',                                  // if the XML tag '<row>' is found, this goto function will be called and it must return the next state in string.
 *                                                                    // WARNING, XML tag must be written like this '<tag' (one '<', no whitespace)
 *   },
 *   inTableRow : {                                                   // this is a new custom state. It can be any name, except reserved 'main'. Now, we have two possibilities to leave this state (find '</row>' or '<cell>'')
 *     '</row' : () => 'main',                                        // if the closing tag is found, leave this state and return to the 'main' state
 *     '<cell' : (ctx, posEndOfLastTag, pos, posEnd) => 'inTableCell' // each goto function has 3 parameters
 *   },                                                               //   - ctx:                equals the first parameter of executeStateMachine
 *   },                                                               //   - posEndOfLastTagEnd: the position in XML of the real end of last tag found            '<row att="red">'<--
 *                                                                    //   - pos:                the position in XML of the beginning of this searched string, -->'<cell att="red">'
 *                                                                    //   - posEnd:             the position in XML of the end of this searched string           '<cell'<--
 *   inTableCell : {
 *     ' value="' : () => 'inTableCell',                              // it can also detect attribute in the last visited tag, here it matches attribute 'office:value' in '<cell' tag
 *     '</cell'   : () => 'inTableRow',                               // leave a table cell
 *     '<p'       : () => 'inText'                                    // The order of declaration in each state has no meaning. '<p' could be declared before ' value="'.
 *   },
 *
 *   inText : {
 *     '</p' : (ctx, posEndOfLastTag, pos, posEnd) => {
 *       console.log(ctx.xmlIn.slice(posEndOfLastTag, pos));          // here is an example to extract all text between '<p>' and '</p>' tag
 *       return 'inTableCell';
 *     }
 *   }
 * };
 *
 * @param  {String} ctx          ctx context object, which must contain at least:
 *                               {
 *                                 xmlIn : string of XML content to parse`
 *                               }
 *                               This object is passed, as the first parameter of each goTo function. It can be used as a vehicle to transport other variable
 * @param  {Object} stateMachine state machine to execute
 */
function executeStateMachine (ctx, stateMachine) {
  const _xml = ctx.xmlIn;
  let _tokens = [];
  // find all tokens of the state Machine in XML code, and build an array of token positions
  for (let _state in stateMachine) {
    let _currentState = stateMachine[_state];
    for (let _tokenStr in _currentState) {
      let _index = -1;
      // eslint-disable-next-line
      while ( (_index = _xml.indexOf(_tokenStr, ++_index)) !== -1) {
        // Ultra Fast xml search, using indexOf instead of RegExp, without any branching (if) in the loop, nor string allocation
        _tokens.push({ pos : _index, posEnd : (_index + _tokenStr.length), goTo : _currentState[_tokenStr], state : _currentState });
      }
    }
  }
  _tokens.sort((a, b) => a.pos - b.pos);
  let _currentState = stateMachine.main;
  let _posEndOfLastTagEnd = 0;
  for (let i = 0; i < _tokens.length; i++) {
    const _token = _tokens[i];
    if ( _token.state === _currentState) {
      const _isXMLTag     = _xml.charAt(_token.pos) === '<';
      const _isFullXMLTag = XML_TAG_END.includes(_xml.charAt(_token.posEnd)); // Ex. if "<row" is searched, we must match "<row>" and <row att="a">, but not "<rows>"
      if ( _isXMLTag === true && _isFullXMLTag === true || _isXMLTag === false && _token.pos < _posEndOfLastTagEnd /* = is token inside the last XML tag? */ ) {
        const _nextState = _token.goTo(ctx, _posEndOfLastTagEnd, _token.pos, _token.posEnd);
        _currentState = stateMachine[_nextState];
        if (_isXMLTag === true) {
          _posEndOfLastTagEnd = _xml.indexOf('>', _token.posEnd) + 1;
        }
      }
    }
  }
}



module.exports = chart;
