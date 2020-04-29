const assert    = require('assert');
const helper    = require('../lib/helper');
const carbone   = require('../lib/index');
const path      = require('path');
const xmlFormat = require('xml-beautifier');
const fs        = require('fs');
const image     = require('../lib/image');
const nock      = require('nock');

// mock request
// const scope = nock('http://myapp.iriscouch.com')
//   .get('/')
//   .replyWithFile(200, __dirname + '/replies/user.json', {
//     'Content-Type': 'application/json',
//   })

describe.only('Image processing in ODT, DOCX, ODS, ODP, XSLX, ...', function () {
  const _imageFRBase64jpg            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageFR_base64_html_jpg.txt'  ), 'utf8');
  const _imageFRBase64jpgWithoutType = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageFR_base64_jpg.txt'       ), 'utf8');
  const _imageDEBase64jpg            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageDE_base64_html_jpg.txt'  ), 'utf8');
  const _imageITBase64png            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageIT_base64_html_png.txt'  ), 'utf8');
  const _imageLogoBase64jpg          = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageLogo_base64_html_jpg.txt'), 'utf8');

  describe('OpenDocument ODT', function () {
    it('should do nothing if there is no marker inside XML', function (done) {
      const _testedReport = 'odt-simple-without-marker';
      carbone.render(openTemplate(_testedReport), {}, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace image (base64 jpg)', function (done) {
      const _testedReport = 'odt-simple';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace image (base64 with old method type) DEPRECATED', function (done) {
      const _testedReport = 'odt-simple';
      const _data = {
        image        : '$base64image',
        $base64image : {
          data      : _imageFRBase64jpgWithoutType,
          extension : 'jpeg'
        }
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace image with loops (base64 jpg)\
      should accept PNG image even if the template image is a JPEG\
      should accept image in header with conditions i=0\
      should not save the image twice if it used twice in the document', function (done) {
      const _testedReport = 'odt-loop';
      const _data = {
        company : 'ideolys',
        logos   : [
          { image : _imageLogoBase64jpg },
          { image : _imageFRBase64jpg }
        ],
        cars : [{
          name      : 'tesla',
          countries : [
            { name : 'de', image : _imageDEBase64jpg },
            { name : 'fr', image : _imageFRBase64jpg },
            { name : 'it', image : _imageITBase64png }
          ]
        },
        {
          name      : 'toyota',
          countries : [
            { name : 'fr', image : _imageFRBase64jpg },
            { name : 'de', image : _imageDEBase64jpg }
          ]
        }]
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('OpenDocument ODS', function () {
    it('should replace one image (base64 jpg)', function (done) {
      const _testedReport = 'ods-simple';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should replace multiple images (base64 jpg png)', function (done) {
      const _testedReport = 'ods-complex';
      const _data = {
        imageFR      : _imageFRBase64jpg,
        imageFRold   : '$base64image',
        $base64image : {
          data      : _imageFRBase64jpgWithoutType,
          extension : 'jpeg'
        },
        imageDE   : _imageDEBase64jpg,
        imageIT   : _imageITBase64png,
        imageLogo : _imageLogoBase64jpg,
        text      : "0+rR_r+f|U*aG!^[;sEAN[y|x'TCe}|?20D_E,[Z",
        text2     : 'K$-QXILVAB#j:XnR$*m"$9Rk76B@ARy2_qBdp2Xu',
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('DOCX MS document', function () {
    it('should replace one image (base64 jpg)', function (done) {
      const _testedReport = 'docx-simple';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should replace 4 images to invalid image', function (done) {
      const _testedReport = 'docx-errors';
      const _data = {
        tests : {
          imageError : 'This is some random text',
        },
        error2 : 'https://media.giphy.com/media/yXBqba0Zx8',
        error3 : 'data:image/jpeg;base64,',
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should replace multiple images with a complexe data object (child of child) (base64 jpg)', function (done) {
      const _testedReport = 'docx-complex';
      const _data = {
        tests : {
          image : _imageFRBase64jpg,
          child : {
            imageIT : _imageITBase64png,
            child   : {
              imageDE : _imageDEBase64jpg,
            }
          },
          imageLogo  : _imageLogoBase64jpg,
          imageError : 'This is some random text',
        },
        imageFRold   : '$base64image',
        $base64image : {
          data      : _imageFRBase64jpgWithoutType,
          extension : 'jpg'
        }
      };
      carbone.render(openTemplate(_testedReport), _data, (err, res) => {
        helper.assert(err+'', 'null');
        assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('parseBase64Picture - Parse a base64 data-uri into an object descriptor', function () {
    // png, jpeg, GIF, BMP, non picture format (html), strange base64, différent mimetypes
    it('should parse base64 PNG (1)', function () {
      const _base64Picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ7SURBVDjLjZNPSFRRFMZ/9/2Z90anRlKzMS1UjFyoWS3U2oVQ0KIWrXJRFC7KTdRCqUWQkBt34aKN1a5FEUkRLbKFiBAoVi4kUQIbtfwz0zjjezPv3ttCwyYr+jibs7g/vu+cc8XDwbE+pcT5TFa5fsB26fzWtsC1Gbh85vA1AEtp0X76WGWp67pCCJN/yVMggxxP30xfADYAGV85juOKR29X8VgmJaaoKvtK2E4SaMXK9zCT01EKdB0Wxdw4V4VUQvyEWtkADMPEEJA1Fqgq+YoT+kzSTxHIAMtxqK6MMTtTSFGoBKXyXVkACjAMga+/EbJXSawn8aVHNggIdBrHcUj7YYrDBhqdN5gtgBDoQOHLHF7gs57zyaoAqQCRQyuJZQi0zp+qAaD1BsCllFS6EI2NryR+IBEiRDoVIRIqxzQN0GJ7BK03IkTMvXxZWCTqzlNQaOCIgLWVAhYXYsSi1ViG2LYZS/8KsHdTHm5ibnyIokgcISW2V8q+mnYibgyp1O9nseVgarkDqRRSKQ7432ip3I8CZuYXebXWjZkoxFQRbj/wyHjezhfd87de3p3osbTWCODkxmEBYNYnyKSXceffU9LaQcP0GEuZKY7UHaViVy1Dk8/E6Mf4nebO8qLNVPnGZLgIv6SGZP1ZtGnzbvIthw42Ig1JY6wNKXI017cCXLVcWyRRuWhjWTMIsYnSPwuApeQitohwqu4SANdP3GfwQz/w3LVClnj8ZGimJSt1vdZ//gOJVCI6GR9hIj5MV9sAva8v4poOgCf03179oubO8p6KqujN1obj1O5p4tPCOCPvh5mbTfb9F2AT0gtcAXYAKaB/9F686wcCdBKN9UyNSAAAAABJRU5ErkJggg==';
      const _expectedResp = {
        data      : new Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ7SURBVDjLjZNPSFRRFMZ/9/2Z90anRlKzMS1UjFyoWS3U2oVQ0KIWrXJRFC7KTdRCqUWQkBt34aKN1a5FEUkRLbKFiBAoVi4kUQIbtfwz0zjjezPv3ttCwyYr+jibs7g/vu+cc8XDwbE+pcT5TFa5fsB26fzWtsC1Gbh85vA1AEtp0X76WGWp67pCCJN/yVMggxxP30xfADYAGV85juOKR29X8VgmJaaoKvtK2E4SaMXK9zCT01EKdB0Wxdw4V4VUQvyEWtkADMPEEJA1Fqgq+YoT+kzSTxHIAMtxqK6MMTtTSFGoBKXyXVkACjAMga+/EbJXSawn8aVHNggIdBrHcUj7YYrDBhqdN5gtgBDoQOHLHF7gs57zyaoAqQCRQyuJZQi0zp+qAaD1BsCllFS6EI2NryR+IBEiRDoVIRIqxzQN0GJ7BK03IkTMvXxZWCTqzlNQaOCIgLWVAhYXYsSi1ViG2LYZS/8KsHdTHm5ibnyIokgcISW2V8q+mnYibgyp1O9nseVgarkDqRRSKQ7432ip3I8CZuYXebXWjZkoxFQRbj/wyHjezhfd87de3p3osbTWCODkxmEBYNYnyKSXceffU9LaQcP0GEuZKY7UHaViVy1Dk8/E6Mf4nebO8qLNVPnGZLgIv6SGZP1ZtGnzbvIthw42Ig1JY6wNKXI017cCXLVcWyRRuWhjWTMIsYnSPwuApeQitohwqu4SANdP3GfwQz/w3LVClnj8ZGimJSt1vdZ//gOJVCI6GR9hIj5MV9sAva8v4poOgCf03179oubO8p6KqujN1obj1O5p4tPCOCPvh5mbTfb9F2AT0gtcAXYAKaB/9F686wcCdBKN9UyNSAAAAABJRU5ErkJggg==', 'base64'),
        mimetype  : 'image/png',
        extension : 'png',
      };
      image.parseBase64Picture(_base64Picture, function (err, imageDescriptor) {
        assert(err+'', 'null');
        helper.assert(imageDescriptor, _expectedResp);
      });
    });
    it('should parse base64 PNG (2)', function () {
      const _base64Picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const _expectedResp ={
        data      : new Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', 'base64'),
        mimetype  : 'image/png',
        extension : 'png',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 BMP', function () {
      const _base64Picture = 'data:image/x-ms-bmp;base64,Qk2aAAAAAAAAADYAAAAoAAAABQAAAPv///8BACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAASTny/0Rp9f9Vq+H/nruq/66zqf9IefL/Sz3z/0R18P+OssH/t6qo/0KJ9P8/ePD/QgD5/z6l4/+otKj/Zara/4+6uP9EpuH/n6S8/8pxpP9kv8j/lrir/5DBr//FlKX/xUSr/w==';
      const _expectedResp ={
        data      : new Buffer.from('Qk2aAAAAAAAAADYAAAAoAAAABQAAAPv///8BACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAASTny/0Rp9f9Vq+H/nruq/66zqf9IefL/Sz3z/0R18P+OssH/t6qo/0KJ9P8/ePD/QgD5/z6l4/+otKj/Zara/4+6uP9EpuH/n6S8/8pxpP9kv8j/lrir/5DBr//FlKX/xUSr/w==', 'base64'),
        mimetype  : 'image/x-ms-bmp',
        extension : 'bmp',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 JPEG', function () {
      const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/CABEIAAwADQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAADAgQBBQAGBwgJCgv/xADDEAABAwMCBAMEBgQHBgQIBnMBAgADEQQSIQUxEyIQBkFRMhRhcSMHgSCRQhWhUjOxJGIwFsFy0UOSNIII4VNAJWMXNfCTc6JQRLKD8SZUNmSUdMJg0oSjGHDiJ0U3ZbNVdaSVw4Xy00Z2gONHVma0CQoZGigpKjg5OkhJSldYWVpnaGlqd3h5eoaHiImKkJaXmJmaoKWmp6ipqrC1tre4ubrAxMXGx8jJytDU1dbX2Nna4OTl5ufo6erz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAECAAMEBQYHCAkKC//EAMMRAAICAQMDAwIDBQIFAgQEhwEAAhEDEBIhBCAxQRMFMCIyURRABjMjYUIVcVI0gVAkkaFDsRYHYjVT8NElYMFE4XLxF4JjNnAmRVSSJ6LSCAkKGBkaKCkqNzg5OkZHSElKVVZXWFlaZGVmZ2hpanN0dXZ3eHl6gIOEhYaHiImKkJOUlZaXmJmaoKOkpaanqKmqsLKztLW2t7i5usDCw8TFxsfIycrQ09TV1tfY2drg4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9sAQwEEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9oADAMBAAIRAxEAAAE3c+S9dxdX/9oACAEBAAEFAtwM19vOzWl3bQbnCmC/2OGKVP8A/9oACAEDEQE/AZj+WOeKD//aAAgBAhEBPwGErzHj83//2gAIAQEABj8CltFL6Uq5cYyxA6a1ckS7hPtV06hr+FHcxpKiErGqjU8PV3CpEZKqnUqL/8QAMxABAAMAAgICAgIDAQEAAAILAREAITFBUWFxgZGhscHw0RDh8SAwQFBgcICQoLDA0OD/2gAIAQEAAT8h50BElHmnd3t4vSSY4gcAnRYhqK9wkrWOnm5S40Y3w3//2gAMAwEAAhEDEQAAEAv/xAAzEQEBAQADAAECBQUBAQABAQkBABEhMRBBUWEgcfCRgaGx0cHh8TBAUGBwgJCgsMDQ4P/aAAgBAxEBPxDPojhz5+vd/9oACAECEQE/EGxDV7/2v//aAAgBAQABPxBQcvDNsAybAgxFl2oxrkkTck4Vkr6+Wl26HFFgErYf5HmAiYmeYm//2Q==';
      const _expectedResp ={
        data      : new Buffer.from('/9j/4AAQSkZJRgABAQAASABIAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/CABEIAAwADQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAADAgQBBQAGBwgJCgv/xADDEAABAwMCBAMEBgQHBgQIBnMBAgADEQQSIQUxEyIQBkFRMhRhcSMHgSCRQhWhUjOxJGIwFsFy0UOSNIII4VNAJWMXNfCTc6JQRLKD8SZUNmSUdMJg0oSjGHDiJ0U3ZbNVdaSVw4Xy00Z2gONHVma0CQoZGigpKjg5OkhJSldYWVpnaGlqd3h5eoaHiImKkJaXmJmaoKWmp6ipqrC1tre4ubrAxMXGx8jJytDU1dbX2Nna4OTl5ufo6erz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAECAAMEBQYHCAkKC//EAMMRAAICAQMDAwIDBQIFAgQEhwEAAhEDEBIhBCAxQRMFMCIyURRABjMjYUIVcVI0gVAkkaFDsRYHYjVT8NElYMFE4XLxF4JjNnAmRVSSJ6LSCAkKGBkaKCkqNzg5OkZHSElKVVZXWFlaZGVmZ2hpanN0dXZ3eHl6gIOEhYaHiImKkJOUlZaXmJmaoKOkpaanqKmqsLKztLW2t7i5usDCw8TFxsfIycrQ09TV1tfY2drg4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9sAQwEEBAQEBAQEBAQEBgYFBgYIBwcHBwgMCQkJCQkMEwwODAwODBMRFBAPEBQRHhcVFRceIh0bHSIqJSUqNDI0RERc/9oADAMBAAIRAxEAAAE3c+S9dxdX/9oACAEBAAEFAtwM19vOzWl3bQbnCmC/2OGKVP8A/9oACAEDEQE/AZj+WOeKD//aAAgBAhEBPwGErzHj83//2gAIAQEABj8CltFL6Uq5cYyxA6a1ckS7hPtV06hr+FHcxpKiErGqjU8PV3CpEZKqnUqL/8QAMxABAAMAAgICAgIDAQEAAAILAREAITFBUWFxgZGhscHw0RDh8SAwQFBgcICQoLDA0OD/2gAIAQEAAT8h50BElHmnd3t4vSSY4gcAnRYhqK9wkrWOnm5S40Y3w3//2gAMAwEAAhEDEQAAEAv/xAAzEQEBAQADAAECBQUBAQABAQkBABEhMRBBUWEgcfCRgaGx0cHh8TBAUGBwgJCgsMDQ4P/aAAgBAxEBPxDPojhz5+vd/9oACAECEQE/EGxDV7/2v//aAAgBAQABPxBQcvDNsAybAgxFl2oxrkkTck4Vkr6+Wl26HFFgErYf5HmAiYmeYm//2Q==', 'base64'),
        mimetype  : 'image/jpeg',
        extension : 'jpeg',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 JPG', function () {
      const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==';
      const _expectedResp ={
        data      : new Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==', 'base64'),
        mimetype  : 'image/jpeg',
        extension : 'jpeg',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 JPEG (containing a SVG)', function () {
      const _base64Picture = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kfr6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////////////////////////////////////////////////////////////////wAARCAAYAEADAREAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIRAAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYyJLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k=';
      const _expectedResp ={
        data      : new Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kfr6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////////////////////////////////////////////////////////////////wAARCAAYAEADAREAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIRAAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYyJLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k=', 'base64'),
        mimetype  : 'image/jpeg',
        extension : 'jpeg',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 GIF', function () {
      const _base64Picture = 'data:image/gif;base64,R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=';
      const _expectedResp ={
        data      : new Buffer.from('R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=', 'base64'),
        mimetype  : 'image/gif',
        extension : 'gif',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 SVG', function () {
      const _base64Picture = 'data:image/svg+xml;base64,PD94bWwgdmVyzeiBNMyw2djJoMThWNkgzeiIvPjwvZz4KPC9zdmc+Cgo=';
      const _expectedResp ={
        data      : new Buffer.from('PD94bWwgdmVyzeiBNMyw2djJoMThWNkgzeiIvPjwvZz4KPC9zdmc+Cgo=', 'base64'),
        mimetype  : 'image/svg+xml',
        extension : 'svg',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });
    it('should parse a base64 WEBP', function () {
      const _base64Picture = ' data:image/webp;base64,UklGRmABAABXRUJQVlA4WAoAAAAIAAAADAAACwAAVlA4ILAAAAAQAwCdASoNAAwAAQAcJQBOgMWQ7Aep3/gDZocmhiduB4AA/vm7/8vTphhRfc9vfQ+56+VZc0Wf6X19P8Tpt9/3Gwr/yv3q4o1kockBGd/UITeIK4uGx/kn7zYfrQx/JQhooEhSZ/H/hDqIhYXDwyHKv/H/3hHEl9XVsP8VAIfgdi5y/a/x6n8gUK8d2Kfabk97LnEH717Ts3Ef8pf+XcPeqnYTFTjy+Y/79m2LxEAAAEVYSUaKAAAARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA';
      const _expectedResp ={
        data      : new Buffer.from('UklGRmABAABXRUJQVlA4WAoAAAAIAAAADAAACwAAVlA4ILAAAAAQAwCdASoNAAwAAQAcJQBOgMWQ7Aep3/gDZocmhiduB4AA/vm7/8vTphhRfc9vfQ+56+VZc0Wf6X19P8Tpt9/3Gwr/yv3q4o1kockBGd/UITeIK4uGx/kn7zYfrQx/JQhooEhSZ/H/hDqIhYXDwyHKv/H/3hHEl9XVsP8VAIfgdi5y/a/x6n8gUK8d2Kfabk97LnEH717Ts3Ef8pf+XcPeqnYTFTjy+Y/79m2LxEAAAEVYSUaKAAAARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAAwAAAAA', 'base64'),
        mimetype  : 'image/webp',
        extension : 'webp',
      };
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err+'', 'null');
        helper.assert(imgDescriptor, _expectedResp);
      });
    });

    it('[ERROR test] should return an empty descriptor with an error because they are not a data-uri', function (done) {
      const _base64Pictures = [
        'data:text/html;charset=utf-8,<!DOCTYPE%20html><html%20lang%3D"en"><head><title>Embedded%20Window<%2Ftitle><%2Fhead><body><h1>42<%2Fh1><%2Fbody><%2Fhtml>',
        'data:text/plain;charset=utf-8;base64,VGhpcyBpcyBhIHRlc3Q='
      ];
      _base64Pictures.forEach(img => {
        image.parseBase64Picture(img, function (err, imgDescriptor) {
          helper.assert(err, 'Error base64 picture: it is not a base64 picture.');
          helper.assert(imgDescriptor+'', 'undefined');
        });
      });
      done();
    });
    it('[ERROR test] should return an empty descriptor with an error because the data-uri are invalid', function (done) {
      const _base64Pictures = [
        'R0lGODlhDwAPAPEAAPjxpLFyTee6bQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqct9AiNUIkiZ6o3KbtF52pQEYhRk46WeHAK5ZHekDWjgjK4bBQAh+QQIBgD/ACwAAAAADwAPAAACJISPqcvtLIKYVChZa8J5XspdHJhMo2cdZuchEausJKQ6KXAbBQAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqcvtLaKMKoQ508UyiY15n7RdhwBYHIAa6Bi2J9gpcMZQLnQmBQAh+QQIBgD/ACwAAAAADwAPAAACJoSPqcvtLqJcIsir7MVI73hInmaFQOBhAlJ9VAoq7cZUZEmF61EAACH5BAgGAP8ALAAAAAAPAA8AAAIphI+py+0uYmQi2BuEsrJrlHnSIYWi9nGRaXyA2i2VKJujMndBMwO9UQAAIfkECAYA/wAsAAAAAA8ADwAAAiWEj6nL7Q+BmFQsEbLOKtSfeB9lUNkoWsY5pQo2qggMdvHVmnIBACH5BAgGAP8ALAAAAAAPAA8AAAImhI+py+0PgZhULBGyzirXGVgG+JWjVwYJilFdaK7llLRzTcHtUQAAIfkECAYA/wAsAAAAAA8ADwAAAiaEj6nL7Q+BCLQKNYXe4aK8hQkYagbXaRR5kOKYvnDpwVbGTGcNFAAh+QQIBgD/ACwAAAAADwAPAAACKoSPqcuNAiNUIkiZ6o3Zamh1W0B5oPZ82yEAKtayJleuzEACQb5MbmwoAAAh+QQIBgD/ACwAAAAADwAPAAACJ4SPqZsSAqNysYr2LFQhW+55oBaMVpl05ORFaNrFD7MB9XIdOa0jBQAh+QQIBgD/ACwAAAAADwAPAAACKYSPecItCkRwTU1aUbgUcu5xTWCJDJlsGKqZkiJt8gRFLAs9hl73flIAACH5BAgGAP8ALAAAAAAPAA8AAAImhI95EuKvnoSoTXqCZXjp6yDcBQjiNwWKxrJK2bpvKc70Yuf6/hYAIfkECAYA/wAsAAAAAA8ADwAAAiaEj3nCLQpEcE1NWlG4FHLucU2QSGK2bBiZbK4LRWccLXR953pSAAAh+QQIBgD/ACwAAAAADwAPAAACJoSPqZvi75QIECZaX8N1ce5xT7CJGjKZ0RW0LsWQxroIBy0x+lIAADs=',
        'data:,Hello World!'
      ];
      _base64Pictures.forEach(img => {
        image.parseBase64Picture(img, function (err, imgDescriptor) {
          assert(err === 'Error base64 picture: the picture regex has failled. The data-uri is not valid.');
          helper.assert(imgDescriptor+'', 'undefined');
        });
      });
      done();
    });
    it('[ERROR test] should return an empty descriptor with an error because the data-uri content is empty', function (done) {
      const _base64Picture = 'data:image/jpeg;base64,';
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err === 'Error base64 picture: the picture is empty.');
        helper.assert(imgDescriptor+'', 'undefined');
        done();
      });
    });
    it('[ERROR test] should return an empty descriptor with an error because the data-uri mime type is invalid', function (done) {
      const _base64Picture = 'data:image/error-here;base64,';
      image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
        assert(err === 'Error base64 picture: The mime type has not been recognized.');
        helper.assert(imgDescriptor+'', 'undefined');
        done();
      });
    });
  });
  describe('Test downloadImage function', function () {
    it('should download a JPEG image from an url', function (done) {
      nock('https://google.com')
        .get('/image-flag-fr.jpg')
        .replyWithFile(200, __dirname + '/datasets/image/imageFR.jpg', {
          'Content-Type' : 'image/jpeg',
        });
      image.downloadImage('https://google.com/image-flag-fr.jpg', {}, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.data.length > 0);
        helper.assert(imageInfo.mimetype, 'image/jpeg');
        helper.assert(imageInfo.extension, 'jpg');
        done();
      });
    });
    it('should download a PNG image from an url', function (done) {
      nock('https://google.com')
        .get('/image-flag-it.png')
        .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
          'Content-Type' : 'image/png',
        });
      image.downloadImage('https://google.com/image-flag-it.png', {}, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.data.length > 0);
        helper.assert(imageInfo.mimetype, 'image/png');
        helper.assert(imageInfo.extension, 'png');
        done();
      });
    });
    it('should download a PNG image from an url with query parameters', function (done) {
      nock('https://google.com')
        .get('/image-flag-it.png?size=10&color=blue')
        .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
          'Content-Type' : 'image/png',
        });
      image.downloadImage('https://google.com/image-flag-it.png?size=10&color=blue', {}, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.data.length > 0);
        helper.assert(imageInfo.mimetype, 'image/png');
        helper.assert(imageInfo.extension, 'png');
        done();
      });
    });
    it('should download a PNG image from an url even if the header.content-type is incorrect (application/json)', function (done) {
      nock('https://google.com')
        .get('/image-flag-it.png')
        .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
          'Content-Type' : 'application/json',
        });
      image.downloadImage('https://google.com/image-flag-it.png', {}, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.data.length > 0);
        helper.assert(imageInfo.mimetype, 'image/png');
        helper.assert(imageInfo.extension, 'png');
        done();
      });
    });
    it('should download a JPEG image from an url even if the header.content-type is incorrect (text/plain)', function (done) {
      nock('https://google.com')
        .get('/image-flag-fr.jpg')
        .replyWithFile(200, __dirname + '/datasets/image/imageFR.jpg', {
          'Content-Type' : 'text/plain',
        });
      image.downloadImage('https://google.com/image-flag-fr.jpg', {}, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.data.length > 0);
        helper.assert(imageInfo.mimetype, 'image/jpeg');
        helper.assert(imageInfo.extension, 'jpg');
        done();
      });
    });

    it('should return an error if the file is not an image with undefined Content-Type', function (done) {
      nock('https://google.com')
        .get('/image-flag-fr.txt')
        .replyWithFile(200, __dirname + '/datasets/image/imageFR_base64_jpg.txt');
      image.downloadImage('https://google.com/image-flag-fr.txt', {}, function (err, imageInfo) {
        assert(err.includes('Error Carbone: the file is not an image'));
        assert(imageInfo+'' === 'undefined');
        done();
      });
    });

    it('should return an error when the imageLinkOrBase64 is either undefined, null or empty', function (done) {
      image.downloadImage(undefined, {}, function (err, imageInfo) {
        assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
        helper.assert(imageInfo+'', 'undefined');

        image.downloadImage(null, {}, function (err, imageInfo) {
          assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
          helper.assert(imageInfo+'', 'undefined');

          image.downloadImage('', {}, function (err, imageInfo) {
            assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
            helper.assert(imageInfo+'', 'undefined');
            done();
          });
        });
      });
    });

    it ('should return an error when the location url does not exist', function (done) {
      image.downloadImage('https://carbone.io/fowjfioewj', {}, function (err, imageInfo) {
        assert(err.includes('can not download the image from the url'));
        helper.assert(imageInfo+'', 'undefined');
        done();
      });
    });

    it('should return an error when imageLinkOrBase64 argument is invalid (the error is returned by image.parseBase64Picture)', function (done) {
      image.downloadImage('this_is_random_text', {}, function (err, imageInfo) {
        assert(err.includes('Error'));
        helper.assert(imageInfo+'', 'undefined');
        done();
      });
    });


    it('should return an error when the request timeout', function (done) {
      const errorCode = 'ETIMEDOUT';
      nock('https://google.com')
        .get('/random-image.jpeg')
        .replyWithError({code : errorCode});
      image.downloadImage('https://google.com/random-image.jpeg', {}, function (err, imageInfo) {
        helper.assert(err.code, errorCode);
        assert(imageInfo+'', 'undefined');
        done();
      });
    });

    it('[depreciated base64 img] should return an image descriptor from JPEG base64', function (done) {
      const data = {
        $base64dog : {
          data      : '/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==',
          extension : 'jpeg'
        }
      };
      image.downloadImage('$base64dog', data, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.mimetype === 'image/jpeg');
        assert(imageInfo.extension === 'jpeg');
        assert(imageInfo.data.length > 0);
        done();
      });
    });

    it('[depreciated base64 img] should return an image descriptor from BMP base64', function (done) {
      const data = {
        $base64cat : {
          data      : 'Qk2aAAAAAAAAADYAAAAoAAAABQAAAPv///8BACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAASTny/0Rp9f9Vq+H/nruq/66zqf9IefL/Sz3z/0R18P+OssH/t6qo/0KJ9P8/ePD/QgD5/z6l4/+otKj/Zara/4+6uP9EpuH/n6S8/8pxpP9kv8j/lrir/5DBr//FlKX/xUSr/w==',
          extension : 'bmp'
        }
      };
      image.downloadImage('$base64cat', data, function (err, imageInfo) {
        helper.assert(err+'', 'null');
        assert(imageInfo.mimetype === 'image/bmp');
        assert(imageInfo.extension === 'bmp');
        assert(imageInfo.data.length > 0);
        done();
      });
    });

    it('[depreciated base64 img] should return an error because the base64 is TXT file', function (done) {
      const data = {
        $base64dog : {
          data      : '/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==',
          extension : 'txt'
        }
      };
      image.downloadImage('$base64dog', data, function (err, imageInfo) {
        assert(err.includes('the base64 provided is not an image'));
        assert(imageInfo + '' === 'undefined');
        done();
      });
    });

    it('[depreciated base64 img] should return an error because the base64 data is empty', function (done) {
      const data = {
        $base64dog : {
          data      : '',
          extension : 'jpeg'
        }
      };
      image.downloadImage('$base64dog', data, function (err, imageInfo) {
        assert(err.includes('the base64 provided is empty'));
        assert(imageInfo + '' === 'undefined');
        done();
      });
    });
  });
});

function openTemplate (template) {
  return openUnzippedDocument(template, 'template');
}

function assertFullReport (carboneResult, expectedDirname) {
  var _expected = openUnzippedDocument(expectedDirname, 'expected');
  var _max = Math.max(carboneResult.files.length, _expected.files.length);
  for (var i = 0; i < _max; i++) {
    var _resultFile   = carboneResult.files[i];
    var _expectedFile = _expected.files[i];
    if (_resultFile.name !== _expectedFile.name) {
      for (var j = 0; j < _expected.files.length; j++) {
        _expectedFile = _expected.files[j];
        if (_resultFile.name === _expectedFile.name) {
          break;
        }
      }
    }
    assert.strictEqual(_resultFile.name, _expectedFile.name);
    if (Buffer.isBuffer(_resultFile.data) === true) {
      if (_resultFile.data.equals(_expectedFile.data) === false) {
        throw Error ('Buffer of (result) '+_resultFile.name + 'is not the same as (expected) '+_expectedFile.name);
      }
    }
    else {
      // re-indent xml to make the comparison understandable
      _resultFile.data = xmlFormat(_resultFile.data.replace(/(\r\n|\n|\r)/g,' '));
      _expectedFile.data = xmlFormat(_expectedFile.data.replace(/(\r\n|\n|\r)/g,' '));
      if (_resultFile.data !== _expectedFile.data) {
        console.log('\n\n----------------------');
        console.log(_resultFile.name + ' !== ' +  _expectedFile.name);
        console.log('----------------------\n\n');
        assert.strictEqual(_resultFile.data, _expectedFile.data);
      }
    }
  }
}

function openUnzippedDocument (dirname, type) {
  var _dirname = path.join(__dirname, 'datasets', 'image', dirname, type);
  var _files = helper.walkDirSync(_dirname);
  var _report = {
    isZipped   : false,
    filename   : dirname,
    embeddings : [],
    files      : []
  };
  _files.forEach(file => {
    var _data = fs.readFileSync(file);
    var _extname = path.extname(file);
    var _file = {
      name     : path.relative(_dirname, file),
      data     : _data,
      isMarked : false,
      parent   : ''
    };
    if (_extname === '.xml' || _extname === '.rels') {
      _file.data = _data.toString();
      _file.isMarked = true;
    }
    _report.files.push(_file);
  });
  return _report;
}
