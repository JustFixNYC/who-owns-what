import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/about.en.json";
import es from "../data/about.es.json";

import "styles/AboutPage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

const AboutPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`About`)}>
      <div className="AboutPage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel location="about-page" />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AboutPage;
