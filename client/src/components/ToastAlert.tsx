import React from "react";
import { Alert, AlertProps } from "@justfixnyc/component-library";
import { CSSTransition } from "react-transition-group";
import { I18n } from "@lingui/core";
import classNames from "classnames";

import "styles/_toastalert.css";

interface ToastAlertProps extends AlertProps {
  showToast: boolean;
  setShowToast: (value: React.SetStateAction<boolean>) => void;
  i18n: I18n;
  timeout: number;
}

export const ToastAlert: React.FC<ToastAlertProps> = (props) => {
  const { showToast, setShowToast, i18n, timeout, className, ...alertProps } = props;

  return (
    <div className="toast-alert-container">
      <CSSTransition
        in={showToast}
        timeout={timeout}
        classNames={classNames(className, "toast-alert")}
        onEntered={() => setShowToast(false)}
      >
        <Alert {...alertProps} className={classNames(className, "toast-alert")} />
      </CSSTransition>
    </div>
  );
};
