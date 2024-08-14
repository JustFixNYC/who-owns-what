import React from "react";
import LegalFooter from "../components/LegalFooter";
import { ContentfulPage } from "../contentful/ContentfulPage";
import en from "../data/terms-of-use.en.json";
import es from "../data/terms-of-use.es.json";

import { withI18n, withI18nProps } from "@lingui/react";
import Page from "../components/Page";
import { t } from "@lingui/macro";

const TermsOfUsePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`Terms of use`)}>
      <div className="TermsOfUse Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default TermsOfUsePage;
