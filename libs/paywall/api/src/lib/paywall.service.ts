import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {PaywallDataloaderService} from './paywall-dataloader.service'
import {CreatePaywallInput, UpdatePaywallInput} from './paywall.model'

@Injectable()
export class PaywallService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywalls() {
    return this.prisma.paywall.findMany({})
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywall(id: string) {
    return this.prisma.paywall.findUnique({
      where: {
        id
      }
    })
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public createPaywall({memberPlanIds, ...input}: CreatePaywallInput) {
    return this.prisma.paywall.create({
      data: {
        ...input,
        description: input.description as any[],
        circumventDescription: input.circumventDescription as any[],
        memberPlans: {
          createMany: {
            data: memberPlanIds.map(memberPlanId => ({
              memberPlanId
            }))
          }
        }
      }
    })
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public updatePaywall({id, memberPlanIds, bypassTokens, ...input}: UpdatePaywallInput) {
    return this.prisma.paywall.update({
      where: {
        id
      },
      data: {
        ...input,
        description: input.description as any[],
        circumventDescription: input.circumventDescription as any[],
        memberPlans: memberPlanIds
          ? {
              deleteMany: {
                memberPlanId: {
                  notIn: memberPlanIds
                }
              },
              createMany: {
                skipDuplicates: true,
                data:
                  memberPlanIds?.map(memberPlanId => ({
                    memberPlanId
                  })) ?? []
              }
            }
          : undefined,
        bypasses: bypassTokens
          ? {
              deleteMany: {},
              createMany: {
                data: bypassTokens.map(token => ({
                  token
                }))
              }
            }
          : undefined
      }
    })
  }

  public deletePaywall(id: string) {
    return this.prisma.paywall.delete({
      where: {
        id
      }
    })
  }

  public getPaywallMemberplans(id: string) {
    return this.prisma.memberPlan.findMany({
      where: {
        paywalls: {
          some: {
            paywallId: id
          }
        }
      },
      include: {
        availablePaymentMethods: true
      }
    })
  }

  public getPaywallBypasses(id: string) {
    return this.prisma.paywallBypass.findMany({
      where: {
        paywallId: id
      }
    })
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public createPaywallBypass(paywallId: string, token: string) {
    return this.prisma.paywallBypass.create({
      data: {
        paywallId,
        token
      }
    })
  }

  public deletePaywallBypass(id: string) {
    return this.prisma.paywallBypass.delete({
      where: {
        id
      }
    })
  }
}
