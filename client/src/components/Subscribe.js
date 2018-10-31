import React from 'react';
// other imports

import APIClient from 'components/APIClient';

import 'styles/Subscribe.css';

//import 'styles/Subscribe.css';

export default class Subscribe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      success: false,
      response: ''
    };
  }

  handleChange = (e) => {
    this.setState({ email: e.target.value });
  }

  handleSubmit = (e) => {
    e.preventDefault();

    const email = this.state.email || null;

    // check if email is missing, return undefined
    if (!email) {
      this.setState({
        response: "Please enter an email address!"
      });
      return;
    }

    APIClient.postNewSubscriber(this.state.email, this.props.list)
      .then(result => {
        // Success
        this.setState({
          success: true,
          response: 'All set! Check your email shortly.'
        });
      })
      .catch(err => {
        this.setState({
          response: "Oops! Something went wrong here. Check your input and try again."
        });
        window.Rollbar.error(err);
      });

  }

  render() {
    return (
      // form with input and button
      <div className={`Subscribe ${this.state.success ? 'Subscribe--success':''}`}>
        <form onSubmit={this.handleSubmit}>
          <input type="text"
            className="input-email"
            placeholder=" Enter email"
            onChange={this.handleChange}
            value={this.state.email}
          />
          <input type="submit" className="btn btn-white" value="Sign up" />
        </form>
        {this.state.response && (
          <p className="response-text">{this.state.response}</p>
        )}
      </div>
    );
  }
}