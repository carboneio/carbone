var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var params = require('../lib/params');
var converter = require('../lib/converter');
var dateFormatter = require('../formatters/date');
var testPath = path.join(__dirname, 'test_file');
var should = require('should'); // eslint-disable-line
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;

describe('Carbone', function () {


  describe('set', function () {
    var _templatePath = path.join(__dirname,'template1');
    var _tempPath = path.join(__dirname,'temp1');
    after(function (done) {
      helper.rmDirRecursive(_tempPath);
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
      done();
    });
    it('should create automatically the template directory if it does not exists', function (done) {
      helper.rmDirRecursive(_templatePath);
      carbone.set({templatePath : _templatePath});
      helper.assert(fs.existsSync(_templatePath), true);
      done();
    });
    it('should create automatically the temp directory if it does not exists', function (done) {
      helper.rmDirRecursive(_tempPath);
      carbone.set({tempPath : _tempPath});
      helper.assert(fs.existsSync(_tempPath), true);
      done();
    });
    it('should not overwrite lang object if provided', function (done) {
      carbone.set({
        templatePath : _templatePath,
        translations : {
          fr : {
            test : 'trad'
          }
        }
      });
      helper.assert(params.translations, {
        fr : {
          test : 'trad'
        }
      });
      done();
    });
    it('should change the lang of of date formatter', function (done) {
      carbone.set({lang : 'fr'});
      helper.assert(dateFormatter.convDate('20140131','YYYYMMDD','dddd'), 'vendredi');
      carbone.set({lang : 'en'});
      helper.assert(dateFormatter.convDate('20140131','YYYYMMDD','dddd'), 'Friday');
      carbone.set({lang : 'fr'});
      helper.assert(dateFormatter.convDate('20140131','YYYYMMDD','dddd'), 'vendredi');
      done();
    });
  });


  describe('addTemplate', function () {
    var _templatePath = path.join(__dirname,'template');
    before(function () {
      helper.rmDirRecursive(_templatePath);
      fs.mkdirSync(_templatePath, '0755');
      carbone.set({templatePath : _templatePath});
    });
    after(function () {
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
    });
    it('should save the template in the folder "templatePath"', function (done) {
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _fileContent = fs.readFileSync(_filePath, 'utf8');
      var _fileId = '1.xml';
      carbone.addTemplate(_fileId, _fileContent, function (err) {
        helper.assert(err, null);
        var _result = fs.readFileSync(path.join(_templatePath,_fileId), 'utf8');
        helper.assert(_result, _fileContent);
        done();
      });
    });
    it('should overwrite existing template and should work if data is a buffer', function (done) {
      var _fileId = '2.txt';
      fs.writeFileSync(path.join(_templatePath, _fileId), 'bla');
      var _filePath = path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _fileContent = fs.readFileSync(_filePath);
      carbone.addTemplate(_fileId, _fileContent, function (err) {
        helper.assert(err, null);
        var _result = fs.readFileSync(path.join(_templatePath,_fileId));
        helper.assert(_result, _fileContent);
        done();
      });
    });
  });

  
  describe('addFormatters', function () {
    it('should add a formatter to the list of custom formatters', function () {
      carbone.addFormatters({
        yesOrNo : function (d) {
          return d === true ? 'yes' : 'no';
        }
      });
      assert.notEqual(typeof carbone.formatters.yesOrNo, 'undefined');
      assert.equal(carbone.formatters.yesOrNo(true), 'yes');
    });
  });



  describe('removeTemplate', function () {
    var _templatePath = path.join(__dirname,'template');
    before(function () {
      helper.rmDirRecursive(_templatePath);
      fs.mkdirSync(_templatePath, '0755');
      carbone.set({templatePath : _templatePath});
    });
    after(function () {
      helper.rmDirRecursive(_templatePath);
      carbone.reset();
    });
    it('should remove the template from the Carbone datastore (templatePath)', function (done) {
      var _fileId = '2.txt';
      var _filePath = path.join(_templatePath, _fileId);
      fs.writeFileSync(_filePath, 'bla');
      carbone.removeTemplate(_fileId, function (err) {
        helper.assert(err, null);
        helper.assert(fs.existsSync(_filePath), false);
        done();
      });
    });
    it('should not crash if the template does not exist', function (done) {
      var _fileId = '5.txt';
      carbone.removeTemplate(_fileId, function (err) {
        helper.assert(/unlink/.test(err+''), true);
        done();
      });
    });
  });


  describe('listConversionFormats', function () {
    it('should return the list of format for conversion', function (done) {
      var _list = carbone.listConversionFormats('document');
      helper.assert(_list[0].id, 'bib');
      done();
    });
  });

  describe('renderXML', function () {
    after(function (done) {
      carbone.reset();
      done();
    });
    it('should render an XML string', function (done) {
      var data = {
        param : 'field_1'
      };
      carbone.renderXML('<xml>{d.param}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>field_1</xml>');
        done();
      });
    });
    it('should execute formatter if the data object is empty with the formatter ifEmpty', function (done) {
      var data = {};
      carbone.renderXML('<xml>{d:ifEmpty(\'yeah\')} {c:ifEmpty(\'oops\')}</xml>', data, {complement : {}}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>yeah oops</xml>');
        done();
      });
    });
    it('should execute formatter if the data array is empty with the formatter ifEmpty', function (done) {
      var data = [];
      carbone.renderXML('<xml>{d:ifEmpty(\'yeah\')} {c:ifEmpty(\'oops\')}</xml>', data, {complement : []}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>yeah oops</xml>');
        done();
      });
    });
    it('should return an error if the formatter does not exist', function (done) {
      var data = {
        param : 1
      };
      carbone.renderXML('<xml>{d.param:ifEkual(2, \'two\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'Error: Formatter \"ifEkual\" does not exist. Do you mean "ifEqual"?');
        helper.assert(result, null);
        done();
      });
    });
    it('#1 conditional formatters should be executed one after another, the next formatter is called if the condition of the previous one is false', function (done) {
      var data = {
        param : 1
      };
      carbone.renderXML('<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>one</xml>');
        done();
      });
    });
    it('#3 conditional formatters should be executed one after another, the next formatter is called if the condition of the previous one is false', function (done) {
      var data = {
        param : 3
      };
      carbone.renderXML('<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>three</xml>');
        done();
      });
    });
    it('#2 conditional formatters should be executed one after another, the next formatter is called if the condition of the previous one is false', function (done) {
      var data = {
        param : 2
      };
      carbone.renderXML('<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>two</xml>');
        done();
      });
    });
    it('#4 conditional formatters should be executed one after another, the next formatter is called if the condition of the previous one is false', function (done) {
      var data = {
        param : 6
      };
      carbone.renderXML('<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>unknown</xml>');
        done();
      });
    });
    it('conditional formatter should call the next formatter even if the condition is true when continueOnSuccess=true', function (done) {
      var data = {
        param : 3
      };
      carbone.renderXML('<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\', true):ifEqual(1, \'one\'):print(\'unknown\')}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>unknown</xml>');
        done();
      });
    });
    it('formatters should be independant. The propagation of one set of cascaded formatters should not alter the propagation of another set of formatters', function (done) {
      var data = {
        param : 3,
        type  : 1,
        other : 2,
        empty : -1
      };
      carbone.renderXML(
          '<xml>{d.param:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</xml>'
        + '<tr>{d.type:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</tr>'
        + '<td>{d.other:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</td>'
        + '<td>{d.empty:ifEqual(2, \'two\'):ifEqual(3, \'three\'):ifEqual(1, \'one\'):print(\'unknown\')}</td>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>three</xml><tr>one</tr><td>two</td><td>unknown</td>');
          done();
        });
    });
    it('conditional formatter should call the next formatter even if the condition is true when continueOnSuccess=true', function (done) {
      var data = {
        param : 2
      };
      var options = {
        enum : {
          ORDER_STATUS : ['open', 'close', 'sent']
        }
      };
      carbone.renderXML('<xml>{d.param:convEnum(\'ORDER_STATUS\')}</xml>', data, options, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>sent</xml>');
        done();
      });
    });
    it('options.lang = "fr" should force the lang of date formatter', function (done) {
      var data = {
        param : '20160131'
      };
      carbone.set({lang : 'en'}); // default lang
      var options = {
        lang : 'fr' // forced lang
      };
      carbone.renderXML('<xml>{d.param:convDate(YYYYMMDD, L)}</xml>', data, options, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>31/01/2016</xml>');
        options.lang = 'en';
        carbone.set({lang : 'fr'}); // default lang
        carbone.renderXML('<xml>{d.param:convDate(YYYYMMDD, L)}</xml>', data, options, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>01/31/2016</xml>');
          done();
        });
      });
    });
    it('should set the default lang if not set in options.lang for date formatter', function (done) {
      var data = {
        param : '20160131'
      };
      carbone.set({lang : 'fr'});
      carbone.renderXML('<xml>{d.param:convDate(YYYYMMDD, L)}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>31/01/2016</xml>');
        carbone.set({lang : 'en'});
        carbone.renderXML('<xml>{d.param:convDate(YYYYMMDD, L)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>01/31/2016</xml>');
          done();
        });
      });
    });
    it('options.lang should dynamically force the lang of translation markers {t()} and accept provided translations', function (done) {
      var data = {
        param : '20160131'
      };
      carbone.set({lang : 'en'}); // default lang
      var options = {
        lang         : 'fr', // forced lang
        translations : {
          fr : {
            kitchen : 'cuisine'
          },
          es : {
            kitchen : 'cocina'
          }
        }
      };
      carbone.renderXML('<xml>{t(kitchen)}</xml>', data, options, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>cuisine</xml>');
        options.lang = 'es';
        carbone.set({lang : 'fr'}); // default lang
        carbone.renderXML('<xml>{t(kitchen)}</xml>', data, options, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>cocina</xml>');
          done();
        });
      });
    });
    it('options.lang should dynamically force the lang of translation markers {t()} and use translations of carbone', function (done) {
      var data = {
        param : '20160131'
      };
      carbone.set({lang : 'en'}); // default lang
      carbone.set({
        translations : {
          fr : {
            kitchen : 'cuisine'
          },
          es : {
            kitchen : 'cocina'
          }
        }
      });
      carbone.renderXML('<xml>{t(kitchen)}</xml>', data, {lang : 'fr'}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>cuisine</xml>');
        carbone.set({lang : 'fr'}); // default lang
        carbone.renderXML('<xml>{t(kitchen)}</xml>', data, {lang : 'es'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>cocina</xml>');
          done();
        });
      });
    });
    it('should replace a LF (unix) in an odt file', function (done) {
      var _xml = '<xml> {d.text:convCRLF()} </xml>';
      var _data = {text : 'boo\nbeep'};
      var _options = { extension : 'odt' };
      carbone.renderXML(_xml, _data, _options, function (err, _xmlBuilt) {
        helper.assert(err + '', 'null');
        helper.assert(_xmlBuilt, '<xml> boo<text:line-break/>beep </xml>');
        done();
      });
    });
    it('should replace a CRLF (windows) in an odt file', function (done) {
      var _xml = '<xml> {d.text:convCRLF()} </xml>';
      var _data = {text : 'boo\r\nbeep'};
      var _options = { extension : 'odt' };
      carbone.renderXML(_xml, _data, _options, function (err, _xmlBuilt) {
        helper.assert(err + '', 'null');
        helper.assert(_xmlBuilt, '<xml> boo<text:line-break/>beep </xml>');
        done();
      });
    });
    it('should replace a LF (unix) in a docx file', function (done) {
      var _xml = '<xml> <w:t>{d.text:convCRLF()}</w:t> </xml>';
      var _data = {text : 'boo\nbeep'};
      var _options = { extension : 'docx' };
      carbone.renderXML(_xml, _data, _options, function (err, _xmlBuilt) {
        helper.assert(err + '', 'null');
        helper.assert(_xmlBuilt, '<xml> <w:t>boo</w:t><w:br/><w:t>beep</w:t> </xml>');
        done();
      });
    });
    it('should replace a CRLF (windows) in a docx file', function (done) {
      var _xml = '<xml> <w:t>{d.text:convCRLF()}</w:t> </xml>';
      var _data = {text : 'boo\r\nbeep'};
      var _options = { extension : 'docx' };
      carbone.renderXML(_xml, _data, _options, function (err, _xmlBuilt) {
        helper.assert(err + '', 'null');
        helper.assert(_xmlBuilt, '<xml> <w:t>boo</w:t><w:br/><w:t>beep</w:t> </xml>');
        done();
      });
    });
    it('should print a counter', function (done) {
      var _xml = '<xml><t_row> {d.cars[sort,i].brand:count()} {d.cars[sort,i].brand} </t_row><t_row> {d.cars[sort+1,i+1].brand} </t_row></xml>';
      var _data = {
        cars : [
          {brand : 'Lumeneo'     , sort : 1},
          {brand : 'Tesla motors', sort : 2},
          {brand : 'Toyota'      , sort : 1}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><t_row> 1 Lumeneo </t_row><t_row> 2 Toyota </t_row><t_row> 3 Tesla motors </t_row></xml>');
        done();
      });
    });
    it('should print a counter which start by 1 and 0', function (done) {
      var _xml =
         '<xml>'
        +  '<tr>'
        +    '<td>{d[i].cars[i].wheels[i].tire.brand:count()} {d[i].cars[i].wheels[i].tire.brand}</td>'
        +    '<td>{d[i].cars[i].wheels[i].tire.brand:count(0)} {d[i].site.label}</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>{d[i+1].cars[i+1].wheels[i+1].tire.brand}</td>'
        +    '<td>{d[i+1].site.label}</td>'
        +  '</tr>'
        +'</xml>';
      var _data = [
        {
          site : {label : 'site_A'},
          cars : [
            {
              wheels : [
                {tire : {brand : 'mich'}},
                {tire : {brand : 'cont'}}
              ]
            },
            {
              wheels : [
                {tire : {brand : 'mich'}}
              ]
            },
          ],
        },{
          site : {label : 'site_B'},
          cars : [{
            wheels : [
                {tire : {brand : 'mich'}},
                {tire : {brand : 'uni' }},
                {tire : {brand : 'cont'}}
            ]
          }
          ],
        }
      ];
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        var _expectedResult =
           '<xml>'
          +  '<tr>'
          +    '<td>1 mich</td>'
          +    '<td>0 site_A</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>2 cont</td>'
          +    '<td>1 site_A</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>3 mich</td>'
          +    '<td>2 site_A</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>4 mich</td>'
          +    '<td>3 site_B</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>5 uni</td>'
          +    '<td>4 site_B</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>6 cont</td>'
          +    '<td>5 site_B</td>'
          +  '</tr>'
          +'</xml>';
        assert.equal(_xmlBuilt, _expectedResult);
        done();
      });
    });
    describe('number formatters', function(done){
      afterEach(function (done) {
        carbone.reset();
        done();
      });
      it('convCurr() and formatC() should convert from one currency to another according to rates passed in options', function (done) {
        var data = {
          value : 10
        };
        var options = {
          currencyRates : { EUR : 1, USD : 2, GBP: 10 },
          lang : 'en-GB'
        };
        carbone.renderXML('<xml>{d.value:convCurr(EUR, USD)}</xml>', data, options, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>5</xml>');
          done();
        });
      });
      it('convCurr() and formatC() should convert automatically to the currency of the locale (lang) if currencyTarget is empty', function (done) {
        var data = {
          value : 10
        };
        var options = {
          currencySource : 'GBP',
          currencyTarget : null, // depends on locale
          currencyRates  : { EUR : 1, USD : 2, GBP: 10 },
          lang : 'en-US'
        };
        carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, options, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>2</xml>');
          options.currencyTarget = ''; // same thing with an empty string 
          carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, options, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml>2</xml>');
            options.lang = 'fr-FR';
            carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, options, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml>1</xml>');
              done();
            });
          });
        });
      });
      it('convCurr() and formatC() should take into account the locale (lang) if currencySource is not defined', function (done) {
        var data = {
          value : 10
        };
        var options = {
          currencySource : null,
          currencyTarget : null, // depends on locale
          currencyRates  : { EUR : 1, USD : 2, GBP: 10 },
          lang : 'en-GB'
        };
        // nothing happen if both are not defined
        carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, options, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>10</xml>');
          options.currencyTarget = 'USD';
          carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, options, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml>2</xml>');
            // We should still be able to force to another currency with the formatter
            carbone.renderXML('<xml>{d.value:convCurr(EUR)}</xml>', data, options, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml>1</xml>');
              carbone.renderXML('<xml>{d.value:convCurr(EUR, USD)}</xml>', data, options, function (err, result) {
                helper.assert(err+'', 'null');
                helper.assert(result, '<xml>5</xml>');
                done();
              });
            });
          });
        });
      });
      it('convCurr() and formatC() should takes into account global parameters first, then options in carbone.render', function (done) {
        var data = {
          value : 10
        };
        var customOptions = {};
        var options = {
          currencySource : 'GBP',
          currencyTarget : null, // USD from locale
          currencyRates  : { EUR : 1, USD : 2, GBP: 10 },
          lang : 'en-US'
        };
        carbone.set(options);
        carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>2</xml>');
          options.currencyTarget = 'GBP';
          carbone.set(options);
          carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml>10</xml>');
            options.currencyTarget = '';
            carbone.set(options);
            customOptions.currencyRates = { EUR : 1, USD : 3, GBP: 10 };
            carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, customOptions, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml>3</xml>');
              customOptions.currencyTarget = 'EUR';
              carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, customOptions, function (err, result) {
                helper.assert(err+'', 'null');
                helper.assert(result, '<xml>1</xml>');
                customOptions.currencySource = 'EUR';
                carbone.renderXML('<xml>{d.value:convCurr()}</xml>', data, customOptions, function (err, result) {
                  helper.assert(err+'', 'null');
                  helper.assert(result, '<xml>10</xml>');
                  done();
                });
              });
            });
          });
        });
      });
    });

    describe('security test', function () {
      it('cannot inject JS using XML', function (done) {
        var data = {
          param : 3,
        };
        carbone.renderXML("<xml>{d.param}\\'sdsdsd.ss;'{d.param} </xml>", data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, "<xml>3\\\\'sdsdsd.ss;3\\' </xml>");
          done();
        });
      });
    });
  });


  describe('render', function () {
    before(function () {
      var _templatePath = path.resolve('./test/datasets');
      carbone.set({templatePath : _templatePath});
      helper.rmDirRecursive(testPath);
    });
    afterEach(function () {
      helper.rmDirRecursive(testPath);
    });
    after(function () {
      carbone.reset();
    });
    it('should render a template (docx) and give result with replacements', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.docx');
      carbone.render('test_word_render_A.docx', data, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755',8));
        var _document = path.join(testPath, 'file.docx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['word/document.xml'];
          assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
          done();
        });
      });
    });
    it('should not leaks (leave file descriptor open) when rendering a report', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.docx');
      carbone.render('test_word_render_A.docx', data, function (err, result) {
        assert.equal(err, null);
        // check memory leaks. On Windows, we should use replace lsof by 'handle -p pid' and 'listdlls -p pid' ?
        var _result = execSync('lsof -p '+process.pid).toString();
        assert.equal(/test_word_render_A\.docx/.test(_result), false);
        done();
      });
    });
    it('should be fast to render a document without conversion', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _nbExecuted = 10;
      var _results = [];
      var _waitedResponse = _nbExecuted;
      var _start = new Date();
      for (var i = 0; i < _nbExecuted; i++) {
        carbone.render('test_word_render_A.docx', data, function (err, result) {
          _waitedResponse--;
          _results.push(result);
          if (_waitedResponse === 0) {
            theEnd();
          }
        });
      }
      function theEnd () {
        var _end = new Date();
        var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
        console.log('\n\n Basic rendering: Time Elapsed : '+_elapsed + ' ms per file for '+_nbExecuted+' attempts (usally around 10ms)\n\n\n');
        for (var i = 0; i < _results.length; i++) {
          var _buf = new Buffer(_results[i]);
          assert.equal((_buf.slice(0, 2).toString() === 'PK'), true);
        }
        assert.equal((_elapsed < 200), true);
        done(); 
      }
    });
    it('should render a template (doc XML 2003) and give result with replacements', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.render('test_word_render_2003_XML.xml', data, function (err, result) {
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        done();
      });
    });
    it('should accept a second data object with the marker {c.}', function (done) {
      path.resolve('./test/datasets/test_word_render_2003_XML.xml');
      var _data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _complement = {
        author1 : 'author_1',
        author2 : 'author_2'
      };
      path.resolve('temp', (new Date()).valueOf().toString() + (Math.floor((Math.random()*100)+1)) + '.xml');
      carbone.render('test_word_render_2003_XML.xml', _data, {complement : _complement}, function (err, result) {
        assert.equal(err, null);
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        assert.equal(result.indexOf('author1'), -1);
        assert.equal(result.indexOf('author2'), -1);
        assert.notEqual(result.indexOf('author_1'), -1);
        assert.notEqual(result.indexOf('author_2'), -1);
        done();
      });
    });
    it('(zipped file) should accept a second data object with the marker {c.}', function (done) {
      path.resolve('./test/datasets/test_word_render_A.docx');
      var _data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var _complement = {
        author1 : 'author_1',
        author2 : 'author_2'
      };
      carbone.render('test_word_render_A.docx', _data, {complement : _complement}, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _document = path.join(testPath, 'file.docx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['word/document.xml'];
          assert.equal(_xmlExpectedContent.indexOf('field1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('field2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('field_2'), -1);
          assert.equal(_xmlExpectedContent.indexOf('author1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('author2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('author_1'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('author_2'), -1);
          done();
        });
      });
    });
    it('should translate the file and insert three product rows.\
      it should load translations files if the template path change', function (done) {
      var _templatePath = path.join(__dirname, 'datasets');
      var _dirLangPath  = path.join(_templatePath, 'lang');
      var _fileLangPath = path.join(_dirLangPath, 'fr.json');
      var _data = [
        {
          name  : 'Bouteille de sirop d’érable 25cl',
          qty   : '4',
          price : '8',
          total : '32',
        },{
          name  : 'Bouteille de cidre de glace 1L',
          qty   : '2',
          price : '17.5',
          total : '35',
        },{
          name  : 'Sachet de Cranberry 200g',
          qty   : '3',
          price : '2',
          total : '6',
        }
      ];
      var _objLang = {
        'Canada Products'                   : 'Produits du Canada',
        productName                         : 'Nom du produit',
        qty                                 : 'Quantité',
        unitPrice                           : 'Prix unitaire',
        'I\'ve an Idea : Revenues >= Sales' : 'J\'ai une idée : Chiffre d\'Affaire >= Ventes'
      };
      helper.rmDirRecursive(_dirLangPath);
      fs.mkdirSync(_dirLangPath);
      fs.writeFileSync(_fileLangPath, JSON.stringify(_objLang, null, 2));
      carbone.set({lang : 'fr'});
      carbone.set({templatePath : _templatePath});
      carbone.render('test_odt_render_translate.odt', _data, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _document = path.join(testPath, 'file.odt');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['content.xml'];
          assert.equal(_xmlExpectedContent.indexOf('Canada Products'), -1);
          assert.equal(_xmlExpectedContent.indexOf('productName'), -1);
          assert.equal(_xmlExpectedContent.indexOf('qty'), -1);
          assert.equal(_xmlExpectedContent.indexOf('Unit price'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Produits du Canada'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Nom du produit'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Quantité'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Prix unitaire'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('total'), -1); // total is not defined in this ObjLang. So it should be write with this word 'total'
          assert.notEqual(_xmlExpectedContent.indexOf('Bouteille de sirop d’érable 25cl'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Bouteille de cidre de glace 1L'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('Sachet de Cranberry 200g'), -1);
          helper.rmDirRecursive(_dirLangPath);
          done();
        });
      });
    });
    it('should accept pre-declared variables and variables declared directly in the document.\
      it should remove declared variables from the template', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2',
        field3 : 'field_3'
      };
      var options = {
        variableStr : '{#preVar1= d.field1 } {#preVar2= d.field2 }'
      };
      carbone.render('test_variables.xml', data, options, function (err, result) {
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.equal(result.indexOf('field3'), -1);
        assert.equal(result.indexOf('myVar3'), -1); // should remove declared variables from the template
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        assert.notEqual(result.indexOf('field_3'), -1);
        done();
      });
    });
    it('should parse and return the report filename', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : '2013',
        field3 : 'field_3'
      };
      var options = {
        reportName : 'report_{d.field2}'
      };
      carbone.render('test_variables.xml', data, options, function (err, result, reportName) {
        assert.equal(reportName, 'report_2013');
        done();
      });
    });
    it('should accept XLSX files (needs preprocessing)', function (done) {
      var _data = [{
        name : 'Bouteille de sirop d’érable 25cl',
        qty  : 4
      },{
        name : 'Bouteille de cidre de glace 1L',
        qty  : 2
      },{
        name : 'Sachet de Cranberry 200g',
        qty  : 3
      }];
      carbone.render('test_xlsx_list.xlsx', _data, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _document = path.join(testPath, 'file.xlsx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['xl/worksheets/sheet1.xml'];
          _xmlExpectedContent.should.containEql(''
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de sirop d’érable 25cl</t></is></c><c  t="inlineStr"><is><t>4</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de cidre de glace 1L</t></is></c><c  t="inlineStr"><is><t>2</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Sachet de Cranberry 200g</t></is></c><c  t="inlineStr"><is><t>3</t></is></c></row>'
          );
          done();
        });
      });
    });
    it.skip('should parse embedded documents (should be ok but not perfect)');
    it.skip('should re-generate r=1, c=A1 in Excel documents');
    it.skip('should not remove empty cells in XLSX files (needs pre-processing to add empty cells)');
  });


  describe('render and convert document', function () {
    var _templatePath = path.join(__dirname, 'datasets');
    var defaultOptions = {
      pipeNamePrefix : '_carbone',
      factories      : 1,
      startFactory   : false,
      attempts       : 2
    };
    afterEach(function (done) {
      converter.exit(function () {
        converter.init(defaultOptions, done);
        carbone.reset();
      });
    });
    beforeEach(function () {
      carbone.set({templatePath : _templatePath});
    });
    it('should render a template (docx), generate to PDF and give output', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.render('test_word_render_A.docx', data, {convertTo : 'pdf'}, function (err, result) {
        assert.equal(err, null);
        var buf = new Buffer(result);
        assert.equal(buf.slice(0, 4).toString(), '%PDF');
        var bufPDF = new Buffer(buf.length);
        fs.open(_pdfResultPath, 'r', function (status, fd) {
          fs.read(fd, bufPDF, 0, buf.length, 0, function (err, bytesRead, buffer) {
            assert.equal(buf.slice(0, 4).toString(), '%PDF');
            assert.equal(buf.slice(8, 50).toString(), buffer.slice(8, 50).toString());
            done();
          });
        });
      });
    });
    it('should not crash if datas contain XML-incompatible control code', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u000b\u000c\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f',
        field2 : 'field_2'
      };
      carbone.render(path.resolve('./test/datasets/test_word_render_A.docx'), data, {convertTo : 'pdf'}, function (err, result) {
        assert.equal(err, null);
        var buf = new Buffer(result);
        assert.equal(buf.slice(0, 4).toString(), '%PDF');
        done();
      });
    });
    it('should render spreadsheet and convert it to a xls', function (done) {
      var data = [{
        id   : 1,
        name : 'field_1'
      },{
        id   : 2,
        name : 'field_2'
      }];
      carbone.render('test_spreadsheet.ods', data, {convertTo : 'xls'}, function (err) {
        helper.assert(err, null);
        // fs.writeFileSync('test.xls', result);
        // TODO TODO TODO TODO TODO TODO TODO TODO : test the content of the xls
        done();
      });
    });
    it('should be fast to render and convert to pdf', function (done) {
      converter.init({
        pipeNamePrefix : '_carbone',
        factories      : 3,
        startFactory   : true,
        attempts       : 2
      }, function () {

        var data = {
          field1 : 'field_1',
          field2 : 'field_2'
        };
        var _nbExecuted = 100;
        var _results = [];
        var _waitedResponse = _nbExecuted;
        var _start = new Date();
        for (var i = 0; i < _nbExecuted; i++) {
          carbone.render('test_word_render_A.docx', data, {convertTo : 'pdf'}, function (err, result) {
            _waitedResponse--;
            _results.push(result);
            if (_waitedResponse === 0) {
              theEnd();
            }
          });
        }
        function theEnd () {
          var _end = new Date();
          var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
          console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions (usally around 65ms) \n\n\n');
          for (var i = 0; i < _results.length; i++) {
            var _buf = new Buffer(_results[i]);
            assert.equal(_buf.slice(0, 4).toString(), '%PDF');
          }
          // assert.equal((_elapsed < 200), true);
          done(); 
        }
      });
    });
  });

  describe('render and convert CSV with options', function () {
    var _templatePath = path.join(__dirname, 'datasets');
    var defaultOptions = {
      pipeNamePrefix : '_carbone',
      factories      : 1,
      startFactory   : false,
      attempts       : 2
    };
    afterEach(function (done) {
      converter.exit(function () {
        converter.init(defaultOptions, done);
        carbone.reset();
      });
    });
    beforeEach(function () {
      carbone.set({templatePath : _templatePath});
    });
    it('should render spreadsheet with raw options (complete)', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : null
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err) {
        helper.assert(err, null);
        done();
      });
    });
    it('should not use the converter if the input file extension is the same as convertTo parameter', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : 'ods'
      };
      var _start = process.hrtime();
      carbone.render('test_spreadsheet.ods', data, _options, function (err) {
        var _diff = process.hrtime(_start);
        var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
        helper.assert(err, null);
        helper.assert(_elapsed < 100, true);
        done();
      });
    });
    it('should return an error when the convertTo format is unknown', function (done) {
      var _options = {
        convertTo : 'ods_ede'
      };
      carbone.render('test_spreadsheet.ods', {}, _options, function (err) {
        helper.assert(/Format "ods_ede" not accepted/.test(err), true);
        done();
      });
    });
    it('should render spreadsheet with raw options (complete)', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName       : 'csv',
          formatOptionsRaw : '124,34,0'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = '||\n|1|field_1\n|2|field_2\n';
        helper.assert(result.toString(), _expected);
        done();
      });
    });
    it('should not crash if formatName is passed without formatOptionsRaw and formatOptions', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName : 'csv'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = ',,\n,1,field_1\n,2,field_2\n';
        helper.assert(result.toString(), _expected);
        done();
      });
    });
    it('should render spreadsheet with raw options (incomplete)', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName       : 'csv',
          formatOptionsRaw : '124'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = '||\n|1|field_1\n|2|field_2\n';
        helper.assert(result.toString(), _expected);
        done();
      });
    });
    it('should render spreadsheet with options (complete)', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName    : 'csv',
          formatOptions : {
            fieldSeparator : '+',
            textDelimiter  : '"',
            characterSet   : '0'
          }
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = '++\n+1+field_1\n+2+field_2\n';
        helper.assert(result.toString(), _expected);
        done();
      });
    });
    it('should render spreadsheet with options (incomplete)', function (done) {
      var data = [{ id : 1, name : 'field_1' },
                  { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName    : 'csv',
          formatOptions : {
            fieldSeparator : '*',
            characterSet   : '9'
          }
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = '**\n*1*field_1\n*2*field_2\n';
        helper.assert(result.toString(), _expected);
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

