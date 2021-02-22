import React from "react";
import { FacebookButton, TwitterButton, EmailButton } from "react-social";
import { isMobile, isAndroid } from "react-device-detect";

import fbIcon from "../assets/img/fb.svg";
import twitterIcon from "../assets/img/twitter.svg";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import { FB_APP_ID } from "./Page";
import { Borough } from "./APIDataTypes";
import { getSiteOrigin, createAddressPageRoutes } from "../routes";

const DEFAULT_TWEET = t`Who’s responsible for issues in your apartment and building? Use #WhoOwnsWhat, a free tool to research property owners in NYC using public, open data. Built by @JustFixNYC, it functions on any device with an internet connection. Search your address here: `;
const DEFAULT_EMAIL_SUBJECT = t`All the public info on your landlord`;
const getDefaultEmailBody = (url: string) =>
  t`Who Owns What is a free tool built by JustFix.nyc to research property owners in NYC. It has helped over 200,000 New Yorkers find out who really owns their buildings, what other buildings that their landlord or management company owns, and other critical information about code violations, evictions, rent stabilized units, and so much more in any given building. You can look up any residential building located in NYC, even public housing (NYCHA) buildings! Search your address here: ${url}.`;

const SocialShareWithoutI18n: React.FC<{
  i18n: I18n;
  location?: string;
  url?: string;
  twitterMessage?: string;
  /**
   * (Optional) This piece of text shows up at the end of the tweet,
   * *after* any url included in the message.
   */
  tweetCloseout?: string;
  emailSubject?: string;
  emailBody?: string;
}> = (props) => {
  const { i18n } = props;

  const localizedSiteOrigin = `${getSiteOrigin()}/${i18n.language}`;

  return (
    <div className="btn-group btns-social btn-group-block">
      <FacebookButton
        onClick={() => {
          window.gtag("event", "facebook-" + props.location);
        }}
        className="btn btn-steps"
        sharer={true}
        windowOptions={["width=400", "height=200"]}
        url={props.url || localizedSiteOrigin}
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
        url={
          (props.url || localizedSiteOrigin) + (!!props.tweetCloseout && ` ${props.tweetCloseout}`)
        }
        message={props.twitterMessage || i18n._(DEFAULT_TWEET)}
      >
        <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
        <span>Twitter</span>
      </TwitterButton>
      <EmailButton
        onClick={() => {
          window.gtag("event", "email-" + props.location);
        }}
        className="btn btn-steps"
        // NOTE: EmailButton components use the `url` prop for the full body of the email.
        url={props.emailBody || i18n._(getDefaultEmailBody(localizedSiteOrigin))}
        target="_blank"
        message={props.emailSubject || i18n._(DEFAULT_EMAIL_SUBJECT)}
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
            encodeURIComponent(props.url || localizedSiteOrigin)
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
  location: "overview-tab" | "summary-tab";
  addr: { boro: Borough; housenumber?: string; streetname: string };
  buildings?: number;
  portfolioViolations?: number;
  violationsPerUnit?: number;
}> = ({ i18n, location, addr, buildings = 0, portfolioViolations = 0, violationsPerUnit = 0 }) => {
  const routes = createAddressPageRoutes(addr);
  const path = location === "summary-tab" ? routes.summary : routes.overview;
  const url = getSiteOrigin() + path;
  return (
    <SocialShareWithoutI18n
      i18n={i18n}
      location={location}
      url={url}
      twitterMessage={
        location === "summary-tab"
          ? i18n._(
              t`This landlord owns ${buildings} buildings, and according to @NYCHousing, has received a total of ${portfolioViolations} violations. See more data analysis here: `
            )
          : i18n._(
              t`I used #WhoOwnsWhat (built by @JustFixNYC) to see not only the open violations in this building, but also rent stabilized losses, evictions, and more. This website is a wealth of info and costs nothing to use. Savvy New Yorkers need this info: `
            )
      }
      tweetCloseout={
        location === "summary-tab" ? i18n._(t`#WhoOwnsWhat via @JustFixNYC`) : undefined
      }
      emailSubject={
        location === "summary-tab"
          ? i18n._(
              t` This landlord’s buildings average ${violationsPerUnit} open HPD violations per apartment`
            )
          : i18n._(`Check out the issues in this building`)
      }
      emailBody={
        location === "summary-tab"
          ? i18n._(
              t`I was checking out this building on Who Owns What, a free landlord research tool from JustFix.nyc. It’s a remarkable website that every tenant and housing advocate should know about! Can you guess how many total violations this landlord portfolio has? Check it out here: ${url}.`
            )
          : i18n._(
              t`I just looked up this building on Who Owns What, a free tool built by JustFix.nyc to make data on landlords and evictors more transparent to tenants. You might want to look up your building. Check it out here: ${url}.`
            )
      }
    />
  );
};

export const SocialSharePortfolio = withI18n()(SocialSharePortfolioWithoutI18n);
