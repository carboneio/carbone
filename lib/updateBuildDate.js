const fs = require('fs');
const path = require('path');
const { exit } = require('process');

function readPackage (callback) {
  fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8', (err, content) => {
    if (err) {
      return callback(err);
    }

    let jsonData = JSON.parse(content);

    return callback(null, jsonData);
  });
}

function writePackage (content, callback) {
  fs.writeFile(path.join(process.cwd(), 'package.json'), JSON.stringify(content, null, 2), (err) => {
    if (err) {
      return callback(err);
    }

    return callback(null);
  });
}

function handleBuildDate (action) {
  readPackage((err, jsonData) => {
    if (err) {
      console.log(err);
      return process.exit(1);
    }

    if (action === 'set') {
      jsonData.carboneBuildDate = Date.now();
    }
    else if (action === 'delete') {
      delete jsonData.carboneBuildDate;
    }

    writePackage(jsonData, (err) => {
      if (err) {
        console.log(err);
        return process.exit(1);
      }

      return process.exit(0);
    });
  });
}

function handleParams () {
  const action = process.argv[2];

  if (action !== 'set' && action !== 'delete') {
    console.log('Unknown action, it can be set or delete');
    process.exit(1);
  }

  handleBuildDate(action);
}

handleParams();
