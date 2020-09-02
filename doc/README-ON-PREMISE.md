
Carbone Render On-Premise CHANGELOG
===================================

### Release September 2nd, 2020

- Update CarboneJS to last official version (v2.1.0 + in-sync with online doc)


Carbone Enterprise-Edition CHANGELOG
====================================

### v2.1.0
  - Release September 1st, 2020
  - Performance: huge gain from x11 to x30 for the compression of reports.
    Now, some huge reports takes 0.1s to render instead of 4s.
    It reduces also the blocking of Node's event loop.
  - New rendering option `hardRefresh`: The content of the report is refreshed at the end of the Carbone process. For example, it can be used to refresh the table of content or update calculations. The option `convertTo` has to be defined.
  - [EE] fix dynamic images in DOCX files that were making the report invalid in Word
  - [EE] fix dynamic images in header & footers of docx templates
  - [EE] Injecting dynamic colors received a lot of improvements and stability:
    - ODT, DOCX, and ODS reports are fully supported. XLSX can't be supported by design for now.
    - Text and background colors in footers and headers are supported for ODT and DOCX templates.
    - Better error management, it throws errors when:
      - bindColor is not correctly formatted
      - 2 bindColor markers try to edit the same color
      - the background color format on DOCX documents is different than "color"
      - the color format does not exist
      - 2 different lists of colors are used to edit the same element

### v2.0.2
  - Release August 10th, 2020
  - Fix locales de-ch and pt-br
  - Fix direct access in a nested array `{d.array[i].nestedArray[i=0].id}`
  - [EE] : fix server exit on "Ctrl+C"

### v2.0.1
  - Release July 8th, 2020
  - Add regression tests
  - [EE] : fix crash when an array was printed directly without formatters `{d.myArray}`

### v2.0.0
  - Release June 28th, 2020
  - 🚀 **Accepts dynamic variables in all formatters!**

    Carbone passes data to formatters if parameters start with a dot `.` and is not surrounded by quotes. Here is an example:

    *Data*
      ```js
        {
          id : 10,
          qtyA : 20,
          subObject : {
            qtyB : 5,
            qtyC : 3
          },
          subArray : [{
            id : 1000,
            qtyE : 3
          }]
        }
      ```

    *Template => Result*

    do mathematical operations:<br>
    `{d.subObject.qtyB:add(.qtyC)}` => 8 (5+3)

    read parent attributes if you use two dots, grandparents if you use three dots, etc...<br>
    `{d.subObject.qtyB:add(.qtyC):add(..qtyA)}` => 28  (5+3+20)

    read parent objects and their children attributes (no limit in depth)<br>
    `{d.subArray[i].qtyE:add(..subObject.qtyC)` => 6 (3+3)

    It returns an error if the attribute does not exist<br>
    `{d.subArray[i].qtyE:add(..badAttr)` => [[C_ERROR]] badAttr not defined

    You cannot access arrays<br>
    `{d.subObject.qtyB:add(..subArray[0].qtyE)}` => [[C_ERROR]] subArray[0] not defined

  - ⚡️ **New conditional formatters, and a new IF-block system to hide/show a part of the document**

    - `ifEQ  (value)` : Matches values that are equal to a specified value, it replaces `ifEqual`
    - `ifNE  (value)` : Matches all values that are not equal to a specified value
    - `ifGT  (value)` : Matches values that are greater than a specified value.
    - `ifGTE (value)` : Matches values that are greater than or equal to a specified value.
    - `ifLT  (value)` : Matches values that are less than a specified value.
    - `ifLTE (value)` : Matches values that are less than or equal to a specified value.
    - `ifIN  (value)` : Matches any of the values specified in an array or string, it replaces `ifContain`
    - `ifNIN (value)` : Matches none of the values specified in an array or string
    - `ifEM  (value)` : Matches empty values, string, arrays or objects, it replaces `ifEmpty`
    - `ifNEM (value)` : Matches not empty values, string, arrays or objects
    - `and   (value)` : AND operator between two consecutive conditional formatters
    - `or    (value)` : (default) OR operator between two consecutive conditional formatters
    - `hideBegin` and `hideEnd` : hide text block between hideBegin and hideEnd if condition is true
    - `showBegin` and `showEnd` : show a text block between showBegin and showEnd if condition is true
    - `show (message)`          : print a message if condition is true
    - `elseShow (message)`      : print a message if condition is false
    - `len()` : returns the length of a string or array.

    No formatters can be chained after `hideBegin`, `hideEnd`, `showBegin`, `showEnd`.

    These new formatters replace the old ones `ifEqual`, `ifEmpty` and `ifContain`. We keep these old formatters
    for backwards compatibility. You should avoid using them in new templates.

    *Data*
      ```js
        {
          id : 10,
          qtyA : 20
        }
      ```
    *Template => Result*

    print simple message according to the result of a condition<br>
    `{d.id:ifEQ(10):show('hey')}` => hey

    print simple message according to the result of multiple conditions, combining with dynamic variables! 🤩<br>
    `{d.id:ifEQ(10):and(.qtyA):ifEQ(20):show('hey'):elseShow('hide')}` => hey

    hide or show a block of text in the document ⚡️<br>
    `{d.id:ifEQ(10):showBegin}` block of text  `{d.id:showEnd}` => block of text<br>
    `{d.id:ifEQ(12):showBegin}`  block of text  `{d.id:showEnd}` =>

    A smart and generic algorithm detects automatically pattern (paragraph, bullet-list, etc) to remove in document even if the conditional block
    is not placed correctly in XML. For example: `BEGIN<p> blabla END</p>` becomes `BEGIN<p> blabla </p>END`.
    It improves the final result by removing empty spaces in document.

  - ☀️ **Accepts to iterate on attributes of objects as is if it was an array**
    ```js
    {
      myObject : {
        paul : '10',
        jack : '20',
        bob  : '30'
      }
    }
    ```

    In the report:
    ```
      {d.myObject[i].att} {d.myObject[i].val}
      {d.myObject[i+1].att} {d.myObject[i+1].val}
    ```
    - use .att to print the attribute
    - use .val to print the value

    You can even access nested objects and nested arrays inside `val`: `{d.myObject[i].val.myArray[i].id}`

  - Fix: avoid crashing when a static image was inserted in a loop in MS Word templates
  - Update totals in ODS and XSLX files
  - `formatC` supports many crypto currencies
  - Fix: Accepts comma in formatter parameters such as `{d.sentenceExist:ifEqual(1, 'Some sentence, some more sentences.')}`
  - Fix: nested array in XML (but not in JSON) was not printed correctly
    ```
      {d.countries[i].name}
        {d.movies[i].subObject.name}
        {d.movies[i+1].subObject.name}
      {d.countries[i+1].name}
    ```
  - Fix: avoid crashing when a sub-object is null or undefined in data
  - Fix: avoid crashing when the parent object of an array is null or undefined in data
  - Eslint code + add eslint tools
  - Fix: accepts dashes characters in JSON data. Before, Carbone crashes when using `{d.my-att-with-dash}`
  - Fix: avoid crashing when a XLSX template contains charts
  - Beta: supports dynamic charts rendering in XLSX if these conditions are met:
    - first, draw a chart in MS Excel and replace your data with Carbone markers
    - datas of the chart should be placed at the top-left corner of the spreadsheet
    - all numbers are formatted with formatN() formatter
  - Fix: accepts white-space in array filters with simple quote and double quotes
    Example: `{d.cars[i, type='Tesla car'].name}`
             `{d.cars[i, type="Tesla car"].name}`

  - Fix LibreOffice detection on Windows
  - Remove compatibility with older NodeJS versions (lower than 10.15.0)
  - Upgrade some dependencies (moment, debug, yauzl) and remove useless ones (should)
  - Accepts non-alphanumeric characters in variables names, values, ... For example, `{d.i💎d}` is allowed
  - Fix many security issues and reduce memory consumption
  - Fix crash when markers are next to each over `{d.id}{d.other}` in many situations:
    - with or without conditional blocks
    - with or without loops
  - Fix crash when some documents like DOCX contain images in repetition section
  - Accept direct access in arrays such as `{d.myArray[2].val}` instead of `{d.myArray[i=2].val}`
  - Fix crash when two consecutive arrays, nested in object, were used
  - Remove useless soft-page-break in ODT documents as suggested by the OpenDocument specification
  - LibreOffice 6+ has a memory leak. So Carbone automatically restarts LibreOffice after a certain amount of document conversion.
    The number of conversions depends on new parameters `factoryMemoryFileSize` and `factoryMemoryThreshold`
  - Add conversion timeout parameter `converterFactoryTimeout` (60s by default).
    It kills LibreOffice if the conversion is too long and returns an error
  - Remove deprecated NodeJS "new Buffer"
  - Fix: avoid crashing if a object/array is null or undefined. Print empty text instead.
  - Fix: variables, which begin by the same characters, were not detected correctly since NodeJS 11
  - [EE] Image processing completely rewritten
  - [EE] Dynamic images improvements: it is possible to insert images into `ODT`, `ODS`, `XLSX` and `DOCX` by passing a public URL or a Data URLs. For the 2 solutions, you have to insert a temporary picture in your template and write the marker as an alternative text. Finally, during rendering, Carbone replaces the temporary picture by the correct picture provided by the marker.

    The place to insert the marker on the temporary picture may change depends on the file format:

      - ODS file: set the marker on the image title
      - ODT file: set the marker on the image alternative text
      - DOCX file: set the marker either on the image title, image description, or alternative text
      - XLSX file: set the marker either on the image title, image description, or alternative text

    The accepted images type are: `png`, `jpeg`/`jpg`, `gif`, `svg`

    If an error occurs for some reason (fetch failed, image type not supported), a replacement image is used with the message "invalid image".
  - [EE] dynamic images: new formatter `:imageFit()` only available for `DOCX` and `ODT` files. It sets how the image should be resized to fit its container. An argument has to be passed to the formatter: `contain` or `fill`. If the formatter is not defined, the image is resized as `contain` by default.
    - `contain`: The replaced image is scaled to maintain its aspect ratio while fitting within the element’s content-box (the temporary image).
    - `fill`: The replaced image is sized to fill the element’s content-box (the temporary image). The entire image will fill the box of the previous image. If the object's aspect ratio does not match the aspect ratio of its box, then the object will be stretched to fit.

    example: `{d.myImage:imageFit(contain)}` or `{d.myImage:imageFit(fill)}`

  - [EE] Added Libreoffice export filters for PDF rendering. To apply filters to a PDF, it is possible to assign an object to `convertTo` with `formatName:'pdf'` and  `formatOptions` an object with the specified filters. The filter list is available on the documentation. Here is an example of a PDF with a password and a watermark:
    ```js
      options = {
        convertTo: {
          formatName: 'pdf',
          formatOptions: {
            EncryptFile          : true,
            DocumentOpenPassword : 'QWERTY1234',
            Watermark            : 'Watermark Carbone'
          }
        }
      }
    ```
