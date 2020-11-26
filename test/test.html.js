const html = require('../lib/html');
const htmlFormatters = require('../formatters/html');
const helper = require('../lib/helper');
const assert = require('assert');

describe.only('Dynamic HTML', function () {
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
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5"><text:span text:style-name="{d.content:getHtmlStyleName()}">{d.content:getHtmlContent()}</text:span></text:p></office:text></office:body>';
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
                      '<text:p text:style-name="P5"><text:span text:style-name="{d.value1:getHtmlStyleName()}">{d.value1:getHtmlContent()}</text:span> {d.element} <text:span text:style-name="{d.value2:getHtmlStyleName()}">{d.value2:getHtmlContent()}</text:span></text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P5">This is some content</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P3"><text:span text:style-name="{d.value3:getHtmlStyleName()}">{d.value3:getHtmlContent()}</text:span></text:p>' +
                      '</office:body>';
        html.preprocessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
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
        _options.htmlDatabase.set('<b>contentFromTheMarker</b>', {
          id        : 0,
          content   : 'contentFromTheMarker',
          styleList : 'fo:font-weight="bold" '
        });
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="TC0" style:family="text"><style:text-properties fo:font-weight="bold" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should add styles [ITALIC/UNDERLINE/STRONG]', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('<i><u>contentFromTheMarker1</u></i>', {
          id        : 0,
          content   : 'contentFromTheMarker1',
          styleList : 'fo:font-style="italic" style:text-underline-style="solid" '
        });
        _options.htmlDatabase.set('<strong>contentFromTheMarker3</strong>text', {
          id        : 1,
          content   : 'contentFromTheMarker3',
          styleList : 'fo:font-weight="bold" '
        });
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="TC0" style:family="text"><style:text-properties fo:font-style="italic" style:text-underline-style="solid" /></style:style><style:style style:name="TC1" style:family="text"><style:text-properties fo:font-weight="bold" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
      it('should add styles [MIX]', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        _options.htmlDatabase.set('<i><u><del><b>contentFromTheMarker1</b></del></u></i>', {
          id        : 0,
          content   : 'contentFromTheMarker1',
          styleList : 'fo:font-style="italic" style:text-underline-style="solid" style:text-line-through-style="solid" fo:font-weight="bold" '
        });
        _options.htmlDatabase.set('<em>content</em>', {
          id        : 1,
          content   : 'content',
          styleList : 'fo:font-style="italic" '
        });
        _options.htmlDatabase.set('<strong>content</strong>', {
          id        : 2,
          content   : 'content',
          styleList : 'fo:font-weight="bold" '
        });
        _options.htmlDatabase.set('<u>content</u>', {
          id        : 3,
          content   : 'content',
          styleList : 'style:text-underline-style="solid" '
        });
        _options.htmlDatabase.set('<s>content</s>', {
          id        : 4,
          content   : 'content',
          styleList : 'style:text-line-through-style="solid" '
        });
        const _template = {
          files : [{
            name : 'content.xml',
            data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>'
          }]
        };
        const _expectedContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="CS4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="CS5" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style><style:style style:name="TC0" style:family="text"><style:text-properties fo:font-style="italic" style:text-underline-style="solid" style:text-line-through-style="solid" fo:font-weight="bold" /></style:style><style:style style:name="TC1" style:family="text"><style:text-properties fo:font-style="italic" /></style:style><style:style style:name="TC2" style:family="text"><style:text-properties fo:font-weight="bold" /></style:style><style:style style:name="TC3" style:family="text"><style:text-properties style:text-underline-style="solid" /></style:style><style:style style:name="TC4" style:family="text"><style:text-properties style:text-line-through-style="solid" /></style:style></office:automatic-styles><office:body><office:text>      Some content...    </office:text></office:body></office:document-content>';
        html.postProcessODT(_template, null, _options);
        helper.assert(_template.files[0].data, _expectedContent);
      });
    });

    describe('formatters/postProcessFormatters ODT', function () {
      it('getHtmlContent - should add style element to htmlDatabase + get clean content without HTML', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<strong>This is some content</strong>';
        const _postProcess = htmlFormatters.getHtmlContent.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          id        : 0,
          content   : 'This is some content',
          styleList : 'fo:font-weight="bold" '
        });
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), 'This is some content');
      });

      it('getHtmlStyleName - should add multiple styles element to htmlDatabase + get new style name', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<em><b>This is some content</b></em>';
        const _postProcess = htmlFormatters.getHtmlStyleName.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          id        : 0,
          content   : 'This is some content',
          styleList : 'fo:font-style="italic" fo:font-weight="bold" '
        });
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), 'TC0');
      });

      it('getHtmlStyleName + getHtmlContent - should not add the same HTML content to htmlDatabase', () => {
        const _options = {
          htmlDatabase : new Map()
        };
        const _content = '<em><b>This is some content</b></em>';
        htmlFormatters.getHtmlContent.call(_options, _content);
        htmlFormatters.getHtmlStyleName.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_options.htmlDatabase.size, 1);
        helper.assert(_properties, {
          id        : 0,
          content   : 'This is some content',
          styleList : 'fo:font-style="italic" fo:font-weight="bold" '
        });
      });
    });
    describe('utils', function () {
      describe('parseStyleAndGetStyleList', () => {
        it('should do nothing if the content does not have HTML tag', () => {
          const _content = 'This is a text';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _content);
          helper.assert(res.styleList, '');
        });
        it('should parse the HTML tag, return the style list and the cleaned content [STRONG]', () => {
          const _content = '<strong>This is a text</strong>';
          const _expectedContent = 'This is a text';
          const _expectedStyleList = 'fo:font-weight="bold" ';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _expectedContent);
          helper.assert(res.styleList, _expectedStyleList);
        });
        it('should parse the HTML tag, return the style list and the cleaned content [ITALIC <em> and <i>]', () => {
          const _content = '<i><em>This is a text</em></i>';
          const _expectedContent = 'This is a text';
          const _expectedStyleList = 'fo:font-style="italic" ';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _expectedContent);
          helper.assert(res.styleList, _expectedStyleList);
        });
        it('should parse the HTML tag, return the style list and the cleaned content [MIXED: strong italic underlined striked]', () => {
          const _content = '<i><em><b><u><s>This is a text</s></u><b></em></i>';
          const _expectedContent = 'This is a text';
          const _expectedStyleList = 'fo:font-style="italic" fo:font-weight="bold" style:text-underline-style="solid" style:text-line-through-style="solid" ';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _expectedContent);
          helper.assert(res.styleList, _expectedStyleList);
        });
        it('should parse the HTML tag, return the style list and the cleaned content [STRONG + BREAK LINE]', () => {
          const _content = '<strong>This is<br>a text</strong>';
          const _expectedContent = 'This is<text:line-break/>a text';
          const _expectedStyleList = 'fo:font-weight="bold" ';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _expectedContent);
          helper.assert(res.styleList, _expectedStyleList);
        });
        it('should parse the HTML tag, return the style list and the cleaned content [MIXED + BREAK LINE]', () => {
          const _content = '<i><em><b><u><s>This<br>is<br/>a<br>text</s></u><b></em></i>';
          const _expectedContent = 'This<text:line-break/>is<text:line-break/>a<text:line-break/>text';
          const _expectedStyleList = 'fo:font-style="italic" fo:font-weight="bold" style:text-underline-style="solid" style:text-line-through-style="solid" ';
          const res = html.parseStyleAndGetStyleList(_content);
          helper.assert(res.content, _expectedContent);
          helper.assert(res.styleList, _expectedStyleList);
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

      it('should find one HTML formatter and inject HTML formatters for: style, content, subContent and spacePreserve', function () {
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
                  '{d.mix1:getHTMLContentStyleDocx}</w:rPr>' +
                  '<w:t xml:space="preserve">{d.mix1:getHTMLContentDocx}</w:t>' +
                '</w:r>{d.mix1:getHTMLSubContentDocx}' +
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

      it('should find 3 HTML formatter and inject HTML formatters for: style, content, subContent and spacePreserve', function () {
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
                  '{d.mix1:getHTMLContentStyleDocx}</w:rPr>' +
                  '<w:t xml:space="preserve">{d.mix1:getHTMLContentDocx}</w:t>' +
                '</w:r>{d.mix1:getHTMLSubContentDocx}' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '{d.strong:getHTMLContentStyleDocx}</w:rPr>' +
                  '<w:t xml:space="preserve">{d.strong:getHTMLContentDocx}</w:t>' +
                '</w:r>{d.strong:getHTMLSubContentDocx}' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '{d.italic:getHTMLContentStyleDocx}</w:rPr>' +
                  '<w:t xml:space="preserve">{d.italic:getHTMLContentDocx}</w:t>' +
                '</w:r>{d.italic:getHTMLSubContentDocx}' +
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

      it('should find one HTML formatter and inject HTML formatters for: style, content, subContent and WITHOUT spacePreserve (already inserted)', function () {
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
                  '{d.strongContent:getHTMLContentStyleDocx}</w:rPr>' +
                  '<w:t xml:space="preserve">{d.strongContent:getHTMLContentDocx}</w:t>' +
                '</w:r>{d.strongContent:getHTMLSubContentDocx}' +
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
                '{d.strikedel:getHTMLContentStyleDocx}</w:rPr>' +
                '<w:t xml:space="preserve">{d.strikedel:getHTMLContentDocx}</w:t>' +
              '</w:r>{d.strikedel:getHTMLSubContentDocx}' +
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
                '{d.italic:getHTMLContentStyleDocx}</w:rPr>' +
                '<w:t xml:space="preserve">{d.italic:getHTMLContentDocx}</w:t>' +
              '</w:r>{d.italic:getHTMLSubContentDocx}' +
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

    describe('buildSubContentDOCX', function () {
      it('should return nothing if the descriptor is empty/undefined/null', function () {
        helper.assert(html.buildSubContentDOCX([]), '');
        helper.assert(html.buildSubContentDOCX(), '');
        helper.assert(html.buildSubContentDOCX(undefined), '');
        helper.assert(html.buildSubContentDOCX(null), '');
      });

      it('should return nothing if the descriptor has only 1 element', function () {
        helper.assert(html.buildSubContentDOCX([{ content : 'text', tags : ['b'] }]), '');
      });

      it('should return the DOCX xml content based on the descriptor', function () {
        helper.assert(html.buildSubContentDOCX(
          [
            { content : 'bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] }
          ]
        ), '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">and italic</w:t>' +
            '</w:r>'
        );

        helper.assert(html.buildSubContentDOCX(
          [
            { content : 'this', tags : [] },
            { content : ' is a bold', tags : ['b'] },
            { content : 'and italic', tags : ['em'] },
            { content : ' text', tags : [] },
          ]
        ), '<w:r>' +
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
        helper.assert(html.buildSubContentDOCX(
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
        helper.assert(html.buildSubContentDOCX(
          [
            { content : 'This is ', tags : [] },
            { content : '#break#', tags : [] },
            { content : 'a tree', tags : ['i'] },
          ]
        ), '<w:br/>' +
            '<w:r>' +
              '<w:rPr>' +
                '<w:i/><w:iCs/>' +
              '</w:rPr>' +
              '<w:t xml:space="preserve">a tree</w:t>' +
            '</w:r>'
        );

        helper.assert(html.buildSubContentDOCX(
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
        ), '<w:br/>' +
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
  });
  describe('Utils', function () {
    describe('parseHTML', function () {
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

      it('should detect errors, starting or ending tag missing', function () {
        // Missing ending marker
        assert.throws(() => html.parseHTML('<b>Underlined content'), new Error('Invalid HTML tags: <b>'));
        assert.throws(() => html.parseHTML('<b>Underlined content</bold>'), new Error('Invalid HTML tags: <b> <bold>'));
        assert.throws(() => html.parseHTML('<bold>Underlined</b> content'), new Error('Invalid HTML tags: <bold> <b>'));
        assert.throws(() => html.parseHTML('<em><bold>Underlined </i> content</em>'), new Error('Invalid HTML tags: <bold> <i>'));
        // the HTML tag is missing a closing mark
        assert.throws(() => html.parseHTML('<btest content'), new Error('Invalid HTML tag: btest'));
        assert.throws(() => html.parseHTML('<   test'), new Error('Invalid HTML tag'));
        assert.throws(() => html.parseHTML('<<b>Bold</b>'), new Error('Invalid HTML tag: b'));
        assert.throws(() => html.parseHTML('<b>Bold</b<>'), new Error('Invalid HTML tag: b'));
        assert.throws(() => html.parseHTML('<b>Bold</<b>'), new Error('Invalid HTML tag: b'));
        assert.throws(() => html.parseHTML('<b>Bold</>b>'), new Error('Invalid HTML tag'));
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

        helper.assert(html.parseHTML('<b>this <u> is a bold<em> text </u>and <s>italic </em>text</b></s>.'),
          [
            { content : 'this ', tags : ['b'] },
            { content : ' is a bold', tags : ['b', 'u'] },
            { content : ' text ', tags : ['b', 'u', 'em'] },
            { content : 'and ', tags : ['b', 'em'] },
            { content : 'italic ', tags : ['b', 'em', 's'] },
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

        helper.assert(html.parseHTML('This is </br><i>a tree</i>'),
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

        helper.assert(html.parseHTML('This <br /> is</br>a<br>simple</br> text<br/>.'),
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

        helper.assert(html.parseHTML('<br/>This<br/>is</br><br>a<br>sim<br/>ple<br/></br>text.<br>'),
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

        helper.assert(html.parseHTML('<u>Although the term <b>"alpinism"</b> </br>has become synonymous with <b>sporting <br> achievement</b>,<br/><em>pyreneism</em>,<br/>appearing in the <em><s>20th</s></em> 19th century</u>'),
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

        helper.assert(html.parseHTML('This is </br><b><i>a tree</i> with lot of <br/>fruits inside!</b></br> I really like it <u>and this <br/>is <s>wonderful</s></u>.'),
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

    describe('identifyTag', function () {
      it('should identify HTML tags inside a content at a specific position (with or without attributes)', function () {
        helper.assert(html.identifyTag('the sky <b>is blue</b>', 8), { pos : 10, name : 'b', type : 'begin'});
        helper.assert(html.identifyTag('the <i>sky is </i>blue', 14), { pos : 17, name : 'i', type : 'end'});
        helper.assert(html.identifyTag('<strong>the sky is </strong>blue', 0), { pos : 7, name : 'strong', type : 'begin'});
        helper.assert(html.identifyTag('<em>the sky is blue</em>', 19), { pos : 23, name : 'em', type : 'end'});
        helper.assert(html.identifyTag('the sky is<br>blue', 10), { pos : 13, name : 'br', type : 'begin'});
        helper.assert(html.identifyTag('the sky is<br/>blue', 10), { pos : 14, name : 'br', type : 'begin'});
        helper.assert(html.identifyTag('the sky is</br>blue', 10), { pos : 14, name : 'br', type : 'end'});
        helper.assert(html.identifyTag('<div><p><b>hello</b></p></div>', 5), { pos : 7, name : 'p', type : 'begin'});
        helper.assert(html.identifyTag('<div><p><b>hello</b></p></div>', 20), { pos : 23, name : 'p', type : 'end'});
        helper.assert(html.identifyTag('the <p style="color:red;margin:10px 10px;">sky is blue</p>', 4), { pos : 42, name : 'p', type : 'begin'});
        helper.assert(html.identifyTag('This image: <img src="img.jpg" alt="some text" width="5" height="60"/> text', 12), { pos : 69, name : 'img', type : 'begin'});
      });

      it('should throw en error if the tag is invalid', function () {
        // missing tag at the given position
        assert.throws(() => html.identifyTag('the sky is blue', 5), new Error('Invalid HTML tag: the first character is not a left arrow key.'));
        assert.throws(() => html.identifyTag('the sky is blue', 20), new Error('The index is outside of the text length range.'));
        assert.throws(() => html.identifyTag('the sky is blue', -3), new Error('The index is outside of the text length range.'));
        // missing ending arrow
        assert.throws(() => html.identifyTag('<   test', 0), new Error('Invalid HTML tag'));
        assert.throws(() => html.identifyTag('the sky is</b blue', 10), new Error('Invalid HTML tag: b'));
        assert.throws(() => html.identifyTag('the </bsky is blue', 4), new Error('Invalid HTML tag: bsky'));
        // unvalid tags
        assert.throws(() => html.identifyTag('the sky <<em>is blue', 8), new Error('Invalid HTML tag: em'));
        assert.throws(() => html.identifyTag('the</> sky is blue', 3), new Error('Invalid HTML tag'));
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
  });
});

