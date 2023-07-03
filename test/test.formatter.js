var dateFormatter = require('../formatters/date');
var conditionFormatter = require('../formatters/condition');
var stringFormatter = require('../formatters/string');
var arrayFormatter = require('../formatters/array');
var numberFormatter = require('../formatters/number');
const barcodeFormatter = require('../formatters/barcode');
var helper = require('../lib/helper');

describe('formatter', function () {
  describe('convDate', function () {
    var _tz = 'Europe/Paris';
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, '20101201', 'YYYYMMDD', 'L'), '12/01/2010');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, '20101201', 'YYYYMMDD', 'L'), '01/12/2010');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, undefined, 'YYYYMMDD', 'L'), undefined);
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, null, 'YYYYMMDD', 'L'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.convDate.call({lang : 'en', timezone : _tz}, 1318781876, 'X', 'LLLL'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, 1318781876, 'X', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
      helper.assert(dateFormatter.convDate.call({lang : 'fr', timezone : _tz}, 1318781876000, 'x', 'LLLL'), 'dimanche 16 octobre 2011 18:17');
    });
  });
  describe('formatD', function () {
    var _tz = 'Europe/Paris';
    it('should accept use this.lang to set convert date', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '20101201', 'L', 'YYYYMMDD'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'L', 'YYYYMMDD'), '01/12/2010');
    });
    it('should return week number', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'W', 'YYYYMMDD'), '48');
    });
    it('should return null or undefined if value is null or undefined', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, undefined, 'L', 'YYYYMMDD'), undefined);
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, null, 'L',  'YYYYMMDD'), null);
    });
    it('should convert unix timestamp', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'Sunday, October 16, 2011 6:17 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'dimanche 16 octobre 2011 18:17');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, 1318781876000, 'LLLL', 'x'), 'dimanche 16 octobre 2011 18:17');
    });
    it('should accept de-de even if de-de does not exists in DaysJS by default (only de)', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'de-de', timezone : _tz}, 1318781876, 'LLLL', 'X'), 'Sonntag, 16. Oktober 2011 18:17');
    });
    it('should consider input format is ISO 8601 by default if not provided', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr', timezone : _tz}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '2017-05-10T15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '2017-05-10 15:57:23.769561+03:00', 'LLLL'), 'Wednesday, May 10, 2017 2:57 PM');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : _tz}, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 4:37 PM');
    });
    it('should not apply timezone if only a date is provided without time', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '2010-12-01', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '20100-12-01', 'L'), '12/01/20100');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '100100-12-01', 'L'), '12/01/100100');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '10-12-01', 'L'), '10/12/2001');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '10-12-01', 'L'), '10/12/2001');
    });
    it('should apply timezone if only a time is provided', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '10-12-01', 'HH-mm-ss', 'HH-mm-ss'), '03-12-01');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '10-12-01Z', 'HH-mm-ss', 'HH-mm-ssZ'), '05-12-01');
      helper.assert(dateFormatter.formatD.call({lang : 'en', timezone : 'america/guayaquil'}, '2010-12-01T01:00:00Z', 'LLL'), 'November 30, 2010 8:00 PM');
    });
    it('should accepts real locales', function () {
      helper.assert(dateFormatter.formatD.call({lang : 'en-gb', timezone : _tz}, '20101201', 'L'), '01/12/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'en'   , timezone : _tz}, '20101201', 'L'), '12/01/2010');
      helper.assert(dateFormatter.formatD.call({lang : 'fr-ca', timezone : _tz}, '20101201', 'L'), '2010-12-01');
      helper.assert(dateFormatter.formatD.call({lang : 'fr'   , timezone : _tz}, '20101201', 'L'), '01/12/2010');
    });
    it('should manage timezone', function () {
      // America/Los_Angeles UTC -08:00 UTS DST -07:00 converted into Europe/Paris UTC +01:00 / UTC DST +02:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Paris' }, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 4:37 PM'
      );
      // America/Los_Angeles UTC -08:00 UTS DST -07:00 converted into America/New_York UTC -05:00 / UTC DST -04:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'America/New_York' }, '1997-12-17 07:37:16-08:00', 'LLLL'), 'Wednesday, December 17, 1997 10:37 AM'
      );
      // Europe/Paris UTC +01:00 / UTC DST +02:00 converted into America/New_York UTC -05:00 UTS DST -04:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'America/New_York' }, '1997-12-17 18:32:16', 'LLLL'), 'Wednesday, December 17, 1997 12:32 PM'
      );
      // Europe/London is UTC+0000, it means the date should not change when it convert into Europe/London
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/London' }, '2021-11-18T08:05+0000', 'LLLL'), 'Thursday, November 18, 2021 8:05 AM'
      );
      // Z ou +0000 c'est la même chose:
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/London' }, '2021-11-18T08:05Z', 'LLLL'), 'Thursday, November 18, 2021 8:05 AM'
      );
      // UTC0 into Europe/Belfast, the timezone is equal to London UTC +00:00 / UTC DST +01:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Belfast' }, '2021-11-18T08:05Z', 'LLLL'), 'Thursday, November 18, 2021 8:05 AM'
      );
      // Europe/London converted into Europe/Amsterdam, Brussel, Berlin, and Paris UTC +01:00 / UTC DST +02:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Amsterdam' }, '2021-11-18T08:05Z', 'LLLL'), 'Thursday, November 18, 2021 9:05 AM'
      );
      // Europe/London converted into Europe/Dublin UTC +01:00 / UTC DST+00:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Brussels' }, '2021-11-18T08:05Z', 'LLLL'), 'Thursday, November 18, 2021 9:05 AM'
      );
      // America/Toronto UTC -05:00 / UTC DST -04:00 converted into En Europe/Berlin UTC +01:00 / UTC DST +02:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Berlin' }, '2013-11-18T11:55-0500', 'LLLL'), 'Monday, November 18, 2013 5:55 PM'
      );
      // Australia/Melbourne UTC +10:00 UTC DST +11:00 converted into Merlbourne time
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Australia/Melbourne' }, '2021-04-01T08:00+1100', 'LLLL'), 'Thursday, April 1, 2021 8:00 AM'
      );
      // Australia/Melbourne UTC +10:00 UTC DST +11:00 converted into Europe/Paris UTC +01:00 / UTC DST +02:00
      helper.assert(dateFormatter.formatD.call(
        { lang : 'en', timezone : 'Europe/Paris' }, '2021-04-01T08:00+1100', 'LLLL'), 'Wednesday, March 31, 2021 11:00 PM'
      );
    });
  });
  describe('formatI', function () {
    it('should transform duration (patternOut), which are by default in milliseconds (patternIn)', function () {
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 'millisecond' ), 2000);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 'milliseconds'), 2000);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 'ms'          ), 2000);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 'second'      ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 'seconds'     ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                   , 's'           ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'minute'      ), 60);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'minutes'     ), 60);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'm'           ), 60);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'hour'        ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'hours'       ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600            , 'h'           ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 365 , 'year'        ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 365 , 'years'       ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 365 , 'y'           ), 1);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 60  , 'month'       ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 60  , 'months'      ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 60  , 'M'           ), 2);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'week'        ), 4);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'weeks'       ), 4);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'w'           ), 4);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'day'         ), 28);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'days'        ), 28);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600 * 24 * 28  , 'd'           ), 28);
    });
    it('should return null if patternOur is unknown ', function () {
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , 0         ), null);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , ''        ), null);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , undefined ), null);
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , null      ), null);
    });
    it('should accept other units for patternIn', function () {
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , 'ms',  'millisecond' ), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , 'ms',  'milliseconds'), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000 , 'ms',  'ms'          ), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  'second'      ), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  'seconds'     ), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  's'           ), 2000                   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 60   , 'ms',  'minute'      ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 60   , 'ms',  'minutes'     ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 60   , 'ms',  'm'           ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'hour'        ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'hours'       ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'h'           ), 1000 * 3600            );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'year'        ), 1000 * 3600 * 24 * 365 );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'years'       ), 1000 * 3600 * 24 * 365 );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1    , 'ms',  'y'           ), 1000 * 3600 * 24 * 365 );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  'month'       ), 1000 * 3600 * 24 * 60  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  'months'      ), 1000 * 3600 * 24 * 60  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2    , 'ms',  'M'           ), 1000 * 3600 * 24 * 60  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 4    , 'ms',  'week'        ), 1000 * 3600 * 24 * 28  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 4    , 'ms',  'weeks'       ), 1000 * 3600 * 24 * 28  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 4    , 'ms',  'w'           ), 1000 * 3600 * 24 * 28  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 28   , 'ms',  'day'         ), 1000 * 3600 * 24 * 28  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 28   , 'ms',  'days'        ), 1000 * 3600 * 24 * 28  );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 28   , 'ms',  'd'           ), 1000 * 3600 * 24 * 28  );
    });
    it('should also accept ISO units for patternIn if not defined, and if the value starts with "P..."', function () {
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 'P1M'            , 'ms'    ), 1000 * 3600 * 24 * 30 );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 'P1Y2M3DT4H5M6S' , 'hour'  ), 10276.085 );
    });
    it('should humanize if patternOut contain humain or humain+ and manage locale', function () {
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 2000                           , 'human' ) , 'a few seconds' );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600                    , 'human' ) , 'an hour'       );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, 1000 * 3600                    , 'human+') , 'in an hour'    );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, -1000 * 3600                   , 'human+') , 'an hour ago'   );
      helper.assert(dateFormatter.formatI.call({lang : 'en'}, -1000 * 3600 * 24 * 365 * 4    , 'human+') , '4 years ago'   );
      helper.assert(dateFormatter.formatI.call({lang : 'fr'}, -1000 * 3600 * 24 * 365 * 4    , 'human+') , 'il y a 4 ans'  );
      helper.assert(dateFormatter.formatI.call({lang : 'fr-FR'}, -1000 * 3600 * 24 * 365 * 4 , 'human+') , 'il y a 4 ans'  );
      helper.assert(dateFormatter.formatI.call({lang : 'es-ES'}, -1000 * 3600 * 24 * 365 * 4 , 'human+') , 'hace 4 años'   );
    });
  });
  describe('diffD', function () {
    it('should compute the difference between two dates', function () {
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201'), 5274000000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'millisecond' ), 5274000000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'milliseconds'), 5274000000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'ms'          ), 5274000000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'second'      ), 5274000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'seconds'     ), 5274000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 's'           ), 5274000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'minute'      ), 87900);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'minutes'     ), 87900);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'm'           ), 87900);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'hour'        ), 1465);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'hours'       ), 1465);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'h'           ), 1465);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20091001', '20101201', 'year'        ), 1);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20091001', '20101201', 'years'       ), 1);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20091001', '20101201', 'y'           ), 1);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20100520', '20101201', 'quarter'     ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20100520', '20101201', 'quarters'    ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20100520', '20101201', 'Q'           ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'month'       ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'months'      ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'M'           ), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'week'        ), 8);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'weeks'       ), 8);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'w'           ), 8);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'day'         ), 61);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'days'        ), 61);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '20101001', '20101201', 'd'           ), 61);
    });
    it('should compute the difference between two dates and accept patterns for both dates', function () {
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'ms' , 'YYYY+MM+DD', 'YYYY=MM=DD'), 5274000000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 's'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 5274000);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'm'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 87900);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'h'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 1465);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2009+10+01', '2010=12=01', 'y'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 1);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+05+20', '2010=12=01', 'Q'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'M'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 2);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'w'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 8);
      helper.assert(dateFormatter.diffD.call({lang : 'en'}, '2010+10+01', '2010=12=01', 'd'  , 'YYYY+MM+DD', 'YYYY=MM=DD'), 61);
    });
  });
  describe('convCRLF', function () {
    it('should convert LF and CR in odt', function () {
      helper.assert(stringFormatter.convCRLF.call({extension : 'odt'}, 'qsdqsd \n sd \r\n qsd \n sq'), 'qsdqsd <text:line-break/> sd <text:line-break/> qsd <text:line-break/> sq');
    });
    it('should convert LF and CR in docx', function () {
      helper.assert(stringFormatter.convCRLF.call({extension : 'docx'}, 'qsdqsd \n'), 'qsdqsd </w:t><w:br/><w:t>');
    });
    it('should add a paragraph in ODS', function () {
      helper.assert(stringFormatter.convCRLF.call({extension : 'ods'}, 'qsdqsd \n'), 'qsdqsd </text:p><text:p>');
    });
  });
  describe('convCRLFH', function () {
    it('should convert LF and CR to <br>', function () {
      helper.assert(stringFormatter.convCRLFH.call({}, 'qsdqsd \n sd \r\n qsd \n sq'), 'qsdqsd <br> sd <br> qsd <br> sq');
    });
  });
  describe('replace', function () {
    it('should replace a string by another', function () {
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es', 'OK'     ), 'tOKt bi 123 tOK');
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es'           ), 'tt bi 123 t');
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es', null     ), 'tt bi 123 t');
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es', undefined), 'tt bi 123 t');
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es', 1000     ), 't1000t bi 123 t1000');
      helper.assert(stringFormatter.replace('test bi 123 tes', 'es', -1000    ), 't-1000t bi 123 t-1000');
      helper.assert(stringFormatter.replace(-10000.1                          ), '-10000.1');
      helper.assert(stringFormatter.replace(-10000.1         , '.' , ';'      ), '-10000;1');
      helper.assert(stringFormatter.replace(-100110.1        , 11 , 'AA'      ), '-100AA0.1');
      helper.assert(stringFormatter.replace(null                              ), '');
      helper.assert(stringFormatter.replace(undefined                         ), '');
      helper.assert(stringFormatter.replace({}                                ), '[object Object]');
      helper.assert(stringFormatter.replace(['1', '2']                        ), '1,2');
    });
    it('should not accept regex (security)', function () {
      helper.assert(stringFormatter.replace('test bi 123 tes', /es/g), 'test bi 123 tes');
    });
  });

  describe('split', function () {
    it('should split the text and generate an array', function () {
      helper.assert(stringFormatter.split('couc/ousd/sdzd', '/')  , ['couc', 'ousd', 'sdzd']);
      helper.assert(stringFormatter.split('coucou')               , ['coucou']);
      helper.assert(stringFormatter.split('coucou', 'c')          , ['', 'ou', 'ou']);
      helper.assert(stringFormatter.split('coucou', 'co')         , ['', 'u', 'u']);
      helper.assert(stringFormatter.split(102000, 2)              , ['10', '000']);
      helper.assert(stringFormatter.split(102.0001, '.')          , ['102', '0001']);
      helper.assert(stringFormatter.split('coucou', null)         , ['coucou']);
      helper.assert(stringFormatter.split('cou0cou', 0)           , ['cou', 'cou']);
      helper.assert(stringFormatter.split('coucou', undefined)    , ['coucou']);
      helper.assert(stringFormatter.split('coucou', {})           , ['coucou']);
      helper.assert(stringFormatter.split('coucou', ['ou', 'ao']) , ['coucou']);
      /** Combine split + arrayJoin */
      const _resSplit = stringFormatter.split('Lorem ipsum dolor sit amet', ' ');
      helper.assert(_resSplit, ['Lorem','ipsum','dolor','sit','amet']);
      const _resJoin = arrayFormatter.arrayJoin(_resSplit, '', '2', '1');
      helper.assert(_resJoin, 'dolor');
    });
    it('should not crash if data is null or undefined or a regex', function () {
      helper.assert(stringFormatter.split('coucou', /ou/g), ['coucou']);
      helper.assert(stringFormatter.split(null), null);
      helper.assert(stringFormatter.split(undefined), undefined);
    });
  });

  describe('append', function () {
    it('should append text', function () {
      helper.assert(stringFormatter.append('coucou')               , 'coucou');
      helper.assert(stringFormatter.append('coucou', 'c')          , 'coucouc');
      helper.assert(stringFormatter.append('coucou', 'co')         , 'coucouco');
      helper.assert(stringFormatter.append('coucou', 10)           , 'coucou10');
      helper.assert(stringFormatter.append('coucou', null)         , 'coucou');
      helper.assert(stringFormatter.append('coucou', undefined)    , 'coucou');
      helper.assert(stringFormatter.append('coucou', [])           , 'coucou');
      helper.assert(stringFormatter.append('coucou', ['1', '2'])   , 'coucou1,2');
      helper.assert(stringFormatter.append('coucou', {})           , 'coucou[object Object]');
      helper.assert(stringFormatter.append(222, 10)                , '22210');
      helper.assert(stringFormatter.append({}, '')                 , '[object Object]');
      helper.assert(stringFormatter.append(['1', '2'], '3')         , '1,23');
    });
    it('should not crash if data is null or undefined', function () {
      helper.assert(stringFormatter.append(null), '');
      helper.assert(stringFormatter.append(undefined), '');
    });
  });

  describe('prepend', function () {
    it('should prepend text', function () {
      helper.assert(stringFormatter.prepend('coucou')               , 'coucou');
      helper.assert(stringFormatter.prepend('coucou', 'c')          , 'ccoucou');
      helper.assert(stringFormatter.prepend('coucou', 'co')         , 'cocoucou');
      helper.assert(stringFormatter.prepend('coucou', 10)           , '10coucou');
      helper.assert(stringFormatter.prepend('coucou', null)         , 'coucou');
      helper.assert(stringFormatter.prepend('coucou', undefined)    , 'coucou');
      helper.assert(stringFormatter.prepend('coucou', [])           , 'coucou');
      helper.assert(stringFormatter.prepend('coucou', ['1', '2'])   , '1,2coucou');
      helper.assert(stringFormatter.prepend('coucou', {})           , '[object Object]coucou');
      helper.assert(stringFormatter.prepend(222, 10)                , '10222');
      helper.assert(stringFormatter.prepend({}, '')                 , '[object Object]');
      helper.assert(stringFormatter.prepend(['1', '2'], '3')        , '31,2');
    });
    it('should not crash if data is null or undefined', function () {
      helper.assert(stringFormatter.prepend(null), '');
      helper.assert(stringFormatter.prepend(undefined), '');
    });
  });

  describe('ifEmpty', function () {
    it('should show a message if data is empty. It should stop propagation to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, ''       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, null     , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, undefined, 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, []       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, NaN      , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty', 'true'), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {}       , 'msgIfEmpty', true), 'msgIfEmpty');
      helper.assert(_context.stopPropagation, false);
    });

    it('should return data if the message is not empty... and keep on propagation to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 0           , 'msgIfEmpty'), 0);
      helper.assert(_context.stopPropagation, false);

      var _date = new Date();
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, _date       , 'msgIfEmpty'), _date);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 'sdsd'      , 'msgIfEmpty'), 'sdsd');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, 12.33       , 'msgIfEmpty'), 12.33);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, true        , 'msgIfEmpty'), true);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, [12, 23]    , 'msgIfEmpty'), [12, 23]);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEmpty, _context, {d : 'd'}     , 'msgIfEmpty'), {d : 'd'});
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('ifEqual', function () {
    it('should show a message if data is equal to a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 0, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '0', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, true, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'true', 'true', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, 'true', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'false', 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, false, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, 'false', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
    });
    it('should propagate to next formatter if continueOnSuccess is true', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 0, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '0', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, true, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, false, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'titi', 'msgIfTrue', true), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
    });
    it('should return data if data is not equal to a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, 3, 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 0, '1', 'msgIfTrue'), 0);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, true, false, 'msgIfTrue'), true);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'true', false, 'msgIfTrue'), 'true');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'false', 'true', 'msgIfTrue'), 'false');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, false, true, 'msgIfTrue'), false);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifEqual, _context, 'titi', 'toto', 'msgIfTrue'), 'titi');
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('ifContains', function () {
    it('should show a message if data contains a variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'is', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'car is', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'toto', 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, true);
    });
    it('should propagate to next formatter if continueOnSuccess is true', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'is', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'car is', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'toto', 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue', 'true'), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 2, 'msgIfTrue', true), 'msgIfTrue');
      helper.assert(_context.stopPropagation, false);
    });
    it('should return data if data does not contain the variable', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'are', 'msgIfTrue'), 'car is broken');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 'car is broken', 'caris', 'msgIfTrue'), 'car is broken');
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [1, 2, 'toto'], 'titi', 'msgIfTrue'), [1, 2, 'toto']);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, [], 3, 'msgIfTrue'), []);
      helper.assert(_context.stopPropagation, false);
    });
    it('should not crash if data is not a String or an Array. It should transfer to next formatter', function () {
      var _context = {};
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, null, 'is', 'msgIfTrue'), null);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, undefined, 'is', 'msgIfTrue'), undefined);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, 12, 'titi', 'msgIfTrue'), 12);
      helper.assert(_context.stopPropagation, false);
      helper.assert(callWithContext(conditionFormatter.ifContain, _context, {toto : 2 }, 3, 'msgIfTrue'),  {toto : 2 });
      helper.assert(_context.stopPropagation, false);
    });
  });

  describe('New conditional system ifEQ, ifNE, ...', function () {

    const _contextAndExpectedResultWhenConditionIsTrue = [
      { isConditionTrue : false, isAndOperator : false, isConditionTrueExpected : true  }, // false || true = true
      { isConditionTrue : false, isAndOperator : true , isConditionTrueExpected : false }, // false && true = false
      { isConditionTrue : true , isAndOperator : false, isConditionTrueExpected : true  }, // true  || true = true
      { isConditionTrue : true , isAndOperator : true , isConditionTrueExpected : true  }  // true  && true = true
    ];
    const _contextAndExpectedResultWhenConditionIsFalse = [
      { isConditionTrue : false, isAndOperator : false, isConditionTrueExpected : false }, // false || false = false
      { isConditionTrue : false, isAndOperator : true , isConditionTrueExpected : false }, // false && false = false
      { isConditionTrue : true , isAndOperator : false, isConditionTrueExpected : true  }, // true  || false = true
      { isConditionTrue : true , isAndOperator : true , isConditionTrueExpected : false }  // true  && false = false
    ];

    /**
     * Generic function to test all combination of context + datasets and print error
     *
     * @param  {String} formatter           formatter to call
     * @param  {Array}  data                dataset to test
     * @param  {Array}  expectedResult      true or false
     */
    function testCondition (formatter, data, expectedResult) {
      var _context = {};
      for (let i = 0, n = data.length; i < n; i++) {
        const el = data[i];
        const expectedFromContext = (expectedResult === true) ? _contextAndExpectedResultWhenConditionIsTrue : _contextAndExpectedResultWhenConditionIsFalse;
        for (let j = 0, len = expectedFromContext.length; j < len; j++) {
          const _test = expectedFromContext[j];
          _context.isConditionTrue = _test.isConditionTrue;
          _context.isAndOperator   = _test.isAndOperator;
          var _returnedValue = callWithContext(conditionFormatter[formatter], _context, el[0], el[1]);
          try {
            helper.assert(_context.isConditionTrue, _test.isConditionTrueExpected);
            helper.assert(_context.isAndOperator  , _test.isAndOperator);
            helper.assert(_returnedValue          , el[0]);
            helper.assert(_context.stopPropagation, false);
          }
          catch (e) {
            // Prints better error output for debugging
            console.log('\x1b[31m');
            console.log(`\nContext :\n  ${JSON.stringify(_context)}`);
            console.log('\nFormatter called:');
            console.log(`  ${formatter}(${JSON.stringify(el[0])}, ${JSON.stringify(el[1])})`);
            console.log('\n\x1b[0m');
            throw e;
          }
        }
      }
    }

    describe('ifEQ', function () {
      it('should turn the `isConditionTrue` to True if a data is equal to a variable', function () {
        const _dataSet = [
          [0, 0],
          [0, '0'],
          [23.232, 23.232],
          [23.232, '23.232'],
          ['23.232', 23.232],
          [true, true],
          ['true', 'true'],
          [true, 'true'],
          ['false', 'false'],
          [false, 'false'],
          [false, false],
          ['titi', 'titi'],
          [undefined, undefined],
          [null, null],
          // object identiques, it is comparing "[object Object]" === "[object Object]"
          [{value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}}],
          [{ name : '85 street'}, {value : 10, name : 'wick', address : { name : '321 street'}}],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]]
        ];
        testCondition('ifEQ', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
        const _dataSet = [
          [0, 3],
          [0, '1'],
          [22.2222, 22.2223],
          [22.2222, '22.2223'],
          [true, false],
          ['true', false],
          ['false', 'true'],
          [false, true],
          ['titi', 'toto'],
          [undefined, 'titi'],
          ['titi', null],
          [[1, 2, 3], [1, 3]],
        ];
        testCondition('ifEQ', _dataSet, false);
      });
    });

    describe('ifNE', function () {
      it('should turn the `isConditionTrue` to false if a data is equal to a variable', function () {
        const _dataSet = [
          [0, 0],
          [0, '0'],
          [22.2222, '22.2222'],
          [22.2222, 22.2222],
          ['22.2222', 22.2222],
          [true, true],
          ['true', 'true'],
          [true, 'true'],
          [false, 'false'],
          ['false', 'false'],
          [false, false],
          [false, 'false'],
          ['titi', 'titi'],
          [undefined, undefined],
          [null, null],
          // Objects appear as "[object Object]"
          [{value : 10, name : 'john', address : { name : '123 street'} }, {value : 10, name : 'john', address : { name : '123 street'}}],
          [{value : 20, name : 'Eric', address : { name : '85 street'} }, {value : 10, name : 'wick', address : { name : '321 street'}}],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 4, 6, 7, 8, 9]],
        ];
        testCondition('ifNE', _dataSet, false);
      });

      it('should turn the `isConditionTrue` to false if the data is not equal to a variable', function () {
        const _dataSet = [
          [0, 3],
          [0, '1'],
          [true, false],
          [22.2222, '22.2224'],
          ['true', false],
          ['false', 'true'],
          [false, true],
          ['titi', 'toto'],
          [undefined, 'titi'],
          ['titi', null],
          [[1, 2, 3, 4, 6, 7, 8, 9], [1, 2, 3, 6, 7, 8, 9]],
        ];
        testCondition('ifNE', _dataSet, true);
      });
    });

    describe('ifTE', function () {
      it('should turn the `isConditionTrue` to false if a data is not a string', function () {
        const _dataSet = [
          [0                , 'string'],
          [-0               , 'string'],
          [-21              , 'string'],
          [NaN              , 'string'],
          [() => {}         , 'string'],
          [22.2222          , 'string'],
          [true             , 'string'],
          [false            , 'string'],
          [undefined        , 'string'],
          [null             , 'string'],
          [{value : 'john'} , 'string'],
          [[1, 2, 3]        , 'string']
        ];
        testCondition('ifTE', _dataSet, false);
      });
      it('should turn the `isConditionTrue` to true if the data is a string', function () {
        const _dataSet = [
          [''          , 'string'],
          ['0'         , 'string'],
          ['22.2222'   , 'string'],
          ['true'      , 'string'],
          ['false'     , 'string'],
          ['è#@&é'     , 'string'],
          ['undefined' , 'string'],
          ['null'      , 'string']
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if a data is not a number', function () {
        const _dataSet = [
          ['undefined'      , 'number'],
          ['null'           , 'number'],
          [true             , 'number'],
          [false            , 'number'],
          ['1.000'          , 'number'],
          ['-1.000'         , 'number'],
          ['a12'            , 'number'],
          [NaN              , 'number'],
          [() => {}         , 'number'],
          [undefined        , 'number'],
          [null             , 'number'],
          [{value : 'john'} , 'number'],
          [[1, 2, 3]        , 'number']
        ];
        testCondition('ifTE', _dataSet, false);
      });

      it('should turn the `isConditionTrue` to true if the data is a number', function () {
        const _dataSet = [
          [2          , 'number'],
          [-2         , 'number'],
          [3.14       , 'number'],
          [Infinity   , 'number']
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if a data is not a boolean', function () {
        const _dataSet = [
          ['undefined'      , 'boolean'],
          ['null'           , 'boolean'],
          [3.14             , 'boolean'],
          [1                , 'boolean'],
          [NaN              , 'boolean'],
          [0                , 'boolean'],
          ['false'          , 'boolean'],
          ['true'           , 'boolean'],
          ['0'              , 'boolean'],
          ['1'              , 'boolean'],
          [undefined        , 'boolean'],
          [null             , 'boolean'],
          [{value : 'john'} , 'boolean'],
          [[1, 2, 3]        , 'boolean']
        ];
        testCondition('ifTE', _dataSet, false);
      });

      it('should turn the `isConditionTrue` to true if the data is a boolean', function () {
        const _dataSet = [
          [true          , 'boolean'],
          [false         , 'boolean']
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if a data is not a object', function () {
        const _dataSet = [
          ['undefined'      , 'object'],
          ['null'           , 'object'],
          [3.14             , 'object'],
          [1                , 'object'],
          [undefined        , 'object'],
          [NaN              , 'object'],
          [null             , 'object'],
          [() => {}         , 'object'],
          ['aa'             , 'object'],
          [true             , 'object'],
          [false            , 'object'],
          [[1, 2, 3]        , 'object']
        ];
        testCondition('ifTE', _dataSet, false);
      });

      it('should turn the `isConditionTrue` to true if the data is a object', function () {
        const _dataSet = [
          [{ a : 1 }  , 'object'],
          [{}         , 'object']
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if a data is not a array', function () {
        const _dataSet = [
          ['undefined'      , 'array'],
          ['null'           , 'array'],
          [3.14             , 'array'],
          [1                , 'array'],
          [NaN              , 'array'],
          [null             , 'array'],
          ['a'              , 'array'],
          [undefined        , 'array'],
          [true             , 'array'],
          [false            , 'array'],
          [{value : 'john'} , 'array'],
        ];
        testCondition('ifTE', _dataSet, false);
      });
      it('should turn the `isConditionTrue` to true if the data is a array', function () {
        const _dataSet = [
          [[1, 2, 3]  , 'array'],
          [[]         , 'array'],
          [[{a : 1}]  , 'array'],
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('[binary] should turn the `isConditionTrue` to false if a data is not a binary', function () {
        const _dataSet = [
          ['undefined'      , 'binary'],
          ['null'           , 'binary'],
          [3.14             , 'binary'],
          ['10'             , 'binary'],
          [-1               , 'binary'],
          [NaN              , 'binary'],
          [undefined        , 'binary'],
          [null             , 'binary'],
          [{value : 'john'} , 'binary'],
          [[1, 2, 3]        , 'binary']
        ];
        testCondition('ifTE', _dataSet, false);
      });
      it('should turn the `isConditionTrue` to true if the data is a binary', function () {
        const _dataSet = [
          [false    , 'binary'],
          [true     , 'binary'],
          ['false'  , 'binary'],
          ['true'   , 'binary'],
          ['0'      , 'binary'],
          ['1'      , 'binary'],
          [0        , 'binary'],
          [1        , 'binary'],
        ];
        testCondition('ifTE', _dataSet, true);
      });

      it('should turn the `isConditionTrue` to false if a data is not a integer', function () {
        const _dataSet = [
          ['undefined'      , 'integer'],
          ['null'           , 'integer'],
          [true             , 'integer'],
          [false            , 'integer'],
          ['1.000'          , 'integer'],
          ['1000'           , 'integer'],
          ['-1.000'         , 'integer'],
          ['a12'            , 'integer'],
          [NaN              , 'integer'],
          [3.1              , 'integer'],
          [() => {}         , 'integer'],
          [undefined        , 'integer'],
          [null             , 'integer'],
          [{value : 'john'} , 'integer'],
          [[1, 2, 3]        , 'integer']
        ];
        testCondition('ifTE', _dataSet, false);
      });
      it('should turn the `isConditionTrue` to true if the data is a integer', function () {
        const _dataSet = [
          [545454     , 'integer'],
          [2          , 'integer'],
          [-2         , 'integer'],
          [0          , 'integer']
        ];
        testCondition('ifTE', _dataSet, true);
      });
    });

    describe('ifGT', function () {
      it('should matches values, string.length, array.length or object.length that are greater than a specified value', function () {
        const _dataSet = [
          [50, -29],
          [1290, 768],
          ['1234', '1'],
          [1.1223 , '1.12221'],
          ['32q', '4q2'],
          ['1234Hello', '1'],
          ['1234Hello', 8],
          [10, '8Hello1234'],
          [[1, 2, 3, 4, 5].length, 3],
          ['6', [1, 2, 3, 4, 5].length],
          [['apple', 'banana', 'jackfruit'].length, ['tomato', 'cabbage'].length],
          [Object.keys({id : 2, name : 'John', lastname : 'Wick', city : 'Paris'}).length, Object.keys({id : 3, name : 'John'}).length],
        ];
        testCondition('ifGT', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT greater than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [0, 0],
          [-2891, '33Hello'],
          [1.1221 , '1.12221'],
          ['1' , '1234'],
          ['123dsf', '103123'],
          ['13dsf21354t43534534543', '103123093fcce3'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Hello1234', 10],
          ['Hello1234', 9],
          [2, 'Hello1234'],
          [9, 'Hello1234'],
          [['apple', 'banana'], ['tomato']],
          [['apple', 'banana'].length, ['tomato', 'cabbage', 'jackfruit', 'berry']],
          [{id : 2, name : 'John'}, {id : 3, name : 'John',  lastname : 'Wick', city : 'Paris'}],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [{id : 2, name : 'John'}, {id : 3, name : 'Wick'}]
        ];
        testCondition('ifGT', _dataSet, false);
      });
    });
    describe('ifGTE', function () {
      it('Matches values, string.length, array.length or object.length that are greater than or equal to a specified value', function () {
        let _dataSet = [
          [50, -29],
          [0, 0],
          [1290, 768],
          [1.1222 , '1.1222'],
          [1.1223 , '1.12221'],
          ['1234', '1'],
          ['1234Hello', '1'],
          ['1234Hello'.length, 8],
          ['Hello1234'.length, 9],
          [10, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 3],
          [[1, 2, 3, 4, 5].length, 5],
          [6, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifGTE', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT greater than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          ['1' , '1234'],
          ['1.1221' , '1.1222'],
          [1.1221 , '1.1222'],
          ['Short sentence', 'Hello, this is a long sentence'],
          ['Hello1234', 10],
          [2, '1234Hello'],
          [[1, 2, 3, 4, 5].length, '10'],
          ['3', [1, 2, 3, 4, 5].length],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null]
        ];
        testCondition('ifGTE', _dataSet, false);
      });
    });
    describe('ifLT', function () {
      it ('should matches values, string.length, array.length or object.length that are less than a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [1.12, 1.13],
          [1.12, '1.13'],
          ['1' , '1234'],
          ['123dsf', '103123'],
          [-1299283, '-2891feihuwf'],
          ['Hello1234'.length, 10],
          [2, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 20],
          [3, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifLT', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT less than a specified value', function () {
        const _dataSet = [
          [50, -29],
          [0, 0],
          [1290, 768],
          ['1234', '1'],
          [111, '30'],
          ['32qdwq', '4q2'],
          ['256sddwq', -202],
          ['2This is a long string', '1Hello'],
          ['1234Hello', '1'],
          ['Hello1234'.length, 2],
          ['Hello1234'.length, 9],
          [10, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 2],
          [6, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length],
          [['apple', 'banana'], ['tomato', 'cabbage']],
          [{id : 2, name : 'John', lastname : 'Wick', city : 'Paris'}, {id : 3, name : 'John'}],
          [{id : 2, name : 'John'}, {id : 3, name : 'Wick'}],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null],
        ];
        testCondition('ifLT', _dataSet, false);
      });
    });
    describe('ifLTE', function () {
      it('should matches values, string.length, array.length or object.length that are less than or equal to a specified value', function () {
        const _dataSet = [
          [-23, 19],
          [1, 768],
          [0, 0],
          ['1' , '1234'],
          [22.233 , '22.233'],
          ['54356fewfewf432', '54356HelloThere'],
          ['23fwe', 123],
          ['4Hello', 10],
          ['Hello1234'.length, 9],
          [2, 'Hello1234'.length],
          [9, 'Hello1234'.length],
          [[1, 2, 3, 4, 5].length, 10],
          [[1, 2, 3, 4, 5].length, 5],
          [3, [1, 2, 3, 4, 5].length],
          [5, [1, 2, 3, 4, 5].length]
        ];
        testCondition('ifLTE', _dataSet, true);
      });

      it('should matches values, string.length, array.length or object.length that are NOT less than or equal to a specified value', function () {
        const _dataSet = [
          [50, -29],
          [1290, 768],
          ['1234', '1'],
          [22.2331 , '22.233'],
          ['1234ThisIsText', 1],
          ['Hello1234', '1'],
          ['Hello1234', 2],
          [10, 'Hello1234'],
          [[1, 2, 3, 4, 5].length, 2],
          [6, [1, 2, 3, 4, 5].length],
          [{id : 2, name : 'John'}, null],
          [null, 'Lion and giraffe'],
          ['Lion and giraffe',  null],
          [null, null],
          [{id : 2, name : 'John'}, undefined],
          [undefined, 'Lion and giraffe'],
          ['Lion and giraffe',  undefined],
          [undefined, undefined],
          [undefined, null],
        ];
        testCondition('ifLTE', _dataSet, false);
      });
    });
    describe('ifIN', function () {
      it('Matches any of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'is'],
          ['car is broken', 'car is'],
          [[1, 2, 'toto'], 'toto'],
          [[1, 2, 'toto'], 2],
        ];
        testCondition('ifIN', _dataSet, true);
      });
      it('Matches none of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'are'],
          ['car is broken',  'caris'],
          [[1, 2, 'toto'], 'titi'],
          [[], 3],
          [null, 'titi'],
          ['titi', null],
          [null, null],
          [undefined, null],
          [undefined, 'titi'],
          ['titi', undefined],
          [undefined, undefined],
          [12, 'titi'],
          [{toto : 2 }, 3],
        ];
        testCondition('ifIN', _dataSet, false);
      });
    });
    describe('ifNIN', function () {
      it('should matches none of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'are'],
          ['car is broken',  'caris'],
          [[1, 2, 'toto'], 'titi'],
          [[], 3],
        ];
        testCondition('ifNIN', _dataSet, true);
      });

      it('should matches any of the values specified in an array or string', function () {
        const _dataSet = [
          ['car is broken', 'is'],
          ['car is broken', 'car is'],
          [[1, 2, 'toto'], 'toto'],
          [[1, 2, 'toto'], 2],
          [null, 'titi'],
          ['titi', null],
          [null, null],
          [undefined, null],
          [undefined, 'titi'],
          ['titi', undefined],
          [undefined, undefined],
          [12, 'titi'],
          [{toto : 2 }, 3],
        ];
        testCondition('ifNIN', _dataSet, false);
      });
    });

    describe('ifEM', function () {
      it ('should matches empty values, string, arrays or objects', function () {
        const _dataSet = [
          [''],
          [null],
          [undefined],
          [[]],
          [NaN],
          [{}],
        ];
        testCondition('ifEM', _dataSet, true);
      });

      it('should matches not empty values, string, arrays or objects', function () {
        const _dataSet = [
          [0],
          [new Date()],
          ['sdsd'],
          [12.33],
          [true],
          [[12, 23]],
          [{d : 'd'}],
        ];
        testCondition('ifEM', _dataSet, false);
      });
    });
    describe('ifNEM', function () {
      it('should matches not empty values, string, arrays or objects', function () {
        const _dataSet = [
          [0],
          [new Date()],
          ['sdsd'],
          [12.33],
          [true],
          [[12, 23]],
          [{d : 'd'}],
        ];
        testCondition('ifNEM', _dataSet, true);
      });

      it ('should matches empty values, string, arrays or objects', function () {
        const _dataSet = [
          [''],
          [null],
          [undefined],
          [[]],
          [NaN],
          [{}],
        ];
        testCondition('ifNEM', _dataSet, false);
      });
    });

    describe('ifBlocks - showBegin/showEnd/hideBegin/hideEnd + Combined conditions', function () {
      it('should show the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
        callWithContext(conditionFormatter.showBegin, _context);
        helper.assert(_context.isHidden, 0);
        helper.assert(_context.stopPropagation, true);
        helper.assert(_context.isConditionTrue, true);
        callWithContext(conditionFormatter.showEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should not show the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
        callWithContext(conditionFormatter.showBegin, _context);
        helper.assert(_context.isHidden, 1);
        helper.assert(_context.stopPropagation, false);
        helper.assert(_context.isConditionTrue, false);
        callWithContext(conditionFormatter.showEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should hide the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
        callWithContext(conditionFormatter.hideBegin, _context);
        helper.assert(_context.isHidden, 1);
        helper.assert(_context.stopPropagation, true);
        helper.assert(_context.isConditionTrue, true);
        callWithContext(conditionFormatter.hideEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
      it('should not hide the content', function () {
        let _context = {isConditionTrue : false};
        callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
        callWithContext(conditionFormatter.hideBegin, _context);
        helper.assert(_context.isHidden, 0);
        helper.assert(_context.stopPropagation, false);
        helper.assert(_context.isConditionTrue, false);
        callWithContext(conditionFormatter.hideEnd, _context);
        helper.assert(_context.isHidden, -1);
      });
    });

    describe('Combined conditions', function () {
      describe('AND', function () {
        it('should be true | ifNE / ifEQ / ifGTE / ifGT / ifLT / ifLTE / ifIN / ifNIN / ifEM / ifNEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEQ, _context, 'dragon', 'dragon');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGT, _context, 20, 1);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -100, -100);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, -1000, 30);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 13987, 13987);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'grapes');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, null);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNEM, _context, new Date());
          callWithContext(conditionFormatter.and, _context);
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
        });
        it('should be false | ifNE / ifNIN', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
        });
        it('should be false | ifEQ / ifEM / ifNEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'delorean');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, []);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifEM, _context, {id : '1'});
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifNEM, _context, 'Hey');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
        });
      });
      describe('OR', function () {
        it('should be true | ifNE / ifNIN', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNE, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNIN, _context, ['potatoes', 'bananas', 'tomatoes'], 'tomatoes');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
        });

        it('should be true | ifEQ / ifNEM / ifEM', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifEQ, _context, 'delorean', 'tesla');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNEM, _context, [1, 2, 3, 4, 5]);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, {});
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifNEM, _context, 'Hey');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
        });
      });
      describe('AND/OR/SHOW/ELSE SHOW', function () {
        it('Should SHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGT, _context, 234, 2);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 10, 2);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should NOT SHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGTE, _context, 2, 20);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLT, _context, 10, 2);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, false);
        });
        it('Should ELSESHOW + or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifGTE, _context, 2, 20);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLT, _context, 10, 2);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(_context.stopPropagation, false);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + and', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifIN, _context, [2, 30, 'apple', -1], 'apple');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, -199, 21);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + multiple and', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'Hello');
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 200, 200);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifLT, _context, 0, 1);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should SHOW + multiple or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'hey');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 22333333, 2100);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, null);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -1, 0);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should elseShow + multiple or', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifNIN, _context, 'This is a sentence 1234 hey', 'hey');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifLTE, _context, 22222222, 2100);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifEM, _context, 'no empty');
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, -1, 0);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'space'), 'space');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
        it('Should show + AND + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLTE, _context, stringFormatter.len(['Banana', 'Apple', 'Bread', 'Blue Cheese']), 1997);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGT, _context, stringFormatter.len('This Is a long string with numbers 12345'), 10);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'Pineapple'), 'Pineapple');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });

        it('Should elseShow + AND + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLTE, _context, stringFormatter.len(['Banana', 'Apple', 'Bread', 'Blue Cheese']), 10);
          callWithContext(conditionFormatter.and, _context);
          callWithContext(conditionFormatter.ifGTE, _context, stringFormatter.len('This Is a long string with numbers 12345'), 41);
          callWithContext(conditionFormatter.show, _context);
          helper.assert(callWithContext(conditionFormatter.elseShow, _context, null, 'Apple'), 'Apple');
          helper.assert(_context.isConditionTrue, false);
          helper.assert(_context.isAndOperator, true);
          helper.assert(_context.stopPropagation, true);
        });

        it('Should show + OR + len', function () {
          let _context = {isConditionTrue : false};
          callWithContext(conditionFormatter.ifLT, _context, stringFormatter.len(['car', 'train', 'plane']), 2);
          callWithContext(conditionFormatter.or, _context);
          callWithContext(conditionFormatter.ifGTE, _context, stringFormatter.len('Hello12345'), 10);
          helper.assert(callWithContext(conditionFormatter.show, _context, null, 'Pineapple'), 'Pineapple');
          helper.assert(_context.isConditionTrue, true);
          helper.assert(_context.isAndOperator, false);
          helper.assert(_context.stopPropagation, true);
        });
      });
    });
  });

  describe('LEN', function () {
    it('should return the string length or array length', function () {
      helper.assert(stringFormatter.len('This is a string'), 16);
      helper.assert(stringFormatter.len(''), 0);
      helper.assert(stringFormatter.len('樂而不淫 建章曰'), 8);
      helper.assert(stringFormatter.len('This is a longer string lenght'), 30);
      helper.assert(stringFormatter.len([0, 1, 2, 3]), 4);
      helper.assert(stringFormatter.len([1, 2, 'This is a string', 3, 9, 10]), 6);
      helper.assert(stringFormatter.len([]), 0);
      helper.assert(stringFormatter.len({name : 'John'}), 0);
      helper.assert(stringFormatter.len(undefined), 0);
      helper.assert(stringFormatter.len(null), 0);
      helper.assert(stringFormatter.len(-1), 0);
    });
  });

  describe('print', function () {
    it('should print the message', function () {
      var _context = {};
      helper.assert(callWithContext(stringFormatter.print, _context, null, 'msg'), 'msg');
    });
  });

  describe('convEnum', function () {
    it('should convert enums to human readable values', function () {
      var _context = {
        enum : {
          DAY          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ORDER_STATUS : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 0, 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'DAY'), 'wednesday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 2, 'ORDER_STATUS'), 'received');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, '1', 'ORDER_STATUS'), 'sent');
    });
    it('should accept objects for enums', function () {
      var _context = {
        enum : {
          DAY : {
            mon : 'monday',
            tue : 'tuesday',
            wed : 'wednesday',
            thu : 'thursday',
            fri : 'friday'
          }
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'mon', 'DAY'), 'monday');
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 'wed', 'DAY'), 'wednesday');
    });
    it('should return value if enum translation is not possible', function () {
      var _context = {
        enum : {
          DAY          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ORDER_STATUS : ['draft' , 'sent', 'received']
        }
      };
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 3, 'UNKNOWN_TYPE'), 3);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, null, 'UNKNOWN_TYPE'), null);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, undefined, 'UNKNOWN_TYPE'), undefined);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, [1, 2], 'UNKNOWN_TYPE'), [1, 2]);
      helper.assert(callWithContext(stringFormatter.convEnum, _context, {data : 3}, 'UNKNOWN_TYPE'), {data : 3});
    });
    it('should not crash if enum is not defined. It should return the value', function () {
      var _context = {};
      helper.assert(callWithContext(stringFormatter.convEnum, _context, 6, 'DAY'), 6);
    });
  });

  describe('lowerCase', function () {
    it('should convert a string to lower case', function () {
      helper.assert(stringFormatter.lowerCase('AZERTY'), 'azerty');
      helper.assert(stringFormatter.lowerCase('qskhREqsLLK;d:sdRTH234'), 'qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.lowerCase(null), null);
      helper.assert(stringFormatter.lowerCase(undefined), undefined);
      helper.assert(stringFormatter.lowerCase(120), 120);
    });
  });

  describe('upperCase', function () {
    it('should convert a string to upper case', function () {
      helper.assert(stringFormatter.upperCase('azerty'), 'AZERTY');
      helper.assert(stringFormatter.upperCase('qskhreqsllk;d:sdrth234'), 'QSKHREQSLLK;D:SDRTH234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.upperCase(null), null);
      helper.assert(stringFormatter.upperCase(undefined), undefined);
      helper.assert(stringFormatter.upperCase(120), 120);
    });
  });

  describe('ucFirst', function () {
    it('should upper case the first letter', function () {
      helper.assert(stringFormatter.ucFirst('azerty ss'), 'Azerty ss');
      helper.assert(stringFormatter.ucFirst(' azerty'), ' azerty');
      helper.assert(stringFormatter.ucFirst('qskhreqsllk;d:sdrth234'), 'Qskhreqsllk;d:sdrth234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.ucFirst(null), null);
      helper.assert(stringFormatter.ucFirst(undefined), undefined);
      helper.assert(stringFormatter.ucFirst(120), 120);
      helper.assert(stringFormatter.ucFirst([]), []);
    });
  });

  describe('ucWords', function () {
    it('should upper case the first letter of each word', function () {
      helper.assert(stringFormatter.ucWords('azerty ss zzzeZ'), 'Azerty Ss ZzzeZ');
      helper.assert(stringFormatter.ucWords(' azerty'), ' Azerty');
      helper.assert(stringFormatter.ucWords('qskhreqsllk;  D:sdrt :h234'), 'Qskhreqsllk;  D:sdrt :h234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.ucWords(null), null);
      helper.assert(stringFormatter.ucWords(undefined), undefined);
      helper.assert(stringFormatter.ucWords(120), 120);
      helper.assert(stringFormatter.ucWords([]), []);
    });
  });

  describe('unaccent', function () {
    it('should remove accent from string', function () {
      helper.assert(stringFormatter.unaccent('crème brulée'), 'creme brulee');
      helper.assert(stringFormatter.unaccent('CRÈME BRULÉE'), 'CREME BRULEE');
      helper.assert(stringFormatter.unaccent('être'), 'etre');
      helper.assert(stringFormatter.unaccent('éùïêèà'), 'euieea');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(stringFormatter.unaccent(null), null);
      helper.assert(stringFormatter.unaccent(undefined), undefined);
      helper.assert(stringFormatter.unaccent(120), 120);
    });
  });

  describe('substr', function () {
    it('should keep only the selection', function () {
      helper.assert(stringFormatter.substr('coucou', 0, 3), 'cou');
      helper.assert(stringFormatter.substr('coucou', 0, 0), '');
      helper.assert(stringFormatter.substr('coucou', 3, 4), 'c');
      helper.assert(stringFormatter.substr('coucou', 0, -1), 'couco');
      helper.assert(stringFormatter.substr('coucou', 0, -2), 'couc');
      helper.assert(stringFormatter.substr('coucou', 1, -2), 'ouc');
      helper.assert(stringFormatter.substr('abcdef', -1, 100), 'f');
      helper.assert(stringFormatter.substr('abcdef', -2, 100), 'ef');
      helper.assert(stringFormatter.substr('coucou', '3', '5'), 'co');
      helper.assert(stringFormatter.substr('abcdef', '-2', '100'), 'ef');
      helper.assert(stringFormatter.substr('abcdef', '1'), 'bcdef');
      helper.assert(stringFormatter.substr('abcdef', 1), 'bcdef');
    });
    it('should not crash if data is null or undefined', function () {
      helper.assert(stringFormatter.substr(null, 0, 3), null);
      helper.assert(stringFormatter.substr(undefined, 0, 3), undefined);
      helper.assert(stringFormatter.substr([], 0, 3), []);
      helper.assert(stringFormatter.substr(2, 0, 3), 2);
      helper.assert(stringFormatter.substr('abcdef', undefined, undefined), 'abcdef');
      helper.assert(stringFormatter.substr('abcdef', null, null), '');
      helper.assert(stringFormatter.substr('abcdef', [], []), '');
    });
    it('should keep only the selection of characters but do not cut words if the third paramater is true. The returned text can be shorter', function () {
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 2, true)         , '');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 20, false)       , 'coucou donotcutme  d');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 20, true)        , 'coucou donotcutme  ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 20, 'true')      , 'coucou donotcutme  ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 27, true)        , 'coucou donotcutme  donotcut');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 40, true)        , 'coucou donotcutme  donotcut   other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, 6, true)         , 'coucou');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 6, 28, true)        , ' donotcutme  donotcut ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 6, undefined, true) , ' donotcutme  donotcut   other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', '6', '28', true)    , ' donotcutme  donotcut ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 28, 1000, true)     , '  other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 28, 35, true)       , '  other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', '0', '20', 'true')  , 'coucou donotcutme  ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', '6', '28', true)    , ' donotcutme  donotcut ');

      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -2, true)    , 'coucou donotcutme  donotcut   ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -1, true)    , 'coucou donotcutme  donotcut   ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -5, true)    , 'coucou donotcutme  donotcut   ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -6, true)    , 'coucou donotcutme  donotcut  ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -7, true)    , 'coucou donotcutme  donotcut ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -8, true)    , 'coucou donotcutme  donotcut');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', '0', '-8', true), 'coucou donotcutme  donotcut');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', 0, -9, true)    , 'coucou donotcutme  ');

      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -16, 28, true)    , 'donotcut ');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -16, 100, true)    , 'donotcut   other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -9, 100, true)    , '   other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -8, 100, true)    , '   other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -6, 100, true)    , ' other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -5, 100, true)    , 'other');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -4, 100, true)    , '');
      helper.assert(stringFormatter.substr('coucou donotcutme  donotcut   other', -1, 100, true)    , '');
    });
  });

  describe('ellipsis', function () {
    it('should cut the text and add dots', function () {
      helper.assert(stringFormatter.ellipsis('coucou', 3), 'cou...');
      helper.assert(stringFormatter.ellipsis('coucou', 5), 'couco...');
      helper.assert(stringFormatter.ellipsis('coucou', 6), 'coucou');
      helper.assert(stringFormatter.ellipsis('coucou', 7), 'coucou');
      helper.assert(stringFormatter.ellipsis('coucou ', 7), 'coucou ');
      helper.assert(stringFormatter.ellipsis('coucou  ', 7), 'coucou ...');
    });
    it('should not crash if data is null or undefined', function () {
      helper.assert(stringFormatter.ellipsis(null, 0), null);
      helper.assert(stringFormatter.ellipsis(undefined, 0), undefined);
    });
    it('works only on string', function () {
      helper.assert(stringFormatter.ellipsis(30, 0), 30);
    });
  });

  describe('padl', function () {
    it('should be up to the target length with padding string to complete', () => {
      helper.assert(stringFormatter.padl('coucou', 6), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padl('coucou', 7), ' coucou', 'one more length, adding one space before');
      helper.assert(stringFormatter.padl('coucou', 7, 'x'), 'xcoucou', 'one more length, adding one padding string "x" before');
      helper.assert(stringFormatter.padl('coucou', '10', 'x'), 'xxxxcoucou', 'one more length, adding padding string "x" before');
      helper.assert(stringFormatter.padl('coucou', 6, 'x'), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padl('coucou', 3), 'coucou', 'lower target length, no change');
      helper.assert(stringFormatter.padl('coucou', 3, 'x'), 'coucou', 'lower target length with padding string defined, no change');
    });
    it('should accept numbers, strings for all parameters and accept 0 for the padding string', () => {
      helper.assert(stringFormatter.padl(  1223,  8 ,  0 ), '00001223');
      helper.assert(stringFormatter.padl(  1223,  8 , '0'), '00001223');
      helper.assert(stringFormatter.padl(  1223, '8', '0'), '00001223');
      helper.assert(stringFormatter.padl('1223', '8', '0'), '00001223');
      helper.assert(stringFormatter.padl('1223', '8',  0 ), '00001223');
      helper.assert(stringFormatter.padl('1223',  8 , '0'), '00001223');
    });
    it('should not crash if data is null or undefined', () => {
      helper.assert(stringFormatter.padl(null, 0), null, 'if data is null, not a string so return null 1');
      helper.assert(stringFormatter.padl(null, 4), null, 'if data is null, not a string so return null 2');
      helper.assert(stringFormatter.padl(null, 5), null, 'if data is null, not a string so return null 3');
      helper.assert(stringFormatter.padl(null, 0, 'x'), null, 'if data is null, not a string so return null 4');
      helper.assert(stringFormatter.padl(null, 5, 'x'), null, 'if data is null, not a string so return null 5');
      helper.assert(stringFormatter.padl(undefined, 0), undefined, 'if data is undefined, not a string so return undefined 1');
      helper.assert(stringFormatter.padl(undefined, 9), undefined, 'if data is undefined, not a string so return undefined 2');
      helper.assert(stringFormatter.padl(undefined, 10), undefined, 'if data is undefined, not a string so return undefined 3');
      helper.assert(stringFormatter.padl(undefined, 9, 'x'), undefined, 'if data is undefined, not a string so return undefined 4');
      helper.assert(stringFormatter.padl(undefined, 10, 'x'), undefined, 'if data is undefined, not a string so return undefined 5');
    });
    it('should not crash if data is object', () => {
      helper.assert(stringFormatter.padl({id : 2}, 5), {id : 2}, 'if data is object, should return it with no change');
    });
    it('should not crash if data is array', () => {
      helper.assert(stringFormatter.padl([{id : 1}], 5), [{id : 1}], 'if data is array, should return it with no change');
    });
  });
  describe('padr', function () {
    it('should be up to the target length with padding string to complete', () => {
      helper.assert(stringFormatter.padr('coucou', 6), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padr('coucou', 7), 'coucou ', 'one more length, adding one space before');
      helper.assert(stringFormatter.padr('coucou', 7, 'x'), 'coucoux', 'one more length, adding one padding string "x" before');
      helper.assert(stringFormatter.padr('coucou', 10, 'x'), 'coucouxxxx', 'one more length, adding padding string "x" before');
      helper.assert(stringFormatter.padr('coucou', 6, 'x'), 'coucou', 'same length, no change');
      helper.assert(stringFormatter.padr('coucou', 3), 'coucou', 'lower target length, no change');
      helper.assert(stringFormatter.padr('coucou', 3, 'x'), 'coucou', 'lower target length with padding string defined, no change');
    });
    it('should accept numbers, strings for all parameters and accept 0 for the padding string', () => {
      helper.assert(stringFormatter.padr(  1223,  8 ,  0 ), '12230000');
      helper.assert(stringFormatter.padr(  1223,  8 , '0'), '12230000');
      helper.assert(stringFormatter.padr(  1223, '8', '0'), '12230000');
      helper.assert(stringFormatter.padr('1223', '8', '0'), '12230000');
      helper.assert(stringFormatter.padr('1223', '8',  0 ), '12230000');
      helper.assert(stringFormatter.padr('1223',  8 , '0'), '12230000');
    });
    it('should not crash if data is null or undefined', () => {
      helper.assert(stringFormatter.padr(null, 0), null, 'if data is null, not a string so return null 1');
      helper.assert(stringFormatter.padr(null, 4), null, 'if data is null, not a string so return null 2');
      helper.assert(stringFormatter.padr(null, 5), null, 'if data is null, not a string so return null 3');
      helper.assert(stringFormatter.padr(null, 0, 'x'), null, 'if data is null, not a string so return null 4');
      helper.assert(stringFormatter.padr(null, 5, 'x'), null, 'if data is null, not a string so return null 5');
      helper.assert(stringFormatter.padr(undefined, 0), undefined, 'if data is undefined, not a string so return undefined 1');
      helper.assert(stringFormatter.padr(undefined, 9), undefined, 'if data is undefined, not a string so return undefined 2');
      helper.assert(stringFormatter.padr(undefined, 10), undefined, 'if data is undefined, not a string so return undefined 3');
      helper.assert(stringFormatter.padr(undefined, 9, 'x'), undefined, 'if data is undefined, not a string so return undefined 4');
      helper.assert(stringFormatter.padr(undefined, 10, 'x'), undefined, 'if data is undefined, not a string so return undefined 5');
    });
    it('should not crash if data is object', () => {
      helper.assert(stringFormatter.padr({id : 2}, 5), {id : 2}, 'if data is object, should return it with no change');
    });
    it('should not crash if data is array', () => {
      helper.assert(stringFormatter.padr([{id : 1}], 5), [{id : 1}], 'if data is array, should return it with no change');
    });
  });

  describe('arrayMap', function () {
    it('should flatten the each object of the array (only the first level, ignoring sub arrays, sub objects,...)', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}, arr : [12, 23]},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}, arr : [12, 23]}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas), '2:car:toy, 3:plane:concept');
    });
    it('should accept array of strings', function () {
      var _datas = ['car', 'plane', 'toy', 42];
      helper.assert(arrayFormatter.arrayMap(_datas), 'car, plane, toy, 42');
    });
    it('should change object and attribute separators', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; '), '2 ; car ; toy | 3 ; plane ; concept');
      helper.assert(arrayFormatter.arrayMap(_datas, '', ''), '2cartoy3planeconcept');
    });
    it('should print only given attribute', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ' | ', ' ; ', 'name'), 'car | plane');
    });
    it('should print a list of given attribute in the same order', function () {
      var _datas = [
        {id : 2, name : 'car'  , type : 'toy'    , sub : {id : 3}},
        {id : 3, name : 'plane', type : 'concept', sub : {id : 3}}
      ];
      helper.assert(arrayFormatter.arrayMap(_datas, ', ', ':', 'name', 'id', 'type'), 'car:2:toy, plane:3:concept');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(arrayFormatter.arrayMap(null), null);
      helper.assert(arrayFormatter.arrayMap(undefined), undefined);
      helper.assert(arrayFormatter.arrayMap(120), 120);
      helper.assert(arrayFormatter.arrayMap([]), '');
      helper.assert(arrayFormatter.arrayMap({}), {});
    });
  });

  describe('arrayJoin', function () {
    it('should flatten the array of string', function () {
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas), '1, 2, hey!');
    });
    it('should change separator', function () {
      var _datas = ['1', '2', 'hey!'];
      helper.assert(arrayFormatter.arrayJoin(_datas, ''), '12hey!');
      helper.assert(arrayFormatter.arrayJoin(_datas, ' | '), '1 | 2 | hey!');
      helper.assert(arrayFormatter.arrayJoin(_datas, '\\n'), '1\n2\nhey!');
    });
    it('should select and print only items from index', function () {
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 0), '1234');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1), '234');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, 1), '2');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, 2), '23');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, -1), '23');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, -2), '2');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, 0), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 1, 100), '234');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 2), '34');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 3), '4');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 4), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 5), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', '1', '0'), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', '1'), '234');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', '1', '1'), '2');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', '1', '2'), '23');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', '1', '100'), '234');
    });
    it('should not crash if datas is null or undefined', function () {
      helper.assert(arrayFormatter.arrayJoin(null), null);
      helper.assert(arrayFormatter.arrayJoin(undefined), undefined);
      helper.assert(arrayFormatter.arrayJoin(120), 120);
      helper.assert(arrayFormatter.arrayJoin([]), '');
      helper.assert(arrayFormatter.arrayJoin({}), {});
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', null, null), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', {}, {}), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', [], []), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', 'null', 'null'), '');
      helper.assert(arrayFormatter.arrayJoin(['1', '2', '3', '4'], '', -2, -2), '');
    });
  });

  describe('convCurr', function () {
    it('should return the same value if the currency source is the same as the currency target', function () {
      var _this = {currency : { source : 'EUR', target : 'EUR', rates : {EUR : 1, USD : 1.14, GBP : 0.89} }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1), 10.1);
    });

    it('should not crash if value or rate is null or undefined', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, null), 0);

      _this = {currency : { source : null, target : null, rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10), 10);
    });

    it('should convert currency', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1), 11.514);

      _this = {currency : { source : 'USD', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 11.514), 10.1);

      _this = {currency : { source : 'GBP', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4), 125.5);

      _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 125.5), 143.07);

      _this = {currency : { source : 'GBP', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4), 143.07);
    });

    it('should accept to change target in the formatter', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 10.1, 'GBP'), 8.08);
    });

    it('should accept to change source in the formatter', function () {
      var _rates = {EUR : 1, USD : 1.14, GBP : 0.8};
      var _this = {currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.convCurr.call(_this, 100.4, 'EUR', 'GBP'), 125.5);
    });
  });

  describe('formatN', function () {
    it('should format number according to the locale a percentage', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, 1), '10 000,1');
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, '1'), '10 000,1');
      helper.assert(numberFormatter.formatN.call(_this, 10000.1), '10 000,100');
      helper.assert(numberFormatter.formatN.call(_this, null, 1), null);
      helper.assert(numberFormatter.formatN.call(_this, undefined, 1), undefined);
      helper.assert(numberFormatter.formatN.call(_this, 10000.30202, 5), '10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, -10000.30202, 5), '-10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, -10000.30202, '5'), '-10 000,30202');
      helper.assert(numberFormatter.formatN.call(_this, '-10000.30202', '5'), '-10 000,30202');

      _this = {lang : 'en-gb'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.1, 1), '10,000.1');
      helper.assert(numberFormatter.formatN.call(_this, '10000000.1', 1), '10,000,000.1');
    });

    it.skip('should keep maximal precision if precision is not defined', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 10000.12345566789), '10 000,12345566789');
    });

    it('should round number', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.formatN.call(_this, 222.1512, 2), '222,15');
      helper.assert(numberFormatter.formatN.call(_this, 222.1552, 2), '222,16');

      helper.assert(numberFormatter.formatN.call(_this, 1.005, 2), '1,01');
      helper.assert(numberFormatter.formatN.call(_this, 1.005, 3), '1,005');

      helper.assert(numberFormatter.formatN.call(_this, -1.005, 3), '-1,005');
      helper.assert(numberFormatter.formatN.call(_this, -1.006, 2), '-1,01');
    });
  });

  describe('abs', function () {
    it('should return absolute value of a number', function () {
      helper.assert(numberFormatter.abs(10000.1), 10000.1);
      helper.assert(numberFormatter.abs(-10000.1), 10000.1);
      helper.assert(numberFormatter.abs(null), null);
      helper.assert(numberFormatter.abs(undefined), undefined);
      helper.assert(numberFormatter.abs({}), null);
      helper.assert(numberFormatter.abs([]), null);
      helper.assert(numberFormatter.abs('20'), 20);
      helper.assert(numberFormatter.abs('-20.5454'), 20.5454);
    });
  });

  describe('round', function () {

    it('should round number', function () {
      var _this = {lang : 'fr'};
      helper.assert(numberFormatter.round.call(_this, 222.1512, 2), 222.15);
      helper.assert(numberFormatter.round.call(_this, 222.1552, 2), 222.16);

      helper.assert(numberFormatter.round.call(_this, 1.005, 2), 1.01);
      helper.assert(numberFormatter.round.call(_this, 1.005, 3), 1.005);

      helper.assert(numberFormatter.round.call(_this, -1.005, 3), -1.005);
      helper.assert(numberFormatter.round.call(_this, -1.006, 2), -1.01);
      helper.assert(numberFormatter.round.call(_this, -1.005, 2), -1);
    });
  });

  describe('formatC', function () {
    it('should format number according to the locale, currencyTarget, and set automatically the precision', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '$10,000.10');

      _this.currency.target = 'EUR';
      helper.assert(numberFormatter.formatC.call(_this, 10000.155), '€10,000.16');

      _this.lang = 'fr-fr';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '10 000,10 €');
      helper.assert(numberFormatter.formatC.call(_this, -10000.1), '-10 000,10 €');

      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');

      helper.assert(numberFormatter.formatC.call(_this, null, 1), null);
      helper.assert(numberFormatter.formatC.call(_this, undefined, 1), undefined);
    });

    it('should change currency output format', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'dollars');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'M'), 'dollar');
      helper.assert(numberFormatter.formatC.call(_this, 10.15678, 5), '$10.15678');
      helper.assert(numberFormatter.formatC.call(_this, 10.15678, 'LL'), '10.16 dollars');
      _this.currency.target = 'EUR';
      _this.lang = 'fr-fr';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'L'), '10 000,10 €');
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'LL'), '10 000,10 euros');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'LL'), '1,00 euro');
    });

    it('should convert currency automatically if target != source using rates', function () {
      var _rates = {EUR : 1, USD : 2, GBP : 10};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '$20,000.20');
      _this.currency.target = 'GBP';
      helper.assert(numberFormatter.formatC.call(_this, 10000.1), '£100,001.00');
    });

    it('should convert to crypto-currencies/USD by using rates (USD to BTC/ETH AND BTC/ETH to USD)', function () {
      var _rates = {USD : 1, BTC : 0.000102618, ETH : 0.003695354, XMR : 0.01218769 };
      /**  USD to BTC */
      var _this = {lang : 'en-us', currency : { source : 'USD', target : 'BTC', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 1255), '₿0.12878559');
      /**  USD to ETH */
      _this.currency.target = 'ETH';
      helper.assert(numberFormatter.formatC.call(_this, 32.41), 'Ξ0.119766423');
      /** USD to XMR */
      _this.currency.target = 'XMR';
      helper.assert(numberFormatter.formatC.call(_this, 383991.32), 'XMR4,679.96717085');
      /**  BTC to USD */
      _rates = {USD : 9736.03, BTC : 1};
      _this = {lang : 'en-us', currency : { source : 'BTC', target : 'USD', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 2.3155321), '$22,544.09');
      /** ETH to USD */
      _this.currency.source = 'ETH';
      _this.currency.rates = { USD : 247.37, ETH : 1 };
      helper.assert(numberFormatter.formatC.call(_this, 0.54212345), '$134.11');
    });

    it('should accept custom format', function () {
      var _rates = {EUR : 1, USD : 1, GBP : 1};
      var _this = {lang : 'fr-fr', currency : { source : 'EUR', target : 'EUR', rates : _rates }};
      helper.assert(numberFormatter.formatC.call(_this, 10000.1, 'M'), 'euros');
      helper.assert(numberFormatter.formatC.call(_this, 1, 'M'), 'euro');
    });

    it('should be fast', function () {
      var _rates = {EUR : 1, USD : 2, GBP : 10};
      var _this = {lang : 'en-us', currency : { source : 'EUR', target : 'USD', rates : _rates }};
      var _loops = 10000;
      var _res = [];
      var _start = process.hrtime();
      for (var i = 0; i < _loops; i++) {
        _res.push(numberFormatter.formatC.call(_this, 10000.1));
      }
      var _diff = process.hrtime(_start);
      var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
      console.log('\n formatC number speed : ' + _elapsed + ' ms (around 30ms for 10k) \n');
      helper.assert(_elapsed < (70 * helper.CPU_PERFORMANCE_FACTOR), true, 'formatC is too slow');
    });
  });

  describe('Number operations', function () {
    it('should add number', function () {
      helper.assert(numberFormatter.add('120', '67'), 187);
    });

    it('should substract number', function () {
      helper.assert(numberFormatter.sub('120', '67'), 53);
    });

    it('should multiply number', function () {
      helper.assert(numberFormatter.mul('120', '67'), 8040);
    });

    it('should divide number', function () {
      helper.assert(numberFormatter.div('120', '80'), 1.5);
    });

    it('should modulo number', function () {
      helper.assert(numberFormatter.mod(-2, 0), null);
      helper.assert(numberFormatter.mod(-2, 2), 0);
      helper.assert(numberFormatter.mod(-1, 2), -1);
      helper.assert(numberFormatter.mod(0, 2), 0);
      helper.assert(numberFormatter.mod(1, 2), 1);
      helper.assert(numberFormatter.mod(2, 2), 0);
      helper.assert(numberFormatter.mod(16, 4), 0);
      helper.assert(numberFormatter.mod(17, 4), 1);
      helper.assert(numberFormatter.mod(18, 4), 2);
      helper.assert(numberFormatter.mod(19, 4), 3);
      helper.assert(numberFormatter.mod('-2', '2'), 0);
      helper.assert(numberFormatter.mod('-1', '2'), -1);
      helper.assert(numberFormatter.mod('0', '2'), 0);
      helper.assert(numberFormatter.mod('1', '2'), 1);
      helper.assert(numberFormatter.mod('2', '2'), 0);
      helper.assert(numberFormatter.mod('16', '4'), 0);
      helper.assert(numberFormatter.mod('17', '4'), 1);
      helper.assert(numberFormatter.mod('18', '4'), 2);
      helper.assert(numberFormatter.mod('19', '4'), 3);
      helper.assert(numberFormatter.mod(1.8, 1.1), 0.7);
      helper.assert(numberFormatter.mod(undefined, 1.1), undefined);
      helper.assert(numberFormatter.mod(null, 1.1), null);
    });
  });

  describe('Barcodes', function () {

    describe('Barcode as a font', function () {
      it('should return an empty string with a undefined barcode format', () => {
        helper.assert(barcodeFormatter.barcode(), '');
        helper.assert(barcodeFormatter.barcode(true, true, true), '');
        helper.assert(barcodeFormatter.barcode('fweffewfweq'), '');
      });

      it('should format the ean13 barcode to EAN13.TTF code (ean13 format)', () => {
        helper.assert(barcodeFormatter.barcode('9780201134476', 'ean13'), '9HSKCKB*bdeehg+');
        helper.assert(barcodeFormatter.barcode('8056459824973', 'ean13'), '8APGOPJ*icejhd+');
      });

      it('should return an empty string with a string of letters (ean13 format)', () => {
        helper.assert(barcodeFormatter.barcode('fweffewfweq', 'ean13'), '');
      });

      it('should return an empty string with less than 13 numbers (ean13 format)', () => {
        helper.assert(barcodeFormatter.barcode('805645982497', 'ean13'), '');
      });

      it('should format the ean8 barcode to EAN13.TTF code (ean8 format)',  () => {
        helper.assert(barcodeFormatter.barcode('96385074', 'ean8'), ':JGDI*fahe+');
        helper.assert(barcodeFormatter.barcode('35967101', 'ean8'), ':DFJG*hbab+');
      });

      it('should return an empty string with a string of letters (ean8 format)', () => {
        helper.assert(barcodeFormatter.barcode('fweffewfweq', 'ean8'), '');
      });

      it('should return an empty string with less than 8 numbers (ean8 format)', () => {
        helper.assert(barcodeFormatter.barcode('8056', 'ean8'), '');
      });

      it('should format the code39 barcode to CODE39.TTF code (code39 format)',  () => {
        helper.assert(barcodeFormatter.barcode('GSJ-220097', 'code39'), '*GSJ-220097*');
        helper.assert(barcodeFormatter.barcode('96385074', 'code39'), '*96385074*');
        helper.assert(barcodeFormatter.barcode('ASDFGHJKLZXCVBNQWERTYUIOP-.$/+% ', 'code39'), '*ASDFGHJKLZXCVBNQWERTYUIOP-.$/+% *');
      });

      it('should return an empty string with a wrong character (code39 format)', () => {
        helper.assert(barcodeFormatter.barcode('80a56', 'code39'), '');
        helper.assert(barcodeFormatter.barcode('w8056', 'code39'), '');
        helper.assert(barcodeFormatter.barcode('8056,', 'code39'), '');
        helper.assert(barcodeFormatter.barcode('', 'code39'), '');
        helper.assert(barcodeFormatter.barcode(null, 'code39'), '');
      });

      it('should format the ean128 barcode to EAN128.TTF code (ean128 format)',  () => {
        helper.assert(barcodeFormatter.barcode('3754 KC 75', 'ean128'), 'ÒEVÍ KC 75)Ó');
        helper.assert(barcodeFormatter.barcode('3754KC75', 'ean128'), 'ÒEVÍKC75QÓ');
        helper.assert(barcodeFormatter.barcode('0312345600001', 'ean128'), 'Ò#,BX  Í1ZÓ');
        helper.assert(barcodeFormatter.barcode('(15)071231(10)LOTA', 'ean128'), "Ñ(15)Ì',?Í(10)LOTASÓ");
        helper.assert(barcodeFormatter.barcode('DR39', 'ean128'), 'ÑDR39xÓ');
        helper.assert(barcodeFormatter.barcode('ZB65', 'ean128'), 'ÑZB65gÓ');
        helper.assert(barcodeFormatter.barcode('~2020112345678901231', 'ean128'), 'Ñ~Ì44+7Mcy!7Í1PÓ');
        helper.assert(barcodeFormatter.barcode('(01)12345678901231', 'ean128'), 'Ñ(01)Ì,BXnz,?xÓ');
        helper.assert(barcodeFormatter.barcode('00 12345678 0000000001', 'ean128'), 'Ñ00 Ì,BXnÍ Ì    !6Ó');
        helper.assert(barcodeFormatter.barcode('[FNC1] 21 12345 [FNC1] 11 (01)123', 'ean128'), 'Ñ[FNC1] 21 12345 [FNC1] 11 (01)123;Ó');
      });

      it('should return an empty string with a wrong arguments (ean128 format)', () => {
        helper.assert(barcodeFormatter.barcode(null, 'ean128'), '');
        helper.assert(barcodeFormatter.barcode(undefined, 'ean128'), '');
        helper.assert(barcodeFormatter.barcode('', 'ean128'), '');
      });

      it('should be fast to format ean128 barcode',  () => {
        let _loops = 10000;
        let _res = [];
        let _start = process.hrtime();
        let _barcodes  = ['00 12345678 0000000001', '(15)071231(10)LOTA', 'DR39'];
        for (let i = 0; i < _loops; i++) {
          _res.push(barcodeFormatter.barcode(_barcodes[i%3], 'ean128'));
        }
        let _diff = process.hrtime(_start);
        let _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
        console.log('\n barcode e128 number speed : ' + _elapsed + ' ms (around 30ms for 10k) \n');
        helper.assert(_elapsed < (50 * helper.CPU_PERFORMANCE_FACTOR), true, 'barcode(ean128) is too slow');
      });
    });

    describe('Barcode as an Image', function () {
      describe(':barcode and :isImage formatters', function () {
        it('should return the barcode as JSON', function () {
          const _context = {};
          barcodeFormatter.isImage.call(_context);
          helper.assert(_context.isBarcodeImage, true);
          helper.assert(barcodeFormatter.barcode.call(_context, '978-1-56581-231-4 90000', 'isbn'), '{"bcid":"isbn","text":"978-1-56581-231-4 90000"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '2112345678900', 'ean13'), '{"bcid":"ean13","text":"2112345678900"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '02345673', 'ean8'), '{"bcid":"ean8","text":"02345673"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '5715311709768', 'code128'), '{"bcid":"code128","text":"5715311709768"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'THIS IS CODE 39', 'code39'), '{"bcid":"code39","text":"THIS IS CODE 39"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '(01)95012345678903(3103)000123', 'gs1-128'), '{"bcid":"gs1-128","text":"(01)95012345678903(3103)000123"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '(01)03453120000011(8200)http://www.abc.net(10)ABCD1234(410)9501101020917',  'gs1qrcode'), '{"bcid":"gs1qrcode","text":"(01)03453120000011(8200)http://www.abc.net(10)ABCD1234(410)9501101020917"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, '[)>^03001^02996152382802^029840^029001^0291Z00004951^029UPSN^02906X610^029159^0291234567^0291/1^029^029Y^029634 ALPHA DR^029PITTSBURGH^029PA^029^004',  'maxicode'), '{"bcid":"maxicode","text":"[)>^03001^02996152382802^029840^029001^0291Z00004951^029UPSN^02906X610^029159^0291234567^0291/1^029^029Y^029634 ALPHA DR^029PITTSBURGH^029PA^029^004"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'SPC\n0200\n1\nCH5800791123000889012\nS\nRobert Schneider AG\nRue du Lac\n1268\n2501\nBiel\nCH\n\n199.95\nCHF\nKPia-Maria Rutschmann-Schnyder\nGrosse Marktgasse 28\n9400 Rorschach\n\n\nCH\nSCOR\nRF18539007547034\n\nEPD\n',  'swissqrcode'), '{"bcid":"swissqrcode","text":"SPC\\n0200\\n1\\nCH5800791123000889012\\nS\\nRobert Schneider AG\\nRue du Lac\\n1268\\n2501\\nBiel\\nCH\\n\\n199.95\\nCHF\\nKPia-Maria Rutschmann-Schnyder\\nGrosse Marktgasse 28\\n9400 Rorschach\\n\\n\\nCH\\nSCOR\\nRF18539007547034\\n\\nEPD\\n"}');
        });

        it('should return the barcode as JSON and CAST integer values as strings', function () {
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 15854377, 'code39'), '{"bcid":"code39","text":"15854377"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 2112345678900, 'ean13'), '{"bcid":"ean13","text":"2112345678900"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 5715311709768, 'code128'), '{"bcid":"code128","text":"5715311709768"}');
        });

        it('should return the barcode as JSON with options and should validate options', function () {
          // svg
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'svg:true'), '{"bcid":"qrcode","text":"https://carbone.io","svg":true}', );
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'svg:false'), '{"bcid":"qrcode","text":"https://carbone.io","svg":false}');
          // width
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:2'), '{"bcid":"qrcode","text":"https://carbone.io","width":"2"}', );
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:100'), '{"bcid":"qrcode","text":"https://carbone.io","width":"100"}');
          // width error
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'wdth:10'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:-1'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width:    '), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'width'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // height
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:2'), '{"bcid":"qrcode","text":"https://carbone.io","height":"2"}', );
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:100'), '{"bcid":"qrcode","text":"https://carbone.io","height":"100"}');
          // height error
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'heght:10'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:-1'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height:    '), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'height'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // scale
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:1'), '{"bcid":"qrcode","text":"https://carbone.io","scale":"1"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:10'), '{"bcid":"qrcode","text":"https://carbone.io","scale":"10"}');
          // scale error
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:0'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:11'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'scale'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // includetext
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext:true'), '{"bcid":"qrcode","text":"https://carbone.io","includetext":true}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext:false'), '{"bcid":"qrcode","text":"https://carbone.io","includetext":false}');
          // includetext errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext::'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includetext:faalse'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'includeetext:false'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // textsize
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:2'), '{"bcid":"qrcode","text":"https://carbone.io","textsize":"2"}', );
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:100'), '{"bcid":"qrcode","text":"https://carbone.io","textsize":"100"}');
          // textsize error
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsiz:10'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:-1'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize:    '), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textsize'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // textxalign
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:left'), '{"bcid":"qrcode","text":"https://carbone.io","textxalign":"left"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:center'), '{"bcid":"qrcode","text":"https://carbone.io","textxalign":"center"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:right'), '{"bcid":"qrcode","text":"https://carbone.io","textxalign":"right"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:justify'), '{"bcid":"qrcode","text":"https://carbone.io","textxalign":"justify"}');
          // textxalign errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:middle'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textxalign'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // textyalign
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign:below'), '{"bcid":"qrcode","text":"https://carbone.io","textyalign":"below"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign:center'), '{"bcid":"qrcode","text":"https://carbone.io","textyalign":"center"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign:above'), '{"bcid":"qrcode","text":"https://carbone.io","textyalign":"above"}');
          // textyalign errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign:left'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textyalign'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // rotate
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:N'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"N"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:R'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"R"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:L'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"L"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:I'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"I"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:n'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"N"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:r'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"R"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:l'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"L"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:i'), '{"bcid":"qrcode","text":"https://carbone.io","rotate":"I"}');
          // rotate error
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:ii'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:NN'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:inverse'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'rotate'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // textcolor
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","textcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:#ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","textcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:#1FDE25'), '{"bcid":"qrcode","text":"https://carbone.io","textcolor":"1FDE25"}');
          // textcolor errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:##ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:#ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'textcolor'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // barcolor
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","barcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:#ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","barcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:#1FDE25'), '{"bcid":"qrcode","text":"https://carbone.io","barcolor":"1FDE25"}');
          // barcolor errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:##ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:#ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'barcolor'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // backgroundcolor
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","backgroundcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:#ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io","backgroundcolor":"ff00ff"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:#1FDE25'), '{"bcid":"qrcode","text":"https://carbone.io","backgroundcolor":"1FDE25"}');
          // backgroundcolor errors
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:##ff00ff'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:#ff00f'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:abc'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor:'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'backgroundcolor'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          // eclevel - specify the error correction level ONLY FOR QRCODE
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevelQ'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'ecleel:Q'), '{"bcid":"qrcode","text":"https://carbone.io"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:h'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"H"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:H'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"H"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:m'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"M"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:M'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"M"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:l'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"L"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:L'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"L"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:q'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"Q"}');
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode', 'eclevel:Q'), '{"bcid":"qrcode","text":"https://carbone.io","eclevel":"Q"}');

          // Mix with an option "round" which does not exist
          helper.assert(barcodeFormatter.barcode.call({ isBarcodeImage : true }, 'https://carbone.io', 'qrcode',
            'width:20', 'height:6', 'scale:5', 'includetext:true', 'textsize:2', 'textxalign:right', 'rotate:R', 'textcolor:#ffffff', 'barcolor:#D8D8D8', 'backgroundcolor:#00ff08', 'round:true'),
            '{"bcid":"qrcode","text":"https://carbone.io","width":"20","height":"6","scale":"5","includetext":true,"textsize":"2","textxalign":"right","rotate":"R","textcolor":"ffffff","barcolor":"D8D8D8","backgroundcolor":"00ff08"}');
        });
      });

      describe('generateBarcodeImage', function () {

        it('should return an error if the bcid (barcode ID) is empty', function (done) {
          barcodeFormatter.generateBarcodeImage('{"bcid":"","text":"2112345678900"}', function (err) {
            helper.assert(err, 'Barcode generation error: Error: bwipp.undefinedEncoder: bcid is not defined');
            done();
          });
        });

        it('should return an error if the text is empty', function (done) {
          barcodeFormatter.generateBarcodeImage('{"bcid":"ean13","text":""}', function (err) {
            helper.assert(err, 'Barcode generation error: ReferenceError: bwip-js: bar code text not specified.');
            done();
          });
        });

        it('should return an error if the barcode is not an URL param format', function (done) {
          barcodeFormatter.generateBarcodeImage('{==This is not valid==}', function (err) {
            helper.assert(err, 'Barcode read values: SyntaxError: Unexpected token = in JSON at position 1');
            done();
          });
        });

        it('should generate all barcodes as base64 image from a url parameter format', (done) => {
          var _start = process.hrtime();
          const _originalBarcodeList = [...barcodeFormatter.supportedBarcodes];

          function unpackBarcode (barcodesList) {
            if (barcodesList.length === 0) {
              var _diff = process.hrtime(_start);
              var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
              console.log('\n Generale all barcodes speed :  ' + _elapsed + ' ms total / Average of ' + (_elapsed / barcodeFormatter.supportedBarcodes.length) + ' ms per barcode \n');
              helper.assert(_elapsed < (2000 * helper.CPU_PERFORMANCE_FACTOR), true);
              return done();
            }
            const _barcodeKey = JSON.stringify({bcid : barcodesList[0].sym, text : barcodesList[0].text });
            var _startBarcodeGeneration = process.hrtime();
            barcodeFormatter.generateBarcodeImage(_barcodeKey, function (err, image) {
              var _diffBarcodeGeneration = process.hrtime(_startBarcodeGeneration);
              var _elapsedBarcodeGeneration = ((_diffBarcodeGeneration[0] * 1e9 + _diffBarcodeGeneration[1]) / 1e6);
              console.log(barcodesList[0].sym + ' speed :  ' + _elapsedBarcodeGeneration + ' ms total');
              helper.assert(err, null);
              helper.assert(image.data.toString('base64').length > 0, true);
              helper.assert(image.extension, 'png');
              helper.assert(image.mimetype, 'image/png');
              barcodesList.shift();
              unpackBarcode(barcodesList);
            });
          }

          unpackBarcode(_originalBarcodeList);
        });
      });

      describe('initBarcodeValuesBasedOnType', function () {
        it('should return the default barcode options', function () {
          const _barcodeOptions = barcodeFormatter.initBarcodeValuesBasedOnType('ean13');
          helper.assert(_barcodeOptions.scale, 3);
          helper.assert(_barcodeOptions.rotate, 'N');
          helper.assert(_barcodeOptions.includetext, true);
          helper.assert(_barcodeOptions.textxalign, 'center');
        });

        it('should return the default barcode options with "mailmark" special case', function () {
          const _barcodeOptions = barcodeFormatter.initBarcodeValuesBasedOnType('mailmark');
          helper.assert(_barcodeOptions.scale, 3);
          helper.assert(_barcodeOptions.rotate, 'N');
          helper.assert(_barcodeOptions.includetext, true);
          helper.assert(_barcodeOptions.textxalign, 'center');
          helper.assert(_barcodeOptions.type, '9');
        });

        it('should return the default barcode options with "rectangularmicroqrcode" special case', function () {
          const _barcodeOptions = barcodeFormatter.initBarcodeValuesBasedOnType('rectangularmicroqrcode');
          helper.assert(_barcodeOptions.scale, 3);
          helper.assert(_barcodeOptions.rotate, 'N');
          helper.assert(_barcodeOptions.includetext, true);
          helper.assert(_barcodeOptions.textxalign, 'center');
          helper.assert(_barcodeOptions.version, 'R17x139');
        });

        it('should return the default barcode options with "gs1-cc" special case', function () {
          const _barcodeOptions = barcodeFormatter.initBarcodeValuesBasedOnType('gs1-cc');
          helper.assert(_barcodeOptions.scale, 3);
          helper.assert(_barcodeOptions.rotate, 'N');
          helper.assert(_barcodeOptions.includetext, true);
          helper.assert(_barcodeOptions.textxalign, 'center');
          helper.assert(_barcodeOptions.ccversion, 'b');
          helper.assert(_barcodeOptions.cccolumns, 4);
        });

        it('should return the default barcode options with "maxicode" special case', function () {
          const _barcodeOptions = barcodeFormatter.initBarcodeValuesBasedOnType('maxicode');
          helper.assert(_barcodeOptions.scale, 3);
          helper.assert(_barcodeOptions.rotate, 'N');
          helper.assert(_barcodeOptions.includetext, true);
          helper.assert(_barcodeOptions.textxalign, 'center');
          helper.assert(_barcodeOptions.mode, 2);
          helper.assert(_barcodeOptions.parse, true);
        });
      });
    });
  });
});

/**
 * Call a formatter, passing `context` object as `this`
 * @param  {Function} func    formatter to call
 * @param  {Object} context   object
 * @return {Mixed}            [description]
 */
function callWithContext (func, context) {
  context.stopPropagation = false; // reset propagation
  var _args = Array.prototype.slice.call(arguments);
  return func.apply(context, _args.slice(2));
}
