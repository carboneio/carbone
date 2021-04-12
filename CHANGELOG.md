### v3.2.0
  - Release April 13th 2021
  - [EE] Fix dynamic image resize when using the `:imageFit` formatter with the `contain` property.
  - [EE] Add the option `:imageFit(fillWidth)` to fill the full width of the template image while keeping aspect ratio of the inserted image.
      Before fixing the bug with `contain` property, it was more or less the default behaviour of Carbone before this version.
      So, `fillWidth` becomes the default option to avoid changing the style of existing reports.
  - [EE] Improve performance to download images. Building a report with a lot of dynamic images is almost 5 times faster than before.
  - [EE] When the dynamic image cannot be inserted (fetch failed, image type not supported), 
    - the aspect ratio of the replacement image keep the aspect ratio of the template
    - this replacement image more beautiful (vectorial) and does not contain any text for internationalisation
  - [EE] Fix corrupted XLSX files when inserting new type of image which were not previously present

### v3.1.7
  - Release April 12th 2021
  - [EE] Fix Dynamic HTML: paragraph and break lines inside nested lists or anchor tags were creating corrupted DOCX/ODT documents.

### v3.1.6
  - Release April 12th 2021
  - [EE] New formatter `:defaultURL()`: if a **dynamic hyperlink** or a **HTML anchor tag** is injected into a report and the URL verification fails, the formatter is used to replace the default error URL. Example to use it with and HTML formatter: `{d.content:defaultURL(https:url.of.your.choice):html}`. The `:defaultURL` should be placed before the `:html` formatter.
  - [EE] Fix: return 404 error when the template does not exist on rendering

### v3.1.5
  - Release April 8th 2021
  - [EE] Fix hyperlinks verification which could lead to crash.

### v3.1.4
  - Release April 1st 2021
  - [EE] Improve `:html` formatter stability when using special characters such as "'<>& for ODT and DOCX reports.

### v3.1.3
  - Release March 29th 2021
  - Fix: Do not break documents if the `i+1` row contains some markers coming from parent object or condition blocks (rare)
  - [EE] if a font family and font size is applied to an HTML formatter `{d.content:html}`, the font & size will be applied to the whole rendered HTML
  - [EE] return an error message when image anchor is not correct in the template

### v3.1.2
  - Release March 4rd 2021
  - Fix: v3.1.0 introduced a backward compatibility issue with reports made with v1/v2. Now, filter with boolean works like this (same behavior as numbers)
    - data                       => template                       => condition result in array
    - `data.myBoolean = true`    => `d.array[i, myBoolean=true]`   => true
    - `data.myBoolean = "true"`  => `d.array[i, myBoolean=true]`   => true
    - `data.myBoolean = "false"` => `d.array[i, myBoolean=true]`   => false
    - `data.myBoolean = false`   => `d.array[i, myBoolean=true]`   => false
    - `data.myBoolean = "true"`  => `d.array[i, myBoolean='true']` => true
    - `data.myBoolean = true`    => `d.array[i, myBoolean='true']` => false


### v3.1.1
  - Release March 4rd 2021
  - [EE] Fix: remove html entities not supported by XML format when using `:html` formatter

### v3.1.0
  - Release March 3rd 2021
  - Accepts boolean in array filters `d.array[i, myBoolean=true]`
  - [EE] Improve hyperlinks validation
  - [EE] Improved HTML conversion with formatter `:html` for DOCX / ODT templates:
    - Support `ol`, `ul`, `p`, `ul`, `ol`, `li` and `a` tags
    - Fixed spacing management between list / paragraph / multi elements.
    - All HTML entities are supported (Full List: https://www.w3schools.com/charsets/ref_html_entities_4.asp)
    - Improved break-lines support
    - Fixed hyperlinks when exporting DOCX to PDF
    - Possible to include hyperlinks, break-lines, and style tags into any level of lists
    - Improved overall stability

### v3.0.4
  - [EE] Restore old `convert` formatter for some clients

### v3.0.3
  - [EE] Fix: add the "https://" protocol if it is missing for dynamic hyperlinks

### v3.0.2
  - [EE] Fix: accepts hyperlinks with "&", add the "https://" protocol if it missing, add URL validation. If the URL is invalid, it is replaced by a valid URL refering to the carbone documentation.
  - [EE] Fix: do not crash if hyperlink is undefined
  - [EE] Fix: support random way of managing hyperlinks in MS Word
  - [EE] Fix: set Content-Type when downloading the report

### v3.0.1
  - Fix: aliases beginning with same prefix names are properly rendered in the generated reports instead of not being skip.
  - [EE] Accepts a new local filename in the On-Premise  plugin `writeTemplate(err, newFilename)`
  - [EE] Fix: license detection in Docker
  - [EE] Fix dynamic hyperlinks for DOCX reports
  - Improve documentation

### v3.0.0
  - 👋🏻 NOTE: This version contains breaking changes of undocumented features.
    So if you use only documented features so far, you should not be concerned by these breaking changes.
  - ⚡️ **Manage timezone + new date formatters + switch from MomentJS to DayJS**
    - If not defined by you in `options.complement`, `{c.now}` returns the current date in UTC.
    - [BREAKING CHANGE]: remove old date formatter which were not documented: `format`, `parse`, `addDays` and `convert`.
      You should use `formatD` instead and new formatters below. They were very old formatters, the chance you use them is low because you had to
      look into the source code to know their existence.
    - New formatters:
      - `addD(amount, unit [, patternIn])`     : add days, month to a date. `formatD` can be used after without specifying  patternIn
      - `subD(amount, unit [, patternIn])`     : subtract days, month to a date. `formatD` can be used after without specifying  patternIn
      - `startOfD(amount, unit [, patternIn])` : Set a date to the start of a unit of time. `formatD` can be used after without specifying  patternIn
      - `endOfD(amount, unit [, patternIn])`   : Set a date to the end of a unit of time. `formatD` can be used after without specifying  patternIn
    - [BREAKING CHANGE]: We try to stay as close as possible as the previous parsing algorithm.
      But `1997-12-17 07:37:16-08` is not accepted anymore without specifying an input pattern or writing `1997-12-17 07:37:16-08:00`
    - Accept a new options to set the `timezone` of `formatD`. Examples:

      *Data*
      ```js
        {
          date     : '2020-11-28T21:54:00.000Z',  // ISO 8601 UTC
          dateWTZ  : '2020-11-28T21:54:00',       // without timezone
          dateTZ   : '2020-11-28T21:54:00-04:00', // with America/New_York timezone offset
          dateUnix : 1606600440                   // UNIX timestamp in seconds UTC of 2020-11-28T21:54:00.000Z
        }
      ```

      *Template => Result*

      if `options.timezone = 'Europe/Paris'` (default)
        - `{d.date:formatD(LLLL)}`        => `Saturday, November 28, 2020 10:54 PM`
        - `{d.dateWTZ:formatD(LLLL)}`     => `Saturday, November 28, 2020 9:54 PM`
        - `{d.dateTZ:formatD(LLLL)}`      => `Sunday  , November 29, 2020 2:54 AM`
        - `{d.dateUnix:formatD(LLLL, X)}` => `Saturday, November 28, 2020 10:54 PM`

      if `options.timezone = 'America/New_York'`
        - `{d.date:formatD(LLLL)}`        => `Saturday, November 28, 2020 4:54 PM`
        - `{d.dateWTZ:formatD(LLLL)}`     => `Saturday, November 28, 2020 3:54 PM`
        - `{d.dateTZ:formatD(LLLL)}`      => `Saturday, November 28, 2020 8:54 PM`
        - `{d.dateUnix:formatD(LLLL, X)}` => `Saturday, November 28, 2020 4:54 PM`

      List of timezone:  https://en.wikipedia.org/wiki/List_of_tz_database_time_zones


  - Fix: if a path does not exist inside a formatter argument, it returns an empty string instead of the error "[[C_ERROR]] attribute_name not defined".
    It fixes some weird behaviour with ifEM formatters
  - [EE] Feature: cells colors on ODT/DOCX report can be changed dynamically with the "bindColor" marker.
  - [EE] ODT Improvement: the "bindColor" marker will not remove other styles than colors.
  - Accepts to convert the first page of docx or odt templates into a JPEG file with `converTo : 'jpg'`
  - Improve HTML type detection. Accepts html5 without doctype.
  - [EE] Fix Carbone marker inside ODT text box
  - Adding `padl` and `padr` string formatter.
  - Fix doc issue on carbone website
  - Accepts Adobe Indesign IDML file as a template
  - [EE] Dynamic hyperlinks: it is possible to insert hyperlinks into elements (text, image, list, tables, ...). Right click an element, select "hyperlinks", insert the marker and validate. It is working with ODS, ODT, and DOCX reports. The compatibility is limited for XLSX documents: It is not possible to create a list of hyperlinks and the marker should not be written with curly braces, example: a typical `{d.url}` should be only `d.url`. If `http://` appears before `d.url`, it is also valid.
  - Improve the parsing processing by moving the function "removeXMLInsideMarkers" before the building stage.
  - Support officially to embed translations markers inside other markers: `{d.id:ifEq(2):show(  {t(Tuesday)} ) }`
  - Performance: reduce disk IO when converting document
  - Performance: deactivate image compression by default to speed up PDF conversion
  - [BREAKING CHANGE]: remove the possibility to use `convertTo.formatOptionsRaw` for CSV export. This feature was not documented
    and can lead to security issues. Use `convertTo.formatOptions` instead.
  - new paramater in `Carbone.set`
     - `renderPath`   : `Carbone.set` can changes the default path where rendered files are temporary saved.
                        By default, it creates the directory `carbone_render` in Operating System temp directory.
                        It creates the path automatically
  - new paramater in `Carbone.render`
     - `renderPrefix` : If defined in `options` object. `Carbone.render` returns a file path instead of a buffer, and it adds this prefix in the rendered filename
                        The generated filename contains three parts:
                          - the prefix
                          - a secure Pseudo-Random part of 22 characters
                          - the report name, encoded in specific base64 to generate safe POSIX compatible filename on disk
                        `/renderpath/<prefix><22-random-chars><encodedReportName.extension>`
                        This filename can be decoded with the function `Carbone.decodeOuputFilename(pathOrFilename)`.
                        It is the user responsability to delete the file or not.
  - New function `decodeOuputFilename()`: when `renderPrefix` is used, the returned filename can be parsed with this function.
                        It decodes filename an returns an object with two parameters
                        ```js
                        {
                          extension  : 'pdf',                // output file extension
                          reportName : 'decoded report name' // reportName
                        }
                        ```
  - [BREAKING CHANGE]: `Carbone.convert` function signature has changed. Now, it accepts the same `options` as Carbone.renders:
    You must use `Carbone.convert(fileBuffer, options, callback)` instead of `Carbone.convert(fileBuffer, convertTo, options, callback)`

  - [EE] Returns errors when Carbone cannot dynamically replaces images (ex. images with absolute positions) instead of generating a bad report
  - [EE] Fix some PDF options. Integer values were not taken into account.
  - [EE] Add the possibilty to generate JPG or PNG of the first page of a document
    Available options for `jpg/png`:
    ```js
        convertTo : {
          formatName    : 'jpg', // or png
          formatOptions : {
            Quality     : 90,  // [JPG ONLY] From 1 (low quality, high compression, low size) to 100 (high quality, low compression, high size
            PixelWidth  : 100, // Image width as pixels
            PixelHeight : 100, // Image height as pixels
            Compression : 90,  // [PNG ONLY] From 0 (compression disabled) to 9 (high compression, low size)
            Interlaced  : 0,   // [PNG ONLY] 0 not interlaced, 1 enterlaced (higher size)
            ColorMode   : 0    // 0 Colors, 1 Greyscale
          }
        }
    ```
  - 🎁 [EE] DOCX/ODT New feature: Support HTML rich content, by adding the `:html` formatter, it is possible to render the following HTML tag:
    `<br>`/`<b>`/`<strong>`/`<i>`/`<em>`/`<u>`/`<s>`/`<del>`.
    Unsupported tags and tags attributes are skipped and not rendered.
    HTML entities are accepted.
  - [EE] New feature: Dynamic pictures are supported on ODG and ODP files. It is not possible to create loops.
  - [EE] New Carbone Render On-Premise
    - Carbone can be safely deployed on your own servers. Contact us for further information

### v2.1.1
  - Release September 23rd 2020
  - Fixes `arrayJoin(\n):convCRLF`. Now it works in carbone v2.x.x like in v1.x.x.
  - Removes 'zipfile' dev dependency. Tests use unzip from the system instead.
  - 8.1.3 mocha upgrade
  - [EE] Fixes crash when images field in data contain an object instead of a string

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


### v1.2.1
  - Release June 11, 2019
  - Fix `arrayMap()` if used with an array of strings or integer

### v1.2.0
  - Release March 13, 2019
  - Add new formatters
    - `convCurr(targetCurrency, sourceCurrency)` to convert from one currency to another
    - `formatN()` format number according to the locale (lang). Examples:
      - old `toFixed(2):toFR` can be replaced by `formatN(2)`
    - `formatC()` format currency according to the locale and the currency
      - old `toFixed(2)} {t(currency)}` can be replaced by `formatC(2)`
    - `formatD()` format date according to the locale. Same as `convDate`, but consider parameters are swapped
      for consistency with formatN. Moreover, `patternIn` is ISO8601 by default.
    - `convDate()` is deprecated
    - `add(valueToAdd)`, `mul(valueToMultiply)`, `sub(valueToSubstract)`,`div(value)` : mathematical operations
    - `substr(start, end)` : slice strings
  - `carbone.set` and `carbone.render` have new options
    - `currencySource` : default currency of source data. Ex 'EUR'
    - `currencyTarget` : default target currency when the formatter `convCurr` is used without target
    - `currencyRates`  : rates, based on EUR { EUR : 1, USD : 1.14 }
  - Fix memory leaks: one file descriptor remains opened
  - Fix crash when template is not correct
  - Now `option.lang` must use the i18n format 'fr-fr' instead of just 'fr'
  - Add fallback to basic sorting when timsort crashes
  - Bump debug and moment to fix vulnerabilities
  - Remove Support of NodeJS 4

### v1.1.1
  - Release October 11, 2018
  - Better Windows support by improving path detection for `soffice` and `python` across all operating platforms. Done by Robert Kawecki (@rkaw92).

### v1.1.0
  - Release February 26, 2018
  - Fix: should find markers even if there is a opening bracket `{` before the markers
  - Fix: accept to nest arrays in XML whereas these arrays are not nested in JSON
  - Fix: markers were not parsed if formatters were used directly on `d` or `c` like this `{d:ifEmpty('yeah')}` ...
  - Fix: keep the first element of the array if the custom iterator is constant
  - Fix a lot of strange bugs when using a filter without iterators in arrays (ex. `{d.cities[i=0].temperature}`)
  - Optimization: gain x10 when sorting 1 Million of rows
  - Add formatter `unaccent` to remove accent from string
  - `carbone.set` does not overwrite user-defined translations
  - Accepts iteration on non-XML. Example: `{d[i].brand} , {d[i+1].brand}`
  - Add new formatters
    - `unaccent()` to remove accent from string
    - `count()` to print a counter in loops. Usage: `{d[i].name:count()}`
    - `convCRLF()` to convert text, which contains `\r\n` or `\n`, into "real" carriage return in odt or docx document
  - Formatters which have the property `canInjectXML = true` can inject XML in documents
  - Return an error in render callback when LibreOffice is not detected
  - Get the last object of an array using negative values when filtering with `i` iterator
    - `{d.cities[i=-1].temperature}` shows the temperature (if the array is not empty) of the last city
    - `{d.cities[i=-2].temperature}` shows the temperature of the city before the last
    - ...


### V1.0.1
  - Release October 13, 2017
  - Automatically remove XML-incompatible control codes (U+0000 to U+0008 and U+000B to U+000C and U+000E to U+001F) before inserting data in templates
  - Fix: ifEqual did not work correctly with boolean values

### V1.0.0
  - Release June 7, 2017 - First Public Release, First Public Demo on the [Web2day](https://web2day.co) event!
  - It loads all lang at startup, and it is able to change the lang at runtime
  - Avoid unnecessary synchronous code in `carbone.set`
  - Improve documentation
  - Default template path is working directory by default
  - Return the list of supported format when an unknown `options.convertTo` is used
  - Accept more input type
  - Remove deprecated formatters
  - `carbone.set` takes into account changes on `factories` and `startFactory` parameters
  - Fix: a report without markers, except lang ones, is translated
  - Fix: avoid creating LibreOffice zombies when node crashes
  - Fix: avoid using LibreOffice if `options.convertTo` equals input file extension
  - Fix: improve markers detection to avoid removing some XML variable like `{DSDSD-232D}` used in DOCX
  - Fix: now compatible with node v4.5.0+, v6+, v8+

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
