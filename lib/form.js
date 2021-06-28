const parser = require('../lib/parser');

const form = {
  /**
   * @description It move the checkbox marker from the `form:name` attribute into the `form:current-state` attribute.
   *
   * @param {Object} template Object that contain the templates XML files
   * @returns {undefined}
   */
  preProcessODT : function (template) {
    const _checkboxRegex = /<form:checkbox[^<>]*?>/g;
    const _checkboxValueRegex = /form:name="(.*?)"/;
    const _checkboxStateRegex = /form:current-state="(.*?)"/;
    for (var i = 0; i < template.files.length; i++) {
      let _file = template.files[i];
      if ('content.xml'.indexOf(_file.name) === -1) {
        continue;
      }
      if (typeof (_file.data) !== 'string') {
        continue;
      }

      _file.data = _file.data.replace(_checkboxRegex, function (xml) {
        let _marker = '';
        /** Find markers inside checkboxes */
        xml = xml.replace(_checkboxValueRegex, function (xml, marker) {
          if (!marker || parser.isCarboneMarker(marker) === false) {
            return xml;
          }
          _marker = marker.replace('}', ':checkbox}');
          if (_marker.indexOf('[') !== -1 && _marker.indexOf(']') !== -1) {
            throw new Error('Carbone does not support lists inside checkboxes.');
          }
          return 'form:name=""';
        });
        /** If it is a dynamic checkbox, insert the marker inside the "current-state" */
        if (_marker !== '') {
          /** The current-value attribute does not exist, it is possible if the default value is unchecked */
          if (xml.indexOf('form:current-state') === -1) {
            xml = xml.replace('>', ` form:current-state="${_marker}">`);
          }
          else {
            xml = xml.replace(_checkboxStateRegex, function () {
              return `form:current-state="${_marker}"`;
            });
          }
        }
        return xml;
      });
    }
  }
};

module.exports = form;