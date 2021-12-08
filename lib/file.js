var path  = require('path');
var fs = require('fs');
var params = require('./params');
var yauzl = require('yauzl');
var unzipEmbeddedFileTypes = ['.xlsx', '.ods'];
var yazl = require('yazl');
var debug = require('debug')('carbone');

var file = {

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
   * Get specific file in template
   *
   * TODO test it
   *
   * @param  {Object}    template
   * @param  {String}    filename
   * @return {Object|null}
   */
  getTemplateFile : function (template, filename) {
    for (var i = 0; i < template.files.length; i++) {
      if (template.files[i].name === filename) {
        return template.files[i];
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
        return callback(null, _unzippedFiles);
      });
      zipfile.on('error', callback);
      zipfile.readEntry();
      zipfile.on('entry', function (entry) {
        var _unzippedFile = {
          name : entry.fileName,
          data : Buffer.from([])
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
      files      : []
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
   * Check the extension of template
   * @param {Object} template Template to analyze
   */
  detectType : function (template) {
    if (this._checkWordInFilename(template, 'word/')) {
      return 'docx';
    }
    if (this._checkWordInFilename(template, 'xl/')) {
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
      return 'xml';
    }
    var _extname = path.extname(template.filename).slice(1);
    if (template.isZipped === false && _extname !== '') {
      return _extname;
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
      if (template.files[i].name.startsWith(string)) {
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
  file.unzip(_fileToUnzip.data, function (err, files) {
    if (err) {
      return callback(err, template);
    }
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

module.exports = file;
