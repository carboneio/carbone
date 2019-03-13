Carbone.io
==========

**Fast, Simple and Powerful report generator** in any format PDF, DOCX, XLSX, ODT, PPTX, ODS [, ...]

... using your JSON data as input.

![Carbone.io Icon](./doc/carbone_icon_small.png)

## Table of content

<!-- MarkdownTOC -->

- [Features](#features)
- [How it works?](#how-it-works)
- [Minimum Requirements](#minimum-requirements)
    - [Optional](#optional)
- [Getting started](#getting-started)
  - [Basic sample](#basic-sample)
  - [PDF generation, document conversion](#pdf-generation-document-conversion)
- [More examples](#more-examples)
- [API Reference](#api-reference)
    - [render\(templatePath, data, options, callback\)](#rendertemplatepath-data-options-callback)
    - [renderXML\(xml, data, options, callback\)](#renderxmlxml-data-options-callback)
    - [set\(options\)](#setoptions)
    - [addFormatters\(customFormatters\)](#addformatterscustomformatters)
- [Command line tools](#command-line-tools)
    - [translate](#translate)
    - [find](#find)
- [Performance](#performance)
- [Licenses and editions](#licenses-and-editions)
- [Philosophy](#philosophy)
- [Roadmap](#roadmap)
- [Contributors](#contributors)

<!-- /MarkdownTOC -->

## Features

  - **Extremely simple** : Use only LibreOffice™, OpenOffice™ or Microsoft Office™ to draw your report
  - **Unlimited design** : The limit is your document editor: pagination, headers, footers, tables...
  - **Convert documents** : thanks to the integrated document converter
  - **Unique template engine** : Insert JSON-like markers `{d.companyName}` directly in your document
  - **Flexible** : Use any XML documents as a template: docx, odt, ods, xlsx, html, pptx, odp, custom xml files...
  - **Future-proof** : A powerful XML-agnostic algorithm understands what to do without knowing XML document specifications
  - **Multilingual** : One template, multiple languages. Update translation files automatically
  - **Format data** : Use built-in date and number formatters or create your own in Javascript
  - **Fast** : Manage multiple LibreOffice threads for document conversion, optimized code generation for each report

## How it works?

Carbone is a mustache-like template engine `{d.companyName}`.

Template language documentation : https://carbone.io/designer-documentation.html

- The template can be any XML-document coming from LibreOffice™ or Microsoft Office™  (ods, docx, odt, xslx...)
- The injected data must be a JSON object or array, coming directly from your existing APIs for example

Carbone analyzes your template and inject data in the document. The generated document can be exported as is, or converted to another format (PDF, ...) using LibreOffice if it is installed on the system.


## Minimum Requirements

- NodeJS 4.x+
- Runs on OSX, Linux (servers and desktop), and coming soon on Windows

#### Optional

- LibreOffice server if you want to use the document converter and generate PDF. Without LibreOffice, you can still generate docx, xlsx, pptx, odt, ods, odp, html as long as your template is in the same format.


## Getting started

### Basic sample

1 - Install it

```bash
  npm install carbone
```

2 - Copy-paste this code in a new JS file, and execute it with node

```javascript
  const fs = require('fs');
  const carbone = require('carbone');

  // Data to inject
  var data = {
    firstname : 'John',
    lastname : 'Doe'
  };

  // Generate a report using the sample template provided by carbone module
  // This LibreOffice template contains "Hello {d.firstname} {d.lastname} !"
  // Of course, you can create your own templates!
  carbone.render('./node_modules/carbone/examples/simple.odt', data, function(err, result){
    if (err) {
      return console.log(err);
    }
    // write the result
    fs.writeFileSync('result.odt', result);
  });
```

### PDF generation, document conversion

Carbone uses efficiently LibreOffice to convert documents. Among all tested solutions, it is the most reliable and stable one in production for now.

Carbone does a lot of thing for you behind the scene:

- starts LibreOffice in "server-mode": headless, no User Interface loaded
- manages multiple LibreOffice workers to maximize performance (configurable number of workers)
- automatically restarts LibreOffice worker if it crashes or does not respond
- job queue, re-try conversion three times if something bad happen


##### 1 - install LibreOffice

###### on OSX

- Install LibreOffice normally using the stable version from https://www.libreoffice.org/

###### on Ubuntu Server & Ubuntu desktop

> Be careful, LibreOffice which is provided by the PPA libreoffice/ppa does not bundled python (mandatory for Carbone). The best solution is to download the LibreOffice Package from the official website and install it manually:

```bash
  # remove all old version of LibreOffice
  sudo apt remove --purge libreoffice*
  sudo apt autoremove --purge

  # Download LibreOffice debian package. Select the right one (64-bit or 32-bit) for your OS.
  # Get the latest from http://download.documentfoundation.org/libreoffice/stable 
  # or download the version currently "carbone-tested":
  wget https://downloadarchive.documentfoundation.org/libreoffice/old/5.3.2.2/deb/x86_64/LibreOffice_5.3.2.2_Linux_x86-64_deb.tar.gz
  
  # Install required dependencies on ubuntu server for LibreOffice 5.0+
  sudo apt install libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6

  # Uncompress package
  tar -zxvf LibreOffice_5.3.2.2_Linux_x86-64_deb.tar.gz
  cd LibreOffice_5.3.2.2_Linux_x86-64_deb/DEBS

  # Install LibreOffice
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts 
  # Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,
  # Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt install ttf-mscorefonts-installer

  # If you want to use special characters, such as chinese ideograms, you must install a font that support them
  # For example:
  sudo apt install fonts-wqy-zenhei

  # If you want to use barcode fonts
  cd ~
  wget https://github.com/graphicore/librebarcode/releases/download/v1.003-alpha/LibreBarcode_v1.003-alpha.zip
  sudo unzip LibreBarcode_v1.003-alpha.zip -d /usr/share/fonts/truetype/librebarcode
  sudo chmod 755 /usr/share/fonts/truetype/librebarcode
  sudo chmod -R 644 /usr/share/fonts/truetype/librebarcode/*
  # refresh fonts, if the following command does not run, sudo apt install fontconfig 
  sudo fc-cache -fv

```

##### 2 - generate PDF

And now, you can use the converter, by passing options to render method.

> Don't panic, only the first conversion is slow because LibreOffice must starts
> Once started, LibreOffice stays on to make new conversions faster

```javascript
  var data = {
    firstname : 'John',
    lastname : 'Doe'
  };

  var options = {
    convertTo : 'pdf' //can be docx, txt, ...
  };

  carbone.render('./node_modules/carbone/examples/simple.odt', data, options, function(err, result){
    if (err) return console.log(err); 
    fs.writeFileSync('result.pdf', result);
    process.exit(); // to kill automatically LibreOffice workers
  });
```


## More examples

##### Nested repetition in a docx document and spreadsheet

```javascript

  var data = [
    {
      movieName : 'Matrix',
      actors    : [{
        firstname : 'Keanu',
        lastname  : 'Reeves'
      },{
        firstname : 'Laurence',
        lastname  : 'Fishburne'
      },{
        firstname : 'Carrie-Anne',
        lastname  : 'Moss'
      }]
    },
    {
      movieName : 'Back To The Future',
      actors    : [{
        firstname : 'Michael',
        lastname  : 'J. Fox'
      },{
        firstname : 'Christopher',
        lastname  : 'Lloyd'
      }]
    }
  ];

  carbone.render('./node_modules/carbone/examples/movies.docx', data, function(err, result){
    if (err) return console.log(err);
    fs.writeFileSync('movies_result.docx', result);
  });

  carbone.render('./node_modules/carbone/examples/flat_table.ods', data, function(err, result){
    if (err) return console.log(err);
    fs.writeFileSync('flat_table_result.ods', result);
  });
```


## API Reference

#### render(templatePath, data, options, callback)

- templatePath `<string>`: path to the template relative to `defaultTemplatePath`, which is `process.cwd()` by default
- data         `<object|array>` : data to inject in the template
- options      `<object>` : options, details below
- callback     `<Function>` : three parameters, `err`, `result` (Binary), `reportName` (String)

`options` can one of these parameters:

```javascript
{
  convertTo    : 'pdf', // String|Object, to convert the document (pdf, xlsx, docx, ods, csv, txt, ...)
  lang         : 'en',  // String, output lang of the report
  complement   : {},  // Object|Array, extra data accessible in the template with {c.} instead of {d.}
  variableStr  : '{#def = d.id}', // String, predefined alias string, see designer's documentation
  reportName   : '{d.date}.odt', // String, dynamic file name, output in third argument of the callback
  enums        : { // Object, list of enumerations, use it in reports with `convEnum` formatters
    'ORDER_STATUS' : ['open', 'close']
    'SPEED' : {
      10 : 'slow' 
      20 : 'fast' 
    }
  },    
  translations : {  // Object, dynamically overwrite all loaded translations for this rendering
    fr : {'one':'un' },
    es : {'one':'uno'}
  }
}
```

`convertTo` can be an object for CSV export

```javascript
{
  formatName    : 'csv',
  formatOptions : {
    fieldSeparator : '+',
    textDelimiter  : '"',
    characterSet   : '76' // utf-8
  }
}
```

`characterSet` can be one these options : https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options


#### renderXML(xml, data, options, callback)

Same as `render` function, except that it accepts pure XML string instead of a template path

Example: 

```javascript
  var data = {
    param : 'field_1'
  };
  carbone.renderXML('<xml>{d.param}</xml>', data, function (err, result) {
    console.log(result); //output <xml>field_1</xml>
  });
```


#### set(options)

> This function is not asynchronous (It may create the template or temp directory synchronously).

Set general carbone parameters.

- `options` can contains 

```javascript
  {
    tempPath     : os.tmpdir(),  // String, system temp directory by default
    templatePath : process.cwd(), // String, default template path, and lang path
    lang         : 'fr', // String, set default lang of carbone, can be overwrite by carbone.render options
    translations : {    // Object, in-memory loaded translations at startup. Can be overwritten here
      fr : {'one':'un' },
      es : {'one':'uno'}
    },
    factories    : 1, // Number of LibreOffice worker 
    startFactory : false // If true, start LibreOffice worker immediately
  }
```

Example: 

```javascript
  carbone.set({
    lang : 'en'
  });
```


#### addFormatters(customFormatters)

Carbone comes with [embedded formatters](https://carbone.io/designer-documentation.html#formatters)

You can add your own formatters, and overwrite default ones.

- `customFormatters` must be an object containing one or many functions. Example:

```javascript
  carbone.addFormatters({
    // this formatter can be used in a template with {d.myBoolean:yesOrNo()}
    yesOrNo : function (data) { // data = d.myBoolean
      if (this.lang === 'fr') {
        return data === true ? 'oui' : 'non';
      }
      return data === true ? 'yes' : 'no';
    }
  });
```

The function signature must be like this:

```javascript
function(data, firstParam, secondParam, ...) {
  return '' // value printed in a rendered report
}
```


## Command line tools

For convenience, install carbone globally

```bash
  npm install carbone -g
```

#### translate

With this command, Carbone parses all your templates, find [translation markers](https://carbone.io/designer-documentation.html#translations) like `{t(movie)}`, and updates JSON translation files accordingly.

It creates automatically a `lang` directory with all translation files, one per lang. It never loses already translated sentences.

Carbone loads translation files at startup if it finds a `lang` directory in the default template path.

```bash
carbone translate --help

# example: 
carbone translate -l fr -p path/to/template_default_path
```

#### find

If you want to find where a deprecated formatter is used among all your templates, carbone provides a search tool

```bash
carbone find needle
```

It searches among all reports in the current working directory and its subdirectories


## Performance

Report generation speed, using a basic one-page DOCX template:

  - ~ `10 ms / report` without document conversion (analyzing, injection, rendering)
  - ~ `50 ms / report` with a PDF conversion (100 loops, 3 LibreOffice workers, without cold-start)

On a MacBook Pro Mid-2015, 2,2 Ghz i7, 16Go.

It could be even better when "code cache" will be activated. Coming soon...

## Licenses and editions

There are two editions of Carbone:

- Carbone Community Edition is available freely under the **Apache v2 license**
- Carbone Enterprise Edition (hosted and on-premise) includes extra features like a user interface (coming soon)

We want to follow the model of Gitlab. **The free version must be and must stay generous.**


## Philosophy

> Our ultimate goal

We will give 3% percent of our hosted solution revenues to charity in three domains: technology, people and resources.

Stay tuned, best contributors could choose where a part of these 3% goes!

We already know that beneficiaries will be, at least :heart:
- LibreOffice foundation
- PostgreSQL foundation
- An innovative child school in France


## Roadmap

Help is welcome!

  - manage dynamic images
  - manage dynamic colors
  - manage dynamic charts
  - improve error output
  - improve xslx support

## Contributors

Thanks to all Ideolys's direct contributors (random order)

  - Florian Bezagu
  - Matthieu Robin
  - Arnaud Lelièvre
  - Maxime Vincent
  - Enzo Ghemard
  - Jordan Nourry
  - Etienne Rouillard
  - Guillaume Chevaux
  - Fabien Bigant
  - Maxime Magne
  - Vincent Bertin
  - Léo Labruyère
  - Aurélien Kermabon

Thanks to all French citizens (Crédit Impôt Recherche, Jeune Entreprise Innovante, BPI)!



