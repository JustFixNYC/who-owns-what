import React, { Component } from 'react';
import {LocaleNavLink as NavLink} from '../i18n';

import 'styles/LegalFooter.css';
import { Trans } from '@lingui/macro';

class LegalFooter extends Component {
	render() {
		return (
		<div className="Footer LegalFooter">

      <div className="Links">
        <span className="Byline"><Trans>Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/">JustFix.nyc</a></Trans></span>
        <nav className="inline">
          <a target="_blank" rel="noopener noreferrer" href="https://donorbox.org/donate-to-justfix-nyc"><Trans>Donate</Trans></a>
          <NavLink to="/terms-of-use"><Trans>Terms of use</Trans></NavLink>
          <NavLink to="/privacy-policy"><Trans>Privacy policy</Trans></NavLink><br />
          <a href="https://medium.com/@JustFixNYC/who-owns-what-linking-nyc-buildings-with-data-173571e7bb31" target="_blank" rel="noopener noreferrer"><Trans>Methodology</Trans></a>
          <a href="https://github.com/JustFixNYC/who-owns-what" target="_blank" rel="noopener noreferrer"><Trans>Source code</Trans></a>
        </nav>
      </div>

    <div className="Disclaimer">
      <p className="text-italic">Disclaimer: The information in JustFix.nyc does not constitute legal advice and must not be used as a substitute for the advice of a lawyer qualified to give advice on legal issues pertaining to housing. 
          We can help direct you to free legal services if necessary.</p>
      <p className="text-italic">JustFix.nyc is a registered 501(c)(3) nonprofit organization.</p>
    </div>

  </div>)
	}
}

export default LegalFooter
