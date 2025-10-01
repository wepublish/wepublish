import { Context } from '../../context';
import { PaymentFilter, PaymentSort } from '../../db/payment';
import { authorise } from '../permissions';
import { CanGetPayment, CanGetPayments } from '@wepublish/permissions';
import { PrismaClient } from '@prisma/client';
import { getPayments } from './payment.queries';
import { SortOrder } from '@wepublish/utils/api';

export const getPaymentById = (
  id: string,
  authenticate: Context['authenticate'],
  paymentsByID: Context['loaders']['paymentsByID']
) => {
  const { roles } = authenticate();
  authorise(CanGetPayment, roles);

  return paymentsByID.load(id);
};

export const getAdminPayments = async (
  filter: Partial<PaymentFilter>,
  sortedField: PaymentSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  payment: PrismaClient['payment']
) => {
  const { roles } = authenticate();
  authorise(CanGetPayments, roles);

  return getPayments(filter, sortedField, order, cursorId, skip, take, payment);
};
