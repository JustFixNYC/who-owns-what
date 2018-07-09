# Who owns what in nyc?

The Who Owns What project is a new resource for community organizers and tenant leaders to demystify property ownership and shell company networks across New York City.

With this website, you can find crucial information about who is responsible for your building. The site utilizes a database of 160k other properties to connect the dots and discover other properties that your landlord might own or be associated with. Use this tool to discover what buildings in your neighborhood to organize in, what communities your landlord might be targeting, and if your building might be financially overleveraged.

![Imgur](http://i.imgur.com/cYw4gyU.jpg)


**This project is currently in active development!**

## Architecture
This site is built on top of the critical work done by [@aepyornis](https://github.com/aepyornis) on the [nyc-db](https://github.com/aepyornis/nyc-db) project, which is used to cleanly extract, sanitize, and load [HPD Registration data](http://www1.nyc.gov/site/hpd/about/open-data.page) into a PostreSQL instance.

Backend logic and data manipulation is largely handled by making calls to PostreSQL functions and prebuilding results into tables whenever possible to avoid complex queries made per-request. See the [hpd module](https://github.com/aepyornis/hpd/tree/master) of `nyc-db` for the SQL code that provides this functionality.

#### Backend
The backend of the app (`/server`) is a simple express build that connects to Postgres using `pg-promise`.

#### Frontend
The frontend of the app (`/client`) is built on top of [create-react-app](https://github.com/facebookincubator/create-react-app). See [`/client/README.md`](https://github.com/JustFixNYC/who-owns-what/blob/master/client/README.md) for all the info you might need.

## Setup
Make sure you have [yarn](https://yarnpkg.com/en/)  and then just

```
yarn install && cd client && yarn install
```

to grab dependencies for both server and client. You'll need a `.env` in the root directory for `DATABASE_URL`,`GEOCLIENT_ID`, & `GEOCLIENT_KEY` plus various instrumentation that you can do without if you want.

## Running in development
Check `package.json` in the root directory for all options. To run both `express` and `create-react-app` you just need

```
yarn start
```

from root.

## Deploying
Package clientside assets through

```
cd client && yarn build
```

Your express app will grab static files (i.e. the react app and assets) from `client/build` automatically.

## Cross-browser testing

We use BrowserStack Live to make sure that our sites work across browsers, operating systems, and devices.

![BrowserStack](https://www.browserstack.com/images/layout/browserstack-logo-600x315.png)

## License

JustFix.nyc uses the GNU General Public License v3.0 Open-Source License. See `LICENSE.md` file for the full text.
