import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import { UserContext } from "components/UserContext";

const ForgotPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const [requestSent, setRequestSent] = React.useState(false);
  const [value, setValue] = React.useState(decodeURIComponent(params.get("email") || ""));
  const userContext = useContext(UserContext);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await userContext.requestPasswordReset(value);
    setRequestSent(true);
  };

  return (
    <Page title={i18n._(t`Forgot your password?`)}>
      <div className="ForgotPasswordPage Page">
        <div className="page-container">
          <Trans render="h4">Forgot your password?</Trans>
          {!requestSent ? (
            <>
              <Trans render="span">
                Review your email address below. You’ll receive a "Reset password" email to this
                address.
              </Trans>
              <br />
              <br />
              <form onSubmit={handleSubmit}>
                <Trans render="label" className="form-label">
                  Email address
                </Trans>
                <input
                  type="email"
                  className="input"
                  placeholder={`Enter email`}
                  onChange={handleValueChange}
                  value={value}
                />
                <input type="submit" className="button is-primary" value={`Reset password`} />
              </form>
            </>
          ) : (
            <>
              <Trans>
                An email has been sent to your email address {`${value}`}. Please check your inbox
                and spam.
              </Trans>
              <br />
              <br />
              <button className="link-button is-centered" onClick={() => setRequestSent(false)}>
                <Trans>
                  Didn’t receive an email?
                  <br />
                  Click here to try again.
                </Trans>
              </button>
            </>
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default ForgotPasswordPage;
