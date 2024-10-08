import React, { useContext } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans, Plural } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/AccountSettingsPage.css";
import "styles/UserSetting.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { EmailSettingField, PasswordSettingField } from "components/UserSettingField";
import { JustfixUser } from "state-machine";
import { createRouteForAddressPage, createWhoOwnsWhatRoutePaths } from "routes";
import { Borough } from "components/APIDataTypes";
import { LocaleNavLink } from "i18n";
import { useLocation } from "react-router-dom";

type SubscriptionFieldProps = withI18nProps & {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
  onRemoveClick: (bbl: string) => void;
};

const SubscriptionFieldWithoutI18n = (props: SubscriptionFieldProps) => {
  const { bbl, housenumber, streetname, boro, onRemoveClick, i18n } = props;
  return (
    <div className="subscription-field">
      <a
        className="subscription-address"
        href={createRouteForAddressPage({
          housenumber,
          streetname,
          boro: boro.toUpperCase() as Borough,
        })}
        target="_blank"
        rel="noreferrer noopener"
      >
        {/* title case styling via css only works if address is lowercase */}
        <span className="street-address">{`${housenumber} ${streetname.toLowerCase()},`}</span>
        <span>{`${boro}, NY`}</span>
      </a>
      <Button
        type="submit"
        variant="secondary"
        size="small"
        labelText={i18n._(t`Remove`)}
        onClick={() => onRemoveClick(bbl)}
      />
    </div>
  );
};

export const SubscriptionField = withI18n()(SubscriptionFieldWithoutI18n);

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { home } = createWhoOwnsWhatRoutePaths();
  const { pathname } = useLocation();
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;
  const user = userContext.user as JustfixUser;
  const { email, subscriptions } = user;
  const subscriptionsNumber = !!subscriptions ? subscriptions.length : 0;

  const unsubscribeBuilding = (bbl: string) => {
    userContext.unsubscribe(bbl);
    window.gtag("event", "unsubscribe-building", {
      user_id: user.id,
      user_type: user.type,
      from: "account settings",
    });
  };

  return (
    <Page title={i18n._(t`Account`)}>
      <div className="AccountSettingsPage Page">
        <div className="page-container">
          <Trans render="h1">Email settings</Trans>
          <div className="settings-section">
            <div className="log-in-out">
              <Trans render="h2">You are logged in</Trans>
              <Button
                type="button"
                variant="tertiary"
                size="small"
                labelText={i18n._(t`Logout`)}
                onClick={() => userContext.logout(pathname)}
              />
            </div>
            <EmailSettingField
              currentValue={email}
              onSubmit={(newEmail: string) => userContext.updateEmail(newEmail)}
            />
            <PasswordSettingField
              onSubmit={(currentPassword: string, newPassword: string) =>
                userContext.updatePassword(currentPassword, newPassword)
              }
            />
          </div>
          <div className="settings-section">
            <Trans render="h2">Building Alerts</Trans>
            <Trans render="p" className="section-description">
              There <Plural value={subscriptionsNumber} one="is" other="are" />{" "}
              {subscriptionsNumber}{" "}
              <Plural value={subscriptionsNumber} one="building" other="buildings" /> in your weekly
              emails
            </Trans>
            <div className="subscriptions-container">
              {subscriptions?.length ? (
                <>
                  {subscriptions.map((s) => (
                    <SubscriptionField key={s.bbl} {...s} onRemoveClick={unsubscribeBuilding} />
                  ))}
                </>
              ) : (
                <Trans render="div" className="settings-no-subscriptions">
                  <LocaleNavLink exact to={home}>
                    Search for an address
                  </LocaleNavLink>{" "}
                  to add to your Building Alerts
                </Trans>
              )}
            </div>
          </div>
          <Trans render="div" className="settings-contact">
            Contact support@justfix.org to delete your account or get help
          </Trans>
        </div>
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
