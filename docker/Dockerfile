FROM debian:stable-slim

WORKDIR /tmp
RUN apt update && \
    apt install -y curl libnss3 libxinerama1 libdbus-glib-1-2 libcairo2 libcups2
    
# Download LibreOffice
RUN curl -L https://download.documentfoundation.org/libreoffice/stable/7.6.4/deb/x86_64/LibreOffice_7.6.4_Linux_x86-64_deb.tar.gz | \
    tar -zx

# Install LibreOffice
RUN dpkg -i LibreOffice_*_Linux_x86-64_deb/DEBS/*.deb
RUN rm -r /tmp/LibreOffice_*

# Create Carbone user
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
