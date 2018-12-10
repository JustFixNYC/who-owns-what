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

ENV NYCDB_REV=c1d7aa7f6efbe305df847ea1b439a8b230a92516

RUN curl -L https://github.com/JustFixNYC/nyc-db/archive/${NYCDB_REV}.zip > nyc-db.zip \
  && unzip nyc-db.zip \
  && rm nyc-db.zip \
  && mv nyc-db-${NYCDB_REV} nyc-db \
  && cd nyc-db/src \
  && pip install -e .

# Currently nyc-db mentions psycopg2 as a dependency, which is deprecated
# and will log lots of annoying warnings about using psycopg2-binary
# instead, so let's just install that to avoid the warnings.
RUN pip install psycopg2-binary

COPY . /wow/
