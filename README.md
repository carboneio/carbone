CarboneJS
=========

- **Fast, Simple and Powerful report generator** in any XML-based formats : DOCX, XLSX, ODT, PPTX, ODS, ...
- **Generate PDF** thanks to the integrated document converter (depends on LibreOffice)

Features
--------

- Report generator based on templates.
- Efficient use of LibreOffice to convert documents 
- Automatically restart LibreOffice if it crahes
- Configurable number of LibreOffice servers
- Retry conversion automatically

Dependencies
------------

Minimal dependencies: 
- moxie-zip 
- zipfile

If you want to use the docuemnt converter, install LibreOffice (version 4.x is better):

On Linux:
Be careful, LibreOffice which is provided by the PPA libreoffice/libreoffice-4-0 and libreoffice/ppa does not bundled python 3.3. And we must use python of LibreOffice to convert documents. The best solution is to download the LibreOffice Package from the offical website and install it manually:

```bash
  # remove all old version of LibreOffice if there is
  sudo apt-get remove --purge libreoffice*
  sudo apt-get autoremove --purge

  # install minimal dependencies for LibreOffice
  sudo apt-get install libxinerama1 libfontconfig1 libcups2

  # Download LibreOffice 64 bits version for ubuntu 64 bits
  wget http://download.documentfoundation.org/libreoffice/stable/4.3.6/deb/x86_64/LibreOffice_4.3.6_Linux_x86-64_deb.tar.gz
  tar -zxvf LibreOffice_4.0.3_Linux_x86-64_deb.tar.gz
  cd LibreOffice_4.0.3_Linux_x86-64_deb
  cd DEBS

  # Install LibreOffice. it should be possible to install only the base but I'm not sure
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts on the server (Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt-get install ttf-mscorefonts-installer
```
The ppa seams to be compiled with  --enable-python=system


Other similar solutions
-----------------------
- http://templater.info/
- http://docxpert.eu/
- xdocreports : https://code.google.com/p/xdocreport
- JODReport : http://jodreports.sourceforge.net/
- https://www.docmosis.com
- [Jandoc](https://github.com/jgnewman/jandoc)
- [node-office](https://github.com/dkiyatkin/node-office)
- [markdown-word](https://github.com/Trimeego/markdown-word)
- [excel](https://github.com/trevordixon/excel.js)
- [js-xlsx](https://github.com/Niggler/js-xlsx)
- [node-json2officexml](https://github.com/pimetrai/node-json2officexml)


---

# Getting started

## Install
First you have to install carbone in your project via `npm` :

```bash
npm install carbone
```

## Include in project
Just like all other node modules you have to `require` carbone :

```javascript
var carbone = require('carbone');
```

---

## First example
In this example we will generate a file with two variables inside it.

### File structure
For this example we will have following structure of files and folders :

```bash
|-- carbone-example/
    |-- templates/
        |-- my-file.docx
    |-- app.js
```

Create and save **my-file.docx** in the **templates** folder with only the following line inside it :

```text
Hello {d.firstname} {d.lastname} !
```

Open a **Terminal** and go to the **carbone-example** folder :

```bash
cd carbone-example
```

Install carbone in this folder

```javascript
npm install carbone
```

Open **app.js** file and write :

```javascript
var fs = require('fs');
var carbone = require('carbone');

var data = {
  firstname : 'John',
  lastname : 'Doe'
};

carbone.set({
  templatePath: 'templates'
});

carbone.render('my-file.docx', data, function(err, result){
  if (err) {
    console.error(err);
    return;
  }

  fs.writeFileSync('result.docx', result);
});
```

Now you just have to execute this file in terminal :

```bash
node app.js
```

Now go into **carbone-example** folder and look at the **result.docx** file !

---

## Formatters usage example
In this example we will generate a file with variables and formatters for a date and a number.

### File structure
For this example we will have following structure of files and folders :

```bash
|-- carbone-example-formatter/
    |-- templates/
        |-- my-file.docx
    |-- app.js
```

Create and save **my-file.docx** in the **templates** folder with the following lines inside it :

```text
Hello {d.firstname} {d.lastname} !
You are {d.age:int} years old.
Today’s date is {d.date:format('YYYY/MM/DD')}.
```

Open a **Terminal** and go to the **carbone-example-formatter** folder :

```bash
cd carbone-example-formatter
```

Install carbone in this folder

```javascript
npm install carbone
```

Open **app.js** file and write :

```javascript
var fs = require('fs');
var carbone = require('carbone');

var data = {
  firstname : 'John',
  lastname : 'Doe',
  age : 24.55,
  date : new Date()
};

carbone.set({
  templatePath: 'templates'
});

carbone.render('my-file.docx', data, function(err, result){
  if (err) {
    console.error(err);
    return;
  }

  fs.writeFileSync('result.docx', result);
});
```

Now you just have to execute this file in terminal :

```bash
node app.js
```

Now go into **carbone-example-formatter** folder and look at the **result.docx** file !
