import { useState, useEffect } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import Page from "components/Page";
import { useLocation } from "react-router-dom";

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

  const expiredLinkPage = () => {
    const resendEmailPage = (
      <div className="text-center">
        <Trans render="h4">The link sent to you has timed out.</Trans>
        <br />
        <button
          className="button is-secondary"
          onClick={async () => {
            setIsEmailResent(await AuthClient.resendVerifyEmail(token));
          }}
        >
          <Trans>Send new link</Trans>
        </button>
      </div>
    );

    const resendEmailConfirmation = (
      <div className="text-center">
        <Trans render="h4">Check your email inbox & spam</Trans>
        <br />
        <Trans>
          Click the link we sent to verify your email address. It may take a few minutes to arrive.
          Once your email has been verified, you’ll be signed up for Building Updates.
        </Trans>
      </div>
    );

    return isEmailResent ? resendEmailConfirmation : resendEmailPage;
  };

  // TODO add error logging
  const errorPage = () => (
    <div className="text-center">
      <Trans render="h4">We’re having trouble verifying your email at this time.</Trans>
      <br />
      <Trans>
        Please try again later. If you’re still having issues, contact support@justfix.org.
        <br />
        <br />A report about this issue has been sent to our team.
      </Trans>
    </div>
  );

  const successPage = () => (
    <div className="text-center">
      <Trans render="h4">Email verified</Trans>
      <br />
      <Trans render="h4">You are now signed up for weekly Building Updates.</Trans>
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
      <div className="TextPage Page">
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
