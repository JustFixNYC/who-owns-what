import { Fragment, useState, useEffect } from "react";
import LegalFooter from "../components/LegalFooter";
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

  const delaySeconds = 5;
  const baseUrl = window.location.origin;
  const redirectUrl = `${baseUrl}/${i18n.language}/account/settings`;

  const updateCountdown = () => {
    let timeLeft = delaySeconds;
    const delayInterval = delaySeconds * 100;

    setInterval(() => {
      timeLeft--;
      document.getElementById("countdown")!.textContent = timeLeft.toString();
      if (timeLeft <= 0) {
        document.location.href = redirectUrl;
      }
    }, delayInterval);
  };

  const renderLandingPage = () => {
    const expiredLinkPage = (
      <Fragment>
        <br />
        <Trans render="h3" className="text-center">
          The link sent to you has timed out.
        </Trans>
        <br />
        <div className="text-center">
          <button
            className="button is-secondary"
            onClick={async () => {
              setShowConfirmation(await AuthClient.resendVerifyEmail());
            }}
          >
            <Trans>Resend verification email</Trans>
          </button>
        </div>
        <br />
      </Fragment>
    );

    const validLinkPage = (
      <Fragment>
        <Trans render="h3"> Verify this email: </Trans>
        <br />
        <h3 className="text-center">{!!user && user.email}</h3>
        <br />
        <Trans render="h3"> to receive Data Updates from Who Owns What. </Trans>
        <div className="text-center">
          <button
            className="button is-primary"
            onClick={() => {
              asyncVerifyEmail().then((result) => {
                const isVerified = result.statusCode === VerifyStatusCode.Success;
                setIsVerified(isVerified);
                setIsLinkExpired(result.statusCode === VerifyStatusCode.Expired);
                setShowConfirmation(isVerified);
              });
            }}
          >
            <Trans>Verify email</Trans>
          </button>
        </div>
      </Fragment>
    );
    return isLinkExpired ? expiredLinkPage : validLinkPage;
  };

  const asyncVerifyEmail = async () => {
    return await AuthClient.verifyEmail();
  };

  const renderConfirmationPage = () => {
    const resendEmailPage = (
      <Fragment>
        <Trans render="h3" className="text-center">
          Check your email inbox & spam
        </Trans>
        <br />
        <Trans className="text-center">
          Click the link we sent to verify your email address {!!user && user.email}. It may take a
          few minutes to arrive. Once your email has been verified, you’ll be signed up for Data
          Updates.
        </Trans>
      </Fragment>
    );

    const verifyAndRedirectPage = () => (
      <Fragment>
        <Trans className="text-center" render="h3">
          Your email is now verified
        </Trans>
        <br />
        <div className="text-center">
          <Trans className="text-center">You will be redirected back to Who Owns What in:</Trans>
          <br>{updateCountdown()}</br>
          <Trans className="d-flex justify-content-center">
            <span id="countdown">{delaySeconds}</span> seconds
          </Trans>
          <br />
          <br />
          <Trans className="text-center">
            If you are not redirected, please click <a href={redirectUrl}>[here]</a>
          </Trans>
        </div>
      </Fragment>
    );
    return isVerified ? verifyAndRedirectPage() : resendEmailPage;
  };

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        <div className="page-container">
          {showConfirmation ? renderConfirmationPage() : renderLandingPage()}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
