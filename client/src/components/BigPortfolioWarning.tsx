import React, { useEffect, useState } from "react";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import warning from "../assets/img/icon-warning.svg";
import Modal from "./Modal";
import { createWhoOwnsWhatRoutePaths } from "routes";

import networkDiagram from "../assets/img/network-diagram.png";

export const PORTFOLIO_SIZE_THRESHOLD = 300;

type BigPortfolioWarningProps = withI18nProps & {
  sizeOfPortfolio: number;
};

export const BigPortfolioWarning = withI18n()(
  ({ i18n, sizeOfPortfolio }: BigPortfolioWarningProps) => {
    const { methodology } = createWhoOwnsWhatRoutePaths();
    const [isLearnMoreModalVisible, setModalVisibility] = useState(false);

    // Preload modal image when BigPortfolioWarning mounts:
    useEffect(() => {
      new Image().src = networkDiagram;
    }, []);

    return sizeOfPortfolio > PORTFOLIO_SIZE_THRESHOLD ? (
      <div className="warning-banner">
        <div className="float-left">
          <img src={warning} className="icon" alt={i18n._(t`Warning`)} />
          <span className="warning">
            <Trans>Why am I seeing such a big portfolio?</Trans>{" "}
            <button onClick={() => setModalVisibility(true)}>
              <Trans>Learn more</Trans>
            </button>
          </span>
        </div>
        <Modal showModal={isLearnMoreModalVisible} onClose={() => setModalVisibility(false)}>
          <h5 className="first-header">
            <Trans>Why am I seeing such a big portfolio?</Trans>
          </h5>
          <p>
            <Trans>
              When two parties share the same business address, we group them as part of the same
              portfolio.
            </Trans>
          </p>
          <p className="is-marginless">
            <Trans>
              Some large corporations, however, are a bit more complicated and may share personnel
              and financial stake with other related companies, which all will show up on Who Owns
              What as one large portfolio.
            </Trans>
          </p>
          <br />
          <img className="img-responsive" src={networkDiagram} alt="" />
          <br />
          <p>
            <Trans>
              We’ve been making improvements to Who Owns What to dig deeper and find a more complete
              picture of your landlord's network.{" "}
              <a
                href={
                  methodology // TODO: Replace link with medium article
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more on our Methodology page
              </a>
            </Trans>
          </p>
        </Modal>
      </div>
    ) : (
      <></>
    );
  }
);
