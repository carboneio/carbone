'use strict';

var path = require('path');
var url = require('url');

// ### Error definitions ###

function PathError(message) {
	this.name = 'PathError';
	this.code = 'PathError';
	this.message = message || 'Failed to convert path';
	if (typeof Error.captureStackTrace === 'function') {
		Error.captureStackTrace(this, PathError);
	}
}
PathError.prototype = new Error();
module.exports.PathError = PathError;

// ### Utility functions ###

/**
 * Convert an absolute path to an absolute URL understood by LibreOffice and
 *  OpenOffice. This is necessary because LO/OO use a cross-platform path format
 *  that does not match paths understood natively by OSes.
 * If the input is already a URL, it is returned as-is.
 * @param {string} inputPath - An absolute path to convert to a URL.
 * @returns {string} A string suitable for use with LibreOffice as an absolute file path URL.
 */
function convertToURL(inputPath) {
	// Guard clause: if it already looks like a URL, keep it that way.
	if (inputPath.slice(0, 8) === 'file:///') {
		return inputPath;
	}
	if (!path.isAbsolute(inputPath)) {
		throw new PathError('Paths to convert must be absolute');
	}
	// Split into parts so that we can join into a URL:
	var normalizedPath = path.normalize(inputPath);
	// (Use both delimiters blindly - we're aiming for maximum compatibility)
	var pathComponents = normalizedPath.split(/[\\/]/);
	// Make sure there is no leading empty element, since we always add a
	//  leading "/" anyway.
	if (pathComponents[0] === '') {
		pathComponents.shift();
	}
	var outputURL = 'file:///' + pathComponents.join('/');
	return outputURL;
}

module.exports.convertToURL = convertToURL;
// Alias for OpenOffice/LibreOffice script language compatibility:
module.exports.ConvertToURL = convertToURL;

//TODO: Add a function for converting URLs to paths.
