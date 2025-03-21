import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/UserSetting.css";
import "styles/UnsubscribePage.css";
import Page from "../components/Page";
import AuthClient from "../components/AuthClient";
import { BuildingSubscriptionField, DistrictSubscriptionField } from "./AccountSettingsPage";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { JFCLLocaleLink } from "i18n";
import { BuildingSubscription, DistrictSubscription, JustfixUser } from "state-machine";
import { FixedLoadingLabel } from "components/Loader";
import { STANDALONE_PAGES, StandalonePageFooter } from "components/StandalonePage";
import { UserContext } from "components/UserContext";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const UnsubscribePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search, pathname } = useLocation();
  const { home } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";
  const isEmailUnsubscribeAll = !!params.get("all");

  const [buildingSubscriptions, setBuildingSubscriptions] = React.useState<BuildingSubscription[]>(
    []
  );
  const buildingSubscriptionsNumber = buildingSubscriptions?.length;

  const [districtSubscriptions, setDistrictSubscriptions] = React.useState<DistrictSubscription[]>(
    []
  );
  const districtSubscriptionsNumber = districtSubscriptions?.length;

  const pageName = STANDALONE_PAGES.find((x) => pathname.includes(x));
  const standalonePageEventParams = { from: pageName };

  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.emailUserSubscriptions(token);
      setBuildingSubscriptions(response["building_subscriptions"]);
      setDistrictSubscriptions(response["district_subscriptions"]);
    };
    asyncFetchSubscriptions();

    if (isEmailUnsubscribeAll) {
      window.gtag("event", "unsubscribe-building-all-email-link", { branch: BRANCH_NAME });
    } else {
      window.gtag("event", "manage-subscriptions-email-link", { branch: BRANCH_NAME });
    }
  }, [token, isEmailUnsubscribeAll]);

  const handleUnsubscribeBuilding = async (bbl: string) => {
    const result = await AuthClient.emailUnsubscribeBuilding(bbl, token);
    if (!!result?.["building_subscriptions"]) {
      setBuildingSubscriptions(result["building_subscriptions"]);
    }
    window.gtag("event", "unsubscribe-building", {
      from: "manage subscriptions",
      branch: BRANCH_NAME,
    });
  };

  const handleUnsubscribeDistrict = async (subscriptionId: string) => {
    const result = await AuthClient.emailUnsubscribeDistrict(subscriptionId, token);
    if (!!result?.["district_subscriptions"]) {
      setDistrictSubscriptions(result["district_subscriptions"]);
    }
    window.gtag("event", "unsubscribe-district", {
      from: "manage subscriptions",
      branch: BRANCH_NAME,
    });
  };

  const handleUnsubscribeAllBuilding = async (from: string) => {
    const result = await AuthClient.emailUnsubscribeAllBuilding(token);
    if (!!result?.["district_subscriptions"]) setBuildingSubscriptions(result["subscriptions"]);
    window.gtag("event", "unsubscribe-building-all", { from: from, branch: BRANCH_NAME });
  };

  const handleUnsubscribeAllDistrict = async (from: string) => {
    const result = await AuthClient.emailUnsubscribeAllDistrict(token);
    if (!!result?.["district_subscriptions"]) setBuildingSubscriptions(result["subscriptions"]);
    window.gtag("event", "unsubscribe-building-all", { from: from, branch: BRANCH_NAME });
  };

  const renderUnsubscribePage = () => (
    <>
      <Trans render="h1">Unsubscribe</Trans>
      <h2>
        <Trans>You are signed up for Building Alerts for</Trans> {buildingSubscriptionsNumber}{" "}
        {buildingSubscriptionsNumber! === 1 ? <Trans>building</Trans> : <Trans>buildings</Trans>}.{" "}
        <Trans>Click below to unsubscribe from all and stop receiving Building Alerts.</Trans>
      </h2>
      <Button
        variant="primary"
        size="large"
        labelText={i18n._(t`Unsubscribe from all`)}
        onClick={() => handleUnsubscribeAllBuilding("unsubscribe")}
      />
    </>
  );

  const renderManageSubscriptionsPage = () => (
    <>
      <Trans render="h1">Manage Subscriptions</Trans>
      <h2 className="settings-section">
        <Trans>You are signed up for Building Alerts for</Trans> {buildingSubscriptionsNumber}{" "}
        {buildingSubscriptionsNumber! === 1 ? <Trans>building</Trans> : <Trans>buildings</Trans>}
      </h2>
      <div className="subscriptions-container">
        {buildingSubscriptions!.map((s) => (
          <BuildingSubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribeBuilding} />
        ))}
        <div className="unsubscribe-all-field">
          <Button
            variant="secondary"
            size="small"
            labelText={i18n._(t`Unsubscribe from all buildings`)}
            onClick={() => handleUnsubscribeAllBuilding("manage subscriptions")}
          />
        </div>
      </div>
      <h2 className="settings-section">
        <Trans>You are signed up for District Alerts for</Trans> {districtSubscriptionsNumber}{" "}
        {districtSubscriptionsNumber! === 1 ? <Trans>district</Trans> : <Trans>districts</Trans>}
      </h2>
      <div className="subscriptions-container">
        {districtSubscriptions!.map((s) => (
          <DistrictSubscriptionField key={s.pk} {...s} onRemoveClick={handleUnsubscribeDistrict} />
        ))}
        <div className="unsubscribe-all-field">
          <Button
            variant="secondary"
            size="small"
            labelText={i18n._(t`Unsubscribe from all districts`)}
            onClick={() => handleUnsubscribeAllDistrict("manage subscriptions")}
          />
        </div>
      </div>
    </>
  );

  const renderNoSubscriptionsPage = () => (
    <>
      <Trans render="h1">You are not subscribed to any buildings</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to Building Alerts
      </Trans>
    </>
  );

  return (
    <Page title={isEmailUnsubscribeAll ? i18n._(t`Unsubscribe`) : i18n._(t`Manage subscriptions`)}>
      <div className="UnsubscribePage Page">
        <div className="page-container">
          <Button
            labelText="district unsubscribe all"
            onClick={async () => {
              await AuthClient.emailUnsubscribeAllDistrict(token);
            }}
          />
          <DistrictSubscriptionsList />

          <hr />

          {buildingSubscriptions === undefined ? (
            <FixedLoadingLabel />
          ) : buildingSubscriptionsNumber === 0 ? (
            renderNoSubscriptionsPage()
          ) : isEmailUnsubscribeAll ? (
            renderUnsubscribePage()
          ) : (
            renderManageSubscriptionsPage()
          )}
          <StandalonePageFooter eventParams={standalonePageEventParams} />
        </div>
      </div>
    </Page>
  );
});

const DistrictSubscriptionsList: React.FC = () => {
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

export default UnsubscribePage;
