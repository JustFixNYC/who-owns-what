import React from 'react';
import Subscribe from './Subscribe';
import SocialShare from './SocialShare';

import 'styles/EngagementPanel.css';
import { Trans } from '@lingui/macro';



const EngagementPanel: React.FC<{
  location?: string
}> = (props) => {
  return (
    <div className="EngagementPanel">
      <Trans render="h5">Join the fight for tenant rights!</Trans>
      <div className="EngagementWrapper">
        <div className="EngagementItem">
         <Trans render="p">Sign up for email updates:</Trans>
         <Subscribe />
        </div>
        <div className="EngagementItem">
         <Trans render="p">Share with your neighbors:</Trans>
         <SocialShare location={props.location} />
        </div>
        <div className="EngagementItem">
         <Trans render="p">Visit our website:</Trans>
         <a href="https://www.justfix.nyc/"
            className="btn btn-block btn-justfix">
            www.JustFix.nyc</a>
        </div>
      </div>
    </div>
  );
}

export default EngagementPanel;
