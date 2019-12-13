import React from 'react';
import LegalFooter from '../components/LegalFooter';
import EngagementPanel from '../components/EngagementPanel';
import en from '../data/how-to-use.en.json';
import es from '../data/how-to-use.es.json';

import 'styles/HowToUsePage.css';
import { ContentfulPage } from '../contentful/ContentfulPage';

const HowToUsePage = () => {
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

export default HowToUsePage;
