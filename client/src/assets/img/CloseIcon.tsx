import React, { SVGProps } from "react";

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M2 2L14 14" fill="currentcolor" stroke-linecap="square" />
    <path d="M14 2L2 14" fill="currentcolor" stroke-linecap="square" />
  </svg>
);

export default CloseIcon;
