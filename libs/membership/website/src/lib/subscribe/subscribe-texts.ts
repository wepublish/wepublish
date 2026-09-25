import {
  Currency,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/website/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../formatters/format-currency';
import { calculatePeriodAmount } from '../formatters/format-payment-period';

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
    const paymentPeriod = t(
      `subscription.paymentPeriod.${paymentPeriodicity || 'yearly'}`
    );
    const renewalPeriod = t(
      `subscription.renewalPeriod.${paymentPeriodicity || 'yearly'}`
    );
    const variables = {
      productType,
      renewalPeriod,
      renewalPeriodL: renewalPeriod.toLowerCase(),
      paymentPeriod,
      paymentPeriodL: paymentPeriod.toLowerCase(),
      formattedAmount: formatCurrency(
        calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
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

export const useContinuationText = ({
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
      afterFirstPaymentPeriod: t(
        `subscription.afterFirstPaymentPeriod.${paymentPeriodicity || 'yearly'}`
      ).toLowerCase(),
      renewalPeriodL: t(
        `subscription.renewalPeriod.${paymentPeriodicity || 'yearly'}`
      ).toLowerCase(),
      formattedAmount: formatCurrency(
        calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
    };

    return t(`subscribe.continuation`, variables);
  }, [currency, locale, monthlyAmount, paymentPeriodicity, memberPlan, t]);
};

export const useUpgradeText = ({
  productType,
  discount,
  discountPercent = 0,
  paymentPeriodicity,
  monthlyAmount,
  memberPlan,
  currency,
  locale,
}: {
  discount: number;
  discountPercent?: number;
  productType: ProductType;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  memberPlan: string;
  currency: Currency;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const fullAmount =
      calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100;

    const amountAfterDiscount = Math.max(fullAmount - discount / 100, 0);

    const variables = {
      productType,
      formattedAmount: formatCurrency(
        amountAfterDiscount - amountAfterDiscount * discountPercent,
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
    discountPercent,
    currency,
    locale,
    memberPlan,
    t,
  ]);
};
