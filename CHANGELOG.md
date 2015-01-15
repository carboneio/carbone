# CarboneJS

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

