import React from "react";

import "styles/Subscribe.css";
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
};

class SubscribeWithoutI18n extends React.Component<LoginProps, State> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      username: "",
      password: "",
      success: false,
      response: "",
    };
  }

  handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: e.target.value });
  };
  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: e.target.value });
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

    // TODO shakao cleanup with async/await instead of promises
    // TODO shakao add type for login resp
    let token = await AuthClient.authenticate(username, password);
    if (token?.access_token && onSuccess) {
      onSuccess(username);
    }
  };

  render() {
    return (
      <div className={`Login ${this.state.success ? "Login--success" : ""}`}>
        <form onSubmit={this.handleSubmit} className="input-group">
          <input
            type="email"
            className="form-input input-username"
            placeholder={`Enter email`}
            onChange={this.handleUsernameChange}
            value={this.state.username}
          />
          <input
            type="password"
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
