import { Component } from "react";
import { withRouter, RouteComponentProps } from "react-router";

const APP_BODY_SELECTOR = ".App__body";

class ScrollToTop extends Component<RouteComponentProps> {
  componentDidUpdate(prevProps: RouteComponentProps) {
    if (this.props.location !== prevProps.location) {
      const appBody = document.querySelector(APP_BODY_SELECTOR);
      if (!appBody) {
        throw new Error(`"${APP_BODY_SELECTOR}" does not exist!`);
      }
      appBody.scrollTop = 0;
    }
  }

  render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);
