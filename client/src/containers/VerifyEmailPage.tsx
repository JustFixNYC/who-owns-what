import { useState, useEffect } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useLocation } from "react-router-dom";

import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import SendNewLink from "components/SendNewLink";
import StandalonePage from "components/StandalonePage";

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
      <Trans render="h1">Email address verified</Trans>
      <Trans render="h2">You can now start receiving Building Updates</Trans>
    </>
  );

  const alreadyVerifiedPage = () => <Trans render="h1">Your email is already verified</Trans>;

  return (
    <StandalonePage title={i18n._(t`Verify your email address`)} className="VerifyEmailPage2">
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
