import styled from '@emotion/styled';
import {
  IconButton,
  ListItemIcon,
  ListSubheader,
  MenuItem,
} from '@mui/material';
import { Fragment, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { ClickMenu } from '../popover/click-menu';
import { BLOCK_GROUPS, BlockGroup } from './blockGroups';

export interface AddBlockMenuItem {
  id: string;
  icon: ReactElement;
  label: string;
  group: BlockGroup;
}

export interface AddBlockInputProps {
  menuItems: Array<AddBlockMenuItem>;
  subtle?: boolean;
  disabled?: boolean;

  onMenuItemClick: (item: AddBlockMenuItem) => void;
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const MAX_MENU_HEIGHT = 420;

export function AddBlockInput({
  menuItems,
  disabled,
  onMenuItemClick,
}: AddBlockInputProps) {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <ClickMenu
        trigger={
          <IconButton
            disabled={disabled}
            title={t('blockList.addBlock')}
            aria-label={t('blockList.addBlock')}
          >
            <MdAdd />
          </IconButton>
        }
        slotProps={{ paper: { sx: { maxHeight: MAX_MENU_HEIGHT } } }}
      >
        {close =>
          BLOCK_GROUPS.flatMap(group => {
            const blocks = menuItems.filter(item => item.group === group);

            if (!blocks.length) {
              return [];
            }

            return [
              <Fragment key={group}>
                <ListSubheader>{t(`blocks.groups.${group}`)}</ListSubheader>

                {blocks.map(item => (
                  <MenuItem
                    key={item.id}
                    onClick={() => {
                      onMenuItemClick(item);
                      close();
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    {t(item.label)}
                  </MenuItem>
                ))}
              </Fragment>,
            ];
          })
        }
      </ClickMenu>
    </Wrapper>
  );
}
