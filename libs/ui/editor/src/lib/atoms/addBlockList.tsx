import styled from '@emotion/styled';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export interface MenuProps {
  items: Array<ListItem>;

  onItemClick(item: ListItem): void;
}

export interface ListItem {
  id: string;
  icon: ReactElement;
  label: string;
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
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.vars.palette.background.default};
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
