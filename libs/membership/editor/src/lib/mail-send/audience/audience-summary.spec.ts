import { describeAudience } from './audience-summary';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

const lookups = {
  t,
  memberPlans: new Map([['plan-1', 'Jahresabo']]),
  paymentMethods: new Map([['pm-1', 'Rechnung']]),
  templates: new Map([['tpl-1', 'Adressänderung']]),
  formatDate: (iso: string) => iso.slice(0, 10),
};

describe('describeAudience', () => {
  it('names the base and leaves out what was not set', () => {
    expect(describeAudience({ base: 'allUsers' }, lookups)).toEqual([
      'mailSend.base.allUsers',
    ]);
  });

  it('spells out plans, status and segments by name', () => {
    expect(
      describeAudience(
        {
          base: 'hasSubscription',
          memberPlanIDs: ['plan-1', 'plan-gone'],
          subscriptionState: 'active',
          emailSegments: ['placeholder', 'dead'],
          paymentMethodID: 'pm-1',
          autoRenew: true,
        },
        lookups
      )
    ).toEqual([
      'mailSend.base.hasSubscription',
      'mailSend.audienceSummary.memberPlans: Jahresabo, plan-gone',
      'mailSend.audienceSummary.state: mailSend.state.active',
      'mailSend.paymentMethod: Rechnung',
      'mailSend.autoRenew: mailSend.yes',
      'mailSend.audienceSummary.segments: mailSend.emailSegments.placeholder, mailSend.emailSegments.dead',
    ]);
  });

  it('reads each mail-history condition as a sentence', () => {
    expect(
      describeAudience(
        {
          base: 'allUsers',
          mailHistory: {
            match: 'any',
            conditions: [
              {
                mailTemplateId: 'tpl-1',
                negate: true,
                states: ['delivered'],
                channel: 'letter',
                from: '2026-01-01T10:00:00.000Z',
                to: '2026-01-31T22:59:59.999Z',
              },
              { mailTemplateId: 'tpl-unknown' },
            ],
          },
        },
        lookups
      )
    ).toEqual([
      'mailSend.base.allUsers',
      'mailSend.audienceSummary.mailHistory: mailSend.audienceSummary.notReceived «Adressänderung» (mailSend.mailHistory.states.delivered, mailSend.channel.letter) mailSend.audienceSummary.between:{"from":"2026-01-01","to":"2026-01-31"}',
      'mailSend.audienceSummary.mailHistory: mailSend.audienceSummary.received «tpl-unknown»',
      'mailSend.audienceSummary.matchAny',
    ]);
  });

  it('ignores keys it does not know, so older filters still read', () => {
    expect(
      describeAudience({ base: 'allUsers', somethingNew: 1 }, lookups)
    ).toEqual(['mailSend.base.allUsers']);
  });
});
