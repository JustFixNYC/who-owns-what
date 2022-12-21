import React, { useEffect, useState } from "react";
import { Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import Modal from "./Modal";
import networkDiagram from "../assets/img/network-diagram.png";
import { logAmplitudeEvent } from "./Amplitude";
import { CloseButton } from "./CloseButton";

export const PORTFOLIO_SIZE_THRESHOLD = 300;

type BigPortfolioWarningProps = withI18nProps & {
  sizeOfPortfolio: number;
};

export const BigPortfolioWarning = withI18n()(
  ({ i18n, sizeOfPortfolio }: BigPortfolioWarningProps) => {
    const [isLearnMoreModalVisible, setModalVisibility] = useState(false);
    const [isWarningClosed, setWarningClosed] = useState(false);

    // Preload modal image when BigPortfolioWarning mounts:
    useEffect(() => {
      new Image().src = networkDiagram;
    }, []);

    return sizeOfPortfolio > PORTFOLIO_SIZE_THRESHOLD && !isWarningClosed ? (
      <div className="warning-banner">
        <div className="warning-banner-inner">
          <div className="float-left">
            <span className="warning">
              <Trans>Why am I seeing such a big portfolio?</Trans> <br />
              <button
                onClick={() => {
                  logAmplitudeEvent("learnWhyPortfolioSoBig");
                  window.gtag("event", "learn-why-portfolio-so-big");
                  setModalVisibility(true);
                }}
              >
                <Trans>Learn more</Trans>
              </button>
            </span>
          </div>
          <div>
            <CloseButton onClick={() => setWarningClosed(true)} />
          </div>
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
              We’ve improved Who Owns What to dig deeper into the data and offer you a more complete
              picture of buildings associated with your landlord.{" "}
              <a
                href="https://medium.com/justfixorg/untangling-nycs-web-of-real-estate-who-owns-what-s-latest-release-b22aac917617"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more in our methodology article
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
