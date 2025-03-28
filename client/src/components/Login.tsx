import React, { useState, useContext, useEffect } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Button, Icon, Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/UserTypeInput.css";
import "styles/_input.scss";
import AuthClient from "./AuthClient";
import { JustfixUser } from "state-machine";
import { UserContext } from "./UserContext";
import helpers, { useInput } from "util/helpers";
import PasswordInput from "./PasswordInput";
import EmailInput from "./EmailInput";
import UserTypeInput from "./UserTypeInput";
import { Alert } from "./Alert";
import SendNewLink from "./SendNewLink";
import { JFCLLocaleLink } from "i18n";
import { createRouteForAddressPage, createWhoOwnsWhatRoutePaths } from "routes";
import { AddressRecord, District } from "./APIDataTypes";
import { isLegacyPath } from "./WowzaToggle";
import { Nobr } from "./Nobr";

const BRANCH_NAME = process.env.REACT_APP_BRANCH;

enum Step {
  CheckEmail,
  Login,
  RegisterAccount,
  RegisterUserType,
  VerifyEmail,
  LoginSuccess,
}

const LoginWithoutI18n = (props: withI18nProps) => {
  const { i18n } = props;

  const userContext = useContext(UserContext);
  const { user } = userContext;
  const { home, account, termsOfUse, privacyPolicy, districtPage } = createWhoOwnsWhatRoutePaths();
  const history = useHistory();
  const { pathname, state: locationState } = useLocation();
  const [addr, setAddr] = React.useState<AddressRecord>();
  const [district, setDistrict] = React.useState<District>();
  // switch to regular state and clear location state since it otherwise persists after reloads
  useEffect(() => {
    setAddr(locationState?.addr);
    setDistrict(locationState?.district);
    window.history.replaceState({ state: undefined }, "");
  }, [locationState]);

  const [step, setStep] = useState(Step.CheckEmail);
  const isCheckEmailStep = step === Step.CheckEmail;
  const isLoginStep = step === Step.Login;
  const isRegisterAccountStep = step === Step.RegisterAccount;
  const isRegisterUserTypeStep = step === Step.RegisterUserType;
  const isVerifyEmailStep = step === Step.VerifyEmail;
  const isLoginSuccessStep = step === Step.LoginSuccess;

  const [loginOrRegister, setLoginOrRegister] = useState("");

  const {
    value: email,
    error: emailError,
    showError: showEmailError,
    setError: setEmailError,
    setShowError: setShowEmailError,
    onChange: onChangeEmail,
  } = useInput("");
  const {
    value: password,
    error: passwordError,
    showError: showPasswordError,
    setError: setPasswordError,
    setShowError: setShowPasswordError,
    onChange: onChangePassword,
  } = useInput("");
  const {
    value: userType,
    error: userTypeError,
    showError: userShowUserTypeError,
    setValue: setUserType,
    setError: setUserTypeError,
    setShowError: setShowUserTypeError,
  } = useInput("");

  const [isLoading, setIsLoading] = useState(false);
  const [isEmailResent, setIsEmailResent] = useState(false);
  const [invalidAuthError, setInvalidAuthError] = useState(false);
  const [existingUserError, setExistingUserError] = useState(false);

  const eventParams = (user?: JustfixUser) => {
    const customParams = {
      from: !!addr ? "building page" : !!district ? "district page" : "nav",
      branch: BRANCH_NAME,
    };
    const params = !!user?.id
      ? {
          ...customParams,
          user_id: user.id,
          user_type: user.type,
        }
      : customParams;

    return params;
  };

  const getAddrPageRoute = (addr: AddressRecord) => {
    const isLegacy = isLegacyPath(pathname);
    return createRouteForAddressPage({ ...addr, locale: i18n.language }, isLegacy);
  };

  const formatAddr = (addr: AddressRecord, withBoro = true) => {
    if (!addr) return;
    const addrWithoutBoro = `${addr.housenumber} ${helpers.titleCase(addr.streetname)}`;
    return withBoro ? `${addrWithoutBoro}, ${helpers.titleCase(addr.boro)}` : addrWithoutBoro;
  };

  const subscribeOnSuccess = (user: JustfixUser) => {
    !!addr &&
      userContext.subscribeBuilding(
        addr.bbl,
        addr.housenumber,
        addr.streetname,
        addr.zip ?? "",
        addr.boro,
        user
      );

    !!district && userContext.subscribeDistrict(district, user);
  };

  const resetAlertErrorStates = () => {
    setInvalidAuthError(false);
    setExistingUserError(false);
  };

  const hideInputErrors = () => {
    setShowEmailError(false);
    setShowPasswordError(false);
    setShowUserTypeError(false);
  };

  const toggleLoginSignup = (toStep: Step) => {
    resetAlertErrorStates();
    hideInputErrors();
    setStep(toStep);
  };

  const renderPageLevelAlert = (
    type: "error" | "success" | "info",
    message: string,
    showLogin?: boolean
  ) => {
    return (
      <Alert
        className={`page-level-alert`}
        variant="primary"
        closeType="none"
        role="status"
        type={type}
      >
        {message}
        {showLogin && (
          <button className="button is-text ml-2" onClick={() => toggleLoginSignup(Step.Login)}>
            <Trans>Log in</Trans>
          </button>
        )}
      </Alert>
    );
  };

  const renderAlert = () => {
    let alertMessage = "";

    switch (true) {
      case invalidAuthError:
        alertMessage = i18n._(t`The email and/or password you entered is incorrect.`);
        return renderPageLevelAlert("error", alertMessage);
      case existingUserError && isRegisterAccountStep:
        alertMessage = i18n._(t`That email is already used.`);
        // show login button in alert
        return renderPageLevelAlert("error", alertMessage, true);
    }
  };

  const renderFooter = () => {
    return (
      <div className="login-footer">
        {isRegisterAccountStep && (
          <span className="privacy-links">
            <Trans>
              Your privacy is important to us. Read our{" "}
              <JFCLLocaleLink to={privacyPolicy} target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </JFCLLocaleLink>{" "}
              and{" "}
              <JFCLLocaleLink to={termsOfUse} target="_blank" rel="noopener noreferrer">
                Terms of Use
              </JFCLLocaleLink>
              .
            </Trans>
          </span>
        )}
        {isLoginStep && (
          <JFCLLocaleLink
            to={`${account.forgotPassword}?email=${encodeURIComponent(email || "")}`}
            className="forgot-password"
          >
            <Trans>Forgot your password?</Trans>
          </JFCLLocaleLink>
        )}
        <div className="login-type-toggle">
          {isRegisterAccountStep ? (
            <>
              <Trans>Already have an account?</Trans>
              <button
                className="button is-text ml-2"
                onClick={() => {
                  window.gtag("event", "swap-register-login", { ...eventParams(), to: "login" });
                  toggleLoginSignup(Step.Login);
                }}
              >
                <Trans>Log in</Trans>
              </button>
            </>
          ) : (
            <>
              <Trans>Don't have an account?</Trans>
              <button
                className="button is-text ml-2 pt-6"
                onClick={() => {
                  window.gtag("event", "swap-register-login", { ...eventParams(), to: "register" });
                  toggleLoginSignup(Step.RegisterAccount);
                }}
              >
                <Trans>Sign up</Trans>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderResendVerifyEmail = () => (
    <>
      <div className="resend-email-container">
        {!isEmailResent && (
          <Trans render="p" className="didnt-get-link">
            Didn’t get the link?
          </Trans>
        )}
        <SendNewLink
          setParentState={setIsEmailResent}
          size="large"
          onClick={() => {
            AuthClient.resendVerifyEmail();
            const from = `${eventParams().from} ${loginOrRegister}`;
            window.gtag("event", "email-verify-resend", { ...eventParams(user), from });
          }}
        />
      </div>
      {!!addr && (
        <div className="address-page-link">
          <Link
            to={{ pathname: getAddrPageRoute(addr), state: { justSubscribed: true } }}
            component={JFCLLink}
            onClick={() =>
              window.gtag("event", "register-return-address", { ...eventParams(user) })
            }
          >
            <Icon icon="arrowRight" />
            Back to {formatAddr(addr)}
          </Link>
        </div>
      )}
      {!!district && (
        <div className="district-page-link">
          <Link
            to={{ pathname: districtPage, state: { justSubscribed: true } }}
            component={JFCLLink}
            onClick={() =>
              window.gtag("event", "register-return-district", { ...eventParams(user) })
            }
          >
            <Icon icon="arrowRight" />
            Back to District Alerts
          </Link>
        </div>
      )}
    </>
  );

  const renderLoginSuccess = () => (
    <>
      <Trans render="h1">You are logged in</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to your Building
        Alerts, <JFCLLocaleLink to={districtPage}>subscribe to District Alerts</JFCLLocaleLink>, or
        visit your <JFCLLocaleLink to={account.settings}>email settings</JFCLLocaleLink> page to
        manage subscriptions.
      </Trans>
    </>
  );

  const onEmailSubmit = async () => {
    window.gtag("event", "register-login-email", eventParams());
    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    existingUser ? setStep(Step.Login) : setStep(Step.RegisterAccount);
  };

  const onLoginSubmit = async () => {
    window.gtag("event", "login-password", eventParams());

    resetAlertErrorStates();

    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    if (!password) {
      setPasswordError(true);
      setShowPasswordError(true);
      return;
    }

    // context doesn't update immediately so need to rerun user to check verified status
    const resp = await userContext.login(email, password, subscribeOnSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      window.gtag("event", "login-password-invalid", eventParams());
      return;
    }

    window.gtag("event", "login-success", eventParams(resp?.user));

    if (!!addr || !!district) {
      const subscribeEventParams = { ...eventParams(), from: "login" };
      const eventName = `subscribe-${!!addr ? "building" : "district"}-via-register-login`;
      window.gtag("event", eventName, { ...subscribeEventParams });
    }

    if (!resp?.user?.verified) {
      await AuthClient.resendVerifyEmail();
      setLoginOrRegister("login");
      setStep(Step.VerifyEmail);
      return;
    }

    if (!!addr || !!district) {
      const redirectTo = {
        pathname: !!addr ? getAddrPageRoute(addr) : account.settings,
        state: { justSubscribed: true },
      };
      history.push(redirectTo);
      return;
    }

    setStep(Step.LoginSuccess);
  };

  const onAccountSubmit = async () => {
    window.gtag("event", "register-password", eventParams());

    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    if (existingUser) {
      window.gtag("event", "register-existing-user-error", eventParams());
      setExistingUserError(true);
      return;
    }

    if (!password || passwordError) {
      window.gtag("event", "register-password-error", eventParams());
      setPasswordError(true);
      setShowPasswordError(true);
      return;
    }

    setStep(Step.RegisterUserType);
  };

  const onUserTypeSubmit = async () => {
    window.gtag("event", "register-user-type", eventParams());

    if (!userType || userTypeError) {
      setUserTypeError(true);
      setShowUserTypeError(true);
      return;
    }

    const resp = await userContext.register(email, password, userType, subscribeOnSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      setStep(Step.RegisterAccount);
      return;
    }

    window.gtag("event", "register-success", eventParams(resp?.user));

    if (!!addr || !!district) {
      const subscribeEventParams = { ...eventParams(), from: "register" };
      const eventName = `subscribe-${!!addr ? "building" : "district"}-via-register-login`;
      window.gtag("event", eventName, { ...subscribeEventParams });
    }

    setLoginOrRegister("register");
    setStep(Step.VerifyEmail);
  };

  let headerText: any;
  let subHeaderText: any;
  let onSubmit = async () => {};
  let submitButtonText = "";
  switch (step) {
    case Step.CheckEmail:
      headerText = i18n._(t`Log in / sign up`);
      subHeaderText = (
        <Trans>
          Use your account to get weekly email alerts on{" "}
          {!!addr ? (
            <>{formatAddr(addr, false)}.</>
          ) : !!district ? (
            <>buildings in your area.</>
          ) : (
            <>the buildings you choose.</>
          )}
        </Trans>
      );
      onSubmit = onEmailSubmit;
      submitButtonText = i18n._(t`Submit`);
      break;
    case Step.Login:
      headerText = i18n._(t`Log in`);
      subHeaderText = !!addr ? (
        <Trans>Log in to add {formatAddr(addr, false)} to your Building Alerts</Trans>
      ) : !!district ? (
        <Trans>Log in to subscribe to Area Alerts</Trans>
      ) : undefined;
      onSubmit = onLoginSubmit;
      submitButtonText = i18n._(t`Log in`);
      break;
    case Step.RegisterAccount:
      headerText = i18n._(t`Sign up for Email Alerts`);
      onSubmit = onAccountSubmit;
      submitButtonText = i18n._(t`Next`);
      break;
    case Step.RegisterUserType:
      headerText = i18n._(t`Sign up for Email Alerts`);
      subHeaderText = i18n._(t`Which best describes you?`);
      onSubmit = onUserTypeSubmit;
      submitButtonText = "Sign up";
      break;
    case Step.VerifyEmail:
      headerText = i18n._(t`Check your email`);
      subHeaderText = (
        <Trans>
          Click the link we sent to <Nobr>{email}</Nobr> to verify your email. It may take a few
          minutes to arrive. If you can't find it, check your spam and promotions folders for an
          email from <Nobr>no-reply@justfix.org</Nobr>.
        </Trans>
      );
      break;
  }

  return (
    <div className="Login">
      {renderAlert()}
      {!!headerText && <h1>{headerText}</h1>}
      {!!subHeaderText && <h2>{subHeaderText}</h2>}
      {!isVerifyEmailStep && !isLoginSuccessStep && (
        <form
          className="input-group"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            resetAlertErrorStates();
            await onSubmit();
            // if OnSubmit redirects, state change below raises memory leak warning, but not a problem
            setIsLoading(false);
          }}
        >
          {(isCheckEmailStep || isLoginStep || isRegisterAccountStep) && (
            <EmailInput
              email={email}
              onChange={onChangeEmail}
              error={emailError}
              setError={setEmailError}
              showError={showEmailError}
              autoFocus={true}
              labelText={i18n._(t`Email address`)}
            />
          )}
          {(isLoginStep || isRegisterAccountStep) && (
            <PasswordInput
              labelText={
                isRegisterAccountStep ? i18n._(t`Create password`) : i18n._(t`Enter your password`)
              }
              password={password}
              username={email}
              error={passwordError}
              showError={showPasswordError}
              setError={setPasswordError}
              onChange={onChangePassword}
              showPasswordRules={isRegisterAccountStep}
              autoFocus={!!email && !password}
            />
          )}
          {isRegisterUserTypeStep && (
            <UserTypeInput
              setUserType={setUserType}
              error={userTypeError}
              showError={userShowUserTypeError}
              setError={setUserTypeError}
            />
          )}
          <div className="submit-button-group">
            <Button
              type="submit"
              variant="primary"
              size="large"
              labelText={submitButtonText}
              loading={isLoading}
            />
          </div>
        </form>
      )}
      {isVerifyEmailStep && renderResendVerifyEmail()}
      {isLoginSuccessStep && renderLoginSuccess()}
      {(isLoginStep || isRegisterAccountStep) && renderFooter()}
    </div>
  );
};

export const Login = withI18n()(LoginWithoutI18n);

export default Login;
