import React from 'react';
// other imports

import APIClient from './APIClient';

import 'styles/Subscribe.css';
import { I18n } from '@lingui/core';
import { withI18n } from '@lingui/react';
import { t } from '@lingui/macro';

//import 'styles/Subscribe.css';

type SubscribeProps = {
  i18n: I18n,
};

type State = {
  email: string,
  success: boolean,
  response: string,
};

class SubscribeWithoutI18n extends React.Component<SubscribeProps, State> {
  constructor(props: SubscribeProps) {
    super(props);
    this.state = {
      email: '',
      success: false,
      response: ''
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: e.target.value });
  }

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = this.state.email || null;
    const { i18n } = this.props;

    // check if email is missing, return undefined
    if (!email) {
      this.setState({
        response: i18n._(t`Please enter an email address!`),
      });
      return;
    }

    APIClient.postNewSubscriber(this.state.email)
      .then(result => {
        // Success
        this.setState({
          success: true,
          response: i18n._(t`All set! Thanks for subscribing!`),
        });
      })
      .catch(err => {
        this.setState({
          response: i18n._(t`Oops! That email is invalid.`),
        });
        window.Rollbar.error(err);
      });

  }

  render() {
    const { i18n } = this.props;

    return (
      // form with input and button
      <div className={`Subscribe ${this.state.success ? 'Subscribe--success':''}`}>
        <form onSubmit={this.handleSubmit} className="input-group" >
          <input type="text"
            className="form-input input-email"
            placeholder={" " + i18n._(t`Enter email`)}
            onChange={this.handleChange}
            value={this.state.email}
          />
          <input type="submit" className="btn btn-white input-group-btn" value={i18n._(t`Sign up`)} />
        </form>
        {this.state.response && (
          <p className="response-text">{this.state.response}</p>
        )}
      </div>
    );
  }
}

const Subscribe = withI18n()(SubscribeWithoutI18n);

export default Subscribe;
