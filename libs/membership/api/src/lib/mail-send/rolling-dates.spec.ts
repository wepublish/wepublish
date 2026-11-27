import { freezeRollingDates, rollingToRange } from './rolling-dates';
import {
  MailAudienceInput,
  MailRecipientBase,
  MailRollingKind,
} from './mail-send.model';

const now = new Date('2026-11-22T12:00:00.000Z');
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

describe('rollingToRange', () => {
  it('reads "last x days" as the days up to now', () => {
    expect(
      rollingToRange({ kind: MailRollingKind.lastDays, days: 7 }, now)
    ).toEqual({ from: daysFromNow(-7), to: now });
  });

  it('reads "older than x days" as everything before then', () => {
    expect(
      rollingToRange({ kind: MailRollingKind.olderThanDays, days: 14 }, now)
    ).toEqual({ from: undefined, to: daysFromNow(-14) });
  });

  it('reads "next x days" as the days from now on', () => {
    expect(
      rollingToRange({ kind: MailRollingKind.nextDays, days: 30 }, now)
    ).toEqual({ from: now, to: daysFromNow(30) });
  });

  it('treats a negative count as none', () => {
    expect(
      rollingToRange({ kind: MailRollingKind.lastDays, days: -3 }, now)
    ).toEqual({ from: now, to: now });
  });
});

describe('freezeRollingDates', () => {
  const audience: MailAudienceInput = {
    base: MailRecipientBase.hasSubscription,
    startsAtRolling: { kind: MailRollingKind.lastDays, days: 30 },
    endsAtRolling: { kind: MailRollingKind.nextDays, days: 10 },
    mailHistory: {
      conditions: [
        {
          mailTemplateId: 'tpl-1',
          rolling: { kind: MailRollingKind.olderThanDays, days: 14 },
        },
        { mailTemplateId: 'tpl-2', from: new Date('2026-01-01') },
      ],
    },
  };

  it('turns every rolling range into the dates it means right now', () => {
    expect(freezeRollingDates(audience, now)).toEqual({
      base: MailRecipientBase.hasSubscription,
      startsAtFrom: daysFromNow(-30),
      startsAtTo: now,
      endsAtFrom: now,
      endsAtTo: daysFromNow(10),
      mailHistory: {
        conditions: [
          { mailTemplateId: 'tpl-1', to: daysFromNow(-14) },
          { mailTemplateId: 'tpl-2', from: new Date('2026-01-01') },
        ],
      },
    });
  });

  it('leaves the audience it was given untouched', () => {
    freezeRollingDates(audience, now);

    expect(audience.startsAtRolling).toEqual({
      kind: MailRollingKind.lastDays,
      days: 30,
    });
    expect(audience.mailHistory?.conditions[0].rolling).toBeDefined();
  });

  it('returns an audience without rolling ranges as it is', () => {
    const fixed: MailAudienceInput = {
      base: MailRecipientBase.allUsers,
      mailHistory: { conditions: [{ mailTemplateId: 'tpl-1' }] },
    };

    expect(freezeRollingDates(fixed, now)).toEqual(fixed);
  });
});
