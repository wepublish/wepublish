import { EmailQualityEventType as T, EmailQualityLevel } from '@prisma/client';
import {
  EmailQualityEvidence,
  evaluateEmailQuality,
} from './evaluate-email-quality';

const email = 'jane@example.com';
const day = (n: number) => new Date(Date.UTC(2026, 8, n));
const event = (
  type: T,
  n: number,
  extra: Partial<EmailQualityEvidence> = {}
): EmailQualityEvidence => ({ type, occurredAt: day(n), email, ...extra });

const levelOf = (
  events: EmailQualityEvidence[],
  options: { email?: string; placeholderPatterns?: string[] } = {}
) =>
  evaluateEmailQuality(events, {
    email: options.email ?? email,
    placeholderPatterns: options.placeholderPatterns ?? [],
  });

describe('evaluateEmailQuality', () => {
  it('is unknown without evidence', () => {
    expect(levelOf([])).toEqual({
      level: EmailQualityLevel.unknown,
      reason: 'noEvidence',
      since: null,
      manualLevel: null,
    });
  });

  describe('placeholder', () => {
    it('matches a configured pattern case-insensitively', () => {
      expect(
        levelOf([], {
          email: 'nw-42@Placeholder.Neuewege.ch',
          placeholderPatterns: ['@placeholder.neuewege.ch'],
        })
      ).toMatchObject({
        level: EmailQualityLevel.placeholder,
        reason: 'pattern',
      });
    });

    it('comes from an importer marker', () => {
      expect(levelOf([event(T.placeholderDetected, 1)])).toMatchObject({
        level: EmailQualityLevel.placeholder,
        reason: T.placeholderDetected,
      });
    });

    it('wins over any later click or editor confirmation', () => {
      expect(
        levelOf([event(T.manualConfirmed, 5)], {
          placeholderPatterns: ['@example.com'],
        }).level
      ).toBe(EmailQualityLevel.placeholder);
    });
  });

  describe('undeliverable', () => {
    it.each([
      ['a hard bounce', event(T.hardBounce, 1)],
      ['a hard-bounce reject', event(T.rejected, 1, { detail: 'hard-bounce' })],
      ['an invalid reject', event(T.rejected, 1, { detail: 'invalid' })],
      ['an editor marking it invalid', event(T.manualInvalid, 1)],
    ])('follows %s', (_, evidence) => {
      expect(levelOf([evidence]).level).toBe(EmailQualityLevel.undeliverable);
    });

    it('ignores a soft bounce for now', () => {
      expect(levelOf([event(T.softBounce, 1)]).level).toBe(
        EmailQualityLevel.unknown
      );
      expect(
        levelOf([event(T.rejected, 1, { detail: 'soft-bounce' })]).level
      ).toBe(EmailQualityLevel.unknown);
    });

    it('is lifted by a later proof of reach', () => {
      expect(
        levelOf([event(T.hardBounce, 1), event(T.jwtLogin, 2)])
      ).toMatchObject({ level: EmailQualityLevel.confirmed, since: day(2) });
    });

    it('beats an earlier proof of reach', () => {
      expect(
        levelOf([event(T.clicked, 1), event(T.hardBounce, 2)])
      ).toMatchObject({
        level: EmailQualityLevel.undeliverable,
        since: day(2),
      });
    });
  });

  describe('blocked', () => {
    it.each([
      ['a spam complaint', event(T.spamComplaint, 1)],
      ['an unsubscribe', event(T.unsubscribed, 1)],
      ['a spam reject', event(T.rejected, 1, { detail: 'spam' })],
      ['an unsub reject', event(T.rejected, 1, { detail: 'unsub' })],
    ])('follows %s', (_, evidence) => {
      expect(levelOf([evidence]).level).toBe(EmailQualityLevel.blocked);
    });

    it('stays blocked after a later click', () => {
      expect(
        levelOf([event(T.spamComplaint, 1), event(T.clicked, 2)]).level
      ).toBe(EmailQualityLevel.blocked);
    });

    it('is lifted only by an explicit editor confirmation', () => {
      expect(
        levelOf([event(T.spamComplaint, 1), event(T.manualConfirmed, 2)])
      ).toMatchObject({
        level: EmailQualityLevel.confirmed,
        manualLevel: EmailQualityLevel.confirmed,
      });
    });
  });

  describe('confirmed', () => {
    it.each([T.clicked, T.jwtLogin, T.emailConfirmed, T.manualConfirmed])(
      'follows %s',
      type => {
        expect(levelOf([event(type, 1)]).level).toBe(
          EmailQualityLevel.confirmed
        );
      }
    );

    it('is not reached by an open alone', () => {
      expect(levelOf([event(T.opened, 1)]).level).toBe(
        EmailQualityLevel.unknown
      );
    });

    it('marks an editor decision as manual', () => {
      expect(levelOf([event(T.clicked, 1)]).manualLevel).toBeNull();
      expect(levelOf([event(T.manualConfirmed, 1)]).manualLevel).toBe(
        EmailQualityLevel.confirmed
      );
    });
  });

  it('only counts evidence about the current address', () => {
    expect(
      levelOf([event(T.hardBounce, 1, { email: 'old@example.com' })]).level
    ).toBe(EmailQualityLevel.unknown);
  });

  it('compares addresses case-insensitively', () => {
    expect(
      levelOf([event(T.hardBounce, 1, { email: 'Jane@Example.com' })]).level
    ).toBe(EmailQualityLevel.undeliverable);
  });

  it('forgets everything before an editor reset', () => {
    expect(
      levelOf([
        event(T.hardBounce, 1),
        event(T.placeholderDetected, 1),
        event(T.manualReset, 2),
      ]).level
    ).toBe(EmailQualityLevel.unknown);
    expect(
      levelOf([event(T.manualReset, 2), event(T.hardBounce, 3)]).level
    ).toBe(EmailQualityLevel.undeliverable);
  });
});
