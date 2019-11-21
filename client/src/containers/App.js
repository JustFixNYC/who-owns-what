import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import { Trans } from '@lingui/macro';

import 'styles/App.css';

// import top-level containers (i.e. pages)
import { I18n, LocaleNavLink, LocaleLink as Link, LocaleSwitcher } from '../i18n';
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
        <I18n>
          <ScrollToTop>
            <div className="App">
              <div className="App__warning old_safari_only">
                <h3>Warning! This site doesn't fully work on older versions of Safari. Try a <a href="http://outdatedbrowser.com/en">modern browser</a>.</h3>
              </div>
              <div className="App__header">
                <Link onClick={() => {window.gtag('event', 'site-title');}} to="/">
                  <Trans render="h4">Who owns what in nyc?</Trans>
                </Link>
                <nav className="inline">
                  <LocaleNavLink exact to="/">Home</LocaleNavLink>
                  <LocaleNavLink to="/about">About</LocaleNavLink>
                  <LocaleNavLink to="/how-it-works">How it Works</LocaleNavLink>
                  <a href="https://www.justfix.nyc/donate">Donate</a>
                  <a href="#" // eslint-disable-line jsx-a11y/anchor-is-valid
                    onClick={() => this.setState({ showEngageModal: true })}>
                    Share
                  </a>
                  <LocaleSwitcher/>
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
                  <Route exact path="/:locale/" component={HomePage} />
                  <Route path="/:locale/address/:boro/:housenumber/:streetname" component={AddressPage} />
                  <Route path="/:locale/bbl/:boro/:block/:lot" component={BBLPage} />
                  <Route path="/:locale/bbl/:bbl" component={BBLPage} />
                  <Route path="/:locale/about" component={AboutPage} />
                  <Route path="/:locale/how-it-works" component={HowItWorksPage} />
                  <Route path="/:locale/terms-of-use" component={TermsOfUsePage} />
                  <Route path="/:locale/privacy-policy" component={PrivacyPolicyPage} />
                </Switch>
              </div>
            </div>
          </ScrollToTop>
        </I18n>
      </Router>
    );
  }
}
