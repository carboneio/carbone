var path  = require('path');
var fs = require('fs');
var params = require('./params');
var helper = require('./helper');
var zipReader = require('zipfile');
var zipWriter = require("moxie-zip").ZipWriter;


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
    var _zipfile = new zipReader.ZipFile(filePath);
    var _nbFiles = _zipfile.names.length;
    var _unzippedFiles = [];
    for (var i = 0; i < _nbFiles; i++) {
      var _filename = _zipfile.names[i];
      //I use the sync method because the async version reach the limit of open files of the OS (ulimit -n) in a performance test. It should change in the future
      var _buffer = _zipfile.readFileSync(_filename);
      _unzippedFiles.push({
        'name' : _filename,
        'data' : _buffer
      });
    }
    callback(null, _unzippedFiles);
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
      'files' : []
    };
    var _templateFile = path.resolve(params.templatePath, templateId);
    file.isZipped(_templateFile, function(err, isZipped){
      if(err) {
        return callback(err, _template);
      }
      if(isZipped === true){
        _template.isZipped = true;
        file.unzip(_templateFile, function(err, files){
          if(err) {
            return callback(err, _template);
          }
          //convert to string xml files
          for (var i = 0; i < files.length; i++){
            var _file = files[i];
            _file.isMarked = false;
            if(/\.xml$/.test(_file.name)===true){
              _file.isMarked = true;
              _file.data = _file.data.toString();
            }
            _template.files.push(_file);
          };
          return callback(err, _template);
        });
      }
      else{
        fs.readFile(_templateFile, 'utf8', function(err, data){
          var _file = {
            'name' : path.basename(templateId),
            'data' : data,
            'isMarked' : true
          };
          _template.files.push(_file);
          return callback(err, _template);
        });
      }
    });
  },

  /**
   * Transform a report object into a zipped buffer (if it is a docx, odt, ...) or a string (it if is a basic xml...) 
   * @param  {Object}   report              report object. Example: {'isZipped': true, files:[{'name': 'bla', 'data': 'buffer or string'}]}
   * @param  {Function} callback(err, data) data can be a buffer (docx,...) or a string (xml)
   */
  buildFile : function(report, callback){
    if(report.isZipped===true){
      for (var i = 0; i < report.files.length; i++) {
        var _file = report.files[i];
        if(Buffer.isBuffer(_file.data)===false){
          _file.data = new Buffer(_file.data, 'utf8');
        }
      };
      file.zip(report.files, function(err, buffer){
        return callback(err, buffer);
      });
    }
    else{
      if(report.files.length !== 1){
        throw Error('This report is not zipped and does not contain exactly one file');
      }
      return callback(null, report.files[0].data); 
    }
  }

};

/* unzip asynchrone
    var _zipfile = new zipReader.ZipFile(filePath);
    var _nbFiles = _zipfile.names.length;
    var _nbUnzipped = 0;
    var _unzippedFiles = [];
    for (var i = 0; i < _nbFiles; i++) {
      var _filename = _zipfile.names[i];
      unzipNextFile(_filename);
    }
    function unzipNextFile(filename){
      //var buffer = _zipfile.readFileSync(filename);
      _zipfile.readFile(filename, function(err, buffer){
        //console.log(err)
        _unzippedFiles.push({
          'name' : filename,
          'buffer' : buffer
        });
        _nbUnzipped++;
        if(_nbUnzipped >= _nbFiles){
          callback(err, _unzippedFiles);
        }
      });
    }
 */
/*
  unzipOld : function(filePath, callback){
    var _unzippedFiles = [];
    var _uid = helper.getUID();
    var _destDir = path.join(params.tempPath, _uid);
    var unzip = spawn('unzip', ['-o', filePath, '-d', _destDir]);
    unzip.stderr.on('data', function (data) {
      throw Error(data);
    });

    unzip.on('exit', function (code) {
      var _filesToParse = helper.walkDirSync(_destDir);

      for (var i = 0; i < _filesToParse.length; i++) {
        var _file = _filesToParse[i];
        var _content = fs.readFileSync(_file, 'utf8');
        _unzippedFiles.push({
          'name' : _file,
          'buffer' : _content
        });
      }
      callback(null, _unzippedFiles);
    });
  },

  unzipZip : function(filePath, callback){
    var _unzippedFiles = [];
    //var buffer = fs.readFileSync(filePath);
    fs.readFile(filePath, function(err, buffer){
      var reader = ZIP.Reader(buffer);
      var _res = reader.toObject();
      for(var attr in _res){
        _unzippedFiles.push({
          'name':attr,
          'content':_res[attr]
        });
      }
      callback(err, _unzippedFiles)
      //console.log(_res)
      //reader.toObject(charset_opt);
    });
  },

//ZIP old 

  zip : function(sourceDir, destFile, callback){
    var _toStdout = false;
    var _zipPath = destFile;
    if(typeof destFile === 'function'){
      callback = destFile;
      _toStdout = true;
      _zipPath = path.resolve(rootPath, 'temp', (new Date()).valueOf() + '.docx');
    }


    //if DS_Store is present, the file is corrupted for Word
    var zip = spawn('zip', ['-q', '-m', '-r', _zipPath, '.', '-x', '*.DS_Store'], {'cwd': sourceDir});

    zip.stderr.on('data', function (data) {
      throw Error(data);
    });

    zip.on('exit', function (code) {
      if(_toStdout){
        var _zipContent = fs.readFileSync(_zipPath);
        fs.unlinkSync(_zipPath);
        return callback(_zipContent);
      }
      else{
        return callback();
      }
    });
  }

  */

module.exports = file;