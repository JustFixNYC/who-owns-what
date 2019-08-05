import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
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
import TermsOfUsePage from 'TermsOfUsePage';
import PrivacyPolicyPage from 'PrivacyPolicyPage';
import ScrollToTop from 'components/ScrollToTop';
import Modal from 'components/Modal';
import SocialShare from 'components/SocialShare';

export default class App extends Component {

constructor(props) {
    super(props);

    this.state = {
      showEngageModal: false
    }
  }

render() {
    return (
      <Router>
        <ScrollToTop>
          <div className="App">
            <div className="App__warning old_safari_only">
              <h3>Warning! This site doesn't fully work on older versions of Safari. Try a <a href="http://outdatedbrowser.com/en">modern browser</a>.</h3>
            </div>
            <div className="App__header">
              <Link onClick={() => {window.gtag('event', 'site-title');}} to="/">
                <h4>Who owns what in nyc?</h4>
              </Link>
              <nav className="inline">
                <NavLink exact to="/">Home</NavLink>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/how-it-works">How to use</NavLink>
                <a href="#" // eslint-disable-line jsx-a11y/anchor-is-valid
                  onClick={() => this.setState({ showEngageModal: true })}>
                  Share
                </a>
              </nav>
              <Modal
                showModal={this.state.showEngageModal}
                onClose={() => this.setState({ showEngageModal: false })}>
                  <h5 className="first-header">Share this page with your neighbors:</h5>
                  <SocialShare location="share-modal" />
              </Modal>
            </div>
            <div className="App__body">
              <Switch>
                <Route exact path="/" component={HomePage} />
                <Route path="/address/:boro/:housenumber/:streetname" component={AddressPage} />
                <Route path="/bbl/:boro/:block/:lot" component={BBLPage} />
                <Route path="/bbl/:bbl" component={BBLPage} />
                <Route path="/about" component={AboutPage} />
                <Route path="/how-it-works" component={HowItWorksPage} />
                <Route path="/terms-of-use" component={TermsOfUsePage} />
                <Route path="/privacy-policy" component={PrivacyPolicyPage} />
              </Switch>
            </div>
          </div>
        </ScrollToTop>
      </Router>
    );
  }
}
