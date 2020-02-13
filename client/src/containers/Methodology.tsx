import React from 'react';
import LegalFooter from '../components/LegalFooter';
import EngagementPanel from '../components/EngagementPanel';
import en from '../data/how-it-works.en.json';
import es from '../data/how-it-works.es.json';

/* Use Same Styling as How to Use Page */
import 'styles/HowToUsePage.css';
import { ContentfulPage } from '../contentful/ContentfulPage';

const MethodologyPage = () => {
  return (
    <div className="HowToUsePage Page">
      <div className="Page__content">
        <ContentfulPage locales={{en, es}} />
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default MethodologyPage;
