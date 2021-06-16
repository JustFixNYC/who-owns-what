import React from "react";

import chevron from "../assets/img/accordionchevron.svg";
import "styles/Accordion.scss";

export const Accordion = (props: { question: string; children: React.ReactNode }) => {
  return (
    <details className="Accordion">
      <summary>
        {props.question}
        <img src={chevron} className="icon mx-1 float-right" alt="Open" />
      </summary>
      <div>{props.children}</div>
    </details>
  );
};
