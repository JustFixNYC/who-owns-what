FROM python:3.6

RUN apt-get update \
  && apt-get install -y \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

RUN pip install nycdb psycopg2-binary
