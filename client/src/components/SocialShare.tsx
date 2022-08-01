import React from "react";
import { FacebookButton, TwitterButton, EmailButton } from "react-social";
import { isMobile, isAndroid } from "react-device-detect";

import fbIcon from "../assets/img/fb.svg";
import twitterIcon from "../assets/img/twitter.svg";
import { I18n, MessageDescriptor } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import { FB_APP_ID } from "./Page";
import { getSiteOrigin } from "../routes";
import { useLocation } from "react-router-dom";

export type SocialShareContent = {
  tweet: MessageDescriptor;
  /**
   * (Optional) This piece of text shows up at the end of the tweet,
   * *after* any url included in the message.
   */
  tweetCloseout?: MessageDescriptor;
  emailSubject: MessageDescriptor;
  getEmailBody: (url: string) => MessageDescriptor;
};

const defaultSocialContent: SocialShareContent = {
  tweet: t`Who’s responsible for issues in your apartment & building? #WhoOwnsWhat helps you research NYC property owners using public, open data. A free tool built by @JustFixNYC, it works on any device with an internet connection! Search your address here: `,
  emailSubject: t`All the public info on your landlord`,
  getEmailBody: (url: string) =>
    t`Who Owns What is a free tool built by JustFix to research property owners in NYC. It has helped over 200,000 New Yorkers find out who really owns their building, what other buildings that their landlord or management company owns, and other critical information about code violations, evictions, rent stabilized units, and so much more in any given building. You can look up any residential building located in NYC, even public housing (NYCHA) buildings! Search your address here: ${url}`,
};

export type SocialShareLocation =
  | "homepage"
  | "share-modal"
  | "overview-tab"
  | "summary-tab"
  | "not-registered-page"
  | "about-page"
  | "how-to-use"
  | "methodology";

type SocialShareProps = {
  i18n: I18n;
  location: SocialShareLocation;
  customUrl?: string;
  customContent?: SocialShareContent;
};

const SocialShareWithoutI18n: React.FC<SocialShareProps> = ({
  i18n,
  location,
  customUrl,
  customContent,
}) => {
  const content = customContent || defaultSocialContent;
  const localizedSiteOrigin = `${getSiteOrigin()}/${i18n.language}`;
  const url = customUrl || localizedSiteOrigin;

  return (
    <div className="btn-group btns-social btn-group-block">
      <FacebookButton
        onClick={() => {
          window.gtag("event", "facebook-" + location);
        }}
        className="btn btn-steps"
        sharer={true}
        windowOptions={["width=400", "height=200"]}
        url={url}
        appId={FB_APP_ID}
      >
        <img src={fbIcon} className="icon mx-1" alt="Facebook" />
        <span>Facebook</span>
      </FacebookButton>
      <TwitterButton
        onClick={() => {
          window.gtag("event", "twitter-" + location);
        }}
        className="btn btn-steps"
        windowOptions={["width=400", "height=200"]}
        url={url + (!!content.tweetCloseout ? ` ${i18n._(content.tweetCloseout)}` : "")}
        message={i18n._(content.tweet)}
      >
        <img src={twitterIcon} className="icon mx-1" alt="Twitter" />
        <span>Twitter</span>
      </TwitterButton>
      <EmailButton
        onClick={() => {
          window.gtag("event", "email-" + location);
        }}
        className="btn btn-steps"
        // NOTE: EmailButton components use the `url` prop for the full body of the email.
        url={i18n._(content.getEmailBody(url))}
        target="_blank"
        message={i18n._(content.emailSubject)}
      >
        <i className="icon icon-mail mx-2" />
        <Trans render="span">Email</Trans>
      </EmailButton>
      {isMobile && (
        <a
          className="btn btn-steps"
          onClick={() => {
            window.gtag("event", "twitter-" + location);
          }}
          href={"sms: " + (isAndroid ? "?" : "&") + "body=" + encodeURIComponent(url)}
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

const SocialShareAddressPageWithoutI18n: React.FC<SocialShareProps> = (props) => {
  const url = getSiteOrigin() + encodeURI(useLocation().pathname);
  return <SocialShareWithoutI18n {...props} customUrl={url} />;
};

export const SocialShareAddressPage = withI18n()(SocialShareAddressPageWithoutI18n);
