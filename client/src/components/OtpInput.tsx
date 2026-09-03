import classNames from "classnames";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent, Ref } from "react";

import "styles/OtpInput.css";

const DEFAULT_LENGTH = 6;

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  disabled?: boolean;
  invalid?: boolean;
  id: string;
  name: string;
  autoFocus?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * 6-digit OTP field: one real input over decorative cells (rent-history LoginPage pattern).
 */
export function OtpInput({
  length = DEFAULT_LENGTH,
  value,
  onChange,
  onKeyDown,
  onPaste,
  inputRef,
  disabled = false,
  invalid = false,
  id,
  name,
  autoFocus = false,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  className,
}: OtpInputProps) {
  return (
    <div
      className={classNames("otp-input", className, {
        "otp-input--invalid": invalid,
        "otp-input--disabled": disabled,
      })}
    >
      <div className="otp-input__cells" aria-hidden="true">
        {Array.from({ length }, (_, index) => (
          <span className="otp-input__cell" key={`otp-cell-${index}`}>
            {value[index] ?? ""}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id={id}
        name={name}
        className="otp-input__field"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        pattern={`\\d{${length}}`}
        required
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}

export default OtpInput;
