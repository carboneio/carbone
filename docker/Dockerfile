FROM debian:stable-slim

WORKDIR /tmp
RUN apt update && \
	apt install -y libnss3 libxinerama1 libdbus-glib-1-2 libcairo2 libcups2 openssl
# With full optimisation
#    apt install -y libfreetype6 fontconfig

# Download and install LibreOffice
# in 1 line to save space
RUN --mount=type=bind,target=/tmp/libreoffice.tar.gz,source=libreoffice.tar.gz \
	tar -zxf libreoffice.tar.gz && \
	dpkg -i LibreOffice*_Linux_*_deb/DEBS/*.deb && \
	rm -r /tmp/LibreOffice*

# Create Carbone user
RUN adduser carbone --home /app --no-create-home --disabled-password --system

# Copy the local binary into the image folder "app"
ENV APP_ROOT /app/
RUN mkdir ${APP_ROOT}

WORKDIR ${APP_ROOT}
COPY ./carbone-ee-linux .
RUN chmod +x carbone-ee-linux && chown -R carbone:nogroup ${APP_ROOT}

ADD ./carbone-ee-plugin-s3 /app/plugin/

USER carbone

RUN mkdir /app/template && mkdir /app/render && mkdir /app/config && mkdir /app/asset

ENTRYPOINT ./carbone-ee-linux webserver
