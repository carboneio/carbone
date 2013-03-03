Kendoc
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