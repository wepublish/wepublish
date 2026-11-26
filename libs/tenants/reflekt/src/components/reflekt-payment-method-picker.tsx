import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/website/api';
import {
  BuilderPaymentMethodPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { euclidCircularB } from '../theme';

const PickerWrapper = styled(FormControl)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
`;

const PickerOptions = styled(RadioGroup)`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const MethodCard = styled(FormControlLabel, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>`
  margin: 0;
  flex: 1 1 14rem;
  max-width: 22rem;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1, 1.5, 1, 0.5)};
  border: none;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  box-shadow: none;
  transition:
    background-color 150ms,
    color 150ms,
    box-shadow 150ms;

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.palette.common.black};
    outline-offset: 2px;
  }

  ${({ active, theme }) =>
    active &&
    css`
      background-color: ${theme.palette.common.white};
      color: ${theme.palette.common.black};
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    `}
`;

const MethodRadio = styled(Radio)`
  color: ${({ theme }) => theme.palette.common.white};

  &:not(.Mui-checked) .MuiSvgIcon-root:first-of-type {
    border-radius: 50%;
    background-color: ${({ theme }) => theme.palette.common.black};
  }

  &.Mui-checked {
    color: ${({ theme }) => theme.palette.common.black};
  }
`;

const MethodContent = styled('span')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  justify-items: start;
`;

const MethodName = styled('span')`
  font-family: ${euclidCircularB.family}, sans-serif;
  font-weight: 500;
  font-size: 0.75rem;
`;

const methodLogo = css`
  height: 32px;
  width: auto;
  max-width: 100%;
`;

const singleMethodLogo = css`
  height: 40px;
  width: auto;
  justify-self: center;
`;

export const ReflektPaymentMethodPicker = forwardRef<
  HTMLButtonElement,
  BuilderPaymentMethodPickerProps
>(function ReflektPaymentMethodPicker(
  { paymentMethods, onChange, value, className, name },
  ref
) {
  const { t } = useTranslation();
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  useEffect(() => {
    if (
      paymentMethods?.length &&
      !paymentMethods.some(({ id }) => id === value)
    ) {
      onChange(paymentMethods[0].id);
    }
  }, [paymentMethods, onChange, value]);

  const offeredMethods =
    paymentMethods?.filter(pm => pm.paymentProviderID !== 'no-charge') ?? [];

  if (offeredMethods.length === 1) {
    const [onlyMethod] = offeredMethods;

    return (
      <PickerWrapper className={className}>
        {onlyMethod.image ?
          <Image
            image={onlyMethod.image as unknown as FullImageFragment}
            css={singleMethodLogo}
          />
        : <MethodName>{onlyMethod.name}</MethodName>}
      </PickerWrapper>
    );
  }

  return (
    <PickerWrapper className={className}>
      <PickerOptions
        ref={ref}
        name={name}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        aria-label={t('subscribe.choosePaymentMethod')}
      >
        {offeredMethods.map(method => (
          <MethodCard
            key={method.id}
            value={method.id}
            active={method.id === value}
            control={
              <MethodRadio
                slotProps={{ input: { 'aria-label': method.name } }}
              />
            }
            label={
              <MethodContent>
                {method.image && (
                  <Image
                    image={method.image as unknown as FullImageFragment}
                    css={methodLogo}
                  />
                )}
                <MethodName>{method.name}</MethodName>
              </MethodContent>
            }
          />
        ))}
      </PickerOptions>
    </PickerWrapper>
  );
});
