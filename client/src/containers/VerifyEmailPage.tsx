import { useState, useEffect } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import AuthClient, { VerifyStatusCode } from "../components/AuthClient";
import { JustfixUser } from "state-machine";
import Page from "components/Page";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [user, setUser] = useState<JustfixUser>();
  const [isVerified, setIsVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isEmailResent, setIsEmailResent] = useState(false);

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

  useEffect(() => {
    const asyncVerifyEmail = async () => {
      return await AuthClient.verifyEmail();
    };

    asyncVerifyEmail().then((result) => {
      if (
        result.statusCode === VerifyStatusCode.Success ||
        result.statusCode === VerifyStatusCode.AlreadyVerified
      ) {
        setIsVerified(true);
      }

      if (
        result.statusCode === VerifyStatusCode.Expired ||
        result.statusCode === VerifyStatusCode.Unknown
      ) {
        setIsExpired(true);
      }
    });
  }, []);

  const expiredLinkPage = () => {
    const resendEmailPage = (
      <div className="text-center">
        <Trans render="h4">The link sent to you has timed out.</Trans>
        <br />
        <button
          className="button is-secondary"
          onClick={async () => {
            setIsEmailResent(await AuthClient.resendVerifyEmail());
          }}
        >
          <Trans>Resend verification email</Trans>
        </button>
      </div>
    );

    const resendEmailConfirmation = (
      <div className="text-center">
        <Trans render="h4">Check your email inbox & spam</Trans>
        <br />
        <Trans>
          Click the link we sent to verify your email address {!!user && user.email}. It may take a
          few minutes to arrive. Once your email has been verified, you’ll be signed up for Data
          Updates.
        </Trans>
      </div>
    );

    return isEmailResent ? resendEmailConfirmation : resendEmailPage;
  };

  const successPage = () => (
    <div className="text-center">
      <Trans render="h4">Email verified</Trans>
      <br />
      <Trans render="h4">You are now signed up for weekly Data Updates.</Trans>
    </div>
  );

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="TextPage Page">
        <div className="page-container">
          {isVerified ? successPage() : isExpired && expiredLinkPage()}
        </div>
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
