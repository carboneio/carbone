var image = require('../lib/image');

/**
 * Add the image url or base64 to the imageDatabase Map
 *
 * @private
 *
 * @param  {Object} options
 * @param  {String} urlOrBase64
 */
function addImageDatabase (options, urlOrBase64, imageSourceParams = undefined) {
  var _imageDatabaseProperties = null;
  if (!options.imageDatabase.has(urlOrBase64)) {
    // If the image doesn't exist, it create a new ID
    _imageDatabaseProperties = {
      id : options.imageDatabase.size
    };
  }
  else if (imageSourceParams) {
    // If the image already exists, the image is retreived to set new properties
    _imageDatabaseProperties = options.imageDatabase.get(urlOrBase64);
  }
  else {
    return;
  }
  if (imageSourceParams) {
    // Set all properties coming from imageSourceParams
    _imageDatabaseProperties = Object.assign(_imageDatabaseProperties, imageSourceParams);
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
 * @param  {[type]} urlOrBase64 image data (link or base64)
 * @return {[type]}             [description]
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
 * @return {[type]}             [description]
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
    fn   : generateImageDocxReferencePostProcessing,
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
 * @param  {[type]} urlOrBase64 image data (link or base64)
 * @return {[type]}             [description]
 */
function generateImageDocxReferencePostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return image.getDocxImageReference(_imageData.id);
}


/**
 * Generate image id for MS DOCX documents
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
 * Post processing function called at the end of the building process
 *
 * this.imageDatabase as been updated by the post-processor and contains image info
 *
 * @private
 *
 * @param  {Object} urlOrBase64 image data (link or base64)
 * @param  {[type]} urlOrBase64 image data (link or base64)
 * @return {[type]}             [description]
 */
function generateImageDocxIdPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.id + '';
}

function scaleImageDocxWidth (urlOrBase64, imageWidth) {
  let _imageSourceParams = {};
  if (imageWidth) {
    _imageSourceParams.imageSourceWidth = parseInt(imageWidth);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceParams);
  // return a function to call at the end of the building process
  return {
    fn   : setImageDocxWidthPostProcessing,
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
 * @param  {[type]} urlOrBase64 image data (link or base64)
 * @return {[type]}             [description]
 */
function setImageDocxWidthPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.imageSourceWidth + '';
}

function scaleImageDocxHeight (urlOrBase64, imageHeight) {
  let _imageSourceParams = {};
  if (imageHeight) {
    _imageSourceParams.imageSourceHeight = parseInt(imageHeight);
  }
  addImageDatabase(this, urlOrBase64, _imageSourceParams);
  // return a function to call at the end of the building process
  return {
    fn   : setImageDocxHeightPostProcessing,
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
 * @param  {[type]} urlOrBase64 image data (link or base64)
 * @return {[type]}             [description]
 */
function setImageDocxHeightPostProcessing (urlOrBase64) {
  var _imageData = this.imageDatabase.get(urlOrBase64);
  return _imageData.imageSourceHeight + '';
}

module.exports = {
  generateOpenDocumentImageHref     : generateOpenDocumentImageHref,
  generateOpenDocumentImageMimeType : generateOpenDocumentImageMimeType,
  generateImageDocxId               : generateImageDocxId,
  generateImageDocxReference        : generateImageDocxReference,
  scaleImageDocxWidth               : scaleImageDocxWidth,
  scaleImageDocxHeight              : scaleImageDocxHeight
};

