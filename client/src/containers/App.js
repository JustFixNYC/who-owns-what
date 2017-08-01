import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Link
} from 'react-router-dom'

import 'styles/App.css';

// import top-level containers (i.e. pages)
import HomePage from 'HomePage';
import AddressPage from 'AddressPage';
import AboutPage from 'AboutPage';
import HowItWorksPage from 'HowItWorksPage';

const App = () => {
  return (
    <Router>
      <div className="App">
        <div className="App__header">
          <Link to="/">
            <h4>Who owns what in nyc?</h4>
          </Link>
          <nav className="inline">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/how-it-works">How it Works</NavLink>
          </nav>
        </div>
        <div className="App__body">
          <Route exact path="/" component={HomePage} />
          <Route path="/address/:boro/:housenumber/:streetname" component={AddressPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
        </div>
      </div>
    </Router>
  );
}

export default App;
