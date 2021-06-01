function checkbox (value) {
  if ( value === null
    || typeof(value) === 'undefined'
    || value === '' || value === 'false' || value === false
    || value instanceof Array && value.length === 0
    || value.constructor === Object && Object.keys(value).length === 0
    || Number.isNaN(value) === true) {
    return "unchecked";
  }
  return "checked";
}

module.exports = {
  checkbox
};