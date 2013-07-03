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

```bash
  sudo apt-get install zip unzip 
```

If you want to use the docuemnt converter, install LibreOffice (version 4.x is better):

On Linux:
Be careful, LibreOffice which is provided by the PPA libreoffice/libreoffice-4-0 and libreoffice/ppa does not bundled python 3.3. And we must use the python of LibreOffice to convert document. The best solution is to download the LibreOffice Package from the offical website and install it manually:

```bash
  # remove all old version of LibreOffice if there is
  sudo apt-get remove --purge libreoffice*
  sudo apt-get autoremove --purge

  # install minimal dependencies for LibreOffice
  sudo apt-get install libxinerama1 libfontconfig1 libcups2

  # Download LibreOffice 64 bits version for ubuntu 64 bits
  wget http://download.documentfoundation.org/libreoffice/stable/4.0.3/deb/x86_64/LibreOffice_4.0.3_Linux_x86-64_deb.tar.gz
  tar -zxvf LibreOffice_4.0.3_Linux_x86-64_deb.tar.gz
  cd LibreOffice_4.0.3_Linux_x86-64_deb
  cd DEBS

  # Install LibreOffice. it should be possible to install only the base but I'm not sure
  sudo dpkg -i *.deb
```
The ppa seams to be compiled with  --enable-python=system


TODO
-----
- Essayer de développer un module UNO C++ pour éviter de passer par python (peut-être plus rapide) : http://api.libreoffice.org/examples/examples.html#Cpp_examples
Tuto UNO C++ : http://www.linuxjournal.com/article/8608

- get the list of supported format 
- convert presentation/spreadsheet to pdf
mettre un message d'erreur clair quand unzip n'est pas installé (ligne 160 indes.js throw error)


Other similar solutions
-----------------------
- http://templater.info/
- http://docxpert.eu/
- xdocreports : https://code.google.com/p/xdocreport
- JODReport : http://jodreports.sourceforge.net/
- https://www.docmosis.com


Source inspiration
------------------

Conversion dans d'autre format : http://pc-freak.net/blog/convert-doc-pdf-linux-console-convertion-pdf-doc-scripts/


1. [Jandoc](https://github.com/jgnewman/jandoc)
2. [node-office](https://github.com/dkiyatkin/node-office)
3. [markdown-word](https://github.com/Trimeego/markdown-word)
4. [excel](https://github.com/trevordixon/excel.js)
5. [js-xlsx](https://github.com/Niggler/js-xlsx)
6. [node-json2officexml](https://github.com/pimetrai/node-json2officexml)


Methode retenue :
-----------------
- Utiliser le srcipt de unoconv (version pur Python 3 : https://github.com/xrmx/unoconv/tree/fc59dd90f03cf88f4cf16c07204809f2239284ee)
- Utiliser python qui est fourni avec LibreOffice : /Applications/LibreOffice.app/Contents/MacOS/python
- Essayer d'éexuter Python tel quel, si il y a une erreur du type "dyld: Library not loaded:" 
    - essayer de trouver la librairie ailleurs sur MAC : find / -name 'libintl.8.dylib'
    - créer un lien dans /usr/local/libodep/lib/libintl.8.dylib : 
        - mkdir -p /usr/local/libodep/lib/
        - ln -s /Applications/MAMP_2013-02-07_19-41-05/Library/lib/libintl.8.dylib /usr/local/libodep/lib/libintl.8.dylib

Test pipe avec unoconv_py3:
1. start a server (pass by a pipe): /Applications/LibreOffice.app/Contents/MacOS/python python/unoconv_py3 -l --pipe bla
2. launch a conversion            : python/unoconv_py3 --pipe bla -f pdf --stdout python/bon-commande-18.odt > test.pdf

Test pipe avec unoconv_py3_stream:
1. start a server (pass by a pipe): /Applications/LibreOffice.app/Contents/MacOS/python python/unoconv_py3 -l --pipe bla
2. launch a conversion            : cat python/bon-commande-18.odt | python/unoconv_py3_stream --stdout --pipe bla > test2.pdf

Alternative direct to start a server: 
--------------------------------------
/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --invisible --nocrashreport --nodefault --nologo --nofirststartwizard --norestore --quickstart --nolockcheck --accept="socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext"

/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --invisible --nocrashreport --nodefault --nologo --nofirststartwizard --norestore --quickstart --nolockcheck --accept="pipe,name=bla;urp;StarOffice.ComponentContext"

Comment lancer plusieurs instance de libreoffice en même temps :
https://bugs.freedesktop.org/show_bug.cgi?id=37531
-env:UserInstallation=file:///home/user/.libreoffice-alt



http://stackoverflow.com/questions/15860543/dyld-library-not-loaded-usr-local-libodep-lib-libintl-8-dylib

Utiliser directement le serveur de libreoffice et se connecter dessus :
Lancer libre office en listener :
soffice "-accept=socket,host=127.0.0.1,port=2003,tcpNoDelay=1;urp;" -headless -nodefault -nofirststartwizard -nolockcheck -nologo -norestore
Comment compiler LibreOffice en mode headless :
https://wiki.documentfoundation.org/Development/HeadlessBuild




NOuvelle solution pour crére un PDF :
-------------------------------------
A priori the best one : xdocreport
http://angelozerr.wordpress.com/2012/12/06/how-to-convert-docxodt-to-pdfhtml-with-java/

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
