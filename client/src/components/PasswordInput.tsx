import React, { Fragment, useState } from "react";

import "styles/Password.css";
import "styles/_input.scss";

import { withI18n } from "@lingui/react";
import { LocaleLink } from "i18n";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { I18n } from "@lingui/core";
import { t } from "@lingui/macro";
import { HideIcon, ShowIcon } from "./Icons";

type PasswordRule = {
  regex: RegExp;
  label: string;
};

const passwordRules: PasswordRule[] = [
  { regex: /.{8}/, label: "Must be 8 characters" },
  // eslint-disable-next-line no-useless-escape
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
  username?: string;
  onChange?: (password: string) => void;
  validateInput?: boolean;
};

const PasswordInputWithoutI18n = (props: PasswordInputProps) => {
  const { account } = createWhoOwnsWhatRoutePaths();

  const { i18n, username, validateInput, onChange } = props;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const labelText = validateInput ? "Create a new password" : "Password";

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <Fragment>
      <div className="login-password-label">
        <label>{i18n._(t`${labelText}`)}</label>
        {!validateInput && (
          <LocaleLink to={`${account.forgotPassword}?email=${encodeURIComponent(username || "")}`}>
            Forgot your password?
          </LocaleLink>
        )}
      </div>
      {validateInput &&
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
        <button
          type="button"
          className="show-hide-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <HideIcon /> : <ShowIcon />}
        </button>
      </div>
    </Fragment>
  );
};

PasswordInputWithoutI18n.defaultProps = {
  validateInput: false,
};

const PasswordInput = withI18n()(PasswordInputWithoutI18n);

export default PasswordInput;
