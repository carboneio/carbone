const assert = require('assert');
const fs = require('fs');
const builder = require('../lib/builder');
const helper = require('../lib/helper');
const parser = require('../lib/parser');
const chartFormatter = require('../formatters/chart');
const helperTest = require('./helper');
const carbone   = require('../lib/index');

// datasets
const echartThemeWalden         = require('./datasets/chart/echartThemeWalden.js');
const echartCalendar            = require('./datasets/chart/echartCalendar.js');
const echartCalendarSVGen       = fs.readFileSync('test/datasets/chart/echartCalendarEn.svg', 'utf8');
const echartLine                = require('./datasets/chart/echartLine.js');
const echartLineNoColor         = require('./datasets/chart/echartLineNoColor.js');
const echartLineSVG             = fs.readFileSync('test/datasets/chart/echartLine.svg', 'utf8');
const echartLineSVGDefaultColor = fs.readFileSync('test/datasets/chart/echartLineDefaultColor.svg', 'utf8');
const echartLineSVGWaldenColor  = fs.readFileSync('test/datasets/chart/echartLineWaldenColor.svg', 'utf8');

describe('chart', function () {

  describe('generateChartImage', function () {
    it('should generate SVG', function (done) {
      const _data = {
        type   : 'echarts@v5',
        width  : 600,
        height : 400,
        option : echartCalendar
      };
      chartFormatter.generateChartImage(_data, {}, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assert(res.extension, 'svg');
        helperTest.assert(res.data.toString(), echartCalendarSVGen);
        done();
      });
    });
    it('should be able to modify the theme of the SVG', function (done) {
      const _data = {
        type   : 'echarts@v5',
        width  : 600,
        height : 400,
        option : echartLineNoColor
      };
      chartFormatter.generateChartImage(_data, {}, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assert(res.extension, 'svg');
        helperTest.assert(res.data.toString(), echartLineSVGDefaultColor);
        _data.theme = echartThemeWalden;
        chartFormatter.generateChartImage(_data, {}, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assert(res.extension, 'svg');
          helperTest.assert(res.data.toString(), echartLineSVGWaldenColor);
          done();
        });
      });
    });
  });

  describe('[Full test] ODT with ECharts', function () {
    it('should generate SVG with ECharts, even without type', function (done) {
      const _data = {
        chart1 : {
          option : echartLine
        }
      };
      const _testedReport = 'chart/odt-echarts-simple';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should not crash chart1 is undefined or charts is defined but not option, and show default image of Carbone', function (done) {
      const _data = {};
      const _testedReport = 'chart/odt-echarts-simple-data-err';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        carbone.render(helperTest.openTemplate(_testedReport), { chart1 : {} }, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });
    });
    it('should generate SVG with ECharts, using locale of Carbone, and fallback to english if locale is unknown', function (done) {
      const _data = {
        chart1 : { type : 'echarts@v5', width : 600, height : 400, option : echartCalendar }
      };
      const _testedReport = 'chart/odt-echarts-simple-lang-fr';
      const _testedReportPT = 'chart/odt-echarts-simple-lang-pt-br';
      const _testedReportEN = 'chart/odt-echarts-simple-lang-en';
      carbone.render(helperTest.openTemplate(_testedReport), _data, { lang : 'fr-FR' }, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        carbone.render(helperTest.openTemplate(_testedReport), _data, { lang : 'fr' }, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          carbone.render(helperTest.openTemplate(_testedReportPT), _data, { lang : 'pt-br' }, (err, res) => {
            helperTest.assert(err+'', 'null');
            helperTest.assertFullReport(res, _testedReportPT);
            carbone.render(helperTest.openTemplate(_testedReport), _data, { lang : 'zz' }, (err, res) => {
              helperTest.assert(err+'', 'null');
              helperTest.assertFullReport(res, _testedReportEN);
              done();
            });
          });
        });
      });
    });
    it.skip('should return an error if chart type is provided but not supported', function (done) {
      const _data = { type : 'echarts@4', width : 600, height : 400, option : echartLine };
      const _testedReport = 'chart/odt-echarts-simple';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'Chart type not supported');
        done();
      });
    });
  });


});



