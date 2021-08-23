FROM python:3.6

# This Dockerfile is for development purposes only; we don't use it
# for production.

ENV NODE_VERSION=14

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

COPY requirements.txt requirements-dev.txt /

RUN pip install -r requirements-dev.txt

ENV PATH /wow/client/node_modules/.bin:$PATH
