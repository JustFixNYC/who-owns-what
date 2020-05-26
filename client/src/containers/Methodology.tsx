import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/how-it-works.en.json";
import es from "../data/how-it-works.es.json";

/* Use Same Styling as How to Use Page */
import "styles/HowToUsePage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import { withI18n } from "@lingui/react";
import Page from "../components/Page";
import { i18n } from "@lingui/core";
import { t } from "@lingui/macro";

const MethodologyPageWithoutI18n = () => {
  return (
    <Page title={i18n._(t`Methodology`)}>
      <div className="HowToUsePage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel />
        <LegalFooter />
      </div>
    </Page>
  );
};

const MethodologyPage = withI18n()(MethodologyPageWithoutI18n);

export default MethodologyPage;
