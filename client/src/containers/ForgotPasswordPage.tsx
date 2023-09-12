import React, { useContext } from "react";
import "styles/ForgotPasswordPage.css";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import { UserContext } from "components/UserContext";
import { MailIcon } from "components/Icons";

const ForgotPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const [requestSent, setRequestSent] = React.useState(false);
  const [email, setEmail] = React.useState(decodeURIComponent(params.get("email") || ""));
  const userContext = useContext(UserContext);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await userContext.requestPasswordReset(email);
    setRequestSent(true);
  };

  return (
    <Page title={i18n._(t`Forgot your password?`)}>
      <div className="ForgotPasswordPage Page">
        <div className="page-container">
          <Trans render="h4" className="page-title">
            Forgot your password?
          </Trans>
          {!requestSent ? (
            <>
              <Trans render="h5">
                Review your email address below. You’ll receive a "Reset password" email to this
                address.
              </Trans>
              <form onSubmit={handleSubmit}>
                <Trans render="label">Email address</Trans>
                <input
                  type="email"
                  className="input"
                  placeholder={i18n._(t`Enter email`)}
                  onChange={handleValueChange}
                  value={email}
                />
                <input
                  type="submit"
                  className="button is-primary"
                  value={i18n._(t`Reset password`)}
                />
              </form>
            </>
          ) : (
            <div className="request-sent-success">
              <MailIcon />
              <Trans render="h5">
                An email has been sent to your email address {`${email}`}. Please check your inbox
                and spam.
              </Trans>
              <button className="button is-text" onClick={() => setRequestSent(false)}>
                <Trans>
                  Didn’t receive an email?
                  <br />
                  Click here to try again.
                </Trans>
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
