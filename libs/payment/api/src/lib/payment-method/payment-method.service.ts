import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
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
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(PaymentMethodDataloader)
  async getPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async createPaymentMethod(input: CreatePaymentMethodInput) {
    const result = await this.prisma.paymentMethod.create({
      data: input,
    });
    await this.publicContentCache.invalidate();

    return result;
  }

  @PrimeDataLoader(PaymentMethodDataloader)
  async updatePaymentMethod({ id, ...input }: UpdatePaymentMethodInput) {
    const result = await this.prisma.paymentMethod.update({
      where: { id },
      data: input,
    });
    await this.publicContentCache.invalidate();

    return result;
  }

  async deletePaymentMethod(id: string) {
    const result = await this.prisma.paymentMethod.delete({
      where: { id },
    });
    await this.publicContentCache.invalidate();

    return result;
  }
}
