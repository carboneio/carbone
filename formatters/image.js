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
    // Merge array properties before the mergeObjects call. It is used by XLSX templates with images.
    if (imageSourceProperties && typeof imageSourceProperties.sheetIds === 'object' &&
        _imageDatabaseProperties && typeof _imageDatabaseProperties.sheetIds === 'object') {
      imageSourceProperties.sheetIds.push(..._imageDatabaseProperties.sheetIds);
    }
    // Merge all properties coming from imageSourceProperties into _imageDatabaseProperties
    // Properties: imageSourceWidth, imageSourceHeight (DOCX) and sheetIds (XLSX)
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
 * Generate image reference ID for MS DOCX documents
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
function generateImageDocxReference (urlOrBase64) {
  addImageDatabase(this, urlOrBase64);
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
 * Generate an image id for MS DOCX documents
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
  return _imageData.id + '';
}

/**
 * It gets the EMU width of the initial image to being computed with the correct new scale.
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function setImageDocxWidthPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @param   {String} imageWidth image width as EMU unit
 * @returns {Object}            a post process object
 */
function scaleImageDocxWidth (urlOrBase64, imageWidth) {
  let _imageSourceProperties = {
    imageUnit : 'emu'
  };
  if (imageWidth) {
    _imageSourceProperties.imageWidth = parseInt(imageWidth);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceProperties);
  // return a function to call at the end of the building process
  return {
    fn   : setImageDocxWidthPostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Post processing function called at the end of the building process. It return the EMU width of the new image.
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @return {String}             image EMU witdh
 */
function setImageDocxWidthPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.imageWidth + '';
}

/**
 * It gets the EMU Height of the initial image to being computed with the correct new scale.
 *
 * Called by the builder. At this time, we do not know if this image
 * will be kept in final render. We do not know the image type (asynchronuous process)
 * So we ask to the builder to call the function setImageDocxWidthPostProcessing
 * at the end
 *
 * `this` is the options
 *
 * @private
 *
 * @param   {String} urlOrBase64 image data (link or base64)
 * @param   {String} imageHeight image height as EMU unit
 * @returns {Object}             a post process object
 */
function scaleImageDocxHeight (urlOrBase64, imageHeight) {
  let _imageSourceProperties = {
    imageUnit : 'emu'
  };
  if (imageHeight) {
    _imageSourceProperties.imageHeight = parseInt(imageHeight);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceProperties);
  // return a function to call at the end of the building process
  return {
    fn   : setImageDocxHeightPostProcessing,
    args : [urlOrBase64]
  };
}

/**
 * Post processing function called at the end of the building process. It return the EMU height of the new image.
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @return {String}             image EMU height
 */
function setImageDocxHeightPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.imageHeight + '';
}

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

function scaleImageLo (urlOrBase64, measure, value, unit) {
  let _imageSourceProperties = {};
  if (unit === 'cm' || unit === 'in') {
    _imageSourceProperties.imageUnit = unit;
  }
  if (measure === 'width') {
    _imageSourceProperties.imageWidth = parseFloat(value);
  }
  if (measure === 'height') {
    _imageSourceProperties.imageHeight = parseFloat(value);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceProperties);
  return {
    fn   : setImageLoSizePostProcessing,
    args : [urlOrBase64, measure]
  };
}

function setImageLoSizePostProcessing (urlOrBase64, measure) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  if (measure === 'width') {
    return _imageData.imageWidth + _imageData.imageUnit;
  }
  else if (measure === 'height') {
    return _imageData.imageHeight + _imageData.imageUnit;
  }
  return '';
}


module.exports = {
  generateOpenDocumentImageHref     : generateOpenDocumentImageHref,
  generateOpenDocumentImageMimeType : generateOpenDocumentImageMimeType,
  generateImageDocxId               : generateImageDocxId,
  generateImageDocxReference        : generateImageDocxReference,
  scaleImageDocxWidth               : scaleImageDocxWidth,
  scaleImageDocxHeight              : scaleImageDocxHeight,
  generateImageXlsxReference        : generateImageXlsxReference,
  scaleImageLo                      : scaleImageLo
};

