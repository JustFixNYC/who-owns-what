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

type PasswordRule = {
  regex: RegExp;
  label: string;
};

const passwordRules: PasswordRule[] = [
  { regex: /.{8}/, label: "Must be 8 characters" },
  { regex: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/, label: "Must include letters and numbers" },
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
  onSuccess?: (user: JustfixUser) => void;
  handleRedirect?: () => void;
};

const LoginWithoutI18n = (props: LoginProps) => {
  const { i18n, onSuccess, handleRedirect } = props;
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loginState, setLoginState] = useState(LoginState.Default);
  const [header, setHeader] = useState("Log in / sign up");
  const [subheader, setSubheader] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  const isDefaultState = loginState === LoginState.Default;
  const isRegisterState = loginState === LoginState.Register;

  const toggleLoginState = (endState: LoginState) => {
    if (endState === LoginState.Register) {
      setLoginState(LoginState.Register);
      setHeader("Sign up");
      setSubheader("With an account you can save buildings and get weekly updates");
    } else if (endState === LoginState.Login) {
      setLoginState(LoginState.Login);
      setHeader("Log in");
      setSubheader("");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDefaultState) {
      const existingUser = await AuthClient.isEmailAlreadyUsed(username);

      if (existingUser) {
        setIsExistingUser(true);
        toggleLoginState(LoginState.Login);
      } else {
        toggleLoginState(LoginState.Register);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO error messaging needs work, leaving it be for now
    if (!username || !password) {
      setMessage(`Please enter an email address and password!`);
      return;
    }

    const loginMessage =
      loginState === LoginState.Login
        ? await userContext.login(username, password, onSuccess)
        : await userContext.register(username, password, onSuccess);
    if (!!loginMessage) {
      setMessage(loginMessage);
    } else if (handleRedirect) {
      handleRedirect();
    }
  };

  return (
    <div className={`Login`}>
      {isExistingUser && isRegisterState && (
        <Alert type="error" variant="primary" closeType="none" role="status">
          <Trans>That email is already used.</Trans>
          <button
            className="button is-text ml-5"
            onClick={() => toggleLoginState(LoginState.Login)}
          >
            <Trans>Log in</Trans>
          </button>
        </Alert>
      )}
      <h4 className="text-center">{i18n._(t`${header}`)}</h4>
      <h5 className="text-left">{i18n._(t`${subheader}`)}</h5>
      <form onSubmit={isDefaultState ? handleEmailSubmit : handleSubmit} className="input-group">
        <Trans render="label">Email address</Trans>
        <input
          type="email"
          className="input"
          placeholder={i18n._(t`Enter email`)}
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          required={true}
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
      {message && <p className="login-response-text">{message}</p>}
    </div>
  );
};

const Login = withI18n()(LoginWithoutI18n);

export default Login;
