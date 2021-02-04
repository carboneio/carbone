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
        const _expectedContent = '<office:body><office:text><text:p text:style-name="P5"></text:p>{d.content:getHTMLContentOdt}</office:text></office:body>';
        html.preprocessODT(_template);
        helper.assert(_template.files[0].data, _expectedContent);
      });

      it('should convert multiple html markers into a marker + post process marker [multiple markers]', () => {
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
                      '<text:p text:style-name="P5"> {d.element}</text:p>{d.value1:getHTMLContentOdt}' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P5">This is some content</text:p>' +
                      '<text:p text:style-name="P1"/>' +
                      '<text:p text:style-name="P3"></text:p>{d.value3:getHTMLContentOdt}' +
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
            { content : 'bold', type: '', tags : ['b'] },
            { content : 'and italic', type: '', tags : ['em'] }
          ]
        ),
        {
          content : '' +
            '<text:p><text:span text:style-name="C010">bold</text:span>' +
            '<text:span text:style-name="C011">and italic</text:span></text:p>',
          style : '' +
            '<style:style style:name="C010" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'this', type: '', tags : [] },
            { content : ' is a bold', type: '', tags : ['b'] },
            { content : 'and italic', type: '', tags : ['em'] },
            { content : ' text', type: '', tags : [] },
          ]
        ),
        {
          content : '' +
            '<text:p><text:span>this</text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
            '<text:span text:style-name="C012">and italic</text:span>' +
            '<text:span> text</text:span></text:p>',
          style : '' +
            '<style:style style:name="C011" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
            '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });
      });

      it('should create the content and style from an HTML descriptor that contains unknown tags', function () {
        const descriptor = [
          { content : 'this ', type: '', tags : ['div', 'b'] },
          { content : ' is a bold', type: '', tags : ['div', 'b', 'u'] },
          { content : '', type: '#PB#', tags : [] },
          { content : ' text ', type: '', tags : ['div', 'b', 'u', 'em'] },
          { content : 'and ', type: '', tags : ['div', 'b', 'em'] },
          { content : 'italic ', type: '', tags : ['div', 'b', 'em', 's'] },
          { content : '', type: '#PE#', tags : [] },
          { content : 'text', type: '', tags : ['div', 'b', 's'] },
          { content : '.', type: '', tags : [] },
        ]
        const expectedContent = '' +
          '<text:p>' +
            '<text:span text:style-name="C010">this </text:span>' +
            '<text:span text:style-name="C011"> is a bold</text:span>' +
          '</text:p>' +
          '<text:p>' +
            '<text:span text:style-name="C013"> text </text:span>' +
            '<text:span text:style-name="C014">and </text:span>' +
            '<text:span text:style-name="C015">italic </text:span>' +
          '</text:p><text:line-break/>' +
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
            '<style:style style:name="C017" style:family="text"><style:text-properties fo:font-weight="bold" style:text-line-through-style="solid"/></style:style>'
        const res = html.buildXMLContentOdt(_uniqueID, descriptor)
        helper.assert(res.content, expectedContent);
        helper.assert(res.style, expectedStyle);
      });

      it('should create the content and style from an HTML descriptor that contains BREAK LINE', function () {

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This is ', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : 'a tree', type: '', tags : ['i'] },
          ]
        ),
        {
          content : '' +
            '<text:p>'+
              '<text:span>This is </text:span>'+
              '<text:line-break/>'+
              '<text:span text:style-name="C012">a tree</text:span>'+
            '</text:p>',
          style : '<style:style style:name="C012" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>'
        });

        helper.assert(html.buildXMLContentOdt(_uniqueID,
          [
            { content : 'This ', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : ' is', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : 'a', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : 'simple', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : ' text', type: '', tags : [] },
            { content : '', type: '#break#', tags : [] },
            { content : '.', type: '', tags : [] }
          ]
        ),
        {
          content : '' +
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
            '<text:span>.</text:span></text:p>',
          style : ''
        });
      });

      it('should create hyperlinks', function () {
        let res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('<a href="carbone.com">Carbone Website</a>'));
        helper.assert(res.content, '' +
          '<text:p>' +
            '<text:a xlink:type="simple" xlink:href="https://carbone.com">' +
              '<text:span>Carbone Website</text:span>' +
            '</text:a>' +
          '</text:p>'
        );

        res = html.buildXMLContentOdt(_uniqueID, html.parseHTML('Some content before <a href="carbone.com">Carbone Website something <b>bold</b> and <i>italic</i></a> Content after'));
        helper.assert(res.content, '' +
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
        const _expectedContent = '<text:p><text:span text:style-name="TC00">This is some content</text:span></text:p>';
        const _expectedStyle = '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          content : _expectedContent,
          style   : _expectedStyle
        });
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
        const _expected = '<text:p><text:span text:style-name="TC00">This is some content</text:span></text:p>';
        const _style = '<style:style style:name="TC00" style:family="text"><style:text-properties fo:font-style="italic" fo:font-weight="bold"/></style:style>';
        const _postProcess = htmlFormatters.getHTMLContentOdt.call(_options, _content);
        const _properties = _options.htmlDatabase.get(_content);
        helper.assert(_properties, {
          content : _expected,
          style   : _style
        });
        helper.assert(_postProcess.fn.call(_options, _postProcess.args[0]), _expected);
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
          content : '<text:p><text:span text:style-name="TC00">This is some content</text:span></text:p>',
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
              '<w:p >' +
                '<w:r>' +
                  '<w:rPr>' +
                    '<w:lang w:val="en-US"/>' +
                  '</w:rPr>' +
                  '<w:t></w:t>' +
                '</w:r>' +
              '</w:p>{d.mix1:getHTMLContentDocx}' +
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
            '<w:p >' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:lang w:val="en-US"/>' +
                '</w:rPr>' +
                '<w:t></w:t>' +
              '</w:r>' +
            '</w:p>{d.mix1:getHTMLContentDocx}' +
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
                '</w:r>' +
              '</w:p>{d.strongContent:getHTMLContentDocx}' +
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
              '</w:r>' +
            '</w:p>{d.strikedel:getHTMLContentDocx}' +
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
              '</w:r>' +
            '</w:p>{d.italic:getHTMLContentDocx}' +
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
        helper.assert(html.buildContentDOCX([{ content : 'text', type : '', tags : ['b'] }]), '' +
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
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr></w:rPr>'+
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
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr></w:rPr>'+
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
        let _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr><w:b/><w:bCs/></w:rPr>'+
            '<w:t xml:space="preserve">Hello</w:t>'+
          '</w:r>'+
          '<w:r>'+
            '<w:rPr></w:rPr>'+
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
            '<w:rPr></w:rPr>'+
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
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
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
            '<w:rPr></w:rPr>'+
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
        const _res = html.buildContentDOCX(_descriptor);

        helper.assert(_res, '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr></w:rPr>'+
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
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
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
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
        '<w:p>'+
          '<w:r>'+
            '<w:rPr></w:rPr>'+
            '<w:t xml:space="preserve">You’ll learn</w:t>'+
          '</w:r>'+
        '</w:p>' +
        '<w:p>'+
          '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>' +
          '<w:r>'+
            '<w:t>Understand</w:t>'+
          '</w:r>' +
        '</w:p>'
        );
      });

      it('should convert HTML to DOCX xml 7: SIMPLE LIST', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul>');
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Milk</w:t></w:r></w:p>'
        );
      });

      it('should convert HTML to DOCX xml 8: NESTED LIST 1 level', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea<ul><li>Black tea</li><li>Green tea</li></ul></li><li>Milk</li></ul>');
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Black tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Green tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Milk</w:t></w:r></w:p>'
        );
      });

      it('should convert HTML to DOCX xml 9: NESTED LIST 2 level', function () {
        const _descriptor = html.parseHTML('<ul><li>Coffee</li><li>Tea<ul><li>Black tea</li><li>Green tea<ul><li>Dark Green</li><li>Soft Green</li><li>light Green</li></ul></li></ul></li><li>Milk</li></ul>');
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Coffee</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Black tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Green tea</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="2"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Dark Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="2"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Soft Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="2"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>light Green</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Milk</w:t></w:r></w:p>'
        );
      });

      it('should convert HTML to DOCX xml 10: LIST with malformed HTML (content between ul and li)', function () {
        const _descriptor = html.parseHTML('<ul>Hello 1<li>Coffee</li>Hello 2<li>Tea</li>Hello 3</ul>');
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '' +
          '<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">Hello 1</w:t></w:r></w:p>' + // simple text
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Coffee</w:t></w:r></w:p>' + // list
          '<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">Hello 2</w:t></w:r></w:p>' + // simple text 2
          '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Tea</w:t></w:r></w:p>' + // list
          '<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">Hello 3</w:t></w:r></w:p>' // simple text 3
        );
      });

      it('should convert HTML to DOCX xml 11', function () {
        const _descriptor = html.parseHTML('You will learn<br />');
        const _res = html.buildContentDOCX(_descriptor);
        helper.assert(_res, '<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">You will learn</w:t></w:r><w:br/></w:p>');
      });

      it('should convert HTML to DOCX xml 12 hyperlink simple', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io">Carbone Website</a>');
        const _res = html.buildContentDOCX(_descriptor, _options);
        helper.assert(_res, '' +
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

      it('should convert HTML to DOCX xml 13 hyperlink multiple', function () {
        const _options = {
          hyperlinkDatabase : new Map()
        };
        const _descriptor = html.parseHTML('<a href="carbone.io">Carbone Website</a><p><a href="carbone.io/documentation.html">Carbone Documentation</a></p><a href="carbone.io">Carbone Site Again</a>');
        const _res = html.buildContentDOCX(_descriptor, _options);
        helper.assert(_res, '' +
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
        helper.assert(html.buildContentDOCX(
          [
            { content : 'bold', type : '', tags : ['b'] },
            { content : 'and italic', type : '', tags : ['em'] }
          ]
        ),
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

        helper.assert(html.buildContentDOCX(
          [
            { content : 'this', type : '', tags : [] },
            { content : ' is a bold', type : '', tags : ['b'] },
            { content : 'and italic', type : '', tags : ['em'] },
            { content : ' text', type : '', tags : [] },
          ]
        ),'<w:p>'+
            '<w:r>' +
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
            '</w:r>' +
          '</w:p>'
        );
      });

      it('should return the DOCX XML content based on a descriptor and should skip unknown tags', function () {
        helper.assert(html.buildContentDOCX(
          [
            { content : 'this ', type : '', tags : ['div', 'b'] },
            { content : ' is a bold', type : '', tags : ['div', 'b', 'u'] },
            { content : '', type : '#PB#', tags : [] },
            { content : ' text ', type : '', tags : ['div', 'b', 'u', 'em'] },
            { content : 'and ', type : '', tags : ['div', 'b', 'em'] },
            { content : 'italic ', type : '', tags : ['div', 'b', 'em', 's'] },
            { content : '', type : '#PE#', tags : [] },
            { content : 'text', type : '', tags : ['div', 'b', 's'] },
            { content : '.', type : '', tags : [] },
          ]
        ),
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
              '<w:rPr></w:rPr>'+
              '<w:t xml:space="preserve">.</w:t>'+
            '</w:r>' +
          '</w:p>'
        );
      });

      it('should insert break line in the new content', function () {
        helper.assert(html.buildContentDOCX(
          [
            { content : 'This is ', type : '', tags : [] },
            { content : '', type : '#break#', tags : [] },
            { content : 'a tree', type : '', tags : ['i'] },
          ]
        ), '<w:p>'+
              '<w:r>' +
                '<w:rPr></w:rPr>' +
                '<w:t xml:space="preserve">This is </w:t>' +
              '</w:r>' +
            '<w:br/>' +
              '<w:r>' +
                '<w:rPr>' +
                  '<w:i/><w:iCs/>' +
                '</w:rPr>' +
                '<w:t xml:space="preserve">a tree</w:t>' +
              '</w:r>' +
            '</w:p>'
        );

        helper.assert(html.buildContentDOCX(
          [
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
          ]
        ),
        '<w:p>'+
            '<w:r>' +
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
          '</w:p>'+
          '<w:p/>' +
          '<w:p/>' +
          '<w:p/>' +
          '<w:p>'+
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve"> text</w:t>' +
            '</w:r>' +
            '<w:br/>' +
            '<w:r>' +
              '<w:rPr></w:rPr>' +
              '<w:t xml:space="preserve">.</w:t>' +
            '</w:r>' +
          '</w:p>'
        );

      });
    });

    describe('formatters/postProcessFormatters DOCX', function () {
      it('should add content element to htmlDatabase', () => {
        const _expected =  {
          id      : 0,
          content : '<w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">This is some content</w:t></w:r></w:p>'
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
          content : `<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">I have${String.fromCodePoint(160)}to creates bills in euro </w:t></w:r>` +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">€</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve">, Yen </w:t></w:r>' +
                    '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">¥</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve"> and Pound </w:t></w:r>' +
                    '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">£</w:t></w:r>' +
                    '<w:r><w:rPr></w:rPr><w:t xml:space="preserve">.</w:t></w:r></w:p>'
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
          content : '<w:p><w:r><w:rPr><w:i/><w:iCs/><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Apples are red</w:t></w:r>'+
                    '<w:br/><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve"> hello </w:t></w:r></w:p>',
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
        helper.assert(html.parseHTML('This is a simple text'), [ { content : 'This is a simple text', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', type : '', tags : ['b'] } ]);
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
        helper.assert(html.parseHTML('<btest content'), [ { content : '<btest content', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<   test')      , [ { content : '<   test', type : '', tags : [] } ]);
        helper.assert(html.parseHTML('<<b>Bold</b>')  , [ { content : 'Bold', type : '', tags : ['<b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b<>')  , [ { content : 'Bold', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</<b>')  , [ { content : 'Bold', type : '', tags : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</>b>')  , [ { content : 'Bold', type : '', tags : ['b'] }, { content : 'b>', type : '', tags : [] } ]);

        // missing opening tag
        helper.assert(html.parseHTML('test</b>content'), [ { content : 'test', type : '', tags : [] }, { content : 'content', type : '', tags : [] } ]);
      });

      it('should parse HTML content and return a descriptors [MIX without break line]', function () {
        helper.assert(html.parseHTML('<b><em>this is a bold and italic text</em></b>'), [ { content : 'this is a bold and italic text',  type : '', tags : ['b', 'em'] } ]);
        helper.assert(html.parseHTML('<b><u><s><em>this is a bold and italic text</em></s></u></b>'), [ { content : 'this is a bold and italic text',  type : '', tags : ['b', 'u', 's', 'em'] } ]);
        helper.assert(html.parseHTML('<li style="color:red;padding: 10px 2px 4px"><a href="carbone.io">This is a LINK</a></li>'),
          [
            { content : '',  type : '#AB#', href : 'carbone.io', tags : [] },
            { content : 'This is a LINK', type : '', tags : ['li'] },
            { content : '', type : '#AE#', tags : [] },
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
            { content : '"alpinism"', type : '', tags : ['u', 'b'] },
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
  });
});

