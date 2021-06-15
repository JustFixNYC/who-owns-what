import React from "react";
// other imports

import "styles/Subscribe.css";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { reportError } from "error-reporting";
import { getDataLayer } from "google-tag-manager";

//import 'styles/Subscribe.css';

type SubscribeProps = {
  i18n: I18n;
};

type State = {
  email: string;
  success: boolean;
  response: string;
};

class SubscribeWithoutI18n extends React.Component<SubscribeProps, State> {
  constructor(props: SubscribeProps) {
    super(props);
    this.state = {
      email: "",
      success: false,
      response: "",
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: e.target.value });
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = this.state.email || null;
    const { i18n } = this.props;
    const locale = i18n.language;

    // check if email is missing, return undefined
    if (!email) {
      this.setState({
        response: i18n._(t`Please enter an email address!`),
      });
      return;
    }

    const tenantPlatformOrigin =
      process.env.REACT_APP_TENANT_PLATFORM_SITE_ORIGIN || "https://demo.justfix.nyc";

    fetch(`${tenantPlatformOrigin}/mailchimp/subscribe`, {
      method: "POST",
      mode: "cors",
      body: `email=${encodeURIComponent(email)}&language=${locale}&source=wow`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.status === 200) {
          getDataLayer().push({
            event: "jf.subscribeToMailingList",
          });
          this.setState({
            success: true,
            response: i18n._(t`All set! Thanks for subscribing!`),
          });
        } else if (result.errorCode === "INVALID_EMAIL") {
          this.setState({
            response: i18n._(t`Oops! That email is invalid.`),
          });
        } else {
          reportError(`Mailchimp email signup responded with error code ${result.errorCode}.`);
          this.setState({
            response: i18n._(t`Oops! A network error occurred. Try again later.`),
          });
        }
      })
      .catch((err) => {
        this.setState({
          response: i18n._(t`Oops! A network error occurred. Try again later.`),
        });
      });
  };

  render() {
    const { i18n } = this.props;

    return (
      // form with input and button
      <div className={`Subscribe ${this.state.success ? "Subscribe--success" : ""}`}>
        <form onSubmit={this.handleSubmit} className="input-group">
          <input
            type="text"
            className="form-input input-email"
            placeholder={" " + i18n._(t`Enter email`)}
            onChange={this.handleChange}
            value={this.state.email}
          />
          <input
            type="submit"
            className="btn btn-white input-group-btn"
            value={i18n._(t`Sign up`)}
          />
        </form>
        {this.state.response && <p className="response-text">{this.state.response}</p>}
      </div>
    );
  }
}

const Subscribe = withI18n()(SubscribeWithoutI18n);

export default Subscribe;
