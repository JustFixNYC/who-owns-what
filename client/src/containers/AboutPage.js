import React from 'react';

const AboutPage = () => {
  return (
    <div className="AboutPage Page container">
      <div className="columns">
        <div className="column col-7 col-mr-auto">
          <h4>About this project</h4>
          <p>
            When a landlord buys a property, they will use a shell company, or Limited Liability Corporation, in order to keep their anonymity and protect themselves from the repercussions of their actions. This lack of transparency prevents tenants and organizers from being able to connect the dots, organize, and take action around an entire landlord’s portfolio. Tenants who suffer from the same abusive landlords are left in the dark, oftentimes not even knowing that their neighbors down the block are dealing with the same issues.
          </p>
          <p>
            With this website, we hope to provide a new tool that demystifies who your landlord is and the other buildings that they “own” (we use this term in quotations because <u>real estate doesn't own NYC</u>). Once you search for your address, we use a common business address of your building’s shell companies (and other data analysis) to find other buildings across the N.Y.C. that are associated with your landlord or management company. Remember: knowledge is power! Use this tool to know your neighbors, organize in solidarity, and build real tenant power.
          </p>
          <p>
            With NYC ♥ from the team at JustFix.nyc
          </p>
          <br />
          <h4>Who are we</h4>
          <p>
            JustFix.nyc is a 501(c)3 non-profit that builds data-driven tools for tenants and organizers fighting displacement in New York. Our goal is safe and healthy homes for all. For more info, check out our <a href="https://drive.google.com/open?id=1reYIFdVe6vuN6j2Jirw-YCboTIUmcd5L" target="_blank">2017 annual report</a> or go to <a href="https://www.justfix.nyc" target="_blank">www.justfix.nyc</a>.
          </p>
          <br />
          <h4>Credits</h4>
          <p>
            This project would not exist without your support!
          </p>
          <ul>
            <li>ziggy, creator and maintainer of <a href="https://github.com/aepyornis/nyc-db" target="blank">nyc-db</a></li>
            <li>lucy at <a href="https://anhd.org/" target="_blank">ANHD</a>, creator of <a href="http://reports.dapmapnyc.org/" target="_blank">DAP district reports</a></li>
            <li>partners and friends at CASA, IMPACCT, NYCC, Met Council, and Legal Aid for testing and providing feedback.</li>
          </ul>
        </div>
        <div className="column col-5">
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
