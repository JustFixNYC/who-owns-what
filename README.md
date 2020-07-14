[![CircleCI](https://circleci.com/gh/JustFixNYC/who-owns-what.svg?style=svg)](https://circleci.com/gh/JustFixNYC/who-owns-what)

# Who owns what in nyc?

The Who owns What project is a new resource for community organizers and tenant leaders to demystify property ownership and shell company networks across New York City.

With this website, you can find crucial information about who is responsible for your building. The site utilizes a database of 160k other properties to connect the dots and discover other properties that your landlord might own or be associated with. Use this tool to discover what buildings in your neighborhood to organize in, what communities your landlord might be targeting, and if your building might be financially overleveraged.

![Imgur](http://i.imgur.com/cYw4gyU.jpg)


**This project is currently in active development!**

## Architecture

This site is built on top of the critical work done by [@aepyornis](https://github.com/aepyornis) on the [nycdb](https://github.com/nycdb/nycdb) project, which is used to cleanly extract, sanitize, and load [HPD Registration data](http://www1.nyc.gov/site/hpd/about/open-data.page) into a PostgreSQL instance.

Backend logic and data manipulation is largely handled by making calls to PostgreSQL functions and prebuilding results into tables whenever possible to avoid complex queries made per-request. See the [hpd-registration ](https://github.com/nycdb/nycdb/tree/master/src/nycdb/sql/hpd_registrations) scripts of `nycdb` for the SQL code that provides this functionality.

Note that both the backend and the frontend of the app each contain __separate `package.json` configurations__ as well as __separate sets of environment variables__. We are not just being weird here— this is a recommended practice according to the [create-react-app](https://github.com/facebookincubator/create-react-app) framework that we used to build the tool. 

#### Backend

The backend of the app (`/server`) is a simple express build that connects to Postgres using `pg-promise`. 

#### Frontend

The frontend of the app (`/client`) is built on top of [create-react-app](https://github.com/facebookincubator/create-react-app). See [`/client/README.md`](client/README.md) for all the info you might need.

## Setup

In order to set things up, you'll need to copy `.env.sample` to `.env` and
edit it as needed:

```
cp .env.sample .env
```

In particular, make sure you configure the `DATABASE_URL` environment variable.

Then you'll want to set up and enter a Python 3 virtual environment:

```
python3 -m venv venv
source venv/bin/activate  # Or 'venv\Scripts\activate' on Windows
pip install -r requirements.txt
```

Then you'll need to load data into the database. If you want to use
real data, which takes a long time to load, you can do so with:

```
python dbtool.py builddb
```

Alternatively, you can load a small test dataset with:

```
python dbtool.py loadtestdata
```

After that, make sure you have node/npm/[yarn](https://yarnpkg.com/en/) and then run:

```
yarn install-all
```

This will grab dependencies for both server and client.

## Running in development

Check `package.json` in the root directory for all options. To run both `express` and `create-react-app` you just need:

```
yarn start
```

from root.

You can visit your local dev instance at http://localhost:3000.

## Alternative: Docker-based development

As an alternative to the aforementioned setup, you can use
[Docker](https://www.docker.com/get-started).

First create an `.env` file and edit it as needed:

```
cp .env.sample .env
```

Note that you don't need to change `DATABASE_URL` if you
just want to use the test database.

Now run:

```
docker-compose run app python dbtool.py loadtestdata
```

This will build a nycdb with test data, which is must faster
than downloading the whole nycdb. You can, however, opt to
download the whole thing by running
`docker-compose run app python dbtool.py builddb`, but be
prepared, as it will take a while!

Once you've done that, run:

```
docker-compose run app yarn install-all
```

Then start up the server:

```
docker-compose up
```

Visit http://localhost:3000 and you should be good to go! If
you installed test data, you can see useful results by
clicking on the "All Year Management" portfolio on the
home page.

Note: If you would like to connect your Docker instance to an external postgres database, you
can update the `DATABASE_URL` [server-side env variable](https://github.com/JustFixNYC/who-owns-what/blob/master/.env.sample) with your remote db's connection URI. 

## Tests

Back-end tests are in the [`/tests`](tests/) directory and can be run via
the Python virtualenv:

```
pytest
```

If you're using Docker, this can be done via `docker-compose run app pytest`.

See [`/client/README.md`](client/README.md) for more details on front-end
tests.

## Deploying

Package client-side assets through:

```
cd client && yarn build
```

Your express app will grab static files (i.e. the react app and assets) from `client/build` automatically.

## Cross-browser testing

We use BrowserStack Live to make sure that our sites work across browsers, operating systems, and devices.

![BrowserStack](https://www.browserstack.com/images/layout/browserstack-logo-600x315.png)

## Updating data

Updating WoW's data is straighforward for about a year, at which point it eventually needs to look at
different datasets in order to be up-to-date.  For example, because it uses the PLUTO dataset, it needs
to always look at a reasonably recent version, which can be non-trivial because that dataset's schema
changes from one revision to another.

To use new data, you'll need to update a few things:

1. Update the [NYCDB][] revision WoW and its test suite use
   at [`requirements.txt`][].
2. Update the list of NYCDB datasets WoW depends on at
   [`who-owns-what.yml`][].
3. Update any SQL to refer to the new dataset's tables.
4. Any new or updated datasets may need new scaffolding
   for WoW's test suite to continue functioning. This
   means you may need to run the
   [`tests/generate_factory_from_csv.py`][] tool to
   create new factories in the `tests/factories`
   folder. You may also need to add new test data to
   the `tests/data` directory in order for tests to
   continue working.

An example of all this in practice can be seen in [#209][],
which upgrades WoW from PLUTO 18v2 to 19v2.

[NYCDB]: https://github.com/nycdb/nycdb
[`requirements.txt`]: requirements.txt
[`who-owns-what.yml`]: who-owns-what.yml
[`tests/generate_factory_from_csv.py`]: tests/generate_factory_from_csv.py
[#209]: https://github.com/JustFixNYC/who-owns-what/pull/209

## License

JustFix.nyc uses the GNU General Public License v3.0 Open-Source License. See `LICENSE.md` file for the full text.
