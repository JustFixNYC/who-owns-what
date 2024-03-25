import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { Plural, Trans, t } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";


import "styles/UnsubscribePage.css";
import "styles/UserSetting.css";
import Page from "../components/Page";
import LegalFooter from "../components/LegalFooter";
import AuthClient from "../components/AuthClient";
import { SubscriptionField } from "./AccountSettingsPage";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleNavLink } from "i18n";
import { BuildingSubscription } from "state-machine";
import { FixedLoadingLabel } from "components/Loader";

const UnsubscribePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const { home } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";
  const isEmailUnsubscribeAll = !!params.get("all");

  const [subscriptions, setSubscriptions] = React.useState<BuildingSubscription[]>();
  const subscriptionsNumber = subscriptions?.length;

  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.emailUserSubscriptions(token);
      setSubscriptions(response["subscriptions"]);
    };
    asyncFetchSubscriptions();
  }, [token]);

  const handleUnsubscribeBuilding = async (bbl: string) => {
    const result = await AuthClient.emailUnsubscribeBuilding(bbl, token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
  };

  const handleUnsubscribeAll = async () => {
    const result = await AuthClient.emailUnsubscribeAll(token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
  };

  const renderUnsubscribePage = () => (
    <>
      <Trans render="h4">Unsubscribe</Trans>
      <div className="unsubscribe-container">
        <Trans render="p">
          You are signed up for Building Updates for {subscriptionsNumber}{" "}
          <Plural value={subscriptionsNumber!} one="building" other="buildings" />. Click below to
          unsubscribe from all and stop receiving Building Updates.
        </Trans>
        <Button
          variant="primary"
          size="small"
          labelText={i18n._(t`Unsubscribe from all`)}
          onClick={handleUnsubscribeAll}
        />
      </div>
    </>
  );

  const renderManageSubscriptionsPage = () => (
    <>
      <Trans render="h4">Manage Subscriptions</Trans>
      <Trans render="p" className="settings-section">
        There <Plural value={subscriptionsNumber!} one="is" other="are" /> {subscriptionsNumber}{" "}
        <Plural value={subscriptionsNumber!} one="building" other="buildings" /> in your weekly
        updates
      </Trans>
      <div className="subscriptions-container">
        {subscriptions!.map((s) => (
          <SubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribeBuilding} />
        ))}
        <div className="unsubscribe-all-field">
          <Button
            variant="text"
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
      <Trans render="h4" className="settings-section">
        You are not subscribed to any buildings.
      </Trans>
      <Trans render="div" className="settings-no-subscriptions">
        <LocaleNavLink exact to={home}>
          Search for a building
        </LocaleNavLink>{" "}
        to add to your updates
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
          {isEmailUnsubscribeAll && (
            <Trans render="div" className="settings-contact">
              Contact support@justfix.org to delete your account or get help
            </Trans>
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default UnsubscribePage;
