import * as React from "react";
import { SVGProps } from "react";
export const SvgApple = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    {...props}
  >
    <path
      fill="currentColor"
      d="M9.5 15.5c0-1.2 1-2 2.5-2s2.5.8 2.5 2C14.5 18 14 23 12 23s-2.5-5-2.5-7.5Z"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3.25 11a8.75 8.75 0 1 1 12.513 7.902 17.468 17.468 0 0 1-.335 1.76c3.975-1.41 6.822-5.203 6.822-9.662C22.25 5.34 17.66.75 12 .75S1.75 5.34 1.75 11c0 4.459 2.847 8.253 6.822 9.663l-.03-.125a17.481 17.481 0 0 1-.305-1.636A8.75 8.75 0 0 1 3.25 11Z"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M6.75 11a5.25 5.25 0 1 1 9.119 3.549c.086.301.131.62.131.951 0 .288-.006.609-.02.953a6.75 6.75 0 1 0-7.96 0c-.014-.344-.02-.665-.02-.953 0-.331.045-.65.131-.951A5.231 5.231 0 0 1 6.75 11Z"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      d="M9.75 10.25a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 1 0-4.5 0"
    />
  </svg>
);
