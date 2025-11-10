import {
  Action,
  LookupActionInput,
} from './subscription-event-dictionary.type';
import { startOfDay, subDays } from 'date-fns';
import {
  MailTemplate,
  PaymentMethod,
  PrismaClient,
  Subscription,
  SubscriptionEvent,
  SubscriptionFlow,
  SubscriptionInterval,
} from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

/**
 * This class loads all subscription flows and allows filtering by member plan,
 * payment method, periodicity, renewal and EITHER the daysAwayFromEnding or a
 * list of event names.
 */
@Injectable()
export class SubscriptionEventDictionary {
  private allFlows: (SubscriptionFlow & {
    actions: Action[];
    paymentMethods: PaymentMethod[];
    intervals: (SubscriptionInterval & { mailTemplate: MailTemplate | null })[];
  })[] = [];

  constructor(private prismaService: PrismaClient) {}

  /**
   * Get the earliest date when an invoice must be created.
   * @param date The current date.
   * @returns The earliest date.
   */
  public async getEarliestInvoiceCreationDate(date: Date): Promise<Date> {
    await this.initialize();
    const allIntervals = this.allFlows.map(flow => flow.intervals).flat();
    const allCreationEvents = allIntervals.filter(
      interval => interval.event === SubscriptionEvent.INVOICE_CREATION
    );

    if (allCreationEvents.length === 0) {
      throw new NotFoundException('No invoice creation date found!');
    }

    let earliest = Number.MAX_SAFE_INTEGER;
    for (const event of allCreationEvents) {
      if (
        event.daysAwayFromEnding !== null &&
        event.daysAwayFromEnding < earliest
      ) {
        earliest = event.daysAwayFromEnding;
      }
    }
    return subDays(this.normalizeDate(date), earliest);
  }

  /**
   * Get an array of the dates where custom events have been defined.
   * @param date The current date.
   * @returns An array of dates.
   */
  public async getDatesWithCustomEvent(date: Date): Promise<Date[]> {
    await this.initialize();
    const customEventDaysAwayFromEnding: number[] = [];
    const allIntervals = this.allFlows.map(flow => flow.intervals).flat();
    const allCustomEvents = allIntervals.filter(
      interval => interval.event === SubscriptionEvent.CUSTOM
    );
    for (const event of allCustomEvents) {
      if (
        event.daysAwayFromEnding !== null &&
        !customEventDaysAwayFromEnding.includes(event.daysAwayFromEnding)
      ) {
        customEventDaysAwayFromEnding.push(event.daysAwayFromEnding);
      }
    }
    return customEventDaysAwayFromEnding.map(daysAwayFromEnding =>
      subDays(this.normalizeDate(date), daysAwayFromEnding)
    );
  }

  /**
   * Try to get the MailTemplates for a specific filter of [memberPlan,
   * paymentMethod, periodicity, autoRenewal]. You additionally need to pass
   * either `daysAwayFromEnding` or `events` to filter further. If any
   * filter leads to an empty result set, the templates of the default flow are
   * returned.
   * @param query The filter of the above properties.
   * @returns An array of MailTemplates.
   */
  public async getActionsForSubscriptions(
    query: LookupActionInput
  ): Promise<Action[]> {
    await this.initialize();
    if (query.daysAwayFromEnding && query.events) {
      throw new Error(
        'Its not supported to query for daysAwayFromEnding combined with an event list'
      );
    }

    const defaultFlow = this.allFlows.find(flow => flow.default);

    if (!defaultFlow) {
      throw new Error('Default flow is missing!');
    }

    const filteredFlows = this.allFlows.filter(
      flow =>
        flow.memberPlanId === query.memberplanId &&
        flow.paymentMethods.map(pm => pm.id).includes(query.paymentMethodId) &&
        flow.periodicities.includes(query.periodicity) &&
        flow.autoRenewal.includes(query.autorenwal)
    );

    if (filteredFlows.length === 0) {
      return this.getActionByDay(
        defaultFlow.actions,
        query.daysAwayFromEnding,
        query.events
      );
    }

    return this.getActionByDay(
      filteredFlows[0].actions,
      query.daysAwayFromEnding,
      query.events
    );
  }

  /**
   * Load all subscription flows. This is automatically called once per instance.
   * {@link getActionsForSubscriptions}.
   */
  private async initialize() {
    this.allFlows = (
      await this.prismaService.subscriptionFlow.findMany({
        include: {
          paymentMethods: true,
          intervals: {
            include: {
              mailTemplate: true,
            },
          },
        },
      })
    ).map(flow => {
      return {
        ...flow,
        actions: flow.intervals.map(int => ({
          type: int.event,
          daysAwayFromEnding: int.daysAwayFromEnding,
          externalMailTemplate:
            int.mailTemplate ? int.mailTemplate.externalMailTemplateId : null,
        })),
      };
    });

    const defaultFlows = this.allFlows.filter(flow => flow.default);

    if (defaultFlows.length === 0) {
      throw new NotFoundException('Default user subscription flow not found!');
    }

    if (defaultFlows.length > 1) {
      throw new Error(
        'Multiple default memberplans found! This is a data integrity error!'
      );
    }

    const nonDefaultFlows = this.allFlows.filter(flow => !flow.default);
    if (nonDefaultFlows.filter(flow => !flow.memberPlanId).length) {
      throw new Error(
        'Subscription Flow with no memberplan found that is not default! This is a data integrity error!'
      );
    }
  }

  /**
   * Filter the MailTemplates stored for a specific flow. They can either be
   * filtered by `daysAwayFromEnding` or by `lookupEvents`.
   * @param timeline The leaf of the store.
   * @param daysAwayFromEnding Number of days away from ending.
   * @param lookupEvents The event identifiers.
   * @returns Array of mail templates.
   */
  private getActionByDay(
    timeline: Action[],
    daysAwayFromEnding: number | undefined,
    lookupEvents: SubscriptionEvent[] | undefined
  ): Action[] {
    if (lookupEvents) {
      return timeline.filter(e => lookupEvents.includes(e.type));
    }
    // Return user actions for null and 0!
    if (!daysAwayFromEnding) {
      return timeline.filter(
        t => t.daysAwayFromEnding === 0 || t.daysAwayFromEnding === null
      );
    }
    return timeline.filter(t => t.daysAwayFromEnding === daysAwayFromEnding);
  }

  private normalizeDate(date: Date): Date {
    return startOfDay(date);
  }

  /**
   * Get the External Mail Template name for a specific subscription and subscription event.
   * @param prisma The Prisma client.
   * @param subsciption The subscription to search for.
   * @param subscriptionEvent The event to search for.
   * @returns The external template identifier OR undefined of none was found.
   */
  public async getSubsciptionTemplateIdentifier(
    subsciption: Subscription,
    subscriptionEvent: SubscriptionEvent
  ): Promise<string | undefined> {
    let flow = await this.prismaService.subscriptionFlow.findFirst({
      where: {
        default: false,
        memberPlan: {
          id: subsciption.memberPlanID,
        },
        autoRenewal: {
          has: subsciption.autoRenew,
        },
        periodicities: {
          has: subsciption.paymentPeriodicity,
        },
        paymentMethods: {
          some: {
            id: subsciption.paymentMethodID,
          },
        },
      },
      include: {
        intervals: {
          where: {
            event: subscriptionEvent,
          },
          include: {
            mailTemplate: true,
          },
        },
      },
    });
    if (!flow) {
      flow = await this.prismaService.subscriptionFlow.findFirst({
        where: {
          default: true,
        },
        include: {
          intervals: {
            where: {
              event: subscriptionEvent,
            },
            include: {
              mailTemplate: true,
            },
          },
        },
      });
    }
    if (flow && flow.intervals[0]) {
      if (!flow.intervals[0].mailTemplate) {
        return undefined;
      }
      return flow.intervals[0].mailTemplate.externalMailTemplateId;
    }
    return undefined;
  }
}
