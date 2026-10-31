import styled from '@emotion/styled';

export const BottomBarRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;

  & > :first-child {
    flex: 1;
    min-height: 0;
    height: auto !important;
  }

  @media (max-width: 637px) {
    [class*='_Nav-list_'] {
      flex: 1;
      min-width: 0;
      gap: 0;
    }

    [class*='_Nav-list_'] > [class*='_NavItem_'] {
      flex: 1 1 0;
      min-width: 0;
      padding: 0;
    }

    [class*='_NavItem-link_'] {
      width: 100%;
    }

    [class*='_Nav-mobileActions_'] {
      padding-inline: var(--puck-space-2);
    }
  }
`;

export const BottomBarPanel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 80%;
  border-top: 1px solid var(--puck-color-border);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
`;

export const BottomBarResizeHandle = styled.div`
  position: absolute;
  inset: -3px 0 auto;
  height: 6px;
  cursor: ns-resize;
  z-index: 1;

  &:hover {
    background: var(--puck-color-interactive);
  }
`;

export const BottomBarPanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

export const BottomBarNav = styled.nav`
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  height: 26px;
  padding: 0 8px;
  border-top: 1px solid var(--puck-color-border);
  background: var(--puck-color-surface);
`;

export const BottomBarButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--puck-color-text-secondary);
  font: inherit;
  font-size: var(--puck-font-size-xxs);
  cursor: pointer;

  &[aria-pressed='true'] {
    background: var(--puck-color-interactive-soft);
    color: var(--puck-color-interactive);
  }

  &:hover {
    color: var(--puck-color-text);
    background: var(--puck-color-interactive-soft);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: calc(var(--puck-border-width-focus) * -1);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const BottomBarSideBarToggles = styled.div`
  display: none;
  margin-left: auto;

  @media (min-width: 638px) {
    display: flex;
  }
`;

export const BottomBarIconButton = styled(BottomBarButton)`
  justify-content: center;
  width: 26px;
  padding: 0;
`;

export const BottomBarCloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: inline-flex;
  padding: 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-text);
    background: var(--puck-color-interactive-soft);
  }
`;
