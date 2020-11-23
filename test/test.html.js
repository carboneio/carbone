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

  });
  describe.only('Utils', function () {
    describe('parseHTML', function () {
      it('should parse HTML content and return a descriptors [SIMPLE]', function () {
        helper.assert(html.parseHTML('This is a simple text'), [ { content : 'This is a simple text', styles : [] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', styles : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold</b> content'), [ { content : 'Bold', styles : ['b'] }, { content : ' content', styles : [] } ]);
        helper.assert(html.parseHTML('Bold <b>content</b>'), [ { content : 'Bold ', styles : [] }, { content : 'content', styles : ['b'] } ]);
        helper.assert(html.parseHTML('Bold <b title="value1">content</b>'), [ { content : 'Bold ', styles : [] }, { content : 'content', styles : ['b'] } ]);
        helper.assert(html.parseHTML('<b style="color:red;margin:10px 20px" title="value2">Bold content</b>'), [ { content : 'Bold content', styles : ['b'] } ]);
        helper.assert(html.parseHTML('<b>Bold content</b>'), [ { content : 'Bold content', styles : ['b'] } ]);
        helper.assert(html.parseHTML('<i>Italic content</i>'), [ { content : 'Italic content', styles : ['i'] } ]);
        helper.assert(html.parseHTML('<s>Striked content</s>'), [ { content : 'Striked content', styles : ['s'] } ]);
        helper.assert(html.parseHTML('<p id="1234"> simple text </p>'), [ { content : ' simple text ', styles : ['p'] } ]);
      });

      it('should detect errors, starting or ending tag missing', function () {
        // Missing ending marker
        assert.throws(() => html.parseHTML('<b>Underlined content'), new Error('Invalid HTML tags: <b>'));
        assert.throws(() => html.parseHTML('<b>Underlined content</bold>'), new Error('Invalid HTML tags: <b> <bold>'));
        assert.throws(() => html.parseHTML('<bold>Underlined</b> content'), new Error('Invalid HTML tags: <bold> <b>'));
        assert.throws(() => html.parseHTML('<em><bold>Underlined </i> content</em>'), new Error('Invalid HTML tags: <bold> <i>'));
        // the HTML tag is missing a closing mark
        assert.throws(() => html.parseHTML('<btest content'), new Error('Invalid HTML tag: btest'));
        assert.throws(() => html.parseHTML('<   test'), new Error('Invalid HTML tag: '));
      });

      it('should parse HTML content and return a descriptors [MIX]', function () {
        helper.assert(html.parseHTML('<b><em>this is a bold and italic text</em></b>'), [ { content : 'this is a bold and italic text', styles : ['b', 'em'] } ]);
        helper.assert(html.parseHTML('<li style="color:red;padding: 10px 2px 4px">This is a <a href="">LINK</a></li>'),
          [
            { content : 'This is a ', styles : ['li'] },
            { content : 'LINK', styles : ['li', 'a'] }
          ]
        );
        helper.assert(html.parseHTML('<b>bold</b><em>and italic</em>'),
          [
            { content : 'bold', styles : ['b'] },
            { content : 'and italic', styles : ['em'] }
          ]
        );

        helper.assert(html.parseHTML('this<b> is a bold</b><em>and italic</em> text'),
          [
            { content : 'this', styles : [] },
            { content : ' is a bold', styles : ['b'] },
            { content : 'and italic', styles : ['em'] },
            { content : ' text', styles : [] },
          ]
        );

        helper.assert(html.parseHTML('this <b> is a bold </b> and <u><em>italic</em></u> text '),
          [
            { content : 'this ', styles : [] },
            { content : ' is a bold ', styles : ['b'] },
            { content : ' and ', styles : [] },
            { content : 'italic', styles : ['u', 'em'] },
            { content : ' text ', styles : [] },
          ]
        );

        helper.assert(html.parseHTML('<b>this is a bold<em>and italic</em> text</b>'),
          [
            { content : 'this is a bold', styles : ['b'] },
            { content : 'and italic', styles : ['b', 'em'] },
            { content : ' text', styles : ['b'] },
          ]
        );

        helper.assert(html.parseHTML('<b>this <u> is a bold<em> text </u>and <s>italic </em>text</b></s>.'),
          [
            { content : 'this ', styles : ['b'] },
            { content : ' is a bold', styles : ['b', 'u'] },
            { content : ' text ', styles : ['b', 'u', 'em'] },
            { content : 'and ', styles : ['b', 'em'] },
            { content : 'italic ', styles : ['b', 'em', 's'] },
            { content : 'text', styles : ['b', 's'] },
            { content : '.', styles : [] },
          ]
        );

        helper.assert(html.parseHTML('<div id="content"><em>This is a <strong>tree</strong> with a lot of fruits inside! <s>I really <strong>like</strong></s> and this is <b>wonderful</b>.</em></div>'),
          [
            { content : 'This is a ', styles : ['div', 'em'] },
            { content : 'tree', styles : ['div', 'em', 'strong'] },
            { content : ' with a lot of fruits inside! ', styles : ['div', 'em'] },
            { content : 'I really ', styles : ['div', 'em', 's'] },
            { content : 'like', styles : ['div', 'em', 's', 'strong'] },
            { content : ' and this is ', styles : ['div', 'em'] },
            { content : 'wonderful', styles : ['div', 'em', 'b'] },
            { content : '.', styles : ['div', 'em'] },
          ]
        );
      });

      it('should parse HTML content with break lines tags <br> [MIX]', function () {
        helper.assert(html.parseHTML('This is a<br>simple text.'),
          [
            { content : 'This is a', styles : [] },
            { content : '', styles : ['br'] } ,
            { content : 'simple text.', styles : [] }
          ]
        );
        helper.assert(html.parseHTML('This <br /> is</br>a<br>simple</br> text<br/>.'),
          [
            { content : 'This ', styles : [] },
            { content : '', styles : ['br'] } ,
            { content : ' is', styles : [] },
            { content : '', styles : ['br'] } ,
            { content : 'a', styles : [] },
            { content : '', styles : ['br'] } ,
            { content : 'simple', styles : [] },
            { content : '', styles : ['br'] },
            { content : ' text', styles : [] },
            { content : '', styles : ['br'] },
            { content : '.', styles : [] }
          ]
        );

        helper.assert(html.parseHTML('<u>Although the term <b>"alpinism"</b> </br>has become synonymous with <b>sporting <br> achievement</b>,<br/><em>pyreneism</em>,<br/>appearing in the <em><s>20th</s></em> 19th century</u>'),
          [
            { content : 'Although the term ', styles : ['u'] },
            { content : '"alpinism"', styles : ['u', 'b'] },
            { content : ' ', styles : ['u'] },
            { content : '', styles : ['br'] } ,
            { content : 'has become synonymous with ', styles : ['u'] },
            { content : 'sporting ', styles : ['u', 'b'] },
            { content : '', styles : ['br'] },
            { content : ' achievement', styles : ['u', 'b'] },
            { content : ',', styles : ['u'] },
            { content : '', styles : ['br'] },
            { content : 'pyreneism', styles : ['u', 'em'] },
            { content : ',', styles : ['u'] },
            { content : '', styles : ['br'] },
            { content : 'appearing in the ', styles : ['u'] },
            { content : '20th', styles : ['u', 'em', 's'] },
            { content : ' 19th century', styles : ['u'] }
          ]
        );
      });
    });
  });
});

