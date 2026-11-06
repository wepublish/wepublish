import { useQuery } from '@apollo/client/react';
import {
  type FullPaymentMethodFragment,
  PaymentMethodListDocument,
} from '@wepublish/editor/api';
import type { ViewFields } from '@wepublish/form/editor';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { slugify } from '@wepublish/utils';
import { useTranslation } from 'react-i18next';

import type {
  memberPlanSchema,
  MemberPlanFormValues,
} from './memberplan.schema';

type MemberPlanFields = ViewFields<typeof memberPlanSchema>;

const noPaymentMethods: FullPaymentMethodFragment[] = [];

export function useRefuseTrial() {
  const { t } = useTranslation();

  return (
    availablePaymentMethods: MemberPlanFormValues['availablePaymentMethods']
  ) => {
    const forcesAutoRenewal = (availablePaymentMethods ?? []).some(
      paymentMethod => paymentMethod?.forceAutoRenewal
    );

    if (forcesAutoRenewal) {
      enqueueSnackbar(t('memberplanForm.trialSubscriptionNotPossible'), {
        variant: 'error',
        autoHideDuration: 6000,
      });
    }

    return forcesAutoRenewal;
  };
}

export function useMemberPlanFields(
  { deriveSlug }: { deriveSlug: boolean } = { deriveSlug: false }
): MemberPlanFields {
  const { t } = useTranslation();
  const refuseTrial = useRefuseTrial();
  const { data } = useQuery(PaymentMethodListDocument);
  const paymentMethods = data?.paymentMethods ?? noPaymentMethods;
  const options = paymentMethods.map(({ id, name }) => ({
    value: id,
    label: name,
  }));

  return {
    ...(deriveSlug ?
      {
        name: {
          onValueChange: (name, { setValue }) =>
            setValue('slug', slugify(name ?? '')),
        },
      }
    : {}),
    migrateToTargetPaymentMethodID: { options },
    'availablePaymentMethods.*.paymentMethodIds': { options },
    extendable: {
      guard: (extendable, { getValues }) =>
        extendable || !refuseTrial(getValues('availablePaymentMethods')),
    },
    'availablePaymentMethods.*.forceAutoRenewal': {
      guard: (forceAutoRenewal, { getValues }) => {
        if (!forceAutoRenewal || getValues('extendable')) {
          return true;
        }

        enqueueSnackbar(t('memberplanForm.forceAutoRenewNotPossible'), {
          variant: 'error',
        });

        return false;
      },
    },
  };
}
