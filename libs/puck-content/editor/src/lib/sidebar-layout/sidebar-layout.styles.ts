import { css } from '@emotion/react';

export const sidebarLayoutStyles = css`
  @media (max-width: 637px) {
    .Puck
      [class*='_PuckLayout--mobilePanelHeightToggle_'][class*='_PuckLayout--leftSideBarVisible_']
      [class*='_PuckLayout-inner_'] {
      grid-template-rows: 0 auto 40% 0 var(--puck-pluginbar-width);
    }

    .Puck
      [class*='_PuckLayout--mobilePanelHeightToggle_'][class*='_PuckLayout--leftSideBarVisible_'][class*='_PuckLayout--isExpanded_']
      [class*='_PuckLayout-inner_'] {
      grid-template-rows: 0 auto 70% 0 var(--puck-pluginbar-width);
    }
  }
`;
