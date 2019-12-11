import React from 'react';
import LegalFooter from '../components/LegalFooter';
import EngagementPanel from '../components/EngagementPanel';
import aboutPageEn from '../data/about.en.json';
import aboutPageEs from '../data/about.es.json';
import { ContentfulPage } from '../contentful/rendering';

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">
        <ContentfulPage locales={{
          en: aboutPageEn,
          es: aboutPageEs
        }} />
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default AboutPage;
