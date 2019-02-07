import { Component } from 'react';
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