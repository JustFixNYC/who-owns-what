import { useState } from "react";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";

import Modal from "./Modal";

export const LoginBanner = withI18n()((props: withI18nProps) => {
  const [isBannerOpen, setBannerVisibility] = useState(true);
  const [isLearnMoreModalOpen, setLearnMoreModalOpen] = useState(false);
  const { i18n } = props;

  return (
    <>
      <div className={"App__banner " + (!isBannerOpen ? "d-hide" : "")}>
        <div className="content">
          <Trans render="p">
            Starting September 3, Who Owns What will use a one-time passcode instead of a password
            to log in.{" "}
            <button
              type="button"
              onClick={() => setLearnMoreModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isLearnMoreModalOpen}
            >
              Learn more
            </button>
          </Trans>
        </div>
        <button
          className="close-button"
          onClick={() => setBannerVisibility(false)}
          aria-label={i18n._(t`Close`)}
        >
          ✕
        </button>
      </div>
      <Modal
        className="otp-login-modal"
        showModal={isLearnMoreModalOpen}
        onClose={() => setLearnMoreModalOpen(false)}
      >
        <h5 className="first-header">
          <Trans>One time passcodes</Trans>
        </h5>
        <p>
          <strong>
            <Trans>You no longer need a password to log in to Who Owns What.</Trans>
          </strong>
        </p>
        <p>
          <Trans>
            Instead, we’ll send a one-time passcode to the email address associated with your
            account. Your account and saved information will stay the same.
          </Trans>
        </p>
      </Modal>
    </>
  );
});
