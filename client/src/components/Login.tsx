import React, { useState, useContext } from "react";

import "styles/Login.css";
import "styles/_input.scss";

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { UserContext } from "./UserContext";

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
              className="input"
              placeholder={`Enter password`}
              onChange={handlePasswordChange}
              value={password}
            />
          </>
        )}
        <input type="submit" className="button is-primary" value={`Get updates`} />
      </form>
      {message && <p className="response-text">{message}</p>}
    </div>
  );
};

const Login = withI18n()(LoginWithoutI18n);

export default Login;
