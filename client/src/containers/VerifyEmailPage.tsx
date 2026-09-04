import { useState, useEffect, useContext } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useLocation } from "react-router-dom";

import { VerifyStatusCode } from "../components/AuthClient";
import { reportUnexpectedAuthError } from "../components/auth-errors";
import { NetworkError, reportError } from "error-reporting";
import { UserContext } from "components/UserContext";
import StandalonePage from "components/StandalonePage";
import { JFCLLocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import "styles/VerifyEmailPage.css";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const userContext = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [unknownError, setUnknownError] = useState(false);
  const params = new URLSearchParams(search);
  // Keep /account/verify-email/?code=&u= as the public entry point; only `code` is posted.
  const code = params.get("code") || "";
  const utmSource = params.get("utm_source") || undefined;
  const { home, account, areaAlerts } = createWhoOwnsWhatRoutePaths();

  useEffect(() => {
    const verifyMagicLink = async () => {
      if (!code) {
        reportError("Magic link landing missing code");
        setUnknownError(true);
        setLoading(false);
        return;
      }

      const result = await userContext.verifyMagicLink(code, utmSource);
      switch (result.statusCode) {
        case VerifyStatusCode.Success:
          if (result.user) {
            setIsLoggedIn(true);
            window.gtag("event", "email-verify-success", { branch: BRANCH_NAME });
            window.gtag("event", "login-success", { branch: BRANCH_NAME, from: "magic-link" });
          } else {
            setUnknownError(true);
            window.gtag("event", "email-verify-error", { branch: BRANCH_NAME });
            reportError("Magic link verify returned success without a user");
          }
          break;
        case VerifyStatusCode.AlreadyVerified:
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
          if (result.networkError) {
            reportUnexpectedAuthError(new NetworkError(result.error || "network"));
          } else {
            reportError(
              `Magic link verify failed (${result.statusCode}): ${
                result.error || result.statusText || "unknown"
              }`
            );
          }
      }
      setLoading(false);
    };

    verifyMagicLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginLink = () => (
    <div className="standalone-footer">
      <JFCLLocaleLink to={account.login}>
        <Trans>Back to Log in</Trans>
      </JFCLLocaleLink>
    </div>
  );

  const expiredLinkPage = () => (
    <div className="text-center">
      <Trans render="h1">The verification link that we sent you is no longer valid.</Trans>
      {loginLink()}
    </div>
  );

  const errorPage = () => (
    <>
      <Trans render="h1">We’re having trouble verifying your email at this time.</Trans>
      <Trans render="h2">
        Please try again later. If you’re still having issues, contact support@justfix.org.
      </Trans>
      {loginLink()}
    </>
  );

  const successPage = () => (
    <>
      <Trans render="h1">You are logged in</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to your Building
        Alerts, <JFCLLocaleLink to={areaAlerts}>subscribe to Area Alerts</JFCLLocaleLink>, or visit
        your <JFCLLocaleLink to={account.settings}>email settings</JFCLLocaleLink> page to manage
        subscriptions.
      </Trans>
    </>
  );

  const alreadyVerifiedPage = () => (
    <>
      <Trans render="h1">Your email is already verified</Trans>
      {loginLink()}
    </>
  );

  return (
    <StandalonePage title={i18n._(t`Verify your email address`)} id="VerifyEmailPage">
      {!loading &&
        (isLoggedIn
          ? successPage()
          : isAlreadyVerified
          ? alreadyVerifiedPage()
          : isExpired
          ? expiredLinkPage()
          : unknownError && errorPage())}
    </StandalonePage>
  );
});

export default VerifyEmailPage;
