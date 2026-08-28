import React, { useCallback, useRef, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { Button } from "@justfixnyc/component-library";

import { OtpInput } from "./OtpInput";
import { Nobr } from "./Nobr";

import "styles/CodeEntry.css";

export const OTP_LENGTH = 6;

export const sanitizeOtpValue = (raw: string, length: number = OTP_LENGTH): string =>
  raw.replace(/\D/g, "").slice(0, length);

export type CodeEntryProps = withI18nProps & {
  email: string;
  onVerify: (code: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
  error?: string;
};

const CodeEntryWithoutI18n = (props: CodeEntryProps) => {
  const { i18n, email, onVerify, onResend, error } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [codeResent, setCodeResent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isComplete = value.length === OTP_LENGTH;
  const busy = isSubmitting || isResending;

  const setSanitizedValue = useCallback((raw: string) => {
    setValue(sanitizeOtpValue(raw));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || !isComplete) return;
    setIsSubmitting(true);
    try {
      await onVerify(value);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (busy) return;
    setIsResending(true);
    try {
      await onResend();
      setCodeResent(true);
      setValue("");
      inputRef.current?.focus();
    } finally {
      setIsResending(false);
    }
  };

  const errorId = error ? "code-entry-error" : undefined;

  return (
    <form className="code-entry input-group" onSubmit={handleSubmit}>
      <h1>
        <Trans>Check your email</Trans>
      </h1>
      <h2 role="status" aria-live="polite">
        {codeResent ? (
          <Trans>
            We sent a new code to <Nobr>{email}</Nobr>
          </Trans>
        ) : (
          <Trans>
            We sent your code to <Nobr>{email}</Nobr>
          </Trans>
        )}
      </h2>
      <OtpInput
        id="login-otp"
        name="code"
        value={value}
        autoFocus
        inputRef={inputRef}
        onChange={(event) => setSanitizedValue(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          setSanitizedValue(event.clipboardData.getData("text"));
        }}
        onComplete={() => handleSubmit()}
        aria-label={i18n._(t`Verification code`)}
        aria-describedby={errorId}
        invalid={!!error && value.length > 0}
        disabled={busy}
      />
      <p className="code-entry-resend">
        <Trans>Didn’t receive a code?</Trans>{" "}
        <button type="button" onClick={handleResend} disabled={busy}>
          <Trans>Resend</Trans>
        </button>
      </p>
      {error && (
        <p id="code-entry-error" className="code-entry-error" role="alert">
          {error}
        </p>
      )}
      <div className="submit-button-group">
        <Button
          type="submit"
          variant="primary"
          size="large"
          labelText={i18n._(t`Verify`)}
          loading={isSubmitting}
          disabled={!isComplete || busy}
        />
      </div>
    </form>
  );
};

export const CodeEntry = withI18n()(CodeEntryWithoutI18n);

export default CodeEntry;
