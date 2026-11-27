import {
  MailChannel,
  MailHistoryMatch,
  MailHistoryScope,
  MailRollingKind,
  MailLogState,
  MailRecipientBase,
} from '@wepublish/editor/api';
import {
  emptyMailHistoryRow,
  INITIAL_AUDIENCE_STATE,
  toAudienceInput,
} from './audience-state';

const endOfDay = (iso: string) => {
  const end = new Date(iso);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
};

describe('toAudienceInput', () => {
  it('sends only the base and segments for everyone', () => {
    expect(toAudienceInput(INITIAL_AUDIENCE_STATE)).toEqual({
      base: MailRecipientBase.AllUsers,
      emailSegments: undefined,
      mailHistory: undefined,
    });
  });

  it('turns the tri-state selects into booleans for subscribers', () => {
    expect(
      toAudienceInput({
        ...INITIAL_AUDIENCE_STATE,
        base: MailRecipientBase.HasSubscription,
        memberPlanIDs: ['plan-1'],
        autoRenew: 'true',
        isPaid: 'false',
        startsAtTo: new Date('2026-01-31T10:00:00.000Z'),
      })
    ).toEqual(
      expect.objectContaining({
        base: MailRecipientBase.HasSubscription,
        memberPlanIDs: ['plan-1'],
        autoRenew: true,
        isPaid: false,
        isCanceled: undefined,
        startsAtTo: endOfDay('2026-01-31T10:00:00.000Z'),
      })
    );
  });

  it('narrows subscribers and win-back to legacy subscriptions', () => {
    for (const base of [
      MailRecipientBase.HasSubscription,
      MailRecipientBase.EndedSubscription,
    ]) {
      expect(
        toAudienceInput({ ...INITIAL_AUDIENCE_STATE, base, isLegacy: 'true' })
      ).toEqual(expect.objectContaining({ isLegacy: true }));
      expect(
        toAudienceInput({ ...INITIAL_AUDIENCE_STATE, base, isLegacy: 'false' })
      ).toEqual(expect.objectContaining({ isLegacy: false }));
      expect(
        toAudienceInput({ ...INITIAL_AUDIENCE_STATE, base }).isLegacy
      ).toBeUndefined();
    }
  });

  it('keeps legacy out of audiences that are not about subscriptions', () => {
    expect(
      toAudienceInput({ ...INITIAL_AUDIENCE_STATE, isLegacy: 'true' })
    ).not.toHaveProperty('isLegacy');
  });

  it('sends a rolling start or end in place of the fixed dates', () => {
    const input = toAudienceInput({
      ...INITIAL_AUDIENCE_STATE,
      base: MailRecipientBase.HasSubscription,
      startsAtFrom: new Date('2026-01-01T10:00:00.000Z'),
      startsAtRolling: { kind: MailRollingKind.LastDays, days: 30 },
      endsAtTo: new Date('2026-12-31T10:00:00.000Z'),
      endsAtRolling: { kind: MailRollingKind.NextDays, days: 14 },
    });

    expect(input).toEqual(
      expect.objectContaining({
        startsAtRolling: { kind: MailRollingKind.LastDays, days: 30 },
        startsAtFrom: undefined,
        startsAtTo: undefined,
        endsAtRolling: { kind: MailRollingKind.NextDays, days: 14 },
        endsAtFrom: undefined,
        endsAtTo: undefined,
      })
    );
  });

  it('keeps the fixed dates while no rolling range is on', () => {
    const input = toAudienceInput({
      ...INITIAL_AUDIENCE_STATE,
      base: MailRecipientBase.HasSubscription,
      startsAtFrom: new Date('2026-01-01T10:00:00.000Z'),
    });

    expect(input.startsAtFrom).toBe('2026-01-01T10:00:00.000Z');
    expect(input.startsAtRolling).toBeUndefined();
  });

  it('sends either the rolling window or the period for win-back, never both', () => {
    expect(
      toAudienceInput({
        ...INITIAL_AUDIENCE_STATE,
        base: MailRecipientBase.EndedSubscription,
      })
    ).toEqual(
      expect.objectContaining({ endedWithinDays: 90, endedFrom: undefined })
    );

    expect(
      toAudienceInput({
        ...INITIAL_AUDIENCE_STATE,
        base: MailRecipientBase.EndedSubscription,
        endedMode: 'period',
        endedPeriod: [
          new Date('2026-01-01T10:00:00.000Z'),
          new Date('2026-01-31T10:00:00.000Z'),
        ],
      })
    ).toEqual(
      expect.objectContaining({
        endedWithinDays: undefined,
        endedFrom: '2026-01-01T10:00:00.000Z',
        endedTo: endOfDay('2026-01-31T10:00:00.000Z'),
      })
    );
  });

  describe('mail history', () => {
    it('drops rows that have no template yet, so a half-typed row does not empty the audience', () => {
      expect(
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [emptyMailHistoryRow()],
          },
        }).mailHistory
      ).toBeUndefined();
    });

    it('maps a complete row, with the range end stretched over the day', () => {
      expect(
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          mailHistory: {
            match: MailHistoryMatch.Any,
            rows: [
              {
                ...emptyMailHistoryRow(),
                mailTemplateId: 'tpl-1',
                negate: true,
                states: [MailLogState.Bounced],
                channel: MailChannel.Letter,
                from: new Date('2026-01-01T10:00:00.000Z'),
                to: new Date('2026-01-31T10:00:00.000Z'),
              },
              { ...emptyMailHistoryRow(), mailTemplateId: 'tpl-2' },
            ],
          },
        }).mailHistory
      ).toEqual({
        match: MailHistoryMatch.Any,
        conditions: [
          {
            mailTemplateId: 'tpl-1',
            negate: true,
            states: [MailLogState.Bounced],
            channel: MailChannel.Letter,
            from: '2026-01-01T10:00:00.000Z',
            to: endOfDay('2026-01-31T10:00:00.000Z'),
          },
          {
            mailTemplateId: 'tpl-2',
            negate: false,
            states: undefined,
            channel: undefined,
            from: undefined,
            to: undefined,
          },
        ],
      });
    });

    it('sends a rolling range in place of the fixed dates of a row', () => {
      const [condition] =
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [
              {
                ...emptyMailHistoryRow(),
                mailTemplateId: 'tpl-1',
                from: new Date('2026-01-01T10:00:00.000Z'),
                to: new Date('2026-01-31T10:00:00.000Z'),
                rolling: { kind: MailRollingKind.OlderThanDays, days: 14 },
              },
            ],
          },
        }).mailHistory?.conditions ?? [];

      expect(condition.rolling).toEqual({
        kind: MailRollingKind.OlderThanDays,
        days: 14,
      });
      expect(condition.from).toBeUndefined();
      expect(condition.to).toBeUndefined();
    });

    it('asks for several mails only when more than one is wanted', () => {
      const conditions =
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [
              {
                ...emptyMailHistoryRow(),
                mailTemplateId: 'tpl-1',
                minCount: 3,
              },
              { ...emptyMailHistoryRow(), mailTemplateId: 'tpl-2' },
            ],
          },
        }).mailHistory?.conditions ?? [];

      expect(conditions.map(condition => condition.minCount)).toEqual([
        3,
        undefined,
      ]);
    });

    it('binds a row to the subscription and to a still-open invoice', () => {
      const [condition] =
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          base: MailRecipientBase.HasSubscription,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [
              {
                ...emptyMailHistoryRow(),
                mailTemplateId: 'tpl-1',
                onSubscription: true,
                onlyOpenInvoice: true,
              },
            ],
          },
        }).mailHistory?.conditions ?? [];

      expect(condition.scope).toBe(MailHistoryScope.Subscription);
      expect(condition.onlyOpenInvoice).toBe(true);
    });

    it('leaves both out of a row that does not ask for them', () => {
      const [condition] =
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          base: MailRecipientBase.HasSubscription,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [{ ...emptyMailHistoryRow(), mailTemplateId: 'tpl-1' }],
          },
        }).mailHistory?.conditions ?? [];

      expect(condition.scope).toBeUndefined();
      expect(condition.onlyOpenInvoice).toBeUndefined();
    });

    it('drops the subscription binding for an audience without subscriptions', () => {
      const [condition] =
        toAudienceInput({
          ...INITIAL_AUDIENCE_STATE,
          base: MailRecipientBase.NoActiveSubscription,
          mailHistory: {
            match: MailHistoryMatch.All,
            rows: [
              {
                ...emptyMailHistoryRow(),
                mailTemplateId: 'tpl-1',
                onSubscription: true,
                onlyOpenInvoice: true,
              },
            ],
          },
        }).mailHistory?.conditions ?? [];

      expect(condition.scope).toBeUndefined();
      expect(condition.onlyOpenInvoice).toBe(true);
    });

    it('keeps mail history for every base', () => {
      const history = {
        match: MailHistoryMatch.All,
        rows: [{ ...emptyMailHistoryRow(), mailTemplateId: 'tpl-1' }],
      };

      for (const base of Object.values(MailRecipientBase)) {
        expect(
          toAudienceInput({
            ...INITIAL_AUDIENCE_STATE,
            base,
            mailHistory: history,
          }).mailHistory?.conditions
        ).toHaveLength(1);
      }
    });
  });
});
