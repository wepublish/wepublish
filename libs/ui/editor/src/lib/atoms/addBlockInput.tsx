import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { Dropdown } from 'rsuite';

export interface MenuProps {
  readonly items: Array<MenuItem>;

  onItemClick(item: MenuItem): void;
}

export interface MenuItem {
  readonly id: string;
  readonly icon: React.ReactElement;
  readonly label: string;
}

export interface AddBlockInputProps {
  menuItems: Array<MenuItem>;
  subtle?: boolean;
  disabled?: boolean;

  onMenuItemClick: (item: MenuItem) => void;
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

export function AddBlockInput({
  menuItems,
  disabled,
  onMenuItemClick,
}: AddBlockInputProps) {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <Dropdown
        disabled={disabled}
        renderToggle={(props: object, ref: React.Ref<HTMLButtonElement>) => (
          <IconButton
            {...props}
            ref={ref}
            title={t('blockList.addBlock')}
            aria-label={t('blockList.addBlock')}
          >
            <MdAdd />
          </IconButton>
        )}
      >
        {menuItems.map((item, index) => (
          <Dropdown.Item
            key={index}
            onSelect={() => {
              onMenuItemClick(item);
            }}
          >
            {item.icon} {t(item.label)}
          </Dropdown.Item>
        ))}
      </Dropdown>
    </Wrapper>
  );
}
