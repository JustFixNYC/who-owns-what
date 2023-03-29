import React, { useState } from "react";

import "styles/Password.css";
import "styles/_input.scss";

import { withI18n } from "@lingui/react";

type PasswordRule = {
  regex: RegExp;
  label: string;
};

const passwordRules: PasswordRule[] = [
  { regex: /.{8}/, label: "Must be 8 characters" },
  { regex: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/, label: "Must include letters and numbers" },
];

export const validatePassword = (password: string) => {
  let valid = true;
  passwordRules.forEach((rule) => (valid = valid && !!password.match(rule.regex)));
  return valid;
};

type PasswordInputProps = {
  onChange?: (password: string) => void;
};

const PasswordInputWithoutI18n = (props: PasswordInputProps) => {
  const { onChange } = props;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <>
      <div className="password-input">
        <input
          type={showPassword ? "text" : "password"}
          className="input"
          placeholder={`Enter password`}
          onChange={handlePasswordChange}
          value={password}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)}>
          Show
        </button>
      </div>
      {passwordRules.map((rule, i) => {
        return (
          <span
            className={`password-input-rule ${password.match(rule.regex) ? "valid" : "invalid"}`}
            key={`rule-${i}`}
          >
            {rule.label}
          </span>
        );
      })}
    </>
  );
};

const PasswordInput = withI18n()(PasswordInputWithoutI18n);

export default PasswordInput;
