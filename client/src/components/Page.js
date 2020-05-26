import React, { useContext } from "react";
import { Helmet } from "react-helmet";
import { t } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import { i18n } from "@lingui/core";

const metadataWithoutI18n = () => {
  return {
    keywords: i18n._(t`pay rent, rent, can't pay rent, may rent, may 1`),
    description: i18n._(
      t`Use this free tool from JustFix.nyc to research your building and investigate landlords! We use property ownership mapping to identify a landlord's portfolio and provide data to indicate potential tenant harassment and displacement.`
    ),
    siteName: i18n._(t`Boop Who owns what in nyc?`),
  };
};

const metadata = withI18n()(metadataWithoutI18n);

const FB_APP_ID = "247990609143668";
const TWITTER_HANDLE = "@JustFixNYC";
const ORIGIN_URL = "https://whoownswhat.justfix.nyc/";
const SHARE_IMAGE_URL = "https://i.imgur.com/6WL74DZ.png";

const Page = (props) => {
  const title = props.title;
  const fullTitle = title ? `${title} | ${metadata().siteName}` : metadata().siteName;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />
      <meta name="description" content={metadata().description} />
      <meta name="keywords" content={metadata().keywords} />
      <meta name="author" content="JustFix.nyc" />
      <meta property="fb:app_id" content={FB_APP_ID} />}
      <meta property="og:site_name" content={metadata().siteName} />
      <meta property="og:description" content={metadata().description} />
      <meta property="og:url" content={ORIGIN_URL} />
      <meta property="og:image" content={SHARE_IMAGE_URL} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:description" content={metadata().description} />
      <meta name="twitter:url" content={ORIGIN_URL} />
      <meta name="twitter:image" content={SHARE_IMAGE_URL} />
      <meta name="twitter:image:alt" content={metadata().siteName} />
    </Helmet>
  );
};

{
  /* <AriaAnnouncement text={title} /> */
}
export default Page;
