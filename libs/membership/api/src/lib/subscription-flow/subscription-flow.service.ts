import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalUpdateInput,
} from './subscription-flow.model';
import {
  subscriptionFlowDaysAwayFromEndingNeedToBeNull,
  subscriptionFlowNonUniqueEvents,
  subscriptionFlowRequiredEvents,
} from './subscription-flow.type';
import {
  MailChannel,
  PaymentPeriodicity,
  Prisma,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import {
  DEFAULT_FLOW_EARLIEST_DAY,
  earliestInvoiceDay,
  shortestPeriodicity,
} from '@wepublish/utils/api';

const SUBSCRIPTION_EVENT_MAX_DAYS_AFTER = 90;

/** A flow as far as the subscriptions it applies to go. */
type FlowConditions = {
  default?: boolean;
  memberPlanId?: string | null;
  paymentMethods: { id: string }[];
  periodicities: PaymentPeriodicity[];
  autoRenewal: boolean[];
};

/** The earliest day an event of a flow may lie on, and what holds it there. */
export type EarliestDay = {
  days: number;
  /** The shortest periodicity a member plan's flow applies to; null for the default flow. */
  periodicity: PaymentPeriodicity | null;
};

/** The subscriptions a member plan's flow applies to. */
export function subscriptionsOfFlow(
  flow: FlowConditions
): Prisma.SubscriptionWhereInput {
  return {
    memberPlanID: flow.memberPlanId ?? undefined,
    paymentMethodID: {
      in: flow.paymentMethods.map(paymentMethod => paymentMethod.id),
    },
    paymentPeriodicity: { in: flow.periodicities },
    OR: flow.autoRenewal.map(autoRenew => ({ autoRenew })),
  };
}

@Injectable()
export class SubscriptionFlowService {
  constructor(private prismaService: PrismaClient) {}

  async getFlows(defaultFlowOnly: boolean, memberPlanId?: string) {
    let where = {};

    if (defaultFlowOnly) {
      where = {
        default: true,
      };
    } else if (memberPlanId !== undefined) {
      // do not pass undefined member plan id.
      where = {
        OR: [
          {
            memberPlanId,
          },
          {
            memberPlanId: null,
          },
        ],
      };
    }

    const flows = await this.prismaService.subscriptionFlow.findMany({
      where,
      orderBy: {
        default: 'desc',
      },
      include: {
        paymentMethods: true,
        memberPlan: {
          include: {
            availablePaymentMethods: true,
          },
        },
        intervals: {
          include: {
            mailTemplate: true,
          },
        },
      },
    });

    for (const flow of flows) {
      if (flow.memberPlan?.availablePaymentMethods?.length) {
        flow.memberPlan.availablePaymentMethods = await Promise.all(
          flow.memberPlan.availablePaymentMethods.map(async method => ({
            ...method,
            paymentMethods: await this.prismaService.paymentMethod.findMany({
              where: {
                id: {
                  in: method.paymentMethodIDs,
                },
              },
            }),
          }))
        );
      }
    }

    return flows;
  }

  /**
   * The earliest day an event of this flow may lie on. An invoice is only
   * created once the current period has begun, so the shortest periodicity a
   * flow applies to sets it. The default flow is the fallback of every
   * subscription, so its day is fixed at what suits the shortest of them:
   * nothing a member plan comes to offer can make it wrong.
   */
  async earliestDay(flow: FlowConditions): Promise<EarliestDay> {
    if (flow.default) {
      return { days: DEFAULT_FLOW_EARLIEST_DAY, periodicity: null };
    }

    return this.earliestDayOf(flow.periodicities);
  }

  private earliestDayOf(periodicities: PaymentPeriodicity[]): EarliestDay {
    return {
      days: earliestInvoiceDay(periodicities),
      periodicity: shortestPeriodicity(periodicities) ?? null,
    };
  }

  /**
   * Whether a day is one this flow's events may lie on. A day that is too
   * early could not be kept for the shortest subscriptions of the flow.
   */
  private async assertDayInRange(subscriptionFlowId: string, day: number) {
    const flow = await this.prismaService.subscriptionFlow.findUnique({
      where: { id: subscriptionFlowId },
      include: { paymentMethods: true },
    });

    if (!flow) {
      throw new NotFoundException(
        `The subscription flow '${subscriptionFlowId}' could not be found.`
      );
    }

    const earliest = await this.earliestDay(flow);

    if (day < earliest.days || day > SUBSCRIPTION_EVENT_MAX_DAYS_AFTER) {
      throw new BadRequestException(
        `daysAwayFromEnding is not in allowed range of ${earliest.days} to ${SUBSCRIPTION_EVENT_MAX_DAYS_AFTER}: ${day}. ${describeEarliestDay(earliest)}`
      );
    }
  }

  async createFlow(flow: SubscriptionFlowModelCreateInput) {
    if (
      !flow.periodicities.length ||
      !flow.autoRenewal.length ||
      !flow.paymentMethodIds.length
    ) {
      throw new BadRequestException(
        'Its not allowed to create subscription flow with no periodicities OR autoRenewal OR paymentMethods'
      );
    }

    if (await this.filterHasOverlap(flow.memberPlanId, flow)) {
      throw new BadRequestException(
        "You can't create this flow because there is a filter overlap!"
      );
    }

    await this.prismaService.subscriptionFlow.create({
      data: {
        default: false,
        memberPlan: {
          connect: {
            id: flow.memberPlanId,
          },
        },
        paymentMethods: {
          connect: flow.paymentMethodIds.map(paymentMethodId => ({
            id: paymentMethodId,
          })),
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        intervals: {
          create: [
            {
              daysAwayFromEnding: -14,
              event: SubscriptionEvent.INVOICE_CREATION,
              mailTemplate: undefined,
            },
            {
              daysAwayFromEnding: 5,
              event: SubscriptionEvent.DEACTIVATION_UNPAID,
              mailTemplate: undefined,
            },
          ],
        },
      },
    });

    return this.getFlows(false);
  }

  async updateFlow(flow: SubscriptionFlowModelUpdateInput) {
    if (
      (flow.periodicities && !flow.periodicities.length) ||
      (flow.autoRenewal && !flow.autoRenewal.length) ||
      (flow.paymentMethodIds && !flow.paymentMethodIds.length)
    ) {
      throw new BadRequestException(
        'Its not allowed to update subscription flow with no periodicities OR autoRenewal OR paymentMethods'
      );
    }

    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: flow.id,
      },
      include: {
        paymentMethods: true,
      },
    });

    if (!originalFlow) {
      throw new NotFoundException(
        `The subscription flow '${flow.id}' could not be found.`
      );
    }

    if (await this.filterHasOverlap(originalFlow.memberPlanId, flow)) {
      throw new BadRequestException(
        "You can't update this flow because there is a filter overlap!"
      );
    }

    await this.assertEventsSuit(originalFlow, flow.periodicities);

    await this.prismaService.$transaction([
      this.prismaService.subscriptionFlow.update({
        where: { id: flow.id },
        data: {
          paymentMethods: {
            disconnect: originalFlow.paymentMethods.map(paymentMethod => ({
              id: paymentMethod.id,
            })),
          },
        },
      }),
      this.prismaService.subscriptionFlow.update({
        where: { id: flow.id },
        data: {
          paymentMethods:
            flow.paymentMethodIds ?
              {
                connect: flow.paymentMethodIds.map(paymentMethodId => ({
                  id: paymentMethodId,
                })),
              }
            : undefined,
          periodicities: flow.periodicities,
          autoRenewal: flow.autoRenewal,
        },
      }),
    ]);

    return this.getFlows(false);
  }

  async deleteFlow(subscriptionFlowId: string) {
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: subscriptionFlowId,
      },
      include: {
        paymentMethods: true,
        intervals: true,
      },
    });

    if (!originalFlow) {
      throw new NotFoundException('The given filter is not found!');
    }

    if (originalFlow.default) {
      throw new BadRequestException("It's not allowed to delete default flow!");
    }

    await this.prismaService.$transaction([
      this.prismaService.subscriptionFlow.delete({
        where: {
          id: subscriptionFlowId,
        },
      }),
      this.prismaService.subscriptionInterval.deleteMany({
        where: {
          id: {
            in: originalFlow.intervals.map(
              additionalInterval => additionalInterval.id
            ),
          },
        },
      }),
    ]);

    return this.getFlows(false);
  }

  /**
   * The channels a template is written for. A flow always mails, so its
   * template needs an email version; printing the event for readers in letter
   * mode needs a letter version on top.
   */
  private async templateChannels(
    mailTemplateId: string
  ): Promise<MailChannel[]> {
    const variants = await this.prismaService.mailTemplateVariant.findMany({
      where: { templateId: mailTemplateId },
      select: { channel: true },
    });

    return variants.map(({ channel }) => channel);
  }

  private assertMailable(channels: MailChannel[]) {
    if (!channels.includes(MailChannel.mail)) {
      throw new BadRequestException(
        'This template has no email version. A subscription flow always sends the email.'
      );
    }
  }

  private assertPrintable(channels: MailChannel[]) {
    if (!channels.includes(MailChannel.letter)) {
      throw new BadRequestException(
        'This template has no letter version, so the event cannot be sent as a letter.'
      );
    }
  }

  async createInterval(interval: SubscriptionIntervalCreateInput) {
    await this.isIntervalValid(interval);

    if (interval.mailTemplateId) {
      const channels = await this.templateChannels(interval.mailTemplateId);

      this.assertMailable(channels);

      if (interval.sendAsLetter) {
        this.assertPrintable(channels);
      }
    } else if (interval.sendAsLetter) {
      throw new BadRequestException(
        'An event without a template cannot be sent as a letter.'
      );
    }

    await this.prismaService.subscriptionInterval.create({
      data: {
        daysAwayFromEnding: interval.daysAwayFromEnding,
        sendAsLetter: interval.sendAsLetter ?? false,
        subscriptionFlow: {
          connect: {
            id: interval.subscriptionFlowId,
          },
        },
        event: interval.event,
        mailTemplate:
          interval.mailTemplateId ?
            {
              connect: {
                id: interval.mailTemplateId,
              },
            }
          : {},
      },
    });

    return this.getFlows(false);
  }

  async updateInterval(interval: SubscriptionIntervalUpdateInput) {
    const eventToUpdate =
      await this.prismaService.subscriptionInterval.findUnique({
        where: {
          id: interval.id,
        },
      });

    if (!eventToUpdate) {
      throw new NotFoundException('The given interval not found!');
    }

    // A partial update (e.g. only the letter switch) is validated against
    // what stays in place.
    await this.isIntervalValid(
      {
        event: eventToUpdate.event,
        subscriptionFlowId: eventToUpdate.subscriptionFlowId,
        ...interval,
        daysAwayFromEnding:
          interval.daysAwayFromEnding ?? eventToUpdate.daysAwayFromEnding,
      },
      false
    );

    // An update that does not mention the template (the letter switch on its
    // own) leaves it where it is; an explicit null takes it off the event.
    const changesTemplate = !!interval.mailTemplateId;
    const removesTemplate = interval.mailTemplateId === null;
    const mailTemplateId =
      removesTemplate ? null : (
        (interval.mailTemplateId ?? eventToUpdate.mailTemplateId)
      );
    const channels =
      mailTemplateId ? await this.templateChannels(mailTemplateId) : [];

    if (changesTemplate) {
      this.assertMailable(channels);
    }

    if (interval.sendAsLetter) {
      this.assertPrintable(channels);
    }

    // The event moves to a template that cannot be printed: readers in letter
    // mode get its email from now on, and the switch says so.
    const dropsLetter =
      (changesTemplate || removesTemplate) &&
      interval.sendAsLetter === undefined &&
      eventToUpdate.sendAsLetter &&
      !channels.includes(MailChannel.letter);

    await this.prismaService.subscriptionInterval.update({
      where: {
        id: interval.id,
      },
      data: {
        ...(changesTemplate ?
          { mailTemplate: { connect: { id: interval.mailTemplateId! } } }
        : removesTemplate ? { mailTemplate: { disconnect: true } }
        : {}),
        daysAwayFromEnding: interval.daysAwayFromEnding,
        // The flow editor updates days and template without mentioning the
        // switch; only an explicit value changes it.
        ...(interval.sendAsLetter === undefined ?
          {}
        : { sendAsLetter: interval.sendAsLetter }),
        ...(dropsLetter ? { sendAsLetter: false } : {}),
      },
    });

    return this.getFlows(false);
  }

  async deleteInterval(id: string) {
    const intervalToDelete =
      await this.prismaService.subscriptionInterval.findUnique({
        where: {
          id,
        },
      });

    if (!intervalToDelete) {
      throw new NotFoundException('The given interval not found!');
    }

    if (subscriptionFlowRequiredEvents.includes(intervalToDelete.event)) {
      throw new BadRequestException(
        `Its not allowed to delete a required ${intervalToDelete.event} event! `
      );
    }

    await this.prismaService.subscriptionInterval.delete({
      where: {
        id,
      },
    });

    return this.getFlows(false);
  }

  /**
   * A flow that is to apply to a shorter periodicity must not have events
   * that are too early for it: move them first.
   */
  private async assertEventsSuit(
    flow: { id: string; periodicities: PaymentPeriodicity[] },
    periodicities: PaymentPeriodicity[] | undefined
  ) {
    if (!periodicities) {
      return;
    }

    const earliest = this.earliestDayOf(periodicities);

    if (earliest.days <= earliestInvoiceDay(flow.periodicities)) {
      return;
    }

    const tooEarly = (
      await this.prismaService.subscriptionInterval.findMany({
        where: { subscriptionFlowId: flow.id },
      })
    ).filter(
      ({ daysAwayFromEnding }) =>
        daysAwayFromEnding !== null && daysAwayFromEnding < earliest.days
    );

    if (tooEarly.length) {
      throw new BadRequestException(
        `These events are too early for the new conditions: ${tooEarly
          .map(
            ({ event, daysAwayFromEnding }) =>
              `${event} (${daysAwayFromEnding})`
          )
          .join(', ')}. ${describeEarliestDay(earliest)} Move the events first.`
      );
    }
  }

  private async filterHasOverlap(
    memberPlanId: string | null,
    newFlow: Partial<SubscriptionFlowModelUpdateInput>
  ) {
    const whereClause =
      memberPlanId ? { memberPlan: { id: memberPlanId } } : {};
    const allFlows = await this.prismaService.subscriptionFlow.findMany({
      where: whereClause,
      select: {
        id: true,
        paymentMethods: {
          select: {
            id: true,
          },
        },
        periodicities: true,
        autoRenewal: true,
      },
    });

    for (const flow of allFlows) {
      // skip itself
      if (newFlow.id === flow.id) {
        continue;
      }

      const existingPM = new Set(flow.paymentMethods.map(pm => pm.id));
      const newPM = new Set((newFlow.paymentMethodIds || []).map(pm => pm));

      const existingPe = new Set(flow.periodicities);
      const newPe = new Set(newFlow.periodicities);

      const existingAr = new Set(flow.autoRenewal);
      const newAr = new Set(newFlow.autoRenewal);

      // find filter values that are the same as the existing filter values
      const pmIntersection = new Set([...newPM].filter(x => existingPM.has(x)));
      const peIntersection = new Set([...newPe].filter(x => existingPe.has(x)));
      const arIntersection = new Set([...newAr].filter(x => existingAr.has(x)));

      // if any of the filter intersection are not empty, means that the filter combination exists already.
      if (
        pmIntersection.size !== 0 &&
        peIntersection.size !== 0 &&
        arIntersection.size !== 0
      ) {
        return true;
      }
    }

    return false;
  }

  private async isIntervalValid(
    interval: SubscriptionIntervalCreateInput,
    checkEventUniqueConstraint = true
  ) {
    if (
      interval.daysAwayFromEnding === null ||
      interval.daysAwayFromEnding === undefined
    ) {
      if (
        !subscriptionFlowDaysAwayFromEndingNeedToBeNull.includes(interval.event)
      ) {
        throw new BadRequestException(
          `For event ${interval.event} daysAwayFromEnding can not be null!`
        );
      }
    } else if (
      subscriptionFlowDaysAwayFromEndingNeedToBeNull.includes(interval.event)
    ) {
      throw new BadRequestException(
        `For event ${interval.event} daysAwayFromEnding needs to be null!`
      );
    }

    if (
      checkEventUniqueConstraint &&
      !subscriptionFlowNonUniqueEvents.includes(interval.event)
    ) {
      const dbIntervals =
        await this.prismaService.subscriptionInterval.findMany({
          where: {
            subscriptionFlow: {
              id: interval.subscriptionFlowId,
            },
          },
        });

      for (const dbInterval of dbIntervals) {
        if (dbInterval.event === interval.event) {
          throw new BadRequestException(
            `For each subscription flow its not allowed to have more than one events of the type ${interval.event}`
          );
        }
      }
    }

    // Limit daysAwayFromEnding
    if (interval.daysAwayFromEnding) {
      await this.assertDayInRange(
        interval.subscriptionFlowId,
        interval.daysAwayFromEnding
      );
    }

    // check for special daysAwayFromEnding event constraints
    if (interval.event === SubscriptionEvent.INVOICE_CREATION) {
      if (!!interval.daysAwayFromEnding && interval.daysAwayFromEnding > 0) {
        throw new BadRequestException(
          `It's not possible to set event ${interval.event} to a date later as the subscription is renewed`
        );
      }
    }

    if (interval.event === SubscriptionEvent.DEACTIVATION_UNPAID) {
      if (!!interval.daysAwayFromEnding && interval.daysAwayFromEnding < 0) {
        throw new BadRequestException(
          `It's not possible to set event ${interval.event} to a date before as the subscription is renewed`
        );
      }
    }
  }
}

function describeEarliestDay({ days, periodicity }: EarliestDay) {
  return periodicity ?
      `The earliest day is ${days}, as the flow applies to ${periodicity} subscriptions.`
    : `The earliest day is ${days}: the default flow applies to every subscription without a flow of its own.`;
}
