import React, { useContext } from "react";
import LegalFooter from "../components/LegalFooter";
import { CSSTransition } from "react-transition-group";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/AccountSettingsPage.css";
import "styles/UserSetting.css";
import { UserContext } from "components/UserContext";
import { EmailSettingField, PasswordSettingField } from "components/UserSettingField";
import { BuildingSubscription, JustfixUser } from "state-machine";
import {
  createRouteForAddressPage,
  createRouteForFullBbl,
  createWhoOwnsWhatRoutePaths,
} from "routes";
import { Borough } from "components/APIDataTypes";
import { LocaleNavLink } from "i18n";
import { Alert } from "components/Alert";

type SubscriptionFieldProps = {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
  onRemoveClick: (bbl: string) => void;
};

const SubscriptionFieldWithoutI18n = (props: SubscriptionFieldProps) => {
  const { bbl, housenumber, streetname, boro, onRemoveClick } = props;
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
        <span>{`${housenumber} ${streetname},`}</span>
        <span>{`${boro}, NY`}</span>
      </a>
      <button className="button is-secondary" onClick={() => onRemoveClick(bbl)}>
        <Trans>Remove</Trans>
      </button>
    </div>
  );
};

export const SubscriptionField = withI18n()(SubscriptionFieldWithoutI18n);

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { email, subscriptions } = userContext.user as JustfixUser;
  const { home } = createWhoOwnsWhatRoutePaths();

  const [removedSubscription, setRemovedSubscription] = React.useState<
    BuildingSubscription | undefined
  >(undefined);
  const [showToast, setShowToast] = React.useState(false);

  return (
    <Page title={i18n._(t`Account settings`)}>
      <div className="AccountSettingsPage Page">
        <div className="page-container">
          <h4>
            <Trans>Account settings</Trans>
          </h4>
          <h4 className="settings-section">
            <Trans>Login details</Trans>
          </h4>
          <EmailSettingField
            currentValue={email}
            onSubmit={(newEmail: string) => userContext.updateEmail(newEmail)}
          />
          <PasswordSettingField
            onSubmit={(currentPassword: string, newPassword: string) =>
              userContext.updatePassword(currentPassword, newPassword)
            }
          />
          <h4 className="settings-section">
            {subscriptions?.length ? (
              <Trans>You’re signed up for email updates from these buildings:</Trans>
            ) : (
              <Trans>Sign up for Data Updates on the buildings you choose:</Trans>
            )}
          </h4>
          <div>
            {subscriptions?.length ? (
              subscriptions.map((s) => (
                <SubscriptionField
                  key={s.bbl}
                  {...s}
                  onRemoveClick={(bbl: string) => {
                    setRemovedSubscription(subscriptions.find((s) => s.bbl === bbl));
                    setShowToast(true);
                    userContext.unsubscribe(bbl);
                  }}
                />
              ))
            ) : (
              <Trans render="div" className="settings-no-subscriptions">
                <LocaleNavLink exact to={home}>
                  Search an address
                </LocaleNavLink>{" "}
                to sign up for email alerts for that building.
              </Trans>
            )}
          </div>
          <div className="settings-contact">
            <Trans>If you’d like to delete your account,</Trans>
            <br />
            <Trans>contact support@justfix.org </Trans>
          </div>
        </div>
        <LegalFooter />
        <div className="remove-bldg-toast-container">
          <CSSTransition
            in={!!removedSubscription && showToast}
            timeout={3000}
            classNames="remove-bldg-toast-alert"
            onEntered={() => setShowToast(false)}
          >
            <Alert
              className="remove-bldg-toast-alert"
              type="info"
              variant="secondary"
              closeType="state"
              role="status"
            >
              {!!removedSubscription && (
                <Trans>
                  You’ve removed{" "}
                  <a
                    href={createRouteForFullBbl(removedSubscription!.bbl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >{`${removedSubscription!.housenumber} ${removedSubscription!.streetname}, ${
                    removedSubscription!.boro
                  }`}</a>{" "}
                  from your Data Updates.
                </Trans>
              )}
            </Alert>
          </CSSTransition>
        </div>
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
