

TODO
-----
Gérer Excel en convertissant les sharedString avant (pas obligatoire apparemen)
https://social.msdn.microsoft.com/Forums/en-US/5dd1dd01-2117-41e2-8836-26252cf90c1a/how-fetch-numeric-and-non-numeric-data-in-excel-and-store-the-data-to-table-storage-in-azure?forum=oxmlsdk

http://packageexplorer.codeplex.com/
http://openxmldeveloper.org/discussions/development_tools/f/17/t/6958.aspx

BUG ALEATOIRE : IL est possible que carbone se détache des thread LO... et reste dans un mode Python killed with 101

Test :

si variable dish1 et dish1Name la deuxième se confond avec la première
si {d[id>1]} avant {d[mealType.sort]} -> {d[mealType.sort+1]}, l'extracteur monte trop haut et englobe {d[id>1]} par erreur

- si pas de 'i', alors toujours prendre la première valeur qui correspond au filtre... SI il ya plusieurs valeur, afficher un warning quel que part.

- Eviter de lire le fichier 2 fois sur le disque (dans isZipped et dans openTemplate)
- Enelver le readSync dans file.unzip
- Cache template in file.js
- Grouper automatiquement même sur un objet plat
 d[i], d[i+1]  : normal
 d[id], d[id+1] : groupement par id
 d[id,i], d[id+1,i+1] : groupement par "id-i" comme actuellement quand on fait d[id], le i est ajouté automatiquement (pas bien finalement)

- TODO : séparer descriptor de pracours des tableaux du descriptor des parties XML. Cela permettrait sûrement d'éviter de parcours les données 2 fois si les markers sont répétés dans le rapport

- TODO : faire des xmlPart qui utilise des String par référence au lieu d'insérer directement le text
- TODO : do not crash if the error of LibreOffice is 102 (the document could not be opened)... except if the error occurs manu time?

- Essayer de développer un module UNO C++ pour éviter de passer par python (peut-être plus rapide) : http://api.libreoffice.org/examples/examples.html#Cpp_examples
Tuto UNO C++ : http://www.linuxjournal.com/article/8608

- get the list of supported format 
- convert presentation/spreadsheet to pdf
mettre un message d'erreur clair quand unzip n'est pas installé (ligne 160 indes.js throw error)


Performance info 
----------------
Research
---------

SI on oublie un filtre dans un array, cela ne doit pas faire n'importe quoi

Temps passé pour le rapport de menu 5 semaine : 

openTemplate: 11ms

findVariables: 1ms

splitMarkers: 9ms

splitXml: 25ms

buildSortedHierarchy: 0ms

getBuilderFunction: 7ms

_builder: 25ms

assembleXmlParts: 22ms

walkFiles: 93ms

buildFile: 122ms

convert: 2578ms



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

Puis lancer le fichier python :
/Applications/LibreOffice.app/Contents/MacOS/python converter.py --pipe bla

Et écrire dans la console
--input=/Users/dgrelaud/test.odt --format=writer_pdf_Export --output=/Users/dgrelaud/res.pd


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



/*
function binarySearch(value, arr) {
  var length = arr.length;
  var first = 0;
  var last = length - 1,
  var mid = ((last - first) >> 1);
  var item;
  if(length === 0 || arr[first] > value || arr[last] < value) {
    return -1;
  }
  while (first - last) {
    item = arr[mid];
    if (value === item) {
        return mid;
    } else if (value < item) {
        last = mid;
    } else {
        first = mid + 1;
    }
    mid = first + ((last - first) >> 1);
  }
  if (arr[last] !== value) {
    return -1;
  }
  return last;
}*/


