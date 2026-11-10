import {
  MailChannel,
  MailHistoryMatch,
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
