import { Context } from '../../context';
import { authorise } from '../permissions';
import {
  CanGetPaymentMethod,
  CanGetPaymentMethods,
} from '@wepublish/permissions';
import { PrismaClient } from '@prisma/client';

export const getPaymentMethodById = (
  id: string,
  authenticate: Context['authenticate'],
  paymentMethodsByID: Context['loaders']['paymentMethodsByID']
) => {
  const { roles } = authenticate();
  authorise(CanGetPaymentMethod, roles);

  return paymentMethodsByID.load(id);
};

export const getPaymentMethods = (
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const { roles } = authenticate();
  authorise(CanGetPaymentMethods, roles);

  return paymentMethod.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};
