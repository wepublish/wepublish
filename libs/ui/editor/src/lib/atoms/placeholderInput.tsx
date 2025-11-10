import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { IconButton } from 'rsuite';

const PlaceholderInputWrapper = styled.div<{
  maxHeight: number;
  minHeight: number;
}>`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background-color: #f7f9fa;
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
  disabled,
  maxHeight = 450,
  minHeight = 100,
}: PlaceholderInputProps) {
  if (children) {
    return <>{children}</>;
  }

  return (
    <PlaceholderInputWrapper
      maxHeight={maxHeight}
      minHeight={minHeight}
    >
      <IconButton
        disabled={disabled}
        size="sm"
        icon={<MdAddCircle />}
        onClick={() => onAddClick && onAddClick()}
      />
    </PlaceholderInputWrapper>
  );
}
