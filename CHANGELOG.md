### v4.12.0
  - Release June 28th 2023
  - [EE] Carbone On-Premise: add parameter `maxTemplateSize` (bytes) to change default limit (20MB)
  - [EE] Fix `GET /template`: If the template doesn't exist, the statusCode `404` is returned instead of `400`.
  - [EE] Fix `POST /template`: If the template is too large, the statusCode `413` is returned instead of `400`
  - Add new fomatters:
    - `ellipsis(maxLength)`: add three dots `...` if the text is longer than `maxLength`
    - `substr(begin, end, wordMode)`: add a third option to cut the text without cutting a word if wordMode = true (false by default)
    - `abs()`: get the absolute value of a number
    - `replace(oldText, newText)`: replace a text by another
    - `split(delimiter)`: split a text using a delimiter and generate an array
    - `prepend(text)`: add a prefix
    - `append(text)`: add a suffix
    - `arrayJoin(separator, index, count)`: add two options to cut the array and select only a part of it

### v4.11.2
  - Release June 14th 2023
  - [EE] On-Premise: New option to enable more security controls, following ANSSI (France) and BSI (Germany) recommendations. Contact us for more information.
  - [EE] All APIs returns `400 Bad request` instead of `404 Not Found` when `idTemplate` is not valid

### v4.11.1
  - Release June 2nd 2023
  - Accept image from dropbox with mime type `application/binary` and image extension in capital letters

### v4.11.0
  - Release June 1st 2023
  - Support `drop` formatter in headers and footers of DOCX and ODT documents.
  - `:drop(h)` can be used to delete heading elements for ODT templates only. On LibreOffice, it relates to heading style 1, 2, 3, 4 and custom styles.
    For DOCX templates, `:drop(p)` must be used to delete heading elements.
  - Fix: using `:html` or `:drop` with an empty value inside a table cell no longer creates a corrupted document with DOCX templates.
  - Fix: sometimes `drop` formatter was not found and not executed by Carbone
  - Fix HTML formatter: The style of `<ul>` or `<ol>` lists are now correctly rendered into DOCX documents.
  - Fix a random dynamic chart issue with some DOCX templates
  - Fix chart distortion issue when converting DOCX to PDF if the document contains more than 20 charts
  - Fix hyperlink error when the value is not a string

### v4.10.6
  - Release May 12th 2023
  - [EE] Fix: accepts whitespace in image URL like before v4.10.2 even if it is not recommended

### v4.10.5
  - Release May 8th 2023
  - [EE] set default webhook timeout to 16 seconds (it was 3s since 4.10.0)

### v4.10.4
  - Release May 4th 2023
  - [EE] Egress traffic: When a request retry is attempted, do not use the egress proxy again if the primary egress proxy is configured and the secondary egress proxy is undefined

### v4.10.3
  - Release May 3rd 2023
  - [EE] Improve automatic HTTP request retry of images with the last version of [rock-req](https://github.com/carboneio/rock-req)

### v4.10.2
  - Release May 3rd 2023
  - [EE] Fix `options.isDebugActive = true`: do not return internal (not visible by user) tags
  - [EE] Fix crash when dynamic image URL contains forbidden characters
  - [EE] Fix crash when the socket is broken while the stream is still in progress for `GET /template/:templateId` and `GET /render/:reportId`
  - [EE] Fix `HEAD /render/:renderId`: The request don't delete the generated document anymore.
  - [EE] Fix `GET /template/:templateId`: If the template doesn't exist, the statusCode `404` is returned instead of `400`.

### v4.10.1
  - Release April 17th 2023
  - [EE] Disable egress proxy by default

### v4.10.0
  - Release April 17th 2023
  - [EE] Support vector barcodes with the new `svg` option to improve print quality: `{d.number:barcode(qrcode, svg:true)}`

### v4.9.2
  - Release April 14th 2023
  - [EE] Fix dynamic hyperlinks when `d` is an array for DOCX templates

### v4.9.1
  - Release April 12th 2023
  - [EE] with XLSX/ODS templates: `formatN` converts values to native Excel number even if `d` is an array. `formatN` without parenthesis is also accepted.
  - [EE] On-Premise: Add new options to use a proxy for egress traffic
  - Fix dynamic hyperlinks error URL and add slash to URLs

### v4.9.0
  - Release March 3rd 2023
  - Accept absolute path which starts by `d.` or `c.` without quotes in formatters like this : `{d.id:print(d.other)}` or `{d.id:print(c.other[0].test)}`
  - [EE] Force download of the rendered report when the query parameter `?download=true` is set
  - [EE] Increase request timeout from 5 to 6 seconds to download images from URLs
  - Accept loops on array of arrays (unlimited number of nested array) like this:
    ```
      {d.myArray[i][i].val}
      {d.myArray[i][i+1].val}
      {d.myArray[i+1].val}
    ```
  - Support aggregators on array of numbers. For example:`{d.table[]:aggSum}` = 63  if `table` contains `[10, 20, 33]`. Known limitation: Array filters on array of strings/numbers are still not supported.
  - ⚡️ Support loops on array of string/numbers. Example:

    Data:
    ```json
      {
        "myArray" : ["yellow", 125, "blue"],
      }
    ```
    Template:
    ```
      Direct access: {d.myArray[0]:upperCase()}
      Loop:
        - {d.myArray[i]}
        - {d.myArray[i+1]}
    ```
    Result:
    ```
      Direct access: YELLOW
      Loop:
        - yellow
        - 125
        - blue
    ```

    To maintain backward compatibility with existing templates, if the template contains at least one attribute access
    on `myArray` (Example: `{d.myArray[i].subObjectAttribue}`), Carbone considers `myArray` is an array of objects
    and it disables this feature. In this case, `{d.myArray[i]}` prints nothing and is neutral for array filters even if
    the array contains a printable type like a string or a number, as it was before v4.9.0.

    Data:
    ```json
      {
        "otherArray" : [
          {"id" : 10},
          {"id" : 20},
          125,
          "blue"
        ]
      }
    ```

    Template:
    ```
      Without filters:
        - {d.myArray[i]} {d.myArray[i].id}
        - {d.myArray[i+1]}
      With filters:
        - {d.myArray[i]} {d.myArray[i, id>9].id}
        - {d.myArray[i+1]}
    ```
    Result:
    ```
      Without filters:
        -  10
        -  20
        -
        -
      With filters:
        -  10
        -  20
    ```

    Known limitation: Array filters on array of strings/numbers are still not supported.

  - [EE] Includes a part of the new v5 engine that supports more use cases in some complex templates. This v5 engine is only enabled
    if the template contains the tag `{o.preReleaseFeatureIn=4009000}`. This tag means: "enable all pre-release features added up to v4.9.0".
    Please only use this tag if we tell you to use it on our live chat.

### v4.8.3
  - Release February 15th 2023
  - [EE] Experimental: increase the limit to 400 repetitions maximum when using the repetition feature `{d[i+1*qty]`

### v4.8.2
  - Release February 7rd 2023
  - Fix dynamic image injection in some XLSX files

### v4.8.1
  - Release February 3rd 2023
  - Fix regular hyperlinks in DOCX (bug introduced by v4.6.3)

### v4.8.0
  - Release February 1st 2023
  - [EE] BREAKING CHANGE in Carbone On-Premise plugins: the callback of `getPublicKey` must take two arguments `(err, publicKeys)`.
    If the first argument contains an error, the bad token is kept in quarantine area for 60s instead of infinitely.
  - [EE] Update Echarts to 5.4.1, dayjs to 1.11.7
  - Fix horizontal loops in DOCX tables
  - Ignore `hardRefresh : true` if the output file type is the same as the template type, and the file type is unknown by LibreOffice (example: XML to XML)
  - Fix: The parameter of a formatter should not be considered as a dynamic variable if it starts with a dot and is surrounded by quotes as in v3.x

### v4.7.0
  - Release January 26th 2023
  - Improve error message when there is a missing [show|hide]Begin/End
  - Fix: Accept PDF password with integers
  - [EE] Support Bubble charts in Docx templates

### v4.6.8
  - Release December 7th 2022
  - Fix array filters when the same filter is used with different operators in multiple tags. Ex `{d[type=ok].id} {d[type!=ok].id}`

### v4.6.7
  - Release December 5th 2022
  - Fix regression of v4.6.6 when multiple loops are used on the same table.

### v4.6.6
  - Release November 30th 2022
  - Fix bugs when using two Carbone tags which are using similar paths in some complex situation (d > obj > arr > obj > [arr|obj] > att). Very hard to explain here!
  - Increase max downloaded image in parallel from 5 to 15.

### v4.6.5
  - Release November 25th 2022
  - Accept parentheses in formatters between single quotes

### v4.6.4
  - Release November 17th 2022
  - Fix aspect ratio of images if the same image is used twice in a second section of a document

### v4.6.3
  - Release November 10th 2022
  - Full support of table of content and bookmarks (internal hyperlinks) in DOCX templates

### v4.6.2
  - Release November 4th 2022
  - Fix: Encode HTML special characters when generating SVG with Echarts

### v4.6.1
  - Release October 28th 2022
  - Fixed `:drop(row, nbrToDrop)` for DOCX documents: bookmarked table rows can be deleted.
  - negative numbers can by used when filtering with the iterator `i`
    - `{d.arr[i, i<-2].id}  {d.arr[i+1, i<-2].id}` print all elements except the last 2 items
    - `{d.arr[i, i<-1].id}  {d.arr[i+1, i<-1].id}` print all elements except the last item

### v4.6.0
  - Release October 18th 2022
  - Added the option `table` for the `:drop(element)` formatter to delete table conditionally. Available for DOCX, ODT and ODP templates. Usage: `{d.value:ifEM:drop(table)}`. The tag must be located within a table cell.
  - ⚡️ Added for **PPTX** templates:
    - Dynamic images are supported. Set the Carbone tag into the image alternative text. It is not possible to create a loop of images.
    - All barcodes are supported. Set the Carbone tag into the image alternative text and chain the `:barcode(type)`, such as creating a QR Code: `{d.productCode:barcode(qrcode)}`.
  - Add user-agent `Carbone` when webhook is called. Print HTTP status webhook response in logs.
  - Added types for the `ifTE(type)` formatter: `boolean`, `binary`, `array`, `object`, `number`, `integer`.  Usage: `{d.value:ifTE(number):show('It is a number!')}`, the conditional formatter checks if the type of the value is a number.

### v4.5.2
  - Release October 9th 2022
  - ⭐️ Add the possibility to store values in data with new formatter `:set(d.value)`. Known limits:
    - accepts only to store values at the root level of `d`, and only in `d`.
    - cannot be used in aliases
  - Fix aggregators `aggSum`, `aggAvg`, `aggMin`, `aggMax`, `aggCount` when used with filters (without iterators) like `{d.cars[id=1].wheels[size=100].makers[].qty:aggSum}`
  - New Formatters `mod()` to compute modulo
      - Example: `{d.val:mod(2)}` returns 0 if `d.val` = 4

### v4.5.1
  - Release October 7th 2022
  - Added for the `:drop(element)` formatter:
    - ODP templates are supported
    - A new argument `slide` is available for ODP template only to delete slides. Usage: `{d.value:ifEM:drop(slide)}`.
    - `drop(p, nbrParagraphs)` accepts a second parameter `nbrParagraphs` to delete multiple paragraphs at once. For instance `{d.data:ifEM:drop(p, 3)}`, meaning
      the current and next two paragraph will be removed if the condition is validated. By default, the formatter `:drop(p)` hides only the current paragraph.
  - aggregators (`aggSum`, `aggAvg`, ...) convert string to floats. `null` or `undefined` values are converted to
    - aggSum : 0
    - aggMin : +infinity
    - aggMax : -infinity
    - aggAvg : 0

### v4.5.0
  - Release October 5th 2022
  - Dynamic parameters passed in formatters with a dot `.` accepts dynamic array access between brackets `[.i]`:
    It can be used to select the corresponding element of another array: `{d.myArray[i]:myFormatter(..otherParentArray[.i].id)}`.
    `[.i]` matches with the index of `myArray[i]`. Multiple dots (`[..i]`, `[...i]`) can be used to access other parents arrays.
    If the index goes above `otherParentArray` length, it will return an empty string
  - Fix: HTML comment tags are not rendered and skipped by `:html` formatter
  - Fix: barcodes accepts integer values
  - On-Premise:
    - Improve logs messages for webhooks
  - Performance: huge gain from x10 to x20 when Carbone builds the final result of the report before the conversion

### v4.4.1
  - Release September 26st 2022
  - On-Premise:
    - add options `xlsmEnabled` to accept export to `xlsm` format (false by default)

### v4.4.0
  - Release September 21st 2022
  - Add new formatter `ifTE(string)` to test if a value is a string. Only "string" is supported for now.
  - Fix: In docx templates, array filters could be ignored when the loop includes images (bug introduced in v4.1.0 to fix broken docx)
  - On-Premise version:
    - Improve error message of HTTP API /template /render
    - Support execution of on Windows (beta)
  - New: Compute the difference between two dates with formatter: `d.fromDate:diffD(toDate, unit, patternFrom, patternTo)`.
    - `fromDate` and `toDate` can be ISO 8601 format or any format defined with `patternFrom` and `patternTo`
    - `unit` can be `millisecond(s)` or `ms`, `second(s)` or `s`, `minute(s)` or `m`,
      `hour(s)` or `h`,`year(s)` or `y`, `month(s)` or `M`, `week(s)` or `w`, `day(s)` or `d`, `quarter(s)` or `Q`.
    Here are examples with `d.fromDate = 20101001`:
    - `{d.fromDate:diffD(20101201, days)}`  => `61`
    - `{d.fromDate:diffD(20101201, hours)}`  => `1465`
  - Fix: `formatD` ignores the timezone if only a date is parsed without the time (without hour, minute, second).
    Example: when the timezone is `america/guayaquil` in `options.timezone`
    -  `'2010-12-01':formatD(LL)`           returns `December 1, 2010`. Before this version Carbone returned `November 30, 2010`
    -  `'2010-12-01T01:00:00Z':formatD(LL)` returns `November 30, 2010 8:00 PM`

### v4.3.0
  - Release September 12st 2022
  - `hide` formatter becomes `drop` to avoid confusion with `hideBegin/hideEnd/show`. `hide` was introduced in 4.2 and is still not offically documented.
  - `drop(row, nbrRows)` accepts a second parameter to select the number of row to remove
  - `drop` formatter can't be used into Carbone aliases.

### v4.2.0
  - Release September 8st 2022
  - Fixed parsing of Carbone tags when empty string are used between two single quotes.
    Ex. `{d.text:print(''):print('HIGK LMN')}` prints `HIGK LMN` instead of `HIGKLMN`
  - Improved error messages if a square bracket is used in array accessor `[...]`
  - Added: Accepts dynamic parameters in array filters, with infinite path depth. Example:
    *Data*
      ```js
        {
          parent : {
            qty : 5,
            arr : [{
              id : 1
            }]
          },
          subArray : [{
            text : 1000,
            sub : {
              b : {
                c : 1
              }
            }
          }]
        }
      ```
    - `{d.subArray[.sub.b.c = 1].text}`: filter using infinite object path depth. Alternative syntax without a dot is also accepted (`{d.subArray[sub.b.c = 1]}`) for backward compatibility
    - `{d.subArray[i = .sub.b.c].text}`: filter using dynamic values on the right operand
    - `{d.subArray[i = ..parent.qty].text}`: filter using dynamic values from parent objects on the right operand
    - `{d.subArray[.sub.b.c = ..parent.qty].text}`: filter using complex path for the left and right operand in the same time
    This feature is really powerful but some syntax are not supported yet:
    - `{d.subArray[i = .i].text}`: using `.i` to join two arrays is not supported
    - `{d.subArray[i = ..parent.arr[0].id].text}`: accessing a specific array element is not supported
    - `{d.subArray[i = ..parent.arr[.i].id]text}`: accessing a specific array element according to the current iterator is not supported
  - [EE] Added `hide` conditional formatter for DOCX/ODT/PDF to hide document elements: **images**, **paragraphs**, table **rows**, **shapes** and **charts**. The rendering is always accurate and simpler to use compared to `hideBegin/hideEnd` or `showBegin/showEnd`. The first argument passed to `:hide(argument1)` is the element to hide, it can be:
    - `p` to hide paragraphs, usage: `{d.text:ifEM:hide(p)}`. The tag must be inside a paragraph. Every elements inside the paragraph are also removed if the condition is validated.
    - `row` to hide a table row, usage: `{d.data:ifEM:hide(row)}`. The tag must be inside a table row. Every element inside the row are also removed if the condition is validated.
      - Option `nbrRowsToHide`: Set the number of rows to hide as a second argument `{d.data:ifEM:hide(row, nbrRowsToHide)}`, such as: `{d.data:ifEM:hide(row, 3)}`, meaning the current and next two rows will be removed if the condition is validated. By default, the formatter `:hide(row)` hides only the current row.
    - `img` to hide pictures, usage: `{d.img:ifEM:hide(img)}`. The tag must be included within the image' title, description or alternative text.
    - `chart` to hide charts, usage: `{d.dataset:ifEM:hide(chart)}`. The tag must be included within the chart' alternative text.
    - `shape` to hide shape (square, circle, arrows, etc...), usage: `{d.dataset:ifEM:hide(shape)}`. The tag must be included within the shape' title, description or alternative text.
  - [EE] Improved: ODS templates support loops of dynamic images. Setting the image anchor "To cell" is required.

### v4.1.0
  - Release August 22st 2022
  - [EE] New: `convCRLF` prints `\\n` and `\\r\\n` as new lines in ODS template instead of strings
  - [EE] New: On-Premise Embedded Studio features:
    - Drag and drop a JSON file and the studio automatically updates current left panel (data, complement, enum or translation)
    - Drag and drop a template file and the studio automatically uploads the template and updates the preview
    - Add HTML export
  - New: interval/duration formatters: `d.duration:formatI(patternOut, patternIn)`.
    It accepts duration in milliseconds (by default), or ISO format (ex. P1Y2M3DT4H5M6S).
    - `patternOut` and `patternIn` can be `millisecond(s)` or `ms`, `second(s)` or `s`, `minute(s)` or `m`,
      `hour(s)` or `h`,`year(s)` or `y`, `month(s)` or `M`, `week(s)` or `w`, `day(s)` or `d`.
    - `patternOut` can be human and human+.
    Here are examples with `d.duration = 3600000`:
    - `{d.duration:formatI(ms)}`  => `3600000`
    - `{d.duration:formatI(s)}`  => `3600`
    - `{d.duration:formatI(minute)}`  => `60`
    - `{d.duration:formatI(hour)}`  => `1`
    - `{d.duration:formatI(human)}`  => `an hour`
    - `{d.duration:formatI(human+)}`  => `in an hour`
    - `{d.duration:formatI(hour, second)}`  => `1000`
  - [EE] `:html` formatter updates:
    - New: the image tag `<img>` is supported and rendered into DOCX/ODT/PDF documents.
      - The image source attribute can be an URL or Data-URL, such as `<img src=""/>`
      - The image size is rendered based on `width` and `height` attributes provided by the HTML tag, such as `<img src="" width="300" height="100"/>`.
        Values must be pixels. If `width` or `height` attributes are missing, the size of 5cm (1.96in) is applied by default while retaining the image aspect ratio.
    - New: The HTML content can now be rendered into "heading" styled text on your text editor.
    - Fixed: Paragraph spacing are now rendering correctly (e.g. `<p> <ul> <li>content </li> </ul>`, `<p><p>  <p>content`)
    - Fixed for ODT templates: Hyperlinks tags inside lists are now rendered without errors.
    - Fixed for DOCX templates: ordered and unordered lists size the same as the text
  - [EE] Fixed dynamic hyperlinks with query parameters for ODT templates
  - [EE] Fixed broken Docx files when shapes were duplicated by Carbone

### v4.0.0
  - Release June 25st 2022
  - [EE] ⚡️ Main features summary (see v4.0.0-alpha.0 for details)
    - Support dynamic charts in LibreOffice and Word + echarts
    - Improved debug message output
    - New aggregator formatters: `aggSum`, `aggAvg`, `aggMin`, `aggMax`, `aggCount`
    - Accept more complex parameters in formatters: expression with arrays, Mathematical formulas (v3.5.0)
    - Improved On-Premise Embedded Studio: multi-language, change export file format, automatic JSON generation from template
    - Accept formatters after conditional formatters (v4.0.0-beta.1). For example, `bindColor` can be used with conditions
  - [EE] Fix chart in DOCX when there is no loops (filtered array)
  - [EE] Fix stateless studio crash when template does not contain any Carbone tags
  - [EE] 🌈 `bindColor` formatter replaces background and line colors of shapes in DOCX only.
    - The `bindColor` tag must be written in the document (NOT in alt text of the shape)
    - The replaced color in the template must be RGB. Select "RGB sliders" tool to defined the color in MS Word.
  - [EE] Use lossless image compression by default to speed up PDF rendering and improve image quality
  - [EE] Remove experimental support of images in HTML with `:html` formatter for ODT template added in v4.0.0-beta.3 (postpone in 4.1)
  - [EE] Barcode improvements (dependency update):
    - The horizontal alignment of text in matrix symbols was fixed.
    - Various fixes were made for the encoding of Data Matrix, DotCode and Micro QR Code symbols.
    - The encoding of QR Code symbols was optimized.
    - The encoding of Rectangular Micro QR Code symbols was aligned with the final release of the specification.
    - The linear render now uses filled polygons rather than stroked lines.
    - Code 93 Extended was amended to not shift encode "$%+/" symbols.
    - Support was added for USPS FIM E marks.
    - Support for AI (715) was added to the GS1 linter.
    - Ultracode tile colours are now defined as RGB rather than CMYK. New tile colour patterns are defined for the upcoming revision.
    - A bug in the encoding of certain Aztec Code symbols was fixed.
    - A bug in the encoding of certain Dotcode symbols was fixed.
    - A bug in the encoding of QR Code symbols containing Kanji compression was fixed.
    - The rMQR encoding was optimised, potentially resulting in smaller symbols.
    - The colours for Ultracode symbols were changed to RGB values rather than CMYK.
    - The metrics for Ultracode symbols was updated and a raw mode was added.

### v4.0.0-beta.2
  - Release June 1st 2022
  - Fix crash with very complex JSON map

### v4.0.0-beta.1
  - Release May 25th 2022
  - [EE] Accept formatters after conditional formatters. It solves many issues, such as dynamic colors with conditions:
    - `{d.value:ifLT(10):show(0):formatN}` : `formatN` works even if the condition `ifLT(10)` is true
    - `{bindColor(fde9a9, hexa) = d.value:ifLT(10):show(FF00FF):ifLT(20):show(005FCF):elseShow(FFDD00)}`: conditional colors works!
  - Fix multiple reDoS and optimize parsing of some templates
  - [EE] Include 3.5.2
  - [EE] Dynamic chart:
    - Fix crash when DOCX/ODT templates contain empty files
    - Fix bad behavior when ODT template contains images with dynamic charts
    - Fix chart binding when values contain white spaces
    - Fix ODT charts when images are used for background

### v4.0.0-alpha.1
  - [EE] BREAKING CHANGE: the specific tag `{bind` becomes `{bindChart`. Example: `{bindChart(91) = d[i].valCol1}`
  - [EE] DOCX Charts improvements
    - Manage loops to repeat multiple charts in DOCX template made by MS Office
    - Update embedded spreadsheet
    - Supports only Column, Line, Pie charts
    - Carbone tags must be written with all `i` and `i+1` rows and columns in related Excel spreadsheet.
    - Using the specific tag `{bindChart` is not mandatory for DOCX because MS Word accepts Carbone tags in chart values
  - Fix crash when a condition is used just before a filtered loop

### v4.0.0-alpha.0

  WARNING: Native charts in LibreOffice and Word still need a lot of work before being stable for production

  - [EE] ⚡️ Carbone supports dynamic charts with two methods:
    - 1 - using native charts of MS Word or LibreOffice
    - 2 - or using [Apache ECharts 5.3.3](https://echarts.apache.org/examples/en/index.html) object descriptors to generate advanced cha2

    ### Method n°1, how to inject your data in native charts?
      - Insert a chart with native tools of LibreOffice or MS Word in your document
      - Use traditional Carbone tags to create loops in chart's data to inject your JSON data
      - If necessary, use the special tag `bind` to tell Carbone that the value `X` in the chart must be replaced by the tag `Y`

    ### Method n°2, how to do advanced charts with Apache ECharts objects?
      - Insert a sample image in your template.
      - Place a tag in alt text , like a dynamic image : `{d.chartObj:chart}` with the formatter `:chart`.
        The formatter `:chart` is optional if the `chartObj` object contains the attribute `"type" : "echarts@v5"`.
        In that case, Carbone automatically considers it is a chart object instead of a dynamic image.
      - `chartObj` must contains a compatible [Echarts option](https://echarts.apache.org/en/option.html).
        Here is an example to draw [this chart](https://echarts.apache.org/examples/en/editor.html?c=line-simple):

      ```json
        {
          "myChart" : {
            "type"    : "echarts@v5", // default
            "width"   : 600,          // default
            "height"  : 400,          // default
            "theme"   : null,         // default or object `theme` generated by https://echarts.apache.org/en/theme-builder.html
            "option"  : {
              "xAxis": {
                "type": "category",
                "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              },
              "yAxis": {
                "type": "value"
              },
              "series": [{
                "data": [150, 230, 224, 218, 135, 147, 260],
                "type": "line"
              }]
            }
          }
        }
      ```

    Currently, Carbone supports only "echarts@v5" but we may support newer versions and other libraries in the future.
    By default, Carbone considers "echarts@v5".

    Some charts have some translation: Locales supported : cs, de, en, es, fi, fr, it, ja, ko, pl, pt-br, ro, ru, si, th, zh

    Rendering charts with Apache Echarts is extremely powerful and works well if all these conditions are met
      - ECharts supports what you ask
      - The template supports the rendered SVG (docx/xslx/pptx does not support SVG images)
      - Your chart configuration does not need external dependencies (maps, js code, themes), which are not available in Carbone

    If you meet some limitation, please feel free to contact us on our chat to solve the issue.


  - [EE] If `options.isDebugActive = true`. `POST /render` returns additional information in `debug` sub-object:
    ```js
    {
      "renderId" : "file.pdf",
      "debug"    : {
        "markers" : ["{d.id}", "{d.tab[i].id}"] // all tags found in template
        "sample" : {         // EXPERIMENTAL
          "data"       : {}, // fake data generated from tags found in tags
          "complement" : {}  // fake complement generated from tags found in tags
        }
      }
    }
    ```

  - Improve syntax error message:
    - when a tag tries to access an array and a object in the same time
    - when there is a missing `[i]` tag fo one `[i+1]` tag
    - when Carbone cannot find the section to repeat
    - when there is a dot `.` before `[]`

  - Fix crash when repetition does not contain XML tags. For example: `<w:t>{d[i].id}, {d[i+1].id}</w:t>`
  - Fix crash when the section i+1 is duplicated like the i-th section with nested repetition and other tags
  - Fix crash when repetition uses direct access of sub-arrays `{d.test.others[i].wheels[0].size} {d.test.others[i+1].wheels[0].size}`

  - [EE] On-Premise Embedded Studio has new features and fixes:
    - [EXPERIMENTAL]: sample `Data` and `Complement` are automatically generated using tags found in template if these field contain empty objects
    - export to other formats than PDF
    - change report language
    - fix firefox template upload
    - fix memory leak
    - Now it works on Safari, without hot-reloading of the template

  - Formatters managements has been completely rewritten, to make it faster and more reliable. Here are acceptable syntax for formatters.
    For backward-compatibility: text containing single quotes are accepted if it does not contain a comma `,` before or after the single quote: `anyFormatter(' text ,containing ' sin,gle ' quote  ')`

  - Dynamic parameters passed in formatters with the dot `.` syntax has been improved:
    - Add the possibility to access sub arrays with positive integers: `.sort[12].id`
    - Add a syntax checker, which returns an understandable error when the syntax is not correct. Ex:  `.sort.[sd`, `.sor]t.[sd`
    - Improved access performance by a factor of 10
    - Add the possibility to access array iterators of currently visited arrays. The number of dots equals the number of previous `i`.
      Example: In  `{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}`
      - `.i` matches with the index of `wheels[i]`
      - `..i` matches with the index of `cars[i]`
      - `...i` matches with the index of `d[i]`

  - [EE] ⚡️ New aggregator formatters : `aggSum`, `aggAvg`, `aggMin`, `aggMax`, `aggCount`

    *Data*
      ```js
        { brand : 'Lu' , qty : 1  , sort : 1 },
        { brand : 'Fa' , qty : 4  , sort : 4 },
        { brand : 'Vi' , qty : 3  , sort : 3 },
        { brand : 'Fa' , qty : 2  , sort : 2 },
        { brand : 'To' , qty : 1  , sort : 1 },
        { brand : 'Vi' , qty : 10 , sort : 5 }
      ```
    *Template => Result*

    Global aggregation, without iterator<br>
      - `{d.cars[].qty:aggSum}` => 21
      - `{d.cars[].qty:aggAvg}` => 3.5
      - `{d.cars[].qty:aggMin}` => 1
      - `{d.cars[].qty:aggMax}` => 10
      - `{d.cars[].qty:aggCount}` => 6

    Global aggregation, with array filters<br>
      - `{d.cars[sort>1].qty:aggSum}` => 19
      - `{d.cars[sort>1].qty:aggAvg}` => 4.75
      - `{d.cars[sort>1].qty:aggMin}` => 2
      - `{d.cars[sort>1].qty:aggMax}` => 10
      - `{d.cars[sort>1].qty:aggCount}` => 4

    Global aggregation, with array filters, with other formatters<br>
      - `{d.cars[sort>1].qty:mul(.sort):aggSum:formatC}` => 81.00 €
      - `{d.cars[sort>1].qty:mul(.sort):aggAvg:formatC}` => 13.50 €
      - `{d.cars[sort>1].qty:mul(.sort):aggMin:formatC}` => 1.00 €
      - `{d.cars[sort>1].qty:mul(.sort):aggMax:formatC}` => 50.00 €
      - `{d.cars[sort>1].qty:mul(.sort):aggCount:formatC}` => 6.00 €


    - [EE] 🤩 Aggregators can also be used in a loop to compute sub-totals and cumulative totals (or "running totals"), with custom grouping clause (partition)
      - By default if not grouping clause is defined:
        - Sum by departments of all people's salary:
          - `{d.departments[i].people[].salary:aggSum}`
          - `{d.departments[i].people[].salary:aggSum(.i)}` (alternative)
        - Global sum of all departments, all people's salary
          - `{d.departments[i].people[i].salary:aggSum}`
          - `{d.departments[i].people[i].salary:aggSum(0)}` (alternative)
        - Cumulative total (or "running total") by departments of all people's salary:
          - `{d.departments[i].people[].salary:cumSum}`
        - Cumulative total (or "running total") of all departments, all people's salary
          - `{d.departments[i].people[i].salary:cumSum}`

      - You can change the partition with dynamic parameters like that
        - Sum by people by age, regardless of departments
          - `{d.departments[i].people[i].salary:aggSum(.age)}`
        - Sum by people by age and gender, regardless of departments
          - `{d.departments[i].people[i].salary:aggSum(.age, .gender)}`

### v3.6.0
  - Release April 17th 2023
  - Support vector barcodes with the new `svg` option to improve print quality: `{d.number:barcode(qrcode, svg:true)}`

### v3.5.6
  - Release February 16th 2023
  - [EE] BREAKING CHANGE in Carbone On-Premise plugins: the callback of `getPublicKey` must take two arguments `(err, publicKeys)`.
    If the first argument contains an error, the bad token is kept in quarantine area for 60s instead of infinitely.

### v3.5.5
  - Release December 7th 2022
  - Add user-agent `Carbone` when webhook is called.

### v3.5.4
  - Release June 15th 2022
  - [EE] Do not return an error when `DEL /template` is called and the template is already deleted on local storage. It may be already deleted by the plugin.

### v3.5.3
  - Release May 25th 2022
  - [EE] Accept `convCRLF` before `:html` formatter to convert `\r\n` to `<br>`

### v3.5.2
  - Release May 6th 2022
  - [EE] Add file verification on template upload

### v3.5.1
  - Release May 4th 2022
  - Rollback fix in v3.4.9

### v3.5.0
  - Release May 4st 2022
  - Formatters `add()`, `mul()`, `sub()` and `div()` accept simple mathematical expressions inside parenthesis.
      - Example: `{d.val:add(.otherQty  +  .vat  *  .price - 10 / 2)`
      - Only mathematical operators `+, *, -, /` are allowed, without parenthesis
      - Multiplication and division operators (`*`, `/`) has higher precedence than the addition/substration operator (`+`, `-`) and thus will be evaluated first.

### v3.4.9
  - Release April 27st 2022
  - Fix crash with very complex JSON map

### v3.4.8
  - Release March 15st 2022
  - [EE] Fix: avoid crash when a tag is used on a shape instead of a sample image (v3.2.2-1)
  - [EE] Fix graceful exit on SIGTERM, keep the converter alive to finish remaining renders!
    - As soon as Carbone has finished all renders, it exits after 15 seconds instead of 10 seconds
  - [EE] Fix DOCX documents that are including dynamic images and static charts

### v3.4.7
  - Release March 1st 2022
  - [EE] Carbone-EE On-Premise accepts to read the license from environment variable `CARBONE_EE_LICENSE`, or `--license` CLI options

### v3.4.6
  - Release February 18th 2022
  - [EE] The HTTP server starts as soon as possible, before LibreOffice.
  - [EE] Gracefully exits on SIGTERM. When the signal is received
    - GET /status returns 503. The reverse-proxy should stop sending new requests
    - As soon as Carbone has finished all renders, it exits after 10 seconds
    - Whatever happens, it exists after 300 seconds.
  - [EE] Add barcode options: pass to the formatter `:barcode` options as second argument. It should keep the format "key:value", such as: `{d.number:barcode(qrcode, width:300, height:100, includetext:false)}`. Options available:
    - `width` Width a number as millimeters. Example: `{d.number:barcode(qrcode, width:300)}`
    - `height` Height a number as millimeters. Example: `{d.number:barcode(qrcode, height:10)}`
    - `scale` Quality of the barcode as a number between `1` to `10`. The default value is `3`. Example: `{d.number:barcode(qrcode, scale:3)}`
    - `includetext` Show the text and takes a Boolean as value, `true` or `false`. Example: `{d.number:barcode(qrcode, includetext:false)}`.
    - `textsize` Number to change the size of the text. Example: `{d.number:barcode(qrcode, textsize:20)}`
    - `textxalign` Change the alignment of the text horizontally. Takes only 4 values: `left`, `center`, `right`, or `justify`. The default value is center. Example: `{d.number:barcode(qrcode, textxalign:right)}`
    - `textyalign` Change the alignment of the text vertically. Takes only 3 values: `below`, `center`, or `above`. The default value is below. Example: `{d.number:barcode(qrcode, textyalign:above)}`.
    - `rotate` Rotate the barcode and the text. Takes only 4 values (case insensitive): `N` for not rotated, `R` for 90 degree right rotation, `L` for 90 degree left rotation, `I` of 180 degree rotation. Example: `{d.number:barcode(qrcode, rotate:R)}` or `{d.number:barcode(qrcode, rotate:l)}`.
    - `barcolor` Color of bars as hexadecimal `#RRGGBB`. Example: `{d.number:barcode(qrcode, barcolor:#1FDE25)}`. Note: 6 characters required, and case insensitive.
    - `textcolor` Color of the text as hexadecimal `#RRGGBB`. Example: `{d.number:barcode(qrcode, textcolor:#1FDE25)}`. Note: 6 characters required, and case insensitive.
    - `backgroundcolor` Color of the background as hexadecimal `#RRGGBB`. Example: `{d.number:barcode(qrcode, backgroundcolor:#1FDE25)}`. Note: 6 characters required, and case insensitive.
    - `eclevel` Specify the error correction level: `L` for Low, `M` for Medium (default), `Q` for Quality and `H` for High. Option ONLY FOR QRCODES, Micro QR Code, GS1 QR Code, HIBC QR Code, or Swiss QR Code.
  - [EE] Dynamic HTML improvement - the following styles applied on the `:html` formatter are kept on the generated document: Right-to-left text, and text/background colors.
  - [EE] Dynamic HTML Fix - When creating a ordered or unordered list, the font-size, and font-family applied on the template are now kept in the generated document.

### v3.4.5
  - Release February 9th 2022
  - Now the parameter `converterFactoryTimeout` updates also the HTTP socket timeout accordingly

### v3.4.4
  - Release February 7th 2022
  - [EE] Experimental: increase the limit to 200 repetitions maximum when using the repetition feature `{d[i+1*qty]`

### v3.4.3
  - Release January 31th 2022
  - [EE] Bump dependencies to latest version
  - [EE] Add `options.isDebugActive`. If true, `POST /render` returns additional information in `debug` sub-object:
    ```js
    {
      "renderId" : "file.pdf",
      "debug"    : {
        "markers" : ["{d.id}", "{d.tab[i].id}"] // all tags found in template
      }
    }
    ```

### v3.4.2
  - Release January 10th 2022
  - [EE] Fix do not crash if content passed to `:html` formatter is not a string

### v3.4.1
  - Release December 9th 2021
  - Accepts "OpenDocument Text Flat XML" (.fodt) template files
  - Includes v3.3.3: fix timezone conversion with latest IANA database to manage correctly Daylight Saving Time
  - [EE] Fix dynamic colors for DOCX cells background

### v3.4.0
  - Release November 17th 2021
  - Remove compatibility with NodeJS 10.x. V8 uses timsort since NodeJS 11. So we can remove timsort dependency. NodeJS 12+ required.
  - Bump DayJS to 1.10.7 and debug to 4.3.2
  - Improve thread management of LibreOffice on Linux:
    - The system, which auto-restarts LibreOffice when it crashes or if there is a conversion timeout, could hang indefinitely on Linux.
      On the Enterprise Edition, the global watchdog system was able to fix this bad behavior but it was slow.
      Now, the LibreOffice is correctly killed. No zombie processes remaining.
    - Avoid launching the parent process "oosplash" of LibreOffice
    - Improve auto-restart mechanism
    - Add debug logs
    - All tests passed on Linux 😅
  - [EE] Bump all dependencies
  - [EE] Fix random image display in LibreOffice documents. Sometimes, LibreOffice hides one image when two or more images share the same name.
         Now, Carbone generates a unique name for each image with the format "carbone-image-<counter>".
  - [EE] Experimental: Deffered rendering with a webhook, it is dedicated to render huge reports:
    1. Render a document as usual with the request `POST /render/:templateID` with the JSON dataset into the body request AND you have to insert the header `carbone-webhook-url` as a callback URL. It is an endpoint of your server listening when a document is rendered.
    2. Carbone will generate your document and it will notify your webhook with a renderID
    3. Retrieve the generated document with a `GET /render/:renderID` and voilà!
  - [EE] Experimental: add the possibility to duplicate rows using an attribute of an object
    *Data*:
      ```json
      [
        { "id" : "A", "qty" : 2 },
        { "id" : "B", "qty" : 3 },
        { "id" : "C", "qty" : 0 },
        { "id" : "D", "qty" : 1 }
      ]
      ```
    *Template*: `{d[i].id} - {d[i+1*qty].id}`
    *Result*:  `A - A - B - B - B - D`
  - [EE] ⚡️ **Carbone supports 107 barcodes** in DOCX/ODT/XLSX/ODS templates:
    - Barcodes are inserted as a dynamic image to support more types
    - In your template, barcodes tags must be inserted inside the title or description field of a temporary image, and then it must be followed with the barcode formatter, such as `{d.value:barcode(type)}`.
    - You must pass one of the following types to the `:barcode` formatter as a first argument: `ean5`, `ean2`, `ean13`, `ean8`, `upca`, `upce`, `isbn`, `ismn`, `issn`, `code128`, `gs1-128`, `ean14`, `sscc18`, `code39`, `code39ext`, `code32`, `pzn`, `code93`, `code93ext`, `interleaved2of5`, `itf14`, `identcode`, `leitcode`, `databaromni`, `databarstacked`, `databarstackedomni`, `databartruncated`, `databarlimited`, `databarexpanded`, `databarexpandedstacked`, `gs1northamericancoupon`, `pharmacode`, `pharmacode2`, `code2of5`, `industrial2of5`, `iata2of5`, `matrix2of5`, `coop2of5`, `datalogic2of5`, `code11`, `bc412`, `rationalizedCodabar`, `onecode`, `postnet`, `planet`, `royalmail`, `auspost`, `kix`, `japanpost`, `msi`, `plessey`, `telepen`, `telepennumeric`, `posicode`, `codablockf`, `code16k`, `code49`, `channelcode`, `flattermarken`, `raw`, `daft`, `symbol`, `pdf417`, `pdf417compact`, `micropdf417`, `datamatrix`, `datamatrixrectangular`, `datamatrixrectangularextension`, `mailmark`, `qrcode`, `swissqrcode`, `microqrcode`, `rectangularmicroqrcode`, `maxicode`, `azteccode`, `azteccodecompact`, `aztecrune`, `codeone`, `hanxin`, `dotcode`, `ultracode`, `gs1-cc`, `ean13composite`, `ean8composite`, `upcacomposite`, `upcecomposite`, `databaromnicomposite`, `databarstackedcomposite`, `databarstackedomnicomposite`, `databartruncatedcomposite`, `databarlimitedcomposite`, `databarexpandedcomposite`, `databarexpandedstackedcomposite`, `gs1-128composite`, `gs1datamatrix`, `gs1datamatrixrectangular`, `gs1qrcode`, `gs1dotcode`, `hibccode39`, `hibccode128`, `hibcdatamatrix`, `hibcdatamatrixrectangular`, `hibcpdf417`, `hibcmicropdf417`, `hibcqrcode`, `hibccodablockf`, `hibcazteccode`
    - The previous system, which uses a special font, is still available but is limited to `ean8`, `ean13`, `ean128`, `code39`.

### v3.3.2
  - Release October 11th 2021
  - [EE] Dynamic Image fix: image types verification support uppercase and lower case formats

### v3.3.1
  - Release September 9th 2021
  - [EE] New Carbone On-premise: Pass the option "maxDataSize" to change the maximum JSON data size when rendering a report. The value must be **bytes**. The default value is 60MB.

### v3.3.3
  - Release November 26th 2021
  - Fix timezone conversion with latest IANA database to manage correctly Daylight Saving Time
    `2021-11-18T08:05+0000` -> `Europe/London` -> `Thursday, November 18, 2021 8:05 AM`

### v3.3.0
  - Release August 30th 2021
  - [EE] HTML Formatter:
    - Fix: The HTML content is rendered without adding an empty line above it.
    - Fix: The HTML content and static content are rendered in the expected order.
    - New: If static content and Carbone tags are mixed with an HTML formatter in the same paragraph, the html is isolated into a new paragraph and each element are seperated above or below. For example, the following template on a text editor `<paragraph>A rocket is made of {d.data:html} {d.details}, this is cool!</paragraph>` will be transform into 3 paragraphs on the generated report `<paragraph>A rocket is made of </paragraph><paragraph>{d.data:html}</paragraph><paragraph> {d.details}, this is cool!</paragraph>`.
    - Improved HTML rendering stability when it is mixed with lists, tables, and images.
  - [EE] Dynamic Checkbox are supported only for ODT file. A tag should be inserted into the checkbox property "name" and it is used to set the value of the checkbox on the generated report. The checkbox is ticked (checked) when the value is a Boolean with the value "true", a non empty string, a non empty array or a non empty object. If the exported file type is a PDF, the checkbox can be edited on the generated document. An ODT document created from MS Word that include checkboxes does not work. It is also not possible to create a list of checkboxes with the expressions `[i] / [i+1]`.
  - Accept `null` for the attribute `complement` in `options`

### v3.2.7
  - Release July 21th 2021
  - Fix corrupted document when accessing a sub-object in an array `{d.surrounding[i].subArray[0].subObject.id}`, within a surrounding loop

### v3.2.6
  - Release June 15th 2021
  - [EE] Fix the generation of ODP document that includes table lists.

### v3.2.5
  - Release June 10th 2021
  - [EE] Accept URLs with weird Content-Type such as `image/png; charset=utf-8`  for dynamic image replacement

### v3.2.4
  - Release May 25th 2021
  - [EE] Add the possibility to upload templates in base64. The content-type must be `application/json` and the template
    must be sent in base64 in the body `{ "template" : "pure base64 or data-URI scheme in base64"}`
  - [EE] Accepts loops with dynamic image replacement across slides/pages in ODP templates

### v3.2.3
  - Release May 21th 2021
  - Accepts letter `W` to get the week number in `formatD` formatter

### v3.2.2-1
  - Release March 11th 2022
  - Fix: avoid crash when a tag is used on a shape instead of a sample image

### v3.2.2
  - Release May 10th 2021
  - Fix broken Excel files. It removes the alert which appears sometime when opening the file with MS Excel.
  - Update DayJS dependency from 1.9.6 to 1.10.4.
  - Fix date formatters (`formatD`...) and number formatters  (`formatN`...) when the country code is used in `options.lang`.
    It accepts lower case or upper case for the locale.
    Example:

    *Data*:
      ```js
      {
        date  : '20140131 23:45:00',
        price : 1000.1234
      }
      ```
    *Template*: `{d.date:formatD(dddd)} {d.price:formatN()}`

    *Result*:

      - `de-DE` => `Friday 1.000,123` (before) `Freitag 1.000,123` (after)
      - `fr-fr` => `Friday 1 000,123` (before) `vendredi 1 000,123` (after)

  - Fix number formatting for these locales: nl-be, am, ar, ar-dz, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly,
    ar-ma, ar-om, ar-qa, ar-sa, ar-sy, ar-tn, ar-ae, ar-ye, az-az, bn, bs, zh-cn, zh-hk, zh-mo, zh-sg, zh-tw, hr,
    da, en-au, en-bz, en-ca, en-cb, en-in, en-ie, en-jm, en-nz, en-ph, en-tt, fa, fr-lu, de-li, de-lu, de-ch, el,
    he, hi, id, it-it, it-ch, ja, kn, ko, ms-bn, ms-my, ml, mr, ro-mo, ro, ru-mo, sr-sp, sl, es-ar, es-bo, es-cl,
    es-co, es-do, es-ec, es-sv, es-gt, es-hn, es-mx, es-ni, es-pa, es-py, es-pe, es-pr, es-es, es-uy, es-ve, sw,
    ta, te, th, tr, uz-uz, vi, de, es, it

    Example:
      - `de` => `Freitag 1,000.123` (before) `Freitag 1.000,123` (after)

### v3.2.1
  - Release May 4th 2021
  - Fix locale de-de
  - [EE] Fix dynamic HTML: null or undefined values return an empty string instead of an error.

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
  - Fix: Do not break documents if the `i+1` row contains some tags coming from parent object or condition blocks (rare)
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
  - [EE] Feature: cells colors on ODT/DOCX report can be changed dynamically with the "bindColor" tag.
  - [EE] ODT Improvement: the "bindColor" tag will not remove other styles than colors.
  - Accepts to convert the first page of docx or odt templates into a JPEG file with `converTo : 'jpg'`
  - Improve HTML type detection. Accepts html5 without doctype.
  - [EE] Fix Carbone tag inside ODT text box
  - Adding `padl` and `padr` string formatter.
  - Fix doc issue on carbone website
  - Accepts Adobe Indesign IDML file as a template
  - [EE] Dynamic hyperlinks: it is possible to insert hyperlinks into elements (text, image, list, tables, ...). Right click an element, select "hyperlinks", insert the tag and validate. It is working with ODS, ODT, and DOCX reports. The compatibility is limited for XLSX documents: It is not possible to create a list of hyperlinks and the tag should not be written with curly braces, example: a typical `{d.url}` should be only `d.url`. If `http://` appears before `d.url`, it is also valid.
  - Improve the parsing processing by moving the function "removeXMLInsideMarkers" before the building stage.
  - Support officially to embed translations tags inside other tags: `{d.id:ifEq(2):show(  {t(Tuesday)} ) }`
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
      - 2 bindColor tags try to edit the same color
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
    - first, draw a chart in MS Excel and replace your data with Carbone tags
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
  - Fix crash when tags are next to each over `{d.id}{d.other}` in many situations:
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
  - [EE] Dynamic images improvements: it is possible to insert images into `ODT`, `ODS`, `XLSX` and `DOCX` by passing a public URL or a Data URLs. For the 2 solutions, you have to insert a temporary picture in your template and write the tag as an alternative text. Finally, during rendering, Carbone replaces the temporary picture by the correct picture provided by the tag.

    The place to insert the tag on the temporary picture may change depends on the file format:

      - ODS file: set the tag on the image title
      - ODT file: set the tag on the image alternative text
      - DOCX file: set the tag either on the image title, image description, or alternative text
      - XLSX file: set the tag either on the image title, image description, or alternative text

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
  - Fix: should find tags even if there is a opening bracket `{` before the tags
  - Fix: accept to nest arrays in XML whereas these arrays are not nested in JSON
  - Fix: tags were not parsed if formatters were used directly on `d` or `c` like this `{d:ifEmpty('yeah')}` ...
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
  - Fix: a report without tags, except lang ones, is translated
  - Fix: avoid creating LibreOffice zombies when node crashes
  - Fix: avoid using LibreOffice if `options.convertTo` equals input file extension
  - Fix: improve tags detection to avoid removing some XML variable like `{DSDSD-232D}` used in DOCX
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
  - Add a tool to search a text within a tag in all reports `carbone find :formatterName`


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
    + it repeats automatically all tags that are on the same row of all nested arrays

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
