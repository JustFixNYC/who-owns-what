import "react-app-polyfill/ie11";
import "babel-polyfill";

import React from "react";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import App from "containers/App.tsx";
import { getBrowserName } from "util/helpers";

// import registerServiceWorker from './registerServiceWorker';
import "styles/spectre.css";
import "styles/index.css";

document.documentElement.setAttribute("data-browser", getBrowserName(navigator.userAgent));

const root = document.getElementById("root");
Modal.setAppElement(root);

ReactDOM.render(<App />, root);
// registerServiceWorker();
