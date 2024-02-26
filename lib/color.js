const file = require('./file');
const parser = require('./parser');
const helper = require('./helper');
const extracter = require('./extracter');
const html = require('./html');
const machine = require('./chart');
const debug = require('debug')('carbone:color');

// Sort all XML patch by scope priority first (paragraph -> cell -> row)
const SCOPE_PRIORITY = {
  row   : 1<<4, // 16 -> low priority
  cell  : 2<<4, // 32
  shape : 3<<4, // 48 -> high priority
  p     : 4<<4
};
const HIGHEST_SCOPE_PRIORITY = 15<<4;
const LOWEST_SCOPE_PRIORITY  = 0<<4;

// Then sort all XML patch by type
// Two patch can be applied at the same XML position, with the same scope priority, if the type is different (ex. text color + highlight )
const TYPE_PRIORITY_MASK  =  0b00001111;
const TYPE_PRIORITY = {
  text       : 1,
  background : 2,
  highlight  : 3,
  border     : 4
};
// hidden color type to force the system to insert some specific XML string
const TYPE_CUSTOM_XML_1 = 14;
const TYPE_CUSTOM_XML_2 = 15;


// DOCX ----------------------------------------------------------------------------------------------------------------------------
const applyTextColorOffice = {
  main : {
    '<w:rPr' : (ctx) => {
      ctx.isColorApplied = false;
      return 'inRunStyle';
    }
  },
  inRunStyle : {
    '</w:rPr' : (...args) => {
      const _tag = args[0].colorTag;
      // add color on paragraph if it was not already done by inColorValue step (when the xml tag is already present)
      addXMLBeforeAndUpdateXMLOutput(...args, `<w:color w:val="${_tag.src}"/>`);
      return 'main';
    },
    '<w:color' : () => 'inColorValue'
  },
  inColorValue : {
    ' w:val="' : (...args) => {
      const _tag = args[0].colorTag;
      // patch existing color
      replaceXMLAttributeAndUpdateXMLOutput(...args, _tag.src);
      return 'inRunStyle';
    }
  }
};

// http://officeopenxml.com/WPshading.php
const applyBackgroundColorInCellsOffice = {
  main : {
    '<w:tcPr' : (ctx) => {
      ctx.isColorApplied = false; // reset for each cell, this boolean is used to avoid adding an XML tag for color if it already exists (check "low priority", "high priority" below)
      return 'inCellStyle';
    }
  },
  inCellStyle : {
    '</w:tcPr' : (...args) => {
      const _tag = args[0].colorTag;
      // add color on cell if it was not already done by inBackroundColor step (when the xml tag is already present)
      addXMLBeforeAndUpdateXMLOutput(...args, `<w:shd w:val="clear" w:fill="${_tag.src}"/>`);
      return 'main';
    },
    '<w:shd' : () => 'inBackroundColor'
  },
  inBackroundColor : {
    '/>'        : () => 'inCellStyle', // TODO, should we listen for ">" instead?
    ' w:fill="' : (...args) => {
      const _tag = args[0].colorTag;
      // patch existing color
      replaceXMLAttributeAndUpdateXMLOutput(...args, _tag.src);
      return 'inBackroundColor';
    },
    /* If the color or the cell background changed, the `themeFill` must be removed,  otherwise the new color will not be printed.
       The `themeFill` is used to color table cells background with different shades.The theme is defined by the file `word/theme/theme1.xml  */
    ' w:themeFill="' : (...args) => {
      removeXMLAttribute(...args);
      return 'inBackroundColor';
    }
  }
};

const applyPageBackgroundColorOffice = {
  main : {
    '<w:background' : () => {
      return 'inBackroundColor';
    },
    '<w:body' : (...args) => {
      const _tag = args[0].colorTag;
      addXMLBeforeAndUpdateXMLOutput(...args, `<w:background w:color="${_tag.src}"/>`);
      return 'main';
    }
  },
  inBackroundColor : {
    ' w:color="' : (...args) => {
      const _tag = args[0].colorTag;
      // patch existing color
      replaceXMLAttributeAndUpdateXMLOutput(...args, _tag.src);
      return 'main';
    },
  }
};


const applyShapeBackgroundOrBorderColorOffice = (type = 'border') => {
  const _border = type === 'border' ? ['<a:ln>', '</a:ln>']  : ['', ''];
  return {
    main : {
      '<wps:spPr' : (ctx) => {
        ctx.isColorApplied = false;
        return 'inShapeStyle';
      }
    },
    inShapeStyle : {
      '</wps:spPr' : (...args) => {
        const _tag = args[0].colorTag;
        addXMLBeforeAndUpdateXMLOutput(...args, `${_border[0]}<a:solidFill><a:srgbClr val="${_tag.src}"/></a:solidFill>${_border[1]}`);
        return 'main';
      },
      '<a:solidFill' : () => 'inSolidFillBackgroundColor',
      '<a:ln'        : () => 'inBorderColor'
    },
    inBorderColor : {
      '</a:ln'        : () => 'inShapeStyle',
      '<a:solidFill'  : () => 'inSolidFillBorderColor'
    },
    inSolidFillBorderColor : {
      '</a:solidFill' : () => 'inBorderColor',
      '<a:srgbClr'    : () => {
        return (type === 'border') ? 'inColor' : 'inShapeStyle';
      }
    },
    inSolidFillBackgroundColor : {
      '</a:solidFill' : () => 'inShapeStyle',
      '<a:srgbClr'    : () => {
        return (type === 'border') ? 'inShapeStyle' : 'inColor';
      }
    },
    inColor : {
      ' val="' : (...args) => {
        replaceXMLAttributeAndUpdateXMLOutput(...args, args[0].colorTag.src);
        return 'inShapeStyle';
      }
    },
  };
};
const applyShapeBorderColorOffice = applyShapeBackgroundOrBorderColorOffice('border');
const applyShapeBackgroundColorOffice = applyShapeBackgroundOrBorderColorOffice('background');



// HTML ----------------------------------------------------------------------------------------------------------------------------
const TYPE_TO_CSS = {
  text       : 'color',
  background : 'background-color'
  // TODO if we add other properties, make sure the priority is different for each one (search #PRIORITY_HTML in the code below)
};
const SCOPE_TO_HTML = {
  p    : 'p',
  row  : 'tr',
  cell : 'td'
};
const applyTextColorHTML = (type = 'text', scope = 'row') => {
  const _cssProperty = TYPE_TO_CSS[type];
  return {
    main : {
      ['<' + SCOPE_TO_HTML[scope]] : (ctx) => {
        ctx.isColorApplied = false;
        return 'inHTMLRowOrCellOrP';
      }
    },
    inHTMLRowOrCellOrP : {
      ' style="' : (...args) => {
        const _tag = args[0].colorTag;
        // accept multiple css properties in the same style attribute
        replaceHtmlStyleAttributePatch(...args, _tag.src, _cssProperty);
        return 'inHTMLRowOrCellOrP';
      },
      '>' : (ctx, posEndOfLastTag, pos, posEnd) => {
        pos -= (ctx.xmlIn[pos - 1] === '/' ? 1 : 0);  // if self-closing tag
        const _tag = ctx.colorTag;
        if (ctx.isColorApplied === true) {
          // already applied if "style="  attributes exists (patched above)
          return;
        }
        ctx.xmlPatches.push({ from : pos, to : pos, add : 'style="', priority : HIGHEST_SCOPE_PRIORITY + TYPE_CUSTOM_XML_1 });
        addXMLBeforeAndUpdateXMLOutput(ctx, posEndOfLastTag, pos, posEnd, `${_cssProperty}:${_tag.src};`);
        ctx.xmlPatches.push({ from : pos, to : pos, add : '"', priority : LOWEST_SCOPE_PRIORITY + TYPE_CUSTOM_XML_2 });
        return 'main';
      }
    },
  };
};


// ODT/ODP/ODS ----------------------------------------------------------------------------------------------------------------------------
const replaceTextStyleLO = {
  main : {
    '<text:p'    : () => 'inParagraphOrSpan',
    '<text:span' : () => 'inParagraphOrSpan'
  },
  inParagraphOrSpan : {
    '>'                  : () => 'main',
    ' text:style-name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _tag = ctx.colorTag;
      const _styleName = replaceAttributeValueAndPassValueAsParam(ctx, posEndOfLastTag, pos, posEnd, _tag.src);
      ctx.xmlStyles[_styleName] = {}; // create a bank of style to copy and customize in post-processing
      return 'main';
    }
  }
};

const replaceTableCellShapeStyleLO = {
  main : {
    '<table:table-cell'  : () => 'inCell',
    '<draw:custom-shape' : () => 'inShape'
  },
  inCell : {
    '>'                   : () => 'main',
    ' table:style-name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _tag = ctx.colorTag;
      const _styleName = replaceAttributeValueAndPassValueAsParam(ctx, posEndOfLastTag, pos, posEnd, _tag.src);
      ctx.xmlStyles[_styleName] = {}; // create a bank of style to copy and customize in post-processing
      return 'main';
    }
  },
  inShape : {
    '>'                  : () => 'main',
    ' draw:style-name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _tag = ctx.colorTag;
      const _styleName = replaceAttributeValueAndPassValueAsParam(ctx, posEndOfLastTag, pos, posEnd, _tag.src);
      ctx.xmlStyles[_styleName] = {}; // create a bank of style to copy and customize in post-processing
      return 'inShape';
    },
    // If a shape contains some text, the background of the shape is defined in a separate style
    // So we must update both style for the same shape
    ' draw:text-style-name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _tag = ctx.colorTag;
      const _styleName = replaceAttributeValueAndPassValueAsParam(ctx, posEndOfLastTag, pos, posEnd, _tag.src);
      ctx.xmlStyles[_styleName] = {}; // create a bank of style to copy and customize in post-processing
      return 'inShape';
    }
  }
};


/* Read LibreOffice XML, find existing styles which dynamic colors and prepares patches to apply for each type of colors */
const readExistingStyleLO = {
  main : {
    '<style:style' : (ctx, posEndOfLastTag, pos) => {
      ctx.currentStyle = {
        startAt  : pos,
        file     : ctx.file,
        original : '',
        patches  : { text : [], highlight : [], background : [], border : [], styleName : []}
      };
      return 'inStyle';
    }
  },
  inStyle : {
    ' style:name="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
      const _value               = ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
      if (ctx.xmlStyles[_value] !== undefined) { // keep and parse only styles which needs special colors
        ctx.xmlStyles[_value] = ctx.currentStyle;
        replaceLOStyleValue(ctx, ctx.currentStyle.patches.styleName, pos, posEnd, TYPE_CUSTOM_XML_1);
        return 'inStyle'; // keep on analyzing the style
      }
      return 'main'; // go to next style
    },
    // ODT or ODP text or cell
    '<style:text-properties'       : () => 'inTextProperties',
    '<style:table-cell-properties' : () => 'inTableCellProperties',
    // ODT or ODP shapes
    '<style:graphic-properties'    : () => 'inShapeProperties',
    // ODP cells,
    // or ODT shape that contains some text. In that case, the background color of the shape is defined in a separate style. So we can update two style for the same shape
    '<loext:graphic-properties'    : () => 'inTableCellPropertiesODP',
    // all
    '</style:style'                : (ctx, posEndOfLastTag, pos, posEnd) => {
      // store a copy of the orginal XML string of the style
      ctx.currentStyle.original = ctx.xmlIn.slice(ctx.currentStyle.startAt, posEnd + 1);
      return 'main';
    }
  },
  inTextProperties : {
    ' fo:color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.text, pos, posEnd, TYPE_PRIORITY.text);
      return 'inTextProperties';
    },
    ' fo:background-color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.highlight, pos, posEnd, TYPE_PRIORITY.highlight);
      return 'inTextProperties';
    },
    '>' : (ctx, posEndOfLastTag, pos) => {
      pos -= (ctx.xmlIn[pos - 1] === '/' ? 1 : 0);  // if self-closing tag
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.text     , pos, 'fo:color', TYPE_PRIORITY.text);
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.highlight, pos, 'fo:background-color', TYPE_PRIORITY.highlight);
      return 'inStyle';
    }
  },
  inShapeProperties : {
    ' draw:fill-color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.background, pos, posEnd, TYPE_PRIORITY.background);
      return 'inShapeProperties';
    },
    ' svg:stroke-color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.border, pos, posEnd, TYPE_PRIORITY.border);
      return 'inShapeProperties';
    },
    '>' : (ctx, posEndOfLastTag, pos) => {
      pos -= (ctx.xmlIn[pos - 1] === '/' ? 1 : 0);  // if self-closing tag
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.background , pos, 'draw:fill-color', TYPE_PRIORITY.background);
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.border     , pos, 'svg:stroke-color', TYPE_PRIORITY.border);
      return 'inStyle';
    }
  },
  inTableCellPropertiesODP : {
    ' draw:fill-color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.background, pos, posEnd, TYPE_PRIORITY.background);
      return 'inTableCellPropertiesODP';
    },
    '>' : (ctx, posEndOfLastTag, pos) => {
      pos -= (ctx.xmlIn[pos - 1] === '/' ? 1 : 0);  // if self-closing tag
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.background , pos, 'draw:fill-color', TYPE_PRIORITY.background);
      return 'inStyle';
    }
  },
  inTableCellProperties : {
    ' fo:background-color="' : (ctx, posEndOfLastTag, pos, posEnd) => {
      replaceLOStyleValue(ctx, ctx.currentStyle.patches.background, pos, posEnd, TYPE_PRIORITY.background);
      return 'inTableCellProperties';
    },
    '>' : (ctx, posEndOfLastTag, pos) => {
      pos -= (ctx.xmlIn[pos - 1] === '/' ? 1 : 0);  // if self-closing tag
      // add fo:background-color if not already exists
      addLOStyleAttributeIfNotExists(ctx, ctx.currentStyle.patches.background, pos, 'fo:background-color', TYPE_PRIORITY.background);
      return 'inStyle';
    }
  }
};


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
   * Detect :color formatter and inject Carbone tag
   * Only for docx
   *
   * @param   {Object}  template  The template
   * @return  {Object}  the template modified
   */
  preProcessDocxColor : function (template) {
    const _docxFormatter = 'colorToDocx';
    const _scopeMap = {
      row   : { start : '<w:tr'         , end : '</w:tr>'        , forbiddenTypes : ['border']               },
      cell  : { start : '<w:tc'         , end : '</w:tc>'        , forbiddenTypes : ['border']               },
      p     : { start : '<w:p'          , end : '</w:p>'         , forbiddenTypes : ['background', 'border'] },
      shape : { start : '<w:drawing'    , end : '</w:drawing>'   , forbiddenTypes : []                       , ignore : ['<mc:Fallback', '</mc:Fallback>'] },
      page  : { start : '<w:document'   , end : '</w:document>'  , forbiddenTypes : ['text', 'border']  }
    };
    const _typeMap = {
      text       : applyTextColorOffice,
      background : (type, scope) => (scope === 'shape' ? applyShapeBackgroundColorOffice : (scope === 'page' ? applyPageBackgroundColorOffice : applyBackgroundColorInCellsOffice)),
      border     : applyShapeBorderColorOffice,
      /* highlight  : applyTextColorOffice*/
    };
    for (let f = 0, len = template.files.length; f < len; f++) {
      const _file = template.files[f];
      const _filename = _file.name;
      // parse only useful files
      if (!(_filename.indexOf('.xml') !== -1 &&  _filename.indexOf('.rels') === -1 && (_filename.indexOf('document') !== -1 || _filename.indexOf('header') !== -1 || _filename.indexOf('footer') !== -1))) {
        continue;
      }
      preProcessColor(_file, _scopeMap, _typeMap, _docxFormatter); // it modify _file.data
    }
    return template;
  },

  /**
   * Detect :color formatter and inject Carbone tag
   *
   * @param   {Object}  template  The template
   * @return  {Object}  the template modified
   */
  preProcessHtmlColor : function (template) {
    const _docxFormatter = '';
    const _scopeMap = {
      row  : { start : '<tr'  , end : '</tr>' , forbiddenTypes : [] },
      cell : { start : '<td'  , end : '</td>' , forbiddenTypes : [] },
      p    : { start : '<p'   , end : '</p>'  , forbiddenTypes : [] }
    };
    const _typeMap = {
      text       : applyTextColorHTML, // dynamic
      background : applyTextColorHTML
    };
    for (let f = 0, len = template.files.length; f < len; f++) {
      const _file = template.files[f];
      preProcessColor(_file, _scopeMap, _typeMap, _docxFormatter); // it modify _file.data
    }
    return template;
  },


  /**
   * Remove :color formatters and prepare for builder in ODT, ODP formats
   *
   * Libreoffice doc:
   * https://docs.oasis-open.org/office/v1.2/os/OpenDocument-v1.2-os-part1.html#a19_498style_name
   *
   * @param   {Object}  template  The template
   * @return  {Object}  the template modified
   */
  preProcessLOColorFormatter : function (template, options) {
    if (options.colorStyleDatabase === undefined /* only for tests?? */) {
      return template;
    }
    const _docxFormatter = ''; // added after
    const _scopeMap = {
      row   : { start : '<table:table-row'   , end : '</table:table-row>'   , forbiddenTypes : ['border']               },
      cell  : { start : '<table:table-cell'  , end : '</table:table-cell>'  , forbiddenTypes : ['border']               },
      p     : { start : '<text:p'            , end : '</text:p>'            , forbiddenTypes : ['background', 'border'] },
      shape : { start : '<draw:custom-shape' , end : '</draw:custom-shape>' , forbiddenTypes : []                       }
    };
    const _typeMap = {
      text       : replaceTextStyleLO,
      highlight  : replaceTextStyleLO,
      background : replaceTableCellShapeStyleLO,
      border     : replaceTableCellShapeStyleLO
    };

    const _xmlStylesToUpdate = options.colorStyleDatabase;
    for (let f = 0, len = template.files.length; f < len; f++) {
      const _file = template.files[f];
      const _filename = _file.name;
      // parse only useful files
      if (_filename.indexOf('content') === -1 && _filename.indexOf('style') === -1) {
        continue;
      }
      // apparently, the style-name is unique accross the file so we can store all styles in the same object
      preProcessColor(_file, _scopeMap, _typeMap, _docxFormatter, _xmlStylesToUpdate); // it modifies _file.data
      if (Object.keys(_xmlStylesToUpdate).length > 0) {
        // optimisation: reduce parsing zone
        const scopeStart = _file.data.indexOf('<office:automatic-styles>');
        const scopeEnd   = _file.data.indexOf('</office:automatic-styles>', scopeStart);
        executeColorStateMachine(_file, readExistingStyleLO, { scopeStart, scopeEnd, file : _filename }, [], _xmlStylesToUpdate); // it updates _xmlStylesToUpdate
      }
    }
    return template;
  },

  /**
   * Posts a process new :color formatter in Libreoffice documents
   *
   * @param      {Object}  template  The template
   * @param      {Object   data      The data (NOT USED)
   * @param      {Object}  options   The options
   */
  postProcessLOColorFormatter : function (template, data, options) {
    const that = this;
    if ( options.colorDatabaseNew === undefined || options.colorDatabaseNew.size === 0 ) {
      return template;
    }
    for (let k = 0, len = template.files.length; k < len; k++) {
      const _file = template.files[k];
      if (_file && _file.name.indexOf('content') === -1 && _file.name.indexOf('style') === -1) {
        continue;
      }
      const _newStyles = [];
      // travel all colors that were generated
      for (let [key, value] of options.colorDatabaseNew) {
        const _styleToCreate = value;
        // select the original style
        const _oldStyle = options.colorStyleDatabase[_styleToCreate.oldStyleName];
        if (_oldStyle === undefined) {
          continue; // should never happen
        }
        if (_oldStyle.file !== _file.name) {
          continue;
        }
        const _xmlPatches = [];
        // add the patch which changes the style name
        const _newStyleNamePatch = _oldStyle.patches.styleName[0]; // there is only one patch per patch type
        _newStyleNamePatch.add = that.generateColorStyleNameLO(_styleToCreate.id);
        _xmlPatches.push(_newStyleNamePatch);
        // Travel all colors. Can be "text" + "highlight" in the same style for example and genarate patches
        for (let i = 0; i < _styleToCreate.colors.length; i++) {
          const _newColor      = _styleToCreate.colors[i];
          const _patches       = _oldStyle.patches[_newColor.type];
          const _patch         = _patches?.[0]; // we can have only one patch at the moment
          if (_patch === undefined) {
            // it can happen for multiple reasons: a bug, or a style "draw:text-style-name" used only for background color of a shape that contain texts
            continue;
          }
          _patch.add           = _patch.before + _newColor.value + _patch.after;
          _xmlPatches.push(_patch);
        }
        // apply all patches on the original style to create a new and unique style
        _newStyles.push(applyPatches(_oldStyle.original, _xmlPatches));
      }
      const _endStyleParent = _file.data.indexOf('</office:automatic-styles>');
      _file.data = _file.data.slice(0, _endStyleParent) + _newStyles.join('') + _file.data.slice(_endStyleParent);
    }
    return template;
  },

  generateColorStyleNameLO : function (id) {
    return `CCS${id}`; // must be a different tag than bindColor to avoid conflict
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


/**
 * Detect :color formatter and inject the tag at the right place in XML
 *
 * @param      {Object}  file                     The file
 * @param      {Object}  scopeMap                 The scope map
 *                                                {
 *                                                  row  : { start : '<w:tr', end : '</w:tr>', forbiddenTypes : [] },
 *                                                  cell : { start : '<w:tc', end : '</w:tc>', forbiddenTypes : [] }
 *                                                }
 * @param      {Object|Function}  typeMap         The type map, with an associate state machine to apply the color. Ex:
 *                                                {
 *                                                   text       : applyTextColorOffice,
 *                                                   background : applyBackgroundColorInCellsOffice
 *                                                };
 *                                                Or a function(type, scope) which returns the corresponding Map
 * @param      {Object}  xmlStyles                Only for ODT/ODS/ODP. Map of XML styles detected in preprocessing
 * @param      {String}  colorConverterFormatter  The specific color formatter for the parsed document
 */
function preProcessColor (file, scopeMap, typeMap, colorConverterFormatter, xmlStyles) {
  const _colorConverterFormatter = colorConverterFormatter ? ':' + colorConverterFormatter + '}' : '}';
  const _patternColor = /{[^{}]*?:(color[^{}]*?)}/g;
  const _colorTags = [];
  if (typeof (file.data) !== 'string') {
    return;
  }
  // detect :color tags and remove them
  let _offset = 0;
  file.data = file.data.replace(_patternColor, function (tag, colorFormatterOnly, index) {
    if (parser.isCarboneMarker(tag) === false) {
      return tag;
    }
    const _tagWithCustomFormatter = tag.replace(/}$/g, _colorConverterFormatter);
    const _parsedFormatter = extracter.parseFormatter(colorFormatterOnly);
    const _scope    = _parsedFormatter.args[0] ?? 'p';
    const _scopeObj = scopeMap[_scope];
    const _type     = _parsedFormatter.args[1] ?? 'text';
    if (_scopeObj === undefined) {
      throw new Error(`The color scope "${_scope}" is unknown in "${tag}". The formatter accepts only ${Object.keys(scopeMap).join(', ')} for the first argument.`);
    }
    if (typeMap[_type] === undefined) {
      throw new Error(`The color type "${_type}" is unknown in "${tag}". The formatter accepts only ${Object.keys(typeMap).join(', ')} for the second argument.`);
    }
    if (_scopeObj.forbiddenTypes.indexOf(_type) !== -1) {
      throw new Error(`The color type "${_type}" is invalid for the scope "${_scope}" in "${tag}".`);
    }
    _colorTags.push({ pos : index - _offset, scopeObj : _scopeObj, scope : _scope, type : _type, scopeStart : 0, scopeEnd : 0, src : _tagWithCustomFormatter});
    _offset += tag.length;
    return '';
  });

  if (_colorTags.length === 0) {
    return;
  }

  const _xmlPatches = [];
  // find scope where to apply the color in XML of each color tags (paragraph, row, cell, ...)
  for (let i = 0; i < _colorTags.length; i++) {
    const _colorTag = _colorTags[i];
    // TODO manage nested table
    _colorTag.scopeStart = Math.max(file.data.lastIndexOf( _colorTag.scopeObj.start+' ', _colorTag.pos), file.data.lastIndexOf( _colorTag.scopeObj.start+'>', _colorTag.pos));
    _colorTag.scopeEnd = file.data.indexOf( _colorTag.scopeObj.end, _colorTag.scopeStart) + _colorTag.scopeObj.end.length; // reach </p>
    if (_colorTag.scopeStart === -1 || _colorTag.scopeEnd < _colorTag.pos) {
      const _ignore = _colorTag.scopeObj.ignore;
      if (_ignore) {
        const _ignoreStart = file.data.lastIndexOf( _ignore[0]+'>', _colorTag.pos);
        const _ignoreEnd   = file.data.indexOf( _ignore[1], _ignoreStart) + _ignore[1].length;
        if (_ignoreStart !== -1 && _ignoreEnd > _colorTag.pos) {
          continue; // ignore Carbone tags in fallback parts of DOCX template
        }
      }
      throw new Error(`The Carbone tag "${_colorTag.src.replace(_colorConverterFormatter, '}')}" is outside of its defined scope "(${_colorTag.scope})"`);
    }
    // generate patch to apply the color
    const _patchGenerator = !(typeMap[_colorTag.type] instanceof Function) ? typeMap[_colorTag.type] : typeMap[_colorTag.type](_colorTag.type, _colorTag.scope);
    // the patch generator can be a custom function (html) or a state machine
    executeColorStateMachine(file, _patchGenerator, _colorTag, _xmlPatches, xmlStyles);
  }

  file.data = applyPatches(file.data, _xmlPatches);
}

/**
 * Apply patches on XML
 *
 * @param      {String}    xmlSource   The xml source
 * @param      {Array}     xmlPatches  The xml patches
 * @return     {String}                the XML with patch applied
 */
function applyPatches (xmlSource, xmlPatches) {
  // sort patch by position in XML
  // and if multiple patches are at the same position, apply patches by scope order (paragraph, cell, row)
  xmlPatches.sort((a, b) => (a.from === b.from) ? b.priority - a.priority : a.from - b.from);
  let _newXML = [];
  let _prevPatch = {};
  let _currentXMLPos = 0;
  for (let i = 0; i < xmlPatches.length; i++) {
    const _xmlPatch = xmlPatches[i];
    // if a patch is at the same position, append the new patch to the previous one only if the type of the patch is differen
    // Ex. style = color + backround-color is applied in style=" position
    if (_xmlPatch.from === _prevPatch.from && (_xmlPatch.priority & TYPE_PRIORITY_MASK) === (_prevPatch.priority & TYPE_PRIORITY_MASK) ) {
      continue;
    }
    _newXML.push(xmlSource.slice(_currentXMLPos, _xmlPatch.from));
    _newXML.push(_xmlPatch.add);
    _currentXMLPos = _xmlPatch.to;
    _prevPatch = _xmlPatch;
  }
  return _newXML.join('') + xmlSource.slice(_currentXMLPos);
}


/**
 * Execute state machine.
 *
 * Create a context object "ctx" for color state machine
 *
 * @param   {Object}  file          The template
 * @param   {Object}  stateMachine  The state machine to execute
 * @param   {Object}  xmlStyles     Only for ODT/ODS/ODP. Map of XML styles to customize
 * @return  {Object}
 */
function executeColorStateMachine  (file, stateMachine, colorTag, xmlPatches, xmlStyles) {
  let _ctx = {
    xmlIn          : file.data,
    xmlFrom        : colorTag.scopeStart,
    xmlTo          : colorTag.scopeEnd,
    xmlPatches     : xmlPatches, // do not modify XML directly, just store the patches
    xmlStyles      : xmlStyles, // only for ODT/ODS/ODP
    file           : colorTag.file, // only for ODT/ODS/ODP
    colorTag       : colorTag,
    isColorApplied : false
  };
  if (typeof file?.data !== 'string') {
    return _ctx;
  }
  try {
    machine.executeStateMachine(_ctx, stateMachine);
  }
  catch (e) {
    console.log(e);
  }
  return _ctx;
}


/**
 * Helper function to update an existing color attribute
 *
 * Do nothing if the color is already applied
 *
 * @param      {Object}   ctx              The context:
 *                                         {
 *                                           isColorApplied : false  To avoid applying the color if it is already applied
 *                                           lastPos : 0
 *                                           xmlIn   : '' // the XML we are reading
 *                                           xmlPatches  : [] // the patches to apply on the new XML
 *                                         }
 * @param      {Integer}  posEndOfLastTag  (see executeStateMachine function)
 * @param      {Integer}  pos              (see executeStateMachine function)
 * @param      {Integer}  posEnd           (see executeStateMachine function)
 * @param      {Integer}  newAttribute     new XML attribute
 */
function replaceXMLAttributeAndUpdateXMLOutput (ctx, posEndOfLastTag, pos, posEnd, newAttribute) {
  if (ctx.isColorApplied === true) {
    return;
  }
  ctx.isColorApplied = true;
  const _priority = SCOPE_PRIORITY[ctx.colorTag.scope] + TYPE_PRIORITY[ctx.colorTag.type]; // the priority of the patch when it is inserted at the same position in XML
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
  ctx.xmlPatches.push({ from : posEnd, to : _endOfAttributeValue, add : newAttribute, priority : _priority });
}

/**
 * Helper function to update an existing attribute, and pass the value of the previous attribute in the last formatter of the Carbone tag
 *
 * @param      {Object}   ctx              The context:
 *                                         {
 *                                           isColorApplied : false  To avoid applying the color if it is already applied
 *                                           lastPos : 0
 *                                           xmlIn   : '' // the XML we are reading
 *                                           xmlPatches  : [] // the patches to apply on the new XML
 *                                         }
 * @param      {Integer}  posEndOfLastTag  (see executeStateMachine function)
 * @param      {Integer}  pos              (see executeStateMachine function)
 * @param      {Integer}  posEnd           (see executeStateMachine function)
 * @param      {Integer}  newAttribute     new XML attribute
 */
function replaceAttributeValueAndPassValueAsParam (ctx, posEndOfLastTag, pos, posEnd, newAttribute) {
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
  const _oldStyleName        = ctx.xmlIn.slice(posEnd, _endOfAttributeValue);
  const _tag                 = ctx.colorTag;
  const _priority            = SCOPE_PRIORITY[_tag.scope] + TYPE_PRIORITY[_tag.type];
  const _carboneTagWithValue = newAttribute.replace(/}$/, `:colorLO1(${_tag.scope}, ${_tag.type})}`);
  const _styleNameGenerator  = `{c.now:neutralForArrayFilter:colorLOEnd(${_oldStyleName})}`;
  ctx.xmlPatches.push({ from : posEnd, to : _endOfAttributeValue, add : _carboneTagWithValue, priority : _priority });
  // for ODT/DOS/ODP, multiple color tags can be used to define the text and background color. And everything is merged inside one unique style
  // all formatters are called in post processing, and generateNewStyleName is used to aggregate all previously colors applied and generate the unique style
  ctx.xmlPatches.push({ from : _endOfAttributeValue, to : _endOfAttributeValue, add : _styleNameGenerator, priority : HIGHEST_SCOPE_PRIORITY + TYPE_CUSTOM_XML_1 });
  return _oldStyleName;
}


/**
 * Helper function to update an existing style attribute in HTML
 *
 * Do nothing if the color is already applied
 *
 * @param      {Object}   ctx                 The context:
 *                                            {
 *                                              isColorApplied : false  To avoid applying the color if it is already applied
 *                                              lastPos : 0
 *                                              xmlIn   : '' // the XML we are reading
 *                                              xmlPatches  : [] // the patches to apply on the new XML
 *                                            }
 * @param      {Integer}  posEndOfLastTag     (see executeStateMachine function)
 * @param      {Integer}  pos                 (see executeStateMachine function)
 * @param      {Integer}  posEnd              (see executeStateMachine function)
 * @param      {String}   newCssValue         new CSS value to add in the style
 * @param      {String}   cssPropertyToPatch  the css property to modify or insert
 * @return     {String}   The value read in XML attribute and concatenate.
 */
function replaceHtmlStyleAttributePatch (ctx, posEndOfLastTag, pos, posEnd, newCssValue, cssPropertyToPatch) {
  if (ctx.isColorApplied === true) {
    return;
  }
  const _patch = html.patchStyleAttribute(ctx.xmlIn, posEnd, cssPropertyToPatch, newCssValue);
  if (_patch) {
    _patch.priority = SCOPE_PRIORITY[ctx.colorTag.scope] + TYPE_PRIORITY[ctx.colorTag.type];
    ctx.isColorApplied = true;
    ctx.xmlPatches.push(_patch);
  }
}


/**
 * Helper function to add some XML color attribute
 *
 * Do nothing if the color is already applied
 *
 * @param      {Object}   ctx                       The context:
 *                                                  {
 *                                                    isColorApplied : false
 *                                                    lastPos : 0
 *                                                    xmlIn   : '' // the XML we are reading
 *                                                    xmlPatches  : [] // the patches to apply on the new XML
 *                                                  }
 * @param      {Integer}  posEndOfLastTag           The position end of last tag
 * @param      {Integer}  pos                       The position
 * @param      {Integer}  posEnd           (see executeStateMachine function)
 * @param      {Integer}  injectedXMLBeforeTheTag   the XML to inject
 * @return     {String}   The text since last tag.
 */
function addXMLBeforeAndUpdateXMLOutput (ctx, posEndOfLastTag, pos, posEnd, injectedXMLBeforeTheTag) {
  if (ctx.isColorApplied === true) {
    return;
  }
  const _priority = SCOPE_PRIORITY[ctx.colorTag.scope] + TYPE_PRIORITY[ctx.colorTag.type];
  ctx.isColorApplied = true;
  ctx.xmlPatches.push({ from : pos, to : pos, add : injectedXMLBeforeTheTag, priority : _priority });
}


function addLOStyleAttributeIfNotExists (ctx, patches, pos, attributeXML = 'fo:color', priority) {
  if (patches === undefined || patches.length > 0 /* patch already created */) {
    return;
  }
  const _styleStart = ctx.currentStyle.startAt;
  patches.push({
    from     : pos - _styleStart, // update position relative to beginning of <style string
    to       : pos - _styleStart,
    before   : ` ${attributeXML}="`,
    after    : '"',
    add      : '', /* updated in postprocess  = before + color + after */
    priority : priority /* for LO, the priority is used to apply multiple style on the same position (text + highlight) */
  });
}

function replaceLOStyleValue (ctx, patches, pos, posEnd, priority) {
  if (patches === undefined) {
    return;
  }
  const _styleStart = ctx.currentStyle.startAt;
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd);
  patches.push({
    from     : posEnd - _styleStart,
    to       : _endOfAttributeValue - _styleStart,
    before   : '',
    after    : '',
    add      : '', /* updated in postprocess  = before + color + after */
    priority : priority
  });
}


function removeXMLAttribute (ctx, posEndOfLastTag, pos, posEnd) {
  const _endOfAttributeValue = ctx.xmlIn.indexOf('"', posEnd) + 1;
  ctx.xmlPatches.push({ from : pos, to : _endOfAttributeValue, add : '', priority : HIGHEST_SCOPE_PRIORITY });
}


module.exports = color;