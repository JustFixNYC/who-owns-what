import { useContext } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/DistrictAlertsPage.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { DistrictSubscription, JustfixUser } from "state-machine";

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

  return (
    <Page title={i18n._(t`District Alerts`)}>
      <div className="DistrictAlertsPage Page">
        <div className="page-container">
          <Trans render="h1">District alerts</Trans>
          <Button
            labelText="Subscribe to district 1"
            onClick={() => {
              userContext.subscribeDistrict(DISTRICT_1);
              window.location.reload();
            }}
          />
          <Button
            labelText="Subscribe to district 2"
            onClick={() => {
              userContext.subscribeDistrict(DISTRICT_2);
              window.location.reload();
            }}
          />
          <h2>Subscriptions</h2>
          <DistrictSubscriptionsList />
          {/* {!districtSubscriptions || !districtSubscriptions.length ? (
            <div className="district-subscription">No subscriptions</div>
          ) : (
            <>
              {districtSubscriptions.map((subscription, i) => {
                return (
                  <div className="district-subscription">
                    <h3>Subscription {i + 1}</h3>
                    <pre>{JSON.stringify(subscription.district, null, 2)}</pre>
                    <Button
                      labelText="Unsubscribe"
                      onClick={() => {
                        userContext.unsubscribeDistrict(subscription.pk);
                        window.location.reload();
                      }}
                    />
                  </div>
                );
              })}
            </>
          )} */}
        </div>
      </div>
    </Page>
  );
});

export const DistrictSubscriptionsList: React.FC = () => {
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const user = userContext.user as JustfixUser;
  const { districtSubscriptions } = user;

  return (
    <div className="district-subscriptions-list">
      {!districtSubscriptions || !districtSubscriptions.length ? (
        <div className="district-subscription">No subscriptions</div>
      ) : (
        <>
          {districtSubscriptions.map((subscription, i) => {
            return (
              <div className="district-subscription">
                <h3>Subscription {i + 1}</h3>
                <pre>{JSON.stringify(subscription.district, null, 2)}</pre>
                <Button
                  labelText="Unsubscribe"
                  onClick={() => {
                    userContext.unsubscribeDistrict(subscription.pk);
                    window.location.reload();
                  }}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default AccountSettingsPage;
