import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';
import { IconButton } from 'rsuite';

import { IconButtonTooltip } from './iconButtonTooltip';

const PlaceholderInputWrapper = styled.div<{
  maxHeight: number;
  minHeight: number;
}>`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border-radius: var(--rs-radius-md);
  background-color: var(--rs-bg-well);
  max-height: ${({ maxHeight }) => `${maxHeight}px`};
  min-height: ${({ minHeight }) => `${minHeight}px`};
`;

export interface PlaceholderInputProps {
  /**
   * Setting children will directly render them.
   */
  children?: ReactNode;

  /**
   * Called when the add button is clicked.
   */
  onAddClick?: () => void;
  addLabel?: string;
  disabled?: boolean;
  maxHeight?: number;
  minHeight?: number;
}

/**
 * A placeholder for a block.
 */
export function PlaceholderInput({
  children,
  onAddClick,
  addLabel,
  disabled,
  maxHeight = 450,
  minHeight = 100,
}: PlaceholderInputProps) {
  const { t } = useTranslation();

  if (children) {
    return <>{children}</>;
  }

  return (
    <PlaceholderInputWrapper
      maxHeight={maxHeight}
      minHeight={minHeight}
    >
      <IconButtonTooltip caption={addLabel ?? t('placeholderInput.add')}>
        <IconButton
          disabled={disabled}
          size="sm"
          aria-label={addLabel ?? t('placeholderInput.add')}
          icon={<MdAddCircle />}
          onClick={() => onAddClick && onAddClick()}
        />
      </IconButtonTooltip>
    </PlaceholderInputWrapper>
  );
}
