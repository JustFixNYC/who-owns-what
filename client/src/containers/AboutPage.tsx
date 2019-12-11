import React from 'react';
import LegalFooter from '../components/LegalFooter';
import EngagementPanel from '../components/EngagementPanel';
import aboutPage from '../data/about.en.json';
import { ContentfulPage } from '../contentful/rendering';

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">
        <ContentfulPage page={aboutPage} />
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default AboutPage;
