import { Context } from '../../context';
import { authorise } from '../permissions';
import { CanCreateSubscription } from '@wepublish/permissions';
import { PrismaClient } from '@prisma/client';
import { AlreadyUnpaidInvoices, NotFound } from '../../error';
import { MemberContext } from '@wepublish/membership/api';

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
