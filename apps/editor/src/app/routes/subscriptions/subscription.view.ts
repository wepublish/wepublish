import { bindComponent, formView } from '@wepublish/form/editor';
import { ALL_PAYMENT_PERIODICITIES } from '@wepublish/ui/editor';

import { PeriodAmountField } from './periodAmountField';
import {
  notExtendable,
  subscriptionSchema,
  withoutMemberPlan,
} from './subscription.schema';
import {
  PendingPaymentMethodChange,
  RenewalActions,
  SubscriptionInvoices,
} from './subscriptionSections';

export const subscriptionListPath = '/subscriptions';

export const subscriptionEditPath = (id: string) => `/subscriptions/edit/${id}`;

export const subscriptionView = formView(subscriptionSchema, {
  paths: { list: subscriptionListPath, edit: subscriptionEditPath },
  sections: [
    {
      title: 'subscriptionEditView.detailsTitle',
      fields: [
        'user',
        'memberPlan',
        ['paymentPeriodicity', 'monthlyAmount'],
        'paymentMethod',
      ],
      component: PendingPaymentMethodChange,
    },
    {
      title: 'subscriptionEditView.renewalTitle',
      placement: 'aside',
      fields: ['startsAt', 'paidUntil', 'extendable', 'autoRenew'],
      component: RenewalActions,
    },
    {
      title: 'invoice.panel.invoiceHistory',
      modes: ['edit'],
      component: SubscriptionInvoices,
    },
  ],
  fields: {
    paymentPeriodicity: {
      options: ALL_PAYMENT_PERIODICITIES,
      disabled: withoutMemberPlan,
    },
    monthlyAmount: {
      component: bindComponent(PeriodAmountField),
      disabled: withoutMemberPlan,
    },
    startsAt: { disabled: withoutMemberPlan },
    paidUntil: { readOnly: true },
    extendable: {
      onValueChange: (extendable, { setValue }) => {
        if (!extendable) {
          setValue('autoRenew', false);
        }
      },
    },
    autoRenew: { disabled: withoutMemberPlan, hidden: notExtendable },
  },
});
