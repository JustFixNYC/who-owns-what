import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/how-it-works.en.json";
import es from "../data/how-it-works.es.json";

/* Use Same Styling as How to Use Page */
import "styles/HowToUsePage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import { withI18n, withI18nProps } from "@lingui/react";
import Page from "../components/Page";
import { t } from "@lingui/macro";

const MethodologyPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`Methodology`)}>
      <div className="HowToUsePage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel location="methodology" />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default MethodologyPage;
