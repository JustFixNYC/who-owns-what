import React from "react";
import ReactModal from "react-modal";

import "styles/Modal.css";

type ModalProps = {
  showModal: boolean;
  onClose: (event: React.MouseEvent) => void;
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
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      //backgroundColor: "rgba(69, 77, 93, 0.6)", // rgba equivalent of the $dark color (#454D5D)
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
    <ReactModal isOpen={props.showModal} contentLabel="Modal" style={styles}>
      <button className="ReactModal__Close btn btn-link" onClick={(e) => props.onClose(e)}>
        [ x ]
      </button>
      {props.children}
    </ReactModal>
  );
};

export default Modal;
