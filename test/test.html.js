const html = require('../lib/html');
const helper = require('../lib/helper');

describe.only('Dynamic HTML BOLD/ITALIC/UNDERLINED/STRIKED', function () {
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

    });
    describe('utils', function () {
      describe('parseStyleAndGetStyleList', () => {

      });
    });
  });
});

