import React, { useEffect } from "react";
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
import { BuildingSubscription, DistrictSubscription } from "state-machine";
import { FixedLoadingLabel } from "components/Loader";
import { STANDALONE_PAGES, StandalonePageFooter } from "components/StandalonePage";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const UnsubscribePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search, pathname } = useLocation();
  const { home, account, areaAlerts } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";

  const [buildingSubs, setBuildingSubs] = React.useState<BuildingSubscription[]>();
  const buildingSubsNumber = buildingSubs?.length;

  const [districtSubs, setDistrictSubs] = React.useState<DistrictSubscription[]>();
  const districtSubsNumber = districtSubs?.length;

  const pageName = STANDALONE_PAGES.find((x) => pathname.includes(x));
  const standalonePageEventParams = { from: pageName };

  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.emailUserSubscriptions(token);
      setBuildingSubs(response["building_subscriptions"]);
      setDistrictSubs(response["district_subscriptions"]);
    };
    asyncFetchSubscriptions();
    window.gtag("event", "manage-subscriptions-email-link", { branch: BRANCH_NAME });
  }, [token]);

  const handleUnsubscribeBuilding = async (bbl: string) => {
    const result = await AuthClient.emailUnsubscribeBuilding(bbl, token);
    if (!!result?.["building_subscriptions"]) setBuildingSubs(result["building_subscriptions"]);
    window.gtag("event", "unsubscribe-building", {
      from: "manage subscriptions",
      branch: BRANCH_NAME,
    });
  };

  const handleUnsubscribeDistrict = async (subscriptionId: string) => {
    const result = await AuthClient.emailUnsubscribeDistrict(subscriptionId, token);
    if (!!result?.["district_subscriptions"]) setDistrictSubs(result["district_subscriptions"]);
    window.gtag("event", "unsubscribe-district", {
      from: "manage subscriptions",
      branch: BRANCH_NAME,
    });
  };

  const handleUnsubscribeAllBuilding = async (from: string) => {
    const result = await AuthClient.emailUnsubscribeAllBuilding(token);
    if (!!result?.["building_subscriptions"]) setBuildingSubs(result["building_subscriptions"]);
    window.gtag("event", "unsubscribe-building-all", { from: from, branch: BRANCH_NAME });
  };

  const handleUnsubscribeAllDistrict = async (from: string) => {
    const result = await AuthClient.emailUnsubscribeAllDistrict(token);
    if (!!result?.["district_subscriptions"]) setDistrictSubs(result["district_subscriptions"]);
    window.gtag("event", "unsubscribe-district-all", { from: from, branch: BRANCH_NAME });
  };

  const renderManageSubscriptionsPage = () => (
    <>
      <Trans render="h1">Manage Subscriptions</Trans>
      <h2 className="settings-section">
        <Trans>You are signed up for Building Alerts for</Trans> {buildingSubsNumber}{" "}
        {buildingSubsNumber! === 1 ? <Trans>building</Trans> : <Trans>buildings</Trans>}
      </h2>
      <div className="subscriptions-container">
        {buildingSubs?.map((s) => (
          <BuildingSubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribeBuilding} />
        ))}
        {!!buildingSubsNumber && buildingSubsNumber > 1 && (
          <div className="unsubscribe-all-field">
            <Button
              variant="secondary"
              size="small"
              labelText={i18n._(t`Unsubscribe from all buildings`)}
              onClick={() => handleUnsubscribeAllBuilding("manage subscriptions")}
            />
          </div>
        )}
      </div>
      <h2 className="settings-section">
        <Trans>You are signed up for Area Alerts for</Trans> {districtSubsNumber}{" "}
        {districtSubsNumber! === 1 ? <Trans>area</Trans> : <Trans>areas</Trans>}
      </h2>
      <div className="subscriptions-container">
        {districtSubs?.map((s) => (
          <DistrictSubscriptionField key={s.pk} {...s} onRemoveClick={handleUnsubscribeDistrict} />
        ))}
        {!!districtSubsNumber && districtSubsNumber > 1 && (
          <div className="unsubscribe-all-field">
            <Button
              variant="secondary"
              size="small"
              labelText={i18n._(t`Unsubscribe from all areas`)}
              onClick={() => handleUnsubscribeAllDistrict("manage subscriptions")}
            />
          </div>
        )}
      </div>
    </>
  );

  const renderNoSubscriptionsPage = () => (
    <>
      <Trans render="h1">You are not subscribed to any Building or Area Alerts</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to your Building
        Alerts, <JFCLLocaleLink to={areaAlerts}>subscribe to Area Alerts</JFCLLocaleLink>, or visit
        your <JFCLLocaleLink to={account.settings}>email settings</JFCLLocaleLink> page to manage
        subscriptions.
      </Trans>
    </>
  );

  return (
    <Page title={i18n._(t`Manage subscriptions`)}>
      <div className="UnsubscribePage Page">
        <div className="page-container">
          {buildingSubs === undefined || districtSubs === undefined ? (
            <FixedLoadingLabel />
          ) : buildingSubsNumber === 0 && districtSubsNumber === 0 ? (
            renderNoSubscriptionsPage()
          ) : (
            renderManageSubscriptionsPage()
          )}
          <StandalonePageFooter eventParams={standalonePageEventParams} />
        </div>
      </div>
    </Page>
  );
});

export default UnsubscribePage;
