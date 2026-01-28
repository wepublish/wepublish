import { Context } from '../../context';
import { authorise } from '../permissions';
import { Payment, PaymentState, PrismaClient } from '@prisma/client';
import { CanCreatePayment } from '@wepublish/permissions';

export const createPaymentFromInvoice = async (
  input: {
    invoiceID: string;
    paymentMethodID: string;
    successURL: string;
    failureURL: string;
  },
  authenticate: Context['authenticate'],
  paymentProviders: Context['paymentProviders'],
  invoicesByID: Context['loaders']['invoicesByID'],
  paymentMethodsByID: Context['loaders']['paymentMethodsByID'],
  memberPlanClient: PrismaClient['memberPlan'],
  paymentClient: PrismaClient['payment'],
  subscriptionClient: PrismaClient['subscription']
): Promise<Payment> => {
  const { roles } = authenticate();
  authorise(CanCreatePayment, roles);

  const { invoiceID, paymentMethodID, successURL, failureURL } = input;
  const paymentMethod = await paymentMethodsByID.load(paymentMethodID);
  const paymentProvider = paymentProviders.find(
    pp => pp.id === paymentMethod?.paymentProviderID
  );

  const invoice = await invoicesByID.load(invoiceID);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.subscriptionID) {
    throw new Error('Subscription not found');
  }

  const memberPlan = await memberPlanClient.findFirst({
    where: {
      subscription: {
        some: {
          id: invoice.subscriptionID,
        },
      },
    },
  });

  if (!invoice || !paymentProvider || !memberPlan) {
    throw new Error('Invalid data'); // TODO: better error handling
  }

  await subscriptionClient.update({
    where: { id: invoice.subscriptionID },
    data: {
      confirmed: true,
    },
  });

  const payment = await paymentClient.create({
    data: {
      paymentMethodID,
      invoiceID,
      state: PaymentState.created,
    },
  });

  const intent = await paymentProvider.createIntent({
    paymentID: payment.id,
    invoice,
    currency: invoice.currency,
    saveCustomer: true,
    successURL,
    failureURL,
  });

  return await paymentClient.update({
    where: { id: payment.id },
    data: {
      state: intent.state,
      intentID: intent.intentID,
      intentData: intent.intentData,
      intentSecret: intent.intentSecret,
      paymentData: intent.paymentData,
      paymentMethodID: payment.paymentMethodID,
      invoiceID: payment.invoiceID,
    },
  });
};
