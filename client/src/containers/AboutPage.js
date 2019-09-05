import React from 'react';
import LegalFooter from 'components/LegalFooter';
import EngagementPanel from 'components/EngagementPanel';

import 'styles/AboutPage.css';

import realestateImage from '../assets/img/realestate.jpg';
import protestImageTwo from '../assets/img/protest2.jpg';
import diagramImage from '../assets/img/howitworks.jpg';

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">

        <h4>About this project</h4>

        <p>
          Who Owns What was built to help <b>rebalance the power dynamic between landlords and tenants</b>.
        </p>

        <p>
          When a landlord buys a building, they often use Limited Liability Corporations (LLCs, AKA shell companies), to hide their identities, creating a tangled web of associations and businessess. It then becomes difficult to pinpoint precisely which landlord or company is causing issues across many buildings, and makes it even harder to prove that a landlord is refusing to respond to issues, creating unsafe conditions for tenants, overcharging for rent and other discriminatory practices.
        </p>

        <aside>
          <img src={diagramImage} alt="how it works" className=" img-responsive" />
        </aside>

        <br />
        <br />

        <h4>Who Owns What connects the dots</h4>

        <p>
          By searching and comparing names and addresses within the registration listings for over 200,000 buildings in NYC, it’s able to build and map your landlord’s “portfolio.” Curious? Here’s a deeper dive into how the tool works.
        </p>

        <p>
          Use it to meet your neighbors, organize a building association, and grow your tenant power! 
        </p>

        <p>
          With NYC ♥ from the team at JustFix.nyc
        </p>

        <br />
        <br />

        <div className="divider" />

        <span className="credits text-italic">

          <br />
          <br /> 

          <h6>About JustFix.nyc</h6>
          <p>
            We use data & technology to build digital tools that support the fight for housing justice. We partner with over 30 tenant organizing groups, legal service providers, and neighborhood groups. We envision a New York where working-class families can thrive without fear of landlord harassment or displacement. For more info, visit our website at www.justfix.nyc.          <br />
            <br />
            JustFix.nyc is a registered 501(c)3 non-profit organization. If you have the capacity, please consider <a href="https://www.justfix.nyc/donate">donating to support our work</a>.

          </p>
          <br />
          <br />
          <h6>About the Housing Data Coalition</h6>
          <p>
            The Housing Data Coalition (HDC) is a group of individuals and organizations who use public data to further housing justice in New York City. To fight the real estate industry’s escalating exploitation of housing data that drives speculation and displacement, HDC aims to make public data more accessible for housing justice groups. HDC members connect, learn, and give mutual support to a variety of projects involving housing data. For more info about our working groups and monthly meetings, email <a href="mailto:housingdatacoalition@gmail.com" target="_blank" rel="noopener noreferrer">housingdatacoalition@gmail.com</a>.
          </p>
          <br />
          <br />
          <h6>Credits</h6>
          <ul>
            <li>Ziggy, creator and maintainer of <a href="https://github.com/aepyornis/nyc-db" target="blank">nyc-db</a></li>
            <li>Lucy Block at <a href="https://anhd.org/" target="_blank" rel="noopener noreferrer">ANHD</a>, creator of <a href="http://reports.dapmapnyc.org/" target="_blank" rel="noopener noreferrer">DAP district reports</a></li>
            <li>Cea Weaver at <a href="http://nycommunities.org/" target="_blank" rel="noopener noreferrer">NYCC</a></li>
            <li>Aaron Carr at <a href="http://housingrightsny.org/" target="_blank" rel="noopener noreferrer">HRI</a></li>
            <li>VaNessa LaNier & Jacob Udell at <a href="https://unhp.org/" target="_blank" rel="noopener noreferrer">UNHP</a></li>
            <li>the organizing staff at <a href="https://casapower.org/" target="_blank" rel="noopener noreferrer">CASA</a></li>
            <li>the organizing staff at <a href="https://impacctbrooklyn.org/" target="_blank" rel="noopener noreferrer">IMPACCT</a></li>
            <li>the organizing staff at <a href="http://metcouncilonhousing.org/" target="_blank" rel="noopener noreferrer">Met Council</a></li>
          </ul>
        </span>
      </div>
      <EngagementPanel />
      <LegalFooter />
    </div>
  );
}

export default AboutPage;
