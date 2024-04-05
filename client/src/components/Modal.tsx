import React from "react";
import ReactModal from "react-modal";

import "styles/Modal.css";
import { CloseButton } from "./CloseButton";

type ModalProps = {
  showModal: boolean;
  onClose: () => void;
  children: any;
  width?: number;
};

const Modal = (props: ModalProps) => {
  // style overrides are here. new stuff is in ReactModal.scss
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(78, 75, 75, 0.8)", // rgba equivalent of the $gray-700 (#4E4B4B)
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
      width: `${props.width ? props.width : 40}vw`,
    },
  };

  return (
    <ReactModal
      isOpen={props.showModal}
      contentLabel="Modal"
      style={styles}
      onRequestClose={props.onClose}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      <CloseButton onClick={props.onClose} className="ReactModal__Close" />
      {props.children}
    </ReactModal>
  );
};

export default Modal;
