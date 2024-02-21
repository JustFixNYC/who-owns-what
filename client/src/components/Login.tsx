import React, { useState, useContext } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import classNames from "classnames";

import AuthClient from "./AuthClient";
import { JustfixUser } from "state-machine";
import { UserContext } from "./UserContext";
import { useInput } from "util/helpers";
import PasswordInput from "./PasswordInput";
import EmailInput from "./EmailInput";
import UserTypeInput from "./UserTypeInput";
import { Alert } from "./Alert";
import { InfoIcon } from "./Icons";
import Modal from "./Modal";

import "styles/Login.css";
import "styles/UserTypeInput.css";
import "styles/_input.scss";

enum Step {
  CheckEmail,
  Login,
  RegisterAccount,
  RegisterUserType,
  VerifyEmail,
  VerifyEmailReminder,
}

type LoginProps = {
  i18n: I18n;
  onBuildingPage?: boolean;
  onSuccess?: (user: JustfixUser) => void;
  handleRedirect?: () => void;
  registerInModal?: boolean;
  setLoginRegisterInProgress?: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoginWithoutI18n = (props: LoginProps) => {
  const {
    i18n,
    onBuildingPage,
    onSuccess,
    handleRedirect,
    registerInModal,
    setLoginRegisterInProgress,
  } = props;

  const userContext = useContext(UserContext);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [step, setStep] = useState(Step.CheckEmail);
  const isCheckEmailStep = step === Step.CheckEmail;
  const isLoginStep = step === Step.Login;
  const isRegisterAccountStep = step === Step.RegisterAccount;
  const isRegisterUserTypeStep = step === Step.RegisterUserType;
  const isVerifyEmailStep = step === Step.VerifyEmail;
  const isVerifyEmailReminderStep = step === Step.VerifyEmailReminder;

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
    setError: setPasswordError,
    onChange: onChangePassword,
  } = useInput("");
  const {
    value: userType,
    error: userTypeError,
    setError: setUserTypeError,
    setValue: setUserType,
    onChange: onChangeUserType,
  } = useInput("");

  const [invalidAuthError, setInvalidAuthError] = useState(false);
  const [existingUserError, setExistingUserError] = useState(false);

  const resetErrorStates = () => {
    setInvalidAuthError(false);
    setExistingUserError(false);
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
          <button className="button is-text ml-5" onClick={() => setStep(Step.Login)}>
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
        return renderPageLevelAlert("error", alertMessage, !onBuildingPage || showRegisterModal);
    }
  };

  const renderFooter = () => {
    return (
      <div className="building-page-footer">
        <div className="privacy-modal">
          <Trans>Your information is secure</Trans>
          <button
            className="info-icon"
            onClick={() => setShowInfoModal(true)}
            aria-label={i18n._(t`Learn more about how we use your data`)}
          >
            <InfoIcon />
          </button>
        </div>
        <div className="login-type-toggle">
          {isRegisterAccountStep ? (
            <>
              <Trans>Already have an account?</Trans>
              <button className="button is-text ml-5" onClick={() => setStep(Step.Login)}>
                <Trans>Log in</Trans>
              </button>
            </>
          ) : (
            <>
              <Trans>Don't have an account?</Trans>
              <button
                className="button is-text ml-5 pt-20"
                onClick={() => setStep(Step.RegisterAccount)}
              >
                <Trans>Sign up</Trans>
              </button>
            </>
          )}
        </div>
        <Modal key={1} showModal={showInfoModal} width={40} onClose={() => setShowInfoModal(false)}>
          <Trans render="h4">
            Your privacy is very important to us. Here are some important things to know:
          </Trans>
          <ul>
            <Trans render="li">Your personal information is secure.</Trans>
            <Trans render="li">
              We don’t use your personal information for profit and will never give or sell it to
              third parties.
            </Trans>
          </ul>
          <Trans>
            If you would like to read more about our mission, please visit{" "}
            <a href="https://www.justfix.org/">JustFix.org</a>. If you would like to read more about
            the data we collect, please review our full{" "}
            <a href="https://www.justfix.org/en/privacy-policy/">Privacy Policy</a> and{" "}
            <a href="https://www.justfix.org/en/terms-of-use/">Terms of Use</a>.
          </Trans>
        </Modal>
      </div>
    );
  };

  const renderVerifyEmail = () => {
    return (
      <div className="verify-email-container">
        <h4>✅</h4>
        <p>
          {i18n._(
            t`We just sent an email verification link to ${email}. To complete signup, please click the link in your email.`
          )}
        </p>
        <Trans render="span" className="resend-verify-label">
          Didn’t receive the link?
        </Trans>
        <button
          className="button is-secondary is-full-width"
          onClick={() => AuthClient.resendVerifyEmail()}
        >
          <Trans>Send again</Trans>
        </button>
      </div>
    );
  };

  const renderVerifyEmailReminder = () => {
    return (
      <>
        <Trans render="h4">Verify your email to start receiving updates</Trans>
        {i18n._(t`Click the link we sent to ${email}. It may take a few minutes to arrive.`)}
        <br />
        <br />
        <Trans>Once your email has been verified, you’ll be signed up for Data Updates.</Trans>
        <br />
        <br />
        <button
          className="button is-secondary is-full-width"
          onClick={() => AuthClient.resendVerifyEmail()}
        >
          <Trans>Resend email</Trans>
        </button>
      </>
    );
  };

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
  };

  const onLoginSubmit = async () => {
    resetErrorStates();

    if (!email || emailError || !password || passwordError) {
      return;
    }

    // context doesn't update immediately so need to reurn user to check verified status
    const resp = await userContext.login(email, password, onSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
      return;
    }

    !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);

    if (!onBuildingPage) {
      handleRedirect && handleRedirect();
      return;
    }
  };

  const onAccountSubmit = async () => {
    if (!email || emailError) {
      return;
    }

    const existingUser = await AuthClient.isEmailAlreadyUsed(email);
    if (existingUser) {
      setExistingUserError(true);
      return;
    }

    if (!password || passwordError) {
      return;
    }

    setStep(Step.RegisterUserType);
  };

  const onUserTypeSubmit = async () => {
    if (!userType || userTypeError) {
      // TODO: raise alert here that this is required?
      setUserTypeError(true);
      return;
    }

    const resp = await userContext.register(email, password, onSuccess);

    if (!!resp?.error) {
      setInvalidAuthError(true);
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

  let headerText = "";
  let onSubmit = () => {};
  let submitButtonText = "";
  switch (step) {
    case Step.CheckEmail:
      headerText = onBuildingPage
        ? i18n._(t`Get weekly Data Updates for complaints, violations, and evictions.`)
        : i18n._(t`Log in / sign up`);
      onSubmit = onEmailSubmit;
      submitButtonText =
        !onBuildingPage || showRegisterModal ? i18n._(t`Submit`) : i18n._(t`Get updates`);
      break;
    case Step.Login:
      headerText = onBuildingPage
        ? i18n._(t`Get weekly Data Updates for complaints, violations, and evictions.`)
        : i18n._(t`Log in`);
      onSubmit = onLoginSubmit;
      submitButtonText = i18n._(t`Log in`);
      break;
    case Step.RegisterAccount:
      headerText = onBuildingPage
        ? i18n._(t`Create a password to start receiving Data Updates`)
        : i18n._(t`Sign up`);
      onSubmit = onAccountSubmit;
      submitButtonText = i18n._(t`Next`);
      break;
    case Step.RegisterUserType:
      headerText = i18n._(t`Which best describes you?`);
      onSubmit = onUserTypeSubmit;
      submitButtonText = "Sign up";
      break;
  }

  const renderLoginFlow = () => {
    return (
      <div className="Login">
        {!isVerifyEmailStep && !isVerifyEmailReminderStep && (
          <>
            {(!onBuildingPage || showRegisterModal) && (
              <h4 className={classNames(!onBuildingPage && "page-title")}>{headerText}</h4>
            )}
            {renderAlert()}
            <form
              className="input-group"
              onSubmit={(e) => {
                e.preventDefault();
                resetErrorStates();
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
                  // note: required={true} removed bc any empty state registers as invalid state
                />
              )}
              {(isLoginStep || isRegisterAccountStep) && (
                <PasswordInput
                  labelText={i18n._(t`Password`)}
                  password={password}
                  username={email}
                  setError={setPasswordError}
                  onChange={onChangePassword}
                  showPasswordRules={isRegisterAccountStep}
                  showForgotPassword={!isRegisterAccountStep}
                />
              )}
              {isRegisterUserTypeStep && (
                <UserTypeInput
                  userType={userType}
                  setUserType={setUserType}
                  error={userTypeError}
                  setError={setUserTypeError}
                  onChange={onChangeUserType}
                />
              )}
              <div className="submit-button-group">
                {/* {isRegisterUserTypeStep && (
                <button
                  type="button"
                  className="button is-primary button-back"
                  onClick={() => setLoginStep(LoginStep.RegisterAccount)}
                >
                  <Trans>Back</Trans>
                </button>
              )} */}
                <button type="submit" className="button is-primary">
                  {submitButtonText}
                </button>
              </div>
            </form>
          </>
        )}
        {isVerifyEmailStep && renderVerifyEmail()}
        {isVerifyEmailReminderStep && renderVerifyEmailReminder()}
        {isRegisterAccountStep && renderFooter()}
      </div>
    );
  };

  return (
    <>
      {(!showRegisterModal || isCheckEmailStep || isLoginStep || isVerifyEmailStep) &&
        renderLoginFlow()}
      {registerInModal && (
        <Modal
          key={1}
          showModal={showRegisterModal}
          width={40}
          onClose={() => {
            resetErrorStates();
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
