import React, { SVGProps } from "react";

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M2 2L14 14" stroke="currentcolor" strokeLinecap="square" />
    <path d="M14 2L2 14" stroke="currentcolor" strokeLinecap="square" />
  </svg>
);

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    width="18"
    height="14"
    viewBox="0 0 18 14"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      stroke="currentcolor"
      strokeWidth="2"
      d="M1.66675 7.01497L6.33342 11.6816L16.3334 1.68164"
    />
  </svg>
);

export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    width="10"
    height="6"
    viewBox="0 0 10 6"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path stroke="currentcolor" d="M9 5.125L4.75 0.875L0.5 5.125" />
  </svg>
);
