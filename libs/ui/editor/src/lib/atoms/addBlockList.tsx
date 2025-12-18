import styled from '@emotion/styled';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface MenuProps {
  readonly items: Array<ListItem>;

  onItemClick(item: ListItem): void;
}

export interface ListItem {
  readonly id: string;
  readonly icon: React.ReactElement;
  readonly label: string;
}

export interface AddBlockListProps {
  listItems: Array<ListItem>;
  subtle?: boolean;

  onListItemClick: (item: ListItem) => void;
}

export const BlockList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  left: -0.5rem;
`;

export const BlockListItem = styled('li')`
  margin: 0;
  padding: 0.25rem 0.5rem;

  &:hover {
    cursor: pointer;
    background-color: #f5f5f5;
  }
`;

export function AddBlockList({
  listItems,
  onListItemClick,
}: AddBlockListProps) {
  const { t } = useTranslation();
  return (
    <BlockList>
      {listItems.map((item, index) => (
        <BlockListItem
          key={index}
          onClick={() => {
            onListItemClick(item);
          }}
        >
          {item.icon} {t(item.label)}
        </BlockListItem>
      ))}
    </BlockList>
  );
}
