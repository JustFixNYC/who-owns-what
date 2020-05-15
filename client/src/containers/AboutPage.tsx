import React from "react";
import LegalFooter from "../components/LegalFooter";
import EngagementPanel from "../components/EngagementPanel";
import en from "../data/about.en.json";
import es from "../data/about.es.json";

import "styles/AboutPage.css";
import { ContentfulPage } from "../contentful/ContentfulPage";

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">
        <ContentfulPage locales={{ en, es }} />
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
};

export default AboutPage;
