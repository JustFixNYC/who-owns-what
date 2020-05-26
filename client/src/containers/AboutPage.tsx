import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/about.en.json";
import es from "../data/about.es.json";

import "styles/AboutPage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import Page from "../components/Page";
import { withI18n } from "@lingui/react";
import { i18n } from "@lingui/core";
import { t } from "@lingui/macro";

const AboutPageWithoutI18n = () => {
  return (
    <Page title={i18n._(t`About`)}>
      <div className="AboutPage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel />
        <LegalFooter />
      </div>
    </Page>
  );
};

const AboutPage = withI18n()(AboutPageWithoutI18n);

export default AboutPage;
