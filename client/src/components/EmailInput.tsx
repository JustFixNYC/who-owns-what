import { ChangeEvent, forwardRef } from "react";
import { t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { AlertIcon } from "./Icons";

import "styles/EmailInput.css";
import "styles/_input.scss";
import classNames from "classnames";

interface EmailInputProps extends React.ComponentPropsWithoutRef<"input"> {
  i18n: I18n;
  email: string;
  error: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  showError: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  i18nHash?: string;
  labelText?: string;
}

const EmailInputWithoutI18n = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ i18n, i18nHash, email, error, setError, showError, onChange, labelText, ...props }, ref) => {
    const isBadEmailFormat = (value: string) => {
      /* valid email regex rules 
      alpha numeric characters are ok, upper/lower case agnostic 
      username: leading \_ ok, chars \_\.\-\+ ok in all other positions
      domain name: chars \.\- ok as long as not leading. must end in a \. and at least two alphabet chars */
      const pattern = /^([a-zA-Z0-9_]+[a-zA-Z0-9+_.-]+@[a-zA-Z0-9]+[a-zA-Z0-9.-]+[a-zA-Z0-9]+\.[a-zA-Z]{2,})$/;

      // HTML input element has loose email validation requirements, so we check the input against a custom regex
      const passStrictRegex = value.match(pattern);
      const passAutoValidation = document.querySelectorAll("input:invalid").length === 0;

      return !passAutoValidation || !passStrictRegex;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e);
      const emailIsInvalid = isBadEmailFormat(e.target.value);
      setError(emailIsInvalid);
    };

    return (
      <div className="email-input-field">
        {!!labelText && (
          <div className="email-input-label mb-4">
            <label htmlFor="email-input">{labelText}</label>
          </div>
        )}
        {showError && error && (
          <div className="email-input-errors mb-4">
            <span id="input-field-error">
              <AlertIcon className="mr-3" />
              {i18n._(t`Please enter a valid email address.`)}
            </span>
          </div>
        )}
        <div className="email-input">
          <input
            type="email"
            id="email-input"
            className={classNames("input", { invalid: showError && error })}
            onChange={handleChange}
            value={email}
            {...props}
          />
        </div>
      </div>
    );
  }
);

const EmailInput = withI18n({ withHash: false })(EmailInputWithoutI18n);

export default EmailInput;
