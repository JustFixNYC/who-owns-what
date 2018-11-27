import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
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
import Subscribe from 'components/Subscribe';

import fbIcon from '../assets/img/fb.svg';
import twitterIcon from '../assets/img/twitter.svg';

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
            <Link to="/">
              <h4>Who owns what in nyc?</h4>
            </Link>
            <nav className="inline">
              <NavLink exact to="/">Home</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/how-it-works">How it Works</NavLink>
              {
                // <Link className="btn" to="/">
                //   New Search
                // </Link>
              }
              <a href="https://www.justfix.nyc/donate" target="_blank">Donate</a>
              <a href="#" onClick={() => this.setState({ showEngageModal: true })}>
                Share
              </a>
            </nav>
            <Modal
              showModal={this.state.showEngageModal}
              onClose={() => this.setState({ showEngageModal: false })}>
                <h5 className="first-header">Share this tool with your neighbors:</h5>
                <div className="btn-group btns-social btn-group-block">
                  <FacebookButton
                    className="btn btn-steps"
                    sharer={true}
                    windowOptions={['width=400', 'height=200']}
                    url='https://whoownswhat.justfix.nyc/'
                    appId={`247990609143668`}
                    message={"How 'small' and 'local' really is your landlord... #WhoOwnsWhat @JustFixNYC"}>
                    <img src={fbIcon} className="icon mx-1" alt="Facebook" />
                    <span>Facebook</span>
                  </FacebookButton>
                  <TwitterButton
                    className="btn btn-steps"
                    windowOptions={['width=400', 'height=200']}
                    url='https://whoownswhat.justfix.nyc/'
                    message={"How 'small' and 'local' really is your landlord... #WhoOwnsWhat @JustFixNYC"}>
                    <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
                    <span>Twitter</span>
                  </TwitterButton>
                  <EmailButton
                    className="btn btn-steps"
                    url='https://whoownswhat.justfix.nyc/'
                    target="_blank"
                    message="New JustFix.nyc tool helps research on NYC landlords">
                    <i className="icon icon-mail mx-2" />
                    <span>Email</span>
                  </EmailButton>
                </div>
            </Modal>
          </div>
          <div className="App__body">
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route path="/not-found" component={NotRegisteredPage} />
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
