import React from "react";
import { Helmet } from "react-helmet";
import { t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import helpers from "../util/helpers";

const metadata = {
  keywords: t`Landlord, Portfolio, Tenant, Displacement, Map, JustFix, NYC, New York, Housing, Who Owns What`,
  description: t`Use this free tool from JustFix.nyc to research your building and investigate landlords! We use property ownership mapping to identify a landlord's portfolio and provide data to indicate potential tenant harassment and displacement.`,
  siteName: t`Who owns what in nyc?`,
};

const FB_APP_ID = "247990609143668";
const TWITTER_HANDLE = "@JustFixNYC";
const ORIGIN_URL = "https://whoownswhat.justfix.nyc/";
const SHARE_IMAGE_URL = "https://i.imgur.com/6WL74DZ.png";

type PageProps = {
  title?: string;
  children: React.ReactNode;
};

const Page = withI18n()((props: PageProps & withI18nProps) => {
  const i18n = props.i18n;
  const title = props.title && helpers.titleCase(props.title.trim());
  const fullTitle = title
    ? `${title} | ${i18n._(t`Who owns what in nyc?`)}`
    : i18n._(t`Who owns what in nyc?`);

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
        <meta property="og:title" content={title} />
        <meta name="twitter:title" content={title} />
        <meta name="description" content={i18n._(metadata.description)} />
        <meta name="keywords" content={i18n._(metadata.keywords)} />
        <meta name="author" content="JustFix.nyc" />
        <meta property="fb:app_id" content={FB_APP_ID} />}
        <meta property="og:site_name" content={i18n._(metadata.siteName)} />
        <meta property="og:description" content={i18n._(metadata.description)} />
        <meta property="og:url" content={ORIGIN_URL} />
        <meta property="og:image" content={SHARE_IMAGE_URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:creator" content={TWITTER_HANDLE} />
        <meta name="twitter:description" content={i18n._(metadata.description)} />
        <meta name="twitter:url" content={ORIGIN_URL} />
        <meta name="twitter:image" content={SHARE_IMAGE_URL} />
        <meta name="twitter:image:alt" content={i18n._(metadata.siteName)} />
      </Helmet>
      {props.children}
    </>
  );
});

export default Page;
