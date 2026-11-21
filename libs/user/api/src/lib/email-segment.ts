import { registerEnumType } from '@nestjs/graphql';
import { EmailQualityLevel, Prisma, PrismaClient } from '@prisma/client';

/**
 * Who can still be reached by email. `placeholder` is recognised by the
 * address pattern of the letter integration; the others are the stored
 * email quality level (see EmailQualityLevel), `unknown` including people
 * never evaluated. Picking several means any of them.
 *
 * Shared by the mail-send audience and the user list, so the same word means
 * the same people on both screens.
 */
export enum MailEmailSegment {
  placeholder = 'placeholder',
  dead = 'dead',
  unresponsive = 'unresponsive',
  unknown = 'unknown',
  active = 'active',
}

registerEnumType(MailEmailSegment, {
  name: 'MailEmailSegment',
  description:
    'placeholder: generated address, reachable by letter only. dead: bounced, invalid, complained or unsubscribed. unresponsive: mails delivered, no login or click for a long time. unknown: nothing decided yet. active: logged in or clicked recently.',
});

/** Best to worst, placeholder last: the order the editor offers them in. */
export const EMAIL_SEGMENTS_IN_ORDER = [
  MailEmailSegment.active,
  MailEmailSegment.unknown,
  MailEmailSegment.unresponsive,
  MailEmailSegment.dead,
  MailEmailSegment.placeholder,
] as const;

/** A user loaded with enough to tell the segment. */
export type UserWithEmailQuality = {
  email: string;
  emailQuality?: { level: EmailQualityLevel | string } | null;
};

/** Which segment a loaded user falls into; the query-side twin of {@link emailSegmentWhere}. */
export const emailSegmentOf = (
  { email, emailQuality }: UserWithEmailQuality,
  placeholderPatterns: readonly string[]
): MailEmailSegment => {
  const address = email.toLowerCase();

  if (
    placeholderPatterns.some(pattern => address.includes(pattern.toLowerCase()))
  ) {
    return MailEmailSegment.placeholder;
  }

  return (emailQuality?.level as MailEmailSegment) ?? MailEmailSegment.unknown;
};

/** The substrings marking a generated address, from the letter integration. */
export const placeholderEmailPatterns = async (
  prisma: PrismaClient
): Promise<string[]> => {
  const settings = await prisma.settingLetterProvider.findMany({
    select: { placeholderEmailContains: true },
  });

  return settings
    .map(({ placeholderEmailContains }) => placeholderEmailContains?.trim())
    .filter((pattern): pattern is string => !!pattern);
};

/** Matches no user — Prisma documents `in: []` as an empty result. */
export const NOBODY: Prisma.UserWhereInput = { id: { in: [] } };

/**
 * Users whose address matches one of the placeholder patterns; null without
 * patterns. Never hand Prisma the `OR: []` this would otherwise be: the
 * deployed Prisma matches every row with it, which made a tenant without a
 * pattern count its whole audience as placeholders.
 */
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

/**
 * Users whose address matches none of the patterns; everybody without
 * patterns. `email` is non-null, so the complement is a plain negated match.
 * The outer `mode` also applies inside `not`: this compiles to `NOT ILIKE`.
 */
export const realEmailWhere = (
  patterns: readonly string[]
): Prisma.UserWhereInput =>
  patterns.length ?
    {
      AND: patterns.map(pattern => ({
        email: { mode: 'insensitive' as const, not: { contains: pattern } },
      })),
    }
  : {};

/**
 * Any of the picked segments. A generated address is a placeholder whatever
 * level it may have earned, so the level segments only apply to real ones;
 * people never evaluated count as unknown.
 */
export const emailSegmentWhere = (
  segments: readonly MailEmailSegment[],
  patterns: readonly string[]
): Prisma.UserWhereInput => {
  const levels = segments.filter(
    segment => segment !== MailEmailSegment.placeholder
  ) as EmailQualityLevel[];
  const any: Prisma.UserWhereInput[] = [];

  if (segments.includes(MailEmailSegment.placeholder)) {
    any.push(placeholderEmailWhere(patterns) ?? NOBODY);
  }

  if (levels.length) {
    const byLevel: Prisma.UserWhereInput[] = [
      { emailQuality: { is: { level: { in: levels } } } },
    ];

    if (levels.includes(EmailQualityLevel.unknown)) {
      byLevel.push({ emailQuality: { is: null } });
    }

    any.push({ AND: [realEmailWhere(patterns), { OR: byLevel }] });
  }

  // Nothing picked restricts nothing — never an empty `OR`.
  if (!any.length) {
    return {};
  }

  return any.length === 1 ? any[0] : { OR: any };
};
