import React from "react";
import classNames from "classnames";
import { withI18n, withI18nProps } from "@lingui/react";

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

export const JustFixLogoLink = (props: { eventParams: any }) => {
  const { home } = createWhoOwnsWhatRoutePaths();

  return (
    <LocaleLink
      className="jf-logo"
      to={home}
      onClick={() => {
        window.gtag("event", "standalone-justfix-logo-click", { ...props.eventParams });
      }}
    >
      <JFLogo />
    </LocaleLink>
  );
};

export const StandalonePageFooter = (props: { eventParams: any }) => {
  const { home, privacyPolicy, termsOfUse } = createWhoOwnsWhatRoutePaths();

  return (
    <Trans render="div" className="wow-footer">
      <JFCLLocaleLink
        to={home}
        onClick={() => {
          window.gtag("event", "standalone-wow-link-click", { ...props.eventParams });
        }}
      >
        Who Owns What
      </JFCLLocaleLink>{" "}
      by JustFix.
      <br />
      Read our{" "}
      <JFCLLocaleLink to={privacyPolicy} target="_blank" rel="noopener noreferrer">
        Privacy Policy
      </JFCLLocaleLink>{" "}
      and{" "}
      <JFCLLocaleLink to={termsOfUse} target="_blank" rel="noopener noreferrer">
        Terms of Service
      </JFCLLocaleLink>
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
  const eventParams = { from: pageName };

  return (
    <Page title={title}>
      <div className={classNames("StandalonePage Page", className)}>
        <div className="page-container">
          <JustFixLogoLink eventParams={eventParams} />
          <div className="standalone-container">{children}</div>
          <StandalonePageFooter eventParams={eventParams} />
        </div>
      </div>
    </Page>
  );
});

export default StandalonePage;
