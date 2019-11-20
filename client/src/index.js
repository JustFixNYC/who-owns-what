import 'react-app-polyfill/ie11';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App';
import { I18nProvider } from '@lingui/react'
import { defaultI18nRender } from './default-i18n-render';
import catalogEn from './locales/en/messages';
import catalogEs from './locales/es/messages';

// import registerServiceWorker from './registerServiceWorker';
import 'styles/spectre.css';
import 'styles/index.css';

const catalogs = {
  en: catalogEn,
  es: catalogEs,
};

ReactDOM.render(
  // TODO: We need to provide some affordance that allows the user to change the language.
  // For now, developers can manually change the "language" prop below.
  <I18nProvider language="en" catalogs={catalogs} defaultRender={defaultI18nRender}><App /></I18nProvider>,
  document.getElementById('root')
);
// registerServiceWorker();
