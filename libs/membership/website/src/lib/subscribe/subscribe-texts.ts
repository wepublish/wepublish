import {
  Currency,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/website/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../formatters/format-currency';
import {
  formatFirstPaymentPeriod,
  formatPaymentPeriod,
  getPaymentPeriodicyMonths,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';

export const usePaymentText = ({
  type = 'button',
  autoRenew,
  extendable,
  productType,
  memberPlan,
  paymentPeriodicity,
  monthlyAmount,
  currency,
  siteTitle,
  locale,
}: {
  type?: 'button' | 'support';
  autoRenew: boolean;
  extendable: boolean;
  memberPlan: string;
  productType: ProductType;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  currency: Currency;
  siteTitle: string;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const variables = {
      productType,
      renewalPeriod: formatRenewalPeriod(paymentPeriodicity),
      renewalPeriodL: formatRenewalPeriod(paymentPeriodicity).toLowerCase(),
      paymentPeriod: formatPaymentPeriod(paymentPeriodicity),
      paymentPeriodL: formatPaymentPeriod(paymentPeriodicity).toLowerCase(),
      formattedAmount: formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
      siteTitle,
    };

    if (autoRenew && extendable) {
      return t(`subscribe.${type}.subscribeForPeriod`, variables);
    }

    if (extendable) {
      return t(`subscribe.${type}.payForPeriod`, variables);
    }

    return t(`subscribe.${type}.pay`, variables);
  }, [
    autoRenew,
    currency,
    extendable,
    locale,
    monthlyAmount,
    paymentPeriodicity,
    productType,
    type,
    memberPlan,
    siteTitle,
    t,
  ]);
};

export const useDiscountText = ({
  memberPlan,
  paymentPeriodicity,
  monthlyAmount,
  currency,
  locale,
}: {
  memberPlan: string;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  currency: Currency;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const variables = {
      paymentPeriod: formatFirstPaymentPeriod(paymentPeriodicity),
      formattedAmount: formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
    };

    return t(`subscribe.discount`, variables);
  }, [currency, locale, monthlyAmount, paymentPeriodicity, memberPlan, t]);
};

export const useUpgradeText = ({
  productType,
  discount,
  paymentPeriodicity,
  monthlyAmount,
  memberPlan,
  currency,
  locale,
}: {
  discount: number;
  productType: ProductType;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  memberPlan: string;
  currency: Currency;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const variables = {
      productType,
      formattedAmount: formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity) -
          discount / 100,
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
    };

    return t(`subscribe.upgrade.button`, variables);
  }, [
    productType,
    monthlyAmount,
    paymentPeriodicity,
    discount,
    currency,
    locale,
    memberPlan,
    t,
  ]);
};
