import React from "react";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import warning from "../assets/img/icon-warning.svg";

export const PORTFOLIO_SIZE_THRESHOLD = 300;

type BigPortfolioWarningProps = withI18nProps & {
  size: number;
};

export const BigPortfolioWarning = withI18n()(({ i18n, size }: BigPortfolioWarningProps) => {
  return size > PORTFOLIO_SIZE_THRESHOLD ? (
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
  ) : (
    <></>
  );
});
