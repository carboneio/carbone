const file = require("./file");
const parser = require("./parser")

const color = {
  preProcessODT: function (template) {
    const _file = file.getTemplateFile(template, "content.xml");
    if (_file !== null) {
      console.log(_file.data);
      color.getBindColorMarkers(_file.data);
    }
  },

  /**
   * @private
   * @param {*} fileContent
   */
  getBindColorMarkers: function (fileContent) {
    const _bindColorArray = [];
    const _regexMarker = /{([^]*?)}/g;
    const _regexBindColorArgs = /\(([^]*?),([^]*?)\).*?=([^}]*)/g;
    fileContent = fileContent.replace(_regexMarker, function (marker) {

      if (marker.indexOf("bindColor") !== -1) {
        const _bindColorMarker = parser.removeWhitespace(color.cleanMarker(marker));
        console.log("Marker:"+_bindColorMarker)
        const _bindColorMarkerArgs = _regexBindColorArgs.exec(_bindColorMarker);
        console.log("Args:" , _bindColorMarkerArgs)
        if (_bindColorMarkerArgs !== null && _bindColorMarkerArgs.length >= 4) {
          _bindColorArray.push({
            referenceColor: _bindColorMarkerArgs[1],
            colorType: _bindColorMarkerArgs[2],
            colorMarker: _bindColorMarkerArgs[3]
          })
        }
        return '';
      }
      return _regexMarker;
    });
    console.log(_bindColorArray);
  },

  /**
   * Return only the text of a string, it removes XML tag
   * @param   {String} str
   * @return  {String} return marker
   */
  cleanMarker: function (str) {
    var _newStr = "";
    var _open = false;

    for (var _i = 0; _i < str.length; _i++) {
      var _char = str[_i];
      if (_char === "<") {
        _open = true;
      }
      if (_open === false) {
        _newStr = _newStr + _char;
      }
      if (_char === ">") {
        _open = false;
      }
    }
    return _newStr;
  },
};

module.exports = color;
