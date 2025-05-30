import React, { useContext } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans, Plural } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/AccountSettingsPage.css";
import "styles/UserSetting.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { EmailSettingField, PasswordSettingField } from "components/UserSettingField";
import { DistrictSubscription, JustfixUser } from "state-machine";
import { createRouteForAddressPage, createWhoOwnsWhatRoutePaths } from "routes";
import { Borough } from "components/APIDataTypes";
import { LocaleNavLink } from "i18n";
import { useLocation } from "react-router-dom";
import helpers from "util/helpers";

type BuildingSubscriptionFieldProps = withI18nProps & {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
  onRemoveClick: (bbl: string) => void;
};

const BuildingSubscriptionFieldWithoutI18n = (props: BuildingSubscriptionFieldProps) => {
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
        <span className="street-address">{`${housenumber} ${helpers.titleCase(streetname)},`}</span>
        <span>{`${helpers.titleCase(boro)}, NY`}</span>
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

export const BuildingSubscriptionField = withI18n()(BuildingSubscriptionFieldWithoutI18n);

type DistrictSubscriptionFieldProps = withI18nProps &
  DistrictSubscription & {
    onRemoveClick: (bbl: string) => void;
  };

const DistrictSubscriptionFieldWithoutI18n = (props: DistrictSubscriptionFieldProps) => {
  const { district, pk, onRemoveClick, i18n } = props;
  return (
    <div className="subscription-field">
      <span className="subscription-district">
        {district.map((area, i) => helpers.formatTranslatedAreaLabel(area, i18n)).join(", ")}
      </span>
      <Button
        type="submit"
        variant="secondary"
        size="small"
        labelText={i18n._(t`Remove`)}
        onClick={() => onRemoveClick(pk)}
      />
    </div>
  );
};

export const DistrictSubscriptionField = withI18n()(DistrictSubscriptionFieldWithoutI18n);

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { home, areaAlerts } = createWhoOwnsWhatRoutePaths();
  const { pathname } = useLocation();
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;
  const user = userContext.user as JustfixUser;
  const { email, buildingSubscriptions, districtSubscriptions } = user;
  const buildingSubscriptionsNumber = buildingSubscriptions?.length || 0;
  const districtSubscriptionsNumber = districtSubscriptions?.length || 0;

  const unsubscribeBuilding = (bbl: string) => {
    userContext.unsubscribeBuilding(bbl);
    window.gtag("event", "unsubscribe-building", {
      user_id: user.id,
      user_type: user.type,
      from: "account settings",
    });
  };
  const unsubscribeDistrict = (subscriptionId: string) => {
    userContext.unsubscribeDistrict(subscriptionId);
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
              There <Plural value={buildingSubscriptionsNumber} one="is" other="are" />{" "}
              {buildingSubscriptionsNumber}{" "}
              <Plural value={buildingSubscriptionsNumber} one="building" other="buildings" /> in
              your weekly emails
            </Trans>
            <div className="subscriptions-container building-subscriptions-container">
              {buildingSubscriptions?.length ? (
                <>
                  {buildingSubscriptions.map((s) => (
                    <BuildingSubscriptionField
                      key={s.bbl}
                      {...s}
                      onRemoveClick={unsubscribeBuilding}
                    />
                  ))}
                </>
              ) : (
                <Trans render="div" className="settings-callout">
                  <LocaleNavLink exact to={home}>
                    Search an address
                  </LocaleNavLink>{" "}
                  to add to your Building Alerts
                </Trans>
              )}
            </div>
            <Trans render="h2">Area Alerts</Trans>
            <Trans render="p" className="section-description">
              {districtSubscriptionsNumber ? (
                <>
                  You are subscribed to{" "}
                  <Plural
                    value={districtSubscriptionsNumber}
                    one="a weekly email for 1 area"
                    other={`weekly emails for ${districtSubscriptionsNumber} areas`}
                  />
                </>
              ) : (
                <>You have not added area alerts to your weekly emails.</>
              )}
            </Trans>
            <div className="subscriptions-container district-subscriptions-container">
              {districtSubscriptions?.length ? (
                <>
                  {districtSubscriptions.map((s) => (
                    <DistrictSubscriptionField
                      key={s.pk}
                      {...s}
                      onRemoveClick={unsubscribeDistrict}
                    />
                  ))}
                  <Trans render="div" className="settings-callout">
                    <LocaleNavLink exact to={areaAlerts}>
                      Add another area alert
                    </LocaleNavLink>
                  </Trans>
                </>
              ) : (
                <Trans render="div" className="settings-callout">
                  <p>
                    Get a weekly email that identifies buildings and portfolios that exhibit urgent
                    displacement indicators within a single area or multiple areas of the city.
                  </p>
                  <LocaleNavLink exact to={areaAlerts}>
                    Add area alerts
                  </LocaleNavLink>{" "}
                  to add to your weekly emails
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
