var fs = require('fs');
var os = require('os');
var path = require('path');
var file = require('./file');
var params = require('./params');
var helper = require('./helper');
var format = require('./format');
var builder = require('./builder');
var parser = require('./parser');
var preprocessor = require('./preprocessor');
var translator = require('./translator');
var converter = require('./converter');
var dayjs = require('dayjs');
var locale = require('../formatters/_locale.js');
var debug = require('debug')('carbone');
var xmljs = require('xml-js')

var carbone = {

  formatters: {},

  /**
   * This function is NOT asynchrone (It may create the template or temp directory synchronously)
   * @param {Object} options {
   *                           tempPath     : system temp directory by default
   *                           templatePath : it will create the directory if it does not exists
   *                           lang         : set default lang of carbone, can be overwrite in carbone.render options
   *                           translations : overwrite carbone translations object
   *                           currencySource : currency of data, it depends on the locale if empty
   *                           currencyTarget : default target currency when the formatter convCurr is used without target
   *                                            it depends on the locale if empty
   *                           currencyRates  : rates, based on EUR { EUR : 1, USD : 1.14 }
   *                         }
   */
  set: function (options) {
    for (var attr in options) {
      if (params[attr] !== undefined) {
        params[attr] = options[attr];
      }
      else {
        throw Error('Undefined options :' + attr);
      }
    }
    if (options.templatePath !== undefined) {
      if (fs.existsSync(params.templatePath) === false) {
        fs.mkdirSync(params.templatePath, '0755');
      }
      if (fs.existsSync(path.join(params.templatePath, 'lang')) === false) {
        fs.mkdirSync(path.join(params.templatePath, 'lang'), '0755');
      }
      if (options.translations === undefined) {
        translator.loadTranslations(params.templatePath);
      }
    }
    if (options.tempPath !== undefined && fs.existsSync(params.tempPath) === false) {
      fs.mkdirSync(params.tempPath, '0755');
    }
    if (options.factories !== undefined || options.startFactory !== undefined) {
      converter.init();
    }
    // update dayjs lang if it changes
    dayjs.locale(params.lang);
  },

  /**
   * Reset parameters (for test purpose)
   */
  reset: function () {
    // manage node 0.8 / 0.10 differences
    var _nodeVersion = process.versions.node.split('.');
    var _tmpDir = (parseInt(_nodeVersion[0], 10) === 0 && parseInt(_nodeVersion[1], 10) < 10) ? os.tmpDir() : os.tmpdir();

    params.tempPath = _tmpDir;
    params.templatePath = process.cwd();
    params.factories = 1;
    params.attempts = 2;
    params.startFactory = false;
    params.uidPrefix = 'c';
    params.pipeNamePrefix = '_carbone';
    params.lang = 'en';
    params.translations = {};
    params.currencySource = '';
    params.currencyTarget = '';
    params.currencyRates = { EUR: 1, USD: 1.14 };
  },

  /**
   * Add a template in Carbone datastore (template path)
   * @param {String}            fileId   Unique file name. All templates will be saved in the same folder (templatePath). It will overwrite if the template already exists.
   * @param {String|Buffer}     data     The content of the template
   * @param {Function}          callback(err) called when done
   */
  addTemplate: function (fileId, data, callback) {
    /* if(path.isAbsolute(fileId)===true){  //possible with Node v0.11
      return callback('The file id should not be an absolute path: '+fileId);
    }*/
    var _fullPath = path.join(params.templatePath, fileId);
    fs.writeFile(_fullPath, data, function (err) {
      callback(err);
    });
  },

  /**
   * add formatters
   * @param {Object} formatters {toInt: function(d, args, agrs, ...)}
   */
  addFormatters: function (customFormatters) {
    for (var f in customFormatters) {
      carbone.formatters[f] = customFormatters[f];
    }
  },

  /**
   * Remove a template from the Carbone datastore (template path)
   * @param  {String}   fileId   Unique file name.
   * @param  {Function} callback(err)
   */
  removeTemplate: function (fileId, callback) {
    var _fullPath = path.join(params.templatePath, fileId);
    fs.unlink(_fullPath, callback);
  },

  /**
   * Return the list of possible conversion format
   * @param  {String} documentType  Must be 'document', 'web', 'graphics', 'spreadsheet', 'presentation'
   * @return {Array}                List of format
   */
  listConversionFormats: function (documentType) {
    var _res = [];
    if (format[documentType] === undefined) {
      throw Error('Unknown document type');
    }
    var _doc = format[documentType];
    for (var attr in _doc) {
      var _format = _doc[attr];
      _format.id = attr;
      _res.push(_format);
    }
    return _res;
  },

  renderXML: function (xml, data, optionsRaw, callbackRaw) {
    parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      return builder.buildXML(xml, data, options, callback);
    });
  },

  /**
   * Renders a template with given datas and return result to the callback function
   * @param {String}       templatePath : file name of the template (or absolute path)
   * @param {Object|Array} data : Datas to be inserted in the template represented by the {d.****}
   * @param {Object}       optionsRaw [optional] : {
   *                          'complement'   : {}    data which is represented by the {c.****}
   *                          'convertTo'    : 'pdf' || { 'formatName', 'formatOptions'} Convert the document in the format specified
   *                          'extension'    : 'odt' || undefined Specify the template extension
   *                          'variableStr'  : ''    pre-declared variables,
   *                          'lang'         : overwrite default lang. Ex. "fr"
   *                          'translations' : overwrite all loaded translations {fr: {}, en: {}, es: {}}
   *                          'enum'         : { ORDER_STATUS : ['open', 'close', 'sent']
   *                          'currencySource'   : currency of data, 'EUR'
   *                          'currencyTarget' : default target currency when the formatter convCurr is used without target
   *                          'currencyRates'  : rates, based on EUR { EUR : 1, USD : 1.14 }
   *                       }
   * @param {Function}     callbackRaw(err, res, reportName) : Function called after generation with the result
   */
  render: function (templatePath, data, optionsRaw, callbackRaw) {
    parseOptions(optionsRaw, callbackRaw, function (options, callback) {
      // open the template (unzip if necessary)
      file.openTemplate(templatePath, function (err, template) {
        if (err) {
          return callback(err, null);
        }
        // Determine the template extension.
        var _extension = file.detectType(template);
        // It takes the user defined one, or use the file type.
        options.extension = optionsRaw.extension || _extension;

        if (options.extension === null) {
          return callback('Unknown input file type. It should be a docx, xlsx, pptx, odt, ods, odp, xhtml, html or an xml file');
        }
        if (options.extension === options.convertTo) {
          options.convertTo = null; // avoid calling LibreOffice if the output file type is the same as the input file type
        }
        template.reportName = options.reportName;
        template.extension = options.extension;
        preprocessor.execute(template, function (err, template) {
          if (err) {
            return callback(err, null);
          }
          try {
            if (template.extension == 'xlsx') {
              // delete sheets containing pivot tables
              var pivotFiles = removePivotFiles(template.files);
              // shift drawing elements
              drawingsShifting(template.files, data);
              // shift and expansion of the data area of functions
              template.files = scaleFunctionData(template.files, data);
              // expanding chart data areas
              scaleChartsData(template.files, data);
              // expanding table data areas
              scaleTablesData(template.files, data);
              // merge line shift
              shiftMergeRows(template.files, data);
              // line shift
              rowsShift(template.files, data);
              // print area shift
              printAreaShift(template.files, data);
            }

          }
          catch (err) {
            return callback(err);
          }
          // obtaining images from data for generation
          let images = getImagesFromData(data);
          // parse all files of the template
          walkFiles(template, data, options, 0, function (err, report) {
            if (err) {
              return callback(err, null);
            }
            // вставка изображений в книгу
            if (template.extension == 'xlsx') putImagesToSheets(report, images);
            if (template.extension == 'docx') putImagesToDocument(report, images);
            if (template.extension == 'docx') insertHTML(report, data);
            if (pivotFiles) report.files.push(...pivotFiles);
            // assemble all files and zip if necessary
            file.buildFile(report, function (err, result) {
              if (err) {
                return callback(err, null);
              }
              if (typeof (options.convertTo) === 'string' && options.convertTo !== '') {
                let optionsConvert = {
                  extension: options.extension
                };
                convert(result, options.convertTo, optionsConvert, function (err, result) {
                  callback(err, result, report.reportName);
                });
              }
              else if (typeof (options.convertTo) === 'object'
                && options.convertTo !== null
                && typeof (options.convertTo.formatName) === 'string' && options.convertTo.formatName !== '') {
                let optionsConvert = {
                  formatOptions: options.convertTo.formatOptionsRaw ? options.convertTo.formatOptionsRaw : options.convertTo.formatOptions ? options.convertTo.formatOptions : {},
                  extension: options.extension
                };
                convert(result, options.convertTo.formatName, optionsConvert, function (err, result) {
                  callback(err, result, report.reportName);
                });
              }
              else {
                callback(null, result, report.reportName);
              }
            });
          });
        });
      });
    });
  },

  /**
   * Return the file extension
   * @param {String} filePath File path
   * @param {Function} callback
   */
  getFileExtension: function (filePath, callback) {
    file.openTemplate(filePath, function (err, template) {
      if (err) {
        return callback(err);
      }

      var ext = file.detectType(template);

      if (ext === null) {
        return callback('Cannot detect file extension');
      }

      return callback(null, ext);
    });
  },

  /**
   * Convert a file format to another
   * @param  {Buffer}   data      raw data returned by fs.readFile (no utf-8)
   * @param  {String}   convertTo output format. Example: 'csv', 'xls', 'xlsx'
   * @param  {Object}   options   Example for CSV files:
   *                              {
   *                                formatOptions : {
   *                                  fieldSeparator  : ',',
   *                                  textDelimiter   : '"',
   *                                  characterSet    : '76',   // utf8  https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
   *                                }
   *                                extension       : 'csv'   // extension of source file returned by path.extname(filename). It helps LibreOffice to understand the source format (mandatory for CSV files)
   *                              }
   * @param  {Function} callback  (err, result) result is a buffer (file converted)
   */
  convert: function (data, convertTo, options, callback) {
    convert(data, convertTo, options, callback);
  }


};

/** ***************************************************************************************************************/
/* Privates methods */
/** ***************************************************************************************************************/

/**
 * Merge line shift
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function shiftMergeRows(files, data) {
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    rows = rows.map(row => ({ value: row, number: +row.match(/r="(.*?)"/)[1] }));
    let interpolations = rows.map(interpolation => ({ value: (interpolation.value.match(/\{d\.(.*?)\[i\].*\}/) || [])[1], number: interpolation.number }));
    if (sheetFileIndex.sheetRelsFileIndex == -1) return;
    let mergedCells = files[sheetFileIndex.sheetFileIndex].data.match(/<mergeCell .*?\/>/g);
    if (!mergedCells) return;
    if (!mergedCells.length) return;
    mergedCells.reverse().forEach(mergeCell => {
      let pos = mergeCell.match(/ref="(.*?)"/)[1];
      let splittedPos = pos.split(':');
      let newSplittedPos = splittedPos;
      let from = getNumberFromXlsxPosition(splittedPos[0]);
      let to = getNumberFromXlsxPosition(splittedPos[1]);
      let previousInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < from.row);
      let offset = 0;
      previousInterpolations.forEach(prevInterpolation => offset += data[prevInterpolation.value].length - 2);
      if (offset) {
        newSplittedPos[0] = newSplittedPos[0].replace(from.row, from.row + offset);
        newSplittedPos[1] = newSplittedPos[1].replace(to.row, to.row + offset);
      }
      let newPos = newSplittedPos.join(':');
      files[sheetFileIndex.sheetFileIndex].data = files[sheetFileIndex.sheetFileIndex].data.replace(mergeCell, mergeCell.replace(pos, newPos));
    });
  });
}
/**
 * Deleting and returning sheets containing pivot tables, and files having pivot tables mentioned
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @return {Array<Object>} - deleted files
 */
function removePivotFiles(files) {
  let sheets = findSheetsFilesIndexes(files);
  let pivotFiles = [];
  let pivotSheetsIndexes = [];
  sheets.forEach(sheet => {
    if (sheet.sheetRelsFileIndex == -1) return;
    if (sheet.sheetRelsFileIndex && files[sheet.sheetRelsFileIndex].data.indexOf('pivot') != -1) {
      pivotSheetsIndexes.push(sheet.sheetFileIndex);
    }
  });
  pivotSheetsIndexes.reverse().forEach(index => pivotFiles.push(...files.splice(index, 1)));
  let fileIndex = 0;
  while (fileIndex != files.length) {
    if (files[fileIndex].name.indexOf('pivot') != -1) {
      pivotFiles.push(...files.splice(fileIndex, 1));
      fileIndex = 0;
    }
    fileIndex++;
  }
  return pivotFiles;
}
/**
 * Shift and expansion of the table data area
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function scaleTablesData(files, data) {
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    rows = rows.map(row => ({ value: row, number: +row.match(/r="(.*?)"/)[1] }));
    let interpolations = rows.map(interpolation => ({ value: (interpolation.value.match(/\{d\.(.*?)\[i\].*\}/) || [])[1], number: interpolation.number }));
    if (sheetFileIndex.sheetRelsFileIndex == -1) return;
    let tables = files[sheetFileIndex.sheetRelsFileIndex].data.split('<').filter(item => item.indexOf('\/tables\/table') != -1).map(item => item.match(/tables\/(.*?)"/)[1]);
    if (!tables.length) return;
    tables.forEach(table => {
      let tableFileIndex = files.findIndex(file => file.name.indexOf(table) != -1);
      let tableFile = files[tableFileIndex].data;
      let tableDataAreas = tableFile.match(/ref="(.*?)"/g) || [];
      tableDataAreas.forEach(tableDataArea => {
        let pos = tableDataArea.match(/ref="(.*?)"/)[1];
        let splittedPos = pos.split(':');
        let newSplittedPos = splittedPos;
        let from = getNumberFromXlsxPosition(splittedPos[0]);
        let to = getNumberFromXlsxPosition(splittedPos[1]);
        let previousInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < from.row);
        let offset = 0;
        previousInterpolations.forEach(prevInterpolation => offset += data[prevInterpolation.value].length - 2);
        if (offset) {
          newSplittedPos[0] = newSplittedPos[0].replace(from.row, from.row + offset);
          newSplittedPos[1] = newSplittedPos[1].replace(to.row, to.row + offset);
        }
        let scaleNumber = 0;
        interpolations.filter(item => getNumsArrayToNumber(to.row, from.row).includes(item.number) && item.value).forEach(item => scaleNumber += (data[item.value] ? data[item.value].length - 2 : 0));
        if (scaleNumber && from.row != to.row) {
          newSplittedPos[1] = newSplittedPos[1].replace(to.row + offset, to.row + offset + scaleNumber);
        }
        let newPos = newSplittedPos.join(':');
        files[tableFileIndex].data = files[tableFileIndex].data.replace(pos, newPos);
      })
    });
  });
  return files;
}
/**
 * Shift and expansion of the field of data formulas
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function scaleFunctionData(files, data) {
  // поиск индексов листов и их связей
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  let calcChainFileIndex = files.findIndex(file => file.name.indexOf('calcChain.xml') != -1);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    rows = rows.map(row => ({ value: row, number: +row.match(/r="(.*?)"/)[1] }));
    let interpolations = rows.map(interpolation => ({ value: (interpolation.value.match(/\{d\.(.*?)\[i\].*\}/) || [])[1], number: interpolation.number }));
    let formulas = rows.reduce((acc, row, index) => {
      let matched = row.value.match(/<f.*?>.*?<\/f>/g);
      if (matched && matched.length) {
        matched.forEach(formula => {
          acc.push({ value: formula, cell: row.value.split('<c').find(cell => cell.indexOf(formula) != -1).match(/r="(.*?)"/)[1] });
        });
      }
      return acc;
    }, []);
    if (!formulas.length) return;
    formulas.reverse().forEach(formula => {
      let formulaDataAreas = formula.value.substring(formula.value.indexOf('>'), formula.value.indexOf('</')).match(/\w+\d+:\w+\d+/g);
      if (!formulaDataAreas) {
        let formulaCells = formula.value.substring(formula.value.indexOf('>'), formula.value.indexOf('</')).match(/\w+\d+/g);
        let currentPos = getNumberFromXlsxPosition(formulaCells[0]);
        let offset = 0;
        let previousInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < currentPos.row);
        previousInterpolations.forEach(prevInterpolation => offset += data[prevInterpolation.value].length - 2);
        let newRow = currentPos.row + offset;
        files[sheetFileIndex.sheetFileIndex].data = files[sheetFileIndex.sheetFileIndex].data.replace(formula.value, formula.value.replace(new RegExp(`${currentPos.row}`, 'g'), newRow));
        let formulaCalcRelation = files[calcChainFileIndex].data.match(new RegExp(`<c r="${formula.cell}".*?i="${sheetFileIndex.sheetId}".*?\/>`))[0];
        let formulaRelPosition = getNumberFromXlsxPosition(formula.cell);
        let previousCalcChainInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < formulaRelPosition.row);
        let calcChainInterpolationsOffset = 0;
        previousCalcChainInterpolations.forEach(prevInterpolation => calcChainInterpolationsOffset += data[prevInterpolation.value].length - 2);
        let newFormulaCalcRelation = formulaCalcRelation.replace(formula.cell, formula.cell.replace(formulaRelPosition.row, formulaRelPosition.row + calcChainInterpolationsOffset));
        files[calcChainFileIndex].data = files[calcChainFileIndex].data.replace(formulaCalcRelation, newFormulaCalcRelation);
      } else {
        formulaDataAreas.forEach(pos => {
          let splittedPos = pos.split(':');
          let newSplittedPos = splittedPos;
          let from = getNumberFromXlsxPosition(splittedPos[0]);
          let to = getNumberFromXlsxPosition(splittedPos[1]);
          let previousInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < from.row);
          let offset = 0;
          previousInterpolations.forEach(prevInterpolation => offset += data[prevInterpolation.value].length - 2);
          if (offset) {
            newSplittedPos[0] = newSplittedPos[0].replace(from.row, from.row + offset);
            newSplittedPos[1] = newSplittedPos[1].replace(to.row, to.row + offset);
          }
          let scaleNumber = data[interpolations.find(item => item.number == from.row).value].length - 2;
          if (scaleNumber && from.row != to.row) {
            newSplittedPos[1] = newSplittedPos[1].replace(to.row + offset, to.row + offset + scaleNumber);
          }
          let newPos = newSplittedPos.join(':');
          let formulaCalcRelation = (files[calcChainFileIndex].data.match(new RegExp(`<c r="${formula.cell}".*?i="${sheetFileIndex.sheetId}".*?\/>`)) || [])[0];
          if (formulaCalcRelation) {
            let formulaRelPosition = getNumberFromXlsxPosition(formula.cell);
            let previousCalcChainInterpolations = interpolations.filter(interpolation => interpolation.value && interpolation.number + 1 < formulaRelPosition.row);
            let calcChainInterpolationsOffset = 0;
            previousCalcChainInterpolations.forEach(prevInterpolation => calcChainInterpolationsOffset += data[prevInterpolation.value].length - 2);
            let newFormulaCalcRelation = formulaCalcRelation.replace(formula.cell, formula.cell.replace(formulaRelPosition.row, formulaRelPosition.row + calcChainInterpolationsOffset));
            files[calcChainFileIndex].data = files[calcChainFileIndex].data.replace(formulaCalcRelation, newFormulaCalcRelation);
          }
          files[sheetFileIndex.sheetFileIndex].data = files[sheetFileIndex.sheetFileIndex].data.replace(pos, newPos);
        });
      }
    })
    files[sheetFileIndex.sheetFileIndex].data = files[sheetFileIndex.sheetFileIndex].data.replace(/(<f.*?>.*?<\/f>)<v>.*?<\/v>/g, '$1');
  });
  return files;
}
/**
 * Shift and expansion of chart data area
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function scaleChartsData(files, data) {
  // поиск индексов листов и их связей
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    rows = rows.map(row => ({ value: row, number: +row.match(/r="(.*?)"/)[1] }));
    if (sheetFileIndex.sheetRelsFileIndex == -1) return;
    let drawingFileName = (files[sheetFileIndex.sheetRelsFileIndex].data.match(/drawing\d*.xml/) || [])[0];
    if (!drawingFileName) return;
    let drawingRelFileIndex = files.findIndex(file => file.name.indexOf(`${drawingFileName}.rel`) != -1);
    if (drawingRelFileIndex == -1) return;
    let chartsNames = files[drawingRelFileIndex].data.match(/charts\/chart\w*?\.xml/g);
    let chartsFilesIndexes = chartsNames.reduce((indexes, chartName) => {
      let index = files.findIndex(file => file.name.indexOf(chartName) != -1);
      if (index != -1) return [...indexes, index];
      return indexes;
    }, []);
    if (!chartsFilesIndexes.length) return;
    chartsFilesIndexes.forEach(chartFileIndex => {
      let chartFile = files[chartFileIndex].data;
      let chartDataAreas = chartFile.match(/<c:f>.*?<\/c:f>/g);
      chartDataAreas.forEach(dataArea => {
        let rawDataArea = dataArea.substring(5, dataArea.length - 6);
        let [from, to] = rawDataArea.split('!')[1].split(':');
        let fromRowPosition = getNumberFromXlsxPosition(from.replace(/\$/g, '')).row;
        let newRawDataArea;
        let previousRowsFrom = rows.filter(row => row.value && row.number + 1 < fromRowPosition);
        let previousInterpolations = previousRowsFrom.reduce((acc, row) => {
          let interpolation = row.value.match(/{d\.(.*?)\[i\].*?}/);
          if (interpolation && interpolation[1]) acc.push(interpolation[1]);
          return acc;
        }, []);
        let offset = 0;
        previousInterpolations.forEach(interpolation => offset += data[interpolation].length - 2);
        let newFrom = from.replace(fromRowPosition, fromRowPosition + offset);
        let dataKey = (files[sheetFileIndex.sheetFileIndex].data.match(new RegExp(`r="${from.replace(/\$/g, '')}".*?>.*?{d\\.(.*?)\\[i\\].*?}.*?<\\/c>`)) || [])[1];
        if (to) {
          let toRowPosition = getNumberFromXlsxPosition(to.replace(/\$/g, '')).row;
          const HAS_SUMMARY_ROW = !!files[sheetFileIndex.sheetFileIndex].data.match(new RegExp(`d.${dataKey}\\[i\\+1\\]\\..+:summary`));
          if (data[dataKey]) {
            let newTo = to.replace(toRowPosition, toRowPosition + offset + (dataKey ? data[dataKey].length - 2 : 0) + (HAS_SUMMARY_ROW ? -1 : 0));
            newRawDataArea = rawDataArea.replace(to, newTo);
          } else {
            let newTo = to.replace(toRowPosition, toRowPosition + offset);
            newRawDataArea = rawDataArea.replace(to, newTo);
          }
        }
        newRawDataArea = (newRawDataArea || rawDataArea).replace(from, newFrom);
        files[chartFileIndex].data = files[chartFileIndex].data.replace(
          rawDataArea,
          newRawDataArea
        );
      })
    });
  });
  return files;
}
/**
 * Getting number positions from A1 format
 * @param {string} position - position in format (A1, DE5 e.t.c);
 * @returns {Object} - number position
 */
function getNumberFromXlsxPosition(position) {
  const alpabet = {
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'E': 5,
    'F': 6,
    'G': 6,
    'H': 8,
    'I': 9,
    'J': 10,
    'K': 11,
    'L': 12,
    'M': 13,
    'N': 14,
    'O': 15,
    'P': 16,
    'Q': 17,
    'R': 18,
    'S': 19,
    'T': 20,
    'U': 21,
    'V': 22,
    'W': 23,
    'X': 24,
    'Y': 25,
    'Z': 26
  };
  const [, letters, number] = position.match(/(\D+)(\d+)/);
  let splittedLetters = letters.split('');
  let row = +number;
  let col = 0;
  if (splittedLetters.length > 1) {
    while (splittedLetters.length != 1) {
      col += 26 * alpabet[splittedLetters.shift()];
    }
  }
  col += alpabet[splittedLetters[0]];
  return {
    row,
    col
  };
}
/**
 * Arrayed numbers from to
 * @param {number} numFrom - start number
 * @param {number} [numTo = 0] - end number
 * @returns {Array}
 */
function getNumsArrayToNumber(numFrom, numTo = 0) {
  let array = [];
  while (numFrom >= numTo) { array.push(numFrom--) };
  return array;
}
/**
 * Line shift
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function rowsShift(files, data) {
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    let interpolations = rows.map(interpolation => (interpolation.match(/\{d\.(.*?)\[i\].*\}/) || [])[1]);
    rows.reverse().forEach((row, index) => {
      let rowIndex = rows.length - index - 1;
      let previousInterpolations = interpolations.filter((interpolation, interpolationIndex) => interpolation && interpolationIndex < (rowIndex - (row.indexOf('i+1') == -1 ? 0 : 2)));
      if (!previousInterpolations.length) return;
      let position = +row.match(/r="(\d*)"/)[1];
      let offset = 0;
      previousInterpolations.forEach(interpolation => offset += (data[interpolation] ? data[interpolation].length - 2 : 0));
      let replacement = row.replace(/r="(.*?)\d*?"/g, `r="$1${position + offset}"`);
      files[sheetFileIndex.sheetFileIndex].data = files[sheetFileIndex.sheetFileIndex].data.replace(row, replacement);
    })
  });
  return files;
}
/**
 * Insert html to files
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data - data to substitute
 */
function insertHTML(report) {
  let documentIndex = -1;
  const document = report.files.find((file, index) => {
    if (file.name === 'word/document.xml') {
      documentIndex = index
      return true;
    }
    return false;
  });
  if (!document) return;
  const paragraphs = document.data.match(/<w:p.*?>.*?<\/w:p>/g);
  for (const paragraph of paragraphs) {
    if (!paragraph.includes(':html')) continue;
    const encodedHTMLContent = paragraph.match(/<w:p.*?>.*<w:t>(.*):html<\/w:t>.*<\/w:p>/)[1];
    const HTMLContent = Buffer.from(encodedHTMLContent, 'base64').toString('utf8');
    document.data = document.data.replace(paragraph, HTMLContent);
  }
}
/**
 * Shift printing area
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function printAreaShift(files, data) {
  let workBookIndex = -1;
  const [workBook] = files.filter((file, index) => {
    if (file.name === 'xl/workbook.xml') {
      workBookIndex = index;
      return true;
    }
    return false;
  });
  if (!workBook) return;
  let workBookPrintArea = workBook.data.match(/<definedName name=\"_xlnm.Print_Area\".*?>(.*?)<\/definedName>/g);
  if (!workBookPrintArea) return;
  workBookPrintArea = workBookPrintArea.map(printAreaData => {
    const sheetName = printAreaData.match(/<.*?>(.*?)!.*?<\/definedName>/)[1];
    const sheetInitialOffset = +printAreaData.match(new RegExp(`${sheetName}!\\$[A-Z]{1,2}\\$[0-9]+:\\$[A-Z]{1,2}\\$([0-9]+)`))[1];
    const sheetInitialTagData = printAreaData.match(new RegExp(`(${sheetName}!\\$[A-Z]{1,2}\\$[0-9]+:\\$[A-Z]{1,2}\\$[0-9]+)`))[1];
    const sheetId = workBook.data.match(new RegExp(`<sheet name=\"${sheetName.replace(/\'/g, '')}\" sheetId=\"(.*?)\".*?/>`))[1];
    return {
      sheetId,
      sheetInitialOffset,
      sheetInitialTagData,
      printAreaData
    }
  })
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    const [printArea] = workBookPrintArea.filter(workBookPrintAreaItem => workBookPrintAreaItem.sheetId === sheetFileIndex.sheetId);
    if (!printArea) return;
    const rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
    const interpolations = rows
      .map(interpolation => (interpolation.match(/\{d\.(.*?)\[i\].*\}/) || [])[1])
      .filter((interpolation, index) => interpolation && index <= printArea.sheetInitialOffset);
    let offset = 0;
    interpolations.forEach(interpolation => offset += (data[interpolation] ? data[interpolation].length - 2 : 0));
    const newPrintShift = printArea.sheetInitialTagData.slice(0, printArea.sheetInitialTagData.length - `${printArea.sheetInitialOffset}`.length) + (offset + printArea.sheetInitialOffset);
    const newTag = printArea.printAreaData.replace(printArea.sheetInitialTagData, newPrintShift)
    files[workBookIndex].data = files[workBookIndex].data.replace(printArea.printAreaData, newTag);
  });
  return files;
}
/**
 * Shift driving elements
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {Object} data  - data to substitute
 */
function drawingsShifting(files, data) {
  // поиск индексов листов и их связей
  let sheetsFilesIndexes = findSheetsFilesIndexes(files);
  sheetsFilesIndexes.forEach(sheetFileIndex => {
    if (sheetFileIndex.sheetRelsFileIndex == -1) return;
    let drawingFileName = (files[sheetFileIndex.sheetRelsFileIndex].data.match(/drawings\/drawing.?\.xml/) || [])[0];
    let drawingFileIndex = files.findIndex(file => file.name.indexOf(drawingFileName) != -1);
    if (drawingFileIndex == -1) return;
    let matchedPositions = files[drawingFileIndex].data.match(/<xdr:row>\d+<\/xdr:row>/g);
    matchedPositions.reverse().forEach(matchedPosition => {
      let position = +matchedPosition.substring(9, matchedPosition.lastIndexOf('</xdr:row>'));
      let rows = (files[sheetFileIndex.sheetFileIndex].data.match(/<row.*?>.*?<\/row>/g) || []);
      let interpolations = rows.map(interpolation => ({
        interpolation: (interpolation.match(/\{d\.(.*?)\[i\].*\}/) || [])[1],
        position: (interpolation.match(/r="(\d*)"/) || [])[1]
      }));
      let previousInterpolations = interpolations.filter(elem => elem.interpolation && elem.position <= position);
      if (!previousInterpolations.length) return;
      let offset = 0;
      previousInterpolations.forEach(elem => {
        offset += data[elem.interpolation].length - 2;
      });
      files[drawingFileIndex].data = files[drawingFileIndex].data.replace(
        matchedPosition,
        `<xdr:row>${offset + position}</xdr:row>`
      );
    })
  });
  return files;
}
/**
 * Search for sheets and indexes of their bindings
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @returns {Array<Object>}
 */
function findSheetsFilesIndexes(files) {
  let bookRels = files.find(file => file.name.indexOf('xl/_rels/workbook.xml.rels') != -1).data;
  let workBook = files.find(file => file.name == 'xl/workbook.xml').data;
  let workBookSheets = workBook.match(/<sheet .*?\/>/g);
  return files.reduce((acc, file, index) => {
    if (file.name.indexOf('xl/worksheets/sheet') != -1) {
      let sheetNumber = file.name.substring(19, file.name.lastIndexOf('.')),
        sheetRelsRid = bookRels.split('<').filter(item => item.indexOf(`sheet${sheetNumber}`) != -1)[0].match(/Id="(.*?)"/)[1],
        workBookSheet = workBookSheets.find(item => item.indexOf(sheetRelsRid) != -1),
        sheetId = workBookSheet.match(/sheetId="(\w+)"/)[1],
        sheetName = workBookSheet.match(/name="(.+?)"/)[1],
        sheetRelsFileIndex = findSheetRelFileIndex(files, sheetNumber);
      acc.push({ sheetNumber, sheetFileIndex: index, sheetId, sheetName, sheetRelsRid, sheetRelsFileIndex });
    }
    return acc;
  }, []);
}
/**
 * @param {Array<Object>} files - an array of objects containing meta file information
 * @param {number} sheetNumber 
 * @returns {Number}
 */
function findSheetRelFileIndex(files, sheetNumber) {
  let fileIndex = files.findIndex(file => file.name == `xl/worksheets/_rels/sheet${sheetNumber}.xml.rels`);
  if (fileIndex === -1) {
    fileIndex = files.findIndex(file => file.name == `xl/_rels/workbook.xml.rels`);
  }
  return fileIndex;
}
/**
 * Add file buffer to image list
 * @param {Object} data  - data to substitute
 * @returns {Array<Object>}
 */
function getImagesFromData(data) {
  let acc = [];
  for (let key in data) {
    if (!data[key]) continue;
    if (Array.isArray(data[key])) {
      for (let i = 0; i < data[key].length; i++) {
        for (let nestedKey in data[key][i]) {
          if (data[key][i][nestedKey] && data[key][i][nestedKey].indexOf && data[key][i][nestedKey].indexOf('base64') != -1 || data[key][i][nestedKey] && (Buffer.isBuffer(data[key][i][nestedKey]) || data[key][i][nestedKey].type == 'Buffer' || data[key][i][nestedKey].BYTES_PER_ELEMENT != undefined)) {
            if (data[key][i][nestedKey].type == 'Buffer' || data[key][i][nestedKey].BYTES_PER_ELEMENT != undefined) data[key][i][nestedKey] = Buffer.from(data[key][i][nestedKey]);
            acc.push({
              fileName: `${key}[${i}].${nestedKey}`,
              data: Buffer.from(data[key][i][nestedKey].toString('utf8').replace(/data:image\/(jpeg|png);base64,/, ''), 'base64')
            });
            data[key][i][nestedKey] = `${key}[${i}].${nestedKey}`;
          }
        }
      }
    } else {
      if (data[key].indexOf && data[key].indexOf('base64') != -1) {
        acc.push({
          fileName: `${key}`,
          data: Buffer.from(data[key].replace(/data:image\/(jpeg|png);base64,/, ''), 'base64')
        });
        data[key] = `${key}`;
      }
    }
  }
  return acc;
}
/**
 * Insert images into document
 * @param {Object} report - report data
 * @param {Array} images - images
 */
function putImagesToDocument(report, images = []) {
  if (!images.length) return;
  images = images.map(image => {
    let encodedImageName = Buffer.from(image.fileName).toString('base64');
    report.files.push({
      data: image.data,
      isMarked: false,
      name: `word/media/${encodedImageName}.png`,
      parent: ""
    });
    return {
      ...image,
      encodedImageName
    };
  })
  report.files[0].data = report.files[0].data.replace(
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>'
  );
  let documentRelsIndex = report.files.findIndex(file => file.name.indexOf('document.xml.rels') != -1);
  let documentIndex = report.files.findIndex(file => file.name.indexOf('word/document.xml') != -1);
  let maxDocumentRelsId = Math.max(0, ...(report.files[documentRelsIndex].data.match(/Id=".*?"/g) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
  images.forEach((image, index) => {
    let imageRid = maxDocumentRelsId + index + 1;
    report.files[documentRelsIndex].data = report.files[documentRelsIndex].data.replace(
      '</Relationships>',
      `<Relationship Id="rId${imageRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${image.encodedImageName}.png"/></Relationships>`
    );
    let imageSizeFormatter = (report.files[documentIndex].data.match(new RegExp(`<w:t>${Buffer.from(image.encodedImageName, 'base64').toString('utf8').replace(/(\[|\]|\.)/g, '\\$1')}:(\\d+\\*\\d+|\\d+)<\\/w:t>`)) || [])[1];
    let imageWidth, imageHeight;
    if (imageSizeFormatter) {
      ([imageWidth, imageHeight = imageWidth] = imageSizeFormatter.split('*'));
      imageWidth *= 12700;
      imageHeight *= 12700;
    } else {
      imageWidth = 2095500;
      imageHeight = 2095500;
    }
    report.files[documentIndex].data = report.files[documentIndex].data.replace(
      new RegExp(`<w:t>${Buffer.from(image.encodedImageName, 'base64').toString('utf8').replace(/(\[|\]|\.)/g, '\\$1')}(:\\d+\\*\\d+|:\\d+|)<\\/w:t>`),
      `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imageWidth}" cy="${imageHeight}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Рисунок 1"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Аннотация 2019-04-04 111910.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${imageRid}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imageWidth}" cy="${imageHeight}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
    );
  })
}
/**
 * Insert images into sheets
 * @param {Object} report - report data
 * @param {Array} images - images
 */
function putImagesToSheets(report, images = []) {
  if (!images.length) return;
  images = images.map(image => {
    let encodedImageName = Buffer.from(image.fileName).toString('base64');
    report.files.push({
      data: image.data,
      isMarked: false,
      name: `xl/media/${encodedImageName}.png`,
      parent: ""
    });
    return {
      ...image,
      encodedImageName
    };
  })
  report.files[0].data = report.files[0].data.replace(
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>'
  );
  let sheets = [];
  report.files.forEach((file, index) => {
    if (file.name.indexOf('xl/worksheets/sheet') != -1) sheets.push({ file, sheetNumber: file.name.substring(file.name.indexOf('/sheet') + 6, file.name.lastIndexOf('.')), index });
  })
  sheets.forEach((sheet) => {
    let sheetHasImages = images.reduce((acc, image) => { if (sheet.file.data.indexOf(image.fileName) != -1) acc++; return acc }, 0);
    if (!sheetHasImages) return;
    let sheetDrawingRelsIndex = 0;
    let drawingId = 0;
    let sheetRelsIndex = report.files.findIndex(file => file.name.indexOf(`sheet${sheet.sheetNumber}.xml.rels`) != -1);
    // нет sheetRels у листа
    if (sheetRelsIndex == -1) {
      // ищем все drawings
      let allDrawings = report.files.filter(file => file.name.indexOf('drawings/drawing') != - 1);
      // берем максимальное название
      if (allDrawings.length) {
        drawingId = Math.max(0, ...allDrawings.map(file => +file.name.substring(file.name.indexOf('xl/drawings/drawing') + 19, file.name.lastIndexOf('.'))));
        drawingId++;
      } else {
        drawingId = 1;
      }
      // создаем новый файл с макс названием +1
      report.files.push(createBlankDrawingRelsFile(drawingId));
      sheetDrawingRelsIndex = report.files.length - 1;
      // добавляем sheetRels с указателем на drawings
      report.files.push(createBlankSheetRelsFile(sheet.sheetNumber));
      sheetRelsIndex = report.files.length - 1;
      let maxSheetRelsId = Math.max(0, ...(report.files[sheetRelsIndex].data.match(/Id=".*?"/g) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
      report.files[sheetRelsIndex].data = report.files[sheetRelsIndex].data.replace(
        '</Relationships>',
        `<Relationship Id="rId${maxSheetRelsId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingId}.xml"/></Relationships>`
      );
      // создание drawingRels
      let sheetDrawingIndex = 0;
      report.files.push(createBlankDrawingFile(drawingId));
      sheetDrawingIndex = report.files.length - 1;
      // добавление ссылки на drawing в content-type
      report.files[0].data = report.files[0].data.replace(
        '</Types>',
        `<Override PartName="/xl/drawings/drawing${drawingId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`
      );
      // добавление ссылки на drawing в sheet
      report.files[sheet.index].data = report.files[sheet.index].data.replace(
        '</worksheet>',
        `<drawing r:id="rId${maxSheetRelsId + 1}"/></worksheet>`
      );
      let maxSheetDrawingRelsId = Math.max(0, ...(report.files[sheetDrawingRelsIndex].data.match(/Id=".*?"/) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
      const sheetJson = JSON.parse(xmljs.xml2json(sheet.file.data, { compact: true })).worksheet;
      images.forEach((image, index) => {
        let imageParams = getImagePosition(sheetJson, image.fileName);
        let imageRid = maxSheetDrawingRelsId + index + 1;
        report.files[sheetDrawingRelsIndex].data = report.files[sheetDrawingRelsIndex].data.replace(
          '</Relationships>',
          `<Relationship Id="rId${imageRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${image.encodedImageName}.png"/></Relationships>`
        );
        report.files[sheetDrawingIndex].data = report.files[sheetDrawingIndex].data.replace(
          '</xdr:wsDr>',
          `<xdr:oneCellAnchor><xdr:from><xdr:col>${imageParams.coords.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${imageParams.coords.row}</xdr:row><xdr:rowOff>1</xdr:rowOff></xdr:from><xdr:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${imageRid}" name="Изображение"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${imageRid}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C3C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns="" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/></a:xfrm><a:prstGeom prst="rect"/></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`
        );
      })
    } else {
      // sheetRels есть, ищем указатель на drawings
      let drawingLink = report.files[sheetRelsIndex].data.match(/drawings\/drawing.?\.xml/);
      if (!drawingLink) {
        // ищем все drawings
        let allDrawings = report.files.filter(file => file.name.indexOf('drawings/drawing') != - 1);
        // берем максимальное название
        if (allDrawings.length) {
          drawingId = Math.max(0, ...allDrawings.map(file => +file.name.substring(file.name.indexOf('xl/drawings/drawing') + 19, file.name.lastIndexOf('.'))));
          drawingId++;
        }
        // создаем новый файл с макс названием +1
        report.files.push(createBlankDrawingRelsFile(drawingId));
        sheetDrawingRelsIndex = report.files.length - 1;
        // поиск максимального идентификатор в ссылка листа
        let maxSheetRelsId = Math.max(0, ...(report.files[sheetRelsIndex].data.match(/Id=".*?"/) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
        // вставка указателя на drawingRels
        report.files[sheetRelsIndex].data = report.files[sheetRelsIndex].data.replace(
          '</Relationships>',
          `<Relationship Id="rId${maxSheetRelsId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingId}.xml"/></Relationships>`
        );
        // создание drawingRels
        let sheetDrawingIndex = 0;
        report.files.push(createBlankDrawingFile(drawingId));
        sheetDrawingIndex = report.files.length - 1;
        // добавление ссылки на drawing в content-type
        report.files[0].data = report.files[0].data.replace(
          '</Types>',
          `<Override PartName="/xl/drawings/drawing${drawingId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`
        );
        // добавление ссылки на drawing в sheet
        report.files[sheet.index].data = report.files[sheet.index].data.replace(
          '</worksheet>',
          `<drawing r:id="rId${maxSheetRelsId + 1}"/></worksheet>`
        );

        let maxSheetDrawingRelsId = Math.max(0, ...(report.files[sheetDrawingRelsIndex].data.match(/Id=".*?"/g) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
        const sheetJson = JSON.parse(xmljs.xml2json(sheet.file.data, { compact: true })).worksheet;
        images.forEach((image, index) => {
          let imageParams = getImagePosition(sheetJson, image.fileName);
          let imageRid = maxSheetDrawingRelsId + index + 1;
          report.files[sheetDrawingRelsIndex].data = report.files[sheetDrawingRelsIndex].data.replace(
            '</Relationships>',
            `<Relationship Id="rId${imageRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${image.encodedImageName}.png"/></Relationships>`
          );
          report.files[sheetDrawingIndex].data = report.files[sheetDrawingIndex].data.replace(
            '</xdr:wsDr>',
            `<xdr:oneCellAnchor><xdr:from><xdr:col>${imageParams.coords.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${imageParams.coords.row}</xdr:row><xdr:rowOff>1</xdr:rowOff></xdr:from><xdr:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${imageRid}" name="Изображение"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${imageRid}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C3C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns="" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/></a:xfrm><a:prstGeom prst="rect"/></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`
          );
        })
      } else {
        // если ссылка на drawings есть
        let sheetDrawingIndex = 0;
        sheetDrawingIndex = report.files.findIndex(file => file.name.indexOf(drawingLink) != -1);
        let relNumber = report.files[sheetDrawingIndex].name.substring(report.files[sheetDrawingIndex].name.indexOf('xl/drawings/drawing') + 19, report.files[sheetDrawingIndex].name.lastIndexOf('.'));
        sheetDrawingRelsIndex = report.files.findIndex(file => file.name.indexOf(`xl/drawings/_rels/drawing${relNumber}.xml.rels`) != -1);
        if (sheetDrawingRelsIndex == -1) {
          report.files.push(createBlankDrawingRelsFile(relNumber));
          sheetDrawingRelsIndex = report.files.length - 1;
        }
        let maxSheetDrawingRelsId = Math.max(0, ...(report.files[sheetDrawingRelsIndex].data.match(/Id=".*?"/) || []).map(elem => +elem.substring(elem.indexOf('rId') + 3, elem.length - 1)));
        const sheetJson = JSON.parse(xmljs.xml2json(sheet.file.data, { compact: true })).worksheet;
        images.forEach((image, index) => {
          let imageParams = getImagePosition(sheetJson, image.fileName);
          let imageRid = maxSheetDrawingRelsId + index + 1;
          report.files[sheetDrawingRelsIndex].data = report.files[sheetDrawingRelsIndex].data.replace(
            '</Relationships>',
            `<Relationship Id="rId${imageRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${image.encodedImageName}.png"/></Relationships>`
          );
          report.files[sheetDrawingIndex].data = report.files[sheetDrawingIndex].data.replace(
            '</xdr:wsDr>',
            `<xdr:oneCellAnchor><xdr:from><xdr:col>${imageParams.coords.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${imageParams.coords.row}</xdr:row><xdr:rowOff>1</xdr:rowOff></xdr:from><xdr:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${imageRid}" name="Изображение"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${imageRid}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C3C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns="" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imageParams.size.col}" cy="${imageParams.size.row}"/></a:xfrm><a:prstGeom prst="rect"/></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`
          );
        })
      }
    }
  })
}
/**
 * Creating an empty sheet binding file
 * @param {number} sheetNumber
 * @returns {Object}
 */
function createBlankSheetRelsFile(sheetNumber) {
  return {
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
    isMarked: true,
    name: `xl/worksheets/_rels/sheet${sheetNumber}.xml.rels`,
    parent: ""
  };
}
/**
 * Creating an empty sheet drawing rels file
 * @param {number} sheetNumber 
 * @returns {Object}
 */
function createBlankDrawingRelsFile(sheetNumber) {
  return {
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
    isMarked: false,
    name: `xl/drawings/_rels/drawing${sheetNumber}.xml.rels`,
    parent: ""
  };
}
/**
 * Creating an empty sheet drawing file
 * @param {number} sheetNumber
 * @returns {Object} 
 */
function createBlankDrawingFile(sheetNumber) {
  return {
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"></xdr:wsDr>`,
    isMarked: true,
    name: `xl/drawings/drawing${sheetNumber}.xml`,
    parent: ""
  };
}
/**
 * @param {Object} sheet  - sheet data
 * @param {string} imagePlaceHolder 
 * @returns {Object}
 */
function getImagePosition(sheet, imagePlaceHolder) {
  const rows = sheet.sheetData.row;
  const colsAttributes = sheet.cols;
  let imageParams = {
    coords: {
      row: 0,
      col: 0
    },
    size: {
      row: 0,
      col: 0
    }
  };
  rows.forEach((row, rowIndex) => {
    let columns;
    if (!Array.isArray(row.c)) columns = [row.c];
    else columns = row.c;
    columns.forEach((column, colIndex) => {
      if (!column) return
      if (!column.is) return;
      if (!column.is.t) return;
      if (!column.is.t._text) return;
      if (column.is.t._text.indexOf(imagePlaceHolder) != -1) {
        imageParams.coords.row = rowIndex;
        imageParams.coords.col = colIndex;
        let imageSizeFormatter = column.is.t._text.indexOf(':') != -1 ? column.is.t._text.substring(column.is.t._text.indexOf(':') + 1) : null;
        let imageWidth, imageHeight;
        if (imageSizeFormatter) {
          ([imageWidth, imageHeight = imageWidth] = imageSizeFormatter.split('*'));
          imageParams.size.row = imageHeight * 12700;
          imageParams.size.col = imageWidth * 12700;
        } else {
          if (row && row._attributes && row._attributes.ht) imageParams.size.row = (row._attributes.ht * 12500).toFixed(0); else imageParams.size.row = (100 * 12500).toFixed(0);
          if (colsAttributes && colsAttributes.col && !Array.isArray(colsAttributes.col)) colsAttributes.col = [colsAttributes.col];
          if (colsAttributes && colsAttributes.col &&
            colsAttributes.col[imageParams.coords.col] &&
            colsAttributes.col[imageParams.coords.col]._attributes &&
            colsAttributes.col[imageParams.coords.col]._attributes.width) imageParams.size.col = (colsAttributes.col[imageParams.coords.col]._attributes.width * 70000).toFixed(0);
        }
      }
    })
  })
  return imageParams;
}

function parseOptions(options, callbackFn, callback) {
  if (typeof (options) === 'function') {
    callbackFn = options;
    options = {};
  }
  // analyze pre-declared variables in the Object "options"
  parser.findVariables(options.variableStr, function (err, str, variables) {
    var _options = {
      enum: options.enum,
      currency: {},
      lang: (options.lang || params.lang).toLowerCase(), // TODO test toLowerCase
      translations: options.translations || params.translations,
      complement: options.complement,
      reportName: options.reportName,
      convertTo: options.convertTo,
      extension: options.extension,
      formatters: carbone.formatters,
      existingVariables: variables
    };
    var _currency = _options.currency;
    var _locale = locale[_options.lang] || locale.en;
    var _currencyFromLocale = _locale.currency.code;
    _currency.source = options.currencySource || params.currencySource;
    _currency.target = options.currencyTarget || params.currencyTarget;
    _currency.rates = options.currencyRates || params.currencyRates;
    if (!_currency.source) {
      _currency.source = _currencyFromLocale;
    }
    if (!_currency.target) {
      _currency.target = _currencyFromLocale;
    }
    return callback(_options, callbackFn);
  });
}

/**
 * Parse and compute xml for all files of the template
 * @param  {Object}   template     template file returned by file.js
 * @param  {Object}   data         data to insert
 * @param  {Object}   options      {'complement', 'variables', ...}
 * @param  {Integer}  currentIndex currently visited files in the template
 * @param  {Function} callback(err, template)
 */
function walkFiles(template, data, options, currentIndex, callback) {
  if (currentIndex >= template.files.length) {
    // we have parsed all files, now parse the reportName
    if (template.reportName !== undefined) {
      builder.buildXML(template.reportName, data, options, function (err, reportNameResult) {
        template.reportName = reportNameResult;
        callback(null, template);
      });
    }
    else {
      callback(null, template);
    }
    return;
  }
  var _file = template.files[currentIndex];
  if (_file.isMarked === true) {
    builder.buildXML(_file.data, data, options, function (err, xmlResult) {
      if (err) {
        return callback(err, template);
      }
      _file.data = xmlResult;
      process.nextTick(function () {
        walkFiles(template, data, options, ++currentIndex, callback);
      });
    });
  }
  else {
    walkFiles(template, data, options, ++currentIndex, callback);
  }
}

/**
 * Extract the option values and convert it to LibreOffice format
 * https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options
 * @param  {String || Object} data
 * @return {String}
 */
function extractValuesFromOptions(data) {
  // most of the case, there is no options
  if (data === '' || data === null || data === undefined) {
    data = {};
  }
  /*
    Default values
      Separator : ','
      Delimiter : '"'
      Encoding  : UTF-8
   */
  var _optionsArray = ['44', '34', '76'];
  if (typeof (data) === 'string') {
    var _dataToArray = data.split(',');
    for (var i = 0; i < _dataToArray.length; i++) {
      _optionsArray[i] = _dataToArray[i].trim();
    }
  }
  else if (typeof (data) === 'object') {
    _optionsArray[0] = (data.fieldSeparator || ',').charCodeAt(0);
    _optionsArray[1] = (data.textDelimiter || '"').charCodeAt(0);
    _optionsArray[2] = data.characterSet || '0';
    if (data.numberOfFirstLine) {
      _optionsArray[3] = data.numberOfFirstLine;
    }
    if (data.cellFormat) {
      _optionsArray[4] = data.cellFormat;
    }
  }
  return _optionsArray.join(',');
}

/**
 * Verify the files extension type based on the format.js
 *
 * @param  {String} extensionIn extension type coming from the template file.
 * @param  {String} extensionOut extension type expected to be converted.
 * @return {Boolean} Return true if the extensions format are not matching, otherwhise false.
 */
function checkDocTypeAndOutputExtensions(extensionIn, extensionOut) {
  for (var docType in format) {
    if (format[docType][extensionIn] !== undefined
      && format[docType][extensionOut] !== undefined) {
      return docType;
    }
  }
  return null;
}

/**
 * Convert a file using LibreOffice.
 * @param  {Buffer|String}   data
 * @param  {String}          convertTo
 * @param  {Object}          options (optional) {
 *                                formatName', 'formatOptions'}
 * @param  {Function}        callback(err, data)
 */
function convert(data, convertTo, options, callback) {
  if (typeof (options) === 'function') {
    callback = options;
    options = {};
  }

  if (!options.extension) {
    return callback('options.extension must be set to detect input file type', null);
  }
  const docType = checkDocTypeAndOutputExtensions(options.extension, convertTo);
  if (docType === null) {
    return callback(`Format "${options.extension}" can't be converted to "${convertTo}".`);
  }
  var _fileFormatOutput = format[docType][convertTo].format;
  var _filePathInput = path.join(params.tempPath, helper.getUID()) + '.' + options.extension;
  var _formatOptions = extractValuesFromOptions(options.formatOptions);

  fs.writeFile(_filePathInput, data, function (err) {
    if (err) {
      return callback(err);
    }
    converter.convertFile(_filePathInput, _fileFormatOutput, _formatOptions, function (errConvert, data) {
      fs.unlink(_filePathInput, function (err) {
        debug('cannot remove file ' + err);
      });
      callback(errConvert, data);
    });
  });
}

// add default formatters
carbone.addFormatters(require('../formatters/array.js'));
carbone.addFormatters(require('../formatters/condition.js'));
carbone.addFormatters(require('../formatters/date.js'));
carbone.addFormatters(require('../formatters/number.js'));
carbone.addFormatters(require('../formatters/string.js'));
translator.loadTranslations(params.templatePath);
module.exports = carbone;
