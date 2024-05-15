import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

import StandalonePage from "components/StandalonePage";
import Login from "components/Login";

const LoginPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;

  return (
    <StandalonePage title={i18n._(t`Log in / sign up`)} className="LoginPage">
      <Login />
    </StandalonePage>
  );
});

export default LoginPage;
