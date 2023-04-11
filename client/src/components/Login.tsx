import React, { useState, useContext } from "react";

import "styles/Login.css";
import "styles/_input.scss";

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { UserContext } from "./UserContext";
import PasswordInput from "./PasswordInput";
import { JustfixUser } from "state-machine";

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

type LoginProps = {
  i18n: I18n;
  onSuccess?: (user: JustfixUser) => void;
  handleLoginRedirect?: () => void;
};

// class LoginWithoutI18n extends React.Component<LoginProps, State> {
const LoginWithoutI18n = (props: LoginProps) => {
  const { onSuccess, handleLoginRedirect } = props;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<"username" | "password">("username");
  const [loginState, setLoginState] = useState<"login" | "register">("register");
  const userContext = useContext(UserContext);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleEmailEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formState === "username") {
      setFormState("password");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage(`Please enter an email address and password!`);
      return;
    }

    const loginMessage =
      loginState === "login"
        ? await userContext.login(username, password, onSuccess)
        : await userContext.register(username, password, onSuccess);
    if (!!loginMessage) {
      setMessage(loginMessage);
    } else if (handleLoginRedirect) {
      handleLoginRedirect();
    }
  };

  return (
    <div className={`Login`}>
      <form
        onSubmit={formState === "password" ? handleSubmit : handleEmailEntry}
        className="input-group"
      >
        <Trans render="label">Email address</Trans>
        <input
          type="email"
          className="input"
          placeholder={`Enter email`}
          onChange={handleUsernameChange}
          value={username}
        />
        {formState === "password" && (
          <PasswordInput
            username={username}
            label={loginState == "login" ? "Enter password" : "Create a new password"}
            showForgotPassword={loginState === "login"}
            showPasswordRules={loginState === "register"}
            onChange={setPassword}
          />
        )}
        <input
          type="submit"
          className="button is-primary"
          value={
            formState === "username" ? `Get updates` : loginState === "login" ? "Log in" : "Sign up"
          }
          disabled={!validatePassword(password) && formState === "password"}
        />
      </form>
      {formState === "password" && (
        <p>
          {loginState === "login" ? (
            <>
              <span>Don't have an account? </span>
              <button className="link-button" onClick={() => setLoginState("register")}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button className="link-button" onClick={() => setLoginState("login")}>
                Log in
              </button>
            </>
          )}
        </p>
      )}
      {message && <p className="login-response-text">{message}</p>}
    </div>
  );
};

const Login = withI18n()(LoginWithoutI18n);

export default Login;
