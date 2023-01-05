import React, { useEffect, useState } from "react";
import { Trans } from "@lingui/macro";
import Modal from "./Modal";
import networkDiagram from "../assets/img/network-diagram.png";
import { logAmplitudeEvent } from "./Amplitude";
import { CloseButton } from "./CloseButton";
import classNames from "classnames";

export const PORTFOLIO_SIZE_THRESHOLD = 300;

type MapBannerProps = {
  message: React.ReactNode | string;
  buttonText?: React.ReactNode | string;
  buttonOnClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export const MapBanner = ({
  message,
  buttonText,
  buttonOnClick,
  className,
  children,
}: MapBannerProps) => {
  const [isBanerClosed, setBanerClosed] = useState(false);

  return !isBanerClosed ? (
    <div className={classNames("MapBanner", className)}>
      <span className="MapBanner__message">
        {message} <br />
        {!!buttonText ? <button onClick={buttonOnClick}>{buttonText}</button> : <></>}
      </span>
      <div>
        <CloseButton onClick={() => setBanerClosed(true)} />
      </div>
      {children}
    </div>
  ) : (
    <></>
  );
};

type BigPortfolioBannerProps = {
  sizeOfPortfolio: number;
  className?: number;
};

export const BigPortfolioBanner = ({ sizeOfPortfolio, className }: BigPortfolioBannerProps) => {
  const [isLearnMoreModalVisible, setModalVisibility] = useState(false);

  // Preload modal image when BigPortfolioBanner mounts:
  useEffect(() => {
    new Image().src = networkDiagram;
  }, []);

  return sizeOfPortfolio > PORTFOLIO_SIZE_THRESHOLD ? (
    <MapBanner
      className={classNames("BigPortfolioBanner", className)}
      message={<Trans>Why am I seeing such a big portfolio?</Trans>}
      buttonText={<Trans>Learn more</Trans>}
      buttonOnClick={() => {
        logAmplitudeEvent("learnWhyPortfolioSoBig");
        window.gtag("event", "learn-why-portfolio-so-big");
        setModalVisibility(true);
      }}
    >
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
            Some large corporations, however, are a bit more complicated and may share personnel and
            financial stake with other related companies, which all will show up on Who Owns What as
            one large portfolio.
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
    </MapBanner>
  ) : (
    <></>
  );
};
