import React, { Component } from "react";
import { LocaleNavLink as NavLink } from "../i18n";

import "styles/LegalFooter.css";
import { Trans } from "@lingui/macro";
import { createWhoOwnsWhatRoutePaths } from "../routes";

class LegalFooter extends Component {
  render() {
    const paths = createWhoOwnsWhatRoutePaths();
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
                <NavLink to={paths.termsOfUse}>
                  <Trans>Terms of use</Trans>
                </NavLink>
                <NavLink to={paths.privacyPolicy}>
                  <Trans>Privacy policy</Trans>
                </NavLink>
                <br className="hide-md" />
                <NavLink to={paths.methodology}>
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
              <div className="hide-md">
                <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://www.netlify.com/img/global/badges/netlify-dark.svg"
                    alt="Netlify"
                    width="75"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LegalFooter;
