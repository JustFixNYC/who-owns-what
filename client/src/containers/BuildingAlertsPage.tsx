import { useContext, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { useHistory } from "react-router-dom";
import { Button, Icon, Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/BuildingAlertsPage.css";

import Page from "components/Page";
import AddressSearch, { SearchAddress } from "components/AddressSearch";
import { EmailVerificationPrompt, reloginToVerify } from "components/EmailAlertSignup";
import { Alert } from "components/Alert";
import { LocationIcon } from "components/Icons";
import LegalFooter from "components/LegalFooter";
import Modal from "components/Modal";
import APIClient from "components/APIClient";
import { UserContext } from "components/UserContext";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import helpers from "util/helpers";
import { AddressRecord } from "components/APIDataTypes";

const DEFAULT_SUBSCRIPTION_LIMIT = 15;
const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const BuildingAlertsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const history = useHistory();
  const { account } = createWhoOwnsWhatRoutePaths();

  const userContext = useContext(UserContext);
  const { user, subscribeBuilding } = userContext;
  const isLoggedIn = !!user?.email;
  const subscriptionLimit = user?.subscriptionLimit ?? DEFAULT_SUBSCRIPTION_LIMIT;
  const atSubscriptionLimit =
    isLoggedIn && (user?.buildingSubscriptions?.length ?? 0) >= subscriptionLimit;

  const [selectedAddress, setSelectedAddress] = useState<SearchAddress>();
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [noAddressError, setNoAddressError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const handleAddressSelected = (searchAddress: SearchAddress, error: any) => {
    window.gtag("event", "building-alert-address-search", { bbl: searchAddress.bbl });

    // reset any prior selection so a stale success state doesn't linger
    setSelectedAddress(undefined);
    setLoadError(false);
    setNoAddressError(false);
    setShowVerifyEmail(false);

    if (error || !searchAddress.bbl) {
      window.gtag("event", "building-alert-search-error");
      setLoadError(true);
      return;
    }

    setSelectedAddress(searchAddress);
  };

  const clearErrors = () => {
    setLoadError(false);
    setNoAddressError(false);
  };

  const handleInputChange = (value: string) => {
    clearErrors();
    if (!value) {
      setSelectedAddress(undefined);
    }
  };

  const navigateToLogin = (addr: AddressRecord) => {
    window.gtag("event", "register-login-via-building-alert");
    const loginRoute = `/${i18n.language}${account.login}`;
    const settingsRoute = `/${i18n.language}${account.settings}`;
    history.push({
      pathname: loginRoute,
      state: { addr, returnRoute: settingsRoute, fromBuildingAlerts: true },
    });
  };

  const redirectToSettings = () => {
    history.push({
      pathname: `/${i18n.language}${account.settings}`,
      state: { justSubscribed: true, subscribedTo: "building" },
    });
  };

  const handleGetStarted = async () => {
    if (!selectedAddress?.bbl) {
      setLoadError(false);
      setNoAddressError(true);
      return;
    }

    setNoAddressError(false);
    setLoadError(false);
    setShowVerifyEmail(false);

    setIsLoadingRecord(true);
    let addressRecord: AddressRecord | undefined;
    try {
      const { boro, block, lot } = helpers.splitBBL(selectedAddress.bbl);
      const results = await APIClient.searchForBBL({ boro, block, lot });
      addressRecord = results.addrs.find((a) => a.bbl === selectedAddress.bbl);
      if (!addressRecord) {
        setLoadError(true);
        return;
      }
    } catch (e) {
      setLoadError(true);
      return;
    } finally {
      setIsLoadingRecord(false);
    }

    if (!isLoggedIn) {
      navigateToLogin(addressRecord);
      return;
    }

    if (!user?.verified) {
      setShowVerifyEmail(true);
      return;
    }

    if (atSubscriptionLimit) {
      const params = { user_id: user?.id, user_type: user?.type, limit: subscriptionLimit };
      window.gtag("event", "building-alert-subscription-limit-exceed-attempt", { ...params });
      setShowSubscriptionLimitModal(true);
      return;
    }

    subscribeBuilding(
      addressRecord.bbl,
      addressRecord.housenumber,
      addressRecord.streetname,
      addressRecord.zip ?? "",
      addressRecord.boro
    );
    redirectToSettings();
  };

  const labelText = <Trans>Enter your address</Trans>;

  return (
    <Page title={i18n._(t`Building Alerts`)}>
      <div className="BuildingAlertsPage Page">
        <div className="BuildingAlertsPage__hero">
          <div className="BuildingAlertsPage__hero-content">
            <h1>
              <Trans>Track complaints, violations, and eviction filings in your building.</Trans>
            </h1>

            <Trans render="p">
              This service is free and confidential. <br />
              Updates are sent weekly to your inbox.{" "}
              <JFCLLink onClick={() => setShowPreviewModal(true)} className="link-button">
                See example
              </JFCLLink>
            </Trans>
            {isLoggedIn && !user?.verified && (
              <div className="BuildingAlertsPage__unverified-banner">
                <Alert type="info" closeType="session" storageId="wow-unverified-relogin-banner">
                  <Trans>Verify your email to receive updates and to add new buildings.</Trans>{" "}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => reloginToVerify(user?.email, i18n.language)}
                  >
                    <Trans>Log in</Trans>
                  </button>
                </Alert>
              </div>
            )}
            <div className="BuildingAlertsPage__search">
              <div className="BuildingAlertsPage__search-input-container">
                <div className="BuildingAlertsPage__search-input">
                  <span className="BuildingAlertsPage__search-icon">
                    <LocationIcon />
                  </span>
                  <AddressSearch
                    labelText={labelText}
                    labelClass="text-assistive"
                    placeholder={i18n._(t`Enter your address`)}
                    onFormSubmit={handleAddressSelected}
                    onInputChange={handleInputChange}
                  />
                </div>
                <Button
                  labelText={i18n._(t`Track Building`)}
                  loading={isLoadingRecord}
                  onClick={handleGetStarted}
                />
              </div>

              {showVerifyEmail && (
                <div className="BuildingAlertsPage__feedback">
                  <EmailVerificationPrompt
                    email={user?.email}
                    analyticsFrom="building alerts page"
                    eventUserParams={{ user_id: user?.id, user_type: user?.type }}
                  />
                </div>
              )}
            </div>
            {loadError ? (
              <div className="BuildingAlertsPage__error">
                <Icon icon="circleExclamation" />
                <Trans>
                  Sorry, that address is not available for Building Alerts. Please try another
                  address.
                </Trans>
              </div>
            ) : (
              noAddressError && (
                <div className="BuildingAlertsPage__error">
                  <Icon icon="circleExclamation" />
                  <Trans>Please enter an address</Trans>
                </div>
              )
            )}
          </div>
        </div>

        <div className="BuildingAlertsPage__section BuildingAlertsPage__section--bordered">
          <div className="BuildingAlertsPage__section-content">
            <h3>
              <Trans>What you’ll get</Trans>
            </h3>
            <Trans render="p">In your weekly email we’ll include the number of new:</Trans>
            <ol className="BuildingAlertsPage__list">
              <li>
                <strong className="BuildingAlertsPage__list-title">
                  <Trans>Complaints</Trans>
                </strong>
                <Trans render="p">
                  Complaints are made by tenants to the city about problems like leaks, lack of
                  heat, elevator outages, and unsafe construction.
                </Trans>
              </li>
              <li>
                <strong className="BuildingAlertsPage__list-title">
                  <Trans>Violations</Trans>
                </strong>
                <Trans render="p">
                  Violations are documented by city inspectors when they find that a building or
                  landlord has not complied with the law.
                </Trans>
              </li>
              <li>
                <strong className="BuildingAlertsPage__list-title">
                  <Trans>Eviction filings</Trans>
                </strong>
                <Trans render="p">
                  Eviction filings show when a landlord has started an eviction case in Housing
                  Court against a tenant in your building.
                </Trans>
              </li>
            </ol>
          </div>
        </div>

        <div className="BuildingAlertsPage__section BuildingAlertsPage__section--bordered">
          <div className="BuildingAlertsPage__section-content">
            <h3>
              <Trans>What you can do</Trans>
            </h3>
            <Trans render="p">
              This service can help you learn if the housing problems you’re facing on your own are
              widespread in your building.
            </Trans>
            <Trans render="p">
              You can use this information to connect with your neighbors and approach your landlord
              or city agencies to push for repairs and accountability.
            </Trans>
            <Trans render="p">
              Remember, you have a right to a habitable home.{" "}
              <a href="https://www.justfix.org/building-alerts/">Learn more</a> about your right to
              a habitable home.
            </Trans>
            <Trans render="p">
              You also have a right to organize with your neighbors to assert your rights.{" "}
              <a href="https://www.justfix.org/building-alerts/">Learn more</a> about your right to
              organize.
            </Trans>
          </div>
        </div>

        <div className="BuildingAlertsPage__section">
          <div className="BuildingAlertsPage__section-content">
            <h3>
              <Trans>About JustFix</Trans>
            </h3>
            <Trans render="p">
              Building Alerts is a free service created and maintained by JustFix, a nonprofit that
              builds free digital tools to help New Yorkers exercise their rights to healthy,
              affordable, and eviction-free housing.
            </Trans>
            <Trans render="p">
              Contact us at <a href="mailto:support@justfix.org">support@justfix.org</a>
            </Trans>
          </div>
        </div>

        <div className="BuildingAlertsPage__footer">
          <div className="BuildingAlertsPage__footer-content">
            <LegalFooter />
          </div>
        </div>

        <Modal
          showModal={showPreviewModal}
          width={40}
          onClose={() => setShowPreviewModal(false)}
          className="area-alerts-modal"
          newStyle={true}
        >
          <div className="modal__content">
            <h3>
              <Trans>Sample Building Alert Email</Trans>
            </h3>
            <figure>
              <img
                src="/building-alert-example-email.png"
                alt={i18n._(
                  t`Sample of building alert email showing complaints, violations, and eviction filings`
                )}
                className="email-sample-image"
              />
            </figure>
          </div>
        </Modal>

        <Modal
          showModal={showSubscriptionLimitModal}
          width={40}
          onClose={() => setShowSubscriptionLimitModal(false)}
        >
          <Trans render="h4">You have reached the maximum number of Building Alerts</Trans>
          <Trans>
            At this time we can only support {subscriptionLimit} buildings in each email. Please
            visit your <LocaleLink to={account.settings}>account</LocaleLink> to manage the
            buildings in your email. If you would like to track more buildings, please let us know
            by submiting a{" "}
            <a
              href={`https://form.typeform.com/to/ChJMCNYN#email=${user?.email}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                window.gtag("event", "subscription-limit-request", {
                  user_id: user?.id,
                  user_type: user?.type,
                  limit: subscriptionLimit,
                  branch: BRANCH_NAME,
                });
              }}
            >
              request form
            </a>
            .
          </Trans>
        </Modal>
      </div>
    </Page>
  );
});

export default BuildingAlertsPage;
