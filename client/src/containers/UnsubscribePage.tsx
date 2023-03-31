import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import "styles/UserSetting.css";
import AuthClient from "../components/AuthClient";
import { SubscriptionField } from "./AccountSettingsPage";

const UnsubscribePage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";

  const [subscriptions, setSubscriptions] = React.useState([]);
  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.userSubscriptions(token);
      setSubscriptions(response["subscriptions"]);
    };
    asyncFetchSubscriptions();
  }, [token]);

  const handleUnsubscribe = async (bbl: string) => {
    const result = await AuthClient.emailBuildingUnsubscribe(bbl, token);
    if (!!result?.["subscriptions"]) setSubscriptions(result["subscriptions"]);
  };

  return (
    <Page title={i18n._(t`Modify your email preferences`)}>
      <div className="UnsubscribePage Page">
        <div className="page-container">
          <Trans render="h4">You are signed up for email alerts from these bulidings:</Trans>
          <div>
            {subscriptions?.map((s: any) => (
              <SubscriptionField key={s.bbl} {...s} onRemoveClick={handleUnsubscribe} />
            ))}
          </div>
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default UnsubscribePage;
