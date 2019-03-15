const fs = require('fs');
const carbone = require('../lib');

// Data to inject
var data = {
  image: "https://www.catizz.com/medias/common/miaulement%20chat%20.jpg"
};

// Generate a report using the sample template provided by carbone module
// This LibreOffice template contains "Hello {d.firstname} {d.lastname} !"
// Of course, you can create your own templates!
carbone.render('./originalOldLibo.odt', data, function (err, result) {
  if (err) {
    return console.log(err);
  }
  // write the result
  fs.writeFileSync('result.odt', result);
});