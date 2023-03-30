import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import { UserContext } from "components/UserContext";
import PasswordInput from "components/PasswordInput";

const ResetPasswordPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const [requestSent, setRequestSent] = React.useState(false);
  const [value, setValue] = React.useState("");
  const userContext = useContext(UserContext);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await userContext.resetPassword(params.get("token") || "", value);
    setRequestSent(true);
  };

  return (
    <Page title={i18n._(t`Reset your password`)}>
      <div className="ResetPasswordPage Page">
        <div className="page-container">
          {!requestSent ? (
            <>
              <Trans render="h4">Reset your password</Trans>
              <form onSubmit={handleSubmit}>
                <Trans render="label" className="form-label">
                  Create a password
                </Trans>
                <PasswordInput onChange={setValue} />
                <input type="submit" className="button is-primary" value={`Reset password`} />
              </form>
            </>
          ) : (
            <>
              <Trans render="h4">Your password has been successfully reset</Trans>
              <Trans>You will be redirected back to Who Owns What in X seconds.</Trans>
            </>
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default ResetPasswordPage;
