import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DashboardInvoice } from './dashboard-invoice.model';
import { ok } from 'assert';

@Injectable()
export class DashboardInvoiceService {
  constructor(private prisma: PrismaClient) {}

  async expectedRevenue(start: Date, end: Date): Promise<DashboardInvoice[]> {
    const data = await this.prisma.invoice.findMany({
      where: {
        OR: [
          {
            dueAt: {
              gte: start,
              lt: end,
            },
          },
          {
            paidAt: {
              gte: start,
              lt: end,
            },
          },
        ],
        canceledAt: null,
        manuallySetAsPaidByUserId: null,
      },
      orderBy: {
        dueAt: 'desc',
      },
      include: {
        items: true,
        subscription: {
          select: {
            memberPlan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return data.map(({ items, subscription, dueAt, paidAt }) => {
      const amount = items.reduce(
        (sum, item) => sum + item.amount * item.quantity,
        0
      );

      return {
        paidAt: paidAt ?? undefined,
        dueAt,
        memberPlan: subscription?.memberPlan?.name,
        amount,
      };
    });
  }

  async revenue(start: Date, end: Date): Promise<DashboardInvoice[]> {
    const data = await this.prisma.invoice.findMany({
      where: {
        paidAt: {
          gte: start,
          lt: end,
        },
        manuallySetAsPaidByUserId: null,
      },
      orderBy: {
        paidAt: 'desc',
      },
      include: {
        items: {
          select: {
            quantity: true,
            amount: true,
          },
        },
        subscription: {
          select: {
            memberPlan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return data.map(({ items, subscription, dueAt, paidAt }) => {
      ok(paidAt);
      const amount = items.reduce(
        (sum, item) => sum + item.amount * item.quantity,
        0
      );

      return {
        paidAt,
        dueAt,
        memberPlan: subscription?.memberPlan?.name,
        amount,
      };
    });
  }
}
