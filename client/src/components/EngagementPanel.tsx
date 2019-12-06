import React from 'react';
import Subscribe from './Subscribe';
import SocialShare from './SocialShare';

import 'styles/EngagementPanel.css';



const EngagementPanel: React.FC<{
  location?: string
}> = (props) => {
  return (
    <div className="EngagementPanel">
      <h5>Join the fight for tenant rights!</h5>
      <div className="EngagementWrapper">
        <div className="EngagementItem">
         <p>Sign up for email updates:</p>
         <Subscribe />
        </div>
        <div className="EngagementItem">
         <p>Share with your neighbors:</p>
         <SocialShare location={props.location} />
        </div>
        <div className="EngagementItem">
         <p>Visit our website:</p>
         <a href="https://www.justfix.nyc/"
            className="btn btn-block btn-justfix">
            www.JustFix.nyc</a>
        </div>
      </div>
    </div>
  );
}

export default EngagementPanel;
