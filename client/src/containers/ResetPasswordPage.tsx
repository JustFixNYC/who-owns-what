import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import AuthClient, { ResetStatusCode } from "components/AuthClient";
import PasswordInput from "components/PasswordInput";
import { useInput } from "util/helpers";
import { FixedLoadingLabel } from "components/Loader";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { JFCLLocaleLink, LocaleLink } from "i18n";
import SendNewLink from "components/SendNewLink";
import StandalonePage from "components/StandalonePage";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

const ResetPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const { account } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);

  const [tokenStatus, setTokenStatus] = React.useState<ResetStatusCode>();
  const [resetStatus, setResetStatus] = React.useState<ResetStatusCode>();
  const [emailIsResent, setEmailIsResent] = React.useState(false);
  const {
    value: password,
    error: passwordError,
    showError: showPasswordError,
    setShowError: setShowPasswordError,
    setError: setPasswordError,
    onChange: onChangePassword,
  } = useInput("");

  useEffect(() => {
    const asyncCheckToken = async () => {
      return await AuthClient.resetPasswordCheck();
    };

    asyncCheckToken().then((result) => {
      setTokenStatus(result.statusCode);
      switch (result.statusCode) {
        case ResetStatusCode.Expired:
          window.gtag("event", "forgot-password-expired", { branch: BRANCH_NAME });
          break;
        case ResetStatusCode.Invalid:
          window.gtag("event", "forgot-password-invalid", { branch: BRANCH_NAME });
          break;
        case ResetStatusCode.Unknown:
          window.gtag("event", "forgot-password-email-link-error", { branch: BRANCH_NAME });
          break;
      }
    });

    window.gtag("event", "forgot-password-email-link", { branch: BRANCH_NAME });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || passwordError) {
      setPasswordError(true);
      setShowPasswordError(true);
      return;
    }

    const resp = await AuthClient.resetPassword(params.get("token") || "", password);
    setResetStatus(resp.statusCode);
    if (resp.statusCode === ResetStatusCode.Success) {
      window.gtag("event", "forgot-password-reset-success", { branch: BRANCH_NAME });
    } else {
      window.gtag("event", "forgot-password-reset-error", { branch: BRANCH_NAME });
    }
  };

  const expiredPage = () => (
    <>
      <Trans render="h1">Reset Password</Trans>
      {emailIsResent ? (
        <Trans render="h2">Click the link we sent to your email to reset your password.</Trans>
      ) : (
        <Trans render="h2">The password reset link that we sent you is no longer valid.</Trans>
      )}
      <SendNewLink
        setParentState={setEmailIsResent}
        size="large"
        onClick={async () => setEmailIsResent(await AuthClient.resetPasswordRequest())}
      />
    </>
  );

  const invalidPage = () => {
    return (
      <>
        <Trans render="h1">Reset Password</Trans>
        <Trans render="h2">Sorry, something went wrong with the password reset.</Trans>
        <LocaleLink
          className="jfcl-button jfcl-variant-primary jfcl-size-large"
          to={account.forgotPassword}
          onClick={() =>
            window.gtag("event", "forgot-password-reset-resend", { branch: BRANCH_NAME })
          }
        >
          <Trans>Request new link</Trans>
        </LocaleLink>
      </>
    );
  };

  const resetPasswordPage = () => (
    <>
      <Trans render="h1">Reset Password</Trans>
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
        <Button
          type="submit"
          variant="primary"
          size="large"
          labelText={i18n._(t`Reset password`)}
        />
      </form>
    </>
  );

  const successPage = () => (
    <>
      <Trans render="h1">Password reset successful</Trans>
      <div className="standalone-footer">
        <JFCLLocaleLink
          to={account.login}
          onClick={() =>
            window.gtag("event", "forgot-password-reset-return-login", { branch: BRANCH_NAME })
          }
        >
          <Trans>Back to Log in</Trans>
        </JFCLLocaleLink>
      </div>
    </>
  );

  return (
    <StandalonePage title={i18n._(t`Reset your password`)} className="ResetPasswordPage2">
      {tokenStatus === undefined ? (
        <FixedLoadingLabel />
      ) : resetStatus === ResetStatusCode.Success ? (
        successPage()
      ) : tokenStatus === ResetStatusCode.Accepted ? (
        resetPasswordPage()
      ) : tokenStatus === ResetStatusCode.Expired ? (
        expiredPage()
      ) : (
        invalidPage()
      )}
    </StandalonePage>
  );
});

export default ResetPasswordPage;
