import { css } from '@emotion/react';
import styled from '@emotion/styled';

const inset = 'var(--plugin-panel-inset, 0px)';

export const pluginPanelHeaderStyles = css`
  position: sticky;
  top: calc(-1 * ${inset});
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--puck-space-2);
  margin: calc(-1 * ${inset}) calc(-1 * ${inset}) 0;
  padding: var(--puck-space-4) var(--puck-space-4) var(--puck-space-3);
  border-bottom: 1px solid var(--puck-color-border);
  background-color: var(--puck-color-surface);
  box-sizing: border-box;
  font-family: var(--puck-font-family);
`;

export const pluginPanelTitleStyles = css`
  margin: 0;
  color: var(--puck-color-text);
  font-family: var(--puck-font-family);
  font-size: var(--puck-font-size-xs);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: normal;
`;

export const Header = styled.div`
  ${pluginPanelHeaderStyles}
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--puck-space-2);
  min-height: 26px;
`;

export const HeadingText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--puck-space-1);
  min-width: 0;
`;

export const Title = styled.h2`
  ${pluginPanelTitleStyles}
`;

export const Subtitle = styled.p`
  margin: 0;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  font-weight: 400;
  line-height: 1.4;
`;

export const Actions = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--puck-space-1);
  margin-inline-start: auto;
`;

export const PuckPanel = styled.div`
  display: contents;

  [class*='_OutlineHeader_'] {
    ${pluginPanelHeaderStyles}
    flex-direction: row;
    align-items: center;
    min-height: calc(26px + var(--puck-space-4) + var(--puck-space-3) + 1px);

    > h2 {
      ${pluginPanelTitleStyles}
    }
  }
`;
