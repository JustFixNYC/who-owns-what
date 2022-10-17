import React, { useState } from "react";

import "styles/Accordion.scss";

type StickyModalProps = {
  label?: string;
  verticalPosition?: "top" | "bottom";
  horizontalPosition?: "left" | "right";
  children: React.ReactNode;
  onClose?: () => void;
};

export const StickyModal: React.FC<StickyModalProps> = ({
  label,
  verticalPosition,
  horizontalPosition,
  onClose,
  children,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const onClick = () => {
    setIsModalVisible(false);
    onClose?.();
  };

  if (!isModalVisible) return <div />;

  return (
    <div className={`sticky-modal ${verticalPosition || ""} ${horizontalPosition || ""}`}>
      <div className="sticky-modal-header">
        <div className="sticky-modal-label">{label}</div>
        <div className="sticky-modal-close" onClick={onClick}>
          ✕
        </div>
      </div>
      <div className="sticky-modal-body">{children}</div>
    </div>
  );
};
