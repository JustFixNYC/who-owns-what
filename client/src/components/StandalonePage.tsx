import React from "react";
import classNames from "classnames";
import { withI18n, withI18nProps } from "@lingui/react";
import { Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/StandalonePage.css";
import Page from "./Page";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { JFCLLocaleLink, LocaleLink } from "i18n";
import { Trans } from "@lingui/macro";
import { JFLogo } from "./JFLogo";

export const StandalonePageFooter = () => {
  const { home } = createWhoOwnsWhatRoutePaths();
  return (
    <Trans render="div" className="wow-footer">
      <JFCLLocaleLink to={home}>Who Owns What</JFCLLocaleLink> by JustFix.
      <br />
      Read our{" "}
      <JFCLLink
        href="https://www.justfix.org/en/privacy-policy/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy
      </JFCLLink>{" "}
      and{" "}
      <JFCLLink
        href="https://www.justfix.org/en/terms-of-use/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms of Service
      </JFCLLink>
    </Trans>
  );
};

type StandalonePageProps = withI18nProps & {
  title: string;
  className: string;
  children: React.ReactNode;
};

const StandalonePage = withI18n()((props: StandalonePageProps) => {
  const { title, className, children } = props;
  const { home } = createWhoOwnsWhatRoutePaths();
  return (
    <Page title={title}>
      <div className={classNames("StandalonePage Page", className)}>
        <div className="page-container">
          <LocaleLink className="jf-logo" to={home}>
            <JFLogo />
          </LocaleLink>
          <div className="standalone-container">{children}</div>
          <StandalonePageFooter />
        </div>
      </div>
    </Page>
  );
});

export default StandalonePage;
