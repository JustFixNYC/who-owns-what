import React from "react";
import { FacebookButton, TwitterButton, EmailButton } from "react-social";
import { isMobile, isAndroid } from "react-device-detect";

import { I18n, MessageDescriptor, i18n } from "@lingui/core";
import { t } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import { FB_APP_ID } from "./Page";
import { getSiteOrigin } from "../routes";
import { useLocation } from "react-router-dom";
import { Button, IconPerson, IconMail, IconTwitter } from "@justfixnyc/component-library";

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

const _FacebookButton: React.FC = (props) => (
  <Button
  labelText={`Facebook (${i18n._("Opens in a new window")})`}
    variant="secondary"
    size="small"
    labelIcon={IconPerson}
    iconOnly
    {...props}
  />
);
const _TwitterButton: React.FC = (props) => (
  <Button
    labelText={`Twitter (${i18n._("Opens in a new window")})`}
    variant="secondary"
    size="small"
    labelIcon={IconTwitter}
    iconOnly
    {...props}
  />
);
const _EmailButton: React.FC = (props) => (
  <Button
    labelText={`${i18n._("Email")} (${i18n._("Opens in a new window")})`}
    variant="secondary"
    size="small"
    labelIcon={IconMail}
    iconOnly
    {...props}
  />
);

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
        sharer={true}
        windowOptions={["width=400", "height=200"]}
        url={url}
        appId={FB_APP_ID}
        element={_FacebookButton}
      />
      <TwitterButton
        onClick={() => {
          window.gtag("event", "twitter-" + location);
        }}
        windowOptions={["width=400", "height=200"]}
        url={url + (!!content.tweetCloseout ? ` ${i18n._(content.tweetCloseout)}` : "")}
        message={i18n._(content.tweet)}
        element={_TwitterButton}
      />
      <EmailButton
        onClick={() => {
          window.gtag("event", "email-" + location);
        }}
        // NOTE: EmailButton components use the `url` prop for the full body of the email.
        url={i18n._(content.getEmailBody(url))}
        target="_blank"
        message={i18n._(content.emailSubject)}
        element={_EmailButton}
      />
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
