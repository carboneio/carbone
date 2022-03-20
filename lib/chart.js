const parser  = require('./parser');
const file    = require('./file');
const path = require('path');

const XML_TAG_END = [' ', '>'];

//TODO test binf with whites apce,  virgule
//TODO retourner une ereur si le user ne pas tous les i+1 de chaque série dans docx

const stateMachineChartLO = {
  main : {
    '<office:chart' : () => 'inChart'
  },
  inChart : {
    '<table:table' : () => 'inTable'
  },
  inTable : {
    '<table:table-row' : () => 'inTableRow'
  },
  inTableRow : {
    '</table:table-row' : () => 'inTable', // leave a table row
    '<table:table-cell' : () => 'inTableCell'
  },
  inTableCell : {
    ' office:value="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _value  = getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      const _marker = ctx.boundValues.get(_value);
      ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      return 'inTableCell';
    },
    '</table:table-cell' : () => 'inTableRow', // leave a table cell
    '<text:p'            : () => 'inText'
  },
  inText : {
    '</text:p' : (ctx, posEndOfLastTag, pos) => {
      const _value  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      const _marker = ctx.boundValues.get(_value);
      ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      return 'inTableCell';
    },
  }
};


const stateMachineChartContentLO = {
  main : {
    '<draw:frame' : () => 'inChart'
  },
  inChart : {
    ' draw:name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      ctx.xmlOut += 'carbone-chart-{c.now:generateOpenDocumentUniqueNumber}';
      return 'inChart';
    },
    // TODO text:anchor-type="as-char"
    '<draw:object' : (ctx, posEndOfLastTag) => {
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
      const _endOfDrawObjectXML  = ctx.xmlIn.indexOf('/>', posEnd);
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
    // '</draw:frame' : () => 'main'
  }
};


const stateMachineChartOffice = {
  main : {
    '<c:plotArea' : () => 'inPlotArea'
  },
  inPlotArea : {
    '</c:plotArea' : () => 'main',
    '<c:ser'       : () => 'inSerie'
  },
  inSerie : {
    '</c:ser' : () => 'inPlotArea', // TODO optimiser, si <c:ser le tag entrant va dans un state différent de lui-même, metre le tag sortant automatiquement si il n'existe pas déjà
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
      const _totalRowCount  = parseInt(getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd), 10);
      if (_totalRowCount > 2) {
        throw Error('Charts containing a loop with more than two rows are not supported'); // TODO do not blocstaic charts
      }
      // const _marker = ctx.boundValues.get(_value);
      ctx.xmlOut  += 'REPLACE_BY_TOTAL_ROW_COUNT';
      return 'inCategory';
    }
  },
  inPt : {
    '</c:pt' : () => 'inCategory',
    '<c:v'   : () => 'inPtValue',
    ' idx="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _rowIndex = ctx.currentRow = parseInt(getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd), 10);

      // const _marker = ctx.boundValues.get(_value);
      // ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      if (_rowIndex === 0) {
        // Replace only the index of the first row, Carbone will repeat automatically the i+1 row
        ctx.xmlOut  += 'REPLACE_BY_ROW_INDEX_0';
      }
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
      const _totalRowCount  = getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd);
      // const _marker = ctx.boundValues.get(_value);
      // ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      ctx.xmlOut  += 'REPLACE_BY_TOTAL_ROW_COUNT';
      return 'inValues';
    }
  },
  inPointInValue : {
    '</c:pt' : () => 'inValues',
    '<c:v'   : () => 'inValue',
    ' idx="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _rowIndex = ctx.currentRow = parseInt(getValueFromAttributeAndConcat(ctx, posEndOfLastTag, pos, posEnd), 10);
      // const _marker = ctx.boundValues.get(_value);
      // ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      if (_rowIndex === 0) {
        // Replace only the index of the first row, Carbone will repeat automatically the i+1 row
        ctx.xmlOut  += 'REPLACE_BY_ROW_INDEX_0';
      }
      return 'inPointInValue';
    }
  },
  inValue : {
    '</c:v' : (ctx, posEndOfLastTag, pos) => {
      const _value  = getTextSinceLastTagAndConcat(ctx, posEndOfLastTag, pos);
      // let _marker = ctx.boundValues.get(_value) ?? ctx.boundValues.get(parseFloat(_value)+'') ?? _value;

      let _marker = chart.getValueFromCell(ctx.currentCellRangeObj, ctx.xlsxCells, ctx.currentRow);

      // if (ctx.currentRow === 1 && !parser.isCarboneMarker(_marker)) {
      //   _marker = ctx.rowMarkers[1];
      // }
      ctx.xmlOut  += _marker !== undefined ? _marker : _value;
      return 'inValues';
    }
  }
};

function getValueFromAttributeAndConcat (ctx, posEndOfLastTag, pos, posEnd) {
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
  ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, posEnd);
  ctx.lastPos = _endOfAttributeValue;
  return ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
}

function getTextSinceLastTagAndConcat (ctx, posEndOfLastTag, pos) {
  ctx.xmlOut += ctx.xmlIn.slice(ctx.lastPos, posEndOfLastTag);
  ctx.lastPos = pos;
  return ctx.xmlIn.slice(posEndOfLastTag, pos);
}


const chart = {

  /**
   * Gets the lo chart reference.
   *
   * "./Object 1"           => "Object 1"
   * "Object 1/content.xml" => "Object 1"
   *
   * @param      {<type>}  pathOrXMLRef  The path or xml reference
   */
  getLOChartRef : function (pathOrXMLRef) {
    return path.dirname(pathOrXMLRef);
  },

  /**
   * Generate row count and total for Docx charts
   * TODO: improve, we should use parser of markers
   *
   * @param {Array}  markers array of two markers
   */
  generateDocxRowCountFormatter : function (markers) {
    if (markers?.length !== 2) {
      throw Error ('Unable to generate charts');
    }
    const _firstMarker  = parser.removeFormatters(markers[0].replace(/\s+/,''));
    const _secondMarker = parser.removeFormatters(markers[1].replace(/\s+/,''));
    if (_secondMarker.replace(/\+1/g, '') !== _firstMarker) {
      throw Error (`Unable to detect loop in charts between markers: ${markers[0]}, ${markers[1]}`);
    }
    const _iterators = [..._secondMarker.matchAll(/([^[ ,]+)\+1/g)];
    let _firstMarkerAgg = _firstMarker;
    for (var i = 0; i < _iterators.length; i++) {
      let _iterator = _iterators[i];
      _firstMarkerAgg = _firstMarkerAgg.replace(_iterator[1], '');
    }
    return {
      totalCount : _firstMarkerAgg.replace(/,/g,'').replace(/}$/, ':aggCount}'),
      rowCount   : _firstMarker.replace(/}$/, ':cumCount:sub(1)}')
    };
  },

  _executeStateMachine (file, boundValues, stateMachine, options) {
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
  },

  getLORelatedFiles : function (template, oldChartRef) {
    const _relatedFiles = [];
    const _directoryName = oldChartRef+'/';
    for (var i = 0; i < template.files.length && _relatedFiles.length < 3; i++) {
      let _file = template.files[i];
      let _filename = path.basename(_file.name);
      if (_file.name.startsWith(_directoryName) === true) {
        _relatedFiles.push({
          nameFn : (newChartRef) => `${newChartRef}/${_filename}`,
          relFn  : (newChartRef) => `<manifest:file-entry manifest:full-path="${newChartRef}/${_filename}" manifest:media-type="text/xml"/>`,
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
   * @param  {Object} template
   */
  preProcessLo : function (template, options) {
    let _content = null;
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      // seach only in sub directories
      if (_file.name === 'content.xml') {
        _content = _file;
        continue;
      }
      if ( typeof (_file.data) !== 'string' && _file.name.indexOf('/content.xml') === -1) {
        continue;
      }
      const _boundValues = chart.getBindMarkers(_file);
      const _ctx = chart._executeStateMachine(_file, _boundValues, stateMachineChartLO, options);
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
    const _ctxContent = chart._executeStateMachine(_content, {}, stateMachineChartContentLO, options);
    if (_ctxContent.xmlOut !== '' && _ctxContent.isFullyExecuted === true) {
      _content.data = _ctxContent.xmlOut;
    }
    return template;
  },

  postProcessLo : function (template, data, options) {

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
          chart.updateLoChartLinks(template, _objectLinks);
        }
        break;
      }
    }
  },

  /**
   * Post-processing: Update charts links in the template for Libre Office documents (ODT/ODS)
   *
   * @param  {Object} template
   * @param  {Map}    imageDatabase
   * @return {Object} template
   */
  updateLoChartLinks : function (template, newObjectLinks) {
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
   * @param  {Object} template
   */
  preProcessDocx : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      // seach only in sub directories
      if (/\/chart\d+\.xml$/.test(_file.name) === false || typeof (_file.data) !== 'string') {
        continue;
      }
      const boundValues = chart.getBindMarkers(_file);
      let _ctx = {
        xmlIn               : _file.data,
        xmlOut              : '',
        lastPos             : 0,
        boundValues         : boundValues,
        currentRow          : 0, // current row idx
        currentCellRangeObj : 0, // current range pointer on xslx
        xlsxCells           : template.embeddedXlsxCellValues['word/embeddings/Microsoft_Excel_Worksheet.xlsx'], // cell content TODO TODO TODO
        rowMarkers          : [] // markers detected on each row Index
      };

      try {
        executeStateMachine(_ctx, stateMachineChartOffice);
        _file.data = _ctx.xmlOut + _ctx.xmlIn.slice(_ctx.lastPos);
        const _counter = chart.generateDocxRowCountFormatter(_ctx.rowMarkers);
        _file.data = _file.data
          .replace(/REPLACE_BY_ROW_INDEX_0/g, _counter.rowCount)
          .replace(/REPLACE_BY_TOTAL_ROW_COUNT/g, _counter.totalCount);
      }
      catch (e) {
        console.log(e);
      }

    }
    return template;
  },

  /**
   * @description Search bindColor markers and it returns through a callback an error, the xml content without bindColor markers and a list of bindColor
   * @private
   * @param {String} xmlContent content from any kind of XML report
   * @param {Function} callback callback function that takes 3 arguments: (err, newXmlContent, bindColorList)
   */
  getBindMarkers : function (_file) {
    const _boundValues = new Map();
    // use possessive quantifier only (*+, ++), so it never backtrack. It is faster and safe (no ReDOS)
    //
    // https://www.regular-expressions.info/redos.html
    // https://www.regular-expressions.info/possessive.html
    const _regexMarker = /{bind\s*?\(([^)]+?)\)\s*?=\s*?([^}]+?)}/g;
    if (!_file || typeof(_file.data) !== 'string') {
      return _boundValues;
    }
    _file.data = _file.data.replace(_regexMarker, function (marker, boundValue, realMarker) {
      if (!realMarker || !boundValue) {
        return '';
      }
      boundValue = boundValue.replace(',', '.'); //TODO improve doc ?
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
  }

};




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
 *                               This object is passed, as the first paramater of each goTo function. It can be used as a vehicule to transport other variable
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
