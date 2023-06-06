import { storageFactory } from "@justfixnyc/util";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { forwardRef, useLayoutEffect, useState } from "react";
import { CloseButton } from "./CloseButton";
import "styles/_alert.scss";

export interface AlertProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  type?: "error" | "success" | "info";
  variant?: "primary" | "secondary";
  closeType?: "none" | "state" | "session" | "local";
  storageId?: string;
  onClose?: () => void;
  className?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ type, variant, closeType, storageId, onClose, className, children, ...props }, ref) => {
    const usingStorage = closeType && ["session", "local"].includes(closeType);

    // TODO: see if there's a way to do this that works with intellisense.
    // (seems like it's gonna be hard while maintaining the "interface
    // extends..." that we use for all our other components)
    if (usingStorage && !storageId) {
      throw new Error(
        "If using sessionStorage or localStorage for closing alert, you must provide a storageId"
      );
    }

    const [isClosed, setClosed] = useState(false);

    const store = storageFactory(() => (closeType === "local" ? localStorage : sessionStorage));

    useLayoutEffect(() => {
      if (usingStorage) {
        setClosed(store.getItem(storageId!) === "true");
      }
    }, [storageId, store, usingStorage]);

    const handleClose = () => {
      if (usingStorage) {
        store.setItem(storageId!, "true");
      }
      setClosed(true);
      !!onClose && onClose();
    };

    const alertClassNames = classNames("jf-alert", `is-${variant}`, `is-${type}`, className);

    return !isClosed ? (
      <div ref={ref} className={alertClassNames} {...props}>
        <div className="jf-alert__content">{children}</div>
        {closeType !== "none" ? (
          <CloseButton onClick={handleClose} className="jf-alert__close" />
        ) : (
          <></>
        )}
      </div>
    ) : (
      <></>
    );
  }
);

Alert.displayName = "Alert";

Alert.propTypes = {
  type: PropTypes.oneOf(["error", "success", "info"]),
  variant: PropTypes.oneOf(["primary", "secondary"]),
  closeType: PropTypes.oneOf(["none", "state", "session", "local"]),
  storageId: PropTypes.string,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

Alert.defaultProps = {
  type: "error",
  variant: "primary",
  closeType: "none",
};
