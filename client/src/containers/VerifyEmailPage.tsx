import { useState, useEffect } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useLocation } from "react-router-dom";

import "styles/VerifyEmailPage.css";
import Page from "components/Page";
import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import SendNewLink from "components/SendNewLink";

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

  useEffect(() => {
    const asyncVerifyEmail = async () => {
      return await AuthClient.verifyEmail();
    };

    asyncVerifyEmail().then((result) => {
      switch (result.statusCode) {
        case VerifyStatusCode.Success:
          setIsVerified(true);
          break;
        case VerifyStatusCode.AlreadyVerified:
          setIsVerified(true);
          setIsAlreadyVerified(true);
          break;
        case VerifyStatusCode.Expired:
          setIsExpired(true);
          break;
        default:
          setUnknownError(true);
      }
      setLoading(false);
    });
  }, []);

  const delaySeconds = 5;
  const baseUrl = window.location.origin;
  const redirectUrl = `${baseUrl}/${i18n.language}`;

  const updateCountdown = () => {
    let timeLeft = delaySeconds;
    const delayInterval = delaySeconds * 100;

    setInterval(() => {
      timeLeft && timeLeft--; // prevents counter from going below 0
      document.getElementById("countdown")!.textContent = timeLeft.toString();
      if (timeLeft <= 0) {
        document.location.href = redirectUrl;
      }
    }, delayInterval);
  };

  const expiredLinkPage = () => (
    <div className="text-center">
      {isEmailResent ? (
        <Trans> Click the link we sent to your email to start receiving emails.</Trans>
      ) : (
        <Trans>The verification link that we sent you is no longer valid.</Trans>
      )}
      <SendNewLink
        setParentState={setIsEmailResent}
        variant="secondary"
        onClick={async () => {
          setIsEmailResent(await AuthClient.resendVerifyEmail(token));
        }}
      />
    </div>
  );

  // TODO add error logging
  const errorPage = () => (
    <div className="text-center">
      <Trans render="h4">We’re having trouble verifying your email at this time.</Trans>
      <br />
      <Trans>
        Please try again later. If you’re still having issues, contact support@justfix.org.
      </Trans>
    </div>
  );

  const successPage = () => (
    <div className="text-center">
      <Trans render="h4">Email address verified</Trans>
      <br />
      <Trans render="h4">You can now start receiving Building Updates</Trans>
    </div>
  );

  const alreadyVerifiedPage = () => (
    <div className="text-center">
      <Trans render="h4">Your email is already verified</Trans>
      <br />
      <Trans className="text-center">You will be redirected back to Who Owns What in:</Trans>
      <br />
      <br>{updateCountdown()}</br>
      <Trans className="d-flex justify-content-center">
        <span id="countdown">{delaySeconds}</span> seconds
      </Trans>
      <br />
      <br />
      <Trans className="text-center">If you are not redirected, please click this link:</Trans>
      <br />
      <a href={redirectUrl}>{redirectUrl}</a>
    </div>
  );

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        <div className="page-container">
          {!loading &&
            (isVerified
              ? isAlreadyVerified
                ? alreadyVerifiedPage()
                : successPage()
              : isExpired
              ? expiredLinkPage()
              : unknownError && errorPage())}
        </div>
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
