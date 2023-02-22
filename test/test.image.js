/* eslint-disable max-statements-per-line */
const assert    = require('assert');
const helperTest = require('./helper');
const carbone   = require('../lib/index');
const path      = require('path');
const fs        = require('fs');
const image     = require('../lib/image');
const preprocessor  = require('../lib/preprocessor');
const nock      = require('nock');
const barcodeFormatter = require('../formatters/barcode');

describe('Image processing in ODG, ODT, ODP, ODS, DOCX, and XSLX', function () {
  const _imageFRBase64jpg            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageFR_base64_html_jpg.txt'  ), 'utf8');
  const _imageFRBase64jpgWithoutType = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageFR_base64_jpg.txt'       ), 'utf8');
  const _imageDEBase64jpg            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageDE_base64_html_jpg.txt'  ), 'utf8');
  const _imageITBase64png            = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageIT_base64_html_png.txt'  ), 'utf8');
  const _imageLogoBase64jpg          = fs.readFileSync(path.join(__dirname, 'datasets', 'image', 'imageLogo_base64_html_jpg.txt'), 'utf8');

  describe('[Full test] ODG', function () {
    it('should do nothing if there is no marker inside XML', function (done) {
      const _testedReport = 'image/odg-simple-without-marker';
      carbone.render(helperTest.openTemplate(_testedReport), {}, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should inject 3 images inside the ODG document with no imageFit, with imageFit contain and imageFit fill', function (done) {
      const _testedReport = 'image/odg-simple';
      const _data = {
        image  : _imageDEBase64jpg,
        image2 : _imageLogoBase64jpg,
        image3 : _imageLogoBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });


    it.skip('should generate barcodes as images and as fonts', function (done) {
      const _testedReport = 'image/odg-barcodes';
      const _data = {
        /** Barcodes as Fonts & Images*/
        item  : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
        item2 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
        item3 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
        item4 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39')
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('[Full test] ODP', function () {
    it('should do nothing if there is no marker inside XML', function (done) {
      const _testedReport = 'image/odp-simple-without-marker';
      carbone.render(helperTest.openTemplate(_testedReport), {}, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should inject 3 images inside the ODP document with no imageFit, with imageFit contain and imageFit fill', function (done) {
      const _testedReport = 'image/odp-simple';
      const _data = {
        image  : _imageDEBase64jpg,
        image2 : _imageLogoBase64jpg,
        image3 : _imageLogoBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should accept image loop across slides', function (done) {
      const _testedReport = 'image/odp-image-loop';
      const _data = {
        sample : [
          { image : _imageFRBase64jpg },
          { image : _imageDEBase64jpg },
          { image : _imageITBase64png }
        ]
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it.skip('should generate barcodes as images and as fonts', function (done) {
      const _testedReport = 'image/odp-barcodes';
      const _data = {
        /** Barcodes as Fonts & Images*/
        item  : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
        item2 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
        item3 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
        item4 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39')
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('[Full test] ODT', function () {
    it('should do nothing if there is no marker inside XML', function (done) {
      const _testedReport = 'image/odt-simple-without-marker';
      carbone.render(helperTest.openTemplate(_testedReport), {}, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace an image (base64 jpg)', function (done) {
      const _testedReport = 'image/odt-simple';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace image (base64 with old method type) DEPRECATED', function (done) {
      const _testedReport = 'image/odt-simple';
      const _data = {
        image        : '$base64image',
        $base64image : {
          data      : _imageFRBase64jpgWithoutType,
          extension : 'jpeg'
        }
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace 3 images with 3 imageFit `contain` and `fill` and contain by default', function (done) {
      const _testedReport = 'image/odt-image-size';
      const _data = {
        logo : _imageLogoBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should return an error if the image anchor is absolute and used in a loop', function (done) {
      const _testedReport = 'image/odt-image-absolute-anchor-loop';
      const _data = [{
        image : _imageLogoBase64jpg
      }];
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'Error: The template contains a list of floating images, you must change the images anchor-type to "as character" where the marker "d[i].image" is bound.');
        helperTest.assert(res, null);
        done();
      });
    });
    it('should replace image if the anchor is absolute and not used in a loop', function (done) {
      const _testedReport = 'image/odt-image-absolute-anchor-no-loop';
      const _data = {
        image : _imageLogoBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it('should replace image with loops (base64 jpg)\
      should accept PNG image even if the template image is a JPEG\
      should accept image in header with conditions i=0\
      should not save the image twice if it used twice in the document', function (done) {
      const _testedReport = 'image/odt-loop';
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
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it.skip('should generate all barcodes as images', function (done) {
      const _testedReport = 'image/odt-barcodes';
      const _data = {
        /** Barcodes as Fonts */
        item     : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
        item2    : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
        item3    : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
        item4    : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39'),
        /** Barcodes as Images */
        barcodes : barcodeFormatter.supportedBarcodes
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
    it.skip('should generate barcodes as images with options', function (done) {
      const _testedReport = 'image/odt-barcodes-options';
      const _data = {
        item : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13')
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('[Full test] ODS', function () {
    it('should do nothing if there is no marker inside XML', function (done) {
      const _testedReport = 'image/ods-simple-without-marker';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should replace one image (base64 jpg)', function (done) {
      const _testedReport = 'image/ods-simple';
      const _data = {
        image : _imageFRBase64jpg
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it('should replace multiple images (base64 jpg png)', function (done) {
      const _testedReport = 'image/ods-complex';
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
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });

    it.skip('should generate barcodes as images and as fonts', function (done) {
      const _testedReport = 'image/ods-barcodes';
      const _data = {
        /** Barcodes as Fonts & Images*/
        item  : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
        item2 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
        item3 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
        item4 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39')
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err+'', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });

  describe('Methods for LO (ODT/ODS/ODP/ODG)', function () {
    describe('preProcessLo', function () {
      it('should do nothing if the image tags are including a text box', function (done) {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:body><office:text><text:p text:style-name="Standard"><draw:frame text:anchor-type="paragraph" draw:z-index="0" draw:name="Shape1" draw:style-name="gr2" draw:text-style-name="P1" svg:width="4.315cm" svg:height="2.585cm" svg:x="1.732cm" svg:y="0.714cm"><draw:text-box><text:p>{d.id}</text:p></draw:text-box></draw:frame><draw:frame text:anchor-type="paragraph" draw:z-index="1" draw:name="Shape2" draw:style-name="gr1" draw:text-style-name="P1" svg:width="3.197cm" svg:height="1.812cm" svg:x="8.326cm" svg:y="0.572cm"><draw:text-box><text:p>{d.missionId}</text:p></draw:text-box></draw:frame></text:p></office:text></office:body></office:document-content>';
        let template = {
          files : [
            {
              name : 'content.xml',
              data : _expectedXML
            }
          ]
        };
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, _expectedXML);
        done();
      });

      it('should do nothing if it is not an image but a table inside an ODG file', function (done) {
        const _expectedXML = '' +
          '<office:body>' +
            '<office:presentation>' +
              '<draw:page draw:name="page1" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">' +
                '<draw:frame draw:style-name="standard" draw:layer="layout" svg:width="12.683cm" svg:height="3.998cm" svg:x="7.373cm" svg:y="8.549cm">' +
                  '<table:table table:template-name="default" table:use-first-row-styles="true" table:use-banding-rows-styles="true">' +
                    '<table:table-column table:style-name="co1"/>' +
                    '<table:table-column table:style-name="co1"/>' +
                    '<table:table-row table:style-name="ro1" table:default-cell-style-name="ce1">' +
                      '<table:table-cell>' +
                        '<text:p>{d.list[i].name}</text:p>' +
                      '</table:table-cell>' +
                      '<table:table-cell>' +
                        '<text:p>{d.list[i].age}</text:p>' +
                      '</table:table-cell>' +
                    '</table:table-row>' +
                    '<table:table-row table:style-name="ro2" table:default-cell-style-name="ce1">' +
                      '<table:table-cell>' +
                        '<text:p>{d.list[i+1]}</text:p>' +
                      '</table:table-cell>' +
                      '<table:table-cell/>' +
                    '</table:table-row>' +
                  '</table:table>' +
                  '<draw:image xlink:href="Pictures/TablePreview1.svm" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
                '</draw:frame>' +
              '</draw:page>' +
              '<presentation:settings presentation:mouse-visible="false"/>' +
            '</office:presentation>' +
          '</office:body>';
        const _template = {
          extension : 'odp',
          files     : [
            {
              name : 'content.xml',
              data : _expectedXML
            }
          ]
        };
        image.preProcessLo(_template);
        helperTest.assert(_template.files[0].data, _expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (ODT/ODS XML from LO) (unit: CM)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '' +
              '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0">' +
                '<draw:image xlink:href="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/>' +
                '<svg:desc>{d.image}</svg:desc>' +
              '</draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="fr1" draw:name="carbone-image-{d.image:generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:width="{d.image:scaleImage(width, 6.92, cm, fillWidth)}cm" svg:height="{d.image:scaleImage(height, 4.616, cm, fillWidth)}cm" draw:z-index="0"><draw:image xlink:href="{d.image:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="{d.image:generateOpenDocumentImageMimeType()}"/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image formatters, AND the `:isImage` formatter if the `:barcode` formatter exist on the xml (ODT/ODS XML from LO) (unit: CM) (BARCODE formatter)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '' +
              '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0">' +
                '<draw:image xlink:href="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/>' +
                '<svg:desc>{d.image:barcode(ean13)}</svg:desc>' +
              '</draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="fr1" draw:name="carbone-image-{d.image:isImage:barcode(ean13):generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:width="{d.image:isImage:barcode(ean13):scaleImage(width, 6.92, cm, fillWidth)}cm" svg:height="{d.image:isImage:barcode(ean13):scaleImage(height, 4.616, cm, fillWidth)}cm" draw:z-index="0"><draw:image xlink:href="{d.image:isImage:barcode(ean13):generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="{d.image:isImage:barcode(ean13):generateOpenDocumentImageMimeType()}"/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (ODT XML from WORD) (unit: INCH)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '<draw:frame draw:style-name="a0" draw:name="Image 1" text:anchor-type="as-char" svg:x="0in" svg:y="0in" svg:width="0.3375in" svg:height="0.20903in" style:rel-width="scale" style:rel-height="scale"><draw:image xlink:href="media/image1.jpeg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title/><svg:desc>{d.image}</svg:desc></draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="a0" draw:name="carbone-image-{d.image:generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:x="0in" svg:y="0in" svg:width="{d.image:scaleImage(width, 0.3375, in, fillWidth)}in" svg:height="{d.image:scaleImage(height, 0.20903, in, fillWidth)}in" style:rel-width="scale" style:rel-height="scale"><draw:image xlink:href="{d.image:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (ODT/ODS XML from LO) (unit: CM) (imageFit contain)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.image:imageFit(contain)}</svg:desc></draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="fr1" draw:name="carbone-image-{d.image:generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:width="{d.image:scaleImage(width, 6.92, cm, contain)}cm" svg:height="{d.image:scaleImage(height, 4.616, cm, contain)}cm" draw:z-index="0"><draw:image xlink:href="{d.image:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="{d.image:generateOpenDocumentImageMimeType()}"/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });
      it('should replace the main document tag attributes with image markers and formaters (ODT/ODS XML from LO) (unit: CM) (imageFit fillWidth)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.image:imageFit(fillWidth)}</svg:desc></draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="fr1" draw:name="carbone-image-{d.image:generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:width="{d.image:scaleImage(width, 6.92, cm, fillWidth)}cm" svg:height="{d.image:scaleImage(height, 4.616, cm, fillWidth)}cm" draw:z-index="0"><draw:image xlink:href="{d.image:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="{d.image:generateOpenDocumentImageMimeType()}"/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });
      it('should replace the main document tag attributes with image markers and formaters (ODT/ODS XML from LO) (unit: CM) (imageFit fill)', function (done) {
        let template = {
          files : [
            {
              name : 'content.xml',
              data : '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.image:imageFit(fill)}</svg:desc></draw:frame>'
            }
          ]
        };
        let expectedXML = '<draw:frame draw:style-name="fr1" draw:name="carbone-image-{d.image:generateOpenDocumentUniqueNumber()}" text:anchor-type="as-char" svg:width="6.92cm" svg:height="4.616cm" draw:z-index="0"><draw:image xlink:href="{d.image:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="{d.image:generateOpenDocumentImageMimeType()}"/><svg:desc></svg:desc></draw:frame>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });
      it('should support ODS content that includes a loop of image (anchor set to "To cell")', function (done) {
        let template = {
          extension : 'ods',
          files     : [
            {
              name : 'content.xml',
              data : '' +
              '<table:table-row table:style-name="ro1">'+
                '<table:table-cell>'+
                  '<draw:frame draw:z-index="0" draw:name="Image 1" draw:style-name="gr1" draw:text-style-name="P1" svg:width="1.0835in" svg:height="0.648in" svg:x="0.0465in" svg:y="0.0839in">'+
                    '<draw:image xlink:href="Pictures/10000000000000640000003E7BCFF6B890FF3254.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" draw:mime-type="image/jpeg">'+
                      '<text:p/>'+
                    '</draw:image>'+
                    '<svg:title>{d.list[i].img:imageFit(contain)}</svg:title>'+
                  '</draw:frame>'+
                '</table:table-cell>'+
              '</table:table-row>'+
              '<table:table-row table:style-name="ro1">'+
                '<table:table-cell office:value-type="string" calcext:value-type="string">'+
                  '<text:p>{d.list[i+1].img}</text:p>'+
                '</table:table-cell>'+
              '</table:table-row>'
            }
          ]
        };
        let expectedXML = '' +
          '<table:table-row table:style-name="ro1">'+
            '<table:table-cell>'+
              '<draw:frame draw:z-index="0" draw:name="carbone-image-{d.list[i].img:generateOpenDocumentUniqueNumber()}" draw:style-name="gr1" draw:text-style-name="P1" svg:width="{d.list[i].img:scaleImage(width, 1.0835, in, contain)}in" svg:height="{d.list[i].img:scaleImage(height, 0.648, in, contain)}in" svg:x="0.0465in" svg:y="0.0839in">'+
                '<draw:image xlink:href="{d.list[i].img:generateOpenDocumentImageHref()}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" draw:mime-type="image/jpeg">'+
                  '<text:p/>'+
                '</draw:image>'+
                '<svg:title></svg:title>'+
              '</draw:frame>'+
            '</table:table-cell>'+
          '</table:table-row>'+
          '<table:table-row table:style-name="ro1">'+
            '<table:table-cell office:value-type="string" calcext:value-type="string">'+
              '<text:p>{d.list[i+1].img}</text:p>'+
            '</table:table-cell>'+
          '</table:table-row>';
        image.preProcessLo(template);
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });
    });

    describe("_isImageListAnchorTypeBlockLO : Check if the anchor type of a list of images is set to 'as character' ", function () {

      it("should return true if the image anchor type is set to 'as character' (xml from ODT template)", function () {
        let _xml = '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="as-char" svg:width="2.646cm" svg:height="1.64cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000000640000003E014CEF59845421C2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.list[i].img}</svg:desc></draw:frame>';
        let _marker = '{d.list[i].img}';
        helperTest.assert(image._isImageListAnchorTypeBlockLO(_xml, _marker), true);
      });

      it("should return true if the image anchor type is NOT set to 'as character' with a marker accessing to a single element inside a list (xml from ODT template)", function () {
        let _xml = '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="paragraph" svg:width="2.646cm" svg:height="1.64cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000000640000003E014CEF59845421C2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.list[i=2].img}</svg:desc></draw:frame>';
        helperTest.assert(image._isImageListAnchorTypeBlockLO(_xml, '{d.list[i=2].img}'), true);
        helperTest.assert(image._isImageListAnchorTypeBlockLO(_xml, '{d.list[4].img}'), true);
      });

      it("should throw an error if the image anchor type is NOT set to 'as character' (xml from ODT template)", function () {
        let _xml = '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="paragraph" svg:width="2.646cm" svg:height="1.64cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000000640000003E014CEF59845421C2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.list[i].img}</svg:desc></draw:frame>';
        let _marker = '{d.list[i].img}';
        assert.throws(() => image._isImageListAnchorTypeBlockLO(_xml, _marker),  Error('The template contains a list of floating images, you must change the images anchor-type to "as character" where the marker "{d.list[i].img}" is bound.'));
      });

      it("should throw an error if there's a list of images in an ODS template (xml from ODS template)", function () {
        let _xml = '<draw:frame draw:style-name="fr1" draw:name="Image1" svg:width="2.646cm" svg:height="1.64cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000000640000003E014CEF59845421C2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.list[i].img}</svg:desc></draw:frame>';
        let _marker = '{d.list[i].img}';
        assert.throws(() => image._isImageListAnchorTypeBlockLO(_xml, _marker),  Error('The template contains a list of images, it is not supported and may break the report.'));
      });

      it('should return true if the xml or marker are not provided or the marker is not a list', function () {
        let _xml = '<draw:frame draw:style-name="fr1" draw:name="Image1" text:anchor-type="paragraph" svg:width="2.646cm" svg:height="1.64cm" draw:z-index="0"><draw:image xlink:href="Pictures/10000000000000640000003E014CEF59845421C2.jpg" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/jpeg"/><svg:desc>{d.list[i].img}</svg:desc></draw:frame>';
        let _marker = '{d.img}';
        helperTest.assert(image._isImageListAnchorTypeBlockLO(_xml, _marker), true);
        helperTest.assert(image._isImageListAnchorTypeBlockLO(undefined, _marker), true);
        helperTest.assert(image._isImageListAnchorTypeBlockLO(_xml, undefined), true);
      });
    });

    describe('postProcessLo', function () {
      it('should insert an image references in META-INF/manifest.xml', function () {
        const _template = {
          files : [{
            name : 'META-INF/manifest.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarboneImage1.jpeg" manifest:media-type="image/jpeg"/></manifest:manifest>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.jpeg', {
          mimetype  : 'image/jpeg',
          extension : 'jpeg',
          id        : 1,
          data      : '1234',
        });
        image.postProcessLo(_template, null, _options);
        helperTest.assert(_template.files[0].data, _expectedContent);
        helperTest.assert(_template.files[1], { name : 'Pictures/CarboneImage1.jpeg', parent : '', data : '1234' });
      });

      it('should insert images references in META-INF/manifest.xml', function () {
        const _template = {
          files : [{
            name : 'META-INF/manifest.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" manifest:media-type="image/jpeg"/></manifest:manifest>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="Pictures/10000000000003E80000029B8FE7CEEBB673664E.jpg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarboneImage0.jpeg" manifest:media-type="image/jpeg"/><manifest:file-entry manifest:full-path="Pictures/CarboneImage1.png" manifest:media-type="image/png"/><manifest:file-entry manifest:full-path="Pictures/CarboneImage2.gif" manifest:media-type="image/gif"/></manifest:manifest>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.jpeg', {
          mimetype  : 'image/jpeg',
          extension : 'jpeg',
          id        : 0,
          data      : '1234',
        });
        _options.imageDatabase.set('logo.png', {
          mimetype  : 'image/png',
          extension : 'png',
          id        : 1,
          data      : '5678',
        });
        _options.imageDatabase.set('logo.gif', {
          mimetype  : 'image/gif',
          extension : 'gif',
          id        : 2,
          data      : '9101112',
        });
        image.postProcessLo(_template, null, _options);
        helperTest.assert(_template.files[0].data, _expectedContent);
        helperTest.assert(_template.files[1], { name : 'Pictures/CarboneImage0.jpeg', parent : '', data : '1234' });
        helperTest.assert(_template.files[2], { name : 'Pictures/CarboneImage1.png', parent : '', data : '5678' });
        helperTest.assert(_template.files[3], { name : 'Pictures/CarboneImage2.gif', parent : '', data : '9101112' });
      });
    });
  });

  describe('PPTX MS document', function () {
    describe('PPTX Full test', function () {
      it('should render images into a document (simple tags and access to one element from a list)', function (done) {
        const _testedReport = 'image/pptx-simple';
        const _data = {
          image  : _imageDEBase64jpg,
          image2 : _imageLogoBase64jpg,
          image3 : _imageLogoBase64jpg,
          list   : [
            { image4 : _imageFRBase64jpg }
          ]
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err) => {
          helperTest.assert(err+'', 'null');
          done();
        });
      });

      it('should do nothing if the template does not include Carbone tags', function (done) {
        const _testedReport = 'image/pptx-simple-without-marker';
        const _data = {
          image  : _imageDEBase64jpg,
          image2 : _imageLogoBase64jpg,
          image3 : _imageLogoBase64jpg,
          list   : [
            { image4 : _imageFRBase64jpg }
          ]
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err) => {
          helperTest.assert(err+'', 'null');
          done();
        });
      });
    });

    describe('PPTX preProcessPPTX', function () {
      it('should preprocess the PPTX with images (made from PowerPoint)', function (done) {

        const getContent = (result) => {
          result = result || false;
          return '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
          '<p:sld>'+
            '<p:pic>' +
              '<p:nvPicPr>' +
                  result === true ? '<p:cNvPr id="5" name="Picture 4" descr="">' : '<p:cNvPr id="5" name="Picture 4" descr="{d.image}">' +
                  '<a:extLst>' +
                    '<a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}">' +
                      '<a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{75F52970-A337-F7FC-90B6-5B954AC9558F}"/>' +
                    '</a:ext>' +
                  '</a:extLst>' +
                '</p:cNvPr>' +
                '<p:cNvPicPr>' +
                  '<a:picLocks noChangeAspect="1"/>' +
                '</p:cNvPicPr>' +
                '<p:nvPr/>' +
              '</p:nvPicPr>' +
              '<p:blipFill>' +
                result === true ? '<a:blip r:embed="{d.image:generateImageDocxReference(slide1.xml)}"/>' : '<a:blip r:embed="rId2"/>' +
                '<a:stretch>' +
                  '<a:fillRect/>' +
                '</a:stretch>' +
              '</p:blipFill>' +
              '<p:spPr>' +
                '<a:xfrm>' +
                  '<a:off x="2660007" y="924548"/>' +
                  result === true ? '<a:ext cx="{d.image:scaleImage(width, 6871986, emu, fillWidth)}" cy="{d.image:scaleImage(height, 4581324, emu, fillWidth)}"/>' : '<a:ext cx="6871986" cy="4581324"/>' +
                '</a:xfrm>' +
                '<a:prstGeom prst="rect">' +
                  '<a:avLst/>' +
                '</a:prstGeom>' +
              '</p:spPr>' +
            '</p:pic>' +
          '</p:sld>';
        };

        let template = {
          files : [
            {
              name : 'ppt/slides/slide1.xml',
              data : getContent()
            }
          ]
        };
        image.preProcessPPTX(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, getContent(true));
        done();
      });

      it('should throw an error if a list is printed', function (done) {

        const getContent = (version) => {
          return '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
          '<p:sld>'+
            '<p:pic>' +
              '<p:nvPicPr>' +
                  (version === 1 ? '<p:cNvPr id="5" name="Picture 4" descr="{d.list[i].test}">' : '<p:cNvPr id="5" name="Picture 4" descr="{d.list[i+1].test}">') +
                  '<a:extLst>' +
                    '<a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}">' +
                      '<a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{75F52970-A337-F7FC-90B6-5B954AC9558F}"/>' +
                    '</a:ext>' +
                  '</a:extLst>' +
                '</p:cNvPr>' +
                '<p:cNvPicPr>' +
                  '<a:picLocks noChangeAspect="1"/>' +
                '</p:cNvPicPr>' +
                '<p:nvPr/>' +
              '</p:nvPicPr>' +
              '<p:blipFill>' +
                '<a:blip r:embed="rId2"/>' +
                '<a:stretch>' +
                  '<a:fillRect/>' +
                '</a:stretch>' +
              '</p:blipFill>' +
              '<p:spPr>' +
                '<a:xfrm>' +
                  '<a:off x="2660007" y="924548"/>' +
                  '<a:ext cx="6871986" cy="4581324"/>' +
                '</a:xfrm>' +
                '<a:prstGeom prst="rect">' +
                  '<a:avLst/>' +
                '</a:prstGeom>' +
              '</p:spPr>' +
            '</p:pic>' +
          '</p:sld>';
        };

        let template = {
          files : [
            {
              name : 'ppt/slides/slide1.xml',
              data : getContent(1)
            }
          ]
        };
        assert.throws(() => image.preProcessPPTX(template), Error('PPTX templates do not support list of images "d.list[i].test".'));
        template.files[0].data = getContent(2);
        assert.throws(() => image.preProcessPPTX(template), Error('PPTX templates do not support list of images "d.list[i+1].test".'));
        done();
      });

      it('should preprocess the PPTX with barcodes (made from PowerPoint)', function (done) {

        const getContent = (result) => {
          result = result || false;
          return '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
          '<p:sld>'+
            '<p:pic>' +
              '<p:nvPicPr>' +
                  (result === true ? '<p:cNvPr id="5" name="Picture 4" descr="">' : '<p:cNvPr id="5" name="Picture 4" descr="{d.image:barcode(code39)}">') +
                  '<a:extLst>' +
                    '<a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}">' +
                      '<a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{75F52970-A337-F7FC-90B6-5B954AC9558F}"/>' +
                    '</a:ext>' +
                  '</a:extLst>' +
                '</p:cNvPr>' +
                '<p:cNvPicPr>' +
                  '<a:picLocks noChangeAspect="1"/>' +
                '</p:cNvPicPr>' +
                '<p:nvPr/>' +
              '</p:nvPicPr>' +
              '<p:blipFill>' +
                (result === true ? '<a:blip r:embed="{d.image:isImage:barcode(code39):generateImageDocxReference(slide1.xml)}"/>' : '<a:blip r:embed="rId2"/>') +
                '<a:stretch>' +
                  '<a:fillRect/>' +
                '</a:stretch>' +
              '</p:blipFill>' +
              '<p:spPr>' +
                '<a:xfrm>' +
                  '<a:off x="2660007" y="924548"/>' +
                  (result === true ? '<a:ext cx="{d.image:isImage:barcode(code39):scaleImage(width, 6871986, emu, fillWidth)}" cy="{d.image:isImage:barcode(code39):scaleImage(height, 4581324, emu, fillWidth)}"/>' : '<a:ext cx="6871986" cy="4581324"/>') +
                '</a:xfrm>' +
                '<a:prstGeom prst="rect">' +
                  '<a:avLst/>' +
                '</a:prstGeom>' +
              '</p:spPr>' +
            '</p:pic>' +
          '</p:sld>';
        };

        let template = {
          files : [
            {
              name : 'ppt/slides/slide1.xml',
              data : getContent(false)
            }
          ]
        };
        image.preProcessPPTX(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, getContent(true));
        done();
      });
    });

    describe('PPTX postProcessPPTX', function () {
      it('should do nothing if imageDatabase is empty', function () {
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n</Relationships>';
        const _template = {
          files : [{
            name : 'ppt/slides/_rels/slide1.xml.rels',
            data : _expectedContent
          }]
        };
        const _options = {
          imageDatabase : new Map()
        };
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0].data, _expectedContent);
      });

      it('should add an image references into "ppt/slides/_rels/slide1.xml.rels" by using imageDatabase and update the content_type.xml', function () {
        const _template = {
          files : [{
            name : 'ppt/slides/_rels/slide1.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpg"/></Relationships>',
          },
          {
            name : '[Content_Types].xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpg"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/CarboneImage0.png" Id="rIdCarbone0"/></Relationships>';
        const _expectedContentType = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('carbone.io/logo.png', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'slide1.xml' ],
          extension : 'png'
        });
        image.postProcessPPTX(_template, null, _options);

        helperTest.assert(_template.files[0], {
          name   : 'ppt/media/CarboneImage0.png',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1].data, _expectedContent);
        helperTest.assert(_template.files[2].data, _expectedContentType);
      });
    });
  });

  describe('DOCX MS document', function () {
    describe('[Full test] DOCX', function () {

      it('should not crash if a marker is placed in a shape instead of an image', function (done) {
        const _testedReport = 'image/docx-image-in-shape';
        const _data = {
          image : [
            { value : _imageFRBase64jpg },
            { value : _imageITBase64png }
          ]
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err) => {
          helperTest.assert(err+'', 'null');
          done();
        });
      });

      it('should do nothing if there is no marker inside the XML (created from LO)', function (done) {
        const _testedReport = 'image/docx-simple-without-marker';
        const _data = {
          image : _imageFRBase64jpg
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });
      it('should replace an image (Created from LO)(base64 jpg)', function (done) {
        const _testedReport = 'image/docx-simple';
        const _data = {
          image : _imageDEBase64jpg
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('should replace an image with the right aspect ratio even if the same is used in two independant headers)', function (done) {
        const _testedReport = 'image/docx-same-image-two-headers';
        const _data = {
          image : _imageLogoBase64jpg
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('should replace an image (Created from MS Word Windows)(base64 jpg)', function (done) {
        const _testedReport = 'image/docx-windows-word';
        const _data = {
          image : _imageDEBase64jpg
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('should replace an image (Created from MS Word Online)(base64 jpg)', function (done) {
        const _testedReport = 'image/docx-word-online';
        const _data = {
          tests : {
            child : {
              child : {
                imageDE : _imageDEBase64jpg
              }
            }
          }
        };
        carbone.render(helperTest.openTemplate(_testedReport, true), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport, true);
          done();
        });
      });

      it('should create a list of images (Created from Libre Office)(base64 jpg)', function (done) {
        const _testedReport = 'image/docx-list';
        const _data = {
          list : [
            {
              img : _imageFRBase64jpg
            },
            {
              img : _imageDEBase64jpg
            },
            {
              img : _imageITBase64png
            },
            {
              img : _imageLogoBase64jpg
            }
          ]
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('should replace 4 images to invalid image', function (done) {
        const _testedReport = 'image/docx-errors';
        const _data = {
          tests : {
            imageError : 'This is some random text',
          },
          error2 : 'https://media.giphy.com/media/yXBqba0Zx8',
          error3 : 'data:image/jpeg;base64,',
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('should replace multiple images with a complexe data object (child of child) (base64 jpg)', function (done) {
        const _testedReport = 'image/docx-complex';
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
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });

      it('generating unique ids for docPr tag should not break filters in loop', function (done) {
        var _xml = (expected) => { return ''
          + '<w:p>'
          + '  <w:r>'
          + '    <w:rPr>'
          +       (expected ? '3' : '{d[i, type=3].type}')
          + '    </w:rPr>'
          + '    <w:drawing>'
          + '      <wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="28B07B0E" wp14:editId="287BE7E9">'
          + '        <wp:docPr id="'+(expected ? '1000' : '3')+'" name="Billede 6" descr=""/>'
          + '        <a:graphic>'
          +           (expected ? '3' : '{d[i, type=3].type}')
          + '        </a:graphic>'
          + '      </wp:inline>'
          + '    </w:drawing>'
          + '  </w:r>'
          + (expected ? '' : ''
            + '<w:r>'
            + '    <w:t>{d[i+1, type=3].type}</w:t>'
            + '</w:r>'
          )
          + '</w:p>';
        };
        var _report = {
          isZipped   : false,
          filename   : 'template.docx',
          embeddings : [],
          extension  : 'docx',
          files      : [
            {name : 'word/document.xml', parent : '' , data : _xml()   , isMarked : true},
            {name : 'word/other.xml'   , parent : '' , data : '<p></p>', isMarked : true}
          ]
        };
        carbone.render(_report, [{ type : 3 }, { type : 1 }], function (err, res) {
          helperTest.assert(err + '', 'null');
          helperTest.assert(res.files[0].name, 'word/document.xml');
          helperTest.assert(res.files[0].data, _xml(true));
          done();
        });
      });

      it.skip('should generate barcodes as images and as fonts', function (done) {
        const _testedReport = 'image/docx-barcodes';
        const _data = {
          /** Barcodes as Fonts & Images*/
          item  : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
          item2 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
          item3 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
          item4 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39')
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });
    });

    describe('DOCX preprocess XML', function () {
      it('should replace the main document tag attributes with image markers and formatters (common DOCX xml from LO or MS)', function (done) {
        let template = {
          files : [
            {
              name : 'word/document.xml',
              data : ''+
              '<w:drawing>' +
                '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
                  '<wp:extent cx="952500" cy="590550"/>' +
                  '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                  '<wp:docPr id="1" name="Image1" descr="{d.image}"></wp:docPr>' +
                  '<wp:cNvGraphicFramePr>' +
                    '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                  '</wp:cNvGraphicFramePr>' +
                  '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                        '<pic:nvPicPr>' +
                          '<pic:cNvPr id="1" name="Image1" descr="{d.image}"></pic:cNvPr>' +
                        '<pic:cNvPicPr>' +
                        '<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>' +
                          '</pic:cNvPicPr>' +
                        '</pic:nvPicPr>' +
                        '<pic:blipFill>' +
                          '<a:blip r:embed="rId2"></a:blip>' +
                          '<a:stretch><a:fillRect/></a:stretch>' +
                        '</pic:blipFill>' +
                        '<pic:spPr bwMode="auto">' +
                          '<a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' +
                        '</pic:spPr>' +
                      '</pic:pic>' +
                    '</a:graphicData>' +
                  '</a:graphic>' +
                '</wp:inline>' +
              '</w:drawing>'
            }
          ]
        };
        let expectedXML = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{d.image:scaleImage(width, 952500, emu, fillWidth)}" cy="{d.image:scaleImage(height, 590550, emu, fillWidth)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Image1" descr=""></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:generateImageDocxId()}" name="" descr=""></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:generateImageDocxReference(document.xml)}"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="{d.image:scaleImage(width, 952500, emu, fillWidth)}" cy="{d.image:scaleImage(height, 590550, emu, fillWidth)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (DOCX xml from MS Word Online)', function (done) {
        let template = {
          files : [
            {
              // to get the report name, Carbone looks at "document", "footer", or "header".
              // Previously the file _rels/.rels was use to find the main file content
              name : 'word/documentName1234.xml',
              data : '<w:drawing><wp:inline wp14:editId="5C7CCEE1" wp14:anchorId="63CC715F"><wp:extent cx="2335161" cy="1447800" /><wp:effectExtent l="0" t="0" r="0" b="0" /><wp:docPr id="1231221318" name="" title="{d.tests.child.child.imageDE}" /><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1" /></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="" /><pic:cNvPicPr /></pic:nvPicPr><pic:blipFill><a:blip r:embed="R1e71cf0a0beb4eb3"><a:extLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a14:useLocalDpi val="0" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" /></a:ext></a:extLst></a:blip><a:stretch><a:fillRect /></a:stretch></pic:blipFill><pic:spPr><a:xfrm rot="0" flipH="0" flipV="0"><a:off x="0" y="0" /><a:ext cx="2335161" cy="1447800" /></a:xfrm><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
            }
          ]
        };
        let expectedXML = '<w:drawing><wp:inline wp14:editId="5C7CCEE1" wp14:anchorId="63CC715F"><wp:extent cx="{d.tests.child.child.imageDE:scaleImage(width, 2335161, emu, fillWidth)}" cy="{d.tests.child.child.imageDE:scaleImage(height, 1447800, emu, fillWidth)}" /><wp:effectExtent l="0" t="0" r="0" b="0" /><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="" title="" /><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1" /></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="{d.tests.child.child.imageDE:generateImageDocxId()}" name="" /><pic:cNvPicPr /></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.tests.child.child.imageDE:generateImageDocxReference(documentName1234.xml)}"><a:extLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a14:useLocalDpi val="0" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" /></a:ext></a:extLst></a:blip><a:stretch><a:fillRect /></a:stretch></pic:blipFill><pic:spPr><a:xfrm rot="0" flipH="0" flipV="0"><a:off x="0" y="0" /><a:ext cx="{d.tests.child.child.imageDE:scaleImage(width, 2335161, emu, fillWidth)}" cy="{d.tests.child.child.imageDE:scaleImage(height, 1447800, emu, fillWidth)}" /></a:xfrm><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (common DOCX xml from LO or MS) - test imageFit formatter with the value contain', function (done) {
        let template = {
          files : [
            {
              name : 'word/document.xml',
              data : '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="952500" cy="590550"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.image:imageFit(contain)}"></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.image}"></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
            }
          ]
        };
        let expectedXML = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{d.image:scaleImage(width, 952500, emu, contain)}" cy="{d.image:scaleImage(height, 590550, emu, contain)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Image1" descr=""></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:generateImageDocxId()}" name="" descr=""></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:generateImageDocxReference(document.xml)}"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="{d.image:scaleImage(width, 952500, emu, contain)}" cy="{d.image:scaleImage(height, 590550, emu, contain)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image formatters and the `isImage` formatter if the `barcode` is included (common DOCX xml from LO or MS) (BARCODE)', function (done) {
        let template = {
          files : [
            {
              name : 'word/document.xml',
              data : '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="952500" cy="590550"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.image:barcode(ean13):imageFit(contain)}"></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.image}"></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
            }
          ]
        };
        let expectedXML = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{d.image:isImage:barcode(ean13):scaleImage(width, 952500, emu, contain)}" cy="{d.image:isImage:barcode(ean13):scaleImage(height, 590550, emu, contain)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Image1" descr=""></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:isImage:barcode(ean13):generateImageDocxId()}" name="" descr=""></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:isImage:barcode(ean13):generateImageDocxReference(document.xml)}"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="{d.image:isImage:barcode(ean13):scaleImage(width, 952500, emu, contain)}" cy="{d.image:isImage:barcode(ean13):scaleImage(height, 590550, emu, contain)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formaters (common DOCX xml from LO or MS) - test imageFit formatter with the value fill', function (done) {
        let template = {
          files : [
            {
              name : 'word/document.xml',
              data : '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="952500" cy="590550"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image1" descr="{d.image:imageFit(fill)}"></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr="{d.image}"></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
            }
          ]
        };
        let expectedXML = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="952500" cy="590550"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Image1" descr=""></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:generateImageDocxId()}" name="" descr=""></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:generateImageDocxReference(document.xml)}"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, expectedXML);
        done();
      });
      it('should replace the main document, the footer and header with image markers and formaters (common DOCX xml from MS)', function (done) {
        let template = {
          files : [
            {
              name : 'word/document.xml',
              data : '<w:document><w:body><w:p w14:paraId="10D86908" w14:textId="594213EC" w:rsidR="00F040CB" w:rsidRPr="00F040CB" w:rsidRDefault="00F040CB"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="57033187" wp14:editId="308FFE5B"><wp:extent cx="722136" cy="702021"/><wp:effectExtent l="0" t="0" r="1905" b="0"/><wp:docPr id="6" name="Picture 6" descr="{d.tests.image}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="3" name="Picture 3" descr="{d.tests.image}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId6"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="742406" cy="721727"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body></w:document>'
            },
            {
              name : 'word/footer2.xml',
              data : '<w:ftr><w:p w14:paraId="570D5375" w14:textId="1642C3D9" w:rsidR="00F040CB" w:rsidRPr="00F040CB" w:rsidRDefault="00F040CB" w:rsidP="00F040CB"><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="1A6006B2" wp14:editId="70ED8A3E"><wp:extent cx="925689" cy="694318"/><wp:effectExtent l="0" t="0" r="1905" b="4445"/><wp:docPr id="7" name="Picture 7" descr="{d.image}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="2" name="Picture 2" descr="{d.image}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm flipH="1"><a:off x="0" y="0"/><a:ext cx="961939" cy="721508"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:ftr>'
            }
            ,
            {
              name : 'word/header2.xml',
              data : '<w:hdr><w:p w14:paraId="50A57CAF" w14:textId="03063553" w:rsidR="00AD3C34" w:rsidRDefault="00AD3C34" w:rsidP="00AD3C34"><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="26BB6EA6" wp14:editId="7EC70FEB"><wp:extent cx="925689" cy="694318"/><wp:effectExtent l="0" t="0" r="1905" b="4445"/><wp:docPr id="2" name="Picture 2" descr="{d.image}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="2" name="Picture 2" descr="{d.image}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm flipH="1"><a:off x="0" y="0"/><a:ext cx="961939" cy="721508"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="75994D6B" wp14:editId="4DEE8DEE"><wp:extent cx="722136" cy="702021"/><wp:effectExtent l="0" t="0" r="1905" b="0"/><wp:docPr id="3" name="Picture 3" descr="{d.tests.image}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="3" name="Picture 3" descr="{d.tests.image}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="742406" cy="721727"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p w14:paraId="46E11299" w14:textId="77777777" w:rsidR="00AD3C34" w:rsidRDefault="00AD3C34"><w:pPr><w:pStyle w:val="Header"/></w:pPr></w:p></w:hdr>'
            }
          ]
        };
        image.preProcessDocx(template);
        preprocessor.generateUniqueIds(template); // called separately for shapes
        helperTest.assert(template.files[0].data, '<w:document><w:body><w:p w14:paraId="10D86908" w14:textId="594213EC" w:rsidR="00F040CB" w:rsidRPr="00F040CB" w:rsidRDefault="00F040CB"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="57033187" wp14:editId="308FFE5B"><wp:extent cx="{d.tests.image:scaleImage(width, 722136, emu, fillWidth)}" cy="{d.tests.image:scaleImage(height, 702021, emu, fillWidth)}"/><wp:effectExtent l="0" t="0" r="1905" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Picture 6" descr=""/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.tests.image:generateImageDocxId()}" name="" descr=""/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.tests.image:generateImageDocxReference(document.xml)}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{d.tests.image:scaleImage(width, 742406, emu, fillWidth)}" cy="{d.tests.image:scaleImage(height, 721727, emu, fillWidth)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body></w:document>');
        helperTest.assert(template.files[1].data, '<w:ftr><w:p w14:paraId="570D5375" w14:textId="1642C3D9" w:rsidR="00F040CB" w:rsidRPr="00F040CB" w:rsidRDefault="00F040CB" w:rsidP="00F040CB"><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="1A6006B2" wp14:editId="70ED8A3E"><wp:extent cx="{d.image:scaleImage(width, 925689, emu, fillWidth)}" cy="{d.image:scaleImage(height, 694318, emu, fillWidth)}"/><wp:effectExtent l="0" t="0" r="1905" b="4445"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Picture 7" descr=""/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:generateImageDocxId()}" name="" descr=""/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:generateImageDocxReference(footer2.xml)}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm flipH="1"><a:off x="0" y="0"/><a:ext cx="{d.image:scaleImage(width, 961939, emu, fillWidth)}" cy="{d.image:scaleImage(height, 721508, emu, fillWidth)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:ftr>');
        helperTest.assert(template.files[2].data, '<w:hdr><w:p w14:paraId="50A57CAF" w14:textId="03063553" w:rsidR="00AD3C34" w:rsidRDefault="00AD3C34" w:rsidP="00AD3C34"><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="26BB6EA6" wp14:editId="7EC70FEB"><wp:extent cx="{d.image:scaleImage(width, 925689, emu, fillWidth)}" cy="{d.image:scaleImage(height, 694318, emu, fillWidth)}"/><wp:effectExtent l="0" t="0" r="1905" b="4445"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Picture 2" descr=""/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.image:generateImageDocxId()}" name="" descr=""/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.image:generateImageDocxReference(header2.xml)}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm flipH="1"><a:off x="0" y="0"/><a:ext cx="{d.image:scaleImage(width, 961939, emu, fillWidth)}" cy="{d.image:scaleImage(height, 721508, emu, fillWidth)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="75994D6B" wp14:editId="4DEE8DEE"><wp:extent cx="{d.tests.image:scaleImage(width, 722136, emu, fillWidth)}" cy="{d.tests.image:scaleImage(height, 702021, emu, fillWidth)}"/><wp:effectExtent l="0" t="0" r="1905" b="0"/><wp:docPr id="{c.now:neutralForArrayFilter:generateImageDocxGlobalId}" name="Picture 3" descr=""/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d.tests.image:generateImageDocxId()}" name="" descr=""/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{d.tests.image:generateImageDocxReference(header2.xml)}"><a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{d.tests.image:scaleImage(width, 742406, emu, fillWidth)}" cy="{d.tests.image:scaleImage(height, 721727, emu, fillWidth)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p w14:paraId="46E11299" w14:textId="77777777" w:rsidR="00AD3C34" w:rsidRDefault="00AD3C34"><w:pPr><w:pStyle w:val="Header"/></w:pPr></w:p></w:hdr>');
        done();
      });
    });

    describe('DOCX postProcessDocx ', function () {
      it ('should do nothing if imageDatabase is empty', function () {
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n</Relationships>';
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : _expectedContent
          }]
        };
        const _options = {
          imageDatabase : new Map()
        };
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0].data, _expectedContent);
      });

      it('should add an image references into "word/_rels/document.xml.rels" by using imageDatabase and update the content_type.xml', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n</Relationships>',
          },
          {
            name : '[Content_Types].xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.png" Id="rIdCarbone0"/></Relationships>';
        const _expectedContentType = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('carbone.io/logo.png', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml' ],
          extension : 'png'
        });
        image.postProcessDocx(_template, null, _options);

        helperTest.assert(_template.files[0], {
          name   : 'word/media/CarboneImage0.png',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1].data, _expectedContent);
        helperTest.assert(_template.files[2].data, _expectedContentType);

      });

      it('should add an image references into "word/_rels/document.xml.rels" by using imageDatabase and update the content_type.xml even if the temporary image type is in uppercase', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.JPG"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n</Relationships>',
          },
          {
            name : '[Content_Types].xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="JPG" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.JPG"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.jpg" Id="rIdCarbone0"/></Relationships>';
        const _expectedContentType = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="JPG" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('carbone.io/logo.jpg', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml' ],
          extension : 'jpg'
        });
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0], {
          name   : 'word/media/CarboneImage0.jpg',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1].data, _expectedContent);
        helperTest.assert(_template.files[2].data, _expectedContentType);
      });

      it('should add an image references into "word/_rels/document.xml.rels" by using imageDatabase and should define the image into the directory `media` if images relationship does not already exist', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="utf-8"?></Relationships>',
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="utf-8"?><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.gif" Id="rIdCarbone0"/></Relationships>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.gif', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml' ],
          extension : 'gif'
        });
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0], {
          name   : 'word/media/CarboneImage0.gif',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1].data, _expectedContent);
      });

      it('should add an image references into "word/_rels/document.xml.rels" by using imageDatabase ', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/image2.png" Id="R1e71cf0a0beb4eb3" /></Relationships>',
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/image2.png" Id="R1e71cf0a0beb4eb3" /><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/media/CarboneImage0.gif" Id="rIdCarbone0"/></Relationships>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.gif', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml' ],
          extension : 'gif'
        });
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0], {
          name   : 'media/CarboneImage0.gif',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1].data, _expectedContent);
      });

      it('should add multiple images references into "word/_rels/document.xml.rels" by using imageDatabase', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n</Relationships>',
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>\n<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.png" Id="rIdCarbone0"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage1.jpg" Id="rIdCarbone1"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage2.svg" Id="rIdCarbone2"/></Relationships>';
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.png', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml' ],
          extension : 'png'
        });
        _options.imageDatabase.set('image.jpg', {
          data      : '5678',
          id        : 1,
          sheetIds  : [ 'document.xml' ],
          extension : 'jpg'
        });
        _options.imageDatabase.set('image.svg', {
          data      : '9101112',
          id        : 2,
          sheetIds  : [ 'document.xml' ],
          extension : 'svg'
        });
        image.postProcessDocx(_template, null, _options);
        helperTest.assert(_template.files[0], {
          name   : 'word/media/CarboneImage0.png',
          parent : '',
          data   : '1234'
        });
        helperTest.assert(_template.files[1], {
          name   : 'word/media/CarboneImage1.jpg',
          parent : '',
          data   : '5678'
        });
        helperTest.assert(_template.files[2], {
          name   : 'word/media/CarboneImage2.svg',
          parent : '',
          data   : '9101112'
        });
        helperTest.assert(_template.files[3].data, _expectedContent);
      });

      it('should add image references into the document, header and footer by using imageDatabase and should save the new image only one time on the object `template.files`', function () {
        const _template = {
          files : [{
            name : 'word/_rels/document.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
          },
          {
            name : 'word/_rels/header1.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
          },
          {
            name : 'word/_rels/header2.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
          },
          {
            name : 'word/_rels/footer1.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
          },
          {
            name : 'word/_rels/footer2.xml.rels',
            data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
          }]
        };
        const _expectedTemplate = {
          files : [
            {
              name   : 'word/media/CarboneImage0.png',
              parent : '',
              data   : '1234'
            },
            {
              name : 'word/_rels/document.xml.rels',
              data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.png" Id="rIdCarbone0"/></Relationships>',
            },
            {
              name : 'word/_rels/header1.xml.rels',
              data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
            },
            {
              name : 'word/_rels/header2.xml.rels',
              data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.png" Id="rIdCarbone0"/></Relationships>',
            },
            {
              name : 'word/_rels/footer1.xml.rels',
              data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/CarboneImage0.png" Id="rIdCarbone0"/></Relationships>',
            },
            {
              name : 'word/_rels/footer2.xml.rels',
              data : '<?xml version="1.0" encoding="UTF-8"?><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/></Relationships>',
            }]
        };
        const _options = {
          imageDatabase : new Map()
        };
        _options.imageDatabase.set('logo.png', {
          data      : '1234',
          id        : 0,
          sheetIds  : [ 'document.xml', 'header2.xml', 'footer1.xml' ],
          extension : 'png'
        });
        image.postProcessDocx(_template, null, _options);
        _template.files.forEach((file, $index) => {
          helperTest.assert(file.data, _expectedTemplate.files[$index].data);
        });
      });
    });

    describe('DOCX defineImageContentTypeDocx (part of postProcessDocx)', function () {
      it('should not add the image type definition if the image type list is empty []', function () {
        const _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                            '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                            '<Default Extension="xml" ContentType="application/xml"/></Types>';
        const _template = {
          files : [
            {
              name : '[Content_Types].xml',
              data : _expectedXml
            }
          ]
        };
        image.defineImageContentTypeDocx(_template, []);
        helperTest.assert(_template.files[0].data, _expectedXml);
      });
      it ('should add the image type definition [PNG, JPG, SVG]', function () {
        const _template = {
          files : [
            {
              name : '[Content_Types].xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                    '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                    '<Default Extension="xml" ContentType="application/xml"/></Types>'
            }
          ]
        };
        const _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                            '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                            '<Default Extension="xml" ContentType="application/xml"/>'+
                            '<Default Extension="png" ContentType="image/png"/>'+
                            '<Default Extension="jpg" ContentType="image/jpeg"/>'+
                            '<Default Extension="svg" ContentType="image/svg+xml"/></Types>';
        image.defineImageContentTypeDocx(_template, ['png', 'jpg', 'svg']);
        helperTest.assert(_template.files[0].data, _expectedXml);
      });
      it ('should not add the image type definition multiple times [PNG, JPG, PNG, JPEG, SVG, SVG]', function () {
        const _template = {
          files : [
            {
              name : '[Content_Types].xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                    '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                    '<Default Extension="xml" ContentType="application/xml"/></Types>'
            }
          ]
        };
        const _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                            '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                            '<Default Extension="xml" ContentType="application/xml"/>'+
                            '<Default Extension="png" ContentType="image/png"/>'+
                            '<Default Extension="jpg" ContentType="image/jpeg"/>'+
                            '<Default Extension="svg" ContentType="image/svg+xml"/></Types>';
        image.defineImageContentTypeDocx(_template, ['png', 'jpg', 'png', 'jpeg', 'svg', 'svg', 'jpg']);
        helperTest.assert(_template.files[0].data, _expectedXml);
      });
      it('should not add the image type if it is already defined in uppercase', function () {
        const _template = {
          files : [
            {
              name : '[Content_Types].xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                    '<Default Extension="PnG" ContentType="image/png"/>' +
                    '<Default Extension="JPG" ContentType="image/jpeg"/></Types>'
            }
          ]
        };
        const _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                            '<Default Extension="PnG" ContentType="image/png"/>'+
                            '<Default Extension="JPG" ContentType="image/jpeg"/>'+
                            '<Default Extension="svg" ContentType="image/svg+xml"/></Types>';

        image.defineImageContentTypeDocx(_template, ['jpg', 'pNg', 'Svg']);
        helperTest.assert(_template.files[0].data, _expectedXml);
      });
      it ('should not add the image type definition if the image mime type format does not exist [PNG, JPG, SVG, JSON, HTML]', function () {
        const _template = {
          files : [
            {
              name : '[Content_Types].xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                    '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                    '<Default Extension="xml" ContentType="application/xml"/></Types>'
            }
          ]
        };
        const _expectedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
                            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
                            '<Default Extension="jpeg" ContentType="image/jpeg"/>'+
                            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
                            '<Default Extension="xml" ContentType="application/xml"/>'+
                            '<Default Extension="png" ContentType="image/png"/>'+
                            '<Default Extension="jpg" ContentType="image/jpeg"/></Types>';
        image.defineImageContentTypeDocx(_template, ['png', 'jpg', 'json', 'html']);
        helperTest.assert(_template.files[0].data, _expectedXml);
      });
    });
  });

  describe('XLSX documents', function () {
    describe('[Full test] XLSX', function () {
      it('should do nothing if there is no marker inside the XML', function (done) {
        const _testedReport = 'image/xlsx-simple-without-marker';
        const _data = {
          image : _imageFRBase64jpg
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });
      it('should replace one image (Created from LO)(base64 jpg)', function (done) {
        const _testedReport = 'image/xlsx-simple';
        const _data = {
          tests : {
            image : _imageFRBase64jpg
          }
        };
        carbone.render(helperTest.openTemplate(_testedReport, true), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport, true);
          done();
        });
      });

      it('should replace one image on multiple sheets (Created from LO)(base64 jpg)', function (done) {
        const _testedReport = 'image/xlsx-image-shared';
        const _data = {
          tests : {
            image : _imageFRBase64jpg
          }
        };
        carbone.render(helperTest.openTemplate(_testedReport, true), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport, true);
          done();
        });
      });

      it('should replace multiple images on multiple sheets (Created from LO)(base64 jpg)', function (done) {
        const _testedReport = 'image/xlsx-multi-sheets';
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
            imageError : 'Thisissomerandomtext',
          },
          imageFRold   : '$base64image',
          $base64image : {
            data      : _imageFRBase64jpgWithoutType,
            extension : 'jpg'
          },
          imageError : 'This is some random text',
          error3     : 'data:image/jpeg;base64,',
        };
        carbone.render(helperTest.openTemplate(_testedReport, true), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport, true);
          done();
        });
      });

      it.skip('should generate barcodes as images and as fonts', function (done) {
        const _testedReport = 'image/xlsx-barcodes';
        const _data = {
          /** Barcodes as Fonts & Images*/
          item  : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean13'),
          item2 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'ean8'),
          item3 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code128'),
          item4 : barcodeFormatter.supportedBarcodes.find(value => value.sym === 'code39')
        };
        carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
          helperTest.assert(err+'', 'null');
          helperTest.assertFullReport(res, _testedReport);
          done();
        });
      });
    });

    describe('XLSX preprocess xml', function () {
      it('should replace the main document tag attributes with image markers and formatters <a:blip r:embed="rId1"></a:blip>', function (done) {
        let _template = {
          files : [
            {
              name : 'xl/drawings/drawing1.xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr="{d.tests.image}"></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
            }
          ]
        };
        let _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr=""></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="{d.tests.image:generateImageXlsxReference(1)}"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
        image.preProcessXLSX(_template);
        helperTest.assert(_template.files[0].data, _expectedXML);
        done();
      });

      it('should replace the main document tag attributes with image markers and formatters <a:blip r:embed="rId1"/>', function (done) {
        let _template = {
          files : [
            {
              name : 'xl/drawings/drawing1.xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr="{d.tests.image}"></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId1"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
            }
          ]
        };
        let _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr=""></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="{d.tests.image:generateImageXlsxReference(1)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
        image.preProcessXLSX(_template);
        helperTest.assert(_template.files[0].data, _expectedXML);
        done();
      });

      it('should throw an error if the template contains a list of images', function (done) {
        let _template = {
          files : [
            {
              name : 'xl/drawings/drawing1.xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr="{d.list[i].img}"></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
            }
          ]
        };
        // let _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr=""></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="{d.list[i].img:generateImageXlsxReference(1)}"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
        assert.throws(() => image.preProcessXLSX(_template), Error('Carbone does not support a list of images on XLSX template.'));
        done();
      });

      it('should replace the main document tag attributes with image marker/formatters and the `isImage` formatter if the `barcode` formatter is included (BARCODE)', function (done) {
        let _template = {
          files : [
            {
              name : 'xl/drawings/drawing1.xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr="{d.tests.image:barcode(ean13)}"></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
            }
          ]
        };
        let _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>0</xdr:col><xdr:colOff>285480</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>8640</xdr:rowOff></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:colOff>336600</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>50040</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="0" name="Image 1" descr=""></xdr:cNvPr><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="{d.tests.image:isImage:barcode(ean13):generateImageXlsxReference(1)}"></a:blip><a:stretch/></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="285480" y="171000"/><a:ext cx="866160" cy="529200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
        image.preProcessXLSX(_template);
        helperTest.assert(_template.files[0].data, _expectedXML);
        done();
      });
    });
  });

  describe('Utils Methods', function () {
    describe('DOCX ODT scaling', function () {
      it('_getImageSize: should return nothing because of an empty Buffer', function (done) {
        let _imageInfo = {
          imageUnit             : 'emu',
          data                  : new Buffer.from(''),
          downloadedImageWidth  : -1,
          downloadedImageHeight : -1
        };
        image._getImageSize(_imageInfo);
        helperTest.assert(_imageInfo.downloadedImageWidth, -1);
        helperTest.assert(_imageInfo.downloadedImageHeight, -1);
        done();
      });

      it('_getImageSize: should return the EMU size of a JPEG base64 image', function (done) {
        image.parseBase64Picture(_imageFRBase64jpg, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'emu',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 952500);
          helperTest.assert(_imageInfo.downloadedImageHeight, 590550);
          done();
        });
      });


      it('_getImageSize: should return the EMU size of a PNG base64 image', function (done) {
        image.parseBase64Picture(_imageITBase64png, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'emu',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 2857500);
          helperTest.assert(_imageInfo.downloadedImageHeight, 1905000);
          done();
        });
      });

      it('_getImageSize: should return the CM size of a JPEG base64 image', function (done) {
        image.parseBase64Picture(_imageFRBase64jpg, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'cm',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 2.65);
          helperTest.assert(_imageInfo.downloadedImageHeight, 1.643);
          done();
        });
      });


      it('_getImageSize: should return the CM size of a PNG base64 image', function (done) {
        image.parseBase64Picture(_imageITBase64png, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'cm',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 7.95);
          helperTest.assert(_imageInfo.downloadedImageHeight, 5.3);
          done();
        });
      });

      it('_getImageSize: should return the INCH size of a JPEG base64 image', function (done) {
        image.parseBase64Picture(_imageFRBase64jpg, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'in',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 1.0416666666666667);
          helperTest.assert(_imageInfo.downloadedImageHeight, 0.6458333333333334);
          done();
        });
      });

      it('_getImageSize: should return the INCH size of a PNG base64 image', function (done) {
        image.parseBase64Picture(_imageITBase64png, function (err, imageData) {
          let _imageInfo = {
            imageUnit             : 'in',
            data                  : imageData.data,
            downloadedImageWidth  : -1,
            downloadedImageHeight : -1
          };
          image._getImageSize(_imageInfo, _imageInfo.imageUnit);
          helperTest.assert(_imageInfo.downloadedImageWidth, 3.125);
          helperTest.assert(_imageInfo.downloadedImageHeight, 2.0833333333333335);
          done();
        });
      });

      describe('_computeImageSize', function () {
        it("_computeImageSize EMU 1: should compute the imageFit size as 'contain'", function (done) {
          let _imageInfo = {
            imageUnit             : 'emu',
            templateImageWidth    : 100,
            templateImageHeight   : 80,
            downloadedImageWidth  : 220,
            downloadedImageHeight : 100,
            imageWidth            : 100,
            imageHeight           : 80
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 100);
          helperTest.assert(_imageInfo.imageHeight, 45);
          done();
        });

        it("_computeImageSize EMU 2: should compute the imageFit size as 'contain'", function (done) {
          let _imageInfo = {
            imageUnit             : 'emu',
            templateImageWidth    : 952500,
            templateImageHeight   : 590550,
            downloadedImageWidth  : 2857500,
            downloadedImageHeight : 1905000,
            imageWidth            : 952500,
            imageHeight           : 590550
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 885825);
          helperTest.assert(_imageInfo.imageHeight, 590550);
          done();
        });

        it("_computeImageSize CM : should compute the imageFit size as 'contain'", function (done) {
          let _imageInfo = {
            imageUnit             : 'cm',
            downloadedImageWidth  : 20.45,
            downloadedImageHeight : 15,
            templateImageWidth    : 8,
            templateImageHeight   : 5
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 6.817);
          helperTest.assert(_imageInfo.imageHeight, 5);
          done();
        });

        it("_computeImageSize CM with 3 decimal : should compute the imageFit size as 'contain'", function (done) {
          let _imageInfo = {
            imageUnit             : 'cm',
            downloadedImageWidth  : 33.558,
            downloadedImageHeight : 20.312,
            templateImageWidth    : 12,
            templateImageHeight   : 10
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 12);
          helperTest.assert(_imageInfo.imageHeight, 7.263);
          done();
        });


        it("_computeImageSize IN : should compute the imageFit size as 'contain'", function (done) {
          let _imageInfo = {
            imageUnit             : 'in',
            downloadedImageWidth  : 8.6952,
            downloadedImageHeight : 10.6713,
            templateImageWidth    : 2.8984,
            templateImageHeight   : 1.4492
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 1.181); // 1.1808
          helperTest.assert(_imageInfo.imageHeight, 1.449); // 1.387269
          done();
        });

        it('should compute the imageFit size as fillWidth', function (done) {
          let _imageInfo = {
            imageFit              : 'fillWidth',
            imageUnit             : 'emu',
            downloadedImageWidth  : 50,
            downloadedImageHeight : 100,
            templateImageWidth    : 100,
            templateImageHeight   : 80
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 100);
          helperTest.assert(_imageInfo.imageHeight, 200);
          done();
        });

        it('should compute the imageFit size as fill', function (done) {
          let _imageInfo = {
            imageFit              : 'fill',
            imageUnit             : 'emu',
            downloadedImageWidth  : 150,
            downloadedImageHeight : 250,
            templateImageWidth    : 100,
            templateImageHeight   : 80
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 100);
          helperTest.assert(_imageInfo.imageHeight, 80);
          done();
        });

        it('should compute the new image width/height as cm based on the image size and should keep the ratio', function (done) {
          let _imageInfo = {
            imageUnit             : 'cm',
            downloadedImageWidth  : 5,
            downloadedImageHeight : 4.2
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 5);
          helperTest.assert(_imageInfo.imageHeight, 4.2);
          done();
        });

        it('should compute the new image width/height as cm based on the image size, should keep the ratio and should be less than 5cm', function (done) {
          let _imageInfo = {
            imageUnit             : 'cm',
            downloadedImageWidth  : 10,
            downloadedImageHeight : 5
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 5);
          helperTest.assert(_imageInfo.imageHeight, 2.5);

          let _imageInfo2 = {
            imageUnit             : 'cm',
            downloadedImageWidth  : 5,
            downloadedImageHeight : 10
          };
          image._computeImageSize(_imageInfo2);
          helperTest.assert(_imageInfo2.imageWidth, 2.5);
          helperTest.assert(_imageInfo2.imageHeight, 5);
          done();
        });

        it('should compute the new image width/height as EMU based on the image size, should keep the ratio and should be less than 5cm', function (done) {
          let _imageInfo = {
            imageUnit             : 'emu',
            downloadedImageWidth  : 1800000,
            downloadedImageHeight : 3600000
          };
          image._computeImageSize(_imageInfo);
          helperTest.assert(_imageInfo.imageWidth, 900000);
          helperTest.assert(_imageInfo.imageHeight, 1800000);

          let _imageInfo2 = {
            imageUnit             : 'emu',
            downloadedImageWidth  : 3600000,
            downloadedImageHeight : 1800000
          };
          image._computeImageSize(_imageInfo2);
          helperTest.assert(_imageInfo2.imageWidth, 1800000);
          helperTest.assert(_imageInfo2.imageHeight, 900000);
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
          helperTest.assert(imageDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
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
          helperTest.assert(imgDescriptor, _expectedResp);
        });
      });

      it('[ERROR test] should return an empty descriptor with an error because they are not a data-uri', function (done) {
        const _base64Pictures = [
          'data:text/html;charset=utf-8,<!DOCTYPE%20html><html%20lang%3D"en"><head><title>Embedded%20Window<%2Ftitle><%2Fhead><body><h1>42<%2Fh1><%2Fbody><%2Fhtml>',
          'data:text/plain;charset=utf-8;base64,VGhpcyBpcyBhIHRlc3Q='
        ];
        _base64Pictures.forEach(img => {
          image.parseBase64Picture(img, function (err, imgDescriptor) {
            helperTest.assert(err, 'Error base64 picture: it is not a base64 picture.');
            helperTest.assert(imgDescriptor+'', 'undefined');
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
            helperTest.assert(imgDescriptor+'', 'undefined');
          });
        });
        done();
      });
      it('[ERROR test] should return an empty descriptor with an error because the data-uri content is empty', function (done) {
        const _base64Picture = 'data:image/jpeg;base64,';
        image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
          assert(err === 'Error base64 picture: the picture is empty.');
          helperTest.assert(imgDescriptor+'', 'undefined');
          done();
        });
      });
      it('[ERROR test] should return an empty descriptor with an error because the data-uri mime type is invalid', function (done) {
        const _base64Picture = 'data:image/error-here;base64,';
        image.parseBase64Picture(_base64Picture, function (err, imgDescriptor) {
          assert(err === 'Error base64 picture: The mime type has not been recognized.');
          helperTest.assert(imgDescriptor+'', 'undefined');
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
        image.downloadImage('https://google.com/image-flag-fr.jpg', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/jpeg');
          helperTest.assert(imageInfo.extension, 'jpg');
          done();
        });
      });
      it('should download a PNG image from an url', function (done) {
        nock('https://google.com')
          .get('/image-flag-it.png')
          .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
            'Content-Type' : 'image/png',
          });
        image.downloadImage('https://google.com/image-flag-it.png', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/png');
          helperTest.assert(imageInfo.extension, 'png');
          done();
        });
      });
      it('should download a PNG image from an url with query parameters', function (done) {
        nock('https://google.com')
          .get('/image-flag-it.png?size=10&color=blue')
          .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
            'Content-Type' : 'image/png',
          });
        image.downloadImage('https://google.com/image-flag-it.png?size=10&color=blue', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/png');
          helperTest.assert(imageInfo.extension, 'png');
          done();
        });
      });
      it('should download a PNG image from an url with weird Content-Type', function (done) {
        nock('https://google.com')
          .get('/blabla?size=10&color=blue')
          .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
            'Content-Type' : 'image/png; charset=UTF-8',
          });
        image.downloadImage('https://google.com/blabla?size=10&color=blue', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/png');
          helperTest.assert(imageInfo.extension, 'png');
          done();
        });
      });
      it('should download a PNG image from an url even if the header.content-type is incorrect (application/json)', function (done) {
        nock('https://google.com')
          .get('/image-flag-it.png')
          .replyWithFile(200, __dirname + '/datasets/image/imageIT.png', {
            'Content-Type' : 'application/json',
          });
        image.downloadImage('https://google.com/image-flag-it.png', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/png');
          helperTest.assert(imageInfo.extension, 'png');
          done();
        });
      });
      it('should download a JPEG image from an url even if the header.content-type is incorrect (text/plain)', function (done) {
        nock('https://google.com')
          .get('/image-flag-fr.jpg')
          .replyWithFile(200, __dirname + '/datasets/image/imageFR.jpg', {
            'Content-Type' : 'text/plain',
          });
        image.downloadImage('https://google.com/image-flag-fr.jpg', {}, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.data.length > 0);
          helperTest.assert(imageInfo.mimetype, 'image/jpeg');
          helperTest.assert(imageInfo.extension, 'jpg');
          done();
        });
      });

      it('should return an error if the file is not an image with undefined Content-Type', function (done) {
        nock('https://google.com')
          .get('/image-flag-fr.txt')
          .replyWithFile(200, __dirname + '/datasets/image/imageFR_base64_jpg.txt');
        image.downloadImage('https://google.com/image-flag-fr.txt', {}, {}, function (err, imageInfo) {
          assert(err.includes('Error Carbone: the file is not an image'));
          assert(imageInfo+'' === 'undefined');
          done();
        });
      });

      it('should return an error when the imageLinkOrBase64 is either undefined, null or empty', function (done) {
        image.downloadImage(undefined, {}, {}, function (err, imageInfo) {
          assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
          helperTest.assert(imageInfo+'', 'undefined');

          image.downloadImage(null, {}, {}, function (err, imageInfo) {
            assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
            helperTest.assert(imageInfo+'', 'undefined');

            image.downloadImage('', {}, {}, function (err, imageInfo) {
              assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
              helperTest.assert(imageInfo+'', 'undefined');

              image.downloadImage({id : 1}, {}, {}, function (err, imageInfo) {
                assert(err.includes('Carbone error: the image URL or Base64 is undefined.'));
                helperTest.assert(imageInfo+'', 'undefined');
                done();
              });
            });
          });
        });
      });

      it ('should return an error when the location url does not exist', function (done) {
        image.downloadImage('https://carbone.io/fowjfioewj', {}, {}, function (err, imageInfo) {
          assert(err.includes('can not download the image from the url'));
          helperTest.assert(imageInfo+'', 'undefined');
          done();
        });
      });

      it('should return an error when imageLinkOrBase64 argument is invalid (the error is returned by image.parseBase64Picture)', function (done) {
        image.downloadImage('this_is_random_text', {}, {}, function (err, imageInfo) {
          assert(err.includes('Error'));
          helperTest.assert(imageInfo+'', 'undefined');
          done();
        });
      });


      it('should return different errors (ETIMEDOUT, ESOCKETTIMEDOUT, ...)', function (done) {
        const errorList = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ECONNRESET'];
        for (let i = 0, n = errorList.length; i < n; i++) {
          const errorCode = errorList[i];
          nock('https://google.com')
            .get('/random-image.jpeg')
            .replyWithError({code : errorCode});
          image.downloadImage('https://google.com/random-image.jpeg', {}, {}, function (err, imageInfo) {
            helperTest.assert(err.code, errorCode);
            assert(imageInfo+'', 'undefined');
          });
        }
        done();
      });

      it('should return an error when the request timeout', function (done) {
        nock('https://google.com')
          .get('/random-image.jpeg')
          .delay(7000)
          .reply(200, '<html></html>');
        image.downloadImage('https://google.com/random-image.jpeg', {}, {}, function (err, imageInfo) {
          helperTest.assert(err.message, 'Request timed out');
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
        image.downloadImage('$base64dog', data, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
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
        image.downloadImage('$base64cat', data, {}, function (err, imageInfo) {
          helperTest.assert(err+'', 'null');
          assert(imageInfo.mimetype === 'image/bmp');
          assert(imageInfo.extension === 'bmp');
          assert(imageInfo.data.length > 0);
          done();
        });
      });

      it('[depreciated base64 img] should return an error because the base64 is a TXT file', function (done) {
        const data = {
          $base64dog : {
            data      : '/9j/4AAQSkZJRgABAQEASABIAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+EAjEV4aWYAAE1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAASAAAAAEAAABIAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAANoAMABAAAAAEAAAAMAAAAAP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/AABEIAAwADQMBIgACEQEDEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAHBAj/xAAkEAACAgEDBAMBAQAAAAAAAAABAgMEBQYREgAHCBQTISIxof/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQABBQEAAAAAAAAAAAAAAAADAAECESEj/9oADAMBAAIRAxEAPwCnutPmNc+Qt/Sdm4fXr2fRx8T2fghib1kkD/YILbuxOw5MPyOPS1496Q1ZpnS93FX9QVSfZEyLA/sxoGUDiqsqmP7Xcj+EtuOs497MLWwPc3O4+tPbsxwWYWR7c5llPJEI5Of0xXcAMSW2Ubk9JHjXhMRlaedsZSibk6zRJ8r2pgxUc9h+XA/zosU7O9JAkebbmL//2Q==',
            extension : 'txt'
          }
        };
        image.downloadImage('$base64dog', data, {}, function (err, imageInfo) {
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
        image.downloadImage('$base64dog', data, {}, function (err, imageInfo) {
          assert(err.includes('the base64 provided is empty'));
          assert(imageInfo + '' === 'undefined');
          done();
        });
      });
    });
    describe('checkIfImageIncludedDocx', function () {
      it('should return true because the relational file name include one of the element in the file name list', function () {
        helperTest.assert(image.checkIfImageIncludedDocx('word/_rels/footer1.xml.rels', ['document.xml', 'header3.xml', 'header2.xml', 'footer1.xml']), true);
        helperTest.assert(image.checkIfImageIncludedDocx('word/_rels/header3.xml.rels', ['header3.xml']), true);
      });
      it('should return false because the relational file name does not include one of the element in the file name list', function () {
        helperTest.assert(image.checkIfImageIncludedDocx('word/_rels/document.xml.rels', ['header3.xml', 'header2.xml', 'footer1.xml']), false);
        helperTest.assert(image.checkIfImageIncludedDocx('word/_rels/document.xml.rels', []), false);
        helperTest.assert(image.checkIfImageIncludedDocx('', ['header3.xml', 'header2.xml']), false);
      });
    });
    describe('cleanContentType', function () {
      it('should clean content type', function () {
        helperTest.assert(image.cleanContentType(undefined), '');
        helperTest.assert(image.cleanContentType(null), '');
        helperTest.assert(image.cleanContentType(0), '');
        helperTest.assert(image.cleanContentType(1), '');
        helperTest.assert(image.cleanContentType('image/png; charset=UTF-8'), 'image/png');
        helperTest.assert(image.cleanContentType('image/png ; charset=UTF-8'), 'image/png');
        helperTest.assert(image.cleanContentType('  image/png '), 'image/png');
        helperTest.assert(image.cleanContentType('  image/png  ; charset=UTF-8 ; s '), 'image/png');
      });
    });
  });
});
