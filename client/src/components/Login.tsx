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
import Modal from "./Modal";

import "styles/Login.css";
import "styles/UserTypeInput.css";
import "styles/_input.scss";
import { Button } from "@justfixnyc/component-library";
import SendNewLink from "./SendNewLink";

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
          <button className="button is-text ml-5" onClick={() => toggleLoginSignup(Step.Login)}>
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
      <div className="building-page-footer">
        {isRegisterAccountStep && (
          <span className="privacy-links">
            <Trans>
              Your privacy is important to us. Read our{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.justfix.org/en/privacy-policy/"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.justfix.org/en/terms-of-use/"
              >
                Terms of Service
              </a>
              .
            </Trans>
          </span>
        )}
        <div className="login-type-toggle">
          {isRegisterAccountStep ? (
            <>
              <Trans>Already have an account?</Trans>
              <button className="button is-text ml-5" onClick={() => toggleLoginSignup(Step.Login)}>
                <Trans>Log in</Trans>
              </button>
            </>
          ) : (
            <>
              <Trans>Don't have an account?</Trans>
              <button
                className="button is-text ml-5 pt-20"
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

  const renderVerifyEmail = () => {
    return (
      <div className="verify-email-container">
        <p>{i18n._(t`Click the link we sent to ${email}. It may take a few minutes to arrive.`)}</p>
        {!isEmailResent && (
          <Trans render="span" className="resend-verify-label">
            Didn’t get the link?
          </Trans>
        )}
        <SendNewLink
          setParentState={setIsEmailResent}
          variant="secondary"
          className="is-full-width"
          onClick={() => AuthClient.resendVerifyEmail()}
        />
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
        <Trans>Once your email has been verified, you’ll be signed up for Building Updates.</Trans>
        <br />
        <br />
        <SendNewLink
          setParentState={setIsEmailResent}
          variant="secondary"
          className="is-full-width"
          onClick={() => AuthClient.resendVerifyEmail()}
        />
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

    !!setLoginRegisterInProgress && setLoginRegisterInProgress(false);

    if (!onBuildingPage) {
      handleRedirect && handleRedirect();
      return;
    }
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

  let headerText = "";
  let onSubmit = () => {};
  let submitButtonText = "";
  switch (step) {
    case Step.CheckEmail:
      headerText = onBuildingPage
        ? i18n._(
            t`Enter your email to get weekly updates on complaints, violations, and eviction filings for this building.`
          )
        : i18n._(t`Log in / sign up`);
      onSubmit = onEmailSubmit;
      submitButtonText =
        !onBuildingPage || showRegisterModal ? i18n._(t`Submit`) : i18n._(t`Get updates`);
      break;
    case Step.Login:
      headerText = showRegisterModal
        ? i18n._(
            t`Enter your email to get weekly updates on complaints, violations, and eviction filings for this building.`
          )
        : i18n._(t`Log in`);
      onSubmit = onLoginSubmit;
      submitButtonText = i18n._(t`Log in`);
      break;
    case Step.RegisterAccount:
      headerText = onBuildingPage
        ? i18n._(t`Create a password to start receiving Building Updates`)
        : i18n._(t`Sign up`);
      onSubmit = onAccountSubmit;
      submitButtonText = i18n._(t`Next`);
      break;
    case Step.RegisterUserType:
      headerText = i18n._(t`Which best describes you?`);
      onSubmit = onUserTypeSubmit;
      submitButtonText = "Sign up";
      break;
    case Step.VerifyEmail:
      headerText = i18n._(t`Almost done. Verify your email to start receiving updates.`);
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
        {(!onBuildingPage || showRegisterModal) && (
          <h4 className={classNames(!onBuildingPage && "page-title")}>{headerText}</h4>
        )}
        {onBuildingPage && !showRegisterModal && (
          <div className="card-description">{headerText}</div>
        )}
        {renderAlert()}
        {!isVerifyEmailStep && !isVerifyEmailReminderStep && (
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
                showForgotPassword={!isRegisterAccountStep}
                autoFocus={showRegisterModal && !!email && !password}
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
                size="small"
                className="is-full-width"
                labelText={submitButtonText}
              />
            </div>
          </form>
        )}
        {isVerifyEmailStep && renderVerifyEmail()}
        {isVerifyEmailReminderStep && renderVerifyEmailReminder()}
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
