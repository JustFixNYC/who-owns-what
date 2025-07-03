import React from "react";
import { Alert, AlertProps } from "@justfixnyc/component-library";
import { CSSTransition } from "react-transition-group";
import { I18n } from "@lingui/core";
// import classNames from "classnames";

import "styles/_toastalert.scss";

interface ToastAlertProps extends AlertProps {
  active: boolean;
  i18n: I18n;
  timeout: number;
}

export const ToastAlert: React.FC<ToastAlertProps> = (props) => {
  const { active, i18n, timeout, className, ...alertProps } = props;
  const [showToast, setShowToast] = React.useState(active);

  return (
    <div className="toast-alert-container">
      <CSSTransition
        in={showToast}
        timeout={timeout}
        classNames="toast-alert"
        // classNames={classNames(className, "toast-alert")}
        onEntered={() => setShowToast(false)}
      >
        <Alert
          {...alertProps}
          className="toast-alert"
          // className={classNames(className, "toast-alert")}
        />
      </CSSTransition>
    </div>
  );
};
