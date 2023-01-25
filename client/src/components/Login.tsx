import React from "react";

import "styles/Subscribe.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import AuthClient from "./AuthClient";

type LoginProps = {
  i18n: I18n;
};

type State = {
  email: string;
  password: string;
  success: boolean;
  response: string;
};

class SubscribeWithoutI18n extends React.Component<LoginProps, State> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      email: "",
      password: "",
      success: false,
      response: "",
    };
  }

  handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: e.target.value });
  };
  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: e.target.value });
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = this.state.email || null;
    const password = this.state.password || null;

    if (!email || !password) {
      this.setState({
        response: `Please enter an email address and password!`,
      });
      return;
    }

    // TODO shakao cleanup with async/await instead of promises
    AuthClient.login(
      email,
      password,
      (res) => console.log(res),
      (err) => {
        this.setState({
          response: `Oops! A network error occurred. Try again later.`,
        });
      }
    );
  };

  render() {
    return (
      <div className={`Login ${this.state.success ? "Login--success" : ""}`}>
        <form onSubmit={this.handleSubmit} className="input-group">
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
          <input type="submit" className="btn btn-white input-group-btn" value={`Get updates`} />
        </form>
        {this.state.response && <p className="response-text">{this.state.response}</p>}
      </div>
    );
  }
}

const Login = withI18n()(SubscribeWithoutI18n);

export default Login;
