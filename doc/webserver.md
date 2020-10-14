Carbone On-Premise Draft doc
============================

# Installation

Two installation methods : 
  - One self-contained binary executable + external LibreOffice (used for conversion)
  - Docker [NOT IMPLEMENTED]

## Binary executable (method 1)

### Installation

- 1 - Download Carbone On-premise binary for your server/OS: Mac, Linux or Windows (Coming soon) 
- 2 - Install LibreOffice (Optional). See instruction below.
- 3 - Start Carbone web server

```bash
  ./carbone webserver --port 4000 --workdir .
```
It creates directories in `--workdir` [-w]  (executable directory by default)

- `template`  : where carbone keeps templates (cache)
- `render`    : temp directory where report are generated 
- `asset`     : internal are generated 
- `config`    : config and licenses
- `logs`      : [NOT IMPLEMENTED] formatted output logs 
- `plugin `   : where to put custom plugin 


### How to use it?

Same HTTP API as https://carbone.io/api-reference.html#carbone-render-api

Carbone On-Premise will be compatible with our SDK for Python, Go, JS, PHP, ...

- Add a template    : POST /render.carbone.io/template
- Generate a report : POST /render.carbone.io/render/:templateId
- Get the result    : GET /render.carbone.io/render/:renderId


[NOT IMPLEMENTED] You can also send an URL instead of a templateId. Carbone will download the template automatically.


### How and why install LibreOffice?

#### on OSX

- Install LibreOffice normally using the stable version from https://www.libreoffice.org/

#### on Ubuntu Server & Ubuntu desktop

> Be careful, LibreOffice which is provided by the PPA libreoffice/ppa does not bundled python (mandatory for Carbone). The best solution is to download the LibreOffice Package from the official website and install it manually:

```bash
  # remove all old version of LibreOffice
  sudo apt remove --purge libreoffice*
  sudo apt autoremove --purge

  # Download LibreOffice debian package. Select the right one (64-bit or 32-bit) for your OS.
  # Get the latest from http://download.documentfoundation.org/libreoffice/stable
  # or download the version currently "carbone-tested":
  wget https://downloadarchive.documentfoundation.org/libreoffice/old/6.4.4.2/deb/x86_64/LibreOffice_6.4.4.2_Linux_x86-64_deb.tar.gz

  # Install required dependencies on ubuntu server for LibreOffice 6.0+
  sudo apt install libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6

  # Uncompress package
  tar -zxvf LibreOffice_6.4.4.2_Linux_x86-64_deb.tar.gz
  cd LibreOffice_6.4.4.2_Linux_x86-64_deb/DEBS

  # Install LibreOffice
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts
  # Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,
  # Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt install ttf-mscorefonts-installer

  # If you want to use special characters, such as chinese ideograms, you must install a font that support them
  # For example:
  sudo apt install fonts-wqy-zenhei
```

#### Why?

Carbone uses efficiently LibreOffice to convert documents. Among all tested solutions, it is the most reliable and stable one in production for now.

Carbone does a lot of thing for you behind the scene:

- starts LibreOffice in "server-mode": headless, no User Interface loaded
- manages multiple LibreOffice workers to maximize performance (configurable number of workers)
- automatically restarts LibreOffice worker if it crashes or does not respond
- job queue, re-try conversion three times if something bad happen



## Docker (method 2)

TODO

# Carbone CLI

## Run the webserver

To run the Carbone server, you have to call the binary with `webserver` as argument:

```bash
./carbone webserver
```

If you need to see the command usage, call

```bash
./carbone webserver --help
```

## Generate a JWT token for authentication

You can generate a JWT token with the CLI to easily test the authentication. The generated token is valid for the next 40 years.

```bash
./carbone generate-token
```

# Launch and setup

## Launch Carbone on premise

You can override default Carbone parameters with different ways.

- CLI parameters
- With environment variable
- With the config file

*Note: Parameters priority is first the CLI, than environment variable and in last the config file.*

You can override following parameters:

- port
- bind
- factories
- workdir
- attempts
- auth

### Override with CLI

You can override with Carbone CLI as follow

```bash
./carbone webserver --port 4001 --bind 127.0.0.1 --factories 4 --workdir /var/www/carbone --attemps 2 --auth
```

### Override with config file

To override with config file, copy/paste the following JSON data in `config/config.json`

```json
{
  "port": 4001,
  "bind": "127.0.0.1",
  "factories": 4,
  "workdir": "/var/www/carbone",
  "attemps": 2,
  "auth": true
}
```

### Override with environment variable

To override with environment variable, you have to uppercase the name and prefix it with `CARBONE_EE_`. For example:

```bash
export CARBONE_EE_PORT=3600
export CARBONE_EE_BIND=127.0.0.1
export CARBONE_EE_FACTORIES=4
export CARBONE_EE_WORKDIR=/var/www/carbone
export CARBONE_EE_ATTEMPS=2
export CARBONE_EE_AUTH=true
```

## Setup plugins

You have the possibility to override a few things in carbone on premise. The allow you to choose where to save your templates for example.

Here is the list of what you can override:

- Write template
- Key.pub location (for authentication)
- Read template
- Write render
- Read render

To override them, we recommand you to create a node repository. So if you want to use for example a module to use amazon s3 to store your template for example, you can do it easily.

```bash
# Create a separate folder
mkdir carbone-on-premise

# Initialize a node repository
npm init

# Move the carbone binary inside this folder
mv /path/to/carbone/binary ./carbone
```

When you launch for the first time carbone on premise, all folders will be created, included the `plugin` folder.

### Override render filename

You can override and choose the filename and the location you want for your render. To do this, add a function `generateOutputFile` in the `storage.js` plugin and export it. In this function, you can access the current request `req`.

You have to return an object with two keys: `renderPath` and `renderPrefix`.

```js
function generateOutputFile (req) {
  return {
    renderPath: path.join(process.cwd(), 'new', 'path'),
    renderPrefix: 'myPrefix'
  }
}
```

### Override write template

To override template writing, you have to create the file `storage.js` in the `plugin` folder. The function to export is `writeTemplate` and is described as follow

```js
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * @param {Stream} stream : File stream
 * @param {String} filename : Template name
 * @param {Function} callback : Function to call at the end
 */
function writeTemplate (stream, filename, callback) {
  // We create a write stream which will write the template in the tmp dir of the os
  const writeStream = fs.createWriteStream(path.join(os.tmpdir(), filename));

  // Check errors
  writeStream.on('error', (err) => {
    return callback(new Error('Error when uploading file'));
  });

  // When it's finish, we call the callback without errors
  writeStream.on('finish', () => {
    return callback(null);
  });

  stream.pipe(writeStream);
}

// Export the writeTemplate function
module.exports = {
  writeTemplate
}
```

### Override read template

To override template reading, always in the file `storage.js` in the `plugin` folder, you have to export the function `readTemplate` which is descibred as follow:

```js
function readTemplate (templateName, callback) {
  // Read your template and return a local path for carbone
}

module.exports = {
  readTemplate
}
```

This function must return a local path to carbone so it can read it on the disk.

### Override write render

To override render writing, you have to add the function `onRenderEnd` in the `storage.js` file and export it.

```js
function onRenderEnd (req, res, reportName, reportPath, next) {
  // Write or rename your render

  return next(null)
}

module.exports = {
  onRenderEnd
}
```

This function can be used to move the render on AWS for example.

With this function you can totally override the response and choose the one you want. For example:

```js
res.send({
  success: true,
  data: {
    newField: reportName
  }
});
```

### Override read render

To override render reading, you have to add the function `readRender` in the `storage.js` file and export it.

```js
function readRender (req, res, renderName, next) {
  // Return the directly render or a local path
}
```

With this function you can either return directly the file using res or return the new render name or path you choose with `onRenderEnd` function.

```js
// Return the new render name
function readRender (req, res, renderName, next) {
  return next(null, 'newRenderName')
}

// OR

// Return the new path on disk
function (req, res, renderName, next) {
  return next(null, renderName, '/new/path/on/disk')
}
```

### Override get key.pub for authentication

To override the get key.pub location, you have to create the file `authentication.js` in the `plugin` folder. The function to export is `getPublicKey` and is described as follow:

```js
const fs = require('fs');
const path = require('path');

/**
 * @param {Object} req : Request from the request
 * @param {Object} res : Response from the request
 * @param {Object} payload : https://github.com/Ideolys/kitten-jwt#api-usage to see object details
 * @param {Function} callback : Function to call at the end
 * @return (publicKeyContent)
 */
function getPublicKey (req, res, payload, callback) {
  // Read the public key on disk or wherever you want
  fs.readFile(path.join(__dirname, '..', 'config', 'key.pub'), 'utf8', (err, content) => {
    if (err) {
      return callback(new Error('Cannot read public key ' + err.toString()));
    }

    // Return the public key content in the callback
    return callback(content)
  });
}

// Export the getPublicKey function
module.exports = {
  getPublicKey
}
```
