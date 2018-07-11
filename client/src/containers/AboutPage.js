import React from 'react';

const AboutPage = () => {
  return (
    <div className="AboutPage Page">
      <div className="Page__content">
        <h4>About this project</h4>
        <p>
          When a landlord buys a building, they will use a shell company, or Limited Liability Corporation, in order to keep their anonymity and protect themselves from the repercussions of their actions. This lack of transparency prevents tenants and organizers from being able to connect the dots, organize, and take action around an entire landlord’s portfolio. Tenants who suffer from the same abusive landlords are left in the dark, oftentimes not even knowing that their neighbors down the block are dealing with the same issues.
        </p>
        <p>
          With this website, we hope to provide a new tool that demystifies who your landlord is and the other buildings that they “own” (we use this term in quotations because <u>real estate doesn't own NYC</u>). Once you search for your address, we use a common business address of your building’s shell companies (and other data analysis) to find other buildings that are associated with your landlord or management company. Remember: knowledge is power! Use this tool to know your neighbors, organize in solidarity, and build tenant power.
        </p>
        <p>
          With NYC ♥ from the team at JustFix.nyc
        </p>
        <br />
        <h4>Who are we</h4>
        <p>
          JustFix.nyc is a 501(c)3 non-profit that builds data-driven tools for tenants and organizers fighting displacement in New York. Our goal is safe and healthy homes for all. For more info, go to <a href="https://www.justfix.nyc" target="_blank">www.justfix.nyc</a>.
        </p>
        <br />
        <h4>Credits</h4>
        <p>
          This project would not exist without your support!
        </p>
        <ul>
          <li>Ziggy, creator and maintainer of <a href="https://github.com/aepyornis/nyc-db" target="blank">nyc-db</a></li>
          <li>Lucy Block at <a href="https://anhd.org/" target="_blank">ANHD</a>, creator of <a href="http://reports.dapmapnyc.org/" target="_blank">DAP district reports</a></li>
          <li>Cea Weaver at <a href="http://nycommunities.org/" target="_blank">NYCC</a></li>
          <li>Aaron Carr at <a href="http://housingrightsny.org/" target="_blank">HRI</a></li>
          <li>VaNessa LaNier at <a href="https://unhp.org/" target="_blank">UNHP</a></li>
          <li>Sateesh Nori at <a href="http://www.legal-aid.org/en/home.aspx" target="_blank">Legal Aid Society</a></li>
          <li>the organizing staff at <a href="https://casapower.org/" target="_blank">CASA</a></li>
          <li>the organizing staff at <a href="https://impacctbrooklyn.org/" target="_blank">IMPACCT</a></li>
          <li>the organizing staff at <a href="http://metcouncilonhousing.org/" target="_blank">Met Council</a></li>
        </ul>
      </div>
    </div>
  );
}

export default AboutPage;
