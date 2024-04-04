var path  = require('path');
var fs = require('fs');
var params = require('./params');
var yauzl = require('yauzl');
var unzipEmbeddedFileTypes = ['.xlsx', '.ods'];
var yazl = require('yazl');
var debug = require('debug')('carbone');
const { pipeline } = require('stream');
const helper = require('./helper');
const egress = require('./egress');
const util   = require('util');
const pdfLib = require('pdf-lib').PDFDocument;

const ACCEPTED_MIMETYPE_EXTERNAL_FILES = {
  'application/pdf' : 'pdf'
};
const ACCEPTED_EXTENSION_FILES = {
  pdf : 'application/pdf'
};
const MAX_PARALLEL_FILE_DOWNLOAD = 15;
const MAX_APPEND_SAME_PDF = 5;

const file = {

  /**
   * is Zipped return callback(true) if the file is zipped
   * @param  {String}   filePath file path
   * @param  {Function} callback(err, isZipped)
   */
  isZipped : function (filePath, callback) {
    var _buf = Buffer.allocUnsafe(10);
    fs.open(filePath, 'r', function (err, fd) {
      if (err) {
        return callback(err, false);
      }
      fs.read(fd, _buf, 0, 10, 0, function (err, bytesRead, buffer) {
        fs.close(fd, function () {
          callback(err, (buffer.slice(0, 2).toString() === 'PK'));
        });
      });
    });
  },


  /**
   * Download files (PDF) when the formatter appendFile is used
   *
   * It downloads files (PDF) and updates options.fileDatabase
   *
   * @param  {Object}   options
   * @param  {Function} callback callback(err);
   */
  fetchFileDatabase : function (options, callback) {
    if (options?.convertTo?.extension !== 'pdf') {
      options.fileDatabase = new Map();
    }
    if (options?.fileDatabase === undefined || options.fileDatabase.previousSize === options.fileDatabase.size || options.fileDatabase.size === 0) {
      // (options.fileDatabase.previousSize === options.fileDatabase.size) happens because buildXML can be called for headers/footers
      return callback(null);
    }
    options.fileDatabase.previousSize = options.fileDatabase.size;
    if (options.fileDatabase.size > params.maxDownloadFileCount) {
      return callback(new Error(`Maximum number of downloaded files exceeded (limit: ${params.maxDownloadFileCount}).`));
    }
    const _items = [...options.fileDatabase]; // TODO: could we avoid this transformation?
    let _totalDownloadedSize = 0;
    helper.genericQueue(_items, executeItem, callback, MAX_PARALLEL_FILE_DOWNLOAD).start();
    function executeItem (item, next) {
      const _url = item[0];
      const _obj = item[1];
      if (_obj.data !== undefined) {
        // File already downloaded.
        return next();
      }
      if (_obj.count > MAX_APPEND_SAME_PDF) {
        return next(new Error(`The limit for appending identical files has been exceeded (limit: ${MAX_APPEND_SAME_PDF}). The file was: "${_url}"`));
      }
      const _fileFetchT = options.metrics.time('fileFetchT');
      egress.downloadExternalFile(_url, ACCEPTED_MIMETYPE_EXTERNAL_FILES, ACCEPTED_EXTENSION_FILES, options, (err, file) => {
        _fileFetchT.timeEnd();
        options.metrics.add('fileFetchS', file?.data?.length ?? 0);
        _obj.data = file?.data;
        _obj.extension = file?.extension;
        _obj.mimetype = file?.mimetype;
        _totalDownloadedSize += file?.data?.length;
        if (_totalDownloadedSize > params.maxDownloadFileSizeTotal) {
          return next(new Error(`Maximum total file size exceeded (limit: ${params.maxDownloadFileSizeTotal} bytes). Last downloaded file was: "${_url}"`));
        }
        next(err);
      });
    }
  },

  /**
   * Get specific file in template
   *
   * TODO test it
   *
   * @param  {Object}    template
   * @param  {String}    filename
   * @param  {String}    parent
   * @return {Object|null}
   */
  getTemplateFile : function (template, filename, parent = null) {
    for (var i = 0; i < template.files.length; i++) {
      const _file = template.files[i];
      if (_file.name === filename && (parent === null || _file.parent === parent)) {
        return _file;
      }
    }
    return null;
  },

  /**
   * Unzip a file
   * @param  {String}   filePath              file to unzip
   * @param  {Function} callback(err, files)  files is an array of files ['name':'filename', 'buffer':Buffer]
   */
  unzip : function (filePath, callback) {
    var _unzippedFiles = [];
    var _unzipFn = yauzl.open;
    if (Buffer.isBuffer(filePath) === true) {
      _unzipFn = yauzl.fromBuffer;
    }
    _unzipFn(filePath, {lazyEntries : true, decodeStrings : true}, function (err, zipfile) {
      if (err) {
        return callback(err);
      }
      zipfile.on('end', function () {
        zipfile.close();
        return callback(null, _unzippedFiles, zipfile.fileSize);
      });
      zipfile.on('error', callback);
      zipfile.readEntry();
      zipfile.on('entry', function (entry) {
        var _unzippedFile = {
          name      : entry.fileName,
          data      : Buffer.from([]),
          zipedSize : entry.compressedSize
        };
        _unzippedFiles.push(_unzippedFile);
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          zipfile.readEntry();
        }
        else {
          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) {
              zipfile.close();
              return callback(err);
            }
            var buffers = [];
            readStream.on('data', function (data) {
              buffers.push(data);
            });
            readStream.on('end', function () {
              _unzippedFile.data = Buffer.concat(buffers);
              zipfile.readEntry();
            });
            readStream.on('error', function (err) {
              zipfile.close();
              return callback(err);
            });
          });
        }
      });
    });
  },

  /**
   * Zip a group of files
   * @param  {Array}    files                 files is an array of files ['name':'filename', 'data':Buffer]
   * @param  {Function} callback(err, result) result is a buffer (the zip file)
   */
  zip : function (files, callback) {
    var _buffer = [];
    var _zip = new yazl.ZipFile();
    _zip.outputStream.on('data', function (data) {
      _buffer.push(data);
    });
    _zip.outputStream.on('error', function (err) {
      debug('Error when building zip file ' + err);
    });
    _zip.outputStream.on('end', function () {
      var _finalBuffer = Buffer.concat(_buffer);
      callback(null, _finalBuffer);
    });
    for (var i = 0; i < files.length; i++) {
      var _file = files[i];
      if (_file.name.endsWith('/') === true) {
        _zip.addEmptyDirectory(_file.name);
      }
      else {
        _zip.addBuffer(Buffer.from(_file.data), _file.name);
      }
    }
    _zip.end();
  },

  /**
   * Open a template  (zipped or not). It will find the template and convert the buffer into strings if it contains xml
   * @param  {String}   templateId               template name (with or without the path)
   * @param  {Function} callback(err, template)
   */
  openTemplate : function (templateId, callback) {
    var _template = {
      isZipped   : false,
      filename   : templateId,
      embeddings : [],
      files      : [],
      fileSize   : 0
    };
    if (templateId instanceof Object) {
      // accept already dezipped files (for test purpose)
      return callback(null, templateId);
    }
    // security, remove access on parent directory
    // if (/\.\./.test(path.dirname(templateId)) === true) {
    //   return callback('access forbidden');
    // }
    // and then use path instead of resolve
    var _templateFile = path.resolve(params.templatePath, templateId);
    file.isZipped(_templateFile, function (err, isZipped) {
      if (err) {
        return callback(err, _template);
      }
      if (isZipped === true) {
        _template.isZipped = true;
        var _filesToUnzip = [{
          name : '',
          data : _templateFile
        }];
        return unzipFiles(_template, _filesToUnzip, callback);
      }
      else {
        fs.readFile(_templateFile, 'utf8', function (err, data) {
          var _file = {
            name     : path.basename(templateId),
            data     : data,
            isMarked : true,
            parent   : ''
          };
          _template.files.push(_file);
          return callback(err, _template);
        });
      }
    });
  },

  /**
   * Create a zip of multiple files
   *
   * @param   {Array}     fileList        The file list. Array of string absolute path
   * @param   {String}    zipDestination  The zip destination
   * @param   {Function}  callback        The callback
   */
  batchZip : function (fileList, zipDestination, callback) {
    const _zipfile = new yazl.ZipFile();
    const _destStream = fs.createWriteStream(zipDestination);
    pipeline(_zipfile.outputStream, _destStream, callback);
    for (var i = 0; i < fileList.length; i++) {
      const _file = fileList[i];
      _zipfile.addFile(_file, path.basename(_file), { compress : false});
    }
    _zipfile.end();
  },

  /**
   * Delete multiples files
   *
   * @param    {Array}  fileList  The file list. Array of string absolute path
   */
  deleteFiles : function (fileList) {
    for (var i = 0; i < fileList.length; i++) {
      const _file = fileList[i];
      fs.unlink(_file, (e) => {
        if (e) {
          console.log('Warning: cannot delete file ' + e);
        }
      });
    }
  },

  /**
   * Check the extension of template
   * @param {Object} template Template to analyze
   */
  detectType : function (template) {
    if (this._checkWordInFilename(template, 'word/')) {
      return 'docx';
    }
    if (this._checkWordInFilename(template, 'xl/')) {
      if (params.xlsmEnabled === true && this.getTemplateFile(template, 'xl/vbaProject.bin')) {
        return 'xlsm';
      }
      return 'xlsx';
    }
    if (this._checkWordInFilename(template, 'ppt/')) {
      return 'pptx';
    }
    if (this._checkMimetypeFile(template, 'application/vnd.oasis.opendocument.graphics')) {
      return 'odg';
    }
    if (this._checkMimetypeFile(template, 'application/vnd.oasis.opendocument.text')) {
      return 'odt';
    }
    if (this._checkMimetypeFile(template, 'application/vnd.oasis.opendocument.spreadsheet')) {
      return 'ods';
    }
    if (this._checkMimetypeFile(template, 'application/vnd.oasis.opendocument.presentation')) {
      return 'odp';
    }
    if (this._checkMimetypeFile(template, 'application/vnd.adobe.indesign-idml-package')) {
      return 'idml';
    }
    if (template.files.length === 1 && /office:mimetype="application\/vnd\.oasis\.opendocument\.text"/.test(template.files[0].data) === true) {
      return 'fodt';
    }
    if (this._isXHTMLFile(template)) {
      return 'xhtml';
    }
    if (this._isHTMLFile(template)) {
      return 'html';
    }
    if (this._isXMLFile(template)) {
      if (this._isWordExcelXML2003File(template)) {
        return 'ooxml';
      }
      return 'xml';
    }
    var _extname = path.extname(template.filename).slice(1);
    if (template.isZipped === false) {
      if ( _extname !== '' ) {
        return _extname;
      }
      else if (template.files.length === 1 && typeof (template.files[0].data) === 'string') {
        return 'txt'; // mainly for internal use (tests) when renderXML is called. Not public yet. TODO v5: replace it by ".md"?
      }
    }
    return null;
  },

  /**
   * Check if the file is a XML file
   * @param {Object} template File content to analyze
   */
  _isXMLFile : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _template = template.files[i].data;
      if (/^\s*</.test(_template) === true) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if the file is a XML file
   * @param {Object} template File content to analyze
   */
  _isWordExcelXML2003File : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _template = template.files[i].data;
      if (/<\?mso-application progid="Word.Document"\?>/i.test(_template) === true ||
          /<\?mso-application progid="Excel.Sheet"\?>/i.test(_template) === true) {
        return true;
      }
    }
    return false;
  },

  /**
   * Check if the file is an XHTML file
   * @param {Object} template File content to analyze
   */
  _isXHTMLFile : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _template = template.files[i].data;
      if (/^\s*<!DOCTYPE/i.test(_template) === true) {
        if (/<html\s+xmlns="/i.test(_template) === true) {
          return true;
        }
      }
    }

    return false;
  },

  /**
   * Check if the file is an HTML file
   * @param {Object} template File content to analyze
   */
  _isHTMLFile : function (template) {
    for (var i = 0; i < template.files.length; i++) {
      var _template = template.files[i].data;
      if (/<html/i.test(_template) === true) {
        return true;
      }
    }
    return false;
  },

  /**
   * Check if a string exists in a mimetype file
   * @param {Object} template Template object if unzipped. Else it's a string
   * @param {String} string String to match in mimetype file
   */
  _checkMimetypeFile : function (template, string) {
    for (var i = 0; i < template.files.length; i++) {
      if (template.files[i].name === 'mimetype') {
        if (template.files[i].data.toString() === string) {
          return true;
        }
        return false;
      }
    }
    return false;
  },

  /**
   * Check if a string is included in one of the filename
   * @param {Object} template Template object if unzipped. Else it's a string
   * @param {String} string String to check
   */
  _checkWordInFilename : function (template, string) {
    for (var i = 0; i < template.files.length; i++) {
      if (template.files[i].name.startsWith(string) && template.files[i].parent === '') {
        return true;
      }
    }
    return false;
  },

  /**
   * Transform a report object into a zipped buffer (if it is a docx, odt, ...) or a string (it if is a basic xml...)
   * @warning `report`is modified
   * @param  {Object}   report              report object. Example: {'isZipped': true, files:[{'name': 'bla', 'data': 'buffer or string'}]}
   * @param  {Function} callback(err, data) data can be a buffer (docx,...) or a string (xml)
   */
  buildFile : function (report, callback) {
    if (report.isZipped===true) {
      return zipFiles(report.files, callback);
    }
    else {
      if (report.files.length !== 1) {
        // only for test purpose when a template is not zipped
        return callback(null, report);
        // throw Error('This report is not zipped and does not contain exactly one file');
      }
      return callback(null, report.files[0].data);
    }
  },

  /**
   * Merge mutiple PDF into one
   *
   * @param   {String}    mainPdfFilePath  The main pdf file path
   * @param   {Map}       fileDatabase     A Map containing all PDF to add to the main PDF
   *                                       {
   *                                          data      : Buffer containing the PDF
   *                                          extension : pdf
   *                                          mimetype  : application/pdf
   *                                          position  : 'begin' | 'end'  --> Not implemented yet
   *                                       }
   * @param   {String}    outputFilePath   The output file path. Can be the same as mainPdfFilePath to overwrite the initial file
   * @param   {Function}  callback         The callback(err, result)
   */
  mergePDF : function (mainPdfFilePath, fileDatabase, outputFilePath, callback) {
    if ( fileDatabase?.size > 0 ) {
      return mergePDFAsync(mainPdfFilePath, fileDatabase, outputFilePath, (err) => {
        if (!err) {
          return callback(null);
        }
        let _lastParsedPDF;
        for (let [key, value] of fileDatabase) {
          if (value.source !== null) {
            _lastParsedPDF = value.source;
            break;
          }
        }
        if (/Failed to parse PDF document/.test(err) === true) {
          return callback(new Error('Failed to parse the external PDF document "'+_lastParsedPDF+'" or the main document. Unable to merge all PDFs together.'));
        }
        return callback(new Error('Unable to merge all PDFs together. Last parsed PDF: '+_lastParsedPDF));
      });
    }
    return callback(null);
  }

};

/**
 * Recursive function, which unzip embedded files if necessary
 * @param  {Object}   template
 * @param  {Array}    filesToUnzip
 * @param  {Function} callback(err, template)
 */
function unzipFiles (template, filesToUnzip, callback) {
  if (filesToUnzip.length === 0) {
    return callback(null, template);
  }
  var _fileToUnzip = filesToUnzip.pop();
  file.unzip(_fileToUnzip.data, function (err, files, fileSize) {
    if (err) {
      return callback(err, template);
    }
    template.fileSize += fileSize;
    for (var i = 0; i < files.length; i++) {
      var _file = files[i];
      var _extname = path.extname(_file.name);
      _file.isMarked = false;
      _file.parent = _fileToUnzip.name;
      if (_extname === '.xml' || _extname === '.rels') {
        _file.isMarked = true;
        _file.data = _file.data.toString();
        template.files.push(_file);
      }
      // only unzip first level
      else if (_file.parent === '' && unzipEmbeddedFileTypes.indexOf(_extname) !== -1) {
        template.embeddings.push(_file.name);
        filesToUnzip.push(_file);
      }
      else {
        template.files.push(_file);
      }
    }
    return unzipFiles(template, filesToUnzip, callback);
  });
}

/**
 * Recursive function, which zip all embedded file first, and the whole file at the end
 * @param  {Array}   filesToZip
 * @param  {Function} callback(err, buffer)
 */
function zipFiles (filesToZip, callback) {
  var _previousParentName = null;
  var _index = filesToZip.length - 1;
  for (; _index >= 0; _index--) {
    var _file = filesToZip[_index];
    if (_file.parent !== _previousParentName && _previousParentName !== null) {
      break;
    }
    if (Buffer.isBuffer(_file.data) === false) {
      try {
        _file.data = Buffer.from(_file.data, 'utf8');
      }
      catch (e) {
        _file.data = Buffer.from('', 'utf8');
      }
    }
    _previousParentName = _file.parent;
  }
  var _groupOfFileToZip = filesToZip.splice(_index + 1);
  file.zip(_groupOfFileToZip, function (err, buffer) {
    if (filesToZip.length === 0 || err) {
      return callback(err, buffer);
    }
    filesToZip.unshift({
      name   : _previousParentName,
      data   : buffer,
      parent : ''
    });
    return zipFiles(filesToZip, callback);
  });
}

/**
 * We use async because pdflib is not easy to use with callbacks and not documented
 */
const mergePDFAsync = util.callbackify( mergePDFPromise );
async function mergePDFPromise (mainPdfFilePath, fileDatabase, outputFilePath) {
  const _mainPDFBuffer = await fs.promises.readFile(mainPdfFilePath);
  const _mainPDF       = await pdfLib.load(_mainPDFBuffer);
  _mainPDF.setProducer('Carbone'); // replace default pdf-lib message
  for (let [key, value] of fileDatabase) {
    const _pdfToAdd = value;
    const _otherPDF = await pdfLib.load(_pdfToAdd.data);
    while (_pdfToAdd.count > 0) {
      _pdfToAdd.count--;
      const _otherPDFPages = await _mainPDF.copyPages(_otherPDF, _otherPDF.getPageIndices());
      _otherPDFPages.forEach((page) => _mainPDF.addPage(page));
    }
    _pdfToAdd.source = null; // used for error management TODO manage this!
  }
  const _mergedPDFBuffer = await _mainPDF.save();
  await fs.promises.writeFile(outputFilePath, _mergedPDFBuffer);
}


module.exports = file;
