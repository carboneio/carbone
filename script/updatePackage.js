const fs          = require('fs');
const path        = require('path');
const packagePath = path.join(process.cwd(), 'package.json');
const package     = require(packagePath);

// update publication date for On-Premise license check
package.carbonePublicationDate = (new Date()).toISOString();

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2)+'\n');
