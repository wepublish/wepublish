import { SVGProps } from 'react';

// Inherit color and size from the tenant's menu button.
const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: '1em',
  height: '1em',
  fill: 'currentColor',
  'aria-hidden': true,
};

export const MenuOpenIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...baseProps}
    {...props}
  >
    <rect
      x="3"
      y="6"
      width="18"
      height="2"
    />
    <rect
      x="3"
      y="11"
      width="18"
      height="2"
    />
    <rect
      x="3"
      y="16"
      width="18"
      height="2"
    />
  </svg>
);

export const MenuCloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...baseProps}
    {...props}
  >
    <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.88 18.3 9.17 12 2.88 5.71 4.3 4.3l6.29 6.29 6.3-6.29z" />
  </svg>
);
