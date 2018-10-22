import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Link
} from 'react-router-dom';
import { FacebookButton, TwitterButton, EmailButton } from 'react-social';

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
import Modal from 'components/Modal';

import fbIcon from '../assets/img/fb.svg';
import twitterIcon from '../assets/img/twitter.svg';

export default class App extends Component {

constructor(props) {
    super(props);

    this.state = {
      showShareModal: false
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
            <Link to="/">
              <h4>Who owns what in nyc?</h4>
            </Link>
            <nav className="inline">
              <a href="#" onClick={() => this.setState({ showShareModal: true })}>
                Share
              </a>
              <a href="https://www.justfix.nyc/donate" target="_blank">Donate</a>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/how-it-works">How it Works</NavLink>
              {
                // <Link className="btn" to="/">
                //   New Search
                // </Link>
              }
            </nav>
            <Modal
              showModal={this.state.showShareModal}
              onClose={() => this.setState({ showShareModal: false })}>
                <h5>Share this page with your neighbors:</h5>
                <div className="btn-group btns-social btn-group-block">
                  <FacebookButton 
                    className="btn btn-steps"
                    sharer={true}
                    url='https://whoownswhat.justfix.nyc/'
                    appId={`247990609143668`}
                    message={"How 'small' and 'local' really is your landlord... #WhoOwnsWhat @JustFixNYC"}>
                    <img src={fbIcon} className="icon mx-1" alt="Facebook" />
                    <span>Facebook</span>
                  </FacebookButton>
                  <TwitterButton 
                    className="btn btn-steps"
                    url='https://whoownswhat.justfix.nyc/'
                    message={"How 'small' and 'local' really is your landlord... #WhoOwnsWhat @JustFixNYC"}>
                    <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
                    <span>Twitter</span>
                  </TwitterButton>
                  <EmailButton 
                    className="btn btn-steps"
                    url='https://whoownswhat.justfix.nyc/'
                    target="_blank"
                    message="New JustFix tool helps research on NYC landlords">
                    <i className="icon icon-mail mx-2" />
                    <span>Email</span>
                  </EmailButton>
                </div>
            </Modal>
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
}
