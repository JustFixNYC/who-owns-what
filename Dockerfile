FROM python:3.6

ENV NODE_VERSION=8

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

RUN apt-get update \
  && apt-get install -y \
    nodejs \
    unzip \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

RUN npm install -g yarn

COPY requirements.txt /

RUN pip install -r requirements.txt
