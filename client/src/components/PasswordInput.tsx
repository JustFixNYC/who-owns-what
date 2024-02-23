/* eslint-disable no-useless-escape */
import React, { ChangeEvent, useState } from "react";

import "styles/Password.css";
import "styles/_input.scss";

import { withI18n } from "@lingui/react";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { I18n } from "@lingui/core";
import { t } from "@lingui/macro";
import { HideIcon, ShowIcon } from "./Icons";
import classNames from "classnames";

type PasswordRule = {
  regex: RegExp;
  label: string;
};

const passwordRules: PasswordRule[] = [
  { regex: /.{8}/, label: "Must be 8 characters" },
  {
    regex: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9!"`'#%&,:;<>=@{}\$\(\)\*\+\/\\\?\[\]\^\|]+)$/,
    label: "Must include letters and numbers",
  },
];

export const validatePassword = (password: string) => {
  let valid = true;
  passwordRules.forEach((rule) => (valid = valid && !!password.match(rule.regex)));
  return valid;
};

type PasswordInputProps = {
  i18n: I18n;
  labelText: string;
  password: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
  showError: boolean;
  username?: string;
  setError?: React.Dispatch<React.SetStateAction<boolean>>;
  showPasswordRules?: boolean;
  showForgotPassword?: boolean;
  inputId?: string;
};

const PasswordInputWithoutI18n = (props: PasswordInputProps) => {
  const { account } = createWhoOwnsWhatRoutePaths();
  const {
    i18n,
    labelText,
    username,
    password,
    error,
    setError,
    showError,
    onChange,
    showPasswordRules,
    showForgotPassword,
    inputId,
  } = props;
  const [showPassword, setShowPassword] = useState(false);

  const badPasswordFormat = () => {
    const input = document.getElementById("password-input") as HTMLElement;
    const inputValue = (input as HTMLInputElement).value;
    const isValid = validatePassword(inputValue);
    setError && setError(!isValid);
  };

  return (
    <div className="password-input-field">
      <div className="password-input-label">
        <label htmlFor={inputId ?? "password-input"}>{i18n._(t`${labelText}`)}</label>
        {showForgotPassword && (
          <LocaleLink to={`${account.forgotPassword}?email=${encodeURIComponent(username || "")}`}>
            Forgot your password?
          </LocaleLink>
        )}
      </div>
      {showPasswordRules && (
        <div className="password-input-rules">
          {passwordRules.map((rule, i) => {
            const ruleClass = !!password ? (password.match(rule.regex) ? "valid" : "invalid") : "";
            return (
              <span className={`password-input-rule ${ruleClass}`} key={`rule-${i}`}>
                {rule.label}
              </span>
            );
          })}
        </div>
      )}
      <div className="password-input">
        <input
          type={showPassword ? "text" : "password"}
          id={inputId ?? "password-input"}
          className={classNames("input", { invalid: showError && error })}
          onChange={onChange}
          onBlur={badPasswordFormat}
          value={password}
        />
        <button
          type="button"
          className="show-hide-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <HideIcon /> : <ShowIcon />}
        </button>
      </div>
    </div>
  );
};

PasswordInputWithoutI18n.defaultProps = {
  showPasswordRules: false,
};

const PasswordInput = withI18n()(PasswordInputWithoutI18n);

export default PasswordInput;
