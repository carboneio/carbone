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

        // newColor null or undefined means the color should not be replace and it is using the original color,
        // it happens when a static color has been applied OR the builder is returning a non existing variable on the JSON dataset
        let _newColor = '';
        if (!_colors.newColor || _colors.newColor === 'null' || _colors.newColor === 'undefined') {
          _newColor = _colors.oldColor;
        }
        else if (_colors.colorType) {
          // Convert the color from the color format passed to bindColor;
          _newColor = color.colorFormatConverter[_colors.colorType](_colors.newColor, 'odt');
        }

        if (_newColor && _colors.element === color.elementTypes.TEXT_COLOR) {
          _newColorAttributes += `fo:color="${_newColor}" `;
        }
        else if (_newColor && _colors.element === color.elementTypes.TEXT_BG_COLOR) {
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
  },

  /** ======================================= PRE PROCESS ODT ==================================== */

  preProcessOdt : function (template, options) {
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
        throw new Error('Carbone bindColor error: ' + err);
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
                throw new Error(`Carbone bindColor error: it is not possible to get the color binded to the following marker: '${colorElement.marker}'`);
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

  /** ======================================= PRE PROCESS DOCX ==================================== */
  preProcessDocx : function (template) {
    let _file = null;
    for (var i = 0, j = template.files.length; i < j; i++) {
      if (template.files[i].name.indexOf('document.xml') !== -1) {
        _file = template.files[i];
      }
    }
    if (_file === null) {
      debug('Carbone preprocess bindColor error: `document.xml` does not exist');
      return ;
    }
    color.getBindColorMarkers(_file.data, function (
      err,
      xmlContentFromGetBindColor,
      bindColorList
    ) {
      if (!!err === true) {
        throw new Error('Carbone bindColor error: ' + err);
      }
      // stop immediately if no bindColor marker has been found
      if (bindColorList.length === 0) {
        return ;
      }
      _file.data = xmlContentFromGetBindColor.replace(/<w:rPr>[^]*?<\/w:rPr>/g, function (xml) {
        for (let i = 0, j = bindColorList.length; i < j; i++) {
          const _refColor = bindColorList[i].referenceColor;
          // replace the text and background color
          const _regexColor = new RegExp(`<w:(color|highlight) w:val="(${_refColor}|${_refColor.toUpperCase()}|${_refColor.toLowerCase()})"/>`, 'g');
          xml = xml.replace(_regexColor, function (xmlTag, tagType) {
            // Default element is a text
            let _elementType = color.elementTypes.TEXT_COLOR;
            // If the tag is a background color, it changes the element and check the color format.
            if (tagType === 'highlight') {
              _elementType = color.elementTypes.TEXT_BG_COLOR;
              if (bindColorList[i].colorType !== 'color') {
                throw new Error(`Carbone bindColor warning: the background color on DOCX documents can only be changed with the color name format, use the color format "color" instead of "${bindColorList[i].colorType}".`);
              }
            }
            return `<w:${tagType} w:val="{${bindColorList[i].marker}:getAndConvertColorDocx(${bindColorList[i].colorType}, ${_elementType})}"/>`;
          });
        }
        return xml;
      });
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
            throw new Error(`Carbone bindColor warning: 2 bindColor markers try to edit the same color "${_bindColorArgs[1]}".`);
          }
          else if (!color.colorFormatConverter[_bindColorArgs[2]]) {
            // Check if a the color format exists
            throw new Error('Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".');
          }
          else if (!parser.isCarboneMarker(_bindColorArgs[3])) {
            throw new Error(`Carbone bindColor warning: the marker is not valid "${_bindColorArgs[3]}".`);
          }
          else {
            _bindColorArray.push({
              referenceColor : _bindColorArgs[1][0] === '#' ? _bindColorArgs[1].slice(1) : _bindColorArgs[1], // example: "ff0000", it removes the hashtag if it is an hexadecimal.
              colorType      : _bindColorArgs[2], // example: "#hexa"
              marker         : _bindColorArgs[3], // example "d.color1"
            });
            _colorAlreadyAdded.push(_bindColorArgs[1]);
          }
        }
        else {
          throw new Error(`Carbone bindColor warning: the marker is not valid "${_bindColorMarkerWithoutXML}".`);
        }
        return '';
      }
      return marker;
    });
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
        // It is comparing without the hashtag at the beginning of the hexadecimal
        for (let i = 0, j = bindColorList.length; i < j; i++) {
          const _refColor = bindColorList[i].referenceColor[0] === '#' ? bindColorList[i].referenceColor.slice(1) : bindColorList[i].referenceColor;
          for (let k = 0, l = _colors.length; k < l; k++) {
            const _colProperties = _colors[k];
            let _col = null;
            if (_colProperties.color) {
              _col = _colProperties.color[0] === '#' ? _colProperties.color.slice(1) : _colProperties.color;
            }
            if (_col && _col === _refColor) {
              _hasDynColor = true;
              _colProperties.marker = bindColorList[i].marker;
              _colProperties.colorType = bindColorList[i].colorType;
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
    '#hexa' : ((x, reportFormat) => {
      if (x[0] === '#') {
        x = x.slice(1);
      }
      return color.colorFormatConverter.manageHexadecimalHashtag(x, reportFormat);
    }),
    hexa : ((x, reportFormat) => color.colorFormatConverter.manageHexadecimalHashtag(x, reportFormat)),
    rgb  : ({r, g, b}, reportFormat) => {
      const _newHexaColor = (0x1000000+(b | g << 8 | r << 16)).toString(16).slice(1);
      return color.colorFormatConverter.manageHexadecimalHashtag(_newHexaColor, reportFormat);
    },
    hsl : (hslArg, reportFormat) => {
      const _rgb = color.colorFormatConverter.hslToRgb(hslArg);
      return color.colorFormatConverter.manageHexadecimalHashtag(color.colorFormatConverter.rgb(_rgb), reportFormat);
    },
    color : (colorString, reportFormat, elementType) => {
      const _colorList = {
        red         : 'ff0000', green       : '00ff00', blue        : '0000ff', magenta     : 'ff00ff',
        yellow      : 'ffff00', cyan        : '00ffff', darkBlue    : '00008b', darkCyan    : '008b8b',
        darkGreen   : '006400', darkMagenta : '800080', darkRed     : '8b0000', darkYellow  : '706E0C',
        darkGray    : '666666', lightGray   : 'cccccc', black       : '000000', transparent : 'null'
      };
      if (!_colorList[colorString]) {
        var _alternativeColorName = helper.findClosest(colorString, _colorList);
        throw new Error(`Carbone bindColor warning: the color "${colorString}" does not exist. Do you mean "${_alternativeColorName}"?`);
      }
      // Manage the exception of background color on DOCX
      if (reportFormat && reportFormat === 'docx' &&
          elementType && elementType === color.elementTypes.TEXT_BG_COLOR) {
        return colorString;
      }
      return color.colorFormatConverter.manageHexadecimalHashtag(_colorList[colorString], reportFormat);
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
    manageHexadecimalHashtag : function (color, reportFormat) {
      if (reportFormat && reportFormat === 'odt') {
        return '#' + color;
      }
      // else docx
      return color;
    }
  },
  elementTypes : {
    TEXT_COLOR    : 'textColor',
    TEXT_BG_COLOR : 'textBackgroundColor',
  },
};

module.exports = color;