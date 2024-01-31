import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
// import LegalFooter from "../components/LegalFooter";

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
                <PasswordInput
                  labelText="Create a password"
                  showPasswordRules={true}
                  onChange={setValue}
                />
                <input type="submit" className="button is-primary" value={`Reset password`} />
              </form>
            </>
          ) : (
            <>
              <Trans className="text-center" render="h4">
                Your password has successfully been reset
              </Trans>
              <br />
              <div className="text-center">
                <Trans className="text-center">
                  You will be redirected back to Who Owns What in
                </Trans>
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
          )}
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default ResetPasswordPage;
