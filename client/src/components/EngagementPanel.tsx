import React from "react";
import Subscribe from "./Subscribe";
import SocialShare, { SocialShareLocation } from "./SocialShare";

import "styles/EngagementPanel.css";
import { Trans } from "@lingui/macro";

const EngagementPanel: React.FC<{
  location: SocialShareLocation;
}> = (props) => {
  return (
    <div className="EngagementPanel">
      <Trans render="h5">Join the fight for tenant rights!</Trans>
      <div className="EngagementWrapper">
        <div className="EngagementItem">
          <p>
            <Trans>Sign up for email updates</Trans>
          </p>
          <Subscribe />
        </div>
        <div className="EngagementItem">
          <p>
            <Trans>Share this page with your neighbors</Trans>
          </p>
          <SocialShare location={props.location} />
        </div>
        <div className="EngagementItem">
          <p>
            <Trans>Visit our website</Trans>
          </p>
          <a href="https://www.justfix.nyc/" className="btn btn-block btn-justfix">
            www.JustFix.nyc
          </a>
        </div>
      </div>
    </div>
  );
};

export default EngagementPanel;
