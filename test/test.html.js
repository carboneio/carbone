const html = require('../lib/html');
const htmlFormatters = require('../formatters/html');
const hyperlinksFormatters = require('../formatters/hyperlinks');
const helper = require('../lib/helper');
const assert = require('assert');
const image = require('../lib/image');
const hyperlinks = require('../lib/hyperlinks');

describe('Dynamic HTML', function () {

  describe('Preprocess - functions used by ODT and DOCX reports', function () {

    describe('reorderXML - should seperate the html formatter outside paragraphs ', function () {
      describe('ODT', function () {
        it('should do nothing if the html formatter is not included', function () {
          const _Content = '<office:body><office:text><text:p text:style-name="P5">{d.content}</text:p></office:text></office:body>';
          const _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          assert.strictEqual(html.reorderXML(_Content, _options), _Content);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should throw an error is the XML is not valid, the paragraph is missing', function () {
          let _templateContent = '<office:body><office:text>{d.content:html}</office:text></office:body>';
          const _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          assert.strictEqual(html.reorderXML(_templateContent, _options), _templateContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should seperate a single html formatter, retrieve the style on the paragraph and delete the empty paragraph', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          /** WITHOUT STYLE */
          let _templateContent = '<office:body><office:text><text:p>{d.content:html}</text:p></office:text></office:body>';
          let _expectedContent = '<office:body><office:text><carbone>{d.content:getHTMLContentOdt}</carbone></office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
          /** WITH STYLE */
          _templateContent = '<office:body><office:text><text:p text:style-name="P5">{d.content:html}</text:p></office:text></office:body>';
          _expectedContent = '<office:body><office:text><carbone>{d.content:getHTMLContentOdt(\'style-P5\')}</carbone></office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });

        it('should accept convCRLF before :html, and replace it by an internal formatter which replace "\n" by "<br>"', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          /** WITHOUT STYLE */
          let _templateContent = '<office:body><office:text><text:p>{d.content:convCRLF:html}</text:p></office:text></office:body>';
          let _expectedContent = '<office:body><office:text><carbone>{d.content:convCRLFH:getHTMLContentOdt}</carbone></office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
          /** WITH STYLE */
          _templateContent = '<office:body><office:text><text:p text:style-name="P5">{d.content:convCRLF:html}</text:p></office:text></office:body>';
          _expectedContent = '<office:body><office:text><carbone>{d.content:convCRLFH:getHTMLContentOdt(\'style-P5\')}</carbone></office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });


        it('should seperate a single html formatter with other elements', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">Some content before {d.content:html} and after</text:p>'+
              '</office:text></office:body>';
          const _expectedContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">Some content before </text:p>'+
                '<carbone>{d.content:getHTMLContentOdt(\'style-P5\')}</carbone>'+
                '<text:p text:style-name="P5"> and after</text:p>'+
              '</office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });

        it('should find and seperate a single html formatter inside a <text:h> tag', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _template = '' +
            '<office:body><office:text>'+
              '<text:h text:style-name="P2" text:outline-level="1">{d.A[i].O:ifNEM():showBegin}{d.A[i].B} Summary: {d.A[i].O:html()}{d.A[i].O:ifNEM():showEnd}</text:h>' +
              '<text:h text:style-name="P2" text:outline-level="1">{d.A[i+1]}</text:h>' +
            '</office:text></office:body>';
          const _expected = '' +
            '<office:body>' +
              '<office:text>' +
                '<text:h text:style-name="P2" text:outline-level="1">{d.A[i].O:ifNEM():showBegin}{d.A[i].B} Summary: </text:h>' +
                '<carbone>{d.A[i].O:getHTMLContentOdt(\'style-P2\')}</carbone>' +
                '<text:h text:style-name="P2" text:outline-level="1">{d.A[i].O:ifNEM():showEnd}</text:h>' +
                '<text:h text:style-name="P2" text:outline-level="1">{d.A[i+1]}</text:h>' +
              '</office:text>' +
            '</office:body>'
          assert.strictEqual(html.reorderXML(_template, _options), _expected);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P2')), JSON.stringify({ paragraph: 'text:style-name="P2"', text: '' }))
        })

        it('should find and seperate a html formatter inside <text:h> <text:p> tags 1', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _template = '' +
            '<office:body><office:text>'+
              '<text:p text:style-name="P3">{d.text:html}</text:p>' +
              '<text:h text:style-name="Heading_20_1" text:outline-level="1">{d.text:html}</text:h>' +
            '</office:text></office:body>';
          const _expected = '' +
            '<office:body>' +
              '<office:text>' +
                '<carbone>{d.text:getHTMLContentOdt(\'style-P3\')}</carbone>' +
                '<carbone>{d.text:getHTMLContentOdt}</carbone>' +
              '</office:text>' +
            '</office:body>'
          assert.strictEqual(html.reorderXML(_template, _options), _expected);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P3')), JSON.stringify({ paragraph: 'text:style-name="P3"', text: '' }))
        })

        it('should find and seperate a html formatter inside <text:h> <text:p> tags 2', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _template = '' +
            '<office:body><office:text>'+
              '<text:p text:style-name="P3">{d.text:html}</text:p>' +
              '<text:p text:style-name="P2"/>' +
              '<text:h text:style-name="Heading_20_1" text:outline-level="1">{d.text:html}</text:h>' +
              '<text:p text:style-name="P2"/>' +
              '<text:h text:style-name="P1" text:outline-level="3">{d.text:html}</text:h>' +
            '</office:text></office:body>';
          const _expected = '' +
            '<office:body>' +
              '<office:text>' +
                '<carbone>{d.text:getHTMLContentOdt(\'style-P3\')}</carbone>' +
                '<text:p text:style-name="P2"/>' +
                '<carbone>{d.text:getHTMLContentOdt}</carbone>' +
                '<text:p text:style-name="P2"/>' +
                '<carbone>{d.text:getHTMLContentOdt(\'style-P1\')}</carbone>' +
              '</office:text>' +
            '</office:body>'
          assert.strictEqual(html.reorderXML(_template, _options), _expected);
          assert.strictEqual(_options.htmlStylesDatabase.size, 2);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P3')), JSON.stringify({ paragraph: 'text:style-name="P3"', text: '' }))
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        })

        it('should seperate a single html formatter mixed inside a span', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P1">' +
                  '<text:span text:style-name="T2">Content before{d.courseloop1:html}Content after</text:span>'+
                '</text:p>' +
              '</office:text></office:body>';
          const _expectedContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P1">' +
                  '<text:span text:style-name="T2">Content before</text:span>' +
                '</text:p>' +
                '<carbone>{d.courseloop1:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                '<text:p text:style-name="P1">' +
                  '<text:span text:style-name="T2">Content after</text:span>' +
                '</text:p>' +
              '</office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        });

        it('should seperate a single html formatter mixed inside multiple spans', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P1">' +
                  '<text:span text:style-name="T3"></text:span>'+
                  '<text:span text:style-name="T2">{d.courseloop1:html}</text:span>'+
                  '<text:span text:style-name="T2"></text:span>'+
                '</text:p>' +
              '</office:text></office:body>';
          const _expectedContent = '' +
              '<office:body><office:text>'+
                '<carbone>{d.courseloop1:getHTMLContentOdt(\'style-P1\')}</carbone>' +
              '</office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        });

        it('should seperate a single html formatter mixed inside multiple spans and static content', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2">{d.courseloop1:html}</text:span>' +
                    '<text:span text:style-name="T3">Some Static content</text:span>' +
                    '<text:span text:style-name="T2">{d.courseloop2:html}</text:span>' +
                  '</text:p>' +
                '</office:text>' +
              '</office:body>';
          const _expectedContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<carbone>{d.courseloop1:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2"></text:span>' +
                    '<text:span text:style-name="T3">Some Static content</text:span>' +
                    '<text:span text:style-name="T2"></text:span>' +
                  '</text:p>' +
                  '<carbone>{d.courseloop2:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                '</office:text>' +
              '</office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        });

        it('should seperate a single html formatter mixed inside multiple spans and static content', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2">Some Static content1</text:span>' +
                    '<text:span text:style-name="T3">Before{d.courseloop2:html}After</text:span>' +
                    '<text:span text:style-name="T2">Some Static content2</text:span>' +
                  '</text:p>' +
                '</office:text>' +
              '</office:body>';
          const _expectedContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2">Some Static content1</text:span>' +
                    '<text:span text:style-name="T3">Before</text:span>' +
                    '<text:span text:style-name="T2"></text:span>' +
                  '</text:p>' +
                  '<carbone>{d.courseloop2:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2"></text:span>' +
                    '<text:span text:style-name="T3">After</text:span>' +
                    '<text:span text:style-name="T2">Some Static content2</text:span>' +
                  '</text:p>' +
                '</office:text>' +
              '</office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        });

        it('should seperate a single html formatter mixed inside multiple spans and static content', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2">Content before{d.courseloop1:html}</text:span>' +
                    '<text:span text:style-name="T3">Some Static content</text:span>' +
                    '<text:span text:style-name="T2">{d.courseloop2:html}Content after</text:span>' +
                  '</text:p>' +
                '</office:text>' +
              '</office:body>';
          const _expectedContent = '' +
              '<office:body>' +
                '<office:text>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2">Content before</text:span>' +
                    '<text:span text:style-name="T3"></text:span>' +
                    '<text:span text:style-name="T2"></text:span>' +
                  '</text:p>' +
                  '<carbone>{d.courseloop1:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2"></text:span>' +
                    '<text:span text:style-name="T3">Some Static content</text:span>' +
                    '<text:span text:style-name="T2"></text:span>' +
                  '</text:p>' +
                  '<carbone>{d.courseloop2:getHTMLContentOdt(\'style-P1\')}</carbone>' +
                  '<text:p text:style-name="P1">' +
                    '<text:span text:style-name="T2"></text:span>' +
                    '<text:span text:style-name="T3"></text:span>' +
                    '<text:span text:style-name="T2">Content after</text:span>' +
                  '</text:p>' +
                '</office:text>' +
              '</office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P1')), JSON.stringify({ paragraph: 'text:style-name="P1"', text: '' }))
        });

        it('should seperate multiple html formatter with other elements', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">{d.list[i].name} some content1 {d.list[i].content:html} after content {d.value:html} end</text:p>'+
              '</office:text></office:body>';
          const _expectedContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">{d.list[i].name} some content1 </text:p>'+
                '<carbone>{d.list[i].content:getHTMLContentOdt(\'style-P5\')}</carbone>'+
                '<text:p text:style-name="P5"> after content </text:p>'+
                '<carbone>{d.value:getHTMLContentOdt(\'style-P5\')}</carbone>'+
                '<text:p text:style-name="P5"> end</text:p>'+
              '</office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });

        it('should seperate a multiple html formatter with other elements inside multiple paragrpahs', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _templateContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">Some content before 1 {d.content1:html} and after 1</text:p>'+
                '<text:p text:style-name="P5">Some content before 2 {d.content2:html} and after 2</text:p>'+
              '</office:text></office:body>';
          const _expectedContent = '' +
              '<office:body><office:text>'+
                '<text:p text:style-name="P5">Some content before 1 </text:p>'+
                '<carbone>{d.content1:getHTMLContentOdt(\'style-P5\')}</carbone>'+
                '<text:p text:style-name="P5"> and after 1</text:p>'+
                '<text:p text:style-name="P5">Some content before 2 </text:p>'+
                '<carbone>{d.content2:getHTMLContentOdt(\'style-P5\')}</carbone>'+
                '<text:p text:style-name="P5"> and after 2</text:p>'+
              '</office:text></office:body>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });
      });

      describe('DOCX', function () {
        it('should do nothing if the html formatter is not included', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          const _templateContent = ''+
            '<w:document>'+
              '<w:body>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print"/>' +
                      '<w:sz w:val="36"/>' +
                    '</w:rPr>'+
                    '<w:t>Static content</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:body>'+
            '</w:document>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _templateContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should seperate a single html formatter and delete the empty paragraph', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          /** WITHOUT A FONT */
          let _templateContent = ''+
            '<w:document>'+
              '<w:body>'+
                '<w:p>'+
                  '<w:r>'+
                    '<w:t>{d.courseloop1:html}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:body>'+
            '</w:document>';
          let _expectedContent = ''+
            '<w:document>'+
              '<w:body>'+
                '<carbone>{d.courseloop1:getHTMLContentDocx}</carbone>'+
              '</w:body>'+
            '</w:document>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
          /** WITH A FONT AND RTL */
          _templateContent = ''+
            '<w:document>'+
              '<w:body>'+
                '<w:p>'+
                  '<w:pPr>'+
                    '<w:bidi/>'+
                  '</w:pPr>'+
                  '<w:r>'+
                    '<w:rPr>'+
                      '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print"/>' +
                      '<w:sz w:val="36"/>' +
                    '</w:rPr>'+
                    '<w:t>{d.courseloop1:html}</w:t>'+
                  '</w:r>'+
                '</w:p>'+
              '</w:body>'+
            '</w:document>';
          _expectedContent = ''+
            '<w:document>'+
              '<w:body>'+
                '<carbone>{d.courseloop1:getHTMLContentDocx(\'style-ffSegoe Print-fs36-rtl\')}</carbone>'+
              '</w:body>'+
            '</w:document>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-ffSegoe Print-fs36-rtl')), JSON.stringify({ paragraph: '<w:bidi/>', text: '<w:rFonts w:ascii=\"Segoe Print\" w:hAnsi=\"Segoe Print\"/><w:sz w:val=\"36\"/>' }))
        });


        it('should seperate a single html formatter mixed with static content 1', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          const _templateContent = ''+
            '<w:p w14:paraId="1AE5FC3C" w14:textId="755E3547" w:rsidR="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>Content before </w:t>' +
              '</w:r>' +
              '<w:proofErr w:type="spellStart"/>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>Start{d.value:html}End</w:t>' +
              '</w:r>' +
              '<w:proofErr w:type="spellEnd"/>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t> Content after</w:t>' +
              '</w:r>' +
            '</w:p>';
          const _expectedContent = ''+
            '<w:p w14:paraId="1AE5FC3C" w14:textId="755E3547" w:rsidR="00B03DAF" w:rsidRDefault="00B03DAF">' +
            '<w:pPr>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t>Content before </w:t>' +
            '</w:r>' +
            '<w:proofErr w:type="spellStart"/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t>Start</w:t>' +
            '</w:r>' +
            '<w:proofErr w:type="spellEnd"/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t></w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<carbone>{d.value:getHTMLContentDocx}</carbone>' +
          '<w:p w14:paraId="1AE5FC3C" w14:textId="755E3547" w:rsidR="00B03DAF" w:rsidRDefault="00B03DAF">' +
            '<w:pPr>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t></w:t>' +
            '</w:r>' +
            '<w:proofErr w:type="spellStart"/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t>End</w:t>' +
            '</w:r>' +
            '<w:proofErr w:type="spellEnd"/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>' +
              '<w:t> Content after</w:t>' +
            '</w:r>' +
          '</w:p>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should seperate a single html formatter mixed with static content 2', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          const _templateContent = ''+
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>{d.value1:html} Content between {d.value2:html}</w:t>' +
              '</w:r>' +
            '</w:p>';
          const _expectedContent = ''+
            '<carbone>{d.value1:getHTMLContentDocx}</carbone>' +
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t> Content between </w:t>' +
              '</w:r>' +
            '</w:p>' +
            '<carbone>{d.value2:getHTMLContentDocx}</carbone>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should seperate a single html formatter mixed with static content 3', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          const _templateContent = ''+
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>{d.list[i].name} some content1 {d.list[i].content:html} after content {d.value:html} end</w:t>' +
              '</w:r>' +
            '</w:p>';
          const _expectedContent = ''+
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>{d.list[i].name} some content1 </w:t>' +
              '</w:r>' +
            '</w:p>' +
            '<carbone>{d.list[i].content:getHTMLContentDocx}</carbone>' +
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t> after content </w:t>' +
              '</w:r>' +
            '</w:p>' +
            '<carbone>{d.value:getHTMLContentDocx}</carbone>' +
            '<w:p w14:paraId="34557F09" w14:textId="0A75B4FA" w:rsidR="00B03DAF" w:rsidRPr="00B03DAF" w:rsidRDefault="00B03DAF">' +
              '<w:pPr>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t> end</w:t>' +
              '</w:r>' +
            '</w:p>';
          assert.strictEqual(html.reorderXML(_templateContent, _options), _expectedContent);
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });
      });
    });

    describe('seperateHTMLMarker', function () {
      it('should return a simple element when no HTML marker is included', function () {
        const _content = 'This is a simple sentence without elements';
        helper.assert(html.seperateHTMLMarker(_content, 244, 'odt'),
          [
            {
              pos    : 244,
              data   : 'This is a simple sentence without elements',
              isHTML : false
            }
          ]
        );
      });

      it('should return a descriptor with a static content and html marker without style', function () {
        const _content = 'How a rocket does work? {d.description:html} Voila!';
        /** ODT file */
        helper.assert(html.seperateHTMLMarker(_content, 130, 'odt'),
          [
            {
              pos    : 130,
              data   : 'How a rocket does work? ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.description:getHTMLContentOdt}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' Voila!',
              isHTML : false
            }
          ]
        );

        /** DOCX file */
        helper.assert(html.seperateHTMLMarker(_content, 130, 'docx'),
          [
            {
              pos    : 130,
              data   : 'How a rocket does work? ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.description:getHTMLContentDocx}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' Voila!',
              isHTML : false
            }
          ]
        );
      });

      it('should return a descriptor with a static content and html marker with a style', function () {
        const _content = 'start {d.html1:html} content between {d.html2:html} static content with a marker {d.element}';
        /** ODT file */
        helper.assert(html.seperateHTMLMarker(_content, 130, 'odt', '(text:style-name="P5")'),
          [
            {
              pos    : 130,
              data   : 'start ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.html1:getHTMLContentOdt(text:style-name="P5")}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' content between ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.html2:getHTMLContentOdt(text:style-name="P5")}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' static content with a marker {d.element}',
              isHTML : false
            }
          ]
        );

        /** DOCX file */
        helper.assert(html.seperateHTMLMarker(_content, 130, 'docx', '(\'American Typewriter\', 28)'),
          [
            {
              pos    : 130,
              data   : 'start ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.html1:getHTMLContentDocx(\'American Typewriter\', 28)}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' content between ',
              isHTML : false
            },
            {
              pos    : 130,
              data   : '<carbone>{d.html2:getHTMLContentDocx(\'American Typewriter\', 28)}</carbone>',
              isHTML : true
            },
            {
              pos    : 130,
              data   : ' static content with a marker {d.element}',
              isHTML : false
            }
          ]
        );
      });
    });

    describe('findStartingParagraph', function () {
      it('should throw an error is the XML is not valid, the paragraph is missing', function () {
        /** DOCX Error */
        let _templateContent = '<office:body><office:text>{d.content:html}</office:text></office:body>';
        helper.assert(html.findStartingParagraph(['<text:p', '<text:h'], '<office:body><office:text><w:u>{d.content:html}</w:u></office:text></office:body>', 30), {
          "paragraphStartPos": -1,
          "tagToSearchIndex": -1
        });
        /** ODT Should return an error */
        helper.assert(html.findStartingParagraph(['<text:p', '<text:h'], '<office:text><text:o>{d.content:html}</text:o></office:text>', 30), {
          "paragraphStartPos": -1,
          "tagToSearchIndex": -1
        });
      });

      it('should find the position of the paragraph ODT/DOCX', function () {
        // /** DOCX */
        helper.assert(html.findStartingParagraph('<w:p', '<office:body><office:text><w:p>{d.content:html}</w:p></office:text></office:body>', 40), {
          "paragraphStartPos": 26,
          "tagToSearchIndex": 0
        });
        helper.assert(html.findStartingParagraph('<w:p', '' +
            '<office:text>' +
              '<w:p w:rsidRDefault="00B03DAF">' +
                '<w:pPr>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                '</w:pPr>' +
                '<w:proofErr w:type="spellStart"/>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.content:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</office:text>'
        , 120), {
          "paragraphStartPos": 13,
          "tagToSearchIndex": 0
        });
        // /** ODT */
        helper.assert(html.findStartingParagraph('<text:p', '<office:body><office:text><text:p text:style-name="P5">{d.content:html}</text:p></office:text></office:body>', 50), {
          "paragraphStartPos": 26,
          "tagToSearchIndex": 0
        });
        helper.assert(html.findStartingParagraph('<text:p', '<office:text><text:p>{d.content:html}</text:p></office:text>', 30), {
          "paragraphStartPos": 13,
          "tagToSearchIndex": 0
        });
        helper.assert(html.findStartingParagraph(['<text:p', '<text:h'], '<office:body><office:text><text:h text:style-name="P5">{d.content:html}</text:h></office:text></office:body>', 50), {
          "paragraphStartPos": 26,
          "tagToSearchIndex": 1
        });
        helper.assert(html.findStartingParagraph(['<text:p', '<text:h'], '<office:text><text:h>{d.content:html}</text:h></office:text>', 30), {
          "paragraphStartPos": 13,
          "tagToSearchIndex": 1
        });
      });
    });

    describe('getTemplateDefaultStyles', function () {
      describe('DOCX', function () {

        it('should return an empty string if no style is included', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          helper.assert(html.getTemplateDefaultStyles('<office:body><office:text><w:p>{d.content:html}</w:p></office:text></office:body>', _options.extension), '');
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should return DOCX paragraph style: RTL and Text Alignment', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          helper.assert(html.getTemplateDefaultStyles('<w:p>' +
            '<w:pPr>' +
              '<w:bidi/>' +
              '<w:jc w:val="center"/>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
              '</w:rPr>', _options), '(\'style-rtl-textaligncenter\')');
            assert.strictEqual(_options.htmlStylesDatabase.size, 1);
            assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-rtl-textaligncenter')), JSON.stringify({ paragraph: '<w:bidi/><w:jc w:val=\"center\"/>', text: '' }))
        });

        it('should return DOCX text style: font family, font size and colors', function () {
          let _options = { extension : 'docx', htmlStylesDatabase: new Map() };
          helper.assert(html.getTemplateDefaultStyles('<w:p>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:lang w:val="en-US"/>' +
                '<w:sz w:val="18"/>' +
                '<w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cstheme="minorHAnsi"/>' +
              '</w:rPr>', _options), '(\'style-ffAmerican Typewriter-fs18\')');
            assert.strictEqual(_options.htmlStylesDatabase.size, 1);
            assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-ffAmerican Typewriter-fs18')), JSON.stringify({ paragraph: '', text: '<w:rFonts w:ascii=\"American Typewriter\" w:hAnsi=\"American Typewriter\" w:cstheme=\"minorHAnsi\"/><w:sz w:val=\"18\"/>' }))
          /** Missing font size */
          helper.assert(html.getTemplateDefaultStyles('<w:p>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                  '<w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cstheme="minorHAnsi"/>' +
                '</w:rPr>', _options), '(\'style-ffAmerican Typewriter\')');
          assert.strictEqual(_options.htmlStylesDatabase.size, 2);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-ffAmerican Typewriter')), JSON.stringify({ paragraph: '', text: '<w:rFonts w:ascii=\"American Typewriter\" w:hAnsi=\"American Typewriter\" w:cstheme=\"minorHAnsi\"/>' }))
          /** Missing font family */
          helper.assert(html.getTemplateDefaultStyles('<w:p>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                  '<w:sz w:val="18"/>' +
                '</w:rPr>', _options), '(\'style-fs18\')');
          assert.strictEqual(_options.htmlStylesDatabase.size, 3);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-fs18')), JSON.stringify({ paragraph: '', text: '<w:sz w:val=\"18\"/>' }))

          /** Colors */
          helper.assert(html.getTemplateDefaultStyles('<w:p>' +
          '<w:r>' +
            '<w:rPr>' +
              '<w:color w:val="FF0000"/>' +
              '<w:highlight w:val="yellow"/>' +
            '</w:rPr>', _options), '(\'style-tcolorFF0000-bgcoloryellow\')');
          assert.strictEqual(_options.htmlStylesDatabase.size, 4);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-tcolorFF0000-bgcoloryellow')), JSON.stringify({ paragraph: '', text: '<w:color w:val=\"FF0000\"/><w:highlight w:val=\"yellow\"/>' }))
        });
      })

      describe('ODT', function () {
        it('should return an empty string if no style is included', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          helper.assert(html.getTemplateDefaultStyles('<office:text><text:p>{d.content:html}</text:p></office:text>', _options), '');
          assert.strictEqual(_options.htmlStylesDatabase.size, 0);
        });

        it('should return ODT paragraph style', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          helper.assert(html.getTemplateDefaultStyles('<office:body><office:text><text:p text:style-name="P5">{d.content:html}</text:p></office:text></office:body>', _options), '(\'style-P5\')');
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: '' }))
        });

        it('should return ODT text style', function () {
          let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
          const _xmlStyle = '' +
            '<style:style style:name="T5" style:family="text">' +
              '<style:text-properties fo:color="#ff0000" loext:opacity="100%" style:font-name="Noteworthy" fo:font-size="16pt" fo:language="en" fo:country="US" fo:background-color="#ffff00" loext:char-shading-value="0" style:font-name-complex="Noto Sans"/>' +
            '</style:style>';
          helper.assert(
            html.getTemplateDefaultStyles('<office:body><office:text><text:p text:style-name="P5"><text:span text:style-name="T5">{d.content:html}</text:span></text:p></office:text></office:body>', _options, _xmlStyle),
            '(\'style-P5-T5\')'
          );
          assert.strictEqual(_options.htmlStylesDatabase.size, 1);
          assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5-T5')), JSON.stringify({ paragraph: 'text:style-name="P5"', text: ' fo:color=\"#ff0000\" style:font-name=\"Noteworthy\" fo:font-size=\"16pt\" fo:background-color=\"#ffff00\" style:font-name-complex=\"Noto Sans\"' }))
        });
      });
    });

    describe('addHtmlDefaultStylesDatabase', function () {
      it('should not throw an error if the database does not exist', function () {
        html.addHtmlDefaultStylesDatabase({}, 'id', {});
      });

      it('should add an element into the style database and it should not add it twice', function () {
        let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
        let _content = { paragraph: 'test 1', text: 'test 2' }
        html.addHtmlDefaultStylesDatabase(_options, 'style-P5-T5', _content);
        html.addHtmlDefaultStylesDatabase(_options, 'style-P5-T5', _content);
        assert.strictEqual(_options.htmlStylesDatabase.size, 1);
        assert.strictEqual(JSON.stringify(_options.htmlStylesDatabase.get('style-P5-T5')), JSON.stringify({ paragraph: 'test 1', text: 'test 2' }))
      });
    });

    describe('getHtmlDefaultStylesDatabase', function () {
      it('should not throw an error if the database does not exist and should return a valid object', function () {
        assert.strictEqual(JSON.stringify(html.getHtmlDefaultStylesDatabase({}, 'style-P5-T5')), JSON.stringify({ paragraph: '', text: '' }))
      });

      it('should retreive an element from the style database', function () {
        let _options = { extension : 'odt', htmlStylesDatabase: new Map() };
        let _content = { paragraph: 'test 1', text: 'test 2' }
        html.addHtmlDefaultStylesDatabase(_options, 'style-P5-T5', _content);
        assert.strictEqual(_options.htmlStylesDatabase.size, 1);
        assert.strictEqual(JSON.stringify(html.getHtmlDefaultStylesDatabase(_options, 'style-P5-T5')), JSON.stringify({ paragraph: 'test 1', text: 'test 2' }))
      });
    });

    describe('removeCarboneTags', function () {
      it('should do nothing if the file is not an XML file', function () {
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5"><carbone>HTML content</carbone></text:p></office:text></office:body>';
        const _template = {
          files : [{
            name : 'anotherfile.xml',
            data : _expectedContent
          },
          {
            name : 'document',
            data : _expectedContent
          },
          {
            name : 'document.rels',
            data : _expectedContent
          }]
        };
        html.removeCarboneTags(_template);
        helper.assert(_template.files[0].data, _expectedContent);
        helper.assert(_template.files[1].data, _expectedContent);
        helper.assert(_template.files[2].data, _expectedContent);
      });

      it('should replace the carbone tag on each XML files that contain in the file name "content", "document", "footer" or "header"', function () {
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5">HTML content</text:p></office:text></office:body>';
        const _template = {
          files : [{
            name : 'document.xml',
            data : '<office:body><office:text><text:p text:style-name="P5"><carbone>HTML content</carbone></text:p></office:text></office:body>'
          },
          {
            name : 'footer.xml',
            data : '<office:body><office:text><text:p text:style-name="P5"><carbone>HTML content</carbone></text:p></office:text></office:body>'
          },
          {
            name : 'header.xml',
            data : '<office:body><office:text><text:p text:style-name="P5"><carbone>HTML content</carbone></text:p></office:text></office:body>'
          },
          {
            name : 'content.xml',
            data : '<office:body><office:text><text:p text:style-name="P5"><carbone>HTML content</carbone></text:p></office:text></office:body>'
          }]
        };
        html.removeCarboneTags(_template);
        helper.assert(_template.files[0].data, _expectedContent);
        helper.assert(_template.files[1].data, _expectedContent);
        helper.assert(_template.files[2].data, _expectedContent);
        helper.assert(_template.files[3].data, _expectedContent);
      });
    });
  });

  describe('ODT reports', function () {
    describe('preProcessODT', function () {
      it('should do nothing', () => {
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5">{d.content}</text:p></office:text></office:body>';
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<office:body><office:text><text:p text:style-name="P5">{d.content}</text:p></office:text></office:body>'
          }]
        };
        html.preProcessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should convert html marker into a marker + post process marker [single marker]', () => {
        const _options = {
          extension: 'odt',
          htmlStylesDatabase: new Map()
        }
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<office:body><office:text><text:p text:style-name="P5">{d.content:html}</text:p></office:text></office:body>'
          }]
        };
        const _expectedContent = '<office:body><office:text><carbone>{d.content:getHTMLContentOdt(\'style-P5\')}</carbone></office:text></office:body>';
        html.preProcessODT(_template, _options);
        helper.assert(_template.files[0].data, _expectedContent);
        assert.strictEqual(_options.htmlStylesDatabase.size, 1);
      });

      it('should convert multiple html markers into a marker + post process marker [multiple markers]', () => {
        const _options = {
          extension: 'odt',
          htmlStylesDatabase: new Map()
        }
        const _template = {
          files : [{
            name : 'content.xml',
            data : '' +
                  '<office:body>' +
                  '<text:p text:style-name="P5">{d.value1:html} {d.element}</text:p>' +
                  '<text:p text:style-name="P1"/>' +
                  '<text:p text:style-name="P5">This is some content</text:p>' +
                  '<text:p text:style-name="P1"/>' +
                  '<text:p text:style-name="P3">{d.value3:html}</text:p>' +
                  '</office:body>'
          }]
        };
        const _expectedContent = '' +
                      '<office:body>' +
                      '<carbone>{d.value1:getHTMLContentOdt(\'style-P5\')}</carbone>' +
                      '<text:p text:style-name="P5"> {d.element}</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P5">This is some content</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<carbone>{d.value3:getHTMLContentOdt(\'style-P3\')}</carbone>' +
                      '</office:body>';
        html.preProcessODT(_template, _options);
        helper.assert(_template.files[0].data, _expectedContent);
        assert.strictEqual(_options.htmlStylesDatabase.size, 2);
      });
    });

    describe('buildXMLContentOdt', function () {
      const _uniqueID = 'C01';
      it('should do nothing if the descriptor is empty', function () {
        const res = html.buildXMLContentOdt(_uniqueID, []);
        helper.assert(res.content.get(), '');
        helper.assert(res.style, '');
      });

      it('should create the content and style from an HTML descriptor', function () {
        const _expected = {
          content : '' +
            '<text:p><text:span text:style-name="C010">bold</text:span>' +
            '<text:span text:style-name="C011">and italic</text:span></text:p>',
          style : '' +
            '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>',
          styleLists : ''
        };
        const res = html.buildXMLContentOdt(_uniqueID, [
          { content : 'bold', type : '', tags : ['b'] },
          { content : 'and italic', type : '', tags : ['em'] }
        ]);
        helper.assert(res.content.get(), _expected.content);
        helper.assert(res.style, _expected.style);
        helper.assert(res.styleLists, _expected.styleLists);

        const _expected2 = {
          content : '' +
            '<text:p><text:span>this</text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
            '<text:span text:style-name="C012">and italic</text:span>' +
            '<text:span> text</text:span></text:p>',
          style : '' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>',
          styleLists : ''
        };
        const res2 = html.buildXMLContentOdt(_uniqueID, [
          { content : 'this', type : '', tags : [] },
          { content : ' is a bold', type : '', tags : ['b'] },
          { content : 'and italic', type : '', tags : ['em'] },
          { content : ' text', type : '', tags : [] },
        ]);
        helper.assert(res2.content.get(), _expected2.content);
        helper.assert(res2.style, _expected2.style);
        helper.assert(res2.styleLists, _expected2.styleLists);
      });

      it('should create the content and style from an HTML descriptor and should include the style coming from the template (paragraph + text: RTL, colors, fonts)', function () {

        /** Init template style, it is executed during the preprocessing */
        const _options = {
          htmlStylesDatabase: new Map()
        }
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += 'fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"'
        _htmlDefaultStyleObject.paragraph += 'text:style-name="P2"';
        _options.htmlStylesDatabase.set(_styleId, _htmlDefaultStyleObject)

        const _expected = {
          content : '' +
            '<text:p text:style-name="P2">'+
              '<text:span text:style-name="C010">this</text:span>'+
              '<text:span text:style-name="C011"> is a bold</text:span>'+
              '<text:span text:style-name="C012">and italic</text:span>'+
              '<text:span text:style-name="C013"> text</text:span>'+
            '</text:p>',
          style : '' +
            '<style:style style:name="C010" style:family="text">' +
              '<style:text-properties fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C011" style:family="text">' +
              '<style:text-properties fo:font-weight="bold" fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C012" style:family="text">'+
              '<style:text-properties fo:font-style="italic" fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C013" style:family="text">'+
              '<style:text-properties fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>',
          styleLists : ''
        }

        const _res = html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this', type : '', tags : [] },
            { content : ' is a bold', type : '', tags : ['b'] },
            { content : 'and italic', type : '', tags : ['em'] },
            { content : ' text', type : '', tags : [] },
          ], _options, _styleId /** Default style ID as a last argument */)

        helper.assert(_res.content.get(), _expected.content);
        helper.assert(_res.style, _expected.style);
        helper.assert(_res.styleLists, _expected.styleLists);
      });

      it('should create the content and style from an HTML descriptor and should include the style coming from the template (paragraph only: RTL and text alignment)', function () {
        /** Init template style, it is executed during the preprocessing */
        const _options = {
          htmlStylesDatabase: new Map()
        }
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += ''
        _htmlDefaultStyleObject.paragraph += 'text:style-name="P2"';
        _options.htmlStylesDatabase.set(_styleId, _htmlDefaultStyleObject)

        let _res = html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this', type : '', tags : [] },
            { content : ' is a bold', type : '', tags : ['b'] },
            { content : 'and italic', type : '', tags : ['em'] },
            { content : ' text', type : '', tags : [] },
          ],
          _options,
          _styleId /** Default style ID as a last argument */
        )

        let _expected = {
          content : '' +
            '<text:p text:style-name="P2">'+
              '<text:span>this</text:span>'+
              '<text:span text:style-name="C011"> is a bold</text:span>'+
              '<text:span text:style-name="C012">and italic</text:span>'+
              '<text:span> text</text:span>'+
            '</text:p>',
          style : '' +
            '<style:style style:name="C011" style:family="text">' +
              '<style:text-properties fo:font-weight="bold"/>'+
            '</style:style>'+
            '<style:style style:name="C012" style:family="text">'+
              '<style:text-properties fo:font-style="italic"/>'+
            '</style:style>',
          styleLists : ''
        };

        helper.assert(_res.content.get(), _expected.content);
        helper.assert(_res.style, _expected.style);
        helper.assert(_res.styleLists, _expected.styleLists);
      });

      it('should create the content and style from an HTML descriptor and should include the style coming from the template (text style only: colors, fonts)', function () {

        /** Init template style, it is executed during the preprocessing */
        const htmlDefaultStyleDatabase = new Map();
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += 'fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"'
        _htmlDefaultStyleObject.paragraph += '';
        htmlDefaultStyleDatabase.set(_styleId, _htmlDefaultStyleObject)

        let _res = html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this', type : '', tags : [] },
            { content : ' is a bold', type : '', tags : ['b'] },
            { content : 'and italic', type : '', tags : ['em'] },
            { content : ' text', type : '', tags : [] },
          ],
          { htmlStylesDatabase: htmlDefaultStyleDatabase },
          _styleId /** Default style ID as a last argument */
        );
        let _expected = {
          content : '' +
            '<text:p>'+
              '<text:span text:style-name="C010">this</text:span>'+
              '<text:span text:style-name="C011"> is a bold</text:span>'+
              '<text:span text:style-name="C012">and italic</text:span>'+
              '<text:span text:style-name="C013"> text</text:span>'+
            '</text:p>',
          style : '' +
            '<style:style style:name="C010" style:family="text">' +
              '<style:text-properties fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C011" style:family="text">' +
              '<style:text-properties fo:font-weight="bold" fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C012" style:family="text">'+
              '<style:text-properties fo:font-style="italic" fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>'+
            '<style:style style:name="C013" style:family="text">'+
              '<style:text-properties fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"/>'+
            '</style:style>',
          styleLists : ''
        };

        helper.assert(_res.content.get(), _expected.content);
        helper.assert(_res.style, _expected.style);
        helper.assert(_res.styleLists, _expected.styleLists);
      });

      it('should create the content and style from an HTML descriptor that contains unknown tags', function () {
        const descriptor = [
          { content : 'this ', type : '', tags : ['div', 'b'] },
          { content : ' is a bold', type : '', tags : ['div', 'b', 'u'] },
          { content : '', type : '#PB#', tags : [] },
          { content : ' text ', type : '', tags : ['div', 'b', 'u', 'em'] },
          { content : 'and ', type : '', tags : ['div', 'b', 'em'] },
          { content : 'italic ', type : '', tags : ['div', 'b', 'em', 's'] },
          { content : '', type : '#PE#', tags : [] },
          { content : 'text', type : '', tags : ['div', 'b', 's'] },
          { content : '.', type : '', tags : [] },
        ];
        const expectedContent = '' +
          '<text:p>' +
            '<text:span text:style-name="C010">this </text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
          '</text:p>' +
          '<text:p>' +
            '<text:span text:style-name="C013"> text </text:span>' +
            '<text:span text:style-name="C014">and </text:span>' +
            '<text:span text:style-name="C015">italic </text:span>' +
          '</text:p><text:p text:style-name="Standard"/>' +
          '<text:p>' +
            '<text:span text:style-name="C017">text</text:span>' +
            '<text:span>.</text:span>' +
          '</text:p>';
        const expectedStyle = '' +
            '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-weight="bold" style:text-underline-style="solid"/></style:style>' +
            '<style:style style:name="C013" style:family="text"><style:text-properties fo:font-weight="bold" style:text-underline-style="solid" fo:font-style="italic"/></style:style>' +
            '<style:style style:name="C014" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic"/></style:style>' +
            '<style:style style:name="C015" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic" style:text-line-through-style="solid"/></style:style>' +
            '<style:style style:name="C017" style:family="text"><style:text-properties fo:font-weight="bold" style:text-line-through-style="solid"/></style:style>';
        const res = html.buildXMLContentOdt(_uniqueID, descriptor);
        helper.assert(res.content.get(), expectedContent);
        helper.assert(res.style, expectedStyle);
        helper.assert(res.styleLists, '');
      });

      it('should create the content and style from an HTML descriptor that contains BREAK LINE', function () {

        let _res1 = html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
          ]
        )
        helper.assert(_res1.content.get(), '' +
            '<text:p>'+
              '<text:span>This is </text:span>'+
              '<text:line-break/>'+
              '<text:span text:style-name="C012">a tree</text:span>'+
            '</text:p>');
        helper.assert(_res1.style, '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>');
        helper.assert(_res1.styleLists, '');

        let _res2 = html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : ' is', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'simple', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : ' text', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : '.', type : '', tags : [] }
          ]
        );
        helper.assert(_res2.style, '');
        helper.assert(_res2.styleLists, '');
        helper.assert(_res2.content.get(), '' +
          '<text:p><text:span>This </text:span>' +
          '<text:line-break/>' +
          '<text:span> is</text:span>' +
          '<text:line-break/>' +
          '<text:span>a</text:span>' +
          '<text:line-break/>' +
          '<text:span>simple</text:span>' +
          '<text:line-break/>' +
          '<text:line-break/>' +
          '<text:span> text</text:span>' +
          '<text:line-break/>' +
          '<text:span>.</text:span></text:p>'
        );

        let _res3 = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p><strong>Bold content</strong> Content without style. <br /><br>After double new lines</p><br/>'));
        helper.assert(_res3.content.get(), '' +
          '<text:p>' +
            '<text:span text:style-name="C011">Bold content</text:span>' +
            '<text:span> Content without style. </text:span>' +
            '<text:line-break/>' +
            '<text:line-break/>' +
            '<text:span>After double new lines</text:span>' +
          '</text:p>' +
          '<text:p text:style-name="Standard"/>' +
          '<text:p text:style-name="Standard"/>'
        );
      });

      it('should create hyperlinks', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<a href="carbone.com/?name=john&lastname=wick">Carbone Website</a>'), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
            '<text:a xlink:type="simple" xlink:href="https://carbone.com/?name=john&amp;lastname=wick">' +
              '<text:span>Carbone Website</text:span>' +
            '</text:a>' +
          '</text:p>'
        );

        res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('Some content before <a href="carbone.com">Carbone Website something <b>bold</b> and <i>italic</i></a> Content after'), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
            '<text:span>Some content before </text:span>' +
            '<text:a xlink:type="simple" xlink:href="https://carbone.com">' +
              '<text:span>Carbone Website something </text:span>' +
              '<text:span text:style-name="C013">bold</text:span>' +
              '<text:span> and </text:span>' +
              '<text:span text:style-name="C015">italic</text:span>' +
            '</text:a>' +
            '<text:span> Content after</text:span>' +
          '</text:p>'
        );
        helper.assert(res.style, ''+
          '<style:style style:name="C013" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
          '<style:style style:name="C015" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        );
      });

      it('should create hyperlinks inside a list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ul><li><a href="carbone.com">Carbone Website</a></li></ul>'), {});
        helper.assert(res.content.get(), '' +
        '<text:list text:style-name="LC010">'+
          '<text:list-item>'+
            '<text:p>'+
              '<text:a xlink:type="simple" xlink:href="https://carbone.com">'+
                '<text:span>Carbone Website</text:span>'+
              '</text:a>'+
            '</text:p>'+
          '</text:list-item>'+
        '</text:list>'+
        '<text:p text:style-name="Standard"/>'
        );
      });

      it('should generate a link with a nested paragraph and should not print the paragraph', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<a href="carbone.io"><p>Carbone Website</p></a>'), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
            '<text:a xlink:type="simple" xlink:href="https://carbone.io">' +
              '<text:span>Carbone Website</text:span>' +
            '</text:a>' +
          '</text:p>'
        );
      });

      it('should return a paragraph without comments', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p>This is a<!-- Start comment <w:LidThemeOther>DE</w:LidThemeOther> end comment --> paragraph</p>'), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
              '<text:span>This is a</text:span><text:span> paragraph</text:span>' +
          '</text:p><text:p text:style-name="Standard"/>'
        );
      });

      it('should return a paragraph without comments', function () {
        const _content = '<p class="MsoNormal">I:\\MARKETING TDA\\Produktentwicklung\\Packanweisung\\Display\\2022-09-28 überarbeitete Packanweisung 28261 Mellow Marshmallow Meterspeckspieße 30x180g BA (1UK = 1VE à 30x180g).docx</p>' +
                        '<!--[if gte mso 9]><xml> <w:WordDocument><w:View>Normal</w:View> <w:Zoom>0</w:Zoom> <w:TrackMoves/> <w:TrackFormatting/>' +
                        '<w:HyphenationZone>21</w:HyphenationZone> <w:PunctuationKerning/> <w:ValidateAgainstSchemas/>' +
                        '<w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid> <w:IgnoreMixedContent>false</w:IgnoreMixedContent>' +
                        '<w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText> <w:DoNotPromoteQF/>' +
                        '<w:LidThemeOther>DE</w:LidThemeOther> <w:LidThemeAsian>X-NONE</w:LidThemeAsian>-->';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(_content), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
              '<text:span>I:\\MARKETING TDA\\Produktentwicklung\\Packanweisung\\Display\\2022-09-28 überarbeitete Packanweisung 28261 Mellow Marshmallow Meterspeckspieße 30x180g BA (1UK = 1VE à 30x180g).docx</text:span>' +
          '</text:p><text:p text:style-name="Standard"/>'
        );
      });

      it('should return a correct paragraph even if the end comments tag is missing', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p>This is a<!-- Start comment <w:LidThemeOther>DE</w:LidThemeOther> end comment paragraph</p>'), {});
        helper.assert(res.content.get(), '' +
          '<text:p>' +
              '<text:span>This is a</text:span>' +
          '</text:p><text:p text:style-name="Standard"/>'
        );
      });

      it('should generate a simple unordered list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Coffee</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Tea</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Milk</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
          '</text:list><text:p text:style-name="Standard"/>'
        );

        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" text:bullet-char="◦">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-bullet>'+
          '</text:list-style>'
        );
      });

      it('should generate a simple ordered list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ol><li>Coffee</li></ol>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Coffee</text:span>'+
              '</text:p>'+
            '</text:list-item>' +
          '</text:list><text:p text:style-name="Standard"/>'
        );

        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-number text:level="1" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-number>'+
          '</text:list-style>'
        );
      });

      it('should generate a nested ordered list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ol><li>Coffee</li><ol><li>Americano</li></ol></ol>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Coffee</text:span>'+
              '</text:p>'+
            '</text:list-item>' +
            '<text:list-item>'+
              '<text:list>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Americano</text:span>'+
                  '</text:p>'+
                '</text:list-item>' +
              '</text:list>'+
            '</text:list-item>' +
          '</text:list><text:p text:style-name="Standard"/>'
        );

        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-number text:level="1" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-number>'+
            '<text:list-level-style-number text:level="2" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.91cm" fo:text-indent="-0.635cm" fo:margin-left="1.91cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-number>'+
          '</text:list-style>'
        );
      });

      it('should generate a nested ordered and unordered list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ol><li>Coffee</li><ul><li>Americano</li></ul></ol>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Coffee</text:span>'+
              '</text:p>'+
            '</text:list-item>' +
            '<text:list-item>'+
              '<text:list>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Americano</text:span>'+
                  '</text:p>'+
                '</text:list-item>' +
              '</text:list>'+
            '</text:list-item>' +
          '</text:list><text:p text:style-name="Standard"/>'
        );

        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-number text:level="1" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-number>'+
            '<text:list-level-style-bullet text:level="2" text:style-name="Bullet_20_Symbols" text:bullet-char="▪">' +
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.91cm" fo:text-indent="-0.635cm" fo:margin-left="1.91cm"/>' +
              '</style:list-level-properties>' +
            '</text:list-level-style-bullet>' +
          '</text:list-style>'
        );
      });

      it('should generate a simple unordered list with a nested paragraph', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ul><li><strong><p>Biochemistry, molecular and cell biology</p></strong></li></ul>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span text:style-name="C013">Biochemistry, molecular and cell biology</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
          '</text:list><text:p text:style-name="Standard"/>'
        );
      });

      it('should create a nested unordered list && should not add an extra break line at the end of the nested list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ul><li>Coffee<ul><li>Mocha</li><li>Cappucino</li><li>Americano</li></ul></li><li>Tea</li><li>Milk</li></ul>'));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Coffee</text:span>'+
              '</text:p>'+ // END OF PARAGRAPH HERE
              '<text:list>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Mocha</text:span>'+
                  '</text:p>'+
                '</text:list-item>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Cappucino</text:span>'+
                  '</text:p>'+
                '</text:list-item>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Americano</text:span>'+
                  '</text:p>'+
                '</text:list-item>'+
              '</text:list>' +
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Tea</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Milk</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
          '</text:list><text:p text:style-name="Standard"/>'
        );

        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" text:bullet-char="◦">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-bullet>'+
            '<text:list-level-style-bullet text:level="2" text:style-name="Bullet_20_Symbols" text:bullet-char="▪">' +
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.91cm" fo:text-indent="-0.635cm" fo:margin-left="1.91cm"/>' +
              '</style:list-level-properties>' +
            '</text:list-level-style-bullet>' +
          '</text:list-style>'
        );
      });

      it('should generate a simple unordered list with a break line and styles', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<ul><li>Banana with some text<br/>Second line</li><li>Pineapple with a <b>bold</b> and <u>underlined</u> style</li></ul>'));
        helper.assert(res.content.get(), '' +
            '<text:list text:style-name="LC010">' +
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Banana with some text</text:span>'+
                  '<text:line-break/>'+
                  '<text:span>Second line</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
              '<text:list-item>' +
                '<text:p>' +
                  '<text:span>Pineapple with a </text:span>' +
                  '<text:span text:style-name="C018">bold</text:span>' +
                  '<text:span> and </text:span>' +
                  '<text:span text:style-name="C0110">underlined</text:span>' +
                  '<text:span> style</text:span>' +
                '</text:p>' +
              '</text:list-item>' +
            '</text:list><text:p text:style-name="Standard"/>'
        );
        helper.assert(res.style, '' +
          '<style:style style:name="C018" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
          '<style:style style:name="C0110" style:family="text"><style:text-properties style:text-underline-style="solid"/></style:style>'
        );
        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC010">'+
            '<text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" text:bullet-char="◦">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-bullet>'+
          '</text:list-style>'
        );
      });

      it('should create a list preceded by a string, a middle string and a next string', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('Before<ul><li>Content1</li></ul>Middle<ol><li>Content2</li></ol>End'));
        helper.assert(res.content.get(), '' +
            '<text:p>'+
              '<text:span>Before</text:span>'+
            '</text:p>'+
            '<text:list text:style-name="LC011">'+
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Content1</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
            '</text:list>'+
            '<text:p text:style-name="Standard"/>' +
            '<text:p>'+
              '<text:span>Middle</text:span>'+
            '</text:p>'+
            '<text:list text:style-name="LC017">'+
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Content2</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
            '</text:list>'+
            '<text:p text:style-name="Standard"/>' +
            '<text:p>'+
              '<text:span>End</text:span>'+
            '</text:p>'
        );
        helper.assert(res.styleLists, '' +
          '<text:list-style style:name="LC011">'+
            '<text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" text:bullet-char="◦">'+
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">'+
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>'+
              '</style:list-level-properties>'+
            '</text:list-level-style-bullet>'+
          '</text:list-style>' +
          '<text:list-style style:name="LC017">' +
            '<text:list-level-style-number text:level="1" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">' +
              '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>' +
              '</style:list-level-properties>' +
            '</text:list-level-style-number>' +
          '</text:list-style>'
        );
      });

      it('should create list with default font coming from the template', function () {
        let content = '<ol><li><i>Felgen ALU</i></li><li><i>Farbe rot</i></li></ol>';
        const _options = {
          extension : 'odt',
          htmlStylesDatabase: new Map()
        };

        // Prepare the style coming from the template
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += ''
        _htmlDefaultStyleObject.paragraph += 'style:name="P2"';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), _options, _styleId);
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">' +
            '<text:list-item>' +
              '<text:p style:name="P2">' +
                '<text:span text:style-name="C012">Felgen ALU</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
            '<text:list-item>' +
              '<text:p style:name="P2">' +
                '<text:span text:style-name="C015">Farbe rot</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
          '</text:list>' +
          '<text:p text:style-name="Standard"/>'
        );
      });

      it('should create a nexted list without text in the parent LI', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('' +
        '<ul>' +
          '<li>Coffee</li>' +
          '<ul><li>Mocha</li><li>Cappucino</li><li>Americano</li></ul>' +
          '<li>Water</li>' +
        '</ul>'));

        helper.assert(res.content.get(), '' +
            '<text:list text:style-name="LC010">'+ // Parent List
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Coffee</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
              '<text:list-item>'+
                '<text:list>'+ // Nested list
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>Mocha</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>Cappucino</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>Americano</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                '</text:list>' +
              '</text:list-item>'+
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Water</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
            '</text:list><text:p text:style-name="Standard"/>'
        );
      });

      it('should create a list of mix elements (hyperlink / styles/ break lines)', function () {
        let content = 'This is a list:<br>' +
                  '<ul>' +
                    '<li>Banana</li>' +
                    '<li>An URL to <a href="carbone.io">carbone.io</a> and a <a href="carbone.io/documentation.html"><i>link with a style</i></a></li>' +
                  '</ul>';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), {});
        helper.assert(res.content.get(), '' +
          '<text:p><text:span>This is a list:</text:span><text:line-break/></text:p>' +
          '<text:list text:style-name="LC012">' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>Banana</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>An URL to </text:span>' +
                '<text:a xlink:type="simple" xlink:href="https://carbone.io">' +
                  '<text:span>carbone.io</text:span>' +
                '</text:a>' +
                '<text:span> and a </text:span>' +
                '<text:a xlink:type="simple" xlink:href="https://carbone.io/documentation.html">' +
                  '<text:span text:style-name="C0113">link with a style</text:span>' +
                '</text:a>' +
              '</text:p>' +
            '</text:list-item>' +
          '</text:list><text:p text:style-name="Standard"/>'
        );
      });

      it('should create a list with a paragraph', function () {
        let content = '' +
                  '<ul>' +
                    '<li>Banana</li>' +
                    '<li><p>Apple</p></li>' +
                    '<li>Pear</li>' +
                  '</ul>';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>Banana</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>Apple</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>Pear</text:span>' +
              '</text:p>' +
            '</text:list-item>' +
          '</text:list><text:p text:style-name="Standard"/>'
        );
      });

      it('should create a double nested list', function () {
        let content = '' +
        '<ul>' +
          '<li>Coffee' +
            '<ul>' +
              '<li>Mocha</li>' +
                '<ul>' +
                  '<li>green</li>' +
                  '<li>red</li>' +
                  '<li>blue</li>' +
              '</ul>' +
              '<li>Americano</li>' +
            '</ul>' +
          '</li>' +
          '<li>Water</li>' +
        '</ul>';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content));
        helper.assert(res.content.get(), '' +
        '<text:list text:style-name="LC010">'+
          '<text:list-item>'+
            '<text:p>'+
              '<text:span>Coffee</text:span>'+
            '</text:p>'+
            '<text:list>'+
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Mocha</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
              '<text:list-item>'+
                '<text:list>'+
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>green</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>red</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                  '<text:list-item>'+
                    '<text:p>'+
                      '<text:span>blue</text:span>'+
                    '</text:p>'+
                  '</text:list-item>'+
                '</text:list>'+
              '</text:list-item>'+
              '<text:list-item>'+
                '<text:p>'+
                  '<text:span>Americano</text:span>'+
                '</text:p>'+
              '</text:list-item>'+
            '</text:list>'+
          '</text:list-item>'+
          '<text:list-item>'+
            '<text:p>'+
              '<text:span>Water</text:span>'+
            '</text:p>'+
          '</text:list-item>'+
        '</text:list>'+
        '<text:p text:style-name="Standard"/>'
        );
      });
      it('should create a nested list with in a "li" tag without text', function () {
        let content = '' +
                  '<ul>' +
                    '<li>Banana</li>' +
                    '<li>' +
                      '<ul>' +
                        '<li>Mocha</li>' +
                      '</ul>' +
                    '</li>' +
                    '<li>Pear</li>' +
                  '</ul>';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Banana</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:list>'+
                '<text:list-item>'+
                  '<text:p>'+
                    '<text:span>Mocha</text:span>'+
                  '</text:p>'+
                '</text:list-item>'+
              '</text:list>'+
            '</text:list-item>'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Pear</text:span>'+
              '</text:p>'+
            '</text:list-item>'+
          '</text:list>'+
          '<text:p text:style-name="Standard"/>'
        );
      });
      it('should create a nested list with in a "li" tag preceded by a break line', function () {
        let content = '' +
                  '<ul>' +
                    '<li>' +
                      'Drinks:<br/>' +
                      '<ul>' +
                        '<li>Mocha</li>' +
                      '</ul>' +
                    '</li>' +
                  '</ul>';
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content));
        helper.assert(res.content.get(), '' +
          '<text:list text:style-name="LC010">' +
            '<text:list-item>' +
              '<text:p>' +
                '<text:span>Drinks:</text:span>' +
                '<text:line-break/>' +
              '</text:p>' +
              '<text:list>' +
                '<text:list-item>' +
                  '<text:p>' +
                    '<text:span>Mocha</text:span>' +
                  '</text:p>' +
                '</text:list-item>' +
              '</text:list>' +
            '</text:list-item>' +
          '</text:list>' +
          '<text:p text:style-name="Standard"/>'
        );
      });

      it('should add an ending paragraph and a new line', function () {
        const { content } = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p>content'));
        helper.assert(content.get(), '<text:p><text:span>content</text:span></text:p><text:p text:style-name="Standard"/>');
      });

      it('should skip empty paragraphs', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p><p>   <p>content'));
        helper.assert(res.content.get(), '<text:p><text:span>content</text:span></text:p><text:p text:style-name="Standard"/>');
      });

      it('should skip paragraphs before a list', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p><p>   <ol><li>content</li></ol>'));
        helper.assert(res.content.get(), '<text:list text:style-name="LC013"><text:list-item><text:p><text:span>content</text:span></text:p></text:list-item></text:list><text:p text:style-name="Standard"/>');

        res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<p><p>   <ul><li>content</li></ul>'));
        helper.assert(res.content.get(), '<text:list text:style-name="LC013"><text:list-item><text:p><text:span>content</text:span></text:p></text:list-item></text:list><text:p text:style-name="Standard"/>');
      });

      it('should create an image', function () {
        let content = '<img src="https://carbone.io/cat" width="300" height="50" alt="cat">';
        const _options = {
          uniqueId: 0,
          imageDatabase: new Map()
        }
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), _options);
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        _options.imageDatabase.set('https://carbone.io/cat', {id: 0, extension: 'png', imageWidth: 100, imageHeight: 200});
        helper.assert(res.content.get(_options), '' +
          '<text:p>' +
            '<draw:frame draw:name="carbone-html-image-0" text:anchor-type="as-char" svg:width="100cm" svg:height="200cm" draw:z-index="0">' +
              '<draw:image xlink:href="Pictures/CarboneImage0.png" draw:mime-type="" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
            '</draw:frame>' +
          '</text:p>'
        );
      });

      it('should create an image mixed with paragraphs', function () {
        let content = '<p>Before picture<p><img src="https://carbone.io/cat" width="300" height="50" alt="cat"></p><b>After picture</b></p>';
        const _options = {
          uniqueId: 0,
          imageDatabase: new Map()
        }
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), _options);
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        _options.imageDatabase.set('https://carbone.io/cat', {id: 0, extension: 'png', imageWidth: 100, imageHeight: 200});
        helper.assert(res.content.get(_options), '' +
          '<text:p>' +
            '<text:span>Before picture</text:span>' +
          '</text:p>' +
          '<text:p text:style-name="Standard"/>' +
          '<text:p>' +
            '<draw:frame draw:name="carbone-html-image-0" text:anchor-type="as-char" svg:width="100cm" svg:height="200cm" draw:z-index="0">' +
              '<draw:image xlink:href="Pictures/CarboneImage0.png" draw:mime-type="" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>' +
            '</draw:frame>' +
          '</text:p>' +
          '<text:p text:style-name="Standard"/>' +
          '<text:p>' +
            '<text:span text:style-name="C015">After picture</text:span>' +
          '</text:p>'
        );
      });
      it('should create an image inside a list', function () {
        let content = '<ul><li>Text before<img src="https://carbone.io/cat" alt="cat"/>After</li></ul>';
        const _options = {
          uniqueId: 0,
          imageDatabase: new Map()
        }
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), _options);
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        _options.imageDatabase.set('https://carbone.io/cat', {id: 0, extension: 'png', imageWidth: 100, imageHeight: 200});
        helper.assert(res.content.get(_options), '' +
        '<text:list text:style-name="LC010">'+
          '<text:list-item>'+
            '<text:p>'+
              '<text:span>Text before</text:span>'+
              '<draw:frame draw:name="carbone-html-image-0" text:anchor-type="as-char" svg:width="100cm" svg:height="200cm" draw:z-index="0">'+
                '<draw:image xlink:href="Pictures/CarboneImage0.png" draw:mime-type="" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>'+
              '</draw:frame>'+
              '<text:span>After</text:span>'+
            '</text:p>'+
          '</text:list-item>'+
        '</text:list>'+
        '<text:p text:style-name="Standard"/>'
        );

        // const _ita = _options.hyperlinkDatabase.keys();
        // helper.assert(_ita.next().value, 'https://carbone.io/documentation.html');
        // helper.assert(_ita.next().value, undefined);
      });

      it('should create an image inside a list and an anchor', function () {
        let content = '<ul><li>Text before <a href="https://carbone.io/documentation.html"> link <img src="https://carbone.io/cat" alt="cat"></a></li></ul>';
        const _options = {
          uniqueId: 0,
          imageDatabase: new Map()
        }
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML(content), _options);
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        _options.imageDatabase.set('https://carbone.io/cat', {id: 0, extension: 'png', imageWidth: 100, imageHeight: 200});
        helper.assert(res.content.get(_options), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
              '<text:p>'+
                '<text:span>Text before </text:span>'+
                '<text:a xlink:type="simple" xlink:href="https://carbone.io/documentation.html">'+
                  '<text:span> link </text:span>'+
                  '<draw:a xlink:type="simple" xlink:href="https://carbone.io/documentation.html">'+
                    '<draw:frame draw:name="carbone-html-image-0" text:anchor-type="as-char" svg:width="100cm" svg:height="200cm" draw:z-index="0">'+
                      '<draw:image xlink:href="Pictures/CarboneImage0.png" draw:mime-type="" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>'+
                    '</draw:frame>'+
                  '</draw:a>'+
                '</text:a>'+
              '</text:p>'+
            '</text:list-item>'+
          '</text:list>'+
          '<text:p text:style-name="Standard"/>'
        );

        // const _ita = _options.hyperlinkDatabase.keys();
        // helper.assert(_ita.next().value, 'https://carbone.io/documentation.html');
        // helper.assert(_ita.next().value, undefined);
      });

      it('should create a client HTML (courseloop 4)', function () {
        const _options = {
          defaultUrlOnError: 'https://carbone.io/error'
        }

        const _html = '' +
          '<ul>' +
            '<li>' +
              '<p>Text <a href="proposal-landing#/b45e8fbddbfe4890590396888a96191e" rel="nofollow">Link</a></p>' +
            '</li>' +
            '<li>' +
              '<p>Second text</p>' +
            '</li>' +
          '</ul>';

        const _descriptor = html.parseHTML(_html);
        let res = html.buildXMLContentOdt(_uniqueID, _descriptor, _options);
        helper.assert(res.content.get(_options), '' +
          '<text:list text:style-name="LC010">'+
            '<text:list-item>'+
            '<text:p>'+
              '<text:span>Text </text:span>'+
              '<text:a xlink:type="simple" xlink:href="https://carbone.io/error">'+
                '<text:span>Link</text:span>'+
              '</text:a>'+
            '</text:p>'+
            '</text:list-item>'+
            '<text:list-item>'+
            '<text:p>'+
              '<text:span>Second text</text:span>'+
            '</text:p>'+
            '</text:list-item>'+
          '</text:list>'+
          '<text:p text:style-name="Standard"/>'
        );
      });
    });

    describe('postprocessODT', function () {
      it('should do nothing if htmlDatabase is empty', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        const _template = {
          files : [{
            name : 'content.xml',
            data : _expectedContent
          }]
        };
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should add a new style [BOLD]', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('<b>Text content</b>', {
          id      : 'C01',
          content : '<text:span text:style-name="C010">Text content</text:span>',
          style   : '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>'
        });
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should add styles [ITALIC/UNDERLINE/STRONG]', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('<i><u>This is a </u></i>', {
          id      : 'C01',
          content : 'This is a ',
          style   : '<style:style style:name="C010" style:family="text"><style:text-properties style:text-underline-style="solid" fo:font-style="italic"/></style:style>'
        });
        _options.htmlDatabase.set('<strong>strong text</strong>text', {
          id      : 'C02',
          content : 'strong text',
          style   : '<style:style style:name="C020" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>'
        });
        _options.htmlDatabase.set('<s>striked text</s>', {
          id      : 'C03',
          content : 'content',
          style   : '<style:style style:name="C015" style:family="text"><style:text-properties style:text-line-through-style="solid"/></style:style>'
        });
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="C010" style:family="text"><style:text-properties style:text-underline-style="solid" fo:font-style="italic"/></style:style><style:style style:name="C020" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style><style:style style:name="C015" style:family="text"><style:text-properties style:text-line-through-style="solid"/></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
    });

    describe('formatters/postProcessFormatters ODT', function () {
      it('getHtmlContentOdt - should not crash if the content is null &&\n\
               getHTMLContentOdtPostProcess - should not crash if the contentID does not exist', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('nullContent', { content : null });
        const _content = null;
        const _expectedContent = '';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        /** The null content is transformed into an empty string */
        const _properties = _options.htmlDatabase.get('');
        helper.assert(_properties.content.get(_content), _expectedContent);
        helper.assert(_properties.style, '')
        helper.assert(_properties.styleLists, '')
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), _expectedContent);
        helper.assert(_postProcess.fn.call(_options, null), '');
        helper.assert(_postProcess.fn.call(_options, 'randomKey'), '');
        helper.assert(_postProcess.fn.call(_options, 'nullContent'), '');
      });

      it('getHtmlContent - should add content and style element to htmlDatabase', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<strong>This is some content</strong>';
        const _expectedContent = '<text:p><text:span text:style-name="TC00">This is some content</text:span></text:p>';
        const _expectedStyle = '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.content.get(_content), _expectedContent);
        helper.assert(_properties.style, _expectedStyle)
        helper.assert(_properties.styleLists, '')
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), _expectedContent);
      });


      it('should add content and style element to htmlDatabase with HTML entities', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = 'I have to creates bills in euro <i>&euro;</i>, Yen <i>&yen;</i> and Pound <b>&pound;</b>.';
        const _expected =  {
          content : '<text:p><text:span>I have to creates bills in euro </text:span>' +
                    '<text:span text:style-name="TC01">€</text:span>' +
                    '<text:span>, Yen </text:span>' +
                    '<text:span text:style-name="TC03">¥</text:span>' +
                    '<text:span> and Pound </text:span>' +
                    '<text:span text:style-name="TC05">£</text:span>' +
                    '<text:span>.</text:span></text:p>',
          style : '<style:style style:name="TC01" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>' +
                  '<style:style style:name="TC03" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>' +
                  '<style:style style:name="TC05" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>',
          styleLists : ''
        };
        htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.style, _expected.style)
        helper.assert(_properties.styleLists, _expected.styleLists)
      });

      it('getHtmlStyleName - should add multiple styles element to htmlDatabase + get new style name + apply the previous paragraph style', () => {
        const _options = {
          htmlDatabase : new Map(),
          extension : 'odt',
          htmlStylesDatabase: new Map()
        };

        // Prepare the style coming from the template
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += 'fo:font-style="italic" fo:font-weight="bold" fo:color="#ff00ec" style:font-name="American Typewriter" fo:font-size="18pt" fo:background-color="#00ff19" style:font-name-complex="Noto Sans"'
        _htmlDefaultStyleObject.paragraph += 'text:style-name="P3"';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        const _content = '<em><b>This is some content</b></em>';
        const _uniqueID = _content + _styleId;
        const _expected = '<text:p text:style-name="P3"><text:span text:style-name="TC00">This is some content</text:span></text:p>';
        const _style = '<style:style style:name=\"TC00\" style:family=\"text\"><style:text-properties fo:font-style=\"italic\" fo:font-weight=\"bold\" fo:font-style=\"italic\" fo:font-weight=\"bold\" fo:color=\"#ff00ec\" style:font-name=\"American Typewriter\" fo:font-size=\"18pt\" fo:background-color=\"#00ff19\" style:font-name-complex=\"Noto Sans\"/></style:style>';

        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content, _styleId);
        const _properties = _options.htmlDatabase.get(_uniqueID);
        helper.assert(_properties.content.get(_content), _expected);
        helper.assert(_properties.style, _style)
        helper.assert(_properties.styleLists, '')
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), _expected);
      });

      it('getHtmlStyleName + getHtmlContent - should not add the same HTML content twice to htmlDatabase', () => {
        const _options = {
          htmlDatabase : new Map(),
          extension : 'odt',
          htmlStylesDatabase: new Map()
        };


        // Prepare the style coming from the template
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += ''
        _htmlDefaultStyleObject.paragraph += '';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        const _content = '<em><b>This is some content</b></em>';
        htmlFormatters.getHTMLContentOdt.call(_options, _content, _styleId);

        const _properties = _options.htmlDatabase.get(_content + _styleId);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties.content.get(_content), '<text:p><text:span text:style-name="TC00">This is some content</text:span></text:p>');
        helper.assert(_properties.style, '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-style="italic" fo:font-weight="bold"/></style:style>')
        helper.assert(_properties.styleLists, '')
      });

      it('getHtmlContent + hyperlink - should use the default URL_ON_ERROR link if the HTML anchor tag is invalid', () => {
        const _options = {
          htmlDatabase : new Map(),
          extension : 'odt',
          htmlStylesDatabase: new Map()
        };

        // Prepare the style coming from the template
        const _styleId = ''
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += ''
        _htmlDefaultStyleObject.paragraph += '';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        const _content = '<a href="tusklacom">TUSKLA WEBSITE</a>';
        htmlFormatters.getHTMLContentOdt.call(_options, _content, '');
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties.content.get(_content), `<text:p><text:a xlink:type="simple" xlink:href="${hyperlinks.URL_ON_ERROR}"><text:span>TUSKLA WEBSITE</text:span></text:a></text:p>`);
        helper.assert(_properties.style, '')
        helper.assert(_properties.styleLists, '')
      });

      it('getHtmlContent + hyperlink - should call the formatter "defaultURL" and should use the default URL_ON_ERROR link if the HTML anchor tag is invalid', () => {
        const _options = {
          htmlDatabase : new Map(),
          extension : 'odt',
          htmlStylesDatabase: new Map()
        };

        // Prepare the style coming from the template
        const _styleId = ''
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += ''
        _htmlDefaultStyleObject.paragraph += '';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        const _content = '<a href="tusklacom">TUSKLA WEBSITE</a>';
        const _postProcessFormatter = htmlFormatters.getHTMLContentOdt.call(_options, hyperlinksFormatters.defaultURL.call(_options, _content, 'https://carbone.io/link_on_error_test'));
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties.content.get(_content), '<text:p><text:a xlink:type="simple" xlink:href="https://carbone.io/link_on_error_test"><text:span>TUSKLA WEBSITE</text:span></text:a></text:p>');
        helper.assert(_properties.style, '')
        helper.assert(_properties.styleLists, '')
        helper.assert(_postProcessFormatter.fn.apply(_options, _postProcessFormatter.args), '<text:p><text:a xlink:type="simple" xlink:href="https://carbone.io/link_on_error_test"><text:span>TUSKLA WEBSITE</text:span></text:a></text:p>');
      });
    });
  });
  describe('Docx Documents', function () {
    describe('preProcessDocx', function () {
      it('should do nothing is the content does not contain HTML markers', function () {
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:t>Some text 12345</w:t></w:r></w:p><w:sectPr w:rsidR="002B2418" w:rsidRPr="00ED3CF0"><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>';
        const _expectedApp = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>6</TotalTime><Pages>1</Pages><Words>4</Words><Characters>26</Characters><Application>Microsoft Office Word</Application><DocSecurity>0</DocSecurity><Lines>1</Lines><Paragraphs>1</Paragraphs><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Title</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr></vt:lpstr></vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>29</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>';
        const _expectedSettings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <w:webSettings xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex"><w:optimizeForBrowser/><w:allowPNG/></w:webSettings>';
        const _expectedRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _expectedContent
            },
            {
              name : 'docProps/app.xml',
              data : _expectedApp,
            },
            {
              name : 'word/webSettings.xml',
              data : _expectedSettings,
            },
            {
              name : 'word/_rels/document.xml.rels',
              data : _expectedRels,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _expectedContent);
        helper.assert(_template.files[1].data, _expectedApp);
        helper.assert(_template.files[2].data, _expectedSettings);
        helper.assert(_template.files[3].data, _expectedRels);
      });

      it('should find one HTML formatter and inject HTML formatters 1', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<carbone>{d.mix1:getHTMLContentDocx}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should accept convCRLF before :html, and replace it by an internal formatter which replace', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:convCRLF():html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<carbone>{d.mix1:convCRLFH():getHTMLContentDocx}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension          : 'docx',
          htmlStylesDatabase : new Map()
        };
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find one HTML formatter and inject HTML formatters 2', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<w:p>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>lalala</w:t>' +
                '</w:r>' +
              '</w:p>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<w:p>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>lalala</w:t>' +
              '</w:r>' +
            '</w:p>' +
            '<carbone>{d.mix1:getHTMLContentDocx}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find HTML formatters into the footer, header and content', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t xml:space="preserve">{d.strongContent:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _expectedXMLTemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<carbone>{d.strongContent:getHTMLContentDocx}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _XMLfooter = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:ftr>' +
            '<w:p>' +
              '<w:pPr>' +
                '<w:pStyle w:val="Footer"/>' +
                '<w:jc w:val="right"/>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
              '</w:pPr>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>{d.strikedel:html}</w:t>' +
              '</w:r>' +
            '</w:p>' +
          '</w:ftr>';
        const _expectedXMLfooter = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:ftr>' +
            '<carbone>{d.strikedel:getHTMLContentDocx(\'style-textalignright\')}</carbone>' +
          '</w:ftr>';
        const _XMLheader = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:hdr>' +
            '<w:p>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t>{d.italic:html}</w:t>' +
              '</w:r>' +
            '</w:p>' +
          '</w:hdr>';
        const _expectedXMLheader = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:hdr>' +
            '<carbone>{d.italic:getHTMLContentDocx}</carbone>' +
          '</w:hdr>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            },
            {
              name : 'word/footer1.xml',
              data : _XMLfooter
            },
            {
              name : 'word/header1.xml',
              data : _XMLheader
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _expectedXMLTemplate);
        helper.assert(_template.files[1].data, _expectedXMLfooter);
        helper.assert(_template.files[2].data, _expectedXMLheader);
      });

      it('should find one HTML formatter and pass the original font FAMILY as a formatter argument', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<w:p>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cstheme="minorHAnsi"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix2:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<carbone>{d.mix2:getHTMLContentDocx(\'style-ffAmerican Typewriter\')}</carbone>' +
              '<carbone>{d.mix1:getHTMLContentDocx(\'style-ffSegoe Print\')}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find one HTML formatter and pass the applied font SIZE as an argument', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<w:p>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:sz w:val="18"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix2:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:sz w:val="36"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<carbone>{d.mix2:getHTMLContentDocx(\'style-fs18\')}</carbone>' +
              '<carbone>{d.mix1:getHTMLContentDocx(\'style-fs36\')}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find one HTML formatter and pass the applied font SIZE && font FAMILY as arguments', function () {
        const _XMLtemplate = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<w:p>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:sz w:val="18"/>' +
                    '<w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cstheme="minorHAnsi"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix2:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                    '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print"/>' +
                    '<w:sz w:val="36"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.mix1:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
            '<carbone>{d.mix2:getHTMLContentDocx(\'style-ffAmerican Typewriter-fs18\')}</carbone>' +
            '<carbone>{d.mix1:getHTMLContentDocx(\'style-ffSegoe Print-fs36\')}</carbone>' +
            '</w:body>' +
          '</w:document>';
        const _template = {
          files : [
            {
              name : 'word/document.xml',
              data : _XMLtemplate,
            }
          ]
        };
        const _options = {
          extension: 'docx',
          htmlStylesDatabase: new Map()
        }
        html.preProcessDocx(_template, _options);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

    });

    describe('buildXmlContentDOCX', function () {
      it('should return nothing if the descriptor is empty/undefined/null', function () {
        let _res1 = html.buildXmlContentDOCX([]);
        helper.assert(_res1.listStyleAbstract, '');
        helper.assert(_res1.listStyleNum, '');
        helper.assert(_res1.content.get(), '');
        let _res2 = html.buildXmlContentDOCX();
        helper.assert(_res2.listStyleAbstract, '');
        helper.assert(_res2.listStyleNum, '');
        helper.assert(_res2.content.get(), '');
        let _res3 = html.buildXmlContentDOCX(undefined);
        helper.assert(_res3.listStyleAbstract, '');
        helper.assert(_res3.listStyleNum, '');
        helper.assert(_res3.content.get(), '');
        let _res4 = html.buildXmlContentDOCX(null);
        helper.assert(_res4.listStyleAbstract, '');
        helper.assert(_res4.listStyleNum, '');
        helper.assert(_res4.content.get(), '');
      });


      it('should return nothing if the descriptor has only 1 element', function () {
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX([{ content : 'text', type : '', tags : ['b'] }]);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>' +
            '<w:rPr>' +
              '<w:b/><w:bCs/>' +
            '</w:rPr>' +
            '<w:t xml:space="preserve">text</w:t>' +
          '</w:r>'+
        '</w:p>');
      });

      it('should convert HTML to DOCX xml 1', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p>');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] }
        // ]
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>'
        );
      });

      it('should convert HTML to DOCX xml 2', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p><i>John</i>');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        //   { content: 'John', tags: ['i'] }
        // ]
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
        '</w:p>'
        );
      });

      it('should convert HTML to DOCX xml 2 WITHOUT DEFAULT STYLE ON THE TEMPLATE', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p><i>John</i>');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        //   { content: 'John', tags: ['i'] }
        // ]

        /** Init template style, it is executed during the preprocessing */
        const htmlDefaultStyleDatabase = new Map();
        const _styleId = 'styleId'
        htmlDefaultStyleDatabase.set(_styleId, html.templateDefaultStyles)

        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, { htmlStylesDatabase: htmlDefaultStyleDatabase }, _styleId); // FONT AS A LAST ARGUMENT

        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>' +
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
        '</w:p>'
        );
      });


      it('should convert HTML to DOCX xml 2 WITH A ONLY A FONT SIZE and FONT FAMILY', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p><i>John</i>');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        //   { content: 'John', tags: ['i'] }
        // ]

        /** Init template style, it is executed during the preprocessing */
        const htmlDefaultStyleDatabase = new Map();
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/>'
        _htmlDefaultStyleObject.text += '<w:sz w:val="18"/>';
        htmlDefaultStyleDatabase.set(_styleId, _htmlDefaultStyleObject)

        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, { htmlStylesDatabase: htmlDefaultStyleDatabase }, _styleId); // FONT AS A LAST ARGUMENT
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/><w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/><w:sz w:val="18"/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr><w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/><w:sz w:val="18"/></w:rPr>' +
            '<w:t xml:space="preserve"> thit is some text</w:t>' +
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/><w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/><w:sz w:val="18"/></w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
        '</w:p>'
        );
      });

      it('should convert HTML to DOCX xml 2 WITH A DEFAULT FONT SIZE, FONT FAMILY, RTL text, centered text, and colors', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p><i>John</i>');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        //   { content: 'John', tags: ['i'] }
        // ]

        /** Init template style, it is executed during the preprocessing */
        const htmlDefaultStyleDatabase = new Map();
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/>'
        _htmlDefaultStyleObject.text += '<w:sz w:val="18"/>';
        _htmlDefaultStyleObject.text += '<w:color w:val="FF0000"/>'
        _htmlDefaultStyleObject.text += '<w:highlight w:val="yellow"/>'
        _htmlDefaultStyleObject.paragraph = '<w:bidi/><w:jc w:val="center"/>'
        htmlDefaultStyleDatabase.set(_styleId, _htmlDefaultStyleObject)

        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, { htmlStylesDatabase: htmlDefaultStyleDatabase }, _styleId); // FONT AS A LAST ARGUMENT
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:pPr>'+
            '<w:bidi/><w:jc w:val="center"/>'+
          '</w:pPr>'+
          '<w:r>'+
            '<w:rPr>'+
              '<w:b/><w:bCs/>' +
              '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/>' +
              '<w:sz w:val="18"/>' +
              '<w:color w:val="FF0000"/>' +
              '<w:highlight w:val="yellow"/>' +
            '</w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr>'+
              '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/>' +
              '<w:sz w:val="18"/>' +
              '<w:color w:val="FF0000"/>' +
              '<w:highlight w:val="yellow"/>' +
            '</w:rPr>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>' +
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:pPr>'+
            '<w:bidi/><w:jc w:val="center"/>'+
          '</w:pPr>'+
          '<w:r>'+
            '<w:rPr>'+
              '<w:i/><w:iCs/>' +
              '<w:rFonts w:ascii="Segoe Print" w:hAnsi="Segoe Print" w:cs="Segoe Print" w:eastAsia="Segoe Print"/>' +
              '<w:sz w:val="18"/>' +
              '<w:color w:val="FF0000"/>' +
              '<w:highlight w:val="yellow"/>' +
            '</w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
        '</w:p>'
        );
      });

      it('should convert HTML to DOCX xml 3', function () {
        let _descriptor = html.parseHTML('<p><strong>Hello</strong> thit is some text</p><i>John</i> green blue red');
        // _descriptor = [
        //   { content: '#PB#', tags: [] },
        //   { content: 'Hello', tags: ['strong'] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        //   { content: 'John', tags: ['i'] },
        //   { content: ' green blue red', tags: [ ] },
        // ]
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> green blue red</w:t>'+
          '</w:r>'+
        '</w:p>'
        );
      });

      it('should convert HTML to DOCX xml 4', function () {
        let _descriptor = html.parseHTML('<i>John</i><p><strong>Hello</strong> thit is some text</p>');
        // _descriptor = [
        //   { content: 'John', tags: [ 'i' ] },
        //   { content: '#PB#', tags: [ ] },
        //   { content: 'Hello', tags: [ 'strong' ] },
        //   { content: ' thit is some text', tags: [] },
        //   { content: '#PE#', tags: [ ] },
        // ]
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">John</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> thit is some text</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>'
        );
      });

      it('should convert HTML to DOCX xml 5', function () {
        let _descriptor = html.parseHTML('<p>Professional Accreditation</p><p><strong>La Trobes Bachelor of Biomedicine</strong></p>');
        // _descriptor = [
        //   {
        //     content: '#PB#',
        //     tags: [ ]
        //   },
        //   {
        //     content: 'Professional Accreditation',
        //     tags: [ ]
        //   },
        //   {
        //     content: '#PE#',
        //     tags: [ ]
        //   },
        //   {
        //     content: '#PB#',
        //     tags: [ ]
        //   },
        //   {
        //     content: 'La Trobes Bachelor of Biomedicine',
        //     tags: [ 'strong' ]
        //   },
        //   {
        //     content: '#PE#',
        //     tags: [ ]
        //   },
        // ]
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:t xml:space="preserve">Professional Accreditation</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">La Trobes Bachelor of Biomedicine</w:t>'+
          '</w:r>' +
        '</w:p>' +
        '<w:p/>'
        );
      });

      it('should convert HTML to DOCX xml 5', function () {
        let _descriptor = html.parseHTML('<p><strong><p>Professional Accreditation</p></strong></p><p><em>La <p>Trobes</p></em></p>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Professional Accreditation</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p/>' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">La </w:t>'+
          '</w:r>' +
        '</w:p><w:p/>' +
        '<w:p>' +
          '<w:r>'+
            '<w:rPr><w:i/><w:iCs/></w:rPr>'+
            '<w:t xml:space="preserve">Trobes</w:t>'+
          '</w:r>' +
        '</w:p>' +
        '<w:p/>'
        );
      });

      it('should convert HTML to DOCX xml 6 string followed by a list', function () {
        let _descriptor = html.parseHTML('You’ll learn<ul><li>Understand</li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '' +
          '<w:p>'+
            '<w:r>'+
              '<w:t xml:space="preserve">You’ll learn</w:t>'+
            '</w:r>'+
          '</w:p>' +
          '<w:p>'+
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>'+
              '<w:t xml:space="preserve">Understand</w:t>'+
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should convert HTML to DOCX xml 7: simple unordered list', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Milk</w:t></w:r></w:p><w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
        '<w:abstractNum w:abstractNumId="1000">' +
          '<w:multiLevelType w:val="hybridMultilevel"/>' +
          '<w:lvl w:ilvl="0">' +
            '<w:start w:val="1"/>' +
            '<w:numFmt w:val="bullet"/>' +
            '<w:lvlText w:val=""/>' +
            '<w:lvlJc w:val="left"/>' +
            '<w:pPr>' +
              '<w:ind w:left="720" w:hanging="360"/>' +
            '</w:pPr>' +
            '<w:rPr>' +
              '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
            '</w:rPr>' +
          '</w:lvl>' +
        '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should render an unordered list with font size', function () {
        const _descriptor = html.parseHTML('<ol><li><i>Coffee</i></li><li><i>Tea</i></li></ol>');

        const _options = {
          htmlStylesDatabase: new Map()
        }
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += '<w:sz w:val="18"/>';
        _options.htmlStylesDatabase.set(_styleId, _htmlDefaultStyleObject)

        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options, _styleId);
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>'+
              '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr>'+
              '<w:rPr>' +
                /** Inject the text size inside the list property */
                '<w:sz w:val="18"/>' +
              '</w:rPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
                '<w:sz w:val="18"/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">Coffee</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p>' +
            '<w:pPr>'+
              '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr>'+
              '<w:rPr>' +
                /** Inject the text size inside the list property */
                '<w:sz w:val="18"/>' +
              '</w:rPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
                '<w:sz w:val="18"/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">Tea</w:t>' +
            '</w:r>' +
          '</w:p><w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
        '<w:abstractNum w:abstractNumId="1000">' +
          '<w:multiLevelType w:val="hybridMultilevel"/>' +
          '<w:lvl w:ilvl="0">' +
            '<w:start w:val="1"/>' +
            '<w:numFmt w:val="decimal\"/>' +
            '<w:lvlText w:val="%1."/>' +
            '<w:lvlJc w:val="left"/>' +
            '<w:pPr>' +
              '<w:ind w:left="720" w:hanging="360"/>' +
            '</w:pPr>' +
          '</w:lvl>' +
        '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
          '<w:num w:numId="1000">' +
            '<w:abstractNumId w:val="1000"/>' +
          '</w:num>');
      });


      it('should convert HTML to DOCX xml 7: simple unordered list WITH A FONT AND RTL', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul>');

        // set style
        const htmlDefaultStyleDatabase = new Map();
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        const _styleId = 'styleID'
        _htmlDefaultStyleObject.paragraph = '<w:bidi/>'
        _htmlDefaultStyleObject.text += '<w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/>'
        htmlDefaultStyleDatabase.set(_styleId, _htmlDefaultStyleObject)

        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, { htmlStylesDatabase: htmlDefaultStyleDatabase }, _styleId);
        helper.assert(content.get(), '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr><w:bidi/><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr><w:t xml:space="preserve">Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr><w:bidi/><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr><w:t xml:space="preserve">Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr><w:bidi/><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr><w:t xml:space="preserve">Milk</w:t></w:r></w:p><w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
        '<w:abstractNum w:abstractNumId="1000">' +
          '<w:multiLevelType w:val="hybridMultilevel"/>' +
          '<w:lvl w:ilvl="0">' +
            '<w:start w:val="1"/>' +
            '<w:numFmt w:val="bullet"/>' +
            '<w:lvlText w:val=""/>' +
            '<w:lvlJc w:val="left"/>' +
            '<w:pPr>' +
              '<w:ind w:left="720" w:hanging="360"/>' +
            '</w:pPr>' +
            '<w:rPr>' +
              '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
            '</w:rPr>' +
          '</w:lvl>' +
        '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should convert HTML to DOCX xml 8: NESTED LIST 1 level', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea<ul><li>Black tea</li><li>Green tea</li></ul></li><li>Milk</li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Black tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Green tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Milk</w:t></w:r></w:p><w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
        '<w:abstractNum w:abstractNumId="1000">' +
          '<w:multiLevelType w:val="hybridMultilevel"/>' +
          '<w:lvl w:ilvl="0">' +
            '<w:start w:val="1"/>' +
            '<w:numFmt w:val="bullet"/>' +
            '<w:lvlText w:val=""/>' +
            '<w:lvlJc w:val="left"/>' +
            '<w:pPr>' +
              '<w:ind w:left="720" w:hanging="360"/>' +
            '</w:pPr>' +
            '<w:rPr>' +
              '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
            '</w:rPr>' +
          '</w:lvl>' +
          '<w:lvl w:ilvl="1">' +
            '<w:start w:val="1"/>' +
            '<w:numFmt w:val="bullet"/>' +
            '<w:lvlText w:val="o"/>' +
            '<w:lvlJc w:val="left"/>' +
            '<w:pPr>' +
              '<w:ind w:left="1440" w:hanging="360"/>' +
            '</w:pPr>' +
            '<w:rPr>' +
              '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>' +
            '</w:rPr>' +
          '</w:lvl>' +
        '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should convert HTML to DOCX xml 8: NESTED LIST 1 level but without text in the "li" attribute', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><ul><li>Black tea</li><li>Green tea</li></ul><li>Milk</li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '' +
                    '<w:p>'+
                      '<w:pPr>'+
                        '<w:numPr>'+
                          '<w:ilvl w:val="0"/>'+
                          '<w:numId w:val="1000"/>'+
                        '</w:numPr>'+
                      '</w:pPr>'+
                      '<w:r>'+
                        '<w:t xml:space="preserve">Coffee</w:t>'+
                      '</w:r>'+
                    '</w:p>'+
                    '<w:p>'+
                      '<w:pPr>'+
                        '<w:numPr>'+
                          '<w:ilvl w:val="1"/>'+
                          '<w:numId w:val="1000"/>'+
                        '</w:numPr>'+
                      '</w:pPr>'+
                      '<w:r>'+
                        '<w:t xml:space="preserve">Black tea</w:t>'+
                      '</w:r>'+
                    '</w:p>'+
                    '<w:p>'+
                      '<w:pPr>'+
                        '<w:numPr>'+
                          '<w:ilvl w:val="1"/>'+
                          '<w:numId w:val="1000"/>'+
                        '</w:numPr>'+
                      '</w:pPr>'+
                      '<w:r>'+
                        '<w:t xml:space="preserve">Green tea</w:t>'+
                      '</w:r>'+
                    '</w:p>'+
                    '<w:p>'+
                      '<w:pPr>'+
                        '<w:numPr>'+
                          '<w:ilvl w:val="0"/>'+
                          '<w:numId w:val="1000"/>'+
                        '</w:numPr>'+
                      '</w:pPr>'+
                      '<w:r>'+
                        '<w:t xml:space="preserve">Milk</w:t>'+
                      '</w:r>'+
                    '</w:p>'+
                    '<w:p/>'

        );

        helper.assert(listStyleAbstract, '' +
            '<w:abstractNum w:abstractNumId="1000">' +
              '<w:multiLevelType w:val="hybridMultilevel"/>' +
              '<w:lvl w:ilvl="0">' +
                '<w:start w:val="1"/>' +
                '<w:numFmt w:val="bullet"/>' +
                '<w:lvlText w:val=""/>' +
                '<w:lvlJc w:val="left"/>' +
                '<w:pPr>' +
                  '<w:ind w:left="720" w:hanging="360"/>' +
                '</w:pPr>' +
                '<w:rPr>' +
                  '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
                '</w:rPr>' +
              '</w:lvl>' +
              '<w:lvl w:ilvl="1">' +
                '<w:start w:val="1"/>' +
                '<w:numFmt w:val="bullet"/>' +
                '<w:lvlText w:val="o"/>' +
                '<w:lvlJc w:val="left"/>' +
                '<w:pPr>' +
                  '<w:ind w:left="1440" w:hanging="360"/>' +
                '</w:pPr>' +
                '<w:rPr>' +
                  '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>' +
                '</w:rPr>' +
              '</w:lvl>' +
            '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should convert HTML to DOCX xml 9: NESTED LIST 3 level', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea<ul><li>Black tea</li><li>Green tea<ul><li>Dark Green</li><ul><li>Soft Green</li><li>light Green</li></ul></ul></li></ul></li><li>Milk</li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Black tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Green tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="2"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Dark Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="3"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Soft Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="3"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">light Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">Milk</w:t></w:r></w:p><w:p/>'
        );

        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
            '<w:lvl w:ilvl="1">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val="o"/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="1440" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
            '<w:lvl w:ilvl="2">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="2160" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
            '<w:lvl w:ilvl="3">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="2880" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should generate a simple ordered list', function () {
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ol><li>Coffee</li><li>Tea</li><li>Milk</li></ol>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Coffee</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Tea</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Milk</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );

        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="decimal"/>' +
              '<w:lvlText w:val="%1."/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
        '<w:num w:numId="1000">' +
          '<w:abstractNumId w:val="1000"/>' +
        '</w:num>');
      });

      it('should generate 3 different list and should generate the corresponding list style for numbering.xml', function () {
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ol><li>Coffee</li></ol><ul><li>Tea</li></ul><ol><li>Milk</li></ol>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Coffee</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1001"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Tea</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1002"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Milk</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );

        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="decimal"/>' +
              '<w:lvlText w:val="%1."/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
            '</w:lvl>' +
          '</w:abstractNum>' +
          '<w:abstractNum w:abstractNumId="1001">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
          '</w:abstractNum>' +
          '<w:abstractNum w:abstractNumId="1002">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="decimal"/>' +
              '<w:lvlText w:val="%1."/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );

        helper.assert(listStyleNum, '' +
          '<w:num w:numId="1000">' +
            '<w:abstractNumId w:val="1000"/>' +
          '</w:num>' +
          '<w:num w:numId="1001">' +
            '<w:abstractNumId w:val="1001"/>' +
          '</w:num>' +
          '<w:num w:numId="1002">' +
            '<w:abstractNumId w:val="1002"/>' +
          '</w:num>'
        );
      });

      it('should create nested list at the same level and should not create extra style of the list', function () {
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ol><li>Hello<ul><li>Tea</li></ul></li><li>Hello2<ul><li>Tea</li></ul></li></ol>'));
        helper.assert(content.get(), '' +
        '<w:p>' +
          '<w:pPr>' +
            '<w:numPr>' +
              '<w:ilvl w:val="0"/>' +
              '<w:numId w:val="1000"/>' +
            '</w:numPr>' +
          '</w:pPr>' +
          '<w:r>' +
            '<w:t xml:space="preserve">Hello</w:t>' +
          '</w:r>' +
        '</w:p>' +
        '<w:p>' +
          '<w:pPr>' +
            '<w:numPr>' +
              '<w:ilvl w:val="1"/>' +
              '<w:numId w:val="1000"/>' +
            '</w:numPr>' +
          '</w:pPr>' +
          '<w:r>' +
            '<w:t xml:space="preserve">Tea</w:t>' +
          '</w:r>' +
        '</w:p>' +
        '<w:p>' +
          '<w:pPr>' +
            '<w:numPr>' +
              '<w:ilvl w:val="0"/>' +
              '<w:numId w:val="1000"/>' +
            '</w:numPr>' +
          '</w:pPr>' +
          '<w:r>' +
            '<w:t xml:space="preserve">Hello2</w:t>' +
          '</w:r>' +
        '</w:p>' +
        '<w:p>' +
          '<w:pPr>' +
            '<w:numPr>' +
              '<w:ilvl w:val="1"/>' +
              '<w:numId w:val="1000"/>' +
            '</w:numPr>' +
          '</w:pPr>' +
          '<w:r>' +
            '<w:t xml:space="preserve">Tea</w:t>' +
          '</w:r>' +
        '</w:p>' +
        '<w:p/>'
        );

        helper.assert(listStyleAbstract, '' +
        '<w:abstractNum w:abstractNumId="1000">'+
          '<w:multiLevelType w:val="hybridMultilevel"/>'+
          '<w:lvl w:ilvl="0">'+
            '<w:start w:val="1"/>'+
            '<w:numFmt w:val="decimal"/>'+
            '<w:lvlText w:val="%1."/>'+
            '<w:lvlJc w:val="left"/>'+
            '<w:pPr>'+
              '<w:ind w:left="720" w:hanging="360"/>'+
            '</w:pPr>'+
          '</w:lvl>'+
          '<w:lvl w:ilvl="1">'+
            '<w:start w:val="1"/>'+
            '<w:numFmt w:val="bullet"/>'+
            '<w:lvlText w:val="o"/>'+
            '<w:lvlJc w:val="left"/>'+
            '<w:pPr>'+
              '<w:ind w:left="1440" w:hanging="360"/>'+
            '</w:pPr>'+
            '<w:rPr>'+
              '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>'+
            '</w:rPr>'+
          '</w:lvl>'+
        '</w:abstractNum>');
        helper.assert(listStyleNum, '<w:num w:numId="1000"><w:abstractNumId w:val="1000"/></w:num>');
      });

      it('should create nested list without text on the first element', function () {
        // eslint-disable-next-line no-unused-vars
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ol><li><ol><li>Tea</li></ol></li></ol>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
          '</w:p>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="1"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Tea</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );
      });

      it('should create nested list with text on the first element and a break line', function () {
        // eslint-disable-next-line no-unused-vars
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ol><li>This is some content<br/><ol><li>Tea</li></ol></li></ol>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">This is some content</w:t>' +
            '</w:r>' +
            '<w:r><w:br/></w:r>' +
          '</w:p>' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="1"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">Tea</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );
      });



      it('should create nested list with text on the first element and a break line', function () {
        // eslint-disable-next-line no-unused-vars
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<ul><li><p>The introduction</p></li></ul>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            '<w:r>' +
              '<w:t xml:space="preserve">The introduction</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );
      });

      it('should a list with on hyperlink', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        let htmlContent = '<ul>' +
          '<li>Banana</li>' +
          '<li>' +
            '<a href="carbone.io/test_website">' +
              'Carbone Website' +
            '</a>' +
          '</li>' +
        '</ul>';
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML(htmlContent), _options);
        helper.assert(content.get(), '' +
          '<w:p>'+
            '<w:pPr>'+
              '<w:numPr>'+
                '<w:ilvl w:val="0"/>'+
                '<w:numId w:val="1000"/>'+
              '</w:numPr>'+
            '</w:pPr>'+
            '<w:r>'+
              '<w:t xml:space="preserve">Banana</w:t>'+
            '</w:r>'+
          '</w:p>'+
          '<w:p>'+
            '<w:pPr>'+
              '<w:numPr>'+
                '<w:ilvl w:val="0"/>'+
                '<w:numId w:val="1000"/>'+
              '</w:numPr>'+
            '</w:pPr>'+
            '<w:hyperlink r:id="CarboneHyperlinkId0">'+
              '<w:r>'+
                '<w:rPr>'+
                  '<w:rStyle w:val="Hyperlink"/>'+
                '</w:rPr>'+
                '<w:t xml:space="preserve">Carbone Website</w:t>'+
              '</w:r>'+
            '</w:hyperlink>'+
          '</w:p>'+
        '<w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
          '<w:num w:numId="1000">' +
            '<w:abstractNumId w:val="1000"/>' +
          '</w:num>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io/test_website');
        helper.assert(_it.next().value, undefined);
      });


      it('should convert HTML to DOCX xml with list, hyperlinks and styles', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        let htmlContent = '<ul>' +
          '<li>Banana</li>' +
          '<li>' +
            '<u>This is an underline text</u>' +
            '<br/>' +
            'with <i>some</i> content' +
            '<a href="carbone.io/test_website?name=john&lastname=wick">' +
              'and a <u>link</u>' +
            '</a>' +
          '</li>' +
        '</ul>';
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML(htmlContent), _options);
        helper.assert(content.get(), '' +
        '<w:p>'+
          '<w:pPr>'+
            '<w:numPr>'+
              '<w:ilvl w:val="0"/>'+
              '<w:numId w:val="1000"/>'+
            '</w:numPr>'+
          '</w:pPr>'+
          '<w:r>'+
            '<w:t xml:space="preserve">Banana</w:t>'+
          '</w:r>'+
        '</w:p>'+
        '<w:p>'+
          '<w:pPr>'+
            '<w:numPr>'+
              '<w:ilvl w:val="0"/>'+
              '<w:numId w:val="1000"/>'+
            '</w:numPr>'+
          '</w:pPr>'+
          '<w:r>'+
            '<w:rPr>'+
              '<w:u w:val="single"/>'+
            '</w:rPr>'+
            '<w:t xml:space="preserve">This is an underline text</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:br/>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve">with </w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr>'+
              '<w:i/>'+
              '<w:iCs/>'+
            '</w:rPr>'+
            '<w:t xml:space="preserve">some</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:t xml:space="preserve"> content</w:t>'+
          '</w:r>'+
          '<w:hyperlink r:id="CarboneHyperlinkId0">'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:rStyle w:val="Hyperlink"/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">and a </w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:u w:val="single"/>'+
                '<w:rStyle w:val="Hyperlink"/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">link</w:t>'+
            '</w:r>'+
          '</w:hyperlink>'+
        '</w:p>'+
        '<w:p/>'
        );
        helper.assert(listStyleAbstract, '' +
          '<w:abstractNum w:abstractNumId="1000">' +
            '<w:multiLevelType w:val="hybridMultilevel"/>' +
            '<w:lvl w:ilvl="0">' +
              '<w:start w:val="1"/>' +
              '<w:numFmt w:val="bullet"/>' +
              '<w:lvlText w:val=""/>' +
              '<w:lvlJc w:val="left"/>' +
              '<w:pPr>' +
                '<w:ind w:left="720" w:hanging="360"/>' +
              '</w:pPr>' +
              '<w:rPr>' +
                '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>' +
              '</w:rPr>' +
            '</w:lvl>' +
          '</w:abstractNum>'
        );
        helper.assert(listStyleNum, '' +
          '<w:num w:numId="1000">' +
            '<w:abstractNumId w:val="1000"/>' +
          '</w:num>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io/test_website?name=john&amp;lastname=wick');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML to DOCX xml 11', function () {
        const _descriptor = html.parseHTML('You will learn<br />');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '<w:p><w:r><w:t xml:space="preserve">You will learn</w:t></w:r><w:r><w:br/></w:r></w:p>');
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
      });

      it('should convert HTML to DOCX by adding an new line after the final paragraph', function () {
        const _descriptor = html.parseHTML('<p>content');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '<w:p><w:r><w:t xml:space="preserve">content</w:t></w:r></w:p><w:p/>');
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
      });

      it('should skipping empty paragraphs', function () {
        const _descriptor = html.parseHTML('<p><p>   <p>content');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(content.get(), '<w:p><w:r><w:t xml:space="preserve">content</w:t></w:r></w:p><w:p/>');
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
      });

      it('should skip paragraphs before a list (the paragraph added is coming from the list)', function () {
        let res = html.buildXmlContentDOCX(html.parseHTML('<p><p>   <ol><li>content</li></ol>'));
        helper.assert(res.content.get(), '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">content</w:t></w:r></w:p><w:p/>');

        res = html.buildXmlContentDOCX(html.parseHTML('<p><p>   <ul><li>content</li></ul>'));
        helper.assert(res.content.get(), '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1000"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">content</w:t></w:r></w:p><w:p/>');
      });

      it('should skip comments tags', function () {
        // eslint-disable-next-line no-unused-vars
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<p>This is a<!-- Start comment <w:LidThemeOther>DE</w:LidThemeOther> end comment --> paragraph</p>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:r>' +
              '<w:t xml:space="preserve">This is a</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve"> paragraph</w:t>'+
            '</w:r>'+
          '</w:p>' +
          '<w:p/>'
        );
      });

      it('should skip comments tags even if the end comment tag is missing', function () {
        // eslint-disable-next-line no-unused-vars
        let { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(html.parseHTML('<p>This is a<!-- Start comment <w:LidThemeOther>DE</w:LidThemeOther> end comment paragraph</p>'));
        helper.assert(content.get(), '' +
          '<w:p>' +
            '<w:r>' +
              '<w:t xml:space="preserve">This is a</w:t>' +
            '</w:r>' +
          '</w:p>' +
          '<w:p/>'
        );
      });

      it('should convert HTML to DOCX xml 12 hyperlink simple', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io">Carbone Website</a>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId0">' +
           '<w:r>' +
             '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone Website</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML to DOCX xml 12.5 hyperlink simple with a paragraph inside', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io"><p>Carbone Website</p></a>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId0">' +
           '<w:r>' +
             '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone Website</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML to DOCX xml 12 hyperlink simple with a break line', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io">Carbone<br>Website</a>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId0">' +
           '<w:r>' +
              '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:br/>' +
            '</w:r>' +
            '<w:r>' +
              '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Website</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML to DOCX xml 13 hyperlink multiple', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io">Carbone Website</a><p><a href="carbone.io/documentation.html">Carbone Documentation</a></p><a href="carbone.io">Carbone Site Again</a>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId0">' +
           '<w:r>' +
             '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone Website</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId1">' +
           '<w:r>' +
             '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone Documentation</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>' +
        '<w:p/>' +
        '<w:p>' +
          '<w:hyperlink r:id="CarboneHyperlinkId0">' +
           '<w:r>' +
             '<w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>' +
              '<w:t xml:space="preserve">Carbone Site Again</w:t>' +
            '</w:r>' +
          '</w:hyperlink>' +
        '</w:p>'
        );
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io');
        helper.assert(_it.next().value, 'https://carbone.io/documentation.html');
        helper.assert(_it.next().value, undefined);
      });

      it('should return the DOCX xml content based on the descriptor', function () {
        let _descriptor = [
          { content : 'bold', type : '', tags : ['b'] },
          { content : 'and italic', type : '', tags : ['em'] }
        ];
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(),
          '<w:p>'+
            '<w:r>' +
              '<w:rPr>' +
                '<w:b/><w:bCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">bold</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">and italic</w:t>' +
            '</w:r>'+
          '</w:p>'
        );
      });

      it('should return the DOCX xml content based on the descriptor 2', function () {
        let _descriptor = [
          { content : 'this', type : '', tags : [] },
          { content : ' is a bold', type : '', tags : ['b'] },
          { content : 'and italic', type : '', tags : ['em'] },
          { content : ' text', type : '', tags : [] },
        ];
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '<w:p>'+
            '<w:r>' +
              '<w:t xml:space="preserve">this</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:b/><w:bCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve"> is a bold</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">and italic</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve"> text</w:t>' +
            '</w:r>' +
          '</w:p>'
        );
      });

      it('should return the DOCX XML content based on a descriptor and should skip unknown tags', function () {
        let _descriptor = [
          { content : 'this ', type : '', tags : ['div', 'b'] },
          { content : ' is a bold', type : '', tags : ['div', 'b', 'u'] },
          { content : '', type : '#PB#', tags : [] },
          { content : ' text ', type : '', tags : ['div', 'b', 'u', 'em'] },
          { content : 'and ', type : '', tags : ['div', 'b', 'em'] },
          { content : 'italic ', type : '', tags : ['div', 'b', 'em', 's'] },
          { content : '', type : '#PE#', tags : [] },
          { content : 'text', type : '', tags : ['div', 'b', 's'] },
          { content : '.', type : '', tags : [] },
        ];
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(),
          '<w:p>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">this </w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/>'+
                '<w:u w:val="single"/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve"> is a bold</w:t>'+
            '</w:r>'+
          '</w:p>'  +
          '<w:p>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/>'+
                '<w:u w:val="single"/>'+
                '<w:i/><w:iCs/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve"> text </w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/><w:i/><w:iCs/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">and </w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/><w:i/><w:iCs/><w:strike/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">italic </w:t>'+
            '</w:r>'+
          '</w:p>' +
          '<w:p/>' +
          '<w:p>'+
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/><w:strike/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">text</w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:t xml:space="preserve">.</w:t>'+
            '</w:r>' +
          '</w:p>'
        );
      });

      it('should insert break line in the new content', function () {
        let _descriptor = [
          { content : 'This is ', type : '', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : 'a tree', type : '', tags : ['i'] },
        ];
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(), '<w:p>'+
              '<w:r>' +
                '<w:t xml:space="preserve">This is </w:t>' +
              '</w:r>' +
              '<w:r>' +
                '<w:br/>' +
              '</w:r>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:i/><w:iCs/>' +
                '</w:rPr>' +
                '<w:t xml:space="preserve">a tree</w:t>' +
              '</w:r>' +
            '</w:p>'
        );
      });

      it('should insert break line in the new content 2', function () {
        let _descriptor = [
          { content : '', type : '#PB#', tags : [] },
          { content : 'This ', type : '', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : ' is', type : '', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : 'a', type : '', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : 'simple', type : '', tags : [] },
          { content : '', type : '#PE#', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : ' text', type : '', tags : [] },
          { content : '', type : '#break#', tags : [] },
          { content : '.', type : '', tags : [] }
        ];
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(),
          '<w:p>'+
            '<w:r>' +
              '<w:t xml:space="preserve">This </w:t>' +
            '</w:r>' +
            '<w:r>' +
            '<w:br/>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve"> is</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:br/>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve">a</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:br/>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve">simple</w:t>' +
            '</w:r>' +
          '</w:p>'+
          '<w:p/>' +
          '<w:p/>' +
          '<w:p/>' +
          '<w:p>'+
            '<w:r>' +
              '<w:t xml:space="preserve"> text</w:t>' +
            '</w:r>' +
            '<w:r>' +
              '<w:br/>' +
            '</w:r>' +
            '<w:r>' +
              '<w:t xml:space="preserve">.</w:t>' +
            '</w:r>' +
          '</w:p>'
        );

      });

      it('should convert HTML with images and parapgraphs (width height are transformed into EMU)', function () {
        const _options = {
          imageDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<img src="https://carbone.io/cat" width="300" height="50" alt="cat">');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        // update image aspect ratio. Simulate calls which are done before the final postprocess
        image._computeImageSize(_options.imageDatabase.get('https://carbone.io/cat'));
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(_options), '' +
          '<w:p>' +
            '<w:r><w:drawing>' +
              '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
                '<wp:extent cx="2857500" cy="476250"/>' +
                '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                '<wp:docPr id="1000" name="" descr=""></wp:docPr>' +
                '<wp:cNvGraphicFramePr>' +
                  '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                '</wp:cNvGraphicFramePr>' +
                '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                  '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                      '<pic:nvPicPr>' +
                        '<pic:cNvPr id="1000" name="" descr=""></pic:cNvPr>' +
                        '<pic:cNvPicPr>' +
                          '<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>' +
                        '</pic:cNvPicPr>' +
                      '</pic:nvPicPr>' +
                      '<pic:blipFill>' +
                        '<a:blip r:embed="rIdCarbone0"></a:blip>' +
                        '<a:stretch>' +
                          '<a:fillRect/>' +
                        '</a:stretch>' +
                      '</pic:blipFill>' +
                      '<pic:spPr bwMode="auto">' +
                        '<a:xfrm>' +
                          '<a:off x="0" y="0"/>' +
                          '<a:ext cx="2857500" cy="476250"/>' +
                        '</a:xfrm>' +
                        '<a:prstGeom prst="rect">' +
                          '<a:avLst/>' +
                        '</a:prstGeom>' +
                      '</pic:spPr>' +
                    '</pic:pic>' +
                  '</a:graphicData>' +
                '</a:graphic>' +
              '</wp:inline>' +
            '</w:drawing></w:r>' +
          '</w:p>'
        );
        const _it = _options.imageDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io/cat');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML with images and parapgraphs (width height are transformed into EMU)', function () {
        const _options = {
          imageDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<p>Before picture<p><img src="https://carbone.io/cat" width="300" height="50" alt="cat"></p><b>After picture</b></p>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        // update image aspect ratio. Simulate calls which are done before the final postprocess
        image._computeImageSize(_options.imageDatabase.get('https://carbone.io/cat'));
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(_options), '' +
          '<w:p><w:r><w:t xml:space=\"preserve\">Before picture</w:t></w:r></w:p><w:p/>' +
          '<w:p><w:r>' +
            '<w:drawing>' +
              '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
                '<wp:extent cx="2857500" cy="476250"/>' +
                '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                '<wp:docPr id="1000" name="" descr=""></wp:docPr>' +
                '<wp:cNvGraphicFramePr>' +
                  '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                '</wp:cNvGraphicFramePr>' +
                '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                  '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                      '<pic:nvPicPr>' +
                        '<pic:cNvPr id="1000" name="" descr=""></pic:cNvPr>' +
                        '<pic:cNvPicPr>' +
                          '<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>' +
                        '</pic:cNvPicPr>' +
                      '</pic:nvPicPr>' +
                      '<pic:blipFill>' +
                        '<a:blip r:embed="rIdCarbone0"></a:blip>' +
                        '<a:stretch>' +
                          '<a:fillRect/>' +
                        '</a:stretch>' +
                      '</pic:blipFill>' +
                      '<pic:spPr bwMode="auto">' +
                        '<a:xfrm>' +
                          '<a:off x="0" y="0"/>' +
                          '<a:ext cx="2857500" cy="476250"/>' +
                        '</a:xfrm>' +
                        '<a:prstGeom prst="rect">' +
                          '<a:avLst/>' +
                        '</a:prstGeom>' +
                      '</pic:spPr>' +
                    '</pic:pic>' +
                  '</a:graphicData>' +
                '</a:graphic>' +
              '</wp:inline>' +
            '</w:drawing></w:r>' +
          '</w:p><w:p/>' +
          '<w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space=\"preserve\">After picture</w:t></w:r></w:p>'
        );
        const _it = _options.imageDatabase.keys();
        helper.assert(_it.next().value, 'https://carbone.io/cat');
        helper.assert(_it.next().value, undefined);
      });

      it('should convert HTML with images to DOCX with an hyperlink (anchor)', function () {
        const _options = {
          imageDatabase : new Map(),
          hyperlinkDatabase: new Map()
        };
        const _descriptor = html.parseHTML('<a href="https://carbone.io/documentation.html"><img src="https://carbone.io/cat" alt="cat"></a>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        // update image aspect ratio. Simulate calls which are done before the final postprocess
        const _imageInfo = _options.imageDatabase.get('https://carbone.io/cat');
        // simulate call to image._getImageSize(_imageInfo, 'emu');
        _imageInfo.downloadedImageWidth = Math.floor(400 /* px */ * 914400 / 96);
        _imageInfo.downloadedImageHeight = Math.floor(80 /* px */ * 914400 / 96);
        image._computeImageSize(_imageInfo);
        helper.assert(listStyleAbstract, '');
        helper.assert(listStyleNum, '');
        helper.assert(content.get(_options), '' +
          '<w:p>' +
            /** HYPERLINK */
            '<w:hyperlink r:id="CarboneHyperlinkId0">' +
              /** IMAGE */
              '<w:r><w:drawing>' +
                '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
                  '<wp:extent cx="1800000" cy="360000"/>' +
                  '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                  '<wp:docPr id="1000" name="" descr="">' +
                    '<a:hlinkClick xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" r:id=\"CarboneHyperlinkId0\"/>' +
                  '</wp:docPr>' +
                  '<wp:cNvGraphicFramePr>' +
                    '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                  '</wp:cNvGraphicFramePr>' +
                  '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                        '<pic:nvPicPr>' +
                          '<pic:cNvPr id="1000" name="" descr="">' +
                            '<a:hlinkClick r:id=\"CarboneHyperlinkId0\"/>' +
                          '</pic:cNvPr>' +
                          '<pic:cNvPicPr>' +
                            '<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>' +
                          '</pic:cNvPicPr>' +
                        '</pic:nvPicPr>' +
                        '<pic:blipFill>' +
                          '<a:blip r:embed="rIdCarbone0"></a:blip>' +
                          '<a:stretch>' +
                            '<a:fillRect/>' +
                          '</a:stretch>' +
                        '</pic:blipFill>' +
                        '<pic:spPr bwMode="auto">' +
                          '<a:xfrm>' +
                            '<a:off x="0" y="0"/>' +
                            '<a:ext cx="1800000" cy="360000"/>' +
                          '</a:xfrm>' +
                          '<a:prstGeom prst="rect">' +
                            '<a:avLst/>' +
                          '</a:prstGeom>' +
                        '</pic:spPr>' +
                      '</pic:pic>' +
                    '</a:graphicData>' +
                  '</a:graphic>' +
                '</wp:inline>' +
              '</w:drawing></w:r>' +
            '</w:hyperlink>' +
          '</w:p>'
        );
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        const _ita = _options.hyperlinkDatabase.keys();
        helper.assert(_ita.next().value, 'https://carbone.io/documentation.html');
        helper.assert(_ita.next().value, undefined);
      });


      it('should convert HTML with images to DOCX inside a list and anchor (without width and height)', function () {
        const _options = {
          imageDatabase : new Map(),
          hyperlinkDatabase: new Map()
        };
        const _descriptor = html.parseHTML('<ul><li><a href="https://carbone.io/documentation.html"><img src="https://carbone.io/cat" alt="cat"></a></li></ul>');
        const { content, listStyleAbstract, listStyleNum } = html.buildXmlContentDOCX(_descriptor, _options);
        helper.assert(listStyleAbstract, '<w:abstractNum w:abstractNumId="1000"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum>');
        helper.assert(listStyleNum, '<w:num w:numId="1000"><w:abstractNumId w:val="1000"/></w:num>');
        // update image aspect ratio. Simulate calls which are done before the final postprocess
        const _imageInfo = _options.imageDatabase.get('https://carbone.io/cat');
        // simulate call to image._getImageSize(_imageInfo, 'emu');
        _imageInfo.downloadedImageWidth = Math.floor(100 /* px */ * 914400 / 96);
        _imageInfo.downloadedImageHeight = Math.floor(80 /* px */ * 914400 / 96);
        image._computeImageSize(_imageInfo);
        helper.assert(content.get(_options), '' +
          '<w:p>' +
            /** PARAGRAPH AS LIST */
            '<w:pPr>' +
              '<w:numPr>' +
                '<w:ilvl w:val="0"/>' +
                '<w:numId w:val="1000"/>' +
              '</w:numPr>' +
            '</w:pPr>' +
            /** HYPERLINK */
            '<w:hyperlink r:id="CarboneHyperlinkId0">' +
              /** IMAGE */
              '<w:r><w:drawing>' +
                '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
                  '<wp:extent cx="952500" cy="762000"/>' +
                  '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                  '<wp:docPr id="1000" name="" descr="">' +
                    '<a:hlinkClick xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" r:id=\"CarboneHyperlinkId0\"/>' +
                  '</wp:docPr>' +
                  '<wp:cNvGraphicFramePr>' +
                    '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
                  '</wp:cNvGraphicFramePr>' +
                  '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
                    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                        '<pic:nvPicPr>' +
                          '<pic:cNvPr id="1000" name="" descr="">' +
                            '<a:hlinkClick r:id=\"CarboneHyperlinkId0\"/>' +
                          '</pic:cNvPr>' +
                          '<pic:cNvPicPr>' +
                            '<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>' +
                          '</pic:cNvPicPr>' +
                        '</pic:nvPicPr>' +
                        '<pic:blipFill>' +
                          '<a:blip r:embed="rIdCarbone0"></a:blip>' +
                          '<a:stretch>' +
                            '<a:fillRect/>' +
                          '</a:stretch>' +
                        '</pic:blipFill>' +
                        '<pic:spPr bwMode="auto">' +
                          '<a:xfrm>' +
                            '<a:off x="0" y="0"/>' +
                            '<a:ext cx="952500" cy="762000"/>' +
                          '</a:xfrm>' +
                          '<a:prstGeom prst="rect">' +
                            '<a:avLst/>' +
                          '</a:prstGeom>' +
                        '</pic:spPr>' +
                      '</pic:pic>' +
                    '</a:graphicData>' +
                  '</a:graphic>' +
                '</wp:inline>' +
              '</w:drawing></w:r>' +
            '</w:hyperlink>' +
          '</w:p>' +
          '<w:p/>'
        );
        const _iti = _options.imageDatabase.keys();
        helper.assert(_iti.next().value, 'https://carbone.io/cat');
        helper.assert(_iti.next().value, undefined);
        const _ita = _options.hyperlinkDatabase.keys();
        helper.assert(_ita.next().value, 'https://carbone.io/documentation.html');
        helper.assert(_ita.next().value, undefined);
      });
    });

    describe('formatters/postProcessFormatters DOCX', function () {
      it('getHTMLContentDocx - should not crash if the formatter is null && \n \
               getHTMLContentDocxPostProcess - should not crash if the contentId does not exist', () => {
        const _expected =  {
          id                : 1,
          content           : '',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('nullContent', { content : null });
        const _content = null;
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        /** Null is converted into an empty string */
        const _properties = _options.htmlDatabase.get('');
        helper.assert(_options.htmlDatabase.size, 2);
        helper.assert(_properties.id, 1)
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), '');
        helper.assert(_postProcessContent.fn.call(_options, 'this contentID doesnt exist'), '');
        helper.assert(_postProcessContent.fn.call(_options, null), '');
        helper.assert(_postProcessContent.fn.call(_options, 'nullContent'), '');
      });

      it('should add content element to htmlDatabase', () => {
        const _expected =  {
          id                : 0,
          content           : '<w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">This is some content</w:t></w:r></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<strong>This is some content</strong>';
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
      });

      it('[invalid hyperlink + getHTMLContentDocx] should add content element to htmlDatabase and should add the default hyperlinks.URL_ON_ERROR', () => {
        const _expected =  {
          id                : 0,
          content           : '<w:p><w:hyperlink r:id="CarboneHyperlinkId0"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t xml:space="preserve">TUSKLA WEBSITE</w:t></w:r></w:hyperlink></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        const _options = {
          htmlDatabase      : new Map(),
          hyperlinkDatabase : new Map()
        };
        const _content = '<a href="tusklacom">TUSKLA WEBSITE</a>';
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, hyperlinks.URL_ON_ERROR);
        helper.assert(_it.next().value, undefined);
      });

      it('[invalid hyperlink + defaultURL + getHTMLContentDocx] should add content element to htmlDatabase and should add a different url ', () => {
        const _expected =  {
          id                : 0,
          content           : '<w:p><w:hyperlink r:id="CarboneHyperlinkId0"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t xml:space="preserve">TUSKLA WEBSITE</w:t></w:r></w:hyperlink></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        const _options = {
          htmlDatabase      : new Map(),
          hyperlinkDatabase : new Map()
        };
        const _expectedURL = 'https://carbone.io/url_on_error_test';

        const _content = '<a href="tusklacom">TUSKLA WEBSITE</a>';
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, hyperlinksFormatters.defaultURL.call(_options,  _content, _expectedURL));
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
        const _it = _options.hyperlinkDatabase.keys();
        helper.assert(_it.next().value, _expectedURL);
        helper.assert(_it.next().value, undefined);
      });

      it('should add content element to htmlDatabase with a FONT', () => {
        const _expected =  {
          id                : 0,
          content           : '<w:p><w:r><w:rPr><w:b/><w:bCs/><w:rFonts w:ascii="American Typewriter" w:hAnsi="American Typewriter" w:cs="American Typewriter" w:eastAsia="American Typewriter"/></w:rPr><w:t xml:space="preserve">This is some content</w:t></w:r></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };

        const _options = {
          htmlDatabase : new Map(),
          extension: 'docx',
          htmlStylesDatabase: new Map()
        };

        // Prepare the style coming from the template
        const _styleId = 'styleId'
        const _htmlDefaultStyleObject = { ...html.templateDefaultStyles }
        _htmlDefaultStyleObject.text += '<w:rFonts w:ascii=\"American Typewriter\" w:hAnsi=\"American Typewriter\" w:cs=\"American Typewriter\" w:eastAsia=\"American Typewriter\"/>'
        _htmlDefaultStyleObject.paragraph += '';
        html.addHtmlDefaultStylesDatabase(_options, _styleId, _htmlDefaultStyleObject)

        const _content = '<strong>This is some content</strong>';
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content, _styleId);
        const _properties = _options.htmlDatabase.get(_content + _styleId);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
      });

      it('should add content element to htmlDatabase with HTML entities', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = 'I have&nbsp;to creates bills in euro <i>&euro;</i>, Yen <i>&yen;</i> and Pound <b>&pound;</b>.';
        const _expected =  {
          id      : 0,
          content : `<w:p><w:r><w:t xml:space="preserve">I have${String.fromCodePoint(160)}to creates bills in euro </w:t></w:r>` +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">€</w:t></w:r>' +
                    '<w:r><w:t xml:space="preserve">, Yen </w:t></w:r>' +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">¥</w:t></w:r>' +
                    '<w:r><w:t xml:space="preserve"> and Pound </w:t></w:r>' +
                    '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">£</w:t></w:r>' +
                    '<w:r><w:t xml:space="preserve">.</w:t></w:r></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
      });

      it('getHtmlStyleName - should add multiple styles element to htmlDatabase + get new style name', () => {
        const _content = '<em><b>Apples are red</b></em><br><u> hello </u>';
        const _expected = {
          id      : 0,
          content : '<w:p><w:r><w:rPr><w:i/><w:iCs/><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Apples are red</w:t></w:r>'+
                    '<w:r><w:br/></w:r>'+
                    '<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve"> hello </w:t></w:r></w:p>',
          listStyleAbstract : '',
          listStyleNum      : ''
        };
        const _options = {
          htmlDatabase : new Map()
        };
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties.id, _expected.id);
        helper.assert(_properties.content.get(_content), _expected.content);
        helper.assert(_properties.listStyleAbstract, '')
        helper.assert(_properties.listStyleNum, '')
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
      });
    });

    describe('PostprocessDocx', function () {
      it('should do nothing if listStyleAbstract and listStyleNum are empty', function () {
        let _numberingContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num></w:numbering>';
        let template = {
          files : [
            {
              name : 'numbering.xml',
              data : _numberingContent
            }
          ]
        };
        let options = {
          htmlDatabase : new Map()
        };
        html.postProcessDocx(template, null, options);
        helper.assert(template.files[0].data, _numberingContent);
      });
      it('should add listStyleAbstract and listStyleNum to the file numbering.xml', function () {
        let _content = '<ul><li>Apple</li><li>Banana</li></ul><ol><li>dog</li></ol>';
        let _expectedNumberingFile = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering><w:abstractNum w:abstractNumId="1000"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1001"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="1000"><w:abstractNumId w:val="1000"/></w:num><w:num w:numId="1001"><w:abstractNumId w:val="1001"/></w:num></w:numbering>';
        let template = {
          files : [
            {
              name : 'numbering.xml',
              data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num></w:numbering>'
            }
          ]
        };
        let _options = {
          htmlDatabase : new Map()
        };
        htmlFormatters.getHTMLContentDocx.call(_options, _content);
        html.postProcessDocx(template, null, _options);
        helper.assert(template.files[0].data, _expectedNumberingFile);
      });
    });
  });
  describe('Utils', function () {
    describe('parseHTML', function () {
      it('should be fast to parse HTML', function () {
        var _sample = '<u>Although the term <b>"alpinism"</b> <br/>has become synonymous with <b>sporting <br> achievement</b>,<br/><em>pyreneism</em>,<br/>appearing in the <em><s>20th</s></em> 19th century</u>';
        var _html = '';
        var _nbTag = 0;
        var _nbHtmlRepetition = 300;
        var _nbLoop = 10;
        for (let i = 0; i < _nbHtmlRepetition; i++) {
          _html += _sample;
        }
        var _start = process.hrtime();
        for (let i = 0; i < _nbLoop; i++) {
          _html  += 'a'; // change html a little bit to avoid V8 optimization
          _nbTag += html.parseHTML(_html).length;
        }
        var _diff = process.hrtime(_start);
        helper.assert(_nbTag, _nbHtmlRepetition * 16 * _nbLoop + _nbLoop /* a */);
        var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
        console.log('\n parseHTML speed : ' + (_elapsed / _nbLoop) + ' ms (around 1.5ms) \n');
        helper.assert((_elapsed / _nbLoop)  < (10 * helper.CPU_PERFORMANCE_FACTOR), true, 'parseHTML is too slow');
      });
      it('should parse HTML without error if the string empty', function () {
        helper.assert(html.parseHTML(''), []);
        helper.assert(html.parseHTML(null), []);
      });
      it('should parse HTML content and return a descriptors [SIMPLE]', function () {
        helper.assert(html.parseHTML('This is a simple text'), [ { content : 'This is a simple text', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<strong><strong>Bold content</strong></strong>'), [ { content : 'Bold content', type : '', tags : ['strong'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b> content'), [ { content : 'Bold', type : '', tags : ['b'] }, { content : ' content', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('Bold <b>content</b>'), [ { content : 'Bold ', type : '', tags : [] }, { content : 'content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('Bold <b title="value1">content</b>'), [ { content : 'Bold ', type : '', tags : [] }, { content : 'content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b style="color:red;margin:10px 20px" title="value2">Bold content</b>'), [ { content : 'Bold content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<i>Italic content</i>'), [ { content : 'Italic content', type : '', tags : ['i'] } ]);
        helper.assert(html.parseHTML('<s>Striked content</s>'), [ { content : 'Striked content', type : '', tags : ['s'] } ]);
        helper.assert(html.parseHTML('<span id="1234"> simple text </span>'), [ { content : ' simple text ', type : '', tags : ['span'] } ]);
      });

      it('should not consider a tag "brie" is a carriage return', function () {
        helper.assert(html.parseHTML('<b>Bold <brie/><brie>content<brie/></b>'), [ { content : 'Bold ', type : '', tags : ['b'] }, { content : 'content', type : '', tags : ['b', 'brie'] } ]);
      });

      it('should accepts some weird HTML to always return a result in production', function () {
        // Missing ending marker
        helper.assert(html.parseHTML('<b>Underlined content'), [ { content : 'Underlined content', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<b>Underlined content</bold>'), [ { content : 'Underlined content', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<bold>Underlined</b> content'), [ { content : 'Underlined', type : '', tags : ['bold'] }, { content : ' content', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<em><bold>Underlined </i> content</em>'), [ { content : 'Underlined ', type : '', tags : ['em', 'bold'] }, { content : ' content', type : '', tags : ['em'] } ]);

        // the HTML tag is missing a closing mark
        helper.assert(html.parseHTML('<btest content'), [ { content : '&lt;btest content', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<   test')      , [ { content : '&lt;   test', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<<b>Bold</b>')  , [ { content : 'Bold', type : '', tags : ['<b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b<>')  , [ { content : 'Bold', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</<b>')  , [ { content : 'Bold', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</>b>')  , [ { content : 'Bold', type : '', tags : ['b'] }, { content : 'b&gt;', type : '', tags : [] } ]);

        // missing opening tag
        helper.assert(html.parseHTML('test</b>content'), [ { content : 'test', type : '', tags : [] }, { content : 'content', type : '', tags : [] } ]);
      });

      it('should parse HTML content and return a descriptors [MIX without break line]', function () {
        helper.assert(html.parseHTML('<b><em>this is a bold and italic text</em></b>'), [ { content : 'this is a bold and italic text',  type : '', tags : ['b', 'em'] } ]);
        helper.assert(html.parseHTML('<b><u><s><em>this is a bold and italic text</em></s></u></b>'), [ { content : 'this is a bold and italic text',  type : '', tags : ['b', 'u', 's', 'em'] } ]);
        helper.assert(html.parseHTML('<ul><li style="color:red;padding: 10px 2px 4px"><a href="carbone.io">This is a LINK</a></li></ul>'),
          [
            { content : '', type : html.types.UNORDERED_LIST_BEGIN, tags : [] },
            { content : '', type : html.types.LIST_ITEM_BEGIN, tags : [] },
            { content : '',  type : html.types.ANCHOR_BEGIN, href : 'carbone.io', tags : [] },
            { content : 'This is a LINK', type : '', tags : [] },
            { content : '', type : html.types.ANCHOR_END, tags : [] },
            { content : '', type : html.types.LIST_ITEM_END, tags : [] },
            { content : '', type : html.types.UNORDERED_LIST_END, tags : [] },
          ]
        );
        helper.assert(html.parseHTML('<b>bold</b><em>and italic</em>'),
          [
            { content : 'bold',  type : '', tags : ['b'] },
            { content : 'and italic',  type : '', tags : ['em'] }
          ]
        );

        helper.assert(html.parseHTML('this<b> is a bold</b><em>and italic</em> text'),
          [
            { content : 'this',  type : '', tags : [] },
            { content : ' is a bold',  type : '', tags : ['b'] },
            { content : 'and italic',  type : '', tags : ['em'] },
            { content : ' text',  type : '', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('this <b> is a bold </b> and <u><em>italic</em></u> text '),
          [
            { content : 'this ',  type : '', tags : [] },
            { content : ' is a bold ',  type : '', tags : ['b'] },
            { content : ' and ',  type : '', tags : [] },
            { content : 'italic',  type : '', tags : ['u', 'em'] },
            { content : ' text ',  type : '', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('<b>this is a bold<em>and italic</em> text</b>'),
          [
            { content : 'this is a bold',  type : '', tags : ['b'] },
            { content : 'and italic',  type : '', tags : ['b', 'em'] },
            { content : ' text',  type : '', tags : ['b'] },
          ]
        );

        helper.assert(html.parseHTML('<b>this <u> is a bold<em> text </em></u><em>and </em><s><em>italic </em>text</s></b>.'),
          [
            { content : 'this ',  type : '', tags : ['b'] },
            { content : ' is a bold',  type : '', tags : ['b', 'u'] },
            { content : ' text ',  type : '', tags : ['b', 'u', 'em'] },
            { content : 'and ',  type : '', tags : ['b', 'em'] },
            { content : 'italic ',  type : '', tags : ['b', 's', 'em'] },
            { content : 'text',  type : '', tags : ['b', 's'] },
            { content : '.',  type : '', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('<div id="content"><em>This is a <strong>tree</strong> with a lot of fruits inside! <s>I really <strong>like</strong></s> and this is <b>wonderful</b>.</em></div>'),
          [
            { content : 'This is a ',  type : '', tags : ['div', 'em'] },
            { content : 'tree',  type : '', tags : ['div', 'em', 'strong'] },
            { content : ' with a lot of fruits inside! ',  type : '', tags : ['div', 'em'] },
            { content : 'I really ',  type : '', tags : ['div', 'em', 's'] },
            { content : 'like',  type : '', tags : ['div', 'em', 's', 'strong'] },
            { content : ' and this is ',  type : '', tags : ['div', 'em'] },
            { content : 'wonderful',  type : '', tags : ['div', 'em', 'b'] },
            { content : '.',  type : '', tags : ['div', 'em'] },
          ]
        );
      });

      it('should parse HTML content with unsupported character and your convert to XML entities: <>\'"&', function () {
        helper.assert(html.parseHTML('<b>On Mar. 30, 2021, &amp; & Global Polygraph & &amp; Security LLC</b>'),
          [
            { content : 'On Mar. 30, 2021, &amp; &amp; Global Polygraph &amp; &amp; Security LLC',  type : '', tags : ['b'] }
          ]
        );
        helper.assert(html.parseHTML('"<b>\'This is a text &\'</b>"'),
          [
            { content : '&quot;',  type : '', tags : [] },
            { content : '&apos;This is a text &amp;&apos;',  type : '', tags : ['b'] },
            { content : '&quot;',  type : '', tags : [] },
          ]
        );
        // eslint-disable-next-line no-useless-escape
        helper.assert(html.parseHTML('<b>\<\></b>'),
          [
            { content : '&lt;&gt;',  type : '', tags : ['b'] }
          ]
        );
        /** This case should will never happen, it is just to test if the & regex is not replacing other HTML entities. */
        helper.assert(html.parseHTML('This is some HTML with HTML entities:<br/><i>&Afr; &bullet;&cdot; & &Congruent;</i>'),
          [
            { content : 'This is some HTML with HTML entities:',  type : '', tags : [] },
            {
              content : '',
              type    : '#break#',
              tags    : []
            },
            {
              content : '&Afr; &bullet;&cdot; &amp; &Congruent;',
              type    : '',
              tags    : ['i']
            }
          ]
        );
      });

      it('should parse HTML content with BREAK LINES tags <br> [MIX]', function () {
        helper.assert(html.parseHTML('This is <br><i>a tree</i>'),
          [
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
          ]
        );
        helper.assert(html.parseHTML('This is <br/><i>a tree</i>'),
          [
            { content : 'This is ', type : '', tags : [] },
            { content : '' , type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
          ]
        );
        helper.assert(html.parseHTML('This is a<br>simple text.'),
          [
            { content : 'This is a', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : 'simple text.', type : '', tags : [] }
          ]
        );
        helper.assert(html.parseHTML('This <br /> is<br/>a<br>simple<br/> text<br/>.'),
          [
            { content : 'This ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : ' is', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'simple', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : ' text', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : '.', type : '', tags : [] }
          ]
        );
        helper.assert(html.parseHTML('<br/>This<br/>is<br/><br>a<br>sim<br/>ple<br/><br/>text.<br>'),
          [
            { content : '', type : '#break#', tags : [] } ,
            { content : 'This', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : 'is', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : 'a', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : 'sim', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : 'ple', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
            { content : '', type : '#break#', tags : [] } ,
            { content : 'text.', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] } ,
          ]
        );
        helper.assert(html.parseHTML('<u>Although the term <b>"alpinism"</b> <br/>has become synonymous with <b>sporting <br> achievement</b>,<br/><em>pyreneism</em>,<br/>appearing in the <em><s>20th</s></em> 19th century</u>'),
          [
            { content : 'Although the term ', type : '', tags : ['u'] },
            { content : '&quot;alpinism&quot;', type : '', tags : ['u', 'b'] },
            { content : ' ', type : '', tags : ['u'] },
            { content : '', type : '#break#', tags : [] },
            { content : 'has become synonymous with ', type : '', tags : ['u'] },
            { content : 'sporting ', type : '', tags : ['u', 'b'] },
            { content : '', type : '#break#', tags : [] },
            { content : ' achievement', type : '', tags : ['u', 'b'] },
            { content : ',', type : '', tags : ['u'] },
            { content : '', type : '#break#', tags : [] },
            { content : 'pyreneism', type : '', tags : ['u', 'em'] },
            { content : ',', type : '', tags : ['u'] },
            { content : '', type : '#break#', tags : [] },
            { content : 'appearing in the ', type : '', tags : ['u'] },
            { content : '20th', type : '', tags : ['u', 'em', 's'] },
            { content : ' 19th century', type : '', tags : ['u'] }
          ]
        );
        helper.assert(html.parseHTML('This is <br/><b><i>a tree</i> with lot of <br/>fruits inside!</b><br/> I really like it <u>and this <br/>is <s>wonderful</s></u>.'),
          [
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['b', 'i'] },
            { content : ' with lot of ', type : '', tags : ['b'] },
            { content : '', type : '#break#', tags : [] },
            { content : 'fruits inside!', type : '', tags : ['b'] },
            { content : '', type : '#break#', tags : [] },
            { content : ' I really like it ', type : '', tags : [] },
            { content : 'and this ', type : '', tags : ['u'] },
            { content : '', type : '#break#', tags : [] },
            { content : 'is ', type : '', tags : ['u'] },
            { content : 'wonderful', type : '', tags : ['u', 's'] },
            { content : '.', type : '', tags : [] }
          ]
        );
      });
      it('should parse HTML content with PARAGRAPHE tags <p> [MIX]', function () {
        helper.assert(html.parseHTML('<p>This is <br><i>a tree</i></p>'),
          [
            { content : '', type : '#PB#', tags : [] },
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
            { content : '', type : '#PE#', tags : [] },
          ]
        );
        helper.assert(html.parseHTML('Beginning <p>some content <p>This is <br><i><p>a tree</p></i></p> end of sentence</p>'),
          [
            { content : 'Beginning ', type : '', tags : [] },
            { content : '', type : '#PB#', tags : [] },
            { content : 'some content ', type : '', tags : [] },
            { content : '', type : '#PB#', tags : [] },
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : '', type : '#PB#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
            { content : '', type : '#PE#', tags : [] },
            { content : '', type : '#PE#', tags : [] },
            { content : ' end of sentence', type : '', tags : [] },
            { content : '', type : '#PE#', tags : [] },
          ]
        );
      });

      it('should parse HTML content with ANCHOR tags <a>', function () {
        helper.assert(html.parseHTML('<strong><a href="carbone.io"><i>This is a link</i></a></strong>'),
          [
            { content : '', type : html.types.ANCHOR_BEGIN, href : 'carbone.io', tags : [] },
            { content : 'This is a link', type : '', tags : ['strong', 'i'] },
            { content : '', type : html.types.ANCHOR_END, tags : [] },
          ]
        );
        helper.assert(html.parseHTML('<a href="carbone.io"><i>This is a link</i></a> and a<br/><i><a href="carbone.io/documentation.html">Second link</a></i>'),
          [
            { content : '', type : html.types.ANCHOR_BEGIN, href : 'carbone.io', tags : [] },
            { content : 'This is a link', type : '', tags : ['i'] },
            { content : '', type : html.types.ANCHOR_END, tags : [] },
            { content : ' and a', type : '', tags : [] },
            { content : '', type : html.types.BREAK_LINE, tags : [] },
            { content : '', type : html.types.ANCHOR_BEGIN, href : 'carbone.io/documentation.html', tags : [] },
            { content : 'Second link', type : '', tags : ['i'] },
            { content : '', type : html.types.ANCHOR_END, tags : [] },
          ]
        );
      });
      it('should parse HTML content with LIST tags <ol><ul><li>', function () {
        helper.assert(html.parseHTML('<ul><li>Coffee</li></ul>'),
          [
            { content : '', type : html.types.UNORDERED_LIST_BEGIN,  tags : [] },
            { content : '', type : html.types.LIST_ITEM_BEGIN,  tags : [] },
            { content : 'Coffee', type : '', tags : [] },
            { content : '', type : html.types.LIST_ITEM_END,  tags : [] },
            { content : '', type : html.types.UNORDERED_LIST_END, tags : [] },
          ]
        );
        helper.assert(html.parseHTML('<ol><li>Coffee</li><li>Tea</li><li>Milk</li></ol>'),
          [
            { content : '', type : html.types.ORDERED_LIST_BEGIN,  tags : [] },
            { content : '', type : html.types.LIST_ITEM_BEGIN,  tags : [] },
            { content : 'Coffee', type : '', tags : [] },
            { content : '', type : html.types.LIST_ITEM_END,  tags : [] },
            { content : '', type : html.types.LIST_ITEM_BEGIN,  tags : [] },
            { content : 'Tea', type : '', tags : [] },
            { content : '', type : html.types.LIST_ITEM_END,  tags : [] },
            { content : '', type : html.types.LIST_ITEM_BEGIN,  tags : [] },
            { content : 'Milk', type : '', tags : [] },
            { content : '', type : html.types.LIST_ITEM_END,  tags : [] },
            { content : '', type : html.types.ORDERED_LIST_END, tags : [] },
          ]
        );
      });

      it('should parse image HTML content', function () {
        /** SHOULD NOT Parse as the SRC attribute is missing */
        helper.assert(html.parseHTML('<img alt=\"cat\">'), [  ]);
        /** Parse the SRC attribute */
        helper.assert(html.parseHTML('<img src="https://carbone.io/cat" alt=\"cat\">'), [ { content : '', type : '#image#', tags : [], src: "https://carbone.io/cat", width: -1, height: -1 } ]);
        /** Parse the SRC, WIDTH, and HEIGHT attributes */
        helper.assert(html.parseHTML('<img src="https://carbone.io/cat" width="300" height="50" alt=\"cat\">'), [ { content : '', type : '#image#', tags : [], src: "https://carbone.io/cat", width: 300, height: 50 } ]);
        /** Parse the HTML mixed with paragraphs */
        helper.assert(html.parseHTML('<p>This is some content before</p><img src="https://carbone.io/cat" width="1500" height="2000" alt="cat"><p>After</p>'),
          [
            { content: '', type: '#PB#', tags: [] },
            { content: 'This is some content before', type: '', tags: [] },
            { content: '', type: '#PE#', tags: [] },
            {
              content: '',
              type: '#image#',
              tags: [],
              src: 'https://carbone.io/cat',
              width: 1500,
              height: 2000
            },
            { content: '', type: '#PB#', tags: [] },
            { content: 'After', type: '', tags: [] },
            { content: '', type: '#PE#', tags: [] }
          ]
        );
        /** Parse the HTML mixed with anchor and list */
         helper.assert(html.parseHTML('<ul><li><a href="http://www.google.com" class="image"> <img src="https://carbone.io/cat" alt="Facebook Icon"/></a></li></ul>'),
         [
          { content: '', type: '#ULB#', tags: [] },
          { content: '', type: '#LIB#', tags: [] },
          {
            content: '',
            type: '#AB#',
            href: 'http://www.google.com',
            tags: []
          },
          { content: ' ', type: '', tags: [] },
          {
            content: '',
            type: '#image#',
            tags: [],
            src: 'https://carbone.io/cat',
            width: -1,
            height: -1
          },
          { content: '', type: '#AE#', tags: [] },
          { content: '', type: '#LIE#', tags: [] },
          { content: '', type: '#ULE#', tags: [] }
        ]
       );
      });

      describe('HTML Comments Tags', function () {

        it('should skip comment embedded within HTML tags', function () {
          helper.assert(html.parseHTML('<p>This is <!-- great text --> a paragraph.</p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is ',  type : '', tags : [] },
              { content : ' a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        it('should skip comment tags between HTML tags', function () {
          helper.assert(html.parseHTML('<p><b>This is</b><!-- great text --><em>a paragraph.</em></p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is',  type : '', tags : ['b'] },
              { content : 'a paragraph.',  type : '', tags : ['em'] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        it('should skip comment tags at the end', function () {
          helper.assert(html.parseHTML('<p>This is a paragraph.</p><!-- great text -->'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        it('should skip comment tags at the beginning', function () {
          helper.assert(html.parseHTML('<!-- great text --><p>This is a paragraph.</p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        /** Comment at the beginning, with tags and content insides */
        it('should skip comment tags at the beginning, with inner HTML tags and text', function () {
          helper.assert(html.parseHTML('<!-- great text <b> end comment --><p>This is a paragraph.</p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        it('should skip comment tags within a paragraph, with ONE inner HTML tags and text', function () {
          helper.assert(html.parseHTML('<p>This is<!-- great text <w:LsdException L 6"/> -->a paragraph.</p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is',  type : '', tags : [] },
              { content : 'a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        /** Multiple tags and text within the comment */
        it('should skip comment tags within a parapgraph, with multiple inner HTML tags and text', function () {
          helper.assert(html.parseHTML('<p>This is<!-- great text <w:LsdException L 6"/>middle content <w:LsdException Locked="false" SemiHidden="true" UnhideWhenUsed="true" Name="line number"/> end comment-->a paragraph.</p>'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is',  type : '', tags : [] },
              { content : 'a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] }
            ]
          );
        });

        it('should skip comment tags at the end, with one inner HTML tags and text', function () {
          helper.assert(html.parseHTML('<p>This is a paragraph.</p><!-- great text <w:LsdException L 6"/> end comment --> end content'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] },
              { content : ' end content',  type : '', tags : [] }
            ]
          );
        });

        it('should skip comment tags at the end, with multiple inner HTML tags and text', function () {
          helper.assert(html.parseHTML('<p>This is a paragraph.</p><!-- great text <w:LsdException L 6"/> middle content <w:LsdException Locked="false" SemiHidden="true" UnhideWhenUsed="true" Name="line number"/> end comment --> end content'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a paragraph.',  type : '', tags : [] },
              { content : '',  type : '#PE#', tags : [] },
              { content : ' end content',  type : '', tags : [] }
            ]
          );
        });

        it('should skip everything if the end comment tags does not exist', function () {
          helper.assert(html.parseHTML('<p>This is a <!--  paragraph.</p>great text'),
            [
              { content : '',  type : '#PB#', tags : [] },
              { content : 'This is a ',  type : '', tags : [] }
            ]
          );
        });
      });
    });


    describe('skipEmptyParagraphs', function () {

      it('should not skip paragraph', function () {
        let descriptor = html.parseHTML('<p>  ')
        html.skipEmptyParagraphs(descriptor)
        helper.assert(descriptor, [
          { content: '', type: '#PB#', tags: [] },
          { content: '  ', type: '', tags: [] }
        ])

        descriptor = html.parseHTML('<p> content</p>')
        html.skipEmptyParagraphs(descriptor)
        helper.assert(descriptor, [
          { content: '', type: '#PB#', tags: [] },
          { content: ' content', type: '', tags: [] },
          { content: '', type: '#PE#', tags: [] },
        ])

        /** Non breaking space */
        descriptor = html.parseHTML('<p>\xa0</p>')
        html.skipEmptyParagraphs(descriptor)
        helper.assert(descriptor, [
          { content: '', type: '#PB#', tags: [] },
          { content: '\xa0', type: '', tags: [] },
          { content: '', type: '#PE#', tags: [] },
        ])
      })

      it('should skip empty paragraphs', function () {
        const _descriptor = html.parseHTML('<p><p><p>content</p>')
        html.skipEmptyParagraphs(_descriptor);
        helper.assert(_descriptor, [
          { content: '', type: '#PB#', tags: [], toSkip: 1 },
          { content: '', type: '#PB#', tags: [], toSkip: 2 },
          { content: '', type: '#PB#', tags: [] },
          { content: 'content', type: '', tags: [] },
          { content: '', type: '#PE#', tags: [] }
        ]);
      });

      it('should mark invalid paragraphs if it is followed by space', function () {
        const _descriptor = html.parseHTML('<p>      <p>content</p>')
        html.skipEmptyParagraphs(_descriptor);
        helper.assert(_descriptor.length, 5)
        helper.assert(_descriptor[0].toSkip, 2)
        helper.assert(_descriptor[0].type, html.types.PARAGRAPH_BEGIN)
        helper.assert(_descriptor[2]?.toSkip, undefined)
        helper.assert(_descriptor[2].type, html.types.PARAGRAPH_BEGIN)
        helper.assert(_descriptor[2]?.toSkip, undefined)
        helper.assert(_descriptor[3]?.toSkip, undefined)
      });

      it('should mark invalid paragraphs if it is followed by a list', function () {
        const _descriptor = html.parseHTML('<p>  <ul></ul></p>')
        html.skipEmptyParagraphs(_descriptor);
        helper.assert(_descriptor, [
          { content: '', type: '#PB#', tags: [], toSkip: 2 },
          { content: '  ', type: '', tags: [] },
          { content: '', type: '#ULB#', tags: [] },
          { content: '', type: '#ULE#', tags: [] },
          { content: '', type: '#PE#', tags: [] }
        ])
        const _descriptor2 = html.parseHTML('<p>  <ol></ol></p>')
        html.skipEmptyParagraphs(_descriptor2);
        helper.assert(_descriptor2, [
          { content: '', type: '#PB#', tags: [], toSkip: 2 },
          { content: '  ', type: '', tags: [] },
          { content: '', type: '#OLB#', tags: [] },
          { content: '', type: '#OLE#', tags: [] },
          { content: '', type: '#PE#', tags: [] }
        ])
      });
    });

    describe('buildXMLStyle', function () {
      it('should throw an error if the file type is not supported', function () {
        assert.throws(() => helper.assert(html.buildXMLStyle('pptx', ['em']), new Error('HTML error: the file type is not supported.')));
      });

      it('should do nothing if the list of tag is empty', function () {
        helper.assert(html.buildXMLStyle('docx', []), '');
      });

      it('should create the list of style for DOCX reports', function () {
        helper.assert(html.buildXMLStyle('docx', ['em']), '<w:i/><w:iCs/>');
        helper.assert(html.buildXMLStyle('docx', ['b', 'i', 's']), '<w:b/><w:bCs/><w:i/><w:iCs/><w:strike/>');
      });

      it('should do nothing if the list of tag provided is not recognized', function () {
        helper.assert(html.buildXMLStyle('docx', ['footer', 'header', 'div']), '');
        helper.assert(html.buildXMLStyle('docx', ['s', 'em', 'b', 'p', 'div', 'u']), '<w:strike/><w:i/><w:iCs/><w:b/><w:bCs/><w:u w:val="single"/>');
      });
    });

    describe('convertHTMLEntities', function () {
      it('should do nothing if the HTML content does not contain HTML entities', function () {
        const _content = '<div>This is an <b>apple</b> and <i>strawberry</i>.</div>';
        helper.assert(html.convertHTMLEntities(_content), _content);
      });
      it('should not crash if html does not contain a string', function () {
        helper.assert(html.convertHTMLEntities(true), 'true');
        helper.assert(html.convertHTMLEntities(false), 'false');
        helper.assert(html.convertHTMLEntities(undefined), '');
        helper.assert(html.convertHTMLEntities(null), '');
        helper.assert(html.convertHTMLEntities([]), '');
        helper.assert(html.convertHTMLEntities({}), '');
        helper.assert(html.convertHTMLEntities(12233), '12233');
        helper.assert(html.convertHTMLEntities(12.33), '12.33');
        helper.assert(html.convertHTMLEntities(0), '0');
        helper.assert(html.convertHTMLEntities(-1), '-1');
      });

      it('should keep html entities that are supported by XML format: <>\'"&', function () {
        const _content = '<div> &amp; &quot; &apos; &lt; &gt; </div>';
        helper.assert(html.convertHTMLEntities(_content), _content);
      });

      it('should convert unsupported HTML entities into valid HTML entities [non-breaking space]', function () {
        const _content = '<div>This&nbsp;is an&nbsp;<b>apple</b>&nbsp;and&nbsp;<i>strawberry</i>.</div>';
        const _expected = `<div>This${String.fromCodePoint(160)}is an${String.fromCodePoint(160)}<b>apple</b>${String.fromCodePoint(160)}and${String.fromCodePoint(160)}<i>strawberry</i>.</div>`;
        helper.assert(html.convertHTMLEntities(_content), _expected);
      });

      it('should convert unsupported HTML entities into valid HTML entities [special characters]', function () {
        helper.assert(html.convertHTMLEntities(
          '<div>This &cent; is &pound; an &yen; <b>apple &euro;</b> &copy; and &reg; <i>strawberry</i>.</div>'
        ),
        '<div>This ¢ is £ an ¥ <b>apple €</b> © and ® <i>strawberry</i>.</div>'
        );
        helper.assert(html.convertHTMLEntities(
          '<div>This is a list of HTML entities: &nleftrightarrow; &NotSubsetEqual; &nwarhk; &rx; &subset; &Subset;</div>'
        ),
        '<div>This is a list of HTML entities: ↮ ⊈ ⤣ ℞ ⊂ ⋐</div>'
        );
      });

      it('should remove "\\r\\n|\\n|\\r|\\t"', function () {
        const _content = '\t\t\t<div>\rThis is an <b>apple</b>\n and <i>strawberry</i>.</div>\r\n';
        const _expected = '<div>This is an <b>apple</b> and <i>strawberry</i>.</div>';
        helper.assert(html.convertHTMLEntities(_content), _expected);
      });

      it('should remove "\\r\\n|\\n|\\r|\\t" and convert html entities', function () {
        const _content = '<div>'+String.fromCharCode(10)+'This is&euro; an'+String.fromCharCode(13)+' <b>apple</b>'+String.fromCharCode(9)+' and <i>strawberry&pound;</i>.</div>\r\n';
        const _expected = '<div>This is€ an <b>apple</b> and <i>strawberry£</i>.</div>';
        helper.assert(html.convertHTMLEntities(_content), _expected);
      });
    });

    describe('getNewContentBuilder', function() {
      it('should return a content builder', () => {
        const _contentBuilder = html.getNewContentBuilder()
        helper.assert(JSON.stringify(_contentBuilder.elements), '[]');
        helper.assert(typeof _contentBuilder.add, 'function');
        helper.assert(typeof _contentBuilder.get, 'function');
      })

      it('should add a string into the content object', () => {
        const _contentBuilder = html.getNewContentBuilder();
        const _expected = [
          {
            "data": "<xml>test</xml>",
            "type": "string"
          }
        ]
        _contentBuilder.add(_expected[0].data)
        helper.assert(_contentBuilder.elements, _expected);
        helper.assert(_contentBuilder.get(), _expected[0].data)
      })

      it('should add 2 strings, a number, and should concat as one element into the content object', () => {
        const _contentBuilder = html.getNewContentBuilder();
        const _expected = [
          {
            "data": "<xml>test</xml><xml2>test2</xml2>3",
            "type": "string"
          }
        ]
        _contentBuilder.add('<xml>test</xml>')
        _contentBuilder.add('<xml2>test2</xml2>')
        _contentBuilder.add(3)

        helper.assert(_contentBuilder.elements, _expected);
        helper.assert(_contentBuilder.get(), _expected[0].data)
      })

      it('should add 2 strings, a function, into the content object', () => {
        const _contentBuilder = html.getNewContentBuilder();
        const _expectedFunction = {
          fn : function () { return '<xml2>test2</xml2>'; }
        }
        const _expected = [
          {
            "data": "<xml>test</xml>",
            "type": "string"
          },
          {
            "data": _expectedFunction,
            "type": "object"
          },
          {
            "data": "<xml3>test3</xml3>",
            "type": "string"
          }
        ]
        _contentBuilder.add('<xml>test</xml>')
        _contentBuilder.add(_expectedFunction)
        _contentBuilder.add('<xml3>test3</xml3>')

        helper.assert(_contentBuilder.elements[0], _expected[0]);
        helper.assert(_contentBuilder.elements[1].type, 'object');
        helper.assert(typeof _contentBuilder.elements[1].data.fn, 'function');
        helper.assert(_contentBuilder.elements[2], _expected[2]);
        helper.assert(_contentBuilder.get(), "<xml>test</xml><xml2>test2</xml2><xml3>test3</xml3>")
      })

      it('should add 2 strings, a function, into the content object and should pass options and arguments', () => {
        const _contentBuilder = html.getNewContentBuilder();
        const _expectedFunction = {
          fn : function (args1, args2) {
            return `<xml2>${this.args0}</xml2>${args1}${args2}`;
          },
          args: ['Apple', 'Banana']
        }
        const _expected = [
          {
            "data": "<xml>test</xml>",
            "type": "string"
          },
          {
            "data": _expectedFunction,
            "type": "object"
          },
          {
            "data": "<xml3>test3</xml3>",
            "type": "string"
          }
        ]
        _contentBuilder.add('<xml>test</xml>')
        _contentBuilder.add(_expectedFunction)
        _contentBuilder.add('<xml3>test3</xml3>')

        helper.assert(_contentBuilder.elements[0], _expected[0]);
        helper.assert(_contentBuilder.elements[1].type, 'object');
        helper.assert(typeof _contentBuilder.elements[1].data.fn, 'function');
        helper.assert(_contentBuilder.elements[2], _expected[2]);
        helper.assert(_contentBuilder.get( { args0: 'tree' } ), "<xml>test</xml><xml2>tree</xml2>AppleBanana<xml3>test3</xml3>")
      })
    });
  });
});

