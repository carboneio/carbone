const file = require("./file");
const parser = require("./parser");

const color = {
  /** ======================================= POST PROCESS ODT ==================================== */

  /**
   * Post-processing : update color id references using options.colorDatabase on the files "content.xml"
   *
   * @param  {Object} template
   * @param  {Mixed}  data
   * @param  {Object} options  options with colorDatabase
   * @return {Object}          template
   */
  postProcessODT: function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (
      options.colorDatabase === undefined ||
      options.colorDatabase.size === 0
    ) {
      return template;
    }
    let _file = file.getTemplateFile(template, "content.xml");
    if (_file === null || typeof _file.data !== "string") {
      debug("the `content.xml` file does not exist");
      return template;
    }

    // Create the colors relations from the new color
    let _colorRelations = [];
    let _colorIt = options.colorDatabase.entries();
    let _item = _colorIt.next();
    while (_item.done === false) {
      const _color = _item.value[0];
      const _rId = color.getColorReference(_item.value[1].id);
      if (_color && _rId) {
        _colorRelations.push(
          `<style:style style:name="${_rId}" style:family="paragraph" style:parent-style-name="Standard"><style:text-properties fo:color="${_color}"/></style:style>`
        );
      } else {
        debug("PostProcess color: the Color/rId are invalid.");
      }
      _item = _colorIt.next();
    }
    _file.data = _file.data.replace(
      "</office:automatic-styles>",
      _colorRelations.join("") + "</office:automatic-styles>"
    );
    console.log(_file.data);
  },

  /** ======================================= PREP ROCESS ODT ==================================== */

  preProcessODT: function (template) {
    let _file = file.getTemplateFile(template, "content.xml");
    if (_file !== null) {
      // 1 - Get the bindColor markers
      color.getBindColorMarkers(_file.data, function (
        err,
        newFileContent,
        bindColorArray
      ) {
        if (!!err === true) {
          console.error(
            "Carbone error: the bindColor markers are incorrect: " + err
          );
          return;
        }
        // 2 - Get the color reference in the document style
        color.getStyleNameTextReferenceFromColorODT(_file.data, bindColorArray);

        // console.log(bindColorArray);

        // 3 - Replace the style original reference by the color marker + a post process formatter to generate a fresh new reference
        for (let i = 0; i < bindColorArray.length; i++) {
          const _bindColorEl = bindColorArray[i];
          const _colorRefs = _bindColorEl.referenceName.join("|");
          // console.log(_colorRefs);
          const _regTextStyleName = new RegExp(
            `text:style-name="(${_colorRefs})"`,
            "g"
          );
          newFileContent = newFileContent.replace(_regTextStyleName, () => {
            return `text:style-name="{${_bindColorEl.colorMarker}:generateColorOdtReference()}"`;
          });
        }
        _file.data = newFileContent;
        console.log(_file.data);
      });
    }
  },

  /**
   * @private
   * @param {*} xmlContent
   */
  getBindColorMarkers: function (xmlContent, callback) {
    const _bindColorArray = [];
    const _regexMarker = /{([^]*?)}/g;
    let _errorMarkers = "";

    xmlContent = xmlContent.replace(_regexMarker, function (marker) {
      if (marker.indexOf("bindColor") !== -1) {
        let _bindColorMarker = parser.removeWhitespace(
          color.cleanMarker(marker)
        );
        // Get bindColor arguments
        let _bindColorMarkerArgs = /\(([^]*?),([^]*?)\).*?=([^}]*)/g.exec(
          _bindColorMarker
        );
        if (
          _bindColorMarkerArgs !== null &&
          _bindColorMarkerArgs.length >= 4 &&
          !!_bindColorMarkerArgs[1] &&
          !!_bindColorMarkerArgs[2] &&
          !!_bindColorMarkerArgs[3]
        ) {
          _bindColorArray.push({
            referenceName: [],
            referenceColor: _bindColorMarkerArgs[1],
            colorType: _bindColorMarkerArgs[2],
            colorMarker: _bindColorMarkerArgs[3],
          });
        } else {
          _errorMarkers += _bindColorMarker + " ";
        }
        return "";
      }
      return marker;
    });
    if (!!_errorMarkers) {
      return callback(_errorMarkers);
    }
    return callback(null, xmlContent, _bindColorArray);
  },

  /**
   * @private
   * @param {*} xmlContent
   * @param {*} bindColorArray
   */
  getStyleNameTextReferenceFromColorODT: function (xmlContent, bindColorArray) {
    let xmlStyleColorTag = null;
    const _regexStyleColor = /<style:style[^]*?style:style>/g;
    // Retrieve all the document style to compare the colors references with the bindColor reference
    while ((xmlStyleColorTag = _regexStyleColor.exec(xmlContent)) !== null) {
      if (
        xmlStyleColorTag &&
        !!xmlStyleColorTag[0] &&
        xmlStyleColorTag[0].indexOf('fo:color="') !== -1
      ) {
        const _colorAttribute = /fo:color="([^]*?)"/.exec(xmlStyleColorTag[0]);
        if (_colorAttribute.length >= 2 && !!_colorAttribute[1]) {
          const _xmlReferenceColor = _colorAttribute[1];
          // Loop through the bindColor array to find the corresponding color reference
          for (let i = 0; i < bindColorArray.length; i++) {
            // TODO: Manage color types
            if (_xmlReferenceColor === "#" + bindColorArray[i].referenceColor) {
              // Get the Style name reference
              const _styleName = /style:name="([^<>]*?)"/g.exec(
                xmlStyleColorTag
              );
              if (_styleName && !!_styleName[1]) {
                bindColorArray[i].referenceName.push(_styleName[1]);
              } else {
                console.warning(
                  `Carbone bindColor warning: the style reference for the color "${bindColorArray[i].referenceColor}" is not found.`
                );
              }
            }
          }
        }
      }
    }
  },

  /**
   * @private
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

  /**
   * Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   */
  getColorReference: function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },
};

module.exports = color;
