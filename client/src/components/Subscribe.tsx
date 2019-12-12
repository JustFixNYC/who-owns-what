import React from 'react';
// other imports

import APIClient from './APIClient';

import 'styles/Subscribe.css';

//import 'styles/Subscribe.css';

type SubscribeProps = {};

type State = {
  email: string,
  success: boolean,
  response: string,
};

export default class Subscribe extends React.Component<SubscribeProps, State> {
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

    // check if email is missing, return undefined
    if (!email) {
      this.setState({
        response: "Please enter an email address!"
      });
      return;
    }

    APIClient.postNewSubscriber(this.state.email)
      .then(result => {
        // Success
        this.setState({
          success: true,
          response: 'All set! Thanks for subscribing!'
        });
      })
      .catch(err => {
        this.setState({
          response: 'Oops! That email is invalid.'
        });
        window.Rollbar.error(err);
      });

  }

  render() {
    return (
      // form with input and button
      <div className={`Subscribe ${this.state.success ? 'Subscribe--success':''}`}>
        <form onSubmit={this.handleSubmit} className="input-group" >
          <input type="text"
            className="form-input input-email"
            placeholder=" Enter email"
            onChange={this.handleChange}
            value={this.state.email}
          />
          <input type="submit" className="btn btn-white input-group-btn" value="Sign up" />
        </form>
        {this.state.response && (
          <p className="response-text">{this.state.response}</p>
        )}
      </div>
    );
  }
}