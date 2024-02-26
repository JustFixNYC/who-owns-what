/* eslint-disable no-useless-escape */
import React, { ChangeEvent, forwardRef, useState } from "react";

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

const isBadPasswordFormat = (password: string) => {
  let valid = true;
  passwordRules.forEach((rule) => (valid = valid && !!password.match(rule.regex)));
  return !valid;
};

interface PasswordInputProps extends React.ComponentPropsWithoutRef<"input"> {
  i18n: I18n;
  labelText: string;
  password: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
  showError: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  username?: string;
  showPasswordRules?: boolean;
  showForgotPassword?: boolean;
  i18nHash?: string;
}

const PasswordInputWithoutI18n = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      i18n,
      i18nHash,
      labelText,
      username,
      password,
      error,
      setError,
      showError,
      onChange,
      showPasswordRules,
      showForgotPassword,
      id,
      ...props
    },
    ref
  ) => {
    const { account } = createWhoOwnsWhatRoutePaths();

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e);
      const passwordIsInvalid = isBadPasswordFormat(e.target.value);
      setError(passwordIsInvalid);
    };

    return (
      <div className="password-input-field">
        <div className="password-input-label">
          <label htmlFor={id ?? "password-input"}>{i18n._(t`${labelText}`)}</label>
          {showForgotPassword && (
            <LocaleLink
              to={`${account.forgotPassword}?email=${encodeURIComponent(username || "")}`}
            >
              Forgot your password?
            </LocaleLink>
          )}
        </div>
        {showPasswordRules && (
          <div className="password-input-rules">
            {passwordRules.map((rule, i) => {
              const ruleClass = !!password
                ? password.match(rule.regex)
                  ? "valid"
                  : "invalid"
                : "";
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
            id={id ?? "password-input"}
            className={classNames("input", { invalid: showError && error })}
            onChange={handleChange}
            value={password}
            {...props}
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
  }
);

PasswordInputWithoutI18n.defaultProps = {
  showPasswordRules: false,
};

const PasswordInput = withI18n()(PasswordInputWithoutI18n);

export default PasswordInput;
