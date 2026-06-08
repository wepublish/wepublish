import { TransactionFee } from '@wepublish/membership/website';
import { BuilderTransactionFeeProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export const GanzGrazTransactionFee = forwardRef<
  HTMLButtonElement,
  BuilderTransactionFeeProps
>(({ text, ...props }, ref) => {
  const { t } = useTranslation();
  return (
    <TransactionFee
      ref={ref}
      text={text ?? t('subscribe.transactionFees')}
      {...props}
    />
  );
});

GanzGrazTransactionFee.displayName = 'GanzGrazTransactionFee';
