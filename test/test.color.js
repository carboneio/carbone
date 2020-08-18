const color = require('../lib/color');
const helper = require('../lib/helper');
const assert = require('assert');
const colorFormatters = require('../formatters/color');

describe('Dynamic colors', function () {
  describe('ODT Files', function () {
    describe('ODT/ODS pre processor methods', function () {
      describe('preProcessLo', function () {
        it('should insert a color marker and formatter from a single bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:sequence-decls><text:sequence-decl text:display-outline-level="0" text:name="Illustration"/><text:sequence-decl text:display-outline-level="0" text:name="Table"/><text:sequence-decl text:display-outline-level="0" text:name="Text"/><text:sequence-decl text:display-outline-level="0" text:name="Drawing"/><text:sequence-decl text:display-outline-level="0" text:name="Figure"/></text:sequence-decls><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, null, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = { colorStyleList : { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor' }] } } };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert a color marker and formatter from a single bindColor marker [ODS]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="ce1" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p>{bindColor(FF0000, #hexa) = d.color2}</text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default"><style:text-properties fo:color="#ff0000"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="{d.color2:updateColorAndGetReferenceLo(#ff0000, ce1)}" office:value-type="string" calcext:value-type="string"><text:p>{d.name}</text:p></table:table-cell></table:table-row><table:table-row table:style-name="ro1"><table:table-cell office:value-type="string" calcext:value-type="string"><text:p></text:p></table:table-cell><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {

          };
          const _expectedOptions = {
            colorStyleList : {
              ce1 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [{ color : '#ff0000', element : 'textColor', marker : 'd.color2', colorType : '#hexa' }]
              }
            }};
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert 2 color markers and formatters from a 2 bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.list[i].element:updateColorAndGetReferenceLo(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"><text:p text:style-name="P6"></text:p></text:p></office:text></office:body></office:document-content>';
          const _options = {};
          const _expectedOptions = { colorStyleList :
            {
              P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : '#hexa' }] },
              P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#0000ff', element : 'textColor', marker : 'd.list[i].element', colorType : '#hexa' }, { color : 'transparent', element : 'textBackgroundColor' } ] }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedXML);
          helper.assert(_options, _expectedOptions);
        });

        it('should insert 3 color inside the footer, header and content from a 3 bindColor marker [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P3"/><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}<text:p text:style-name="P6">{bindColor(00<text:span text:style-name="T2">00</text:span>ff, #hexa) = d.list[i].element}</text:p></text:p></office:text></office:body></office:document-content>'
            },
            {
              name : 'style.xml',
              data : '<office:document-styles><office:styles><style:default-style style:family="graphic"><style:graphic-properties svg:stroke-color="#3465a4" draw:fill-color="#729fcf" fo:wrap-option="no-wrap" draw:shadow-offset-x="0.3cm" draw:shadow-offset-y="0.3cm" draw:start-line-spacing-horizontal="0.283cm" draw:start-line-spacing-vertical="0.283cm" draw:end-line-spacing-horizontal="0.283cm" draw:end-line-spacing-vertical="0.283cm" style:flow-with-text="false"/><style:paragraph-properties style:text-autospace="ideograph-alpha" style:line-break="strict" style:font-independent-line-spacing="false"><style:tab-stops/></style:paragraph-properties><style:text-properties style:use-window-font-color="true" style:font-name="Liberation Serif" fo:font-size="12pt" fo:language="en" fo:country="GB" style:letter-kerning="true" style:font-name-asian="Songti SC" style:font-size-asian="10.5pt" style:language-asian="zh" style:country-asian="CN" style:font-name-complex="Arial Unicode MS" style:font-size-complex="12pt" style:language-complex="hi" style:country-complex="IN"/></style:default-style></office:styles><office:automatic-styles><style:style style:name="MP1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP2" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties style:line-height-at-least="0.492cm"/><style:text-properties fo:color="#000000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="transparent"/></style:style><style:style style:name="MP4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent"/></style:style><style:style style:name="MT1" style:family="text"><style:text-properties fo:color="#000000"/></style:style><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021"/></style:style><style:page-layout style:name="Mpm1"><style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" style:num-format="1" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm" style:writing-mode="lr-tb" style:layout-grid-color="#c0c0c0" style:layout-grid-lines="20" style:layout-grid-base-height="0.706cm" style:layout-grid-ruby-height="0.353cm" style:layout-grid-mode="none" style:layout-grid-ruby-below="false" style:layout-grid-print="false" style:layout-grid-display="false" style:footnote-max-height="0cm"><style:footnote-sep style:width="0.018cm" style:distance-before-sep="0.101cm" style:distance-after-sep="0.101cm" style:line-style="solid" style:adjustment="left" style:rel-width="25%" style:color="#000000"/></style:page-layout-properties><style:header-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-bottom="0.499cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-top="0.499cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="MP1">{d.name}</text:p><text:p text:style-name="MP2">{bindColor(ff0000, #hexa) = d.color1}</text:p></style:header><style:footer><text:p text:style-name="MP3">{d.lastname}</text:p><text:p text:style-name="MP3"/><text:p text:style-name="MP4"><text:span text:style-name="MT1">{bindColor(0000ff, </text:span><text:span text:style-name="MT2">h</text:span><text:span text:style-name="MT3">sl</text:span><text:span text:style-name="MT1">) = d.colo</text:span><text:span text:style-name="MT4">r</text:span><text:span text:style-name="MT3">6</text:span><text:span text:style-name="MT1">}</text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>'
            }]
          };
          const _expectedTemplate = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, P3)}"/><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, P4)}">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"><text:p text:style-name="P6"></text:p></text:p></office:text></office:body></office:document-content>'
            },
            {
              name : 'style.xml',
              data : '<office:document-styles><office:styles><style:default-style style:family="graphic"><style:graphic-properties svg:stroke-color="#3465a4" draw:fill-color="#729fcf" fo:wrap-option="no-wrap" draw:shadow-offset-x="0.3cm" draw:shadow-offset-y="0.3cm" draw:start-line-spacing-horizontal="0.283cm" draw:start-line-spacing-vertical="0.283cm" draw:end-line-spacing-horizontal="0.283cm" draw:end-line-spacing-vertical="0.283cm" style:flow-with-text="false"/><style:paragraph-properties style:text-autospace="ideograph-alpha" style:line-break="strict" style:font-independent-line-spacing="false"><style:tab-stops/></style:paragraph-properties><style:text-properties style:use-window-font-color="true" style:font-name="Liberation Serif" fo:font-size="12pt" fo:language="en" fo:country="GB" style:letter-kerning="true" style:font-name-asian="Songti SC" style:font-size-asian="10.5pt" style:language-asian="zh" style:country-asian="CN" style:font-name-complex="Arial Unicode MS" style:font-size-complex="12pt" style:language-complex="hi" style:country-complex="IN"/></style:default-style></office:styles><office:automatic-styles><style:style style:name="MP1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP2" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties style:line-height-at-least="0.492cm"/><style:text-properties fo:color="#000000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="MP3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0042d46d" fo:background-color="transparent"/></style:style><style:style style:name="MP4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="00443bac" fo:background-color="transparent"/></style:style><style:style style:name="MT1" style:family="text"><style:text-properties fo:color="#000000"/></style:style><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021"/></style:style><style:page-layout style:name="Mpm1"><style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" style:num-format="1" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm" style:writing-mode="lr-tb" style:layout-grid-color="#c0c0c0" style:layout-grid-lines="20" style:layout-grid-base-height="0.706cm" style:layout-grid-ruby-height="0.353cm" style:layout-grid-mode="none" style:layout-grid-ruby-below="false" style:layout-grid-print="false" style:layout-grid-display="false" style:footnote-max-height="0cm"><style:footnote-sep style:width="0.018cm" style:distance-before-sep="0.101cm" style:distance-after-sep="0.101cm" style:line-style="solid" style:adjustment="left" style:rel-width="25%" style:color="#000000"/></style:page-layout-properties><style:header-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-bottom="0.499cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-top="0.499cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="{d.color1:updateColorAndGetReferenceLo(#ff0000, .color2, #ffff00, MP1)}">{d.name}</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP3)}">{d.lastname}</text:p><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP3)}"/><text:p text:style-name="{d.color6:updateColorAndGetReferenceLo(#0000ff, null, transparent, MP4)}"><text:span text:style-name="MT1"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>'
            }]
          };
          const _options = {};
          const _expectedOptions = {
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  color     : '#ff0000',
                  element   : 'textColor',
                  marker    : 'd.color1',
                  colorType : '#hexa'
                }, {
                  color     : '#ffff00',
                  element   : 'textBackgroundColor',
                  marker    : 'd.color2',
                  colorType : '#hexa'
                }]
              },
              P4 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }]
              },
              MP1 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  color     : '#ff0000',
                  element   : 'textColor',
                  marker    : 'd.color1',
                  colorType : '#hexa'
                }, {
                  color     : '#ffff00',
                  element   : 'textBackgroundColor',
                  marker    : 'd.color2',
                  colorType : '#hexa'
                }]
              },
              MP3 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }]
              },
              MP4 : {
                file        : 'style.xml',
                styleFamily : 'paragraph',
                colors      : [{
                  color     : '#0000ff',
                  element   : 'textColor',
                  marker    : 'd.color6',
                  colorType : 'hsl'
                }, {
                  color   : 'transparent',
                  element : 'textBackgroundColor'
                }]
              }
            }
          };
          color.preProcessLo(_template, _options);
          helper.assert(_template.files[0].data, _expectedTemplate.files[0].data);
          helper.assert(_template.files[1].data, _expectedTemplate.files[1].data);
          helper.assert(_options, _expectedOptions);
        });

        it('should throw an error because it changes the text color and background color from 2 different lists [ODT]', function () {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.list[i].color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.list2[i].color2}</text:p></office:text></office:body></office:document-content>'
            }]
          };
          assert.throws(() => color.preProcessLo(_template, {  }), {
            message : "Carbone bindColor error: it is not possible to get the color binded to the following marker: 'd.list[i].color1'"
          });
        });
      });

      describe('getColorStyleListLo', function () {
        it('should not find any style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<xml><office:body></office:body></xml>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any color or background color attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1" style:family="text"><style:text-properties officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any FAMILLY attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should not find any NAME attribute on the style and return an empty colorStyleList', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="T1"><style:text-properties fo:color="#ff0000" officeooo:rsid="00174da5"/></style:style><style:style style:name="T2" style:family="text"><style:text-properties officeooo:rsid="0022fb00"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, {});
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal lowercase]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [text color only][bind color hexadecimal uppercase]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : 'FF0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
        it('should return a colorStyleList element that match a color in the bindColorList [background text color only]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:background-color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [ { color : '#ff0000',element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background color]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#ffff00', colorType : 'color', marker : 'd.color2' }];
          const _expectedColorListElement = { P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color2', colorType : 'color' } ] } };

          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element that match a color in the bindColorList [text + background + static color]', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P2" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#000000" officeooo:rsid="00200176" officeooo:paragraph-rsid="00200176"/></style:style><style:style style:name="P3" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" officeooo:rsid="00085328" officeooo:paragraph-rsid="00085328" fo:background-color="#ffff00"/></style:style><style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style>'
          };
          const _bindColorList = [
            { referenceColor : '#ff0000', colorType : '#hexa', marker : 'd.color1' },
            { referenceColor : '#000000', colorType : 'color', marker : 'd.color2' },
            { referenceColor : 'transparent', colorType : 'hsl', marker : 'd.list[i].color'}
          ];
          const _expectedColorListElement = {
            P2 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#000000', element : 'textColor', marker : 'd.color2', colorType : 'color' }]},
            P3 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : '#ff0000', element : 'textColor', marker : 'd.color1', colorType : '#hexa' }, { color : '#ffff00', element : 'textBackgroundColor' } ] },
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{ color : 'transparent', element : 'textBackgroundColor', marker : 'd.list[i].color', colorType : 'hsl' }, {color : '#0000ff', element : 'textColor' }]},
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the style contains a static text color)', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.color1' }];
          const _expectedColorListElement = {
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.color1', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor'}]}
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });

        it('should return a colorStyleList element with the color sorted (because the second color changed is a color from a list, but it needs to be the first color on the list)', function (done) {
          const _file = {
            name : 'content.xml',
            data : '<style:style style:name="P4" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#92AF11"/></style:style>'
          };
          const _bindColorList = [{ referenceColor : '#0000ff', colorType : '#hexa', marker : 'd.color1' }, { referenceColor : '#92AF11', colorType : '#hexa', marker : 'd.list[i].element' }];
          const _expectedColorListElement = {
            P4 : { file : 'content.xml', styleFamily : 'paragraph', colors : [{color : '#92AF11', element : 'textBackgroundColor', marker : 'd.list[i].element', colorType : '#hexa'}, {color : '#0000ff', element : 'textColor', marker : 'd.color1', colorType : '#hexa'}]}
          };
          const _colorStyleList = color.getColorStyleListLo(_file, _bindColorList);
          helper.assert(_colorStyleList, _expectedColorListElement);
          done();
        });
      });
    });

    describe('ODT/ODS post processor methods', function () {
      describe('postProcessLo', function () {
        it('should do nothing if template.xml does not exist', function (done) {
          const _fileContent = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/><text:p text:style-name="CC1">TMTC</text:p></office:text></office:body></office:document-content>';
          const _template = {
            files : [{
              name : 'random.xml',
              data : _fileContent
            }]
          };
          const _options = {
            colorDatabase  : new Map(),
            colorStyleList : [
              {
                file        : 'template.xml',
                styleName   : 'P3',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : '#hexa'
                  }
                ]
              }
            ]
          };
          _options.colorDatabase.set('#654321#ff0000#00ffff#ffff00P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : '#654321',
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _fileContent);
          done();
        });
        it('should do nothing if options.colorDatabase is empty', function (done) {
          const _data = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/><text:p text:style-name="CC1">TMTC</text:p></office:text></office:body></office:document-content>';
          const _template = {
            files : [{
              name : 'content.xml',
              data : _data
            }]
          };
          const _options = {
            colorDatabase : new Map()
          };
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _data);
          done();
        });
        it('should do nothing if option.colorStyleList is empty', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            colorDatabase  : new Map(),
            colorStyleList : {}
          };
          _options.colorDatabase.set('{r:255,g:0,b:255}#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : { r : 255, g : 0, b : 255 },
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace 1 text with a colortype hexa [ODS file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#fb02a2"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>';
          const _options = {
            extension      : 'ods',
            colorDatabase  : new Map(),
            colorStyleList : {
              Ce1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : '#hexa'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('#fb02a2#ff0000Ce1', {
            id        : 0,
            styleName : 'Ce1',
            colors    : [{
              newColor : '#fb02a2',
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace 1 text + static background + dynamic background with a multiple colortypes [ODS file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce4" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#069a2e"/><style:text-properties fo:color="#ff0000"/></style:style><style:style style:name="ce2" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#ffff00"/></style:style><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false" table:use-regular-expressions="false" table:use-wildcards="true"><table:iteration table:maximum-difference="0.0001"/></table:calculation-settings><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell><table:table-cell table:style-name="CC1" office:value-type="string" calcext:value-type="string"><text:p>Onduleur TMTC</text:p></table:table-cell><table:table-cell/><table:table-cell table:style-name="CC2" office:value-type="string" calcext:value-type="string"><text:p>Test</text:p></table:table-cell></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:scripts/><office:automatic-styles><style:style style:name="ce4" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#069a2e"/><style:text-properties fo:color="#ff0000"/></style:style><style:style style:name="ce2" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#ffff00"/></style:style><style:style style:name="ce3" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#729fcf"/><style:text-properties fo:color="#cccccc"/></style:style><style:style style:name="CC0" style:family="table-cell"><style:text-properties fo:color="#00ffff"/><style:table-cell-properties fo:background-color="#069a2e"/></style:style><style:style style:name="CC1" style:family="table-cell"><style:table-cell-properties fo:background-color="#537326"/></style:style><style:style style:name="CC2" style:family="table-cell"><style:text-properties fo:color="#ff00ff"/><style:table-cell-properties fo:background-color="#898900"/></style:style></office:automatic-styles><office:body><office:spreadsheet><table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false" table:use-regular-expressions="false" table:use-wildcards="true"><table:iteration table:maximum-difference="0.0001"/></table:calculation-settings><table:table table:name="Sheet1" table:style-name="ta1"><table:table-column table:style-name="co1" table:default-cell-style-name="Default"/><table:table-column table:style-name="co2" table:number-columns-repeated="3" table:default-cell-style-name="Default"/><table:table-row table:style-name="ro1"><table:table-cell table:style-name="CC0" office:value-type="string" calcext:value-type="string"><text:p>John Wick</text:p></table:table-cell><table:table-cell table:style-name="CC1" office:value-type="string" calcext:value-type="string"><text:p>Onduleur TMTC</text:p></table:table-cell><table:table-cell/><table:table-cell table:style-name="CC2" office:value-type="string" calcext:value-type="string"><text:p>Test</text:p></table:table-cell></table:table-row></table:table><table:named-expressions/></office:spreadsheet></office:body></office:document-content>';
          const _options = {
            extension      : 'ods',
            colorDatabase  : new Map(),
            colorStyleList : {
              Ce4 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#ff0000',
                    element   : 'textColor',
                    marker    : 'd.color2',
                    colorType : '#hexa' },
                  { color : '#069a2e', element : 'textBackgroundColor' }
                ]
              },
              Ce2 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#ffff00',
                    element   : 'textBackgroundColor',
                    marker    : 'd.color6',
                    colorType : 'hsl' }
                ]
              },
              Ce3 : {
                file        : 'content.xml',
                styleFamily : 'table-cell',
                colors      : [
                  { color     : '#cccccc',
                    element   : 'textColor',
                    marker    : 'd.color5',
                    colorType : 'rgb' },
                  { color     : '#729fcf',
                    element   : 'textBackgroundColor',
                    marker    : 'd.color3',
                    colorType : 'color' }
                ]
              }
            }
          };
          _options.colorDatabase.set('#00ffff#ff0000null#069a2ece4', {
            id        : 0,
            styleName : 'Ce4',
            colors    : [
              { newColor : '#00ffff', oldColor : '#ff0000' },
              { newColor : 'null', oldColor : '#069a2e' }
            ]
          });
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#ffff00ce2', {
            id        : 1,
            styleName : 'Ce2',
            colors    : [
              { newColor : { h : 85, s : 50, l : 30 }, oldColor : '#ffff00' }
            ]
          });
          _options.colorDatabase.set('{"r":255,"g":0,"b":255}#ccccccdarkYellow#729fcfce3', {
            id        : 2,
            styleName : 'Ce3',
            colors    : [
              { newColor : { r : 255, g : 0, b : 255 }, oldColor : '#cccccc' },
              { newColor : 'darkYellow', oldColor : '#729fcf' }
            ]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should replace 1 text with a colortype RGB [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff00ff" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('{r:255,g:0,b:255}#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : { r : 255, g : 0, b : 255 },
              oldColor : '#ff0000',
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should use the old Color because the new color is undefined (returned by the builder) [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#ff0000" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P3 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textColor',
                    colorType : 'rgb'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('undefined#ff0000P3', {
            id        : 0,
            styleName : 'P3',
            colors    : [{
              newColor : undefined,
              oldColor : '#ff0000'
            }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('should replace 1 background color with a colortype HSL [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="T6" style:family="text"><style:text-properties officeooo:rsid="002be796"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:background-color="#537326" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick<text:span text:style-name="T1"></text:span></text:p><text:p text:style-name="CC0"/></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color     : '#ff0000',
                    element   : 'textBackgroundColor',
                    colorType : 'hsl'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#0000ffP1', {
            id        : 0,
            styleName : 'P1',
            colors    : [{
              newColor : { h : 85, s : 50, l : 30 },
              oldColor : '#ff0000' }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });
        it('replace 1 text + background color + static color [ODT file]', function (done) {
          const _template = {
            files : [{
              name : 'content.xml',
              data : '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>'
            }]
          };
          const _expectedData = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#0000ff" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="transparent"/></style:style><style:style style:name="P6" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="#ff0000" style:font-name="Liberation Serif" fo:font-size="12pt" fo:font-weight="normal" officeooo:rsid="0025a382" officeooo:paragraph-rsid="0025a382" fo:background-color="#ffff00" style:font-size-asian="12pt" style:font-size-complex="12pt"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#654321" fo:background-color="#00ffff" /></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#537326" fo:background-color="transparent" /></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="CC1"/><text:p text:style-name="CC1">Onduleur TMTC</text:p></office:text></office:body></office:document-content>';
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              P6 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color : '#ff0000', element : 'textColor', colorType : '#hexa'
                  },
                  {
                    color : '#ffff00', element : 'textBackgroundColor', colorType : '#hexa'
                  }
                ]
              },
              P1 : {
                file        : 'content.xml',
                styleFamily : 'paragraph',
                colors      : [
                  {
                    color : '#0000ff', element : 'textColor', colorType : 'hsl'
                  },
                  {
                    color : 'transparent', element : 'textBackgroundColor'
                  }
                ]
              }
            }
          };
          _options.colorDatabase.set('#654321#ff0000#00ffff#ffff00P6', {
            id        : 0,
            styleName : 'P6',
            colors    : [
              { newColor : '#654321', oldColor : '#ff0000' },
              { newColor : '#00ffff', oldColor : '#ffff00'}
            ]
          });
          _options.colorDatabase.set('{"h":85,"s":50,"l":30}#0000ffnulltransparentP1', {
            id        : 1,
            styleName : 'P1',
            colors    : [
              { newColor : { h : 85, s : 50, l : 30 }, oldColor : '#0000ff'},
              { newColor : 'null', oldColor : 'transparent' }]
          });
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedData);
          done();
        });

        it('should insert styles in different files: style.xml (Header + Footer) and content.xml', function () {
          const _options = {
            extension      : 'odt',
            colorDatabase  : new Map(),
            colorStyleList : {
              MP1 : {
                file        : 'styles.xml',
                styleFamily : 'paragraph',
                colors      : [
                  { color : '#ff0000', element : 'textColor', marker : 'd.color2', colorType : '#hexa' },
                  { color : '#ffff00', element : 'textBackgroundColor', marker : 'd.color4', colorType : 'color' }
                ]
              },
              MP3 : {
                file        : 'styles.xml',
                styleFamily : 'paragraph',
                colors      : [
                  { color : '#0000ff', element : 'textColor', marker : 'd.color5', colorType : 'rgb' },
                  { color : 'transparent', element : 'textBackgroundColor' }
                ]
              }
            }
          };
          _options.colorDatabase.set('#00ffff#ff0000red#ffff00MP1', {
            id        : 0,
            styleName : 'MP1',
            colors    : [ { newColor : '#00ffff', oldColor : '#ff0000' }, { newColor : 'red', oldColor : '#ffff00' } ]
          });
          _options.colorDatabase.set('{"r":255,"g":0,"b":255}#0000ffnulltransparentMP3', {
            id        : 1,
            styleName : 'MP3',
            colors    : [ { newColor : {r : 255, g : 0, b : 255}, oldColor : '#0000ff' }, { newColor : 'null', oldColor : 'transparent' } ]
          });
          const _expectedTemplateXml = '<office:document-content><office:automatic-styles><style:style style:name="T2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382"/></style:style><style:style style:name="T3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0038d1ca"/></style:style><style:style style:name="T4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3"/></style:style></office:automatic-styles><office:body><office:text></office:text></office:body></office:document-content>';
          const _expectedStyleXml = '<office:document-styles><office:automatic-styles><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="00497cc0" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT5" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="CC0" style:family="paragraph"><style:text-properties fo:color="#00ffff" fo:background-color="#ff0000" /></style:style><style:style style:name="CC1" style:family="paragraph"><style:text-properties fo:color="#ff00ff" fo:background-color="transparent" /></style:style></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="CC1">Onduleur TMTC</text:p><text:p text:style-name="CC1"/><text:p text:style-name="MP4"><text:span text:style-name="MT2"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>';
          const _template = {
            files : [{
              name : 'content.xml',
              data : _expectedTemplateXml
            },
            {
              name : 'styles.xml',
              data : '<office:document-styles><office:automatic-styles><style:style style:name="MT2" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="0025a382" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT3" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003783b3" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT4" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="00497cc0" fo:background-color="transparent" loext:char-shading-value="0"/></style:style><style:style style:name="MT5" style:family="text"><style:text-properties fo:color="#000000" officeooo:rsid="003fb021" fo:background-color="transparent" loext:char-shading-value="0"/></style:style></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Mpm1"><style:header><text:p text:style-name="CC0">John Wick</text:p><text:p text:style-name="MP2"></text:p></style:header><style:footer><text:p text:style-name="CC1">Onduleur TMTC</text:p><text:p text:style-name="CC1"/><text:p text:style-name="MP4"><text:span text:style-name="MT2"></text:span></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>'
            }]
          };
          color.postProcessLo(_template, null, _options);
          helper.assert(_template.files[0].data, _expectedTemplateXml);
          helper.assert(_template.files[1].data, _expectedStyleXml);
          // console.log(_template.files[1].data);
        });
      });

      describe('getColorTagPropertiesLo', function () {
        it('should return the color properties from a colorStyleList', function () {
          const _colorTag =  {
            P6 : {
              styleFamily : 'paragraph',
              colors      : [
                {
                  color : '#ff0000', element : 'textColor', colorType : '#hexa'
                },
                {
                  color : '#ffff00', element : 'textBackgroundColor', colorType : 'hsl'
                }
              ]
            },
          };
          helper.assert(color.getColorTagPropertiesLo('#ff0000', _colorTag.P6.colors), {
            element   : 'textColor',
            colorType : '#hexa'
          });
          helper.assert(color.getColorTagPropertiesLo('#ffff00', _colorTag.P6.colors), {
            element   : 'textBackgroundColor',
            colorType : 'hsl'
          });
        });

        it('should return an empty color property object if the colors array is empty', function () {
          helper.assert(color.getColorTagPropertiesLo('#ff0000', []), {});
        });
      });
    });

    describe('ODS/ODT post process formatters', function () {
      describe('updateColorAndGetReferenceLo + addColorDatabase + getNewColorReferencePostProcessingLo', function () {
        it('should save in the colorDatabase Map the color Pair, generate a unique ID and return a new color reference', function () {
          const _options = {
            colorDatabase : new Map()
          };
          const _postProcess = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['#ff0000', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('#ff000038A291P1'), true);
          helper.assert(_options.colorDatabase.get('#ff000038A291P1'),
            {
              id     : 0,
              colors : [
                {
                  newColor : '#ff0000',
                  oldColor : '38A291'
                }
              ],
              styleName : 'P1'
            });
          const _colorReference = _postProcess.fn.apply(_options, _postProcess.args);
          helper.assert(_colorReference, 'CC0');
        });
        it('should save in the colorDatabase Map multiple color pair (rgb + hsl + static color), generate a unique IDs and return color references', function () {
          const _options = {
            colorDatabase : new Map()
          };
          // First Color
          const _postProcess1 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['ff0000', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('ff000038A291P1'), true);
          helper.assert(_postProcess1.fn.apply(_options, _postProcess1.args), 'CC0');
          // Second Color
          const _postProcess2 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [{r : 0, g : 255, b : 0 }, '0000ff', 'P2']);
          helper.assert(_options.colorDatabase.has('{"r":0,"g":255,"b":0}0000ffP2'), true);
          helper.assert(_options.colorDatabase.get('{"r":0,"g":255,"b":0}0000ffP2'),
            {
              id     : 1,
              colors : [
                {
                  newColor : {
                    r : 0,
                    g : 255,
                    b : 0
                  },
                  oldColor : '0000ff'
                }
              ],
              styleName : 'P2'
            });
          helper.assert(_postProcess2.fn.apply(_options, _postProcess2.args), 'CC1');
          // Third Color
          const _postProcess3 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [{h : 300, s : 100, l : 20 }, '12e2ff', 'P3']);
          helper.assert(_options.colorDatabase.has('{"h":300,"s":100,"l":20}12e2ffP3'), true);
          helper.assert(_options.colorDatabase.get('{"h":300,"s":100,"l":20}12e2ffP3'),
            {
              id     : 2,
              colors : [
                {
                  newColor : {
                    h : 300,
                    s : 100,
                    l : 20
                  },
                  oldColor : '12e2ff'
                }
              ],
              styleName : 'P3'
            });
          helper.assert(_postProcess3.fn.apply(_options, _postProcess3.args), 'CC2');
          // Fourth Color
          const _postProcess4 = colorFormatters.updateColorAndGetReferenceLo.apply(_options, [null, 'ff00ff', 'Ce2']);
          helper.assert(_options.colorDatabase.has('nullff00ffCe2'), true);
          helper.assert(_options.colorDatabase.get('nullff00ffCe2'),
            {
              id     : 3,
              colors : [
                {
                  newColor : null,
                  oldColor : 'ff00ff'
                }
              ],
              styleName : 'Ce2'
            });
          helper.assert(_postProcess4.fn.apply(_options, _postProcess4.args), 'CC3');
        });
        it('should save in the colorDatabase Map the color Pair even if the builder return the error "[[C_ERROR]]"', function () {
          const _options = {
            colorDatabase : new Map()
          };
          const _postProcess = colorFormatters.updateColorAndGetReferenceLo.apply(_options, ['[[C_ERROR]]', '38A291', 'P1']);
          helper.assert(_options.colorDatabase.has('38A291P1'), true);
          helper.assert(_options.colorDatabase.get('38A291P1'),
            {
              id     : 0,
              colors : [
                {
                  newColor : '',
                  oldColor : '38A291'
                }
              ],
              styleName : 'P1'
            });
          const _colorReference = _postProcess.fn.apply(_options, _postProcess.args);
          helper.assert(_colorReference, 'CC0');
        });
      });
    });
  });

  describe('DOCX', function () {
    describe('preprocess docx', function () {
      it ("should do nothing if the xml doesn't contain bindColor markers", function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : _expectedXML
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should replace a text background color with a marker + formatter', function () {
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it ('should throw an error if the color format is not defined to "color" for the background color', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, hsl) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };

        assert.throws(
          () => {
            color.preProcessDocx(_template);
          },
          {
            message : 'Carbone bindColor warning: the background color on DOCX documents can only be changed with the color name format, use the color format "color" instead of "hsl".',
          }
        );

      });

      it('should replace 2 text colors and a background color with a marker + formatter', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="FF0000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(ff0000, #hexa) = d.color1}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr><w:rFonts w:eastAsia="Songti SC" w:cs="Arial Unicode MS"/><w:b w:val="false"/><w:color w:val="000000"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB" w:eastAsia="zh-CN" w:bidi="hi-IN"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>, color) = d.color3}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="0000FF"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="0000FF"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>{bindColor(</w:t></w:r><w:r><w:rPr></w:rPr><w:t>0000ff</w:t></w:r><w:r><w:rPr></w:rPr><w:t>, hsl) = d.color6}</w:t></w:r></w:p></w:body></w:document>'
          }]
        };
        const _expectedXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Liberation Serif" w:hAnsi="Liberation Serif"/><w:b w:val="false"/><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color1:getAndConvertColorDocx(#hexa, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:r><w:rPr><w:b w:val="false"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t></w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="false"/><w:color w:val="{d.color6:getAndConvertColorDocx(hsl, textColor)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{d.lastname}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:spacing w:lineRule="atLeast" w:line="279"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>';
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedXML);
      });

      it('should replace colors in the header and footer', function () {
        const _template = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p w14:paraId="7E72D57D" w14:textId="77777777" w:rsidR="00D57CD1" w:rsidRDefault="00B14014"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>(</w:t></w:r><w:proofErr w:type="gramEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>yellow</w:t></w:r><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">, </w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>color</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>) = d.color3}</w:t></w:r></w:p></w:body></w:document>'
          },
          {
            name : 'word/header2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr><w:p w14:paraId="769384A4" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr></w:pPr></w:p><w:p w14:paraId="095A1BDF" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr></w:pPr></w:p><w:p w14:paraId="5483BD9B" w14:textId="50FC70D8" w:rsidR="00870089" w:rsidRPr="00B3635C" w:rsidRDefault="00870089" w:rsidP="00B3635C"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t>{d.name}</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:proofErr w:type="gramStart"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>(</w:t></w:r><w:proofErr w:type="gramEnd"/><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>ff0000, #hexa) = d.color</w:t></w:r><w:r w:rsidR="00583D40"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>2</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t>}</w:t></w:r></w:p><w:p w14:paraId="7FEDA80B" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Header"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:hdr>'
          },
          {
            name : 'word/footer2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr><w:p w14:paraId="228A1212" w14:textId="3F11F73D" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>d.lastname</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>}</w:t></w:r><w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:t>bindColor</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:t xml:space="preserve">(0000ff, </w:t></w:r><w:r w:rsidR="00656DC2"><w:t>color</w:t></w:r><w:r><w:t>) = d.</w:t></w:r><w:r w:rsidR="00A150F9"><w:t>color</w:t></w:r><w:r w:rsidR="00656DC2"><w:t>4</w:t></w:r><w:r w:rsidR="00A150F9"><w:t xml:space="preserve"></w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w14:paraId="04E41FC2" w14:textId="77777777" w:rsidR="00870089" w:rsidRPr="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr></w:p><w:p w14:paraId="0E3F20E9" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Footer"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:ftr>'
          }]
        };

        const _expectedTemplate = {
          files : [{
            name : 'word/document.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p w14:paraId="7E72D57D" w14:textId="77777777" w:rsidR="00D57CD1" w:rsidRDefault="00B14014"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r></w:p></w:body></w:document>'
          },
          {
            name : 'word/header2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr><w:p w14:paraId="769384A4" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr></w:p><w:p w14:paraId="095A1BDF" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr></w:pPr></w:p><w:p w14:paraId="5483BD9B" w14:textId="50FC70D8" w:rsidR="00870089" w:rsidRPr="00B3635C" w:rsidRDefault="00870089" w:rsidP="00B3635C"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t>{d.name}</w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="{d.color2:getAndConvertColorDocx(#hexa, textColor)}"/><w:highlight w:val="{d.color3:getAndConvertColorDocx(color, textBackgroundColor)}"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r w:rsidR="00B3635C"><w:rPr><w:color w:val="000000"/></w:rPr><w:t></w:t></w:r></w:p><w:p w14:paraId="7FEDA80B" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Header"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:hdr>'
          },
          {
            name : 'word/footer2.xml',
            data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr><w:p w14:paraId="228A1212" w14:textId="3F11F73D" w:rsidR="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t>{</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t>d.lastname</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t>}</w:t></w:r><w:r><w:rPr><w:color w:val="{d.color4:getAndConvertColorDocx(color, textColor)}"/></w:rPr><w:t xml:space="preserve"></w:t></w:r><w:r><w:t></w:t></w:r></w:p><w:p w14:paraId="04E41FC2" w14:textId="77777777" w:rsidR="00870089" w:rsidRPr="00870089" w:rsidRDefault="00870089" w:rsidP="00870089"><w:pPr><w:spacing w:line="279" w:lineRule="atLeast"/></w:pPr></w:p><w:p w14:paraId="0E3F20E9" w14:textId="77777777" w:rsidR="00870089" w:rsidRDefault="00870089"><w:pPr><w:pStyle w:val="Footer"/><w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr></w:pPr></w:p></w:ftr>'
          }]
        };
        color.preProcessDocx(_template);
        helper.assert(_template.files[0].data, _expectedTemplate.files[0].data);
        helper.assert(_template.files[1].data, _expectedTemplate.files[1].data);
        helper.assert(_template.files[2].data, _expectedTemplate.files[2].data);
      });

    });

    describe('DOCX formatter methods', function () {
      describe('getAndConvertColorDocx', function () {
        // convert the color as RGB
        it('should convert the RGB color to an hexadecimal color', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, [{ r : 255, g : 255, b : 0}, 'rgb', 'textColor']), 'ffff00');
        });
        it('should convert the color name to an hexadecimal color', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, ['red', 'color', 'textColor']), 'ff0000');
        });
        it('should return an empty string if the new color is undefined', function () {
          helper.assert(colorFormatters.getAndConvertColorDocx.apply({}, [undefined, 'color', 'textColor']), '');
        });
      });
    });
  });

  describe('utils', function () {
    describe('getBindColorMarkers', function () {

      it('should do nothing without bindColor marker', function (done) {
        const _file = {
          name : 'content.xml',
          data : '<style:style style:name="T11" style:family="text"><style:text-properties officeooo:rsid="00373c34"/></style:style>'
        };
        const _xmlContent = '<style:style style:name="T11" style:family="text"><style:text-properties officeooo:rsid="00373c34"/></style:style>';

        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlContent);
        helper.assert(_bindColorArray.length, 0);
        done();
      });

      it('should do nothing without if the file is undefined or the file data is undefined', function (done) {
        let _bindColorArray = color.getBindColorMarkers(undefined);
        helper.assert(_bindColorArray.length, 0);
        _bindColorArray = color.getBindColorMarkers({
          name : 'content.xml',
          data : null
        });
        helper.assert(_bindColorArray.length, 0);
        done();
      });

      it('should return a single bindColor element and should clean the xml [single]', function (done) {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        const _xmlExpectedContent = '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6"></text:p></office:text>';
        const _expectedBindColorList = [{ referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }];

        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlExpectedContent);
        helper.assert(_bindColorArray, _expectedBindColorList);
        done();
      });

      it('should return a bindColor elements and should clean the xml [list]', function (done) {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2">{bindColor(ff<text:span text:style-name="T2">00</text:span>00, #hexa) = d.color1}</text:p><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, color) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        const _xmlExpectedContent = '<office:text><text:p text:style-name="P3">{d.<text:span text:style-name="T1">name</text:span>}</text:p><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P2"></text:p><text:p text:style-name="P5"></text:p><text:p text:style-name="P6"></text:p></office:text>';
        const _expectedBindColorList = [
          { referenceColor : 'ff0000', colorType : '#hexa', marker : 'd.color1' },
          { referenceColor : 'ffff00', colorType : 'color', marker : 'd.color2' },
          { referenceColor : '0000ff', colorType : 'hsl', marker : 'd.color6' }
        ];
        const _bindColorArray = color.getBindColorMarkers(_file);
        helper.assert(_file.data, _xmlExpectedContent);
        helper.assert(_bindColorArray, _expectedBindColorList);
        done();
      });

      it('should return an error if bindColor is invalid', function () {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff<text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "{bindColor(0000ffhsl)=d.color6}".',
        });
      });

      it('should throw an error if the bindColor marker is invalid, should clean the XML and should return an empty bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">hsl</text:span>) = color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: the marker is not valid "color6".',
        });
      });

      it('should throw an error if the bindColor color type does not exist, should clean the XML and should return an empty bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P4">{d.lastname}</text:p><text:p text:style-name="P6">{bindColor(0000ff, <text:span text:style-name="T11">doesnotExist</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".',
        });
      });

      it('should throw an error if the color has already been defined to be replace in a previous bindColor statement, should clean the XML and should return a single element on bindColorArray', function () {
        const _file = {
          name : 'content.xml',
          data : '<office:text><text:p text:style-name="P5">{bindColor(ff<text:span text:style-name="T3">ff</text:span>00, #hexa) = d.color<text:span text:style-name="T3">2</text:span>}</text:p><text:p text:style-name="P6">{bindColor(ffff00, <text:span text:style-name="T11">hsl</text:span>) = d.color<text:span text:style-name="T11">6</text:span>}</text:p></office:text>'
        };
        assert.throws(() => {
          color.getBindColorMarkers(_file, () => {});
        }, {
          message : 'Carbone bindColor warning: 2 bindColor markers try to edit the same color "ffff00".',
        });
      });
    });

    describe('Color format converters', function () {
      // color converters - #hexa
      it('["#hexa": #HEXA => #HEXA] should return an #hexa color from the color format "#hexa" and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter['#hexa']('#FF21A3', 'odt'), '#FF21A3');
        helper.assert(color.colorFormatConverter['#hexa']('#FF0000', 'odt'), '#FF0000');
        // DOCX
        helper.assert(color.colorFormatConverter['#hexa']('#FF21A3', 'docx'), 'FF21A3');
        helper.assert(color.colorFormatConverter['#hexa']('#FF0000', 'docx'), 'FF0000');
      });
      it('["hexa": HEXA => #HEXA] should return an #hexa color from the color format "hexa"  and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.hexa('FF21A3', 'odt'), '#FF21A3');
        helper.assert(color.colorFormatConverter.hexa('FF0000', 'odt'), '#FF0000');
        helper.assert(color.colorFormatConverter.hexa('A0B8F1', 'odt'), '#A0B8F1');
        // DOCX
        helper.assert(color.colorFormatConverter.hexa('FF21A3', 'docx'), 'FF21A3');
        helper.assert(color.colorFormatConverter.hexa('FF0000', 'docx'), 'FF0000');
        helper.assert(color.colorFormatConverter.hexa('A0B8F1', 'docx'), 'A0B8F1');
      });
      it('["rgb": RGB => #HEXA] should return an #hexa color from a RGB object format  and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.rgb({r : 19, g : 200, b : 149}, 'odt'), '#13c895');
        helper.assert(color.colorFormatConverter.rgb({r : 200, g : 140, b : 250}, 'odt'), '#c88cfa');
        helper.assert(color.colorFormatConverter.rgb({r : 0, g : 0, b : 255}, 'odt'), '#0000ff');
        // DOCX
        helper.assert(color.colorFormatConverter.rgb({r : 19, g : 200, b : 149}, 'docx'), '13c895');
        helper.assert(color.colorFormatConverter.rgb({r : 200, g : 140, b : 250}, 'docx'), 'c88cfa');
        helper.assert(color.colorFormatConverter.rgb({r : 0, g : 0, b : 255}, 'docx'), '0000ff');
      });
      it('["hsl": HSL => #HEXA] should return an #hexa color from a HSL object format  and the report type', function () {
        // ==== ODT
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 100, l : 50}, 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 142, s : 80, l : 20}, 'odt'), '#0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 300, s : 15, l : 80}, 'odt'), '#d4c4d4');
        // Ratio [0-1/0-1/0-1]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 1, l : 0.5}, 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 0.39444, s : 0.8, l : 0.2}, 'odt'), '#0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 0.8333, s : 0.15, l : 0.80}, 'odt'), '#d4c4d4');

        // ==== DOCX
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 100, l : 50}, 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 142, s : 80, l : 20}, 'docx'), '0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 300, s : 15, l : 80}, 'docx'), 'd4c4d4');
        // Ratio [0-1/0-1/0-1]
        helper.assert(color.colorFormatConverter.hsl({h : 0, s : 1, l : 0.5}, 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.hsl({h : 0.39444, s : 0.8, l : 0.2}, 'docx'), '0a5c28');
        helper.assert(color.colorFormatConverter.hsl({h : 0.8333, s : 0.15, l : 0.80}, 'docx'), 'd4c4d4');
      });
      // color converters - colors
      it('["color" method: COLOR => #HEXA OR COLOR] should return an #hexa color or a color name from a color name and the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.color('blue', 'odt'), '#0000ff');
        helper.assert(color.colorFormatConverter.color('magenta', 'odt'), '#ff00ff');
        helper.assert(color.colorFormatConverter.color('yellow', 'odt'), '#ffff00');
        // DOCX
        helper.assert(color.colorFormatConverter.color('blue', 'docx'), '0000ff');
        helper.assert(color.colorFormatConverter.color('magenta', 'docx'), 'ff00ff');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx'), 'ffff00');
        // DOCX
        helper.assert(color.colorFormatConverter.color('blue', 'docx', color.elementTypes.TEXT_COLOR), '0000ff');
        helper.assert(color.colorFormatConverter.color('green', 'docx', color.elementTypes.TEXT_COLOR), '00ff00');
        helper.assert(color.colorFormatConverter.color('blue', 'docx', color.elementTypes.TEXT_BG_COLOR), 'blue');
        helper.assert(color.colorFormatConverter.color('magenta', 'docx', color.elementTypes.TEXT_BG_COLOR), 'magenta');
        helper.assert(color.colorFormatConverter.color('yellow', 'docx', color.elementTypes.TEXT_BG_COLOR), 'yellow');
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [1].', function () {
        assert.throws(() => color.colorFormatConverter.color('greem', 'docx'), {
          message : 'Carbone bindColor warning: the color "greem" does not exist. Do you mean "green"?'
        });
      });

      it('["color" method] should throw an error if the color name does not exist and should find an alternative color [2].', function () {
        assert.throws(() => color.colorFormatConverter.color('darkGrey', 'docx'), {
          message : 'Carbone bindColor warning: the color "darkGrey" does not exist. Do you mean "darkGray"?'
        });
      });

      // color converters - hslToRGB
      it('["hslToRgb": HSL => RGB] should return a RGB color from a HSL object format', function () {
        // Ratio [0-360/0-100/0-100]
        helper.assert(color.colorFormatConverter.hslToRgb({h : 0, s : 100, l : 0}), {r : 0, g : 0, b : 0});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 0, s : 100, l : 50}), {r : 255, g : 0, b : 0});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 142, s : 80, l : 20}), {r : 10, g : 92, b : 40});
        helper.assert(color.colorFormatConverter.hslToRgb({h : 300, s : 15, l : 80}), {r : 212, g : 196, b : 212});
      });

      it('[manageHexadecimalHashtag] should return the hexadecimal with OR without hashtag based on the report type', function () {
        // ODT
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000', 'odt'), '#ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b', 'odt'), '#ff238b');
        // DOCX
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000', 'docx'), 'ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b', 'docx'), 'ff238b');
        // Without report type
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff0000'), 'ff0000');
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag('ff238b'), 'ff238b');
        // Random
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(undefined, 'odt'), undefined);
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(null), null);
        helper.assert(color.colorFormatConverter.manageHexadecimalHashtag(undefined), undefined);
      });
    });
  });
});
