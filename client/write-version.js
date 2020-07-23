/**
 * This file writes the current version of the UI, which
 * is just the git SHA hash, into the environment variables
 * used by Create React App, as well as in a file that
 * will be distributed along with the UI's static assets.
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const ENV_VAR_NAME = "REACT_APP_VERSION";
const ENV_FILE_NAME = ".env.production.local";
const VERSION_FILE_NAME = "public/version.txt";

const rev = child_process.execSync('git rev-parse HEAD', {
    encoding: 'utf-8'
}).trim();

console.log(`Writing ${ENV_VAR_NAME} to ${ENV_FILE_NAME}.`);

fs.writeFileSync(
    path.join(__dirname, ENV_FILE_NAME),
    `${ENV_VAR_NAME}="${rev}"`
);

console.log(`Writing ${VERSION_FILE_NAME}.`);

fs.writeFileSync(
    path.join(__dirname, ...VERSION_FILE_NAME.split('/')),
    rev
);
