FROM python:3.6

ENV NODE_VERSION=8

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

COPY requirements.txt /

RUN pip install -r requirements.txt

COPY install-nycdb.sh /

RUN bash install-nycdb.sh

ENV PATH /wow/node_modules/.bin:/wow/client/node_modules/.bin:$PATH
