import React, { Component } from 'react';
import {LocaleNavLink as NavLink} from '../i18n';

import 'styles/LegalFooter.css';
import { Trans } from '@lingui/macro';

class LegalFooter extends Component {
	render() {

		return (
		<div className="Footer LegalFooter">
          <span className="Byline"><Trans>Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/">JustFix.nyc</a></Trans></span>
          <nav className="inline">
            <a target="_blank" rel="noopener noreferrer" href="https://donorbox.org/donate-to-justfix-nyc"><Trans>Donate</Trans></a>
            <NavLink to="/terms-of-use"><Trans>Terms of use</Trans></NavLink>
            <NavLink to="/privacy-policy"><Trans>Privacy policy</Trans></NavLink><br />
            <a href="https://medium.com/@JustFixNYC/who-owns-what-linking-nyc-buildings-with-data-173571e7bb31" target="_blank" rel="noopener noreferrer"><Trans>Methodology</Trans></a>
            <a href="https://github.com/JustFixNYC/who-owns-what" target="_blank" rel="noopener noreferrer"><Trans>Source code</Trans></a>
          </nav>
        </div>)
	}
}

export default LegalFooter
