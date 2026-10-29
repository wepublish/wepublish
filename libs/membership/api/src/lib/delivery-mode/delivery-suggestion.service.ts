import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  DeliveryPreferenceOrigin,
  DeliverySuggestionKind,
  EmailQualityLevel,
  MailChannel,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { canReceiveLetters } from '@wepublish/letter/api';
import { LETTER_SENDER, LetterSender } from '@wepublish/mail/api';
import { MailEmailSegment } from '../mail-send/mail-send.model';
import {
  emailSegmentOf,
  MailSendRecipientService,
} from '../mail-send/mail-send-recipient.service';
import {
  DeliverySuggestionConfirmAllResult,
  DeliverySuggestionCounts,
  DeliverySuggestionModel,
  DeliverySuggestionRecomputeResult,
  PaginatedDeliverySuggestions,
} from './delivery-mode.model';
import { UserDeliveryPreferenceService } from './user-delivery-preference.service';

export const DELIVERY_SUGGESTION_STALE = 'DELIVERY_SUGGESTION_STALE';

const CHUNK = 500;

type Desired = { kind: DeliverySuggestionKind; reason: string };

/** Users whose address matches one of the placeholder patterns; null without patterns. */
export const placeholderEmailWhere = (
  patterns: readonly string[]
): Prisma.UserWhereInput | null =>
  patterns.length ?
    {
      OR: patterns.map(pattern => ({
        email: { contains: pattern, mode: 'insensitive' as const },
      })),
    }
  : null;

const userSelect = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  emailQuality: { select: { level: true, reason: true, since: true } },
} as const;

const toSuggestionModel = (
  row: Prisma.DeliverySuggestionGetPayload<{
    include: { user: { select: typeof userSelect } };
  }>
): DeliverySuggestionModel => ({
  id: row.id,
  kind: row.kind,
  reason: row.reason,
  createdAt: row.createdAt,
  user: {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    firstName: row.user.firstName,
  },
  emailQuality: row.user.emailQuality ?? null,
});

/**
 * Proposes who should get letters instead of mails, and who could go back.
 * Nothing changes on its own: an admin confirms each suggestion, or all of a
 * kind. The set is rebuilt nightly after the email quality.
 */
@Injectable()
export class DeliverySuggestionService {
  private logger = new Logger('DeliverySuggestionService');

  constructor(
    private prisma: PrismaClient,
    private recipients: MailSendRecipientService,
    private preferences: UserDeliveryPreferenceService,
    @Inject(LETTER_SENDER) private letterSender: LetterSender
  ) {}

  async recomputeAll({ pageSize = CHUNK }: { pageSize?: number } = {}): Promise<
    DeliverySuggestionRecomputeResult | { skipped: true }
  > {
    if (!(await this.letterSender.isConfigured())) {
      return { skipped: true };
    }

    const patterns = await this.recipients.placeholderPatterns();
    const placeholder = placeholderEmailWhere(patterns);
    const desired = new Map<string, Desired>();

    // To letters: a dead or placeholder address, a postal address, and no
    // admin decision in the way.
    const toLetterWhere: Prisma.UserWhereInput = {
      AND: [
        {
          OR: [
            { emailQuality: { is: { level: EmailQualityLevel.dead } } },
            ...(placeholder ? [placeholder] : []),
          ],
        },
        { address: { isNot: null } },
        {
          OR: [
            { deliveryPreference: null },
            {
              deliveryPreference: {
                is: {
                  channel: MailChannel.mail,
                  origin: DeliveryPreferenceOrigin.suggestion,
                },
              },
            },
          ],
        },
      ],
    };

    for (let cursor: string | undefined; ;) {
      const page = await this.prisma.user.findMany({
        where: toLetterWhere,
        include: { address: true, emailQuality: { select: { level: true } } },
        orderBy: { id: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (!page.length) {
        break;
      }

      for (const user of page) {
        // The query can only approximate what the print vendor accepts.
        if (!canReceiveLetters(user)) {
          continue;
        }

        desired.set(user.id, {
          kind: DeliverySuggestionKind.toLetter,
          reason:
            emailSegmentOf(user, patterns) === MailEmailSegment.placeholder ?
              'placeholderEmail'
            : 'emailQuality:dead',
        });
      }

      cursor = page[page.length - 1].id;
    }

    // Back to mail: only switches made from a suggestion, once the address
    // proved alive. A placeholder address can look active after a login-code
    // login, so it stays out.
    const toMailWhere: Prisma.UserDeliveryPreferenceWhereInput = {
      channel: MailChannel.letter,
      origin: DeliveryPreferenceOrigin.suggestion,
      user: {
        emailQuality: { is: { level: EmailQualityLevel.active } },
        ...(placeholder ? { NOT: placeholder } : {}),
      },
    };

    for (let cursor: string | undefined; ;) {
      const page = await this.prisma.userDeliveryPreference.findMany({
        where: toMailWhere,
        select: { userId: true },
        orderBy: { userId: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
      });

      if (!page.length) {
        break;
      }

      for (const { userId } of page) {
        desired.set(userId, {
          kind: DeliverySuggestionKind.toMail,
          reason: 'emailQuality:active',
        });
      }

      cursor = page[page.length - 1].userId;
    }

    const result = await this.reconcile(desired);
    this.logger.log(
      `Delivery suggestions: ${result.toLetter} to letter, ${result.toMail} to mail, ${result.removed} removed`
    );

    return result;
  }

  async counts(): Promise<DeliverySuggestionCounts> {
    const groups = await this.prisma.deliverySuggestion.groupBy({
      by: ['kind'],
      _count: { _all: true },
    });
    const count = (kind: DeliverySuggestionKind) =>
      groups.find(group => group.kind === kind)?._count._all ?? 0;

    return {
      toLetter: count(DeliverySuggestionKind.toLetter),
      toMail: count(DeliverySuggestionKind.toMail),
    };
  }

  async list(
    kind: DeliverySuggestionKind,
    skip: number,
    take: number
  ): Promise<PaginatedDeliverySuggestions> {
    const [rows, totalCount] = await Promise.all([
      this.prisma.deliverySuggestion.findMany({
        where: { kind },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.deliverySuggestion.count({ where: { kind } }),
    ]);

    return { totalCount, nodes: rows.map(toSuggestionModel) };
  }

  /** The open suggestion for one person, if any. */
  async userSuggestion(
    userId: string
  ): Promise<DeliverySuggestionModel | null> {
    const row = await this.prisma.deliverySuggestion.findUnique({
      where: { userId },
      include: { user: { select: userSelect } },
    });

    return row ? toSuggestionModel(row) : null;
  }

  /**
   * Answer a suggestion with "no": the person stays where they are, as a
   * manual decision. The nightly run never proposes a manual decision again,
   * in either direction, so the answer holds.
   */
  async keep(id: string, changedByUserId: string): Promise<void> {
    const suggestion = await this.prisma.deliverySuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new BadRequestException('Suggestion not found.');
    }

    const { channel } = await this.preferences.get(suggestion.userId);

    // Storing the decision also removes the suggestion.
    await this.preferences.set(suggestion.userId, channel, {
      origin: DeliveryPreferenceOrigin.manual,
      reason: 'kept',
      changedByUserId,
    });
  }

  /**
   * Apply one suggestion. It is checked again first: the night it was made
   * may be a while ago. A stale one is dropped and refused.
   */
  async confirm(id: string, changedByUserId: string): Promise<void> {
    const suggestion = await this.prisma.deliverySuggestion.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            address: true,
            emailQuality: true,
            deliveryPreference: true,
          },
        },
      },
    });

    if (!suggestion) {
      throw new BadRequestException('Suggestion not found.');
    }

    const patterns = await this.recipients.placeholderPatterns();

    if (!this.stillApplies(suggestion, patterns)) {
      await this.prisma.deliverySuggestion.delete({ where: { id } });

      throw new BadRequestException(DELIVERY_SUGGESTION_STALE);
    }

    await this.preferences.set(
      suggestion.userId,
      suggestion.kind === DeliverySuggestionKind.toLetter ?
        MailChannel.letter
      : MailChannel.mail,
      {
        origin: DeliveryPreferenceOrigin.suggestion,
        reason: suggestion.reason,
        changedByUserId,
      }
    );
  }

  async confirmAll(
    kind: DeliverySuggestionKind,
    changedByUserId: string
  ): Promise<DeliverySuggestionConfirmAllResult> {
    const ids = await this.prisma.deliverySuggestion.findMany({
      where: { kind },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    let confirmed = 0;
    let skipped = 0;

    for (const { id } of ids) {
      try {
        await this.confirm(id, changedByUserId);
        confirmed++;
      } catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error;
        }

        skipped++;
      }
    }

    return { confirmed, skipped };
  }

  private stillApplies(
    suggestion: {
      kind: DeliverySuggestionKind;
      user: Parameters<typeof canReceiveLetters>[0] & {
        email: string;
        emailQuality: { level: EmailQualityLevel } | null;
        deliveryPreference: {
          channel: MailChannel;
          origin: DeliveryPreferenceOrigin;
        } | null;
      };
    },
    patterns: readonly string[]
  ): boolean {
    const { user } = suggestion;
    const segment = emailSegmentOf(user, patterns);
    const preference = user.deliveryPreference;

    if (suggestion.kind === DeliverySuggestionKind.toLetter) {
      return (
        (segment === MailEmailSegment.dead ||
          segment === MailEmailSegment.placeholder) &&
        canReceiveLetters(user) &&
        (!preference ||
          (preference.channel === MailChannel.mail &&
            preference.origin === DeliveryPreferenceOrigin.suggestion))
      );
    }

    return (
      preference?.channel === MailChannel.letter &&
      preference.origin === DeliveryPreferenceOrigin.suggestion &&
      segment === MailEmailSegment.active
    );
  }

  /** Make the stored set equal the desired one, touching only what differs. */
  private async reconcile(
    desired: Map<string, Desired>
  ): Promise<DeliverySuggestionRecomputeResult> {
    const existing = new Map(
      (
        await this.prisma.deliverySuggestion.findMany({
          select: { userId: true, kind: true, reason: true },
        })
      ).map(row => [row.userId, row])
    );

    const stale = [...existing.keys()].filter(userId => !desired.has(userId));

    for (let i = 0; i < stale.length; i += CHUNK) {
      await this.prisma.deliverySuggestion.deleteMany({
        where: { userId: { in: stale.slice(i, i + CHUNK) } },
      });
    }

    let toLetter = 0;
    let toMail = 0;

    for (const [userId, { kind, reason }] of desired) {
      if (kind === DeliverySuggestionKind.toLetter) {
        toLetter++;
      } else {
        toMail++;
      }

      const current = existing.get(userId);

      if (current && current.kind === kind && current.reason === reason) {
        continue;
      }

      await this.prisma.deliverySuggestion.upsert({
        where: { userId },
        create: { userId, kind, reason },
        update: { kind, reason },
      });
    }

    return { toLetter, toMail, removed: stale.length };
  }
}
