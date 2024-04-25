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
import { useLocation } from "react-router-dom";

export const STANDALONE_PAGES = [
  "forgot-password",
  "login",
  "verify-email",
  "forgot-password",
  "reset-password",
  "unsubscribe",
];

export const JustFixLogoLink = (eventParams: any) => {
  const { home } = createWhoOwnsWhatRoutePaths();

  return (
    <LocaleLink
      className="jf-logo"
      to={home}
      onClick={() => {
        window.gtag("event", "standalone-justfix-logo-click", { ...eventParams });
      }}
    >
      <JFLogo />
    </LocaleLink>
  );
};

export const StandalonePageFooter = (eventParams: any) => {
  const { home } = createWhoOwnsWhatRoutePaths();

  return (
    <Trans render="div" className="wow-footer">
      <JFCLLocaleLink
        to={home}
        onClick={() => {
          window.gtag("event", "standalone-wow-link-click", { ...eventParams });
        }}
      >
        Who Owns What
      </JFCLLocaleLink>{" "}
      by JustFix.
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
  const { pathname } = useLocation();
  const pageName = STANDALONE_PAGES.find((x) => pathname.includes(x));

  return (
    <Page title={title}>
      <div className={classNames("StandalonePage Page", className)}>
        <div className="page-container">
          <JustFixLogoLink eventParams={{ from: pageName }} />
          <div className="standalone-container">{children}</div>
          <StandalonePageFooter eventParams={{ from: pageName }} />
        </div>
      </div>
    </Page>
  );
});

export default StandalonePage;
