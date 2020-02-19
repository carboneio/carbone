var postprocessor = require('../lib/postprocessor');
var helper = require('../lib/helper');
var dynpics = require('../lib/dynpics');
var fs = require('fs');
var path = require('path');

describe('postprocessor', function () {
  describe('File type checking', function () {
    const template = {
      filename   : '',
      embeddings : [],
      files      :
       [ { name     : 'META-INF/manifest.xml',
         data     : '<?xml version="1.0" encoding="UTF-8"?>',
         isMarked : true,
         parent   : '' } ],
      extension : ''
    };
    const options = {
      extension : '',
    };
    it('Throw an error when the file type is not defined on the filename extension and the options object.', function (done) {
      template.filename = './template';
      options.extension = '',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(/Error: The file type is not defined on the filename extension or on the option object.*/.test(err), true);
        helper.assert(undefined, response);
        done();
      });
    });

    it('Return a valid template if the file type is defined on the file name extension', function (done) {
      template.filename = './template.ods';
      options.extension = '',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(err, null);
        helper.assert(JSON.stringify(template), JSON.stringify(response));
        done();
      });
    });

    it('Return a valid template if the file type is defined on the options object.', function (done) {
      template.filename = './template';
      options.extension = 'ods',
      postprocessor.execute(template, {}, options, function (err, response) {
        helper.assert(err, null);
        helper.assert(JSON.stringify(template), JSON.stringify(response));
        done();
      });
    });
  });

  describe('Dynamic pictures', function () {
    describe.only('Parse a base64 data-uri into an object descriptor', function () {
      // png, jpeg, GIF, BMP, non picture format (html), strange base64, différent mimetypes
      it('should parse base64 PNG (1)', function () {
        const _base64Picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ7SURBVDjLjZNPSFRRFMZ/9/2Z90anRlKzMS1UjFyoWS3U2oVQ0KIWrXJRFC7KTdRCqUWQkBt34aKN1a5FEUkRLbKFiBAoVi4kUQIbtfwz0zjjezPv3ttCwyYr+jibs7g/vu+cc8XDwbE+pcT5TFa5fsB26fzWtsC1Gbh85vA1AEtp0X76WGWp67pCCJN/yVMggxxP30xfADYAGV85juOKR29X8VgmJaaoKvtK2E4SaMXK9zCT01EKdB0Wxdw4V4VUQvyEWtkADMPEEJA1Fqgq+YoT+kzSTxHIAMtxqK6MMTtTSFGoBKXyXVkACjAMga+/EbJXSawn8aVHNggIdBrHcUj7YYrDBhqdN5gtgBDoQOHLHF7gs57zyaoAqQCRQyuJZQi0zp+qAaD1BsCllFS6EI2NryR+IBEiRDoVIRIqxzQN0GJ7BK03IkTMvXxZWCTqzlNQaOCIgLWVAhYXYsSi1ViG2LYZS/8KsHdTHm5ibnyIokgcISW2V8q+mnYibgyp1O9nseVgarkDqRRSKQ7432ip3I8CZuYXebXWjZkoxFQRbj/wyHjezhfd87de3p3osbTWCODkxmEBYNYnyKSXceffU9LaQcP0GEuZKY7UHaViVy1Dk8/E6Mf4nebO8qLNVPnGZLgIv6SGZP1ZtGnzbvIthw42Ig1JY6wNKXI017cCXLVcWyRRuWhjWTMIsYnSPwuApeQitohwqu4SANdP3GfwQz/w3LVClnj8ZGimJSt1vdZ//gOJVCI6GR9hIj5MV9sAva8v4poOgCf03179oubO8p6KqujN1obj1O5p4tPCOCPvh5mbTfb9F2AT0gtcAXYAKaB/9F686wcCdBKN9UyNSAAAAABJRU5ErkJggg==';
        const _expectedResp ={
          data      : new Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ7SURBVDjLjZNPSFRRFMZ/9/2Z90anRlKzMS1UjFyoWS3U2oVQ0KIWrXJRFC7KTdRCqUWQkBt34aKN1a5FEUkRLbKFiBAoVi4kUQIbtfwz0zjjezPv3ttCwyYr+jibs7g/vu+cc8XDwbE+pcT5TFa5fsB26fzWtsC1Gbh85vA1AEtp0X76WGWp67pCCJN/yVMggxxP30xfADYAGV85juOKR29X8VgmJaaoKvtK2E4SaMXK9zCT01EKdB0Wxdw4V4VUQvyEWtkADMPEEJA1Fqgq+YoT+kzSTxHIAMtxqK6MMTtTSFGoBKXyXVkACjAMga+/EbJXSawn8aVHNggIdBrHcUj7YYrDBhqdN5gtgBDoQOHLHF7gs57zyaoAqQCRQyuJZQi0zp+qAaD1BsCllFS6EI2NryR+IBEiRDoVIRIqxzQN0GJ7BK03IkTMvXxZWCTqzlNQaOCIgLWVAhYXYsSi1ViG2LYZS/8KsHdTHm5ibnyIokgcISW2V8q+mnYibgyp1O9nseVgarkDqRRSKQ7432ip3I8CZuYXebXWjZkoxFQRbj/wyHjezhfd87de3p3osbTWCODkxmEBYNYnyKSXceffU9LaQcP0GEuZKY7UHaViVy1Dk8/E6Mf4nebO8qLNVPnGZLgIv6SGZP1ZtGnzbvIthw42Ig1JY6wNKXI017cCXLVcWyRRuWhjWTMIsYnSPwuApeQitohwqu4SANdP3GfwQz/w3LVClnj8ZGimJSt1vdZ//gOJVCI6GR9hIj5MV9sAva8v4poOgCf03179oubO8p6KqujN1obj1O5p4tPCOCPvh5mbTfb9F2AT0gtcAXYAKaB/9F686wcCdBKN9UyNSAAAAABJRU5ErkJggg==', 'base64'),
          mimetype  : 'image/png',
          extension : 'png',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });
      it('should parse base64 PNG (2)', function () {
        const _base64Picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        const _expectedResp ={
          data      : new Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', 'base64'),
          mimetype  : 'image/png',
          extension : 'png',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });
      it('should parse a base64 BMP', function () {
        const _base64Picture = 'data:image/x-ms-bmp;base64,Qk2aAAAAAAAAADYAAAAoAAAABQAAAPv///8BACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAASTny/0Rp9f9Vq+H/nruq/66zqf9IefL/Sz3z/0R18P+OssH/t6qo/0KJ9P8/ePD/QgD5/z6l4/+otKj/Zara/4+6uP9EpuH/n6S8/8pxpP9kv8j/lrir/5DBr//FlKX/xUSr/w==';
        const _expectedResp ={
          data      : new Buffer.from('Qk2aAAAAAAAAADYAAAAoAAAABQAAAPv///8BACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAASTny/0Rp9f9Vq+H/nruq/66zqf9IefL/Sz3z/0R18P+OssH/t6qo/0KJ9P8/ePD/QgD5/z6l4/+otKj/Zara/4+6uP9EpuH/n6S8/8pxpP9kv8j/lrir/5DBr//FlKX/xUSr/w==', 'base64'),
          mimetype  : 'image/x-ms-bmp',
          extension : 'bmp',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });
      it('should parse a base64 JPEG', function () {
        const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/CABEIAAwADQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAADAgQBBQAGBwgJCgv/xADDEAABAwMCBAMEBgQHBgQIBnMBAgADEQQSIQUxEyIQBkFRMhRhcSMHgSCRQhWhUjOxJGIwFsFy0UOSNIII4VNAJWMXNfCTc6JQRLKD8SZUNmSUdMJg0oSjGHDiJ0U3ZbNVdaSVw4Xy00Z2gONHVma0CQoZGigpKjg5OkhJSldYWVpnaGlqd3h5eoaHiImKkJaXmJmaoKWmp6ipqrC1tre4ubrAxMXGx8jJytDU1dbX2Nna4OTl5ufo6erz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAECAAMEBQYHCAkKC//EAMMRAAICAQMDAwIDBQIFAgQEhwEAAhEDEBIhBCAxQRMFMCIyURRABjMjYUIVcVI0gVAkkaFDsRYHYjVT8NElYMFE4XLxF4JjNnAmRVSSJ6LSCAkKGBkaKCkqNzg5OkZHSElKVVZXWFlaZGVmZ2hpanN0dXZ3eHl6gIOEhYaHiImKkJOUlZaXmJmaoKOkpaanqKmqsLKztLW2t7i5usDCw8TFxsfIycrQ09TV1tfY2drg4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9sAQwEEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9oADAMBAAIRAxEAAAE3c+S9dxdX/9oACAEBAAEFAtwM19vOzWl3bQbnCmC/2OGKVP8A/9oACAEDEQE/AZj+WOeKD//aAAgBAhEBPwGErzHj83//2gAIAQEABj8CltFL6Uq5cYyxA6a1ckS7hPtV06hr+FHcxpKiErGqjU8PV3CpEZKqnUqL/8QAMxABAAMAAgICAgIDAQEAAAILAREAITFBUWFxgZGhscHw0RDh8SAwQFBgcICQoLDA0OD/2gAIAQEAAT8h50BElHmnd3t4vSSY4gcAnRYhqK9wkrWOnm5S40Y3w3//2gAMAwEAAhEDEQAAEAv/xAAzEQEBAQADAAECBQUBAQABAQkBABEhMRBBUWEgcfCRgaGx0cHh8TBAUGBwgJCgsMDQ4P/aAAgBAxEBPxDPojhz5+vd/9oACAECEQE/EGxDV7/2v//aAAgBAQABPxBQcvDNsAybAgxFl2oxrkkTck4Vkr6+Wl26HFFgErYf5HmAiYmeYm//2Q==';
        const _expectedResp ={
          data      : new Buffer.from('/9j/4AAQSkZJRgABAQAASABIAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/CABEIAAwADQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAADAgQBBQAGBwgJCgv/xADDEAABAwMCBAMEBgQHBgQIBnMBAgADEQQSIQUxEyIQBkFRMhRhcSMHgSCRQhWhUjOxJGIwFsFy0UOSNIII4VNAJWMXNfCTc6JQRLKD8SZUNmSUdMJg0oSjGHDiJ0U3ZbNVdaSVw4Xy00Z2gONHVma0CQoZGigpKjg5OkhJSldYWVpnaGlqd3h5eoaHiImKkJaXmJmaoKWmp6ipqrC1tre4ubrAxMXGx8jJytDU1dbX2Nna4OTl5ufo6erz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAECAAMEBQYHCAkKC//EAMMRAAICAQMDAwIDBQIFAgQEhwEAAhEDEBIhBCAxQRMFMCIyURRABjMjYUIVcVI0gVAkkaFDsRYHYjVT8NElYMFE4XLxF4JjNnAmRVSSJ6LSCAkKGBkaKCkqNzg5OkZHSElKVVZXWFlaZGVmZ2hpanN0dXZ3eHl6gIOEhYaHiImKkJOUlZaXmJmaoKOkpaanqKmqsLKztLW2t7i5usDCw8TFxsfIycrQ09TV1tfY2drg4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9sAQwEEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9oADAMBAAIRAxEAAAE3c+S9dxdX/9oACAEBAAEFAtwM19vOzWl3bQbnCmC/2OGKVP8A/9oACAEDEQE/AZj+WOeKD//aAAgBAhEBPwGErzHj83//2gAIAQEABj8CltFL6Uq5cYyxA6a1ckS7hPtV06hr+FHcxpKiErGqjU8PV3CpEZKqnUqL/8QAMxABAAMAAgICAgIDAQEAAAILAREAITFBUWFxgZGhscHw0RDh8SAwQFBgcICQoLDA0OD/2gAIAQEAAT8h50BElHmnd3t4vSSY4gcAnRYhqK9wkrWOnm5S40Y3w3//2gAMAwEAAhEDEQAAEAv/xAAzEQEBAQADAAECBQUBAQABAQkBABEhMRBBUWEgcfCRgaGx0cHh8TBAUGBwgJCgsMDQ4P/aAAgBAxEBPxDPojhz5+vd/9oACAECEQE/EGxDV7/2v//aAAgBAQABPxBQcvDNsAybAgxFl2oxrkkTck4Vkr6+Wl26HFFgErYf5HmAiYmeYm//2Q==', 'base64'),
          mimetype  : 'image/jpeg',
          extension : 'jpeg',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });

      it('should parse a base64 JPG', function () {
        const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==';
        const _expectedResp ={
          data      : new Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==', 'base64'),
          mimetype  : 'image/jpeg',
          extension : 'jpeg',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });

      it('should parse a base64 JPEG (containing a SVG)', function () {
        const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kfr6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////////////////////////////////////////////////////////////////wAARCAAYAEADAREAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIRAAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYyJLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k=';
        const _expectedResp ={
          data      : new Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kfr6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////////////////////////////////////////////////////////////////wAARCAAYAEADAREAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIRAAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYyJLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k=', 'base64'),
          mimetype  : 'image/jpeg',
          extension : 'jpeg',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });

      it('should parse a base64 GIF', function () {
        const _base64Picture = 'data:image/gif;base64,R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=';
        const _expectedResp ={
          data      : new Buffer.from('R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=', 'base64'),
          mimetype  : 'image/gif',
          extension : 'gif',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });


      it('should parse a base64 SVG', function () {
        const _base64Picture = 'data:image/svg+xml;base64,PD94bWwgdmVyzeiBNMyw2djJoMThWNkgzeiIvPjwvZz4KPC9zdmc+Cgo=';
        const _expectedResp ={
          data      : new Buffer.from('PD94bWwgdmVyzeiBNMyw2djJoMThWNkgzeiIvPjwvZz4KPC9zdmc+Cgo=', 'base64'),
          mimetype  : 'image/svg+xml',
          extension : 'svg',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });

      it('should parse a base64 WEBP', function () {
        const _base64Picture = ' data:image/webp;base64,UklGRmABAABXRUJQVlA4WAoAAAAIAAAADAAACwAAVlA4ILAAAAAQAwCdASoNAAwAAQAcJQBOgMWQ7Aep3/gDZocmhiduB4AA/vm7/8vTphhRfc9vfQ+56+VZc0Wf6X19P8Tpt9/3Gwr/yv3q4o1kockBGd/UITeIK4uGx/kn7zYfrQx/JQhooEhSZ/H/hDqIhYXDwyHKv/H/3hHEl9XVsP8VAIfgdi5y/a/x6n8gUK8d2Kfabk97LnEH717Ts3Ef8pf+XcPeqnYTFTjy+Y/79m2LxEAAAEVYSUaKAAAARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA';
        const _expectedResp ={
          data      : new Buffer.from('UklGRmABAABXRUJQVlA4WAoAAAAIAAAADAAACwAAVlA4ILAAAAAQAwCdASoNAAwAAQAcJQBOgMWQ7Aep3/gDZocmhiduB4AA/vm7/8vTphhRfc9vfQ+56+VZc0Wf6X19P8Tpt9/3Gwr/yv3q4o1kockBGd/UITeIK4uGx/kn7zYfrQx/JQhooEhSZ/H/hDqIhYXDwyHKv/H/3hHEl9XVsP8VAIfgdi5y/a/x6n8gUK8d2Kfabk97LnEH717Ts3Ef8pf+XcPeqnYTFTjy+Y/79m2LxEAAAEVYSUaKAAAARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA', 'base64'),
          mimetype  : 'image/webp',
          extension : 'webp',
        };
        const _resp = dynpics._parseBase64Picture(_base64Picture);
        helper.assert(JSON.stringify(_resp),JSON.stringify(_expectedResp));
      });

      it('should parse an invalid base64 data-uri picture and should return an empty descriptor', function () {
        const _base64NonPictures = [
          'data:text/html;charset=utf-8,<!DOCTYPE%20html><html%20lang%3D"en"><head><title>Embedded%20Window<%2Ftitle><%2Fhead><body><h1>42<%2Fh1><%2Fbody><%2Fhtml>',
          'R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=',
          'data:,Hello World!',
          'data:text/plain;charset=utf-8;base64,VGhpcyBpcyBhIHRlc3Q=',
          'data:image/jpeg;base64,',
          'data:image/error-here;base64,'
        ];
        const _expectedResp = {
          data      : new Buffer.from('', 'base64'),
          mimetype  : '',
          extension : '',
        };
        _base64NonPictures.forEach(img => {
          helper.assert(JSON.stringify(dynpics._parseBase64Picture(img)),JSON.stringify(_expectedResp));
        });
      });
    });
    describe('ODT', function () {
      describe('Public links (can takes time to request pictures)', function () {
        var xmlContent = '<xml><draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
        var expectedXmlContent = '<xml><draw:image xlink:href="Pictures/CarbonePicture0.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="Pictures/CarbonePicture1.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="Pictures/CarbonePicture2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
        var contentTypeXml = '<Types></Types>';
        var expectedContentTypeXml = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';
        var manifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"></manifest:manifest>';
        var expectedManifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>';
        var report = {
          files : [
            {
              name : '[Content_Types].xml',
              data : contentTypeXml
            },
            {
              name : 'content.xml',
              data : xmlContent
            },
            {
              name : 'styles.xml',
              data : xmlContent
            },
            {
              name : 'META-INF/manifest.xml',
              data : manifest
            }
          ]
        };
        var expectedReport = {
          files : [
            {
              name : '[Content_Types].xml',
              data : expectedContentTypeXml
            },
            {
              name : 'content.xml',
              data : expectedXmlContent
            },
            {
              name : 'styles.xml',
              data : expectedXmlContent
            },
            {
              name : 'META-INF/manifest.xml',
              data : expectedManifest
            }
          ]
        };

        it('should replace dynpics links by embedded pictures', function (done) {
          postprocessor.embedOdtPictures(report, {}, {}, function (err, result) {
            helper.assert(dynpics.getTemplate(result, 'content.xml'), dynpics.getTemplate(expectedReport, 'content.xml'));
            done();
          });
        });

        it('should replace dynpics links by embedded pictures (in styles.xml)', function (done) {
          postprocessor.embedOdtPictures(report, {}, {}, function (err, result) {
            helper.assert(dynpics.getTemplate(result, 'styles.xml'), dynpics.getTemplate(expectedReport, 'styles.xml'));
            done();
          });
        });

        it('should add dynpics in manifest', function (done) {
          postprocessor.embedOdtPictures(report, {}, {}, function () {
            var resultManifest = dynpics.getTemplate(expectedReport, 'META-INF/manifest.xml').data;
            var pic0Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/>');
            var pic1Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/>');
            var pic2Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/>');

            helper.assert(pic0Match.length, 1);
            helper.assert(pic1Match.length, 1);
            helper.assert(pic2Match.length, 1);
            done();
          });
        });
      });
      describe('Base64 pictures in data', function () {
        var xmlContent = '<xml><draw:image xlink:href="$picture0" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="$picture1" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="$picture2" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
        var expectedXmlContent = '<xml><draw:image xlink:href="Pictures/CarbonePicture0.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="Pictures/CarbonePicture1.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
          '<draw:image xlink:href="Pictures/CarbonePicture2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></xml>';
        var contentTypeXml = '<Types></Types>';
        var expectedContentTypeXml = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';
        var manifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"></manifest:manifest>';
        var expectedManifest = '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>';
        var report = {
          files : [
            {
              name : '[Content_Types].xml',
              data : contentTypeXml
            },
            {
              name : 'content.xml',
              data : xmlContent
            },
            {
              name : 'META-INF/manifest.xml',
              data : manifest
            }
          ]
        };
        var expectedReport = {
          files : [
            {
              name : '[Content_Types].xml',
              data : expectedContentTypeXml
            },
            {
              name : 'content.xml',
              data : expectedXmlContent
            },
            {
              name : 'META-INF/manifest.xml',
              data : expectedManifest
            }
          ]
        };

        it('should replace dynpics links by embedded pictures', function (done) {
          postprocessor.embedOdtPictures(report, {
            $picture0 : {
              data      : new Buffer('cat').toString('base64'),
              extension : 'jpeg'
            },
            $picture1 : {
              data      : new Buffer('dog').toString('base64'),
              extension : 'jpeg'
            },
            $picture2 : {
              data      : new Buffer('doggo').toString('base64'),
              extension : 'jpeg'
            }
          }, {}, function (err, result) {
            helper.assert(dynpics.getTemplate(result, 'content.xml'), dynpics.getTemplate(expectedReport, 'content.xml'));
            done();
          });
        });

        it('should add dynpics in manifest and push files', function (done) {
          postprocessor.embedOdtPictures(report, {
            $picture0 : {
              data      : new Buffer('cat').toString('base64'),
              extension : 'jpeg'
            },
            $picture1 : {
              data      : new Buffer('dog').toString('base64'),
              extension : 'jpeg'
            },
            $picture2 : {
              data      : new Buffer('doggo').toString('base64'),
              extension : 'jpeg'
            }
          }, {}, function (err, result) {
            var resultManifest = dynpics.getTemplate(expectedReport, 'META-INF/manifest.xml').data;
            var pic0Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture0.jpg" manifest:media-type="image/jpeg"/>');
            var pic1Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture1.jpg" manifest:media-type="image/jpeg"/>');
            var pic2Match = resultManifest.match('<manifest:file-entry manifest:full-path="Pictures/CarbonePicture2.jpg" manifest:media-type="image/jpeg"/>');
            var pic0File = result.files.find(function (file) {
              return file.name === 'Pictures/CarbonePicture0.jpg';
            });
            var pic1File = result.files.find(function (file) {
              return file.name === 'Pictures/CarbonePicture1.jpg';
            });
            var pic2File = result.files.find(function (file) {
              return file.name === 'Pictures/CarbonePicture2.jpg';
            });

            helper.assert(pic0Match.length, 1);
            helper.assert(pic1Match.length, 1);
            helper.assert(pic2Match.length, 1);
            helper.assert(pic0File.data.toString(), 'cat');
            helper.assert(pic1File.data.toString(), 'dog');
            helper.assert(pic2File.data.toString(), 'doggo');
            done();
          });
        });
      });
    });

    describe('DOCX', function () {
      describe('Common logic', function () {

        it('should retrieve document', function (done) {
          var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" Id="rId1" /></Relationships>';
          var _template = {
            files : [
              {
                name : '_rels/.rels',
                data : _rootRels
              }
            ]
          };
          var _expectedDocuments = [
            {
              contentPath : 'word/document.xml',
              name        : 'document.xml',
              relsPath    : 'word/_rels/document.xml.rels'
            }
          ];

          dynpics.getDocxDocuments(_template, function (err, documents) {
            helper.assert(err, null);
            helper.assert(documents, _expectedDocuments);
            done();
          });
        });

        it('should add a content type', function (done) {
          var _template = {
            files : [
              {
                name : '[Content_Types].xml',
                data : '<Types></Types>'
              }
            ]
          };
          var _expectedContentFile = '<Types><Default Extension="jpg" ContentType="image/jpeg"/></Types>';

          postprocessor.addDocxContentType(_template, 'jpg', function (newContent) {
            helper.assert(newContent, _expectedContentFile);
            done();
          });
        });

        it('should retrieve the image size in emu (ooxml unit)', function (done) {
          fs.readFile(__dirname + '/datasets/munchkin.jpg', function (err, data) {
            helper.assert(err, null);
            var _dims = dynpics._sizeOfInEmu(data);

            helper.assert(_dims, {
              x : 4572000,
              y : 2813538
            });
            done();
          });
        });

        it('should not retrieve the image size in emu (invalid buffer given)', function (done) {
          var _dims = dynpics._sizeOfInEmu(Buffer.alloc(10));

          helper.assert(_dims, null);
          done();
        });

        it('should retrieve the picture dimensions', function (done) {
          var _xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="4004945"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _dimensions =	dynpics._getDocxPictureDimensions(_xml, 'rId2');

          helper.assert(_dimensions, {
            x : 4004945,
            y : 4004945
          });
          done();
        });

        it('should not retrieve the picture dimensions (embed id does not match)', function (done) {
          var _xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="4004945"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _dimensions =	dynpics._getDocxPictureDimensions(_xml, 'nothing');

          helper.assert(_dimensions, null);
          done();
        });

        it('should not retrieve the picture dimensions (no picture)', function (done) {
          var _xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _dimensions =	dynpics._getDocxPictureDimensions(_xml, 'rId2');

          helper.assert(_dimensions, null);
          done();
        });

        it('should return new dimensions with correct ratio (y overflow)', function () {
          var _dimensions = dynpics._fitDimensions({ x : 300, y : 600 }, { x : 300, y : 456 });
          var _expected = {
            x : 228,
            y : 456
          };
          helper.assert(_dimensions, _expected);
        });

        it('should return new dimensions with correct ratio (x overflow)', function () {
          var _dimensions = dynpics._fitDimensions({ x : 200, y : 456 }, { x : 123, y : 456 });
          var _expected = {
            x : 123,
            y : 281
          };
          helper.assert(_dimensions, _expected);
        });

        it('should return new dimensions with correct ratio (x and y overflow with x < y)', function () {
          var _dimensions = dynpics._fitDimensions({ x : 200, y : 500 }, { x : 123, y : 456 });
          var _expected = {
            x : 123,
            y : 308
          };
          helper.assert(_dimensions, _expected);
        });

        it('should return new dimensions with correct ratio (x and y overflow with x > y)', function () {
          var _dimensions = dynpics._fitDimensions({ x : 500, y : 200 }, { x : 123, y : 456 });
          var _expected = {
            x : 123,
            y : 50
          };
          helper.assert(_dimensions, _expected);
        });

        it('should return new dimensions with correct ratio (source smaller then target)', function () {
          var _dimensions = dynpics._fitDimensions({ x : 100, y : 200 }, { x : 123, y : 456 });
          var _expected = {
            x : 123,
            y : 246
          };
          helper.assert(_dimensions, _expected);
        });

        it('should replace the picture dimensions', function () {
          var _xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="4004945"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="100" cy="300"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _dimensions = {
            x : 100,
            y : 300
          };
          var _newXml = dynpics._setDocxPictureDimensions(_xml, 'rId2', _dimensions);

          helper.assert(_newXml, _expectedXml);
        });

        it('should replace the picture dimensions by the resized one', function () {
          var _xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="4004945"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="2464582"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _relation = {
            uri     : '$picture',
            fileXml : '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>',
            id      : 'rId2'
          };
          var _picture = {
            name      : 'media/CarbonePicture0.jpg',
            data      : fs.readFileSync(path.join(__dirname, 'datasets', 'munchkin.jpg')),
            extension : 'jpg'
          };
          var _newXml = dynpics._updateDocxPictureDimensionsInXml(_xml, _relation, _picture);

          helper.assert(_newXml, _expectedXml);
        });

        it('should replace the picture dimensions by the resized one (integration test)', function (done) {
          var _rootRels                = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" Id="rId1" /></Relationships>';
          var _documentRels            = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId42" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>';
          var _documentContent         = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="4004945"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId42"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';
          var _contentTypesContent     = '<Types></Types>';

          var _expectedDocumentContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14 wp14"><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="0" w:after="160"/><w:rPr/></w:pPr><w:bookmarkStart w:id="0" w:name="_GoBack"/><w:bookmarkEnd w:id="0"/><w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="114935" distR="114935"><wp:extent cx="4004945" cy="2464582"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.logoUrl}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.logoUrl}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId42"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="4004945" cy="4004945"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:left="1440" w:right="1440" w:header="0" w:top="1440" w:footer="0" w:bottom="1440" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="360" w:charSpace="4096"/></w:sectPr></w:body></w:document>';

          var _report = {
            files : [
              {
                name : '_rels/.rels',
                data : _rootRels
              },
              {
                name : 'word/document.xml',
                data : _documentContent
              },
              {
                name : '[Content_Types].xml',
                data : _contentTypesContent
              },
              {
                name : 'word/_rels/document.xml.rels',
                data : _documentRels
              }
            ]
          };

          var _pictureContent = fs.readFileSync(path.join(__dirname, 'datasets', 'munchkin.jpg'));
          var _pictureData = new Buffer(_pictureContent).toString('base64');

          postprocessor.embedDocxPictures(_report, {
            $picture : {
              data      : _pictureData,
              extension : 'jpg'
            }
          }, {}, function (err, result) {
            var _picture = dynpics.getTemplate(result, 'media/CarbonePicture0.jpg');
            var _resultDocumentContent = dynpics.getTemplate(result, 'word/document.xml').data;

            helper.assert(err, null);
            helper.assert(_picture.data.toString('base64'), _pictureData);
            helper.assert(_resultDocumentContent, _expectedDocumentContent);
            done();
          });
        });

      });

      describe('Public links (can takes time to request pictures)', function () {
        var _documentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" TargetMode="External"/></Relationships>';
        var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" Id="rId1" /></Relationships>';
        var report = {
          files : [
            {
              name : '_rels/.rels',
              data : _rootRels
            },
            {
              name : 'word/document.xml',
              data : ''
            },
            {
              name : '[Content_Types].xml',
              data : '<Types></Types>'
            },
            {
              name : 'word/_rels/document.xml.rels',
              data : _documentRels
            }
          ]
        };

        it('should embed dynamic picture', function (done) {
          var _expectedRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture0.jpg"/></Relationships>';

          postprocessor.embedDocxPictures(report, {}, {}, function (err, result) {
            var gotRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels').data;
            var _picture = result.files.find(function (element) {
              return element.name === 'media/CarbonePicture0.jpg';
            });

            helper.assert(gotRels, _expectedRels);
            helper.assert(_picture.data.constructor === Buffer, true);
            done();
          });
        });

        it('should do nothing (picture url points to nothing)', function (done) {
          var _report = JSON.parse(JSON.stringify(report));

          _report.files[3].data = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://thissitedoesnot.exist" TargetMode="External"/></Relationships>';
          postprocessor.embedDocxPictures(_report, {}, {}, function (err, result) {
            helper.assert(err, null);
            helper.assert(result, _report);
            done();
          });
        });

        it('should retrieve the picture thanks to the found relation', function (done) {
          var _relation = {
            uri     : 'https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg',
            fileXml : '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://www.wanimo.com/veterinaire/images/articles/chien/chien-boiterie.jpg" TargetMode="External"/></Relationships>'
          };
          var _expectedDocumentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture1337.jpg"/></Relationships>';

          postprocessor.retrieveDocxPictureByRelation({}, _relation, 1337, function (err, picture, newRelations) {
            helper.assert(err, null);
            helper.assert(picture.name, 'media/CarbonePicture1337.jpg');
            helper.assert(picture.extension, 'jpg');
            helper.assert(picture.data.constructor, Buffer);
            helper.assert(newRelations, _expectedDocumentRels);
            done();
          });
        });

        it('should throw error (dead link)', function (done) {
          var _relation = {
            uri     : 'http://nothing.nowhere',
            fileXml : '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="id72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://nothing.nowhere" TargetMode="External"/></Relationships>'
          };

          postprocessor.retrieveDocxPictureByRelation({}, _relation, 1337, function (err, picture, newRelations) {
            helper.assert(err !== null, true);
            helper.assert(picture, undefined);
            helper.assert(newRelations, undefined);
            done();
          });
        });
      });

      describe('Base64 pictures in data', function () {
        it('should edit rels and push pictures', function (done) {
          var _rootRels             = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" Id="rId1" /></Relationships>';
          var _documentRels         = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>';
          var _documentContent      = '';
          var _contentTypesContent  = '<Types></Types>';

          var _expectedDocumentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarbonePicture0.jpg"/></Relationships>';

          var _report = {
            files : [
              {
                name : '_rels/.rels',
                data : _rootRels
              },
              {
                name : 'word/document.xml',
                data : _documentContent
              },
              {
                name : '[Content_Types].xml',
                data : _contentTypesContent
              },
              {
                name : 'word/_rels/document.xml.rels',
                data : _documentRels
              }
            ]
          };
          var _pictureContent = 'myPictureContent';
          var _pictureData = new Buffer(_pictureContent).toString('base64');

          postprocessor.embedDocxPictures(_report, {
            $picture : {
              data      : _pictureData,
              extension : 'jpg'
            }
          }, {}, function (err, result) {
            var _picture = dynpics.getTemplate(result, 'media/CarbonePicture0.jpg');
            var _resultDocumentRels = dynpics.getTemplate(result, 'word/_rels/document.xml.rels');

            helper.assert(err, null);
            helper.assert(_resultDocumentRels.data, _expectedDocumentRels);
            helper.assert(_picture.data.toString('base64'), _pictureData);
            done();
          });
        });

        it('should do nothing (no picture given but referenced in the template)', function (done) {
          var _rootRels = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml" Id="rId3" /><Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml" Id="rId2" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" Id="rId1" /></Relationships>';
          var _documentRels = '<?xml version="1.0" encoding="utf-8"?><Relationships><Relationship Id="rId72db2d937dba0c211598e89afb814679" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="$picture" TargetMode="External"/></Relationships>';
          var _documentContent = '';
          var _contentTypesContent = '<?xml version="1.0" encoding="utf-8"?><Types></Types>';

          var _report = {
            files : [
              {
                name : '_rels/.rels',
                data : _rootRels
              },
              {
                name : 'word/document.xml',
                data : _documentContent
              },
              {
                name : '[Content_Types].xml',
                data : _contentTypesContent
              },
              {
                name : 'word/_rels/document.xml.rels',
                data : _documentRels
              }
            ]
          };

          postprocessor.embedDocxPictures(JSON.parse(JSON.stringify(_report)), {}, {}, function (err, result) {
            helper.assert(err, null);
            helper.assert(result, _report);
            done();
          });
        });
      });
    });
  });
});
