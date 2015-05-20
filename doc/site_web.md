### COnseil
  - Faire une landing Page sur https://www.launchrock.com 
  - Conseil landing page : http://www.presse-citron.net/landing-page/



### Bandeau principal
  - Trouver une belle photo
  - Message : 
    - Convert your JSON into beautiful reports in PDF, DOC(X), XLS(X), PPT(X), ODT, ODS, ...
    - Create a beautiful report in a minute from your JSON!  .. un peu plus loin ... 
      - in all formats : PDF, DOC(X), XLS(X), PPT(X), ODT, ODS, ...
      - without coding
      - without using any designer tool
  
  
#### Doc technique 

@cbercetche: pour info, les formules fonctionnent bien dans LibreOffice... Il y a néanmoins 2 petits trucs à connaitre :

1) si les cellules sources ont des décimales, la formule fonctionne si le séparateur de décimal est cohérent par rapport à la langue de LibreOffice. Donc il faut utiliser la virgule au lieu du point comme séparateur pour la France

2) si la formule est dans une ligne qui est répétée par CarboneJS, il faut que cette formule soit sous la forme "multi-ligne" : `=E7:E80000-F7:F80000` .  Le second chiffre (80000) doit être suffisamment grand pour englober toutes les répétitions.
Si on met `=E7-F7`, CarboneJS ne va pas incrémenter les numéros de lignes `7,8,9, ...` tout seul (ce serait peut-être une évolution à prévoir mais c'est un changement important car cela veut dire que CarboneJS doit comprendre ce qu'il répète).

Pour le point 1, je vais ajouter un formatteur dans la matinée pour formatter les nombre selon la langue du rapport. C'était demandé de toute façon.