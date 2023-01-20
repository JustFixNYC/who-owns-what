import React from "react";
import { t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import CloseIcon from "../assets/img/CloseIcon";

type CloseButtonProps = withI18nProps & {
  onClick: () => void;
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

/**
 * Color of the X can be changed via CSS
 * eg: `.CloseIcon: { stroke: $justfix-white }`
 */
export const CloseButton = withI18n()(
  ({
    i18n,
    onClick,
    strokeWidth = "0.1rem",
    height = "1.6rem",
    width = "1.6rem",
  }: CloseButtonProps) => (
    <button
      className="button"
      aria-label={i18n._(t`Close`)}
      aria-expanded="false"
      onClick={onClick}
    >
      <CloseIcon className="CloseIcon" strokeWidth={strokeWidth} height={height} width={width} />
    </button>
  )
);
