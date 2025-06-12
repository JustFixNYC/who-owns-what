import { useState, useEffect } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useLocation } from "react-router-dom";

import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import SendNewLink from "components/SendNewLink";
import StandalonePage from "components/StandalonePage";
import { JFCLLocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { BuildingSubscription, DistrictSubscription } from "state-machine";
import { Icon } from "@justfixnyc/component-library";
import "styles/VerifyEmailPage.css";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isEmailResent, setIsEmailResent] = useState(false);
  const [unknownError, setUnknownError] = useState(false);
  const params = new URLSearchParams(search);
  const token = params.get("u") || "";
  const { home, areaAlerts } = createWhoOwnsWhatRoutePaths();

  const [buildingSubs, setBuildingSubs] = useState<BuildingSubscription[]>();
  const buildingSubsNumber = buildingSubs?.length;

  const [districtSubs, setDistrictSubs] = useState<DistrictSubscription[]>();
  const districtSubsNumber = districtSubs?.length;

  useEffect(() => {
    const asyncFetchSubscriptions = async () => {
      const response = await AuthClient.emailUserSubscriptions(token);
      setBuildingSubs(response["building_subscriptions"]);
      setDistrictSubs(response["district_subscriptions"]);
    };
    asyncFetchSubscriptions();
  }, [token]);

  useEffect(() => {
    const asyncVerifyEmail = async () => {
      return await AuthClient.verifyEmail();
    };

    asyncVerifyEmail().then((result) => {
      switch (result.statusCode) {
        case VerifyStatusCode.Success:
          setIsVerified(true);
          window.gtag("event", "email-verify-success", { branch: BRANCH_NAME });
          break;
        case VerifyStatusCode.AlreadyVerified:
          setIsVerified(true);
          setIsAlreadyVerified(true);
          window.gtag("event", "email-verify-already", { branch: BRANCH_NAME });
          break;
        case VerifyStatusCode.Expired:
          setIsExpired(true);
          window.gtag("event", "email-verify-expired", { branch: BRANCH_NAME });
          break;
        default:
          setUnknownError(true);
          window.gtag("event", "email-verify-error", { branch: BRANCH_NAME });
      }
      setLoading(false);
    });
  }, []);

  const expiredLinkPage = () => (
    <div className="text-center">
      {isEmailResent ? (
        <Trans render="h1"> Click the link we sent to your email to start receiving emails.</Trans>
      ) : (
        <Trans render="h1">The verification link that we sent you is no longer valid.</Trans>
      )}
      <SendNewLink
        setParentState={setIsEmailResent}
        variant="primary"
        size="large"
        onClick={async () => {
          setIsEmailResent(await AuthClient.resendVerifyEmail(token));
          window.gtag("event", "email-verify-resend", { from: "verify page", branch: BRANCH_NAME });
        }}
      />
    </div>
  );

  // TODO add error logging
  const errorPage = () => (
    <>
      <Trans render="h1">We’re having trouble verifying your email at this time.</Trans>
      <Trans render="h2">
        Please try again later. If you’re still having issues, contact support@justfix.org.
      </Trans>
    </>
  );

  const successPage = () => (
    <>
      <Trans render="div" className="success-message">
        <Icon icon="check" />
        <span>Success</span>
      </Trans>
      <Trans render="h1">Email address verified</Trans>
      {(!!districtSubsNumber || !!buildingSubsNumber) && (
        <Trans render="h2">
          {districtSubsNumber && buildingSubsNumber ? (
            <>We will send your first Area Alert and Building Alert emails on Monday morning.</>
          ) : districtSubsNumber ? (
            <>We will send your first Area Alert email on Monday morning.</>
          ) : (
            <>We will send your first Building Alert email on Monday morning.</>
          )}
        </Trans>
      )}
      <Trans render="h2">
        You can now close this window,{" "}
        <JFCLLocaleLink to={home}>search for another building</JFCLLocaleLink> to follow, or{" "}
        <JFCLLocaleLink to={areaAlerts}>select an area</JFCLLocaleLink> to follow for alerts.
      </Trans>
    </>
  );

  const alreadyVerifiedPage = () => <Trans render="h1">Your email is already verified</Trans>;

  return (
    <StandalonePage title={i18n._(t`Verify your email address`)} id="VerifyEmailPage">
      {!loading &&
        (isVerified
          ? isAlreadyVerified
            ? alreadyVerifiedPage()
            : successPage()
          : isExpired
          ? expiredLinkPage()
          : unknownError && errorPage())}
    </StandalonePage>
  );
});

export default VerifyEmailPage;
