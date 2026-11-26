import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/website/api';
import {
  BuilderPaymentMethodPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

const PickerWrapper = styled(FormControl)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
`;

const PickerQuestion = styled(Typography)`
  font-weight: 600;
  text-align: center;
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
  padding: ${({ theme }) => theme.spacing(1.5, 2, 1.5, 1)};
  background-color: ${({ theme }) => theme.palette.common.white};
  border: 1px solid ${({ theme }) => theme.palette.grey[400]};
  opacity: 0.6;
  transition:
    opacity 150ms,
    border-color 150ms,
    box-shadow 150ms;

  img {
    filter: grayscale(1);
  }

  &:hover,
  &:focus-within {
    opacity: 1;
    border-color: ${({ theme }) => theme.palette.common.black};
  }

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.palette.common.black};
    outline-offset: 2px;
  }

  ${({ active, theme }) =>
    active &&
    css`
      opacity: 1;
      border-color: ${theme.palette.common.black};
      box-shadow:
        0 0 0 1px ${theme.palette.common.black},
        0 6px 16px rgba(0, 0, 0, 0.18);

      img {
        filter: none;
      }
    `}
`;

const MethodRadio = styled(Radio)`
  color: ${({ theme }) => theme.palette.common.black};

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
  font-weight: 600;
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
  const questionId = useId();
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
      {offeredMethods.length > 1 && (
        <PickerQuestion id={questionId}>
          {t('subscribe.choosePaymentMethod')}
        </PickerQuestion>
      )}

      <PickerOptions
        ref={ref}
        name={name}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        aria-labelledby={questionId}
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
