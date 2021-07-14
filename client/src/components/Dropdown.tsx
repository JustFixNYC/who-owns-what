import React, { useState } from "react";
import classnames from "classnames";
import FocusTrap from "focus-trap-react";

import chevron from "../assets/img/accordionchevron.svg";

import "styles/Dropdown.css";
import { withI18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

type DropdownProps = withI18nProps & {
  /**
   * The items that go inside the expandable menu. Since these are
   * nested inside a `<ul>` element, they should consist of `<li>`'s,
   * otherwise you may face some DOM nesting errors.
   */
  children: React.ReactNode;
  /**
   * The text label on the button that toggles the dropdown menu.
   * If undefined, the toggle button will default to a hamburger icon.
   */
  buttonLabel?: string;
};

export const Dropdown = withI18n()(({ i18n, children, buttonLabel }: DropdownProps) => {
  const [isDropdownVisible, setDropdownVisibility] = useState(false);

  const closeDropdown = () => setDropdownVisibility(false);
  const toggleDropdown = () => {
    isDropdownVisible ? setDropdownVisibility(false) : setDropdownVisibility(true);
  };

  const isHamburgerMenu = !buttonLabel;

  return (
    <div className="DropdownComponent">
      <FocusTrap
        active={isDropdownVisible}
        focusTrapOptions={{
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: false,
          onDeactivate: closeDropdown,
        }}
      >
        <div
          className={classnames(
            "dropdown",
            isDropdownVisible && "is-open",
            isHamburgerMenu && "dropdown-right show-lg"
          )}
        >
          <button
            aria-label={buttonLabel || i18n._(t`Menu`)}
            aria-expanded={isDropdownVisible}
            className={classnames(
              "btn",
              "btn-link",
              "dropdown-toggle",
              "m-2",
              isDropdownVisible && "active",
              buttonLabel && "dropdown-selector-panel"
            )}
            onClick={() => toggleDropdown()}
          >
            {buttonLabel ? (
              <>
                <div className="float-left">{buttonLabel}</div>
                <div className="float-right">
                  <img src={chevron} className="icon" alt="Open" />
                </div>
              </>
            ) : (
              <i className={classnames("icon", isDropdownVisible ? "icon-cross" : "icon-menu")}></i>
            )}
          </button>
          <ul
            onClick={closeDropdown}
            className={classnames("menu", "menu-reverse", isDropdownVisible ? "d-block" : "d-none")}
          >
            {children}
          </ul>
        </div>
      </FocusTrap>
      <div
        onClick={closeDropdown}
        className={classnames("dropdown-overlay", !isDropdownVisible && "hidden")}
      />
    </div>
  );
});
