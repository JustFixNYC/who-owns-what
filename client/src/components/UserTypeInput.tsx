import { ChangeEvent, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { I18n } from "@lingui/core";
import { withI18n } from "@lingui/react";
import { AlertIcon } from "./Icons";
import classNames from "classnames";

type UserTypeInputProps = {
  i18n: I18n;
  error: boolean;
  showError: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  setUserType: React.Dispatch<React.SetStateAction<string>>;
  required?: boolean;
};

const UserTypeInputWithoutI18n = (props: UserTypeInputProps) => {
  const { i18n, error, showError, setError, setUserType, required } = props;

  const [activeRadio, setActiveRadio] = useState("");
  const [userTypeText, setUserTypeText] = useState("");

  const USER_TYPES = {
    tenant: i18n._(t`Tenant`),
    organizer: i18n._(t`Organizer`),
    advocate: i18n._(t`Advocate`),
    legal: i18n._(t`Legal Worker`),
    government: i18n._(t`Government Worker (Non-Lawyer)`),
    other: i18n._(t`Other`),
  };

  const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === USER_TYPES.other.toLocaleUpperCase("en")) {
      setUserType(!!userTypeText ? userTypeText : value);
    } else {
      setUserType(value);
    }
    setActiveRadio(value);
    setError(false);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserType(!!value ? value : activeRadio);
    setUserTypeText(value);
  };

  return (
    <div className="user-type-container">
      {showError && error && (
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
          value={USER_TYPES.tenant.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.tenant.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-tenant"}>{USER_TYPES.tenant}</label>
        <input
          id="user-type-input-organizer"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.organizer.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.organizer.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-organizer"}>{USER_TYPES.organizer}</label>
        <input
          id="user-type-input-advocate"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.advocate.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.advocate.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-advocate"}>{USER_TYPES.advocate}</label>
        <input
          id="user-type-input-legal"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.legal.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.legal.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-legal"}>{USER_TYPES.legal}</label>
        <input
          id="user-type-input-government"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.government.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.government.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-government"}>{USER_TYPES.government}</label>
        <input
          id="user-type-input-other"
          className="input-radio"
          required={required}
          type="radio"
          name="user-type"
          value={USER_TYPES.other.toLocaleUpperCase("en")}
          checked={activeRadio === USER_TYPES.other.toLocaleUpperCase("en")}
          onChange={handleRadioChange}
        />
        <label htmlFor={"user-type-input-other"}>{USER_TYPES.other}</label>
      </div>
      {activeRadio === USER_TYPES.other.toLocaleUpperCase("en") && (
        <div className="user-type-input-text-group">
          <input
            autoFocus
            id="user-type-input-other-text"
            className={classNames("input", { invalid: error })}
            type="text"
            name="user-type"
            value={userTypeText}
            onChange={handleTextChange}
          />
        </div>
      )}
    </div>
  );
};

const UserTypeInput = withI18n()(UserTypeInputWithoutI18n);

export default UserTypeInput;
