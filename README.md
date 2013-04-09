Carbone
======

>A document parser and generator (docx, xlsx, odt, pdf, ...). It can be used for reporting like jasperreport.

Features
--------

- Report generator based on templates.


Dependencies
------------

1. Node.js
2. Npm (package manager for Node)


Source inspiration
------------------

Conversion dans d'autre format : http://pc-freak.net/blog/convert-doc-pdf-linux-console-convertion-pdf-doc-scripts/


1. [Jandoc](https://github.com/jgnewman/jandoc)
2. [node-office](https://github.com/dkiyatkin/node-office)
3. [markdown-word](https://github.com/Trimeego/markdown-word)
4. [excel](https://github.com/trevordixon/excel.js)
5. [js-xlsx](https://github.com/Niggler/js-xlsx)
6. [node-json2officexml](https://github.com/pimetrai/node-json2officexml)


NOuvelle solution pour crére un PDF :
-------------------------------------
Utiliser un XDP:

- http://blogs.adobe.com/livecyclelane/2009/10/sample_-_dynamic_assembly_of_xdp_form.html
- Inclure un pdf dans un xdp : http://stackoverflow.com/questions/6697708/xdp-file-using-remote-pdf
  |- il doit être possible de faire l'inverse
- http://forums.adobe.com/message/1336535?tstart=0



Convert ot pdf :

May use these source :
- docbook (docbook-utils ou docbook2pdf) mais le format n'est peut-être pas adpété 
- xps (xpstopdf on linux)
- ePub (pas gagné)
- djvu (ox2a, djvutopdf)
- abiworld

XML Parser :

https://github.com/polotek/libxmljs : good but dependency on external library libxmljs

https://github.com/robrighter/node-xml

https://github.com/Leonidas-from-XIV/node-xml2js


https://github.com/lindory-project/node-xml-splitter

https://github.com/lindory-project/node-xml-mapping

https://github.com/isaacs/sax-js -> dévelopé pr isaac (SAX)

ZIP:
https://github.com/Stuk/jszip/tree
https://github.com/cthackers/adm-zip


Data binding to word :
http://www.codeproject.com/Articles/20287/Generating-Word-Reports-Documents
http://lennilobel.wordpress.com/2009/11/20/dataview-separation-in-word-2007-using-word-xml-data-binding-and-openxml/

Template substitution; CustomXML binding

http://www.docx4java.org/svn/docx4j/trunk/docx4j/docs/Docx4j_GettingStarted.html
http://www.opendope.org/opendope_conventions_v2.3.html 
-> comment gérer les répétitions et conditions

-> inspiration : http://templater.info/

---

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

carbone.render('templates/my-file.docx', data, function(result){
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

carbone.render('templates/my-file.docx', data, function(result){
  fs.writeFileSync('result.docx', result);
});
```

Now you just have to execute this file in terminal :

```bash
node app.js
```

Now go into **carbone-example-formatter** folder and look at the **result.docx** file !
