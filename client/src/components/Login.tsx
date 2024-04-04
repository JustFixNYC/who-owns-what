import React, { useState, useContext } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Button, Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/Login.css";
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
import Modal from "./Modal";
import SendNewLink from "./SendNewLink";
import { JFCLLocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { AddressRecord } from "./APIDataTypes";

enum Step {
  CheckEmail,
  Login,
  RegisterAccount,
  RegisterUserType,
  VerifyEmail,
  LoginSuccess,
}

type LoginProps = {
  i18n: I18n;
  addr?: AddressRecord;
  onBuildingPage?: boolean;
  onSuccess?: (user: JustfixUser) => void;
  handleRedirect?: () => void;
  registerInModal?: boolean;
  setLoginRegisterInProgress?: React.Dispatch<React.SetStateAction<boolean>>;
  showForgotPassword?: boolean;
};

const LoginWithoutI18n = (props: LoginProps) => {
  const {
    i18n,
    addr,
    onBuildingPage,
    onSuccess,
    handleRedirect,
    registerInModal,
    setLoginRegisterInProgress,
  } = props;

  const userContext = useContext(UserContext);
  const { home, account } = createWhoOwnsWhatRoutePaths();

  const [showRegisterModal, setShowRegisterModal] = useState(false);

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

  const [isEmailResent, setIsEmailResent] = React.useState(false);

  const [placeholderEmail, setPlaceholderEmail] = useState("");

  const [invalidAuthError, setInvalidAuthError] = useState(false);
  const [existingUserError, setExistingUserError] = useState(false);

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
      case existingUserError:
        if (isRegisterAccountStep) {
          alertMessage = i18n._(t`That email is already used.`);
          // show login button in alert
          return renderPageLevelAlert("error", alertMessage, !onBuildingPage || showRegisterModal);
        } else if (isLoginStep && onBuildingPage && showRegisterModal) {
          alertMessage = i18n._(t`Your email is associated with an account. Log in below.`);
          return renderPageLevelAlert("info", alertMessage);
        }
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
                onClick={() => {
                  toggleLoginSignup(Step.RegisterAccount);
                  if (registerInModal && !showRegisterModal) {
                    setShowRegisterModal(true);
                  }
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
    <div className="resend-email-container">
      {!isEmailResent && (
        <Trans render="p" className="didnt-get-link">
          Didn’t get the link?
        </Trans>
      )}
      <SendNewLink
        setParentState={setIsEmailResent}
        variant="secondary"
        size={onBuildingPage ? "small" : "large"}
        className="is-full-width"
        onClick={() => AuthClient.resendVerifyEmail()}
      />
    </div>
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
    !!setLoginRegisterInProgress && setLoginRegisterInProgress(true);

    if (!email) {
      if (!onBuildingPage || showRegisterModal) {
        setEmailError(true);
        setShowEmailError(true);
      }
      registerInModal && setShowRegisterModal(true);
      return;
    }

    if (!!email && emailError) {
      setEmailError(true);
      setShowEmailError(true);
      return;
    }

    if (!!email && !emailError) {
      const existingUser = await AuthClient.isEmailAlreadyUsed(email);

      if (existingUser) {
        setStep(Step.Login);
      } else {
        setStep(Step.RegisterAccount);
        if (registerInModal && !showRegisterModal) {
          setShowRegisterModal(true);
        }
      }
    }

    setPlaceholderEmail(email);
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
    const resp = await userContext.login(email, password, onSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      return;
    }

    if (!onBuildingPage) {
      if (resp?.user?.verified) {
        setStep(Step.LoginSuccess);
      } else {
        await AuthClient.resendVerifyEmail();
        setStep(Step.VerifyEmail);
      }
      return;
    }

    !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);
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

    const resp = await userContext.register(email, password, userType, onSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      setStep(Step.RegisterAccount);
      return;
    }

    if (!onBuildingPage) {
      !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);
      handleRedirect && handleRedirect();
      return;
    }

    if (!registerInModal) {
      !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);
    }

    setStep(Step.VerifyEmail);
  };

  let headerText: any;
  let subHeaderText: any;
  let onSubmit = () => {};
  let submitButtonText = "";
  switch (step) {
    case Step.CheckEmail:
      headerText = !onBuildingPage
        ? i18n._(t`Log in / sign up`)
        : showRegisterModal
        ? i18n._(t`Sign up for Building Updates`)
        : "";
      subHeaderText =
        onBuildingPage && !showRegisterModal ? (
          <Trans>
            Enter your email to get weekly updates on complaints, violations, and eviction filings
            for this building.
          </Trans>
        ) : undefined;
      onSubmit = onEmailSubmit;
      submitButtonText =
        !onBuildingPage || showRegisterModal ? i18n._(t`Submit`) : i18n._(t`Get updates`);
      break;
    case Step.Login:
      headerText = onBuildingPage && !showRegisterModal ? undefined : i18n._(t`Log in`);
      subHeaderText =
        onBuildingPage && addr
          ? i18n._(
              t`Log in to add ${addr.housenumber} ${helpers.titleCase(
                addr.streetname
              )}, ${helpers.titleCase(addr.boro)} to your Building Updates`
            )
          : undefined;
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
          Click the link we sent to {email} to verify your email. It may take a few minutes to
          arrive. If you can't find it, check your spam and promotions folders for an email from
          no-reply@justfix.org.
        </Trans>
      );
      break;
  }

  const renderOnPagePlaceholder = () => {
    return (
      <div className="Login">
        <Trans render="div" className="card-description">
          Enter your email to get weekly updates on complaints, violations, and eviction filings for
          this building.
        </Trans>
        <div className="input-group">
          <EmailInput
            email={placeholderEmail}
            onChange={() => {}}
            error={false}
            setError={() => {}}
            showError={false}
            labelText={i18n._(t`Email address`)}
          />
          <div className="submit-button-group">
            <Button
              variant="primary"
              size="small"
              className="is-full-width"
              labelText={i18n._(t`Get updates`)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLoginFlow = () => {
    return (
      <div className="Login">
        {!!headerText && (onBuildingPage ? <h4>{headerText}</h4> : <h1>{headerText}</h1>)}
        {!!subHeaderText &&
          (onBuildingPage ? (
            <div className="card-description">{subHeaderText}</div>
          ) : (
            <h2>{subHeaderText}</h2>
          ))}
        {renderAlert()}
        {!isVerifyEmailStep && !isLoginSuccessStep && (
          <form
            className="input-group"
            onSubmit={(e) => {
              e.preventDefault();
              resetAlertErrorStates();
              onSubmit();
            }}
          >
            {(isCheckEmailStep || isLoginStep || isRegisterAccountStep) && (
              <EmailInput
                email={email}
                onChange={onChangeEmail}
                error={emailError}
                setError={setEmailError}
                showError={showEmailError}
                autoFocus={!registerInModal || (showRegisterModal && !email)}
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
                size={onBuildingPage ? "small" : "large"}
                className="is-full-width"
                labelText={submitButtonText}
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

  return (
    <>
      {!showRegisterModal ? renderLoginFlow() : renderOnPagePlaceholder()}
      {registerInModal && (
        <Modal
          key={1}
          showModal={showRegisterModal}
          width={40}
          onClose={() => {
            resetAlertErrorStates();
            setShowEmailError(false);
            setShowRegisterModal(false);
            setStep(Step.CheckEmail);
            !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);
          }}
        >
          {renderLoginFlow()}
        </Modal>
      )}
    </>
  );
};

export const Login = withI18n()(LoginWithoutI18n);

export default Login;
