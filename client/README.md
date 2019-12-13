This is the front-end for Who Owns What (WOW). For more details on
WOW, see [`../README.md`](../README.md).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Configuration

This project comes pre-configured with sensible defaults, but
you can customize them with the following command:

```
cp .env.local.sample .env.local
```

Now edit `.env.local` as needed.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode. Note that you also need
to be running the API server for everything to work properly, so
you might want to run `yarn start` in the parent directory
instead.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## `yarn lingui`

Runs the [`lingui` CLI](https://lingui.js.org/tutorials/cli.html) with the given parameters.
For instance, if you want to extract messages to localize, you can run `yarn lingui extract`.

## `yarn contentful`

Some pages contain long-form rich text content that is localized via [Contentful](). The
latest versions of the content can be pulled by running this command. You'll want to make
sure you have the proper environment variables defined so this script can access your
Contentful space; see [`.env.local.sample`](./.env.local.sample) for more details.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
