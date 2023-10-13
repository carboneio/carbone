const file = require('./file');
const parser = require('./parser');
const helper = require('./helper');
const debug = require('debug')('carbone:color');

const color = {
  /**
   * ======================================= POST PROCESS ODT/ODS ====================================
   *
   * @description Post-processing : update color id references on the files "content.xml" or "style.xml"
   * @description it is using options.colorDatabase (new colors) and options.colorStyleList (original style)
   * @private
   * @param  {Object}  template  template with all the XML files
   * @param  {Object} data     JSON dataset
   * @param  {Object} options  options object is needed for colorDatabase and colorStyleList
   * @return {Object}          template
   */
  postProcessLo : function (template, data, options) {
    // leave immediately if no post-processing is necessary
    if (
      options.colorDatabase === undefined ||
      options.colorDatabase.size === 0
    ) {
      return template;
    }

    for (let k = 0, l = template.files.length; k < l; k++) {
      const _file = template.files[k];
      // Get the bindColor marker only from content.xml and style.xml
      if (_file && _file.name.indexOf('content') === -1 && _file.name.indexOf('style') === -1) {
        continue;
      }

      // Create the colors relations from the new color
      let _colorXmlRelations = [];
      let _colorIt = options.colorDatabase.entries();
      let _item = _colorIt.next();
      while (_item.done === false) {
        const _rId = color.getColorReference(_item.value[1].id);
        // _originalStyleTag is used to retreive the style familly, color element and color type
        const _originalStyleTag = options.colorStyleList[_item.value[1].styleName];
        if (!_originalStyleTag) {
          debug('Carbone bindColor post process ODT error: the style color tag does not exist.');
          return;
        }
        if (_file.name === _originalStyleTag.file) {
          const _styleFamily = _originalStyleTag.styleFamily; // the familly of the tag ['paragraph', 'text', 'shape', 'table-cell']

          let _newColorAttributes = '';
          for (let i = 0, j = _item.value[1].colors.length; i < j; i++) {
            // Get the final COLOR
            const _colors = _item.value[1].colors[i];
            // Get the final color properties
            const _colorsProperties = color.getColorTagPropertiesLo(_colors.oldColor, _originalStyleTag.colors);
            // newColor null or undefined means the color should not be replace and it is using the original color,
            // it happens when a static color has been applied OR the builder is returning a non existing variable from the JSON dataset
            let _newColor = '';
            if (!_colors.newColor || _colors.newColor === 'null' || _colors.newColor === 'undefined') {
              _newColor = _colors.oldColor;
            }
            else if (_colorsProperties.colorType) {
              // Convert the color from the color format passed to bindColor;
              // The validation of "colorType" is already done during pre processing
              _newColor = color.colorFormatConverter[_colorsProperties.colorType](_colors.newColor, 'odt');
            }

            // FOR ODT
            if (options.extension === 'odt' || options.extension === 'odp') {
              if (_newColor && _colorsProperties.element && _colorsProperties.element === color.elementTypes.TEXT_COLOR) {
                _newColorAttributes += `fo:color="${_newColor}"`;
              }
              else if (_newColor && _colorsProperties.element && _colorsProperties.element === color.elementTypes.TEXT_BG_COLOR) {
                _newColorAttributes += `fo:background-color="${_newColor}"`;
              }
              if (i + 1 < j) {
                _newColorAttributes += ' ';
              }
            }
            // FOR ODS
            else if (options.extension === 'ods') {
              if (_newColor && _colorsProperties.element && _colorsProperties.element === color.elementTypes.TEXT_COLOR) {
                _newColorAttributes += `<style:text-properties fo:color="${_newColor}"/>`;
              }
              else if (_newColor && _colorsProperties.element && _colorsProperties.element === color.elementTypes.TEXT_BG_COLOR) {
                _newColorAttributes += `<style:table-cell-properties fo:background-color="${_newColor}"/>`;
              }
            }
          }
          // Apply originals static attributes
          if (_originalStyleTag.attributes) {
            _newColorAttributes += _originalStyleTag.attributes;
          }
          // - [ ] to support graphics, a different inner tag with different attributes should be added to the _colorXmlRelations.
          if (_rId && _newColorAttributes && _styleFamily && options.extension === 'ods') {
            _colorXmlRelations.push(`<style:style style:name="${_rId}" style:family="${_styleFamily}">${_newColorAttributes}</style:style>`);
          }
          else if (_rId && _newColorAttributes && _styleFamily && options.extension === 'odt' && _styleFamily.indexOf('table-cell') !== -1 ) {
            _colorXmlRelations.push(`<style:style style:name="${_rId}" style:family="${_styleFamily}"><style:table-cell-properties ${_newColorAttributes}><style:background-image/></style:table-cell-properties></style:style>`);
          }
          else if (_rId && _newColorAttributes && _styleFamily && (options.extension === 'odt' || options.extension === 'odp')) {
            _colorXmlRelations.push(`<style:style style:name="${_rId}" style:family="${_styleFamily}"><style:text-properties ${_newColorAttributes}/></style:style>`);
          }
        }
        _item = _colorIt.next();
      }
      _file.data = _file.data.replace('</office:automatic-styles>', _colorXmlRelations.join('') + '</office:automatic-styles>');
    }
  },
  /**
   * @description It searchs and returns the color properties related to a specific color style tag
   * @private
   * @param {String} oldColor color reference coming from a colorDatabase element.
   * @param {Array} originalColorsProperties colors coming from the colorStyleList.
   * @return {Object} the color properties related to a specific color style tag.
   */
  getColorTagPropertiesLo : function (oldColor, originalColorsProperties) {
    for (let i = 0, j = originalColorsProperties.length; i < j; i++) {
      const _properties = originalColorsProperties[i];
      if (oldColor === _properties.color) {
        return {
          element   : _properties.element,
          colorType : _properties.colorType
        };
      }
    }
    return {};
  },
  /**
   * ======================================= PRE PROCESS ODT/ODS ====================================
   *
   * @description Pre-process the content by detecting bindColor markers
   * @description It inserts new markers with formatters that are going to be used in the post processing to generate dynamic colors.
   * @private
   * @param {Object} template Template with all the XML files.
   * @param {Object} options option object used to save the report style list (only the one to be replaced)
   */
  preProcessLo : function (template, options) {
    let _bindColorList = [];
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get the bindColor marker only from content.xml and style.xml
      if (_file && _file.name.indexOf('content') === -1 && _file.name.indexOf('style') === -1) {
        continue;
      }
      /** 1 - Get the bindColor markers */
      _bindColorList.push(...color.getBindColorMarkers(_file));
    }

    // stop immediately if no bindColor marker has been found
    if (_bindColorList.length === 0) {
      return ;
    }

    let _colorStyleList = {};
    for (let i = 0, j = template.files.length; i < j; i++) {
      const _file = template.files[i];
      // Get the bindColor marker only from content.xml and style.xml
      if (_file && _file.name.indexOf('content') === -1 && _file.name.indexOf('style') === -1) {
        continue;
      }
      /** 2 - Get ODT styles that going to be replace by a dynamic colors. */
      _colorStyleList = helper.mergeObjects(_colorStyleList, color.getColorStyleListLo(_file, _bindColorList));
    }

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
          _newMarker += `{${_markerPathReference}:updateColorAndGetReferenceLo(${colorElement.color}`;
        }
        else {
          // if colorElement.marker is undefined, the color is static
          let _relativePath = null;
          if (colorElement.marker) {
            _relativePath = helper.getMarkerRelativePath(_markerPathReference, colorElement.marker);
            // it is not possible to pass a list marker (ex: d.list[i].el) as a formatter argument
            if (_relativePath.indexOf('[') !== -1) {
              throw new Error(`Carbone bindColor error: it is not possible to get the color binded to the following marker: '${colorElement.marker}'`);
            }
          }
          _newMarker += `, ${_relativePath}, ${colorElement.color}`;
        }
      }
      _newMarker += `, ${styleName})}`;

      const _file = file.getTemplateFile(template, styleProperties.file);
      if (_file === null) {
        return; // file not supported
      }

      // Replace the style name by the new marker and the formatter
      const _regElementStyleAttribute = new RegExp(`(text|table):style-name="(${styleName})"`, 'g');
      _file.data = _file.data.replace(_regElementStyleAttribute, function (xml, tagType) {
        return `${tagType}:style-name="${_newMarker}"`;
      });
    }
    // colorStyleList saved for post processing
    options.colorStyleList = _colorStyleList;
  },

  /**
   * @description Parse the xml ODT/ODS content to find the color to be changed dynamically.
   * @description It returns a list of style with the color to replace and the colors properties.
   * @private
   * @param {Object} file object {name, data}
   * @param {String} bindColorArray
   * @return {Object} a list of the style name, family name, text colors and background color
   */
  getColorStyleListLo : function (file, bindColorList) {
    let _colorStyleList = {};
    let xmlStyleColorTag = null;
    const _regexStyleColor = /<style:style[^]*?style:style>/g;
    // Retrieve all the document style to compare the colors references with the bindColor reference
    // eslint-disable-next-line no-cond-assign
    while ((xmlStyleColorTag = _regexStyleColor.exec(file.data)) !== null) {
      if (
        xmlStyleColorTag &&
        !!xmlStyleColorTag[0] &&
        xmlStyleColorTag[0].indexOf('color="') !== -1 &&
        xmlStyleColorTag[0].indexOf('style:family="') !== -1 &&
        xmlStyleColorTag[0].indexOf('style:name="') !== -1
      ) {
        let _xmlColorStyleTag = xmlStyleColorTag[0];
        let _hasDynColor = false;
        let _colors = [];
        // Retrieve color and background color
        let _newXmlColorStyleTag = _xmlColorStyleTag.replace(/\s?fo:(background-color|color)="([^"<>]*?)"/g, function (xml, xmlColorType, xmlColor) {
          _colors.push({
            id      : -1,
            color   : xmlColor,
            element : xmlColorType === 'color' ? color.elementTypes.TEXT_COLOR : color.elementTypes.TEXT_BG_COLOR
          });
          return '';
        });

        // Retrieve the static attributes (for example padding, ids or border styles)
        const _staticAttributes = color.getValueFromRegex(/<style:(text-properties|table-cell-properties)([^<>/]*?)\/?>/g, _newXmlColorStyleTag, 2);

        // Compare bindColor markers with the styles and detects if a color needs to be changed
        // It is comparing the colors without the hashtag at the beginning of the hexadecimal
        for (let i = 0, j = bindColorList.length; i < j; i++) {
          const _refColor = bindColorList[i].referenceColor[0] === '#' ? bindColorList[i].referenceColor.slice(1) : bindColorList[i].referenceColor;
          for (let k = 0, l = _colors.length; k < l; k++) {
            const _colProperties = _colors[k];
            let _col = null;
            // Remove the hashtag
            if (_colProperties.color) {
              _col = _colProperties.color[0] === '#' ? _colProperties.color.slice(1) : _colProperties.color;
            }
            // Compare the bindColor color with the style tag color (lower or upper case)
            if (_col && (_col === _refColor || _col === _refColor.toLowerCase() || _col === _refColor.toUpperCase())) {
              _hasDynColor = true;
              _colProperties.marker = bindColorList[i].marker;
              _colProperties.colorType = bindColorList[i].colorType;
              _colProperties.id = 0;
              if (_colProperties.marker.indexOf('[') !== -1) {
                _colProperties.id = 1;
              }
            }
          }
        }
        if (_hasDynColor === true) {
          // Retrieve the style name, familly, color and background color
          const _styleFamily = color.getValueFromRegex(/style:family="([^"<>]*?)"/, xmlStyleColorTag[0], 1);
          const _styleName = color.getValueFromRegex(/style:name="([^"<>]*?)"/, xmlStyleColorTag[0], 1);
          // The sorting is used during the creation of the new color marker with a formatter `:updateColorAndGetReferenceLo`, The order of colors matters and it is used for solving two issues:
          // - sort the colors to always make a list marker first, example: {d.list[i].element:updateColorAndGetReferenceLo(#00ff00, .element, #ff0000)}
          // - if the first marker is undefined (static color from the report) and the second color is a marker (dynamic color), the second become first {d.newColor:updateColorAndGetReferenceLo(#00ff00, undefined, #ff0000)}
          // console.log(_colors);
          _colors = _colors.sort((a, b) =>  b.id - a.id);

          _colorStyleList[_styleName] = {
            file        : file.name,
            styleFamily : _styleFamily,
            colors      : _colors,
            attributes  : _staticAttributes
          };
        }
      }
    }
    return _colorStyleList;
  },


  /**
   * ======================================= PRE PROCESS DOCX ====================================
   *
   * @description Search and find bindColor marker and insert markers with formatters to generate dynamically the new colors. DOCX reports don't need post processing.
   * @private
   * @param {Array} template with all the XML files
  */
  preProcessDocx : function (template) {
    let _file = null;
    let _bindColorList = [];
    /** 1. get a list of bind color, loop through the files "document/header/footer" */
    for (var i = 0, j = template.files.length; i < j; i++) {
      const _templateName = template.files[i].name;
      if (_templateName.indexOf('.xml') !== -1 &&
          _templateName.indexOf('.rels') === -1 &&
          (_templateName.indexOf('document') !== -1 || _templateName.indexOf('header') !== -1 || _templateName.indexOf('footer') !== -1)) {
        _bindColorList.push(...color.getBindColorMarkers(template.files[i]));
      }
    }

    // stop immediately if no bindColor marker has been found
    if (_bindColorList.length === 0) {
      return ;
    }
    /** 1. loop through the template xml files to get "document/header/footer" in the goal to find text properties with color referenced by bindColor */
    for (var k = 0, l = template.files.length; k < l; k++) {
      const _templateName = template.files[k].name;
      if (_templateName.indexOf('.xml') !== -1 &&
          _templateName.indexOf('.rels') === -1 &&
          (_templateName.indexOf('document') !== -1 || _templateName.indexOf('header') !== -1 || _templateName.indexOf('footer') !== -1)) {
        _file = template.files[k];
        // Find colors in texts or cells properties to generate a color marker
        _file.data = _file.data.replace(/<w:(tcPr|rPr)>[^]*?<\/w:(tcPr|rPr)>/g, function (xml) {
          for (let i = 0, j = _bindColorList.length; i < j; i++) {
            const _refColor = _bindColorList[i].referenceColor;
            // replace texts and backgrounds color
            const _regexColorText = new RegExp(`<w:(color|highlight) w:val="(${_refColor}|${_refColor.toUpperCase()}|${_refColor.toLowerCase()})"/>`, 'g');
            xml = xml.replace(_regexColorText, function (xmlTag, tagType) {
              // Default element is a text
              let _elementType = color.elementTypes.TEXT_COLOR;
              // If the tag is a background color, it changes the element and check the color format.
              if (tagType === 'highlight') {
                _elementType = color.elementTypes.TEXT_BG_COLOR;
                if (_bindColorList[i].colorType !== 'color') {
                  throw new Error(`Carbone bindColor warning: the background color on DOCX documents can only be changed with the color name format, use the color format "color" instead of "${_bindColorList[i].colorType}".`);
                }
              }
              return `<w:${tagType} w:val="{${_bindColorList[i].marker}:getAndConvertColorDocx(${_bindColorList[i].colorType}, ${_elementType})}"/>`;
            });
            // replace cells color
            let _colorChanged = false;
            const _regexColorCells = new RegExp(`w:(fill|color)="(${_refColor}|${_refColor.toUpperCase()}|${_refColor.toLowerCase()})"`, 'g');
            xml = xml.replace(_regexColorCells, function (xmlAttribute, tagType) {
              _colorChanged = true;
              return `w:${tagType}="{${_bindColorList[i].marker}:getAndConvertColorDocx(${_bindColorList[i].colorType}, ${color.elementTypes.TEXT_COLOR})}"`;
            });
            /**
             * If the color or the cell background changed, the `themeFill` must be removed,
             * otherwise the new color will not be printed.
             * The `themeFill` is used to color table cells background with different shades.
             * The theme is defined by the file `word/theme/theme1.xml`
            */
            if (_colorChanged === true) {
              xml = xml.replace(/\s?w:themeFill="[^]*?"/g, function () {
                return '';
              })
            }
          }
          return xml;
        });
        _file.data = _file.data.replace(/<w:drawing>[^]*?<\/w:drawing>/g, function (xml) {
          for (let i = 0, j = _bindColorList.length; i < j; i++) {
            const _refColor = _bindColorList[i].referenceColor;
            // replace color in graphics
            const _regexColorCells = new RegExp(`a:srgbClr val="(?:${_refColor}|${_refColor.toUpperCase()}|${_refColor.toLowerCase()})"`, 'g');
            xml = xml.replace(_regexColorCells, function () {
              return `a:srgbClr val="{${_bindColorList[i].marker}:getAndConvertColorDocx(${_bindColorList[i].colorType}, ${color.elementTypes.TEXT_COLOR})}"`;
            });
          }
          return xml;
        });
      }
    }
  },
  /**
   * @description Search bindColor markers and it returns through a callback an error, the xml content without bindColor markers and a list of bindColor
   * @private
   * @param {String} xmlContent content from any kind of XML report
   * @param {Function} callback callback function that takes 3 arguments: (err, newXmlContent, bindColorList)
   */
  getBindColorMarkers : function (_file) {
    const _colorAlreadyAdded = [];
    const _bindColorArray = [];
    const _regexMarker = new RegExp(/{\s*(bindColor)\s*\(\s*([^,]*?)\s*,?\s*([^,]*?)\s*\)\s*=\s*([^}]*?)\s*}/, 'g');
    if (!_file || !_file.data) {
      return _bindColorArray;
    }
    _file.data = _file.data.replace(_regexMarker, function (marker, bindColor, refColor, colorType, newColor) {
      if (!marker || !bindColor) {
        return '';
      }
      if (!refColor || !colorType || !newColor) {
        throw new Error(`Carbone bindColor warning: the marker is not valid "${marker}".`);
      }
      if (_colorAlreadyAdded.includes(refColor)) {
        // Check if a color has already been included
        throw new Error(`Carbone bindColor warning: 2 bindColor markers try to edit the same color "${refColor}".`);
      }
      else if (!color.colorFormatConverter[colorType]) {
        // Check if a the color format exists
        throw new Error('Carbone bindColor warning: the color format does not exist. Use one of the following: "#hexa", "hexa", "color", "hsl", "rgb".');
      }
      else if (!parser.isCarboneMarker(newColor)) {
        throw new Error(`Carbone bindColor warning: the marker is not valid "${newColor}".`);
      }
      else {
        _bindColorArray.push({
          referenceColor : refColor[0] === '#' ? refColor.slice(1) : refColor, // example: "ff0000", it removes the hashtag if it is an hexadecimal.
          colorType      : colorType, // example: "#hexa"
          marker         : newColor,  // example "d.color1"
        });
        _colorAlreadyAdded.push(refColor);
      }
      return '';
    });
    return _bindColorArray;
  },
  /**
   * @description Return a color reference shared with the style and text elements on the xml file `content.xml`
   * @private
   * @param {String} id Id of the new color reference
   */
  getColorReference : function (id) {
    /** CC == Carbone Color */
    return `CC${id}`;
  },
  /**
   * @description It returns a value from a regex that specify a group of content.
   * @description A group have to be defined on the regex. Otherwhise it returns null.
   * @private
   * @param {RegExp} regex new regex with a group `()`
   * @param {String} xmlContent any kind of content as a string
   * @returns {String} Return the value matching the regex group.
   */
  getValueFromRegex : function (regex, xmlContent, pos = 0) {
    const _regexResult = regex.exec(xmlContent);
    return _regexResult && _regexResult[pos] ? _regexResult[pos] : '';
  },
  /**
   * @description An object of functions to convert colors.
   * @description Color formats available: `#hexa`, `hexa`, `color`, `hsl`, and `rgb`.
   * @description Every color format function return the color as an hexadecimal.
   * @private
   * @example to convert rgb color to hexa:
   * @example color.colorFormatConverter['rgb']({r : 255, g : 0, b : 255}, "odt") === "#ff00ff"
   * @example to convert color name to hexa:
   * @example color.colorFormatConverter['color']("red", "docx") === "ff0000"
   */
  colorFormatConverter : {
    '#hexa' : ((x, reportFormat) => {
      if (x && x[0] === '#') {
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
      // The hexadecimal colors are the interpreted colors in Libre Office from a DOCX template using background color names created in Word.
      const _colorList = {
        red         : 'ff0000', green       : '00ff00', blue        : '0000ff', magenta     : 'ff00ff',
        yellow      : 'ffff00', cyan        : '00ffff', darkBlue    : '000080', darkCyan    : '008080',
        darkGreen   : '008000', darkMagenta : '800080', darkRed     : '800000', darkYellow  : '808000',
        darkGray    : '808080', lightGray   : 'c0c0c0', black       : '000000', transparent : '',
        white       : 'ffffff'
      };
      if (!Object.prototype.hasOwnProperty.call(_colorList, colorString)) {
        var _alternativeColorName = helper.findClosest(colorString, _colorList);
        throw new Error(`Carbone bindColor warning: the color "${colorString}" does not exist. Do you mean "${_alternativeColorName}"?`);
      }
      // Manage 2 exceptions about background color on DOCX
      if (reportFormat && reportFormat === 'docx' && elementType && elementType === color.elementTypes.TEXT_BG_COLOR) {
        // 1. transparent is not supported on DOCX MS Word
        if (colorString === 'transparent') {
          throw new Error('Carbone bindColor warning: DOCX document does not support "transparent" as a background color.');
        }
        // 2. color names are only supported for background color
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
    /**
     * @description Return the final color hexadecimal with or without hashtag based on the report type.
     * @private
     * @param {String} color hexadecimal color without hashtag
     * @param {String} reportFormat {Optional} report extension, for example: "docx", "odt". If the value is undefined/null, the color returned is without hashtag.
     * @returns {String} Return the hexadecimal color with or without an hashtag.
     */
    manageHexadecimalHashtag : function (color, reportFormat) {
      if (color && reportFormat && reportFormat === 'odt') {
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