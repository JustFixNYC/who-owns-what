import 'react-app-polyfill/ie11';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App';
import { I18nProvider } from '@lingui/react'
import { defaultI18nRender } from './default-i18n-render';

// import registerServiceWorker from './registerServiceWorker';
import 'styles/spectre.css';
import 'styles/index.css';

ReactDOM.render(
  <I18nProvider language="en" defaultRender={defaultI18nRender}><App /></I18nProvider>,
  document.getElementById('root')
);
// registerServiceWorker();
