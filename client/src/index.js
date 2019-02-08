import 'react-app-polyfill/ie11';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App';
// import registerServiceWorker from './registerServiceWorker';
import 'styles/spectre.css';
import 'styles/index.css';

ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();
