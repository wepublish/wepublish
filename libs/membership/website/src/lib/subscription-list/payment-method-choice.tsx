import styled from '@emotion/styled';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { FullPaymentMethodFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';

// set apart from the explanation that follows in the dialog
export const PaymentMethodChoiceWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

export type PaymentMethodChoiceProps = {
  /** The payment method the subscription has now. */
  current?: FullPaymentMethodFragment | null;
  /** The payment methods it can change to; the first one by default. */
  paymentMethods: FullPaymentMethodFragment[];
  value?: string;
  onChange: (paymentMethodId: string) => void;
  /** How readers know a payment method, e.g. "Rechnung". */
  label: (paymentMethod: FullPaymentMethodFragment) => string;
};

/**
 * The payment methods to change to, by the names readers know, not by logo.
 * Methods with the same label (e.g. two Payrexx methods) also show their name
 * from the editor; a single one is simply named.
 */
export function PaymentMethodChoice({
  current,
  paymentMethods,
  value,
  onChange,
  label,
}: PaymentMethodChoiceProps) {
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const id = useId();

  const labels = paymentMethods.map(label);
  const text = (paymentMethod: FullPaymentMethodFragment, index: number) =>
    labels.filter(other => other === labels[index]).length > 1 ?
      `${labels[index]} (${paymentMethod.name})`
    : labels[index];

  return (
    <PaymentMethodChoiceWrapper>
      {current && (
        <Paragraph gutterBottom={false}>
          <Trans
            i18nKey="subscription.changePaymentMethodCurrent"
            values={{ paymentMethod: label(current) }}
            components={{ strong: <strong /> }}
          />
        </Paragraph>
      )}

      {paymentMethods.length === 1 ?
        <Paragraph gutterBottom={false}>
          <Trans
            i18nKey="subscription.changePaymentMethodNew"
            values={{ paymentMethod: text(paymentMethods[0], 0) }}
            components={{ strong: <strong /> }}
          />
        </Paragraph>
      : <>
          <Paragraph
            id={id}
            gutterBottom={false}
          >
            {t('subscription.changePaymentMethodChoose')}
          </Paragraph>

          <RadioGroup
            aria-labelledby={id}
            value={value ?? paymentMethods[0]?.id ?? ''}
            onChange={event => onChange(event.target.value)}
          >
            {paymentMethods.map((paymentMethod, index) => (
              <FormControlLabel
                key={paymentMethod.id}
                value={paymentMethod.id}
                control={<Radio />}
                label={text(paymentMethod, index)}
              />
            ))}
          </RadioGroup>
        </>
      }
    </PaymentMethodChoiceWrapper>
  );
}
