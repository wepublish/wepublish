import styled from '@emotion/styled';

export const GroupOutline = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  outline: var(--puck-border-width-focus, 2px) dashed
    var(--puck-color-azure-05, #3479be);
  outline-offset: calc(var(--puck-border-width-focus, 2px) * -1);
`;

export const GroupBadge = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-bottom-right-radius: var(--puck-radius-m, 4px);
  background: var(--puck-color-azure-05, #3479be);
  color: var(--puck-color-white, #fff);
  font-family: var(--puck-font-family, sans-serif);
  font-size: var(--puck-font-size-xxxs, 12px);
  font-weight: var(--puck-font-weight-medium, 500);
  line-height: 1.4;
  pointer-events: none;
`;
