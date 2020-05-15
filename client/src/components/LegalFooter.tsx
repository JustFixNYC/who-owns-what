import React, { Component } from "react";
import { LocaleNavLink as NavLink } from "../i18n";

import "styles/LegalFooter.css";
import { Trans } from "@lingui/macro";

class LegalFooter extends Component {
  render() {
    return (
      <div className="Footer LegalFooter container">
        <div className="columns">
          <div className="Disclaimer column col-8 col-md-12">
            <p>
              <Trans>
                Disclaimer: The information in JustFix.nyc does not constitute legal advice and must
                not be used as a substitute for the advice of a lawyer qualified to give advice on
                legal issues pertaining to housing. We can help direct you to free legal services if
                necessary.
              </Trans>
            </p>
            <p>
              <Trans>JustFix.nyc is a registered 501(c)(3) nonprofit organization.</Trans>
            </p>
          </div>
          <div className="Links column col-4 col-md-12">
            <div className="d-flex">
              <p>
                <Trans>
                  Made with NYC ♥ by the team at <a href="https://www.justfix.nyc/">JustFix.nyc</a>
                </Trans>
              </p>
              <nav className="inline">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://donorbox.org/donate-to-justfix-nyc"
                >
                  <Trans>Donate</Trans>
                </a>
                <NavLink to="/terms-of-use">
                  <Trans>Terms of use</Trans>
                </NavLink>
                <NavLink to="/privacy-policy">
                  <Trans>Privacy policy</Trans>
                </NavLink>
                <br className="hide-md" />
                <NavLink to="/how-it-works">
                  <Trans>Methodology</Trans>
                </NavLink>
                <a
                  href="https://github.com/JustFixNYC/who-owns-what"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trans>Source code</Trans>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LegalFooter;
