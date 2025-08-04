import { ChangeEvent, forwardRef } from "react";
import { t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";

import "styles/PhoneNumberInput.css";
import "styles/_input.scss";
import classNames from "classnames";
import { Icon } from "@justfixnyc/component-library";

interface PhoneNumberInputProps extends React.ComponentPropsWithoutRef<"input"> {
  i18n: I18n;
  phone: string;
  error: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  showError: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  i18nHash?: string;
  labelText?: string;
}

const PhoneNumberInputWithoutI18n = forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  ({ i18n, i18nHash, phone, error, setError, showError, onChange, labelText, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e);
      const VALID_PHONE_NUMBER_LENGTH = 10;
      const cleaned = e.target.value.replace(/\D/g, "");
      if (cleaned.length > 0 && cleaned.length !== VALID_PHONE_NUMBER_LENGTH) {
        setError(true);
      } else {
        setError(false);
      }
    };

    return (
      <div className="phone-input-field">
        {!!labelText && (
          <div className="phone-input-label mb-4">
            <label htmlFor="phone-input">{labelText}</label>
          </div>
        )}
        {showError && error && (
          <div className="phone-input-errors mb-4">
            <span id="input-field-error">
              <div>
                <Icon icon="circleExclamation" className="mr-3" />
              </div>
              {i18n._(t`Please enter a valid phone number.`)}
            </span>
          </div>
        )}
        <div className="phone-input">
          <input
            type="tel"
            id="phone-input"
            maxLength={14} // 10 + formatting
            className={classNames("input", { invalid: showError && error })}
            onChange={handleChange}
            value={phone}
            {...props}
          />
        </div>
      </div>
    );
  }
);

const PhoneNumberInput = withI18n({ withHash: false })(PhoneNumberInputWithoutI18n);

export default PhoneNumberInput;
