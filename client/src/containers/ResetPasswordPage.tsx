import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import AuthClient, { ResetStatusCode } from "components/AuthClient";
import PasswordInput from "components/PasswordInput";
import { useInput } from "util/helpers";
import { FixedLoadingLabel } from "components/Loader";

const ResetPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const [tokenStatus, setTokenStatus] = React.useState<ResetStatusCode>();
  const [requestSent, setRequestSent] = React.useState(false);
  const {
    value: password,
    error: passwordError,
    showError: showPasswordError,
    setShowError: setShowPasswordError,
    setError: setPasswordError,
    onChange: onChangePassword,
  } = useInput("");

  const delaySeconds = 5;
  const baseUrl = window.location.origin;
  const redirectUrl = `${baseUrl}/${i18n.language}/account/login`;

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

  useEffect(() => {
    const asyncCheckToken = async () => {
      return await AuthClient.resetPasswordCheck();
    };

    asyncCheckToken().then((result) => {
      setTokenStatus(result.statusCode);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || passwordError) {
      setPasswordError(true);
      setShowPasswordError(true);
      return;
    }

    const resp = await AuthClient.resetPassword(params.get("token") || "", password);
    if (resp.statusCode === ResetStatusCode.Success) {
      
    } else {
      setTokenStatus(resp.statusCode);
    }
  };

  const expiredTokenPage = () => (
    <>
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
    </>
  )

  const invalidTokenPage = () => (
    <>
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
    </>
  )

  const resetPasswordPage = () => (
    <>
      <Trans render="h4">Reset your password</Trans>
      <form className="input-group" onSubmit={handleSubmit}>
        <PasswordInput
          labelText={i18n._(t`Create a password`)}
          showPasswordRules={true}
          password={password}
          onChange={onChangePassword}
          error={passwordError}
          showError={showPasswordError}
          setError={setPasswordError}
        />
        <button type="submit" className="button is-primary">
          <Trans>Reset password</Trans>
        </button>
      </form>
    </>
  );

  const successPage = () => (
    <>
      <Trans className="text-center" render="h4">
        Your password has successfully been reset
      </Trans>
      <br />
      <div className="text-center">
        <Trans className="text-center">You will be redirected back to Who Owns What in</Trans>
        <br>{updateCountdown()}</br>
        <Trans className="d-flex justify-content-center">
          <span id="countdown"> {delaySeconds}</span> seconds
        </Trans>
        <br />
        <br />
        <Trans className="text-center">
          <a href={redirectUrl} style={{ color: "#242323" }}>
            Click to log in
          </a>{" "}
          if you are not redirected
        </Trans>
      </div>
    </>
  );

  return (
    <Page title={i18n._(t`Reset your password`)}>
      <div className="ResetPasswordPage Page">
        <div className="page-container">{tokenIsValid === undefined ? <FixedLoadingLabel/> : !tokenIsValid ? invalidTokenPage() : passwordIsReset ? successPage() : resetPasswordPage()}</div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default ResetPasswordPage;
