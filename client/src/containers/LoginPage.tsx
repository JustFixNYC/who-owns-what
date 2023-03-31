import React from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import Login from "components/Login";

const LoginPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="VerifyEmailPage Page">
        <div className="page-container">
          <Trans render="h4">Login to your account</Trans>
          <Login />
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default LoginPage;
