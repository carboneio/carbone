var assert = require('assert');
var carbone = require('../lib/index');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');
var params = require('../lib/params');
var input = require('../lib/input');
var converter = require('../lib/converter');
var testPath = path.join(__dirname, 'test_file');
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;

describe('Carbone', function () {


  describe('set', function () {
    var _templatePath = path.join(__dirname,'template1');
    var _tempPath = path.join(__dirname,'temp1');
    after(function (done) {
      helper.rmDirRecursive(_tempPath);
      helper.rmDirRecursive(_templatePath);
      done();
    });
    afterEach(function (done) {
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
  });

  describe('format date', function () {
    afterEach(function (done) {
      carbone.reset();
      done();
    });
    it('should return friday for 20140131 even if no timezone is set', function (done) {
      carbone.set({lang : 'fr'});
      carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131 23:45:00'},  function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml> vendredi </xml>');
        carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml> vendredi </xml>');
          carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131 00:10:00'}, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml> vendredi </xml>');
            done();
          });
        });
      });
    });
    it('should change the lang globally of date formatter', function (done) {
      carbone.set({lang : 'fr'});
      carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131 23:45:00'},  function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml> vendredi </xml>');
        carbone.set({lang : 'en'});
        carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml> Friday </xml>');
          carbone.set({lang : 'fr'});
          carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131'}, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml> vendredi </xml>');
            // Should overwrite global lang with options
            carbone.renderXML('<xml> {d.date:formatD(dddd)} </xml>', { date : '20140131'}, {lang : 'en'}, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml> Friday </xml>');
              done();
            });
          });
        });
      });
    });
    it('should accept locale with or without country code (upper or lowercase)', function (done) {
      let _data = {
        date  : '20140131 23:45:00',
        price : 1000.1234
      };
      let _xml = '<xml> {d.date:formatD(dddd)} {d.price:formatN()} </xml>';
      carbone.renderXML(_xml, _data , {lang : 'fr-FR'},  function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml> vendredi 1 000,123 </xml>');
        carbone.renderXML(_xml, _data, {lang : 'de-DE'},  function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml> Freitag 1.000,123 </xml>');
          carbone.renderXML(_xml, _data, {lang : 'fr-fr'},  function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml> vendredi 1 000,123 </xml>');
            carbone.renderXML(_xml, _data, {lang : 'de'},  function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml> Freitag 1.000,123 </xml>');
              done();
            });
          });
        });
      });
    });
    it('should change the timezone globally and localy', function (done) {
      carbone.set({timezone : 'Europe/Paris'});
      carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00'}, function (err, result) {
        helper.assert(err+'', 'null');
        // By defaut, Carbone consider the input timezone is Europe/Paris if not specified
        helper.assert(result, '<xml> 2:00:00 PM </xml>');
        carbone.set({timezone : 'America/New_York'});
        carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml> 8:00:00 AM </xml>');
          // If the input timezone is defined with UTC-X, it takes this into account
          carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00-04:00'}, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml> 2:00:00 PM </xml>');
            // Should overwrite global timezone with options
            carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00-04:00'}, {timezone : 'Europe/Paris'}, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml> 8:00:00 PM </xml>');
              done();
            });
          });
        });
      });
    });
    it('should not crash it the wrong timezone or wrong lang is passed during rendering', function (done) {
      carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00-04:00'}, {timezone : 'BULLSHIT'}, function (err, result) {
        helper.assert(/BULLSHIT/.test(err), true);
        helper.assert(/RangeError/.test(err), true);
        helper.assert(/time zone/.test(err), true);
        helper.assert(result, null);
        carbone.renderXML('<xml> {d.date:formatD(LTS)} </xml>', { date : '2014-06-01 14:00:00-04:00'}, {lang : 'BULLSHIT'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml> 8:00:00 PM </xml>');
          done();
        });
      });
    });
    it('should accept combination of operations `addD` on dates + formatD', function (done) {
      carbone.renderXML('{d.date:addD(1, day):formatD(YYYY-MM-DD)}', { date : '2014-06-01 14:00:00'}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '2014-06-02');
        carbone.renderXML('{d.date:addD(1, day, MM-DD-YYYY):formatD(YYYY-MM-DD)}', { date : '06-01-2014'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '2014-06-02');
          done();
        });
      });
    });
    it('should accept combination of operations `addD` on dates + format', function (done) {
      carbone.renderXML('{d.date:subD(1, day):formatD(YYYY-MM-DD)}', { date : '2014-06-01 14:00:00'}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '2014-05-31');
        carbone.renderXML('{d.date:subD(1, day, MM-DD-YYYY):formatD(YYYY-MM-DD)}', { date : '06-01-2014'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '2014-05-31');
          done();
        });
      });
    });
    it('should accept combination of operations `startOfD` on dates + format', function (done) {
      carbone.renderXML('{d.date:startOfD(month):formatD(YYYY-MM-DD)}', { date : '2014-06-11 14:00:00'}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '2014-06-01');
        carbone.renderXML('{d.date:startOfD(month, MM-DD-YYYY):formatD(YYYY-MM-DD)}', { date : '06-11-2014'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '2014-06-01');
          done();
        });
      });
    });
    it('should accept combination of operations `endOfD` on dates + format', function (done) {
      carbone.renderXML('{d.date:endOfD(month):formatD(YYYY-MM-DD)}', { date : '2014-06-11 14:00:00'}, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '2014-06-30');
        carbone.renderXML('{d.date:endOfD(month, MM-DD-YYYY):formatD(YYYY-MM-DD)}', { date : '06-11-2014'}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '2014-06-30');
          done();
        });
      });
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
      assert.notEqual(typeof input.formatters.yesOrNo, 'undefined');
      assert.equal(input.formatters.yesOrNo(true), 'yes');
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

  describe('renderXML with dash', function () {
    it('should render an XML string with dash in json keys', function (done) {
      var data = {
        param : {
          'new-param' : {
            value : 'test'
          }
        }
      };
      carbone.renderXML('<xml>{d.param.new-param.value}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>test</xml>');
        done();
      });
    });
    it('should render an XML string with multiple dash in json keys', function (done) {
      var data = {
        param : {
          'new-param-s-t-u-popo' : {
            value : 'test'
          }
        }
      };
      carbone.renderXML('<xml>{d.param.new-param-s-t-u-popo.value}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>test</xml>');
        done();
      });
    });
    it('should print an array without usng a formatter', function (done) {
      var data = {
        param : ['test', 'bla']
      };
      carbone.renderXML('<xml>{d.param}</xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml>test,bla</xml>');
        done();
      });
    });
    it('should render an XML string with dash in array keys', function (done) {
      var data = {
        'param-dash' : [{
          'new-param-with-dash' : 'val'
        }, {
          'new-param-with-dash' : 'val1'
        }, {
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i].new-param-with-dash}</t><t>{d.param-dash[i+1].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val</t><t>val1</t><t>val2</t></xml>');
        done();
      });
    });
    it('should render an XML string with dash in filter keys', function (done) {
      var data = {
        'param-dash' : [{
          'filter-val'          : 1,
          'new-param-with-dash' : 'val'
        }, {
          'filter-val'          : 1,
          'new-param-with-dash' : 'val1'
        }, {
          'filter-val'          : 2,
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=1].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=1].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val</t><t>val1</t></xml>');
        done();
      });
    });
    it('should accept to filter with boolean in arrays', function (done) {
      var data = {
        'param-dash' : [{
          'filter-val'          : true,
          'new-param-with-dash' : 'val'
        }, {
          'filter-val'          : false,
          'new-param-with-dash' : 'val1'
        }, {
          'filter-val'          : true,
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=false].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=false].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val1</t></xml>');
        carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=true].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=true].new-param-with-dash}</t></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><t>val</t><t>val2</t></xml>');
          done();
        });
      });
    });
    it('should consider the boolean is a string if there are quotes', function (done) {
      var data = {
        'param-dash' : [{
          'filter-val'          : true,
          'new-param-with-dash' : 'val'
        }, {
          'filter-val'          : false,
          'new-param-with-dash' : 'val1'
        }, {
          'filter-val'          : 'true',
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=\'true\'].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=\'true\'].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val2</t></xml>');
        done();
      });
    });
    it('should accept to filter with boolean even if the boolean is a string in data (backward compatible with v1/v2, same behavior as numbers)', function (done) {
      var data = {
        'param-dash' : [{
          'filter-val'          : 'true',
          'new-param-with-dash' : 'val'
        }, {
          'filter-val'          : 'false',
          'new-param-with-dash' : 'val1'
        }, {
          'filter-val'          : 'true',
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=false].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=false].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val1</t></xml>');
        carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=true].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=true].new-param-with-dash}</t></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><t>val</t><t>val2</t></xml>');
          done();
        });
      });
    });
    it('should accept to filter with boolean even if the boolean has whitespaces', function (done) {
      var data = {
        'param-dash' : [{
          'filter-val'          : 'true',
          'new-param-with-dash' : 'val'
        }, {
          'filter-val'          : 'false',
          'new-param-with-dash' : 'val1'
        }, {
          'filter-val'          : true,
          'new-param-with-dash' : 'val2'
        }]
      };
      carbone.renderXML('<xml><t>{d.param-dash[i, filter-val= false  ].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=  false  ].new-param-with-dash}</t></xml>', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '<xml><t>val1</t></xml>');
        carbone.renderXML('<xml><t>{d.param-dash[i, filter-val=  true  ].new-param-with-dash}</t><t>{d.param-dash[i+1, filter-val=  true  ].new-param-with-dash}</t></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><t>val</t><t>val2</t></xml>');
          done();
        });
      });
    });

    it('should render XML with dahs in array kes and filter keys', function (done) {
      var _xml = '<xml><t_row> {d.cars-dash[sort-dash-s,i].brand-dash-v:count()} {d.cars-dash[sort-dash-s,i].brand-dash-v} </t_row><t_row> {d.cars-dash[sort-dash-s+1,i+1].brand-dash-v} </t_row></xml>';
      var _data = {
        'cars-dash' : [
          {'brand-dash-v' : 'Lumeneo'     , 'sort-dash-s' : 1},
          {'brand-dash-v' : 'Tesla motors', 'sort-dash-s' : 2},
          {'brand-dash-v' : 'Toyota'      , 'sort-dash-s' : 1}
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><t_row> 1 Lumeneo </t_row><t_row> 2 Toyota </t_row><t_row> 3 Tesla motors </t_row></xml>');
        done();
      });
    });
    it('should render XML with dash and multiple array', function (done) {
      var _xml =
         '<xml>'
        +  '<tr>'
        +    '<td>{d[i].cars-dash[i].wheels-dash[i].tire-dash.brand-dash:count()} {d[i].cars-dash[i].wheels-dash[i].tire-dash.brand-dash}</td>'
        +    '<td>{d[i].cars-dash[i].wheels-dash[i].tire-dash.brand-dash:count(0)} {d[i].site-dash.label-dash}</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>{d[i+1].cars-dash[i+1].wheels-dash[i+1].tire-dash.brand-dash}</td>'
        +    '<td>{d[i+1].site-dash.label-dash}</td>'
        +  '</tr>'
        +'</xml>';
      var _data = [
        {
          'site-dash' : {'label-dash' : 'site_A'},
          'cars-dash' : [
            {
              'wheels-dash' : [
                {'tire-dash' : {'brand-dash' : 'mich'}},
                {'tire-dash' : {'brand-dash' : 'cont'}}
              ]
            },
            {
              'wheels-dash' : [
                {'tire-dash' : {'brand-dash' : 'mich'}}
              ]
            },
          ],
        },{
          'site-dash' : {'label-dash' : 'site_B'},
          'cars-dash' : [{
            'wheels-dash' : [
              {'tire-dash' : {'brand-dash' : 'mich'}},
              {'tire-dash' : {'brand-dash' : 'uni' }},
              {'tire-dash' : {'brand-dash' : 'cont'}}
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
    it('should return the current timestamp in UTC with c.now', function (done) {
      carbone.renderXML('{c.now}', {}, function (err, result) {
        helper.assert(err+'', 'null');
        var _parseDate = new Date(result);
        helper.assert(((Date.now()/1000) - _parseDate.getTime()) < 1, true) ;
        done();
      });
    });
    it('should not overwrite c.now if already defined the current timestamp in UTC with c.now', function (done) {
      carbone.renderXML('{c.now}', {}, { complement : {now : 'aa'} }, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, 'aa');
        done();
      });
    });
    it('should return the current timestamp in UTC with c.now even if complement is null', function (done) {
      carbone.renderXML('{c.now}', {}, { complement : null }, function (err, result) {
        helper.assert(err+'', 'null');
        var _parseDate = new Date(result);
        helper.assert(((Date.now()/1000) - _parseDate.getTime()) < 1, true) ;
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
        helper.assert(err+'', 'Error: Formatter "ifEkual" does not exist. Do you mean "ifEqual"?');
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
    it('ifEqual formatter should render a text with space and comma characters', function (done) {
      const _data = {
        myvalue : true
      };
      const _template = '<xml>{d.myvalue:ifEqual(true, \'This is a text, with, commas\')}</xml>';
      const _expectedResult = '<xml>This is a text, with, commas</xml>';
      carbone.renderXML(_template, _data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, _expectedResult);
        done();
      });
    });

    it('print formatter should render a text with space and comma characters', function (done) {
      const _data = {
        myvalue : false
      };
      const _template = '<xml>{d.myvalue:print(\'This is, a, second, text, with, commas and, spaces\')}</xml>';
      const _expectedResult = '<xml>This is, a, second, text, with, commas and, spaces</xml>';
      carbone.renderXML(_template, _data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, _expectedResult);
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
    it('should translate markers which are inside other markers and remove XML inside', function () {
      let _xml = '<xml>{<t>d</t>.id:if<tag>Eq</tag>ual(2, \'{<b>t</b>(on <br>Monday) }\'</br>) }</xml>';
      let _expectedXML = '<xml>le Lundi<t></t><tag></tag><b></b><br></br></xml>';
      let _options = {
        lang         : 'fr',
        translations : {
          fr : {
            'on Monday' : 'le Lundi'
          }
        }
      };
      carbone.renderXML(_xml, {id : 2}, _options, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, _expectedXML);
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

    it('Should insert the correct values even if aliases are beginning with the same name', function (done) {
      var _xml = '{#myVar=d.name}{#myVarSecond=d.age}<xml><t_row>{$myVar}<br/>{$myVarSecond}</t_row></xml>';
      var _xml2 = '{#a = d.report.contact.methods}{#ao = d.report.postal}<xml><div>{$a}</div><div>{$ao}</div></xml>';
      var _data = {
        name   : 'John',
        age    : 20,
        report : {
          contact : {
            methods : 'blue'
          },
          postal : 94000
        }
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<xml><t_row>John<br/>20</t_row></xml>');
        carbone.renderXML(_xml2, _data, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<xml><div>blue</div><div>94000</div></xml>');
          done();
        });
      });
    });

    it('should generate valid XML even if the second row is repeated entirely and includes simple markers d.type without arrays', function (done) {
      var _xml = ''
        + '<xml>'
        +   '<p>'
        +     '<i>'
        +       '{d.type}'
        +     '</i>'
        +     '<i>'
        +       '{d.cars[i].id}'
        +     '</i>'
        +   '</p>'
        +   '<p>'
        +     '<i>'
        +       '{d.type}'
        +     '</i>'
        +     '<i>'
        +       '{d.cars[i+1].id}'
        +     '</i>'
        +   '</p>'
        +   '<p>'
        +    '{d.id}'
        +   '</p>'
        + '</xml>'
      ;
      var _data = {
        type : 201,
        id   : 177193,
        cars : [
          {
            id       : 0,
            pictures : null,
            other    : 1
          }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<xml><p><i>201</i><i>0</i></p><p>177193</p></xml>');
        done();
      });
    });

    describe('Dynamic variables in formatters', function () {
      it('should use variable in object if the variable starts with a point', function (done) {
        var data = {
          param       : 3,
          textToPrint : 'ddfdf'
        };
        carbone.renderXML('<xml>{d.param:ifEqual(3, .textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>ddfdf</xml>');
          done();
        });
      });
      it('should accept all variables are dynamic if they starts with a point', function (done) {
        var data = {
          param          : 3,
          valueToCompare : 3,
          textToPrint    : 'ddfdf'
        };
        carbone.renderXML('<xml>{d.param:ifEqual(.valueToCompare, .textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>ddfdf</xml>');
          data.valueToCompare = 4;
          carbone.renderXML('<xml>{d.param:ifEqual(.valueToCompare, .textToPrint)}</xml>', data, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml>3</xml>');
            done();
          });
        });
      });
      it('should accept to access direct parent objects if two points are used', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          textToPrint : 'ddfdf'
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>ddfdf</xml>');
          done();
        });
      });
      it('should accept to access direct parent objects and allow to access children objects of that parent', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          otherObj : {
            textToPrint : 'ddfdf'
          }
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..otherObj.textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>ddfdf</xml>');
          done();
        });
      });
      it('should accept to access direct parent objects and allow to access unlimited children objects of that parent', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          otherObj : {
            otherObj : {
              otherObj : {
                textToPrint : 'ddfdf'
              }
            }
          }
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..otherObj.otherObj.otherObj.textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>ddfdf</xml>');
          done();
        });
      });
      it('should not crash if object is undefined, it should return an error', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          otherObj : {
            textToPrint : 'ddfdf'
          }
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..otherObjNoExist.textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml></xml>');
          done();
        });
      });
      it('should return an error if  crash if object is undefined', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          otherObj : {
            textToPrint : 'ddfdf'
          }
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..otherObjNoExist.textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml></xml>');
          done();
        });
      });
      it('should return an empty string if a path does not exist inside a conditional formatter', function (done) {
        var data = {
          obj : {
            a : {
              value : true
            },
            b : {}
          },

        };
        carbone.renderXML('<xml>{d.obj.a.value:ifNEM():and(..b):ifNEM():show(oops):elseShow(success)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>success</xml>');
          done();
        });
      });
      it('should return an error if  crash if object is undefined', function (done) {
        var data = {
          param     : 3,
          subObject : {
            id : 2
          },
          otherObj : [{
            textToPrint : 'ddfdf'
          }]
        };
        carbone.renderXML('<xml>{d.subObject.id:ifEqual(2, ..otherObj[0].textToPrint)}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml></xml>');
          done();
        });
      });
      it.skip('should not try to reach the object attribute if the attribute is between double quotes and simple quotes', function (done) {
        var data = {
          param       : 3,
          textToPrint : 'ddfdf'
        };
        carbone.renderXML('<xml>{d.param:ifEqual(3, ".textToPrint")}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>.textToPrint</xml>');
          carbone.renderXML('<xml>{d.param:ifEqual(3, \'.textToPrint\')}</xml>', data, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml>.textToPrint</xml>');
            done();
          });
        });
      });
      it('should accept to access direct parent objects if two points are used', function (done) {
        var _xml =
           '<xml>'
          +  '<tr>'
          +    '<td>{d[i].cars[i].wheels[i].tire.nb} {d[i].cars[i].wheels[i].tire.nb:add(..nb):add(...nb):add(....site.nb)}</td>'
          +  '</tr>'
          +  '<tr>'
          +    '<td>{d[i+1].cars[i+1].wheels[i+1].tire.nb}</td>'
          +  '</tr>'
          +'</xml>';
        var _data = [
          {
            site : {nb : 10},
            cars : [
              {
                nb     : 2,
                wheels : [
                  {tire : {nb : 1000}, nb : 3},
                  {tire : {nb : 1100}, nb : 4}
                ]
              },
              {
                nb     : 3,
                wheels : [
                  {tire : {nb : 2000}, nb : 5}
                ]
              },
            ],
          },{
            site : {nb : 300},
            cars : [{
              nb     : 4,
              wheels : [
                {tire : {nb : 4000}, nb : 6},
                {tire : {nb : 4100}, nb : 7},
                {tire : {nb : 4200}, nb : 9}
              ]
            }
            ],
          }
        ];
        var _complement = {
          nb : 3
        };
        carbone.renderXML(_xml, _data, {complement : _complement}, function (err, _xmlBuilt) {
          var _expectedResult =
             '<xml>'
            +  '<tr>'
            +    '<td>1000 1015</td>'
            +  '</tr>'
            +  '<tr>'
            +    '<td>1100 1116</td>'
            +  '</tr>'
            +  '<tr>'
            +    '<td>2000 2018</td>'
            +  '</tr>'
            +  '<tr>'
            +    '<td>4000 4310</td>'
            +  '</tr>'
            +  '<tr>'
            +    '<td>4100 4411</td>'
            +  '</tr>'
            +  '<tr>'
            +    '<td>4200 4513</td>'
            +  '</tr>'
            +'</xml>';
          assert.equal(_xmlBuilt, _expectedResult);
          done();
        });
      });
    });
    describe('number formatters', function () {
      afterEach(function (done) {
        carbone.reset();
        done();
      });
      it('convCurr() and formatC() should convert from one currency to another according to rates passed in options', function (done) {
        var data = {
          value : 10
        };
        var options = {
          currencyRates : { EUR : 1, USD : 2, GBP : 10 },
          lang          : 'en-GB'
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
          currencyRates  : { EUR : 1, USD : 2, GBP : 10 },
          lang           : 'en-US'
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
          currencyRates  : { EUR : 1, USD : 2, GBP : 10 },
          lang           : 'en-GB'
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
          currencyRates  : { EUR : 1, USD : 2, GBP : 10 },
          lang           : 'en-US'
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
            customOptions.currencyRates = { EUR : 1, USD : 3, GBP : 10 };
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
          helper.assert(result, "<xml>3\\'sdsdsd.ss;'3 </xml>");
          done();
        });
      });
      it('should accept non-alphanumeric characters in variable names', function (done) {
        var data = {
          o           : { id : 2 },
          'r🚀cket'   : { id : 3 },
          'qu\\\'ote' : { id : 4 },
          报道          : { id : 5 },
          'qu\'ote'   : { id : 6 }
        };
        carbone.renderXML('<xml>{d.o.id} ha {d.r🚀cket.id} he {d.qu\\\'ote.id} ch {d.报道.id} or {d.qu\'ote.id}</xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>2 ha 3 he 4 ch 5 or 6</xml>');
          done();
        });
      });
      it('should accept non-alphanumeric characters in arrays', function (done) {
        var data = [{
          o           : { id : 2 },
          'r🚀cket'   : { id : 3 },
          'qu\\\'ote' : { id : 4 },
          报道          : { id : 5 },
          'qu\'ote'   : { id : 6 }
        }];
        carbone.renderXML('<xml><tr>{d[i].o.id} ha {d[i].r🚀cket.id} he {d[i].qu\\\'ote.id} ch {d[i].报道.id} or {d[i].qu\'ote.id}</tr><tr>{d[i+1].o.id}</tr></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><tr>2 ha 3 he 4 ch 5 or 6</tr></xml>');
          done();
        });
      });
      it('should accept non-alphanumeric characters in arrays conditions', function (done) {
        var data = [{
          o           : { id : 2, 'i💎d' : 200, 'i\\\'d' : 2000 },
          'r🚀cket'   : { id : 3, 'i💎d' : 300, 'i\\\'d' : 3000 },
          'qu\\\'ote' : { id : 4, 'i💎d' : 400, 'i\\\'d' : 4000 },
          报道          : { id : 5, 'i💎d' : 500, 'i\\\'d' : 5000 },
          'qu"ote'    : { id : 6, 'i💎d' : 600, 'i"d' : 600 },
          'qu\'ote'   : { id : 7, 'i💎d' : 700, 'i\'d' : 7000 },
        },
        {
          o           : { id : 12, 'i💎d' : 1200, 'i\\\'d' : 1200 },
          'r🚀cket'   : { id : 13, 'i💎d' : 1300, 'i\\\'d' : 1300 },
          'qu\\\'ote' : { id : 14, 'i💎d' : 1400, 'i\\\'d' : 1400 },
          报道          : { id : 15, 'i💎d' : 1500, 'i\\\'d' : 1500 },
          'qu"ote'    : { id : 16, 'i💎d' : 1600, 'i"d' : 1600 },
          'qu\'ote'   : { id : 17, 'i💎d' : 1700, 'i\'d' : 1700 }
        }];
        carbone.renderXML('<xml><tr>{d[i, r🚀cket.id = 3 ].o.id}</tr><tr>{d[i+1, r🚀cket.id = 3].o.id}</tr></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><tr>2</tr></xml>');
          carbone.renderXML('<xml><tr>{d[i, r🚀cket.i💎d = 300 ].o.id}</tr><tr>{d[i+1, r🚀cket.i💎d = 300].o.id}</tr></xml>', data, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml><tr>2</tr></xml>');
            carbone.renderXML('<xml><tr>{d[i, r🚀cket.i\\\'d = 3000 ].o.id}</tr><tr>{d[i+1, r🚀cket.i\\\'d = 3000].o.id}</tr></xml>', data, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml><tr>2</tr></xml>');
              carbone.renderXML('<xml><tr>{d[i, qu\\\'ote.id = 4 ].o.id}</tr><tr>{d[i+1, qu\\\'ote.id = 4].o.id}</tr></xml>', data, function (err, result) {
                helper.assert(err+'', 'null');
                helper.assert(result, '<xml><tr>2</tr></xml>');
                carbone.renderXML('<xml><tr>{d[i, 报道.id = 5 ].o.id}</tr><tr>{d[i+1, 报道.id = 5].o.id}</tr></xml>', data, function (err, result) {
                  helper.assert(err+'', 'null');
                  helper.assert(result, '<xml><tr>2</tr></xml>');
                  carbone.renderXML('<xml><tr>{d[i, qu"ote.i"d = 600 ].qu"ote.i"d}</tr><tr>{d[i+1, qu"ote.i"d = 600].qu"ote.i"d}</tr></xml>', data, function (err, result) {
                    helper.assert(err+'', 'null');
                    helper.assert(result, '<xml><tr>600</tr></xml>');
                    carbone.renderXML('<xml><tr>{d[i, qu\'ote.i\'d = 700 ].qu\'ote.i\'d}</tr><tr>{d[i+1, qu\'ote.i\'d = 700].qu\'ote.i\'d}</tr></xml>', data, function (err) {
                      helper.assert(err+'', 'null'); // it does not crash
                      // helper.assert(result, '<xml><tr>700</tr></xml>'); // but it does not work
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
      it('should accept non-alphanumeric characters in conditions values', function (done) {
        var data = [
          { o : { id : 'i💎d'   }, val : 'i💎d'  , res : 1 },
          { o : { id : 'i\\\'d' }, val : 'i\\\'d', res : 2 },
          { o : { id : '报道'    }, val : '报道'   , res : 3 },
          { o : { id : 'tes\\"' }, val : 'tes\\"', res : 4 },
          { o : { id : 'at"'    }, val : 'at"'   , res : 5 }
        ];
        carbone.renderXML('<xml><tr>{d[i, o.id = i💎d, val = i💎d ].res}</tr><tr>{d[i+1, o.id = i💎d, val = i💎d].res}</tr></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><tr>1</tr></xml>');
          carbone.renderXML('<xml><tr>{d[i, o.id = i\\\'d, val = i\\\'d ].res}</tr><tr>{d[i+1, o.id = i\\\'d, val = i\\\'d ].res}</tr></xml>', data, function (err, result) {
            helper.assert(err+'', 'null');
            helper.assert(result, '<xml><tr>2</tr></xml>');
            carbone.renderXML('<xml><tr>{d[i, o.id = 报道, val = 报道 ].res}</tr><tr>{d[i+1, o.id = 报道, val = 报道 ].res}</tr></xml>', data, function (err, result) {
              helper.assert(err+'', 'null');
              helper.assert(result, '<xml><tr>3</tr></xml>');
              carbone.renderXML('<xml><tr>{d[i, o.id = "tes\\"", val = "tes\\""].res}</tr><tr>{d[i+1, o.id = "tes\\"", val = "tes\\""].res}</tr></xml>', data, function (err, result) {
                helper.assert(err+'', 'null');
                helper.assert(result, '<xml><tr>4</tr></xml>');
                carbone.renderXML('<xml><tr>{d[i, o.id = "at"",val=  "at""].res}</tr><tr>{d[i+1, o.id = "at"",val= "at""].res}</tr></xml>', data, function (err, result) {
                  helper.assert(err+'', 'null');
                  helper.assert(result, '<xml><tr>5</tr></xml>');
                  done();
                });
              });
            });
          });
        });
      });
      it('should work even with backslash and quotes', function (done) {
        var data = {
          "p\\\\'aram" : 3,
        };
        carbone.renderXML("<xml>{d.p\\\\'aram}</xml>", data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>3</xml>');
          done();
        });
      });
      it('should work even if there are quotes in XML and attributes', function (done) {
        var data = {
          "p\\\\'aram" : 3,
        };
        carbone.renderXML("<xml>{d.p\\\\'aram}' </xml>", data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>3\' </xml>');
          done();
        });
      });
      it('should not crash if someone tries to inject JS code in variable', function (done) {
        var _xml = "{#myVar= '];console%2log(sd)'//  }<xml> <t_row> {$myVar} </t_row> </xml>";
        var _data = [
          {brand : 'Lumeneo'     , id : 1},
          {brand : 'Tesla motors', id : 2},
          {brand : 'Toyota'      , id : 3}
        ];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<xml> <t_row>  </t_row> </xml>');
          done();
        });
      });
      it('should not crash if weird quotes are injected in formatter parameters', function (done) {
        var data = {};
        carbone.renderXML('<xml>{d:ifEmpty(\'\\\\\'yeah\')}</xml>', data, {complement : {}}, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml>\\\\\'yeah</xml>');
          done();
        });
      });
      it('should not crash if the iterator contains string and is negative', function (done) {
        var _xml = '<xml> <t_row> {d[i=-1a].brand} </t_row><t_row> {d[i=-2a].brand} </t_row></xml>';
        var _data = [
          {brand : 'Lumeneo'     , id : 1},
          {brand : 'Tesla motors', id : 2},
          {brand : 'Toyota'      , id : 3}
        ];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
          done();
        });
      });
      it('should not crash if the iterator contains string', function (done) {
        var _xml = '<xml> <t_row> {d[i=1a].brand} </t_row><t_row> {d[i=2a].brand} </t_row></xml>';
        var _data = [
          {brand : 'Lumeneo'     , id : 1},
          {brand : 'Tesla motors', id : 2},
          {brand : 'Toyota'      , id : 3}
        ];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
          done();
        });
      });
      it('should work even if there are quotes in XML', function (done) {
        var data = {
          param : 3,
        };
        carbone.renderXML("<a>';]<xml>{d.param}' </xml>", data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, "<a>';]<xml>3' </xml>");
          done();
        });
      });
      it('should work even if there are quotes with two backlashes in XML', function (done) {
        var data = {
          param : 3,
        };
        carbone.renderXML("<a>\\';]<xml>{d.param}' </xml>", data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, "<a>\\';]<xml>3' </xml>");
          done();
        });
      });
      it('should work with multiple simple quotes', function (done) {
        var _xml = '<p>table\'stable\'stable\'s</p><p>{d.title}</p>';
        var _data = {title : 'h1'};
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<p>table\'stable\'stable\'s</p><p>h1</p>');
          done();
        });
      });
      it.skip('should accept quotes on variable name of filters', function (done) {
        var data = [
          { o : { id : 'at"' }, val : 'at"', res : 5 }
        ];
        // val has surrounding whitespaces
        carbone.renderXML('<xml><tr>{d[i, o.id = "at"", val =  "at""].res}</tr><tr>{d[i+1, o.id = "at"", val = "at""].res}</tr></xml>', data, function (err, result) {
          helper.assert(err+'', 'null');
          helper.assert(result, '<xml><tr>5</tr></xml>');
          done();
        });
      });
    });


    describe('Conditional block and conditions formatters showBegin/showEnd', function () {
      it('should accept to use other formatters with conditional blocks', function (done) {
        var _xml = '<xml> {d.val:ifEQ(3):hideBegin} <a></a> {d.val:hideEnd} {d.val:ifEQ(2):hideBegin} <b></b> {d.val:hideEnd} </xml>';
        var _data = {
          val : 3
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>   <b></b>  </xml>');
          done();
        });
      });
      it('should accept condition markers next to another condition marker', function (done) {
        var _xml = '<xml> {d.val:showBegin}hey{d.val:showEnd}{d.val:showBegin}joe{d.val:showEnd} </xml>';
        var _data = {
          val : 1
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> heyjoe </xml>');
          done();
        });
      });
      it('should accept 3 nested condition markers next to each over', function (done) {
        var _xml = '<xml> {d.val:showBegin}{d.id:showBegin}{d.o:showBegin}joe{d.val:showEnd}{d.id:showEnd}{d.o:showEnd} </xml>';
        var _data = {
          val : 1,
          id  : 3,
          o   : 4
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> joe </xml>');
          _data.id = 0;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>  </xml>');
            done();
          });
        });
      });
      it('condition should not remove surrounded XML if there is a marker just before', function (done) {
        var _xml = '<xml> <p>{d.sub.id}{d.val:ifEQ(0):showBegin}joe</p>{d.val:showEnd} </xml>';
        var _data = {
          val : 1,
          sub : { id : 3 }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <p>3</p> </xml>');
          _xml = '<xml> <p>{d.sub.id}{d.val:ifEQ(1):hideBegin}joe</p>{d.val:hideEnd} </xml>';
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <p>3</p> </xml>');
            done();
          });
        });
      });
      it('condition should not remove surrounded XML if there is a marker just after', function (done) {
        var _xml = '<xml> {d.val:ifEQ(0):showBegin}<p>joe{d.val:showEnd}{d.sub.id}</p> </xml>';
        var _data = {
          val : 1,
          sub : { id : 3 }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <p>3</p> </xml>');
          _xml = '<xml> {d.val:ifEQ(1):hi<p>deBegin}joe{d.val:hideEnd}{d.sub.id}</p> </xml>';
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <p>3</p> </xml>');
            done();
          });
        });
      });
      it('condition should remove surrounded XML even if there are multiple conditions', function (done) {
        var _xml = '<xml> {d.sub.id:ifEQ(0):showBegin}{d.val:ifEQ(0):showBegin}<p>joe{d.val:showEnd}{d.sub.id:showEnd}</p> </xml>';
        var _data = {
          val : 1,
          sub : { id : 3 }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>  </xml>');
          _data.val = 0;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>  </xml>');
            _data.sub.id = 0;
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<xml> <p>joe</p> </xml>');
              done();
            });
          });
        });
      });
      it('should remove surrounded XML even if there are multiple conditions (hideBegin/hideEnd)', function (done) {
        var _xml = '<xml> {d.sub.id:ifEQ(0):hideBegin}{d.val:ifEQ(0):hideBegin}<p>joe{d.val:hideEnd}{d.sub.id:hideEnd}</p> </xml>';
        var _data = {
          val : 0,
          sub : { id : 0 }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>  </xml>');
          _data.val = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>  </xml>');
            _data.sub.id = 1;
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<xml> <p>joe</p> </xml>');
              _data.sub.id = 0;
              _xml = '<xml> {d.sub.id:ifEQ(0):hideBegin}{d.val:ifEQ(0):hideBegin}<p>joe{d.val:hideEnd}{d.sub.id:hideEnd}{d.val}</p> </xml>';
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<xml> <p>1</p> </xml>');
                done();
              });
            });
          });
        });
      });
      it('should accepts conditions around array. Markers are moved by the process, markers are next to each over', function (done) {
        var _xml = '<body><p>a{d.fruits:ifNEM():showBegin}</p><g>{d.fruits[i].name}</g><g>{d.fruits[i+1].name}</g><p>{d.fruits:showEnd}a</p></body>';
        var _data = {
          fruits : []
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><p>a</p><p>a</p></body>');
          done();
        });
      });
      it('should accepts conditions around array. It should remove surrounded XML is possible (no characters before/after condition begin/end)', function (done) {
        var _xml = '<body><p>{d.fruits:ifNEM():showBegin}</p><g>{d.fruits[i].name}</g><g>{d.fruits[i+1].name}</g><p>{d.fruits:showEnd}</p></body>';
        var _data = {
          fruits : []
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body></body>');
          _xml = '<body><p>a{d.fruits:ifNEM():showBegin}</p><g>{d.fruits[i].name}</g><g>{d.fruits[i+1].name}</g><p>{d.fruits:showEnd}</p></body>';
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><p>a</p></body>');
            _xml = '<body><p>{d.fruits:ifNEM():showBegin}</p><g>{d.fruits[i].name}</g><g>{d.fruits[i+1].name}</g><p>{d.fruits:showEnd}b</p></body>';
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<body><p>b</p></body>');
              done();
            });
          });
        });
      });
      it('should accepts multiple conditions next to arrays markers', function (done) {
        var _xml = '<body><a>{d.isShown:ifEQ(true):showBegin}</a>{d.isMegaShown:ifEQ(true):showBegin}{d.isShown:ifNE(false):showBegin}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:showEnd}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i+1].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:ifNE(false):showBegin}{d.isShown:showEnd}{d.isMegaShown:showEnd}'
                  +'<n>{d.isShown:showEnd}</n></body>';
        var _data = {
          isShown     : true,
          isMegaShown : true,
          fruits      : [{name : 'apple'}]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><a></a><p>apple</p><n></n></body>');
          _data.isMegaShown = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><a></a><n></n></body>');
            done();
          });
        });
      });
      it('should accepts multiple conditions next to arrays markers even if these arrays are flatten', function (done) {
        var _xml = '<body><a>a{d.isShown:ifEQ(true):showBegin}</a>{d.isMegaShown:ifEQ(true):showBegin}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i].name}{d.fruits[i].vitamins[i].name}{d.fruits:showEnd}</p>'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i+1].name}{d.fruits[i+1].vitamins[i+1].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:ifNE(false):showBegin}{d.isShown:showEnd}{d.isMegaShown:showEnd}'
                  +'<n>{d.isShown:showEnd}a</n></body>';
        var _data = {
          isShown     : true,
          isMegaShown : true,
          fruits      : [
            {name : 'apple' , vitamins : [{name : 'B5'}, {name : 'B6'}]},
            {name : 'orange', vitamins : [{name : 'C5'}, {name : 'C6'}]}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><a>a</a><p>appleB5</p><p>appleB6</p><p>orangeC5</p><p>orangeC6</p><n>a</n></body>');
          _data.isMegaShown = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><a>a</a><n>a</n></body>');
            done();
          });
        });
      });
      it('should accepts multiple conditions next to arrays markers even if these arrays are flatten and remove surrounded XML if possible', function (done) {
        var _xml = '<body><a>{d.isShown:ifEQ(true):showBegin}</a>{d.isMegaShown:ifEQ(true):showBegin}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i].name}{d.fruits[i].vitamins[i].name}{d.fruits:showEnd}</p>'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i+1].name}{d.fruits[i+1].vitamins[i+1].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:ifNE(false):showBegin}{d.isShown:showEnd}{d.isMegaShown:showEnd}'
                  +'<n>{d.isShown:showEnd}</n></body>';
        var _data = {
          isShown     : true,
          isMegaShown : true,
          fruits      : [
            {name : 'apple' , vitamins : [{name : 'B5'}, {name : 'B6'}]},
            {name : 'orange', vitamins : [{name : 'C5'}, {name : 'C6'}]}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><a></a><p>appleB5</p><p>appleB6</p><p>orangeC5</p><p>orangeC6</p><n></n></body>');
          _data.isMegaShown = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><a></a><n></n></body>');
            _data.isMegaShown = true;
            _data.isShown = false;
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<body></body>');
              done();
            });
          });
        });
      });
      it.skip('should we accept nested if-block in a loop??', function (done) {
        var _xml = '<body><a>a{d.isShown:ifEQ(true):showBegin}</a>{d.isMegaShown:ifEQ(true):showBegin}{d.isShown:ifNE(false):showBegin}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i].name}{d.fruits[i].vitamins[i].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:showEnd}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i+1].name}{d.fruits[i+1].vitamins[i+1].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:ifNE(false):showBegin}{d.isShown:showEnd}{d.isMegaShown:showEnd}'
                  +'<n>{d.isShown:showEnd}a</n></body>';
        var _data = {
          isShown     : true,
          isMegaShown : true,
          fruits      : [
            {name : 'apple' , vitamins : [{name : 'B5'}, {name : 'B6'}]},
            {name : 'orange', vitamins : [{name : 'C5'}, {name : 'C6'}]}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><a></a><p>appleB5</p><p>appleB6</p><p>orangeC5</p><p>orangeC6</p><n></n></body>');
          _data.isMegaShown = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><a>a</a><n>a</n></body>');
            done();
          });
        });
      });
      it('should accepts multiple conditions next to arrays markers even if these arrays are flatten (inverse array order)', function (done) {
        var _xml = '<body><a>{d.isShown:ifEQ(true):showBegin}</a>{d.isMegaShown:ifEQ(true):showBegin}'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i].vitamins[i].name}{d.fruits[i].name}{d.fruits:showEnd}</p>'
                  +'<p>{d.fruits:ifNEM():showBegin}{d.fruits[i+1].vitamins[i+1].name}{d.fruits[i+1].name}{d.fruits:showEnd}</p>'
                  +'{d.isShown:ifNE(false):showBegin}{d.isShown:showEnd}{d.isMegaShown:showEnd}'
                  +'<n>{d.isShown:showEnd}</n></body>';
        var _data = {
          isShown     : true,
          isMegaShown : true,
          fruits      : [
            {name : 'apple' , vitamins : [{name : 'B5'}, {name : 'B6'}]},
            {name : 'orange', vitamins : [{name : 'C5'}, {name : 'C6'}]}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><a></a><p>B5apple</p><p>B6apple</p><p>C5orange</p><p>C6orange</p><n></n></body>');
          _data.isMegaShown = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<body><a></a><n></n></body>');
            done();
          });
        });
      });
      it('should accept conditions next to nested condition markers', function (done) {
        var _xml = '<body><p>{d.fruits[i].name}</p>{d.fruits:ifNEM():showBegin}hey{d.fruits:showEnd}<p>{d.fruits[i+1].name}</p></body>';
        var _data = {
          fruits : [{
            name : 'apple'
          }]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<body><p>apple</p>hey</body>');
          done();
        });
      });
      it('should return an error if begin or end is missing', function (done) {
        carbone.renderXML('<xml> {d.val:ifEQ(3):hideBegin} </xml>', {}, function (err) {
          assert.equal(err+'', 'Error: Missing at least one showEnd or hideEnd');
          carbone.renderXML('<xml> {d.val:ifEQ(3):showBegin} </xml>', {}, function (err) {
            assert.equal(err+'', 'Error: Missing at least one showEnd or hideEnd');
            carbone.renderXML('<xml> {d.val:ifEQ(3):showEnd} </xml>', {}, function (err) {
              assert.equal(err+'', 'Error: Missing at least one showBegin or hideBegin');
              carbone.renderXML('<xml> {d.val:ifEQ(3):hideEnd} </xml>', {}, function (err) {
                assert.equal(err+'', 'Error: Missing at least one showBegin or hideBegin');
                done();
              });
            });
          });
        });
      });
      it('should accept conditional block with complex conditions', function (done) {
        var _xml = '<xml> {d.val:ifEQ(3):and(.other):ifGTE(10):showBegin}<a></a>{d.val:showEnd} </xml>';
        carbone.renderXML(_xml, { val : 3, other : 10 }, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <a></a> </xml>');
          carbone.renderXML(_xml, { val : 3, other : 11 }, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <a></a> </xml>');
            carbone.renderXML(_xml, { val : 3, other : 9 }, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<xml>  </xml>');
              carbone.renderXML(_xml, { val : 4, other : 10 }, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<xml>  </xml>');
                done();
              });
            });
          });
        });
      });
      it('should accept conditional block with complex conditions hideBegin/hideEnd', function (done) {
        var _xml = '<xml> {d.val:ifEQ(3):and(.other):ifGTE(10):hideBegin}<a></a>{d.val:hideEnd} </xml>';
        carbone.renderXML(_xml, { val : 3, other : 10 }, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>  </xml>');
          carbone.renderXML(_xml, { val : 3, other : 11 }, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>  </xml>');
            carbone.renderXML(_xml, { val : 3, other : 9 }, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<xml> <a></a> </xml>');
              carbone.renderXML(_xml, { val : 4, other : 10 }, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<xml> <a></a> </xml>');
                done();
              });
            });
          });
        });
      });
      it('should accept conditional block with loops', function (done) {
        var _xml = '<xml>{d.who} <b/>{d.isDataHidden:hideBegin()} <tr>{d.who} {d.cars[i].brand} </tr><tr> {d.who} {d.cars[i+1].brand} </tr> <a></a>{d.isDataHidden:hideEnd()} {d.who}</xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo'},
            {brand : 'Tesla motors'},
            {brand : 'Toyota'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>my <b/> my</xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>my <b/> <tr>my Lumeneo </tr><tr>my Tesla motors </tr><tr>my Toyota </tr> <a></a> my</xml>');
            done();
          });
        });
      });
      it('should remove every piece of string without breaking XML, and accept dynamic variables', function (done) {
        var _xml = '<xml><a>x{d.test.other.id:ifEQ(true):and(..isDataHidden):ifEQ(0):showBegin} hey </a> <br/> test <br/><b> whahou {d.test.other.id:ifEQ(true):and(..isDataHidden):ifEQ(0):showEnd}y</b></xml>';
        var _data = {
          test : {
            other : {
              id : true
            },
            isDataHidden : 0
          }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml><a>x hey </a> <br/> test <br/><b> whahou y</b></xml>');
          _data.test.isDataHidden = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml><a>x</a><b>y</b></xml>');
            done();
          });
        });
      });
      it('should remove all surrounded XML if there are no characters before/after conditional begin/end', function (done) {
        var _xml = '<xml><a>{d.test.other.id:ifEQ(true):and(..isDataHidden):ifEQ(0):showBegin} hey </a> <br/> test <br/><b> whahou {d.test.other.id:ifEQ(true):and(..isDataHidden):ifEQ(0):showEnd}</b></xml>';
        var _data = {
          test : {
            other : {
              id : true
            },
            isDataHidden : 0
          }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml><a> hey </a> <br/> test <br/><b> whahou </b></xml>');
          _data.test.isDataHidden = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml></xml>');
            done();
          });
        });
      });
      it('should accept to use other formatters (arrays) with conditional blocks', function (done) {
        var _xml = '<xml>{d.who} <b/>{d.cars:ifEM():hideBegin} <tr>{d.who} {d.cars[i].brand} </tr><tr> {d.who} {d.cars[i+1].brand} </tr> <a></a>{d.isDataHidden:ifEM():hideEnd} {d.who}</xml>';
        var _data = {
          who  : 'my',
          cars : [
            {brand : 'Lumeneo'},
            {brand : 'Tesla motors'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml>my <b/> <tr>my Lumeneo </tr><tr>my Tesla motors </tr> <a></a> my</xml>');
          _data.cars = [];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml>my <b/> my</xml>');
            done();
          });
        });
      });
      it('should accept conditional blocks are not placed correclty in XML and it should work without breaking the XML', function (done) {
        var _xml = '<xml><tr> a {d.isDataHidden:hideBegin()} b </tr> b <tr> d </tr> e {d.isDataHidden:hideEnd()}f</xml>';
        var _data = {
          isDataHidden : true
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml><tr> a </tr>f</xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml><tr> a  b </tr> b <tr> d </tr> e f</xml>');
            done();
          });
        });
      });
      it('should accept conditional message show and elseShow', function (done) {
        var _xml = '<xml> {d.val:ifEQ(3):and(.other):ifGTE(10):show(\'messageIfTrue\'):elseShow(\'messageIfFalse\')} </xml>';
        carbone.renderXML(_xml, { val : 3, other : 10 }, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> messageIfTrue </xml>');
          carbone.renderXML(_xml, { val : 3, other : 11 }, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> messageIfTrue </xml>');
            carbone.renderXML(_xml, { val : 3, other : 9 }, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<xml> messageIfFalse </xml>');
              carbone.renderXML(_xml, { val : 4, other : 10 }, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<xml> messageIfFalse </xml>');
                done();
              });
            });
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block\
        should not break XML even if the if-block is not placed correclty (with showBegin/showEnd)', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>z{d.isDataHidden:ifEQ(false):showBegin}</b> <a>hey1!</a> <b>{d.isDataHidden:showEnd}y</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo'},
            {brand : 'Toyota'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>z</b><b>y</b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>z</b> <a>hey1!</a> <b>y</b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block.\
        it should remove all surrounded XML if there are no characters before/after conditional begin/end', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>{d.isDataHidden:ifEQ(false):showBegin}</b> <a>hey1!</a> <b>{d.isDataHidden:showEnd}</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo'},
            {brand : 'Toyota'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b></b> <a>hey1!</a> <b></b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block\
        it should remove all surrounded XML if there are no characters before/after conditional begin/end', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>s{d.isDataHidden:hideBegin}</b> <a>hey1!</a> <b>{d.isDataHidden:hideEnd}d</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo'},
            {brand : 'Toyota'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>s</b><b>d</b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>s</b> <a>hey1!</a> <b>d</b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block\
        should not break XML even if the if-block is not placed correclty (with hideBegin/hideEnd)', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>{d.isDataHidden:hideBegin}</b> <a>hey1!</a> <b>{d.isDataHidden:hideEnd}</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo'},
            {brand : 'Toyota'}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b></b> <a>hey1!</a> <b></b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block\
        should not break XML even if the if-block is not placed correctly (with hideBegin/hideEnd)', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>z{d.isDataHidden:hideBegin} <br/></b> <li>{d.cars[i].id}</li><li>{d.cars[i+1].id}</li> <a>hey1!</a> <b><br/> {d.isDataHidden:hideEnd}</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo', id : 1},
            {brand : 'Toyota' , id : 2}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>z</b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b>z <br/></b> <li>1</li><li>2</li> <a>hey1!</a> <b><br/> </b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept conditional block with loops just before and after the if-block\
        it should remove all surrounded XML if there are no characters before/after conditional begin/end', function (done) {
        var _xml = '<xml> <table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> <b>{d.isDataHidden:hideBegin} <br/></b> <li>{d.cars[i].id}</li><li>{d.cars[i+1].id}</li> <a>hey1!</a> <b><br/> {d.isDataHidden:hideEnd}</b><table> <tr>{d.cars[i].brand} </tr><tr> {d.cars[i+1].brand} </tr> </table> </xml>';
        var _data = {
          isDataHidden : true,
          who          : 'my',
          cars         : [
            {brand : 'Lumeneo', id : 1},
            {brand : 'Toyota' , id : 2}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
          _data.isDataHidden = false;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml> <table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> <b> <br/></b> <li>1</li><li>2</li> <a>hey1!</a> <b><br/> </b><table> <tr>Lumeneo </tr><tr>Toyota </tr> </table> </xml>');
            done();
          });
        });
      });
      it('should accept complex loop with filters, with markers surrounded by conditional blocks without characters between markers', function (done) {
        var _xml = '<xml> <table>'
                 +   ' <tr>{d.cars[i].brand} '
                 +      '<li>{d.cars[i].wheels[i, size = 300].color:ifEQ(red):showBegin}'
                 +             '{d.cars[i].wheels[i, size = 300].color}'
                 +           '{d.cars[i].wheels[i, size = 300].color:showEnd}'
                 +      '</li>'
                 +      '<li> {d.cars[i].wheels[i+1, size = 300].color:ifEQ(red):showBegin}'
                 +              '{d.cars[i].wheels[i+1, size = 300].color}'
                 +           '{d.cars[i].wheels[i+1, size = 300].color:showEnd}'
                 +      '</li>'
                 +   ' </tr>'
                 +   ' <tr>{d.cars[i+1].brand}</tr>'
                 +   '</table> </xml>';
        var _data = {
          isDataHidden : true,
          cars         : [
            {
              brand  : 'Lumeneo',
              id     : 1,
              wheels : [
                {size : 300, color : 'red'},
                {size : 300, color : 'blue'},
                {size : 400, color : 'black'}
              ]
            },
            {
              brand  : 'Toyota',
              id     : 2,
              wheels : [
                {size : 300, color : 'red'},
                {size : 400, color : 'black'}
              ]
            }
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table>'
           +  ' <tr>Lumeneo '
           +     '<li>'
           +       'red'
           +     '</li>'
           +     '<li>'
           +     '</li>'
           +  ' </tr>'
           +  ' <tr>Toyota '
           +     '<li>'
           +        'red'
           +     '</li>'
           +  ' </tr>'
           +  ' </table> </xml>');
          _data.isDataHidden = false;
          done();
        });
      });
      it('should accept complex loop with filters, with markers surrounded by conditional blocks with characters between markers', function (done) {
        var _xml = '<xml> <table>'
                 +   ' <tr>{d.cars[i].brand} '
                 +      '<li><p>a {d.cars[i].wheels[i, size = 300].color:ifNE(red):showBegin} good</p>'
                 +             'mor'
                 +           '<p>ning {d.cars[i].wheels[i, size = 300].color:showEnd} a</p>'
                 +      '</li>'
                 +      '<li>'
                 +         '{d.cars[i].wheels[i+1, size = 300].color}'
                 +      '</li>'
                 +   ' </tr>'
                 +   ' <tr>{d.cars[i+1].brand}</tr>'
                 +   '</table> </xml>';
        var _data = {
          isDataHidden : true,
          cars         : [
            {
              brand  : 'Lumeneo',
              id     : 1,
              wheels : [
                {size : 300, color : 'red'},
                {size : 300, color : 'blue'},
                {size : 400, color : 'black'}
              ]
            },
            {
              brand  : 'Toyota',
              id     : 2,
              wheels : [
                {size : 300, color : 'red'},
                {size : 400, color : 'black'}
              ]
            }
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml> <table>'
           +  ' <tr>Lumeneo '
           +     '<li>'
           +       '<p>a </p><p> a</p>'
           +     '</li>'
           +     '<li>'
           +       '<p>a  good</p>mor<p>ning  a</p>'
           +     '</li>'
           +  ' </tr>'
           +  ' <tr>Toyota '
           +     '<li>'
           +        '<p>a </p><p> a</p>'
           +     '</li>'
           +  ' </tr>'
           +  ' </table> </xml>');
          _data.isDataHidden = false;
          done();
        });
      });
      it('should be able to show or hide a table with a lot of nested xml tags ', function (done) {
        var _xml = '<xml>{d.cars:ifNEM:showBegin}<table> <tr> <td><p>{d.cars[i].brand}</p></td> </tr>   <tr> <td><p>{d.cars[i+1].brand}</p></td> </tr> </table>{d.variants:showEnd}</xml>';
        var _data = {
          cars : [
            {brand : 'Lumeneo', id : 1},
            {brand : 'Toyota' , id : 2}
          ]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml><table> <tr> <td><p>Lumeneo</p></td> </tr>   <tr> <td><p>Toyota</p></td> </tr>    </table></xml>');
          _data.isDataHidden = false;
          done();
        });
      });
      it('should hide or show some xml part with two consecutive conditional blocks\
        it should accept that markers are spread across multiple XML tags\
        it should accept that the ending conditional marker contain conditional formatters or not', function (done) {
        var _xml = ''
          + '<a> hey </a>'
          + '<b> {d.isShown:ifEQ(<c>1</c>):showBegin}</b>'
          + '<d> textD <e>e</e> </d>'
          + '<f>'
          + '  <g>{d.isShown:ifEQ(</g>'
          + '  <h>1</h>'
          + '  <i>):showEnd}i</i>'
          + '</f>'
          + '<j/>'
          + '<k>k{d.isShown:ifEQ(<l>0</l>):showBegin}</k>'
          + '<m>'
          + '  <n> textN </n>'
          + '</m>'
          + '<o>'
          + '  <p>{d.isShown</p>'
          + '  <q></q>'
          + '  <r>:showEnd}r</r>'
          + '</o>';
        var _data = {
          isShown : 0
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a> hey </a><b> </b><f><i>i</i></f><j/><k>k<l></l></k><m>  <n> textN </n></m><o>  <p></p><q></q><r>r</r></o>');
          _data.isShown = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<a> hey </a><b> <c></c></b><d> textD <e>e</e> </d><f>  <g></g><h></h><i>i</i></f><j/><k>k</k><o><r>r</r></o>');
            done();
          });
        });
      });
      it('should hide surrounded XML if possible. It should take into account the last character of showEnd (with or without parenthesis)', function (done) {
        var _xml = ''
          + '<a> hey </a>'
          + '<b>{d.isShown:ifEQ(<c>1</c>):showBegin}</b>'
          + '<d> textD <e>e</e> </d>'
          + '<f>'
          + '  <g>{d.isShown:ifEQ(</g>'
          + '  <h>1</h>'
          + '  <i>):showEnd ( ) }</i>'
          + '</f>'
          + '<j/>'
          + '<k>{d.isShown:ifEQ(<l>0</l>):showBegin}</k>'
          + '<m>'
          + '  <n> textN </n>'
          + '</m>'
          + '<o>'
          + '  <p>{d.isShown</p>'
          + '  <q></q>'
          + '  <r>:showEnd}</r>'
          + '</o>';
        var _data = {
          isShown : 0
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a> hey </a><j/><k><l></l></k><m>  <n> textN </n></m><o>  <p></p><q></q><r></r></o>');
          _data.isShown = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<a> hey </a><b><c></c></b><d> textD <e>e</e> </d><f>  <g></g><h></h><i></i></f><j/>');
            done();
          });
        });
      });
      it('should hide surrounded XML if possible using hideBegin/hideEnd. It should take into account the last character of showEnd (with or without parenthesis)', function (done) {
        var _xml = ''
          + '<a> hey </a>'
          + '<b>{d.isShown:ifEQ(<c>0</c>):hideBegin}</b>'
          + '<d> textD <e>e</e> </d>'
          + '<f>'
          + '  <g>{d.isShown:ifEQ(</g>'
          + '  <h>1</h>'
          + '  <i>):hideEnd ( ) }</i>'
          + '</f>'
          + '<j/>'
          + '<k>{d.isShown:ifEQ(<l>1</l>):hideBegin}</k>'
          + '<m>'
          + '  <n> textN </n>'
          + '</m>'
          + '<o>'
          + '  <p>{d.isShown</p>'
          + '  <q></q>'
          + '  <r>:hideEnd}</r>'
          + '</o>';
        var _data = {
          isShown : 0
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a> hey </a><j/><k><l></l></k><m>  <n> textN </n></m><o>  <p></p><q></q><r></r></o>');
          _data.isShown = 1;
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<a> hey </a><b><c></c></b><d> textD <e>e</e> </d><f>  <g></g><h></h><i></i></f><j/>');
            done();
          });
        });
      });
      it('should remove every possible parts in XML and accept complex conditions', function (done) {
        var _xml = ''
          + '<a>'
          + '  <b>b{d.test.isShown:ifEQ(</b>'
          + '  <c>1</c>'
          + '  <d>):</d>'
          + '  <e>and(.text):ifEQ(</e>'
          + '  <f>aaa</f>'
          + '  <g>)</g>'
          + '  <h>:showBegin}</h>'
          + '</a>'
          + '<i>Z</i>'
          + '<j>'
          + '  <k>{d.test.isShown:show</k>'
          + '  <l>End</l>'
          + '  <m>}m</m>'
          + '</j>';
        var _data = {
          test : {
            isShown : 1,
            text    : 'aa'
          }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a>  <b>b</b></a><j><m>m</m></j>');
          _data.test.text = 'aaa';
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<a>  <b>b</b><c></c><d></d><e></e><f></f><g></g><h></h></a><i>Z</i><j>  <k></k><l></l><m>m</m></j>');
            done();
          });
        });
      });
      it('should remove surrounded XML part if possible and accept complex conditions', function (done) {
        var _xml = ''
          + '<xml>'
          + '<a>'
          +   '<b>{d.test.isShown:ifEQ(</b>'
          + '  <c>1</c>'
          + '  <d>):</d>'
          + '  <e>and(.text):ifEQ(</e>'
          + '  <f>aaa</f>'
          + '  <g>)</g>'
          + '  <h>:showBegin}</h>'
          + '</a>'
          + '<i>Z</i>'
          + '<j>'
          + '  <k>{d.test.isShown:show</k>'
          + '  <l>End</l>'
          + '  <m>}</m>'
          + '</j>'
          + '</xml>';
        var _data = {
          test : {
            isShown : 1,
            text    : 'aa'
          }
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml></xml>');
          _data.test.text = 'aaa';
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<xml><a><b></b><c></c><d></d><e></e><f></f><g></g><h></h></a><i>Z</i><j>  <k></k><l></l><m></m></j></xml>');
            done();
          });
        });
      });
      it('should hide XML part if values are undefined', function (done) {
        var _xml = ''
          + '<a>'
          + '  <b>x{d.test.isShown:ifEQ(1):and(.text):ifEQ(aaa):showBegin}</b>'
          + '</a>'
          + '<i>Z</i>'
          + '<j>'
          + '  <k>{d.test.isShown:showEnd}m</k>'
          + '</j>';
        var _data = {};
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a>  <b>x</b></a><j><k>m</k></j>');
          done();
        });
      });
      it('should hide XML part if values are undefined and remove surrounded XML if possible', function (done) {
        var _xml = ''
          + '<a>'
          + 'z<b>{d.test.isShown:ifEQ(1):and(.text):ifEQ(aaa):showBegin}</b>'
          + '</a>'
          + '<i>Z</i>'
          + '<j>'
          + '  <k>{d.test.isShown:showEnd}</k>'
          + '</j>';
        var _data = {};
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<a>z</a>');
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
    it('should render a template and return a path instead of a buffer if renderPrefix is defined', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var opt = {
        renderPrefix : 'prefix-'
      };
      carbone.render('test_word_render_A.docx', data, opt, function (err, resultFilePath, reportName) {
        assert.equal(err, null);
        var _filename = path.basename(resultFilePath);
        assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
        assert.strictEqual(reportName, undefined);
        assert.strictEqual(/prefix-[A-Za-z0-9-_]{22}cmVwb3J0\.docx/.test(_filename), true);
        fs.unlinkSync(resultFilePath);
        done();
      });
    });
    it('should return a path instead of a buffer if renderPrefix is defined with reportName\
      it should encode reportName to write POSIX compatible filename\
      decodeRenderedFilename can be used to decode the filename', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var opt = {
        renderPrefix : 'aa',
        reportName   : '报道yéà?e|ah/../{d.field1}(")\''
      };
      carbone.render('test_word_render_A.docx', data, opt, function (err, resultFilePath, reportName) {
        assert.equal(err, null);
        var _filename = path.basename(resultFilePath);
        assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
        assert.strictEqual(reportName, '报道yéà?e|ah/../field_1(")\'');
        assert.strictEqual(/^[a-z0-9-_]+\.docx$/i.test(_filename), true);
        var _onlyReportName = _filename.slice(2+22, -5);
        assert.strictEqual(helper.decodeSafeFilename(_onlyReportName), '报道yéà?e|ah/../field_1(")\'');
        helper.assert(carbone.decodeRenderedFilename(resultFilePath, 2), {
          reportName : '报道yéà?e|ah/../field_1(")\'',
          extension  : 'docx'
        });
        fs.unlinkSync(resultFilePath);
        done();
      });
    });
    it('should accept only alphanumeric characters in renderPrefix', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var opt = {
        renderPrefix : '报道yéà?e|ah/../{d.field1}(")'
      };
      carbone.render('test_word_render_A.docx', data, opt, function (err, resultFilePath) {
        assert.equal(err, null);
        var _filename = path.basename(resultFilePath);
        assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
        var _onlyReportName = _filename.slice(11+22, -5);
        assert.strictEqual(helper.decodeSafeFilename(_onlyReportName), 'report');
        assert.strictEqual(/yeahdfield1[A-Za-z0-9-_]{22}cmVwb3J0\.docx/.test(_filename), true);
        fs.unlinkSync(resultFilePath);
        done();
      });
    });
    it('should render a template and return a path instead of a buffer (with conversion).\
      it should trim and lower case convertTo extension', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      var opt = {
        renderPrefix : 'prefix',
        reportName   : '{d.field1}test',
        convertTo    : ' PDF  '
      };
      carbone.render('test_word_render_A.docx', data, opt, function (err, resultFilePath) {
        assert.equal(err, null);
        assert.strictEqual(path.dirname(resultFilePath), params.renderPath);
        var _filename = path.basename(resultFilePath);
        var _onlyReportName = _filename.slice(opt.renderPrefix.length + 22, -4);
        assert.strictEqual(helper.decodeSafeFilename(_onlyReportName), 'field_1test');
        assert.strictEqual(/prefix[A-Za-z0-9-_]{22}ZmllbGRfMXRlc3Q\.pdf/.test(_filename), true);
        fs.unlinkSync(resultFilePath);
        done();
      });
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
      // eslint-disable-next-line no-unused-vars
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
          assert.equal(Buffer.isBuffer(_results[i]), true);
          assert.equal((_results[i].slice(0, 2).toString() === 'PK'), true);
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
        helper.assert(err+'', 'null');
        assert.equal(result.indexOf('field1'), -1);
        assert.equal(result.indexOf('field2'), -1);
        assert.notEqual(result.indexOf('field_1'), -1);
        assert.notEqual(result.indexOf('field_2'), -1);
        done();
      });
    });
    it('should return an error if hardRefresh is set to true on unknown files for LibreOffice', function (done) {
      var data = {
        field1 : 'field_1',
        field2 : 'field_2'
      };
      carbone.render('test_word_render_2003_XML.xml', data, { hardRefresh : true }, function (err, result) {
        helper.assert(err+'', 'Format "xml" can\'t be converted to "xml".');
        assert.equal(result, null);
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
          helper.assert(_xmlExpectedContent.indexOf( ''
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de sirop d’érable 25cl</t></is></c><c  t="inlineStr"><is><t>4</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de cidre de glace 1L</t></is></c><c  t="inlineStr"><is><t>2</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Sachet de Cranberry 200g</t></is></c><c  t="inlineStr"><is><t>3</t></is></c></row>'
          ), 682);
          done();
        });
      });
    });
    it('should accept XLSX files with the extension given in options (needs preprocessing)', function (done) {
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
      carbone.render('test_xlsx_list', _data, { extension : 'xlsx' }, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _document = path.join(testPath, 'file.xlsx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['xl/worksheets/sheet1.xml'];
          helper.assert(_xmlExpectedContent.indexOf( ''
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de sirop d’érable 25cl</t></is></c><c  t="inlineStr"><is><t>4</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de cidre de glace 1L</t></is></c><c  t="inlineStr"><is><t>2</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Sachet de Cranberry 200g</t></is></c><c  t="inlineStr"><is><t>3</t></is></c></row>'
          ), 682);
          done();
        });
      });
    });
    it('should force extension to XLSX even if the file extension is another', function (done) {
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
      carbone.render('test_xlsx_list.docx', _data, { extension : 'xlsx' }, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755', 8));
        var _document = path.join(testPath, 'file.xlsx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['xl/worksheets/sheet1.xml'];
          helper.assert(_xmlExpectedContent.indexOf( ''
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de sirop d’érable 25cl</t></is></c><c  t="inlineStr"><is><t>4</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Bouteille de cidre de glace 1L</t></is></c><c  t="inlineStr"><is><t>2</t></is></c></row>'
            +'<row   x14ac:dyDescent="0.2"><c  t="inlineStr"><is><t>Sachet de Cranberry 200g</t></is></c><c  t="inlineStr"><is><t>3</t></is></c></row>'
          ), 682);
          done();
        });
      });
    });
    it.skip('should parse embedded documents (should be ok but not perfect)');
    it.skip('should re-generate r=1, c=A1 in Excel documents');
    it.skip('should not remove empty cells in XLSX files (needs pre-processing to add empty cells)');

    it('should render a template (docx) and update the table of content by using libre office (hardRefresh set to true)', function (done) {
      var options = {
        convertTo   : 'docx',
        hardRefresh : true
      };
      carbone.render('test_docx_refresh_table_of_content.docx', {}, options, function (err, result) {
        assert.equal(err, null);
        fs.mkdirSync(testPath, parseInt('0755',8));
        var _document = path.join(testPath, 'file.docx');
        var _unzipPath = path.join(testPath, 'unzip');
        fs.writeFileSync(_document, result);
        unzipSystem(_document, _unzipPath, function (err, files) {
          var _xmlExpectedContent = files['word/document.xml'];
          // Previous table of content
          assert.equal(_xmlExpectedContent.indexOf('Main title'), -1);
          assert.equal(_xmlExpectedContent.indexOf('subtitle1'), -1);
          assert.equal(_xmlExpectedContent.indexOf('This is a text1'), -1);
          // New table of content
          assert.notEqual(_xmlExpectedContent.indexOf('subtitle2'), -1);
          assert.notEqual(_xmlExpectedContent.indexOf('This is a text2'), -1);
          done();
        });
      });
    });
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

    it('should return error by converting a template ODS to BMP (non compatible files types)', (done) => {
      var data = [{ id : 1, name : 'field_1' }, { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName : 'bmp'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(typeof err, 'string');
        helper.assert(/can't be converted to "bmp"*/.test(err), true);
        helper.assert(result, undefined);
        done();
      });
    });

    it('should accept txt files as template', (done) => {
      var data = [{ id : 1, name : 'field_1' }, { id : 2, name : 'field_2' }];
      carbone.render('template_txt.txt', data, function (err, result) {
        helper.assert(err+'', 'null');
        helper.assert(result, '1 field_1 2 field_2 ');
        done();
      });
    });

    it('should return error by converting a template ODS to text10 (non compatible files types)', (done) => {
      var data = [{ id : 1, name : 'field_1' }, { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName : 'text10'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(typeof err, 'string');
        helper.assert(/can't be converted to "text10"*/.test(err), true);
        helper.assert(result, undefined);
        done();
      });
    });

    it('should return error by converting a template ODS to PGM (non compatible files types)', (done) => {
      var data = [{ id : 1, name : 'field_1' }, { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName : 'pgm'
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(typeof err, 'string');
        helper.assert(/can't be converted to "pgm"*/.test(err), true);
        helper.assert(result, undefined);
        done();
      });
    });

    it('should render a template (docx), generate to PDF and give output', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2',
      };
      carbone.render('test_word_render_A.docx', data, {convertTo : 'pdf'}, function (err, result) {
        assert.equal(err, null);
        assert.equal(result.slice(0, 4).toString(), '%PDF');
        fs.readFile(_pdfResultPath, function (err, expected) {
          assert.equal(err+'', 'null');
          assert.equal(result.slice(0, 4).toString(), '%PDF');
          assert.equal(result.slice(8, 50).toString(), expected.slice(8, 50).toString());
          done();
        });
      });
    });
    it('should render a template (docx), generate to PDF and give a path instead of a buffer if renderPrefix is defined', function (done) {
      var _pdfExpectedPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : 'field_1',
        field2 : 'field_2',
      };
      carbone.render('test_word_render_A.docx', data, {convertTo : 'pdf', renderPrefix : ''}, function (err, resultPath) {
        assert.equal(err, null);
        assert.equal(resultPath.endsWith('.pdf'), true);
        fs.readFile(_pdfExpectedPath, function (err, expected) {
          fs.readFile(resultPath, function (err, result) {
            assert.equal(err+'', 'null');
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            assert.equal(result.slice(8, 50).toString(), expected.slice(8, 50).toString());
            fs.unlinkSync(resultPath);
            done();
          });
        });
      });
    });
    it('should not crash if datas contain XML-incompatible control code', function (done) {
      // eslint-disable-next-line no-unused-vars
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      var data = {
        field1 : '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u000b\u000c\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f',
        field2 : 'field_2'
      };
      carbone.render(path.resolve('./test/datasets/test_word_render_A.docx'), data, {convertTo : 'pdf'}, function (err, result) {
        assert.equal(err, null);
        assert.equal(result.slice(0, 4).toString(), '%PDF');
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
        var _start = process.hrtime();
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
          var _diff = process.hrtime(_start);
          var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6) / _nbExecuted;
          console.log('\n\n Conversion to PDF Time Elapsed : '+_elapsed + ' ms per pdf for '+_nbExecuted+' conversions (usally around 65ms) \n\n\n');
          for (var i = 0; i < _results.length; i++) {
            assert.equal(Buffer.isBuffer(_results[i]), true);
            assert.equal(_results[i].slice(0, 4).toString(), '%PDF');
          }
          // assert.equal((_elapsed < 200), true);
          done();
        }
      });
    });
  });

  describe('convert', function () {
    var _templatePath = path.join(__dirname, 'datasets');
    var defaultOptions = {
      pipeNamePrefix : '_carbone',
      factories      : 1,
      startFactory   : false,
      attempts       : 1
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
    it('should convert a document', function (done) {
      var _pdfResultPath = path.resolve('./test/datasets/test_word_render_A.pdf');
      fs.readFile(path.join(_templatePath, 'test_word_render_A.docx'), function (err, buffer) {
        helper.assert(err+'', 'null');
        carbone.convert(buffer, {convertTo : 'pdf', extension : 'docx'}, function (err, result) {
          assert.equal(err, null);
          assert.equal(result.slice(0, 4).toString(), '%PDF');
          fs.readFile(_pdfResultPath, function (err, expected) {
            assert.equal(err+'', 'null');
            assert.equal(result.slice(0, 4).toString(), '%PDF');
            assert.equal(result.slice(8, 50).toString(), expected.slice(8, 50).toString());
            done();
          });
        });
      });
    });
    it('should return an error if the input extension is not passed', function (done) {
      fs.readFile(path.join(_templatePath, 'test_word_render_A.docx'), function (err, buffer) {
        helper.assert(err+'', 'null');
        carbone.convert(buffer, {convertTo : 'pdf'}, function (err) {
          assert.equal(err, 'options.extension must be set to detect input file type');
          done();
        });
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
        helper.assert(/can't be converted to "ods_ede"*/.test(err), true);
        done();
      });
    });
    it('should render spreadsheet with only a different fieldSeparator', function (done) {
      var data = [{ id : 1, name : 'field_1' },
        { id : 2, name : 'field_2' }];
      var _options = {
        convertTo : {
          formatName    : 'csv',
          formatOptions : {
            fieldSeparator : '|'
          },
        }
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = '||\n|1|field_1\n|2|field_2\n';
        helper.assert(result.toString(), _expected);
        done();
      });
    });
    it('should not crash if formatName is passed without formatOptions', function (done) {
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
    it('should by default render with options 44,34,0 for csv', function (done) {
      var data = [{ id : 1, name : 'field_1' },
        { id : 2, name : 'référence' }];
      var _options = {
        convertTo : 'csv'
      };
      carbone.render('test_spreadsheet.ods', data, _options, function (err, result) {
        helper.assert(err, null);
        var _expected = ',,\n,1,field_1\n,2,référence\n';
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
