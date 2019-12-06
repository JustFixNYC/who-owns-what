import React, { Component } from 'react';
import {LocaleNavLink as NavLink} from '../i18n';

import 'styles/LegalFooter.css';

class LegalFooter extends Component {
	render() {

		return (
		<div className="Footer LegalFooter">
          <span className="Byline">Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/">JustFix.nyc</a></span>
          <nav className="inline">
            <NavLink to="/terms-of-use">Terms of use</NavLink>
            <NavLink to="/privacy-policy">Privacy policy</NavLink>
            <a href="https://github.com/JustFixNYC/who-owns-what" target="_blank" rel="noopener noreferrer">View source code</a>
          </nav>
        </div>)
	}
}

export default LegalFooter
