Carbone.io
==========
**Fast, Simple and Powerful report generator** in any format PDF, DOCX, XLSX, ODT, PPTX, ODS, ...

https://carbone.io

![Carbone.io Icon](./doc/carbone_icon_small.png)


Features
--------

- **Extremely simple** : Use only LibreOffice™, OpenOffice™ or Microsoft Office™ to draw your report
- **Unlimited design** : The limit is your document editor: pagination, headers, footers, tables...
- **Convert documents** : thanks to the integrated document converter (LibreOffice must be installed)
- **Unique template engine** : Insert JSON-like markers `{d.companyName}` directly in your document
- **Flexible** : Use any XML documents as a template: docx, odt, ods, xlsx, html, pptx, odp, custom xml files...
- **Future-proof** : A powerful XML-agnostic algorithm understands what to do without knowing XML document specifications
- **Multilanguage** : One template, multiple languages. Update translation files automatically
- **Format data** : Use built-in date and number formatters or create your own in Javascript
- **Fast** : Manage multiple LibreOffice threads for document conversion, optimized code generation for each report


How it works?
-------------

Carbone is a template engine.

- The template can be any document coming from LibreOffice™, OpenOffice™ or Microsoft Office™  (ods, docx, odt, xslx...)
- The injected data must be a JSON object or array, coming directly from your existing APIs for example

Carbone analyze your template and inject data in the document. The generated document can be exported as is, or converted to another format (PDF, ...) using LibreOffice if it is installed on the system


Getting Started
---------------

Minimal dependencies: 
- moxie-zip 
- zipfile

If you want to use the document converter, install LibreOffice:

On Linux:
Be careful, LibreOffice which is provided by the PPA libreoffice/libreoffice-4-0 and libreoffice/ppa does not bundled python 3.3. And we must use python of LibreOffice to convert documents. The best solution is to download the LibreOffice Package from the offical website and install it manually:

```bash
  # remove all old version of LibreOffice if there is
  sudo apt-get remove --purge libreoffice*
  sudo apt-get autoremove --purge

  # install minimal dependencies for LibreOffice
  sudo apt-get install libxinerama1 libfontconfig1 libcups2

  # Download LibreOffice 64 bits version for ubuntu 64 bits
  wget http://download.documentfoundation.org/libreoffice/stable/5.1.1/deb/x86_64/LibreOffice_5.1.1_Linux_x86-64_deb.tar.gz

  # Install required dependencies on ubuntu server for LibreOffice 5.0+
  sudo apt-get install libxinerama1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6

  cd LibreOffice_5.1.1_Linux_x86-64_deb
  cd DEBS

  # Install LibreOffice. it should be possible to install only the base but I'm not sure
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts on the server (Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt-get install ttf-mscorefonts-installer
```
The ppa seams to be compiled with  --enable-python=system




