import React, { useState } from "react";
import classnames from "classnames";

type ToggleButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  customClasses?: string;
  /**
   * Value to provide to "data-badge-value" attribute on the button element to
   * be accessed in css to add dynamic notification badge content.
   */
  badgeValue?: string | number;
  /**
   * Initial state of the button, pressed (true) or not (false)
   */
  pressedDefault?: boolean;
};

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  onClick,
  children,
  customClasses,
  badgeValue,
  pressedDefault = false,
}: ToggleButtonProps) => {
  const [isPressed, setIsPressed] = useState(pressedDefault);

  const buttonClasses = classnames(
    "jf-toggle-button",
    customClasses,
    badgeValue == null && "jf-has-badge"
  );

  const onButtonClick = () => {
    onClick();
    setIsPressed(!isPressed);
  };

  return (
    <button
      data-badge-value={badgeValue}
      aria-pressed={isPressed}
      className={buttonClasses}
      onClick={onButtonClick}
    >
      {children}
    </button>
  );
};
