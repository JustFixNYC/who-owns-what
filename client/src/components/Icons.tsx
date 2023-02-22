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
    width="11"
    height="7"
    viewBox="0 0 11 7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M9.5 1L5.25 5.25L1 1" stroke="currentcolor" />
  </svg>
);

export const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="17"
    height="18"
    viewBox="0 0 17 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="0.5" y="0.5" width="16" height="17" rx="8" fill="none" />
    <path
      d="M6.84 12V11.11H7.98V8.24H6.9V7.35H9.12V11.11H10.16V12H6.84ZM8.5 6.58C8.30667 6.58 8.14 6.51333 8 6.38C7.86 6.24667 7.79 6.08667 7.79 5.9C7.79 5.7 7.85667 5.53667 7.99 5.41C8.12333 5.28333 8.29333 5.22 8.5 5.22C8.68667 5.22 8.85 5.28667 8.99 5.42C9.13667 5.55333 9.21 5.71333 9.21 5.9C9.21 6.08667 9.13667 6.24667 8.99 6.38C8.85 6.51333 8.68667 6.58 8.5 6.58Z"
      fill="currentcolor"
    />
    <rect x="0.5" y="0.5" width="16" height="17" rx="8" stroke="currentcolor" />
  </svg>
);
