import { Context } from '../../context';
import { authorise } from '../permissions';
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanDeleteSubscription,
} from '@wepublish/permissions';
import {
  MetadataProperty,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import { unselectPassword } from '@wepublish/authentication/api';
import {
  AlreadyUnpaidInvoices,
  NotFound,
  UserSubscriptionAlreadyDeactivated,
} from '../../error';
import { PaymentProvider } from '@wepublish/payment/api';
import { MemberContext } from '@wepublish/membership/api';

export const deleteSubscriptionById = (
  id: string,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const { roles } = authenticate();
  authorise(CanDeleteSubscription, roles);

  return subscription.delete({
    where: {
      id,
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
    },
  });
};

export const renewSubscription = async (
  id: string,
  authenticate: Context['authenticate'],
  subscriptionDB: PrismaClient['subscription'],
  invoiceDB: PrismaClient['invoice'],
  memberContext: MemberContext
) => {
  const { roles } = authenticate();
  authorise(CanCreateSubscription, roles);

  const subscription = await subscriptionDB.findUnique({
    where: { id },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
    },
  });

  if (!subscription) throw new NotFound('subscription', id);

  const unpaidInvoiceCount = await invoiceDB.count({
    where: {
      subscriptionID: subscription.id,
      paidAt: null,
    },
  });

  if (unpaidInvoiceCount > 0) {
    throw new AlreadyUnpaidInvoices();
  }

  const invoice = await memberContext.renewSubscriptionForUser({
    subscription,
  });
  return invoice;
};

export const cancelSubscriptionById = async (
  id: string,
  reason: SubscriptionDeactivationReason,
  authenticate: Context['authenticate'],
  subscriptionDB: PrismaClient['subscription'],
  memberContext: MemberContext
) => {
  const { roles } = authenticate();
  authorise(CanCancelSubscription, roles);

  const subscription = await subscriptionDB.findUnique({
    where: { id },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
    },
  });

  if (!subscription) throw new NotFound('subscription', id);

  if (subscription.deactivation)
    throw new UserSubscriptionAlreadyDeactivated(
      subscription.deactivation.date
    );

  return await memberContext.deactivateSubscription({
    subscription,
    deactivationReason: reason,
  });
};

type CreateSubscriptionInput = Prisma.SubscriptionUncheckedCreateInput & {
  properties: Prisma.MetadataPropertyCreateManySubscriptionInput[];
};

export const createSubscription = async (
  { properties, ...input }: CreateSubscriptionInput,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  prismaClient: PrismaClient
) => {
  const { roles } = authenticate();
  authorise(CanCreateSubscription, roles);

  const { subscription } = await memberContext.createSubscription({
    userID: input['userID'],
    paymentMethodId: input['paymentMethodID'],
    paymentPeriodicity: input['paymentPeriodicity'],
    monthlyAmount: input['monthlyAmount'],
    memberPlanId: input['memberPlanID'],
    properties,
    autoRenew: input['autoRenew'],
    extendable: !!input['extendable'],
    replacedSubscriptionId: null,
    startsAt: input['startsAt'],
  });

  return subscription;
};

type UpdateSubscriptionInput = Prisma.SubscriptionUncheckedUpdateInput & {
  properties: Prisma.MetadataPropertyCreateManySubscriptionInput[];
  deactivation: Prisma.SubscriptionDeactivationCreateWithoutSubscriptionInput | null;
};

export const handleRemoteManagedSubscription = async ({
  paymentProvider,
  input,
  originalSubscription,
}: {
  paymentProvider: PaymentProvider;
  input: Subscription;
  originalSubscription: Subscription & { properties: MetadataProperty[] };
}) => {
  // not updatable subscription properties for externally managed subscriptions
  if (
    (input.paymentMethodID &&
      input.paymentMethodID !== originalSubscription.paymentMethodID) ||
    (input.memberPlanID &&
      input.memberPlanID !== originalSubscription.memberPlanID) ||
    (input.paidUntil && input.paidUntil !== originalSubscription.paidUntil) ||
    (input.paymentPeriodicity &&
      input.paymentPeriodicity !== originalSubscription.paymentPeriodicity) ||
    input?.autoRenew === false
  ) {
    throw new Error(
      `It is not possible to update the subscription with payment provider "${paymentProvider.name}".`
    );
  }

  // update amount is possible
  if (input.monthlyAmount !== originalSubscription.monthlyAmount) {
    await paymentProvider.updateRemoteSubscriptionAmount({
      subscription: originalSubscription,
      newAmount: parseInt(`${input.monthlyAmount}`, 10),
    });
  }
};

export const updateAdminSubscription = async (
  id: string,
  { properties, ...input }: UpdateSubscriptionInput,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  loaders: Context['loaders'],
  subscriptionClient: PrismaClient['subscription'],
  userClient: PrismaClient['user'],
  paymentProviders: PaymentProvider[],
  memberPlanClient: PrismaClient['memberPlan']
) => {
  const { roles } = authenticate();
  authorise(CanCreateSubscription, roles);

  const originalSubscription = await subscriptionClient.findUnique({
    where: {
      id,
    },
    include: {
      properties: true,
      deactivation: true,
    },
  });

  if (!originalSubscription) {
    throw new Error('Subscription not found.');
  }

  if (originalSubscription.deactivation) {
    throw new Error(
      'You are not allowed to change a deactivated subscription!'
    );
  }

  // handle remote managed subscriptions (Payrexx Subscription)
  const paymentMethod = await loaders.paymentMethodsByID.load(
    originalSubscription.paymentMethodID
  );

  if (!paymentMethod) {
    throw new NotFound('PaymentMethod', originalSubscription.paymentMethodID);
  }

  const paymentProvider = paymentProviders.find(
    paymentProvider => paymentProvider.id === paymentMethod.paymentProviderID
  );

  if (paymentProvider?.remoteManagedSubscription) {
    await handleRemoteManagedSubscription({
      paymentProvider,
      input: input as Subscription,
      originalSubscription,
    });
  }

  const user = await userClient.findUnique({
    where: {
      id: input.userID as string,
    },
    select: unselectPassword,
  });

  if (!user) throw new Error('Can not update subscription without user');

  const memberPlan = await memberPlanClient.findUnique({
    where: {
      id: input.memberPlanID as string,
    },
    select: {
      currency: true,
    },
  });

  if (!memberPlan)
    throw new Error(
      `Can not update subscription. Memberplan with id ${input.memberPlanID} not found.`
    );

  const updatedSubscription = await subscriptionClient.update({
    where: { id },
    data: {
      ...input,
      currency: memberPlan.currency,
      properties: {
        deleteMany: {
          subscriptionId: id,
        },
        createMany: {
          data: properties,
        },
      },
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
    },
  });

  if (!updatedSubscription) throw new NotFound('subscription', id);

  return await memberContext.handleSubscriptionChange({
    subscription: updatedSubscription,
  });
};
