import {Injectable} from '@nestjs/common'
import {ConsentValue, PrismaClient} from '@prisma/client'
// import {ok} from 'assert'
import {Consent, ConsentInput} from './consent.model'

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaClient) {}

  /*
  Queries
 */
  async consentList(): Promise<Consent[]> {
    const data = await this.prisma.consent.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return data
  }

  async consent(id: string): Promise<Consent> {
    const data = await this.prisma.consent.findUnique({
      where: {
        id
      }
    })

    if (!data) {
      // logger('events').warn(`Could not update Subscription.`)
      throw Error(`Consent with id ${id} not found`)
    }

    return data
  }

  /*
  Mutations
 */
  async createConsent(consent: ConsentInput): Promise<Consent> {
    const created = await this.prisma.consent.create({data: consent})
    return created
  }

  async updateConsent({id, consent}: {id: string; consent: ConsentInput}): Promise<Consent> {
    const updated = await this.prisma.consent.update({
      where: {id},
      data: {
        ...consent
      }
    })
    return updated
  }

  async deleteConsent(id: string) {
    const deleted = this.prisma.consent.delete({
      where: {id}
    })
    return deleted
  }

  // async activeSubscribers(): Promise<DashboardSubscription[]> {
  //   const data = await this.prisma.subscription.findMany({
  //     where: {
  //       OR: [
  //         {
  //           deactivation: null
  //         },
  //         {
  //           deactivation: {
  //             date: {
  //               gte: new Date()
  //             }
  //           }
  //         }
  //       ]
  //     },
  //     orderBy: {
  //       startsAt: 'desc'
  //     },
  //     include: {
  //       deactivation: true,
  //       memberPlan: {
  //         select: {
  //           name: true
  //         }
  //       }
  //     }
  //   })

  //   return data.map(
  //     ({
  //       autoRenew,
  //       paidUntil,
  //       monthlyAmount,
  //       startsAt,
  //       deactivation,
  //       paymentPeriodicity,
  //       memberPlan: {name: memberPlan}
  //     }) => ({
  //       startsAt,
  //       endsAt: deactivation?.date ?? ((autoRenew && paidUntil) || undefined),
  //       renewsAt: (autoRenew && paidUntil) || undefined,
  //       monthlyAmount,
  //       paymentPeriodicity,
  //       reasonForDeactivation: deactivation?.reason,
  //       deactivationDate: deactivation?.createdAt,
  //       memberPlan
  //     })
  //   )
  // }

  // async renewingSubscribers(start: Date, end: Date): Promise<DashboardSubscription[]> {
  //   const data = await this.prisma.subscription.findMany({
  //     where: {
  //       paidUntil: {
  //         gte: start,
  //         lt: end
  //       },
  //       autoRenew: true,
  //       deactivation: null
  //     },
  //     orderBy: {
  //       paidUntil: 'desc'
  //     },
  //     include: {
  //       memberPlan: {
  //         select: {
  //           name: true
  //         }
  //       }
  //     }
  //   })

  //   return data.map(
  //     ({
  //       monthlyAmount,
  //       startsAt,
  //       paidUntil,
  //       paymentPeriodicity,
  //       memberPlan: {name: memberPlan}
  //     }) => {
  //       ok(paidUntil)

  //       return {
  //         startsAt,
  //         renewsAt: paidUntil,
  //         monthlyAmount,
  //         paymentPeriodicity,
  //         memberPlan
  //       }
  //     }
  //   )
  // }

  // async newDeactivations(start: Date, end: Date): Promise<DashboardSubscription[]> {
  //   const data = await this.prisma.subscription.findMany({
  //     where: {
  //       deactivation: {
  //         createdAt: {
  //           gte: start,
  //           lt: end
  //         }
  //       }
  //     },
  //     orderBy: {
  //       deactivation: {
  //         createdAt: 'desc'
  //       }
  //     },
  //     include: {
  //       deactivation: true,
  //       memberPlan: {
  //         select: {
  //           name: true
  //         }
  //       }
  //     }
  //   })

  //   return data.map(
  //     ({
  //       memberPlan: {name: memberPlan},
  //       monthlyAmount,
  //       deactivation,
  //       startsAt,
  //       paymentPeriodicity
  //     }) => {
  //       ok(deactivation)

  //       return {
  //         startsAt,
  //         endsAt: deactivation.date,
  //         reasonForDeactivation: deactivation.reason,
  //         deactivationDate: deactivation.createdAt,
  //         paymentPeriodicity,
  //         monthlyAmount,
  //         memberPlan
  //       }
  //     }
  //   )
  // }
}
