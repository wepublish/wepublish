import styled from '@emotion/styled';
import { IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator, MdMoreVert } from 'react-icons/md';

import { IconButtonTooltip } from './iconButtonTooltip';

export const FLEX_TILE_DRAG_HANDLE = 'flex-tile-drag-handle';
export const FLEX_TILE_DRAG_CANCEL = `.MuiButtonBase-root:not(.${FLEX_TILE_DRAG_HANDLE})`;
export const FLEX_TILE_ROW_HEIGHT = 40;

export const FlexGrid = styled('div')`
  .react-grid-item:not(.static) {
    cursor: grab;
  }

  .react-grid-item > .react-resizable-handle {
    z-index: 3;
    right: ${({ theme }) => theme.spacing(0.5)};
    bottom: ${({ theme }) => theme.spacing(0.5)};
    width: 22px;
    height: 22px;
    padding: 0;
    background-image: none;
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .react-grid-item > .react-resizable-handle::after {
    right: 7px;
    bottom: 7px;
    width: 6px;
    height: 6px;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
  }

  .react-grid-placeholder {
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    background-color: ${({ theme }) => theme.vars.palette.primary.main};
  }
`;

const Tile = styled('div')`
  container-type: size;
  position: relative;
  display: grid;
  height: 100%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};

  & > :first-child {
    min-height: 0;
  }

  &[data-dimmed='true'] > :first-child {
    opacity: 0.4;
  }

  &[data-empty='true'] {
    border: 1px dashed ${({ theme }) => theme.vars.palette.action.disabled};
  }

  &[data-empty='true'] > .MuiButtonBase-root {
    place-self: center;
    width: auto;
    height: auto;
    min-height: 0;
    max-height: none;
    border: 0;
    background: none;
  }

  @container (max-width: 159px) {
    & > .MuiButtonBase-root .MuiTypography-root {
      display: none;
    }
  }
`;

const Actions = styled('div')`
  position: absolute;
  z-index: 2;
  top: ${({ theme }) => theme.spacing(0.5)};
  right: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.25)};
  padding: ${({ theme }) => theme.spacing(0.25)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);

  .MuiIconButton-root {
    color: #fff;
  }

  .MuiIconButton-root.Mui-disabled {
    color: rgba(255, 255, 255, 0.4);
  }

  .${FLEX_TILE_DRAG_HANDLE} {
    cursor: grab;
  }

  .MuiIconButton-root {
    padding: 3px;
  }
`;

const InlineActions = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.25)};

  @container (max-width: 159px) {
    display: none;
  }
`;

const MoreActions = styled('div')`
  display: none;

  @container (max-width: 159px) {
    display: block;
  }
`;

export type FlexTileAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

export type FlexTileProps = {
  locked?: boolean;
  empty?: boolean;
  dimmed?: boolean;
  actions: FlexTileAction[];
  children: ReactNode;
};

export function FlexTile({
  locked,
  empty,
  dimmed,
  actions,
  children,
}: FlexTileProps) {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Tile
      data-empty={!!empty}
      data-dimmed={!!dimmed}
    >
      {children}

      <Actions>
        {!locked && (
          <IconButtonTooltip caption={t('listInput.dragToReorder')}>
            <IconButton
              size="small"
              className={FLEX_TILE_DRAG_HANDLE}
              aria-label={t('listInput.dragToReorder')}
            >
              <MdDragIndicator />
            </IconButton>
          </IconButtonTooltip>
        )}

        <InlineActions>
          {actions.map(({ label, icon, onClick, disabled }) => (
            <IconButtonTooltip
              key={label}
              caption={label}
            >
              <IconButton
                size="small"
                aria-label={label}
                disabled={disabled}
                onClick={onClick}
              >
                {icon}
              </IconButton>
            </IconButtonTooltip>
          ))}
        </InlineActions>

        <MoreActions>
          <IconButton
            size="small"
            aria-label={t('flexTile.moreActions')}
            onClick={event => setMenuAnchor(event.currentTarget)}
          >
            <MdMoreVert />
          </IconButton>
        </MoreActions>
      </Actions>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        {actions.map(({ label, icon, onClick, disabled }) => (
          <MenuItem
            key={label}
            disabled={disabled}
            onClick={() => {
              setMenuAnchor(null);
              onClick();
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Tile>
  );
}
