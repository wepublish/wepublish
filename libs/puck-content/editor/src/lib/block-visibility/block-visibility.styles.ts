import styled from '@emotion/styled';

export const VisibilitySections = styled.div`
  display: grid;
  gap: var(--puck-space-3);
`;

export const VisibilitySectionCard = styled.div`
  display: grid;
  gap: var(--puck-space-3);
  padding: var(--puck-space-3);
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
`;

export const VisibilitySectionHeader = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: var(--puck-space-2);
`;

export const VisibilitySectionIcon = styled.span<{ restricted: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--puck-radius-m);
  background: ${({ restricted }) =>
    restricted ?
      'var(--puck-color-interactive-soft)'
    : 'var(--puck-color-surface-muted)'};
  color: ${({ restricted }) =>
    restricted ?
      'var(--puck-color-interactive)'
    : 'var(--puck-color-text-secondary)'};

  svg {
    width: var(--puck-icon-size-s);
    height: var(--puck-icon-size-s);
  }
`;

export const VisibilitySectionHeading = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const VisibilitySectionTitle = styled.span`
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-semibold);
  line-height: 1.4;
`;

export const VisibilitySectionDescription = styled.p`
  margin: 0;
  color: var(--puck-color-text-muted);
  font-size: var(--puck-font-size-xxxs);
  line-height: 1.4;
`;

export const BlockStatusOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  padding: 2px;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface-muted);
`;

export const BlockStatusOption = styled.label<{
  selectedOption: boolean;
  locked: boolean;
}>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px var(--puck-space-2);
  min-height: 32px;
  padding: var(--puck-space-1) var(--puck-space-2);
  border-radius: var(--puck-radius-s);
  background: ${({ selectedOption }) =>
    selectedOption ? 'var(--puck-color-surface)' : 'transparent'};
  box-shadow: ${({ selectedOption }) =>
    selectedOption ?
      '0 0 0 var(--puck-border-width-regular) var(--puck-color-border)'
    : 'none'};
  color: ${({ selectedOption }) =>
    selectedOption ?
      'var(--puck-color-interactive)'
    : 'var(--puck-color-text-secondary)'};
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-semibold);
  text-align: center;
  white-space: nowrap;
  cursor: ${({ locked }) => (locked ? 'default' : 'pointer')};
  opacity: ${({ locked }) => (locked ? 0.6 : 1)};

  ${({ selectedOption, locked }) =>
    selectedOption || locked ? '' : (
      '&:hover { color: var(--puck-color-text); }'
    )}

  &:has(:focus-visible) {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  svg {
    flex-shrink: 0;
    width: var(--puck-icon-size-xs);
    height: var(--puck-icon-size-xs);
  }
`;

export const BlockScheduleActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--puck-space-2);
`;
