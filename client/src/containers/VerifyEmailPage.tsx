import React from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import AuthClient from "../components/AuthClient";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const [verified, setVerified] = React.useState(false);

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        {!verified ? (
          <>
            <Trans render="span">
              Click the button to verify your email for email alerts on Who owns what
            </Trans>
            <button
              className="button is-primary"
              onClick={async () => {
                // TODO shakao: error messaging and handling
                setVerified(await AuthClient.verifyEmail());
              }}
            >
              <Trans>Verify email</Trans>
            </button>
          </>
        ) : (
          <>
            <Trans>
              <p>Your email is now verified.</p>
            </Trans>
          </>
        )}
        <LegalFooter />
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
