const html = require('../lib/html');
const htmlFormatters = require('../formatters/html');
const helper = require('../lib/helper');
const assert = require('assert');

describe('Dynamic HTML', function () {
  describe('ODT reports', function () {
    describe('preprocessODT', function () {
      it('should do nothing', () => {
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5">{d.content}</text:p></office:text></office:body>';
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<office:body><office:text><text:p text:style-name="P5">{d.content}</text:p></office:text></office:body>'
          }]
        };
        html.preprocessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should convert html marker into a marker + post process marker [single marker]', () => {
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<office:body><office:text><text:p text:style-name="P5">{d.content:html}</text:p></office:text></office:body>'
          }]
        };
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5">{d.content:getHTMLContentOdt}</text:p></office:text></office:body>';
        html.preprocessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
      });

      it('should convert multiple html markers into a marker + post process marker [multiple markers]', () => {
        const _template = {
          files : [{
            name : 'content.xml',
            data : '' +
                  '<office:body>' +
                  '<text:p text:style-name="P5">{d.value1:html} {d.element} {d.value2:html()}</text:p>' +
                  '<text:p text:style-name="P1"/>' +
                  '<text:p text:style-name="P5">This is some content</text:p>' +
                  '<text:p text:style-name="P1"/>' +
                  '<text:p text:style-name="P3">{d.value3:html}</text:p>' +
                  '</office:body>'
          }]
        };
        const _expectedContent = '' +
                      '<office:body>' +
                      '<text:p text:style-name="P5">{d.value1:getHTMLContentOdt} {d.element} {d.value2:getHTMLContentOdt}</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P5">This is some content</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P3">{d.value3:getHTMLContentOdt}</text:p>' +
                      '</office:body>';
        html.preprocessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
      });
    });

    describe('buildXMLContentOdt', function () {
      const _uniqueID = 'C01';
      it('should do nothing if the descriptor is empty', function () {
        const res = html.buildXMLContentOdt(_uniqueID, []);
        helper.assert(res.content, '');
        helper.assert(res.style, '');
      });

      it('should create the content and style from an HTML descriptor', function () {
        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] }
          ]
        ),
        {
          content : '' +
            '<text:span text:style-name="C010">bold</text:span>' +
            '<text:span text:style-name="C011">and italic</text:span>',
          style : '' +
          '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
          '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this', tags : [] },
            { content : ' is a bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] },
            { content : ' text', tags : [] },
          ]
        ),
        {
          content : '' +
            '<text:span text:style-name="C010">this</text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
            '<text:span text:style-name="C012">and italic</text:span>' +
            '<text:span text:style-name="C013"> text</text:span>',
          style : '' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });
      });

      it('should create the content and style from an HTML descriptor that contains unknown tags', function () {
        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this ', tags : ['div', 'b'] },
            { content : ' is a bold', tags : ['div', 'b', 'u'] },
            { content : ' text ', tags : ['div', 'b', 'u',  'p', 'em'] },
            { content : 'and ', tags : ['div', 'b', 'p', 'em'] },
            { content : 'italic ', tags : ['div', 'b', 'p', 'em', 's'] },
            { content : 'text', tags : ['div', 'b', 's'] },
            { content : '.', tags : [] },
          ]
        ),
        {
          content : '' +
            '<text:span text:style-name="C010">this </text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
            '<text:span text:style-name="C012"> text </text:span>' +
            '<text:span text:style-name="C013">and </text:span>' +
            '<text:span text:style-name="C014">italic </text:span>' +
            '<text:span text:style-name="C015">text</text:span>' +
            '<text:span text:style-name="C016">.</text:span>',
          style : '' +
            '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-weight="bold" style:text-underline-style="solid"/></style:style>' +
            '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-weight="bold" style:text-underline-style="solid" fo:font-style="italic"/></style:style>' +
            '<style:style style:name="C013" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic"/></style:style>' +
            '<style:style style:name="C014" style:family="text"><style:text-properties fo:font-weight="bold" fo:font-style="italic" style:text-line-through-style="solid"/></style:style>' +
            '<style:style style:name="C015" style:family="text"><style:text-properties fo:font-weight="bold" style:text-line-through-style="solid"/></style:style>'
        });
      });

      it('should create the content and style from an HTML descriptor that contains BREAK LINE', function () {

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['i'] },
          ]
        ),
        {
          content : '' +
            '<text:span text:style-name="C010">This is </text:span>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C012">a tree</text:span>',
          style : '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This ', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' is', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'simple', tags : [] },
            { content : '#break#', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' text', tags : [] },
            { content : '#break#', tags : [] },
            { content : '.', tags : [] }
          ]
        ),
        {
          content : '' +
            '<text:span text:style-name="C010">This </text:span>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C012"> is</text:span>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C014">a</text:span>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C016">simple</text:span>' +
            '<text:line-break/>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C019"> text</text:span>' +
            '<text:line-break/>' +
            '<text:span text:style-name="C0111">.</text:span>',
          style : ''
        });
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
      it('getHtmlContent - should add content and style element to htmlDatabase', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<strong>This is some content</strong>';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          content : '<text:span text:style-name="TC00">This is some content</text:span>',
          style   : '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>'
        });
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), '<text:span text:style-name="TC00">This is some content</text:span>');
      });


      it('should add content and style element to htmlDatabase with HTML entities', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = 'I have&nbsp;to creates bills in euro <i>&euro;</i>, Yen <i>&yen;</i> and Pound <b>&pound;</b>.';
        const _expected =  {
          content : '<text:span text:style-name="TC00">I have&#160;to creates bills in euro </text:span>' +
                    '<text:span text:style-name="TC01">€</text:span>' +
                    '<text:span text:style-name="TC02">, Yen </text:span>' +
                    '<text:span text:style-name="TC03">¥</text:span>' +
                    '<text:span text:style-name="TC04"> and Pound </text:span>' +
                    '<text:span text:style-name="TC05">£</text:span>' +
                    '<text:span text:style-name="TC06">.</text:span>',
          style : '<style:style style:name="TC01" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>' +
                  '<style:style style:name="TC03" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>' +
                  '<style:style style:name="TC05" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>'
        };
        htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, _expected);
        helper.assert(_options.htmlDatabase.size, 1);
      });

      it('getHtmlStyleName - should add multiple styles element to htmlDatabase + get new style name', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<em><b>This is some content</b></em>';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          content : '<text:span text:style-name="TC00">This is some content</text:span>',
          style   : '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-style="italic" fo:font-weight="bold"/></style:style>'
        });
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), '<text:span text:style-name="TC00">This is some content</text:span>');
      });

      it('getHtmlStyleName + getHtmlContent - should not add the same HTML content to htmlDatabase', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<em><b>This is some content</b></em>';
        htmlFormatters.getHTMLContentOdt.call(_options, _content);
        htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties, {
          content : '<text:span text:style-name="TC00">This is some content</text:span>',
          style   : '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-style="italic" fo:font-weight="bold"/></style:style>'
        });
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
        html.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedContent);
        helper.assert(_template.files[1].data, _expectedApp);
        helper.assert(_template.files[2].data, _expectedSettings);
        helper.assert(_template.files[3].data, _expectedRels);
      });

      it('should find one HTML formatter and inject HTML formatters for the new content', function () {
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
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t></w:t>' +
                '</w:r>{d.mix1:getHTMLContentDocx}' +
              '</w:p>' +
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
        html.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find 3 HTML formatter and inject HTML formatters for the new content', function () {
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
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.strong:html}</w:t>' +
                '</w:r>' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t>{d.italic:html}</w:t>' +
                '</w:r>' +
              '</w:p>' +
            '</w:body>' +
          '</w:document>';
        const _XMLexpected = '' +
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document>' +
            '<w:body>' +
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t></w:t>' +
                '</w:r>{d.mix1:getHTMLContentDocx}' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t></w:t>' +
                '</w:r>{d.strong:getHTMLContentDocx}' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t></w:t>' +
                '</w:r>{d.italic:getHTMLContentDocx}' +
              '</w:p>' +
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
        html.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _XMLexpected);
      });

      it('should find one HTML formatter and inject HTML formatters for the new content and WITHOUT spacePreserve (already inserted)', function () {
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
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t xml:space="preserve"></w:t>' +
                '</w:r>{d.strongContent:getHTMLContentDocx}' +
              '</w:p>' +
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
                '<w:t></w:t>' +
              '</w:r>{d.strikedel:getHTMLContentDocx}' +
            '</w:p>' +
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
            '<w:p>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t></w:t>' +
              '</w:r>{d.italic:getHTMLContentDocx}' +
            '</w:p>' +
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
        html.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXMLTemplate);
        helper.assert(_template.files[1].data, _expectedXMLfooter);
        helper.assert(_template.files[2].data, _expectedXMLheader);
      });
    });

    describe('buildContentDOCX', function () {
      it('should return nothing if the descriptor is empty/undefined/null', function () {
        helper.assert(html.buildContentDOCX([]), '');
        helper.assert(html.buildContentDOCX(), '');
        helper.assert(html.buildContentDOCX(undefined), '');
        helper.assert(html.buildContentDOCX(null), '');
      });

      it('should return nothing if the descriptor has only 1 element', function () {
        helper.assert(html.buildContentDOCX([{ content : 'text', tags : ['b'] }]), '' +
        '<w:r>' +
          '<w:rPr>' +
            '<w:b/><w:bCs/>' +
          '</w:rPr>' +
          '<w:t xml:space="preserve">text</w:t>' +
        '</w:r>');
      });

      it('should return the DOCX xml content based on the descriptor', function () {
        helper.assert(html.buildContentDOCX(
          [
            { content : 'bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] }
          ]
        ), '<w:r>' +
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
            '</w:r>'
        );

        helper.assert(html.buildContentDOCX(
          [
            { content : 'this', tags : [] },
            { content : ' is a bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] },
            { content : ' text', tags : [] },
          ]
        ), '<w:r>' +
              '<w:rPr></w:rPr>' +
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
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve"> text</w:t>' +
            '</w:r>'
        );
      });

      it('should return the DOCX XML content based on a descriptor and should skip unknown tags', function () {
        helper.assert(html.buildContentDOCX(
          [
            { content : 'this ', tags : ['div', 'b'] },
            { content : ' is a bold', tags : ['div', 'b', 'u'] },
            { content : ' text ', tags : ['div', 'b', 'u',  'p', 'em'] },
            { content : 'and ', tags : ['div', 'b', 'p', 'em'] },
            { content : 'italic ', tags : ['div', 'b', 'p', 'em', 's'] },
            { content : 'text', tags : ['div', 'b', 's'] },
            { content : '.', tags : [] },
          ]
        ), '<w:r>'+
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
            '<w:r>'+
              '<w:rPr>'+
                '<w:b/><w:bCs/><w:strike/>'+
              '</w:rPr>'+
              '<w:t xml:space="preserve">text</w:t>'+
            '</w:r>'+
            '<w:r>'+
              '<w:rPr></w:rPr>'+
              '<w:t xml:space="preserve">.</w:t>'+
            '</w:r>'
        );
      });

      it('should insert break line in the new content', function () {
        helper.assert(html.buildContentDOCX(
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['i'] },
          ]
        ), '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">This is </w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">a tree</w:t>' +
            '</w:r>'
        );

        helper.assert(html.buildContentDOCX(
          [
            { content : 'This ', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' is', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'simple', tags : [] },
            { content : '#break#', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' text', tags : [] },
            { content : '#break#', tags : [] },
            { content : '.', tags : [] }
          ]
        ), '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">This </w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve"> is</w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">a</w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">simple</w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve"> text</w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">.</w:t>' +
            '</w:r>'
        );

      });
    });

    describe('formatters/postProcessFormatters DOCX', function () {
      it('should add content element to htmlDatabase', () => {
        const _expected =  {
          id      : 0,
          content : '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">This is some content</w:t></w:r>'
        };
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<strong>This is some content</strong>';
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, _expected);
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
          content : '<w:r><w:rPr></w:rPr><w:t xml:space="preserve">I have&#160;to creates bills in euro </w:t></w:r>' +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">€</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve">, Yen </w:t></w:r>' +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">¥</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve"> and Pound </w:t></w:r>' +
                    '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">£</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve">.</w:t></w:r>'
        };
        htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, _expected);
        helper.assert(_options.htmlDatabase.size, 1);
      });

      it('getHtmlStyleName - should add multiple styles element to htmlDatabase + get new style name', () => {
        const _content = '<em><b>Apples are red</b></em><br><u> hello </u>';
        const _expected = {
          id      : 0,
          content : '<w:r><w:rPr><w:i/><w:iCs/><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Apples are red</w:t></w:r><w:br/><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve"> hello </w:t></w:r>',
        };
        const _options = {
          htmlDatabase : new Map()
        };
        const _postProcessContent = htmlFormatters.getHTMLContentDocx.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, _expected);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_postProcessContent.fn.call(_options, _postProcessContent.args[0]), _expected.content);
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
        helper.assert((_elapsed / _nbLoop)  > 10, false, 'parseHTML is too slow');
      });
      it('should parse HTML without error if the string empty', function () {
        helper.assert(html.parseHTML(''), []);
        helper.assert(html.parseHTML(null), []);
      });
      it('should parse HTML content and return a descriptors [SIMPLE]', function () {
        helper.assert(html.parseHTML('This is a simple text'), [ { content : 'This is a simple text', tags : [] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b> content'), [ { content : 'Bold', tags : ['b'] }, { content : ' content', tags : [] } ]);
        helper.assert(html.parseHTML('Bold <b>content</b>'), [ { content : 'Bold ', tags : [] }, { content : 'content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('Bold <b title="value1">content</b>'), [ { content : 'Bold ', tags : [] }, { content : 'content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b style="color:red;margin:10px 20px" title="value2">Bold content</b>'), [ { content : 'Bold content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<i>Italic content</i>'), [ { content : 'Italic content', tags : ['i'] } ]);
        helper.assert(html.parseHTML('<s>Striked content</s>'), [ { content : 'Striked content', tags : ['s'] } ]);
        helper.assert(html.parseHTML('<p id="1234"> simple text </p>'), [ { content : ' simple text ', tags : ['p'] } ]);
      });

      it('should not consider a tag "brie" is a carriage return', function () {
        helper.assert(html.parseHTML('<b>Bold <brie/><brie>content<brie/></b>'), [ { content : 'Bold ', tags : ['b'] }, { content : 'content', tags : ['b', 'brie'] } ]);
      });

      it('should accepts some weird HTML to always return a result in production', function () {
        // Missing ending marker
        helper.assert(html.parseHTML('<b>Underlined content'), [ { content : 'Underlined content', tags : [] } ]);
        helper.assert(html.parseHTML('<b>Underlined content</bold>'), [ { content : 'Underlined content', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<bold>Underlined</b> content'), [ { content : 'Underlined', tags : ['bold'] }, { content : ' content', tags : [] } ]);
        helper.assert(html.parseHTML('<em><bold>Underlined </i> content</em>'), [ { content : 'Underlined ', tags : ['em', 'bold'] }, { content : ' content', tags : ['em'] } ]);

        // the HTML tag is missing a closing mark
        helper.assert(html.parseHTML('<btest content'), [ { content : '<btest content', tags : [] } ]);
        helper.assert(html.parseHTML('<   test')      , [ { content : '<   test', tags : [] } ]);
        helper.assert(html.parseHTML('<<b>Bold</b>')  , [ { content : 'Bold', tags : ['<b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b<>')  , [ { content : 'Bold', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</<b>')  , [ { content : 'Bold', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</>b>')  , [ { content : 'Bold' , tags : ['b'] }, { content : 'b>', tags : [] } ]);

        // missing opening tag
        helper.assert(html.parseHTML('test</b>content'), [ { content : 'test', tags : [] }, { content : 'content', tags : [] } ]);
      });

      it('should parse HTML content and return a descriptors [MIX without break line]', function () {
        helper.assert(html.parseHTML('<b><em>this is a bold and italic text</em></b>'), [ { content : 'this is a bold and italic text', tags : ['b', 'em'] } ]);
        helper.assert(html.parseHTML('<b><u><s><em>this is a bold and italic text</em></s></u></b>'), [ { content : 'this is a bold and italic text', tags : ['b', 'u', 's', 'em'] } ]);
        helper.assert(html.parseHTML('<li style="color:red;padding: 10px 2px 4px">This is a <a href="">LINK</a></li>'),
          [
            { content : 'This is a ', tags : ['li'] },
            { content : 'LINK', tags : ['li', 'a'] }
          ]
        );
        helper.assert(html.parseHTML('<b>bold</b><em>and italic</em>'),
          [
            { content : 'bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] }
          ]
        );

        helper.assert(html.parseHTML('this<b> is a bold</b><em>and italic</em> text'),
          [
            { content : 'this', tags : [] },
            { content : ' is a bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] },
            { content : ' text', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('this <b> is a bold </b> and <u><em>italic</em></u> text '),
          [
            { content : 'this ', tags : [] },
            { content : ' is a bold ', tags : ['b'] },
            { content : ' and ', tags : [] },
            { content : 'italic', tags : ['u', 'em'] },
            { content : ' text ', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('<b>this is a bold<em>and italic</em> text</b>'),
          [
            { content : 'this is a bold', tags : ['b'] },
            { content : 'and italic', tags : ['b', 'em'] },
            { content : ' text', tags : ['b'] },
          ]
        );

        helper.assert(html.parseHTML('<b>this <u> is a bold<em> text </em></u><em>and </em><s><em>italic </em>text</s></b>.'),
          [
            { content : 'this ', tags : ['b'] },
            { content : ' is a bold', tags : ['b', 'u'] },
            { content : ' text ', tags : ['b', 'u', 'em'] },
            { content : 'and ', tags : ['b', 'em'] },
            { content : 'italic ', tags : ['b', 's', 'em'] },
            { content : 'text', tags : ['b', 's'] },
            { content : '.', tags : [] },
          ]
        );

        helper.assert(html.parseHTML('<div id="content"><em>This is a <strong>tree</strong> with a lot of fruits inside! <s>I really <strong>like</strong></s> and this is <b>wonderful</b>.</em></div>'),
          [
            { content : 'This is a ', tags : ['div', 'em'] },
            { content : 'tree', tags : ['div', 'em', 'strong'] },
            { content : ' with a lot of fruits inside! ', tags : ['div', 'em'] },
            { content : 'I really ', tags : ['div', 'em', 's'] },
            { content : 'like', tags : ['div', 'em', 's', 'strong'] },
            { content : ' and this is ', tags : ['div', 'em'] },
            { content : 'wonderful', tags : ['div', 'em', 'b'] },
            { content : '.', tags : ['div', 'em'] },
          ]
        );
      });

      it('should parse HTML content with BREAK LINES tags <br> [MIX]', function () {
        helper.assert(html.parseHTML('This is <br><i>a tree</i>'),
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['i'] },
          ]
        );
        helper.assert(html.parseHTML('This is <br/><i>a tree</i>'),
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['i'] },
          ]
        );
        helper.assert(html.parseHTML('This is a<br>simple text.'),
          [
            { content : 'This is a', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : 'simple text.', tags : [] }
          ]
        );
        helper.assert(html.parseHTML('This <br /> is<br/>a<br>simple<br/> text<br/>.'),
          [
            { content : 'This ', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' is', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'simple', tags : [] },
            { content : '#break#', tags : [] },
            { content : ' text', tags : [] },
            { content : '#break#', tags : [] },
            { content : '.', tags : [] }
          ]
        );
        helper.assert(html.parseHTML('<br/>This<br/>is<br/><br>a<br>sim<br/>ple<br/><br/>text.<br>'),
          [
            { content : '#break#', tags : [] } ,
            { content : 'This', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : 'is', tags : [] },
            { content : '#break#', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : 'a', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : 'sim', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : 'ple', tags : [] },
            { content : '#break#', tags : [] } ,
            { content : '#break#', tags : [] } ,
            { content : 'text.', tags : [] },
            { content : '#break#', tags : [] } ,
          ]
        );
        helper.assert(html.parseHTML('<u>Although the term <b>"alpinism"</b> <br/>has become synonymous with <b>sporting <br> achievement</b>,<br/><em>pyreneism</em>,<br/>appearing in the <em><s>20th</s></em> 19th century</u>'),
          [
            { content : 'Although the term ', tags : ['u'] },
            { content : '"alpinism"', tags : ['u', 'b'] },
            { content : ' ', tags : ['u'] },
            { content : '#break#', tags : [] },
            { content : 'has become synonymous with ', tags : ['u'] },
            { content : 'sporting ', tags : ['u', 'b'] },
            { content : '#break#', tags : [] },
            { content : ' achievement', tags : ['u', 'b'] },
            { content : ',', tags : ['u'] },
            { content : '#break#', tags : [] },
            { content : 'pyreneism', tags : ['u', 'em'] },
            { content : ',', tags : ['u'] },
            { content : '#break#', tags : [] },
            { content : 'appearing in the ', tags : ['u'] },
            { content : '20th', tags : ['u', 'em', 's'] },
            { content : ' 19th century', tags : ['u'] }
          ]
        );
        helper.assert(html.parseHTML('This is <br/><b><i>a tree</i> with lot of <br/>fruits inside!</b><br/> I really like it <u>and this <br/>is <s>wonderful</s></u>.'),
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['b', 'i'] },
            { content : ' with lot of ', tags : ['b'] },
            { content : '#break#', tags : [] },
            { content : 'fruits inside!', tags : ['b'] },
            { content : '#break#', tags : [] },
            { content : ' I really like it ', tags : [] },
            { content : 'and this ', tags : ['u'] },
            { content : '#break#', tags : [] },
            { content : 'is ', tags : ['u'] },
            { content : 'wonderful', tags : ['u', 's'] },
            { content : '.', tags : [] }
          ]
        );
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

      it('should convert unsupported HTML entities into valid HTML entities [non-breaking space]', function () {
        const _content = '<div>This&nbsp;is an&nbsp;<b>apple</b>&nbsp;and&nbsp;<i>strawberry</i>.</div>';
        const _expected = '<div>This&#160;is an&#160;<b>apple</b>&#160;and&#160;<i>strawberry</i>.</div>';
        helper.assert(html.convertHTMLEntities(_content), _expected);
      });

      it('should convert unsupported HTML entities into valid HTML entities [special characters]', function () {
        const _content = '<div>This &cent; is &pound; an &yen; <b>apple &euro;</b> &copy; and &reg; <i>strawberry</i>.</div>';
        const _expected = '<div>This ¢ is £ an ¥ <b>apple €</b> © and ® <i>strawberry</i>.</div>';
        helper.assert(html.convertHTMLEntities(_content), _expected);
      });
    });
  });
});
