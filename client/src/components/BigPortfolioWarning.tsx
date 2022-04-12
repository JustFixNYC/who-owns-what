import React from "react";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import warning from "../assets/img/icon-warning.svg";

export const BigPortfolioWarning = withI18n()(({ i18n }: withI18nProps) => {
  return (
    <div className="warning-banner">
      <div className="float-left">
        <img src={warning} className="icon" alt={i18n._(t`Warning`)} />
        <span className="warning">
          <Trans>
            This diagram may show a network of portfolios. <button>Learn more.</button>
          </Trans>
        </span>
      </div>
    </div>
  );
});
