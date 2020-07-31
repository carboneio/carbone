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
    let _colorXmlRelations = [];
    let _colorIt = options.colorDatabase.entries();
    let _item = _colorIt.next();
    while (_item.done === false) {
      const _styleFamily = _item.value[1].styleFamily;
      const _rId = color.getColorReference(_item.value[1].id);
      let _newColorAttributes = '';
      for (let i = 0, j = _item.value[1].colors.length; i < j; i++) {
        const _colors = _item.value[1].colors[i];
        // newColor null means the color should not be replace and it is using the original color, it happens when a static color has been applied
        let _newColor = _colors.newColor === 'null' ? _colors.oldColor : _colors.newColor;
        // Convert the color from the color format passed to bindColor;
        if (_colors.colorType) {
          _newColor = color.colorFormatConverter[_colors.colorType](_newColor);
        }
        if (_colors.element === color.elementTypes.TEXT_COLOR) {
          _newColorAttributes += `fo:color="${_newColor}" `;
        }
        else if (_colors.element === color.elementTypes.TEXT_BG_COLOR) {
          _newColorAttributes += `fo:background-color="${_newColor}" `;
        }
      }
      if (_rId && _newColorAttributes && _styleFamily) {
        // TODO:
        // - [ ] change the inner tag by a custom tag which depends on the style familly (for graphics)
        _colorXmlRelations.push(`<style:style style:name="${_rId}" style:family="${_styleFamily}"><style:text-properties ${_newColorAttributes}/></style:style>`);
      }
      else {
        debug('PostProcess color: the Color/rId are invalid.');
      }
      _item = _colorIt.next();
    }
    _file.data = _file.data.replace(
      '</office:automatic-styles>',
      _colorXmlRelations.join('') + '</office:automatic-styles>'
    );
    // console.log(_file.data);
  },

  /** ======================================= PRE PROCESS ODT ==================================== */

  preProcessODT : function (template, options) {
    let _file = file.getTemplateFile(template, 'content.xml');
    if (_file === null) {
      debug('Carbone preprocess bindColor error: `content.xml` does not exist');
      return ;
    }
    /** 1 - Get the bindColor markers */
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
      const _colorStyleList = color.getColorStyleListODT(fileContentFromGetBindColor, bindColorList);

      /**  3 - Replace the marker color style name by a new color marker + formatters. */
      const _colorStyleListKeys = Object.keys(_colorStyleList);
      for (let i = 0, j = _colorStyleListKeys.length; i < j; i++) {
        const styleName = _colorStyleListKeys[i];
        const styleProperties = _colorStyleList[styleName];
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
              _relativePath = helper.getMarkerRelativePath(_markerPathReference, colorElement.marker);
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
      _file.data = fileContentFromGetBindColor;
      // colorStyleList saved for post processing
      options.colorStyleList = _colorStyleList;
    });
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
          if (_colorAlreadyAdded.includes(_bindColorArgs[1])) {
            // Check if a color has already been included
            console.warn(`Carbone bindColor warning: 2 bindColor markers try to edit the same color '${_bindColorArgs[1]}'.`);
          }
          else if (!color.colorFormatConverter[_bindColorArgs[2]]) {
            // Check if a the color format exists
            console.warn('Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".');
          }
          else if (!parser.isCarboneMarker(_bindColorArgs[3])) {
            console.warn(`Carbone bindColor warning: the marker is not valid '${_bindColorArgs[3]}'.`);
          }
          else {
            _bindColorArray.push({
              referenceColor : '#' + _bindColorArgs[1], // example: "ff0000"
              colorType      : _bindColorArgs[2], // example: "#hexa"
              marker         : _bindColorArgs[3], // example "d.color1"
            });
            _colorAlreadyAdded.push(_bindColorArgs[1]);
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
  getColorStyleListODT : function (xmlContent, bindColorList) {
    let _colorStyleList = {};
    let xmlStyleColorTag = null;
    const _regexStyleColor = /<style:style[^]*?style:style>/g;
    // Retrieve all the document style to compare the colors references with the bindColor reference
    // eslint-disable-next-line no-cond-assign
    while ((xmlStyleColorTag = _regexStyleColor.exec(xmlContent)) !== null) {
      if (
        xmlStyleColorTag &&
        !!xmlStyleColorTag[0] &&
        xmlStyleColorTag[0].indexOf('color="') !== -1 &&
        xmlStyleColorTag[0].indexOf('style:family="') !== -1 &&
        xmlStyleColorTag[0].indexOf('style:name="') !== -1
      ) {
        let _hasDynColor = false;
        let _colors = [];
        // Retrieve the style name, familly, color and background color
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

        // Compare bindColor markers with the styles and detects if a color needs to be changed
        for (let i = 0, j = bindColorList.length; i < j; i++) {
          for (let k = 0, l = _colors.length; k < l; k++) {
            const col = _colors[k];
            if (
              col.color && col.color === bindColorList[i].referenceColor
            ) {
              _hasDynColor = true;
              col.marker = bindColorList[i].marker;
              col.colorType = bindColorList[i].colorType;
            }
          }
        }
        if (_hasDynColor === true) {
          // Sorting used during the creation of the new marker + formatter, it is doing 2 verifications:
          // - sort the colors to always make a list marker first.
          // - if the first marker is undefined and the second color is a marker, the second become first
          _colors = _colors.sort((a, b) => {
            if ((!!a.marker === false && !!b.marker === true) || (b.marker && b.marker.indexOf('[') !== -1 )) {
              return 1;
            }
            return 0;
          });
          _colorStyleList[_styleName] = {
            styleFamily : _styleFamily,
            colors      : _colors,
          };
        }
      }
    }
    return _colorStyleList;
  },

  /**
   * Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   */
  getColorReference : function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },
  /**
   * Return a value from a regex and a specified content. A group have to be defined on the regex.
   * @param {*} regex
   * @param {*} xmlContent
   */
  getValueFromRegex : function (regex, xmlContent) {
    const _regexResult = regex.exec(xmlContent);
    return !!_regexResult && !!_regexResult[1] ? _regexResult[1] : null;
  },
  /**
   * @description Color converters
   */
  colorFormatConverter : {
    '#hexa' : ((x) => x),
    hexa    : ((x) => '#' + x),
    rgb     : ({r, g, b}) => {
      return '#' + (0x1000000+(b | g << 8 | r << 16)).toString(16).slice(1);
    },
    hsl : (hslArg) => {
      const _rgb = color.colorFormatConverter.hslToRgb(hslArg);
      return color.colorFormatConverter.rgb(_rgb);
    },
    color : (colorString) => {
      const colorList = {
        red     : '#ff0000',
        green   : '#00ff00',
        blue    : '#0000ff',
        magenta : '#ff00ff',
        yellow  : '#ffff00',
        cyan    : '#00ffff',
      };
      return colorList[colorString];
    },
    hslToRgb : ({h, s, l}) => {
      // conversion to compute in the set of [0-1/0-1/0-1] instead of [0-360/0-100/0-100]
      if (h > 1 || s > 1 || l > 1) {
        h /= 360;
        s /= 100;
        l /= 100;
      }
      var r;
      var g;
      var b;

      if (s === 0) {
        // achromatic
        b = g = r = l;
      }
      else {
        var hue2rgb = function hue2rgb (p, q, t) {
          if (t < 0) {
            t += 1;
          }
          if (t > 1) {
            t -= 1;
          }
          if (t < 1/6) {
            return p + (q - p) * 6 * t;
          }
          if (t < 1/2) {
            return q;
          }
          if (t < 2/3) {
            return p + (q - p) * (2/3 - t) * 6;
          }
          return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return {r : Math.round(r * 255), g : Math.round(g * 255), b : Math.round( b * 255)};
    },
  },
  elementTypes : {
    TEXT_COLOR    : 'textColor',
    TEXT_BG_COLOR : 'textBackgroundColor',
  },
};

module.exports = color;
