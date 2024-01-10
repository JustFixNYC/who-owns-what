import { useState, useEffect } from "react";
import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import { JustfixUser } from "state-machine";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [user, setUser] = useState<JustfixUser>();
  const [isVerified, setIsVerified] = useState(false);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const asyncFetchUser = async () => {
      const _user = await AuthClient.fetchUser();
      if (_user) {
        setUser({
          ..._user,
          subscriptions:
            _user.subscriptions?.map((s: any) => {
              return { ...s };
            }) || [],
        });
        setIsVerified(_user.verified);
      }
    };
    asyncFetchUser();
  }, []);

  const asyncVerifyEmail = async () => {
    return await AuthClient.verifyEmail();
  };

  const renderLandingPage = () => {
    const expiredLinkPage = (
      <div className="text-center">
        <Trans render="h4">The link sent to you has timed out.</Trans>
        <br />
        <button
          className="button is-secondary"
          onClick={async () => {
            setShowConfirmation(await AuthClient.resendVerifyEmail());
          }}
        >
          <Trans>Resend verification email</Trans>
        </button>
      </div>
    );

    const validLinkPage = (
      <div className="text-center">
        <Trans render="h4" className="text-left">
          {" "}
          Verify this email:{" "}
        </Trans>
        <br />
        <h4>{!!user && user.email}</h4>
        <br />
        <Trans render="h4" className="text-left">
          {" "}
          to receive Data Updates from Who Owns What.{" "}
        </Trans>
        <button
          className="button is-primary"
          onClick={() => {
            asyncVerifyEmail().then((result) => {
              const isVerified =
                result.statusCode === VerifyStatusCode.Success ||
                result.statusCode === VerifyStatusCode.AlreadyVerified;
              setIsVerified(isVerified);
              setIsLinkExpired(result.statusCode === VerifyStatusCode.Expired);
              setShowConfirmation(isVerified);
            });
          }}
        >
          <Trans>Verify email</Trans>
        </button>
      </div>
    );
    return isLinkExpired ? expiredLinkPage : validLinkPage;
  };

  const renderConfirmationPage = () => {
    const resendEmailPage = (
      <>
        <Trans render="h4">Check your email inbox & spam</Trans>
        <br />
        <Trans>
          Click the link we sent to verify your email address {!!user && user.email}. It may take a
          few minutes to arrive. Once your email has been verified, you’ll be signed up for Data
          Updates.
        </Trans>
      </>
    );

    const successPage = () => (
      <>
        <Trans render="h4">Email verified</Trans>
        <br />
        <Trans render="h4">You are now signed up for weekly Data Updates.</Trans>
      </>
    );

    return isVerified ? successPage() : resendEmailPage;
  };

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="TextPage Page">
        <div className="page-container">
          {showConfirmation ? renderConfirmationPage() : renderLandingPage()}
        </div>
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
