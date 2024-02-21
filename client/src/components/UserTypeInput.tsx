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
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  setUserType: React.Dispatch<React.SetStateAction<string>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

const UserTypeInputWithoutI18n = (props: UserTypeInputProps) => {
  const { i18n, userType, error, setError, setUserType, onChange, required } = props;

  const [activeRadio, setActiveRadio] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setActiveRadio(value);
    if (value === USER_TYPES.other) {
      setUserType("");
    } else {
      onChange(e);
      setError(false);
    }
  };

  const missingOtherText = () => {
    if (!userType) {
      setError(true);
    } else {
      setError(false);
    }
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
      {error && activeRadio !== USER_TYPES.other && (
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
        />
        <label htmlFor={"user-type-input-other"}>{USER_TYPES.other}</label>
      </div>
      {activeRadio === USER_TYPES.other && (
        <div className="user-type-input-text-group">
          {error && (
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
            onChange={onChange}
            onBlur={missingOtherText}
          />
        </div>
      )}
    </div>
  );
};

const UserTypeInput = withI18n()(UserTypeInputWithoutI18n);

export default UserTypeInput;
