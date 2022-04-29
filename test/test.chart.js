const assert = require('assert');
const fs = require('fs');
const builder = require('../lib/builder');
const helper = require('../lib/helper');
const parser = require('../lib/parser');
const chartFormatter = require('../formatters/chart');
const chartLib = require('../lib/chart');
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

describe.only('chart', function () {

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

  describe('generateRowCountFormatter', function () {
    it('should generate two markers to count rows and do the global sum', function () {
      const _markers = [
        '{d[i].valCol2}',
        '{d[i+1].valCol2}'
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d[i].valCol2:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d[].valCol2:aggCount}');
    });
    it('should remove formatters', function () {
      const _markers = [
        '{d[i].valCol2:formatN:sub(1)}',
        '{d[i+1].valCol2}'
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d[i].valCol2:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d[].valCol2:aggCount}');
    });
    it('should accept multiple iterators and filters', function () {
      const _markers = [
        '{d[i, sort, id.sort>0].valCol2:formatN:sub(1)}',
        '{d[i+1, sort+1, id.sort>0].valCol2}'
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d[i,sort, id.sort>0].valCol2:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d[ id.sort>0].valCol2:aggCount}');
    });
    it.skip('should accept multiple arrays and filters', function () {
      const _markers = [
        '{d.cars[i, sort, id.sort>0].wheels[sort].valCol2:formatN:sub(1)}',
        '{d.cars[i+1, sort+1, id.sort>0].wheels[sort+1].valCol2}'
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d.cars[i,sort, id.sort>0].wheels[sort].valCol2:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d.cars[ id.sort>0].wheels[].valCol2:aggCount}');
    });
    it('should returns an error if markers are not a loop', function () {
      assert.throws(() => {
        chartLib.generateDocxRowCountFormatter(['{d[i].valCol2}', '{d.cars[i+1].valCol2}' ]);
      }, { message : 'Unable to detect loop in charts between markers: {d[i].valCol2}, {d.cars[i+1].valCol2}' });
    });
    it('should accept nested array with same iterators', function () {
      const _markers = [
        '{d.charts[i].data[i].label}',
        '{d.charts[i].data[i+1].label}'
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d.charts[i].data[i].label:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d.charts[i].data[].label:aggCount}');
    });
    it('should accept whitepaces', function () {
      const _markers = [
        '      {d.charts[i].data[i].label}        ',
        '      {d.charts[i].data[i+1].label}      '
      ];
      const _res = chartLib.generateDocxRowCountFormatter(_markers);
      helperTest.assert(_res.rowCount, '{d.charts[i].data[i].label:cumCount:sub(1)}');
      helperTest.assert(_res.totalCount, '{d.charts[i].data[].label:aggCount}');
    });
  });

  describe('parseSpreadSheetRange', function () {
    it('should not crash', function () {
      helperTest.assert(chartLib.parseSpreadSheetRange(), {});
      helperTest.assert(chartLib.parseSpreadSheetRange(null), {});
    });
    it('should extract object from XLSX string', function () {
      helperTest.assert(chartLib.parseSpreadSheetRange('Feuil1!$B$2:$B$3')     , { col : 'B'  , fromRow : 2, toRow : 3 });
      helperTest.assert(chartLib.parseSpreadSheetRange('Feuil1!$AB$20:$AB$30') , { col : 'AB' , fromRow : 20, toRow : 30 });
      helperTest.assert(chartLib.parseSpreadSheetRange('Sheet1!$AB$20:$AB$30') , { col : 'AB' , fromRow : 20, toRow : 30 });
      helperTest.assert(chartLib.parseSpreadSheetRange('Feuil1!$B$2')          , { col : 'B'  , fromRow : 2   });
      helperTest.assert(chartLib.parseSpreadSheetRange('Feuil1!$BCZ$212')      , { col : 'BCZ', fromRow : 212 });
    });
  });

  describe('getValueFromCell', function () {
    it('should not crash', function () {
      helperTest.assert(chartLib.getValueFromCell(), undefined);
      helperTest.assert(chartLib.getValueFromCell(null), undefined);
    });
    it('should extract object from XLSX string', function () {
      const _sheetRange = { col : 'B', fromRow : 2, toRow : 3 };
      const _sheetData = {
        A1 : '{d.a1}',
        A2 : '{d.a2}',
        B1 : '{d.b1}',
        B2 : '{d.b2}',
        B3 : '{d.b3}',
        B4 : '{d.b4}'
      };
      helperTest.assert(chartLib.getValueFromCell(_sheetRange, _sheetData, 0), '{d.b2}');
      helperTest.assert(chartLib.getValueFromCell(_sheetRange, _sheetData, 1), '{d.b3}');
      helperTest.assert(chartLib.getValueFromCell(_sheetRange, _sheetData, 2), '{d.b4}');
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


  describe('[Full test] ODT', function () {
    it('should replace markers in charts', function (done) {
      const _data = [
        { label : 'row1' , valCol1 : 10 , valCol2 : 100.1 },
        { label : 'row2' , valCol1 : 20 , valCol2 : 200.2 },
        { label : 'row3' , valCol1 : 30 , valCol2 : 300.3 }
      ];
      const _testedReport = 'chart/odt-simple';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace markers in charts and loop', function (done) {
      const _data = {
        charts : [
          {
            data : [
              { label : 'row1' , valCol1 : 10 , valCol2 : 100.1 },
              { label : 'row2' , valCol1 : 20 , valCol2 : 200.2 },
              { label : 'row3' , valCol1 : 30 , valCol2 : 300.3 }
            ]
          },
          {
            data : [
              { label : 'chart2_1' , valCol1 : 40 , valCol2 : 400.1 },
              { label : 'chart2_2' , valCol1 : 50 , valCol2 : 500.2 },
              { label : 'chart2_3' , valCol1 : 60 , valCol2 : 600.3 }
            ]
          }
        ]
      };
      const _testedReport = 'chart/odt-loop';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('[Full test] DOCX', function () {
    it('should update a simple chart with rounding issue (4.4000000000000004 instead of 4.4) for bound values', function (done) {
      const _data = [
        { label : 'row1' , valCol1 : 10 , valCol2 : 100.1 },
        { label : 'row2' , valCol1 : 20 , valCol2 : 200.2 },
        { label : 'row3' , valCol1 : 30 , valCol2 : 300.3 }
      ];
      const _testedReport = 'chart/docx-simple-with-bind';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should do loops, and read markers directly from XLSX (without bindChart)', function (done) {
      const _data = {
        charts : [
          {
            data : [
              { label : 'row1' , valCol1 : 10 , valCol2 : 100.1 },
              { label : 'row2' , valCol1 : 20 , valCol2 : 200.2 },
              { label : 'row3' , valCol1 : 30 , valCol2 : 300.3 }
            ]
          },
          {
            data : [
              { label : 'chart2_1' , valCol1 : 40 , valCol2 : 400.1 },
              { label : 'chart2_2' , valCol1 : 50 , valCol2 : 500.2 },
              { label : 'chart2_3' , valCol1 : 60 , valCol2 : 600.3 }
            ]
          }
        ]
      };
      const _testedReport = 'chart/docx-loop';
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('getDocxRelatedFiles', function () {
    it.skip('TODOAA', function () {
      const _testedReport = 'chart/docx-simple-no-bind';
      const _relatedFiles = chartLib.getDocxRelatedFiles(helperTest.openTemplate(_testedReport), 'chart1');
      helperTest.assert(_relatedFiles, 'null');
    });
  });

  describe('finishDocxChart', function () {
    it('add counters', function () {
      const _simplifiedXML = ''
        + '<c:chartSpace>'
        + '  <c:val>'
        + '    <c:numRef> <c:f>Feuil1!$A$2:$A$3</c:f>'
        + '      <c:numCache>'
        + '        <c:formatCode> General </c:formatCode>'
        + '        <c:ptCount val="CARBONE_REPLACE_BY_T"/>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 1 </c:v> </c:pt>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 2 </c:v> </c:pt>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 3 </c:v> </c:pt>'
        + '      </c:numCache>'
        + '    </c:numRef>'
        + '  </c:val>'
        + '  <c:val>'
        + '    <c:numRef> <c:f>Feuil1!$C$2:$C$3</c:f>'
        + '      <c:numCache>'
        + '        <c:formatCode> General </c:formatCode>'
        + '        <c:ptCount val="CARBONE_REPLACE_BY_T"/>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 400.1 </c:v> </c:pt>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 200.1 </c:v> </c:pt>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 100.1 </c:v> </c:pt>'
        + '        <c:pt idx="CARBONE_REPLACE_BY_C"> <c:v> 100.1 </c:v> </c:pt>'
        + '      </c:numCache>'
        + '    </c:numRef>'
        + '  </c:val>'
        + '  <c:externalData r:id="rId3"> <c:autoUpdate val="0"/> </c:externalData>'
        + '</c:chartSpace>';
      const _expectedXML = ''
        + '<c:chartSpace>'
        + '  <c:val>'
        + '    <c:numRef> <c:f>Feuil1!$A$2:$A$3</c:f>'
        + '      <c:numCache>'
        + '        <c:formatCode> General </c:formatCode>'
        + '        <c:ptCount val="3"/>'
        + '        <c:pt idx="0"> <c:v> 1 </c:v> </c:pt>'
        + '        <c:pt idx="1"> <c:v> 2 </c:v> </c:pt>'
        + '        <c:pt idx="2"> <c:v> 3 </c:v> </c:pt>'
        + '      </c:numCache>'
        + '    </c:numRef>'
        + '  </c:val>'
        + '  <c:val>'
        + '    <c:numRef> <c:f>Feuil1!$C$2:$C$3</c:f>'
        + '      <c:numCache>'
        + '        <c:formatCode> General </c:formatCode>'
        + '        <c:ptCount val="4"/>'
        + '        <c:pt idx="0"> <c:v> 400.1 </c:v> </c:pt>'
        + '        <c:pt idx="1"> <c:v> 200.1 </c:v> </c:pt>'
        + '        <c:pt idx="2"> <c:v> 100.1 </c:v> </c:pt>'
        + '        <c:pt idx="3"> <c:v> 100.1 </c:v> </c:pt>'
        + '      </c:numCache>'
        + '    </c:numRef>'
        + '  </c:val>'
        + '  <c:externalData r:id="rId3"> <c:autoUpdate val="0"/> </c:externalData>'
        + '</c:chartSpace>';
      helperTest.assert(chartLib.finishDocxChart(_simplifiedXML), _expectedXML);
    });
  });


  describe('getDocxObjectIdFromRel', function () {
    it('get chart Id from Docx rel', function () {
      const _testedReport = 'chart/docx-simple-with-bind';
      helperTest.assert(chartLib.getDocxObjectIdFromRel(helperTest.openTemplate(_testedReport), 'charts/chart1.xml'), 'rId4');
    });
    it('get object id of another element', function () {
      const _testedReport = 'chart/docx-simple-with-bind';
      helperTest.assert(chartLib.getDocxObjectIdFromRel(helperTest.openTemplate(_testedReport), 'theme/theme1.xml'), 'rId6');
    });
    it('get return an empty string if object is not found', function () {
      const _testedReport = 'chart/docx-simple-with-bind';
      helperTest.assert(chartLib.getDocxObjectIdFromRel(helperTest.openTemplate(_testedReport), 'sdqsdqsd/tqsdheme1.xml'), '');
    });
  });
});