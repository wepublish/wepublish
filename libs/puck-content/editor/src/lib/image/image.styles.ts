import styled from '@emotion/styled';

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

export const ImageMultiPickerWrapper = styled.div`
  display: grid;
  gap: var(--puck-space-2);
  padding: var(--puck-space-1);
  margin: calc(var(--puck-space-1) * -1);
  border: var(--puck-border-width-regular) dashed transparent;
  border-radius: var(--puck-radius-m);
  transition: border-color var(--puck-duration-fast) var(--puck-ease-exit);

  &[data-dragging='true'] {
    border-color: var(--puck-color-interactive);
    background: var(--puck-color-interactive-soft);
  }
`;

export const ImageTileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--puck-space-2);
`;

export const ImageTile = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface-muted);
  color: var(--puck-color-text-muted);

  > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &[data-dragging='true'] {
    z-index: 1;
    outline: var(--puck-border-width-focus) solid
      var(--puck-color-selection-border);
  }

  &[data-status='failed'] {
    border-color: var(--mui-palette-error-main, var(--puck-color-red-04));
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;

export const ImageTilePlaceholder = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
`;

export const ImageTileOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--puck-color-overlay-backdrop);
  color: var(--puck-color-text-inverse);
  font-size: 24px;

  &[data-status='failed'] {
    color: var(--mui-palette-error-main, var(--puck-color-red-04));
    background: color-mix(in srgb, var(--puck-color-surface) 85%, transparent);
  }
`;

export const ImageTileActions = styled.div`
  position: absolute;
  top: var(--puck-space-1);
  right: var(--puck-space-1);
  display: flex;
  gap: 2px;

  @media (hover: hover) {
    opacity: 0;
    transition: opacity var(--puck-duration-fast) var(--puck-ease-exit);

    ${ImageTile}:hover &,
    ${ImageTile}:focus-within &,
    ${ImageTile}[data-status='failed'] & {
      opacity: 1;
    }
  }
`;

export const ImageTileButton = styled.button`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-s);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: var(--puck-color-interactive-soft-hover);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;

export const ImageTileDragHandle = styled(ImageTileButton)`
  position: absolute;
  bottom: var(--puck-space-1);
  left: var(--puck-space-1);
  cursor: grab;
  touch-action: none;

  @media (hover: hover) {
    opacity: 0;
    transition: opacity var(--puck-duration-fast) var(--puck-ease-exit);

    ${ImageTile}:hover &,
    &:focus-visible {
      opacity: 1;
    }
  }

  &:active {
    cursor: grabbing;
  }
`;

export const ImageAddTile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--puck-space-1);
  aspect-ratio: 1;
  margin: 0;
  padding: var(--puck-space-1);
  border: var(--puck-border-width-regular) dashed var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-interactive);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
  transition:
    background-color var(--puck-duration-fast) var(--puck-ease-exit),
    border-color var(--puck-duration-fast) var(--puck-ease-exit);

  svg {
    font-size: 20px;
  }

  &:hover:not(:disabled) {
    border-color: var(--puck-color-interactive);
    background: var(--puck-color-interactive-soft-hover);
  }

  &:disabled {
    color: var(--puck-color-text-disabled);
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;

export const ImageMultiPickerFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--puck-space-2);
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
`;
