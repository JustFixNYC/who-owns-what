import { useContext, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { useHistory } from "react-router-dom";
import { Button, Icon, Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/BuildingAlertsPage.css";

import Page from "components/Page";
import AddressSearch, { SearchAddress } from "components/AddressSearch";
import { EmailVerificationPrompt } from "components/EmailAlertSignup";
import { LocationIcon } from "components/Icons";
import LegalFooter from "components/LegalFooter";
import Modal from "components/Modal";
import APIClient from "components/APIClient";
import { UserContext } from "components/UserContext";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import helpers from "util/helpers";
import { AddressRecord } from "components/APIDataTypes";
import { logAmplitudeEvent } from "components/Amplitude";

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

  const [addressRecord, setAddressRecord] = useState<AddressRecord>();
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [noAddressError, setNoAddressError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const handleAddressSelected = async (searchAddress: SearchAddress, error: any) => {
    logAmplitudeEvent("searchByAddress");
    window.gtag("event", "search", { bbl: searchAddress.bbl });

    // reset any prior selection so a stale success state doesn't linger
    setAddressRecord(undefined);
    setLoadError(false);
    setNoAddressError(false);
    setShowVerifyEmail(false);

    if (error || !searchAddress.bbl) {
      window.gtag("event", "search-error");
      setLoadError(true);
      return;
    }

    setIsLoadingRecord(true);
    try {
      const { boro, block, lot } = helpers.splitBBL(searchAddress.bbl);
      const results = await APIClient.searchForBBL({ boro, block, lot });
      const record = results.addrs.find((a) => a.bbl === searchAddress.bbl);
      if (!record) {
        setNoAddressError(false);
        setLoadError(true);
      } else {
        setAddressRecord(record);
      }
    } catch (e) {
      setNoAddressError(false);
      setLoadError(true);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const clearErrors = () => {
    setLoadError(false);
    setNoAddressError(false);
  };

  const navigateToLogin = (addr: AddressRecord) => {
    window.gtag("event", "register-login-via-building", { branch: BRANCH_NAME });
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

  const handleGetStarted = () => {
    if (!addressRecord) {
      setLoadError(false);
      setNoAddressError(true);
      return;
    }

    setNoAddressError(false);
    setLoadError(false);
    setShowVerifyEmail(false);

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
      window.gtag("event", "subscription-limit-exceed-attempt", { ...params });
      setShowSubscriptionLimitModal(true);
      return;
    }

    window.gtag("event", "subscribe-building-page", {
      user_id: user?.id,
      user_type: user?.type,
      branch: BRANCH_NAME,
    });
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
              <Trans>
                Track new complaints, violations, and eviction filings in your building.
              </Trans>
            </h1>

            <Trans render="p">
              This service is free and confidential.{" "}
              <JFCLLink onClick={() => setShowPreviewModal(true)} className="link-button">
                Preview an alert
              </JFCLLink>
            </Trans>
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
                    onInputChange={clearErrors}
                  />
                </div>
                <Button
                  labelText={i18n._(t`Get started`)}
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
            <Trans render="p">
              You’ll get weekly updates about new HPD complaints, HPD violations, DOB
              complaints/violations, and eviction filings in your building.
            </Trans>
            <h3>
              <Trans>Why it matters</Trans>
            </h3>
            <Trans render="p">
              You’ll be able to see whether issues that you’re dealing alone are also being reported
              by your neighbors.
            </Trans>
          </div>
        </div>

        <div className="BuildingAlertsPage__section">
          <div className="BuildingAlertsPage__section-content">
            <h3>
              <Trans>About this site</Trans>
            </h3>
            <Trans render="p">
              A nonprofit organization that builds online tools to help New Yorkers achieve
              affordable, healthy, eviction-free housing.
            </Trans>
          </div>
        </div>

        <LegalFooter />

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
