import { css } from '@emotion/react';

export const viewportControlsStyles = css`
  .Puck [class*='_ViewportControls-actions_'] {
    min-width: 0;
  }

  .Puck [class*='_ViewportControls-actionsInner_'] {
    --puck-iconbutton-space: 2px;
    flex-wrap: wrap;
    justify-content: center;
    min-width: 0;
    max-width: 100%;
  }

  .Puck [class*='_ViewportControls-zoom_'] {
    display: flex;
  }

  .Puck [class*='_ViewportControls-zoomSelect_'] {
    width: auto;
    min-height: 32px;
    padding-right: calc(var(--puck-space-2) + 18px);
    background-position: calc(100% - var(--puck-space-2)) calc(50% + 3px);
  }
`;
