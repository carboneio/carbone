FROM node:14

WORKDIR /tmp
RUN apt update && apt install -y lsof libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6 unzip
# Download LibreOffice
RUN wget https://downloadarchive.documentfoundation.org/libreoffice/old/7.2.0.4/deb/x86_64/LibreOffice_7.2.0.4_Linux_x86-64_deb.tar.gz -O libo.tar.gz \
    && tar -zxvf libo.tar.gz

# Install LibreOffice
WORKDIR /tmp/LibreOffice_7.2.0.4_Linux_x86-64_deb/DEBS
RUN dpkg -i *.deb

# Copy the local binary into the image folder "app"
ENV APP_ROOT /app/

RUN mkdir ${APP_ROOT}
WORKDIR ${APP_ROOT}

COPY ./carbone-ee-linux .
