import React from 'react';
// other imports

import Subscribe from 'components/Subscribe';

import 'styles/EngagementPanel.css';

const EngagementPanel = () => {
  return (
    <div className="EngagementPanel">
      <h6>Join the fight for tenant rights!</h6>
      <div className="EngagementWrapper">
        <div className="EngagementItem">
         <p>Sign up for email updates:</p>
         <Subscribe /> 
        </div>
        <div className="EngagementItem">
         <p>Follow us on social media:</p>
          <div className="EngagementSocialLinks">
             <a href="https://twitter.com/justfixnyc?lang=en" target="_blank"
                className="btn btn-white">
                Twitter</a> 
             <a href="https://www.instagram.com/justfixnyc/?hl=en" target="_blank"
                className="btn btn-white">
                Instagram</a> 
             <a href="https://www.facebook.com/JustFixNYC/" target="_blank"
                className="btn btn-white">
                Facebook</a>
         </div>
        </div>
        <div className="EngagementItem">
         <p>Visit our website:</p>
         <a href="https://www.justfix.nyc/" target="_blank"
            className="btn btn-block btn-justfix">
            www.JustFix.nyc</a> 
        </div>
      </div>
    </div>
    );
}

export default EngagementPanel;