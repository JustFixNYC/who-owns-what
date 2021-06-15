import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/how-to-use.en.json";
import es from "../data/how-to-use.es.json";

import "styles/HowToUsePage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";
import Page from "../components/Page";

const HowToUsePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`How to use`)}>
      <div className="HowToUsePage Page">
        <div className="Page__content">
          <ContentfulPage locales={{ en, es }} />
        </div>
        <EngagementPanel location="how-to-use" />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default HowToUsePage;
