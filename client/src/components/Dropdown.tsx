import FocusTrap from "focus-trap-react";
import React, { useState } from "react";

import "styles/Dropdown.css";

export const Dropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDropdownVisible, setDropdownVisibility] = useState(false);

  const closeDropdown = () => setDropdownVisibility(false);
  const toggleDropdown = () => {
    isDropdownVisible ? setDropdownVisibility(false) : setDropdownVisibility(true);
  };
  console.log(isDropdownVisible);
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
        <div className="dropdown dropdown-right show-lg">
          <button
            aria-label="menu"
            aria-expanded={isDropdownVisible}
            className={"btn btn-link dropdown-toggle m-2" + (isDropdownVisible ? " active" : "")}
            onClick={() => toggleDropdown()}
          >
            <i className={"icon " + (isDropdownVisible ? "icon-cross" : "icon-menu")}></i>
          </button>
          <ul
            onClick={closeDropdown}
            className={"menu menu-reverse " + (isDropdownVisible ? "d-block" : "d-none")}
          >
            {children}
          </ul>
        </div>
      </FocusTrap>
      <div
        onClick={closeDropdown}
        className={"dropdown-overlay" + (isDropdownVisible ? "" : " hidden")}
      />
    </div>
  );
};
