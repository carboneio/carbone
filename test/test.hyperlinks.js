const carbone    = require('../lib/index');
const helper     = require('./helper');
const hyperlinks = require('../lib/hyperlinks');
const hyperlinksFormatters = require('../formatters/hyperlinks');

describe.only('Hyperlinks - It Injects Hyperlinks to elements (texts/images/tables) for ODS, ODT, DOCX and XLSX templates. It convert unicode characters to ascii characters or setup post process formatters', function () {

  it('[ODT/ODS] should not do anything if the link is not a "<draw:a>" or "<text:a>"', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : 'xlink:href="This is some text that should not be displayed here%7Bd.url%7D"'
      }]
    };
    const _expectedResult = 'xlink:href="This is some text that should not be displayed here%7Bd.url%7D"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should correct a xlink:href unicode to ascii and remove incorrect text before with only one Carbone marker', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : '<draw:a xlink:href="This is some text that should not be displayed here%7Bd.url%7D"'
      }]
    };
    const _expectedResult = '<draw:a xlink:href="{d.url:validateURL}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should correct a xlink:href unicode to ascii and remove incorrect text after only one Carbone marker', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : '<text:a xlink:type="simple" xlink:href="%7Bd.url%7DThis is some text that should not be displayed here"'
      }]
    };
    const _expectedResult = '<text:a xlink:type="simple" xlink:href="{d.url:validateURL}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should accept multiple Carbone markers and clean the supplementary text between markers', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : '<text:a xlink:href="file:///Users/Documents/carbone-test/hyperlink/hyperlink-odt/%7Bd.url%7Dthis is some textThis is again some text"'
      }]
    };
    const _expectedResult = '<text:a xlink:href="{d.url:validateURL}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should insert an hyperlink marker to a XML', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : ''
          + '<text:p text:style-name="P1">'
          +  '<text:a xlink:type="simple" xlink:href="file:///Users/steevep/Documents/projets/pro/carbone-test-pack/hyperlink/hyperlink-odt/unzip-without/%7Bd.url%7D" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.firstname}</text:a>'
          + '</text:p>'
      }]
    };
    const _expectedResult = ''
      + '<text:p text:style-name="P1">'
      +  '<text:a xlink:type="simple" xlink:href="{d.url:validateURL}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.firstname}</text:a>'
      + '</text:p>';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should insert hyperlinks markers into tables', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : ''
        + '<table:table table:name="Table1" table:style-name="Table1">'
        + '<table:table-column table:style-name="Table1.A"/>'
        + '<table:table-column table:style-name="Table1.B"/>'
        + '<table:table-row>'
        + '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'
        + '<text:p text:style-name="P2">'
        + '<text:a xlink:type="simple" xlink:href="../%7Bd.list%5Bi%5D.url%7D" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].name}</text:a>'
        + '</text:p>'
        + '</table:table-cell>'
        + '<table:table-cell table:style-name="Table1.B1" office:value-type="string">'
        + '<text:p text:style-name="P2">'
        + '<text:a xlink:type="simple" xlink:href="../%7Bd.list%5Bi%5D.url%7D" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].url}</text:a>'
        + '</text:p>'
        + '</table:table-cell>'
        + '</table:table-row>'
        + '<table:table-row>'
        + '<table:table-cell table:style-name="Table1.A2" office:value-type="string">'
        + '<text:p text:style-name="P2">'
        + '<text:a xlink:type="simple" xlink:href="../%7Bd.list%5Bi+1%5D.url%7D" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i+1].name}</text:a>'
        + '</text:p>'
        + '</table:table-cell>'
        + '<table:table-cell table:style-name="Table1.B2" office:value-type="string">'
        + '<text:p text:style-name="Table_20_Contents"/>'
        + '</table:table-cell>'
        + '</table:table-row>'
        + '</table:table>'
      }]
    };
    const _expectedResult = ''
    + '<table:table table:name="Table1" table:style-name="Table1">'
    + '<table:table-column table:style-name="Table1.A"/>'
    + '<table:table-column table:style-name="Table1.B"/>'
    + '<table:table-row>'
    + '<table:table-cell table:style-name="Table1.A1" office:value-type="string">'
    + '<text:p text:style-name="P2">'
    + '<text:a xlink:type="simple" xlink:href="{d.list[i].url:validateURL}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].name}</text:a>'
    + '</text:p>'
    + '</table:table-cell>'
    + '<table:table-cell table:style-name="Table1.B1" office:value-type="string">'
    + '<text:p text:style-name="P2">'
    + '<text:a xlink:type="simple" xlink:href="{d.list[i].url:validateURL}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].url}</text:a>'
    + '</text:p>'
    + '</table:table-cell>'
    + '</table:table-row>'
    + '<table:table-row>'
    + '<table:table-cell table:style-name="Table1.A2" office:value-type="string">'
    + '<text:p text:style-name="P2">'
    + '<text:a xlink:type="simple" xlink:href="{d.list[i+1].url:validateURL}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i+1].name}</text:a>'
    + '</text:p>'
    + '</table:table-cell>'
    + '<table:table-cell table:style-name="Table1.B2" office:value-type="string">'
    + '<text:p text:style-name="Table_20_Contents"/>'
    + '</table:table-cell>'
    + '</table:table-row>'
    + '</table:table>';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should inject the hyperlink to an image.', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : ''
          + '<draw:a xlink:type="simple" xlink:href="file:///Users/steevep/Documents/projets/pro/carbone-test-pack/hyperlink/hyperlink-odt/%7Bd.url%7D">'
          + '<draw:frame draw:style-name="fr1" draw:name="{D.URL}" text:anchor-type="paragraph" svg:width="3.097cm" svg:height="3.097cm" draw:z-index="0">'
          + '<draw:image xlink:href="Pictures/1000000C000001F4000001F44DDDE1B156EC1E38.gif" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/gif"/>'
          + '</draw:frame>'
          + '</draw:a>'
      }]
    };
    const _expectedResult = ''
      + '<draw:a xlink:type="simple" xlink:href="{d.url:validateURL}">'
      + '<draw:frame draw:style-name="fr1" draw:name="{D.URL}" text:anchor-type="paragraph" svg:width="3.097cm" svg:height="3.097cm" draw:z-index="0">'
      + '<draw:image xlink:href="Pictures/1000000C000001F4000001F44DDDE1B156EC1E38.gif" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/gif"/>'
      + '</draw:frame>'
      + '</draw:a>';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX - Full test] should inject hyperlinks (text/list in table) inside the report', function (done) {
    const _testedReport = 'hyperlink/docx-mix';
    const _data = {
      url1 : 'https://carbone.io/',
      url2 : 'https://carbone.io/documentation.html',
      list : [
        {
          name : 'main',
          url  : 'https://carbone.io/'
        },
        {
          name : 'documentation',
          url  : 'https://carbone.io/documentation.html'
        },
        {
          name : 'api reference',
          url  : 'https://carbone.io/api-reference.html#carbone-set-options-'
        },
        {
          name : 'examples',
          url  : 'https://carbone.io/templates-examples.html'
        }
      ]
    };
    carbone.render(helper.openTemplate(_testedReport), _data, (err, res) => {
      helper.assert(err+'', 'null');
      helper.assertFullReport(res, _testedReport);
      done();
    });
  });

  it('[DOCX - preprocess] should remove an hyperlink marker from the rels file and move it to the document.xml file', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<?xml version="1.0" encoding="UTF-8"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%7Bd.url%7D" TargetMode="External"/>'
          + '</Relationships>'
      },{
        name : 'word/document.xml',
        data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:hyperlink r:id="rId2" w:history="1"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Firstname</w:t></w:r></w:hyperlink></w:p></w:body>'
      }]
    };
    const _expectedRelsResult = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const _expectedDocumentResult = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:hyperlink r:id="{d.url:generateHyperlinkReference()}" w:history="1"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Firstname</w:t></w:r></w:hyperlink></w:p></w:body>';
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _expectedRelsResult);
    helper.assert(_template.files[1].data, _expectedDocumentResult);
  });

  it('[DOCX - preprocess] should inject the special hyperlink inside the tag `w:instrText` at the top of the document.xml', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<?xml version="1.0" encoding="UTF-8"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%7Bd.url%7D" TargetMode="External"/>'
          + '</Relationships>'
      },{
        name : 'word/document.xml',
        data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:instrText xml:space="preserve"> HYPERLINK "%7Bd.url%7D" </w:instrText></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r w:rsidRPr="001D7338"><w:rPr><w:rStyle w:val="Hyperlink"/><w:lang w:val="en-US"/></w:rPr><w:t>Name</w:t></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p><w:p w14:paraId="370438E1" w14:textId="164335FC" w:rsidR="00D3621D" w:rsidRDefault="001D7338"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:hyperlink r:id="rId4" w:history="1"><w:proofErr w:type="spellStart"/><w:r w:rsidR="00D3621D" w:rsidRPr="00D3621D"><w:rPr><w:rStyle w:val="Hyperlink"/><w:lang w:val="en-US"/></w:rPr><w:t>Lastname</w:t></w:r><w:proofErr w:type="spellEnd"/></w:hyperlink></w:p><w:p w14:paraId="7EA8F894" w14:textId="3355503C" w:rsidR="00D3621D" w:rsidRDefault="00D3621D"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p><w:p w14:paraId="6AF3DB0C" w14:textId="6C1644E8" w:rsidR="00D3621D" w:rsidRPr="00D3621D" w:rsidRDefault="001D7338"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p><w:sectPr w:rsidR="00D3621D" w:rsidRPr="00D3621D"><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>'
      }]
    };
    const _expectedRelsResult = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const _expectedDocumentResult = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:instrText xml:space="preserve"> HYPERLINK "{d.url}" </w:instrText></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r w:rsidRPr="001D7338"><w:rPr><w:rStyle w:val="Hyperlink"/><w:lang w:val="en-US"/></w:rPr><w:t>Name</w:t></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p><w:p w14:paraId="370438E1" w14:textId="164335FC" w:rsidR="00D3621D" w:rsidRDefault="001D7338"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:hyperlink r:id="{d.url:generateHyperlinkReference()}" w:history="1"><w:proofErr w:type="spellStart"/><w:r w:rsidR="00D3621D" w:rsidRPr="00D3621D"><w:rPr><w:rStyle w:val="Hyperlink"/><w:lang w:val="en-US"/></w:rPr><w:t>Lastname</w:t></w:r><w:proofErr w:type="spellEnd"/></w:hyperlink></w:p><w:p w14:paraId="7EA8F894" w14:textId="3355503C" w:rsidR="00D3621D" w:rsidRDefault="00D3621D"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p><w:p w14:paraId="6AF3DB0C" w14:textId="6C1644E8" w:rsidR="00D3621D" w:rsidRPr="00D3621D" w:rsidRDefault="001D7338"><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr></w:p><w:sectPr w:rsidR="00D3621D" w:rsidRPr="00D3621D"><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>';
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _expectedRelsResult);
    helper.assert(_template.files[1].data, _expectedDocumentResult);
  });

  it('[DOCX - preprocess] should do nothing if the link inside `w:instrText` at the top of the document.xml is not a Carbone marker', function () {
    const _templateData = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document><w:body><w:p><w:pPr><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:instrText xml:space="preserve"> HYPERLINK "https://carbone.io/documentation.html#getting-started-with-carbone-js" </w:instrText></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r w:rsidRPr="001D7338"><w:rPr><w:rStyle w:val="Hyperlink"/><w:lang w:val="en-US"/></w:rPr><w:t>Name</w:t></w:r><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p><w:sectPr w:rsidR="00D3621D" w:rsidRPr="00D3621D"><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>';
    const _template = {
      files : [{
        name : 'word/document.xml',
        data : _templateData
      }]
    };
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _templateData);
  });

  it('[DOCX - preprocess] should remove multiple hyperlinks marker from the rels file and move them to the document.xml file', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<?xml version="1.0" encoding="UTF-8"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%7Bd.url%7D" TargetMode="External"/>'
          + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%257Bd.url2%257D" TargetMode="External"/>'
          + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%257Bd.url3%257D" TargetMode="External"/>'
          + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%257Bd.url4%257D" TargetMode="External"/>'
          + '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
          + '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
          + '</Relationships>'
      }, {
        name : 'word/document.xml',
        data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="rId2"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>This</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="rId3"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Is</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="rId4"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Some</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="rId5"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Text</w:t></w:r></w:hyperlink></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:left="1134" w:right="1134" w:header="0" w:top="1134" w:footer="0" w:bottom="1134" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="100" w:charSpace="0"/></w:sectPr></w:body></w:document>'
      }]
    };
    const _expectedResult = ''
      + '<?xml version="1.0" encoding="UTF-8"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
      + '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
      + '</Relationships>';
    const _expectedDocumentResult = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="{d.url:generateHyperlinkReference()}"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>This</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="{d.url2:generateHyperlinkReference()}"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Is</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="{d.url3:generateHyperlinkReference()}"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Some</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/><w:bidi w:val="0"/><w:jc w:val="left"/><w:rPr></w:rPr></w:pPr><w:hyperlink r:id="{d.url4:generateHyperlinkReference()}"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Text</w:t></w:r></w:hyperlink></w:p><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:left="1134" w:right="1134" w:header="0" w:top="1134" w:footer="0" w:bottom="1134" w:gutter="0"/><w:pgNumType w:fmt="decimal"/><w:formProt w:val="false"/><w:textDirection w:val="lrTb"/><w:docGrid w:type="default" w:linePitch="100" w:charSpace="0"/></w:sectPr></w:body></w:document>';
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _expectedResult);
    helper.assert(_template.files[1].data, _expectedDocumentResult);
  });

  it('[DOCX - preprocess] should remove a picture hyperlink marker from the rels file and move it to the document.xml file', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<?xml version="1.0" encoding="UTF-8"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>'
          + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%257Bd.url%257D" TargetMode="External"/>'
          + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
          + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
          + '</Relationships>'
      },
      {
        name : 'word/document.xml',
        data : '<w:drawing><wp:anchor behindDoc="0" distT="0" distB="0" distL="0" distR="0" simplePos="0" locked="0" layoutInCell="1" allowOverlap="1" relativeHeight="2"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>64770</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>28575</wp:posOffset></wp:positionV><wp:extent cx="1575435" cy="1431290"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapSquare wrapText="largest"/><wp:docPr id="1" name="Image1" descr=""><a:hlinkClick xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:id="rId3"/></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr=""><a:hlinkClick r:id="rId3"/></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="1575435" cy="1431290"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>'
      }
      ]
    };
    const _expectedRelsResult = ''
        + '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>'
        + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
        + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
        + '</Relationships>';
    const _expectedDocumentResult = '<w:drawing><wp:anchor behindDoc="0" distT="0" distB="0" distL="0" distR="0" simplePos="0" locked="0" layoutInCell="1" allowOverlap="1" relativeHeight="2"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>64770</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>28575</wp:posOffset></wp:positionV><wp:extent cx="1575435" cy="1431290"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapSquare wrapText="largest"/><wp:docPr id="1" name="Image1" descr=""><a:hlinkClick xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:id="{d.url:generateHyperlinkReference()}"/></wp:docPr><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Image1" descr=""><a:hlinkClick r:id="{d.url:generateHyperlinkReference()}"/></pic:cNvPr><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="1575435" cy="1431290"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>';
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _expectedRelsResult);
    helper.assert(_template.files[1].data, _expectedDocumentResult);
  });

  it('[DOCX - post-process] should fill the relation file from the hyperlinkDatabase', function () {
    const _template = {
      files : [{
        name : 'word/_rels/document.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>'
        + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
        + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
        + '</Relationships>'
      }]
    };
    const _options = {
      hyperlinkDatabase : new Map([['https://carbone.io', {id : 0}], ['https://github.com/Ideolys/carbone', {id : 1}], ['https://carbone.io/documentation.html', {id : 2}]])
    };
    const _expectedResult = '<?xml version="1.0" encoding="UTF-8"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>'
      + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
      + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
      + '<Relationship Id="CarboneHyperlinkId0" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://carbone.io" TargetMode="External"/>'
      + '<Relationship Id="CarboneHyperlinkId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://github.com/Ideolys/carbone" TargetMode="External"/>'
      + '<Relationship Id="CarboneHyperlinkId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://carbone.io/documentation.html" TargetMode="External"/>'
      + '</Relationships>';
    hyperlinks.postProcessHyperlinksDocx(_template, undefined, _options);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX - formatter] generateHyperlinkReference - Add encoded and not encoded', function () {
    const _options = {
      hyperlinkDatabase : new Map()
    };
    // ENCODED
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'https://carbone.io/?name=john&lastname=wick');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'https://carbone.io/iu/?u=https%3A%2F%2Fcdn1.carbone.io%2Fcmsdata%2Fslideshow%2F3634008%2Ffunny_tech_memes_1_thumb800.jpg&f=1&nofb=1');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'https://carbone.io/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

    // NOT ENCODED
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'https://carbone.io/?x=шеллые');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'http://carbone.io/page?arg=12&arg1="value"&arg2>=23&arg3<=23&arg4=\'valu2\'');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'http://my_test.asp/?name=ståle&car=saab');

    const _it = _options.hyperlinkDatabase.keys();
    helper.assert(_it.next().value, 'https://carbone.io/?name=john&amp;lastname=wick');
    helper.assert(_it.next().value, 'https://carbone.io/iu/?u=https%3A%2F%2Fcdn1.carbone.io%2Fcmsdata%2Fslideshow%2F3634008%2Ffunny_tech_memes_1_thumb800.jpg&amp;f=1&amp;nofb=1');
    helper.assert(_it.next().value, 'https://carbone.io/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');
    helper.assert(_it.next().value, 'https://carbone.io/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B%D0%B5');
    helper.assert(_it.next().value, "http://carbone.io/page?arg=12&amp;arg1=%22value%22&amp;arg2%3E=23&amp;arg3%3C=23&amp;arg4='valu2'");
    helper.assert(_it.next().value, 'http://my_test.asp/?name=st%C3%A5le&amp;car=saab');
  });

  it('[DOCX - formatter] generateHyperlinkReference - should set by default "https://." if the URL is invalid', function () {
    const _options = {
      hyperlinkDatabase : new Map()
    };

    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'javascript:void(0)');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'dfdsfdsfdfdsfsdf');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'magnet:?xt=urn:btih:123');
    hyperlinksFormatters.generateHyperlinkReference.call(_options, 'http://my test.asp');

    const _it = _options.hyperlinkDatabase.keys();
    helper.assert(_it.next().value, hyperlinks.URL_ON_ERROR);
    helper.assert(_it.next().value, undefined);
  });

  it('[XLSX] should transform a single hyperlink marker valid ("d.url" to "{d.url}")', function () {
    const _template = {
      files : [{
        name : 'xl/worksheets/_rels/sheet1.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="d.url" TargetMode="External"/></Relationships>'
      }]
    };
    const _expected =
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url:validateURL}" TargetMode="External"/></Relationships>';
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected);
  });

  it('[XLSX] should make a single hyperlink marker valid on a single sheet ("http://d.url" to "{d.url}")', function () {
    const _template = {
      files : [{
        name : 'xl/worksheets/_rels/sheet1.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url/" TargetMode="External"/></Relationships>'
      }]
    };
    const _expected =
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url:validateURL}" TargetMode="External"/></Relationships>';
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected);
  });

  it('[XLSX] should make multiple hyperlink markers valid on a single sheets ("http://d.url" to "{d.url}")', function () {
    const _template = {
      files : [{
        name : 'xl/worksheets/_rels/sheet1.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url/" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url2/" TargetMode="External"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url3/" TargetMode="External"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://d.url4/" TargetMode="External"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url5/" TargetMode="External"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url6/" TargetMode="External"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url7/" TargetMode="External"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.urlWithaRealyLargeText12/" TargetMode="External"/></Relationships>'
      }]
    };
    const _expected =
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url:validateURL}" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url2:validateURL}" TargetMode="External"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url3:validateURL}" TargetMode="External"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url4:validateURL}" TargetMode="External"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url5:validateURL}" TargetMode="External"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url6:validateURL}" TargetMode="External"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url7:validateURL}" TargetMode="External"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.urlWithaRealyLargeText12:validateURL}" TargetMode="External"/></Relationships>';
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected);
  });

  it('[XLSX] should make multiple hyperlink marker valid on multiple sheets ("http://d.url" to "{d.url}")', function () {
    const _template = {
      files : [{
        name : 'xl/worksheets/_rels/sheet1.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url/" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://d.url2/" TargetMode="External"/></Relationships>'
      },
      {
        name : 'xl/worksheets/_rels/sheet2.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url3" TargetMode="External"/></Relationships>'
      },
      {
        name : 'xl/worksheets/_rels/sheet3.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url4/" TargetMode="External"/></Relationships>'
      }]
    };
    const _expected = [
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url:validateURL}" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url2:validateURL}" TargetMode="External"/></Relationships>',
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url3:validateURL}" TargetMode="External"/></Relationships>',
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url4:validateURL}" TargetMode="External"/></Relationships>'
    ];
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected[0]);
    helper.assert(_template.files[1].data, _expected[1]);
    helper.assert(_template.files[2].data, _expected[2]);
  });

  describe.only('Utils', () => {
    it('[utils] validateURL - should correct the URL by adding "https" and a missing slash', () => {
      helper.assert(hyperlinks.validateURL('carbone.io'), 'https://carbone.io');
      helper.assert(hyperlinks.validateURL('www.carbone.com.au'), 'https://www.carbone.com.au');
      helper.assert(hyperlinks.validateURL('www.carbone.com.au/?key=value&name=john'), 'https://www.carbone.com.au/?key=value&name=john');
      helper.assert(hyperlinks.validateURL('http://carbone.io/?name=john&lastname=wick'), 'http://carbone.io/?name=john&lastname=wick');
      helper.assert(hyperlinks.validateURL('https://carbone.io/?name=john&lastname=wick'), 'https://carbone.io/?name=john&lastname=wick');
      helper.assert(hyperlinks.validateURL('example.com:3000'), 'https://example.com:3000');
      helper.assert(hyperlinks.validateURL('example.com:3000/?key=value&name=john'), 'https://example.com:3000/?key=value&name=john');
      helper.assert(hyperlinks.validateURL('my_test.asp/?name=st%C3%A5le&amp;car=saab'), 'https://my_test.asp/?name=st%C3%A5le&amp;car=saab');
      helper.assert(hyperlinks.validateURL('http://my_test.asp/?name=st%C3%A5le&amp;car=saab'), 'http://my_test.asp/?name=st%C3%A5le&amp;car=saab');
      helper.assert(hyperlinks.validateURL('https://carbone.io/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B'), 'https://carbone.io/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');
      helper.assert(hyperlinks.validateURL('https://carbone.io/iu/?u=https%3A%2F%2Fcdn1.carbone.io%2Fcmsdata%2Fslideshow%2F3634008%2Ffunny_tech_memes_1_thumb800.jpg&amp;f=1&amp;nofb=1'), 'https://carbone.io/iu/?u=https%3A%2F%2Fcdn1.carbone.io%2Fcmsdata%2Fslideshow%2F3634008%2Ffunny_tech_memes_1_thumb800.jpg&amp;f=1&amp;nofb=1');
      helper.assert(hyperlinks.validateURL('carbone.io/page?arg=12&amp;arg1=%22value%22&amp;arg2%3E=23&amp;arg3%3C=23&amp;arg4=\'valu2\''), 'https://carbone.io/page?arg=12&amp;arg1=%22value%22&amp;arg2%3E=23&amp;arg3%3C=23&amp;arg4=\'valu2\'');
      helper.assert(hyperlinks.validateURL('https://carbone.io/page?arg=12&amp;arg1=%22value%22&amp;arg2%3E=23&amp;arg3%3C=23&amp;arg4=\'valu2\''), 'https://carbone.io/page?arg=12&amp;arg1=%22value%22&amp;arg2%3E=23&amp;arg3%3C=23&amp;arg4=\'valu2\'');
      helper.assert(hyperlinks.validateURL('https://test.carbone.com/v0/b/roux-prod.appspot.com/o/users%2F000004%2Finterventions%2FTT000003866-001%2Fanswers%2FixfxgnCS1tXATBG2DaWq-0%2F16109891796034608114088270121464.jpg?alt=media&token=6bc57ba6-3056-4563-8d21-f1687737142c'), 'https://test.carbone.com/v0/b/roux-prod.appspot.com/o/users%2F000004%2Finterventions%2FTT000003866-001%2Fanswers%2FixfxgnCS1tXATBG2DaWq-0%2F16109891796034608114088270121464.jpg?alt=media&token=6bc57ba6-3056-4563-8d21-f1687737142c');
    });

    it('[utils] validateURL - \n \
        should return an error URL when the URL is invalid && \n\
        should return an error URL passed as a second argument when the URL is invalid', () => {
      /** DEFAULT URL ON ERROR */
      helper.assert(hyperlinks.validateURL('javascript:void(0)'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('dfdsfdsfdfdsfsdf'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('magnet:?xt=urn:btih:123'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('http://my test.asp'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('carbone.io?quer=23'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('www.carbone.com.au?key=value&name=john'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('http://carbone.io?name=john&lastname=wick'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('assurance#/insights/course/749c27c3db1e5010701364a14a961939?view&#61;af6c82041be654107ac94338dc4bcb37'), hyperlinks.URL_ON_ERROR);
      /** URL ON ERROR RECEIVED BY ARGUMENTS */
      helper.assert(hyperlinks.validateURL('javascript:void(0)', 'https://carbone.io'), 'https://carbone.io');
      helper.assert(hyperlinks.validateURL('dfdsfdsfdfdsfsdf', 'https://carbone.io/index.html'), 'https://carbone.io/index.html');
      helper.assert(hyperlinks.validateURL('http://carbone.io?name=john&lastname=wick', 'https://my_test.asp'), 'https://my_test.asp');
      helper.assert(hyperlinks.validateURL('assurance#/insights/course/749c27c3db1e5010701364a14a961939?view&#61;af6c82041be654107ac94338dc4bcb37', 'https://carbone.io/url_on_error.html'), 'https://carbone.io/url_on_error.html');
    });

    it('[utils] validateURL + DOCX && \n \
        should correct the URL and convert "&" caracter to "&amp;" encoded caracter && \n \
        should return the default Error URL when the URL is invalid && \n \
        should return a different default Error URL when the URL is invalid', () => {
      helper.assert(hyperlinks.validateURL('carbone.io', '', 'docx'), 'https://carbone.io');
      helper.assert(hyperlinks.validateURL('http://carbone.io/?name=john&lastname=wick', '', 'docx'), 'http://carbone.io/?name=john&amp;lastname=wick');
      helper.assert(hyperlinks.validateURL('https://carbone.io/?name=john&lastname=wick&key=code', '', 'docx'), 'https://carbone.io/?name=john&amp;lastname=wick&amp;key=code');
      helper.assert(hyperlinks.validateURL('carbone.io?quer=23', '', 'docx'), hyperlinks.URL_ON_ERROR);
      helper.assert(hyperlinks.validateURL('carbone.io?quer=23', 'https://www.carbone.com.au', 'docx'), 'https://www.carbone.com.au');
    });

    it('[utils] formatter "addLinkDatabase" should add to the hyperlinkDatabase and return the hyperlink properties', () => {
      const _options = {
        hyperlinkDatabase : new Map()
      };
      helper.assert(hyperlinks.addLinkDatabase(_options, 'https://carbone.io'), { id : 0 });
      helper.assert(hyperlinks.addLinkDatabase(_options, 'https://carbone.io'), { id : 0 });
      const _it = _options.hyperlinkDatabase.keys();
      helper.assert(_it.next().value, 'https://carbone.io');
      helper.assert(_it.next().value, undefined);
    });

    it('[utils] formatter "defaultURL" \n\
        should set a new default URL on error && \n\
        should set the default URL if the new default URL is invalid && \n\
        should set the default URL if the new default URL is undefined', function() {
      const _options = {};
      hyperlinksFormatters.defaultURL.call(_options, 'link', 'https://carbone.io/default_url_on_error');
      helper.assert(_options.defaultUrlOnError, 'https://carbone.io/default_url_on_error');
      hyperlinksFormatters.defaultURL.call(_options, 'link', 'carbone.io');
      helper.assert(_options.defaultUrlOnError, 'https://carbone.io');
      hyperlinksFormatters.defaultURL.call(_options, 'link', 'http://my test.asp');
      helper.assert(_options.defaultUrlOnError, hyperlinks.URL_ON_ERROR);
      hyperlinksFormatters.defaultURL.call(_options, 'link');
      helper.assert(_options.defaultUrlOnError, hyperlinks.URL_ON_ERROR);
    });

    it.only('[utils] chain formatters: "defaultURL" + "validateURL"', function() {
      let _resultUrl = '';
      const _options = {};
      /** if the url is valide, it should return it */
      helper.assert(_options.defaultUrlOnError, undefined);
      _resultUrl = hyperlinksFormatters.validateURL.call(_options, hyperlinksFormatters.defaultURL.call(_options, 'http://carbone.io', 'https://carbone.io/default_url_on_error1'));
      helper.assert(_options.defaultUrlOnError, 'https://carbone.io/default_url_on_error1');
      helper.assert(_resultUrl, 'http://carbone.io');
      /** if the url is invalid, it should return the new URL On Error passed by the formatter "defaultURL" */
      _resultUrl = hyperlinksFormatters.validateURL.call(_options, hyperlinksFormatters.defaultURL.call(_options, 'http://my test.asp', 'https://carbone.io/default_url_on_error2'));
      helper.assert(_resultUrl, 'https://carbone.io/default_url_on_error2');
      /** if the url is invalid AND if the new URL On Error passed by the formatter "defaultURL" is invalid, it should return the default hyperlinks.URL_ON_ERROR */
      _resultUrl = hyperlinksFormatters.validateURL.call(_options, hyperlinksFormatters.defaultURL.call(_options, 'http://my test.asp', 'carbone.io?quer=23'));
      helper.assert(_resultUrl, 'https://carbone.io/documentation.html#hyperlink-validation');
    });
  });

});