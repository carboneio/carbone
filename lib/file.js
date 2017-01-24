var path  = require('path');
var fs = require('fs');
var params = require('./params');
var helper = require('./helper');
var zipWriter = require("moxie-zip").ZipWriter;
var yauzl = require("yauzl");
var unzipEmbeddedFileTypes = ['.xlsx', '.ods'];

var file = {

  /**
   * is Zipped return callback(true) if the file is zipped
   * @param  {String}   filePath file path
   * @param  {Function} callback(err, isZipped)
   */
  isZipped : function(filePath, callback){
    var _buf = new Buffer(10, 'hex');
    fs.open(filePath, 'r', function(err, fd){
      if(err){
        return callback(err, false);
      }
      fs.read(fd, _buf, 0, 10, 0, function(err, bytesRead, buffer){
        callback(err, (buffer.slice(0, 2).toString() === 'PK'));
      });
    });
  },

  /**
   * Unzip a file 
   * @param  {String}   filePath              file to unzip
   * @param  {Function} callback(err, files)  files is an array of files ['name':'filename', 'buffer':Buffer]
   */
  unzip : function(filePath, callback){
    var _unzippedFiles = [];
    var _unzipFn = yauzl.open;
    if(Buffer.isBuffer(filePath) === true){
      _unzipFn = yauzl.fromBuffer;
    }
    _unzipFn(filePath, {lazyEntries: true, decodeStrings: true}, function(err, zipfile) {
      if (err) {
        return callback(err);
      }
      zipfile.on("end", function(){
        zipfile.close();
        return callback(null, _unzippedFiles);
      });
      zipfile.on("error", callback);
      zipfile.readEntry();
      zipfile.on("entry", function(entry) {
        var _unzippedFile = {
          name : entry.fileName,
          data : new Buffer(0)
        };
        _unzippedFiles.push(_unzippedFile);
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          zipfile.readEntry();
        } 
        else {
          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) {
              zipfile.close();
              return callback(err);
            }
            var buffers = [];
            readStream.on("data", function(data) {
              buffers.push(data);
            });
            readStream.on("end", function() {
              _unzippedFile.data = Buffer.concat(buffers);
              zipfile.readEntry();
            });
            readStream.on("error", function(err) {
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
   * @param  {Array}    files                 files is an array of files ['name':'filename', 'buffer':Buffer] 
   * @param  {Function} callback(err, result) result is a buffer (the zip file)
   */
  zip : function(files, callback){
    var zip = new zipWriter();
    for (var i = 0; i < files.length; i++) {
      var _file = files[i];
      zip.addData(_file.name, _file.data);
    };
    zip.toBuffer(function(buf) {
      callback(null, buf);
    });
  },

  /**
   * Open a template  (zipped or not). It will find the template and convert the buffer into strings if it contains xml
   * @param  {String}   templateId               template name (with or without the path)
   * @param  {Function} callback(err, template)  
   */
  openTemplate : function(templateId, callback){
    var _template = {
      'isZipped' : false,
      'filename' : templateId,
      'embeddings' : [],
      'files' : []
    };
    var _templateFile = path.resolve(params.templatePath, templateId);
    file.isZipped(_templateFile, function(err, isZipped){
      if(err) {
        return callback(err, _template);
      }
      if(isZipped === true){
        _template.isZipped = true;
        var _filesToUnzip = [{
          name : '',
          data : _templateFile
        }];
        return unzipFiles(_template, _filesToUnzip, callback);
      }
      else{
        fs.readFile(_templateFile, 'utf8', function(err, data){
          var _file = {
            'name' : path.basename(templateId),
            'data' : data,
            'isMarked' : true,
            'parent' : ''
          };
          _template.files.push(_file);
          return callback(err, _template);
        });
      }
    });
  },

  /**
   * Transform a report object into a zipped buffer (if it is a docx, odt, ...) or a string (it if is a basic xml...) 
   * @warning `report`is modified
   * @param  {Object}   report              report object. Example: {'isZipped': true, files:[{'name': 'bla', 'data': 'buffer or string'}]}
   * @param  {Function} callback(err, data) data can be a buffer (docx,...) or a string (xml)
   */
  buildFile : function(report, callback){
    if(report.isZipped===true){
      return zipFiles(report.files, callback);
    }
    else{
      if(report.files.length !== 1){
        throw Error('This report is not zipped and does not contain exactly one file');
      }
      return callback(null, report.files[0].data); 
    }
  }

};


function unzipFiles(template, filesToUnzip, callback){
  if(filesToUnzip.length === 0){
    return callback(null, template);
  }
  var _fileToUnzip = filesToUnzip.pop();
  file.unzip(_fileToUnzip.data, function(err, files){
    if(err) {
      return callback(err, template);
    }
    for (var i = 0; i < files.length; i++){
      var _file = files[i];
      var _extname = path.extname(_file.name);
      _file.isMarked = false;
      _file.parent = _fileToUnzip.name;
      if(_extname === '.xml' || _extname === '.rels'){
        _file.isMarked = true;
        _file.data = _file.data.toString();
        template.files.push(_file);
      }
      //only unzip first level
      else if(_file.parent === '' && unzipEmbeddedFileTypes.indexOf(_extname) !== -1){
        template.embeddings.push(_file.name);
        filesToUnzip.push(_file);
      }
      else{
        template.files.push(_file);
      }
    };
    return unzipFiles(template, filesToUnzip, callback);
  });
}


function zipFiles(filesToZip, callback){
  var _previousParentName = null;
  var _index = filesToZip.length - 1;
  for (; _index >= 0; _index--) {
    var _file = filesToZip[_index];
    if(_file.parent !== _previousParentName && _previousParentName !== null){
      break;
    }
    if(Buffer.isBuffer(_file.data) === false){
      _file.data = new Buffer(_file.data, 'utf8');
    }
    _previousParentName = _file.parent;
  }
  var _groupOfFileToZip = filesToZip.splice(_index + 1);
  file.zip(_groupOfFileToZip, function(err, buffer){
    if(filesToZip.length === 0 || err){
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