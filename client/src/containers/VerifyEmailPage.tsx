import React from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";

import AuthClient from "../components/AuthClient";

const VerifyEmailPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        <Trans render="span">
          Click the button to verify your email for email alerts on Who owns what
        </Trans>
        <button className="button is-primary" onClick={() => AuthClient.verifyEmail()}>
          <Trans>Verify email</Trans>
        </button>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default VerifyEmailPage;
