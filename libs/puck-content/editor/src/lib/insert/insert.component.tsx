import styled from '@emotion/styled';
import { Menu, MenuItem } from '@mui/material';
import { Plugin } from '@puckeditor/core';
import {
  ComponentProps,
  ReactNode,
  SyntheticEvent,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { acceptingZones, SlotZone } from './insert.helpers';
import { useKeepSelectionOnInsert, useSlotInsert } from './insert.hooks';

type Overrides = NonNullable<Plugin['overrides']>;
type DrawerItemProps = ComponentProps<NonNullable<Overrides['drawerItem']>>;

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

const ZoneMenu = ({
  anchor,
  zones,
  onSelect,
  onClose,
}: {
  anchor: HTMLElement | null;
  zones: SlotZone[];
  onSelect: (zone: SlotZone) => void;
  onClose: () => void;
}) => (
  <Menu
    anchorEl={anchor}
    open={!!anchor}
    onClose={onClose}
    onClick={stopPropagation}
  >
    {zones.map(zone => (
      <MenuItem
        key={zone.zone}
        onClick={() => onSelect(zone)}
      >
        {zone.label}
      </MenuItem>
    ))}
  </Menu>
);

const DrawerItem = styled.div`
  position: relative;
`;

const InsertButton = styled.button`
  position: absolute;
  top: 50%;
  right: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: pointer;
  transform: translateY(-50%);

  &:hover,
  &:focus-visible {
    background: var(--puck-color-bg-secondary, rgba(127, 127, 127, 0.2));
    color: var(--puck-color-text);
  }
`;

export const InsertDrawerItem = ({ children, name }: DrawerItemProps) => {
  const { t } = useTranslation();
  const { zones, insert } = useSlotInsert();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const targets = useMemo(() => acceptingZones(zones, name), [zones, name]);

  return (
    <DrawerItem>
      {children}

      {!!targets.length && (
        <>
          <InsertButton
            type="button"
            aria-label={t('', 'Add to selected block')}
            title={t('', 'Add to selected block')}
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onClick={event => {
              event.stopPropagation();

              if (targets.length === 1) {
                insert(name, targets[0]);
              } else {
                setAnchor(event.currentTarget);
              }
            }}
          >
            <MdAdd size={16} />
          </InsertButton>

          <ZoneMenu
            anchor={anchor}
            zones={targets}
            onSelect={zone => {
              insert(name, zone);
              setAnchor(null);
            }}
            onClose={() => setAnchor(null)}
          />
        </>
      )}
    </DrawerItem>
  );
};

export const KeepSelectionOnInsert = ({
  children,
}: {
  children: ReactNode;
}) => {
  useKeepSelectionOnInsert();

  return children;
};
