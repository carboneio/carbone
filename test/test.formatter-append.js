const carbone   = require('../lib/index');
const converter = require('../lib/converter');
const helper    = require('../lib/helper');
const file      = require('../lib/file');
const path      = require('path');
const fs        = require('fs');
const pdfPath   = path.resolve('./test/datasets/merge-pdf');
const tempPath  = path.join(__dirname, 'temp');
const pdf2json  = require('pdf2json');
const nock      = require('nock');

describe('appendFile', function () {
  beforeEach(function () {
    helper.rmDirRecursive(tempPath);
    fs.mkdirSync(tempPath, '0755');
  });
  afterEach(function () {
    helper.rmDirRecursive(tempPath);
  });

  describe('file.mergePDF', function () {
    it('should do nothing is fileDatabase is empty or undefined', function (done) {
      file.mergePDF('path', new Map(), 'path', (err) => {
        helper.assert(err+'', 'null');
        file.mergePDF('path', undefined, 'path', (err) => {
          helper.assert(err+'', 'null');
          done();
        });
      });
    });
    it('should add a PDF at the end of the existing one', function (done) {
      const _outputFilePath = path.join(tempPath, 'temp-merged-files20.pdf');
      const _mainFile       = path.join(pdfPath, 'test-E-1.4.pdf');
      const _pdfToAdd       = path.join(pdfPath, 'test-F-1.4.pdf');
      const _expectedResult = path.join(pdfPath, 'test-EF-1.4-expected.pdf');
      const _filesToAdd     = new Map();
      _filesToAdd.set(_pdfToAdd, {
        extension : 'pdf',
        position  : 'end',
        count     : 1,
        data      : fs.readFileSync(_pdfToAdd),
      });
      file.mergePDF(_mainFile, _filesToAdd, _outputFilePath, (err) => {
        helper.assert(err+'', 'null');
        pdfToJson(_expectedResult, (expected) => {
          pdfToJson(_outputFilePath, (result) => {
            helper.assert(result.Pages.length, 2);
            helper.assert(result.Pages, expected.Pages);
            done();
          });
        });
      });
    });
    it('should add a PDF coming from Word with landscape format into a PDF 1.7 coming from LO (portrait). Should preserve custom meta of the original PDF', function (done) {
      const _outputFilePath = path.join(tempPath, 'temp-merged-files43.pdf');
      const _mainFile       = path.join(pdfPath, 'test-A-pdf-from-lo-portrait-1.7.pdf');
      const _pdfToAdd       = path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf');
      const _expectedResult = path.join(pdfPath, 'test-AB-lo-docx-1.7-expected.pdf');
      const _filesToAdd     = new Map();
      _filesToAdd.set(_pdfToAdd, {
        extension : 'pdf',
        position  : 'end',
        count     : 1,
        data      : fs.readFileSync(_pdfToAdd)
      });
      file.mergePDF(_mainFile, _filesToAdd, _outputFilePath, (err) => {
        helper.assert(err+'', 'null');
        pdfToJson(_expectedResult, (expected) => {
          pdfToJson(_outputFilePath, (result) => {
            helper.assert(result.Meta.Title, 'Test1');
            helper.assert(result.Meta.Subject, 'Test2');
            helper.assert(result.Meta.Producer, 'Carbone');
            helper.assert(result.Meta.Metadata['dc:publisher'], 'Test3');
            helper.assert(result.Pages.length, 2);
            helper.assert(result.Pages, expected.Pages);
            expected.Meta.ModDate = result.Meta.ModDate;
            helper.assert(result.Meta, expected.Meta);
            done();
          });
        });
      });
    });
    it('should be fast to add PDF files', function (done) {
      // pdflib is little faster than : https://github.com/julianhille/MuhammaraJS (72ms instead of 100ms)
      const _filesToAdd = new Map();
      const _outputFilePath = path.join(tempPath, 'temp-merged-files74.pdf');
      const _mainFile = path.join(pdfPath, 'test-E-1.4.pdf');
      const _nbPDF = 50;
      for (let i = 0; i < _nbPDF; i++) {
        _filesToAdd.set(i+'file.pdf', {
          extension : 'pdf',
          position  : 'end',
          count     : 1,
          data      : fs.readFileSync(path.join(pdfPath, (i % 2 === 0 ? 'test-E-1.4.pdf' : 'test-F-1.4.pdf')))
        });
      }
      const _start = process.hrtime();
      file.mergePDF(_mainFile, _filesToAdd, _outputFilePath, (err) => {
        const _diff = process.hrtime(_start);
        const _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
        helper.assert(err+'', 'null');
        helper.assert(_elapsed < (300 * helper.CPU_PERFORMANCE_FACTOR), true);
        pdfToJson(_outputFilePath, (mergedFile) => {
          helper.assert(mergedFile.Pages.length, _nbPDF+1);
          console.log('\n\n mergePDF: '+_elapsed + ' ms (usally around 100ms) \n\n\n');
          done();
        });
      });
    });
    it('should return an error if the file is not a PDF. Should return the source of the PDF', function (done) {
      const _outputFilePath = path.join(tempPath, 'temp-merged-files43.pdf');
      const _mainFile       = path.join(pdfPath, 'test-A-pdf-from-lo-portrait-1.7.pdf');
      const _pdf1ToAdd      = path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf');
      const _pdf2ToAdd      = path.join(__dirname, 'datasets', 'munchkin.jpg');
      const _filesToAdd     = new Map();
      _filesToAdd.set(_pdf1ToAdd, {
        extension : 'pdf',
        position  : 'end',
        count     : 1,
        data      : fs.readFileSync(_pdf1ToAdd),
        source    : '{d.pdf1}'
      });
      _filesToAdd.set(_pdf2ToAdd, {
        extension : 'pdf', // it's a JPG but we test if relies on this
        position  : 'end',
        count     : 1,
        data      : fs.readFileSync(_pdf2ToAdd),
        source    : '{d.pdf2}'
      });
      file.mergePDF(_mainFile, _filesToAdd, _outputFilePath, (err) => {
        helper.assert(err.message, 'Failed to parse the external PDF document "{d.pdf2}" or the main document. Unable to merge all PDFs together.');
        done();
      });
    });
    it('should return an error if the main file is not a PDF', function (done) {
      const _outputFilePath = path.join(tempPath, 'temp-merged-files43.pdf');
      const _mainFile       = path.join(__dirname, 'datasets', 'munchkin.jpg');
      const _pdf1ToAdd      = path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf');
      const _filesToAdd     = new Map();
      _filesToAdd.set(_pdf1ToAdd, {
        extension : 'pdf',
        position  : 'end',
        count     : 1,
        data      : fs.readFileSync(_pdf1ToAdd),
        source    : '{d.pdf1}'
      });
      file.mergePDF(_mainFile, _filesToAdd, _outputFilePath, (err) => {
        helper.assert(err.message, 'Failed to parse the external PDF document "{d.pdf1}" or the main document. Unable to merge all PDFs together.');
        done();
      });
    });
  });

  describe('full test', function () {
    after(function (done) {
      converter.exit(function () {
        carbone.reset();
        done();
      });
    });
    afterEach(function () {
      carbone.reset();
      if (!nock.isDone()) {
        this.test.error(new Error('Not all nock interceptors were used!'));
        nock.cleanAll();
      }
    });
    before(function () {
      carbone.reset();
    });
    it.skip('should render a document, append a PDF from base64', function (done) {
      const _data = {
        url : fs.readFileSync(path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), { encoding : 'base64' })
      };
      carbone.render(path.join(__dirname, 'datasets', 'merge-pdf', 'docx-simple.xml'), _data, {convertTo : 'pdf'}, function (err, result) {
        helper.assert(err+'', 'null');
        fs.writeFileSync('generatedDocument.pdf', result);
        done();
      });
    });
    it('should render a document and accept an empty PDF link. In that case, the PDF is not added and the document is generated', function (done) {
      // If this test does not pass, install DejaVy Sans font on your computer
      const _data = {
        url : ''
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp1' }, function (err, outputFilePath) {
        helper.assert(err+'', 'null');
        pdfToJson(path.join(pdfPath, 'docx-simple-expected-empty.pdf'), (expected) => {
          pdfToJson(outputFilePath, (result) => {
            helper.assert(result.Pages.length, 1);
            helper.assert(result.Pages, expected.Pages);
            done();
          });
        });
      });
    });
    it('should render a document and add a PDF, from an URL', function (done) {
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url : 'https://google.com/document-1.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp2' }, function (err, outputFilePath) {
        helper.assert(err+'', 'null');
        pdfToJson(path.join(pdfPath, 'docx-simple-expected.pdf'), (expected) => {
          pdfToJson(outputFilePath, (result) => {
            helper.assert(result.Pages.length, 2);
            helper.assert(result.Pages, expected.Pages);
            done();
          });
        });
      });
    });
    it('should not download some document twice if appendFile is used in header and body (two differents XML file)', function (done) {
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      nock('https://google.com')
        .get('/document-2.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url    : 'https://google.com/document-1.pdf',
        header : 'https://google.com/document-2.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-header-body.docx'), _data, {convertTo : 'pdf', renderPrefix : 'temp3' }, function (err, outputFilePath) {
        helper.assert(err+'', 'null');
        pdfToJson(outputFilePath, (result) => {
          helper.assert(result.Pages.length, 3);
          done();
        });
      });
    });
    it('should not download the document twice if the same document is added in header and body (two different XML file).\
      But it should append the same document twice in the final report if appendFile is called two times for the same document.', function (done) {
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url    : 'https://google.com/document-1.pdf',
        header : 'https://google.com/document-1.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-header-body.docx'), _data, {convertTo : 'pdf', renderPrefix : 'temp4' }, function (err, outputFilePath) {
        helper.assert(err+'', 'null');
        pdfToJson(outputFilePath, (result) => {
          helper.assert(result.Pages.length, 3);
          done();
        });
      });
    });
    it('should return an error if the same document is downloaded more than 5 times in the same document', function (done) {
      const _data = [
        { url : 'https://google.com/document-1.pdf' },
        { url : 'https://google.com/document-1.pdf' },
        { url : 'https://google.com/document-1.pdf' },
        { url : 'https://google.com/document-1.pdf' },
        { url : 'https://google.com/document-1.pdf' },
        { url : 'https://google.com/document-1.pdf' }
      ];
      carbone.render(path.join(pdfPath, 'docx-loop.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp6' }, function (err) {
        helper.assert(err+'', 'Error: The limit for appending identical files has been exceeded (limit: 5). The file was: "https://google.com/document-1.pdf"');
        done();
      });
    });
    it('should render a document and it should ignore appendFile if the output is not a PDF', function (done) {
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url : 'https://google.com/document-1.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'txt' }, function (err, buffer) {
        helper.assert(err+'', 'null');
        helper.assert(nock.isDone(), false); // should not call the URL
        // \uFEFF is the magic number
        helper.assert(buffer.toString(), '\uFEFF\nSome text after \n\n\n');
        nock.cleanAll();
        done();
      });
    });
    it('should return an error if the appended file cannot be downloaded (bad status code)', function (done) {
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(500, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url : 'https://google.com/document-1.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp2' }, function (err, outputFilePath) {
        helper.assert(err+'', 'Error: Unable to download file from URL: "https://google.com/document-1.pdf". Status code: 500. Check URL and network access.');
        helper.assert(outputFilePath, null);
        done();
      });
    });
    it('should return an error if the appended file format is not allowed', function (done) {
      nock('https://google.com')
        .get('/document-1.caca')
        .replyWithFile(200, path.join(__dirname, 'datasets', 'test_unknown_file_type.zip'), {
          'Content-Type' : 'application/zip',
        });
      const _data = {
        url : 'https://google.com/document-1.caca'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp2' }, function (err, outputFilePath) {
        helper.assert(err+'', 'Error: Unable to download file from URL: "https://google.com/document-1.caca". File type is unknown or not allowed. Accepted types: pdf');
        helper.assert(outputFilePath, null);
        done();
      });
    });
    it('should return an error if the appended file is too big', function (done) {
      carbone.set({maxDownloadFileSizeTotal : 10});
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url : 'https://google.com/document-1.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp2' }, function (err, outputFilePath) {
        helper.assert(err+'', 'Error: Maximum total file size exceeded (limit: 10 bytes). Last downloaded file was: "https://google.com/document-1.pdf"');
        helper.assert(outputFilePath, null);
        done();
      });
    });
    it('should return an error if the number of downloaded file is too big', function (done) {
      carbone.set({maxDownloadFileCount : 1});
      nock('https://google.com')
        .get('/document-1.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      nock('https://google.com')
        .get('/document-2.pdf')
        .replyWithFile(200, path.join(pdfPath, 'test-B-docx-landscape-svg-1.3.pdf'), {
          'Content-Type' : 'application/pdf',
        });
      const _data = {
        url   : 'https://google.com/document-1.pdf',
        empty : 'https://google.com/document-2.pdf'
      };
      carbone.render(path.join(pdfPath, 'docx-simple.xml'), _data, {convertTo : 'pdf', renderPrefix : 'temp2' }, function (err, outputFilePath) {
        helper.assert(err+'', 'Error: Maximum number of downloaded files exceeded (limit: 1).');
        helper.assert(outputFilePath, null);
        helper.assert(nock.isDone(), false); // should not call the URL
        nock.cleanAll();
        done();
      });
    });

  });

});


function pdfToJson (file, cb) {
  const _pdf = new pdf2json();
  _pdf.loadPDF(file);
  _pdf.on('pdfParser_dataReady', pdfData => {
    cb(pdfData);
  });
}