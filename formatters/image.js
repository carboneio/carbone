const image = require('../lib/image');
const helper = require('../lib/helper');

/**
 * Add the image url or base64 to the imageDatabase Map.
 *
 * @private
 *
 * @param  {Object} options
 * @param  {String} urlOrBase64
 * @param  {Object} imageSourceParams New properties to add to the image "urlOrBase64" properties
 */
function addImageDatabase (options, urlOrBase64, imageSourceProperties = undefined) {
  var _imageDatabaseProperties = null;
  if (!options.imageDatabase.has(urlOrBase64)) {
    // If the image doesn't exist, it create a new ID
    _imageDatabaseProperties = {
      id : options.imageDatabase.size
    };
  }
  else if (imageSourceProperties) {
    // If the image already exists, the image is retreived to set new properties
    _imageDatabaseProperties = options.imageDatabase.get(urlOrBase64);
  }
  else {
    return;
  }
  if (imageSourceProperties) {
    // Merge array properties before the mergeObjects call. It is used by XLSX/DOCX templates with images.
    if (imageSourceProperties && typeof imageSourceProperties.sheetIds === 'object' &&
        _imageDatabaseProperties && typeof _imageDatabaseProperties.sheetIds === 'object') {
      imageSourceProperties.sheetIds.push(..._imageDatabaseProperties.sheetIds);
    }
    // Merge all properties coming from imageSourceProperties into _imageDatabaseProperties
    // Properties: imageSourceWidth, imageSourceHeight (DOCX) and sheetIds (XLSX/DOCX)
    _imageDatabaseProperties = helper.mergeObjects(_imageDatabaseProperties, imageSourceProperties);
  }
  options.imageDatabase.set(urlOrBase64, _imageDatabaseProperties);
}

/**
 * Post processing function called at the end of the building process
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @return {String} It returns the path to the image
 */
function generateOpenDocumentImageHrefPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return image.buildLoImageLink(_imageData.id, _imageData.extension);
}

/**
 * Generate a unique id for LibreOffice image names
 *
 * LibreOffice can hide an image (random!) if two or more image share the same name (draw:name)
 * So we generate a unique number, like in LibreOffice code:
 * https://github.com/LibreOffice/core/blob/bdbb5d0389642c0d445b5779fe2a18fda3e4a4d4/lotuswordpro/source/filter/xfilter/xfglobal.cxx#L110
 *
 * @private
 *
 * @return {Integer} unique global number for the document
 *
 */
function generateOpenDocumentUniqueNumber () {
  return this.uniqueId++;
}

/**
 * Generate image link for open document
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function generateOpenDocumentImageHrefPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @returns {String}             generated link for OpenDocument
 */
function generateOpenDocumentImageHref (urlOrBase64) {
  addImageDatabase(this, urlOrBase64);
  // return a function to call at the end of the building process
  return {
    fn   : generateOpenDocumentImageHrefPostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Post processing function called at the end of the building process
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {String} urlOrBase64 image data (link or base64)
 * @return {String}             It returns the image mimetype
 */
function generateOpenDocumentImageMimeTypePostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.mimetype;
}

/**
 * Generate image MimeType for open document
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function generateOpenDocumentImageHrefPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @returns {String}             generated link for OpenDocument
 */
function generateOpenDocumentImageMimeType (urlOrBase64) {
  addImageDatabase(this, urlOrBase64);
  // return a function to call at the end of the building process
  return {
    fn   : generateOpenDocumentImageMimeTypePostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Generate image a reference id for MS DOCX documents
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function generateImageDocxIdPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @returns {String}             generated link for OpenDocument
 */
function generateImageDocxReference (urlOrBase64, fileName) {
  let _imageProperties = {};
  if (fileName) {
    _imageProperties.sheetIds = [fileName];
  }
  addImageDatabase(this, urlOrBase64, _imageProperties);
  // return a function to call at the end of the building process
  return {
    fn   : generateImageReferencePostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Post processing function called at the end of the building process
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @return {String}             It returns the image reference defined on the `_rels/document.rels.xml` file
 */
function generateImageReferencePostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return image.getImageReference(_imageData.id);
}


/**
 * Generate an image id for DOCX documents
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function generateImageDocxIdPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @returns {String}             generated link for OpenDocument
 */
function generateImageDocxId (urlOrBase64) {
  addImageDatabase(this, urlOrBase64);
  // return a function to call at the end of the building process
  return {
    fn   : generateImageDocxIdPostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Post processing function called at the end of the building process.
 * It is called only for Docx document to create an unique ID.
 *
 * this.imageDatabase as been updated by the post-processor and contains image informations.
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @return {String}             the image ID
 */
function generateImageDocxIdPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.id + 1000 + '';
}

/**
 * It is called only for Docx document to create an unique ID for each drawing element (can be picture or shapes)
 *
 * @private
 *
 * @return {String} the drawing ID of <wp:docPr
 */
function generateImageDocxGlobalId () {
  return 999 + this.uniqueId++;
}

/**
 * Generate image a reference id for XLSX documents
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function generateImageDocxIdPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @param   {String} sheetId     sheet id - an image can be part of multiple sheets
 * @returns {String}             generated link for OpenDocument
 */
function generateImageXlsxReference (urlOrBase64, sheetId) {
  let _imageSourceProperties = {};
  if (sheetId) {
    _imageSourceProperties.sheetIds = [parseInt(sheetId)];
  }
  addImageDatabase(this, urlOrBase64, _imageSourceProperties);
  // return a function to call at the end of the building process
  return {
    fn   : generateImageReferencePostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * scaleImage compute the final image size based on the temporary picture.
 * It takes as input the temporary picture size and the new picture size.
 * It returns a function called at the end of the building process which returns the new picture size.
 * This fonction is called only from ODT or DOCX documents.
 *
 * `this` is the options
 *
 * @private
 *
 * @param {String} urlOrBase64 image data (link or base64)
 * @param {String} measure     width or height
 * @param {String} value       value
 * @param {String} unit        can be cm, in or emu
 * @param {String} imageFit    can be fill, contain, fillWidth
 */
function scaleImage (urlOrBase64, measure, value, unit, imageFit) {
  let _imageSourceProperties = {};
  _imageSourceProperties.imageFit = imageFit;
  if (unit === 'cm' || unit === 'in' || unit === 'emu') {
    _imageSourceProperties.imageUnit = unit;
  }
  if (measure === 'width' && value) {
    _imageSourceProperties.imageWidth = parseFloat(value);
  }
  if (measure === 'height' && value) {
    _imageSourceProperties.imageHeight = parseFloat(value);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceProperties);
  return {
    fn   : setImageSizePostProcessing,
    args : [urlOrBase64, measure]
  };
}

/**
 * Post processing function called at the end of the building process.
 * It is called only for DOCX and ODT document to create an unique ID.
 *
 * this.imageDatabase as been updated by the post-processor and contains image informations.
 *
 * @private
 *
 * @param  {String} urlOrBase64 image data (link or base64)
 * @param  {String} measure     width or height
 * @return {String}             the new image size
 */
function setImageSizePostProcessing (urlOrBase64, measure) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  if (measure === 'width') {
    return _imageData.imageWidth;
  }
  else if (measure === 'height') {
    return _imageData.imageHeight;
  }
  return '';
}

module.exports = {
  generateOpenDocumentImageHref     : generateOpenDocumentImageHref,
  generateOpenDocumentImageMimeType : generateOpenDocumentImageMimeType,
  generateImageDocxId               : generateImageDocxId,
  generateImageDocxGlobalId         : generateImageDocxGlobalId,
  generateOpenDocumentUniqueNumber  : generateOpenDocumentUniqueNumber,
  generateImageDocxReference        : generateImageDocxReference,
  generateImageXlsxReference        : generateImageXlsxReference,
  scaleImage                        : scaleImage,
};

