import React from "react";

import "styles/Login.css";
import "styles/_input.scss";

import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import AuthClient from "./AuthClient";
import { JustfixUser } from "state-machine";

type LoginProps = {
  i18n: I18n;
  onSuccess?: (user?: JustfixUser) => void;
};

type State = {
  username: string;
  password: string;
  success: boolean;
  response: string;
  formState: "check_email" | "login" | "register";
};

class LoginWithoutI18n extends React.Component<LoginProps, State> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      username: "",
      password: "",
      success: false,
      response: "",
      formState: "check_email",
    };
  }

  handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: e.target.value });
  };
  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: e.target.value });
  };

  handleCheckUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (await AuthClient.userExists(this.state.username)) {
      this.setState({ formState: "login" });
    } else {
      this.setState({ formState: "register" });
    }
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { onSuccess } = this.props;
    const { username, password } = this.state;

    if (!username || !password) {
      this.setState({
        response: `Please enter an email address and password!`,
      });
      return;
    }

    const response = await AuthClient.authenticate(username, password);
    if (!response.error && onSuccess) {
      const user = await AuthClient.fetchUser();
      onSuccess(user);
    } else {
      this.setState({
        response: response.error_description,
      });
    }
  };

  render() {
    const { username, password, success, response, formState } = this.state;

    return (
      <div className={`Login ${success ? "Login--success" : ""}`}>
        <form
          onSubmit={formState !== "check_email" ? this.handleSubmit : this.handleCheckUser}
          className="input-group"
        >
          <Trans render="label">Email address</Trans>
          <input
            type="email"
            className="input"
            placeholder={`Enter email`}
            onChange={this.handleUsernameChange}
            value={username}
          />
          {formState !== "check_email" && (
            <>
              <Trans render="label">Enter password</Trans>
              <input
                type="password"
                className="input"
                placeholder={`Enter password`}
                onChange={this.handlePasswordChange}
                value={password}
              />
            </>
          )}
          <input type="submit" className="button is-primary" value={`Get updates`} />
        </form>
        {response && <p className="response-text">{response}</p>}
      </div>
    );
  }
}

const Login = withI18n()(LoginWithoutI18n);

export default Login;
