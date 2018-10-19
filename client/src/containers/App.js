import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Link
} from 'react-router-dom';

import 'styles/App.css';

// import top-level containers (i.e. pages)
import HomePage from 'HomePage';
import AddressPage from 'AddressPage';
import BBLPage from 'BBLPage';
import AboutPage from 'AboutPage';
import HowItWorksPage from 'HowItWorksPage';
import NotRegisteredPage from 'NotRegisteredPage';
import TermsOfUsePage from 'TermsOfUsePage';
import PrivacyPolicyPage from 'PrivacyPolicyPage';
import ScrollToTop from 'components/ScrollToTop';

const App = () => {
  return (
    <Router>
      <ScrollToTop>
      <div className="App">
        <div className="App__warning old_safari_only">
          <h3>Warning! This site doesn't fully work on older versions of Safari. Try a <a href="http://outdatedbrowser.com/en">modern browser</a>.</h3>
        </div>
        <div className="App__header">
          <Link to="/">
            <h4>Who owns what in nyc?</h4>
          </Link>
          <nav className="inline">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/how-it-works">How it Works</NavLink>
            {
              // <Link className="btn" to="/">
              //   New Search
              // </Link>
            }
            <a href="https://www.justfix.nyc/donate" target="_blank">Donate</a>  
          </nav>
        </div>
        <div className="App__body">
          <Route exact path="/" component={HomePage} />
          <Route path="/not-found" component={NotRegisteredPage} />
          <Route path="/address/:boro/:housenumber/:streetname" component={AddressPage} />
          <Route path="/bbl/:boro/:block/:lot" component={BBLPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/terms-of-use" component={TermsOfUsePage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        </div>
      </div>
      </ScrollToTop>
    </Router>
  );
}

export default App;
