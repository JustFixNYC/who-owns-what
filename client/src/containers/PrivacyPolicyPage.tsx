import React from "react";
import LegalFooter from "../components/LegalFooter";
import { withI18n, withI18nProps } from "@lingui/react";
import Page from "../components/Page";
import { t } from "@lingui/macro";
import { ContentfulPage } from "../contentful/ContentfulPage";
import en from "../data/privacy-policy.en.json";
import es from "../data/privacy-policy.es.json";

const PrivacyPolicyPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`Privacy policy`)}>
      <div className="PrivacyPolicy Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default PrivacyPolicyPage;
