import { Test } from '@nestjs/testing';
import { EmailQualityEventSource, EmailQualityEventType } from '@prisma/client';
import { EMAIL_QUALITY_RECORDER } from '@wepublish/mail/api';
import {
  audienceMemberSignals,
  MailchimpAudienceEvidenceService,
} from './mailchimp-audience-evidence';

const LIST_ID = 'list-1';

const member = (overrides: Record<string, unknown> = {}) => ({
  id: 'abc123',
  email_address: 'Jane@Example.com',
  status: 'subscribed',
  last_changed: '2026-10-20T03:00:00+00:00',
  ...overrides,
});

describe('audienceMemberSignals', () => {
  it('reads a cleaned member as a hard bounce of the address', () => {
    expect(
      audienceMemberSignals(member({ status: 'cleaned' }), LIST_ID)
    ).toEqual([
      {
        type: EmailQualityEventType.hardBounce,
        email: 'jane@example.com',
        detail: 'mailchimp:list-1',
        occurredAt: new Date('2026-10-20T03:00:00Z'),
        providerEventId:
          'mailchimp-audience:list-1:abc123:cleaned:2026-10-20T03:00:00+00:00',
      },
    ]);
  });

  it('reads an unsubscribed member as an opt-out, keeping their reason', () => {
    expect(
      audienceMemberSignals(
        member({ status: 'unsubscribed', unsubscribe_reason: 'Too many' }),
        LIST_ID
      )
    ).toEqual([
      expect.objectContaining({
        type: EmailQualityEventType.optedOut,
        email: 'jane@example.com',
        detail: 'mailchimp:list-1: Too many',
        providerEventId:
          'mailchimp-audience:list-1:abc123:unsubscribed:2026-10-20T03:00:00+00:00',
      }),
    ]);
  });

  it.each(['subscribed', 'pending', 'transactional', 'archived'])(
    'says nothing about a %s member',
    status => {
      expect(audienceMemberSignals(member({ status }), LIST_ID)).toEqual([]);
    }
  );

  it('says nothing without an address', () => {
    expect(
      audienceMemberSignals(
        member({ status: 'cleaned', email_address: undefined }),
        LIST_ID
      )
    ).toEqual([]);
  });

  it('leaves the time open when Mailchimp reports none', () => {
    expect(
      audienceMemberSignals(
        member({ status: 'cleaned', last_changed: undefined }),
        LIST_ID
      )[0]
    ).toMatchObject({ occurredAt: undefined });
  });
});

describe('MailchimpAudienceEvidenceService', () => {
  const recorder = { recordAddressSignals: vi.fn() };

  const build = async (withRecorder = true) => {
    const module = await Test.createTestingModule({
      providers: [
        MailchimpAudienceEvidenceService,
        ...(withRecorder ?
          [{ provide: EMAIL_QUALITY_RECORDER, useValue: recorder }]
        : []),
      ],
    }).compile();

    return module.get(MailchimpAudienceEvidenceService);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    recorder.recordAddressSignals.mockResolvedValue(undefined);
  });

  it('records the cleaned and unsubscribed members as polled address evidence', async () => {
    const service = await build();

    const result = await service.record(LIST_ID, [
      member(),
      member({
        id: 'dead',
        email_address: 'dead@example.com',
        status: 'cleaned',
      }),
      member({
        id: 'gone',
        email_address: 'gone@example.com',
        status: 'unsubscribed',
      }),
    ]);

    expect(result).toEqual({ recorded: 2 });
    expect(recorder.recordAddressSignals).toHaveBeenCalledTimes(2);
    expect(recorder.recordAddressSignals).toHaveBeenCalledWith({
      email: 'dead@example.com',
      signals: [
        expect.objectContaining({ type: EmailQualityEventType.hardBounce }),
      ],
      source: EmailQualityEventSource.poll,
    });
  });

  it('carries on when one address cannot be recorded', async () => {
    const service = await build();
    recorder.recordAddressSignals.mockRejectedValueOnce(new Error('db down'));

    const result = await service.record(LIST_ID, [
      member({ id: 'a', email_address: 'a@example.com', status: 'cleaned' }),
      member({ id: 'b', email_address: 'b@example.com', status: 'cleaned' }),
    ]);

    expect(result).toEqual({ recorded: 1 });
    expect(recorder.recordAddressSignals).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a recorder', async () => {
    const service = await build(false);

    await expect(
      service.record(LIST_ID, [member({ status: 'cleaned' })])
    ).resolves.toEqual({ recorded: 0 });
  });
});
