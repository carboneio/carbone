const helper    = require('../lib/helper');
const hyperlinks = require('../lib/hyperlinks');

describe.only('Hyperlinks - It Injects Hyperlinks to elements (texts/images/tables) for ODS, ODT, DOCX and XLSX templates. It convert unicode characters to ascii characters or setup post process formatters', function () {

  it('[ODT/ODS] should correct a xlink:href unicode to ascii and remove incorrect text before with only one Carbone marker', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : 'xlink:href="This is some text that should not be displayed here%7Bd.url%7D"'
      }]
    };
    const _expectedResult = 'xlink:href="{d.url}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should correct a xlink:href unicode to ascii and remove incorrect text after only one Carbone marker', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : 'xlink:href="%7Bd.url%7DThis is some text that should not be displayed here"'
      }]
    };
    const _expectedResult = 'xlink:href="{d.url}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should accept multiple Carbone markers', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : 'xlink:href="%7Bd.url%7D%7Bd.path%7D%7Bd.queryparameter%7D"'
      }]
    };
    const _expectedResult = 'xlink:href="{d.url}{d.path}{d.queryparameter}"';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[ODT/ODS] should accept multiple Carbone markers and clean the supplementary text between markers', function () {
    const _template = {
      files : [{
        name : 'content.xml',
        data : 'xlink:href="file:///Users/Documents/carbone-test/hyperlink/hyperlink-odt/%7Bd.url%7Dthis is some text%7Bd.path%7DThis is again some text%7Bd.queryparameter%7D"'
      }]
    };
    const _expectedResult = 'xlink:href="{d.url}{d.path}{d.queryparameter}"';
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
      +  '<text:a xlink:type="simple" xlink:href="{d.url}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.firstname}</text:a>'
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
    + '<text:a xlink:type="simple" xlink:href="{d.list[i].url}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].name}</text:a>'
    + '</text:p>'
    + '</table:table-cell>'
    + '<table:table-cell table:style-name="Table1.B1" office:value-type="string">'
    + '<text:p text:style-name="P2">'
    + '<text:a xlink:type="simple" xlink:href="{d.list[i].url}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i].url}</text:a>'
    + '</text:p>'
    + '</table:table-cell>'
    + '</table:table-row>'
    + '<table:table-row>'
    + '<table:table-cell table:style-name="Table1.A2" office:value-type="string">'
    + '<text:p text:style-name="P2">'
    + '<text:a xlink:type="simple" xlink:href="{d.list[i+1].url}" text:style-name="Internet_20_link" text:visited-style-name="Visited_20_Internet_20_Link">{d.list[i+1].name}</text:a>'
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
      + '<draw:a xlink:type="simple" xlink:href="{d.url}">'
      + '<draw:frame draw:style-name="fr1" draw:name="{D.URL}" text:anchor-type="paragraph" svg:width="3.097cm" svg:height="3.097cm" draw:z-index="0">'
      + '<draw:image xlink:href="Pictures/1000000C000001F4000001F44DDDE1B156EC1E38.gif" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" loext:mime-type="image/gif"/>'
      + '</draw:frame>'
      + '</draw:a>';
    hyperlinks.insertHyperlinksLO(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX] should change unicode characters to ascii character and makes one hyperlink marker valid', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<?xml version="1.0" encoding="UTF-8"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%7Bd.url%7D" TargetMode="External"/>'
          + '</Relationships>'
      }]
    };
    const _expectedResult = ''
      + '<?xml version="1.0" encoding="UTF-8"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}" TargetMode="External"/>'
      + '</Relationships>';
    hyperlinks.insertHyperlinksDOCX(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX] should change unicode characters to ascii character and makes multiple hyperlink markers valid', function () {
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
      }]
    };
    const _expectedResult = ''
      + '<?xml version="1.0" encoding="UTF-8"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}" TargetMode="External"/>'
      + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url2}" TargetMode="External"/>'
      + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url3}" TargetMode="External"/>'
      + '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url4}" TargetMode="External"/>'
      + '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>'
      + '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
      + '</Relationships>';
    hyperlinks.insertHyperlinksDOCX(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX] should change unicode characters to ascii character and makes multi hyperlink markers valid applied on one text', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="%257Bd.url%257D%257Bd.path%257D%257Bd.query%257D" TargetMode="External"/>'
          + '</Relationships>'
      }]
    };
    const _expectedResult = ''
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}{d.path}{d.query}" TargetMode="External"/>'
      + '</Relationships>';
    hyperlinks.insertHyperlinksDOCX(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[DOCX] should change unicode characters to ascii character, removed unused text between markers makes multiple hyperlink marker valid', function () {
    const _template = {
      files : [{
        name : '_rels/document.xml.rels',
        data : ''
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="fewfwefwefe%257Bd.url%257Dfewfewf%257Bd.path%257DThis is random text%257Bd.query%257Dhop this is text" TargetMode="External"/>'
          + '</Relationships>'
      }]
    };
    const _expectedResult = ''
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}{d.path}{d.query}" TargetMode="External"/>'
      + '</Relationships>';
    hyperlinks.insertHyperlinksDOCX(_template);
    helper.assert(_template.files[0].data, _expectedResult);
  });

  it('[XLSX] should makes multiple hyperlink marker valid over multiple sheets ("http://d.url" to "{d.url}")', function () {
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
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url2}" TargetMode="External"/></Relationships>',
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url3}" TargetMode="External"/></Relationships>',
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url4}" TargetMode="External"/></Relationships>'
    ];
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected[0]);
    helper.assert(_template.files[1].data, _expected[1]);
    helper.assert(_template.files[2].data, _expected[2]);
  });

  it('[XLSX] should makes hyperlink markers valid over a single sheets ("http://d.url" to "{d.url}")', function () {
    const _template = {
      files : [{
        name : 'xl/worksheets/_rels/sheet1.xml.rels',
        data : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url/" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url2/" TargetMode="External"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url3/" TargetMode="External"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://d.url4/" TargetMode="External"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url5/" TargetMode="External"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url6/" TargetMode="External"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.url7/" TargetMode="External"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://d.urlWithaRealyLargeText12/" TargetMode="External"/></Relationships>'
      }]
    };
    const _expected =
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url}" TargetMode="External"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url2}" TargetMode="External"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url3}" TargetMode="External"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url4}" TargetMode="External"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url5}" TargetMode="External"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url6}" TargetMode="External"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.url7}" TargetMode="External"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{d.urlWithaRealyLargeText12}" TargetMode="External"/></Relationships>';
    hyperlinks.insertHyperlinksXLSX(_template);
    helper.assert(_template.files[0].data, _expected);
  });

});