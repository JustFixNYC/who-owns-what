FROM python:3.6

RUN apt-get update \
  && apt-get install -y \
    unzip \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

ENV NYCDB_REV=ab8f632c5e3514643955c25a412b9a5dd0bc065c
RUN curl -L https://github.com/JustFixNYC/nyc-db/archive/${NYCDB_REV}.zip > nyc-db.zip \
  && unzip nyc-db.zip \
  && rm nyc-db.zip \
  && mv nyc-db-${NYCDB_REV} nyc-db \
  && cd nyc-db/src \
  && pip install -e .

RUN pip install psycopg2-binary
