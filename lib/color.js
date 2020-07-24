const file = require("./file");
const parser = require("./parser");
const helper = require("./helper");
const array = require("../formatters/array");
const colors = require("./color.old");

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
      const _rId = color.getColorReference(_item.value[1].id);
      const _newColorAttributes = _item.value[1].colors.reduce(
        (previousValue, value) => {
          if (value.element === color.elementTypes.TEXT_COLOR) {
            previousValue += `fo:color="${value.color}" `;
          } else if (value.element === color.elementTypes.TEXT_BG_COLOR) {
            previousValue += `fo:background-color="${value.color}" `;
          }
          return previousValue;
        },
        ""
      );
      console.log(_newColorAttributes);
      if (_rId && _newColorAttributes) {
        // TODO:
        // - [ ] change the style family, text, paragraph or graphic
        // - [ ] change the inner tag by a custom tag which depends on the style familly (for graphics)
        _colorRelations.push(
          `<style:style style:name="${_rId}" style:family="paragraph"><style:text-properties ${_newColorAttributes}/></style:style>`
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
    console.log(_file.data);
    if (_file !== null) {
      // 1 - Get the bindColor markers
      color.getBindColorMarkers(_file.data, function (
        err,
        fileContentFromGetBindColor,
        bindColorList
      ) {
        if (!!err === true) {
          console.error(
            "Carbone bindColor error: the bindColor markers are incorrect: " +
              err
          );
          return;
        }
        // 2 - Get the color references, text colors and background colors on the document
        color.getStyleColorsODT(
          fileContentFromGetBindColor,
          bindColorList,
          function (err, styleColorList) {
            if (!!err === true) {
              return console.error(
                "Carbone bindColor error: getStyleColorODT: " + err
              );
            }

            const styleColorKeys = Object.keys(styleColorList);
            for (let i = 0, j = styleColorKeys.length; i < j; i++) {
              const element = styleColorList[styleColorKeys[i]];
              if (element.dynColor === true) {
                console.log(element);

                // 3 - Replace the original style reference by the color marker + a post process formatter to generate a new reference
                // TODO:
                // - [ ] improve the communication with the formatter
                let showColorReference = 0;
                const _markers = element.colors.reduce(
                  (previousValue, currentValue) => {
                    if (currentValue.colorMarker) {
                      previousValue += `{${
                        currentValue.colorMarker
                      }:saveColorAndGetReference(${styleColorKeys[i]}, ${
                        currentValue.element
                      }, ${showColorReference++})}`;
                    }
                    return previousValue;
                  },
                  ""
                );

                const _regElementStyleAttribute = new RegExp(
                  `text:style-name="(${styleColorKeys[i]})"`,
                  "g"
                );
                fileContentFromGetBindColor = fileContentFromGetBindColor.replace(
                  _regElementStyleAttribute,
                  function (xml) {
                    // console.log(xml);
                    return `text:style-name="${_markers}"`;
                  }
                );
              }
            }
            _file.data = fileContentFromGetBindColor;
            console.log(_file.data);
          }
        );
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
          helper.cleanMarker(marker)
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
            referenceColor: _bindColorMarkerArgs[1], // example: "ff0000"
            colorType: _bindColorMarkerArgs[2], // example: "#hexa"
            colorMarker: _bindColorMarkerArgs[3], // example "d.color1"
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

  getColorFromRegex: function (regexColor, xmlContent, element) {
    const _regexResult = regexColor.exec(xmlContent);
    return {
      color: !!_regexResult && !!_regexResult[1] ? _regexResult[1] : null,
      element,
    };
  },

  /**
   * @private
   * @param {*} xmlContent
   * @param {*} bindColorArray
   */
  getStyleColorsODT: function (xmlContent, bindColorList, callback) {
    let _xmlStyleColors = {};
    let xmlStyleColorTag = null;
    const _regexStyleColor = /<style:style[^]*?style:style>/g;
    // Retrieve all the document style to compare the colors references with the bindColor reference
    while ((xmlStyleColorTag = _regexStyleColor.exec(xmlContent)) !== null) {
      if (
        xmlStyleColorTag &&
        !!xmlStyleColorTag[0] &&
        xmlStyleColorTag[0].indexOf('color="') !== -1 &&
        xmlStyleColorTag[0].indexOf('style:name="') !== -1
      ) {
        const _styleName = /style:name="([^"<>]*?)"/.exec(
          xmlStyleColorTag[0]
        )[1];
        const _color = color.getColorFromRegex(
          /fo:color="([^"<>]*?)"/,
          xmlStyleColorTag[0],
          color.elementTypes.TEXT_COLOR
        );
        const _colorBg = color.getColorFromRegex(
          /fo:background-color="([^"<>]*?)"/,
          xmlStyleColorTag[0],
          color.elementTypes.TEXT_BG_COLOR
        );

        let newStyleColors = {
          colors: [_color, _colorBg],
        };

        for (let i = 0; i < bindColorList.length; i++) {
          newStyleColors.colors.forEach((el) => {
            if (
              el.color &&
              el.color === "#" + bindColorList[i].referenceColor
            ) {
              newStyleColors.dynColor = true;
              el.colorMarker = bindColorList[i].colorMarker;
            }
          });
        }

        _xmlStyleColors[_styleName] = newStyleColors;
      }
    }
    return callback(null, _xmlStyleColors);
  },

  /**
   * Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   */
  getColorReference: function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },
  elementTypes: {
    TEXT_COLOR: "textColor",
    TEXT_BG_COLOR: "textBackgroundColor",
    SHAPE_BG_COLOR: "shapeBackgroundColor",
  },
};

module.exports = color;
