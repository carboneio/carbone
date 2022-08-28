const postprocessor = {
  process: function (template, data, options) {
    var fileType = template.extension;
    switch (fileType) {
      case "odt":
        new OdtPostProcessor(template, data, options);
        break;
      case "docx":
        new DocxPostProcessor(template, data, options);
        break;
      case "xlsx":
      case "ods":
      default:
        break;
    }
  },
};


class OdtPostProcessor {
  pattern = /(<draw:frame.*>.*<draw:image.*\sxlink:href=")(?<href>.*?)("\s.*>.*<svg:title>)data:image\/(.*);base64,(?<base64>.*)(<\/svg:title>.*<\/draw:frame>)/g;

  constructor(template, data, options) {
    const contentXml = template.files.find((f) => f.name === "content.xml");
    if (!contentXml) return;

    // Use base64 data to create new file and update references
    contentXml.data = contentXml.data.replaceAll(this.pattern,function (_match, p1, _p2, p3, extension, content, p6) {
        // Add new image to Pictures folder
        const imgFile = `Pictures/${Math.random().toString(36).slice(2)}.${extension}`;
        template.files.push({ name: imgFile, isMarked: false, data: Buffer.from(content, "base64"), parent: ""});
        // Update manifest.xml file
        const manifestXml = template.files.find(f => f.name === "META-INF/manifest.xml");
        manifestXml.data = manifestXml.data.replace(/((.|\n)*)(<\/manifest:manifest>)/, function (_match, p1, _p2, p3) {
            return [p1,`<manifest:file-entry manifest:full-path="${imgFile}" manifest:media-type="image/png"/>`,p3].join("");
          }
        );
        return [p1, imgFile, p3, p6].join("");
      }
    );
  }
}

class DocxPostProcessor {
  pattern = /(<w:drawing>.*<wp:docPr.*title=)("data:image\/(.*);base64,(.+?)")(.*:embed=")(.*?)(".*<\/w:drawing>)/g;

  constructor(template, data, options) {
    const documentXmlFile = template.files.find(f => f.name === "word/document.xml");
    if (!documentXmlFile) return;

    documentXmlFile.data = documentXmlFile.data.replaceAll(this.pattern, function (_match,p1,_p2,extension,content,p5,relationshipId,p7) {
      // Save image to media folder
      const imgFile = `media/${Math.random().toString(36).slice(2)}.${extension}`;
      template.files.push({
        name: imgFile,
        isMarked: false,
        data: Buffer.from(content, "base64"),
        parent: "",
      });
      // Update corresponding entry in word/_rels/document.xml.rels file
      const regex = new RegExp(`(.*Target=")(.*)(".*Id="${relationshipId}".*\/>.*<\/Relationships>)`,"g")
      const documentXmlRelsFile = template.files.find(f => f.name === "word/_rels/document.xml.rels");
      documentXmlRelsFile.data = documentXmlRelsFile.data.replaceAll(regex, function (_match, p1, p2, p3) {
        return [p1, `/${imgFile}`, p3].join("")
      });
      return [p1,`""`,p5,relationshipId,p7].join("");
    });
  }
}

module.exports = postprocessor;
