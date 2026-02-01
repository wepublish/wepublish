import { Injectable } from '@nestjs/common';
import {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from './payment-method.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PaymentMethodDataloader } from './payment-method.dataloader';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PaymentMethodDataloader)
  async getPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async createPaymentMethod(input: CreatePaymentMethodInput) {
    console.log(input);
    return this.prisma.paymentMethod.create({
      data: input,
    });
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async updatePaymentMethod({ id, ...input }: UpdatePaymentMethodInput) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: input,
    });
  }

  async deletePaymentMethod(id: string) {
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
