import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans, Plural } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/UserSetting.css";
import "styles/UnsubscribePage.css";
import Page from "../components/Page";
import AuthClient from "../components/AuthClient";
import { SubscriptionField } from "./AccountSettingsPage";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { JFCLLocaleLink } from "i18n";
import { BuildingSubscription } from "state-machine";
import { FixedLoadingLabel } from "components/Loader";
import { STANDALONE_PAGES, StandalonePageFooter } from "components/StandalonePage";

const UnsubscribePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search, pathname } = useLocation();
  const { home } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";
  const isEmailUnsubscribeAll = !!params.get("all");

  const [subscriptions, setSubscriptions] = React.useState<BuildingSubscription[]>();
  const subscriptionsNumber = subscriptions?.length;

  const pageName = STANDALONE_PAGES.find((x) => pathname.includes(x));
  const standalonePageEventParams = { from: pageName };

  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.emailUserSubscriptions(token);
      setSubscriptions(response["subscriptions"]);
    };
    asyncFetchSubscriptions();

    if (isEmailUnsubscribeAll) {
      // logAmplitudeEvent("unsubscribeBuildingAllEmailLink");
      window.gtag("event", "unsubscribe-building-all-email-link");
    } else {
      // logAmplitudeEvent("manageSubscriptionsEmailLink");
      window.gtag("event", "manage-subscriptions-email-link");
    }
  }, [token, isEmailUnsubscribeAll]);

  const handleUnsubscribeBuilding = async (bbl: string) => {
    const result = await AuthClient.emailUnsubscribeBuilding(bbl, token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
    const eventParams = { from: "manage subscriptions page" };
    // logAmplitudeEvent("unsubscribeBuilding", eventParams);
    window.gtag("event", "unsubscribe-building", eventParams);
  };

  const handleUnsubscribeAll = async () => {
    const result = await AuthClient.emailUnsubscribeAll(token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
    const eventParams = { from: "manage subscriptions page" };
    // logAmplitudeEvent("unsubscribeBuildingAll", eventParams);
    window.gtag("event", "unsubscribe-building-all", eventParams);
  };

  const renderUnsubscribePage = () => (
    <>
      <Trans render="h1">Unsubscribe</Trans>
      <Trans render="h2">
        You are signed up for Building Updates for {subscriptionsNumber}{" "}
        <Plural value={subscriptionsNumber!} one="building" other="buildings" />. Click below to
        unsubscribe from all and stop receiving Building Updates.
      </Trans>
      <Button
        variant="primary"
        size="large"
        labelText={i18n._(t`Unsubscribe from all`)}
        onClick={handleUnsubscribeAll}
      />
    </>
  );

  const renderManageSubscriptionsPage = () => (
    <>
      <Trans render="h1">Manage Subscriptions</Trans>
      <Trans render="h2" className="settings-section">
        You are signed up for Building Updates for {subscriptionsNumber}{" "}
        <Plural value={subscriptionsNumber!} one="building" other="buildings" />
      </Trans>
      <div className="subscriptions-container">
        {subscriptions!.map((s) => (
          <SubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribeBuilding} />
        ))}
        <div className="unsubscribe-all-field">
          <Button
            variant="secondary"
            size="small"
            labelText={i18n._(t`Unsubscribe from all`)}
            onClick={handleUnsubscribeAll}
          />
        </div>
      </div>
    </>
  );

  const renderNoSubscriptionsPage = () => (
    <>
      <Trans render="h1">You are not subscribed to any buildings</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to Building Updates
      </Trans>
    </>
  );

  return (
    <Page title={isEmailUnsubscribeAll ? i18n._(t`Unsubscribe`) : i18n._(t`Manage subscriptions`)}>
      <div className="UnsubscribePage Page">
        <div className="page-container">
          {subscriptions === undefined ? (
            <FixedLoadingLabel />
          ) : subscriptionsNumber === 0 ? (
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

export default UnsubscribePage;
