import { css } from '@emotion/react';

export const fieldTabListStyles = css`
  .Puck [data-puck-tablist] {
    flex-wrap: wrap;
    overflow-x: visible;
  }

  @media (max-width: 637px) {
    .Puck [data-puck-tablist] {
      padding-block: var(--puck-space-1);
    }

    .Puck [data-puck-tablist] [role='tab'] {
      padding-block: var(--puck-space-1);
      min-height: 24px;
    }
  }
`;
