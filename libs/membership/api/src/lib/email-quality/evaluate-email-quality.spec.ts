import { EmailQualityEventType as T, EmailQualityLevel } from '@prisma/client';
import {
  EmailQualityEvidence,
  EmailQualityInput,
  evaluateEmailQuality,
} from './evaluate-email-quality';

const email = 'jane@example.com';
// day n of a 400 day timeline; `now` is day 400, the window 180 days
const day = (n: number) =>
  new Date(Date.UTC(2026, 0, 1) + n * 24 * 60 * 60 * 1000);
const now = day(400);
const config = { unresponsiveAfterDays: 180, minMailsForUnresponsive: 1 };

const event = (
  type: T,
  n: number,
  extra: Partial<EmailQualityEvidence> = {}
): EmailQualityEvidence => ({ type, occurredAt: day(n), email, ...extra });

const evaluate = (input: Partial<EmailQualityInput> = {}) =>
  evaluateEmailQuality({
    email,
    events: [],
    lastLogin: null,
    emailVerifiedAt: null,
    mails: { count: 0, earliestSentDate: null },
    now,
    config,
    ...input,
  });

describe('evaluateEmailQuality', () => {
  it('is unknown without evidence', () => {
    expect(evaluate()).toEqual({
      level: EmailQualityLevel.unknown,
      reason: 'noEvidence',
      since: null,
    });
  });

  describe('dead', () => {
    it.each([
      T.hardBounce,
      T.invalid,
      T.blocked,
      T.spamComplaint,
      T.unsubscribed,
    ])('is dead after a %s', type => {
      expect(evaluate({ events: [event(type, 300)] })).toEqual({
        level: EmailQualityLevel.dead,
        reason: type,
        since: day(300),
      });
    });

    it('keeps the provider diagnosis in the reason', () => {
      expect(
        evaluate({
          events: [event(T.hardBounce, 300, { detail: 'mailbox full' })],
        }).reason
      ).toBe('hardBounce: mailbox full');
    });

    it('wins over an older login, click or confirmation', () => {
      expect(
        evaluate({
          events: [event(T.clicked, 390), event(T.hardBounce, 395)],
          lastLogin: day(394),
          emailVerifiedAt: day(393),
        }).level
      ).toBe(EmailQualityLevel.dead);
    });

    it('is revived by a newer login', () => {
      expect(
        evaluate({ events: [event(T.hardBounce, 300)], lastLogin: day(350) })
      ).toEqual({
        level: EmailQualityLevel.active,
        reason: 'login',
        since: day(350),
      });
    });

    it('is revived by a newer click', () => {
      expect(
        evaluate({ events: [event(T.hardBounce, 300), event(T.clicked, 301)] })
          .level
      ).toBe(EmailQualityLevel.active);
    });

    it('stays dead when the only newer proof is for another address', () => {
      expect(
        evaluate({
          events: [
            event(T.hardBounce, 300),
            event(T.clicked, 350, { email: 'old@example.com' }),
          ],
        }).level
      ).toBe(EmailQualityLevel.dead);
    });
  });

  describe('active', () => {
    it('comes from a recent login', () => {
      expect(evaluate({ lastLogin: day(300) })).toEqual({
        level: EmailQualityLevel.active,
        reason: 'login',
        since: day(300),
      });
    });

    it('comes from a confirmed email change', () => {
      expect(evaluate({ emailVerifiedAt: day(300) })).toEqual({
        level: EmailQualityLevel.active,
        reason: 'emailVerified',
        since: day(300),
      });
    });

    it('comes from a click or a verification', () => {
      expect(evaluate({ events: [event(T.clicked, 300)] })).toMatchObject({
        level: EmailQualityLevel.active,
        reason: 'clicked',
      });
      expect(evaluate({ events: [event(T.verified, 300)] })).toMatchObject({
        level: EmailQualityLevel.active,
        reason: 'verified',
      });
    });

    it('reports the newest proof', () => {
      expect(
        evaluate({
          events: [event(T.clicked, 310)],
          lastLogin: day(305),
          emailVerifiedAt: day(320),
        })
      ).toEqual({
        level: EmailQualityLevel.active,
        reason: 'emailVerified',
        since: day(320),
      });
    });

    it('still counts a proof exactly at the edge of the window', () => {
      expect(evaluate({ lastLogin: day(220) }).level).toBe(
        EmailQualityLevel.active
      );
    });

    it('ignores clicks for another address, case-insensitively', () => {
      expect(
        evaluate({
          email: 'Jane@Example.com',
          events: [
            event(T.clicked, 300, { email: 'JANE@example.com' }),
            event(T.hardBounce, 350, { email: 'other@example.com' }),
          ],
        })
      ).toMatchObject({ level: EmailQualityLevel.active, reason: 'clicked' });
    });
  });

  describe('unresponsive', () => {
    const mails = { count: 1, earliestSentDate: day(100) };

    it('needs a delivered mail older than the window and no proof in it', () => {
      expect(evaluate({ mails })).toEqual({
        level: EmailQualityLevel.unresponsive,
        reason: 'noInteraction',
        since: day(280),
      });
    });

    it('starts once the last proof fell out of the window', () => {
      expect(evaluate({ mails, lastLogin: day(150) })).toEqual({
        level: EmailQualityLevel.unresponsive,
        reason: 'noInteraction',
        since: day(330),
      });
    });

    it('is not reached while the first mail is younger than the window', () => {
      expect(
        evaluate({ mails: { count: 3, earliestSentDate: day(221) } }).level
      ).toBe(EmailQualityLevel.unknown);
    });

    it('needs the configured number of mails', () => {
      expect(
        evaluate({
          mails: { count: 1, earliestSentDate: day(100) },
          config: { ...config, minMailsForUnresponsive: 2 },
        }).level
      ).toBe(EmailQualityLevel.unknown);
    });

    it('gives way to a proof inside the window', () => {
      expect(evaluate({ mails, lastLogin: day(300) }).level).toBe(
        EmailQualityLevel.active
      );
    });

    it('gives way to a bounce', () => {
      expect(
        evaluate({ mails, events: [event(T.hardBounce, 150)] }).level
      ).toBe(EmailQualityLevel.dead);
    });
  });
});
