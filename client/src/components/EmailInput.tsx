import { ChangeEvent, forwardRef } from "react";
import { t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";

import "styles/EmailInput.css";
import "styles/_input.scss";
import classNames from "classnames";
import { Icon } from "@justfixnyc/component-library";

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
      /* valid email regex borrowed from https://stackoverflow.com/a/46181/7051239 */
      const pattern = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

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
              <div>
                <Icon icon="circleExclamation" className="mr-3" />
              </div>
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
