import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Trans } from "@lingui/macro";
import Modal from "./Modal";
import { isLegacyPath } from "components/WowzaToggle";
import browser from "util/browser";

export const DeprecationModal = () => {
  const { pathname } = useLocation();
  const [isModalVisible, setModalVisibility] = useState(
    !browser.getCookieValue(browser.DEPRECATION_MODAL_COOKIE_NAME)
  );

  const onClose = () => {
    browser.setCookie(browser.DEPRECATION_MODAL_COOKIE_NAME, "1", 30);
    setModalVisibility(false);
  };

  return (
    <Modal showModal={isModalVisible && isLegacyPath(pathname)} onClose={onClose}>
      <h5 className="first-header">
        <Trans>You are viewing a legacy version of Who Owns What</Trans>
      </h5>
      <p>
        <Trans>
          In March 2023 this version will be discontinued. Switch to the new version or learn more.
        </Trans>
      </p>
    </Modal>
  );
};
