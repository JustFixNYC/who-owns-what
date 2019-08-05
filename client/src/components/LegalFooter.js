import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';

import 'styles/LegalFooter.css';

class LegalFooter extends Component {
	render() {

		return (
		<div className="Footer LegalFooter">
          <span className="Byline">Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/">JustFix.nyc</a></span>
          <nav className="inline">
            <a target="_blank" rel="noopener noreferrer" href="https://www.justfix.nyc/donate">Donate</a>
            <NavLink to="/terms-of-use">Terms of use</NavLink>
            <NavLink to="/privacy-policy">Privacy policy</NavLink>
            <NavLink to="/how-it-works">Methodology</NavLink>
            <a href="https://github.com/JustFixNYC/who-owns-what" target="_blank" rel="noopener noreferrer">Source code</a>
          </nav>
        </div>)
	}
}

export default LegalFooter
