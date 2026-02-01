import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PaymentProviderService {
  constructor(protected prisma: PrismaClient) {}

  async getAllPaymentProviders() {
    return this.prisma.settingPaymentProvider.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getByKey(id: string) {
    return this.prisma.settingPaymentProvider.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
