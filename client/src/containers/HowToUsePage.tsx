import React from 'react';
import LegalFooter from '../components/LegalFooter';
import EngagementPanel from '../components/EngagementPanel';

import 'styles/HowToUsePage.css';

import diagramImage from '../assets/img/howitworks.jpg';

const HowToUsePage = () => {
  return (
    <div className="HowToUsePage Page">
      <div className="Page__content">
        <h4>Lorem Ipsum</h4>
        <p>
          Lorem <span className="text-bold">property ownership mapping</span> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nost <a href="http://www1.nyc.gov/site/hpd/about/open-data.page" target="_blank" rel="noopener noreferrer">HPD registration data</a> buildings.
        </p>
        <aside>
          <img src={diagramImage} alt="how it works" className=" img-responsive" />
        </aside>
        <p>Duis aute irure dolor in reprehenderit:</p>
        <ol>
          <li> r magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut </li>
          <li>  minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis aute</li>
        </ol>
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default HowToUsePage;
