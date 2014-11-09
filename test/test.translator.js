var assert = require('assert');
var translator  = require('../lib/translator');
var helper = require('../lib/helper');
var path  = require('path');
var fs  = require('fs');
var rootPath = process.cwd(); //where "make test" is called 
var testPath = rootPath+'/test/test/';

describe('translator', function(){

  describe('generateLang(dir,lang)' ,function(){
    var _lang = "test";
    var _templatePath = path.join(__dirname, 'datasets');
    var _dirLangPath = path.join(_templatePath,'lang');
    var _fileLangPath = _dirLangPath+'/'+_lang+'.json';


    it('should return a message when the folder where are docs does not exist', function(done){
      helper.rmDirRecursive(_dirLangPath);
      var _testedPathFalse = path.join(__dirname, '../test_docs_incorrect');
      var _result = translator.generateLang(_testedPathFalse,_lang);
      helper.assert(_result, "docs folder does not exist");
      done();
    });

    it('should create the lang directory when it does not exist', function(done){
      //lang directory should not exist
      helper.rmDirRecursive(_dirLangPath);
      var _isLangDirectoryExist = true;
      var _isLangFileExist = false;

      fs.exists(_dirLangPath, function(exists) {
        if (exists) {
          _isLangDirectoryExist = true;
        }else{
          _isLangDirectoryExist = false;
        }
        helper.assert(_isLangDirectoryExist, false);

        //should create the lang directory and the test.json file
        translator.generateLang(_templatePath,_lang);
        fs.exists(_dirLangPath, function(exists) {
          if (exists) {
            _isLangDirectoryExist = true;
          }else{
            _isLangDirectoryExist = false;
          }
          helper.assert(_isLangDirectoryExist, true);
          //TODO : modify this test in order to not use setTimeout
          setTimeout(function () {
            fs.exists(_fileLangPath, function(exists) {
              if (exists) {
                _isLangFileExist = true;
              }else{
                _isLangFileExist = false;
              }
                helper.assert(_isLangFileExist, true);
                done();
            });
          }, 2000)
        });
      });
    });

    it('should add 19 tranlates keys in the test lang file', function(done){
      var expectedObjLang = {
        "another translation is required": "",
        "Canada Products": "",
        "currency": "",
        "Delivery Date": "",
        "excl tax": "",
        "From": "",
        "FromDate": "",
        "I need to be translate": "",
        "I've an Idea : Revenues >= Sales": "",
        "Internal Code": "",
        "Order Date": "",
        "Order number": "",
        "productName": "",
        "qty": "",
        "Send Mode": "",
        "Shipping Cost": "",
        "Site": "",
        "Source": "",
        "Status": "",
        "Supplier": "",
        "Supplier orders multi-site report": "",
        "toDate": "",
        "total": "",
        "Total": "",
        "Total Amount": "",
        "unitPrice": ""
      }

      //should create the lang directory and the test.json file
      translator.generateLang(_templatePath,_lang);
      fs.readFile(_fileLangPath, 'utf8', function (err,langData) {

        helper.assert(err, null);
        var fixedResponse = langData.replace(/\\'/g, "'");
        var objLang = ""
        if (!err) {
          objLang = JSON.parse(fixedResponse);
        }
        helper.assert(expectedObjLang, objLang);
        done();
      });
    });

    it('4 translates are defined. This translates must be at the bottom of the lang file \
      and theirs values should not be updated', function(done){
      var expectedObjLang = {
        "Canada Products": "",
        "Delivery Date": "",
        "excl tax": "",
        "From": "",
        "FromDate": "",
        "I need to be translate": "",
        "I've an Idea : Revenues >= Sales": "",
        "Internal Code": "",
        "Order Date": "",
        "Order number": "",
        "productName": "",
        "qty": "",
        "Send Mode": "",
        "Shipping Cost": "",
        "Site": "",
        "Source": "",
        "Status": "",
        "Supplier": "",
        "Supplier orders multi-site report": "",
        "toDate": "",
        "total": "",
        "unitPrice": "",
        "another translation is required": "une autre traduction est requise",
        "currency": "monnaie",
        "Total": "Total",
        "Total Amount": "Montant Total"
      };

      var newObjLang = {
        "another translation is required": "une autre traduction est requise",
        "currency": "monnaie",
        "Total": "Total",
        "Total Amount": "Montant Total"
      };
      fs.writeFile(_fileLangPath, JSON.stringify(newObjLang, null, 2), function(err){
        helper.assert(err, null);
        //should create the lang directory and the test.json file
        translator.generateLang(_templatePath,_lang);
        setTimeout(function () {
            fs.readFile(_fileLangPath, 'utf8', function (err,langData) {
              var fixedResponse = langData.replace(/\\'/g, "'");
              var objLang = ""
              if (!err) {
                objLang = JSON.parse(fixedResponse);
              }
              helper.assert(expectedObjLang, objLang);
              done();
            });
          }, 3000);
      });
    });

    it('6 translates are defined. 2 of them should be not found. These not found translates must be sorted and find at the \
      top of the translate file with <!> below them', function(done){
      var expectedObjLang = {
        "<!>Error 404" : "",
        "<!>not found" : "non trouve",
        "Canada Products": "",
        "Delivery Date": "",
        "excl tax": "",
        "From": "",
        "FromDate": "",
        "I need to be translate": "",
        "I've an Idea : Revenues >= Sales": "",
        "Internal Code": "",
        "Order Date": "",
        "Order number": "",
        "productName": "",
        "qty": "",
        "Send Mode": "",
        "Shipping Cost": "",
        "Site": "",
        "Source": "",
        "Status": "",
        "Supplier": "",
        "Supplier orders multi-site report": "",
        "toDate": "",
        "total": "",
        "unitPrice": "",
        "another translation is required": "une autre traduction est requise",
        "currency": "monnaie",
        "Total": "Total",
        "Total Amount": "Montant Total"
      };

      var newObjLang = {
        "another translation is required": "une autre traduction est requise",
        "currency": "monnaie",
        "not found": "non trouve",
        "Error 404": "",
        "Total": "Total",
        "Total Amount": "Montant Total"
      };
      fs.writeFile(_fileLangPath, JSON.stringify(newObjLang, null, 2), function(err){
        helper.assert(err, null);
        //should create the lang directory and the test.json file
        translator.generateLang(_templatePath,_lang);
        setTimeout(function () {
            fs.readFile(_fileLangPath, 'utf8', function (err,langData) {
              var fixedResponse = langData.replace(/\\'/g, "'");
              var objLang = ""
              if (!err) {
                objLang = JSON.parse(fixedResponse);
              }
              helper.assert(expectedObjLang, objLang);
              helper.rmDirRecursive(_dirLangPath);
              done();
            });
          }, 3000);
      });
    });
  });
});
