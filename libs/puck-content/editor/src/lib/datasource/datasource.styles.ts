import styled from '@emotion/styled';

import { ToggleOption, ToggleOptions } from '../field-controls';

export const DatasourceCardRoot = styled.section`
  display: grid;
  gap: var(--puck-space-3);
  min-width: 0;
  padding: var(--puck-space-2) var(--puck-space-3) var(--puck-space-3);
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }
`;

export const DatasourceCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--puck-space-2);
  min-width: 0;
  margin-right: calc(var(--puck-space-2) * -1);
`;

export const DatasourceCardIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  color: var(--puck-color-text-secondary);
  font-size: 18px;
`;

export const DatasourceCardTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DatasourceDescription = styled.p`
  margin: 0;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxs);
  line-height: 1.4;
`;

export const DatasourceTypeOptions = styled(ToggleOptions)`
  flex-wrap: wrap;
  gap: var(--puck-space-1);
`;

export const DatasourceTypeOption = styled(ToggleOption)`
  flex: 1 1 auto;
  padding: var(--puck-space-1) var(--puck-space-2);
  hyphens: manual;
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-medium);
  line-height: 1.25;
  text-align: center;
  text-wrap: balance;
`;

export const DatasourceAddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--puck-space-1);
  width: 100%;
  min-height: 36px;
  margin: 0;
  padding: var(--puck-space-2);
  border: var(--puck-border-width-regular) dashed var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-interactive);
  font-family: inherit;
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--puck-duration-fast) var(--puck-ease-exit),
    border-color var(--puck-duration-fast) var(--puck-ease-exit);

  svg {
    flex-shrink: 0;
    font-size: 18px;
  }

  &:hover {
    border-color: var(--puck-color-interactive);
    background: var(--puck-color-interactive-soft-hover);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;
