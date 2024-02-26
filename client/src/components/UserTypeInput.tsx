import { ChangeEvent, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { AlertIcon } from "./Icons";
import classNames from "classnames";

type UserTypeInputProps = {
  i18n: I18n;
  userType: string;
  error: boolean;
  showError: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  setUserType: React.Dispatch<React.SetStateAction<string>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

const UserTypeInputWithoutI18n = (props: UserTypeInputProps) => {
  const { i18n, userType, error, showError, setError, setUserType, onChange, required } = props;

  const [activeRadio, setActiveRadio] = useState("");

  const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;
    setActiveRadio(value);
    if (value === USER_TYPES.other) {
      setUserType("");
      setError(true);
    } else {
      onChange(e);
      setError(false);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const value = e.target.value;
    setError(!value);
  };

  const USER_TYPES = {
    tenant: i18n._(t`Tenant`),
    organizer: i18n._(t`Organizer`),
    advocate: i18n._(t`Advocate`),
    legal: i18n._(t`Legal Worker`),
    government: i18n._(t`Government Worker (Non-Lawyer)`),
    other: i18n._(t`Other`),
  };

  return (
    <div className="user-type-container">
      {showError && error && activeRadio !== USER_TYPES.other && (
        <span id="input-field-error">
          <AlertIcon />
          <Trans>Please select an option.</Trans>
        </span>
      )}
      <div className="user-type-radio-group">
        <input
          id="user-type-input-tenant"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.tenant}
          checked={activeRadio === USER_TYPES.tenant}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-tenant"}>{USER_TYPES.tenant}</label>
        <input
          id="user-type-input-organizer"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.organizer}
          checked={activeRadio === USER_TYPES.organizer}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-organizer"}>{USER_TYPES.organizer}</label>
        <input
          id="user-type-input-advocate"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.advocate}
          checked={activeRadio === USER_TYPES.advocate}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-advocate"}>{USER_TYPES.advocate}</label>
        <input
          id="user-type-input-legal"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.legal}
          checked={activeRadio === USER_TYPES.legal}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-legal"}>{USER_TYPES.legal}</label>
        <input
          id="user-type-input-government"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.government}
          checked={activeRadio === USER_TYPES.government}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-government"}>{USER_TYPES.government}</label>
        <input
          id="user-type-input-other"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.other}
          checked={activeRadio === USER_TYPES.other}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-other"}>{USER_TYPES.other}</label>
      </div>
      {activeRadio === USER_TYPES.other && (
        <div className="user-type-input-text-group">
          {showError && error && (
            <span id="input-field-error">
              <AlertIcon />
              <Trans>Please enter a response. </Trans>
            </span>
          )}
          <input
            required={required}
            autoFocus
            id="user-type-input-other-text"
            className={classNames("input", { invalid: error })}
            type="text"
            name="user-type"
            value={userType}
            onChange={handleTextChange}
          />
        </div>
      )}
    </div>
  );
};

const UserTypeInput = withI18n()(UserTypeInputWithoutI18n);

export default UserTypeInput;
