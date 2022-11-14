var crypto = require('crypto');

const postprocessor = {
  process: function (template, data, options) {
    var fileType = template.extension;
    const filestore = new FileStore();
    switch (fileType) {
      case "odt":
        new OdtPostProcessor(template, data, options, filestore);
        break;
      case "docx":
        new DocxPostProcessor(template, data, options, filestore);
        break;
      case "xlsx":
      case "ods":
      default:
        break;
    }
  },
};

class FileStore {
  cache = [];
  constructor() {}

  fileBaseName(base64) {
    const hash = crypto.createHash('sha256').update(base64).digest('hex');
    const newfile = !this.cache.includes(hash);
    if (newfile) this.cache.push(hash);
    return [hash, newfile];
  }
}

class OdtPostProcessor {
  allframes = /<draw:frame (.*?)<\/draw:frame>/g;

  constructor(template, data, options, filestore) {
    const contentXml = template.files.find((f) => f.name === "content.xml");
    if (!contentXml) return;
    const manifestXml = template.files.find(f => f.name === "META-INF/manifest.xml");

    // Use base64 data to create new file and update references
    contentXml.data = contentXml.data.replaceAll(this.allframes, function (drawFrame) {
        const [,,mime,content] = /<svg:title>(data:([^;]+);base64,(.*?))<\/svg:title>/.exec(drawFrame) || [];
        if (!content || !mime) return drawFrame;
        const [,extension] = mime.split("/");
        // Add new image to Pictures folder
        const [basename, newfile] = filestore.fileBaseName(content)
        const imgFile = `Pictures/${basename}.${extension}`;
        if (newfile) {
          template.files.push({ name: imgFile, isMarked: false, data: Buffer.from(content, "base64"), parent: ""});
          // Update manifest.xml file
          manifestXml.data = manifestXml.data.replace(/((.|\n)*)(<\/manifest:manifest>)/, function (_match, p1, _p2, p3) {
              return [p1,`<manifest:file-entry manifest:full-path="${imgFile}" manifest:media-type="${mime}"/>`,p3].join("");
            }
          );
        }
        return drawFrame.replace(/<svg:title>.*?<\/svg:title>/, '<svg:title></svg:title>')
                        .replace(/draw:mime-type="[^"]+"/, `draw:mime-type="${mime}"`)
                        .replace(/xlink:href="[^"]+"/, `xlink:href="${imgFile}"`);
      }
    );
  }
}

class DocxPostProcessor {
  alldrawings = /<w:drawing>(.*?)<\/w:drawing>/g;
  pattern = /(<w:drawing>.*<wp:docPr.*title=)("data:image\/(.*);base64,(.+?)")(.*:embed=")(.*?)(".*<\/w:drawing>)/g;

  constructor(template, data, options, filestore) {
    const documentXmlFile = template.files.find(f => f.name === "word/document.xml");
    if (!documentXmlFile) return;
    const documentXmlRelsFile = template.files.find(f => f.name === "word/_rels/document.xml.rels");

    documentXmlFile.data = documentXmlFile.data.replaceAll(this.alldrawings, function (drawing) {
      const [,,mime,content ] = /title="(data:([^;]+);base64,(.*?))"/.exec(drawing) || [];
      const [,relationshipId] = /embed="(.*?)"/.exec(drawing) || [];
      if (!content || !mime || !relationshipId) return drawing;
      const [,extension] = mime.split("/");
      // Save image to media folder
      const [basename, newfile] = filestore.fileBaseName(content)
      const imgFile = `media/${basename}.${extension}`;
      if (newfile) {
        template.files.push({ name: imgFile, isMarked: false, data: Buffer.from(content, "base64"), parent: ""});
        // Update corresponding entry in word/_rels/document.xml.rels file
        const regex = new RegExp(`(.*Target=")(.*)(".*Id="${relationshipId}".*\/>.*<\/Relationships>)`,"g");
        documentXmlRelsFile.data = documentXmlRelsFile.data.replaceAll(regex, function (_match, p1, _p2, p3) {
          return [p1, `/${imgFile}`, p3].join("")
        });
      }
      return drawing.replace(/title="data:[^"]+"/, 'title=""');
    });
  }
}

module.exports = postprocessor;
