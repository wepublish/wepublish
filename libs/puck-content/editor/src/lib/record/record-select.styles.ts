import styled from '@emotion/styled';
import { IconButton } from '@mui/material';

export const RecordStack = styled.div`
  display: grid;
  gap: var(--puck-space-2);
  min-width: 0;
`;

export const RecordRowRoot = styled.span`
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--puck-space-2);
  min-width: 0;
`;

export const RecordThumbnail = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: var(--puck-radius-s);
  background: var(--puck-color-surface-muted);
  color: var(--puck-color-text-secondary);
  font-size: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const RecordText = styled.span`
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
`;

export const RecordTitle = styled.span<{ dimmed: boolean }>`
  overflow: hidden;
  color: ${({ dimmed }) =>
    dimmed ? 'var(--puck-color-text-secondary)' : 'var(--puck-color-text)'};
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-medium);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RecordMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px var(--puck-space-1);
  min-width: 0;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  line-height: 1.3;

  > :not([data-subtitle]) {
    flex-shrink: 0;
    white-space: nowrap;
  }

  > [data-subtitle] {
    flex: 1 1 4em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const RecordCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--puck-space-1);
  padding: var(--puck-space-2);
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
`;

export const RecordActions = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  color: var(--puck-color-text-secondary);
`;

export const RecordList = styled.ul`
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  list-style: none;
`;

export const RecordItem = styled.li<{ dragging: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--puck-space-1);
  padding: var(--puck-space-2) var(--puck-space-2) var(--puck-space-2)
    var(--puck-space-1);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  z-index: ${({ dragging }) => (dragging ? 1 : 'auto')};
  outline: ${({ dragging }) =>
    dragging ?
      'var(--puck-border-width-focus) solid var(--puck-color-selection-border)'
    : 'none'};

  & + & {
    border-top: var(--puck-border-width-regular) solid var(--puck-color-border);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  @container (max-width: 239px) {
    ${RecordThumbnail} {
      display: none;
    }
  }
`;

export const RecordItemActions = styled(RecordActions)`
  display: grid;
  grid-template-areas:
    'up remove'
    'down remove';
  grid-template-columns: repeat(2, 24px);
  grid-template-rows: repeat(2, 24px);
  align-items: center;
  gap: 0 2px;

  > .MuiIconButton-root {
    width: 24px;
    height: 24px;
    padding: 0;
  }

  > :nth-child(1) {
    grid-area: up;
  }

  > :nth-child(2) {
    grid-area: down;
  }

  > :nth-child(3) {
    grid-area: remove;
  }

  @media (hover: hover) {
    opacity: 0;
    transition: opacity var(--puck-duration-fast) var(--puck-ease-exit);

    ${RecordItem}:hover &,
    ${RecordItem}:focus-within & {
      opacity: 1;
    }
  }
`;

export const RecordActionButton = styled(IconButton)`
  &[aria-disabled='true'] {
    color: var(--puck-color-text-disabled);
    cursor: default;
  }

  &[aria-disabled='true']:hover {
    background: transparent;
  }
`;

export const RecordDragHandle = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  margin: 0;
  padding: var(--puck-space-1) 0;
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;

export const RecordOptionItem = styled.li`
  &.MuiAutocomplete-option {
    gap: var(--puck-space-2);
    padding-inline: var(--puck-space-2);
  }
`;

export const RecordCheck = styled.span`
  display: flex;
  flex-shrink: 0;
  width: 20px;
  color: var(--puck-color-interactive);
  font-size: 18px;
`;

export const RecordFooter = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--puck-space-2);

  > .MuiFormHelperText-root {
    margin: 0;
  }
`;

export const RecordCounter = styled.span`
  margin-left: auto;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  font-variant-numeric: tabular-nums;
`;
