import React, { useState, useContext, useEffect } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Button, Link as JFCLLink } from "@justfixnyc/component-library";

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
import { AddressRecord } from "./APIDataTypes";
import { isLegacyPath } from "./WowzaToggle";
import { Nobr } from "./Nobr";

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
  const { home, account } = createWhoOwnsWhatRoutePaths();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;

  const { state: locationState } = location;
  const [addr, setAddr] = React.useState<AddressRecord>();
  // switch to regular state and clear location state since it othrwise persists after reloads
  useEffect(() => {
    setAddr(locationState?.addr);
    window.history.replaceState({ state: undefined }, "");
  }, [locationState]);

  const [step, setStep] = useState(Step.CheckEmail);
  const isCheckEmailStep = step === Step.CheckEmail;
  const isLoginStep = step === Step.Login;
  const isRegisterAccountStep = step === Step.RegisterAccount;
  const isRegisterUserTypeStep = step === Step.RegisterUserType;
  const isVerifyEmailStep = step === Step.VerifyEmail;
  const isLoginSuccessStep = step === Step.LoginSuccess;

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
      userContext.subscribe(
        addr.bbl,
        addr.housenumber,
        addr.streetname,
        addr.zip ?? "",
        addr.boro,
        user
      );
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
              <JFCLLink
                href="https://www.justfix.org/en/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </JFCLLink>{" "}
              and{" "}
              <JFCLLink
                href="https://www.justfix.org/en/terms-of-use/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </JFCLLink>
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
              <button className="button is-text ml-2" onClick={() => toggleLoginSignup(Step.Login)}>
                <Trans>Log in</Trans>
              </button>
            </>
          ) : (
            <>
              <Trans>Don't have an account?</Trans>
              <button
                className="button is-text ml-2 pt-6"
                onClick={() => toggleLoginSignup(Step.RegisterAccount)}
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
          onClick={() => AuthClient.resendVerifyEmail()}
        />
      </div>
      {!!addr && (
        <div className="address-page-link">
          <Link
            to={{ pathname: getAddrPageRoute(addr), state: { justSubscribed: true } }}
            component={JFCLLink}
          >
            Back to {formatAddr(addr)}
          </Link>
        </div>
      )}
    </>
  );

  const renderLoginSuccess = () => (
    <>
      <Trans render="h1">You are logged in</Trans>
      <Trans render="h2">
        <JFCLLocaleLink to={home}>Search for an address</JFCLLocaleLink> to add to Building Updates
      </Trans>
    </>
  );

  const onEmailSubmit = async () => {
    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    existingUser ? setStep(Step.Login) : setStep(Step.RegisterAccount);
  };

  const onLoginSubmit = async () => {
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

    // context doesn't update immediately so need to reurn user to check verified status
    const resp = await userContext.login(email, password, subscribeOnSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      return;
    }

    if (!resp?.user?.verified) {
      await AuthClient.resendVerifyEmail();
      setStep(Step.VerifyEmail);
      return;
    }

    if (!!addr) {
      const redirectTo = { pathname: getAddrPageRoute(addr), state: { justSubscribed: true } };
      history.push(redirectTo);
      return;
    }

    setStep(Step.LoginSuccess);
  };

  const onAccountSubmit = async () => {
    if (!email || emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    if (existingUser) {
      setExistingUserError(true);
      return;
    }

    if (!password || passwordError) {
      setPasswordError(true);
      setShowPasswordError(true);
      return;
    }

    setStep(Step.RegisterUserType);
  };

  const onUserTypeSubmit = async () => {
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
          Use your account to get weekly email updates on{" "}
          {!!addr ? formatAddr(addr, false) : <>the buildings you choose</>}.
        </Trans>
      );
      onSubmit = onEmailSubmit;
      submitButtonText = i18n._(t`Submit`);
      break;
    case Step.Login:
      headerText = i18n._(t`Log in`);
      subHeaderText = !!addr ? (
        <Trans>Log in to add {formatAddr(addr, false)} to your Building Updates</Trans>
      ) : undefined;
      onSubmit = onLoginSubmit;
      submitButtonText = i18n._(t`Log in`);
      break;
    case Step.RegisterAccount:
      headerText = i18n._(t`Sign up for Building Updates`);
      onSubmit = onAccountSubmit;
      submitButtonText = i18n._(t`Next`);
      break;
    case Step.RegisterUserType:
      headerText = i18n._(t`Sign up for Building Updates`);
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
              labelText={i18n._(t`Password`)}
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
