import React, { useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Button } from "@justfixnyc/component-library";
import { Trans, t } from "@lingui/macro";

import "styles/SendNewLink.css";
import { CheckIcon } from "./Icons";

type SendNewLinkProps = withI18nProps & {
  setParentState: React.Dispatch<React.SetStateAction<boolean>>;
  onClick: () => void;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "large";
  className?: string;
};

const SendNewLinkWithoutI18n = (props: SendNewLinkProps) => {
  const { setParentState, onClick, variant = "secondary", size = "small", className, i18n } = props;

  const [linkSent, setLinkSent] = useState(false);

  const handleClick = () => {
    onClick();
    setLinkSent(true);
    setParentState(true);
  };

  return (
    <div className="send-new-link-container">
      {!linkSent ? (
        <div className="send-new-link">
          <Button
            variant={variant}
            size={size}
            className={className}
            labelText={i18n._(t`Send new link`)}
            onClick={handleClick}
          />
        </div>
      ) : (
        <div className="link-sent">
          <CheckIcon />
          <Trans render="span">New link sent</Trans>
        </div>
      )}
    </div>
  );
};

const SendNewLink = withI18n()(SendNewLinkWithoutI18n);

export default SendNewLink;
