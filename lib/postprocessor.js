const postprocessor = {
  process: function (template, data, options) {
    var fileType = template.extension;
    switch (fileType) {
      case "odt":
        processBase64Images(template, data, options);
        break;
      case "xlsx":
      case "ods":
      default:
        break;
    }
  },
};

function processBase64Images(template, data, options) {
  const _contentFileId = template.files.findIndex(
    (x) => x.name === "content.xml"
  );
  if (_contentFileId < 0) return;

  let content = template.files[_contentFileId].data;
  const pattern = /(<draw:frame.*>.*<draw:image.*\sxlink:href=")(?<href>.*?)("\s.*>.*<svg:title>)data:image\/(.*);base64,(?<base64>.*)(<\/svg:title>.*<\/draw:frame>)/g;
  template.files[_contentFileId].data = content.replaceAll(pattern,function (_match, p1, _p2, p3, p4, p5, p6) {
      const imgFile = `Pictures/${Math.random().toString(36).slice(2)}.${p4}`;
      template.files.push({
        name: imgFile,
        isMarked: false,
        data: Buffer.from(p5, "base64"),
        parent: "",
      });

      const _manifestXmlId = template.files.findIndex((x) => x.name === "META-INF/manifest.xml");
      if (_manifestXmlId >= 0) {
        let manifest = template.files[_manifestXmlId].data;
        template.files[_manifestXmlId].data = manifest.replace(/((.|\n)*)(<\/manifest:manifest>)/, function (_match, p1, _p2, p3) {
            return [p1,`<manifest:file-entry manifest:full-path="${imgFile}" manifest:media-type="image/png"/>`,p3].join("");
          }
        );
        return [p1, imgFile, p3, p6].join("");
      }
    }
  );
}

module.exports = postprocessor;
