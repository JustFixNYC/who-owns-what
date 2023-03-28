import React, { useContext } from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

import { UserContext } from "components/UserContext";
import UserSettingField from "components/UserSettingField";

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { email } = userContext.user;

  return (
    <Page title={i18n._(t`Account settings`)}>
      <div className="AccountSettingsPage Page">
        <UserSettingField
          label={i18n._(t`Email`)}
          currentValue={email}
          onSubmit={(newEmail: string) => userContext.updateEmail(newEmail)}
        />
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
