const file = require('./file');
const parser = require('./parser');
const helper = require('./helper');
const debug = require('debug')('carbone:color');

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
  postProcessODT : function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (
      options.colorDatabase === undefined ||
      options.colorDatabase.size === 0
    ) {
      return template;
    }

    let _file = file.getTemplateFile(template, 'content.xml');
    if (_file === null || typeof _file.data !== 'string') {
      debug('the `content.xml` file does not exist');
      return template;
    }

    // Create the colors relations from the new color
    let _colorRelations = [];
    let _colorIt = options.colorDatabase.entries();
    let _item = _colorIt.next();
    while (_item.done === false) {
      const _styleFamily = _item.value[1].styleFamily;
      const _rId = color.getColorReference(_item.value[1].id);
      // Create the color attributes
      // TODO
      // - [ ] remove the reduce
      const _newColorAttributes = _item.value[1].colors.reduce(
        (previousValue, value) => {
          // newColor null means the color should not be replace and it is using the originalColor.
          // it happens when a static color has been applied
          const _newColor = value.newColor === 'null' ? value.oldColor : value.newColor;
          if (value.element === color.elementTypes.TEXT_COLOR) {
            previousValue += `fo:color="${_newColor}" `;
          }
          else if (value.element === color.elementTypes.TEXT_BG_COLOR) {
            previousValue += `fo:background-color="${_newColor}" `;
          }
          return previousValue;
        },
        ''
      );
      if (_rId && _newColorAttributes && _styleFamily) {
        // TODO:
        // - [ ] change the inner tag by a custom tag which depends on the style familly (for graphics)
        _colorRelations.push(
          `<style:style style:name="${_rId}" style:family="${_styleFamily}"><style:text-properties ${_newColorAttributes}/></style:style>`
        );
      }
      else {
        debug('PostProcess color: the Color/rId are invalid.');
      }
      _item = _colorIt.next();
    }
    _file.data = _file.data.replace(
      '</office:automatic-styles>',
      _colorRelations.join('') + '</office:automatic-styles>'
    );
    console.log(_file.data);
  },

  /** ======================================= PRE PROCESS ODT ==================================== */

  preProcessODT : function (template, options) {
    let _file = file.getTemplateFile(template, 'content.xml');
    if (_file !== null) {
      // 1 - Get the bindColor markers
      color.getBindColorMarkers(_file.data, function (
        err,
        fileContentFromGetBindColor,
        bindColorList
      ) {
        if (!!err === true) {
          console.error(
            'Carbone bindColor error: the bindColor markers are incorrect: ' +
              err
          );
          return;
        }
        if (bindColorList.length === 0) {
          return ;
        }
        // 2 - Get the color references, text colors and background colors on the document
        color.getColorStyleListODT(
          fileContentFromGetBindColor,
          bindColorList,
          function (err, colorStyleList) {
            if (!!err === true) {
              return console.error(
                'Carbone bindColor error: getStyleColorODT: ' + err
              );
            }

            console.log(colorStyleList[1]);

            // 3 - Replace the marker color style name by a new color marker.
            options.colorStyleList = colorStyleList;
            for (let i = 0, j = colorStyleList.length; i < j; i++) {
              const styleElement = colorStyleList[i];

              // Create the new marker + formatter
              let _marker = '';
              let _markerPathReference = '';
              for (let k = 0, l = styleElement.colors.length; k < l; k++) {
                const colorElement = styleElement.colors[k];
                if (k === 0) {
                  _markerPathReference = colorElement.colorMarker;
                  _marker += `{${_markerPathReference}:updateColorAndGetReference(${colorElement.color}`;
                }
                else {
                  let _relativePath = null;
                  if (colorElement.colorMarker) {
                    _relativePath = helper.findMarkerRelativePath(_markerPathReference, colorElement.colorMarker);
                    if (_relativePath.indexOf('[') !== -1) {
                      console.error(`Carbone bindColor error: it is not possible to get the color binded to the following marker: '${colorElement.colorMarker}'`);
                      _relativePath = null;
                    }
                  }
                  _marker += `, ${_relativePath}, ${colorElement.color}`;
                }
              }
              _marker += `, ${styleElement.styleName})}`;

              const _regElementStyleAttribute = new RegExp(
                `text:style-name="(${styleElement.styleName})"`,
                'g'
              );
              // Replace the style name by the new marker and the formatter
              fileContentFromGetBindColor = fileContentFromGetBindColor.replace(
                _regElementStyleAttribute,
                function () {
                  return `text:style-name="${_marker}"`;
                }
              );
            }
            _file.data = fileContentFromGetBindColor;
            // console.log(_file.data);
          }
        );
      });
    }
  },

  /**
   * @private
   * @param {*} xmlContent
   */
  getBindColorMarkers : function (xmlContent, callback) {
    const _colorAlreadyAdded = [];
    const _bindColorArray = [];
    const _regexMarker = /{([^]*?)}/g;
    let _errorMarkers = '';

    xmlContent = xmlContent.replace(_regexMarker, function (marker) {
      if (marker.indexOf('bindColor') !== -1) {
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
          // Check if a color has already been included
          if (!_colorAlreadyAdded.includes(_bindColorMarkerArgs[1])) {
            _bindColorArray.push({
              referenceColor : _bindColorMarkerArgs[1], // example: "ff0000"
              colorType      : _bindColorMarkerArgs[2], // example: "#hexa"
              colorMarker    : _bindColorMarkerArgs[3], // example "d.color1"
            });
            _colorAlreadyAdded.push(_bindColorMarkerArgs[1]);
          }
          else {
            console.warn(`Carbone bindColor warning: 2 bindColor markers try to edit the same color '${_bindColorMarkerArgs[1]}'`);
          }
        }
        else {
          _errorMarkers += _bindColorMarker + ' ';
        }
        return '';
      }
      return marker;
    });
    if (_errorMarkers) {
      return callback(_errorMarkers);
    }
    return callback(null, xmlContent, _bindColorArray);
  },

  getColorFromRegex : function (regexColor, xmlContent, element) {
    const _regexResult = regexColor.exec(xmlContent);
    return {
      color : !!_regexResult && !!_regexResult[1] ? _regexResult[1] : null,
      element,
    };
  },

  /**
   * @private
   * @param {*} xmlContent
   * @param {*} bindColorArray
   */
  getColorStyleListODT : function (xmlContent, bindColorList, callback) {
    let _xmlStyleColors = [];
    let xmlStyleColorTag = null;
    const _regexStyleColor = /<style:style[^]*?style:style>/g;
    // Retrieve all the document style to compare the colors references with the bindColor reference
    // eslint-disable-next-line no-cond-assign
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
        const _styleFamily = /style:family="([^"<>]*?)"/.exec(xmlStyleColorTag[0])[1];
        const _colors = [];
        const _colorResp = color.getColorFromRegex(
          /fo:color="([^"<>]*?)"/,
          xmlStyleColorTag[0],
          color.elementTypes.TEXT_COLOR
        );
        if (_colorResp.color) {
          _colors.push(_colorResp);
        }
        const _colorBgResp = color.getColorFromRegex(
          /fo:background-color="([^"<>]*?)"/,
          xmlStyleColorTag[0],
          color.elementTypes.TEXT_BG_COLOR
        );
        if (_colorBgResp.color) {
          _colors.push(_colorBgResp);
        }
        let newStyleColors = {
          styleName   : _styleName,
          styleFamily : _styleFamily,
          colors      : _colors,
        };

        // Compare bindColor markers with the styles and detects if a color needs to be changeds
        for (let i = 0; i < bindColorList.length; i++) {
          newStyleColors.colors.forEach((el) => {
            if (
              el.color &&
              el.color === '#' + bindColorList[i].referenceColor
            ) {
              newStyleColors.dynColor = true;
              el.colorMarker = bindColorList[i].colorMarker;
            }
          });
        }


        if (newStyleColors.dynColor === true) {
          newStyleColors.colors = newStyleColors.colors.sort((a) => {
            if (!a.colorMarker || (a.colorMarker && !(a.colorMarker.indexOf('[') !== -1 ))) {
              return 1;
            }
            return 0;
          });
          _xmlStyleColors.push(newStyleColors);
        }
      }
    }
    return callback(null, _xmlStyleColors);
  },

  /**
   * Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   */
  getColorReference : function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },
  elementTypes : {
    TEXT_COLOR    : 'textColor',
    TEXT_BG_COLOR : 'textBackgroundColor',
  },
};

module.exports = color;
