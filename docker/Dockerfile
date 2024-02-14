FROM debian:stable-slim

WORKDIR /tmp
RUN apt update && \
    apt install -y lsof libxinerama1 libfontconfig1 libdbus-glib-1-2 \
                   libcairo2 libcups2 libglu1-mesa libsm6 unzip \
                   libnss3 curl wget fontconfig

# Download LibreOffice
RUN curl -L https://download.documentfoundation.org/libreoffice/stable/7.6.4/deb/x86_64/LibreOffice_7.6.4_Linux_x86-64_deb.tar.gz \
    -o libo.tar.gz \
    && tar -zxvf libo.tar.gz

# Install LibreOffice
WORKDIR /tmp/LibreOffice_7.6.4.1_Linux_x86-64_deb/DEBS
RUN dpkg -i *.deb

# Create Carbone user
#RUN addgroup carbone
RUN adduser carbone --home /app --no-create-home --disabled-password --system

# Copy the local binary into the image folder "app"
ENV APP_ROOT /app/
RUN mkdir ${APP_ROOT}

WORKDIR ${APP_ROOT}
COPY ./carbone-ee-linux .
RUN chmod +x carbone-ee-linux

RUN chown -R carbone:nogroup ${APP_ROOT}

USER carbone

ENTRYPOINT ./carbone-ee-linux webserver
