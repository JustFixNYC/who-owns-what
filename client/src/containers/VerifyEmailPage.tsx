import React, { Fragment, useState, useEffect } from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import AuthClient from "../components/AuthClient";
import { JustfixUser } from "state-machine";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [verified, setVerified] = useState(false);
  const [user, setUser] = useState<JustfixUser>();

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

  const renderPreVerificationPage = () => {
    return (
      <Fragment>
        <br />
        <Trans render="h3"> Verify this email: </Trans>
        <br />
        <Trans className="text-center" render="h3">
          {user?.email}
        </Trans>
        <br />
        <Trans render="h3"> to receive Data Updates from Who Owns What. </Trans>
        <br />
        <div className="text-center">
          <button
            className="button is-primary"
            onClick={async () => {
              // TODO shakao: error messaging and handling
              setVerified(await AuthClient.verifyEmail());
            }}
          >
            <Trans>Verify email</Trans>
          </button>
        </div>
      </Fragment>
    );
  };

  const renderPostVerificationPage = () => {
    return (
      <Fragment>
        <br />
        <Trans className="text-center" render="h3">
          Your email is now verified
        </Trans>
        <br />
        <div className="text-center">
          <Trans className="text-center">You will be redirected back to Who Owns What in:</Trans>
          <br>{updateCountdown()}</br>

          <Trans className="d-flex justify-content-center">
            <span id="countdown">5</span> seconds
          </Trans>
          <br />
          <br />
          <Trans className="text-center">
            If you are not redirected, please click <a href={redirectUrl}>[here]</a>
          </Trans>
        </div>
      </Fragment>
    );
  };

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        <div className="page-container">
          {!verified ? renderPreVerificationPage() : renderPostVerificationPage()}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
