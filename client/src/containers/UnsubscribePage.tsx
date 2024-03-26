import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Plural, Trans, t } from "@lingui/macro";

import "styles/UserSetting.css";
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

  const [subscriptions, setSubscriptions] = React.useState<BuildingSubscription[] | undefined>();
  const subscriptionsNumber = !!subscriptions ? subscriptions.length : 0;

  useEffect(() => {
    if (isEmailUnsubscribeAll) {
      const asyncUnsubscribeAll = async () => {
        const response = await AuthClient.emailUnsubscribeAll(token);
        setSubscriptions(response["subscriptions"]);
      };
      asyncUnsubscribeAll();
    } else {
      const asyncFetchSubscriptions = async () => {
        const response = await AuthClient.emailUserSubscriptions(token);
        setSubscriptions(response["subscriptions"]);
      };
      asyncFetchSubscriptions();
    }
  }, [token, isEmailUnsubscribeAll]);

  const handleUnsubscribeBuilding = async (bbl: string) => {
    const result = await AuthClient.emailUnsubscribeBuilding(bbl, token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
  };

  const handleUnsubscribeAll = async () => {
    const result = await AuthClient.emailUnsubscribeAll(token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
  };

  return (
    <Page title={i18n._(t`Modify your email preferences`)}>
      <div className="UnsubscribePage Page">
        <div className="page-container">
          {subscriptions === undefined ? (
            <FixedLoadingLabel />
          ) : isEmailUnsubscribeAll || !subscriptions.length ? (
            <>
              {isEmailUnsubscribeAll ? (
                <Trans render="h4">You have sucessfully unsubscribed from all buildings.</Trans>
              ) : (
                <Trans render="h4">You are not subscribed to any buildings.</Trans>
              )}
              <Trans render="div" className="settings-no-subscriptions">
                <LocaleNavLink exact to={home}>
                  Search for a building
                </LocaleNavLink>{" "}
                to add to your updates
              </Trans>
              <Trans render="div" className="settings-contact">
                Contact support@justfix.org to delete your account or get help
              </Trans>
            </>
          ) : (
            <>
              <Trans render="h4">Manage Subscriptions</Trans>
              <Trans render="p">
                You are signed up for Building Updates for {subscriptionsNumber}{" "}
                <Plural value={subscriptionsNumber} one="building" other="buildings" />
              </Trans>
              <div className="subscriptions-container">
                {subscriptions.map((s: any) => (
                  <SubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribeBuilding} />
                ))}
                <div className="unsubscribe-all-field">
                  <button className="button is-text" onClick={handleUnsubscribeAll}>
                    <Trans>Unsubscribe from all</Trans>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default UnsubscribePage;
