var image = require('../lib/image');

/**
 * Add the image url or base64 to the imageDatabase Map
 *
 * @private
 *
 * @param  {Object} options
 * @param  {String} urlOrBase64
 */
function addImageDatabase (options, urlOrBase64) {
  if (!options.imageDatabase.has(urlOrBase64)) {
    // set an id for each image (used to generate unique names)
    var _nbImage = options.imageDatabase.size;
    options.imageDatabase.set(urlOrBase64, {id : _nbImage});
  }
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
  return image.buildOdtImageLink(_imageData.id, _imageData.extension);
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

module.exports = {
  generateOpenDocumentImageHref     : generateOpenDocumentImageHref,
  generateOpenDocumentImageMimeType : generateOpenDocumentImageMimeType
};

