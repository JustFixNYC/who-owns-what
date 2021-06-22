import React from "react";

import chevron from "../assets/img/accordionchevron.svg";
import "styles/Accordion.scss";

type AccordionProps = {
  title: string;
  /**
   * Alternate text to show as the "title" part of the accordion,
   * once it has been opened.
   */
  titleOnOpen?: string;
  children: React.ReactNode;
};

export const Accordion: React.FC<AccordionProps> = ({ title, titleOnOpen, children }) => {
  return (
    <details className="accordion">
      <summary>
        {titleOnOpen ? (
          <>
            <span className="title-default">{title}</span>
            <span className="title-on-open">{titleOnOpen}</span>
          </>
        ) : (
          title
        )}
        <img src={chevron} className="icon mx-1 float-right" alt="Open" />
      </summary>
      <div>{children}</div>
    </details>
  );
};
