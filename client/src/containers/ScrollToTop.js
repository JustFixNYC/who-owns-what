import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Link
} from 'react-router-dom';
import { withRouter } from "react-router";

class ScrollToTop extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      document.querySelector('.App__body').scrollTop = 0;
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(ScrollToTop)