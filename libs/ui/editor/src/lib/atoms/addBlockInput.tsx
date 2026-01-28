import styled from '@emotion/styled';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { Dropdown, IconButton } from 'rsuite';

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
  left: 41.5%;
  display: inline-block;
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
            icon={<MdAdd />}
            circle
            appearance="primary"
          />
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
