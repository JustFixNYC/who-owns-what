import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

import StandalonePage from "components/StandalonePage";
import Login from "components/Login";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import { UserContext } from "components/UserContext";
import { LocaleRedirect } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { FixedLoadingLabel } from "components/Loader";

const LoginPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const { account } = createWhoOwnsWhatRoutePaths();
  const userContext = useContext(UserContext);
  const { state: locationState } = useLocation();
  const fetchingUser = !userContext?.user;
  const isLoggedIn = !!userContext?.user?.email;
  const [redirectToLogin, setRedirectToLogin] = useState<boolean>();
  // Capture on first render so the blue background lasts for this visit after
  // Login clears location state. A refresh has no location state, so it is generic.
  const [fromBuildingAlerts] = useState(!!locationState?.fromBuildingAlerts);

  useEffect(() => {
    if (redirectToLogin === undefined && !fetchingUser) {
      setRedirectToLogin(isLoggedIn);
    }
  }, [fetchingUser, redirectToLogin, isLoggedIn]);

  return redirectToLogin === undefined ? (
    <FixedLoadingLabel />
  ) : redirectToLogin ? (
    <LocaleRedirect to={{ pathname: account.settings }} />
  ) : (
    <StandalonePage
      title={i18n._(t`Log in / sign up`)}
      className={classNames("LoginPage", {
        "LoginPage--from-building-alerts": fromBuildingAlerts,
      })}
    >
      <Login />
    </StandalonePage>
  );
});

export default LoginPage;
