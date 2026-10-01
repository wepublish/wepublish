import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PaywallDataloaderService } from './paywall-dataloader.service';
import { CreatePaywallInput, UpdatePaywallInput } from './paywall.model';

@Injectable()
export class PaywallService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywalls() {
    return this.prisma.paywall.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywall(id: string) {
    return this.prisma.paywall.findUnique({
      where: {
        id,
      },
    });
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public async createPaywall({
    memberPlanIds,
    bypassTokens,
    ...input
  }: CreatePaywallInput) {
    if (input.hideContentAfter < 0) {
      throw new BadRequestException('hideContentAfter can not be lower than 0');
    }

    const result = await this.prisma.paywall.create({
      data: {
        ...input,
        description: input.description as any,
        circumventDescription: input.circumventDescription as any,
        upgradeDescription: input.upgradeDescription as any,
        upgradeCircumventDescription: input.upgradeCircumventDescription as any,
        memberPlans: {
          createMany: {
            data: memberPlanIds.map(memberPlanId => ({
              memberPlanId,
            })),
          },
        },
        bypasses: {
          createMany: {
            data: bypassTokens.map(token => ({
              token,
            })),
          },
        },
      },
    });
    await this.publicContentCache.invalidate('paywalls');

    return result;
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public async updatePaywall({
    id,
    memberPlanIds,
    bypassTokens,
    ...input
  }: UpdatePaywallInput) {
    if (input.hideContentAfter != null && input.hideContentAfter < 0) {
      throw new BadRequestException('hideContentAfter can not be lower than 0');
    }

    const result = await this.prisma.paywall.update({
      where: {
        id,
      },
      data: {
        ...input,
        description: input.description as any,
        circumventDescription: input.circumventDescription as any,
        upgradeDescription: input.upgradeDescription as any,
        upgradeCircumventDescription: input.upgradeCircumventDescription as any,
        memberPlans:
          memberPlanIds ?
            {
              deleteMany: {
                memberPlanId: {
                  notIn: memberPlanIds,
                },
              },
              createMany: {
                skipDuplicates: true,
                data:
                  memberPlanIds?.map(memberPlanId => ({
                    memberPlanId,
                  })) ?? [],
              },
            }
          : undefined,
        bypasses:
          bypassTokens ?
            {
              deleteMany: {
                token: {
                  notIn: bypassTokens,
                },
              },
              createMany: {
                skipDuplicates: true,
                data: bypassTokens.map(token => ({
                  token,
                })),
              },
            }
          : undefined,
      },
    });
    await this.publicContentCache.invalidate('paywalls');

    return result;
  }

  public async deletePaywall(id: string) {
    const result = await this.prisma.paywall.delete({
      where: {
        id,
      },
    });
    await this.publicContentCache.invalidate('paywalls');

    return result;
  }

  public getPaywallBypasses(id: string) {
    return this.prisma.paywallBypass.findMany({
      where: {
        paywallId: id,
      },
    });
  }
}
