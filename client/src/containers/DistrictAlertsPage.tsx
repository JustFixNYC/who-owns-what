import { useContext } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/AccountSettingsPage.css";
import "styles/UserSetting.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { JustfixUser } from "state-machine";

const DISTRICT_1 = [
  { geo_type: "city_council", geo_ids: ["36", "2"] },
  {
    geo_type: "tract_2020",
    geo_ids: ["36047023500", "36047024100", "36047123700"],
  },
];
const DISTRICT_2 = [
  { geo_type: "state_assembly", geo_ids: ["57"] },
  { geo_type: "state_senate", geo_ids: ["25"] },
  { geo_type: "community_district", geo_ids: ["303", "308"] },
];

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const user = userContext.user as JustfixUser;
  const { districtSubscriptions } = user;
  const districtSubscriptionsNumber = !!districtSubscriptions ? districtSubscriptions.length : 0;

  return (
    <Page title={i18n._(t`Account`)}>
      <div className="AccountSettingsPage Page">
        <div className="page-container">
          <Trans render="h1">District alerts</Trans>
          <Button
            labelText="Subscribe to district 1"
            onClick={() => userContext.subscribeDistrict(DISTRICT_1)}
          />
          <Button
            labelText="Subscribe to district 2"
            onClick={() => userContext.subscribeDistrict(DISTRICT_2)}
          />
          <Button
            labelText="Unsubscribe from district 1"
            onClick={() => userContext.unsubscribeDistrict(user.districtSubscriptions[0].pk)}
            disabled={districtSubscriptionsNumber >= 1}
          />
          <Button
            labelText="Unsubscribe from district 2"
            onClick={() => userContext.unsubscribeDistrict(user.districtSubscriptions[1].pk)}
            disabled={districtSubscriptionsNumber >= 2}
          />
          <pre>{districtSubscriptions}</pre>
        </div>
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
