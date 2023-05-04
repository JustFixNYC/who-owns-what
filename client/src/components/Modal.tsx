import React, { ComponentProps } from "react";
import ReactModal from "react-modal";

import "styles/Modal.css";

type ModalProps = Omit<ComponentProps<typeof ReactModal>, "isOpen"> & {
  showModal: boolean;
  onClose: (event: any) => void;
  children: any;
  width?: number;
};

const Modal = ({ width, showModal, onClose, children, style, ...props }: ModalProps) => {
  // style overrides are here. new stuff is in ReactModal.scss
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(69, 77, 93, 0.6)", // rgba equivalent of the $dark color (#454D5D)
      ...style?.overlay,
    },
    content: {
      position: "absolute",
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      border: "1px solid #727e96",
      background: "#fff",
      overflow: "auto",
      WebkitOverflowScrolling: "touch",
      borderRadius: "0",
      outline: "none",
      padding: "40px 30px",
      margin: "auto",
      width: `${width ? width : 40}vw`,
      ...style?.content,
    },
  };

  return (
    <ReactModal
      isOpen={showModal}
      contentLabel="Modal"
      style={styles}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      {...props}
    >
      <button className="ReactModal__Close btn btn-link" onClick={(e) => onClose(e)}>
        [ x ]
      </button>
      {children}
    </ReactModal>
  );
};

export default Modal;
