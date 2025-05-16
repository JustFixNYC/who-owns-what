# justfixnyc/wow-ci:latest
FROM cimg/python:3.10.7-node

USER root
RUN apt-get update && \
  apt-get install -y \
  unzip \
  libpq5 \
  postgresql-client \
  postgis && \
  rm -rf /var/lib/apt/lists/*
USER circleci
