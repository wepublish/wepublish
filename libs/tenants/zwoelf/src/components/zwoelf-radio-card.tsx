import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  FormControlLabel,
  lighten,
  Radio,
  RadioGroup,
  useRadioGroup,
} from '@mui/material';
import { ReactNode } from 'react';

export const ZwoelfRadioCards = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Card = styled(FormControlLabel, {
  shouldForwardProp: prop => prop !== 'isChecked',
})<{ isChecked: boolean }>`
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey[100]};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;

  ${({ theme, isChecked }) =>
    isChecked &&
    css`
      border-color: ${theme.palette.primary.main};
      background-color: ${lighten(theme.palette.primary.main, 0.85)};
    `}

  .MuiFormControlLabel-label {
    display: grid;
    gap: ${({ theme }) => theme.spacing(0.5)};
  }
`;

const CardTitle = styled('span')`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

const CardDescription = styled('small')`
  font-size: 0.75em;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export type ZwoelfRadioCardProps = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

/**
 * A radio rendered as a selectable card: title and description on the left,
 * the radio on the right. Must sit inside a `ZwoelfRadioCards` group.
 */
export const ZwoelfRadioCard = ({
  value,
  title,
  description,
  disabled,
}: ZwoelfRadioCardProps) => {
  const radioGroup = useRadioGroup();

  return (
    <Card
      value={value}
      disabled={disabled}
      isChecked={radioGroup?.value === value}
      labelPlacement="start"
      control={<Radio disableRipple />}
      label={
        <>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </>
      }
    />
  );
};
