import React from "react";
import { I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { ReactComponent as CloseIcon } from "../assets/img/close.svg";

const justfixColors = {
  black: "#242323",
  white: "#FAF8F4",
};

type CloseButtonProps = {
  onClick: () => void;
  /**
   * Name of JustFix color for the X svg (Default: "black" = #242323)
   */
  stroke?: keyof typeof justfixColors;
  /**
   * Stroke width for the X svg (Default: "0.1rem")
   */
  strokeWidth?: number | string;
  /**
   * Width for the X svg (Default: "1.6rem")
   */
  width?: number | string;
  /**
   * Height for the X svg (Default: "1.6rem")
   */
  height?: number | string;
};

export const CloseButton = ({
  onClick,
  stroke = "black",
  strokeWidth = "0.1rem",
  height = "1.6rem",
  width = "1.6rem",
}: CloseButtonProps) => (
  <I18n>
    {({ i18n }) => (
      <button
        className="button"
        aria-label={i18n._(t`Close`)}
        aria-expanded="false"
        onClick={onClick}
      >
        <CloseIcon
          stroke={justfixColors[stroke]}
          strokeWidth={strokeWidth}
          height={height}
          width={width}
        />
      </button>
    )}
  </I18n>
);
