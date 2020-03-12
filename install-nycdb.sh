export NYCDB_REPO=https://github.com/nycdb/nycdb
export NYCDB_REV=2560271cb47fc35d7e5584c673fd57cbcdb5880a

curl -L ${NYCDB_REPO}/archive/${NYCDB_REV}.zip > nycdb.zip \
  && unzip nycdb.zip \
  && rm nycdb.zip \
  && mv nycdb-${NYCDB_REV} nycdb \
  && cd nycdb/src \
  && pip install -e .
