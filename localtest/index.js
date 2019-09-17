const fs = require('fs');
const carbone = require('../lib/index.js');
// const data = require('./data.json');
const data = require('./data-barcode.json');

// Data to inject
// var data =

const options = {
  convertTo : 'pdf',
};

// Generate a report using the sample template provided by carbone module
// This LibreOffice template contains "Hello {d.firstname} {d.lastname} !"
// Of course, you can create your own templates!
// eslint-disable-next-line no-undef
carbone.render('./doc-barcode.odt', data, options, function (err, result) {
  if (err) {
    return console.log(err);
  }
  // write the result
  fs.writeFileSync('./result.pdf', result);
});