const path = require('path');
const params = require('./params');
const rock = require('rock-req');
const package = require('../package.json');

const egress = {

  /**
   * Downloads an external file
   *
   * @param      {String}    url                 The url
   * @param      {Object}    acceptedMimeTypes   The accepted mime types with corresponding file extension
   *                                             {
   *                                               'image/bmp'  : 'bmp',
   *                                               'image/jpeg' : 'jpeg'
   *                                             }
   * @param      {Object}    acceptedExtensions  The accepted extensions, with corresponding mime types
   *                                             {
   *                                               bmp  : 'image/bmp',
   *                                               xmb  : 'image/xbm'
   *                                             }
   * @param      {Object}    options             options
   * @param      {Function}  callback            The callback (err, {body, mimetype, extension}).
   *                                             Returns an error if the file cannot be downloaded or if the extension is not allowed
   */
  downloadExternalFile : function (url, acceptedMimeTypes, acceptedExtensions, options, callback) {
    const _commonError = `Unable to download file from URL: "${url}"`;
    // avoid crash if URL is not encoded
    if (/[^\u0020-\u00ff]/.test(url) === true) {
      // This Regex come from NodeJS: https://github.com/nodejs/node/blob/fd69cd10d3c424ebe21f458d9606961b2fa30717/lib/_http_client.js#L176
      // we accept whitespace
      return callback(new Error(`${_commonError}. This URL contains unescaped characters.`));
    }
    rock({method : 'GET', url, timeout : 6000, tenantId : options.tenantId, requestId : options.requestId }, function (err, res, body) {
      if (err) {
        return callback(new Error(`${_commonError}. Check URL and network access.`));
      }
      if (res.statusCode !== 200) {
        return callback(new Error(`${_commonError}. Status code: ${res.statusCode}. Check URL and network access.`));
      }
      // Get the extension from the file name using the URL or the content-disposition
      let _extension = egress.getFileExtensionFromUrl(url, res.headers?.['content-disposition']);
      // If the mime type image retreived from the Content-Type is not valid, the file extension is used to get the correct mime type
      let _mimeType = egress.cleanContentType(res.headers['content-type']);
      // If the mime type image retreived from the Content-Type is not valid, the file extension is used to get the correct mime type
      if (acceptedMimeTypes[_mimeType] === undefined) {
        _mimeType = acceptedExtensions[_extension];
      }
      // if the file extension doesn't match the mime type, the file extension is retreived from the mimetype
      if (acceptedExtensions[_extension] !== _mimeType ) {
        _extension = acceptedMimeTypes[_mimeType];
      }
      if (_extension === undefined || _mimeType === undefined) {
        return callback(new Error(`${_commonError}. File type is unknown or not allowed. Accepted types: ${Object.keys(acceptedExtensions).join(', ')}`));
      }
      return callback(null, {
        data      : body,
        mimetype  : _mimeType,
        extension : _extension
      });
    });
  },

  /**
   * @private
   * @description Get file extension from an URL. It removes the query parameters and everything after `#`, `?` or `&`.
   *
   * @example 'https://carbone.io/image.gif' => 'gif'
   * @example 'https://carbone.io/image-flag-fr.txt?name=john&age=2#lala' =>  'txt'
   *
   * @param {String} url
   * @param {String} contentDisposition
   * @returns {String} the file extension
   */
  getFileExtensionFromUrl : function (url, contentDisposition) {
    return path.extname(url).slice(1).split(/#|\?|&/)[0]?.toLowerCase()
        || path.extname(contentDisposition?.split('filename=')[1]?.split(';')[0]?.replace(/"$/, '') ?? '').slice(1).toLowerCase();
  },

  /**
   * Clean HTTP content type
   *
   * @param   {string}  contentType  The content type
   * @return  {string}               return only the first part of the content type
   */
  cleanContentType : function (contentType) {
    if (typeof contentType === 'string') {
      return contentType.replace(/;.+$/, '').trim();
    }
    return '';
  },
  /**
   * Called on webserver start
   *
   * @param      {Number}    tenantId  The tenant identifier
   */
  collectStatistics : function (tenantId) {
    if (params.collectStatistics === true  && process.pkg /* not in development */) {
      const _rockLight = rock.extend({maxRetry : 1, keepAliveDuration : 0});
      const _tenantId = tenantId || '0';
      _rockLight({ url : `https://stats.carbone.io/t/${_tenantId}/v/${package.version}`, method : 'GET', timeout : 3000 }, () => {});
    }
  },

  /**
   * Sets the egress configuration.
   *
   * @param  {Object}  param   carbone.params
   */
  setEgressConfig : function (param) {
    // set global config for egress traffic
    rock.defaults.headers['user-agent'] = param.egressUserAgent;
    rock.defaults.maxRetry = param.egressMaxRetry;
    rock.defaults.retryDelay = 5;
    if (param.egressProxyPrimary) {
      const _filter = param.egressTenantFilter ?? [];
      const _primary = new URL(param.egressProxyPrimary);
      const _secondary = param.egressProxySecondary ? new URL(param.egressProxySecondary) : null;
      const _pathFormatter = new Function('protocol', 'hostname', 'port', 'path', 'tenantId', 'requestId', 'return `' + param.egressProxyPath + '`;');
      rock.defaults.beforeRequest = function beforeRequestCarbone (target) {
        if (target.remainingRetry < target.maxRetry) {
          console.log('WARNING: egress traffic retry ' + target.hostname + target.path);
          if (!_secondary) {
            return target;
          }
        }
        const _tenantFilterIndex = _filter.indexOf(parseInt(target.tenantId, 10));
        if ((param.egressExcludeFilterMode === true && _tenantFilterIndex !== -1) || (param.egressExcludeFilterMode !== true && _tenantFilterIndex === -1)) {
          return target;
        }
        const _port = target.port ?? (target.protocol === 'https:' ? 443 : 80);
        target.path = _pathFormatter(target.protocol.slice(0,-1), target.hostname, _port, target.path, (target.tenantId ?? 0), (target.requestId ?? 0));
        let _proxy = _primary;
        if (_secondary && target.remainingRetry < target.maxRetry) {
          _proxy = _secondary;
        }
        target.protocol = _proxy.protocol;
        target.hostname = _proxy.hostname;
        target.port = _proxy.port;
        return target;
      };
    }
    else {
      rock.defaults.beforeRequest = o => o; // reset
    }
    // make the conf accessible for carbone plugins
    global.rockReqConf = rock.defaults;
  }

};


module.exports = egress;