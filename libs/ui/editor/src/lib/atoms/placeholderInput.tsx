import styled from '@emotion/styled';
import { ButtonBase, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircleOutline } from 'react-icons/md';

const PlaceholderButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'maxHeight' && prop !== 'minHeight',
})<{
  maxHeight: number;
  minHeight: number;
}>`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  max-height: ${({ maxHeight }) => `${maxHeight}px`};
  min-height: ${({ minHeight }) => `${minHeight}px`};
  border: 1px dashed ${({ theme }) => theme.vars.palette.action.disabled};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  text-align: center;
  transition: ${({ theme }) =>
    theme.transitions.create(['border-color', 'background-color', 'color'])};

  &:hover,
  &.Mui-focusVisible {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
    color: ${({ theme }) => theme.vars.palette.primary.main};
    background-color: rgba(
      ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.08
    );
  }

  &.Mui-disabled {
    opacity: 0.5;
  }

  svg {
    font-size: 28px;
  }
`;

export interface PlaceholderInputProps {
  children?: ReactNode;
  onAddClick?: () => void;
  addLabel?: string;
  disabled?: boolean;
  maxHeight?: number;
  minHeight?: number;
}

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

  const label = addLabel ?? t('placeholderInput.add');

  return (
    <PlaceholderButton
      maxHeight={maxHeight}
      minHeight={minHeight}
      disabled={disabled}
      onClick={() => onAddClick?.()}
    >
      <MdAddCircleOutline aria-hidden />
      <Typography variant="body2">{label}</Typography>
    </PlaceholderButton>
  );
}
