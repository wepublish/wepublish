import {
  MemberPlan,
  MetadataProperty,
  PaymentMethod,
  PaymentProviderCustomer,
  User,
  UserAddress,
} from '@prisma/client';
import formatISO from 'date-fns/formatISO';

import { format } from 'date-fns';
import { SubscriptionWithRelations } from '../legacy/member-context';

type UserWithRelations = User & {
  address: UserAddress | null;
  properties: MetadataProperty[];
  paymentProviderCustomers: PaymentProviderCustomer[];
};

type CSVSubscription = SubscriptionWithRelations & {
  user: UserWithRelations;
  paymentMethod: PaymentMethod;
  memberPlan: MemberPlan;
};

export function mapSubscriptionsAsCsv(subscriptions: CSVSubscription[]) {
  let csvStr =
    [
      'id',
      'firstName',
      'name',
      'note',
      'birthday',
      'email',
      'active',
      'createdAt',
      'modifiedAt',

      'company',
      'streetAddress',
      'streetAddressNumber',
      'streetAddress2',
      'streetAddress2Number',
      'zipCode',
      'city',
      'country',

      'memberPlan',
      'memberPlanID',
      'paymentPeriodicity',
      'monthlyAmount',
      'autoRenew',
      'extendable',
      'startsAt',
      'paidUntil',
      'paymentMethod',
      'paymentMethodID',
      'deactivationDate',
      'deactivationReason',
    ].join(',') + '\n';

  for (const subscription of subscriptions) {
    const user = subscription?.user;
    const memberPlan = subscription?.memberPlan;
    const paymentMethod = subscription?.paymentMethod;
    // if (!user) continue
    csvStr +=
      [
        user?.id,
        `${sanitizeCsvContent(user?.firstName)}`,
        `${sanitizeCsvContent(user?.name)}`,
        `${sanitizeCsvContent(user?.note)}`,
        `${user?.birthday ? format(user?.birthday, 'yyyy-MM-dd') : ''}`,
        `${user?.email ?? ''}`,
        user?.active,
        user?.createdAt ?
          formatISO(user.createdAt, { representation: 'date' })
        : '',
        user?.modifiedAt ?
          formatISO(user.modifiedAt, { representation: 'date' })
        : '',
        `${sanitizeCsvContent(user?.address?.company)}`,
        `${sanitizeCsvContent(user?.address?.streetAddress)}`,
        `${sanitizeCsvContent(user?.address?.streetAddressNumber)}`,
        `${sanitizeCsvContent(user?.address?.streetAddress2)}`,
        `${sanitizeCsvContent(user?.address?.streetAddress2Number)}`,
        `${sanitizeCsvContent(user?.address?.zipCode)}`,
        `${sanitizeCsvContent(user?.address?.city)}`,
        `${sanitizeCsvContent(user?.address?.country)}`,
        sanitizeCsvContent(memberPlan?.name),
        subscription?.memberPlanID ?? '',
        subscription?.paymentPeriodicity ?? '',
        subscription?.monthlyAmount ?? '',
        subscription?.autoRenew ?? '',
        subscription?.extendable ?? '',
        subscription?.startsAt ?
          formatISO(subscription.startsAt, { representation: 'date' })
        : '',
        subscription?.paidUntil ?
          formatISO(subscription.paidUntil, { representation: 'date' })
        : 'no pay',
        sanitizeCsvContent(paymentMethod?.name),
        subscription?.paymentMethodID ?? '',
        subscription?.deactivation ?
          formatISO(subscription.deactivation.date, { representation: 'date' })
        : '',
        subscription?.deactivation?.reason ?? '',
      ].join(',') + '\r\n';
  }

  return csvStr;
}

/**
 * according to rfc 4180
 * https://www.ietf.org/rfc/rfc4180.txt
 * @param input
 */
function sanitizeCsvContent(input: string | undefined | null) {
  // according rfc 4180 2.7.
  const escapeDoubleQuotes = (input || '').toString().replace(/[#"]/g, '""');
  // according rfc 4180 2.5. / 2.6.
  return `"${escapeDoubleQuotes}"`;
}
