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
        data : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:hyperlink r:id="rId2"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Firstname</w:t></w:r></w:hyperlink></w:p></w:body>'
      }]
    };
    const _expectedRelsResult = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const _expectedDocumentResult = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:body><w:p><w:hyperlink r:id="{d.url:generateHyperlinkReference()}"><w:r><w:rPr><w:rStyle w:val="InternetLink"/><w:color w:val="000000"/><w:u w:val="none"/></w:rPr><w:t>Firstname</w:t></w:r></w:hyperlink></w:p></w:body>';
    hyperlinks.preProcesstHyperlinksDocx(_template);
    helper.assert(_template.files[0].data, _expectedRelsResult);
    helper.assert(_template.files[1].data, _expectedDocumentResult);
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

  it('[DOCX post-process] should fill the relation file from the hyperlinkDatabase', function () {
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



  it.skip('[XLSX] should makes multiple hyperlink marker valid over multiple sheets ("http://d.url" to "{d.url}")', function () {
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

  it.skip('[XLSX] should makes hyperlink markers valid over a single sheets ("http://d.url" to "{d.url}")', function () {
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