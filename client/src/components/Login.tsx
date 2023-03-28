import React, { useState, useContext } from "react";

import "styles/Login.css";
import "styles/_input.scss";

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { UserContext } from "./UserContext";

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
};

// class LoginWithoutI18n extends React.Component<LoginProps, State> {
const LoginWithoutI18n = (props: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<"username" | "password">("username");
  const userContext = useContext(UserContext);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
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

    const loginMessage = await userContext.login(username, password);
    if (!!loginMessage) {
      setMessage(loginMessage);
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
          <>
            <Trans render="label">Enter password</Trans>
            <input
              type="password"
              className="input login-password"
              placeholder={`Enter password`}
              onChange={handlePasswordChange}
              value={password}
            />
            {passwordRules.map((rule, i) => {
              return (
                <span
                  className={`login-password-rule ${
                    password.match(rule.regex) ? "valid" : "invalid"
                  }`}
                  key={`rule-${i}`}
                >
                  {rule.label}
                </span>
              );
            })}
          </>
        )}
        <input
          type="submit"
          className="button is-primary"
          value={`Get updates`}
          disabled={!validatePassword(password) && formState === "password"}
        />
      </form>
      {message && <p className="login-response-text">{message}</p>}
    </div>
  );
};

const Login = withI18n()(LoginWithoutI18n);

export default Login;
