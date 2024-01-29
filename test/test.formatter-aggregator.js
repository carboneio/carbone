const assert  = require('assert');
const carbone = require('../lib/index');
const helper  = require('../lib/helper');

// sum total qty = 21
const dataSimpleLoop = {
  cars : [
    { brand : 'Lu' , qty : 1  , sort : 1, weirdQty : '1'       , negQty : '-1.5'        },
    { brand : 'Fa' , qty : 4  , sort : 4, weirdQty : null      , negQty : null          },
    { brand : 'Vi' , qty : 3  , sort : 3, weirdQty : undefined , negQty : undefined     },
    { brand : 'Fa' , qty : 2  , sort : 2, weirdQty : '2'       , negQty : '-2.5'        },
    { brand : 'To' , qty : 1  , sort : 1, weirdQty : '1'       , negQty : '-1.2'        },
    { brand : 'Vi' , qty : 10 , sort : 5, weirdQty : '10'      , negQty : '-10.5'       }
  ]
};


describe('Aggregatted operations', function () {
  describe('NO LOOP', function () {
    describe('d.cars[]:aggSum global aggregation without loops', function () {
      it('should do a global aggregation', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum'  , '<xml> 21 </xml>'],
          [ 'aggAvg'  , '<xml> 3.5 </xml>'],
          [ 'aggMin'  , '<xml> 1 </xml>'],
          [ 'aggMax'  , '<xml> 10 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>'],
          [ 'aggStr'  , '<xml> 1, 4, 3, 2, 1, 10 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should convert strings to integer and ignore null or undefined values', function (done) {
        const _xml = '<xml> {d.cars[].weirdQty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum'  , '<xml> 14 </xml>'],
          [ 'aggAvg'  , '<xml> 2.3333333333333335 </xml>'],
          [ 'aggMin'  , '<xml> 1 </xml>'],
          [ 'aggMax'  , '<xml> 10 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>'],
          [ 'aggStr'  , '<xml> 1, 2, 1, 10 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should convert strings to float and ignore null or undefined values (max should not return 0 if null/undefined values)', function (done) {
        const _xml = '<xml> {d.cars[].negQty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum'  , '<xml> -15.7 </xml>'],
          [ 'aggAvg'  , '<xml> -2.6166666666666667 </xml>'],
          [ 'aggMin'  , '<xml> -10.5 </xml>'],
          [ 'aggMax'  , '<xml> -1.2 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>'],
          [ 'aggStr'  , '<xml> -1.5, -2.5, -1.2, -10.5 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept empty parenthesis, and whitespaces', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum()'    , '<xml> 21 </xml>'],
          [ ' aggAvg() '  , '<xml> 3.5 </xml>'],
          [ '  aggMin() ' , '<xml> 1 </xml>'],
          [ ' aggMax() '  , '<xml> 10 </xml>'],
          [ ' aggCount()' , '<xml> 6 </xml>'],
          [ 'aggStr()'    , '<xml> 1, 4, 3, 2, 1, 10 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__:formatC} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 21.00 € </xml>'],
          [ 'aggAvg'   , '<xml> 3.50 € </xml>'],
          [ 'aggMin'   , '<xml> 1.00 € </xml>'],
          [ 'aggMax'   , '<xml> 10.00 € </xml>'],
          [ 'aggCount', '<xml> 6.00 € </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters (aggStr)', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__:append(yes)} </xml>';
        let _expected = [
          [ 'aggStr' , '<xml> 1, 4, 3, 2, 1, 10yes </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if formatters', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> greater </xml>'],
          [ 'aggAvg'   , '<xml> lower </xml>'],
          [ 'aggMin'   , '<xml> lower </xml>'],
          [ 'aggMax'   , '<xml> greater </xml>'],
          [ 'aggCount', '<xml> greater </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters', function (done) {
        const _xml = '<xml> <b>{d.cars[].qty:__TESTED_FORMATTER__:ifGT(4):showBegin} greater {d.cars[].qty:showEnd}</b> </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggAvg'   , '<xml> <b></b> </xml>'],
          [ 'aggMin'   , '<xml> <b></b> </xml>'],
          [ 'aggMax'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggCount', '<xml> <b> greater </b> </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml>{d.cars[].qty:__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[].qty:__TESTED_FORMATTER__} {d.cars[].qty:showEnd}</xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 21 </xml>'],
          [ 'aggAvg'   , '<xml></xml>'],
          [ 'aggMin'   , '<xml></xml>'],
          [ 'aggMax'   , '<xml> 10 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });

    describe('ERROR - global aggregation without loops with ', function () {
      it.skip('should do a global aggregation', function (done) {
        const _xml = '<xml> {d.cars[].qty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum:add(2):aggAvg'             , 'Error: Cannot use multiple aggregator formatters "aggAvg" and "aggSum()" in the same marker'],
          [ 'aggAvg:add(2):aggSum:formatN'     , 'Error: Cannot use multiple aggregator formatters "aggSum" and "aggAvg()" in the same marker'],
          [ ' aggMin (): add(1) : aggMax  ()'  , 'Error: Cannot use multiple aggregator formatters "aggMax" and "aggMin()" in the same marker'],
          [ '  aggMax:aggCount  '             , 'Error: Cannot use multiple aggregator formatters "aggCount" and "aggMax()" in the same marker'],
          [ ' add(1) : aggCount: aggSum'      , 'Error: Cannot use multiple aggregator formatters "aggSum" and "aggCount()" in the same marker']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done, true);
      });
    });

    describe('d.cars[sort>1]:aggSum - global aggregation without loops but with filters in []', function () {
      it('should do a global aggregation', function (done) {
        const _xml = '<xml> {d.cars[sort>1].qty:__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 19 </xml>'],
          [ 'aggAvg'   , '<xml> 4.75 </xml>'],
          [ 'aggMin'   , '<xml> 2 </xml>'],
          [ 'aggMax'   , '<xml> 10 </xml>'],
          [ 'aggCount' , '<xml> 4 </xml>'],
          [ 'aggStr'   , '<xml> 4, 3, 2, 10 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters', function (done) {
        const _xml = '<xml> {d.cars[sort>1].qty:__TESTED_FORMATTER__:formatC} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 19.00 € </xml>'],
          [ 'aggAvg'   , '<xml> 4.75 € </xml>'],
          [ 'aggMin'   , '<xml> 2.00 € </xml>'],
          [ 'aggMax'   , '<xml> 10.00 € </xml>'],
          [ 'aggCount', '<xml> 4.00 € </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters after (aggStr)', function (done) {
        const _xml = '<xml> {d.cars[sort>1].qty:__TESTED_FORMATTER__:append(yes)} </xml>';
        let _expected = [
          [ 'aggStr' , '<xml> 4, 3, 2, 10yes </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if formatters', function (done) {
        const _xml = '<xml> {d.cars[sort>1].qty:__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> greater </xml>'],
          [ 'aggAvg'   , '<xml> greater </xml>'],
          [ 'aggMin'   , '<xml> lower </xml>'],
          [ 'aggMax'   , '<xml> greater </xml>'],
          [ 'aggCount', '<xml> lower </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters', function (done) {
        const _xml = '<xml> <b>{d.cars[sort>1].qty:__TESTED_FORMATTER__:ifGT(4):showBegin} greater {d.cars[sort>1].qty:showEnd}</b> </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggAvg'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggMin'   , '<xml> <b></b> </xml>'],
          [ 'aggMax'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggCount', '<xml> <b></b> </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml>{d.cars[sort>1].qty:__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[sort>1].qty:__TESTED_FORMATTER__} {d.cars[sort>1].qty:showEnd}</xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 19 </xml>'],
          [ 'aggAvg'   , '<xml> 4.75 </xml>'],
          [ 'aggMin'   , '<xml></xml>'],
          [ 'aggMax'   , '<xml> 10 </xml>'],
          [ 'aggCount', '<xml></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });

    describe('d.cars[].qty:mul(.sort):aggSum - global aggregation without loops and formatter before the aggregator like a multiplicator', function () {
      it('should do a global aggregation', function (done) {
        const _xml = '<xml> {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 81 </xml>'],
          [ 'aggAvg'   , '<xml> 13.5 </xml>'],
          [ 'aggMin'   , '<xml> 1 </xml>'],
          [ 'aggMax'   , '<xml> 50 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters before (aggStr, with filter)', function (done) {
        const _xml = '<xml> {d.cars[sort>1].qty:append(a):prepend(b):__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggStr' , '<xml> b4a, b3a, b2a, b10a </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept empty parenthesis, and whitespaces', function (done) {
        const _xml = '<xml> {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__} </xml>';
        let _expected = [
          [ 'aggSum()'    , '<xml> 81 </xml>'],
          [ ' aggAvg() '  , '<xml> 13.5 </xml>'],
          [ '  aggMin() ' , '<xml> 1 </xml>'],
          [ ' aggMax() '  , '<xml> 50 </xml>'],
          [ ' aggCount()', '<xml> 6 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters', function (done) {
        const _xml = '<xml> {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:formatC} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 81.00 € </xml>'],
          [ 'aggAvg'   , '<xml> 13.50 € </xml>'],
          [ 'aggMin'   , '<xml> 1.00 € </xml>'],
          [ 'aggMax'   , '<xml> 50.00 € </xml>'],
          [ 'aggCount', '<xml> 6.00 € </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if formatters', function (done) {
        const _xml = '<xml> {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> greater </xml>'],
          [ 'aggAvg'   , '<xml> greater </xml>'],
          [ 'aggMin'   , '<xml> lower </xml>'],
          [ 'aggMax'   , '<xml> greater </xml>'],
          [ 'aggCount', '<xml> greater </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters', function (done) {
        const _xml = '<xml> <b>{d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin} greater {d.cars[].qty:showEnd}</b> </xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggAvg'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggMin'   , '<xml> <b></b> </xml>'],
          [ 'aggMax'   , '<xml> <b> greater </b> </xml>'],
          [ 'aggCount', '<xml> <b> greater </b> </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml>{d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__} {d.cars[].qty:mul(.sort):showEnd}</xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 81 </xml>'],
          [ 'aggAvg'   , '<xml> 13.5 </xml>'],
          [ 'aggMin'   , '<xml></xml>'],
          [ 'aggMax'   , '<xml> 50 </xml>'],
          [ 'aggCount', '<xml> 6 </xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });

    describe('d.cars[id>1].wheels[size=1].makers[].qty:aggSum - global aggregation without loops but with filters in [] in multiple nested arrays', function () {
      const dataDeepDepth = {
        cars : [
          {
            id     : 1,
            wheels : [{
              n      : 'A',
              size   : 100,
              makers : [{ qty : 1 }, { qty : 2 }]
            }]
          },
          {
            id     : 2,
            wheels : [{
              n      : 'B',
              size   : 100,
              makers : [{ qty : 10 }, { qty : 20 }]
            }]
          },
          {
            id     : 1,
            wheels : [{
              n      : 'C',
              size   : 200,
              makers : [{ qty : 300}, { qty : 400 }]
            }]
          },
          {
            id     : 1,
            wheels : [{
              n      : 'D',
              size   : 100,
              makers : [{ qty : 5000 }, { qty : 6000 }]
            }]
          },
        ]
      };
      it('should do a global aggregation', function (done) {
        const _xml = '<xml> {d.cars[id=1].wheels[size=100].makers[].qty:__TESTED_FORMATTER__} {d.cars[id=1].wheels[size=100].n} {d.cars[id=1].wheels[size=100].makers[qty>1].qty}</xml>';
        let _expected = [
          [ 'aggSum'   , '<xml> 11003 A 2</xml>'],
          [ 'aggAvg'   , '<xml> 2750.75 A 2</xml>'],
          [ 'aggMin'   , '<xml> 1 A 2</xml>'],
          [ 'aggMax'   , '<xml> 6000 A 2</xml>'],
          [ 'aggCount' , '<xml> 4 A 2</xml>'],
          [ 'aggStr'   , '<xml> 1, 2, 5000, 6000 A 2</xml>']
        ];
        executeTest(_xml, dataDeepDepth, _expected, done);
      });
    });
  });

  describe('WITH SIMPLE LOOP', function () {

    describe('[AGG] [CUM] d.cars[].qty:aggSum - simple global aggregation within a simple loop, with a sort', function () {
      it('[AGG] should do a global aggregation in a loop, sorted by sort', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:__TESTED_FORMATTER__} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu 21 </tr><tr> To 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu 3.5 </tr><tr> To 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu 1 </tr><tr> To 1 </tr><tr> Fa 1 </tr><tr> Vi 1 </tr><tr> Fa 1 </tr><tr> Vi 1 </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu 10 </tr><tr> To 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu 6 </tr><tr> To 6 </tr><tr> Fa 6 </tr><tr> Vi 6 </tr><tr> Fa 6 </tr><tr> Vi 6 </tr></xml>'],
          [ 'aggStr'   , '<xml><tr> Lu 1, 4, 3, 2, 1, 10 </tr><tr> To 1, 4, 3, 2, 1, 10 </tr><tr> Fa 1, 4, 3, 2, 1, 10 </tr><tr> Vi 1, 4, 3, 2, 1, 10 </tr><tr> Fa 1, 4, 3, 2, 1, 10 </tr><tr> Vi 1, 4, 3, 2, 1, 10 </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[CUM] should do a running aggregation in a loop, sorted by sort', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:__TESTED_FORMATTER__} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu 1 </tr><tr> To 2 </tr><tr> Fa 4 </tr><tr> Vi 7 </tr><tr> Fa 11 </tr><tr> Vi 21 </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu 1 </tr><tr> To 1 </tr><tr> Fa 1.3333333333333333 </tr><tr> Vi 1.75 </tr><tr> Fa 2.2 </tr><tr> Vi 3.5 </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu 1 </tr><tr> To 2 </tr><tr> Fa 3 </tr><tr> Vi 4 </tr><tr> Fa 5 </tr><tr> Vi 6 </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });

      it('[AGG] should accept formatters before and after aggregator', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:formatC} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu 81.00 € </tr><tr> To 81.00 € </tr><tr> Fa 81.00 € </tr><tr> Vi 81.00 € </tr><tr> Fa 81.00 € </tr><tr> Vi 81.00 € </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu 13.50 € </tr><tr> To 13.50 € </tr><tr> Fa 13.50 € </tr><tr> Vi 13.50 € </tr><tr> Fa 13.50 € </tr><tr> Vi 13.50 € </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu 1.00 € </tr><tr> To 1.00 € </tr><tr> Fa 1.00 € </tr><tr> Vi 1.00 € </tr><tr> Fa 1.00 € </tr><tr> Vi 1.00 € </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu 50.00 € </tr><tr> To 50.00 € </tr><tr> Fa 50.00 € </tr><tr> Vi 50.00 € </tr><tr> Fa 50.00 € </tr><tr> Vi 50.00 € </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu 6.00 € </tr><tr> To 6.00 € </tr><tr> Fa 6.00 € </tr><tr> Vi 6.00 € </tr><tr> Fa 6.00 € </tr><tr> Vi 6.00 € </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[AGG] should accept formatters before and after aggregator (aggStr)', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:append(a):__TESTED_FORMATTER__:prepend(b)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggStr'   , '<xml><tr> Lu b1a, 4a, 3a, 2a, 1a, 10a </tr><tr> To b1a, 4a, 3a, 2a, 1a, 10a </tr><tr> Fa b1a, 4a, 3a, 2a, 1a, 10a </tr><tr> Vi b1a, 4a, 3a, 2a, 1a, 10a </tr><tr> Fa b1a, 4a, 3a, 2a, 1a, 10a </tr><tr> Vi b1a, 4a, 3a, 2a, 1a, 10a </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[CUM] should accept formatters before and after aggregator', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:mul(.sort):__TESTED_FORMATTER__:formatC} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu 1.00 € </tr><tr> To 2.00 € </tr><tr> Fa 6.00 € </tr><tr> Vi 15.00 € </tr><tr> Fa 31.00 € </tr><tr> Vi 81.00 € </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu 1.00 € </tr><tr> To 1.00 € </tr><tr> Fa 2.00 € </tr><tr> Vi 3.75 € </tr><tr> Fa 6.20 € </tr><tr> Vi 13.50 € </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu 1.00 € </tr><tr> To 2.00 € </tr><tr> Fa 3.00 € </tr><tr> Vi 4.00 € </tr><tr> Fa 5.00 € </tr><tr> Vi 6.00 € </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });

      it('[AGG] should accept if formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa lower </tr><tr> Vi lower </tr><tr> Fa lower </tr><tr> Vi lower </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[CUM] should accept if formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa lower </tr><tr> Vi lower </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa lower </tr><tr> Vi lower </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });

      it('[AGG] should accept if BLOCK formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin}greater {d.cars[].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[CUM] should accept if BLOCK formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin}greater {d.cars[sort,i].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });

      it('[AGG] should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[].qty:mul(.sort):__TESTED_FORMATTER__} {d.cars[].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu  81 </tr><tr> To  81 </tr><tr> Fa  81 </tr><tr> Vi  81 </tr><tr> Fa  81 </tr><tr> Vi  81 </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu  13.5 </tr><tr> To  13.5 </tr><tr> Fa  13.5 </tr><tr> Vi  13.5 </tr><tr> Fa  13.5 </tr><tr> Vi  13.5 </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu  50 </tr><tr> To  50 </tr><tr> Fa  50 </tr><tr> Vi  50 </tr><tr> Fa  50 </tr><tr> Vi  50 </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu  6 </tr><tr> To  6 </tr><tr> Fa  6 </tr><tr> Vi  6 </tr><tr> Fa  6 </tr><tr> Vi  6 </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('[CUM] should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[sort,i].qty:mul(.sort):__TESTED_FORMATTER__} {d.cars[sort,i].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa  6 </tr><tr> Vi  15 </tr><tr> Fa  31 </tr><tr> Vi  81 </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa  6.2 </tr><tr> Vi  13.5 </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa  5 </tr><tr> Vi  6 </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });
    describe('d.cars[sort>1].qty:aggSum - simple global aggregation within a simple loop, with a sort and a filter!', function () {
      it('should do a global aggregation in a loop, sorted by sort', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:__TESTED_FORMATTER__} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu 19 </tr><tr> To 19 </tr><tr> Fa 19 </tr><tr> Vi 19 </tr><tr> Fa 19 </tr><tr> Vi 19 </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu 4.75 </tr><tr> To 4.75 </tr><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu 2 </tr><tr> To 2 </tr><tr> Fa 2 </tr><tr> Vi 2 </tr><tr> Fa 2 </tr><tr> Vi 2 </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu 10 </tr><tr> To 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu 4 </tr><tr> To 4 </tr><tr> Fa 4 </tr><tr> Vi 4 </tr><tr> Fa 4 </tr><tr> Vi 4 </tr></xml>'],
          [ 'aggStr'   , '<xml><tr> Lu 4, 3, 2, 10 </tr><tr> To 4, 3, 2, 10 </tr><tr> Fa 4, 3, 2, 10 </tr><tr> Vi 4, 3, 2, 10 </tr><tr> Fa 4, 3, 2, 10 </tr><tr> Vi 4, 3, 2, 10 </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it.skip('[CUM] should do a global aggregation in a loop, sorted by sort', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:__TESTED_FORMATTER__} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'cumSum'   , '<xml><tr> Lu 19 </tr><tr> To 19 </tr><tr> Fa 19 </tr><tr> Vi 19 </tr><tr> Fa 19 </tr><tr> Vi 19 </tr></xml>'],
          [ 'cumAvg'   , '<xml><tr> Lu 4.75 </tr><tr> To 4.75 </tr><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr><tr> Fa 4.75 </tr><tr> Vi 4.75 </tr></xml>'],
          [ 'cumCount' , '<xml><tr> Lu 4 </tr><tr> To 4 </tr><tr> Fa 4 </tr><tr> Vi 4 </tr><tr> Fa 4 </tr><tr> Vi 4 </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters before and after aggregator', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:mul(.sort):__TESTED_FORMATTER__:formatC} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu 79.00 € </tr><tr> To 79.00 € </tr><tr> Fa 79.00 € </tr><tr> Vi 79.00 € </tr><tr> Fa 79.00 € </tr><tr> Vi 79.00 € </tr></xml>'],
          // (4*4 + 3*3 + 2*2 + 10*5)/4
          [ 'aggAvg'   , '<xml><tr> Lu 19.75 € </tr><tr> To 19.75 € </tr><tr> Fa 19.75 € </tr><tr> Vi 19.75 € </tr><tr> Fa 19.75 € </tr><tr> Vi 19.75 € </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu 4.00 € </tr><tr> To 4.00 € </tr><tr> Fa 4.00 € </tr><tr> Vi 4.00 € </tr><tr> Fa 4.00 € </tr><tr> Vi 4.00 € </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu 50.00 € </tr><tr> To 50.00 € </tr><tr> Fa 50.00 € </tr><tr> Vi 50.00 € </tr><tr> Fa 50.00 € </tr><tr> Vi 50.00 € </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu 4.00 € </tr><tr> To 4.00 € </tr><tr> Fa 4.00 € </tr><tr> Vi 4.00 € </tr><tr> Fa 4.00 € </tr><tr> Vi 4.00 € </tr></xml>'],
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept formatters before and after aggregator (aggStr)', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:prepend(a):__TESTED_FORMATTER__:append(b)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggStr'   , '<xml><tr> Lu a4, a3, a2, a10b </tr><tr> To a4, a3, a2, a10b </tr><tr> Fa a4, a3, a2, a10b </tr><tr> Vi a4, a3, a2, a10b </tr><tr> Fa a4, a3, a2, a10b </tr><tr> Vi a4, a3, a2, a10b </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa lower </tr><tr> Vi lower </tr><tr> Fa lower </tr><tr> Vi lower </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu lower </tr><tr> To lower </tr><tr> Fa lower </tr><tr> Vi lower </tr><tr> Fa lower </tr><tr> Vi lower </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin}greater {d.cars[sort>1].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu greater </tr><tr> To greater </tr><tr> Fa greater </tr><tr> Vi greater </tr><tr> Fa greater </tr><tr> Vi greater </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
      it('should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort>1].qty:mul(.sort):__TESTED_FORMATTER__:ifGT(4):showBegin} {d.cars[sort>1].qty:mul(.sort):__TESTED_FORMATTER__} {d.cars[sort>1].qty:showEnd}</tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu  79 </tr><tr> To  79 </tr><tr> Fa  79 </tr><tr> Vi  79 </tr><tr> Fa  79 </tr><tr> Vi  79 </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu  19.75 </tr><tr> To  19.75 </tr><tr> Fa  19.75 </tr><tr> Vi  19.75 </tr><tr> Fa  19.75 </tr><tr> Vi  19.75 </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu  50 </tr><tr> To  50 </tr><tr> Fa  50 </tr><tr> Vi  50 </tr><tr> Fa  50 </tr><tr> Vi  50 </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu </tr><tr> To </tr><tr> Fa </tr><tr> Vi </tr><tr> Fa </tr><tr> Vi </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });
    describe('d.cars[i].qty:aggSum - aggregation formatters used wihout empty brackets []. By default, it equals a global sum', function () {
      it('should do nothing if the formatter is used without aggregated data', function (done) {
        const _xml = '<xml><tr> {d.cars[sort,i].brand} {d.cars[sort,i].qty:__TESTED_FORMATTER__} </tr><tr> {d.cars[sort+1,i+1].brand} </tr></xml>';
        let _expected = [
          [ 'aggSum'   , '<xml><tr> Lu 21 </tr><tr> To 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr><tr> Fa 21 </tr><tr> Vi 21 </tr></xml>'],
          [ 'aggAvg'   , '<xml><tr> Lu 3.5 </tr><tr> To 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr><tr> Fa 3.5 </tr><tr> Vi 3.5 </tr></xml>'],
          [ 'aggMin'   , '<xml><tr> Lu 1 </tr><tr> To 1 </tr><tr> Fa 1 </tr><tr> Vi 1 </tr><tr> Fa 1 </tr><tr> Vi 1 </tr></xml>'],
          [ 'aggMax'   , '<xml><tr> Lu 10 </tr><tr> To 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr><tr> Fa 10 </tr><tr> Vi 10 </tr></xml>'],
          [ 'aggCount' , '<xml><tr> Lu 6 </tr><tr> To 6 </tr><tr> Fa 6 </tr><tr> Vi 6 </tr><tr> Fa 6 </tr><tr> Vi 6 </tr></xml>'],
          [ 'aggStr'   , '<xml><tr> Lu 1, 4, 3, 2, 1, 10 </tr><tr> To 1, 4, 3, 2, 1, 10 </tr><tr> Fa 1, 4, 3, 2, 1, 10 </tr><tr> Vi 1, 4, 3, 2, 1, 10 </tr><tr> Fa 1, 4, 3, 2, 1, 10 </tr><tr> Vi 1, 4, 3, 2, 1, 10 </tr></xml>']
        ];
        executeTest(_xml, dataSimpleLoop, _expected, done);
      });
    });
  });
  describe('THREE LOOP', function () {
    const dataThreeLoops = {
      companies : [
        {
          name     : 'CARBONE',
          size     : 2,
          sort     : 3,
          services : [
            { name : 'IT'    , people : [ {salary : 10}, {salary : 20}                ]}, // 30
            { name : 'Sales' , people : [ {salary : 5 }, {salary : 2 }, {salary : 7}  ]}  // 14
          ]
        },
        {
          name     : 'ENOBRAC',
          size     : 3,
          sort     : 2,
          services : [
            { name : 'IT'        , people : [ {salary : 2} , {salary : 8}                ]}, // 10
            { name : 'Marketing' , people : [ {salary : 1} , {salary : 3}, {salary : 6}  ]}, // 10
            { name : 'Sales'     , people : [ {salary : 3}                               ]}  // 3
          ]
        },
        {
          name     : 'OTHER',
          size     : 2,
          sort     : 1,
          services : [
            { name : 'IT', people : [ {salary : 1} ]}, // 1
          ]
        }
      ]
    };
    describe('d.companies[i].services[i].people[].salary:aggSum and d.companies[i].services[i].people[i].salary:aggSum - aggregation with complex loop, and default "partition by"', function () {
      it('[AGG] should do aggregation', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'  , '<x><r>7 <d>_IT=30</d><d>_Sales=14</d></r>  <r>7 <d>_IT=10</d><d>_Marketing=10</d><d>_Sales=3</d></r>  <r>7 <d>_IT=1</d></r>  </x>'],
          [ 'aggAvg'  , '<x><r>2.3333333333333335 <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r>2.3333333333333335 <d>_IT=5</d><d>_Marketing=3.3333333333333335</d><d>_Sales=3</d></r>  <r>2.3333333333333335 <d>_IT=1</d></r>  </x>'],
          [ 'aggMin'  , '<x><r>2 <d>_IT=10</d><d>_Sales=2</d></r>  <r>2 <d>_IT=2</d><d>_Marketing=1</d><d>_Sales=3</d></r>  <r>2 <d>_IT=1</d></r>  </x>'],
          [ 'aggMax'  , '<x><r>3 <d>_IT=20</d><d>_Sales=7</d></r>  <r>3 <d>_IT=8</d><d>_Marketing=6</d><d>_Sales=3</d></r>  <r>3 <d>_IT=1</d></r>  </x>'],
          [ 'aggCount', '<x><r>3 <d>_IT=2</d><d>_Sales=3</d></r>  <r>3 <d>_IT=2</d><d>_Marketing=3</d><d>_Sales=1</d></r>  <r>3 <d>_IT=1</d></r>  </x>'],
          [ 'aggStr'  , '<x><r>2, 3, 2 <d>_IT=10, 20</d><d>_Sales=5, 2, 7</d></r>  <r>2, 3, 2 <d>_IT=2, 8</d><d>_Marketing=1, 3, 6</d><d>_Sales=3</d></r>  <r>2, 3, 2 <d>_IT=1</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('[AGG] should do aggregation aggStr with custom paramater', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(-)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(\'+\')}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(-)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggStr'  , '<x><r>2-3-2 <d>_IT=10+20</d><d>_Sales=5+2+7</d></r>  <r>2-3-2 <d>_IT=2+8</d><d>_Marketing=1+3+6</d><d>_Sales=3</d></r>  <r>2-3-2 <d>_IT=1</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      // TODO ne pas accpeter les cumSum sans itérateur .people[] . Il doit y avoir un aggrégateur avant
      it('[CUM] should do cumulative aggregation, without itetaror in people[], it takes the first value', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__}</r>'
          +'</x>';
        let _expected = [
          [ 'cumSum'  , '<x><r>2 <d>_IT=10</d><d>_Sales=15</d></r>  <r>5 <d>_IT=17</d><d>_Marketing=18</d><d>_Sales=21</d></r>  <r>7 <d>_IT=22</d></r>  </x>'],
          // [ 'cumAvg'  , '<x><r>2.3333333333333335 <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r>2.3333333333333335 <d>_IT=5</d><d>_Marketing=3.3333333333333335</d><d>_Sales=3</d></r>  <r>2.3333333333333335 <d>_IT=1</d></r>  </x>'],
          [ 'cumCount', '<x><r>1 <d>_IT=1</d><d>_Sales=2</d></r>  <r>2 <d>_IT=3</d><d>_Marketing=4</d><d>_Sales=5</d></r>  <r>3 <d>_IT=6</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });

      it('should count the total of elements aggregation, without itetaror in 3 lists', function (done) {
        const _xml =
           '<x>'
          +     '<d>{d.companies[].services[].people[].salary:__TESTED_FORMATTER__}</d>'
          +'</x>';
        let _expected = [
          [ 'aggSum'   , '<x><d>68</d></x>' ],
          [ 'aggAvg'   , '<x><d>5.666666666666667</d></x>' ],
          [ 'aggMin'   , '<x><d>1</d></x>' ],
          [ 'aggMax'   , '<x><d>20</d></x>' ],
          [ 'aggCount' , '<x><d>12</d></x>' ],
          [ 'aggStr'   , '<x><d>10, 20, 5, 2, 7, 2, 8, 1, 3, 6, 3, 1</d></x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept filters in the second array only', function (done) {
        const _xml =
           '<x>'
          +     '<d>{d.companies[].services[name=IT].people[].salary:__TESTED_FORMATTER__}</d>'
          +'</x>';
        let _expected = [
          [ 'aggSum'   , '<x><d>41</d></x>' ],
          [ 'aggAvg'   , '<x><d>8.2</d></x>' ],
          [ 'aggMin'   , '<x><d>1</d></x>' ],
          [ 'aggMax'   , '<x><d>20</d></x>' ],
          [ 'aggCount' , '<x><d>5</d></x>' ],
          [ 'aggStr'   , '<x><d>10, 20, 2, 8, 1</d></x>' ],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      // TOOD limit only this known usage
      it('[CUM] should accept to aggregate reduced array [] and to do a cumulative sum in the same time (aggSum:cumSum)', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum:cumSum'  , '<x><r>2 <d>_IT=30</d><d>_Sales=44</d></r>  <r>3 <d>_IT=54</d><d>_Marketing=64</d><d>_Sales=67</d></r>  <r>2 <d>_IT=68</d></r>  </x>'],
          //[ 'aggSum:cumAvg'  , '<x><r>2 <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r>3 <d>_IT=5</d><d>_Marketing=3.3333333333333335</d><d>_Sales=3</d></r>  <r>2 <d>_IT=1</d></r>  </x>'],
          [ 'aggCount:cumSum', '<x><r>2 <d>_IT=2</d><d>_Sales=5</d></r>  <r>3 <d>_IT=7</d><d>_Marketing=10</d><d>_Sales=11</d></r>  <r>2 <d>_IT=12</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });

      it('[AGG] should do aggregation with "partition by" set (same as default one)', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(0)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(.i, ..i)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(0)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'  , '<x><r>7 <d>_IT=30</d><d>_Sales=14</d></r>  <r>7 <d>_IT=10</d><d>_Marketing=10</d><d>_Sales=3</d></r>  <r>7 <d>_IT=1</d></r>  </x>'],
          [ 'aggAvg'  , '<x><r>2.3333333333333335 <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r>2.3333333333333335 <d>_IT=5</d><d>_Marketing=3.3333333333333335</d><d>_Sales=3</d></r>  <r>2.3333333333333335 <d>_IT=1</d></r>  </x>'],
          [ 'aggMin'  , '<x><r>2 <d>_IT=10</d><d>_Sales=2</d></r>  <r>2 <d>_IT=2</d><d>_Marketing=1</d><d>_Sales=3</d></r>  <r>2 <d>_IT=1</d></r>  </x>'],
          [ 'aggMax'  , '<x><r>3 <d>_IT=20</d><d>_Sales=7</d></r>  <r>3 <d>_IT=8</d><d>_Marketing=6</d><d>_Sales=3</d></r>  <r>3 <d>_IT=1</d></r>  </x>'],
          [ 'aggCount', '<x><r>3 <d>_IT=2</d><d>_Sales=3</d></r>  <r>3 <d>_IT=2</d><d>_Marketing=3</d><d>_Sales=1</d></r>  <r>3 <d>_IT=1</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('[AGG] should do aggregation with "partition by" set (same as default one) aggStr', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(\', \', 0)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(\', \', .i, ..i)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(\', \', 0)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggStr'  , '<x><r>2, 3, 2 <d>_IT=10, 20</d><d>_Sales=5, 2, 7</d></r>  <r>2, 3, 2 <d>_IT=2, 8</d><d>_Marketing=1, 3, 6</d><d>_Sales=3</d></r>  <r>2, 3, 2 <d>_IT=1</d></r>  </x>']
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it.skip('[CUM] should do aggregation', function (done) {
        const _xml =
           '<x>'
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(0)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(.i, ..i)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(0)}</r>'
          +'</x>';
        let _expected = [
          [ 'cumSum'  , '<x><r>2 <d>_IT=30</d><d>_Sales=44</d></r>  <r>5 <d>_IT=54</d><d>_Marketing=64</d><d>_Sales=67</d></r>  <r>7 <d>_IT=68</d></r>  </x>'],
          // [ 'cumAvg'  , '<x><r>2.3333333333333335 <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r>2.3333333333333335 <d>_IT=5</d><d>_Marketing=3.3333333333333335</d><d>_Sales=3</d></r>  <r>2.3333333333333335 <d>_IT=1</d></r>  </x>'],
          // [ 'cumCount', '<x><r>3 <d>_IT=2</d><d>_Sales=3</d></r>  <r>3 <d>_IT=2</d><d>_Marketing=3</d><d>_Sales=1</d></r>  <r>3 <d>_IT=1</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });

      it('should not crash if the filter is not defined', function (done) {
        const _xml =
           '<x>  '
          +  '<r><d>{d.companies[i].size}</d></r>'
          +  '<r><d>{d.companies[i+1].size}</d></r>'
          +  '<r><d></d><d>{d.companies[sortqssq>1].size:__TESTED_FORMATTER__}</d></r>'
          +'</x>';
        let _expected = [
          [ 'cumCount', '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>1</d></r></x>'],
          [ 'aggSum'  , '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>0</d></r></x>'],
          [ 'aggAvg'  , '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>0</d></r></x>'],
          [ 'aggMin'  , '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>0</d></r></x>'],
          [ 'aggMax'  , '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>0</d></r></x>'],
          [ 'aggCount', '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d>0</d></r></x>'],
          [ 'aggStr'  , '<x>  <r><d>2</d></r><r><d>3</d></r><r><d>2</d></r><r><d></d><d></d></r></x>']
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });

      it('should accept formatters', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:formatC} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:formatC}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:formatC}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'  , '<x>  <r>7.00 € <d>_IT=30.00 €</d><d>_Sales=14.00 €</d></r>  <r>7.00 € <d>_IT=10.00 €</d><d>_Marketing=10.00 €</d><d>_Sales=3.00 €</d></r>  <r>7.00 € <d>_IT=1.00 €</d></r>  </x>'],
          [ 'aggAvg'  , '<x>  <r>2.33 € <d>_IT=15.00 €</d><d>_Sales=4.67 €</d></r>  <r>2.33 € <d>_IT=5.00 €</d><d>_Marketing=3.33 €</d><d>_Sales=3.00 €</d></r>  <r>2.33 € <d>_IT=1.00 €</d></r>  </x>'],
          [ 'aggMin'  , '<x>  <r>2.00 € <d>_IT=10.00 €</d><d>_Sales=2.00 €</d></r>  <r>2.00 € <d>_IT=2.00 €</d><d>_Marketing=1.00 €</d><d>_Sales=3.00 €</d></r>  <r>2.00 € <d>_IT=1.00 €</d></r>  </x>'],
          [ 'aggMax'  , '<x>  <r>3.00 € <d>_IT=20.00 €</d><d>_Sales=7.00 €</d></r>  <r>3.00 € <d>_IT=8.00 €</d><d>_Marketing=6.00 €</d><d>_Sales=3.00 €</d></r>  <r>3.00 € <d>_IT=1.00 €</d></r>  </x>'],
          [ 'aggCount', '<x>  <r>3.00 € <d>_IT=2.00 €</d><d>_Sales=3.00 €</d></r>  <r>3.00 € <d>_IT=2.00 €</d><d>_Marketing=3.00 €</d><d>_Sales=1.00 €</d></r>  <r>3.00 € <d>_IT=1.00 €</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept formatters (aggStr)', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:append(a)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:append(b)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:append(a)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggStr', '<x>  <r>2, 3, 2a <d>_IT=10, 20b</d><d>_Sales=5, 2, 7b</d></r>  <r>2, 3, 2a <d>_IT=2, 8b</d><d>_Marketing=1, 3, 6b</d><d>_Sales=3b</d></r>  <r>2, 3, 2a <d>_IT=1b</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept parenthesis, whitespaces, and dynamic parameters to formatters', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:formatC(.sort)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:formatC(...sort)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:formatC}</r>'
          +'</x>';
        let _expected = [
          [ ' aggSum()'    , '<x>  <r>7.000 € <d>_IT=30.000 €</d><d>_Sales=14.000 €</d></r>  <r>7.00 € <d>_IT=10.00 €</d><d>_Marketing=10.00 €</d><d>_Sales=3.00 €</d></r>  <r>7.0 € <d>_IT=1.0 €</d></r>  </x>'],
          [ ' aggAvg ( )'  , '<x>  <r>2.333 € <d>_IT=15.000 €</d><d>_Sales=4.667 €</d></r>  <r>2.33 € <d>_IT=5.00 €</d><d>_Marketing=3.33 €</d><d>_Sales=3.00 €</d></r>  <r>2.3 € <d>_IT=1.0 €</d></r>  </x>'],
          [ '  aggMin () ' , '<x>  <r>2.000 € <d>_IT=10.000 €</d><d>_Sales=2.000 €</d></r>  <r>2.00 € <d>_IT=2.00 €</d><d>_Marketing=1.00 €</d><d>_Sales=3.00 €</d></r>  <r>2.0 € <d>_IT=1.0 €</d></r>  </x>'],
          [ ' aggMax() '   , '<x>  <r>3.000 € <d>_IT=20.000 €</d><d>_Sales=7.000 €</d></r>  <r>3.00 € <d>_IT=8.00 €</d><d>_Marketing=6.00 €</d><d>_Sales=3.00 €</d></r>  <r>3.0 € <d>_IT=1.0 €</d></r>  </x>'],
          [ ' aggCount ( )', '<x>  <r>3.000 € <d>_IT=2.000 €</d><d>_Sales=3.000 €</d></r>  <r>3.00 € <d>_IT=2.00 €</d><d>_Marketing=3.00 €</d><d>_Sales=1.00 €</d></r>  <r>3.0 € <d>_IT=1.0 €</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept if formatters', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:ifGT(4):show(greater):elseShow(lower)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:formatC}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'   , '<x>  <r>greater <d>_IT=greater</d><d>_Sales=greater</d></r>  <r>greater <d>_IT=greater</d><d>_Marketing=greater</d><d>_Sales=lower</d></r>  <r>greater <d>_IT=lower</d></r>  </x>'],
          [ 'aggAvg'   , '<x>  <r>lower <d>_IT=greater</d><d>_Sales=greater</d></r>  <r>lower <d>_IT=greater</d><d>_Marketing=lower</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d></r>  </x>'],
          [ 'aggMin'   , '<x>  <r>lower <d>_IT=greater</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d><d>_Marketing=lower</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d></r>  </x>'],
          [ 'aggMax'   , '<x>  <r>lower <d>_IT=greater</d><d>_Sales=greater</d></r>  <r>lower <d>_IT=greater</d><d>_Marketing=greater</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d></r>  </x>'],
          [ 'aggCount' , '<x>  <r>lower <d>_IT=lower</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d><d>_Marketing=lower</d><d>_Sales=lower</d></r>  <r>lower <d>_IT=lower</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept if BLOCK formatters', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:ifGT(4):showBegin}greater{d.companies[i].size:showEnd} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:ifGT(4):showBegin}greater{d.companies[i].services[i].people[].salary:showEnd}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:formatC}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'   , '<x>  <r>greater <d>_IT=greater</d><d>_Sales=greater</d></r>  <r>greater <d>_IT=greater</d><d>_Marketing=greater</d><d>_Sales=</d></r>  <r>greater <d>_IT=</d></r>  </x>'],
          [ 'aggAvg'   , '<x>  <r> <d>_IT=greater</d><d>_Sales=greater</d></r>  <r> <d>_IT=greater</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggMin'   , '<x>  <r> <d>_IT=greater</d><d>_Sales=</d></r>  <r> <d>_IT=</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggMax'   , '<x>  <r> <d>_IT=greater</d><d>_Sales=greater</d></r>  <r> <d>_IT=greater</d><d>_Marketing=greater</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggCount' , '<x>  <r> <d>_IT=</d><d>_Sales=</d></r>  <r> <d>_IT=</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept if BLOCK formatters and showing a total in IF block', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__:ifGT(4):showBegin}{d.companies[i].size:__TESTED_FORMATTER__}{d.companies[i].size:showEnd} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__:ifGT(4):showBegin}{d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__}{d.companies[i].services[i].people[].salary:showEnd}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__:formatC}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'  , '<x>  <r>7 <d>_IT=30</d><d>_Sales=14</d></r>  <r>7 <d>_IT=10</d><d>_Marketing=10</d><d>_Sales=</d></r>  <r>7 <d>_IT=</d></r>  </x>'],
          [ 'aggAvg'  , '<x>  <r> <d>_IT=15</d><d>_Sales=4.666666666666667</d></r>  <r> <d>_IT=5</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggMin'  , '<x>  <r> <d>_IT=10</d><d>_Sales=</d></r>  <r> <d>_IT=</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggMax'  , '<x>  <r> <d>_IT=20</d><d>_Sales=7</d></r>  <r> <d>_IT=8</d><d>_Marketing=6</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
          [ 'aggCount', '<x>  <r> <d>_IT=</d><d>_Sales=</d></r>  <r> <d>_IT=</d><d>_Marketing=</d><d>_Sales=</d></r>  <r> <d>_IT=</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
    });

    describe('d.companies[i].services[i].people[].salary:aggSum and d.companies[i].services[i].people[i].salary:aggSum - CUSTOM partition by', function () {
      it('should do aggregation', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(.size)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(...size)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(.size)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggSum'  , '<x>  <r>4 <d>_IT=45</d><d>_Sales=45</d></r>  <r>3 <d>_IT=23</d><d>_Marketing=23</d><d>_Sales=23</d></r>  <r>4 <d>_IT=45</d></r>  </x>'],
          [ 'aggAvg'  , '<x>  <r>2 <d>_IT=7.5</d><d>_Sales=7.5</d></r>  <r>3 <d>_IT=3.8333333333333335</d><d>_Marketing=3.8333333333333335</d><d>_Sales=3.8333333333333335</d></r>  <r>2 <d>_IT=7.5</d></r>  </x>'],
          [ 'aggMin'  , '<x>  <r>2 <d>_IT=1</d><d>_Sales=1</d></r>  <r>3 <d>_IT=1</d><d>_Marketing=1</d><d>_Sales=1</d></r>  <r>2 <d>_IT=1</d></r>  </x>'],
          [ 'aggMax'  , '<x>  <r>2 <d>_IT=20</d><d>_Sales=20</d></r>  <r>3 <d>_IT=8</d><d>_Marketing=8</d><d>_Sales=8</d></r>  <r>2 <d>_IT=20</d></r>  </x>'],
          [ 'aggCount', '<x>  <r>2 <d>_IT=6</d><d>_Sales=6</d></r>  <r>1 <d>_IT=6</d><d>_Marketing=6</d><d>_Sales=6</d></r>  <r>2 <d>_IT=6</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should do aggregation (aggStr)', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__(\', \', .size)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(\', \', ...size)}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(\', \', .size)}</r>'
          +'</x>';
        let _expected = [
          [ 'aggStr'  , '<x>  <r>2, 2 <d>_IT=1, 5, 2, 7, 10, 20</d><d>_Sales=1, 5, 2, 7, 10, 20</d></r>  <r>3 <d>_IT=3, 1, 3, 6, 2, 8</d><d>_Marketing=3, 1, 3, 6, 2, 8</d><d>_Sales=3, 1, 3, 6, 2, 8</d></r>  <r>2, 2 <d>_IT=1, 5, 2, 7, 10, 20</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
      it('should accept parenthesis, whitespaces, and dynamic parameters to formatters', function (done) {
        const _xml =
           '<x>  '
          +  '<r>{d.companies[i].size:__TESTED_FORMATTER__( .size ) : formatC (.sort)} '
          +     '<d>_{d.companies[i].services[i].name}={d.companies[i].services[i].people[].salary:__TESTED_FORMATTER__(...size):formatC( ...sort )}</d>'
          +     '<d>{d.companies[i].services[i+1].name}</d>'
          +  '</r>  '
          +  '<r>{d.companies[i+1].size:__TESTED_FORMATTER__(.size):formatC}</r>'
          +'</x>';
        let _expected = [
          [ ' aggSum '   , '<x>  <r>4.000 € <d>_IT=45.000 €</d><d>_Sales=45.000 €</d></r>  <r>3.00 € <d>_IT=23.00 €</d><d>_Marketing=23.00 €</d><d>_Sales=23.00 €</d></r>  <r>4.0 € <d>_IT=45.0 €</d></r>  </x>'],
          [ ' aggAvg'    , '<x>  <r>2.000 € <d>_IT=7.500 €</d><d>_Sales=7.500 €</d></r>  <r>3.00 € <d>_IT=3.83 €</d><d>_Marketing=3.83 €</d><d>_Sales=3.83 €</d></r>  <r>2.0 € <d>_IT=7.5 €</d></r>  </x>'],
          [ '  aggMin  ' , '<x>  <r>2.000 € <d>_IT=1.000 €</d><d>_Sales=1.000 €</d></r>  <r>3.00 € <d>_IT=1.00 €</d><d>_Marketing=1.00 €</d><d>_Sales=1.00 €</d></r>  <r>2.0 € <d>_IT=1.0 €</d></r>  </x>'],
          [ ' aggMax  '  , '<x>  <r>2.000 € <d>_IT=20.000 €</d><d>_Sales=20.000 €</d></r>  <r>3.00 € <d>_IT=8.00 €</d><d>_Marketing=8.00 €</d><d>_Sales=8.00 €</d></r>  <r>2.0 € <d>_IT=20.0 €</d></r>  </x>'],
          [ ' aggCount ' , '<x>  <r>2.000 € <d>_IT=6.000 €</d><d>_Sales=6.000 €</d></r>  <r>1.00 € <d>_IT=6.00 €</d><d>_Marketing=6.00 €</d><d>_Sales=6.00 €</d></r>  <r>2.0 € <d>_IT=6.0 €</d></r>  </x>'],
        ];
        executeTest(_xml, dataThreeLoops, _expected, done);
      });
    });

    // TODO test aggregator with repeater?
  });

  describe('Custom tests', function () {
    it('should accept the same filters with different operators', function (done) {
      var _xml = '<xml>{d.table[type=free].text:aggCount} {d.table[type!=free].text:aggCount}</xml>';
      var _data = {
        table : [
          { type : 'free', text : '10' },
          { type : 'free', text : '20' }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>2 0</xml>');
        done();
      });
    });
    it('should count all lines with cumCount', function (done) {
      var _xml = '<xml>'
               + '<tr>{d.table[id].id:cumCount} {d.table[id].sub[i].id}  </tr>'
               + '<tr>{d.table[id].id:cumCount} {d.table[id].sub[i+1].id}</tr>'
               + '<tr>{d.table[id+1].id}                                 </tr>'
               + '</xml>';
      var _data = {
        table : [
          { id : 10, sub : [{ id : 1000}, { id : 2000}, { id : 3000}] },
          { id : 20, sub : [{ id : 4000}, { id : 5000}] }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><tr>1 1000  </tr><tr>2 2000  </tr><tr>3 3000  </tr><tr>4 4000  </tr><tr>5 5000  </tr></xml>');
        done();
      });
    });
    it('should count all distinct id with cumCountD', function (done) {
      var _xml = '<xml>'
               + '<tr>{d.table[id].id:cumCountD} {d.table[id].sub[i].id}  </tr>'
               + '<tr>{d.table[id].id:cumCountD} {d.table[id].sub[i+1].id}</tr>'
               + '<tr>{d.table[id+1].id}                                  </tr>'
               + '</xml>';
      var _data = {
        table : [
          { id : 10, sub : [{ id : 1000}, { id : 2000}, { id : 3000}] },
          { id : 20, sub : [{ id : 4000}, { id : 5000}] }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><tr>1 1000  </tr><tr>1 2000  </tr><tr>1 3000  </tr><tr>2 4000  </tr><tr>2 5000  </tr></xml>');
        done();
      });
    });
    it('should count all distinct id with cumCountD (with all sub items)', function (done) {
      var _xml = '<xml>'
               + '<tr>{d.table[id, i].id:cumCountD} {d.table[id, i].sub[i].id}  </tr>'
               + '<tr>{d.table[id, i].id:cumCountD} {d.table[id, i].sub[i+1].id}</tr>'
               + '<tr>{d.table[id+1, i+1].id}                                  </tr>'
               + '</xml>';
      var _data = {
        table : [
          { id : 10, sub : [{ id : 1000}, { id : 2000}, { id : 3000}] },
          { id : 20, sub : [{ id : 4000}, { id : 5000}] },
          { id : 10, sub : [{ id : 6000}] }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml><tr>1 1000  </tr><tr>1 2000  </tr><tr>1 3000  </tr><tr>1 6000  </tr><tr>2 4000  </tr><tr>2 5000  </tr></xml>');
        done();
      });
    });
    it('should accept array of numbers', function (done) {
      var _xml = '<xml>{d.table[]:aggSum}</xml>';
      var _data = {
        table : [10, 20, 33]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>63</xml>');
        done();
      });
    });
    it('should accept array of numbers (aggStr)', function (done) {
      var _xml = '<xml>{d.table[]:aggStr}</xml>';
      var _data = {
        table : [10, 20, 33]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>10, 20, 33</xml>');
        done();
      });
    });
    it('should accept custom separator for aggStr', function (done) {
      var _xml = '<xml>{d.table[]:aggStr(\'++\')}</xml>';
      var _data = {
        table : [10, 20, 33]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>10++20++33</xml>');
        done();
      });
    });
    it('should accept array of arrays', function (done) {
      var _xml = '<xml>{d.table[][]:aggSum}</xml>';
      var _data = {
        table : [[10, 20, 33], [2]]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>65</xml>');
        done();
      });
    });
    it('should accept the same filters with different operators (all operators tested)', function (done) {
      var _xml = '<xml>{d.table[type=16].text:aggCount} {d.table[type!=16].text:aggCount} {d.table[type>16].text:aggCount} {d.table[type<16].text:aggCount}</xml>';
      var _data = {
        table : [
          { type : 16, text : '160' },
          { type : 16, text : '160' },
          { type : 15, text : '150' },
          { type : 20, text : '200' },
          { type : 21, text : '200' },
          { type : 22, text : '200' }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(_xmlBuilt, '<xml>2 4 3 1</xml>');
        done();
      });
    });
    it('should accept global aggregation marker, and then a loop', function (done) {
      var _xml = '<xml> <a id="{d.cars[].brand:aggCount}"/> <t_row id="{d.cars[i].brand:cumCount}">{d.cars[i].brand}</t_row><t_row>{d.cars[i+1].brand}</t_row></xml>';
      var _data = {
        id   : 3,
        cars : [
          { brand : 'Lumeneo' },
          { brand : 'Tesla motors'},
          { brand : 'Toyota' }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<xml> <a id="3"/> <t_row id="1">Lumeneo</t_row><t_row id="2">Tesla motors</t_row><t_row id="3">Toyota</t_row></xml>');
        done();
      });
    });
    it('should cumCount in the right order, even if cumCount is used on a object', function (done) {
      var _xml = '<xml> <a id="{d.cars[].brand:aggCount}"/> <t_row id="{c.now:cumCount}">{d.cars[sort].brand}</t_row><t_row>{d.cars[sort+1].brand}</t_row></xml>';
      var _data = {
        id   : 3,
        cars : [
          { brand : 'Lumeneo'      , sort : 2 },
          { brand : 'Tesla motors' , sort : 1 },
          { brand : 'Toyota'       , sort : 0 }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<xml> <a id="3"/> <t_row id="1">Toyota</t_row><t_row id="2">Tesla motors</t_row><t_row id="3">Lumeneo</t_row></xml>');
        done();
      });
    });
    it('should count two times, with two independant loops', function (done) {
      var _xml =  '<xml>'
                + '<a id="{d.cars[].brand:aggCount}"/> <r id="{d.cars[i].brand:cumCount}">{d.cars[i].brand}</r><r>{d.cars[i+1].brand}</r>'
                + '<a id="{d.cars[].brand:aggCount}"/> <r id="{d.cars[i].brand:cumCount}">{d.cars[i].brand}</r><r>{d.cars[i+1].brand}</r>'
                + '</xml>';
      var _data = {
        id   : 3,
        cars : [
          { brand : 'Lumeneo' },
          { brand : 'Tesla motors'},
          { brand : 'Toyota' }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<xml>'
                               + '<a id="3"/> <r id="1">Lumeneo</r><r id="2">Tesla motors</r><r id="3">Toyota</r>'
                               + '<a id="3"/> <r id="1">Lumeneo</r><r id="2">Tesla motors</r><r id="3">Toyota</r>'
                               + '</xml>'
        );
        done();
      });
    });
  });
});




function executeTest (xml, data, expected, done, isCheckingErrorOutput = false) {
  const _currentTest = expected.shift();
  if (!_currentTest) {
    return done();
  }
  const _formatterTested = _currentTest[0];
  const _expectedResult = _currentTest[1];
  const _inputXML = xml.replace(/__TESTED_FORMATTER__/g, _formatterTested);
  carbone.renderXML(_inputXML, data, function (err, xmlBuilt) {
    if (isCheckingErrorOutput === true) {
      assert.equal(err+'', _expectedResult, '__TESTED_FORMATTER__ = '+ _formatterTested );
    }
    else {
      helper.assert(err+'', 'null');
      assert.equal(xmlBuilt, _expectedResult, '__TESTED_FORMATTER__ = '+ _formatterTested );
    }
    executeTest(xml, data, expected, done, isCheckingErrorOutput);
  });
}

// TODO faire un test avec double aggéraation sur la même ligne
// cum with array filter et aggrégation