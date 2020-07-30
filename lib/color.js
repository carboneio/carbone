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
      const _newColorAttributes = _item.value[1].colors.reduce( (previousValue, value) => {
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
      }, '');
      if (_rId && _newColorAttributes && _styleFamily) {
        // TODO:
        // - [ ] change the inner tag by a custom tag which depends on the style familly (for graphics)
        _colorRelations.push(`<style:style style:name="${_rId}" style:family="${_styleFamily}"><style:text-properties ${_newColorAttributes}/></style:style>`);
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
        // stop immediately if no bindColor marker has been found
        if (bindColorList.length === 0) {
          return ;
        }
        /** 2 - Get ODT styles that going to be replace by a dynamic colors. */
        color.getColorStyleListODT(
          fileContentFromGetBindColor,
          bindColorList,
          function (err, colorStyleList) {
            if (!!err === true) {
              return console.error(
                'Carbone bindColor error: getStyleColorODT: ' + err
              );
            }

            console.log(colorStyleList);

            // 3 - Replace the marker color style name by a new color marker.
            const _colorStyleListKeys = Object.keys(colorStyleList);
            for (let i = 0, j = _colorStyleListKeys.length; i < j; i++) {
              const styleName = _colorStyleListKeys[i];
              const styleProperties = colorStyleList[styleName];
              // Create the new marker + formatter
              let _newMarker = '';
              let _markerPathReference = '';
              for (let k = 0, l = styleProperties.colors.length; k < l; k++) {
                const colorElement = styleProperties.colors[k];
                if (k === 0) {
                  _markerPathReference = colorElement.marker;
                  _newMarker += `{${_markerPathReference}:updateColorAndGetReference(${colorElement.color}`;
                }
                else {
                  // if colorElement.marker is undefined, the color is static
                  let _relativePath = null;
                  if (colorElement.marker) {
                    _relativePath = helper.findMarkerRelativePath(_markerPathReference, colorElement.marker);
                    if (_relativePath.indexOf('[') !== -1) {
                      console.error(`Carbone bindColor error: it is not possible to get the color binded to the following marker: '${colorElement.marker}'`);
                      _relativePath = null;
                    }
                  }
                  _newMarker += `, ${_relativePath}, ${colorElement.color}`;
                }
              }
              _newMarker += `, ${styleName})}`;

              // Replace the style name by the new marker and the formatter
              const _regElementStyleAttribute = new RegExp(`text:style-name="(${styleName})"`, 'g');
              fileContentFromGetBindColor = fileContentFromGetBindColor.replace(_regElementStyleAttribute, function () {
                return `text:style-name="${_newMarker}"`;
              });
            }
            options.colorStyleList = colorStyleList;
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
        let _bindColorMarkerWithoutXML = parser.removeWhitespace(
          parser.extractMarker(marker)
        );
        // Get bindColor arguments
        let _bindColorArgs = /\(([^]*?),([^]*?)\).*?=([^}]*)/g.exec(
          _bindColorMarkerWithoutXML
        );

        if (
          _bindColorArgs !== null &&
          _bindColorArgs.length >= 4 &&
          !!_bindColorArgs[1] &&
          !!_bindColorArgs[2] &&
          !!_bindColorArgs[3]
        ) {
          // Check if a color has already been included
          if (!_colorAlreadyAdded.includes(_bindColorArgs[1])) {
            _bindColorArray.push({
              referenceColor : _bindColorArgs[1], // example: "ff0000"
              colorType      : _bindColorArgs[2], // example: "#hexa"
              marker         : _bindColorArgs[3], // example "d.color1"
            });
            _colorAlreadyAdded.push(_bindColorArgs[1]);
          }
          else {
            console.warn(`Carbone bindColor warning: 2 bindColor markers try to edit the same color '${_bindColorArgs[1]}'`);
          }
        }
        else {
          _errorMarkers += _bindColorMarkerWithoutXML + ' ';
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
  /**
   * @private
   * @param {*} xmlContent
   * @param {*} bindColorArray
   * @return {Array<Object>} a list of the style name, family name, text colors and background color
   */
  getColorStyleListODT : function (xmlContent, bindColorList, callback) {
    let _colorStyleList = [];
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
        let _hasDynColor = false;
        let _colors = [];
        // eslint-disable-next-line no-unused-vars
        const _styleName = color.getValueFromRegex(/style:name="([^"<>]*?)"/, xmlStyleColorTag[0]);
        const _styleFamily = color.getValueFromRegex(/style:family="([^"<>]*?)"/, xmlStyleColorTag[0]);
        let _regResp = color.getValueFromRegex(/fo:color="([^"<>]*?)"/, xmlStyleColorTag[0]);
        if (_regResp) {
          _colors.push({
            color   : _regResp,
            element : color.elementTypes.TEXT_COLOR
          });
        }
        _regResp = color.getValueFromRegex(/fo:background-color="([^"<>]*?)"/, xmlStyleColorTag[0]);
        if (_regResp) {
          _colors.push({
            color   : _regResp,
            element : color.elementTypes.TEXT_BG_COLOR
          });
        }

        // Compare bindColor markers with the styles and detects if a color needs to be changeds
        // TODO
        // - [ ] manage color format
        for (let i = 0, j = bindColorList.length; i < j; i++) {
          for (let k = 0, l = _colors.length; k < l; k++) {
            const col = _colors[k];
            if (
              col.color && col.color === '#' + bindColorList[i].referenceColor
            ) {
              _hasDynColor = true;
              col.marker = bindColorList[i].marker;
            }
          }
        }
        if (_hasDynColor === true) {
          // sort the colors to always make a list marker first. It is used during the creation of the new marker + formatter
          _colors = _colors.sort((a) => {
            if (!a.marker || (a.marker && !(a.marker.indexOf('[') !== -1 ))) {
              return 1;
            }
            return 0;
          });
          _colorStyleList = {
            [_styleName] : {
              styleFamily : _styleFamily,
              colors      : _colors,
            }
          };
        }
      }
    }
    return callback(null, _colorStyleList);
  },

  /**
   * Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   */
  getColorReference : function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },

  getValueFromRegex : function (regex, xmlContent) {
    const _regexResult = regex.exec(xmlContent);
    return !!_regexResult && !!_regexResult[1] ? _regexResult[1] : null;
  },
  elementTypes : {
    TEXT_COLOR    : 'textColor',
    TEXT_BG_COLOR : 'textBackgroundColor',
  },
};

module.exports = color;
