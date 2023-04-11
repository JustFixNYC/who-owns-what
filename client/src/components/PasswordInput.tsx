import React, { useState } from "react";

import "styles/Password.css";
import "styles/_input.scss";

import { withI18n } from "@lingui/react";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";

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
  label?: string;
  username?: string;
  showForgotPassword?: boolean;
  showPasswordRules?: boolean;
  onChange?: (password: string) => void;
};

const PasswordInputWithoutI18n = (props: PasswordInputProps) => {
  const { account } = createWhoOwnsWhatRoutePaths();

  const { label, username, showForgotPassword, showPasswordRules, onChange } = props;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <>
      <div className="login-password-label">
        {label && <label>{label}</label>}
        {showForgotPassword && (
          <LocaleLink to={`${account.forgotPassword}?email=${encodeURIComponent(username || "")}`}>
            Forgot your password?
          </LocaleLink>
        )}
      </div>
      {showPasswordRules &&
        passwordRules.map((rule, i) => {
          const ruleClass = !!password ? (password.match(rule.regex) ? "valid" : "invalid") : "";
          return (
            <span className={`password-input-rule ${ruleClass}`} key={`rule-${i}`}>
              {rule.label}
            </span>
          );
        })}
      <div className="password-input">
        <input
          type={showPassword ? "text" : "password"}
          className="input"
          placeholder={`Enter password`}
          onChange={handlePasswordChange}
          value={password}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </>
  );
};

const PasswordInput = withI18n()(PasswordInputWithoutI18n);

export default PasswordInput;
