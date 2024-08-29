FROM python:3.10

# This Dockerfile is for development purposes only; we don't use it
# for production.

ENV NODE_VERSION=12

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

# https://github.com/nodejs/help/issues/554#issuecomment-429633801
RUN printf 'Package: nodejs\n\
Pin: origin deb.nodesource.com\n\
Pin-Priority: 1001\n' \
>> /etc/apt/preferences.d/nodejs

RUN apt-get update \
  && apt-cache policy nodejs \
  && apt-get install -y \
    nodejs \
    unzip \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

RUN npm install -g yarn

ENV PATH /wow/client/node_modules/.bin:$PATH


COPY requirements.txt requirements-dev.txt /

RUN pip install -r requirements-dev.txt

# Setup Geosupport 
# check the latest version here https://www.nyc.gov/site/planning/data-maps/open-data/dwn-gdelx.page
# make sure this gets updated regularly, and matches the version in nycdb-k8s-loader
ENV RELEASE=23c
ENV MAJOR=23
ENV MINOR=3
ENV PATCH=0
WORKDIR /geosupport

RUN FILE_NAME=linux_geo${RELEASE}_${MAJOR}_${MINOR}.zip \
  && echo ${FILE_NAME} \
  && curl -O https://s-media.nyc.gov/agencies/dcp/assets/files/zip/data-tools/bytes/$FILE_NAME \
  && unzip *.zip \
  && rm *.zip

ENV GEOFILES=/geosupport/version-${RELEASE}_${MAJOR}.${MINOR}/fls/
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/geosupport/version-${RELEASE}_${MAJOR}.${MINOR}/lib/

WORKDIR /app
