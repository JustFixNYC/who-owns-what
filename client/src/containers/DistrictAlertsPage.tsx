import { useContext, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/DistrictAlertsPage.css";
import geoIds from "../data/district-ids.json";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { JustfixUser } from "state-machine";
import MultiSelect from "components/Multiselect";
import { District } from "components/APIDataTypes";

const DistrictAlertsPage = withI18n()((props: withI18nProps) => {
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { i18n } = props;

  const [districtSelection, setDistrictSelection] = useState<District>();

  const handleApply = (selectedList: string[], geoType: string) => {
    setDistrictSelection((prev) => {
      const existingComponents = prev?.filter((component) => component.geo_type !== geoType);
      const newDistrict = selectedList.length
        ? (existingComponents || []).concat([{ geo_type: geoType, geo_ids: selectedList }])
        : existingComponents;
      return newDistrict;
    });
  };

  return (
    <Page title={i18n._(t`District Alerts`)}>
      <div className="DistrictAlertsPage Page">
        <div className="page-container">
          <Trans render="h1">District alerts</Trans>
          <h2>Build your district</h2>
          {Object.entries(geoIds).map(([geo_type, options]) => {
            return (
              <>
                <h3>{geo_type}</h3>
                <MultiSelect
                  id={`district-multiselect-${geo_type}`}
                  options={options}
                  onApply={(selectedList) => handleApply(selectedList, geo_type)}
                  isOpen={true}
                />
              </>
            );
          })}
          <h2>Your selections</h2>
          <pre>{JSON.stringify(districtSelection, null, 2)}</pre>
          <Button
            labelText="Subscribe"
            onClick={() => {
              userContext.subscribeDistrict(districtSelection!);
              window.location.reload();
            }}
            disabled={!districtSelection || districtSelection.length === 0}
          />
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

export default DistrictAlertsPage;
