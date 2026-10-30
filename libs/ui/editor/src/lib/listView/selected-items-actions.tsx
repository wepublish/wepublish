import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type SelectedItemsActionsProps = {
  selectedItems: string[];
  children?: ReactNode;
};

const SelectedItemsActionsStyled = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  gap: 20px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  background: rgb(
    from ${({ theme }) => theme.vars.palette.warning.main} r g b / 20%
  );
  visibility: hidden;
  margin-bottom: -20px;

  &.has-selected-items {
    visibility: visible;
  }
`;

export function SelectedItemsActions({
  selectedItems,
  children,
}: SelectedItemsActionsProps) {
  const { t } = useTranslation();
  const hasSelectedItems = selectedItems && selectedItems.length > 0;
  return (
    <SelectedItemsActionsStyled
      className={hasSelectedItems ? 'has-selected-items' : ''}
    >
      <div>
        {t('selectableItemsActions.selectedItems', {
          numberOfItems: selectedItems.length,
        })}
      </div>
      {children}
    </SelectedItemsActionsStyled>
  );
}
