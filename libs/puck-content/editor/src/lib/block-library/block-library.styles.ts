import styled from '@emotion/styled';

export const Library = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--puck-space-4);
  font-family: var(--puck-font-family);
  --plugin-panel-inset: var(--puck-drawer-space, var(--puck-space-4));

  [data-puck-drawer] {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: var(--puck-space-2);
  }
`;

export const SearchField = styled.label`
  display: flex;
  align-items: center;
  gap: var(--puck-space-2);
  min-height: 40px;
  padding: 0 var(--puck-space-1) 0 var(--puck-space-3);
  border: 1px solid var(--puck-color-border);
  border-radius: var(--puck-radius-l);
  background: var(--puck-color-surface);
  color: var(--puck-color-text-secondary);

  &:hover {
    border-color: var(--puck-color-border-hover);
  }

  &:focus-within {
    border-color: var(--puck-color-focus-ring);
    outline: 1px solid var(--puck-color-focus-ring);
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 38px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--puck-color-text);
  font-family: inherit;
  font-size: var(--puck-font-size-xxs);
  outline: none;

  &::-webkit-search-cancel-button {
    display: none;
  }

  &::placeholder {
    color: var(--puck-color-text-secondary);
  }
`;

export const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--puck-radius-m);
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--puck-color-interactive-soft);
    color: var(--puck-color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--puck-color-focus-ring);
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  line-height: 1.4;
`;

export const Category = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--puck-space-2);
`;

export const CategoryHeading = styled.h3`
  margin: 0;
  font: inherit;
`;

export const CategoryToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--puck-space-2);
  width: 100%;
  min-height: 32px;
  padding: 0 var(--puck-space-1);
  border: 0;
  border-radius: var(--puck-radius-m);
  background: transparent;
  color: var(--puck-color-text);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background: var(--puck-color-interactive-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  svg {
    margin-inline-start: auto;
    color: var(--puck-color-text-secondary);
    transition: transform 150ms ease;
  }

  &[aria-expanded='false'] svg {
    transform: rotate(-90deg);
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`;

export const Count = styled.span`
  color: var(--puck-color-text-secondary);
  font-weight: var(--puck-font-weight-regular);
`;

export const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--puck-space-2);
  margin-top: var(--puck-space-1);
  padding: var(--puck-space-2);
  border: 1px dashed var(--puck-color-border);
  border-radius: var(--puck-radius-l);
`;

export const GroupTitle = styled.div`
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-semibold);
`;

export const GroupHint = styled.div`
  margin-top: calc(-1 * var(--puck-space-2));
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
`;

export const Tile = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  height: 100%;
  box-sizing: border-box;
  padding: var(--puck-space-1) 6px var(--puck-space-1) var(--puck-space-2);
  border: 1px solid var(--puck-color-border);
  border-radius: var(--puck-radius-l);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxxs);
  line-height: 1.3;
  cursor: grab;
  user-select: none;

  > svg {
    flex: none;
    color: var(--puck-color-text-secondary);
  }

  [data-puck-drawer]:not([class*='isDraggingFrom']) &:hover {
    border-color: var(--puck-color-interactive);
    background: var(--puck-color-interactive-soft);

    > svg {
      color: var(--puck-color-interactive);
    }
  }

  [data-puck-drawer-item]:focus-visible > & {
    outline: 2px solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  [class*='DrawerItem--disabled'] & {
    background: var(--puck-color-surface-muted);
    color: var(--puck-color-text-muted);
    cursor: not-allowed;
  }
`;

export const TileLabel = styled.span`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  hyphens: auto;
  overflow-wrap: break-word;
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--puck-space-2);
  padding: var(--puck-space-5) var(--puck-space-3);
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxs);
  text-align: center;
`;

export const EmptyAction = styled.button`
  padding: var(--puck-space-1) var(--puck-space-3);
  border: 1px solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-interactive);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  cursor: pointer;

  &:hover {
    background: var(--puck-color-interactive-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--puck-color-focus-ring);
  }
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
