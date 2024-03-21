import React, { useContext } from "react";
import "styles/ForgotPasswordPage.css";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import { UserContext } from "components/UserContext";
import EmailInput from "components/EmailInput";
import { useInput } from "util/helpers";

const ForgotPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const [requestSent, setRequestSent] = React.useState(false);
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
    // TODO: should we confirm that the email already exists?
    resendPasswordResetRequest();
  };

  const resendPasswordResetRequest = async () => {
    await userContext.requestPasswordReset(email);
    setRequestSent(true);
  };

  return (
    <Page title={i18n._(t`Forgot your password?`)}>
      <div className="ForgotPasswordPage Page">
        <div className="page-container">
          <Trans render="h4" className="page-title">
            Reset Password
          </Trans>
          {!requestSent ? (
            <>
              <Trans render="h5">
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
                <button type="submit" className="button is-primary">
                  <Trans>Reset password</Trans>
                </button>
              </form>
            </>
          ) : (
            <div className="request-sent-success">
              <Trans render="h5">
                We sent a reset link to {`${email}`}. Please check your inbox and spam.
              </Trans>
              <Trans render="span">Didn’t receive an email?</Trans>
              <button
                className="button is-primary resend-link"
                onClick={resendPasswordResetRequest}
              >
                <Trans>Send new link</Trans>
              </button>
            </div>
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default ForgotPasswordPage;
