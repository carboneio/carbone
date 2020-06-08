Carbone On-Premise Draft doc
============================

Two installation solutions : 
  - One binary exectuable + LibreOffice
  - Docker

# Binary solution

### Installation

- 1 - Download Carbone On-premise binary for your server
- 2 - Install LibreOffice (see below)
- 3 - Start carbone weserver

```bash
  ./carbone webserver --port 4000 --workdir .
```

It creates these directories in `--workdir` [-w]:

- `template`  : where carbone keeps templates (cache)
- `render`    : temp directory where report are generated 
- `asset`     : internal are generated 
- `config`    : [NOT IMPLEMENTED] config and licenses
- `logs`      : [NOT IMPLEMENTED] formated output logs 
- `plugin `   : [NOT IMPLEMENTED] where to put custom plugin 


### How to use it?

Same HTTP API as https://carbone.io/api-reference.html#carbone-render-api

Carbone On-Premise will be compatible with our SDK for Python, Go, JS, PHP, ...

- Add a template    : POST /render.carbone.io/template
- Generate a report : POST /render.carbone.io/render/:templateId
- Get the result    : GET /render.carbone.io/render/:renderId


[NOT IMPLEMENTED] You can also send an URL instead of a templateId. Carbone will download the templates automatically.


### How to install LibreOffice on Ubuntu server


```
  # remove all old version of LibreOffice
  sudo apt remove --purge libreoffice*
  sudo apt autoremove --purge

  # Download LibreOffice debian package. Select the right one (64-bit or 32-bit) for your OS.
  # Get the latest from http://download.documentfoundation.org/libreoffice/stable
  # or download the version currently "carbone-tested":
  wget https://downloadarchive.documentfoundation.org/libreoffice/old/6.4.4.2/deb/x86_64/LibreOffice_6.4.4.2_Linux_x86-64_deb.tar.gz

  # Install required dependencies on ubuntu server for LibreOffice 6.0+
  sudo apt install libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6

  # Uncompress package
  tar -zxvf LibreOffice_6.4.4.2_Linux_x86-64_deb.tar.gz
  cd LibreOffice_6.4.4.2_Linux_x86-64_deb/DEBS

  # Install LibreOffice
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts
  # Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,
  # Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt install ttf-mscorefonts-installer

  # If you want to use special characters, such as chinese ideograms, you must install a font that support them
  # For example:
  sudo apt install fonts-wqy-zenhei
```


# Docker solution

TODO

