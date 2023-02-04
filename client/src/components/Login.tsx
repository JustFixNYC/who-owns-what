import React from "react";

import "styles/Login.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import AuthClient from "./AuthClient";

type LoginProps = {
  i18n: I18n;
  onSuccess?: (email: string) => void;
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
      onSuccess(username);
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
          <input
            type="email"
            className="form-input input-username"
            placeholder={`Enter email`}
            onChange={this.handleUsernameChange}
            value={username}
          />
          {formState !== "check_email" && (
            <>
              <input
                type="password"
                className="form-input input-password"
                placeholder={`Enter password`}
                onChange={this.handlePasswordChange}
                value={password}
              />
              <p>{formState === "login" ? "Welcome back!" : "Create an account"}</p>
            </>
          )}
          <input
            type="submit"
            className="btn btn-white input-group-btn"
            value={formState !== "check_email" ? `Get updates` : `Login`}
          />
        </form>
        {response && <p className="response-text">{response}</p>}
      </div>
    );
  }
}

const Login = withI18n()(LoginWithoutI18n);

export default Login;
