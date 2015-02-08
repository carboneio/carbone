# CarboneJS

### v0.10.1
  
  - Do not restart LibreOffice if the document is corrupted (restart it only after 10 consecutive attemps)
  - Return an error when the document cannot be converted
  - Improve stability in general
  - socket.js has been updated. It manages TLS communications
  - Fix bugs in tests
  - Compatible with Node v0.12
  - Update zipfile dependency
  
  Warning: Cannot use moxie-zip 0.0.4 because this commit (https://github.com/spocke/moxie-zip/commit/cbc6af14dc2318bbcfcfa82ebaf183c525346ae2) creates wrong *.ods files. The empty directory Bitmap is replaced by a executable file.

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

