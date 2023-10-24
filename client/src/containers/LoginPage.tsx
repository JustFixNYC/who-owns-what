import { useHistory } from "react-router-dom";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";
import Login from "components/Login";
import { createWhoOwnsWhatRoutePaths } from "routes";

const LoginPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const history = useHistory();
  const { account } = createWhoOwnsWhatRoutePaths();

  const redirect = () => {
    window.setTimeout(() => {
      history.push(account.settings);
    }, 1000);
  };

  return (
    <Page title={i18n._(t`Verify your email address`)}>
      <div className="LoginPage Page">
        <div className="page-container">
          <Login handleRedirect={redirect} />
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default LoginPage;
