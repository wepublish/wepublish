import { Checkbox, darken, FormControlLabel, lighten } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderTransactionFeeProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useId } from 'react';
import { MdFavorite } from 'react-icons/md';

const iconSize = 32;

export const TransactionFeeWrapper = styled(FormControlLabel)`
  justify-self: center;
  max-width: 75ch;
  margin: 0;
  position: relative;
  padding: ${({ theme }) => `
    calc(${iconSize / 2}px + ${theme.spacing(1)})
    ${theme.spacing(2)}
    ${theme.spacing(2)}
  `};
  background-color: ${({ theme }) => lighten(theme.palette.error.main, 0.9)};
  color: ${({ theme }) => darken(theme.palette.error.main, 0.6)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const TransactionFeeIcon = styled('div')`
  display: inline-flex;
  background-color: ${({ theme }) => lighten(theme.palette.error.main, 0.9)};
  color: ${({ theme }) => theme.palette.error.main};
  font-size: ${iconSize}px;
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
`;

export const TransactionFee = forwardRef<
  HTMLButtonElement,
  BuilderTransactionFeeProps
>(function TransactionFee({ text, onChange, value, className, name }, ref) {
  const id = useId();
  const {
    meta: { siteTitle },
  } = useWebsiteBuilder();

  return (
    <TransactionFeeWrapper
      className={className}
      control={
        <>
          <TransactionFeeIcon>
            <MdFavorite />
          </TransactionFeeIcon>

          <Checkbox
            id={id}
            name={name}
            ref={ref}
            checked={value ?? false}
            onChange={(_, checked) => onChange(checked)}
            color="error"
          />
        </>
      }
      label={
        text ??
        `Ja, ich will die Bearbeitungsgebühren von 2% übernehmen und damit ${siteTitle} zusätzlich unterstützen.`
      }
    />
  );
});
