import { ChangeEvent } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { AlertIcon } from "./Icons";

import "styles/EmailInput.css";
import "styles/_input.scss";

type EmailInputProps = {
  i18n: I18n;
  email: string;
  error: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

const EmailInputWithoutI18n = (props: EmailInputProps) => {
  const { i18n, email, error, setError, onChange, required } = props;

  const isBadEmailFormat = () => {
    /* valid email regex rules 
      alpha numeric characters are ok, upper/lower case agnostic 
      username: leading \_ ok, chars \_\.\-\+ ok in all other positions
      domain name: chars \.\- ok as long as not leading. must end in a \. and at least two alphabet chars */
    const pattern =
      "^([a-zA-Z0-9_]+[a-zA-Z0-9+_.-]+@[a-zA-Z0-9]+[a-zA-Z0-9.-]+[a-zA-Z0-9]+.[a-zA-Z]{2,})$";
    const input = document.getElementById("email-input") as HTMLElement;
    const inputValue = (input as HTMLInputElement).value;

    // HTML input element has loose email validation requirements, so we check the input against a custom regex
    const passStrictRegex = inputValue.match(pattern);
    const passAutoValidation = document.querySelectorAll("input:invalid").length === 0;

    if (!passAutoValidation || !passStrictRegex) {
      setError(true);
      input.className = input.className + " invalid";
    } else {
      setError(false);
      input.className = input.className.split(" ")[0];
    }
  };

  return (
    <>
      <div className="email-input-label">
        <label htmlFor="email-input">
          <Trans>Email address</Trans>
        </label>
      </div>
      {error && (
        <div className="email-input-errors">
          <span id="input-field-error">
            <AlertIcon />
            <Trans>Please enter a valid email address. </Trans>
          </span>
        </div>
      )}
      <div className="email-input">
        <input
          type="email"
          id="email-input"
          className="input"
          placeholder={i18n._(t`Enter email`)}
          onChange={onChange}
          onBlur={isBadEmailFormat}
          value={email}
          required={required}
          // note: required={true} removed bc any empty state registers as invalid state
        />
      </div>
    </>
  );
};

const EmailInput = withI18n()(EmailInputWithoutI18n);

export default EmailInput;
