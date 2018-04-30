### xxx
  - Add fallback to basic sorting when timsort crashes.

### v1.1.0-ideolys
  - Release January 25, 2018
  - add formatter `convCRLF()` to convert text, which contains `\r\n` or `\n`, into "real" carriage return in odt or docx document
  - Formatters which have the property `canInjectXML = true` can inject XML in documents
  - Return an error in render callback when LibreOffice is not detected 
  - Fix a lot of bugs when using a filter without iterators in arrays `{d.cities[i=0].temperature}`
  - Get the last object of an array using negative values when filtering with `i` iterator
    - `{d.cities[i=-1].temperature}` shows the temperature (if the array is not empty) of the last city
    - `{d.cities[i=-2].temperature}` shows the temperature of the city before the last
    - ...

### v1.0.5-ideolys
  - Release January 12, 2018
  - Fix socket bug

### v1.0.4-ideolys
  - Release January 10, 2018
  - Fix: markers were not parsed if formatters were used directly on `d` or `c` like this `{d:ifEmpty('yeah')}` ...
  
### v1.0.3-ideolys
  - Release December 15, 2017
  - Add new formatters
    - `unaccent()` to remove accent from string
    - `count()` to print a counter in loops. Usage: `{d[i].name:count()}`
  - accepts iteration on non-XML. Example: `{d[i].brand} , {d[i+1].brand}` 
  - carbone.set do not overwrite user-defined translations
  - some optimization : gain x10 when sorting 1 Million of rows
  - It loads all lang at startup, and it is able to change lang at runtime
  - Avoid unnecessary synchronous code in `carbone.set
  - Improve documentation
  - Default template path is working directory by default
  - Return the list of supported format when an unknown `options.convertTo` is used
  - Accept more input type
  - carbone.set` takes into account changes on `factories` and `startFactory` parameters
  - Fix: accept to nest arrays in XML whereas these arrays are not nested in JSON
  - Fix: keep the first element of the array if the custom iterator is constant
  - Fix: a report without markers, except lang ones, is translated
  - Fix: avoid using LibreOffice if `options.convertTo` equals input file extension
  - Fix: now compatible with node v4.5.0+, v6+, v8+

### v0.14.3
  - Fix: markers were not parsed if formatters were used directly on `d` or `c` like this `{d:ifEmpty('yeah')}` ...

### v0.14.2
  - Add formatter `unaccent` to remove accent from string

### v0.14.1
  - Fix: accept to nest arrays in XML whereas these arrays are not nested in JSON

### v0.14.0
  - Fix: should find markers even if there is a opening bracket `{` before the markers

### v0.13.3
  - Automatically remove XML-incompatible control codes (U+0000 to U+0008 and U+000B to U+000C and U+000E to U+001F) before inserting data in templates
  - Fix: ifEqual did not work correctly with boolean values

### v0.13.2
  - Fix LO zombie process when node exits
  - Fix: improve detection of markers. And avoid removing non-marker {}

### v0.13.1
  - Release February 22, 2017
  - Access properties of the parent object with two (or more) points `..` and then access children properties as usual: `{d.cities[i, temp=20]..country.history.sport.value}`
  - Do not crash when there is a javascript error during building process
  - Improve error outputs: detect when an unknown formatter is used, and propose a correction

### v0.13.0
  - Release February 20, 2017
  - Access properties of the parent object with two points `..` or more. Use case: conditional printing of properties using filters in nested arrays: 
    - `{d.cities[i, temp=20]..countryName}` prints `d.countryName` only when the temperature of cities equals 20
  - Built-in conditional formatters, which starts by `if`, stop propagation to next formatters if the condition is true
  - New formatters:
    - `convEnum(d, type)`: convert enums to human readable values
    - `ifEqual(d, value, messageIfTrue, continueOnSuccess)`: show message if `d == value`, and stop propagation to next formatters unless `continueOnSuccess` is true
    - `ifContain(d, value, messageIfTrue, continueOnSuccess)`: show message if `d contains value`, and stop propagation to next formatters unless `continueOnSuccess` is true
    - `print(d, message)`: print message
  - New function `carbone.renderXML(xmlString, data, options, callback)` to render XML directly
  - Change the lang dynamically in `carbone.render` and `carbone.renderXML` with `options.lang = 'fr'`. The date formatter is automatically propagated on formatters such as `convDate`
  - Replace module zipfile by yauzl: faster, lighter, asynchrone 
  - XLSX templates are accepted (beta)
  - Parse embedded XLSX and DOCX documents
  - Add a tool to search a text within a marker in all reports `carbone find :formatterName` 


### v0.12.5
  - Release December 1, 2016
  - Bump moment.js to 2.17.0
  - Add some powerful and tested formatters: `ifEmpty`, `arrayJoin`, `arrayMap`, `convDate`, `lowerCase`, `upperCase`, `ucFirst`, `ucWords`
  - Fix: in formatters `convert`, `format`, `addDays`, `parse`: if the date is null or undefined these formatters return null or undefined instead of "Invalid Date"

### v0.12.4
  - Fix: `carbone.render` crash if `options` contains `formatName` without `formatOptionsRaw` and `formatOptions` 

### v0.12.3
  - Fix: on OSX, the LibreOffice 5.2 path has changed
  - Possibility to add the source file extension in `options` when using `convert(data, convertTo, options, callback)` function. It is mandatory for CSV files otherwise LibreOffice does not understand the file type.
  ```
    {
      fieldSeparator  : ',',
      textDelimiter   : '"',
      characterSet    : '76',
      sourceExtension : '.csv'
    }
  ```

### v0.12.2
  - Fixed crash when a document cannot be parsed. It returns an error instead of crashing

### v0.12.1
  - Fixed crash when a document cannot be converted (ods -> doc for example). It returns an error instead of crashing
  - Update documentation to install LibreOffice 5.1 on Ubuntu Server
  - Fix: crashed when using a nested undefined object inside a template

### v0.12.0
  - Upgrade Zipfile, improve some tests for Node.js 4.x compatibility

### v0.11.3
  - Fixed crash when data contains a lot of nested arrays

### v0.11.2
  - Fix a performance issue when a template isn't using iterators at all, this issue caused the array of data to become really big in some cases even though only a small portion of the data was really used

### v0.11.1
  - CarboneJS Server can be used on a remote server. CarboneJS send the document by socket instead of writing a file locally (only when a document conversion occurs)
  - CarboneJS Server 0.11 is still compatible with CarboneJS v0.10 clients
  - Add two benchmarks tests
  - Fix a random failure in a test


### v0.10.1

  - Allow the comparison operator `!=` in your template: `{d.cars[engine.power != 3].name}`
  - Add a newline at the end of the lang file
  - Fix: Translation, upper and lower case order does not depend on user's language anymore
  - Do not restart LibreOffice if the document is corrupted (restart it only after 10 consecutive attemps)
  - Return an error when the document cannot be converted
  - Improve stability in general
  - Socket connections have been improved:
    + it manages TLS communications
    + it increases the delay between two connection attempts exponentially until it reaches a maximum delay of 20sec
  - Fix bugs in tests
  - Compatible with Node v0.12
  - Update zipfile dependency
  - Now, the repetition algorithm can flatten an array of objects!!
    + it accepts to increment multiple arrays in the same time
    + it repeats automatically all markers that are on the same row of all nested arrays

    Example:

  **Datas:**

    ```
      [
        {
          'site' : {'label':'site_A'},
          'cars' : [
            {
              'name': 'prius',
              'spec': {'weight': 1},
              'wheels':[
                {'brand':'mich'},
                {'brand':'cont'}
              ]
            },
            {
              'name': 'civic',
              'spec': {'weight': 2},
              'wheels':[
                {'brand':'mich'}
              ]
            },
          ],
        },{
          'site' : {'label':'site_B'},
          'cars' : [{
              'name': 'modelS',
              'spec': {'weight': 1},
              'wheels':[
                {'brand':'mich'},
                {'brand':'uni' },
                {'brand':'cont'}
              ]
            }
          ],
        }
      ];
    ```

  **Template:**

| site                | car name               | weight                         | brand                                |
| ------------------- | ---------------------- | ------------------------------ | ------------------------------------ |
| {d[i].site.label}   | d[i].cars[i].name}     | {d[i].cars[i].spec.weight}     | {d[i].cars[i].wheels[i].brand}       |
| {d[i+1].site.label} | d[i+1].cars[i+1].name} | {d[i+1].cars[i+1].spec.weight} | {d[i+1].cars[i+1].wheels[i+1].brand} |


  **Result:**

| site                | car name               | weight                         | brand                                |
| ------------------- | ---------------------- | ------------------------------ | ------------------------------------ |
| site_A              | prius                  | 1                              |  mich                                |
| site_A              | prius                  | 1                              |  cont                                |
| site_A              | civic                  | 2                              |  mich                                |
| site_B              | modelS                 | 1                              |  mich                                |
| site_B              | modelS                 | 1                              |  uni                                 |
| site_B              | modelS                 | 1                              |  cont                                |



  - Warning: cannot use moxie-zip 0.0.4 because this commit (https://github.com/spocke/moxie-zip/commit/cbc6af14dc2318bbcfcfa82ebaf183c525346ae2) creates wrong *.ods files. The empty directory Bitmap is replaced by a executable file.

### v0.10.0

  - Add new conversion options for CSV export

  Now it is possible to pass conversion options to LibreOffice. The attribute `convertTo` can be an object instead of a string:

  ```
    var _options = {
      'convertTo' : {
        'formatName' : 'csv',
        'formatOptions' : {
          'fieldSeparator'    : '+',
          'textDelimiter'     : '"',
          'characterSet'      : '0'
        }
      }
    };
    carbone.render(_filePath, data, _options, function(err, result){
      ...
    });
  ```

  - Add the possibility to pass raw conversion options to LibreOffice. See documentation: https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options

  ```
    var _options = {
      'convertTo' : {
        'formatName' : 'csv',
        'formatOptionsRaw' : '124,34,0'
      }
    };
    carbone.render(_filePath, data, _options, function(err, result){
      ...
    });
  ```

  - Improve LibreOffice detection algorithm for Linux. Now, it supports any version of LibreOffice
  - BUG fix: When two nested arrays were incremented in the same time `{d.tab[i+1].subtab[i+1]}`, it could generate bad XML in certain cases
