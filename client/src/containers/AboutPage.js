import React from 'react';
import LegalFooter from 'components/LegalFooter';
import EngagementPanel from 'components/EngagementPanel';

import realestateImage from '../assets/img/realestate.jpg';

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">
        <h4>About this project</h4>
        <blockquote>
          <p>
            <em>"I’ve lived in buildings where I never even knew who owned the place. The dynamic makes for the beginnings of an absurdly unequal relationship, where tenants shell out huge sums each month with little confidence that the leaky faucet will be fixed or the roaches will be vanquished..."</em>
            <cite>&nbsp;&nbsp;&nbsp;—— Ronda Kaysen</cite>
          </p>
        </blockquote>
        <p>
          When a landlord buys a building, they will typically use a Limited Liability Corporation (known as a shell company) in order to maintain their anonymity and protect themselves from possible reprocussions. This lack of transparency prevents tenants and organizers from being able to connect the dots and understand the systematic issues than stem from a single bad landlord - issues such as forced displacement, neglect of conditions, and discrimination. Tenants who suffer from the same abusive landlords are left in the dark, oftentimes not knowing that their neighbors down the block are dealing with similar issues.
        </p>
        <p>
          This website demystifies who your landlord is and the other buildings that they “own” (we use this term in quotations because <span className="hover_img"><a href="#">real estate doesn't own NYC<span><img src={realestateImage} alt="image" height="200" /></span></a></span>). Once you search for your address, we use a database of 200,000 other NYC buildings map the portfolio of your landlord or management company.
        </p>
        <p>
          Remember: knowledge is power! Use this tool to meet your neighbors, organize in solidarity, and build tenant power.
        </p>
        <p>
          With NYC ♥ from the team at JustFix.nyc
        </p>
        <br />
        <br />
        <h4>About JustFix.nyc</h4>
        <p>
          We're New Yorkers who use data & technology to support our neighbors in the fight for housing justice. We currently support over 50 longstanding tenants rights organizations, legal aid, and neighborhood groups. We envision a New York for all - a place where working-class families can thrive without fear of landlord harrasment or displacement. JustFix.nyc is a registered 501(c)3 non-profit organization. For more info, visit our site at <a href="https://www.justfix.nyc" target="_blank">www.justfix.nyc</a>.
        </p>
        <br />
        <br />
        <h4>Credits</h4>
        <ul>
          <li>Ziggy, creator and maintainer of <a href="https://github.com/aepyornis/nyc-db" target="blank">nyc-db</a></li>
          <li>Lucy Block at <a href="https://anhd.org/" target="_blank">ANHD</a>, creator of <a href="http://reports.dapmapnyc.org/" target="_blank">DAP district reports</a></li>
          <li>Cea Weaver at <a href="http://nycommunities.org/" target="_blank">NYCC</a></li>
          <li>Aaron Carr at <a href="http://housingrightsny.org/" target="_blank">HRI</a></li>
          <li>VaNessa LaNier & Jacob Udell at <a href="https://unhp.org/" target="_blank">UNHP</a></li>
          <li>the organizing staff at <a href="https://casapower.org/" target="_blank">CASA</a></li>
          <li>the organizing staff at <a href="https://impacctbrooklyn.org/" target="_blank">IMPACCT</a></li>
          <li>the organizing staff at <a href="http://metcouncilonhousing.org/" target="_blank">Met Council</a></li>
        </ul>
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default AboutPage;
