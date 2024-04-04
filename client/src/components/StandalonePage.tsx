import React from "react";
import classNames from "classnames";
import { withI18n, withI18nProps } from "@lingui/react";

import "styles/StandalonePage.css";
import Page from "./Page";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { JFCLLocaleLink } from "i18n";
import { Trans } from "@lingui/macro";
import { JFLogo } from "./JFLogo";

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
          <JFLogo />
          <div className="standalone-container">{children}</div>
          <Trans render="div" className="wow-footer">
            <JFCLLocaleLink to={home}>Who Owns What</JFCLLocaleLink> by JustFix
          </Trans>
        </div>
      </div>
    </Page>
  );
});

export default StandalonePage;
