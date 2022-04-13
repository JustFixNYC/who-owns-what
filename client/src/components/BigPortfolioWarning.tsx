import React, { useState } from "react";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import warning from "../assets/img/icon-warning.svg";
import Modal from "./Modal";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { Link } from "react-router-dom";

export const PORTFOLIO_SIZE_THRESHOLD = 300;

type BigPortfolioWarningProps = withI18nProps & {
  sizeOfPortfolio: number;
};

export const BigPortfolioWarning = withI18n()(
  ({ i18n, sizeOfPortfolio }: BigPortfolioWarningProps) => {
    const { methodology } = createWhoOwnsWhatRoutePaths();
    const [isLearnMoreModalVisible, setModalVisibility] = useState(false);
    return sizeOfPortfolio > PORTFOLIO_SIZE_THRESHOLD ? (
      <div className="warning-banner">
        <div className="float-left">
          <img src={warning} className="icon" alt={i18n._(t`Warning`)} />
          <span className="warning">
            <Trans>
              This portfolio may consist of several related companies.{" "}
              <button onClick={() => setModalVisibility(true)}>Learn more</button>
            </Trans>
          </span>
        </div>
        <Modal showModal={isLearnMoreModalVisible} onClose={() => setModalVisibility(false)}>
          <h5 className="first-header">
            <Trans>Why am I seeing such a big portfolio?</Trans>
          </h5>
          <p>
            <Trans>
              Our new version of Who Owns What digs deeper to find all possible entities associated
              with the landlord of your building. When two landlords share the same business
              address, we group them as part of the same portfolio. Some large corporations,
              however, are a bit more complicated and may share personnel and financial stake with
              other related companies, which all will show up on Who Owns What as one large
              portfolio.
            </Trans>
          </p>
          <p>
            <Link to={methodology}>
              <Trans>Read more on our Methodology page</Trans>
            </Link>
          </p>
        </Modal>
      </div>
    ) : (
      <></>
    );
  }
);
