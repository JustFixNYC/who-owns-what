import React from "react";
import Subscribe from "./Subscribe";
import SocialShare, { SocialShareLocation } from "./SocialShare";
import { Link } from "@justfixnyc/component-library";

import "styles/EngagementPanel.css";
import { Trans } from "@lingui/macro";

const EngagementPanel: React.FC<{
  location: SocialShareLocation;
  newsletter?: boolean;
}> = ({ location, newsletter = true }) => (
  <div className="EngagementPanel">
    <Trans render="h5">Join the fight for tenant rights!</Trans>
    <div className="EngagementWrapper">
      {newsletter && (
        <div className="EngagementItem">
          <p>
            <Trans>Sign up for our newsletter</Trans>
          </p>
          <Subscribe />
        </div>
      )}
      <div className="EngagementItem">
        <p>
          <Trans>Share with your neighbors</Trans>
        </p>
        <SocialShare location={location} />
      </div>
      <div className="EngagementItem">
        <p>
          <Trans>Visit our website</Trans>
        </p>
        <Link href="https://www.justfix.org/">www.JustFix.org</Link>
      </div>
    </div>
  </div>
);

export default EngagementPanel;
