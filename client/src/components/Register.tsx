import React from "react";

import "styles/Subscribe.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import AuthClient from "./AuthClient";

type RegisterProps = {
  i18n: I18n;
};

type State = {
  username: string;
  email: string;
  password: string;
  success: boolean;
  response: string;
};

class SubscribeWithoutI18n extends React.Component<RegisterProps, State> {
  constructor(props: RegisterProps) {
    super(props);
    this.state = {
      username: "",
      email: "",
      password: "",
      success: false,
      response: "",
    };
  }

  handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: e.target.value });
  };
  handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: e.target.value });
  };
  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: e.target.value });
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const username = this.state.username || null;
    const email = this.state.email || null;
    const password = this.state.password || null;

    if (!email || !password || !username) {
      this.setState({
        response: `Please enter an email address and password!`,
      });
      return;
    }

    AuthClient.register(
      username,
      email,
      password,
      (res) => {
        console.log(res);
      },
      (err) => {
        this.setState({
          response: `Oops! A network error occurred. Try again later.`,
        });
      }
    );
  };

  render() {
    return (
      <div className={`REgister ${this.state.success ? "Login--success" : ""}`}>
        <form onSubmit={this.handleSubmit} className="input-group">
          <input
            type="text"
            className="form-input input-usernamae"
            placeholder={`Enter username`}
            onChange={this.handleUsernameChange}
            value={this.state.username}
          />
          <input
            type="text"
            className="form-input input-email"
            placeholder={`Enter email`}
            onChange={this.handleEmailChange}
            value={this.state.email}
          />
          <input
            type="text"
            className="form-input input-password"
            placeholder={`Enter password`}
            onChange={this.handlePasswordChange}
            value={this.state.password}
          />
          <input type="submit" className="btn btn-white input-group-btn" value={`Sign up`} />
        </form>
        {this.state.response && <p className="response-text">{this.state.response}</p>}
      </div>
    );
  }
}

const Login = withI18n()(SubscribeWithoutI18n);

export default Login;
