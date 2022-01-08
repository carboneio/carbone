var assert = require('assert');
var file = require('../lib/file');
var helper = require('../lib/helper');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var testPath = path.join(__dirname,'test_file');
var { exec } = require('child_process');

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
    it('should detect a html type without doctype', function (done) {
      carbone.getFileExtension('test_html_without_doctype.html', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'html');
        done();
      });
    });
    it('should detect a html type even if HTML is upper case', function (done) {
      carbone.getFileExtension('test_html_without_doctype.html', function (err, extension) {
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
    it('should detect a xhtml type', function (done) {
      carbone.getFileExtension('test_xhtml_case_insensitive_whitespace.xhtml', function (err, extension) {
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
    it('should detect a fodt type', function (done) {
      carbone.getFileExtension('test_fodt.fodt', function (err, extension) {
        helper.assert(err, null);
        assert.strictEqual(extension, 'fodt');
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
        assert.equal((_elapsed < (7 * helper.CPU_PERFORMANCE_FACTOR)), true);
        done();
      }
    });
    it('should be reliable', function (done) {
      var _testedZips = helper.walkDirSync(path.join(__dirname, 'datasets', 'zip'));
      helper.assert(_testedZips.length, 8);
      testEachFile(_testedZips);
      function testEachFile (testedZips) {
        if (testedZips.length === 0) {
          helper.rmDirRecursive(testPath);
          return done();
        }
        var _testedZip = testedZips.pop();
        file.unzip(_testedZip, function (err, yauzlUnzippedFiles) {
          if (err) {
            throw err;
          }
          helper.rmDirRecursive(testPath);
          unzipSystem(_testedZip, testPath, function (err, unzipSystemResult) {
            if (err) {
              throw err;
            }
            const keysName = Object.keys(unzipSystemResult);
            keysName.forEach(_fileNameUnzipSystem => {
              const _file = yauzlUnzippedFiles.find(x => x.name === _fileNameUnzipSystem);
              helper.assert(!!_file, true);
              helper.assert(JSON.stringify(_file.data), JSON.stringify(unzipSystemResult[_fileNameUnzipSystem]));
            });
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
        {name : 'my_file.xml'            , data : Buffer.from( 'some text','utf8')},
        {name : 'subdir/my_file.xml'     , data : Buffer.from( 'content of the file in the sub dir','utf8')},
        {name : 'subdir/dir/my_file2.txt', data : Buffer.from( 'content of the another file','utf8')}
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
            assert.equal(JSON.stringify(result[_file.name]), JSON.stringify(_file.data));
          }
          done();
        });
      });
    });
    it('should zip an array of files and directory into one buffer', function (done) {
      const _fileLength1 = 10000;
      const _fileLength2 = 100000;
      var _files = [
        {name : 'my_file.xml'            , data : Buffer.from( 'some text','utf8')},
        {name : 'subdir/'                , data : undefined },
        {name : 'subdir/my_file.xml'     , data : Buffer.from( 'content of the file in the sub dir','utf8')},
        {name : 'subdir/dir/'            , data : undefined },
        {name : 'subdir/dir/my_file2.txt', data : Buffer.from( 'content of the another file','utf8')},
        {name : 'subdir/dir/my_big_file.txt', data : Buffer.from(generateRandomText(_fileLength1),'utf8')},
        {name : 'subdir/dir/my_big_file2.txt', data : Buffer.from(generateRandomText(_fileLength2),'utf8')}
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
            if (_file.name.indexOf('big') !== -1) {
              assert.equal(JSON.stringify(result[_file.name]).length, JSON.stringify(_file.data).length);
            }
            assert.equal(JSON.stringify(result[_file.name]), JSON.stringify(_file.data));
          }
          done();
        });
      });
    });
    it('should zip an array of directories and 120 files with a size between 150 and 200 bytes into one buffer', function (done) {
      var _files = [];
      const _max = 200;
      const _min = 150;
      const _numberFiles = 120;
      let _dir = '';
      for (let i = 0; i < _numberFiles; i++) {
        let _filename = `my_file${i}.xml`;
        if (i % 10 === 1) {
          _dir += 'dir/';
          _files.push({ name : _dir, data : undefined });
        }
        _filename = `${_dir}${_filename}`;
        _files.push({ name : _filename, data : Buffer.from(generateRandomText(Math.floor(Math.random() * (_max - _min + 1)) + _min), 'utf8')});
      }
      fs.mkdirSync(testPath, parseInt('0755', 8));
      file.zip(_files, function (err, zipBuffer) {
        assert.equal(err, null);
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          helper.assert(_files.length, _numberFiles + _numberFiles / 10);
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(JSON.stringify(result[_file.name]), JSON.stringify(_file.data));
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
            name : 'test/',
            data : undefined
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
          const _expected = 'bonjour';
          assert.equal(JSON.stringify(result.test2.toString()), JSON.stringify(_expected));
          done();
        });
      });
    });
    it('should be fast to zip', function (done) {
      var _files = [
        {name : 'my_file.xml'            , data : Buffer.from(generateRandomText(9000),'utf8')},
        {name : 'subdir/my_file.xml'     , data : Buffer.from(generateRandomText(8500),'utf8')},
        {name : 'subdir/dir/my_file2.txt', data : Buffer.from(generateRandomText(6250),'utf8')}
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
        assert.equal((_elapsed < (5 * helper.CPU_PERFORMANCE_FACTOR)), true);
        //* ***** check the first one and the 90th
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _zipFilePath = path.join(testPath, 'file.zip');
        var _unzipFilePath = path.join(testPath, 'unzip0');
        fs.writeFileSync(_zipFilePath, _results[0]);
        unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
          for (var i = 0; i < _files.length; i++) {
            var _file = _files[i];
            assert.equal(JSON.stringify(result[_file.name]), JSON.stringify(_file.data));
          }
          _unzipFilePath = path.join(testPath, 'unzip90');
          fs.writeFileSync(_zipFilePath, _results[90]);
          unzipSystem(_zipFilePath, _unzipFilePath, function (err, result) {
            for (var i = 0; i < _files.length; i++) {
              var _file = _files[i];
              assert.equal(JSON.stringify(result[_file.name]), JSON.stringify(_file.data));
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
          {name : 'subdir/dir/my_file2.txt', data : Buffer.from( 'content of the another file','utf8')}
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
              _file.data = Buffer.from(_file.data, 'utf8');
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
          {name : 'subdir/dir/my_file2.txt', parent : '', data : Buffer.from( 'content of the another file','utf8')},
          {name : 'other/table.xml'        , parent : 'embedded/spreadsheet.xlsx' , data : 'array of data'},
          {name : 'other/other.xml'        , parent : 'embedded/spreadsheet.xlsx' , data : 'second file'},
          {name : 'other/images/bin.png'   , parent : 'embedded/spreadsheet.xlsx' , data : Buffer.from( 'my favorite movies', 'utf8')},
          {name : 'other/table.zip'        , parent : 'embedded/spreadsheet2.xlsx', data : Buffer.from( 'other image', 'utf8')},
          {name : 'other/xml/doc.xml'      , parent : 'embedded/spreadsheet2.xlsx', data : 'third file'},
        ]
      };
      var _spreadsheet1Only = _report.files.filter((file) => {
        return file.parent === 'embedded/spreadsheet.xlsx';
      });
      fs.mkdirSync(testPath, parseInt('0755', 8));
      file.buildFile(_report, function (err, zipBuffer) {
        helper.assert(err, null);
        assert.equal(Buffer.isBuffer(zipBuffer), true);
        var _zipFilePath = path.join(testPath, 'file.zip');
        fs.writeFileSync(_zipFilePath, zipBuffer);
        const _testUnzipDir = path.join(testPath, 'unzip1');
        helper.rmDirRecursive(_testUnzipDir);
        unzipSystem(_zipFilePath, _testUnzipDir, function (err, unzipResult) {
          assert.equal(err, null);
          helper.assert(Object.keys(unzipResult).length, 5);

          const _spreadsheetBuffer2 = unzipResult['embedded/spreadsheet2.xlsx'];
          helper.assert(Buffer.isBuffer(_spreadsheetBuffer2), true);
          assert(_spreadsheetBuffer2.toString().length > 0);

          const _spreadsheetBuffer = unzipResult['embedded/spreadsheet.xlsx'];
          helper.assert(Buffer.isBuffer(_spreadsheetBuffer), true);
          assert(_spreadsheetBuffer.toString().length > 0);

          // Create the spreadsheet file to unzip
          var _spreadSheet1FilePath = path.join(testPath, 'spreadsheetFile1.zip');
          fs.writeFileSync(_spreadSheet1FilePath, _spreadsheetBuffer);

          const _testUnzipDir2 = path.join(testPath, 'unzip2');
          helper.rmDirRecursive(_testUnzipDir2);
          unzipSystem(_spreadSheet1FilePath, _testUnzipDir2, function (err, embedSheetUnzipResult) {
            assert.equal(err, null);
            assert.equal(Object.keys(embedSheetUnzipResult).length, 3);
            const _imageBuffer = embedSheetUnzipResult['other/images/bin.png'];
            helper.assert(Buffer.isBuffer(_imageBuffer), true);
            assert(_imageBuffer.toString().length > 0);
            assert.equal(JSON.stringify(_imageBuffer), JSON.stringify(_spreadsheet1Only[2].data));
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
  exec(`unzip -o ${filePath} -d ${destPath}`, function (err, stdout, stderr) {
    if (err) {
      callback(err, null);
    }
    if (stderr) {
      callback(stderr, null);
    }
    var _filesToParse = helper.walkDirSync(destPath);
    for (var i = 0; i < _filesToParse.length; i++) {
      var _file = _filesToParse[i];
      var _content = fs.readFileSync(_file); // return a buffer, not a string
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