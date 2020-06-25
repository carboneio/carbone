var assert = require('assert');
var file = require('../lib/file');
var helper = require('../lib/helper');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var testPath = path.join(__dirname,'test_file');
var spawn = require('child_process').spawn;
var zipfile = require('zipfile');

describe('file', function () {
  describe('Detect types', function () {
    before(function () {
      var _templatePath = path.resolve('./test/datasets');
      carbone.set({templatePath : _templatePath});
    });
    after(function () {
      carbone.reset();
    });
    it('should detect a docx type', function (done) {
      carbone.getFileExtension('test_word_render_A.docx', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'docx');
        done();
      });
    });
    it('should detect a xlsx type', function (done) {
      carbone.getFileExtension('test_xlsx_list.xlsx', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'xlsx');
        done();
      });
    });
    it('should detect a pptx type', function (done) {
      carbone.getFileExtension('test_simple_ppt.pptx', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'pptx');
        done();
      });
    });
    it('should detect an odt type', function (done) {
      carbone.getFileExtension('test_odt_to_translate.odt', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'odt');
        done();
      });
    });
    it('should detect an ods type', function (done) {
      carbone.getFileExtension('test_spreadsheet.ods', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'ods');
        done();
      });
    });
    it('should detect an odp type', function (done) {
      carbone.getFileExtension('test_odp.odp', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'odp');
        done();
      });
    });
    it('should detect a docx type without extension', function (done) {
      carbone.getFileExtension('test_word_render_A_without_ext', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'docx');
        done();
      });
    });
    it('should detect a html type', function (done) {
      carbone.getFileExtension('test_html.html', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'html');
        done();
      });
    });
    it('should detect a xhtml type', function (done) {
      carbone.getFileExtension('test_xhtml.xhtml', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'xhtml');
        done();
      });
    });
    it('should detect a xml type', function (done) {
      carbone.getFileExtension('test_xml.xml', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'xml');
        done();
      });
    });
    it('should accept txt files', function (done) {
      carbone.getFileExtension('test_txt.txt', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'txt');
        done();
      });
    });
    it('should not detect type if nothing has been matched', function (done) {
      carbone.getFileExtension('test_unknown_file_type', function (err) {
        helper.assert(err, 'Cannot detect file extension');
        done();
      });
    });
  });

  describe('isZipped', function () {
    it('should return true if the file is zipped', function (done) {
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      file.isZipped(_filePath, function (err, isZipped) {
        helper.assert(isZipped, true);
        done();
      });
    });
    it('should return false if the file is not zipped', function (done) {
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      file.isZipped(_filePath, function (err, isZipped) {
        helper.assert(isZipped, false);
        done();
      });
    });
  });

  describe('unzip', function () {
    it('should unzip a file and return a array which contain its content', function (done) {
      var _filePath = path.resolve('./test/datasets/test_word_render_A.docx');
      var _expectedFiles = {
        '[Content_Types].xml'          : 1,
        '_rels/.rels'                  : 1,
        'word/_rels/document.xml.rels' : 1,
        'word/document.xml'            : 1,
        'word/theme/theme1.xml'        : 1,
        'docProps/thumbnail.jpeg'      : 1,
        'word/settings.xml'            : 1,
        'word/webSettings.xml'         : 1,
        'word/stylesWithEffects.xml'   : 1,
        'docProps/core.xml'            : 1,
        'word/styles.xml'              : 1,
        'word/fontTable.xml'           : 1,
        'docProps/app.xml'             : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>2</TotalTime><Pages>1</Pages><Words>4</Words><Characters>42</Characters><Application>Microsoft Macintosh Word</Application><DocSecurity>0</DocSecurity><Lines>4</Lines><Paragraphs>4</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>42</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>14.0000</AppVersion></Properties>'
      };

      file.unzip(_filePath, function (err, files) {
        assert.equal(files.length, 13);
        for (var i = 0; i < files.length; i++) {
          var _file = files[i];
          assert.equal((_expectedFiles[_file.name]!==undefined), true);
          if (_file.name==='docProps/app.xml') {
            assert.equal(_expectedFiles[_file.name], _file.data.toString());
          }
        }
        done();
      });
    });
    it('should be fast to unzip', function (done) {
      var _filePath1 = path.resolve('./test/datasets/test_word_render_A.docx');
      var _filePath2 = path.resolve('./test/datasets/test_odt_render_static.odt');
      var _nbExecuted = 100;
      var _results = [];
      var _waitedResponse = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        var _filePath = (i % 3 === 0 ) ? _filePath1 : _filePath2;
        file.unzip(_filePath, function (err, files) {
          _waitedResponse--;
          _results.push(files);
          if (_waitedResponse === 0) {
            theEnd();
          }
        });
      }
      function theEnd () {
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Unzip - Time Elapsed : '+_elapsed + ' ms per file for '+_nbExecuted+' unzip tasks\n\n\n');
        assert.equal((_elapsed < 7), true);
        done();
      }
    });
    it('should be reliable', function (done) {
      var _testedZips = helper.walkDirSync(path.join(__dirname, 'datasets', 'zip'));
      helper.assert(_testedZips.length, 8);
      testEachFile(_testedZips);
      function testEachFile (testedZips) {
        if (testedZips.length === 0) {
          return done();
        }
        var _testedZip = testedZips.pop();
        file.unzip(_testedZip, function (err, yauzlUnzippedFiles) {
          if (err) {
            throw err;
          }
          unzipWithZipFile(_testedZip, function (err, zipfilelUnzippedFiles) {
            if (err) {
              throw err;
            }
            helper.assert(yauzlUnzippedFiles, zipfilelUnzippedFiles);
            testEachFile(testedZips);
          });
        });
      }
    });
    it('should return an error if the file is corrupted', function (done) {
      file.unzip(path.join(__dirname, 'datasets', 'zip-failure', 'too_many_length_or_distance_symbols.zip'), function (err) {
        helper.assert(err instanceof Error, true);
        helper.assert(/too many length/.test(err.toString()) === true, true);
        done();
      });
    });
    it('should accept a buffer', function (done) {
      fs.readFile(path.join(__dirname, 'datasets', 'test.simple_zip.zip'), function (err, buffer) {
        file.unzip(buffer, function (err, files) {
          assert.equal(err, null);
          helper.assert(files.length, 1);
          helper.assert(files[0].name, 'coucou.txt');
          helper.assert(files[0].data.toString(), 'coucou');
          done();
        });
      });
    });
  });

  describe('zip', function () {
    beforeEach(function () {
      helper.rmDirRecursive(testPath);
    });
    after(function () {
      helper.rmDirRecursive(testPath);
    });
    it('should zip an array of files into one buffer', function (done) {
      var _files = [
        {name : 'my_file.xml'            , data : new Buffer( 'some text','utf8')},
        {name : 'subdir/my_file.xml'     , data : new Buffer( 'content of the file in the sub dir','utf8')},
        {name : 'subdir/dir/my_file2.txt', data : new Buffer( 'content of the another file','utf8')}
      ];
      fs.mkdirSync(testPath, parseInt('0755', 8));
      file.zip(_files, function (err, zipBuffer) {
        assert.equal(err, null);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(result[_file.name], _file.data);
          }
          done();
        });
      });
    });
    it('should catch exception when file data is not bufferable and keep valid files', function (done) {
      file.buildFile({
        isZipped : true,
        files    : [
          {
            name : 'test',
            data : null
          },
          {
            name : 'test2',
            data : 'bonjour'
          }
        ]
      }, (err, data) => {
        assert.equal(err, null);
        assert.equal(data.constructor, Buffer);

        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip0');
        fs.writeFileSync(_zipFilePath, data);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          var _expected = {
            test2 : 'bonjour'
          };

          assert.equal(JSON.stringify(result), JSON.stringify(_expected));
          done();
        });
      });
    });
    it('should be fast to zip', function (done) {
      var _files = [
        {name : 'my_file.xml'            , data : new Buffer(generateRandomText(9000),'utf8')},
        {name : 'subdir/my_file.xml'     , data : new Buffer(generateRandomText(8500),'utf8')},
        {name : 'subdir/dir/my_file2.txt', data : new Buffer(generateRandomText(6250),'utf8')}
      ];
      var _nbExecuted = 200;
      var _results = [];
      var _nbLeft = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        file.zip(_files, function (err, zipBuffer) {
          _nbLeft--;
          _results.push(zipBuffer);
          if (_nbLeft === 0) {
            theEnd();
          }
        });
      }
      function theEnd () {
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Zip - Time Elapsed : '+_elapsed + ' ms per file for '+_nbExecuted+' zip tasks\n\n\n');
        assert.equal((_elapsed < 5), true);
        //* ***** check the first one and the 90th
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip0');
        fs.writeFileSync(_zipFilePath, _results[0]);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(result[_file.name], _file.data);
          }
          _unzipFilePath = path.join(testPath, 'unzip90');
          fs.writeFileSync(_zipFilePath, _results[90]);
          unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
            for (var i = 0; i < _files.length; i++) {
              var _file = _files[i];
              assert.equal(result[_file.name], _file.data);
            }
            done();
          });
        });
      }
    });
  });

  describe('openTemplate', function () {
    before(function () {
      var _templatePath = path.resolve('./test/datasets');
      carbone.set({templatePath : _templatePath});
    });
    after(function () {
      carbone.reset();
    });
    it.skip('should not accept template name with /../ to avoid security issues (access to parent directory)', function (done) {
      file.openTemplate('../test_word_render_A.docx', function (err) {
        helper.assert(err, 'access forbidden');
        done();
      });
    });
    it('should open the template, convert xml files into String, ...', function (done) {
      file.openTemplate('test_word_render_A.docx', function (err, template) {
        helper.assert(err, null);
        helper.assert(template.isZipped, true);
        helper.assert(template.filename, 'test_word_render_A.docx');
        helper.assert(template.files.length, 13);
        helper.assert(template.embeddings, []);
        for (var i = 0; i < template.files.length; i++) {
          var _file = template.files[i];
          if (_file.name === 'word/document.xml') {
            helper.assert(_file.isMarked, true);
            assert.equal(/author/.test(_file.data), true);
          }
          if (_file.name === 'docProps/thumbnail.jpeg') {
            helper.assert(_file.isMarked, false);
            assert.equal(Buffer.isBuffer(_file.data), true);
          }
        }
        done();
      });
    });
    it('should open not zipped templates', function (done) {
      file.openTemplate('test_word_render_2003_XML.xml', function (err, template) {
        helper.assert(err, null);
        helper.assert(template.isZipped, false);
        helper.assert(template.files.length, 1);
        var _file = template.files[0];
        helper.assert(_file.isMarked, true);
        helper.assert(_file.name, 'test_word_render_2003_XML.xml');
        assert.equal(/field1/.test(_file.data), true);
        done();
      });
    });
    it('should accept absolute path', function (done) {
      var _filePath =  path.resolve('./test/datasets','test_word_render_2003_XML.xml');
      file.openTemplate(_filePath, function (err, template) {
        helper.assert(err, null);
        helper.assert(template.isZipped, false);
        helper.assert(template.files.length, 1);
        var _file = template.files[0];
        helper.assert(_file.isMarked, true);
        helper.assert(_file.name, 'test_word_render_2003_XML.xml');
        assert.equal(/field1/.test(_file.data), true);
        done();
      });
    });
    it('should open embedded xlsx file', function (done) {
      file.openTemplate('test_word_with_embedded_excel.docx', function (err, template) {
        helper.assert(err, null);
        helper.assert(template.isZipped, true);
        helper.assert(template.files.length, 29);
        helper.assert(template.embeddings.length, 1);
        helper.assert(template.embeddings, ['word/embeddings/Feuille_de_calcul_Microsoft_Excel1.xlsx']);
        var _filesFromDocx = template.files.filter((file) => {
          return file.parent === '';
        });
        helper.assert(_filesFromDocx.length, 16);
        var _filesFromXslx = template.files.filter((file) => {
          return file.parent === 'word/embeddings/Feuille_de_calcul_Microsoft_Excel1.xlsx';
        });
        helper.assert(_filesFromXslx.length, 13);
        var _oneFileOfXlsx = _filesFromXslx.filter((file) => {
          return file.name === 'xl/tables/table1.xml';
        });
        helper.assert(_oneFileOfXlsx.length, 1);
        helper.assert(/Tableau1/.test(_oneFileOfXlsx[0].data), true);
        done();
      });
    });
    /* it.skip('should detect files which contains markers (not all xml)');*/
  });


  describe('buildFile', function () {
    beforeEach(function () {
      helper.rmDirRecursive(testPath);
    });
    after(function () {
      helper.rmDirRecursive(testPath);
      carbone.reset();
    });
    it('should zip and return a buffer if the report is a docx. It should convert string to buffer', function (done) {
      var _report = {
        isZipped : true,
        files    : [
          {name : 'my_file.xml'            , data : 'some text'},
          {name : 'subdir/my_file.xml'     , data : 'content of the file in the sub dir'},
          {name : 'subdir/dir/my_file2.txt', data : new Buffer( 'content of the another file','utf8')}
        ]
      };
      var _filesCopy = _report.files.slice(); // buildFile empties _report.files
      fs.mkdirSync(testPath, parseInt('0755', 8));
      file.buildFile(_report, function (err, zipBuffer) {
        helper.assert(err, null);
        assert.equal(Buffer.isBuffer(zipBuffer), true);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          assert.equal(_filesCopy.length, 3);
          for (var i = 0; i < _filesCopy.length; i++) {
            var _file = _filesCopy[i];
            if (Buffer.isBuffer(_file.data)===false) {
              _file.data = new Buffer(_file.data, 'utf8');
            }
            assert.equal(result[file.name], file.data);
          }
          done();
        });
      });
    });
    it('should zip embedded files independantly', function (done) {
      var _report = {
        isZipped : true,
        files    : [
          {name : 'my_file.xml'            , parent : '', data : 'some text'},
          {name : 'subdir/my_file.xml'     , parent : '', data : 'content of the file in the sub dir'},
          {name : 'subdir/dir/my_file2.txt', parent : '', data : new Buffer( 'content of the another file','utf8')},
          {name : 'other/table.xml'        , parent : 'embedded/spreadsheet.xlsx' , data : 'array of data'},
          {name : 'other/other.xml'        , parent : 'embedded/spreadsheet.xlsx' , data : 'second file'},
          {name : 'other/images/bin.png'   , parent : 'embedded/spreadsheet.xlsx' , data : new Buffer( 'my favorite movies', 'utf8')},
          {name : 'other/table.zip'        , parent : 'embedded/spreadsheet2.xlsx', data : new Buffer( 'other image', 'utf8')},
          {name : 'other/xml/doc.xml'      , parent : 'embedded/spreadsheet2.xlsx', data : 'third file'},
        ]
      };
      _report.files.slice(); // buildFile empties _report.files
      var _spreadsheet1Only = _report.files.filter((file) => {
        return file.parent === 'embedded/spreadsheet.xlsx';
      });
      fs.mkdirSync(testPath, parseInt('0755', 8));
      file.buildFile(_report, function (err, zipBuffer) {
        helper.assert(err, null);
        assert.equal(Buffer.isBuffer(zipBuffer), true);
        var _zipFilePath = path.join(testPath, 'file.zip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipWithZipFile(_zipFilePath, function (err, files) {
          assert.equal(err, null);
          helper.assert(files.length, 5);
          var _spreadsheet = files.filter((file) => {
            return file.name === 'embedded/spreadsheet.xlsx';
          });
          helper.assert(_spreadsheet.length, 1);
          var _spreadsheet2 = files.filter((file) => {
            return file.name === 'embedded/spreadsheet2.xlsx';
          });
          helper.assert(_spreadsheet2.length, 1);
          var _spreadSheet1FilePath = path.join(testPath, 'spreadsheetFile1.zip');
          fs.writeFileSync(_spreadSheet1FilePath, _spreadsheet[0].data);
          unzipWithZipFile(_spreadSheet1FilePath, function (err, files) {
            assert.equal(files.length, 3);
            var _image = files.filter((file) => {
              return file.name === 'other/images/bin.png';
            });
            assert.equal(_image.length, 1);
            assert.equal(JSON.stringify(_image[0].data), JSON.stringify(_spreadsheet1Only[2].data));
            done();
          });
        });
      });
    });
    it('should works with xml files', function (done) {
      var _report = {
        isZipped : false,
        files    : [
          {name : 'test_word_render_2003_XML.xml', data : 'some text'}
        ]
      };
      file.buildFile(_report, function (err, template) {
        helper.assert(err, null);
        helper.assert(template, _report.files[0].data);
        done();
      });
    });
  });
});

function unzipSystem (filePath, destPath, callback) {
  var _unzippedFiles = {};
  var _unzip = spawn('unzip', ['-o', filePath, '-d', destPath]);
  _unzip.stderr.on('data', function (data) {
    throw Error(data);
  });
  _unzip.on('exit', function () {
    var _filesToParse = helper.walkDirSync(destPath);
    for (var i = 0; i < _filesToParse.length; i++) {
      var _file = _filesToParse[i];
      var _content = fs.readFileSync(_file, 'utf8');
      _unzippedFiles[path.relative(destPath, _file)] = _content;
    }
    callback(null, _unzippedFiles);
  });
}

function generateRandomText (length) {
  var _text = '';
  var _possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz0123456789';
  for (var i=0; i < length; i++) {
    _text += _possible.charAt(Math.floor(Math.random() * (_possible.length-1)));
  }
  return _text;
}

/**
 * Zipfile was used before yauzl.
 * Zipfie uses the rock-solid C library libzip. I use it as a comparison tool. Should I use the system unzip?
 * @param  {String}   filePath
 * @param  {Function} callback(err, template)
 */
function unzipWithZipFile (filePath, callback) {
  var _zipfile = new zipfile.ZipFile(filePath);
  var _nbFiles = _zipfile.names.length;
  var _unzippedFiles = [];
  for (var i = 0; i < _nbFiles; i++) {
    var _filename = _zipfile.names[i];
    // I use the sync method because the async version reach the limit of open files of the OS (ulimit -n) in a performance test. It should change in the future
    var _buffer = _zipfile.readFileSync(_filename);
    _unzippedFiles.push({
      name : _filename,
      data : _buffer
    });
  }
  callback(null, _unzippedFiles);
}
