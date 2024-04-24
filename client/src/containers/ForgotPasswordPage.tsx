import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import { UserContext } from "components/UserContext";
import EmailInput from "components/EmailInput";
import { useInput } from "util/helpers";
import SendNewLink from "components/SendNewLink";
import StandalonePage from "components/StandalonePage";
import { JFCLLocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";

const ForgotPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const { account } = createWhoOwnsWhatRoutePaths();
  const params = new URLSearchParams(search);

  const [requestSent, setRequestSent] = React.useState(false);
  const [requestSentAgain, setRequestSentAgain] = React.useState(false);
  const userContext = useContext(UserContext);
  const {
    value: email,
    error: emailError,
    showError: showEmailError,
    setError: setEmailError,
    setShowError: setShowEmailError,
    onChange: onChangeEmail,
  } = useInput(decodeURIComponent(params.get("email") || ""));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }
    sendResetEmail();
    setRequestSent(true);
    window.gtag("event", "forgot-password-request");
  };

  const sendResetEmail = async () => {
    await userContext.requestPasswordReset(email);
  };

  return (
    <StandalonePage title={i18n._(t`Reset password?`)} className="ForgotPasswordPage">
      <Trans render="h1">Reset Password</Trans>
      {!requestSent ? (
        <>
          <Trans render="h2">
            Review your email address below. You’ll receive a "Reset password" email to this
            address.
          </Trans>
          <form onSubmit={handleSubmit} className="input-group">
            <EmailInput
              email={email}
              error={emailError}
              showError={showEmailError}
              setError={setEmailError}
              onChange={onChangeEmail}
              placeholder={i18n._(t`Enter email`)}
              labelText={i18n._(t`Email address`)}
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="large"
              labelText={i18n._(t`Reset password`)}
            />
          </form>
          <div className="standalone-footer">
            <JFCLLocaleLink to={account.login}>
              <Trans>Back to Log in</Trans>
            </JFCLLocaleLink>
          </div>
        </>
      ) : (
        <>
          <Trans render="h2">
            We sent a reset link to {`${email}`}. Please check your inbox and spam.
          </Trans>
          <div className="resend-email-container">
            {!requestSentAgain && (
              <Trans render="p" className="didnt-get-link">
                Didn’t receive an email?
              </Trans>
            )}
            <SendNewLink
              setParentState={setRequestSentAgain}
              size="large"
              onClick={() => {
                sendResetEmail();
                window.gtag("event", "forgot-password-resend");
              }}
            />
          </div>
        </>
      )}
    </StandalonePage>
  );
});

export default ForgotPasswordPage;
