import React, { useState, useContext } from "react";

import "styles/Login.css";
import "styles/_input.scss";

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { UserContext } from "./UserContext";
import PasswordInput from "./PasswordInput";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { Alert } from "./Alert";
import { AlertIcon } from "./Icons";

type PasswordRule = {
  regex: RegExp;
  label: string;
};

const passwordRules: PasswordRule[] = [
  { regex: /.{8}/, label: "Must be 8 characters" },
  // eslint-disable-next-line no-useless-escape
  {
    regex: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9!"`'#%&,:;<>=@{}\$\(\)\*\+\/\\\?\[\]\^\|]+)$/,
    label: "Must include letters and numbers",
  },
];

const validatePassword = (password: string) => {
  let valid = true;
  passwordRules.forEach((rule) => (valid = valid && !!password.match(rule.regex)));
  return valid;
};

export enum LoginState {
  Default,
  Login,
  Register,
}

type LoginProps = {
  i18n: I18n;
  fromBuildingPage?: boolean;
  onSuccess?: (user: JustfixUser) => void;
  handleRedirect?: () => void;
};

const LoginWithoutI18n = (props: LoginProps) => {
  const { i18n, fromBuildingPage, onSuccess, handleRedirect } = props;
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginState, setLoginState] = useState(LoginState.Default);
  const [header, setHeader] = useState("Log in / sign up");
  const [subheader, setSubheader] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [invalidAuthError, setInvalidAuthError] = useState(false);
  const [emailFormatError, setEmailFormatError] = useState(false);

  const isDefaultState = loginState === LoginState.Default;
  const isRegisterState = loginState === LoginState.Register;

  const toggleLoginState = (endState: LoginState) => {
    if (endState === LoginState.Register) {
      setLoginState(LoginState.Register);
      if (!fromBuildingPage) {
        setHeader("Sign up");
        setSubheader("With an account you can save buildings and get weekly updates");
      }
    } else if (endState === LoginState.Login) {
      setLoginState(LoginState.Login);
      if (!fromBuildingPage) {
        setHeader("Log in");
        setSubheader("");
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDefaultState && !!username) {
      const existingUser = await AuthClient.isEmailAlreadyUsed(username);
      if (fromBuildingPage) {
        setShowAlerts(true);
      }
      if (existingUser) {
        setIsExistingUser(true);
        toggleLoginState(LoginState.Login);
      } else {
        toggleLoginState(LoginState.Register);
      }
    } else {
      console.log("enter a valid email");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isRegisterState) {
      const existingUser = await AuthClient.isEmailAlreadyUsed(username);
      if (existingUser) {
        setIsExistingUser(true);
        setShowAlerts(true);
      }
      return;
    }

    if (!username || !password) {
      setShowAlerts(true);
      setInvalidAuthError(true);
      return;
    }

    const loginMessage =
      loginState === LoginState.Login
        ? await userContext.login(username, password, onSuccess)
        : await userContext.register(username, password, onSuccess);

    console.log(loginMessage);
    if (!!loginMessage) {
      setShowAlerts(true);
      setInvalidAuthError(true);
    } else if (handleRedirect) {
      handleRedirect();
    }
  };

  const renderPageLevelAlert = (
    type: "error" | "success" | "info",
    message: string,
    className?: string,
    showLogin?: boolean
  ) => {
    return (
      <Alert
        className={`page-level-alert ${className}`}
        variant="primary"
        closeType="none"
        role="status"
        type={type}
      >
        {message}
        {showLogin && (
          <button
            className="button is-text ml-5"
            onClick={() => toggleLoginState(LoginState.Login)}
          >
            <Trans>Log in</Trans>
          </button>
        )}
      </Alert>
    );
  };

  const renderAlert = () => {
    let alertMessage = "";
    if (invalidAuthError) {
      alertMessage = i18n._(t`The email and/or the password you entered is incorrect.`);
      if (!fromBuildingPage) {
        return renderPageLevelAlert("error", alertMessage, "from-nav-bar");
      }
      return renderPageLevelAlert("error", alertMessage);
    } else if (fromBuildingPage && showAlerts && isExistingUser) {
      if (!isRegisterState) {
        alertMessage = i18n._(t`Your email is associated with an account. Log in below.`);
        return renderPageLevelAlert("info", alertMessage, "from-building-page");
      } else {
        alertMessage = i18n._(t`That email is already used.`);
        return renderPageLevelAlert("error", alertMessage, "from-building-page");
      }
    } else if (!fromBuildingPage && showAlerts && isExistingUser && isRegisterState) {
      alertMessage = i18n._(t`That email is already used.`);
      return renderPageLevelAlert("error", alertMessage, "from-nav-bar", true);
    }
  };

  const isBadEmailFormat = () => {
    if (document.querySelectorAll("input:invalid").length > 0) {
      setEmailFormatError(true);
    } else {
      setEmailFormatError(false);
    }
  };

  return (
    <div className={`Login`}>
      {renderAlert()}
      {!fromBuildingPage && (
        <>
          <h4 className="page-title text-center">{i18n._(t`${header}`)}</h4>
          <h5 className="text-left">{i18n._(t`${subheader}`)}</h5>
        </>
      )}
      <form onSubmit={isDefaultState ? handleEmailSubmit : handleSubmit} className="input-group">
        <Trans render="label">Email address</Trans>
        {emailFormatError && (
          <span id="input-field-error">
            <AlertIcon />
            <Trans>Please enter a valid email address. </Trans>
          </span>
        )}
        <input
          type="email"
          id="email-input"
          className="input"
          placeholder={i18n._(t`Enter email`)}
          onChange={(e) => {
            setUsername(e.target.value);
            setShowAlerts(false);
          }}
          onBlur={isBadEmailFormat}
          value={username}
          title="Email: the email contains '@'. Example: info@ros-bv.nl"

          //required={true} // removing this bc any empty state registers as invalid state
        />
        {!isDefaultState && (
          <PasswordInput
            username={username}
            validateInput={isRegisterState}
            onChange={setPassword}
          />
        )}
        <input
          type="submit"
          className="button is-primary"
          value={
            isDefaultState
              ? i18n._(t`Submit`)
              : isRegisterState
              ? i18n._(t`Sign up`)
              : i18n._(t`Log in`)
          }
          disabled={!validatePassword(password) && isRegisterState}
        />
      </form>
      {isRegisterState ? (
        <div className="login-type-toggle">
          <Trans>Already have an account?</Trans>
          <button
            className="button is-text ml-5"
            onClick={() => toggleLoginState(LoginState.Login)}
          >
            <Trans>Log in</Trans>
          </button>
        </div>
      ) : (
        <div className="login-type-toggle">
          <Trans>Don't have an account?</Trans>
          <button
            className="button is-text ml-5 pt-20"
            onClick={() => toggleLoginState(LoginState.Register)}
          >
            <Trans>Sign up</Trans>
          </button>
        </div>
      )}
    </div>
  );
};

const Login = withI18n()(LoginWithoutI18n);

export default Login;
