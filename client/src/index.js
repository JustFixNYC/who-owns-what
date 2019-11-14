import 'react-app-polyfill/ie11';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App';
import { I18nProvider } from '@lingui/react'
// import registerServiceWorker from './registerServiceWorker';
import 'styles/spectre.css';
import 'styles/index.css';

ReactDOM.render(
  <I18nProvider language="en"><App /></I18nProvider>,
  document.getElementById('root')
);
// registerServiceWorker();
