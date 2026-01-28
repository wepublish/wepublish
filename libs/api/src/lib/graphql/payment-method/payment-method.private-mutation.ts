import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { authorise } from '../permissions';
import {
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
} from '@wepublish/permissions';

export const deletePaymentMethodById = (
  id: string,
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const { roles } = authenticate();
  authorise(CanDeletePaymentMethod, roles);

  return paymentMethod.delete({
    where: {
      id,
    },
  });
};

export const createPaymentMethod = (
  input: Omit<Prisma.PaymentMethodUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const { roles } = authenticate();
  authorise(CanCreatePaymentMethod, roles);

  return paymentMethod.create({
    data: input,
  });
};

export const updatePaymentMethod = (
  id: string,
  input: Omit<
    Prisma.PaymentMethodUncheckedUpdateInput,
    'modifiedAt' | 'createdAt'
  >,
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const { roles } = authenticate();
  authorise(CanCreatePaymentMethod, roles);

  return paymentMethod.update({
    where: { id },
    data: input,
  });
};
