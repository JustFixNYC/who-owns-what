import React from "react";
import { FacebookButton, TwitterButton, EmailButton } from "react-social";
import { isMobile, isAndroid } from "react-device-detect";

import fbIcon from "../assets/img/fb.svg";
import twitterIcon from "../assets/img/twitter.svg";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import helpers, { MaybeStringyNumber } from "../util/helpers";
import { FB_APP_ID } from "./Page";
import { Borough } from "./APIDataTypes";

const SocialShareWithoutI18n: React.FC<{
  i18n: I18n;
  location?: string;
  url?: string;
  twitterMessage?: string;
  emailMessage?: string;
}> = (props) => {
  const { i18n } = props;

  return (
    <div className="btn-group btns-social btn-group-block">
      <FacebookButton
        onClick={() => {
          window.gtag("event", "facebook-" + props.location);
        }}
        className="btn btn-steps"
        sharer={true}
        windowOptions={["width=400", "height=200"]}
        url={props.url || "https://whoownswhat.justfix.nyc/"}
        appId={FB_APP_ID}
      >
        <img src={fbIcon} className="icon mx-1" alt="Facebook" />
        <span>Facebook</span>
      </FacebookButton>
      <TwitterButton
        onClick={() => {
          window.gtag("event", "twitter-" + props.location);
        }}
        className="btn btn-steps"
        windowOptions={["width=400", "height=200"]}
        url={props.url || "https://whoownswhat.justfix.nyc/"}
        message={props.twitterMessage || `#WhoOwnsWhat @JustFixNYC`}
      >
        <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
        <span>Twitter</span>
      </TwitterButton>
      <EmailButton
        onClick={() => {
          window.gtag("event", "email-" + props.location);
        }}
        className="btn btn-steps"
        url={props.url || "https://whoownswhat.justfix.nyc/"}
        target="_blank"
        message={
          props.emailMessage || i18n._(t`New JustFix.nyc tool helps research on NYC landlords`)
        }
      >
        <i className="icon icon-mail mx-2" />
        <Trans render="span">Email</Trans>
      </EmailButton>
      {isMobile && (
        <a
          className="btn btn-steps"
          onClick={() => {
            window.gtag("event", "twitter-" + props.location);
          }}
          href={
            "sms: " +
            (isAndroid ? "?" : "&") +
            "body=" +
            encodeURIComponent(props.url || "https://whoownswhat.justfix.nyc/")
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          SMS
        </a>
      )}
    </div>
  );
};

const SocialShare = withI18n()(SocialShareWithoutI18n);

export default SocialShare;

const SocialSharePortfolioWithoutI18n: React.FC<{
  i18n: I18n;
  location?: string;
  addr: { boro: Borough; housenumber: string | null; streetname: string };
  buildings: MaybeStringyNumber;
}> = ({ i18n, location, addr, buildings }) => {
  const buildingCount = helpers.coerceToInt(buildings, 0);
  return (
    <SocialShareWithoutI18n
      i18n={i18n}
      location={location}
      url={encodeURI(
        `https://whoownswhat.justfix.nyc${createRouteForAddressPage(
          addr.boro,
          addr.streetname,
          addr.housenumber
        )}${location === "summary-tab" ? "/summary" : ""}`
      ).replace(" ", "%20")} // Support for Android
      twitterMessage={i18n._(
        t`The ${buildingCount} buildings that my landlord "owns" 👀... #WhoOwnsWhat @JustFixNYC`
      )}
      emailMessage={i18n._(
        t`The ${buildingCount} buildings owned by my landlord (via JustFix's Who Owns What tool)`
      )}
    />
  );
};

export const SocialSharePortfolio = withI18n()(SocialSharePortfolioWithoutI18n);
